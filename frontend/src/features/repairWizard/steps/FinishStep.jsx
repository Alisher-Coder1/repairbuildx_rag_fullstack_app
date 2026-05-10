import React from "react";
import SelectField from "../../../components/SelectField";

export default function FinishStep({ surfaceSpecs, updateSurface, FLOOR_COVERINGS, WALL_COVERINGS, CEILING_COVERINGS, BASE_OPTIONS }) {
  return (
    <>
      <div className="stage-logic-note">Финишные покрытия нельзя считать отдельно от основания: ламинат зависит от ровности пола, краска — от качества шпаклёвки, плитка — от геометрии, клея, гидроизоляции и швов.</div>

      <div className="surface-card">
        <h3>Пол</h3>
        <div className="grid two">
          <SelectField label="Основание пола" value={surfaceSpecs.floor.current_base} options={BASE_OPTIONS} onChange={(v) => updateSurface("floor", "current_base", v)} />
          <SelectField label="Покрытие пола" value={surfaceSpecs.floor.covering} options={FLOOR_COVERINGS} onChange={(v) => updateSurface("floor", "covering", v)} />
          <SelectField label="Нужно выравнивание" value={surfaceSpecs.floor.needs_leveling} options={["yes", "no", "unknown"]} onChange={(v) => updateSurface("floor", "needs_leveling", v)} />
        </div>
      </div>

      <div className="surface-card">
        <h3>Стены</h3>
        <div className="grid two">
          <SelectField label="Основание стен" value={surfaceSpecs.walls.current_base} options={BASE_OPTIONS} onChange={(v) => updateSurface("walls", "current_base", v)} />
          <SelectField label="Покрытие стен" value={surfaceSpecs.walls.covering} options={WALL_COVERINGS} onChange={(v) => updateSurface("walls", "covering", v)} />
          <SelectField label="Нужно выравнивание" value={surfaceSpecs.walls.needs_leveling} options={["yes", "no", "unknown"]} onChange={(v) => updateSurface("walls", "needs_leveling", v)} />
        </div>
      </div>

      <div className="surface-card">
        <h3>Потолок</h3>
        <div className="grid two">
          <SelectField label="Основание потолка" value={surfaceSpecs.ceiling.current_base} options={BASE_OPTIONS} onChange={(v) => updateSurface("ceiling", "current_base", v)} />
          <SelectField label="Покрытие потолка" value={surfaceSpecs.ceiling.covering} options={CEILING_COVERINGS} onChange={(v) => updateSurface("ceiling", "covering", v)} />
          <SelectField label="Точки освещения" value={surfaceSpecs.ceiling.has_lighting_points} options={["yes", "no", "unknown"]} onChange={(v) => updateSurface("ceiling", "has_lighting_points", v)} />
          <SelectField label="Нужно выравнивание" value={surfaceSpecs.ceiling.needs_leveling} options={["yes", "no", "unknown"]} onChange={(v) => updateSurface("ceiling", "needs_leveling", v)} />
        </div>
      </div>
    </>
  );
}
