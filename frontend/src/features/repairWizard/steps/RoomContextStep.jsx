import React from "react";
import SelectField from "../../../components/SelectField";
import TextareaField from "../../../components/TextareaField";

export default function RoomContextStep({
  roomType, setRoomType,
  zoneType, setZoneType,
  roomShape, setRoomShape,
  repairContext, setRepairContext,
  uiWarnings,
  ROOM_TYPE_OPTIONS, ZONE_OPTIONS, SHAPE_OPTIONS,
  PROPERTY_CONDITIONS, REPAIR_LEVELS,
  defaultZone
}) {
  return (
    <>
      <div className="grid two">
        <SelectField label="Тип помещения" value={roomType} options={ROOM_TYPE_OPTIONS} onChange={setRoomType} />
        <SelectField label="Зона эксплуатации" value={zoneType} options={ZONE_OPTIONS} onChange={setZoneType} hint={`Рекомендуемая зона: ${defaultZone}`} />
        <SelectField label="Форма помещения" value={roomShape} options={SHAPE_OPTIONS} onChange={setRoomShape} />
      </div>
      {uiWarnings.length ? <div className="warning-box">{uiWarnings.map((w) => <p key={w}>{w}</p>)}</div> : null}

      <div className="stage-subblock">
        <h3>Контекст ремонта</h3>
        <p className="stage-subblock-note">Состояние помещения и уровень ремонта влияют на состав работ, риски, подготовку основания и глубину консультации.</p>
        <div className="grid three">
          <SelectField label="Состояние помещения" value={repairContext.property_condition} options={PROPERTY_CONDITIONS} onChange={(v) => setRepairContext((c) => ({ ...c, property_condition: v }))} />
          <SelectField label="Уровень предполагаемого ремонта" value={repairContext.repair_level} options={REPAIR_LEVELS} onChange={(v) => setRepairContext((c) => ({ ...c, repair_level: v }))} />
        </div>
        <TextareaField
          label="Комментарий пользователя"
          value={repairContext.user_comment || ""}
          onChange={(value) =>
            setRepairContext((current) => ({
              ...current,
              user_comment: value,
            }))
          }
          placeholder="Например: стены неровные, есть старая плитка, нужно сохранить радиатор, есть ограничения по шуму."
          hint="Свободный комментарий для консультации. Не запускает отдельный расчёт демонтажа."
        />
      </div>
    </>
  );
}
