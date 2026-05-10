import React from "react";

function MetricItem({ label, value, unit }) {
  return (
    <div className="dialog-metric-item">
      <span>{label}</span>
      <strong>{value} {unit}</strong>
    </div>
  );
}

export default function ConsultationStep({
  userQuestion,
  setUserQuestion,
  submitConsultation,
  isLoading,
  error,
  result,
  answer,
  resultSource,
  ragFragments,
  roundNumber,
  getMetric,
}) {
  const hasResult = Boolean(result);
  const userMessage = userQuestion?.trim() || "Подготовь базовую консультацию и расчёт для ремонта помещения.";

  return (
    <div className="consultation-dialog-panel">
      <div className="stage-logic-note">
        Диалоговое окно объединяет вопрос пользователя, расчётные показатели, ответ консультанта и следующий уточняющий вопрос в одном месте.
      </div>

      <div className="consultation-chat-window" aria-live="polite">
        {!hasResult ? (
          <div className="dialog-placeholder">
            После запуска здесь появится диалог с AI-консультантом.
          </div>
        ) : (
          <>
            <div className="dialog-message dialog-message-user">
              <div className="dialog-message-author">Вы</div>
              <pre>{userMessage}</pre>
            </div>

            <div className="dialog-message dialog-message-assistant">
              <div className="dialog-message-author">AI-консультант</div>

              <div className="dialog-metrics-grid">
                <MetricItem
                  label="Площадь пола"
                  value={roundNumber(getMetric(resultSource, ["floor_area", "floorArea", "s_floor"]))}
                  unit="м²"
                />
                <MetricItem
                  label="Площадь потолка"
                  value={roundNumber(getMetric(resultSource, ["ceiling_area", "ceilingArea", "s_ceiling"]))}
                  unit="м²"
                />
                <MetricItem
                  label="Периметр"
                  value={roundNumber(getMetric(resultSource, ["perimeter", "p"]))}
                  unit="м"
                />
                <MetricItem
                  label="Стены чистая"
                  value={roundNumber(getMetric(resultSource, ["walls_net_area", "wall_area_net", "walls_clean", "clean_wall_area"]))}
                  unit="м²"
                />
                <MetricItem
                  label="Проёмы"
                  value={roundNumber(getMetric(resultSource, ["openings_area", "opening_area", "openingsArea"]))}
                  unit="м²"
                />
                <MetricItem
                  label="Плинтус"
                  value={roundNumber(getMetric(resultSource, ["plinth", "baseboard", "perimeter"]))}
                  unit="м.пог."
                />
              </div>

              <pre className="dialog-answer-text">{answer}</pre>

              {Array.isArray(ragFragments) && ragFragments.length ? (
                <details className="rag-details">
                  <summary>Технические источники / RAG-фрагменты</summary>
                  <pre>{JSON.stringify(ragFragments, null, 2)}</pre>
                </details>
              ) : null}
            </div>
          </>
        )}
      </div>

      <div className="dialog-input-area">
        <label className="dialog-input-label">Ваш вопрос консультанту</label>
        <textarea
          value={userQuestion}
          onChange={(e) => setUserQuestion(e.target.value)}
          rows={4}
          placeholder="Например: какие риски есть в кухонной зоне, какие материалы лучше выбрать и что делать первым?"
        />
<div className="dialog-actions">
          <button
            type="button"
            className="primary-button"
            onClick={submitConsultation}
            disabled={isLoading}
          >
            {isLoading ? "Формируется консультация..." : hasResult ? "Отправить уточнение" : "Сформировать консультацию"}
          </button>
        </div>

        {error ? <div className="error-box">{error}</div> : null}
      </div>
    </div>
  );
}
