/* ============================================================
   TSUKI 🌙 — VERSION 1.0 PRE-RELEASE
   FOUR-PHASE CYCLE GUIDANCE
   Menstruation → Follicular → Ovulation → Luteal.
   Early/mid/late luteal are adaptive substages inside Luteal only.
   Mood, energy and sleep stay as baseline questions across the cycle;
   the extra phase questions rotate with the current phase.
   ============================================================ */
(() => {
  "use strict";

  if (window.TsukiFourPhaseCycleGuidance?.installed) return;

  const VERSION = "1.0.0-pre-four-phase-4";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = value => typeof escapeHTML === "function"
    ? escapeHTML(value)
    : String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
      }[char]));

  const EXTRA_CONTEXTS = [
    ["Intense training", "🏃"],
    ["Diet / eating change", "🍽️"],
    ["Alcohol", "🍷"],
    ["Vaccination", "💉"],
    ["New supplement / vitamin", "🌿"],
    ["Major emotional event", "💗"],
    ["Work / school shift change", "🕒"],
    ["Heat / dehydration", "☀️"]
  ];

  const PERIOD_SYMPTOMS = [
    ["Bloating", "🫧 Bloating"],
    ["Back Pain", "🌿 Back pain"],
    ["Fatigue", "💤 Fatigue"],
    ["Headache", "☁️ Headache"],
    ["Migraine", "🌧️ Migraine"],
    ["Tender Breasts", "🌸 Tender breasts"],
    ["Constipation", "🌿 Constipation"],
    ["Loose Stools", "🌿 Loose stools"],
    ["Body Aches", "🌿 Body aches"],
    ["Pelvic Heaviness", "🌙 Pelvic heaviness"]
  ];

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

  let applying = false;
  let phaseObserver = null;
  let contextObserver = null;

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

  function availableSymptomButtons(list) {
    const available = list.filter(([value]) => $$('input[name="symptom"]').some(input => input.value === value));
    if (!available.length) return "";
    return `<div class="tsuki-signal-shortcuts">${available.map(([value, label]) =>
      `<button type="button" data-four-phase-symptom="${esc(value)}">${esc(label)}</button>`
    ).join("")}</div>`;
  }

  function lutealSymptoms(substage) {
    if (substage === "late") return [
      ["Bloating", "🫧 Bloating"], ["Tender Breasts", "🌸 Tender breasts"],
      ["Headache", "☁️ Headache"], ["Migraine", "🌧️ Migraine"],
      ["Back Pain", "🌿 Back pain"], ["Fatigue", "💤 Fatigue"],
      ["Constipation", "🌿 Constipation"], ["Loose Stools", "🌿 Loose stools"],
      ["Acne", "✨ Acne / skin"], ["Brain Fog", "🌫️ Brain fog"],
      ["Water Retention", "💧 Puffiness / water retention"]
    ];
    if (substage === "mid") return [
      ["Tender Breasts", "🌸 Tender breasts"], ["Bloating", "🫧 Bloating"],
      ["Acne", "✨ Acne / skin"], ["Headache", "☁️ Headache"],
      ["Fatigue", "💤 Fatigue"], ["Brain Fog", "🌫️ Brain fog"]
    ];
    return [
      ["Breast Fullness", "🌸 Breast fullness"],
      ["Bloating", "🫧 Bloating"],
      ["Fatigue", "💤 Fatigue"]
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
      <p class="tsuki-help">Mood, energy, sleep, pain and your full symptom list remain available as baseline observations.</p>`;
  }

  function phaseQuestions(phase, dateKey) {
    if (!regular()) return generalQuestions("uncertain");
    if (timingState(dateKey) === "overdue") return generalQuestions("overdue");

    if (phase === "Period") {
      return `<p class="eyebrow">MENSTRUATION</p>
        <p class="tsuki-help">Flow and cramps are prioritized here. Cervical-mucus questions are intentionally hidden during a saved period.</p>
        ${segmentedHTML("appetite", "Appetite today", ["Low", "Usual", "High"])}
        ${segmentedHTML("cravingIntensity", "Cravings", ["None", "Mild", "Strong"])}
        <div class="phase-field-block"><p class="card-label">Any other period-day changes?</p>${availableSymptomButtons(PERIOD_SYMPTOMS)}</div>
        <p class="tsuki-help">Mood, energy and sleep stay available below so Tsuki can compare the same baseline across your whole cycle.</p>`;
    }

    if (phase === "Follicular phase") {
      return `<p class="eyebrow">FOLLICULAR</p>
        <p class="tsuki-help">No routine period-flow question here. Unexpected spotting can still be logged separately.</p>
        ${segmentedHTML("focus", "Focus / concentration", ["Low", "Medium", "High"])}
        ${segmentedHTML("motivation", "Motivation", ["Low", "Medium", "High"])}
        ${segmentedHTML("discharge", "Cervical mucus / discharge", ["Dry", "Sticky", "Creamy", "Watery", "Slippery / stretchy"])}
        ${segmentedHTML("libido", "Libido", ["Low", "Medium", "High"])}`;
    }

    if (phase === "Estimated ovulation") {
      return `<p class="eyebrow">OVULATION</p>
        <p class="tsuki-help">These are optional mid-cycle observations. They can add pattern context, but they do not prove ovulation occurred.</p>
        ${segmentedHTML("discharge", "Cervical mucus / discharge", ["Dry", "Sticky", "Creamy", "Watery", "Slippery / stretchy"])}
        ${segmentedHTML("libido", "Libido", ["Low", "Medium", "High"])}
        ${segmentedHTML("ovulationDiscomfort", "Mid-cycle pelvic discomfort", ["None", "Mild", "Noticeable"])}`;
    }

    if (phase === "Luteal phase") {
      const substage = lutealSubstage(dateKey);
      const shortcuts = availableSymptomButtons(lutealSymptoms(substage));

      if (substage === "early") {
        return `<p class="eyebrow">LUTEAL · EARLY</p>
          <p class="tsuki-help">Early luteal keeps the focus lighter while your body settles after mid-cycle.</p>
          ${segmentedHTML("discharge", "Cervical mucus / discharge", ["Dry", "Sticky", "Creamy", "Watery", "Slippery / stretchy"])}
          ${segmentedHTML("stress", "Stress", ["Low", "Medium", "High"])}
          ${segmentedHTML("appetite", "Appetite", ["Low", "Usual", "High"])}
          <div class="phase-field-block"><p class="card-label">Notice any of these?</p>${shortcuts}</div>`;
      }

      if (substage === "mid") {
        return `<p class="eyebrow">LUTEAL · MID</p>
          <p class="tsuki-help">Mid luteal shifts toward concentration, appetite and the body changes you may notice before the final days of the cycle.</p>
          ${segmentedHTML("stress", "Stress", ["Low", "Medium", "High"])}
          ${segmentedHTML("focus", "Focus / concentration", ["Low", "Medium", "High"])}
          ${segmentedHTML("appetite", "Appetite", ["Low", "Usual", "High"])}
          ${segmentedHTML("cravingIntensity", "Cravings", ["None", "Mild", "Strong"])}
          <div class="phase-field-block"><p class="card-label">Notice any of these?</p>${shortcuts}</div>`;
      }

      return `<p class="eyebrow">LUTEAL · LATE</p>
        <p class="tsuki-help">Late luteal prioritizes your own pre-period pattern without assuming bleeding will start on an exact day.</p>
        ${segmentedHTML("stress", "Stress", ["Low", "Medium", "High"])}
        ${segmentedHTML("focus", "Focus / concentration", ["Low", "Medium", "High"])}
        ${segmentedHTML("appetite", "Appetite", ["Low", "Usual", "High"])}
        ${segmentedHTML("cravingIntensity", "Cravings", ["None", "Mild", "Strong"])}
        ${segmentedHTML("libido", "Libido", ["Low", "Medium", "High"])}
        <div class="phase-field-block"><p class="card-label">Any familiar pre-period changes?</p>${shortcuts}</div>`;
    }

    return generalQuestions("uncertain");
  }

  function syncSymptoms() {
    $$('[data-four-phase-symptom]').forEach(button => {
      const input = $$('input[name="symptom"]').find(item => item.value === button.dataset.fourPhaseSymptom);
      if (!input) {
        button.classList.add("hidden");
        return;
      }
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

  function ensureContextOptions() {
    const grid = $(".adaptive-context-grid");
    if (!grid) return;
    const existing = new Set($$("[data-adaptive-context]", grid).map(input => input.dataset.adaptiveContext));
    const active = new Set(data?.logs?.[key()]?.contexts || []);

    EXTRA_CONTEXTS.forEach(([label, icon]) => {
      if (existing.has(label)) return;
      const wrapper = document.createElement("label");
      wrapper.dataset.tsukiExtraContext = "1";
      wrapper.innerHTML = `<input type="checkbox" data-adaptive-context="${esc(label)}"><span>${icon} ${esc(label)}</span>`;
      const input = wrapper.querySelector("input");
      if (input) input.checked = active.has(label);
      grid.appendChild(wrapper);
    });

    const summary = grid.closest("details")?.querySelector("summary small");
    if (summary) summary.textContent = "Travel, illness, sleep, exercise, treatment & routine changes";
  }

  function syncPeriodDayAction() {
    const button = $("#dayDetailPeriodButton");
    if (!button) return;
    let selected = "";
    try { selected = typeof selectedDayDetailKey !== "undefined" ? selectedDayDetailKey : ""; } catch (_) {}
    let period = null;
    try { period = selected && typeof periodForDate === "function" ? periodForDate(selected) : null; } catch (_) {}
    button.dataset.editPeriodId = period?.id || "";
    button.textContent = period ? "✏️ Edit period dates" : "🩸 Log period";
  }

  function bindPeriodDayAction() {
    const button = $("#dayDetailPeriodButton");
    if (!button || button.dataset.fourPhasePeriodEditBound === "1") return;
    button.dataset.fourPhasePeriodEditBound = "1";
    button.addEventListener("click", event => {
      const id = button.dataset.editPeriodId || "";
      if (!id) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      const period = data?.periods?.find(item => item.id === id);
      if (!period) return;

      try { if (typeof closeDayDetail === "function") closeDayDetail(); } catch (_) {}
      try { if (typeof showScreen === "function") showScreen("cycle-history"); } catch (_) {}
      try { if (typeof editPeriod === "function") editPeriod(period.id); } catch (_) {}
      requestAnimationFrame(() => {
        try { if (typeof openPeriodCalendar === "function") openPeriodCalendar(); } catch (_) {}
      });
    }, true);
  }

  function ensurePeriodCalendarHint() {
    const done = $("#periodCalendarDone");
    if (!done || $("#periodActualRangeHint")) return;
    const note = document.createElement("p");
    note.id = "periodActualRangeHint";
    note.className = "muted small-text";
    note.textContent = "Choose the actual first and last bleeding day. A 4-day period can be saved as 4 days; the default length is only a starting suggestion.";
    done.parentNode?.insertBefore(note, done);
  }

  function apply() {
    if (applying || data?.mode !== "cycle") return;
    applying = true;
    try {
      const dateKey = key();
      const phase = effectivePhase(dateKey);
      const isRegular = regular();
      const state = timingState(dateKey);
      const substage = lutealSubstage(dateKey);
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
        const signature = `${isRegular ? phase : "general"}|${state}|${substage}`;
        if (content.dataset.fourPhaseSig !== signature) {
          content.innerHTML = phaseQuestions(phase, dateKey);
          content.dataset.fourPhaseSig = signature;
        }
        card.classList.remove("hidden");
        card.classList.add("tsuki-phase-focus");
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
        if (title) title.textContent = phase === "Luteal phase" && substage ? `${substage[0].toUpperCase()}${substage.slice(1)} Luteal` : name;
        if (screenTitle) screenTitle.textContent = phase === "Luteal phase" && substage ? `${substage[0].toUpperCase()}${substage.slice(1)} Luteal check-in` : `${name} check-in`;
        if (eyebrow) eyebrow.textContent = day ? `CYCLE DAY ${day} · ${name.toUpperCase()}` : name.toUpperCase();

        if (question) {
          if (phase === "Period") question.textContent = "How is your period affecting your body today?";
          if (phase === "Follicular phase") question.textContent = "How are your focus, motivation and body changes today?";
          if (phase === "Estimated ovulation") question.textContent = "Are you noticing any mid-cycle changes today?";
          if (phase === "Luteal phase" && substage === "early") question.textContent = "How is your body settling after mid-cycle?";
          if (phase === "Luteal phase" && substage === "mid") question.textContent = "Are appetite, focus or body changes shifting today?";
          if (phase === "Luteal phase" && substage !== "early" && substage !== "mid") question.textContent = "Are any of your usual pre-period changes showing up?";
        }

        if (description) {
          if (phase === "Period") description.textContent = "Track actual flow, cramps and period-day symptoms. Cervical mucus stays out of the menstruation check-in.";
          if (phase === "Follicular phase") description.textContent = "Focus, motivation, libido and cervical-mucus changes can add pattern context; period flow stays hidden unless unexpected bleeding is logged.";
          if (phase === "Estimated ovulation") description.textContent = "Cervical mucus, libido and mid-cycle discomfort are optional clues. Tsuki does not confirm ovulation from one sign.";
          if (phase === "Luteal phase" && substage === "early") description.textContent = "Early luteal emphasizes discharge, stress, appetite and a small set of body changes.";
          if (phase === "Luteal phase" && substage === "mid") description.textContent = "Mid luteal shifts toward stress, concentration, appetite, cravings and emerging body changes.";
          if (phase === "Luteal phase" && substage !== "early" && substage !== "mid") description.textContent = "Late luteal prioritizes your own pre-period pattern, cravings, concentration and familiar symptoms without assuming an exact start date.";
        }
      }

      syncSymptoms();
      ensureContextOptions();
      bindPeriodDayAction();
      syncPeriodDayAction();
      ensurePeriodCalendarHint();
      requestAnimationFrame(() => window.TsukiCyclePhaseDedupe?.apply?.());
    }
    finally {
      applying = false;
    }
  }

  function wrap() {
    if (typeof loadLogForm === "function" && !loadLogForm.__fourPhaseWrappedV4) {
      const base = loadLogForm;
      const wrapped = function(...args) {
        const result = base.apply(this, args);
        requestAnimationFrame(() => requestAnimationFrame(apply));
        return result;
      };
      wrapped.__fourPhaseWrappedV4 = true;
      loadLogForm = wrapped;
      window.loadLogForm = wrapped;
    }

    if (typeof showScreen === "function" && !showScreen.__fourPhaseWrappedV4) {
      const base = showScreen;
      const wrapped = function(name, ...args) {
        const result = base.call(this, name, ...args);
        if (["log", "calendar", "cycle-history"].includes(name)) {
          requestAnimationFrame(() => requestAnimationFrame(apply));
        }
        return result;
      };
      wrapped.__fourPhaseWrappedV4 = true;
      showScreen = wrapped;
      window.showScreen = wrapped;
    }

    if (typeof openDayDetail === "function" && !openDayDetail.__fourPhaseWrappedV4) {
      const base = openDayDetail;
      const wrapped = function(...args) {
        const result = base.apply(this, args);
        syncPeriodDayAction();
        return result;
      };
      wrapped.__fourPhaseWrappedV4 = true;
      openDayDetail = wrapped;
      window.openDayDetail = wrapped;
    }

    const dateInput = $("#logDate");
    if (dateInput && dateInput.dataset.fourPhaseBoundV4 !== "1") {
      dateInput.dataset.fourPhaseBoundV4 = "1";
      dateInput.addEventListener("change", () => requestAnimationFrame(() => requestAnimationFrame(apply)));
    }
  }

  function installObservers() {
    const content = $("#phaseSpecificLogContent");
    if (content && !phaseObserver) {
      phaseObserver = new MutationObserver(() => {
        if (!applying) requestAnimationFrame(apply);
      });
      phaseObserver.observe(content, { childList: true, subtree: true });
    }

    const logScreen = $('[data-screen="log"]');
    if (logScreen && !contextObserver) {
      contextObserver = new MutationObserver(() => {
        if (!applying) requestAnimationFrame(ensureContextOptions);
      });
      contextObserver.observe(logScreen, { childList: true, subtree: true });
    }
  }

  function questionFieldsFor(phase, substage = "") {
    if (phase === "Period") return ["appetite", "cravingIntensity", "period-symptom-shortcuts"];
    if (phase === "Follicular phase") return ["focus", "motivation", "discharge", "libido"];
    if (phase === "Estimated ovulation") return ["discharge", "libido", "ovulationDiscomfort"];
    if (phase === "Luteal phase" && substage === "early") return ["discharge", "stress", "appetite", "early-luteal-symptoms"];
    if (phase === "Luteal phase" && substage === "mid") return ["stress", "focus", "appetite", "cravingIntensity", "mid-luteal-symptoms"];
    if (phase === "Luteal phase") return ["stress", "focus", "appetite", "cravingIntensity", "libido", "late-luteal-symptoms"];
    return ["discharge", "focus", "motivation", "stress", "appetite", "cravingIntensity", "libido"];
  }

  function install() {
    if (window.TsukiFourPhaseCycleGuidance?.installed) return;
    if (typeof data === "undefined" || typeof showScreen !== "function") {
      setTimeout(install, 80);
      return;
    }

    wrap();
    installObservers();
    bindPeriodDayAction();
    ensurePeriodCalendarHint();

    window.TsukiFourPhaseCycleGuidance = {
      installed: true,
      version: VERSION,
      apply,
      test: {
        timingState,
        lutealSubstage,
        effectivePhase,
        questionFieldsFor
      },
      disconnect: () => {
        phaseObserver?.disconnect();
        contextObserver?.disconnect();
      }
    };

    apply();
  }

  window.TsukiFourPhaseCycleGuidance = { installed: false, install };
  if (!window.__TSUKI_TEST__) install();
})();
