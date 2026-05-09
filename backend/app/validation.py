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

SUPPORTED_SHAPES = {"прямоугольная", "круглая", "овальная", "сложная"}

ALLOWED_ZONES = {
    "сухая зона",
    "влажная зона",
    "кухонная зона",
    "проходная сухая зона",
    "балконная зона",
    "техническая зона",
}


def _issue(code: str, message: str, path: str, severity: str = "error") -> ValidationIssue:
    return ValidationIssue(code=code, message=message, path=path, severity=severity)


def _positive_number(value: object, path: str, label: str, errors: List[ValidationIssue]) -> None:
    if value is None:
        errors.append(_issue("REQUIRED_NUMBER", f"{label} обязателен.", path))
        return

    try:
        number = float(value)
    except (TypeError, ValueError):
        errors.append(_issue("INVALID_NUMBER", f"{label} должен быть числом.", path))
        return

    if number <= 0:
        errors.append(_issue("NON_POSITIVE_NUMBER", f"{label} должен быть больше 0.", path))


def _optional_positive_number(value: object, path: str, label: str, errors: List[ValidationIssue]) -> None:
    if value is None:
        return

    try:
        number = float(value)
    except (TypeError, ValueError):
        errors.append(_issue("INVALID_NUMBER", f"{label} должен быть числом.", path))
        return

    if number <= 0:
        errors.append(_issue("NON_POSITIVE_NUMBER", f"{label} должен быть больше 0, если указан.", path))


def _reasonable_dimension(value: object, path: str, label: str, errors: List[ValidationIssue]) -> None:
    _positive_number(value, path, label, errors)
    try:
        number = float(value)
    except (TypeError, ValueError):
        return

    if number < 0.1 or number > 100:
        errors.append(
            _issue(
                "DIMENSION_OUT_OF_RANGE",
                f"{label} выглядит нереалистично для помещения: {number}.",
                path,
            )
        )


def _reasonable_area(value: object, path: str, label: str, errors: List[ValidationIssue]) -> None:
    _positive_number(value, path, label, errors)
    try:
        number = float(value)
    except (TypeError, ValueError):
        return

    if number < 0.1 or number > 10000:
        errors.append(
            _issue(
                "AREA_OUT_OF_RANGE",
                f"{label} выглядит нереалистично для помещения: {number}.",
                path,
            )
        )


def _reasonable_perimeter(value: object, path: str, label: str, errors: List[ValidationIssue]) -> None:
    _positive_number(value, path, label, errors)
    try:
        number = float(value)
    except (TypeError, ValueError):
        return

    if number < 0.1 or number > 1000:
        errors.append(
            _issue(
                "PERIMETER_OUT_OF_RANGE",
                f"{label} выглядит нереалистично для помещения: {number}.",
                path,
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
        warnings.append(
            _issue(
                "UNKNOWN_ROOM_TYPE",
                "Тип помещения не указан. Ответ будет менее точным.",
                "room_type",
                "warning",
            )
        )

    if zone_type not in ALLOWED_ZONES:
        errors.append(
            _issue(
                "INVALID_ZONE_TYPE",
                f"Неизвестная зона эксплуатации: {zone_type}.",
                "zone_type",
            )
        )

    expected_zone = ROOM_TO_ZONE.get(room_type)
    if expected_zone and expected_zone != zone_type:
        warnings.append(
            _issue(
                "ROOM_ZONE_MISMATCH",
                f"Для помещения '{room_type}' обычно ожидается зона '{expected_zone}', но передано '{zone_type}'.",
                "zone_type",
                "warning",
            )
        )

    if room_shape not in SUPPORTED_SHAPES:
        errors.append(
            _issue(
                "INVALID_ROOM_SHAPE",
                f"Неизвестная форма помещения: {room_shape}.",
                "room_shape",
            )
        )

    if dimensions is None:
        errors.append(_issue("MISSING_DIMENSIONS", "Блок dimensions обязателен.", "dimensions"))
    elif room_shape == "прямоугольная":
        _reasonable_dimension(dimensions.length, "dimensions.length", "Длина", errors)
        _reasonable_dimension(dimensions.width, "dimensions.width", "Ширина", errors)
        _reasonable_dimension(dimensions.height, "dimensions.height", "Высота", errors)
    elif room_shape == "круглая":
        _reasonable_dimension(dimensions.diameter, "dimensions.diameter", "Диаметр", errors)
        _reasonable_dimension(dimensions.height, "dimensions.height", "Высота", errors)
    elif room_shape == "овальная":
        _reasonable_dimension(dimensions.length, "dimensions.length", "Длина овала", errors)
        _reasonable_dimension(dimensions.width, "dimensions.width", "Ширина овала", errors)
        _reasonable_dimension(dimensions.height, "dimensions.height", "Высота", errors)
        warnings.append(
            _issue(
                "OVAL_PERIMETER_APPROXIMATION",
                "Периметр овальной формы рассчитывается приближённой формулой Рамануджана.",
                "dimensions",
                "warning",
            )
        )
    elif room_shape == "сложная":
        _reasonable_area(dimensions.manual_floor_area, "dimensions.manual_floor_area", "Измеренная площадь пола", errors)
        _reasonable_perimeter(dimensions.manual_perimeter, "dimensions.manual_perimeter", "Измеренный периметр стен", errors)
        _reasonable_dimension(dimensions.height, "dimensions.height", "Высота", errors)
        _optional_positive_number(dimensions.manual_ceiling_area, "dimensions.manual_ceiling_area", "Площадь потолка", errors)
        _optional_positive_number(dimensions.manual_wall_area, "dimensions.manual_wall_area", "Ручная чистая площадь стен", errors)
        _optional_positive_number(dimensions.manual_baseboard_length, "dimensions.manual_baseboard_length", "Ручная длина плинтуса", errors)
        warnings.append(
            _issue(
                "COMPLEX_GEOMETRY_MANUAL_MEASUREMENTS",
                "Сложная форма считается по измеренным параметрам. Точность зависит от корректности замеров площади, периметра и проёмов.",
                "dimensions",
                "warning",
            )
        )

    for index, opening in enumerate(normalized.openings):
        _positive_number(opening.width, f"openings[{index}].width", "Ширина проёма", errors)
        _positive_number(opening.height, f"openings[{index}].height", "Высота проёма", errors)
        if opening.count < 1:
            errors.append(
                _issue(
                    "INVALID_OPENING_COUNT",
                    "Количество проёмов должно быть минимум 1.",
                    f"openings[{index}].count",
                )
            )

    return normalized, errors, warnings
