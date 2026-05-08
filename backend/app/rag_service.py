from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import faiss
import numpy as np
from openai import OpenAI

from .config import settings
from .schemas import RoomInput, RoomMetrics, SearchResult

SYSTEM_PROMPT = """
Ты — AI-консультант по подготовке базового технического задания на ремонт помещения.

Правила:
1. Отвечай на основе предоставленного RAG-контекста и параметров пользователя.
2. Не выдумывай отсутствующие нормы расхода, цены, бренды и инженерные требования.
3. Если данных недостаточно, явно укажи, что нужно уточнить.
4. Структурируй ответ: исходные данные, расчёты, материалы, ограничения, следующий шаг.
5. Не заменяй профессиональный проект электрики, вентиляции, отопления или сантехники.
6. Пиши на русском языке, деловым и понятным стилем.
""".strip()


class RepairRAGService:
    def __init__(self) -> None:
        self.client = self._create_client()
        self.chunks = self._load_json_list(settings.chunks_path)
        self.metadata = self._load_json_list(settings.metadata_path)
        self.index = self._load_faiss_index(settings.faiss_index_path)

    @staticmethod
    def _create_client() -> OpenAI:
        if not settings.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY is missing.")
        return OpenAI(api_key=settings.openai_api_key)

    @staticmethod
    def _load_json_list(path: Path) -> list[dict[str, Any]]:
        if not path.exists():
            raise FileNotFoundError(f"Missing required file: {path}")

        with path.open("r", encoding="utf-8") as file:
            data = json.load(file)

        if not isinstance(data, list):
            raise ValueError(f"{path} must contain a JSON list.")

        return data

    @staticmethod
    def _load_faiss_index(path: Path) -> faiss.Index:
        if not path.exists():
            raise FileNotFoundError(f"Missing required file: {path}")

        return faiss.read_index(str(path))

    def create_embedding(self, text: str) -> np.ndarray:
        response = self.client.embeddings.create(
            model=settings.embedding_model,
            input=text,
        )

        vector = np.array(response.data[0].embedding, dtype="float32").reshape(1, -1)
        faiss.normalize_L2(vector)

        return vector

    def search(self, query: str, top_k: int | None = None) -> list[SearchResult]:
        k = top_k or settings.top_k_chunks
        query_vector = self.create_embedding(query)
        scores, indices = self.index.search(query_vector, k)

        results: list[SearchResult] = []

        for rank, (score, vector_index) in enumerate(
            zip(scores[0], indices[0]), start=1
        ):
            if vector_index < 0:
                continue

            vector_index = int(vector_index)

            chunk = self.chunks[vector_index] if vector_index < len(self.chunks) else {}
            metadata = (
                self.metadata[vector_index] if vector_index < len(self.metadata) else {}
            )

            results.append(
                SearchResult(
                    rank=rank,
                    score=float(score),
                    chunk_id=chunk.get("chunk_id", metadata.get("chunk_id")),
                    text=chunk.get("text", ""),
                    metadata=metadata,
                )
            )

        return results

    @staticmethod
    def build_user_prompt(
        room: RoomInput,
        metrics: RoomMetrics,
        search_results: list[SearchResult],
    ) -> str:
        rag_context = "\n\n".join(
            [
                f"[Фрагмент {item.rank}; chunk_id={item.chunk_id}; score={item.score:.4f}]\n{item.text}"
                for item in search_results
            ]
        )

        openings_json = json.dumps(
            [item.model_dump() for item in room.openings],
            ensure_ascii=False,
            indent=2,
        )

        return f"""
Вопрос пользователя:
{room.user_question}
Параметры помещения:
- Форма: {room.room_shape}
- Зона: {room.zone_type}
- Длина: {room.length} м
- Ширина: {room.width} м
- Высота: {room.height} м
- Покрытие пола: {room.floor_covering}
- Покрытие стен: {room.wall_covering}
- Покрытие потолка: {room.ceiling_covering}

Проёмы:
{openings_json}

Расчётные показатели:
- Площадь пола: {metrics.floor_area} м²
- Площадь потолка: {metrics.ceiling_area} м²
- Периметр: {metrics.perimeter} м
- Площадь стен без вычета: {metrics.wall_area_gross} м²
- Площадь проёмов: {metrics.openings_area} м²
- Чистая площадь стен: {metrics.wall_area_net} м²
- Длина плинтуса: {metrics.skirting_length} м.пог.

RAG-контекст:
{rag_context}

Сформируй ответ по структуре:
1. Исходные параметры
2. Проверка данных
3. Расчётные показатели
4. Материалы и что нужно уточнить
5. Ограничения расчёта
6. Следующий практический шаг
""".strip()

    def generate_answer(self, user_prompt: str) -> str:
        response = self.client.chat.completions.create(
            model=settings.chat_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
        )

        return response.choices[0].message.content or "Ответ не был сформирован."

