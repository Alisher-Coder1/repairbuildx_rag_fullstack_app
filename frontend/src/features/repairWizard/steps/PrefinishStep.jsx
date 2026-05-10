import React from "react";
import SelectField from "../../../components/SelectField";
import TextField from "../../../components/TextField";

export default function PrefinishStep({ userGoals, setUserGoals, togglePriority, BUDGET_LEVELS, PRIORITIES }) {
  return (
    <>
      <div className="stage-logic-note">Этот этап влияет на подготовку основания: выравнивание, шпаклёвку, грунтовку, гидроизоляцию, технологические паузы и контроль качества перед финишными покрытиями.</div>
      <div className="grid two">
        <SelectField label="Бюджет" value={userGoals.budget_level} options={BUDGET_LEVELS} onChange={(v) => setUserGoals((c) => ({ ...c, budget_level: v }))} />
        <TextField label="Дополнительные пожелания" value={userGoals.notes} onChange={(v) => setUserGoals((c) => ({ ...c, notes: v }))} />
      </div>
      <div className="chips">
        {PRIORITIES.map((p) => (
          <label className={`chip ${userGoals.priority.includes(p) ? "selected" : ""}`} key={p}>
            <input type="checkbox" checked={userGoals.priority.includes(p)} onChange={() => togglePriority(p)} /> {p}
          </label>
        ))}
      </div>
    </>
  );
}
