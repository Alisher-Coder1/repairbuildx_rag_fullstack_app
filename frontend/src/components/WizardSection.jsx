import React from "react";
import { WIZARD_STEP_FLOW, STAGE_7_3_UX } from "../features/repairWizard/data/options";

export default function WizardSection({ title, subtitle, children, stepKey, activeStep, onOpen, onComplete, completed = false }) {
  const sectionTitleText = String(title || "");
  const sectionSubtitleText = String(subtitle || "");
  if (
    sectionTitleText.includes("Что будет в помещении") ||
    sectionSubtitleText.includes("Выберите объекты ремонта") ||
    sectionSubtitleText.includes("Система распределит")
  ) {
    return null;
  }

  if (!STAGE_7_3_UX.showPayloadPreview && (title === "Payload preview" || title === "Технические данные")) {
    return null;
  }

  const isWizardStep = Boolean(stepKey);
  const isOpen = !isWizardStep || activeStep === stepKey;
  const currentIndex = WIZARD_STEP_FLOW.indexOf(stepKey);
  const previousKey = currentIndex > 0 ? WIZARD_STEP_FLOW[currentIndex - 1] : "";
  const nextKey = currentIndex >= 0 && currentIndex < WIZARD_STEP_FLOW.length - 1 ? WIZARD_STEP_FLOW[currentIndex + 1] : "";

  const className = [
    "section-card",
    isWizardStep ? "wizard-step-card" : "",
    isWizardStep ? (isOpen ? "ux-open is-open is-expanded stage-card-force-wide" : "ux-collapsed is-collapsed") : "",
  ].filter(Boolean).join(" ");

  const openThisStep = () => {
    if (isWizardStep && onOpen) onOpen(stepKey);
  };

  const handleHeaderKeyDown = (event) => {
    if (!isWizardStep) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openThisStep();
    }
  };

  return (
    <section
      className={className}
      data-step-key={stepKey || undefined}
      data-ux-title={isWizardStep ? title : undefined}
      data-ux-completed={completed ? "true" : "false"}
    >
      <div
        className="section-head"
        role={isWizardStep ? "button" : undefined}
        tabIndex={isWizardStep ? 0 : undefined}
        aria-expanded={isWizardStep ? isOpen : undefined}
        onClick={openThisStep}
        onKeyDown={handleHeaderKeyDown}
      >
        <h2>{title}{completed ? " ✓ заполнено" : ""}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>

      {isOpen ? children : null}

      {isWizardStep && isOpen ? (
        <div className="section-actions wizard-actions">
          {previousKey ? (
            <button type="button" className="secondary-button wizard-secondary-button" onClick={() => onOpen?.(previousKey)}>
              Назад
            </button>
          ) : null}
          {nextKey ? (
            <button type="button" className="primary-button wizard-primary-button" onClick={() => onComplete?.(stepKey)}>
              Готово, следующий шаг
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
