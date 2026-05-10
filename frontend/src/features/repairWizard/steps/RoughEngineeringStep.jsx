import React from "react";
import SelectField from "../../../components/SelectField";
import { getUiLabel } from "../../../utils/helpers";

export default function RoughEngineeringStep({ engineering, updateEngineering, YES_NO_UNKNOWN }) {
  return (
    <>
      <div className="stage-logic-note">На этом этапе фиксируются скрытые работы. Ответы пользователя дают системе понимание, какие выводы, кабели, трубы, каналы, проверки и подготовительные материалы нужны до предчистовой отделки.</div>
      <div className="grid three">
        {Object.entries(engineering).map(([key, value]) => (
          <SelectField key={key} label={getUiLabel(key)} value={value} options={YES_NO_UNKNOWN} onChange={(v) => updateEngineering(key, v)} />
        ))}
      </div>
    </>
  );
}
