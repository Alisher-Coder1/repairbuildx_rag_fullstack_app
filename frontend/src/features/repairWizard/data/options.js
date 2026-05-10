export const PROPERTY_CONDITIONS = [
  "новостройка без отделки",
  "черновая отделка",
  "предчистовая отделка",
  "старая отделка",
];

export const BASE_OPTIONS = ["бетон", "бетонная стяжка", "штукатурка", "гипсокартон", "старая отделка"];
BASE_OPTIONS.floor = ["бетонная стяжка", "бетон", "деревянное основание", "старая отделка"];
BASE_OPTIONS.wall = ["штукатурка", "бетон", "гипсокартон", "старая отделка"];
BASE_OPTIONS.walls = BASE_OPTIONS.wall;
BASE_OPTIONS.ceiling = ["бетон", "штукатурка", "гипсокартон", "старая отделка"];

export const COVERING_OPTIONS = ["краска", "плитка", "ламинат", "обои", "декоративная штукатурка"];
COVERING_OPTIONS.floor = ["ламинат", "плитка", "керамогранит", "линолеум", "паркет", "наливной пол"];
COVERING_OPTIONS.wall = ["краска", "обои", "плитка", "декоративная штукатурка", "стеновые панели"];
COVERING_OPTIONS.walls = COVERING_OPTIONS.wall;
COVERING_OPTIONS.ceiling = ["краска", "натяжной потолок", "гипсокартон", "штукатурка"];

export const YES_NO_UNKNOWN_OPTIONS = ["yes", "no", "unknown"];
export const YES_NO_AUTO_UNKNOWN_OPTIONS = ["auto", "yes", "no", "unknown"];
export const ALIGNMENT_OPTIONS = YES_NO_UNKNOWN_OPTIONS;

export const STAGE_7_3_UX = {
  showDeveloperDebug: false,
  showRawRagFragments: false,
  showPayloadPreview: false,
};

export const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const ROOM_TYPE_OPTIONS = ["кухня", "ванная", "санузел", "спальня", "гостиная", "коридор", "прихожая", "детская", "кабинет", "балкон", "лоджия", "кладовая", "гардеробная", "техническое помещение"];

export const ROOM_TO_ZONE = { кухня: "кухонная зона", ванная: "влажная зона", санузел: "влажная зона", спальня: "сухая зона", гостиная: "сухая зона", детская: "сухая зона", кабинет: "сухая зона", коридор: "проходная сухая зона", прихожая: "проходная сухая зона", балкон: "балконная зона", лоджия: "балконная зона", кладовая: "сухая зона", гардеробная: "сухая зона", "техническое помещение": "техническая зона" };

export const ZONE_OPTIONS = ["сухая зона", "влажная зона", "кухонная зона", "проходная сухая зона", "балконная зона", "техническая зона"];

export const SHAPE_OPTIONS = ["прямоугольная", "круглая", "сложная"];

export const GEOMETRY_MODES = ["measured_totals", "wall_segments"];

export const WALL_SEGMENT_TYPES = ["straight", "arc", "curved", "wave", "niche", "projection", "column_side", "other"];

export const CORNER_TYPES = ["inner", "outer", "rounded", "none", "unknown"];

export const FLOOR_COVERINGS = ["ламинат", "керамогранит", "керамическая плитка", "наливной пол", "линолеум", "инженерная доска", "паркет", "unknown"];
export const WALL_COVERINGS = ["краска", "обои", "керамическая плитка", "декоративная штукатурка", "панели", "unknown"];
export const CEILING_COVERINGS = ["краска", "побелка", "натяжной потолок", "гипсокартон", "панели", "unknown"];
export const YES_NO_UNKNOWN = ["yes", "no", "unknown", "auto"];
export const REPAIR_LEVELS = ["косметический", "капитальный", "частичный", "под ключ", "только расчёт материалов", "только консультация"];
export const BUDGET_LEVELS = ["эконом", "средний", "премиум", "не указан"];

// Future registry only. Do not render as a generic object step.
export const REPAIR_OBJECT_OPTIONS = [
  { group: "Сантехника", options: [["toilet_floor", "Унитаз напольный"], ["toilet_wall_hung", "Подвесной унитаз / инсталляция"], ["sink", "Раковина / умывальник"], ["shower", "Душевая зона"]] },
  { group: "Электрика и свет", options: [["socket", "Розетки"], ["ceiling_light", "Потолочное освещение"]] },
  { group: "Вентиляция и отопление", options: [["ventilation_fan", "Вентиляция / вентилятор"], ["warm_floor", "Тёплый пол"]] },
  { group: "Финишные покрытия", options: [["laminate_floor", "Ламинат"], ["tile", "Плитка / керамогранит"], ["paint", "Краска"]] },
];

export const REPAIR_OBJECT_LIFECYCLE_HINTS = {
  toilet_floor: "Черновой: вывод воды и канализации. Чистовой: установка и проверка унитаза.",
  toilet_wall_hung: "Черновой: инсталляция и выводы. Предчистовой: зашивка и плитка. Чистовой: чаша и кнопка.",
  sink: "Черновой: выводы воды и канализации. Чистовой: раковина, смеситель, сифон.",
  shower: "Черновой: выводы, трап, уклоны. Предчистовой: гидроизоляция. Чистовой: душевая система.",
  socket: "Черновой: кабель и подрозетник. Предчистовой: заделка. Чистовой: механизм и рамка.",
  ceiling_light: "Черновой: кабель и выводы. Предчистовой: отверстия/закладные. Чистовой: светильники.",
  ventilation_fan: "Черновой: канал и питание. Предчистовой: короб/отверстие. Чистовой: решётка или вентилятор.",
  warm_floor: "Черновой: система и датчик. Предчистовой: закрытие/стяжка. Чистовой: терморегулятор.",
  laminate_floor: "Черновой: проверка основания. Предчистовой: подготовка пола. Чистовой: ламинат, подложка, плинтус.",
  tile: "Черновой: основание и гидроизоляция. Предчистовой: подготовка. Чистовой: плитка, клей, затирка.",
  paint: "Черновой: основание. Предчистовой: шпаклёвка и шлифовка. Чистовой: окраска.",
};

export const PRIORITIES = ["долговечность", "быстро", "дешево", "влагостойкость", "звукоизоляция", "теплоизоляция", "простота ухода", "минимум сложных работ", "визуальный дизайн"];

export const OPENING_TYPES = ["дверь", "окно", "арка", "ниша"];

export const UI_LABELS = {
  measured_totals: "по общим замерам",
  wall_segments: "по сегментам стен",

  straight: "прямая стена",
  arc: "дуговая / радиусная стена",
  curved: "кривая стена",
  wave: "волнистая стена",
  niche: "ниша",
  projection: "выступ",
  column_side: "сторона колонны",
  other: "другое",

  inner: "внутренний угол",
  outer: "внешний угол",
  rounded: "скруглённый угол",
  none: "без угла",
  unknown: "неизвестно",

  yes: "да",
  no: "нет",
  auto: "авто",

  electrical_required: "Нужна электрика",
  plumbing_required: "Нужна сантехника",
  ventilation_required: "Нужна вентиляция",
  heating_required: "Нужно отопление",
  waterproofing_required: "Нужна гидроизоляция",
  hvac_required: "Нужен HVAC / кондиционирование",
};

export const PROGRESSIVE_CONSULTANT_STEPS = [
  { key: "room", title: "1. Помещение", short: "Помещение" },
  { key: "geometry", title: "2. Геометрия", short: "Геометрия" },
  { key: "rough", title: "3. Черновой этап / инженерная подготовка", short: "Черновой" },
  { key: "prefinish", title: "4. Предчистовой этап / требования к качеству", short: "Предчистовой" },
  { key: "finish", title: "5. Чистовой этап / покрытия", short: "Чистовой" },
  { key: "result", title: "6. Консультация", short: "Консультация" },
];

export const WIZARD_STEP_FLOW = PROGRESSIVE_CONSULTANT_STEPS.map((step) => step.key);
