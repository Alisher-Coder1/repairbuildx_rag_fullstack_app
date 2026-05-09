from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Any, Dict, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .calculations import build_work_packages, calculate_room_metrics
from .schemas import ConsultationResponse, ConsultRequest, ValidationIssue
from .validation import validate_consult_request


CONTRACT_VERSION = "stage7.2.2"


def _parse_origins() -> List[str]:
    raw = os.getenv("ALLOWED_ORIGINS", "*").strip()
    if not raw or raw == "*":
        return ["*"]
    return [item.strip() for item in raw.split(",") if item.strip()]


app = FastAPI(title="Repair RAG Fullstack API", version=CONTRACT_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_parse_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _data_dir() -> Path:
    configured = os.getenv("RAG_DATA_DIR", "").strip()
    candidates = []

    if configured:
        candidates.append(Path(configured))

    app_dir = Path(__file__).resolve().parent
    backend_dir = app_dir.parent
    repo_dir = backend_dir.parent

    candidates.extend(
        [
            backend_dir / "data",
            app_dir / "data",
            repo_dir / "backend" / "data",
            Path.cwd() / "data",
            Path.cwd() / "backend" / "data",
        ]
    )

    for candidate in candidates:
        if candidate.exists():
            return candidate

    return candidates[0] if candidates else Path("data")


def _load_json_file(path: Path, fallback: Any) -> Any:
    try:
        if path.exists():
            return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return fallback
    return fallback


def _rag_state() -> Dict[str, Any]:
    data_dir = _data_dir()
    chunks = _load_json_file(data_dir / "chunks.json", [])
    metadata = _load_json_file(data_dir / "vector_metadata.json", [])
    faiss_exists = (data_dir / "faiss_index.bin").exists()

    return {
        "data_dir": str(data_dir),
        "chunks": chunks if isinstance(chunks, list) else [],
        "metadata": metadata if isinstance(metadata, list) else [],
        "faiss_index_loaded": faiss_exists,
        "missing_files": [
            filename
            for filename in ["chunks.json", "vector_metadata.json", "faiss_index.bin"]
            if not (data_dir / filename).exists()
        ],
    }


def _chunk_text(chunk: Any) -> str:
    if isinstance(chunk, str):
        return chunk
    if isinstance(chunk, dict):
        for key in ("text", "content", "chunk", "page_content"):
            value = chunk.get(key)
            if isinstance(value, str):
                return value
    return json.dumps(chunk, ensure_ascii=False)[:2000]


def _tokenize(text: str) -> set[str]:
    return {
        item.lower()
        for item in re.findall(r"[A-Za-zА-Яа-яЁё0-9_]{3,}", text or "")
    }


def _search_rag_fragments(request: ConsultRequest, limit: int | None = None) -> List[Dict[str, Any]]:
    state = _rag_state()
    chunks = state["chunks"]
    metadata = state["metadata"]

    if limit is None:
        try:
            limit = int(os.getenv("TOP_K_CHUNKS", "4"))
        except ValueError:
            limit = 4

    query_parts = [
        request.room_type or "",
        request.zone_type or "",
        request.room_shape or "",
        request.surface_specs.floor.covering if request.surface_specs else "",
        request.surface_specs.walls.covering if request.surface_specs else "",
        request.surface_specs.ceiling.covering if request.surface_specs else "",
        request.user_question or "",
    ]

    query_tokens = _tokenize(" ".join(query_parts))
    scored = []

    for index, chunk in enumerate(chunks):
        text = _chunk_text(chunk)
        score = len(query_tokens.intersection(_tokenize(text)))
        if score <= 0:
            continue

        meta = metadata[index] if index < len(metadata) and isinstance(metadata[index], dict) else {}
        scored.append(
            {
                "index": index,
                "score": score,
                "text": text[:900],
                "metadata": meta,
            }
        )

    scored.sort(key=lambda item: item["score"], reverse=True)
    return scored[: max(limit, 0)]


def _format_warning_lines(warnings: List[ValidationIssue]) -> List[str]:
    if not warnings:
        return ["- Критичных предупреждений в переданном контракте нет."]
    return [f"- {item.code}: {item.message}" for item in warnings]


def _engineering_advice(request: ConsultRequest) -> List[str]:
    engineering = request.engineering
    lines: List[str] = []

    if request.zone_type == "влажная зона":
        lines.extend(
            [
                "- Для влажной зоны обязательно проверить гидроизоляцию пола, примыканий и мокрых участков.",
                "- Нужна проверка вентиляции: без нормального воздухообмена повышается риск плесени и разрушения отделки.",
                "- Сантехнические выводы, ревизионные люки и доступ к узлам нельзя закрывать чистовой отделкой без доступа.",
            ]
        )

    if request.zone_type == "кухонная зона":
        lines.extend(
            [
                "- Для кухни нужно связать отделку с точками электрики, воды, канализации и вытяжки.",
                "- Фартук, зона мойки и зона готовки должны проверяться отдельно по влагостойкости и износостойкости.",
            ]
        )

    if engineering.electrical_required in {"yes", "auto"}:
        lines.append("- Электрика: до чистовой отделки уточнить розетки, выключатели, освещение и мощность потребителей.")

    if engineering.plumbing_required in {"yes", "auto"}:
        lines.append("- Сантехника: до отделки зафиксировать трассы, уклоны, выводы и ревизионный доступ.")

    if engineering.waterproofing_required in {"yes", "auto"}:
        lines.append("- Гидроизоляция: проверить слой, заходы на стены, углы, примыкания и совместимость с покрытием.")

    if not lines:
        lines.append("- Инженерные системы не отмечены как обязательные, но перед ремонтом их всё равно нужно проверить по месту.")

    return lines


def _surface_advice(request: ConsultRequest, work_packages: Dict[str, Any]) -> List[str]:
    floor = work_packages["floor"]
    walls = work_packages["walls"]
    ceiling = work_packages["ceiling"]

    return [
        f"- Пол: покрытие '{floor['covering']}', расчётная площадь {floor['area_m2']} м². Уточнить основание, перепады и расход материалов.",
        f"- Стены: покрытие '{walls['covering']}', чистая площадь после вычета проёмов {walls['net_area_m2']} м². Проверить подготовку основания.",
        f"- Потолок: покрытие '{ceiling['covering']}', площадь {ceiling['area_m2']} м². Уточнить освещение и влияние решения на высоту.",
    ]


def _geometry_line(request: ConsultRequest) -> str:
    dimensions = request.dimensions

    if request.room_shape == "прямоугольная":
        return f"- Геометрия: прямоугольник {dimensions.length} × {dimensions.width} × {dimensions.height} м."

    if request.room_shape == "круглая":
        return f"- Геометрия: круглая комната, диаметр {dimensions.diameter} м, высота {dimensions.height} м."

    if request.room_shape == "овальная":
        return f"- Геометрия: овальная комната, большая ось {dimensions.length} м, малая ось {dimensions.width} м, высота {dimensions.height} м."

    if request.room_shape == "сложная":
        notes = dimensions.geometry_notes or "описание формы не указано"
        return (
            f"- Геометрия: сложная форма по измеренным параметрам: "
            f"площадь пола {dimensions.manual_floor_area} м², "
            f"периметр {dimensions.manual_perimeter} м, высота {dimensions.height} м. "
            f"Комментарий: {notes}."
        )

    return f"- Геометрия: {request.room_shape}."


def _build_answer(
    request: ConsultRequest,
    metrics: Dict[str, Any],
    work_packages: Dict[str, Any],
    warnings: List[ValidationIssue],
    rag_fragments: List[Dict[str, Any]],
) -> str:
    formula = metrics["formula"]

    rag_lines = []
    for item in rag_fragments[:3]:
        excerpt = item["text"].replace("\n", " ").strip()
        if len(excerpt) > 220:
            excerpt = excerpt[:220] + "..."
        rag_lines.append(f"- Фрагмент #{item['index']} (score {item['score']}): {excerpt}")

    if not rag_lines:
        rag_lines = ["- RAG-фрагменты не найдены или база знаний недоступна. Ответ сформирован по deterministic domain logic."]

    lines = [
        "## 1. Исходные параметры",
        f"- Тип помещения: {request.room_type}",
        f"- Зона эксплуатации: {request.zone_type}",
        f"- Форма помещения: {request.room_shape}",
        _geometry_line(request),
        f"- Уровень ремонта: {request.repair_context.repair_level}",
        f"- Состояние помещения: {request.repair_context.property_condition}",
        "",
        "## 2. Расчётные показатели",
        f"- Площадь пола: {metrics['floor_area']} м²",
        f"- Площадь потолка: {metrics['ceiling_area']} м²",
        f"- Периметр: {metrics['perimeter']} м",
        f"- Стены до вычета проёмов: {metrics['walls_gross_area']} м²",
        f"- Площадь проёмов: {metrics['openings_area']} м²",
        f"- Чистая площадь стен: {metrics['walls_net_area']} м²",
        f"- Плинтус / примыкания по периметру: {metrics['plinth']} м.пог.",
        "",
        "## 3. Формулы",
        f"- Тип формулы: {formula['shape']}",
        f"- Площадь пола: {formula['floor_area']}",
        f"- Периметр: {formula['perimeter']}",
        f"- Стены: {formula['walls_gross_area']} минус площадь проёмов или ручная площадь стен для сложной формы",
        "",
        "## 4. Поверхности и работы",
        *_surface_advice(request, work_packages),
        "",
        "## 5. Инженерные проверки",
        *_engineering_advice(request),
        "",
        "## 6. Предупреждения и ограничения",
        *_format_warning_lines(warnings),
        "- Расход материалов не должен считаться финальным без норм расхода, упаковок, запаса и технологии производителя.",
        "- Если есть перепады, влажность, старое основание или скрытые дефекты, расчёт объёмов работ должен быть уточнён после осмотра.",
        "",
        "## 7. Что уточнить перед сметой",
        "- фактическое состояние основания пола, стен и потолка;",
        "- перепады, трещины, влажность и наличие старой отделки;",
        "- точные инженерные точки: электрика, сантехника, вентиляция, отопление;",
        "- выбранные материалы, нормы расхода, упаковки и технологические паузы;",
        "- требования по бюджету, срокам, долговечности и уровню качества.",
        "",
        "## 8. Найденные RAG-фрагменты",
        *rag_lines,
    ]

    return "\n".join(lines)


def _validation_payload(issues: List[ValidationIssue]) -> List[Dict[str, Any]]:
    return [
        item.model_dump() if hasattr(item, "model_dump") else item.dict()
        for item in issues
    ]


@app.get("/")
def root() -> Dict[str, Any]:
    return {
        "status": "ok",
        "service": "repair-rag-fullstack-api",
        "contract_version": CONTRACT_VERSION,
        "docs": "/docs",
        "health": "/api/health",
    }


@app.get("/health")
@app.get("/api/health")
def health() -> Dict[str, Any]:
    state = _rag_state()
    return {
        "status": "ok",
        "contract_version": CONTRACT_VERSION,
        "chunks_loaded": len(state["chunks"]),
        "metadata_loaded": len(state["metadata"]),
        "faiss_index_loaded": state["faiss_index_loaded"],
        "missing_files": state["missing_files"],
    }


@app.post("/api/consult", response_model=ConsultationResponse)
def consult(request: ConsultRequest) -> ConsultationResponse:
    normalized, errors, warnings = validate_consult_request(request)

    if errors:
        raise HTTPException(
            status_code=422,
            detail={
                "status": "validation_error",
                "contract_version": CONTRACT_VERSION,
                "errors": _validation_payload(errors),
                "warnings": _validation_payload(warnings),
            },
        )

    metrics = calculate_room_metrics(normalized)
    work_packages = build_work_packages(normalized, metrics)
    rag_fragments = _search_rag_fragments(normalized)
    answer = _build_answer(normalized, metrics, work_packages, warnings, rag_fragments)

    payload = normalized.model_dump() if hasattr(normalized, "model_dump") else normalized.dict()

    return ConsultationResponse(
        status="ok",
        contract_version=CONTRACT_VERSION,
        metrics=metrics,
        calculation={
            "metrics": metrics,
            "work_packages": work_packages,
        },
        answer=answer,
        validation_warnings=warnings,
        rag_fragments=rag_fragments,
        request_payload=payload,
    )
