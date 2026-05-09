from __future__ import annotations

import re
from typing import Any


REPAIR_KEYWORDS = {
    "ремонт", "ремонтн", "помещ", "комнат", "кух", "ванн", "сануз", "спальн",
    "пол", "стен", "потол", "проем", "проём", "двер", "окн", "плинтус",
    "плитк", "керам", "ламинат", "линолеум", "наливн", "обои", "краск",
    "штукатур", "шпаклев", "шпатлев", "стяжк", "бетон", "цемент", "гипс",
    "грунт", "клей", "смес", "смесь", "материал", "материалов", "стройматериал",
    "строительн", "отделк", "чернов", "чистов", "основан", "покрыт",
    "электр", "сантех", "вод", "канализац", "вентиляц", "отоплен", "радиатор",
    "теплый", "тёплый", "гидроизоляц", "влаг", "влажн", "мокр", "сух",
    "конденсат", "температур", "мороз", "жар", "сохн", "высых", "адгез",
    "площад", "периметр", "расч", "посч", "расход", "норма", "запас", "срок",
    "стоим", "цена", "закуп", "этап", "последовательн", "мастер", "подряд",
    "демонтаж", "выравнив", "монтаж", "уклад", "нанесен", "нанесён",
}

OFF_TOPIC_KEYWORDS = {
    "погод", "любов", "отношен", "дружб", "футбол", "кино", "музык", "песн",
    "игр", "биткоин", "крипт", "курс валют", "президент", "политик", "религи",
    "гороскоп", "сонник", "анекдот", "шутк", "рецепт", "плов", "новост",
    "стих", "стихотвор", "психолог", "мотивац", "сегодня", "дата", "время",
}

WEATHER_MARKERS = {
    "погод", "температур", "влажн", "влаг", "сырост", "мороз", "жар",
    "конденсат", "сквозня", "микроклимат", "сезон",
}

MATERIAL_MARKERS = {
    "материал", "стройматериал", "смес", "смесь", "цемент", "бетон", "гипс",
    "клей", "краск", "штукатур", "шпаклев", "шпатлев", "ламинат", "плитк",
    "покрыт", "основан", "стен", "пол", "потол", "высых", "сохн", "адгез",
    "стяжк", "грунт", "отделк",
}

GENERIC_REPAIR_REQUESTS = {
    "подготовь базовую консультацию и расчет для ремонта помещения.",
    "подготовь базовую консультацию и расчёт для ремонта помещения.",
}

QUESTION_KEYS = (
    "user_question",
    "question",
    "prompt",
    "message",
    "user_message",
    "consultant_question",
    "additional_notes",
    "notes",
    "text",
)

TECHNICAL_STRING_MARKERS = (
    "{", "}", "[", "]", "geometry_mode", "manual_floor_area", "manual_wall_area",
    "wall_segments", "surface_specs", "repair_context", "openings", "room_type",
    "zone_type", "baseboard_required", "finish_required",
)

USER_REQUEST_STARTS = (
    "расскажи", "поговорим", "объясни", "поясни", "подскажи", "посоветуй",
    "помоги", "подготовь", "сделай", "что", "как", "какие", "какой", "какая",
    "какое", "почему", "зачем", "можно ли", "нужно ли", "влияет ли",
    "влияет", "нужен", "нужна", "нужно", "хочу", "надо",
)


def _safe_text(value: Any) -> str:
    if value is None:
        return ""
    try:
        return str(value).strip()
    except Exception:
        return ""


def _normalize_text(value: Any) -> str:
    text = _safe_text(value).lower()
    return re.sub(r"\s+", " ", text).strip()


def _has_any(text: str, markers: set[str] | tuple[str, ...]) -> bool:
    return any(marker in text for marker in markers)


def _word_count(text: str) -> int:
    return len(re.findall(r"[a-zа-яё0-9]+", text.lower()))


def _is_weather_materials_repair_question(question: str) -> bool:
    q = _normalize_text(question)
    if not q:
        return False
    return _has_any(q, WEATHER_MARKERS) and _has_any(q, MATERIAL_MARKERS)


def _is_repair_related_question(question: str) -> bool:
    q = _normalize_text(question)
    if not q:
        return False
    if q in GENERIC_REPAIR_REQUESTS:
        return True
    if _is_weather_materials_repair_question(q):
        return True
    return _has_any(q, REPAIR_KEYWORDS)


def _is_user_question_outside_repair_scope(question: str) -> bool:
    q = _normalize_text(question)
    if not q:
        return False

    if q in GENERIC_REPAIR_REQUESTS:
        return False

    if _is_repair_related_question(q):
        return False

    if _has_any(q, OFF_TOPIC_KEYWORDS):
        return True

    # Any natural sentence/request without repair signal should not be converted
    # into a room calculation.
    if _word_count(q) >= 2:
        return True

    return False


def _looks_like_user_request(value: str, priority_field: bool = False) -> bool:
    v = _normalize_text(value)
    if not v:
        return False
    if len(v) > 300:
        return False
    if any(marker in v for marker in TECHNICAL_STRING_MARKERS):
        return False

    if priority_field:
        return True

    if "?" in v:
        return True

    if any(v.startswith(prefix) for prefix in USER_REQUEST_STARTS):
        return True

    if _has_any(v, OFF_TOPIC_KEYWORDS):
        return True

    if _is_weather_materials_repair_question(v):
        return True

    return False


def _collect_question_candidates(value: Any, priority_field: bool = False, visited: set[int] | None = None) -> list[str]:
    if visited is None:
        visited = set()

    if value is None:
        return []

    object_id = id(value)
    if object_id in visited:
        return []
    visited.add(object_id)

    if isinstance(value, str):
        return [value.strip()] if _looks_like_user_request(value, priority_field=priority_field) else []

    if isinstance(value, dict):
        candidates: list[str] = []

        for key in QUESTION_KEYS:
            if key in value:
                candidates.extend(_collect_question_candidates(value.get(key), priority_field=True, visited=visited))

        for key, nested_value in value.items():
            if key not in QUESTION_KEYS:
                candidates.extend(_collect_question_candidates(nested_value, priority_field=False, visited=visited))

        return candidates

    if isinstance(value, (list, tuple, set)):
        candidates = []
        for item in value:
            candidates.extend(_collect_question_candidates(item, priority_field=False, visited=visited))
        return candidates

    if hasattr(value, "model_dump"):
        try:
            return _collect_question_candidates(value.model_dump(), priority_field=priority_field, visited=visited)
        except Exception:
            pass

    if hasattr(value, "dict"):
        try:
            return _collect_question_candidates(value.dict(), priority_field=priority_field, visited=visited)
        except Exception:
            pass

    candidates = []
    for key in QUESTION_KEYS:
        if hasattr(value, key):
            try:
                candidates.extend(_collect_question_candidates(getattr(value, key), priority_field=True, visited=visited))
            except Exception:
                pass

    return candidates


def _extract_user_question_from_context(context: Any | None) -> str:
    candidates = _collect_question_candidates(context)

    if not candidates:
        return ""

    for candidate in candidates:
        if _is_weather_materials_repair_question(candidate):
            return candidate

    for candidate in candidates:
        if _is_user_question_outside_repair_scope(candidate):
            return candidate

    for candidate in candidates:
        if _is_repair_related_question(candidate):
            return candidate

    return candidates[0]


def _to_number(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        cleaned = value.replace(",", ".").strip()
        match = re.search(r"-?\d+(?:\.\d+)?", cleaned)
        if not match:
            return None
        try:
            return float(match.group(0))
        except ValueError:
            return None
    return None


def _find_first_value(context: Any, keys: tuple[str, ...], visited: set[int] | None = None) -> Any:
    if visited is None:
        visited = set()

    if context is None:
        return None

    object_id = id(context)
    if object_id in visited:
        return None
    visited.add(object_id)

    if isinstance(context, dict):
        for key in keys:
            if key in context:
                return context.get(key)
        for nested_value in context.values():
            found = _find_first_value(nested_value, keys, visited)
            if found is not None:
                return found
        return None

    if isinstance(context, (list, tuple, set)):
        for item in context:
            found = _find_first_value(item, keys, visited)
            if found is not None:
                return found
        return None

    if hasattr(context, "model_dump"):
        try:
            return _find_first_value(context.model_dump(), keys, visited)
        except Exception:
            pass

    if hasattr(context, "dict"):
        try:
            return _find_first_value(context.dict(), keys, visited)
        except Exception:
            pass

    for key in keys:
        if hasattr(context, key):
            try:
                value = getattr(context, key)
                if value is not None:
                    return value
            except Exception:
                pass

    return None


def _metric(context: Any, *keys: str) -> float | None:
    return _to_number(_find_first_value(context, tuple(keys)))


def _format_m2(value: float | None) -> str:
    if value is None:
        return "не рассчитано"
    return f"{value:.2f}".rstrip("0").rstrip(".") + " м²"


def _format_m(value: float | None) -> str:
    if value is None:
        return "не рассчитано"
    return f"{value:.2f}".rstrip("0").rstrip(".") + " м"


def _compose_refusal_answer(question: str) -> str:
    return (
        "## Консультация\n\n"
        "Ваш вопрос не относится к ремонту помещения, поэтому я не буду подменять его расчётом.\n\n"
        "Я могу помочь с ремонтом: площадями, покрытиями, материалами, этапами работ, проёмами, "
        "инженерными системами, рисками влажных зон и подготовкой основания.\n\n"
        "Сформулируйте вопрос по помещению — например: «Что учесть перед ремонтом кухни?» "
        "или «Какие материалы уточнить для ванной?»"
    )


def _compose_weather_materials_answer(question: str) -> str:
    return (
        "## Консультация\n\n"
        "### Краткий вывод\n"
        "Погода и микроклимат действительно влияют на строительные материалы. Влажность, температура, "
        "сквозняки, конденсат и скорость высыхания могут изменить адгезию, прочность, расход, сроки "
        "и качество финишного покрытия.\n\n"
        "### Что важно проверить\n"
        "- Температуру воздуха и основания перед нанесением смесей, клея, краски или штукатурки.\n"
        "- Влажность основания: бетон, стяжка, штукатурка и стены не должны быть сырыми перед финишной отделкой.\n"
        "- Вентиляцию без агрессивных сквозняков: быстрый пересушенный верхний слой может дать трещины.\n"
        "- Совместимость материалов: грунтовка, клей, штукатурка, краска и покрытие должны подходить друг другу.\n"
        "- Рекомендации производителя: у каждого материала есть допустимая температура, влажность и время высыхания.\n\n"
        "### Практический совет\n"
        "Для точного ответа нужно указать конкретные материалы и помещение: например, штукатурка в ванной, "
        "плиточный клей на кухне, стяжка пола, краска стен или ламинат. Тогда можно оценить риски и порядок работ точнее.\n\n"
        "### Следующий шаг\n"
        "Напишите, какие именно материалы взаимодействуют и в каком помещении они применяются."
    )


def _room_label(context: Any) -> str:
    room_type = _safe_text(_find_first_value(context, ("room_type", "roomType", "type")))
    zone_type = _safe_text(_find_first_value(context, ("zone_type", "zoneType", "zone")))
    room_shape = _safe_text(_find_first_value(context, ("room_shape", "roomShape", "shape")))

    parts = []
    if room_type:
        parts.append(f"тип помещения: {room_type}")
    if zone_type:
        parts.append(f"зона: {zone_type}")
    if room_shape:
        parts.append(f"форма: {room_shape}")

    return "; ".join(parts) if parts else "параметры помещения указаны частично"


def _compose_repair_consultation_answer(context: Any, user_question: str = "") -> str:
    floor_area = _metric(context, "floor_area", "floorArea", "manual_floor_area", "manualFloorArea")
    ceiling_area = _metric(context, "ceiling_area", "ceilingArea", "manual_ceiling_area", "manualCeilingArea")
    wall_area = _metric(context, "net_wall_area", "netWallArea", "clean_wall_area", "cleanWallArea", "wall_area", "wallArea", "manual_wall_area")
    openings_area = _metric(context, "openings_area", "openingsArea", "total_openings_area", "totalOpeningsArea")
    perimeter = _metric(context, "perimeter", "manual_perimeter", "manualPerimeter", "wall_perimeter", "wallPerimeter")
    baseboard_length = _metric(context, "baseboard_length", "baseboardLength", "manual_baseboard_length", "manualBaseboardLength")

    if ceiling_area is None:
        ceiling_area = floor_area
    if baseboard_length is None:
        baseboard_length = perimeter

    question_line = f"\nВопрос пользователя: {user_question.strip()}\n" if user_question else ""

    return (
        "## Консультация\n\n"
        "### Краткий вывод\n"
        f"По введённым данным это помещение для ремонта: {_room_label(context)}. "
        "Расчёт можно использовать как предварительную основу, но финальное решение по материалам и объёмам "
        "нужно принимать после проверки основания, фактических размеров, проёмов и инженерных ограничений."
        f"{question_line}\n\n"
        "### Что я рекомендую сделать\n"
        "- Проверьте основание: перепады, трещины, влажность, прочность и старую отделку.\n"
        "- Для сложной формы не полагайтесь только на название формы: используйте фактическую площадь, периметр и сегменты стен.\n"
        "- Материалы не покупайте ровно впритык: нужен запас на подрезку, брак, упаковки и технологические потери.\n"
        "- Перед закупкой уточните нормы расхода конкретных материалов и формат упаковки.\n"
        "- Отдельно проверьте, нужен ли демонтаж, выравнивание, гидроизоляция, вентиляция, электрика или сантехника.\n\n"
        "### Что нужно уточнить перед следующим шагом\n"
        "- Какие перепады пола, стен и потолка есть сейчас?\n"
        "- Есть ли трещины, слабые участки, старая отделка или следы влаги?\n"
        "- Какие покрытия уже выбраны по бренду, формату и размеру?\n"
        "- Где будут мойка, розетки, техника, освещение, вентиляция и мебель?\n"
        "- Все ли стены, ниши, выступы и колонны измерены по фактическому контуру?\n\n"
        "### Ключевые расчётные данные\n"
        f"- Площадь пола: {_format_m2(floor_area)}.\n"
        f"- Площадь потолка: {_format_m2(ceiling_area)}.\n"
        f"- Чистая площадь стен: {_format_m2(wall_area)}.\n"
        f"- Площадь проёмов: {_format_m2(openings_area)}.\n"
        f"- Периметр / сумма стен: {_format_m(perimeter)}.\n"
        f"- Плинтус / примыкания: {_format_m(baseboard_length)}.\n\n"
        "### Следующий шаг\n"
        "Проверьте фактические размеры и состояние основания. После этого можно переходить к более точному подбору "
        "материалов, запасов, последовательности работ и рисков по конкретным покрытиям."
    )


def compose_consultation_answer(context: Any | None = None, *args: Any, **kwargs: Any) -> str:
    # Public entrypoint used by backend/app/main.py.
    # It accepts *args/**kwargs so integration stays stable even if caller passes
    # locals(), payload, answer, calculation_result, or keywords.

    if kwargs:
        merged_context: Any = {"context": context, "args": args, **kwargs}
    elif args:
        merged_context = {"context": context, "args": args}
    else:
        merged_context = context

    user_question = _extract_user_question_from_context(merged_context)

    if _is_weather_materials_repair_question(user_question):
        return _compose_weather_materials_answer(user_question)

    if _is_user_question_outside_repair_scope(user_question):
        return _compose_refusal_answer(user_question)

    return _compose_repair_consultation_answer(merged_context, user_question=user_question)
