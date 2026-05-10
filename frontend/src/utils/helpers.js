import { UI_LABELS } from "../features/repairWizard/data/options";

export function asNumber(value) {
  const number = Number(String(value).replace(",", "."));
  return Number.isFinite(number) ? number : 0;
}

export function optionalNumber(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const number = Number(String(value).replace(",", "."));
  return Number.isFinite(number) ? number : null;
}

export function roundNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number * 100) / 100 : "—";
}

export function getDefaultEngineering(roomType) {
  if (roomType === "ванная" || roomType === "санузел") {
    return { electrical_required: "unknown", plumbing_required: "auto", ventilation_required: "auto", heating_required: "unknown", waterproofing_required: "auto", hvac_required: "unknown" };
  }
  if (roomType === "кухня") {
    return { electrical_required: "auto", plumbing_required: "auto", ventilation_required: "auto", heating_required: "unknown", waterproofing_required: "auto", hvac_required: "unknown" };
  }
  return { electrical_required: "unknown", plumbing_required: "unknown", ventilation_required: "unknown", heating_required: "unknown", waterproofing_required: "unknown", hvac_required: "unknown" };
}

export function getMetric(source, keys) {
  for (const key of keys) {
    if (source && source[key] !== undefined && source[key] !== null) return source[key];
  }
  return undefined;
}

export function getUiLabel(value) {
  return UI_LABELS[value] || value;
}
