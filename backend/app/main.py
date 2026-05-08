from __future__ import annotations

from functools import lru_cache
import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .calculations import calculate_room_metrics
from .config import settings
from .rag_service import RepairRAGService
from .schemas import ConsultResponse, HealthResponse, RoomInput
from .validation import validate_coverings

app = FastAPI(title="Repair RAG Consultant API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@lru_cache(maxsize=1)
def get_rag_service() -> RepairRAGService:
    return RepairRAGService()


@app.get("/api/health", response_model=HealthResponse)
def health() -> HealthResponse:
    missing_files = [str(path) for path in [settings.chunks_path, settings.metadata_path, settings.faiss_index_path] if not path.exists()]
    chunks_loaded = 0
    metadata_loaded = 0
    faiss_loaded = False
    if not missing_files:
        try:
            service = get_rag_service()
            chunks_loaded = len(service.chunks)
            metadata_loaded = len(service.metadata)
            faiss_loaded = service.index is not None
        except Exception:
            faiss_loaded = False
    return HealthResponse(
        status="ok" if not missing_files else "missing_resources",
        chunks_loaded=chunks_loaded,
        metadata_loaded=metadata_loaded,
        faiss_index_loaded=faiss_loaded,
        missing_files=missing_files,
    )


@app.post("/api/consult", response_model=ConsultResponse)
def consult(room: RoomInput) -> ConsultResponse:
    covering_errors = validate_coverings(room)
    if covering_errors:
        raise HTTPException(status_code=422, detail=covering_errors)
    try:
        service = get_rag_service()
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"RAG service is not ready: {error}") from error
    metrics = calculate_room_metrics(room)
    normalized_query = (
        f"{room.user_question}\n"
        f"Р¤РѕСЂРјР°: {room.room_shape}; Р·РѕРЅР°: {room.zone_type}; "
        f"РїРѕР»: {room.floor_covering}; СЃС‚РµРЅС‹: {room.wall_covering}; РїРѕС‚РѕР»РѕРє: {room.ceiling_covering}; "
        f"РїР»РѕС‰Р°РґСЊ РїРѕР»Р°: {metrics.floor_area}; СЃС‚РµРЅС‹: {metrics.wall_area_net}; РїР»РёРЅС‚СѓСЃ: {metrics.skirting_length}"
    )
    try:
        search_results = service.search(normalized_query)
        prompt = service.build_user_prompt(room, metrics, search_results)
        answer = service.generate_answer(prompt)
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Consultation failed: {error}") from error
    return ConsultResponse(metrics=metrics, answer=answer, search_results=search_results)
