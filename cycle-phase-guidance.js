/* ============================================================
   TSUKI 🌙 — VERSION 1.0 PRE-RELEASE
   FOUR-PHASE CYCLE GUIDANCE
   User-facing model for regular cycles:
   Menstruation → Follicular → Ovulation → Luteal.
   Early/mid/late luteal are adaptive substages inside Luteal only.
   Irregular/uncertain or overdue timing uses a general body-first check-in.
   ============================================================ */
(() => {
  "use strict";

  if (window.TsukiFourPhaseCycleGuidance?.installed) return;

  const VERSION = "1.0.0-pre-four-phase-3";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = value => typeof escapeHTML === "function"
    ? escapeHTML(value)
    : String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
      }[char]));

  const key = () => $("#logDate")?.value || (typeof todayKey === "function" ? todayKey() : "");
  const cyclePattern = () => {
    try { return typeof cyclePatternSetting === "function" ? cyclePatternSetting() : data?.settings?.cyclePattern || "regular"; }
    catch (_) { return "regular"; }
  };
  const regular = () => data?.mode === "cycle" && cyclePattern() === "regular";
  const rawPhase = dateKey => {
    try { return typeof phaseForDate === "function" ? phaseForDate(dateKey) : "No cycle yet"; }
    catch (_) { return "No cycle yet"; }
  };
  const cycleDay = dateKey => {
    try { return typeof cycleDayForDate === "function" ? cycleDayForDate(dateKey) : null; }
    catch (_) { return null; }
  };
  const actualPeriod = dateKey => {
    try { return typeof periodForDate === "function" ? Boolean(periodForDate(dateKey)) : Boolean(data?.periods?.some(period => period.start === dateKey)); }
    catch (_) { return Boolean(data?.periods?.some(period => period.start === dateKey)); }
  };
  const effectivePhase = dateKey => actualPeriod(dateKey) ? "Period" : rawPhase(dateKey);

  function timingState(dateKey = key()) {
    if (!regular()) return "general";
    if (actualPeriod(dateKey)) return "actual-period";
    try {
      const timing = cycleTimingForDate(dateKey);
      const date = parseDate(dateKey);
      const expected = parseDate(timing?.nextStart);
      if (!date || !expected) return "predicted";
      return daysBetween(expected, date) > 0 ? "overdue" : "predicted";
    }
    catch (_) { return "predicted"; }
  }

  function lutealSubstage(dateKey = key()) {
    if (!regular() || effectivePhase(dateKey) !== "Luteal phase" || timingState(dateKey) === "overdue") return "";
    try {
      const timing = cycleTimingForDate(dateKey);
      const date = parseDate(dateKey);
      if (!timing?.nextStart || !date) return "";
      const daysLeft = daysBetween(date, timing.nextStart);
      return daysLeft <= 4 ? "late" : daysLeft <= 9 ? "mid" : "early";
    }
    catch (_) { return ""; }
  }

  function userPhaseName(phase) {
    if (phase === "Period") return "Menstruation";
    if (phase === "Follicular phase") return "Follicular";
    if (phase === "Estimated ovulation") return "Ovulation";
    if (phase === "Luteal phase") return "Luteal";
    return phase;
  }

  const symptomButtons = list => `<div class="tsuki-signal-shortcuts">${list.map(([value, label]) =>
    `<button type="button" data-four-phase-symptom="${esc(value)}">${esc(label)}</button>`
  ).join("")}</div>`;

  function lutealSymptoms(substage) {
    if (substage === "late") return [
      ["Bloating", "🫧 Bloating"], ["Tender Breasts", "🌸 Tender breasts"],
      ["Headache", "☁️ Headache"], ["Migraine", "🌧️ Migraine"],
      ["Back Pain", "🌿 Back pain"], ["Fatigue", "💤 Fatigue"],
      ["Constipation", "🌿 Constipation"], ["Loose Stools", "🌿 Loose stools"],
      ["Acne", "✨ Acne / skin"]
    ];
    if (substage === "mid") return [
      ["Tender Breasts", "🌸 Tender breasts"], ["Bloating", "🫧 Bloating"],
      ["Acne", "✨ Acne / skin"], ["Headache", "☁️ Headache"], ["Fatigue", "💤 Fatigue"]
    ];
    return [
      ["Breast Fullness", "🌸 Breast fullness"], ["Bloating", "🫧 Bloating"], ["Fatigue", "💤 Fatigue"]
    ];
  }

  function generalQuestions(reason = "uncertain") {
    const intro = reason === "overdue"
      ? "Your expected period window has passed without a saved period. Tsuki will stop assuming a precise phase and follow what your body is actually doing."
      : "Your cycle timing is variable or still being learned, so Tsuki will ask body-first questions without assuming Follicular, Ovulation or Luteal.";
    return `<p class="eyebrow">GENERAL CYCLE CHECK-IN</p>
      <p class="tsuki-help">${esc(intro)} Unexpected spotting or bleeding can still be logged separately.</p>
      ${segmentedHTML("discharge", "Cervical mucus / discharge", ["Dry", "Sticky", "Creamy", "Watery", "Slippery / stretchy"])}
      ${segmentedHTML("focus", "Focus / concentration", ["Low", "Medium", "High"])}
      ${segmentedHTML("motivation", "Motivation", ["Low", "Medium", "High"])}
      ${segmentedHTML("stress", "Stress", ["Low", "Medium", "High"])}
      ${segmentedHTML("appetite", "Appetite", ["Low", "Usual", "High"])}
      ${segmentedHTML("cravingIntensity", "Cravings", ["None", "Mild", "Strong"])}
      ${segmentedHTML("libido", "Libido", ["Low", "Medium", "High"])}
      <p class="tsuki-help">Mood, energy, sleep, pain and your full symptom list remain available in the regular daily sections below.</p>`;
  }

  function phaseQuestions(phase, dateKey) {
    if (!regular()) return generalQuestions("uncertain");
    if (timingState(dateKey) === "overdue") return generalQuestions("overdue");

    if (phase === "Period") {
      return `<p class="eyebrow">MENSTRUATION</p>
        <p class="tsuki-help">Flow and cramps are prioritized during menstruation. Your usual mood, energy, sleep and symptom questions remain available too.</p>`;
    }

    if (phase === "Follicular phase") {
      return `<p class="eyebrow">FOLLICULAR</p>
        <p class="tsuki-help">No routine period-flow question here. Unexpected spotting can still be logged separately.</p>
        ${segmentedHTML("focus", "Focus", ["Low", "Medium", "High"])}
        ${segmentedHTML("motivation", "Motivation", ["Low", "Medium", "High"])}
        ${segmentedHTML("discharge", "Cervical mucus / discharge", ["Dry", "Sticky", "Creamy", "Watery", "Slippery / stretchy"])}`;
    }

    if (phase === "Estimated ovulation") {
      return `<p class="eyebrow">OVULATION</p>
        <p class="tsuki-help">These observations can help Tsuki understand your pattern, but they do not prove ovulation occurred.</p>
        ${segmentedHTML("discharge", "Cervical mucus / discharge", ["Dry", "Sticky", "Creamy", "Watery", "Slippery / stretchy"])}
        ${segmentedHTML("libido", "Libido", ["Low", "Medium", "High"])}
        ${segmentedHTML("ovulationDiscomfort", "Mid-cycle pelvic discomfort", ["None", "Mild", "Noticeable"])}`;
    }

    if (phase === "Luteal phase") {
      const substage = lutealSubstage(dateKey);
      const sublabel = substage ? `${substage[0].toUpperCase()}${substage.slice(1)} luteal focus` : "Luteal focus";
      return `<p class="eyebrow">LUTEAL</p>
        <p class="tsuki-help"><strong>${esc(sublabel)}</strong> · This remains one Luteal phase. Tsuki only adapts prompts as your expected period gets closer.</p>
        ${segmentedHTML("discharge", "Cervical mucus / discharge", ["Dry", "Sticky", "Creamy", "Watery", "Slippery / stretchy"])}
        ${segmentedHTML("stress", "Stress", ["Low", "Medium", "High"])}
        ${segmentedHTML("focus", "Focus / concentration", ["Low", "Medium", "High"])}
        ${segmentedHTML("appetite", "Appetite", ["Low", "Usual", "High"])}
        ${segmentedHTML("cravingIntensity", "Cravings", ["None", "Mild", "Strong"])}
        ${segmentedHTML("libido", "Libido", ["Low", "Medium", "High"])}
        <div class="phase-field-block"><p class="card-label">Notice any of these?</p>${symptomButtons(lutealSymptoms(substage))}</div>`;
    }

    return generalQuestions("uncertain");
  }

  function syncSymptoms() {
    $$('[data-four-phase-symptom]').forEach(button => {
      const input = $$('input[name="symptom"]').find(item => item.value === button.dataset.fourPhaseSymptom);
      if (!input) return;
      button.classList.toggle("active", input.checked);
      button.setAttribute("aria-pressed", input.checked ? "true" : "false");
      if (button.dataset.bound === "1") return;
      button.dataset.bound = "1";
      button.addEventListener("click", () => {
        input.checked = !input.checked;
        input.dispatchEvent(new Event("change", { bubbles: true }));
        syncSymptoms();
      });
    });
  }

  function apply() {
    if (data?.mode !== "cycle") return;
    const dateKey = key();
    const phase = effectivePhase(dateKey);
    const isRegular = regular();
    const state = timingState(dateKey);
    const name = userPhaseName(phase);
    const day = cycleDay(dateKey);
    const content = $("#phaseSpecificLogContent");
    const card = $("#phaseSpecificLogCard");
    const title = $("#logPhaseTitle");
    const screenTitle = $("#logScreenTitle");
    const eyebrow = $("#logPhaseEyebrow");
    const question = $("#logPhaseQuestion");
    const description = $("#logPhaseDescription");

    if (content && card) {
      const html = phaseQuestions(phase, dateKey);
      content.innerHTML = html;
      content.dataset.fourPhaseSig = `${isRegular ? phase : "general"}|${state}|${lutealSubstage(dateKey)}`;
      card.classList.toggle("hidden", !html);
      card.classList.toggle("tsuki-phase-focus", Boolean(html));
    }

    const showGeneral = !isRegular || state === "overdue";
    if (showGeneral) {
      if (title) title.textContent = state === "overdue" ? "Timing uncertain" : "General cycle check-in";
      if (screenTitle) screenTitle.textContent = state === "overdue" ? "Timing-uncertain check-in" : "General cycle check-in";
      if (eyebrow) eyebrow.textContent = day ? `CYCLE DAY ${day} · BODY-FIRST` : "BODY-FIRST CHECK-IN";
      if (question) question.textContent = state === "overdue" ? "Your period has not started yet—what is your body doing today?" : "What are you noticing in your body today?";
      if (description) description.textContent = state === "overdue"
        ? "Tsuki will not keep extending a predicted luteal phase after the expected period window. Actual bleeding, symptoms and body observations take priority."
        : "Because your timing varies or is still being learned, Tsuki uses general observations instead of assigning phase-specific questions.";
    }
    else {
      if (title && ["Period", "Follicular phase", "Estimated ovulation", "Luteal phase"].includes(phase)) title.textContent = name;
      if (screenTitle && ["Period", "Follicular phase", "Estimated ovulation", "Luteal phase"].includes(phase)) screenTitle.textContent = `${name} check-in`;
      if (eyebrow && ["Period", "Follicular phase", "Estimated ovulation", "Luteal phase"].includes(phase)) eyebrow.textContent = day ? `CYCLE DAY ${day} · ${name.toUpperCase()}` : name.toUpperCase();

      if (question) {
        if (phase === "Period") question.textContent = "How is your period and how are you feeling today?";
        if (phase === "Follicular phase") question.textContent = "How are your focus, motivation and cervical mucus today?";
        if (phase === "Estimated ovulation") question.textContent = "Are you noticing any ovulation-related body changes today?";
        if (phase === "Luteal phase") question.textContent = "What changes are you noticing during your luteal phase today?";
      }

      if (description) {
        if (phase === "Period") description.textContent = "Track flow, cramps and your usual daily symptoms. The actual saved period date controls Cycle Day 1.";
        if (phase === "Follicular phase") description.textContent = "Focus, motivation and cervical-mucus changes can add pattern context; period flow stays hidden unless unexpected bleeding is logged.";
        if (phase === "Estimated ovulation") description.textContent = "Cervical mucus, libido and mid-cycle discomfort are optional clues. Tsuki does not confirm ovulation from one sign.";
        if (phase === "Luteal phase") description.textContent = "Discharge, concentration, stress, appetite, cravings, libido and common pre-period symptoms are tracked within one Luteal phase.";
      }
    }

    syncSymptoms();
  }

  function wrap() {
    if (typeof loadLogForm === "function" && !loadLogForm.__fourPhaseWrapped) {
      const base = loadLogForm;
      const wrapped = function(...args) {
        const result = base.apply(this, args);
        requestAnimationFrame(apply);
        return result;
      };
      wrapped.__fourPhaseWrapped = true;
      loadLogForm = wrapped;
      window.loadLogForm = wrapped;
    }

    if (typeof showScreen === "function" && !showScreen.__fourPhaseWrapped) {
      const base = showScreen;
      const wrapped = function(name, ...args) {
        const result = base.call(this, name, ...args);
        if (name === "log") requestAnimationFrame(() => requestAnimationFrame(apply));
        return result;
      };
      wrapped.__fourPhaseWrapped = true;
      showScreen = wrapped;
      window.showScreen = wrapped;
    }

    const dateInput = $("#logDate");
    if (dateInput && dateInput.dataset.fourPhaseBound !== "1") {
      dateInput.dataset.fourPhaseBound = "1";
      dateInput.addEventListener("change", () => requestAnimationFrame(() => requestAnimationFrame(apply)));
    }
  }

  function install() {
    if (window.TsukiFourPhaseCycleGuidance?.installed) return;
    if (typeof data === "undefined" || typeof segmentedHTML !== "function" || !$("#dailyLogForm")) {
      setTimeout(install, 50);
      return;
    }
    wrap();
    apply();
    window.TsukiFourPhaseCycleGuidance = {
      installed: true,
      version: VERSION,
      test: { userPhaseName, lutealSubstage, phaseQuestions, generalQuestions, timingState, effectivePhase }
    };
  }

  window.TsukiFourPhaseCycleGuidance = {
    installed: false,
    version: VERSION,
    test: { userPhaseName, lutealSubstage, phaseQuestions, generalQuestions, timingState, effectivePhase },
    install
  };

  if (!window.__TSUKI_TEST__) install();
})();
