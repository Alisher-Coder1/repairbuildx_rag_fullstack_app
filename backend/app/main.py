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
from .consultation_composer import compose_consultation_answer


CONTRACT_VERSION = "stage7.2.3"


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
    candidates.extend([backend_dir / "data", app_dir / "data", repo_dir / "backend" / "data", Path.cwd() / "data", Path.cwd() / "backend" / "data"])

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
    return {
        "data_dir": str(data_dir),
        "chunks": chunks if isinstance(chunks, list) else [],
        "metadata": metadata if isinstance(metadata, list) else [],
        "faiss_index_loaded": (data_dir / "faiss_index.bin").exists(),
        "missing_files": [f for f in ["chunks.json", "vector_metadata.json", "faiss_index.bin"] if not (data_dir / f).exists()],
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
    return {item.lower() for item in re.findall(r"[A-Za-zА-Яа-яЁё0-9_]{3,}", text or "")}


def _search_rag_fragments(request: ConsultRequest, limit: int | None = None) -> List[Dict[str, Any]]:
    state = _rag_state()
    chunks = state["chunks"]
    metadata = state["metadata"]

    if limit is None:
        try:
            limit = int(os.getenv("TOP_K_CHUNKS", "4"))
        except ValueError:
            limit = 4

    segment_terms = " ".join(segment.type for segment in request.wall_segments)
    query_parts = [
        request.room_type or "",
        request.zone_type or "",
        request.room_shape or "",
        request.geometry_mode or "",
        segment_terms,
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
        scored.append({"index": index, "score": score, "text": text[:900], "metadata": meta})

    scored.sort(key=lambda item: item["score"], reverse=True)
    return scored[: max(limit, 0)]


def _validation_payload(issues: List[ValidationIssue]) -> List[Dict[str, Any]]:
    return [item.model_dump() if hasattr(item, "model_dump") else item.dict() for item in issues]


def _format_warning_lines(warnings: List[ValidationIssue]) -> List[str]:
    if not warnings:
        return ["- Критичных предупреждений в переданном контракте нет."]
    return [f"- {item.code}: {item.message}" for item in warnings]


def _engineering_advice(request: ConsultRequest) -> List[str]:
    engineering = request.engineering
    lines: List[str] = []

    if request.zone_type == "влажная зона":
        lines.extend([
            "- Для влажной зоны проверить гидроизоляцию пола, примыканий и мокрых участков.",
            "- Проверить вентиляцию: без воздухообмена повышается риск плесени и разрушения отделки.",
            "- Сантехнические выводы, ревизионные люки и доступ к узлам нельзя закрывать без доступа.",
        ])

    if request.zone_type == "кухонная зона":
        lines.extend([
            "- Для кухни связать отделку с точками электрики, воды, канализации и вытяжки.",
            "- Фартук, зона мойки и зона готовки проверяются отдельно по влагостойкости и износостойкости.",
        ])

    if engineering.electrical_required in {"yes", "auto"}:
        lines.append("- Электрика: до чистовой отделки уточнить розетки, выключатели, освещение и мощность потребителей.")
    if engineering.plumbing_required in {"yes", "auto"}:
        lines.append("- Сантехника: до отделки зафиксировать трассы, уклоны, выводы и ревизионный доступ.")
    if engineering.waterproofing_required in {"yes", "auto"}:
        lines.append("- Гидроизоляция: проверить слой, заходы на стены, углы, примыкания и совместимость с покрытием.")
    if not lines:
        lines.append("- Инженерные системы не отмечены как обязательные, но перед ремонтом их всё равно нужно проверить по месту.")

    return lines


def _geometry_line(request: ConsultRequest, metrics: Dict[str, Any]) -> str:
    d = request.dimensions
    if request.room_shape == "прямоугольная":
        return f"- Геометрия: прямоугольник {d.length} × {d.width} × {d.height} м."
    if request.room_shape == "круглая":
        return f"- Геометрия: круглая комната, диаметр {d.diameter} м, высота {d.height} м."
    if request.room_shape == "сложная" and request.geometry_mode == "wall_segments":
        details = metrics.get("geometry_details", {})
        segments = details.get("wall_segments", [])
        return f"- Геометрия: сложная форма по сегментам стен. Сегментов: {len(segments)}, суммарная длина: {metrics['perimeter']} м. Кривые/волнистые участки считаются по фактически измеренной длине."
    if request.room_shape == "сложная":
        return f"- Геометрия: сложная форма по общим замерам: площадь пола {d.manual_floor_area} м², периметр {d.manual_perimeter} м, высота {d.height} м. Комментарий: {d.geometry_notes or 'не указан'}."
    return f"- Геометрия: {request.room_shape}."


def _segment_lines(metrics: Dict[str, Any]) -> List[str]:
    details = metrics.get("geometry_details", {})
    if details.get("geometry_mode") != "wall_segments":
        return []

    lines = ["", "## 4.1. Сегменты стен и углы"]
    for segment in details.get("wall_segments", []):
        lines.append(
            f"- {segment['id']}: тип {segment['type']}, длина {segment['length']} м, высота {segment['height']} м, площадь {segment['area']} м², угол после сегмента: {segment['corner_after_type']}."
        )

    corners = details.get("corner_summary", {})
    lines.append(f"- Углы: внутренние {corners.get('inner', 0)}, внешние {corners.get('outer', 0)}, скруглённые {corners.get('rounded', 0)}, неизвестные {corners.get('unknown', 0)}.")
    return lines


def _build_answer(request: ConsultRequest, metrics: Dict[str, Any], work_packages: Dict[str, Any], warnings: List[ValidationIssue], rag_fragments: List[Dict[str, Any]]) -> str:
    formula = metrics["formula"]
    rag_lines = []
    for item in rag_fragments[:3]:
        excerpt = item["text"].replace("\n", " ").strip()
        if len(excerpt) > 220:
            excerpt = excerpt[:220] + "..."
        rag_lines.append(f"- Фрагмент #{item['index']} (score {item['score']}): {excerpt}")
    if not rag_lines:
        rag_lines = ["- RAG-фрагменты не найдены или база знаний недоступна. Ответ сформирован по deterministic domain logic."]

    floor = work_packages["floor"]
    walls = work_packages["walls"]
    ceiling = work_packages["ceiling"]

    lines = [
        "## 1. Исходные параметры",
        f"- Тип помещения: {request.room_type}",
        f"- Зона эксплуатации: {request.zone_type}",
        f"- Форма помещения: {request.room_shape}",
        f"- Режим геометрии: {request.geometry_mode or 'standard'}",
        _geometry_line(request, metrics),
        f"- Уровень ремонта: {request.repair_context.repair_level}",
        f"- Состояние помещения: {request.repair_context.property_condition}",
        "",
        "## 2. Расчётные показатели",
        f"- Площадь пола: {metrics['floor_area']} м²",
        f"- Площадь потолка: {metrics['ceiling_area']} м²",
        f"- Суммарная длина стен / периметр: {metrics['perimeter']} м",
        f"- Стены до вычета проёмов: {metrics['walls_gross_area']} м²",
        f"- Площадь проёмов: {metrics['openings_area']} м²",
        f"- Чистая площадь стен: {metrics['walls_net_area']} м²",
        f"- Плинтус / примыкания: {metrics['plinth']} м.пог.",
        "",
        "## 3. Формулы",
        f"- Тип формулы: {formula['shape']}",
        f"- Площадь пола: {formula['floor_area']}",
        f"- Суммарная длина стен / периметр: {formula['perimeter']}",
        f"- Стены: {formula['walls_gross_area']} минус площадь проёмов или ручная площадь стен для сложной формы.",
        "",
        "## 4. Поверхности и работы",
        f"- Пол: покрытие '{floor['covering']}', расчётная площадь {floor['area_m2']} м². Уточнить основание, перепады и расход материалов.",
        f"- Стены: покрытие '{walls['covering']}', чистая площадь после вычета проёмов {walls['net_area_m2']} м². Проверить подготовку основания.",
        f"- Потолок: покрытие '{ceiling['covering']}', площадь {ceiling['area_m2']} м². Уточнить освещение и влияние решения на высоту.",
        *_segment_lines(metrics),
        "",
        "## 5. Инженерные проверки",
        *_engineering_advice(request),
        "",
        "## 6. Предупреждения и ограничения",
        *_format_warning_lines(warnings),
        "- Расход материалов не финальный без норм расхода, упаковок, запаса и технологии производителя.",
        "- Если есть перепады, влажность, старое основание, кривые стены, ниши, колонны или скрытые дефекты, расчёт нужно уточнить после осмотра.",
        "",
        "## 7. Что уточнить перед сметой",
        "- фактическое состояние основания пола, стен и потолка;",
        "- перепады, трещины, влажность и наличие старой отделки;",
        "- точные инженерные точки: электрика, сантехника, вентиляция, отопление;",
        "- выбранные материалы, нормы расхода, упаковки и технологические паузы;",
        "- для сложной формы: все сегменты стен, углы, ниши, выступы, колонны, радиусные/волнистые участки и ручные площади;",
        "- требования по бюджету, срокам, долговечности и уровню качества.",
        "",
        "## 8. Найденные RAG-фрагменты",
        *rag_lines,
    ]
    return "\n".join(lines)


@app.get("/")
def root() -> Dict[str, Any]:
    return {"status": "ok", "service": "repair-rag-fullstack-api", "contract_version": CONTRACT_VERSION, "docs": "/docs", "health": "/api/health"}


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
        raise HTTPException(status_code=422, detail={"status": "validation_error", "contract_version": CONTRACT_VERSION, "errors": _validation_payload(errors), "warnings": _validation_payload(warnings)})

    metrics = calculate_room_metrics(normalized)
    work_packages = build_work_packages(normalized, metrics)
    rag_fragments = _search_rag_fragments(normalized)
    answer = _build_answer(normalized, metrics, work_packages, warnings, rag_fragments)
    payload = normalized.model_dump() if hasattr(normalized, "model_dump") else normalized.dict()

    answer = compose_consultation_answer(answer, locals())

    return ConsultationResponse(
        status="ok",
        contract_version=CONTRACT_VERSION,
        metrics=metrics,
        calculation={"metrics": metrics, "work_packages": work_packages},
        answer=answer,
        validation_warnings=warnings,
        rag_fragments=rag_fragments,
        request_payload=payload,
    )
