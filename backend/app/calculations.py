from __future__ import annotations

import math
from typing import Any, Dict, List

from .schemas import ConsultRequest, WallSegment


def _round(value: float) -> float:
    return round(float(value), 2)


def _opening_area(request: ConsultRequest) -> float:
    return sum(float(o.width) * float(o.height) * int(o.count) for o in request.openings)


def _segment_height(segment: WallSegment, default_height: float) -> float:
    return float(segment.height) if segment.height is not None else float(default_height)


def _wall_segment_summary(request: ConsultRequest, default_height: float) -> Dict[str, Any]:
    segments: List[Dict[str, Any]] = []
    total_length = 0.0
    gross_area = 0.0
    baseboard_length = 0.0
    corners = {"inner": 0, "outer": 0, "rounded": 0, "none": 0, "unknown": 0}

    for segment in request.wall_segments:
        length = float(segment.length)
        height = _segment_height(segment, default_height)
        area = length * height

        total_length += length
        gross_area += area

        if segment.baseboard_required:
            baseboard_length += length

        corner_type = segment.corner_after_type or "unknown"
        corners[corner_type] = corners.get(corner_type, 0) + 1

        segments.append(
            {
                "id": segment.id,
                "type": segment.type,
                "length": _round(length),
                "height": _round(height),
                "area": _round(area),
                "baseboard_required": segment.baseboard_required,
                "finish_required": segment.finish_required,
                "corner_after_type": corner_type,
                "angle_deg": segment.angle_deg,
                "radius_m": segment.radius_m,
                "notes": segment.notes,
            }
        )

    return {
        "segments": segments,
        "total_length": total_length,
        "gross_area": gross_area,
        "baseboard_length": baseboard_length,
        "corners": corners,
    }


def calculate_room_metrics(request: ConsultRequest) -> Dict[str, Any]:
    dimensions = request.dimensions
    if dimensions is None:
        raise ValueError("dimensions is required")

    shape = request.room_shape

    if shape == "прямоугольная":
        length = float(dimensions.length)
        width = float(dimensions.width)
        height = float(dimensions.height)

        floor_area = length * width
        ceiling_area = floor_area
        perimeter = 2 * (length + width)
        walls_gross_area = perimeter * height
        openings_area = _opening_area(request)
        walls_net_area = max(walls_gross_area - openings_area, 0)
        plinth_length = perimeter
        geometry_details = {}

        formula = {
            "shape": "rectangle",
            "floor_area": "length * width",
            "ceiling_area": "length * width",
            "perimeter": "2 * (length + width)",
            "walls_gross_area": "perimeter * height",
            "walls_net_area": "walls_gross_area - openings_area",
        }

    elif shape == "круглая":
        diameter = float(dimensions.diameter)
        radius = diameter / 2
        height = float(dimensions.height)

        floor_area = math.pi * radius * radius
        ceiling_area = floor_area
        perimeter = math.pi * diameter
        walls_gross_area = perimeter * height
        openings_area = _opening_area(request)
        walls_net_area = max(walls_gross_area - openings_area, 0)
        plinth_length = perimeter
        geometry_details = {}

        formula = {
            "shape": "circle",
            "floor_area": "π * (diameter / 2)^2",
            "ceiling_area": "π * (diameter / 2)^2",
            "perimeter": "π * diameter",
            "walls_gross_area": "perimeter * height",
            "walls_net_area": "walls_gross_area - openings_area",
        }

    elif shape == "сложная":
        height = float(dimensions.height)
        floor_area = float(dimensions.manual_floor_area)
        ceiling_area = float(dimensions.manual_ceiling_area) if dimensions.manual_ceiling_area is not None else floor_area
        openings_area = _opening_area(request)

        if request.geometry_mode == "wall_segments":
            segment_summary = _wall_segment_summary(request, height)
            perimeter = segment_summary["total_length"]
            walls_gross_area = segment_summary["gross_area"]
            walls_net_area = float(dimensions.manual_wall_area) if dimensions.manual_wall_area is not None else max(walls_gross_area - openings_area, 0)
            plinth_length = float(dimensions.manual_baseboard_length) if dimensions.manual_baseboard_length is not None else segment_summary["baseboard_length"]
            geometry_details = {
                "geometry_mode": "wall_segments",
                "wall_segments": segment_summary["segments"],
                "corner_summary": segment_summary["corners"],
            }
            formula = {
                "shape": "manual_complex_wall_segments",
                "floor_area": "manual_floor_area",
                "ceiling_area": "manual_ceiling_area OR manual_floor_area",
                "perimeter": "Σ wall_segment.length",
                "walls_gross_area": "Σ wall_segment.length * wall_segment.height",
                "walls_net_area": "manual_wall_area OR walls_gross_area - openings_area",
                "baseboard": "manual_baseboard_length OR Σ segment.length where baseboard_required",
            }
        else:
            perimeter = float(dimensions.manual_perimeter)
            walls_gross_area = perimeter * height
            walls_net_area = float(dimensions.manual_wall_area) if dimensions.manual_wall_area is not None else max(walls_gross_area - openings_area, 0)
            plinth_length = float(dimensions.manual_baseboard_length) if dimensions.manual_baseboard_length is not None else perimeter
            geometry_details = {"geometry_mode": "measured_totals", "geometry_notes": dimensions.geometry_notes}
            formula = {
                "shape": "manual_complex_measured_totals",
                "floor_area": "manual_floor_area",
                "ceiling_area": "manual_ceiling_area OR manual_floor_area",
                "perimeter": "manual_perimeter",
                "walls_gross_area": "manual_perimeter * height",
                "walls_net_area": "manual_wall_area OR walls_gross_area - openings_area",
                "baseboard": "manual_baseboard_length OR manual_perimeter",
            }

    else:
        raise ValueError(f"Unsupported room_shape: {shape}")

    return {
        "room_shape": shape,
        "geometry_mode": request.geometry_mode,
        "floor_area": _round(floor_area),
        "ceiling_area": _round(ceiling_area),
        "perimeter": _round(perimeter),
        "walls_gross_area": _round(walls_gross_area),
        "openings_area": _round(openings_area),
        "walls_net_area": _round(walls_net_area),
        "plinth": _round(plinth_length),
        "baseboard": _round(plinth_length),
        "formula": formula,
        "geometry_details": geometry_details,
        "raw": {
            "floor_area": floor_area,
            "ceiling_area": ceiling_area,
            "perimeter": perimeter,
            "walls_gross_area": walls_gross_area,
            "openings_area": openings_area,
            "walls_net_area": walls_net_area,
            "plinth": plinth_length,
        },
    }


def build_work_packages(request: ConsultRequest, metrics: Dict[str, Any]) -> Dict[str, Any]:
    surfaces = request.surface_specs
    engineering = request.engineering

    packages = {
        "floor": {
            "covering": surfaces.floor.covering,
            "base": surfaces.floor.current_base,
            "area_m2": metrics["floor_area"],
            "needs_leveling": surfaces.floor.needs_leveling,
            "needs_demolition": surfaces.floor.needs_demolition,
            "typical_checks": ["проверить перепад основания", "уточнить подложку/грунтовку/клей", "заложить технологический запас материала"],
        },
        "walls": {
            "covering": surfaces.walls.covering,
            "base": surfaces.walls.current_base,
            "gross_area_m2": metrics["walls_gross_area"],
            "net_area_m2": metrics["walls_net_area"],
            "openings_area_m2": metrics["openings_area"],
            "needs_leveling": surfaces.walls.needs_leveling,
            "needs_demolition": surfaces.walls.needs_demolition,
            "typical_checks": ["проверить геометрию стен", "учесть вычеты проёмов", "уточнить грунт, шпаклёвку, клей или финишный материал"],
        },
        "ceiling": {
            "covering": surfaces.ceiling.covering,
            "base": surfaces.ceiling.current_base,
            "area_m2": metrics["ceiling_area"],
            "needs_leveling": surfaces.ceiling.needs_leveling,
            "has_lighting_points": surfaces.ceiling.has_lighting_points,
            "typical_checks": ["уточнить точки освещения", "проверить высоту после выбранного решения", "согласовать последовательность работ"],
        },
        "engineering": {
            "electrical_required": engineering.electrical_required,
            "plumbing_required": engineering.plumbing_required,
            "ventilation_required": engineering.ventilation_required,
            "heating_required": engineering.heating_required,
            "waterproofing_required": engineering.waterproofing_required,
            "hvac_required": engineering.hvac_required,
        },
    }

    if metrics.get("geometry_details", {}).get("geometry_mode") == "wall_segments":
        packages["geometry"] = {
            "wall_segments": metrics["geometry_details"]["wall_segments"],
            "corner_summary": metrics["geometry_details"]["corner_summary"],
            "checks": [
                "проверить, что кривые/волнистые сегменты измерены по фактическому контуру",
                "проверить внутренние и внешние углы для профилей, подрезки и сложности работ",
                "уточнить, входят ли ниши, колонны и эркеры в сегменты стен",
            ],
        }

    if request.zone_type == "влажная зона":
        packages["wet_zone"] = {
            "required": True,
            "checks": ["проверить гидроизоляцию пола и примыканий", "уточнить вентиляцию", "учесть сантехнические выводы и ревизионный доступ"],
        }

    if request.zone_type == "кухонная зона":
        packages["kitchen_zone"] = {
            "required": True,
            "checks": ["уточнить точки воды, канализации и электрики", "проверить вытяжку/вентиляцию", "учесть фартук и влагостойкие зоны"],
        }

    return packages
