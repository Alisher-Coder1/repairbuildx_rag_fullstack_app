import React, { useMemo, useState, useEffect } from "react";
import WizardSection from "../../components/WizardSection";
import {
  API_BASE, WIZARD_STEP_FLOW, ROOM_TYPE_OPTIONS, ZONE_OPTIONS, SHAPE_OPTIONS,
  GEOMETRY_MODES, OPENING_TYPES, YES_NO_UNKNOWN, REPAIR_LEVELS, PROPERTY_CONDITIONS,
  BUDGET_LEVELS, PRIORITIES, FLOOR_COVERINGS, WALL_COVERINGS, CEILING_COVERINGS,
  BASE_OPTIONS, ROOM_TO_ZONE, WALL_SEGMENT_TYPES, CORNER_TYPES
} from "./data/options";
import { asNumber, optionalNumber, roundNumber, getMetric, getDefaultEngineering } from "../../utils/helpers";
import RoomContextStep from "./steps/RoomContextStep";
import GeometryStep from "./steps/GeometryStep";
import RoughEngineeringStep from "./steps/RoughEngineeringStep";
import PrefinishStep from "./steps/PrefinishStep";
import FinishStep from "./steps/FinishStep";
import ConsultationStep from "./steps/ConsultationStep";

export default function RepairWizard() {
  const [activeWizardStep, setActiveWizardStep] = useState("room");
  const [completedWizardSteps, setCompletedWizardSteps] = useState(() => new Set());

  useEffect(() => {
    const handler = (event) => {
      const key = event?.detail?.key || event?.detail;
      if (key) {
        setActiveWizardStep(String(key));
      }
    };

    window.addEventListener("repair-wizard-step", handler);
    return () => window.removeEventListener("repair-wizard-step", handler);
  }, []);

  useEffect(() => {
    const target = document.querySelector(`section.section-card[data-step-key="${activeWizardStep}"]`);
    if (target) {
      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [activeWizardStep]);

  const [roomType, setRoomType] = useState("кухня");
  const [zoneType, setZoneType] = useState(ROOM_TO_ZONE["кухня"]);
  const [zoneChangedManually, setZoneChangedManually] = useState(false);
  const [roomShape, setRoomShape] = useState("прямоугольная");
  const [geometryMode, setGeometryMode] = useState("measured_totals");

  const [dimensions, setDimensions] = useState({
    length: "5",
    width: "4",
    height: "2.8",
    diameter: "6",
    manual_floor_area: "20",
    manual_ceiling_area: "",
    use_floor_area_for_ceiling: true,
    manual_perimeter: "18",
    manual_wall_area: "",
    manual_baseboard_length: "",
    geometry_notes: "Нестандартный контур: использовать измеренную площадь, сегменты стен и проёмы.",
  });

  const [openings, setOpenings] = useState([
    { type: "дверь", width: "0.9", height: "2.1", count: "1" },
    { type: "окно", width: "1.5", height: "1.4", count: "1" },
  ]);
  const [draftOpening, setDraftOpening] = useState({ type: "дверь", width: "0.9", height: "2.1", count: "1" });

  const [wallSegments, setWallSegments] = useState([
    { id: "W1", type: "straight", length: "3.2", height: "", baseboard_required: true, finish_required: true, corner_after_type: "inner", angle_deg: "90", notes: "" },
    { id: "W2", type: "straight", length: "4.1", height: "", baseboard_required: true, finish_required: true, corner_after_type: "outer", angle_deg: "90", notes: "" },
    { id: "W3", type: "wave", length: "2.4", height: "", baseboard_required: true, finish_required: true, corner_after_type: "rounded", angle_deg: "", notes: "Фактическая длина по кривой стене." },
  ]);
  const [draftWallSegment, setDraftWallSegment] = useState({ id: "W4", type: "straight", length: "2", height: "", baseboard_required: true, finish_required: true, corner_after_type: "inner", angle_deg: "90", notes: "" });

  const [surfaceSpecs, setSurfaceSpecs] = useState({
    floor: { current_base: "бетонная стяжка", covering: "ламинат", needs_demolition: false, needs_leveling: "unknown" },
    walls: { current_base: "штукатурка", covering: "краска", needs_demolition: false, needs_leveling: "unknown" },
    ceiling: { current_base: "бетон", covering: "краска", has_lighting_points: "unknown", needs_leveling: "unknown" },
  });

  const [repairContext, setRepairContext] = useState({
    property_condition: "черновая отделка",
    repair_level: "капитальный",
    user_comment: "",
    has_existing_finish: false
  });

  const [engineering, setEngineering] = useState(getDefaultEngineering("кухня"));
  const [selectedObjects, setSelectedObjects] = useState([]);

  const [userGoals, setUserGoals] = useState({ budget_level: "средний", priority: ["долговечность", "простота ухода"], notes: "Нужен практичный ремонт без лишних дорогих решений." });
  const [userQuestion, setUserQuestion] = useState("Подготовь базовую консультацию и расчёт для ремонта помещения.");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const openWizardStep = (targetKey) => {
    if (!WIZARD_STEP_FLOW.includes(targetKey)) return;
    setActiveWizardStep(targetKey);
  };

  const completeWizardStep = (currentKey) => {
    const currentIndex = WIZARD_STEP_FLOW.indexOf(currentKey);
    const nextKey = WIZARD_STEP_FLOW[currentIndex + 1] || currentKey;

    setCompletedWizardSteps((previous) => {
      const next = new Set(previous);
      next.add(currentKey);
      return next;
    });

    setActiveWizardStep(nextKey);
  };

  const wizardSectionProps = (key) => ({
    stepKey: key,
    activeStep: activeWizardStep,
    completed: completedWizardSteps.has(key),
    onOpen: openWizardStep,
    onComplete: completeWizardStep,
  });

  const defaultZone = ROOM_TO_ZONE[roomType] || "сухая зона";

  const normalizedDimensions = useMemo(() => {
    if (roomShape === "прямоугольная") {
      return { length: asNumber(dimensions.length), width: asNumber(dimensions.width), height: asNumber(dimensions.height) };
    }
    if (roomShape === "круглая") {
      return { diameter: asNumber(dimensions.diameter), height: asNumber(dimensions.height) };
    }
    return {
      manual_floor_area: asNumber(dimensions.manual_floor_area),
      manual_ceiling_area: dimensions.use_floor_area_for_ceiling ? null : optionalNumber(dimensions.manual_ceiling_area),
      use_floor_area_for_ceiling: Boolean(dimensions.use_floor_area_for_ceiling),
      manual_perimeter: geometryMode === "measured_totals" ? asNumber(dimensions.manual_perimeter) : null,
      height: asNumber(dimensions.height),
      manual_wall_area: optionalNumber(dimensions.manual_wall_area),
      manual_baseboard_length: optionalNumber(dimensions.manual_baseboard_length),
      geometry_notes: dimensions.geometry_notes,
    };
  }, [dimensions, roomShape, geometryMode]);

  const normalizedOpenings = useMemo(() => openings.map((o) => ({
    type: o.type,
    width: asNumber(o.width),
    height: asNumber(o.height),
    count: Math.max(1, Math.floor(asNumber(o.count) || 1)),
  })).filter((o) => o.width > 0 && o.height > 0), [openings]);

  const normalizedWallSegments = useMemo(() => wallSegments.map((s, index) => ({
    id: s.id || `W${index + 1}`,
    type: s.type,
    length: asNumber(s.length),
    height: optionalNumber(s.height),
    baseboard_required: Boolean(s.baseboard_required),
    finish_required: Boolean(s.finish_required),
    corner_after_type: s.corner_after_type,
    angle_deg: optionalNumber(s.angle_deg),
    notes: s.notes || "",
  })).filter((s) => s.length > 0), [wallSegments]);

  const payload = useMemo(() => ({
    room_type: roomType,
    zone_type: zoneType,
    room_shape: roomShape,
    geometry_mode: roomShape === "сложная" ? geometryMode : null,
    dimensions: normalizedDimensions,
    openings: normalizedOpenings,
    wall_segments: roomShape === "сложная" && geometryMode === "wall_segments" ? normalizedWallSegments : [],
    selected_objects: selectedObjects,
    surface_specs: surfaceSpecs,
    repair_context: repairContext,
    engineering,
    user_goals: userGoals,
    user_question: userQuestion,
  }), [roomType, zoneType, roomShape, geometryMode, normalizedDimensions, normalizedOpenings, normalizedWallSegments, surfaceSpecs, repairContext, engineering, userGoals, userQuestion, selectedObjects]);

  const legacyPayload = useMemo(() => ({
    ...payload,
    shape: roomShape,
    zone: zoneType,
    length: normalizedDimensions.length ?? normalizedDimensions.diameter ?? normalizedDimensions.manual_floor_area ?? 0,
    width: normalizedDimensions.width ?? normalizedDimensions.diameter ?? normalizedDimensions.manual_perimeter ?? 0,
    height: normalizedDimensions.height ?? 0,
    floor_covering: surfaceSpecs.floor.covering,
    wall_covering: surfaceSpecs.walls.covering,
    ceiling_covering: surfaceSpecs.ceiling.covering,
    floor: surfaceSpecs.floor.covering,
    walls: surfaceSpecs.walls.covering,
    ceiling: surfaceSpecs.ceiling.covering,
    question: userQuestion,
  }), [payload, roomShape, zoneType, normalizedDimensions, surfaceSpecs, userQuestion]);

  function updateRoomType(value) {
    setRoomType(value);
    setZoneType(ROOM_TO_ZONE[value] || "сухая зона");
    setZoneChangedManually(false);
    setEngineering(getDefaultEngineering(value));
  }

  function updateDimension(key, value) {
    setDimensions((current) => ({ ...current, [key]: value }));
  }

  function updateSurface(surface, key, value) {
    setSurfaceSpecs((current) => ({ ...current, [surface]: { ...current[surface], [key]: value } }));
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
    setOpenings((current) => current.filter((_, i) => i !== index));
  }

  function addWallSegment() {
    if (asNumber(draftWallSegment.length) <= 0) {
      setError("Длина сегмента стены должна быть больше 0.");
      return;
    }
    setWallSegments((current) => [...current, draftWallSegment]);
    setDraftWallSegment((current) => ({ ...current, id: `W${wallSegments.length + 2}`, length: "2", notes: "" }));
    setError("");
  }

  function removeWallSegment(index) {
    setWallSegments((current) => current.filter((_, i) => i !== index));
  }


  function togglePriority(priority) {
    setUserGoals((current) => ({
      ...current,
      priority: current.priority.includes(priority)
        ? current.priority.filter((item) => item !== priority)
        : [...current.priority, priority],
    }));
  }

  async function submitConsultation() {
    setError("");
    setResult(null);
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/consult`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(legacyPayload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}`);
      }

      setResult(await response.json());
    } catch (fetchError) {
      setError(fetchError?.message || "Не удалось получить ответ от backend.");
    } finally {
      setIsLoading(false);
    }
  }

  const resultSource = result?.metrics || result?.calculation || result || {};
  const answer = result?.answer || result?.consultant_answer || result?.response || result?.message || (result ? JSON.stringify(result, null, 2) : "");
  const ragFragments = result?.rag_fragments || result?.found_chunks || result?.context_chunks || result?.sources || result?.context || [];

  const uiWarnings = [];
  if (zoneChangedManually && zoneType !== defaultZone) uiWarnings.push("Зона изменена вручную. Проверьте соответствие условиям эксплуатации.");
  if (roomShape === "сложная" && geometryMode === "measured_totals") uiWarnings.push("Сложная форма считается по общим замерам. Если стены разной длины/высоты или есть кривые участки, лучше использовать режим сегментов стен.");
  if (roomShape === "сложная" && geometryMode === "wall_segments") uiWarnings.push("В режиме сегментов кривые/волнистые стены вводятся по фактически измеренной длине по контуру.");

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Stage 7.5 UI · API contract stage7.2.3</p>
          <h1>AI-консультант по ремонту помещения</h1>
          <p className="hero-text">Интерфейс восстановлен под production-логику: тип помещения, зона, форма, размеры, проёмы, покрытия, инженерные блоки и требования пользователя.</p>
        </div>
        <div className="pipeline-card">
          <strong>Цепочка расчёта</strong>
          <span>помещение и контекст → геометрия → черновая инженерия</span>
          <span>предчистовые требования → чистовые покрытия → консультация</span>
        </div>
      </header>

      <div className="layout">
        <form className="form-panel" onSubmit={(e) => e.preventDefault()}>
          <WizardSection {...wizardSectionProps("room")} title="1. Помещение и контекст" subtitle="Тип помещения, зона эксплуатации и исходное состояние ремонта задаются в одном первом шаге.">
            <RoomContextStep
              roomType={roomType}
              setRoomType={updateRoomType}
              zoneType={zoneType}
              setZoneType={(value) => { setZoneType(value); setZoneChangedManually(value !== defaultZone); }}
              roomShape={roomShape}
              setRoomShape={setRoomShape}
              repairContext={repairContext}
              setRepairContext={setRepairContext}
              uiWarnings={uiWarnings}
              ROOM_TYPE_OPTIONS={ROOM_TYPE_OPTIONS}
              ZONE_OPTIONS={ZONE_OPTIONS}
              SHAPE_OPTIONS={SHAPE_OPTIONS}
              PROPERTY_CONDITIONS={PROPERTY_CONDITIONS}
              REPAIR_LEVELS={REPAIR_LEVELS}
              defaultZone={defaultZone}
            />
          </WizardSection>

          <WizardSection {...wizardSectionProps("geometry")} title="2. Геометрия" subtitle="Площадь, периметр, высота, сложный контур и проёмы формируют расчётную базу.">
            <GeometryStep
              roomShape={roomShape}
              dimensions={dimensions}
              updateDimension={updateDimension}
              geometryMode={geometryMode}
              setGeometryMode={setGeometryMode}
              openings={openings}
              draftOpening={draftOpening}
              setDraftOpening={setDraftOpening}
              addOpening={addOpening}
              removeOpening={removeOpening}
              wallSegments={wallSegments}
              draftWallSegment={draftWallSegment}
              setDraftWallSegment={setDraftWallSegment}
              addWallSegment={addWallSegment}
              removeWallSegment={removeWallSegment}
              GEOMETRY_MODES={GEOMETRY_MODES}
              OPENING_TYPES={OPENING_TYPES}
              WALL_SEGMENT_TYPES={WALL_SEGMENT_TYPES}
              CORNER_TYPES={CORNER_TYPES}
            />
          </WizardSection>

          <WizardSection {...wizardSectionProps("rough")} title="3. Черновой этап / инженерная подготовка" subtitle="Скрытые работы: электрика, сантехника, вентиляция, отопление, гидроизоляция и выводы до закрытия отделкой.">
            <RoughEngineeringStep
              engineering={engineering}
              updateEngineering={updateEngineering}
              YES_NO_UNKNOWN={YES_NO_UNKNOWN}
            />
          </WizardSection>

          <WizardSection {...wizardSectionProps("prefinish")} title="4. Предчистовой этап / требования к качеству" subtitle="Уточняет требования к качеству, долговечности, скорости, стоимости, влагостойкости, звукоизоляции и подготовке поверхности.">
            <PrefinishStep
              userGoals={userGoals}
              setUserGoals={setUserGoals}
              togglePriority={togglePriority}
              BUDGET_LEVELS={BUDGET_LEVELS}
              PRIORITIES={PRIORITIES}
            />
          </WizardSection>

          <WizardSection {...wizardSectionProps("finish")} title="5. Чистовой этап / покрытия" subtitle="Выбор видимых покрытий пола, стен и потолка. Покрытие определяет финишные материалы, операции и требования к основанию.">
            <FinishStep
              surfaceSpecs={surfaceSpecs}
              updateSurface={updateSurface}
              FLOOR_COVERINGS={FLOOR_COVERINGS}
              WALL_COVERINGS={WALL_COVERINGS}
              CEILING_COVERINGS={CEILING_COVERINGS}
              BASE_OPTIONS={BASE_OPTIONS}
            />
          </WizardSection>

          <WizardSection {...wizardSectionProps("result")} title="6. Консультация" subtitle="После заполнения этапов пользователь получает расчёт, консультацию, этапы работ и возможность продолжить диалог.">
            <ConsultationStep
              userQuestion={userQuestion}
              setUserQuestion={setUserQuestion}
              submitConsultation={submitConsultation}
              isLoading={isLoading}
              error={error}
            />
          </WizardSection>
        </form>

        <aside className="result-panel">
          <WizardSection title="Результат консультанта" subtitle="Backend принимает Stage 7.2.3 contract: простые формы считаются формулами, сложные — по общим замерам или сегментам стен.">
            {result ? (
              <>
                <div className="status-line">Ответ сформирован</div>
                <div className="metrics-grid">
                  <div><span>Площадь пола</span><strong>{roundNumber(getMetric(resultSource, ["floor_area", "floorArea", "s_floor"]))} м²</strong></div>
                  <div><span>Площадь потолка</span><strong>{roundNumber(getMetric(resultSource, ["ceiling_area", "ceilingArea", "s_ceiling"]))} м²</strong></div>
                  <div><span>Периметр</span><strong>{roundNumber(getMetric(resultSource, ["perimeter", "p"]))} м</strong></div>
                  <div><span>Стены чистая</span><strong>{roundNumber(getMetric(resultSource, ["walls_net_area", "wall_area_net", "walls_clean", "clean_wall_area"]))} м²</strong></div>
                  <div><span>Проёмы</span><strong>{roundNumber(getMetric(resultSource, ["openings_area", "opening_area", "openingsArea"]))} м²</strong></div>
                  <div><span>Плинтус</span><strong>{roundNumber(getMetric(resultSource, ["plinth", "baseboard", "perimeter"]))} м.пог.</strong></div>
                </div>
                <div className="answer-box"><h3>Консультация</h3><pre>{answer}</pre></div>
                {Array.isArray(ragFragments) && ragFragments.length ? <details hidden className="rag-details"><summary>Технические источники / RAG-фрагменты</summary><pre>{JSON.stringify(ragFragments, null, 2)}</pre></details> : null}
              </>
            ) : <div className="empty-result"><p>После запуска здесь появятся расчётные показатели и консультация.</p></div>}
          </WizardSection>

          <WizardSection title="Технические данные" subtitle="Stage 7.2.3 contract, который отправляется в backend.">
            <pre className="payload-preview">{JSON.stringify(payload, null, 2)}</pre>
          </WizardSection>
        </aside>
      </div>
    </main>
  );
}

