/* ============================================================
   TSUKI v1 — REPRODUCTIVE INTELLIGENCE
   Local-only sexual activity + pregnancy-possibility context.
   Never labels a day "safe", diagnoses pregnancy, or changes period forecasts.
   ============================================================ */

(() => {
  "use strict";

  const PUBLIC_VERSION = "v1.0";
  const state = { installed: false, base: {}, draft: null };
  const SEX_OPTIONS = [
    ["none", "No vaginal sex"],
    ["vaginal", "Vaginal sex"]
  ];
  const PROTECTION_OPTIONS = [
    ["condom", "Condom / barrier"],
    ["hormonal", "Hormonal method or IUD"],
    ["dual", "Condom + another method"],
    ["withdrawal", "Withdrawal only"],
    ["none", "No contraception"],
    ["unsure", "Unsure / prefer not to say"]
  ];
  const EXPOSURE_OPTIONS = [
    ["inside", "Ejaculation in vagina"],
    ["outside", "No ejaculation in vagina"],
    ["unsure", "Unsure"],
    ["prefer-not", "Prefer not to say"]
  ];
  const INTENT_OPTIONS = [
    ["avoid", "Avoid pregnancy"],
    ["trying", "Trying to conceive"],
    ["open", "Pregnancy would be okay"],
    ["not-tracking", "Just tracking"]
  ];

  const esc = value => typeof escapeHTML === "function"
    ? escapeHTML(value)
    : String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

  function safeDate(value) {
    if (typeof parseDate === "function") return parseDate(value);
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : new Date(value);
    if (typeof value !== "string") return null;
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function keyFor(date) {
    return typeof dateKey === "function" ? dateKey(date) : "";
  }

  function diffDays(a, b) {
    if (typeof daysBetween === "function") return daysBetween(a, b);
    const x = new Date(a.getFullYear(), a.getMonth(), a.getDate());
    const y = new Date(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((y - x) / 86400000);
  }

  function plusDays(date, amount) {
    if (typeof addDays === "function") return addDays(date, amount);
    const d = new Date(date); d.setDate(d.getDate() + amount); return d;
  }

  function ensureSettings() {
    data.settings = data.settings || {};
    if (typeof data.settings.sexualActivityTrackingEnabled !== "boolean") data.settings.sexualActivityTrackingEnabled = false;
    if (!INTENT_OPTIONS.some(([v]) => v === data.settings.reproductiveIntent)) data.settings.reproductiveIntent = "not-tracking";
    return data.settings;
  }

  function cyclePattern() {
    try { return typeof cyclePatternSetting === "function" ? cyclePatternSetting() : (data.settings?.cyclePattern || "regular"); }
    catch (_) { return data.settings?.cyclePattern || "regular"; }
  }

  function fertilityTiming(key) {
    try {
      if (typeof cycleTimingForDate !== "function") return null;
      const timing = cycleTimingForDate(key);
      if (!timing?.estimatedOvulation) return null;
      return {
        ovulation: new Date(timing.estimatedOvulation),
        fertileStart: plusDays(timing.estimatedOvulation, -5),
        fertileEnd: plusDays(timing.estimatedOvulation, 1),
        cautionStart: plusDays(timing.estimatedOvulation, -7),
        cautionEnd: plusDays(timing.estimatedOvulation, 3)
      };
    } catch (_) { return null; }
  }

  function fertilityClueOn(key) {
    const log = data.logs?.[key];
    if (!log) return false;
    const discharge = String(log.discharge || "").toLowerCase();
    return discharge.includes("slippery") || discharge.includes("stretchy") || discharge.includes("watery");
  }

  function pregnancyPossibility(dateValue) {
    const date = dateValue instanceof Date ? dateValue : safeDate(dateValue);
    const key = date ? keyFor(date) : "";
    if (!date || data.mode !== "cycle") return { key: "unavailable", label: "Unavailable", icon: "🌙", rank: 0, text: "Pregnancy-possibility guidance is available in Cycle Mode." };

    const pattern = cyclePattern();
    const timing = fertilityTiming(key);
    if (!timing) return { key: "uncertain", label: "Uncertain pregnancy possibility", icon: "◐", rank: 2, text: "Tsuki does not have enough cycle timing information to classify this day. Do not rely on the calendar to avoid pregnancy." };

    if (pattern !== "regular") {
      return { key: "uncertain", label: "Uncertain pregnancy possibility", icon: "◐", rank: 2, text: "Your cycle timing is irregular or still being learned, so Tsuki will not label calendar days lower-risk for unprotected sex." };
    }

    const within = (d, start, end) => d >= start && d <= end;
    if (within(date, timing.fertileStart, timing.fertileEnd)) {
      return { key: "higher", label: "Higher pregnancy possibility", icon: "●", rank: 3, text: "This date falls inside Tsuki's estimated fertile window. Ovulation timing is only an estimate, so contraception is recommended if you want to avoid pregnancy." };
    }

    if (within(date, timing.cautionStart, timing.cautionEnd) || fertilityClueOn(key)) {
      return { key: "uncertain", label: "Uncertain pregnancy possibility", icon: "◐", rank: 2, text: fertilityClueOn(key)
        ? "A fertility-related body clue is logged around this date, so Tsuki is avoiding a reassuring lower-possibility label."
        : "This date is close enough to the estimated fertile window that Tsuki is keeping the result uncertain." };
    }

    return { key: "lower", label: "Lower pregnancy possibility", icon: "○", rank: 1, text: "This date is outside Tsuki's buffered estimated fertile window. Lower does not mean safe or zero risk; ovulation can shift." };
  }

  function weekPossibility(start = new Date()) {
    return Array.from({ length: 7 }, (_, i) => {
      const date = plusDays(start, i);
      return { date, key: keyFor(date), possibility: pregnancyPossibility(date) };
    });
  }

  function recentSexLogs(days = 45) {
    const now = new Date();
    return Object.entries(data.logs || {})
      .map(([key, log]) => ({ key, date: safeDate(key), activity: log?.sexualActivity || null }))
      .filter(item => item.date && item.date <= now && diffDays(item.date, now) <= days && item.activity?.type === "vaginal")
      .sort((a, b) => b.key.localeCompare(a.key));
  }

  function isPotentiallyUnprotected(activity) {
    if (!activity || activity.type !== "vaginal") return false;
    if (activity.condomIssue) return true;
    return ["none", "withdrawal", "unsure", ""].includes(activity.protection || "");
  }

  function lastPotentiallyUnprotected() {
    return recentSexLogs(60).find(item => isPotentiallyUnprotected(item.activity)) || null;
  }

  function periodAfter(key) {
    const sexDate = safeDate(key);
    if (!sexDate || typeof validPeriods !== "function") return false;
    return validPeriods().some(period => {
      const start = safeDate(period.start);
      return start && start > sexDate;
    });
  }

  function pregnancyContext() {
    const settings = ensureSettings();
    const latest = lastPotentiallyUnprotected();
    if (!latest || periodAfter(latest.key)) return { type: "none", latest: null };
    const age = diffDays(latest.date, new Date());
    const possibility = pregnancyPossibility(latest.date);

    if (settings.reproductiveIntent === "avoid" && age >= 0 && age <= 5) {
      return {
        type: "ec",
        latest,
        possibility,
        title: "Recent unprotected sex",
        text: `You logged potentially unprotected vaginal sex ${age === 0 ? "today" : `${age} day${age === 1 ? "" : "s"} ago`}. If pregnancy is not desired, emergency contraception is time-sensitive and some options can be used up to 5 days after sex. Earlier is better.`
      };
    }

    const pattern = cyclePattern();
    let missed = false;
    try { missed = typeof isLatePeriod === "function" ? Boolean(isLatePeriod()) : false; } catch (_) {}
    if (age >= 21 || (pattern === "regular" && missed)) {
      return {
        type: "test",
        latest,
        possibility,
        title: "A pregnancy test may be useful",
        text: pattern === "regular" && missed
          ? "You have a missed/late period context plus logged potentially unprotected sex. A pregnancy test can help clarify what is happening."
          : "It has been at least 21 days since the last logged potentially unprotected sex without a later recorded period. A home pregnancy test is a reasonable check now if pregnancy is possible."
      };
    }

    return { type: "watch", latest, possibility, title: "Pregnancy context", text: "Tsuki is keeping this sexual-activity log in context with your cycle. It does not confirm or rule out pregnancy." };
  }

  function ensureStyle() {
    if (document.getElementById("reproductiveIntelStyle")) return;
    const style = document.createElement("style");
    style.id = "reproductiveIntelStyle";
    style.textContent = `
      .repro-card{margin-top:14px;padding:15px;border-radius:20px;background:rgba(255,255,255,.76);border:1px solid rgba(145,112,139,.14)}
      .repro-card h3{margin:3px 0 7px}.repro-card p{margin:5px 0}.repro-private{position:relative}
      .repro-choice-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:9px 0}
      .repro-choice{display:flex;align-items:center;gap:7px;padding:10px;border-radius:14px;background:rgba(255,255,255,.6);border:1px solid rgba(145,112,139,.13);font-size:.83rem}
      .repro-choice input{accent-color:currentColor}.repro-subfields{margin-top:10px}.repro-hidden{display:none!important}
      .repro-week{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin-top:10px}
      .repro-day{text-align:center;padding:7px 2px;border-radius:12px;background:rgba(255,255,255,.58);font-size:.69rem}
      .repro-day strong{display:block;font-size:1rem;margin:2px 0}.repro-day-lower strong{opacity:.62}.repro-day-higher{box-shadow:inset 0 0 0 1px rgba(154,83,119,.22)}
      .repro-warning{padding:10px 11px;border-radius:14px;background:rgba(255,245,248,.9);margin-top:9px}
      .repro-note{font-size:.78rem;opacity:.78}.repro-toggle{margin-top:8px}.repro-field{margin-top:10px}
      .repro-field select{width:100%}.repro-card button{min-height:42px}
      body.hide-cycle-details #reproductiveTodayCard, body.hide-cycle-details #reproductiveSexCard{display:none!important}
      @media(max-width:390px){.repro-choice-grid{grid-template-columns:1fr}.repro-week{gap:3px}.repro-day{font-size:.62rem;padding:6px 1px}}
    `;
    document.head.appendChild(style);
  }

  function optionHTML(name, options, selected) {
    return options.map(([value, label]) => `<label class="repro-choice"><input type="radio" name="${name}" value="${esc(value)}" ${selected === value ? "checked" : ""}><span>${esc(label)}</span></label>`).join("");
  }

  function ensureSexCard() {
    const form = document.getElementById("dailyLogForm");
    if (!form) return null;
    let card = document.getElementById("reproductiveSexCard");
    if (!card) {
      card = document.createElement("article");
      card.id = "reproductiveSexCard";
      card.className = "repro-card repro-private period-signal-private";
      const submit = form.querySelector('button[type="submit"]');
      const submitCard = submit?.closest("article");
      if (submitCard && submitCard.parentNode === form) form.insertBefore(card, submitCard);
      else form.appendChild(card);
    }
    return card;
  }

  function currentLogKey() {
    return document.getElementById("logDate")?.value || (typeof todayKey === "function" ? todayKey() : keyFor(new Date()));
  }

  function renderSexCard() {
    ensureStyle();
    const card = ensureSexCard();
    if (!card) return;
    const settings = ensureSettings();
    const key = currentLogKey();
    const saved = data.logs?.[key]?.sexualActivity || {};

    if (!settings.sexualActivityTrackingEnabled) {
      card.innerHTML = `<p class="eyebrow">OPTIONAL · PRIVATE</p><h3>Sexual activity & pregnancy context</h3><p class="repro-note">Turn this on only if you want Tsuki to keep sexual activity in context with cycle timing. This stays in your local Tsuki data and is never required for period prediction.</p><button type="button" id="enableSexTracking" class="secondary-button full-width repro-toggle">Enable private tracking</button>`;
      document.getElementById("enableSexTracking")?.addEventListener("click", () => {
        settings.sexualActivityTrackingEnabled = true;
        saveData();
        renderSexCard();
        renderTodayCard();
      });
      return;
    }

    card.innerHTML = `<p class="eyebrow">OPTIONAL · PRIVATE</p><h3>Sexual activity & pregnancy context</h3>
      <p class="repro-note">Sexual activity does not make Tsuki's period-date forecast more accurate. It helps with pregnancy-possibility context, testing reminders and time-sensitive follow-up after unprotected sex.</p>
      <div class="repro-field"><strong>Sexual activity today</strong><div class="repro-choice-grid">${optionHTML("reproSexType", SEX_OPTIONS, saved.type || "none")}</div></div>
      <div id="reproVaginalFields" class="repro-subfields ${saved.type === "vaginal" ? "" : "repro-hidden"}">
        <div class="repro-field"><strong>Contraception / protection</strong><div class="repro-choice-grid">${optionHTML("reproProtection", PROTECTION_OPTIONS, saved.protection || "")}</div></div>
        <div class="repro-field"><strong>Semen exposure <span class="muted">(optional)</span></strong><div class="repro-choice-grid">${optionHTML("reproExposure", EXPOSURE_OPTIONS, saved.exposure || "prefer-not")}</div></div>
        <label class="repro-choice"><input id="reproCondomIssue" type="checkbox" ${saved.condomIssue ? "checked" : ""}><span>Condom slipped, broke or may not have worked</span></label>
      </div>
      <div class="repro-field"><label class="field-label" for="reproIntent">What should Tsuki optimize the guidance for?</label><select id="reproIntent" class="input">${INTENT_OPTIONS.map(([value,label])=>`<option value="${value}" ${settings.reproductiveIntent===value?"selected":""}>${esc(label)}</option>`).join("")}</select></div>
      <p class="repro-note">No day is labeled safe for unprotected sex. Fertility estimates do not protect against STIs.</p>
      <button type="button" id="disableSexTracking" class="text-button full-width">Turn off sexual activity tracking</button>`;

    card.querySelectorAll('input[name="reproSexType"]').forEach(input => input.addEventListener("change", () => {
      document.getElementById("reproVaginalFields")?.classList.toggle("repro-hidden", input.value !== "vaginal" || !input.checked);
    }));
    document.getElementById("disableSexTracking")?.addEventListener("click", () => {
      settings.sexualActivityTrackingEnabled = false;
      saveData();
      renderSexCard();
      renderTodayCard();
    });
  }

  function checked(name) {
    return document.querySelector(`input[name="${name}"]:checked`)?.value || "";
  }

  function captureDraft() {
    const settings = ensureSettings();
    if (!settings.sexualActivityTrackingEnabled) { state.draft = null; return; }
    const type = checked("reproSexType") || "none";
    state.draft = {
      key: currentLogKey(),
      intent: document.getElementById("reproIntent")?.value || settings.reproductiveIntent,
      activity: type === "vaginal" ? {
        type: "vaginal",
        protection: checked("reproProtection"),
        exposure: checked("reproExposure") || "prefer-not",
        condomIssue: Boolean(document.getElementById("reproCondomIssue")?.checked)
      } : { type: "none" }
    };
  }

  function persistDraft() {
    const draft = state.draft;
    state.draft = null;
    if (!draft?.key || !data.logs?.[draft.key]) return;
    data.settings.reproductiveIntent = draft.intent;
    data.logs[draft.key].sexualActivity = draft.activity;
    saveData();
    renderTodayCard();
  }

  function renderWeek() {
    const days = weekPossibility();
    return `<div class="repro-week">${days.map(item => {
      const p = item.possibility;
      const dow = item.date.toLocaleDateString(undefined,{weekday:"narrow"});
      return `<div class="repro-day repro-day-${p.key}" title="${esc(p.label)}"><span>${esc(dow)}</span><strong>${esc(p.icon)}</strong><small>${item.date.getDate()}</small></div>`;
    }).join("")}</div>`;
  }

  function renderTodayCard() {
    const existing = document.getElementById("reproductiveTodayCard");
    if (data.mode !== "cycle" || data.settings?.hideDetails) { existing?.remove(); return; }
    const todayScreen = document.querySelector('[data-screen="today"]');
    const ref = document.getElementById("metaCalibratedToday") || document.getElementById("adaptiveWeatherToday") || todayScreen?.querySelector(".hero-card");
    if (!ref?.parentNode) return;
    let card = existing;
    if (!card) {
      card = document.createElement("article");
      card.id = "reproductiveTodayCard";
      card.className = "repro-card repro-private period-signal-private";
      ref.parentNode.insertBefore(card, ref.nextSibling);
    }
    const p = pregnancyPossibility(new Date());
    const context = ensureSettings().sexualActivityTrackingEnabled ? pregnancyContext() : {type:"none"};
    const intent = ensureSettings().reproductiveIntent;
    const intentCopy = intent === "trying"
      ? "If you are trying to conceive, higher estimated possibility can help identify when intercourse may be more likely to result in pregnancy."
      : intent === "avoid"
        ? "If you are avoiding pregnancy, use contraception rather than relying on this estimate—even on lower-possibility days."
        : "This is a fertility-awareness estimate, not contraception.";
    card.innerHTML = `<p class="eyebrow">PREGNANCY POSSIBILITY · ESTIMATE</p><h3>${p.icon} ${esc(p.label)}</h3><p>${esc(p.text)}</p><p class="repro-note">${esc(intentCopy)}</p>${renderWeek()}${context.type !== "none" ? `<div class="repro-warning"><strong>${esc(context.title)}</strong><p>${esc(context.text)}</p>${context.type === "ec" ? '<small>Emergency contraception does not protect against STIs. Consider a pharmacist or health professional if you need help choosing an option.</small>' : ""}</div>` : ""}`;
  }

  function annotateCalendar() {
    if (data.mode !== "cycle") return;
    document.querySelectorAll(".calendar-day[data-date]").forEach(button => {
      const p = pregnancyPossibility(button.dataset.date);
      button.dataset.pregnancyPossibility = p.key;
      const existingTitle = button.getAttribute("title") || "";
      const label = `Pregnancy possibility: ${p.label.replace(" pregnancy possibility", "")}`;
      if (!existingTitle.includes("Pregnancy possibility:")) button.setAttribute("title", existingTitle ? `${existingTitle} · ${label}` : label);
    });
  }

  function installEvents() {
    const form = document.getElementById("dailyLogForm");
    if (form && form.dataset.reproBound !== "1") {
      form.dataset.reproBound = "1";
      form.addEventListener("submit", captureDraft, true);
      form.addEventListener("submit", () => setTimeout(persistDraft, 0));
      document.getElementById("logDate")?.addEventListener("change", () => requestAnimationFrame(renderSexCard));
    }
  }

  function installWrappers() {
    if (typeof loadLogForm === "function") {
      state.base.loadLogForm = loadLogForm;
      loadLogForm = function loadLogFormReproductive(...args) {
        const result = state.base.loadLogForm(...args);
        renderSexCard();
        return result;
      };
    }
    if (typeof renderToday === "function") {
      state.base.renderToday = renderToday;
      renderToday = function renderTodayReproductive(...args) {
        const result = state.base.renderToday(...args);
        renderTodayCard();
        return result;
      };
    }
    if (typeof renderCalendar === "function") {
      state.base.renderCalendar = renderCalendar;
      renderCalendar = function renderCalendarReproductive(...args) {
        const result = state.base.renderCalendar(...args);
        annotateCalendar();
        return result;
      };
    }
    if (typeof showScreen === "function") {
      state.base.showScreen = showScreen;
      showScreen = function showScreenReproductive(name, ...args) {
        const result = state.base.showScreen(name, ...args);
        if (name === "log") requestAnimationFrame(renderSexCard);
        if (name === "today") requestAnimationFrame(renderTodayCard);
        if (name === "calendar") requestAnimationFrame(annotateCalendar);
        return result;
      };
    }
    if (typeof renderEverything === "function") {
      state.base.renderEverything = renderEverything;
      renderEverything = function renderEverythingReproductive(...args) {
        const result = state.base.renderEverything(...args);
        renderSexCard(); renderTodayCard(); annotateCalendar();
        return result;
      };
    }
  }

  function install() {
    if (state.installed) return;
    if (!window.TsukiMetaIntelligence?.installed || typeof data === "undefined" || typeof saveData !== "function") {
      setTimeout(install, 50);
      return;
    }
    ensureSettings();
    ensureStyle();
    installWrappers();
    installEvents();
    state.installed = true;
    window.TsukiReproductiveIntelligence.installed = true;
    window.TsukiReproductiveIntelligence.test = {
      pregnancyPossibility,
      weekPossibility,
      pregnancyContext,
      recentSexLogs,
      isPotentiallyUnprotected,
      fertilityTiming
    };
    renderSexCard(); renderTodayCard(); annotateCalendar();
  }

  window.TsukiReproductiveIntelligence = { installed: false, publicVersion: PUBLIC_VERSION, test: null, install };
  install();
})();
