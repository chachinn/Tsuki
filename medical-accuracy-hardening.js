/* ============================================================
   TSUKI 🌙 — VERSION 1.0 PRE-RELEASE
   MEDICAL ACCURACY + CROSS-MODULE HARDENING
   Compatibility-only corrections for existing health systems.
   Does not diagnose, prescribe, change pregnancy dating, or rewrite
   period history. Public version and tsuki-data-v4 remain unchanged.
   ============================================================ */
(() => {
  "use strict";

  if (window.TsukiMedicalAccuracyHardening?.installed) return;

  const VERSION = "1.0.0-pre-medical-hardening-1";
  const q = (s, r = document) => r.querySelector(s);
  const qa = (s, r = document) => [...r.querySelectorAll(s)];
  const today = () => typeof todayKey === "function" ? todayKey() : new Date().toISOString().slice(0, 10);
  const parse = value => {
    if (!value) return null;
    try {
      const d = typeof parseDate === "function" ? parseDate(value) : new Date(`${value}T12:00:00`);
      return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
    } catch (_) { return null; }
  };
  const diffDays = (a, b) => {
    const x = parse(a), y = parse(b);
    if (!x || !y) return null;
    return Math.round((new Date(y.getFullYear(), y.getMonth(), y.getDate()) - new Date(x.getFullYear(), x.getMonth(), x.getDate())) / 86400000);
  };

  function syncCareCompatibility() {
    const care = data?.womensCare;
    if (!care || typeof care !== "object") return;
    care.routines = Array.isArray(care.routines) ? care.routines : [];
    care.routineChecks = Array.isArray(care.routineChecks) ? care.routineChecks : [];
    care.completions = care.completions && typeof care.completions === "object" ? care.completions : {};

    care.routines.forEach(routine => {
      if (!routine || typeof routine !== "object") return;
      // New Care Hub stores `scope`; older maternity modules read mode/lifeMode.
      if (routine.scope && !routine.mode && !routine.lifeMode) routine.mode = routine.scope;
    });

    care.routineChecks.forEach(check => {
      if (!check?.routineId || !check?.date) return;
      const compatKey = `${check.date}:${check.routineId}`;
      if (check.status === "done") care.completions[compatKey] = true;
      else delete care.completions[compatKey];
    });
  }

  function syncSexualActivityCompatibility() {
    Object.values(data?.logs || {}).forEach(log => {
      const activity = log?.sexualActivity;
      if (!activity || typeof activity !== "object" || !activity.type) return;
      // Personal Health timeline historically read hadVaginalSex.
      activity.hadVaginalSex = activity.type === "vaginal";
    });
  }

  function syncObjectAliases() {
    if (window.TsukiAnticipatoryCare && !window.TsukiAnticipatoryCareIntelligence) {
      window.TsukiAnticipatoryCareIntelligence = window.TsukiAnticipatoryCare;
    }
  }

  function syncCompatibility() {
    if (typeof data === "undefined") return;
    syncCareCompatibility();
    syncSexualActivityCompatibility();
    syncObjectAliases();
  }

  function inferBbtUnit(entry) {
    const explicit = String(entry?.bbtUnit || "").toUpperCase();
    if (explicit === "C" || explicit === "CELSIUS" || explicit.includes("°C")) return "C";
    if (explicit === "F" || explicit === "FAHRENHEIT" || explicit.includes("°F")) return "F";
    const value = Number(entry?.bbt);
    if (!Number.isFinite(value)) return "";
    if (value >= 80 && value <= 110) return "F";
    if (value >= 30 && value <= 45) return "C";
    return "";
  }

  function bbtCelsius(entry) {
    const value = Number(entry?.bbt);
    const unit = inferBbtUnit(entry);
    if (!Number.isFinite(value) || !unit) return null;
    const c = unit === "F" ? (value - 32) * 5 / 9 : value;
    return c >= 30 && c <= 45 ? c : null;
  }

  function medicallyConservativeFertilitySummary() {
    const signs = Array.isArray(data?.personalHealth?.fertilitySigns)
      ? data.personalHealth.fertilitySigns.filter(x => x?.date).slice().sort((a,b) => String(a.date).localeCompare(String(b.date))).slice(-10)
      : [];
    const recent = signs.filter(entry => {
      const n = diffDays(entry.date, today());
      return n != null && n >= 0 && n <= 7;
    });
    const mucus = recent.filter(x => ["slippery", "watery", "egg-white", "slippery / stretchy"].includes(String(x.cervicalMucus || "").toLowerCase()));
    const positiveOPK = recent.filter(x => String(x.opk || "").toLowerCase() === "positive");
    const temps = recent.map(entry => ({ entry, c: bbtCelsius(entry) })).filter(x => Number.isFinite(x.c));
    const recentIllness = Array.isArray(data?.personalHealth?.healthContexts) && data.personalHealth.healthContexts.some(ctx => {
      if (String(ctx?.context || "").toLowerCase() !== "illness") return false;
      const n = diffDays(ctx.date, today());
      return n != null && n >= 0 && n <= 7;
    });

    // ACOG describes a typical post-ovulation BBT rise of about 0.5–1°F
    // (~0.28–0.56°C), sustained until the end of the cycle. BBT is
    // retrospective, and fever/illness can make it unreliable.
    let tempShift = false;
    if (!recentIllness && temps.length >= 5) {
      const values = temps.map(x => x.c);
      const last3 = values.slice(-3);
      const earlier = values.slice(0, -3);
      const mean = arr => arr.reduce((sum, value) => sum + value, 0) / arr.length;
      tempShift = earlier.length >= 2 && mean(last3) - mean(earlier) >= 0.28;
    }

    const aligned = (mucus.length ? 1 : 0) + (positiveOPK.length ? 1 : 0) + (tempShift ? 1 : 0);
    const irregular = (() => {
      try { return typeof cyclePatternSetting === "function" ? cyclePatternSetting() !== "regular" : data?.settings?.cyclePattern !== "regular"; }
      catch (_) { return true; }
    })();

    if (!recent.length) return {
      level: "learning",
      title: "No recent fertility signs",
      text: "Optional BBT, cervical mucus and ovulation-test entries can add context. Tsuki does not confirm ovulation from calendar timing alone."
    };
    if (aligned >= 2) return {
      level: "higher-context",
      title: "Several fertility signs are lining up",
      text: `${aligned} different sign types currently point in a similar direction. This strengthens fertility context, but does not prove ovulation${irregular ? " and irregular cycles add extra uncertainty" : ""}.`
    };
    if (tempShift) return {
      level: "after-the-fact",
      title: "A temperature shift may be forming",
      text: "Your recorded waking temperatures show a sustained rise consistent with an after-the-fact ovulation clue. BBT does not predict ovulation in advance, and illness or fever can make it unreliable."
    };
    if (recentIllness && temps.length) return {
      level: "uncertain",
      title: "Temperature context is uncertain",
      text: "You also logged illness recently, so Tsuki is not using BBT to suggest an ovulation-related temperature shift. Other fertility signs can still be recorded."
    };
    return {
      level: "uncertain",
      title: "Fertility context is still mixed",
      text: "One sign by itself is not enough for Tsuki to call the pattern strong. Missing observations stay unknown."
    };
  }

  function addBbtUnitControl() {
    const form = q("#phiFertilityForm");
    const input = form?.querySelector('input[name="bbt"]');
    if (!form || !input || q("#phiBbtUnit", form)) return;
    const label = input.closest("label");
    if (!label) return;
    const select = document.createElement("select");
    select.id = "phiBbtUnit";
    select.name = "bbtUnit";
    select.setAttribute("aria-label", "Basal body temperature unit");
    select.innerHTML = '<option value="C">°C</option><option value="F">°F</option>';
    const last = Array.isArray(data?.personalHealth?.fertilitySigns)
      ? data.personalHealth.fertilitySigns.slice().reverse().find(x => inferBbtUnit(x))
      : null;
    select.value = last ? inferBbtUnit(last) : "C";
    label.appendChild(select);
    const hint = document.createElement("small");
    hint.textContent = "Take BBT after waking, before getting out of bed. Tsuki uses it only as an after-the-fact pattern clue.";
    label.appendChild(hint);

    if (form.dataset.medicalBbtBound !== "1") {
      form.dataset.medicalBbtBound = "1";
      form.addEventListener("submit", () => setTimeout(() => {
        const date = form.querySelector('input[name="date"]')?.value || today();
        const unit = q("#phiBbtUnit", form)?.value || "C";
        const entry = data?.personalHealth?.fertilitySigns?.find(x => x?.date === date);
        if (!entry || !Number.isFinite(Number(entry.bbt))) return;
        entry.bbtUnit = unit;
        if (typeof saveData === "function") saveData();
      }, 0));
    }
  }

  function correctFertilityCard() {
    const card = q("#personalHealthIntelligenceCard");
    if (!card) return;
    const section = qa(".phi-section", card).find(node => /fertility|temperature|signs are lining up|fertility context/i.test(node.querySelector("strong")?.textContent || ""));
    if (!section) return;
    const summary = medicallyConservativeFertilitySummary();
    const strong = section.querySelector("strong");
    const p = section.querySelector("p");
    if (strong) strong.textContent = `🌱 ${summary.title}`;
    if (p) p.textContent = summary.text;
  }

  function upgradePostpartumBreastPrompt() {
    const screen = q('[data-screen="postpartum-feeding"]');
    if (!screen) return;
    qa(".pp-alert-discuss p", screen).forEach(p => {
      if (/breast redness|feverish|flu-like/i.test(p.textContent || "")) {
        p.textContent = `${p.textContent} Contact a healthcare professional promptly, especially with fever or worsening breast redness, warmth, swelling or pain.`;
      }
    });
  }

  function applyUiCorrections() {
    syncObjectAliases();
    addBbtUnitControl();
    correctFertilityCard();
    upgradePostpartumBreastPrompt();
  }

  function wrapSaveData() {
    if (typeof saveData !== "function" || saveData.__medicalHardeningWrapped) return;
    const base = saveData;
    const wrapped = function(...args) {
      syncCompatibility();
      return base.apply(this, args);
    };
    wrapped.__medicalHardeningWrapped = true;
    try { saveData = wrapped; } catch (_) {}
    window.saveData = wrapped;
  }

  function install() {
    if (window.TsukiMedicalAccuracyHardening?.installed) return;
    if (typeof data === "undefined" || typeof saveData !== "function" || !document.body) {
      setTimeout(install, 80);
      return;
    }

    syncCompatibility();
    wrapSaveData();

    // Correct the exposed test helper too, so QA and future integrations use
    // the medically conservative BBT interpretation.
    if (window.TsukiPersonalHealthIntelligence?.test) {
      window.TsukiPersonalHealthIntelligence.test.fertilitySignSummary = medicallyConservativeFertilitySummary;
    }

    const observer = new MutationObserver(() => requestAnimationFrame(applyUiCorrections));
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("change", () => requestAnimationFrame(applyUiCorrections));
    requestAnimationFrame(applyUiCorrections);

    window.TsukiMedicalAccuracyHardening = {
      installed: true,
      version: VERSION,
      apply: applyUiCorrections,
      syncCompatibility,
      test: {
        inferBbtUnit,
        bbtCelsius,
        medicallyConservativeFertilitySummary,
        syncCareCompatibility,
        syncSexualActivityCompatibility
      },
      disconnect: () => observer.disconnect()
    };
  }

  window.TsukiMedicalAccuracyHardening = { installed: false, version: VERSION, install, test: null };
  if (!window.__TSUKI_TEST__) install();
})();
