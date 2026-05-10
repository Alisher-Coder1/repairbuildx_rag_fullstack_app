import React from "react";
import SelectField from "../../../components/SelectField";
import NumberField from "../../../components/NumberField";
import TextField from "../../../components/TextField";
import { getUiLabel } from "../../../utils/helpers";

export default function GeometryStep({
  roomShape,
  dimensions, updateDimension,
  geometryMode, setGeometryMode,
  openings, draftOpening, setDraftOpening, addOpening, removeOpening,
  wallSegments, draftWallSegment, setDraftWallSegment, addWallSegment, removeWallSegment,
  GEOMETRY_MODES, OPENING_TYPES, WALL_SEGMENT_TYPES, CORNER_TYPES
}) {
  return (
    <>
      {roomShape === "прямоугольная" ? (
        <div className="grid three">
          <NumberField label="Длина, м" value={dimensions.length} onChange={(v) => updateDimension("length", v)} />
          <NumberField label="Ширина, м" value={dimensions.width} onChange={(v) => updateDimension("width", v)} />
          <NumberField label="Высота, м" value={dimensions.height} onChange={(v) => updateDimension("height", v)} />
        </div>
      ) : null}

      {roomShape === "круглая" ? (
        <div className="grid two">
          <NumberField label="Диаметр, м" value={dimensions.diameter} onChange={(v) => updateDimension("diameter", v)} />
          <NumberField label="Высота, м" value={dimensions.height} onChange={(v) => updateDimension("height", v)} />
        </div>
      ) : null}

      {roomShape === "сложная" ? (
        <>
          <div className="unsupported-box">Сложная форма покрывает Г-образные, П-образные, треугольные, овальные/радиусные, волнистые, помещения с нишами, эркерами, колоннами и нестандартным контуром. Система не угадывает форму — она считает по измеренным параметрам.</div>

          <SelectField label="Режим сложной геометрии" value={geometryMode} options={GEOMETRY_MODES} onChange={setGeometryMode} hint="по общим замерам — быстрый ввод; по сегментам стен — точнее для сложного контура" />

          <div className="grid three">
            <NumberField label="Измеренная площадь пола, м²" value={dimensions.manual_floor_area} onChange={(v) => updateDimension("manual_floor_area", v)} />
            {geometryMode === "measured_totals" ? <NumberField label="Измеренный периметр стен, м" value={dimensions.manual_perimeter} onChange={(v) => updateDimension("manual_perimeter", v)} /> : null}
            <NumberField label="Высота по умолчанию, м" value={dimensions.height} onChange={(v) => updateDimension("height", v)} />
          </div>

          <div className="grid two">
            <label className="checkbox-line top-space"><input type="checkbox" checked={dimensions.use_floor_area_for_ceiling} onChange={(e) => updateDimension("use_floor_area_for_ceiling", e.target.checked)} /> Потолок равен площади пола</label>
            {!dimensions.use_floor_area_for_ceiling ? <NumberField label="Измеренная площадь потолка, м²" value={dimensions.manual_ceiling_area} onChange={(v) => updateDimension("manual_ceiling_area", v)} /> : null}
          </div>

          <div className="grid two">
            <NumberField label="Чистая площадь стен вручную, м²" value={dimensions.manual_wall_area} onChange={(v) => updateDimension("manual_wall_area", v)} hint="Необязательно. Для сложных ниш/колонн это самый безопасный override." />
            <NumberField label="Длина плинтуса вручную, м.пог." value={dimensions.manual_baseboard_length} onChange={(v) => updateDimension("manual_baseboard_length", v)} hint="Необязательно. Если пусто, используется периметр или сумма сегментов." />
          </div>

          <TextField label="Описание сложной формы" value={dimensions.geometry_notes} onChange={(v) => updateDimension("geometry_notes", v)} placeholder="Например: Г-образная комната с нишей у входа" />

          {geometryMode === "wall_segments" ? (
            <div className="surface-card">
              <h3>Сегменты стен</h3>
              <p className="muted-text">Каждый сегмент — отдельный участок стены. Для волнистой/кривой стены вводите фактическую длину по контуру, а не прямую линию.</p>

              <div className="grid four">
                <TextField label="ID" value={draftWallSegment.id} onChange={(v) => setDraftWallSegment((c) => ({ ...c, id: v }))} />
                <SelectField label="Тип сегмента" value={draftWallSegment.type} options={WALL_SEGMENT_TYPES} onChange={(v) => setDraftWallSegment((c) => ({ ...c, type: v }))} />
                <NumberField label="Длина, м" value={draftWallSegment.length} onChange={(v) => setDraftWallSegment((c) => ({ ...c, length: v }))} />
                <NumberField label="Высота сегмента, м" value={draftWallSegment.height} onChange={(v) => setDraftWallSegment((c) => ({ ...c, height: v }))} hint="Можно оставить пустым — возьмётся высота по умолчанию" />
              </div>

              <div className="grid four">
                <SelectField label="Угол после сегмента" value={draftWallSegment.corner_after_type} options={CORNER_TYPES} onChange={(v) => setDraftWallSegment((c) => ({ ...c, corner_after_type: v }))} />
                <NumberField label="Угол, градусы" value={draftWallSegment.angle_deg} onChange={(v) => setDraftWallSegment((c) => ({ ...c, angle_deg: v }))} />
                <label className="checkbox-line top-space"><input type="checkbox" checked={draftWallSegment.baseboard_required} onChange={(e) => setDraftWallSegment((c) => ({ ...c, baseboard_required: e.target.checked }))} /> Нужен плинтус</label>
                <label className="checkbox-line top-space"><input type="checkbox" checked={draftWallSegment.finish_required} onChange={(e) => setDraftWallSegment((c) => ({ ...c, finish_required: e.target.checked }))} /> Нужна отделка</label>
              </div>

              <TextField label="Комментарий к сегменту" value={draftWallSegment.notes} onChange={(v) => setDraftWallSegment((c) => ({ ...c, notes: v }))} />
              <button type="button" className="secondary-button" onClick={addWallSegment}>Добавить сегмент стены</button>

              <div className="opening-list">
                {wallSegments.map((s, index) => (
                  <div className="opening-item" key={`${s.id}-${index}`}>
                    <span>{s.id}: {getUiLabel(s.type)}, {s.length} м, высота {s.height || dimensions.height} м, угол: {getUiLabel(s.corner_after_type)}</span>
                    <button type="button" onClick={() => removeWallSegment(index)}>удалить</button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      <div className="stage-subblock">
        <h3>Проёмы и вычеты</h3>
        <p className="stage-subblock-note">Проёмы уменьшают чистую площадь стен и влияют на откосы, доборы, примыкания и будущую смету.</p>
        <div className="grid four">
          <SelectField label="Тип проёма" value={draftOpening.type} options={OPENING_TYPES} onChange={(v) => setDraftOpening((c) => ({ ...c, type: v }))} />
          <NumberField label="Ширина, м" value={draftOpening.width} onChange={(v) => setDraftOpening((c) => ({ ...c, width: v }))} />
          <NumberField label="Высота, м" value={draftOpening.height} onChange={(v) => setDraftOpening((c) => ({ ...c, height: v }))} />
          <NumberField label="Количество" value={draftOpening.count} onChange={(v) => setDraftOpening((c) => ({ ...c, count: v }))} step="1" />
        </div>
        <button type="button" className="secondary-button" onClick={addOpening}>Добавить проём</button>
        <div className="opening-list">
          {openings.map((o, index) => (
            <div className="opening-item" key={`${o.type}-${index}`}>
              <span>{o.type}: {o.width} × {o.height} м · {o.count} шт.</span>
              <button type="button" onClick={() => removeOpening(index)}>удалить</button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
