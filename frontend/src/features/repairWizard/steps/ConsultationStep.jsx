import React from "react";

export default function ConsultationStep({ userQuestion, setUserQuestion, submitConsultation, isLoading, error }) {
  return (
    <>
      <div className="stage-logic-note">Здесь пользователь задаёт уточняющий вопрос. Расчёт остаётся ниже как раскрываемый результат, а консультация должна объяснять этапы, материалы, риски и следующий безопасный шаг.</div>
      <textarea value={userQuestion} onChange={(e) => setUserQuestion(e.target.value)} rows={4} />
      <button type="button" className="primary-button" onClick={submitConsultation} disabled={isLoading}>{isLoading ? "Формируется консультация..." : "Сформировать консультацию"}</button>
      {error ? <div className="error-box">{error}</div> : null}
    </>
  );
}
