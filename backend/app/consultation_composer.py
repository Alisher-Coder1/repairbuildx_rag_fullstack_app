from __future__ import annotations

import re
from typing import Any


REPAIR_KEYWORDS = {
    "ремонт", "помещение", "комната", "кухня", "ванная", "санузел", "коридор", "спальня",
    "пол", "стены", "стена", "потолок", "плитка", "ламинат", "краска", "обои",
    "штукатурка", "стяжка", "грунтовка", "гидроизоляция", "вентиляция", "сантехника",
    "электрика", "отопление", "hvac", "кондиционер", "проём", "дверь", "окно",
    "плинтус", "материал", "материалы", "площадь", "периметр", "смета", "работы",
    "основание", "влага", "влажность", "подрезка", "демонтаж", "выравнивание",
}

OFF_TOPIC_KEYWORDS = {
    # Use stems as well as full words, so "погоде", "погоду", "погодой" are caught.
    "погод", "биткоин", "президент", "стих", "плов", "рецепт", "новост", "курс валют",
    "футбол", "кино", "музык", "сегодня", "дата", "время",
}


def _safe_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value)


def _extract(raw: str, labels: list[str]) -> str | None:
    for label in labels:
        for pattern in (
            rf"{re.escape(label)}\s*[:：]\s*([^\n\r]+)",
            rf"-\s*{re.escape(label)}\s*[:：]\s*([^\n\r]+)",
        ):
            match = re.search(pattern, raw, flags=re.IGNORECASE)
            if match:
                value = match.group(1).strip().strip("*").strip()
                return re.sub(r"\s+", " ", value)
    return None


def _extract_number(raw: str, labels: list[str]) -> str | None:
    value = _extract(raw, labels)
    if not value:
        return None
    match = re.search(r"[-+]?\d+(?:[.,]\d+)?", value)
    if not match:
        return value
    number = match.group(0).replace(",", ".")
    suffix = ""
    if "м.пог" in value:
        suffix = " м.пог."
    elif "м²" in value or "м2" in value:
        suffix = " м²"
    elif "м" in value:
        suffix = " м"
    return f"{number}{suffix}"




def _extract_user_question_from_context(context: Any | None) -> str:
    # Finds the user's free-text question inside FastAPI locals(), Pydantic models,
    # dict payloads, nested objects, or already stringified request data.
    question_keys = (
        "user_question",
        "question",
        "prompt",
        "message",
        "user_message",
        "consultant_question",
        "additional_notes",
        "notes",
    )

    def looks_like_question(value: str) -> bool:
        v = value.strip()
        if not v:
            return False
        # Prefer natural user text; avoid treating long technical payload dumps as the question.
        if len(v) > 600:
            return False
        return any(marker in v.lower() for marker in (
            "погод", "ремонт", "кух", "ванн", "комнат", "помещ", "материал",
            "рассч", "плитк", "ламинат", "стен", "пол", "потол", "сантех", "электр",
        ))

    visited: set[int] = set()

    def walk(value: Any) -> str:
        if value is None:
            return ""

        object_id = id(value)
        if object_id in visited:
            return ""
        visited.add(object_id)

        if isinstance(value, str):
            return value if looks_like_question(value) else ""

        if isinstance(value, dict):
            for key in question_keys:
                if key in value:
                    found = walk(value.get(key))
                    if found:
                        return found
            for nested_value in value.values():
                found = walk(nested_value)
                if found:
                    return found
            return ""

        # Pydantic v2
        if hasattr(value, "model_dump"):
            try:
                found = walk(value.model_dump())
                if found:
                    return found
            except Exception:
                pass

        # Pydantic v1
        if hasattr(value, "dict"):
            try:
                found = walk(value.dict())
                if found:
                    return found
            except Exception:
                pass

        for key in question_keys:
            if hasattr(value, key):
                try:
                    found = walk(getattr(value, key))
                    if found:
                        return found
                except Exception:
                    pass

        try:
            value_as_text = str(value)
            if len(value_as_text) <= 600 and looks_like_question(value_as_text):
                return value_as_text
        except Exception:
            pass

        return ""

    return walk(context)


def _question_is_off_topic(question: str) -> bool:
    q = question.lower().strip()
    if not q:
        return False

    has_repair = any(word in q for word in REPAIR_KEYWORDS)
    has_off_topic = any(word in q for word in OFF_TOPIC_KEYWORDS)

    # "влажная погода влияет на штукатурку" passes because it has repair signal.
    # "поговорим о погоде" stops because it has no repair signal.
    return has_off_topic and not has_repair


def _room_intro(room_type: str, zone_type: str, shape: str) -> str:
    room = room_type or "помещение"
    zone = zone_type or "зона не уточнена"
    shape_part = f" с формой «{shape}»" if shape else ""
    return (
        f"По введённым данным это {room}{shape_part}, зона эксплуатации: {zone}. "
        "Расчёт нужен как доказательная база, но главное решение принимается по состоянию основания, "
        "рискам, инженерным системам, выбранным покрытиям и фактическим замерам."
    )


def _build_recommendations(room_type: str, zone_type: str, wall_area: str | None, shape: str) -> list[str]:
    room = (room_type or "").lower()
    zone = (zone_type or "").lower()
    shape_l = (shape or "").lower()

    recs: list[str] = []
    if "ван" in room or "сан" in room or "влаж" in zone:
        recs.extend([
            "Сначала проверьте гидроизоляцию пола, примыканий и зон прямого контакта с водой.",
            "До чистовой отделки уточните вентиляцию, сантехнические выводы, уклоны и доступ к ревизиям.",
        ])
    elif "кух" in room or "кухон" in zone:
        recs.extend([
            "Для кухни заранее свяжите отделку с розетками, фартуком, вентиляцией, сантехникой и будущей мебелью.",
            "Рабочую зону кухни проверяйте отдельно: там выше риск влаги, загрязнений и локальной нагрузки.",
        ])
    else:
        recs.append("Перед выбором покрытия проверьте основание: перепады, трещины, влажность и прочность.")

    if "слож" in shape_l:
        recs.append("Для сложной формы не используйте одну грубую формулу: стены и кривые участки лучше считать по фактическим сегментам.")
    if wall_area:
        recs.append(f"Чистая площадь стен для ориентира: {wall_area}; материал нельзя покупать ровно впритык — нужен запас на подрезку и брак.")

    recs.extend([
        "Не финализируйте закупку, пока не уточнены нормы расхода конкретных материалов и формат упаковки.",
        "Отдельно проверьте, нужен ли демонтаж, выравнивание и подготовка основания — это сильно влияет на сроки и стоимость.",
    ])
    return recs[:6]


def _build_questions(room_type: str, zone_type: str, shape: str) -> list[str]:
    questions = [
        "Какие перепады пола, стен и потолка есть сейчас?",
        "Есть ли трещины, слабые участки, старая отделка или следы влаги?",
        "Какие покрытия уже выбраны по бренду, формату и размеру?",
    ]

    room = (room_type or "").lower()
    zone = (zone_type or "").lower()
    shape_l = (shape or "").lower()

    if "кух" in room:
        questions.append("Где будут мойка, плита, вытяжка, фартук, розетки и мебель?")
    if "ван" in room or "влаж" in zone:
        questions.append("Где будут мокрые зоны, сантехнические выводы, вентиляция и ревизионные люки?")
    if "слож" in shape_l:
        questions.append("Все ли стены, волнистые участки, ниши, выступы и колонны измерены по фактическому контуру?")

    return questions[:6]




def _context_contains_off_topic_request(context: Any | None) -> bool:
    # Strong off-topic guard.
    #
    # compose_consultation_answer receives locals(). That context may also contain the
    # already-built repair answer, so the old extractor could find repair text before
    # it found the user's real question. This scanner looks through all short
    # user-like strings and blocks only when it finds an off-topic string without
    # repair signal.
    visited: set[int] = set()

    def is_short_user_text(value: str) -> bool:
        v = value.strip()
        if not v:
            return False
        if len(v) > 300:
            return False
        if any(marker in v for marker in ("{", "}", "[", "]", "geometry_mode", "manual_floor_area", "wall_segments")):
            return False
        return True

    def walk(value: Any) -> bool:
        if value is None:
            return False

        object_id = id(value)
        if object_id in visited:
            return False
        visited.add(object_id)

        if isinstance(value, str):
            if is_short_user_text(value) and _question_is_off_topic(value):
                return True
            return False

        if isinstance(value, dict):
            priority_keys = (
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
            for key in priority_keys:
                if key in value and walk(value.get(key)):
                    return True
            for nested_value in value.values():
                if walk(nested_value):
                    return True
            return False

        if isinstance(value, (list, tuple, set)):
            for item in value:
                if walk(item):
                    return True
            return False

        if hasattr(value, "model_dump"):
            try:
                if walk(value.model_dump()):
                    return True
            except Exception:
                pass

        if hasattr(value, "dict"):
            try:
                if walk(value.dict()):
                    return True
            except Exception:
                pass

        for key in (
            "user_question",
            "question",
            "prompt",
            "message",
            "user_message",
            "consultant_question",
            "additional_notes",
            "notes",
            "text",
        ):
            if hasattr(value, key):
                try:
                    if walk(getattr(value, key)):
                        return True
                except Exception:
                    pass

        return False

    return walk(context)


def compose_consultation_answer(raw_answer: Any, context: Any | None = None) -> str:
    # Convert old calculator/debug report into a user-facing consultation.
    raw = _safe_text(raw_answer).strip()
    ctx_text = _safe_text(context)

    user_question = _extract_user_question_from_context(context)

    if _question_is_off_topic(user_question) or _context_contains_off_topic_request(context):
        return (
            "## Консультация\n\n"
            "Ваш вопрос не относится к ремонту помещения, поэтому я не буду подменять ответ расчётом.\n\n"
            "Я могу помочь с ремонтом: площадями, покрытиями, материалами, этапами работ, проёмами, "
            "инженерными системами, рисками влажных зон и подготовкой основания.\n\n"
            "Сформулируйте вопрос по помещению — например: «Что учесть перед ремонтом кухни?» "
            "или «Какие материалы уточнить для ванной?»"
        )

    room_type = _extract(raw, ["Тип помещения", "Помещение"]) or _extract(ctx_text, ["room_type"]) or "помещение"
    zone_type = _extract(raw, ["Зона эксплуатации", "Зона"]) or _extract(ctx_text, ["zone_type"]) or "зона не уточнена"
    shape = _extract(raw, ["Форма помещения", "Форма"]) or _extract(ctx_text, ["room_shape"]) or "форма не уточнена"
    geometry_mode = _extract(raw, ["Режим геометрии"]) or _extract(ctx_text, ["geometry_mode"])

    floor_area = _extract_number(raw, ["Площадь пола"])
    ceiling_area = _extract_number(raw, ["Площадь потолка"])
    wall_area = _extract_number(raw, ["Чистая площадь стен", "Стены чистая"])
    openings_area = _extract_number(raw, ["Площадь проёмов", "Проёмы"])
    perimeter = _extract_number(raw, ["Суммарная длина стен / периметр", "Периметр"])
    baseboard = _extract_number(raw, ["Плинтус / примыкания", "Плинтус"])

    metrics: list[str] = []
    for label, value in (
        ("Площадь пола", floor_area),
        ("Площадь потолка", ceiling_area),
        ("Чистая площадь стен", wall_area),
        ("Площадь проёмов", openings_area),
        ("Периметр / сумма стен", perimeter),
        ("Плинтус / примыкания", baseboard),
    ):
        if value:
            metrics.append(f"{label}: {value}.")
    if not metrics:
        metrics.append("Расчётные показатели сформированы, но требуют проверки введённых размеров и норм расхода материалов.")

    recs = _build_recommendations(room_type, zone_type, wall_area, shape)
    questions = _build_questions(room_type, zone_type, shape)

    geometry_note = ""
    if geometry_mode:
        geometry_note = (
            f"\n\nРежим геометрии: {geometry_mode}. Для сложного контура точность зависит от фактических замеров, "
            "а не от названия формы."
        )

    return (
        "## Консультация\n\n"
        "### Краткий вывод\n"
        f"{_room_intro(room_type, zone_type, shape)}{geometry_note}\n\n"
        "### Что я рекомендую сделать\n"
        + "\n".join(f"- {item}" for item in recs)
        + "\n\n"
        "### Что нужно уточнить перед следующим шагом\n"
        + "\n".join(f"- {item}" for item in questions)
        + "\n\n"
        "### Ключевые расчётные данные\n"
        + "\n".join(f"- {item}" for item in metrics)
        + "\n\n"
        "### Следующий шаг\n"
        "Проверьте фактические замеры и состояние основания. После этого можно переходить к более точному подбору материалов, "
        "запасов, последовательности работ и рисков по конкретным покрытиям."
    )
