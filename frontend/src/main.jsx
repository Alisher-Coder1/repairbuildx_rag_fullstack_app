import React, { useMemo, useState, useEffect } from 'react';
import { createRoot } from "react-dom/client";
import "./styles.css";


const STAGE_7_3_UX = {
  showDeveloperDebug: false,
  showRawRagFragments: false,
  showPayloadPreview: false,
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const ROOM_TYPE_OPTIONS = ["кухня", "ванная", "санузел", "спальня", "гостиная", "коридор", "прихожая", "детская", "кабинет", "балкон", "лоджия", "кладовая", "гардеробная", "техническое помещение"];
const ROOM_TO_ZONE = { кухня: "кухонная зона", ванная: "влажная зона", санузел: "влажная зона", спальня: "сухая зона", гостиная: "сухая зона", детская: "сухая зона", кабинет: "сухая зона", коридор: "проходная сухая зона", прихожая: "проходная сухая зона", балкон: "балконная зона", лоджия: "балконная зона", кладовая: "сухая зона", гардеробная: "сухая зона", "техническое помещение": "техническая зона" };
const ZONE_OPTIONS = ["сухая зона", "влажная зона", "кухонная зона", "проходная сухая зона", "балконная зона", "техническая зона"];
const SHAPE_OPTIONS = ["прямоугольная", "круглая", "сложная"];
const GEOMETRY_MODES = ["measured_totals", "wall_segments"];
const WALL_SEGMENT_TYPES = ["straight", "arc", "curved", "wave", "niche", "projection", "column_side", "other"];
const CORNER_TYPES = ["inner", "outer", "rounded", "none", "unknown"];

const FLOOR_COVERINGS = ["ламинат", "керамогранит", "керамическая плитка", "наливной пол", "линолеум", "инженерная доска", "паркет", "unknown"];
const WALL_COVERINGS = ["краска", "обои", "керамическая плитка", "декоративная штукатурка", "панели", "unknown"];
const CEILING_COVERINGS = ["краска", "побелка", "натяжной потолок", "гипсокартон", "панели", "unknown"];
const BASE_OPTIONS = ["бетон", "бетонная стяжка", "штукатурка", "гипсокартон", "старая отделка", "после демонтажа", "unknown"];
const YES_NO_UNKNOWN = ["yes", "no", "unknown", "auto"];
const PROPERTY_CONDITIONS = ["новостройка без отделки", "черновая отделка", "предчистовая отделка", "старая отделка", "после демонтажа", "неизвестно"];
const REPAIR_LEVELS = ["косметический", "капитальный", "частичный", "под ключ", "только расчёт материалов", "только консультация"];
const BUDGET_LEVELS = ["эконом", "средний", "премиум", "не указан"];

const REPAIR_OBJECT_OPTIONS = [
  { group: "Сантехника", options: [["toilet_floor", "Унитаз напольный"], ["toilet_wall_hung", "Подвесной унитаз / инсталляция"], ["sink", "Раковина / умывальник"], ["shower", "Душевая зона"]] },
  { group: "Электрика и свет", options: [["socket", "Розетки"], ["ceiling_light", "Потолочное освещение"]] },
  { group: "Вентиляция и отопление", options: [["ventilation_fan", "Вентиляция / вентилятор"], ["warm_floor", "Тёплый пол"]] },
  { group: "Финишные покрытия", options: [["laminate_floor", "Ламинат"], ["tile", "Плитка / керамогранит"], ["paint", "Краска"]] },
];

const REPAIR_OBJECT_LIFECYCLE_HINTS = {
  toilet_floor: "Черновой: вывод воды и канализации. Чистовой: установка и проверка унитаза.",
  toilet_wall_hung: "Черновой: инсталляция и выводы. Предчистовой: зашивка и плитка. Чистовой: чаша и кнопка.",
  sink: "Черновой: выводы воды и канализации. Чистовой: раковина, смеситель, сифон.",
  shower: "Черновой: выводы, трап, уклоны. Предчистовой: гидроизоляция. Чистовой: душевая система.",
  socket: "Черновой: кабель и подрозетник. Предчистовой: заделка. Чистовой: механизм и рамка.",
  ceiling_light: "Черновой: кабель и выводы. Предчистовой: отверстия/закладные. Чистовой: светильники.",
  ventilation_fan: "Черновой: канал и питание. Предчистовой: короб/отверстие. Чистовой: решётка или вентилятор.",
  warm_floor: "Черновой: система и датчик. Предчистовой: закрытие/стяжка. Чистовой: терморегулятор.",
  laminate_floor: "Черновой: проверка основания. Предчистовой: подготовка пола. Чистовой: ламинат, подложка, плинтус.",
  tile: "Черновой: основание и гидроизоляция. Предчистовой: подготовка. Чистовой: плитка, клей, затирка.",
  paint: "Черновой: основание. Предчистовой: шпаклёвка и шлифовка. Чистовой: окраска.",
};

const PRIORITIES = ["долговечность", "быстро", "дешево", "влагостойкость", "звукоизоляция", "теплоизоляция", "простота ухода", "минимум сложных работ", "визуальный дизайн"];
const OPENING_TYPES = ["дверь", "окно", "арка", "ниша"];

const UI_LABELS = {
  measured_totals: "по общим замерам",
  wall_segments: "по сегментам стен",

  straight: "прямая стена",
  arc: "дуговая / радиусная стена",
  curved: "кривая стена",
  wave: "волнистая стена",
  niche: "ниша",
  projection: "выступ",
  column_side: "сторона колонны",
  other: "другое",

  inner: "внутренний угол",
  outer: "внешний угол",
  rounded: "скруглённый угол",
  none: "без угла",
  unknown: "неизвестно",

  yes: "да",
  no: "нет",
  auto: "авто",

  electrical_required: "Нужна электрика",
  plumbing_required: "Нужна сантехника",
  ventilation_required: "Нужна вентиляция",
  heating_required: "Нужно отопление",
  waterproofing_required: "Нужна гидроизоляция",
  hvac_required: "Нужен HVAC / кондиционирование",
};

function getUiLabel(value) {
  return UI_LABELS[value] || value;
}


function asNumber(value) {
  const number = Number(String(value).replace(",", "."));
  return Number.isFinite(number) ? number : 0;
}

function optionalNumber(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const number = Number(String(value).replace(",", "."));
  return Number.isFinite(number) ? number : null;
}

function roundNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number * 100) / 100 : "—";
}

function getDefaultEngineering(roomType) {
  if (roomType === "ванная" || roomType === "санузел") {
    return { electrical_required: "unknown", plumbing_required: "auto", ventilation_required: "auto", heating_required: "unknown", waterproofing_required: "auto", hvac_required: "unknown" };
  }
  if (roomType === "кухня") {
    return { electrical_required: "auto", plumbing_required: "auto", ventilation_required: "auto", heating_required: "unknown", waterproofing_required: "auto", hvac_required: "unknown" };
  }
  return { electrical_required: "unknown", plumbing_required: "unknown", ventilation_required: "unknown", heating_required: "unknown", waterproofing_required: "unknown", hvac_required: "unknown" };
}

function getMetric(source, keys) {
  for (const key of keys) {
    if (source && source[key] !== undefined && source[key] !== null) return source[key];
  }
  return undefined;
}

function Section({ title, subtitle, children }) {
  if (!STAGE_7_3_UX.showPayloadPreview && (title === "Payload preview" || title === "Технические данные")) {
    return null;
  }

  return (
    <section className="section-card">
      <div className="section-head">
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
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
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

function SelectField({ label, value, onChange, options, hint, disabled = false }) {
  return (
    <Field label={label} hint={hint}>
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
        {options.map((option) => (
          <option key={option} value={option}>
            {getUiLabel(option)}
          </option>
        ))}
      </select>
    </Field>
  );
}

function NumberField({ label, value, onChange, hint, min = "0", step = "0.01" }) {
  return (
    <Field label={label} hint={hint}>
      <input type="number" min={min} step={step} value={value} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}

function TextField({ label, value, onChange, hint, placeholder }) {
  return (
    <Field label={label} hint={hint}>
      <input type="text" value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}


const PROGRESSIVE_CONSULTANT_STEPS = [
  { key: "room", title: "1. Помещение", short: "Помещение" },
  { key: "geometry", title: "2. Размеры", short: "Размеры" },
  { key: "objects", title: "3. Что будет в помещении / объекты", short: "Объекты" },
  { key: "rough", title: "4. Черновой этап / инженерная подготовка", short: "Черновой" },
  { key: "prefinish", title: "5. Предчистовой этап", short: "Предчистовой" },
  { key: "finish", title: "6. Чистовой этап / покрытия", short: "Чистовой" },
  { key: "result", title: "7. Итог и консультация", short: "Итог" },
  { key: "question", title: "8. Вопрос консультанту", short: "Вопрос" },
];

function normalizeUxText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function findUxHeading(title) {
  const normalizedTitle = normalizeUxText(title).toLowerCase();
  const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, strong, legend"));
  return headings.find((node) => normalizeUxText(node.textContent).toLowerCase().startsWith(normalizedTitle));
}

function findUxCardFromHeading(heading) {
  if (!heading) return null;
  return heading.closest("section, article, .card, .panel, .form-card, [class*='card'], [class*='Card']");
}

function findUxCardByText(text) {
  const normalizedText = normalizeUxText(text).toLowerCase();
  const nodes = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, strong, legend, summary"));
  const heading = nodes.find((node) => normalizeUxText(node.textContent).toLowerCase().includes(normalizedText));
  return findUxCardFromHeading(heading);
}

function closeAllUxSteps(exceptKey = "") {
  document.querySelectorAll(".ux-step-card").forEach((card) => {
    if (card.dataset.uxStepKey !== exceptKey) {
      card.classList.add("ux-collapsed");
      card.classList.remove("ux-open");
    }
  });
}

function openUxStep(stepKey) {
  const card = document.querySelector(`.ux-step-card[data-ux-step-key="${stepKey}"]`);
  if (!card) return;
  closeAllUxSteps(stepKey);
  card.classList.remove("ux-collapsed");
  card.classList.add("ux-open");
  card.dataset.uxUserOpened = "true";
  card.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function getNextUxStepKey(currentKey) {
  const index = PROGRESSIVE_CONSULTANT_STEPS.findIndex((step) => step.key === currentKey);
  if (index < 0 || index >= PROGRESSIVE_CONSULTANT_STEPS.length - 1) return "";
  return PROGRESSIVE_CONSULTANT_STEPS[index + 1].key;
}

function markUxStepCompleted(card) {
  if (!card) return;
  const controls = Array.from(card.querySelectorAll("input, select, textarea"));
  const hasValue = controls.some((control) => {
    if (control.type === "checkbox" || control.type === "radio") return control.checked;
    return String(control.value || "").trim() !== "";
  });
  if (hasValue) {
    card.dataset.uxCompleted = "true";
  }
}

function prepareUxStepCard(step, index) {
  const heading = findUxHeading(step.title);
  const card = findUxCardFromHeading(heading);
  if (!heading || !card) return;

  card.classList.add("ux-step-card");
  card.dataset.uxStepKey = step.key;

  heading.classList.add("ux-step-heading");
  heading.setAttribute("role", "button");
  heading.setAttribute("tabindex", "0");

  if (!card.dataset.uxPrepared) {
    const hint = document.createElement("div");
    hint.className = "ux-step-hint";
    hint.textContent = "Нажмите, чтобы раскрыть или свернуть шаг";
    heading.insertAdjacentElement("afterend", hint);

    const actions = document.createElement("div");
    actions.className = "ux-step-actions";
    const nextKey = getNextUxStepKey(step.key);
    actions.innerHTML = nextKey
      ? '<button type="button" class="ux-step-next-button">Готово, следующий шаг</button>'
      : '<button type="button" class="ux-step-next-button">Готово, перейти к консультации</button>';
    card.appendChild(actions);

    actions.querySelector("button")?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      markUxStepCompleted(card);
      card.classList.add("ux-collapsed");
      card.classList.remove("ux-open");
      if (nextKey) openUxStep(nextKey);
      if (!nextKey) {
        document.querySelector(".ux-consultant-panel")?.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    });

    heading.addEventListener("click", () => {
      const isCollapsed = card.classList.contains("ux-collapsed");
      if (isCollapsed) {
        openUxStep(step.key);
      } else {
        card.classList.add("ux-collapsed");
        card.classList.remove("ux-open");
      }
    });

    heading.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        heading.click();
      }
    });

    card.addEventListener("change", () => markUxStepCompleted(card), true);
    card.addEventListener("input", () => markUxStepCompleted(card), true);

    card.dataset.uxPrepared = "true";
  }

  if (!card.dataset.uxUserOpened && index > 0) {
    card.classList.add("ux-collapsed");
    card.classList.remove("ux-open");
  } else if (index === 0) {
    card.classList.add("ux-open");
    card.classList.remove("ux-collapsed");
  }
}

function setupProgressiveConsultantUx() {
  if (typeof document === "undefined") return;

  PROGRESSIVE_CONSULTANT_STEPS.forEach((step, index) => prepareUxStepCard(step, index));

  const uxStepCards = Array.from(document.querySelectorAll(".ux-step-card"));
  const uxStepsParent = uxStepCards[0]?.parentElement;
  if (
    uxStepsParent &&
    uxStepCards.length >= 2 &&
    uxStepCards.every((card) => card.parentElement === uxStepsParent)
  ) {
    uxStepsParent.classList.add("ux-steps-grid");
  }


  const consultantCard = findUxCardByText("Результат консультанта");
  if (consultantCard) {
    consultantCard.classList.add("ux-consultant-panel");
  }

  ["Payload preview", "Найденные RAG-фрагменты", "Технические данные"].forEach((title) => {
    const debugCard = findUxCardByText(title);
    if (debugCard) debugCard.classList.add("ux-debug-only");
  });
}



function getPreviousUxStepKey(currentKey) {
  const index = PROGRESSIVE_CONSULTANT_STEPS.findIndex((step) => step.key === currentKey);
  if (index <= 0) return "";
  return PROGRESSIVE_CONSULTANT_STEPS[index - 1].key;
}

function findClosestCommonUxAncestor(firstNode, secondNode) {
  if (!firstNode || !secondNode) return null;
  const firstAncestors = [];
  let node = firstNode;
  while (node) {
    firstAncestors.push(node);
    node = node.parentElement;
  }

  node = secondNode;
  while (node) {
    if (firstAncestors.includes(node)) return node;
    node = node.parentElement;
  }

  return null;
}

function setupProgressiveConsultantUxV2() {
  if (typeof document === "undefined") return;

  const stepCards = Array.from(document.querySelectorAll(".ux-step-card"));
  if (!stepCards.length) return;

  stepCards.forEach((card, index) => {
    const stepKey = card.dataset.uxStepKey || "";
    const step = PROGRESSIVE_CONSULTANT_STEPS.find((item) => item.key === stepKey) || PROGRESSIVE_CONSULTANT_STEPS[index];
    if (!step) return;

    card.classList.add("ux-step-card-v2");
    card.dataset.uxTitle = step.title;
    card.dataset.uxTitleLockedForVisibleHeader = "true";


    const oldHeading = card.querySelector(".ux-step-heading");
    if (oldHeading) {
      oldHeading.classList.add("ux-original-heading-hidden");
    }

    let header = card.querySelector(".ux-step-compact-header");
    if (!header) {
      header = document.createElement("button");
      header.type = "button";
      header.className = "ux-step-compact-header";
      header.innerHTML = `
        <span class="ux-step-compact-title">${step.title}</span>
        <span class="ux-step-compact-status" aria-hidden="true"></span>
        <span class="ux-step-compact-arrow" aria-hidden="true">⌄</span>
      `;
      card.prepend(header);

      const visibleTitleNode = header.querySelector(".ux-step-compact-title");
      if (visibleTitleNode) {
        visibleTitleNode.textContent = step.title;
      }
      header.setAttribute("aria-label", step.title);

      header.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        const isCollapsed = card.classList.contains("ux-collapsed");
        if (isCollapsed) {
          openUxStep(stepKey);
        } else {
          card.classList.add("ux-collapsed");
          card.classList.remove("ux-open");
        }
      });
    }

    let actions = card.querySelector(".ux-step-actions");
    if (!actions) {
      actions = document.createElement("div");
      actions.className = "ux-step-actions";
      card.appendChild(actions);
    }

    const previousKey = getPreviousUxStepKey(stepKey);
    const nextKey = getNextUxStepKey(stepKey);
    actions.innerHTML = `
      ${previousKey ? '<button type="button" class="ux-step-prev-button">Назад</button>' : ''}
      ${nextKey ? '<button type="button" class="ux-step-next-button">Готово, следующий шаг</button>' : '<button type="button" class="ux-step-next-button">Готово, к консультации</button>'}
    `;

    actions.querySelector(".ux-step-prev-button")?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      markUxStepCompleted(card);
      card.classList.add("ux-collapsed");
      card.classList.remove("ux-open");
      if (previousKey) openUxStep(previousKey);
    });

    actions.querySelector(".ux-step-next-button")?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      markUxStepCompleted(card);
      card.classList.add("ux-collapsed");
      card.classList.remove("ux-open");

      if (nextKey) {
        openUxStep(nextKey);
      } else {
        document.querySelector(".ux-consultant-panel")?.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    });
  });

  const uxStepsParent = stepCards[0]?.parentElement;
  if (
    uxStepsParent &&
    stepCards.length >= 2 &&
    stepCards.every((card) => card.parentElement === uxStepsParent)
  ) {
    uxStepsParent.classList.add("ux-steps-grid", "ux-steps-grid-v2");
  }

  const consultantCard = findUxCardByText("Результат консультанта");
  if (consultantCard) {
    consultantCard.classList.add("ux-consultant-panel", "ux-consultant-panel-bottom");

    const commonAncestor = findClosestCommonUxAncestor(uxStepsParent, consultantCard);
    if (commonAncestor) {
      commonAncestor.classList.add("ux-bottom-consultant-layout");
    }

    // Move the consultation/result panel below the user steps so the dialogue area
    // can use the full available width instead of being squeezed on the right.
    if (uxStepsParent && consultantCard.parentElement !== uxStepsParent.parentElement) {
      uxStepsParent.insertAdjacentElement("afterend", consultantCard);
    } else if (uxStepsParent && consultantCard.previousElementSibling !== uxStepsParent) {
      uxStepsParent.insertAdjacentElement("afterend", consultantCard);
    }
  }
}



function getUxStepTitle(stepKey) {
  return PROGRESSIVE_CONSULTANT_STEPS.find((step) => step.key === stepKey)?.title || stepKey;
}

function scrollToUxStep(stepKey) {
  const card = document.querySelector(`.ux-step-card[data-ux-step-key="${stepKey}"]`);
  if (!card) return;
  openUxStep(stepKey);
  card.scrollIntoView({ block: "start", behavior: "smooth" });
}

function getUserQuestionTextarea() {
  const questionStep = document.querySelector('.ux-step-card[data-ux-step-key="question"]');
  return questionStep?.querySelector("textarea") || null;
}

function getSubmitConsultationButton() {
  const buttons = Array.from(document.querySelectorAll("button"));
  return buttons.find((button) => normalizeUxText(button.textContent).toLowerCase().includes("сформировать консультацию")) || null;
}

function getConsultationText() {
  const panel = document.querySelector(".ux-consultant-panel");
  if (!panel) return "";
  return normalizeUxText(panel.textContent || "");
}

function detectConsultationReady() {
  const text = getConsultationText().toLowerCase();
  return text.includes("ответ сформирован") || text.includes("консультация") || text.includes("краткий вывод");
}

function ensureUxStepNavigator() {
  const stepsParent = document.querySelector(".ux-steps-grid-v2") || document.querySelector(".ux-steps-grid");
  if (!stepsParent) return;

  let nav = document.querySelector(".ux-step-navigator");
  if (!nav) {
    nav = document.createElement("nav");
    nav.className = "ux-step-navigator";
    nav.setAttribute("aria-label", "Навигация по этапам");
    nav.innerHTML = `
      <div class="ux-step-navigator-title">Этапы заполнения</div>
      <div class="ux-step-navigator-buttons"></div>
      <div class="ux-step-navigator-actions">
        <button type="button" class="ux-open-all-steps">Раскрыть все</button>
        <button type="button" class="ux-close-all-steps">Свернуть все</button>
        <button type="button" class="ux-go-consultation">К консультации</button>
      </div>
    `;
    stepsParent.insertAdjacentElement("beforebegin", nav);

    nav.querySelector(".ux-open-all-steps")?.addEventListener("click", () => {
      document.querySelectorAll(".ux-step-card").forEach((card) => {
        card.classList.remove("ux-collapsed");
        card.classList.add("ux-open");
      });
    });

    nav.querySelector(".ux-close-all-steps")?.addEventListener("click", () => {
      document.querySelectorAll(".ux-step-card").forEach((card) => {
        card.classList.add("ux-collapsed");
        card.classList.remove("ux-open");
      });
    });

    nav.querySelector(".ux-go-consultation")?.addEventListener("click", () => {
      document.querySelector(".ux-consultant-panel")?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  }

  const buttonsWrap = nav.querySelector(".ux-step-navigator-buttons");
  if (buttonsWrap && !buttonsWrap.children.length) {
    PROGRESSIVE_CONSULTANT_STEPS.forEach((step) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ux-step-jump";
      button.dataset.uxJumpStep = step.key;
      button.textContent = step.title.replace(/^\d+\.\s*/, "");
      button.addEventListener("click", () => scrollToUxStep(step.key));
      buttonsWrap.appendChild(button);
    });
  }

  PROGRESSIVE_CONSULTANT_STEPS.forEach((step) => {
    const card = document.querySelector(`.ux-step-card[data-ux-step-key="${step.key}"]`);
    const button = nav.querySelector(`[data-ux-jump-step="${step.key}"]`);
    if (!card || !button) return;
    button.classList.toggle("is-completed", card.dataset.uxCompleted === "true");
    button.classList.toggle("is-open", card.classList.contains("ux-open"));
  });
}

function ensureConsultationConversationTools() {
  const panel = document.querySelector(".ux-consultant-panel");
  if (!panel) return;

  panel.classList.add("ux-conversation-panel");

  let tools = panel.querySelector(".ux-consultation-tools");
  if (!tools) {
    tools = document.createElement("div");
    tools.className = "ux-consultation-tools";
    tools.innerHTML = `
      <button type="button" class="ux-tools-to-steps">Посмотреть этапы</button>
      <button type="button" class="ux-tools-to-question">Задать уточнение</button>
      <button type="button" class="ux-tools-new-question">Новая консультация</button>
    `;
    const firstUsefulChild = panel.querySelector("h1, h2, h3, h4, strong, p, div");
    if (firstUsefulChild) {
      firstUsefulChild.insertAdjacentElement("afterend", tools);
    } else {
      panel.prepend(tools);
    }

    tools.querySelector(".ux-tools-to-steps")?.addEventListener("click", () => {
      document.querySelector(".ux-step-navigator")?.scrollIntoView({ block: "start", behavior: "smooth" });
    });

    tools.querySelector(".ux-tools-to-question")?.addEventListener("click", () => {
      scrollToUxStep("question");
      const textarea = getUserQuestionTextarea();
      if (textarea) textarea.focus();
    });

    tools.querySelector(".ux-tools-new-question")?.addEventListener("click", () => {
      scrollToUxStep("question");
      const textarea = getUserQuestionTextarea();
      if (textarea) {
        textarea.value = "";
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
        textarea.focus();
      }
    });
  }

  let follow = panel.querySelector(".ux-followup-box");
  if (!follow) {
    follow = document.createElement("div");
    follow.className = "ux-followup-box";
    follow.innerHTML = `
      <div class="ux-followup-title">Продолжить разговор</div>
      <textarea class="ux-followup-textarea" rows="3" placeholder="Например: уточни по влажной зоне, последовательности работ или выбору материала"></textarea>
      <div class="ux-followup-actions">
        <button type="button" class="ux-followup-send">Отправить уточнение</button>
        <button type="button" class="ux-followup-show-question">Открыть этап 8</button>
      </div>
      <div class="ux-followup-hint">Уточнение будет передано в поле «Вопрос консультанту» и запустит новую консультацию.</div>
    `;
    panel.appendChild(follow);

    follow.querySelector(".ux-followup-show-question")?.addEventListener("click", () => {
      scrollToUxStep("question");
      getUserQuestionTextarea()?.focus();
    });

    follow.querySelector(".ux-followup-send")?.addEventListener("click", () => {
      const followupTextarea = follow.querySelector(".ux-followup-textarea");
      const questionTextarea = getUserQuestionTextarea();
      const submitButton = getSubmitConsultationButton();
      const value = String(followupTextarea?.value || "").trim();

      if (!value) {
        followupTextarea?.focus();
        return;
      }

      if (!questionTextarea || !submitButton) {
        scrollToUxStep("question");
        return;
      }

      questionTextarea.value = value;
      questionTextarea.dispatchEvent(new Event("input", { bubbles: true }));
      questionTextarea.dispatchEvent(new Event("change", { bubbles: true }));
      submitButton.click();
      followupTextarea.value = "";
      panel.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  }
}

function setupProgressiveConsultantUxV4() {
  if (typeof document === "undefined") return;
  ensureUxStepNavigator();
  ensureConsultationConversationTools();
}


function App() {
  useEffect(() => {
    setupProgressiveConsultantUx();
    setupProgressiveConsultantUxV2();
    setupProgressiveConsultantUxV4();
  });

  const [roomType, setRoomType] = useState("кухня");
  const [zoneType, setZoneType] = useState(ROOM_TO_ZONE["кухня"]);
  const [zoneChangedManually, setZoneChangedManually] = useState(false);
  const [roomShape, setRoomShape] = useState("прямоугольная");
  const [geometryMode, setGeometryMode] = useState("measured_totals");

  const [dimensions, setDimensions] = useState({
    length: "5",
    width: "4",
    height: "2.8",
    diameter: "6",
    manual_floor_area: "20",
    manual_ceiling_area: "",
    use_floor_area_for_ceiling: true,
    manual_perimeter: "18",
    manual_wall_area: "",
    manual_baseboard_length: "",
    geometry_notes: "Нестандартный контур: использовать измеренную площадь, сегменты стен и проёмы.",
  });

  const [openings, setOpenings] = useState([
    { type: "дверь", width: "0.9", height: "2.1", count: "1" },
    { type: "окно", width: "1.5", height: "1.4", count: "1" },
  ]);
  const [draftOpening, setDraftOpening] = useState({ type: "дверь", width: "0.9", height: "2.1", count: "1" });

  const [wallSegments, setWallSegments] = useState([
    { id: "W1", type: "straight", length: "3.2", height: "", baseboard_required: true, finish_required: true, corner_after_type: "inner", angle_deg: "90", notes: "" },
    { id: "W2", type: "straight", length: "4.1", height: "", baseboard_required: true, finish_required: true, corner_after_type: "outer", angle_deg: "90", notes: "" },
    { id: "W3", type: "wave", length: "2.4", height: "", baseboard_required: true, finish_required: true, corner_after_type: "rounded", angle_deg: "", notes: "Фактическая длина по кривой стене." },
  ]);
  const [draftWallSegment, setDraftWallSegment] = useState({ id: "W4", type: "straight", length: "2", height: "", baseboard_required: true, finish_required: true, corner_after_type: "inner", angle_deg: "90", notes: "" });

  const [surfaceSpecs, setSurfaceSpecs] = useState({
    floor: { current_base: "бетонная стяжка", covering: "ламинат", needs_demolition: false, needs_leveling: "unknown" },
    walls: { current_base: "штукатурка", covering: "краска", needs_demolition: false, needs_leveling: "unknown" },
    ceiling: { current_base: "бетон", covering: "краска", has_lighting_points: "unknown", needs_leveling: "unknown" },
  });

  const [repairContext, setRepairContext] = useState({ property_condition: "черновая отделка", repair_level: "капитальный", has_existing_finish: false });
  const [engineering, setEngineering] = useState(getDefaultEngineering("кухня"));
    const [selectedObjects, setSelectedObjects] = useState(["socket", "ceiling_light"]);

const [userGoals, setUserGoals] = useState({ budget_level: "средний", priority: ["долговечность", "простота ухода"], notes: "Нужен практичный ремонт без лишних дорогих решений." });
  const [userQuestion, setUserQuestion] = useState("Подготовь базовую консультацию и расчёт для ремонта помещения.");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const defaultZone = ROOM_TO_ZONE[roomType] || "сухая зона";

  const normalizedDimensions = useMemo(() => {
    if (roomShape === "прямоугольная") {
      return { length: asNumber(dimensions.length), width: asNumber(dimensions.width), height: asNumber(dimensions.height) };
    }
    if (roomShape === "круглая") {
      return { diameter: asNumber(dimensions.diameter), height: asNumber(dimensions.height) };
    }
    return {
      manual_floor_area: asNumber(dimensions.manual_floor_area),
      manual_ceiling_area: dimensions.use_floor_area_for_ceiling ? null : optionalNumber(dimensions.manual_ceiling_area),
      use_floor_area_for_ceiling: Boolean(dimensions.use_floor_area_for_ceiling),
      manual_perimeter: geometryMode === "measured_totals" ? asNumber(dimensions.manual_perimeter) : null,
      height: asNumber(dimensions.height),
      manual_wall_area: optionalNumber(dimensions.manual_wall_area),
      manual_baseboard_length: optionalNumber(dimensions.manual_baseboard_length),
      geometry_notes: dimensions.geometry_notes,
    };
  }, [dimensions, roomShape, geometryMode]);

  const normalizedOpenings = useMemo(() => openings.map((o) => ({
    type: o.type,
    width: asNumber(o.width),
    height: asNumber(o.height),
    count: Math.max(1, Math.floor(asNumber(o.count) || 1)),
  })).filter((o) => o.width > 0 && o.height > 0), [openings]);

  const normalizedWallSegments = useMemo(() => wallSegments.map((s, index) => ({
    id: s.id || `W${index + 1}`,
    type: s.type,
    length: asNumber(s.length),
    height: optionalNumber(s.height),
    baseboard_required: Boolean(s.baseboard_required),
    finish_required: Boolean(s.finish_required),
    corner_after_type: s.corner_after_type,
    angle_deg: optionalNumber(s.angle_deg),
    notes: s.notes || "",
  })).filter((s) => s.length > 0), [wallSegments]);

  const payload = useMemo(() => ({
    room_type: roomType,
    zone_type: zoneType,
    room_shape: roomShape,
    geometry_mode: roomShape === "сложная" ? geometryMode : null,
    dimensions: normalizedDimensions,
    openings: normalizedOpenings,
    wall_segments: roomShape === "сложная" && geometryMode === "wall_segments" ? normalizedWallSegments : [],
      selected_objects: selectedObjects,
    surface_specs: surfaceSpecs,
    repair_context: repairContext,
    engineering,
    user_goals: userGoals,
    user_question: userQuestion,
  }), [roomType, zoneType, roomShape, geometryMode, normalizedDimensions, normalizedOpenings, normalizedWallSegments, surfaceSpecs, repairContext, engineering, userGoals, userQuestion]);

  const legacyPayload = useMemo(() => ({
    ...payload,
    shape: roomShape,
    zone: zoneType,
    length: normalizedDimensions.length ?? normalizedDimensions.diameter ?? normalizedDimensions.manual_floor_area ?? 0,
    width: normalizedDimensions.width ?? normalizedDimensions.diameter ?? normalizedDimensions.manual_perimeter ?? 0,
    height: normalizedDimensions.height ?? 0,
    floor_covering: surfaceSpecs.floor.covering,
    wall_covering: surfaceSpecs.walls.covering,
    ceiling_covering: surfaceSpecs.ceiling.covering,
    floor: surfaceSpecs.floor.covering,
    walls: surfaceSpecs.walls.covering,
    ceiling: surfaceSpecs.ceiling.covering,
    question: userQuestion,
  }), [payload, roomShape, zoneType, normalizedDimensions, surfaceSpecs, userQuestion]);

  function updateRoomType(value) {
    setRoomType(value);
    setZoneType(ROOM_TO_ZONE[value] || "сухая зона");
    setZoneChangedManually(false);
    setEngineering(getDefaultEngineering(value));
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
    if (asNumber(draftOpening.width) <= 0 || asNumber(draftOpening.height) <= 0) {
      setError("Ширина и высота проёма должны быть больше 0.");
      return;
    }
    setOpenings((current) => [...current, draftOpening]);
    setDraftOpening({ type: "дверь", width: "0.9", height: "2.1", count: "1" });
    setError("");
  }

  function removeOpening(index) {
    setOpenings((current) => current.filter((_, i) => i !== index));
  }

  function addWallSegment() {
    if (asNumber(draftWallSegment.length) <= 0) {
      setError("Длина сегмента стены должна быть больше 0.");
      return;
    }
    setWallSegments((current) => [...current, draftWallSegment]);
    setDraftWallSegment((current) => ({ ...current, id: `W${wallSegments.length + 2}`, length: "2", notes: "" }));
    setError("");
  }

  function removeWallSegment(index) {
    setWallSegments((current) => current.filter((_, i) => i !== index));
  }

  
  function toggleSelectedObject(objectCode) {
    setSelectedObjects((current) => {
      const exists = current.includes(objectCode);
      return exists ? current.filter((item) => item !== objectCode) : [...current, objectCode];
    });
  }

function togglePriority(priority) {
    setUserGoals((current) => ({
      ...current,
      priority: current.priority.includes(priority)
        ? current.priority.filter((item) => item !== priority)
        : [...current.priority, priority],
    }));
  }

  async function submitConsultation() {
    setError("");
    setResult(null);
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/consult`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(legacyPayload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}`);
      }

      setResult(await response.json());
    } catch (fetchError) {
      setError(fetchError?.message || "Не удалось получить ответ от backend.");
    } finally {
      setIsLoading(false);
    }
  }

  const resultSource = result?.metrics || result?.calculation || result || {};
  const answer = result?.answer || result?.consultant_answer || result?.response || result?.message || (result ? JSON.stringify(result, null, 2) : "");
  const ragFragments = result?.rag_fragments || result?.found_chunks || result?.context_chunks || result?.sources || result?.context || [];

  const uiWarnings = [];
  if (zoneChangedManually && zoneType !== defaultZone) uiWarnings.push("Зона изменена вручную. Проверьте соответствие условиям эксплуатации.");
  if (roomShape === "сложная" && geometryMode === "measured_totals") uiWarnings.push("Сложная форма считается по общим замерам. Если стены разной длины/высоты или есть кривые участки, лучше использовать режим сегментов стен.");
  if (roomShape === "сложная" && geometryMode === "wall_segments") uiWarnings.push("В режиме сегментов кривые/волнистые стены вводятся по фактически измеренной длине по контуру.");

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Stage 7.2.3 · Контракт сложной геометрии v2</p>
          <h1>AI-консультант по ремонту помещения</h1>
          <p className="hero-text">Интерфейс восстановлен под production-логику: тип помещения, зона, форма, размеры, проёмы, покрытия, инженерные блоки и требования пользователя.</p>
        </div>
        <div className="pipeline-card">
          <strong>Цепочка расчёта</strong>
          <span>тип помещения → зона → форма → режим геометрии</span>
          <span>сегменты → поверхности → инженерия → RAG → ответ</span>
        </div>
      </header>

      <div className="layout">
        <form className="form-panel" onSubmit={(e) => e.preventDefault()}>
          <Section title="1. Помещение и контекст" subtitle="Тип помещения, зона эксплуатации и исходное состояние ремонта задаются в одном первом шаге.">
            <div className="grid two">
              <SelectField label="Тип помещения" value={roomType} options={ROOM_TYPE_OPTIONS} onChange={updateRoomType} />
              <SelectField label="Зона эксплуатации" value={zoneType} options={ZONE_OPTIONS} onChange={(value) => { setZoneType(value); setZoneChangedManually(value !== defaultZone); }} hint={`Рекомендуемая зона: ${defaultZone}`} />
              <SelectField label="Форма помещения" value={roomShape} options={SHAPE_OPTIONS} onChange={setRoomShape} />
            </div>
            {uiWarnings.length ? <div className="warning-box">{uiWarnings.map((w) => <p key={w}>{w}</p>)}</div> : null}
          

            <div className="stage-subblock">
              <h3>Контекст ремонта</h3>
              <p className="stage-subblock-note">Состояние помещения и уровень ремонта влияют на состав работ, риски, подготовку основания и глубину консультации.</p>
              <div className="grid three">
              <SelectField label="Состояние помещения" value={repairContext.property_condition} options={PROPERTY_CONDITIONS} onChange={(v) => setRepairContext((c) => ({ ...c, property_condition: v }))} />
              <SelectField label="Уровень предполагаемого ремонта" value={repairContext.repair_level} options={REPAIR_LEVELS} onChange={(v) => setRepairContext((c) => ({ ...c, repair_level: v }))} />
              <label className="checkbox-line top-space"><input type="checkbox" checked={repairContext.has_existing_finish} onChange={(e) => setRepairContext((c) => ({ ...c, has_existing_finish: e.target.checked }))} /> Есть существующая отделка</label>
            </div>
            </div>
          </Section>
<Section title="2. Геометрия" subtitle="Площадь, периметр, высота, сложный контур и проёмы формируют расчётную базу.">
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
                      <SelectField label="Угол после сегмента" value={getUiLabel(draftWallSegment.corner_after_type)} options={CORNER_TYPES} onChange={(v) => setDraftWallSegment((c) => ({ ...c, corner_after_type: v }))} />
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
          
            <div className="section-actions">
              <button type="button" className="ghost-button" onClick={() => goToPreviousStep("dimensions")}>
                Назад
              </button>
              <button type="button" className="primary-button" onClick={() => completeAndGoNext("dimensions")}>
                Готово, следующий шаг
              </button>
            </div>

          </Section>
<Section
            title="3. Что будет в помещении / объекты"
            subtitle="Выберите объекты ремонта. Система распределит их по черновому, предчистовому и чистовому этапам."
          >
            <div className="stage-logic-note">
              Объект не принадлежит одному этапу. Например, розетка: кабель и подрозетник — черновой этап,
              заделка штробы — предчистовой, механизм и рамка — чистовой.
            </div>

            <div className="repair-object-grid">
              {REPAIR_OBJECT_OPTIONS.map((group) => (
                <div className="repair-object-group" key={group.group}>
                  <h3>{group.group}</h3>
                  {group.options.map(([code, label]) => (
                    <label className={`repair-object-card ${selectedObjects.includes(code) ? "selected" : ""}`} key={code}>
                      <input type="checkbox" checked={selectedObjects.includes(code)} onChange={() => toggleSelectedObject(code)} />
                      <span className="repair-object-title">{label}</span>
                      <small>{REPAIR_OBJECT_LIFECYCLE_HINTS[code]}</small>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </Section>
<Section title="4. Черновой этап / инженерная подготовка"
            subtitle="Скрытые работы: электрика, сантехника, вентиляция, отопление, гидроизоляция и выводы до закрытия отделкой."
          >
            <div className="stage-logic-note">На этом этапе фиксируются скрытые работы. Ответы пользователя дают системе понимание, какие выводы, кабели, трубы, каналы, проверки и подготовительные материалы нужны до предчистовой отделки.</div>

            <div className="grid three">
              {Object.entries(engineering).map(([key, value]) => <SelectField key={key} label={getUiLabel(key)} value={value} options={YES_NO_UNKNOWN} onChange={(v) => updateEngineering(key, v)} />)}
            </div>
          </Section>
<Section title="5. Предчистовой этап / требования к качеству"
            subtitle="Уточняет требования к качеству, долговечности, скорости, стоимости, влагостойкости, звукоизоляции и подготовке поверхности."
          >
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
          </Section>
<Section title="6. Чистовой этап / покрытия" subtitle="Выбор видимых покрытий пола, стен и потолка. Покрытие определяет финишные материалы, операции и требования к основанию.">
            <div className="stage-logic-note">Финишные покрытия нельзя считать отдельно от основания: ламинат зависит от ровности пола, краска — от качества шпаклёвки, плитка — от геометрии, клея, гидроизоляции и швов.</div>

            <div className="surface-card">
              <h3>Пол</h3>
              <div className="grid two">
                <SelectField label="Основание пола" value={surfaceSpecs.floor.current_base} options={BASE_OPTIONS} onChange={(v) => updateSurface("floor", "current_base", v)} />
                <SelectField label="Покрытие пола" value={surfaceSpecs.floor.covering} options={FLOOR_COVERINGS} onChange={(v) => updateSurface("floor", "covering", v)} />
                <SelectField label="Нужно выравнивание" value={surfaceSpecs.floor.needs_leveling} options={["yes", "no", "unknown"]} onChange={(v) => updateSurface("floor", "needs_leveling", v)} />
                <label className="checkbox-line"><input type="checkbox" checked={surfaceSpecs.floor.needs_demolition} onChange={(e) => updateSurface("floor", "needs_demolition", e.target.checked)} /> Нужен демонтаж пола</label>
              </div>
            </div>

            <div className="surface-card">
              <h3>Стены</h3>
              <div className="grid two">
                <SelectField label="Основание стен" value={surfaceSpecs.walls.current_base} options={BASE_OPTIONS} onChange={(v) => updateSurface("walls", "current_base", v)} />
                <SelectField label="Покрытие стен" value={surfaceSpecs.walls.covering} options={WALL_COVERINGS} onChange={(v) => updateSurface("walls", "covering", v)} />
                <SelectField label="Нужно выравнивание" value={surfaceSpecs.walls.needs_leveling} options={["yes", "no", "unknown"]} onChange={(v) => updateSurface("walls", "needs_leveling", v)} />
                <label className="checkbox-line"><input type="checkbox" checked={surfaceSpecs.walls.needs_demolition} onChange={(e) => updateSurface("walls", "needs_demolition", e.target.checked)} /> Нужен демонтаж стен</label>
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
          </Section>
<Section title="7. Итог и консультация"
            subtitle="После заполнения этапов пользователь получает расчёт, консультацию, этапы работ и возможность продолжить диалог."
          >
            <div className="stage-logic-note">Здесь пользователь задаёт уточняющий вопрос. Расчёт остаётся ниже как раскрываемый результат, а консультация должна объяснять этапы, материалы, риски и следующий безопасный шаг.</div>

            <textarea value={userQuestion} onChange={(e) => setUserQuestion(e.target.value)} rows={4} />
            <button type="button" className="primary-button" onClick={submitConsultation} disabled={isLoading}>{isLoading ? "Формируется консультация..." : "Сформировать консультацию"}</button>
            {error ? <div className="error-box">{error}</div> : null}
          </Section>

          

          
          



          

          

          

          

          
        </form>

        <aside className="result-panel">
          <Section title="Результат консультанта" subtitle="Backend принимает Stage 7.2.3 contract: простые формы считаются формулами, сложные — по общим замерам или сегментам стен.">
            {result ? (
              <>
                <div className="status-line">Ответ сформирован</div>
                <div className="metrics-grid">
                  <div><span>Площадь пола</span><strong>{roundNumber(getMetric(resultSource, ["floor_area", "floorArea", "s_floor"]))} м²</strong></div>
                  <div><span>Площадь потолка</span><strong>{roundNumber(getMetric(resultSource, ["ceiling_area", "ceilingArea", "s_ceiling"]))} м²</strong></div>
                  <div><span>Периметр</span><strong>{roundNumber(getMetric(resultSource, ["perimeter", "p"]))} м</strong></div>
                  <div><span>Стены чистая</span><strong>{roundNumber(getMetric(resultSource, ["walls_net_area", "wall_area_net", "walls_clean", "clean_wall_area"]))} м²</strong></div>
                  <div><span>Проёмы</span><strong>{roundNumber(getMetric(resultSource, ["openings_area", "opening_area", "openingsArea"]))} м²</strong></div>
                  <div><span>Плинтус</span><strong>{roundNumber(getMetric(resultSource, ["plinth", "baseboard", "perimeter"]))} м.пог.</strong></div>
                </div>
                <div className="answer-box"><h3>Консультация</h3><pre>{answer}</pre></div>
                {Array.isArray(ragFragments) && ragFragments.length ? <details hidden className="rag-details"><summary>Технические источники / RAG-фрагменты</summary><pre>{JSON.stringify(ragFragments, null, 2)}</pre></details> : null}
              </>
            ) : <div className="empty-result"><p>После запуска здесь появятся расчётные показатели и консультация.</p></div>}
          </Section>

          <Section title="Технические данные" subtitle="Stage 7.2.3 contract, который отправляется в backend.">
            <pre className="payload-preview">{JSON.stringify(payload, null, 2)}</pre>
          </Section>
        </aside>
      </div>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
