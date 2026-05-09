
import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const roomTypes = [
  "РєСѓС…РЅСЏ", "РІР°РЅРЅР°СЏ", "СЃР°РЅСѓР·РµР»", "СЃРїР°Р»СЊРЅСЏ", "РіРѕСЃС‚РёРЅР°СЏ", "РєРѕСЂРёРґРѕСЂ", "РїСЂРёС…РѕР¶Р°СЏ",
  "РґРµС‚СЃРєР°СЏ", "РєР°Р±РёРЅРµС‚", "Р±Р°Р»РєРѕРЅ", "Р»РѕРґР¶РёСЏ", "РєР»Р°РґРѕРІР°СЏ", "РіР°СЂРґРµСЂРѕР±РЅР°СЏ", "С‚РµС…РЅРёС‡РµСЃРєРѕРµ РїРѕРјРµС‰РµРЅРёРµ"
];

const roomToZone = {
  РєСѓС…РЅСЏ: "РєСѓС…РѕРЅРЅР°СЏ Р·РѕРЅР°",
  РІР°РЅРЅР°СЏ: "РІР»Р°Р¶РЅР°СЏ Р·РѕРЅР°",
  СЃР°РЅСѓР·РµР»: "РІР»Р°Р¶РЅР°СЏ Р·РѕРЅР°",
  СЃРїР°Р»СЊРЅСЏ: "СЃСѓС…Р°СЏ Р·РѕРЅР°",
  РіРѕСЃС‚РёРЅР°СЏ: "СЃСѓС…Р°СЏ Р·РѕРЅР°",
  РґРµС‚СЃРєР°СЏ: "СЃСѓС…Р°СЏ Р·РѕРЅР°",
  РєР°Р±РёРЅРµС‚: "СЃСѓС…Р°СЏ Р·РѕРЅР°",
  РєРѕСЂРёРґРѕСЂ: "РїСЂРѕС…РѕРґРЅР°СЏ СЃСѓС…Р°СЏ Р·РѕРЅР°",
  РїСЂРёС…РѕР¶Р°СЏ: "РїСЂРѕС…РѕРґРЅР°СЏ СЃСѓС…Р°СЏ Р·РѕРЅР°",
  Р±Р°Р»РєРѕРЅ: "Р±Р°Р»РєРѕРЅРЅР°СЏ Р·РѕРЅР°",
  Р»РѕРґР¶РёСЏ: "Р±Р°Р»РєРѕРЅРЅР°СЏ Р·РѕРЅР°",
  РєР»Р°РґРѕРІР°СЏ: "СЃСѓС…Р°СЏ Р·РѕРЅР°",
  РіР°СЂРґРµСЂРѕР±РЅР°СЏ: "СЃСѓС…Р°СЏ Р·РѕРЅР°",
  "С‚РµС…РЅРёС‡РµСЃРєРѕРµ РїРѕРјРµС‰РµРЅРёРµ": "С‚РµС…РЅРёС‡РµСЃРєР°СЏ Р·РѕРЅР°"
};

const zones = ["СЃСѓС…Р°СЏ Р·РѕРЅР°", "РІР»Р°Р¶РЅР°СЏ Р·РѕРЅР°", "РєСѓС…РѕРЅРЅР°СЏ Р·РѕРЅР°", "РїСЂРѕС…РѕРґРЅР°СЏ СЃСѓС…Р°СЏ Р·РѕРЅР°", "Р±Р°Р»РєРѕРЅРЅР°СЏ Р·РѕРЅР°", "С‚РµС…РЅРёС‡РµСЃРєР°СЏ Р·РѕРЅР°"];
const shapes = ["РїСЂСЏРјРѕСѓРіРѕР»СЊРЅР°СЏ", "РєСЂСѓРіР»Р°СЏ", "Р“-РѕР±СЂР°Р·РЅР°СЏ", "СЃР»РѕР¶РЅР°СЏ"];
const openingTypes = ["РґРІРµСЂСЊ", "РѕРєРЅРѕ", "Р°СЂРєР°", "РЅРёС€Р°"];
const baseOptions = ["Р±РµС‚РѕРЅ", "Р±РµС‚РѕРЅРЅР°СЏ СЃС‚СЏР¶РєР°", "С€С‚СѓРєР°С‚СѓСЂРєР°", "РіРёРїСЃРѕРєР°СЂС‚РѕРЅ", "СЃС‚Р°СЂР°СЏ РѕС‚РґРµР»РєР°", "РїРѕСЃР»Рµ РґРµРјРѕРЅС‚Р°Р¶Р°", "unknown"];
const floorCoverings = ["Р»Р°РјРёРЅР°С‚", "РєРµСЂР°РјРѕРіСЂР°РЅРёС‚", "РєРµСЂР°РјРёС‡РµСЃРєР°СЏ РїР»РёС‚РєР°", "РЅР°Р»РёРІРЅРѕР№ РїРѕР»", "Р»РёРЅРѕР»РµСѓРј", "РёРЅР¶РµРЅРµСЂРЅР°СЏ РґРѕСЃРєР°", "РїР°СЂРєРµС‚", "unknown"];
const wallCoverings = ["РєСЂР°СЃРєР°", "РѕР±РѕРё", "РєРµСЂР°РјРёС‡РµСЃРєР°СЏ РїР»РёС‚РєР°", "РґРµРєРѕСЂР°С‚РёРІРЅР°СЏ С€С‚СѓРєР°С‚СѓСЂРєР°", "РїР°РЅРµР»Рё", "unknown"];
const ceilingCoverings = ["РєСЂР°СЃРєР°", "РїРѕР±РµР»РєР°", "РЅР°С‚СЏР¶РЅРѕР№ РїРѕС‚РѕР»РѕРє", "РіРёРїСЃРѕРєР°СЂС‚РѕРЅ", "РїР°РЅРµР»Рё", "unknown"];
const yesNoUnknown = ["yes", "no", "unknown", "auto"];
const propertyConditions = ["РЅРѕРІРѕСЃС‚СЂРѕР№РєР° Р±РµР· РѕС‚РґРµР»РєРё", "С‡РµСЂРЅРѕРІР°СЏ РѕС‚РґРµР»РєР°", "РїСЂРµРґС‡РёСЃС‚РѕРІР°СЏ РѕС‚РґРµР»РєР°", "СЃС‚Р°СЂР°СЏ РѕС‚РґРµР»РєР°", "РїРѕСЃР»Рµ РґРµРјРѕРЅС‚Р°Р¶Р°", "РЅРµРёР·РІРµСЃС‚РЅРѕ"];
const repairLevels = ["РєРѕСЃРјРµС‚РёС‡РµСЃРєРёР№", "РєР°РїРёС‚Р°Р»СЊРЅС‹Р№", "С‡Р°СЃС‚РёС‡РЅС‹Р№", "РїРѕРґ РєР»СЋС‡", "С‚РѕР»СЊРєРѕ СЂР°СЃС‡С‘С‚ РјР°С‚РµСЂРёР°Р»РѕРІ", "С‚РѕР»СЊРєРѕ РєРѕРЅСЃСѓР»СЊС‚Р°С†РёСЏ"];
const budgetLevels = ["СЌРєРѕРЅРѕРј", "СЃСЂРµРґРЅРёР№", "РїСЂРµРјРёСѓРј", "РЅРµ СѓРєР°Р·Р°РЅ"];
const priorities = ["РґРѕР»РіРѕРІРµС‡РЅРѕСЃС‚СЊ", "Р±С‹СЃС‚СЂРѕ", "РґРµС€РµРІРѕ", "РІР»Р°РіРѕСЃС‚РѕР№РєРѕСЃС‚СЊ", "Р·РІСѓРєРѕРёР·РѕР»СЏС†РёСЏ", "С‚РµРїР»РѕРёР·РѕР»СЏС†РёСЏ", "РїСЂРѕСЃС‚РѕС‚Р° СѓС…РѕРґР°", "РјРёРЅРёРјСѓРј СЃР»РѕР¶РЅС‹С… СЂР°Р±РѕС‚", "РІРёР·СѓР°Р»СЊРЅС‹Р№ РґРёР·Р°Р№РЅ"];

function n(value) {
  const num = Number(String(value).replace(",", "."));
  return Number.isFinite(num) ? num : 0;
}

function round(value) {
  const num = Number(value);
  return Number.isFinite(num) ? Math.round(num * 100) / 100 : "вЂ”";
}

function defaultEngineering(roomType) {
  if (roomType === "РІР°РЅРЅР°СЏ" || roomType === "СЃР°РЅСѓР·РµР»") {
    return {
      electrical_required: "unknown",
      plumbing_required: "auto",
      ventilation_required: "auto",
      heating_required: "unknown",
      waterproofing_required: "auto",
      hvac_required: "unknown"
    };
  }

  if (roomType === "РєСѓС…РЅСЏ") {
    return {
      electrical_required: "auto",
      plumbing_required: "auto",
      ventilation_required: "auto",
      heating_required: "unknown",
      waterproofing_required: "auto",
      hvac_required: "unknown"
    };
  }

  return {
    electrical_required: "unknown",
    plumbing_required: "unknown",
    ventilation_required: "unknown",
    heating_required: "unknown",
    waterproofing_required: "unknown",
    hvac_required: "unknown"
  };
}

function metric(source, names) {
  for (const name of names) {
    if (source && source[name] !== undefined && source[name] !== null) return source[name];
  }
  return undefined;
}

function Section({ title, subtitle, children }) {
  return (
    <section className="section-card">
      <div className="section-head">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
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
      {hint && <small>{hint}</small>}
    </label>
  );
}

function Select({ label, value, onChange, options, hint }) {
  return (
    <Field label={label} hint={hint}>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
    </Field>
  );
}

function NumberInput({ label, value, onChange, step = "0.01" }) {
  return (
    <Field label={label}>
      <input type="number" min="0" step={step} value={value} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}

function TextInput({ label, value, onChange, placeholder }) {
  return (
    <Field label={label}>
      <input type="text" value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}

function App() {
  const [roomType, setRoomType] = useState("РєСѓС…РЅСЏ");
  const [zoneType, setZoneType] = useState(roomToZone["РєСѓС…РЅСЏ"]);
  const [zoneChanged, setZoneChanged] = useState(false);
  const [roomShape, setRoomShape] = useState("РїСЂСЏРјРѕСѓРіРѕР»СЊРЅР°СЏ");
  const [dimensions, setDimensions] = useState({ length: "5", width: "4", height: "2.8", diameter: "6", manual_floor_area: "", manual_perimeter: "" });
  const [openings, setOpenings] = useState([
    { type: "РґРІРµСЂСЊ", width: "0.9", height: "2.1", count: "1" },
    { type: "РѕРєРЅРѕ", width: "1.5", height: "1.4", count: "1" }
  ]);
  const [draftOpening, setDraftOpening] = useState({ type: "РґРІРµСЂСЊ", width: "0.9", height: "2.1", count: "1" });

  const [surfaceSpecs, setSurfaceSpecs] = useState({
    floor: { current_base: "Р±РµС‚РѕРЅРЅР°СЏ СЃС‚СЏР¶РєР°", covering: "Р»Р°РјРёРЅР°С‚", needs_demolition: false, needs_leveling: "unknown" },
    walls: { current_base: "С€С‚СѓРєР°С‚СѓСЂРєР°", covering: "РєСЂР°СЃРєР°", needs_demolition: false, needs_leveling: "unknown" },
    ceiling: { current_base: "Р±РµС‚РѕРЅ", covering: "РєСЂР°СЃРєР°", has_lighting_points: "unknown", needs_leveling: "unknown" }
  });

  const [repairContext, setRepairContext] = useState({
    property_condition: "С‡РµСЂРЅРѕРІР°СЏ РѕС‚РґРµР»РєР°",
    repair_level: "РєР°РїРёС‚Р°Р»СЊРЅС‹Р№",
    has_existing_finish: false
  });

  const [engineering, setEngineering] = useState(defaultEngineering("РєСѓС…РЅСЏ"));
  const [userGoals, setUserGoals] = useState({
    budget_level: "СЃСЂРµРґРЅРёР№",
    priority: ["РґРѕР»РіРѕРІРµС‡РЅРѕСЃС‚СЊ", "РїСЂРѕСЃС‚РѕС‚Р° СѓС…РѕРґР°"],
    notes: "РќСѓР¶РµРЅ РїСЂР°РєС‚РёС‡РЅС‹Р№ СЂРµРјРѕРЅС‚ Р±РµР· Р»РёС€РЅРёС… РґРѕСЂРѕРіРёС… СЂРµС€РµРЅРёР№."
  });
  const [userQuestion, setUserQuestion] = useState("РџРѕРґРіРѕС‚РѕРІСЊ Р±Р°Р·РѕРІСѓСЋ РєРѕРЅСЃСѓР»СЊС‚Р°С†РёСЋ Рё СЂР°СЃС‡С‘С‚ РґР»СЏ СЂРµРјРѕРЅС‚Р° РїРѕРјРµС‰РµРЅРёСЏ.");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const defaultZone = roomToZone[roomType] || "СЃСѓС…Р°СЏ Р·РѕРЅР°";

  const normalizedDimensions = useMemo(() => {
    if (roomShape === "РїСЂСЏРјРѕСѓРіРѕР»СЊРЅР°СЏ") {
      return { length: n(dimensions.length), width: n(dimensions.width), height: n(dimensions.height) };
    }
    if (roomShape === "РєСЂСѓРіР»Р°СЏ") {
      return { diameter: n(dimensions.diameter), height: n(dimensions.height) };
    }
    if (roomShape === "СЃР»РѕР¶РЅР°СЏ") {
      return { manual_floor_area: n(dimensions.manual_floor_area), manual_perimeter: n(dimensions.manual_perimeter), height: n(dimensions.height) };
    }
    return { segments: [], height: n(dimensions.height) };
  }, [dimensions, roomShape]);

  const normalizedOpenings = useMemo(() => openings
    .map((item) => ({
      type: item.type,
      width: n(item.width),
      height: n(item.height),
      count: Math.max(1, Math.floor(n(item.count) || 1))
    }))
    .filter((item) => item.width > 0 && item.height > 0 && item.count > 0), [openings]);

  const payload = useMemo(() => ({
    room_type: roomType,
    zone_type: zoneType,
    room_shape: roomShape,
    dimensions: normalizedDimensions,
    openings: normalizedOpenings,
    surface_specs: surfaceSpecs,
    repair_context: repairContext,
    engineering,
    user_goals: userGoals,
    user_question: userQuestion
  }), [roomType, zoneType, roomShape, normalizedDimensions, normalizedOpenings, surfaceSpecs, repairContext, engineering, userGoals, userQuestion]);

  const legacyPayload = useMemo(() => ({
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
    question: userQuestion
  }), [payload, roomShape, zoneType, normalizedDimensions, surfaceSpecs, userQuestion]);

  function changeRoomType(value) {
    setRoomType(value);
    setZoneType(roomToZone[value] || "СЃСѓС…Р°СЏ Р·РѕРЅР°");
    setZoneChanged(false);
    setEngineering(defaultEngineering(value));
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
    if (n(draftOpening.width) <= 0 || n(draftOpening.height) <= 0) {
      setError("РЁРёСЂРёРЅР° Рё РІС‹СЃРѕС‚Р° РїСЂРѕС‘РјР° РґРѕР»Р¶РЅС‹ Р±С‹С‚СЊ Р±РѕР»СЊС€Рµ 0.");
      return;
    }
    setOpenings((current) => [...current, draftOpening]);
    setDraftOpening({ type: "РґРІРµСЂСЊ", width: "0.9", height: "2.1", count: "1" });
    setError("");
  }

  function removeOpening(index) {
    setOpenings((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  function togglePriority(priority) {
    setUserGoals((current) => ({
      ...current,
      priority: current.priority.includes(priority)
        ? current.priority.filter((item) => item !== priority)
        : [...current.priority, priority]
    }));
  }

  async function submit() {
    setError("");
    setResult(null);

    if (roomShape === "РєСЂСѓРіР»Р°СЏ") {
      setError("UI РґР»СЏ РєСЂСѓРіР»РѕР№ РєРѕРјРЅР°С‚С‹ РІРѕСЃСЃС‚Р°РЅРѕРІР»РµРЅ, РЅРѕ backend geometry engine Р±СѓРґРµС‚ РїРѕРґРєР»СЋС‡С‘РЅ СЃР»РµРґСѓСЋС‰РёРј С€Р°РіРѕРј. РќРµ РѕС‚РїСЂР°РІР»СЏРµРј РєСЂСѓРі РІ СЃС‚Р°СЂС‹Р№ СЂР°СЃС‡С‘С‚, С‡С‚РѕР±С‹ РЅРµ РїРѕР»СѓС‡РёС‚СЊ Р»РѕР¶РЅС‹Р№ СЂРµР·СѓР»СЊС‚Р°С‚.");
      return;
    }

    if (roomShape === "Р“-РѕР±СЂР°Р·РЅР°СЏ" || roomShape === "СЃР»РѕР¶РЅР°СЏ") {
      setError("Р­С‚Р° С„РѕСЂРјР° РїРѕРєР° РЅРµ РѕС‚РїСЂР°РІР»СЏРµС‚СЃСЏ РІ СЃС‚Р°СЂС‹Р№ backend. РќСѓР¶РµРЅ РѕС‚РґРµР»СЊРЅС‹Р№ backend-РєРѕРЅС‚СЂР°РєС‚ Рё geometry engine.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/consult`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(legacyPayload)
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}`);
      }

      setResult(await response.json());
    } catch (err) {
      setError(err?.message || "РќРµ СѓРґР°Р»РѕСЃСЊ РїРѕР»СѓС‡РёС‚СЊ РѕС‚РІРµС‚ РѕС‚ backend.");
    } finally {
      setLoading(false);
    }
  }

  const warnings = [];
  if (zoneChanged && zoneType !== defaultZone) warnings.push("Р—РѕРЅР° РёР·РјРµРЅРµРЅР° РІСЂСѓС‡РЅСѓСЋ. РџСЂРѕРІРµСЂСЊС‚Рµ, СЃРѕРѕС‚РІРµС‚СЃС‚РІСѓРµС‚ Р»Рё РѕРЅР° СѓСЃР»РѕРІРёСЏРј СЌРєСЃРїР»СѓР°С‚Р°С†РёРё.");
  if (roomShape === "РєСЂСѓРіР»Р°СЏ") warnings.push("РљСЂСѓРіР»Р°СЏ С„РѕСЂРјР° РїРѕРєР°Р·С‹РІР°РµС‚ РїСЂР°РІРёР»СЊРЅС‹Рµ РїРѕР»СЏ: РґРёР°РјРµС‚СЂ + РІС‹СЃРѕС‚Р°. Р Р°СЃС‡С‘С‚ Р±СѓРґРµС‚ РїРѕРґРєР»СЋС‡С‘РЅ РЅР° backend-С€Р°РіРµ.");
  if (roomShape === "Р“-РѕР±СЂР°Р·РЅР°СЏ" || roomShape === "СЃР»РѕР¶РЅР°СЏ") warnings.push("Р­С‚Р° С„РѕСЂРјР° РЅРµ РґРѕР»Р¶РЅР° СЃС‡РёС‚Р°С‚СЊСЃСЏ РїРѕ РїСЂСЏРјРѕСѓРіРѕР»СЊРЅРѕР№ С„РѕСЂРјСѓР»Рµ.");

  const resultSource = result?.metrics || result?.calculation || result?.calculations || result || {};
  const answer = result?.answer || result?.consultant_answer || result?.response || result?.message || (result ? JSON.stringify(result, null, 2) : "");

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Stage 7.1 В· UI Contract Restoration</p>
          <h1>AI-РєРѕРЅСЃСѓР»СЊС‚Р°РЅС‚ РїРѕ СЂРµРјРѕРЅС‚Сѓ РїРѕРјРµС‰РµРЅРёСЏ</h1>
          <p className="hero-text">РРЅС‚РµСЂС„РµР№СЃ РІРѕСЃСЃС‚Р°РЅРѕРІР»РµРЅ РїРѕРґ production-Р»РѕРіРёРєСѓ: С‚РёРї РїРѕРјРµС‰РµРЅРёСЏ, Р·РѕРЅР°, С„РѕСЂРјР°, СЂР°Р·РјРµСЂС‹, РїСЂРѕС‘РјС‹, РїРѕРєСЂС‹С‚РёСЏ, РёРЅР¶РµРЅРµСЂРЅС‹Рµ Р±Р»РѕРєРё Рё С‚СЂРµР±РѕРІР°РЅРёСЏ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ.</p>
        </div>
        <div className="pipeline-card">
          <strong>Domain pipeline</strong>
          <span>room type в†’ zone в†’ shape в†’ dimensions</span>
          <span>surfaces в†’ engineering в†’ RAG в†’ answer</span>
        </div>
      </header>

      <div className="layout">
        <form className="form-panel" onSubmit={(event) => event.preventDefault()}>
          <Section title="1. РџРѕРјРµС‰РµРЅРёРµ" subtitle="Р Р°Р·РґРµР»СЏРµРј С‚РёРї РїРѕРјРµС‰РµРЅРёСЏ, Р·РѕРЅСѓ СЌРєСЃРїР»СѓР°С‚Р°С†РёРё Рё РіРµРѕРјРµС‚СЂРёСЋ.">
            <div className="grid three">
              <Select label="РўРёРї РїРѕРјРµС‰РµРЅРёСЏ" value={roomType} options={roomTypes} onChange={changeRoomType} />
              <Select
                label="Р—РѕРЅР° СЌРєСЃРїР»СѓР°С‚Р°С†РёРё"
                value={zoneType}
                options={zones}
                hint={`Р РµРєРѕРјРµРЅРґСѓРµРјР°СЏ Р·РѕРЅР°: ${defaultZone}`}
                onChange={(value) => {
                  setZoneType(value);
                  setZoneChanged(value !== defaultZone);
                }}
              />
              <Select label="Р¤РѕСЂРјР° РїРѕРјРµС‰РµРЅРёСЏ" value={roomShape} options={shapes} onChange={setRoomShape} />
            </div>
            {warnings.length > 0 && <div className="warning-box">{warnings.map((warning) => <p key={warning}>{warning}</p>)}</div>}
          </Section>

          <Section title="2. Р Р°Р·РјРµСЂС‹" subtitle="РќР°Р±РѕСЂ РїРѕР»РµР№ РјРµРЅСЏРµС‚СЃСЏ РїРѕ С„РѕСЂРјРµ РїРѕРјРµС‰РµРЅРёСЏ.">
            {roomShape === "РїСЂСЏРјРѕСѓРіРѕР»СЊРЅР°СЏ" && (
              <div className="grid three">
                <NumberInput label="Р”Р»РёРЅР°, Рј" value={dimensions.length} onChange={(value) => updateDimension("length", value)} />
                <NumberInput label="РЁРёСЂРёРЅР°, Рј" value={dimensions.width} onChange={(value) => updateDimension("width", value)} />
                <NumberInput label="Р’С‹СЃРѕС‚Р°, Рј" value={dimensions.height} onChange={(value) => updateDimension("height", value)} />
              </div>
            )}
            {roomShape === "РєСЂСѓРіР»Р°СЏ" && (
              <div className="grid two">
                <NumberInput label="Р”РёР°РјРµС‚СЂ, Рј" value={dimensions.diameter} onChange={(value) => updateDimension("diameter", value)} />
                <NumberInput label="Р’С‹СЃРѕС‚Р°, Рј" value={dimensions.height} onChange={(value) => updateDimension("height", value)} />
              </div>
            )}
            {roomShape === "Р“-РѕР±СЂР°Р·РЅР°СЏ" && <div className="unsupported-box">Р“-РѕР±СЂР°Р·РЅР°СЏ С„РѕСЂРјР° Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅР° РєР°Рє future. РќРµР»СЊР·СЏ СЃС‡РёС‚Р°С‚СЊ РµС‘ С‡РµСЂРµР· РґР»РёРЅР° Г— С€РёСЂРёРЅР°.</div>}
            {roomShape === "СЃР»РѕР¶РЅР°СЏ" && (
              <div className="grid three">
                <NumberInput label="РџР»РѕС‰Р°РґСЊ РїРѕР»Р° РІСЂСѓС‡РЅСѓСЋ, РјВІ" value={dimensions.manual_floor_area} onChange={(value) => updateDimension("manual_floor_area", value)} />
                <NumberInput label="РџРµСЂРёРјРµС‚СЂ РІСЂСѓС‡РЅСѓСЋ, Рј" value={dimensions.manual_perimeter} onChange={(value) => updateDimension("manual_perimeter", value)} />
                <NumberInput label="Р’С‹СЃРѕС‚Р°, Рј" value={dimensions.height} onChange={(value) => updateDimension("height", value)} />
              </div>
            )}
          </Section>

          <Section title="3. РџСЂРѕС‘РјС‹" subtitle="Р’РІРѕРґ С‡РµСЂРµР· UI РІРјРµСЃС‚Рѕ РѕР±СЏР·Р°С‚РµР»СЊРЅРѕРіРѕ JSON.">
            <div className="grid four">
              <Select label="РўРёРї РїСЂРѕС‘РјР°" value={draftOpening.type} options={openingTypes} onChange={(value) => setDraftOpening((current) => ({ ...current, type: value }))} />
              <NumberInput label="РЁРёСЂРёРЅР°, Рј" value={draftOpening.width} onChange={(value) => setDraftOpening((current) => ({ ...current, width: value }))} />
              <NumberInput label="Р’С‹СЃРѕС‚Р°, Рј" value={draftOpening.height} onChange={(value) => setDraftOpening((current) => ({ ...current, height: value }))} />
              <NumberInput label="РљРѕР»РёС‡РµСЃС‚РІРѕ" value={draftOpening.count} step="1" onChange={(value) => setDraftOpening((current) => ({ ...current, count: value }))} />
            </div>
            <button className="secondary-button" type="button" onClick={addOpening}>Р”РѕР±Р°РІРёС‚СЊ РїСЂРѕС‘Рј</button>
            <div className="opening-list">
              {openings.map((opening, index) => (
                <div className="opening-item" key={`${opening.type}-${index}`}>
                  <span>{opening.type}: {opening.width} Г— {opening.height} Рј В· {opening.count} С€С‚.</span>
                  <button type="button" onClick={() => removeOpening(index)}>СѓРґР°Р»РёС‚СЊ</button>
                </div>
              ))}
            </div>
          </Section>

          <Section title="4. РџРѕРІРµСЂС…РЅРѕСЃС‚Рё" subtitle="РџРѕР», СЃС‚РµРЅС‹ Рё РїРѕС‚РѕР»РѕРє РёРјРµСЋС‚ РѕС‚РґРµР»СЊРЅС‹Рµ СЃРІРѕР№СЃС‚РІР°.">
            <div className="surface-card">
              <h3>РџРѕР»</h3>
              <div className="grid two">
                <Select label="РћСЃРЅРѕРІР°РЅРёРµ РїРѕР»Р°" value={surfaceSpecs.floor.current_base} options={baseOptions} onChange={(value) => updateSurface("floor", "current_base", value)} />
                <Select label="РџРѕРєСЂС‹С‚РёРµ РїРѕР»Р°" value={surfaceSpecs.floor.covering} options={floorCoverings} onChange={(value) => updateSurface("floor", "covering", value)} />
                <Select label="РќСѓР¶РЅРѕ РІС‹СЂР°РІРЅРёРІР°РЅРёРµ" value={surfaceSpecs.floor.needs_leveling} options={["yes", "no", "unknown"]} onChange={(value) => updateSurface("floor", "needs_leveling", value)} />
                <label className="checkbox-line"><input type="checkbox" checked={surfaceSpecs.floor.needs_demolition} onChange={(event) => updateSurface("floor", "needs_demolition", event.target.checked)} />РќСѓР¶РµРЅ РґРµРјРѕРЅС‚Р°Р¶ РїРѕР»Р°</label>
              </div>
            </div>

            <div className="surface-card">
              <h3>РЎС‚РµРЅС‹</h3>
              <div className="grid two">
                <Select label="РћСЃРЅРѕРІР°РЅРёРµ СЃС‚РµРЅ" value={surfaceSpecs.walls.current_base} options={baseOptions} onChange={(value) => updateSurface("walls", "current_base", value)} />
                <Select label="РџРѕРєСЂС‹С‚РёРµ СЃС‚РµРЅ" value={surfaceSpecs.walls.covering} options={wallCoverings} onChange={(value) => updateSurface("walls", "covering", value)} />
                <Select label="РќСѓР¶РЅРѕ РІС‹СЂР°РІРЅРёРІР°РЅРёРµ" value={surfaceSpecs.walls.needs_leveling} options={["yes", "no", "unknown"]} onChange={(value) => updateSurface("walls", "needs_leveling", value)} />
                <label className="checkbox-line"><input type="checkbox" checked={surfaceSpecs.walls.needs_demolition} onChange={(event) => updateSurface("walls", "needs_demolition", event.target.checked)} />РќСѓР¶РµРЅ РґРµРјРѕРЅС‚Р°Р¶ СЃС‚РµРЅ</label>
              </div>
            </div>

            <div className="surface-card">
              <h3>РџРѕС‚РѕР»РѕРє</h3>
              <div className="grid two">
                <Select label="РћСЃРЅРѕРІР°РЅРёРµ РїРѕС‚РѕР»РєР°" value={surfaceSpecs.ceiling.current_base} options={baseOptions} onChange={(value) => updateSurface("ceiling", "current_base", value)} />
                <Select label="РџРѕРєСЂС‹С‚РёРµ РїРѕС‚РѕР»РєР°" value={surfaceSpecs.ceiling.covering} options={ceilingCoverings} onChange={(value) => updateSurface("ceiling", "covering", value)} />
                <Select label="РўРѕС‡РєРё РѕСЃРІРµС‰РµРЅРёСЏ" value={surfaceSpecs.ceiling.has_lighting_points} options={["yes", "no", "unknown"]} onChange={(value) => updateSurface("ceiling", "has_lighting_points", value)} />
                <Select label="РќСѓР¶РЅРѕ РІС‹СЂР°РІРЅРёРІР°РЅРёРµ" value={surfaceSpecs.ceiling.needs_leveling} options={["yes", "no", "unknown"]} onChange={(value) => updateSurface("ceiling", "needs_leveling", value)} />
              </div>
            </div>
          </Section>

          <Section title="5. РљРѕРЅС‚РµРєСЃС‚ СЂРµРјРѕРЅС‚Р°">
            <div className="grid three">
              <Select label="РЎРѕСЃС‚РѕСЏРЅРёРµ РїРѕРјРµС‰РµРЅРёСЏ" value={repairContext.property_condition} options={propertyConditions} onChange={(value) => setRepairContext((current) => ({ ...current, property_condition: value }))} />
              <Select label="РЈСЂРѕРІРµРЅСЊ СЂРµРјРѕРЅС‚Р°" value={repairContext.repair_level} options={repairLevels} onChange={(value) => setRepairContext((current) => ({ ...current, repair_level: value }))} />
              <label className="checkbox-line top-space"><input type="checkbox" checked={repairContext.has_existing_finish} onChange={(event) => setRepairContext((current) => ({ ...current, has_existing_finish: event.target.checked }))} />Р•СЃС‚СЊ СЃСѓС‰РµСЃС‚РІСѓСЋС‰Р°СЏ РѕС‚РґРµР»РєР°</label>
            </div>
          </Section>

          <Section title="6. РРЅР¶РµРЅРµСЂРЅС‹Рµ СЃРёСЃС‚РµРјС‹">
            <div className="grid three">
              {Object.entries(engineering).map(([key, value]) => (
                <Select key={key} label={key} value={value} options={yesNoUnknown} onChange={(nextValue) => updateEngineering(key, nextValue)} />
              ))}
            </div>
          </Section>

          <Section title="7. РўСЂРµР±РѕРІР°РЅРёСЏ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ">
            <div className="grid two">
              <Select label="Р‘СЋРґР¶РµС‚" value={userGoals.budget_level} options={budgetLevels} onChange={(value) => setUserGoals((current) => ({ ...current, budget_level: value }))} />
              <TextInput label="Р”РѕРїРѕР»РЅРёС‚РµР»СЊРЅС‹Рµ РїРѕР¶РµР»Р°РЅРёСЏ" value={userGoals.notes} onChange={(value) => setUserGoals((current) => ({ ...current, notes: value }))} />
            </div>
            <div className="chips">
              {priorities.map((priority) => (
                <label className={`chip ${userGoals.priority.includes(priority) ? "selected" : ""}`} key={priority}>
                  <input type="checkbox" checked={userGoals.priority.includes(priority)} onChange={() => togglePriority(priority)} />
                  {priority}
                </label>
              ))}
            </div>
          </Section>

          <Section title="8. Р’РѕРїСЂРѕСЃ РєРѕРЅСЃСѓР»СЊС‚Р°РЅС‚Сѓ">
            <textarea rows={4} value={userQuestion} onChange={(event) => setUserQuestion(event.target.value)} />
            <button className="primary-button" type="button" onClick={submit} disabled={loading}>{loading ? "Р¤РѕСЂРјРёСЂСѓРµС‚СЃСЏ РєРѕРЅСЃСѓР»СЊС‚Р°С†РёСЏ..." : "РЎС„РѕСЂРјРёСЂРѕРІР°С‚СЊ РєРѕРЅСЃСѓР»СЊС‚Р°С†РёСЋ"}</button>
            {error && <div className="error-box">{error}</div>}
          </Section>
        </form>

        <aside className="result-panel">
          <Section title="Р РµР·СѓР»СЊС‚Р°С‚ РєРѕРЅСЃСѓР»СЊС‚Р°РЅС‚Р°" subtitle="РџРѕРєР° backend РїРѕРґРґРµСЂР¶РёРІР°РµС‚ СЃС‚Р°СЂС‹Р№ РїСЂСЏРјРѕСѓРіРѕР»СЊРЅС‹Р№ СЂР°СЃС‡С‘С‚. РќРѕРІС‹Р№ payload СѓР¶Рµ С„РѕСЂРјРёСЂСѓРµС‚СЃСЏ.">
            {result ? (
              <>
                <div className="status-line">РћС‚РІРµС‚ СЃС„РѕСЂРјРёСЂРѕРІР°РЅ</div>
                <div className="metrics-grid">
                  <div><span>РџР»РѕС‰Р°РґСЊ РїРѕР»Р°</span><strong>{round(metric(resultSource, ["floor_area", "floorArea", "s_floor"]))} РјВІ</strong></div>
                  <div><span>РџР»РѕС‰Р°РґСЊ РїРѕС‚РѕР»РєР°</span><strong>{round(metric(resultSource, ["ceiling_area", "ceilingArea", "s_ceiling"]))} РјВІ</strong></div>
                  <div><span>РџРµСЂРёРјРµС‚СЂ</span><strong>{round(metric(resultSource, ["perimeter", "p"]))} Рј</strong></div>
                  <div><span>РЎС‚РµРЅС‹ С‡РёСЃС‚Р°СЏ</span><strong>{round(metric(resultSource, ["walls_net_area", "wall_area_net", "walls_clean", "clean_wall_area"]))} РјВІ</strong></div>
                  <div><span>РџСЂРѕС‘РјС‹</span><strong>{round(metric(resultSource, ["openings_area", "opening_area", "openingsArea"]))} РјВІ</strong></div>
                  <div><span>РџР»РёРЅС‚СѓСЃ</span><strong>{round(metric(resultSource, ["plinth", "baseboard", "perimeter"]))} Рј.РїРѕРі.</strong></div>
                </div>
                <div className="answer-box"><h3>РћС‚РІРµС‚</h3><pre>{answer}</pre></div>
              </>
            ) : (
              <div className="empty-result"><p>РџРѕСЃР»Рµ Р·Р°РїСѓСЃРєР° Р·РґРµСЃСЊ РїРѕСЏРІСЏС‚СЃСЏ СЂР°СЃС‡С‘С‚РЅС‹Рµ РїРѕРєР°Р·Р°С‚РµР»Рё Рё РєРѕРЅСЃСѓР»СЊС‚Р°С†РёСЏ.</p></div>
            )}
          </Section>

          <Section title="Payload preview" subtitle="РќРѕРІС‹Р№ РєРѕРЅС‚СЂР°РєС‚, РєРѕС‚РѕСЂС‹Р№ РґРѕР»Р¶РµРЅ РїСЂРёРЅСЏС‚СЊ backend РЅР° Step 2.">
            <pre className="payload-preview">{JSON.stringify(payload, null, 2)}</pre>
          </Section>
        </aside>
      </div>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);

