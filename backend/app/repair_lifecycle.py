from __future__ import annotations

from typing import Any


OBJECT_LIFECYCLE_CATALOG: dict[str, dict[str, Any]] = {
    "toilet_floor": {
        "label": "Унитаз напольный",
        "category": "plumbing",
        "rough": {"works": ["канализационный вывод", "вывод холодной воды", "проверка оси установки"], "materials": ["канализационные трубы/фитинги", "водяная труба/фитинги", "запорная арматура"], "checks": ["выводы должны быть сделаны до плитки", "проверить герметичность"]},
        "prefinish": {"works": ["подготовка пола и стен вокруг зоны установки", "проверка доступа к выводам"], "materials": ["грунтовка", "плиточный клей/подготовка основания при плитке", "герметик по необходимости"], "checks": ["не закрыть выводы отделкой", "согласовать место крепления"]},
        "finish": {"works": ["установка унитаза", "подключение", "проверка смыва и протечек"], "materials": ["унитаз", "крепёж", "подключение бачка/арматура", "санитарный герметик"], "checks": ["нет протечек", "устойчивость прибора", "доступ к обслуживанию"]},
    },
    "toilet_wall_hung": {
        "label": "Подвесной унитаз / инсталляция",
        "category": "plumbing",
        "rough": {"works": ["монтаж инсталляции", "канализация", "подвод воды", "проверка высоты и осей"], "materials": ["рама инсталляции", "канализационные фитинги", "водяные фитинги", "крепёж"], "checks": ["закрепить до зашивки", "проверить оси, высоту и ревизионный доступ"]},
        "prefinish": {"works": ["зашивка инсталляции", "подготовка под плитку", "ревизионный доступ"], "materials": ["ГКЛ/ГВЛ влагостойкий", "профиль", "саморезы", "грунтовка", "гидроизоляция в мокрой зоне"], "checks": ["не закрыть сервисный доступ", "проверить плоскость под плитку"]},
        "finish": {"works": ["установка чаши", "установка кнопки", "подключение и проверка"], "materials": ["чаша унитаза", "кнопка смыва", "комплект крепежа", "герметик"], "checks": ["нет протечек", "кнопка работает", "чаша закреплена"]},
    },
    "sink": {
        "label": "Раковина / умывальник",
        "category": "plumbing",
        "rough": {"works": ["выводы воды", "канализационный вывод", "закладные/крепления при необходимости"], "materials": ["водяные трубы/фитинги", "канализационные фитинги", "крепёж/закладные"], "checks": ["выводы соответствуют выбранной модели", "проверить высоту"]},
        "prefinish": {"works": ["подготовка стены/плитки вокруг выводов", "сохранение доступа к подключению"], "materials": ["грунтовка", "плиточный клей/шпаклёвка по выбранной отделке"], "checks": ["выводы не закрыты отделкой"]},
        "finish": {"works": ["установка раковины", "смеситель", "сифон", "проверка протечек"], "materials": ["раковина", "смеситель", "сифон", "гибкие подводки", "герметик"], "checks": ["нет протечек", "сифон доступен", "крепление устойчиво"]},
    },
    "shower": {
        "label": "Душевая зона",
        "category": "plumbing",
        "rough": {"works": ["выводы воды", "канализация/трап", "уклоны", "проверка герметичности"], "materials": ["трубы", "канализационные фитинги", "трап/слив", "запорная арматура"], "checks": ["уклон выполнен", "слив проверен до закрытия"]},
        "prefinish": {"works": ["гидроизоляция", "подготовка стен и пола под плитку", "герметизация углов"], "materials": ["гидроизоляция", "лента/манжеты", "грунтовка", "плиточный клей"], "checks": ["мокрая зона защищена", "примыкания обработаны"]},
        "finish": {"works": ["установка смесителя/душевой системы", "перегородка/дверь", "герметизация"], "materials": ["душевая система", "стекло/перегородка", "герметик", "фурнитура"], "checks": ["нет протечек", "двери/перегородка работают"]},
    },
    "socket": {
        "label": "Розетки",
        "category": "electrical",
        "rough": {"works": ["разметка точек", "штробы", "кабельные линии", "подрозетники"], "materials": ["кабель", "подрозетники", "гофра/крепёж", "распределительные коробки при необходимости"], "checks": ["проверить высоту и расположение до отделки", "учесть мебель и мокрые зоны"]},
        "prefinish": {"works": ["заделка штроб", "выравнивание вокруг подрозетников", "проверка доступности"], "materials": ["ремонтная смесь", "грунтовка", "шпаклёвка"], "checks": ["подрозетники не утоплены/не выступают сверх нормы"]},
        "finish": {"works": ["установка механизмов и рамок", "проверка питания"], "materials": ["механизмы розеток", "рамки", "клеммы/расходники"], "checks": ["питание есть", "механизмы закреплены", "безопасность во влажной зоне"]},
    },
    "ceiling_light": {
        "label": "Потолочное освещение",
        "category": "electrical",
        "rough": {"works": ["кабель к точкам света", "выводы под светильники", "выключатель"], "materials": ["кабель", "подрозетник под выключатель", "крепёж", "клеммы"], "checks": ["точки согласованы до потолка", "учесть тип потолка"]},
        "prefinish": {"works": ["подготовка отверстий/закладных", "заделка штроб", "проверка выводов"], "materials": ["ремонтная смесь", "грунтовка", "закладные при необходимости"], "checks": ["выводы доступны после отделки"]},
        "finish": {"works": ["установка светильников", "установка выключателей", "проверка"], "materials": ["светильники", "выключатель", "клеммы"], "checks": ["свет работает", "нет перегрева/ошибок подключения"]},
    },
    "ventilation_fan": {
        "label": "Вентиляция / вентилятор",
        "category": "ventilation",
        "rough": {"works": ["проверка вентканала", "подготовка вывода", "питание вентилятора"], "materials": ["кабель", "воздуховод/переходник", "крепёж"], "checks": ["канал не перекрыт", "питание согласовано"]},
        "prefinish": {"works": ["короб/примыкания", "подготовка отверстия под решётку/вентилятор"], "materials": ["ГКЛ/профиль при коробе", "шпаклёвка", "грунтовка"], "checks": ["сохранён доступ и проход воздуха"]},
        "finish": {"works": ["установка решётки/вентилятора", "подключение", "проверка тяги"], "materials": ["решётка или вентилятор", "крепёж", "клеммы"], "checks": ["есть тяга", "вентилятор работает"]},
    },
    "warm_floor": {
        "label": "Тёплый пол",
        "category": "heating",
        "rough": {"works": ["схема контура", "подготовка питания/датчика", "монтаж системы"], "materials": ["нагревательный мат/кабель или трубы", "датчик", "терморегуляторная линия"], "checks": ["проверка сопротивления/давления до закрытия", "согласовать покрытие пола"]},
        "prefinish": {"works": ["заливка/закрытие системы", "подготовка основания под покрытие"], "materials": ["смесь/стяжка", "грунтовка", "клей по системе"], "checks": ["не повредить контур", "соблюсти сроки высыхания"]},
        "finish": {"works": ["установка терморегулятора", "финальная проверка"], "materials": ["терморегулятор", "рамка", "расходники подключения"], "checks": ["система работает", "температура регулируется"]},
    },
    "laminate_floor": {
        "label": "Ламинат",
        "category": "finish",
        "rough": {"works": ["проверка ровности основания", "выравнивание при необходимости"], "materials": ["грунтовка", "нивелирующая смесь при необходимости"], "checks": ["основание сухое и ровное"]},
        "prefinish": {"works": ["подготовка пола под финишное покрытие"], "materials": ["подложка по системе", "пароизоляция при необходимости"], "checks": ["зазоры и высоты согласованы с дверями"]},
        "finish": {"works": ["укладка ламината", "плинтус", "пороги/профили"], "materials": ["ламинат", "подложка", "плинтус", "пороги/профили"], "checks": ["есть температурные зазоры", "нет скрипа и вздутий"]},
    },
    "tile": {
        "label": "Плитка / керамогранит",
        "category": "finish",
        "rough": {"works": ["проверка основания", "выравнивание", "гидроизоляция в мокрой зоне"], "materials": ["грунтовка", "штукатурка/ровнитель", "гидроизоляция при необходимости"], "checks": ["основание прочное", "мокрые зоны защищены"]},
        "prefinish": {"works": ["подготовка под плитку", "разметка", "проверка углов"], "materials": ["грунтовка", "плиточный клей", "система выравнивания плитки при необходимости"], "checks": ["формат плитки согласован с геометрией"]},
        "finish": {"works": ["укладка плитки", "затирка", "герметизация примыканий"], "materials": ["плитка", "клей", "затирка", "крестики/СВП", "герметик"], "checks": ["швы ровные", "примыкания герметичны"]},
    },
    "paint": {
        "label": "Краска",
        "category": "finish",
        "rough": {"works": ["проверка основания", "черновое выравнивание при необходимости"], "materials": ["грунтовка", "штукатурка/ремонтная смесь при необходимости"], "checks": ["основание не осыпается"]},
        "prefinish": {"works": ["шпаклёвка", "шлифовка", "финишная грунтовка"], "materials": ["шпаклёвка", "шкурка/сетка", "грунтовка"], "checks": ["поверхность готова под окраску"]},
        "finish": {"works": ["окраска", "контроль укрывистости"], "materials": ["краска", "валики/кисти", "малярная лента"], "checks": ["нет пятен и полос", "слои высохли"]},
    },
}

ROOM_DEFAULT_OBJECTS = {
    "ванная": ["sink", "shower", "socket", "ceiling_light", "ventilation_fan", "tile"],
    "санузел": ["toilet_floor", "sink", "socket", "ceiling_light", "ventilation_fan", "tile"],
    "кухня": ["socket", "ceiling_light", "ventilation_fan", "tile"],
    "спальня": ["socket", "ceiling_light", "laminate_floor", "paint"],
    "гостиная": ["socket", "ceiling_light", "laminate_floor", "paint"],
    "коридор": ["socket", "ceiling_light", "laminate_floor", "paint"],
}

def _model_to_dict(value: Any) -> dict[str, Any]:
    if value is None:
        return {}
    if isinstance(value, dict):
        return value
    if hasattr(value, "model_dump"):
        return value.model_dump()
    if hasattr(value, "dict"):
        return value.dict()
    return {}

def _unique(values: list[str]) -> list[str]:
    result = []
    for value in values:
        if value and value not in result:
            result.append(value)
    return result

def _derive_objects(request: Any, work_packages: dict[str, Any] | None = None) -> list[str]:
    data = _model_to_dict(request)
    selected = data.get("selected_objects") or []
    if selected:
        return [item for item in selected if item in OBJECT_LIFECYCLE_CATALOG]

    room_type = str(data.get("room_type") or "").lower()
    derived: list[str] = []
    for marker, defaults in ROOM_DEFAULT_OBJECTS.items():
        if marker in room_type:
            derived.extend(defaults)
            break

    surface_specs = data.get("surface_specs") or {}
    if isinstance(surface_specs, dict):
        for surface_key in ("floor", "walls", "ceiling"):
            surface = surface_specs.get(surface_key) or {}
            covering = str(surface.get("covering") or "").lower()
            if "ламинат" in covering:
                derived.append("laminate_floor")
            if "плит" in covering or "керам" in covering:
                derived.append("tile")
            if "краск" in covering:
                derived.append("paint")

    engineering = data.get("engineering") or {}
    if isinstance(engineering, dict):
        if engineering.get("electrical_required") in {"yes", "auto"}:
            derived.extend(["socket", "ceiling_light"])
        if engineering.get("plumbing_required") in {"yes", "auto"}:
            derived.extend(["sink"])
        if engineering.get("ventilation_required") in {"yes", "auto"}:
            derived.append("ventilation_fan")
        if engineering.get("heating_required") in {"yes", "auto"}:
            derived.append("warm_floor")

    return _unique([item for item in derived if item in OBJECT_LIFECYCLE_CATALOG])

def _empty_stage(title: str, purpose: str) -> dict[str, Any]:
    return {"title": title, "purpose": purpose, "objects": [], "works": [], "materials": [], "checks": []}

def _append_unique(target: list[str], values: list[str]) -> None:
    for value in values:
        if value and value not in target:
            target.append(value)

def build_repair_stage_plan(request: Any, metrics: dict[str, Any] | None = None, work_packages: dict[str, Any] | None = None) -> dict[str, Any]:
    metrics = metrics or {}
    object_codes = _derive_objects(request, work_packages)

    stages = {
        "room_context": _empty_stage("1. Помещение и контекст", "Тип помещения, зона, состояние и глубина ремонта."),
        "geometry": _empty_stage("2. Геометрия", "Площади, периметр, проёмы и база расчёта."),
        "rough": _empty_stage("3. Черновой этап", "Скрытые работы, инженерные выводы, основание, штробы, трубы, кабели."),
        "prefinish": _empty_stage("4. Предчистовой этап", "Заделка, выравнивание, шпаклёвка, гидроизоляция, подготовка под финиш."),
        "finish": _empty_stage("5. Чистовой этап", "Видимые покрытия, приборы, механизмы, финишная установка и проверка."),
        "result": _empty_stage("6. Итог и консультация", "Сводка по этапам, материалам, рискам и следующим уточнениям."),
    }

    stages["geometry"]["works"] = ["проверить площадь пола", "проверить площадь потолка", "проверить чистую площадь стен", "проверить проёмы и вычеты", "для сложной формы проверить сегменты стен"]
    stages["geometry"]["checks"] = [
        f"площадь пола: {metrics.get('floor_area', 'не рассчитано')} м²",
        f"площадь потолка: {metrics.get('ceiling_area', 'не рассчитано')} м²",
        f"чистая площадь стен: {metrics.get('walls_net_area', 'не рассчитано')} м²",
        f"периметр/сумма стен: {metrics.get('perimeter', 'не рассчитано')} м",
    ]

    for code in object_codes:
        obj = OBJECT_LIFECYCLE_CATALOG[code]
        for stage_key in ("rough", "prefinish", "finish"):
            stage_part = obj.get(stage_key, {})
            stages[stage_key]["objects"].append(obj["label"])
            _append_unique(stages[stage_key]["works"], stage_part.get("works", []))
            _append_unique(stages[stage_key]["materials"], stage_part.get("materials", []))
            _append_unique(stages[stage_key]["checks"], stage_part.get("checks", []))

    all_materials: list[str] = []
    for stage_key in ("rough", "prefinish", "finish"):
        _append_unique(all_materials, stages[stage_key]["materials"])

    stages["result"]["materials"] = all_materials
    stages["result"]["checks"] = ["материалы показаны по жизненному циклу объектов", "точный расход требует норм расхода и упаковок", "скрытые инженерные работы закрываются только после проверки"]

    return {"selected_object_codes": object_codes, "selected_objects": [OBJECT_LIFECYCLE_CATALOG[code]["label"] for code in object_codes], "stages": stages, "principle": "Пользователь выбирает понятные объекты, система раскладывает их на черновой, предчистовой и чистовой этапы."}
