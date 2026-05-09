from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class Opening(BaseModel):
    type: str = Field(default="дверь")
    width: float
    height: float
    count: int = Field(default=1)


class Dimensions(BaseModel):
    length: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    diameter: Optional[float] = None
    manual_floor_area: Optional[float] = None
    manual_perimeter: Optional[float] = None
    segments: Optional[List[Dict[str, Any]]] = None


class SurfaceSpec(BaseModel):
    current_base: str = "unknown"
    covering: str = "unknown"
    needs_demolition: Optional[bool] = None
    needs_leveling: str = "unknown"
    has_lighting_points: Optional[str] = None


class SurfaceSpecs(BaseModel):
    floor: SurfaceSpec = Field(default_factory=SurfaceSpec)
    walls: SurfaceSpec = Field(default_factory=SurfaceSpec)
    ceiling: SurfaceSpec = Field(default_factory=SurfaceSpec)


class RepairContext(BaseModel):
    property_condition: str = "unknown"
    repair_level: str = "unknown"
    has_existing_finish: bool = False


class Engineering(BaseModel):
    electrical_required: str = "unknown"
    plumbing_required: str = "unknown"
    ventilation_required: str = "unknown"
    heating_required: str = "unknown"
    waterproofing_required: str = "unknown"
    hvac_required: str = "unknown"


class UserGoals(BaseModel):
    budget_level: str = "unknown"
    priority: List[str] = Field(default_factory=list)
    notes: str = ""


class ConsultRequest(BaseModel):
    # New Stage 7.2 contract
    room_type: Optional[str] = None
    zone_type: Optional[str] = None
    room_shape: Optional[str] = None
    dimensions: Optional[Dimensions] = None
    openings: List[Opening] = Field(default_factory=list)
    surface_specs: Optional[SurfaceSpecs] = None
    repair_context: Optional[RepairContext] = None
    engineering: Optional[Engineering] = None
    user_goals: Optional[UserGoals] = None
    user_question: Optional[str] = None

    # Legacy compatibility fields from older frontend versions
    shape: Optional[str] = None
    zone: Optional[str] = None
    length: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    floor: Optional[str] = None
    walls: Optional[str] = None
    ceiling: Optional[str] = None
    floor_covering: Optional[str] = None
    wall_covering: Optional[str] = None
    ceiling_covering: Optional[str] = None
    question: Optional[str] = None

    def normalized(self) -> "ConsultRequest":
        """
        Return a contract-normalized copy.

        This keeps the API backward-compatible while making all downstream code
        use the Stage 7.2 structure.
        """
        data = self.model_dump() if hasattr(self, "model_dump") else self.dict()

        room_shape = data.get("room_shape") or data.get("shape") or "прямоугольная"
        zone_type = data.get("zone_type") or data.get("zone") or "сухая зона"
        user_question = data.get("user_question") or data.get("question") or ""

        dimensions = data.get("dimensions")
        if not dimensions:
            dimensions = {
                "length": data.get("length"),
                "width": data.get("width"),
                "height": data.get("height"),
            }

        surface_specs = data.get("surface_specs")
        if not surface_specs:
            surface_specs = {
                "floor": {
                    "current_base": "unknown",
                    "covering": data.get("floor_covering") or data.get("floor") or "unknown",
                    "needs_demolition": None,
                    "needs_leveling": "unknown",
                },
                "walls": {
                    "current_base": "unknown",
                    "covering": data.get("wall_covering") or data.get("walls") or "unknown",
                    "needs_demolition": None,
                    "needs_leveling": "unknown",
                },
                "ceiling": {
                    "current_base": "unknown",
                    "covering": data.get("ceiling_covering") or data.get("ceiling") or "unknown",
                    "needs_demolition": None,
                    "needs_leveling": "unknown",
                    "has_lighting_points": "unknown",
                },
            }

        return ConsultRequest(
            room_type=data.get("room_type") or "unknown",
            zone_type=zone_type,
            room_shape=room_shape,
            dimensions=Dimensions(**dimensions),
            openings=[Opening(**item) if isinstance(item, dict) else item for item in data.get("openings", [])],
            surface_specs=SurfaceSpecs(**surface_specs),
            repair_context=RepairContext(**(data.get("repair_context") or {})),
            engineering=Engineering(**(data.get("engineering") or {})),
            user_goals=UserGoals(**(data.get("user_goals") or {})),
            user_question=user_question,
        )


class ValidationIssue(BaseModel):
    code: str
    message: str
    path: str
    severity: str = "error"


class ConsultationResponse(BaseModel):
    status: str
    contract_version: str = "stage7.2"
    metrics: Dict[str, Any]
    calculation: Dict[str, Any]
    answer: str
    validation_warnings: List[ValidationIssue] = Field(default_factory=list)
    rag_fragments: List[Dict[str, Any]] = Field(default_factory=list)
    request_payload: Dict[str, Any]
