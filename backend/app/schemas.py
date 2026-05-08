from __future__ import annotations

from pydantic import BaseModel, Field


class Opening(BaseModel):
    type: str
    width: float = Field(gt=0)
    height: float = Field(gt=0)
    count: int = Field(default=1, gt=0)


class RoomInput(BaseModel):
    room_shape: str
    zone_type: str
    length: float = Field(gt=0)
    width: float = Field(gt=0)
    height: float = Field(gt=0)
    floor_covering: str
    wall_covering: str
    ceiling_covering: str
    openings: list[Opening] = Field(default_factory=list)
    user_question: str = Field(min_length=3)


class RoomMetrics(BaseModel):
    floor_area: float
    ceiling_area: float
    perimeter: float
    wall_area_gross: float
    openings_area: float
    wall_area_net: float
    skirting_length: float


class SearchResult(BaseModel):
    rank: int
    score: float
    chunk_id: int | None
    text: str
    metadata: dict


class ConsultResponse(BaseModel):
    metrics: RoomMetrics
    answer: str
    search_results: list[SearchResult]


class HealthResponse(BaseModel):
    status: str
    chunks_loaded: int
    metadata_loaded: int
    faiss_index_loaded: bool
    missing_files: list[str]
