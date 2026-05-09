import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const ROOM_TYPE_OPTIONS = [
  "кухня",
  "ванная",
  "санузел",
  "спальня",
  "гостиная",
  "коридор",
  "прихожая",
  "детская",
  "кабинет",
  "балкон",
  "лоджия",
  "кладовая",
  "гардеробная",
  "техническое помещение",
];

const ROOM_TO_ZONE = {
  кухня: "кухонная зона",
  ванная: "влажная зона",
  санузел: "влажная зона",
  спальня: "сухая зона",
  гостиная: "сухая зона",
  детская: "сухая зона",
  кабинет: "сухая зона",
  коридор: "проходная сухая зона",
  прихожая: "проходная сухая зона",
  балкон: "балконная зона",
  лоджия: "балконная зона",
  кладовая: "сухая зона",
  гардеробная: "сухая зона",
  "техническое помещение": "техническая зона",
};

const ZONE_OPTIONS = [
  "сухая зона",
  "влажная зона",
  "кухонная зона",
  "проходная сухая зона",
  "балконная зона",
  "техническая зона",
];

const SHAPE_OPTIONS = ["прямоугольная", "круглая", "Г-образная", "сложная"];

const FLOOR_COVERINGS = [
  "ламинат",
  "керамогранит",
  "керамическая плитка",
  "наливной пол",
  "линолеум",
  "инженерная доска",
  "паркет",
  "unknown",
];

const WALL_COVERINGS = [
  "краска",
  "обои",
  "керамическая плитка",
  "декоративная штукатурка",
  "панели",
  "unknown",
];

const CEILING_COVERINGS = [
  "краска",
  "побелка",
  "натяжной потолок",
  "гипсокартон",
  "панели",
  "unknown",
];

const BASE_OPTIONS = [
  "бетон",
  "бетонная стяжка",
  "штукатурка",
  "гипсокартон",
  "старая отделка",
  "после демонтажа",
  "unknown",
];

const YES_NO_UNKNOWN = ["yes", "no", "unknown", "auto"];

const PROPERTY_CONDITIONS = [
  "новостройка без отделки",
  "черновая отделка",
  "предчистовая отделка",
  "старая отделка",
  "после демонтажа",
  "неизвестно",
];

const REPAIR_LEVELS = [
  "косметический",
  "капитальный",
  "частичный",
  "под ключ",
  "только расчёт материалов",
  "только консультация",
];

const BUDGET_LEVELS = ["эконом", "средний", "премиум", "не указан"];

const PRIORITIES = [
  "долговечность",
  "быстро",
  "дешево",
  "влагостойкость",
  "звукоизоляция",
  "теплоизоляция",
  "простота ухода",
  "минимум сложных работ",
  "визуальный дизайн",
];

const OPENING_TYPES = ["дверь", "окно", "арка", "ниша"];

function roundNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return Math.round(number * 100) / 100;
}

function asNumber(value) {
  const number = Number(String(value).replace(",", "."));
  return Number.isFinite(number) ? number : 0;
}

function getDefaultEngineering(roomType) {
  if (roomType === "ванная" || roomType === "санузел") {
    return {
      electrical_required: "unknown",
      plumbing_required: "auto",
      ventilation_required: "auto",
      heating_required: "unknown",
      waterproofing_required: "auto",
      hvac_required: "unknown",
    };
  }

  if (roomType === "кухня") {
    return {
      electrical_required: "auto",
      plumbing_required: "auto",
      ventilation_required: "auto",
      heating_required: "unknown",
      waterproofing_required: "auto",
      hvac_required: "unknown",
    };
  }

  return {
    electrical_required: "unknown",
    plumbing_required: "unknown",
    ventilation_required: "unknown",
    heating_required: "unknown",
    waterproofing_required: "unknown",
    hvac_required: "unknown",
  };
}

function getMetric(source, keys) {
  for (const key of keys) {
    if (source && source[key] !== undefined && source[key] !== null) {
      return source[key];
    }
  }
  return undefined;
}

function Section({ title, subtitle, children }) {
  return (
    <section className="section-card">
      <div className="section-head">
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

function SelectField({ label, value, onChange, options, hint, disabled = false }) {
  return (
    <Field label={label} hint={hint}>
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </Field>
  );
}

function NumberField({ label, value, onChange, hint, min = "0", step = "0.01" }) {
  return (
    <Field label={label} hint={hint}>
      <input
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

function TextField({ label, value, onChange, hint, placeholder }) {
  return (
    <Field label={label} hint={hint}>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

function App() {
  const [roomType, setRoomType] = useState("кухня");
  const [zoneType, setZoneType] = useState(ROOM_TO_ZONE["кухня"]);
  const [zoneChangedManually, setZoneChangedManually] = useState(false);
  const [roomShape, setRoomShape] = useState("прямоугольная");

  const [dimensions, setDimensions] = useState({
    length: "5",
    width: "4",
    height: "2.8",
    diameter: "6",
    manual_floor_area: "",
    manual_perimeter: "",
  });

  const [openings, setOpenings] = useState([
    { type: "дверь", width: "0.9", height: "2.1", count: "1" },
    { type: "окно", width: "1.5", height: "1.4", count: "1" },
  ]);

  const [draftOpening, setDraftOpening] = useState({
    type: "дверь",
    width: "0.9",
    height: "2.1",
    count: "1",
  });

  const [surfaceSpecs, setSurfaceSpecs] = useState({
    floor: {
      current_base: "бетонная стяжка",
      covering: "ламинат",
      needs_demolition: false,
      needs_leveling: "unknown",
    },
    walls: {
      current_base: "штукатурка",
      covering: "краска",
      needs_demolition: false,
      needs_leveling: "unknown",
    },
    ceiling: {
      current_base: "бетон",
      covering: "краска",
      has_lighting_points: "unknown",
      needs_leveling: "unknown",
    },
  });

  const [repairContext, setRepairContext] = useState({
    property_condition: "черновая отделка",
    repair_level: "капитальный",
    has_existing_finish: false,
  });

  const [engineering, setEngineering] = useState(getDefaultEngineering("кухня"));

  const [userGoals, setUserGoals] = useState({
    budget_level: "средний",
    priority: ["долговечность", "простота ухода"],
    notes: "Нужен практичный ремонт без лишних дорогих решений.",
  });

  const [userQuestion, setUserQuestion] = useState(
    "Подготовь базовую консультацию и расчёт для ремонта помещения."
  );

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const defaultZone = ROOM_TO_ZONE[roomType] || "сухая зона";

  const normalizedDimensions = useMemo(() => {
    if (roomShape === "прямоугольная") {
      return {
        length: asNumber(dimensions.length),
        width: asNumber(dimensions.width),
        height: asNumber(dimensions.height),
      };
    }

    if (roomShape === "круглая") {
      return {
        diameter: asNumber(dimensions.diameter),
        height: asNumber(dimensions.height),
      };
    }

    if (roomShape === "сложная") {
      return {
        manual_floor_area: asNumber(dimensions.manual_floor_area),
        manual_perimeter: asNumber(dimensions.manual_perimeter),
        height: asNumber(dimensions.height),
      };
    }

    return {
      segments: [],
      height: asNumber(dimensions.height),
    };
  }, [dimensions, roomShape]);

  const normalizedOpenings = useMemo(
    () =>
      openings
        .map((opening) => ({
          type: opening.type,
          width: asNumber(opening.width),
          height: asNumber(opening.height),
          count: Math.max(1, Math.floor(asNumber(opening.count) || 1)),
        }))
        .filter((opening) => opening.width > 0 && opening.height > 0 && opening.count > 0),
    [openings]
  );

  const payload = useMemo(
    () => ({
      room_type: roomType,
      zone_type: zoneType,
      room_shape: roomShape,
      dimensions: normalizedDimensions,
      openings: normalizedOpenings,
      surface_specs: surfaceSpecs,
      repair_context: repairContext,
      engineering,
      user_goals: userGoals,
      user_question: userQuestion,
    }),
    [
      roomType,
      zoneType,
      roomShape,
      normalizedDimensions,
      normalizedOpenings,
      surfaceSpecs,
      repairContext,
      engineering,
      userGoals,
      userQuestion,
    ]
  );

  const legacyCompatiblePayload = useMemo(
    () => ({
      ...payload,
      shape: roomShape,
      zone: zoneType,
      length: normalizedDimensions.length ?? normalizedDimensions.diameter ?? 0,
      width: normalizedDimensions.width ?? normalizedDimensions.diameter ?? 0,
      height: normalizedDimensions.height ?? 0,
      floor_covering: surfaceSpecs.floor.covering,
      wall_covering: surfaceSpecs.walls.covering,
      ceiling_covering: surfaceSpecs.ceiling.covering,
      floor: surfaceSpecs.floor.covering,
      walls: surfaceSpecs.walls.covering,
      ceiling: surfaceSpecs.ceiling.covering,
      question: userQuestion,
    }),
    [payload, roomShape, zoneType, normalizedDimensions, surfaceSpecs, userQuestion]
  );

  function updateRoomType(nextRoomType) {
    setRoomType(nextRoomType);
    setZoneType(ROOM_TO_ZONE[nextRoomType] || "сухая зона");
    setZoneChangedManually(false);
    setEngineering(getDefaultEngineering(nextRoomType));
  }

  function updateDimension(key, value) {
    setDimensions((current) => ({ ...current, [key]: value }));
  }

  function updateSurface(surface, key, value) {
    setSurfaceSpecs((current) => ({
      ...current,
      [surface]: {
        ...current[surface],
        [key]: value,
      },
    }));
  }

  function updateEngineering(key, value) {
    setEngineering((current) => ({ ...current, [key]: value }));
  }

  function addOpening() {
    if (asNumber(draftOpening.width) <= 0 || asNumber(draftOpening.height) <= 0) {
      setError("Ширина и высота проёма должны быть больше 0.");
      return;
    }

    setOpenings((current) => [...current, draftOpening]);
    setDraftOpening({ type: "дверь", width: "0.9", height: "2.1", count: "1" });
    setError("");
  }

  function removeOpening(index) {
    setOpenings((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  function togglePriority(priority) {
    setUserGoals((current) => {
      const exists = current.priority.includes(priority);
      return {
        ...current,
        priority: exists
          ? current.priority.filter((item) => item !== priority)
          : [...current.priority, priority],
      };
    });
  }

  async function submitConsultation() {
    setError("");
    setResult(null);

    if (roomShape === "Г-образная") {
      setError("Г-образная форма пока не отправляется в расчёт: нужен отдельный backend geometry engine.");
      return;
    }

    if (roomShape === "сложная") {
      setError("Сложная форма пока не отправляется в расчёт: нужен manual geometry contract на backend.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/consult`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(legacyCompatiblePayload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (fetchError) {
      setError(fetchError?.message || "Не удалось получить ответ от backend.");
    } finally {
      setIsLoading(false);
    }
  }

  const resultSource = result?.metrics || result?.calculation || result?.calculations || result || {};
  const answer =
    result?.answer ||
    result?.consultant_answer ||
    result?.response ||
    result?.message ||
    (result ? JSON.stringify(result, null, 2) : "");

  const ragFragments =
    result?.rag_fragments ||
    result?.found_chunks ||
    result?.context_chunks ||
    result?.sources ||
    result?.context ||
    [];

  const uiWarnings = [];
  if (zoneChangedManually && zoneType !== defaultZone) {
    uiWarnings.push("Зона изменена вручную. Проверьте соответствие условиям эксплуатации.");
  }
  if (roomShape === "круглая") {
    uiWarnings.push("Круглая форма требует backend geometry engine. UI готовит правильные поля: диаметр + высота.");
  }
  if (roomShape === "Г-образная" || roomShape === "сложная") {
    uiWarnings.push("Эта форма не должна считаться по прямоугольной формуле. Для неё нужен отдельный контракт.");
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Stage 7.1 · UI Contract Restoration</p>
          <h1>AI-консультант по ремонту помещения</h1>
          <p className="hero-text">
            Интерфейс восстановлен под production-логику: тип помещения, зона,
            форма, размеры, проёмы, покрытия, инженерные блоки и требования пользователя.
          </p>
        </div>

        <div className="pipeline-card">
          <strong>Domain pipeline</strong>
          <span>room type → zone → shape → dimensions</span>
          <span>surfaces → engineering → RAG → answer</span>
        </div>
      </header>

      <div className="layout">
        <form className="form-panel" onSubmit={(event) => event.preventDefault()}>
          <Section
            title="1. Помещение"
            subtitle="Разделяем тип помещения, зону эксплуатации и геометрию."
          >
            <div className="grid two">
              <SelectField
                label="Тип помещения"
                value={roomType}
                options={ROOM_TYPE_OPTIONS}
                onChange={updateRoomType}
              />

              <SelectField
                label="Зона эксплуатации"
                value={zoneType}
                options={ZONE_OPTIONS}
                onChange={(value) => {
                  setZoneType(value);
                  setZoneChangedManually(value !== defaultZone);
                }}
                hint={`Рекомендуемая зона: ${defaultZone}`}
              />

              <SelectField
                label="Форма помещения"
                value={roomShape}
                options={SHAPE_OPTIONS}
                onChange={setRoomShape}
              />
            </div>

            {uiWarnings.length ? (
              <div className="warning-box">
                {uiWarnings.map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
              </div>
            ) : null}
          </Section>

          <Section title="2. Размеры" subtitle="Набор полей меняется по форме помещения.">
            {roomShape === "прямоугольная" ? (
              <div className="grid three">
                <NumberField
                  label="Длина, м"
                  value={dimensions.length}
                  onChange={(value) => updateDimension("length", value)}
                />
                <NumberField
                  label="Ширина, м"
                  value={dimensions.width}
                  onChange={(value) => updateDimension("width", value)}
                />
                <NumberField
                  label="Высота, м"
                  value={dimensions.height}
                  onChange={(value) => updateDimension("height", value)}
                />
              </div>
            ) : null}

            {roomShape === "круглая" ? (
              <div className="grid two">
                <NumberField
                  label="Диаметр, м"
                  value={dimensions.diameter}
                  onChange={(value) => updateDimension("diameter", value)}
                />
                <NumberField
                  label="Высота, м"
                  value={dimensions.height}
                  onChange={(value) => updateDimension("height", value)}
                />
              </div>
            ) : null}

            {roomShape === "Г-образная" ? (
              <div className="unsupported-box">
                Г-образная форма зафиксирована как future. Нельзя считать её через
                длина × ширина. Следующий backend-этап должен добавить расчёт по сегментам.
              </div>
            ) : null}

            {roomShape === "сложная" ? (
              <div className="grid three">
                <NumberField
                  label="Площадь пола вручную, м²"
                  value={dimensions.manual_floor_area}
                  onChange={(value) => updateDimension("manual_floor_area", value)}
                />
                <NumberField
                  label="Периметр вручную, м"
                  value={dimensions.manual_perimeter}
                  onChange={(value) => updateDimension("manual_perimeter", value)}
                />
                <NumberField
                  label="Высота, м"
                  value={dimensions.height}
                  onChange={(value) => updateDimension("height", value)}
                />
              </div>
            ) : null}
          </Section>

          <Section title="3. Проёмы" subtitle="Ввод через UI вместо обязательного JSON.">
            <div className="grid four">
              <SelectField
                label="Тип проёма"
                value={draftOpening.type}
                options={OPENING_TYPES}
                onChange={(value) => setDraftOpening((current) => ({ ...current, type: value }))}
              />
              <NumberField
                label="Ширина, м"
                value={draftOpening.width}
                onChange={(value) => setDraftOpening((current) => ({ ...current, width: value }))}
              />
              <NumberField
                label="Высота, м"
                value={draftOpening.height}
                onChange={(value) => setDraftOpening((current) => ({ ...current, height: value }))}
              />
              <NumberField
                label="Количество"
                value={draftOpening.count}
                onChange={(value) => setDraftOpening((current) => ({ ...current, count: value }))}
                step="1"
              />
            </div>

            <button type="button" className="secondary-button" onClick={addOpening}>
              Добавить проём
            </button>

            <div className="opening-list">
              {openings.map((opening, index) => (
                <div className="opening-item" key={`${opening.type}-${index}`}>
                  <span>
                    {opening.type}: {opening.width} × {opening.height} м · {opening.count} шт.
                  </span>
                  <button type="button" onClick={() => removeOpening(index)}>
                    удалить
                  </button>
                </div>
              ))}
            </div>
          </Section>

          <Section title="4. Поверхности" subtitle="Пол, стены и потолок имеют отдельные свойства.">
            <div className="surface-card">
              <h3>Пол</h3>
              <div className="grid two">
                <SelectField
                  label="Основание пола"
                  value={surfaceSpecs.floor.current_base}
                  options={BASE_OPTIONS}
                  onChange={(value) => updateSurface("floor", "current_base", value)}
                />
                <SelectField
                  label="Покрытие пола"
                  value={surfaceSpecs.floor.covering}
                  options={FLOOR_COVERINGS}
                  onChange={(value) => updateSurface("floor", "covering", value)}
                />
                <SelectField
                  label="Нужно выравнивание"
                  value={surfaceSpecs.floor.needs_leveling}
                  options={["yes", "no", "unknown"]}
                  onChange={(value) => updateSurface("floor", "needs_leveling", value)}
                />
                <label className="checkbox-line">
                  <input
                    type="checkbox"
                    checked={surfaceSpecs.floor.needs_demolition}
                    onChange={(event) =>
                      updateSurface("floor", "needs_demolition", event.target.checked)
                    }
                  />
                  Нужен демонтаж пола
                </label>
              </div>
            </div>

            <div className="surface-card">
              <h3>Стены</h3>
              <div className="grid two">
                <SelectField
                  label="Основание стен"
                  value={surfaceSpecs.walls.current_base}
                  options={BASE_OPTIONS}
                  onChange={(value) => updateSurface("walls", "current_base", value)}
                />
                <SelectField
                  label="Покрытие стен"
                  value={surfaceSpecs.walls.covering}
                  options={WALL_COVERINGS}
                  onChange={(value) => updateSurface("walls", "covering", value)}
                />
                <SelectField
                  label="Нужно выравнивание"
                  value={surfaceSpecs.walls.needs_leveling}
                  options={["yes", "no", "unknown"]}
                  onChange={(value) => updateSurface("walls", "needs_leveling", value)}
                />
                <label className="checkbox-line">
                  <input
                    type="checkbox"
                    checked={surfaceSpecs.walls.needs_demolition}
                    onChange={(event) =>
                      updateSurface("walls", "needs_demolition", event.target.checked)
                    }
                  />
                  Нужен демонтаж стен
                </label>
              </div>
            </div>

            <div className="surface-card">
              <h3>Потолок</h3>
              <div className="grid two">
                <SelectField
                  label="Основание потолка"
                  value={surfaceSpecs.ceiling.current_base}
                  options={BASE_OPTIONS}
                  onChange={(value) => updateSurface("ceiling", "current_base", value)}
                />
                <SelectField
                  label="Покрытие потолка"
                  value={surfaceSpecs.ceiling.covering}
                  options={CEILING_COVERINGS}
                  onChange={(value) => updateSurface("ceiling", "covering", value)}
                />
                <SelectField
                  label="Точки освещения"
                  value={surfaceSpecs.ceiling.has_lighting_points}
                  options={["yes", "no", "unknown"]}
                  onChange={(value) => updateSurface("ceiling", "has_lighting_points", value)}
                />
                <SelectField
                  label="Нужно выравнивание"
                  value={surfaceSpecs.ceiling.needs_leveling}
                  options={["yes", "no", "unknown"]}
                  onChange={(value) => updateSurface("ceiling", "needs_leveling", value)}
                />
              </div>
            </div>
          </Section>

          <Section title="5. Контекст ремонта">
            <div className="grid three">
              <SelectField
                label="Состояние помещения"
                value={repairContext.property_condition}
                options={PROPERTY_CONDITIONS}
                onChange={(value) =>
                  setRepairContext((current) => ({
                    ...current,
                    property_condition: value,
                  }))
                }
              />
              <SelectField
                label="Уровень ремонта"
                value={repairContext.repair_level}
                options={REPAIR_LEVELS}
                onChange={(value) =>
                  setRepairContext((current) => ({ ...current, repair_level: value }))
                }
              />
              <label className="checkbox-line top-space">
                <input
                  type="checkbox"
                  checked={repairContext.has_existing_finish}
                  onChange={(event) =>
                    setRepairContext((current) => ({
                      ...current,
                      has_existing_finish: event.target.checked,
                    }))
                  }
                />
                Есть существующая отделка
              </label>
            </div>
          </Section>

          <Section title="6. Инженерные системы">
            <div className="grid three">
              {Object.entries(engineering).map(([key, value]) => (
                <SelectField
                  key={key}
                  label={key}
                  value={value}
                  options={YES_NO_UNKNOWN}
                  onChange={(nextValue) => updateEngineering(key, nextValue)}
                />
              ))}
            </div>
          </Section>

          <Section title="7. Требования пользователя">
            <div className="grid two">
              <SelectField
                label="Бюджет"
                value={userGoals.budget_level}
                options={BUDGET_LEVELS}
                onChange={(value) =>
                  setUserGoals((current) => ({ ...current, budget_level: value }))
                }
              />
              <TextField
                label="Дополнительные пожелания"
                value={userGoals.notes}
                onChange={(value) => setUserGoals((current) => ({ ...current, notes: value }))}
              />
            </div>

            <div className="chips">
              {PRIORITIES.map((priority) => (
                <label
                  className={`chip ${userGoals.priority.includes(priority) ? "selected" : ""}`}
                  key={priority}
                >
                  <input
                    type="checkbox"
                    checked={userGoals.priority.includes(priority)}
                    onChange={() => togglePriority(priority)}
                  />
                  {priority}
                </label>
              ))}
            </div>
          </Section>

          <Section title="8. Вопрос консультанту">
            <textarea
              value={userQuestion}
              onChange={(event) => setUserQuestion(event.target.value)}
              rows={4}
            />

            <button
              type="button"
              className="primary-button"
              onClick={submitConsultation}
              disabled={isLoading}
            >
              {isLoading ? "Формируется консультация..." : "Сформировать консультацию"}
            </button>

            {error ? <div className="error-box">{error}</div> : null}
          </Section>
        </form>

        <aside className="result-panel">
          <Section
            title="Результат консультанта"
            subtitle="Backend принимает Stage 7.2 contract: прямоугольная и круглая геометрия считаются разными формулами."
          >
            {result ? (
              <>
                <div className="status-line">Ответ сформирован</div>

                <div className="metrics-grid">
                  <div>
                    <span>Площадь пола</span>
                    <strong>
                      {roundNumber(
                        getMetric(resultSource, ["floor_area", "floorArea", "s_floor"])
                      )}{" "}
                      м²
                    </strong>
                  </div>
                  <div>
                    <span>Площадь потолка</span>
                    <strong>
                      {roundNumber(
                        getMetric(resultSource, ["ceiling_area", "ceilingArea", "s_ceiling"])
                      )}{" "}
                      м²
                    </strong>
                  </div>
                  <div>
                    <span>Периметр</span>
                    <strong>
                      {roundNumber(getMetric(resultSource, ["perimeter", "p"]))} м
                    </strong>
                  </div>
                  <div>
                    <span>Стены чистая</span>
                    <strong>
                      {roundNumber(
                        getMetric(resultSource, [
                          "walls_net_area",
                          "wall_area_net",
                          "walls_clean",
                          "clean_wall_area",
                        ])
                      )}{" "}
                      м²
                    </strong>
                  </div>
                  <div>
                    <span>Проёмы</span>
                    <strong>
                      {roundNumber(
                        getMetric(resultSource, [
                          "openings_area",
                          "opening_area",
                          "openingsArea",
                        ])
                      )}{" "}
                      м²
                    </strong>
                  </div>
                  <div>
                    <span>Плинтус</span>
                    <strong>
                      {roundNumber(getMetric(resultSource, ["plinth", "baseboard", "perimeter"]))}{" "}
                      м.пог.
                    </strong>
                  </div>
                </div>

                <div className="answer-box">
                  <h3>Ответ</h3>
                  <pre>{answer}</pre>
                </div>

                {Array.isArray(ragFragments) && ragFragments.length ? (
                  <details className="rag-details">
                    <summary>Найденные RAG-фрагменты</summary>
                    <pre>{JSON.stringify(ragFragments, null, 2)}</pre>
                  </details>
                ) : null}
              </>
            ) : (
              <div className="empty-result">
                <p>
                  После запуска здесь появятся расчётные показатели и консультация.
                </p>
              </div>
            )}
          </Section>

          <Section title="Payload preview" subtitle="Stage 7.2 contract, который отправляется в backend.">
            <pre className="payload-preview">{JSON.stringify(payload, null, 2)}</pre>
          </Section>
        </aside>
      </div>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
