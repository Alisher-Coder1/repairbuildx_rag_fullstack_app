from __future__ import annotations

from typing import List, Tuple
from .schemas import ConsultRequest, ValidationIssue


ROOM_TO_ZONE = {
    "кухня": "кухонная зона",
    "ванная": "влажная зона",
    "санузел": "влажная зона",
    "спальня": "сухая зона",
    "гостиная": "сухая зона",
    "детская": "сухая зона",
    "кабинет": "сухая зона",
    "коридор": "проходная сухая зона",
    "прихожая": "проходная сухая зона",
    "балкон": "балконная зона",
    "лоджия": "балконная зона",
    "кладовая": "сухая зона",
    "гардеробная": "сухая зона",
    "техническое помещение": "техническая зона",
}

SUPPORTED_SHAPES = {"прямоугольная", "круглая", "сложная"}
COMPLEX_GEOMETRY_MODES = {"measured_totals", "wall_segments"}

ALLOWED_ZONES = {
    "сухая зона",
    "влажная зона",
    "кухонная зона",
    "проходная сухая зона",
    "балконная зона",
    "техническая зона",
}

WALL_SEGMENT_TYPES = {
    "straight",
    "arc",
    "curved",
    "wave",
    "niche",
    "projection",
    "column_side",
    "other",
}

CORNER_TYPES = {"inner", "outer", "rounded", "none", "unknown"}


def _issue(code: str, message: str, path: str, severity: str = "error") -> ValidationIssue:
    return ValidationIssue(code=code, message=message, path=path, severity=severity)


def _num(value: object):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _required_positive(value: object, path: str, label: str, errors: List[ValidationIssue]) -> None:
    number = _num(value)
    if value is None:
        errors.append(_issue("REQUIRED_NUMBER", f"{label} обязателен.", path))
    elif number is None:
        errors.append(_issue("INVALID_NUMBER", f"{label} должен быть числом.", path))
    elif number <= 0:
        errors.append(_issue("NON_POSITIVE_NUMBER", f"{label} должен быть больше 0.", path))


def _optional_positive(value: object, path: str, label: str, errors: List[ValidationIssue]) -> None:
    if value is None:
        return
    number = _num(value)
    if number is None:
        errors.append(_issue("INVALID_NUMBER", f"{label} должен быть числом.", path))
    elif number <= 0:
        errors.append(_issue("NON_POSITIVE_NUMBER", f"{label} должен быть больше 0, если указан.", path))


def _dimension(value: object, path: str, label: str, errors: List[ValidationIssue]) -> None:
    _required_positive(value, path, label, errors)
    number = _num(value)
    if number is not None and (number < 0.1 or number > 100):
        errors.append(_issue("DIMENSION_OUT_OF_RANGE", f"{label} выглядит нереалистично: {number}.", path))


def _area(value: object, path: str, label: str, errors: List[ValidationIssue]) -> None:
    _required_positive(value, path, label, errors)
    number = _num(value)
    if number is not None and (number < 0.1 or number > 10000):
        errors.append(_issue("AREA_OUT_OF_RANGE", f"{label} выглядит нереалистично: {number}.", path))


def _perimeter(value: object, path: str, label: str, errors: List[ValidationIssue]) -> None:
    _required_positive(value, path, label, errors)
    number = _num(value)
    if number is not None and (number < 0.1 or number > 1000):
        errors.append(_issue("PERIMETER_OUT_OF_RANGE", f"{label} выглядит нереалистично: {number}.", path))


def _validate_wall_segments(request: ConsultRequest, errors: List[ValidationIssue], warnings: List[ValidationIssue]) -> None:
    if not request.wall_segments:
        errors.append(_issue("MISSING_WALL_SEGMENTS", "Для режима wall_segments нужен хотя бы один сегмент стены.", "wall_segments"))
        return

    for index, segment in enumerate(request.wall_segments):
        if segment.type not in WALL_SEGMENT_TYPES:
            errors.append(_issue("INVALID_WALL_SEGMENT_TYPE", f"Неизвестный тип сегмента: {segment.type}.", f"wall_segments[{index}].type"))

        _dimension(segment.length, f"wall_segments[{index}].length", "Длина сегмента", errors)

        if segment.height is not None:
            _dimension(segment.height, f"wall_segments[{index}].height", "Высота сегмента", errors)

        if segment.corner_after_type not in CORNER_TYPES:
            errors.append(_issue("INVALID_CORNER_TYPE", f"Неизвестный тип угла: {segment.corner_after_type}.", f"wall_segments[{index}].corner_after_type"))

        if segment.angle_deg is not None:
            angle = _num(segment.angle_deg)
            if angle is None or angle <= 0 or angle > 360:
                errors.append(_issue("INVALID_CORNER_ANGLE", "Угол должен быть числом больше 0 и не больше 360.", f"wall_segments[{index}].angle_deg"))

        if segment.type in {"arc", "curved", "wave"}:
            warnings.append(
                _issue(
                    "CURVED_SEGMENT_REQUIRES_MEASURED_LENGTH",
                    f"Сегмент {segment.id} кривой/волнистый. Его length должен быть фактической длиной по контуру, а не прямой хордой.",
                    f"wall_segments[{index}].length",
                    "warning",
                )
            )


def validate_consult_request(request: ConsultRequest) -> Tuple[ConsultRequest, List[ValidationIssue], List[ValidationIssue]]:
    normalized = request.normalized()
    errors: List[ValidationIssue] = []
    warnings: List[ValidationIssue] = []

    room_type = normalized.room_type or "unknown"
    zone_type = normalized.zone_type or "unknown"
    room_shape = normalized.room_shape or "unknown"
    dimensions = normalized.dimensions

    if not room_type or room_type == "unknown":
        warnings.append(_issue("UNKNOWN_ROOM_TYPE", "Тип помещения не указан. Ответ будет менее точным.", "room_type", "warning"))

    if zone_type not in ALLOWED_ZONES:
        errors.append(_issue("INVALID_ZONE_TYPE", f"Неизвестная зона эксплуатации: {zone_type}.", "zone_type"))

    expected_zone = ROOM_TO_ZONE.get(room_type)
    if expected_zone and expected_zone != zone_type:
        warnings.append(_issue("ROOM_ZONE_MISMATCH", f"Для помещения '{room_type}' обычно ожидается зона '{expected_zone}', но передано '{zone_type}'.", "zone_type", "warning"))

    if room_shape not in SUPPORTED_SHAPES:
        errors.append(
            _issue(
                "INVALID_ROOM_SHAPE",
                f"Форма '{room_shape}' не поддерживается отдельно. Овальные, Г-образные, П-образные, треугольные, волнистые и нестандартные формы вводятся через 'сложная' + замеры.",
                "room_shape",
            )
        )

    if dimensions is None:
        errors.append(_issue("MISSING_DIMENSIONS", "Блок dimensions обязателен.", "dimensions"))
    elif room_shape == "прямоугольная":
        _dimension(dimensions.length, "dimensions.length", "Длина", errors)
        _dimension(dimensions.width, "dimensions.width", "Ширина", errors)
        _dimension(dimensions.height, "dimensions.height", "Высота", errors)
    elif room_shape == "круглая":
        _dimension(dimensions.diameter, "dimensions.diameter", "Диаметр", errors)
        _dimension(dimensions.height, "dimensions.height", "Высота", errors)
    elif room_shape == "сложная":
        if normalized.geometry_mode not in COMPLEX_GEOMETRY_MODES:
            errors.append(_issue("INVALID_GEOMETRY_MODE", "Для сложной формы geometry_mode должен быть measured_totals или wall_segments.", "geometry_mode"))
        else:
            _area(dimensions.manual_floor_area, "dimensions.manual_floor_area", "Измеренная площадь пола", errors)
            _dimension(dimensions.height, "dimensions.height", "Высота", errors)
            _optional_positive(dimensions.manual_ceiling_area, "dimensions.manual_ceiling_area", "Площадь потолка", errors)
            _optional_positive(dimensions.manual_wall_area, "dimensions.manual_wall_area", "Ручная чистая площадь стен", errors)
            _optional_positive(dimensions.manual_baseboard_length, "dimensions.manual_baseboard_length", "Ручная длина плинтуса", errors)

            warnings.append(
                _issue(
                    "COMPLEX_GEOMETRY_MEASUREMENT_DEPENDENCY",
                    "Сложная форма считается по измеренным данным. Система не угадывает контур автоматически.",
                    "dimensions",
                    "warning",
                )
            )

            if normalized.geometry_mode == "measured_totals":
                _perimeter(dimensions.manual_perimeter, "dimensions.manual_perimeter", "Измеренный периметр стен", errors)
                if dimensions.manual_wall_area is None:
                    warnings.append(
                        _issue(
                            "COMPLEX_WALL_AREA_PRELIMINARY",
                            "Чистая площадь стен не введена вручную: backend посчитает предварительно manual_perimeter × height − openings.",
                            "dimensions.manual_wall_area",
                            "warning",
                        )
                    )

            if normalized.geometry_mode == "wall_segments":
                _validate_wall_segments(normalized, errors, warnings)
                if dimensions.manual_wall_area is None:
                    warnings.append(
                        _issue(
                            "SEGMENT_WALL_AREA_FROM_SEGMENTS",
                            "Стены будут рассчитаны как Σ(length × segment_height) − openings. Для сложных ниш/колонн можно указать manual_wall_area.",
                            "wall_segments",
                            "warning",
                        )
                    )

    for index, opening in enumerate(normalized.openings):
        _required_positive(opening.width, f"openings[{index}].width", "Ширина проёма", errors)
        _required_positive(opening.height, f"openings[{index}].height", "Высота проёма", errors)
        if opening.count < 1:
            errors.append(_issue("INVALID_OPENING_COUNT", "Количество проёмов должно быть минимум 1.", f"openings[{index}].count"))

    return normalized, errors, warnings
