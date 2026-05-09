from __future__ import annotations

import math
from typing import Any, Dict

from .schemas import ConsultRequest


def _round(value: float) -> float:
    return round(float(value), 2)


def _opening_area(request: ConsultRequest) -> float:
    return sum(
        float(opening.width) * float(opening.height) * int(opening.count)
        for opening in request.openings
    )


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

        formula = {
            "shape": "rectangle",
            "floor_area": "length * width",
            "ceiling_area": "length * width",
            "perimeter": "2 * (length + width)",
            "walls_gross_area": "perimeter * height",
        }

    elif shape == "круглая":
        diameter = float(dimensions.diameter)
        radius = diameter / 2
        height = float(dimensions.height)

        floor_area = math.pi * radius * radius
        ceiling_area = floor_area
        perimeter = math.pi * diameter

        formula = {
            "shape": "circle",
            "floor_area": "π * (diameter / 2)^2",
            "ceiling_area": "π * (diameter / 2)^2",
            "perimeter": "π * diameter",
            "walls_gross_area": "perimeter * height",
        }

    else:
        raise ValueError(f"Unsupported room_shape: {shape}")

    openings_area = _opening_area(request)
    walls_gross_area = perimeter * height
    walls_net_area = max(walls_gross_area - openings_area, 0)
    plinth_length = perimeter

    return {
        "room_shape": shape,
        "floor_area": _round(floor_area),
        "ceiling_area": _round(ceiling_area),
        "perimeter": _round(perimeter),
        "walls_gross_area": _round(walls_gross_area),
        "openings_area": _round(openings_area),
        "walls_net_area": _round(walls_net_area),
        "plinth": _round(plinth_length),
        "baseboard": _round(plinth_length),
        "formula": formula,
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
            "typical_checks": [
                "проверить перепад основания",
                "уточнить подложку/грунтовку/клей по выбранному покрытию",
                "заложить технологический запас материала",
            ],
        },
        "walls": {
            "covering": surfaces.walls.covering,
            "base": surfaces.walls.current_base,
            "gross_area_m2": metrics["walls_gross_area"],
            "net_area_m2": metrics["walls_net_area"],
            "openings_area_m2": metrics["openings_area"],
            "needs_leveling": surfaces.walls.needs_leveling,
            "needs_demolition": surfaces.walls.needs_demolition,
            "typical_checks": [
                "проверить геометрию стен",
                "учесть вычеты проёмов",
                "уточнить грунт, шпаклёвку, клей или финишный материал",
            ],
        },
        "ceiling": {
            "covering": surfaces.ceiling.covering,
            "base": surfaces.ceiling.current_base,
            "area_m2": metrics["ceiling_area"],
            "needs_leveling": surfaces.ceiling.needs_leveling,
            "has_lighting_points": surfaces.ceiling.has_lighting_points,
            "typical_checks": [
                "уточнить точки освещения",
                "проверить высоту помещения после выбранного решения",
                "согласовать последовательность до чистовой отделки стен",
            ],
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

    if request.zone_type == "влажная зона":
        packages["wet_zone"] = {
            "required": True,
            "checks": [
                "проверить гидроизоляцию пола и примыканий",
                "уточнить вентиляцию и влажностный режим",
                "учесть сантехнические выводы и ревизионный доступ",
            ],
        }

    if request.zone_type == "кухонная зона":
        packages["kitchen_zone"] = {
            "required": True,
            "checks": [
                "уточнить точки воды, канализации и электрики под технику",
                "проверить вытяжку/вентиляцию",
                "учесть фартук и влагостойкие зоны",
            ],
        }

    return packages
