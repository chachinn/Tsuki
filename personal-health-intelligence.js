/* ============================================================
   TSUKI 🌙 — VERSION 1.0 PRE-RELEASE
   PERSONAL HEALTH INTELLIGENCE 3.0
   Shared intelligence for Cycle, Irregular/Between Moons,
   Pregnancy, and Postpartum & Feeding.
   Local-first, explainable, user-correctable, non-diagnostic.
   ============================================================ */
(() => {
  "use strict";

  const MODULE_VERSION = "1.0.0-pre-personal-health-1";
  const q = (selector, root = document) => root.querySelector(selector);
  const safeArray = value => Array.isArray(value) ? value : [];
  const esc = value => String(value ?? "").replace(/[&<>'\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'\"':"&quot;"}[c]));
  const today = () => typeof todayKey === "function" ? todayKey() : new Date().toISOString().slice(0, 10);
  const toDate = value => {
    if (!value) return null;
    try {
      const d = typeof parseDate === "function" ? parseDate(value) : new Date(`${value}T12:00:00`);
      return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
    } catch (_) { return null; }
  };
  const daysBetween = (a, b) => {
    const x = toDate(a), y = toDate(b);
    return x && y ? Math.round((y - x) / 86400000) : null;
  };
  const mode = () => data?.mode || "cycle";
  const currentLifeMode = () => mode() === "pregnancy" ? "pregnancy" : mode() === "postpartum" ? "postpartum" : "cycle";

  function ensureStore() {
    if (!data.personalHealth || typeof data.personalHealth !== "object") data.personalHealth = {};
    const store = data.personalHealth;
    if (!store.feedback || typeof store.feedback !== "object") store.feedback = {};
    if (!Array.isArray(store.healthContexts)) store.healthContexts = [];
    if (!Array.isArray(store.contraceptionHistory)) store.contraceptionHistory = [];
    if (!Array.isArray(store.fertilitySigns)) store.fertilitySigns = [];
    if (!Array.isArray(store.concerns)) store.concerns = [];
    return store;
  }

  function saveLocal() {
    try {
      if (typeof saveData === "function") saveData();
      else localStorage.setItem("tsuki-data-v4", JSON.stringify(data));
    } catch (_) {}
  }

  function feedbackFor(key) {
    return ensureStore().feedback[key] || null;
  }

  function setFeedback(key, value) {
    ensureStore().feedback[key] = value;
    saveLocal();
  }

  function periodStarts() {
    return safeArray(data?.periods)
      .map(p => typeof p === "string" ? p : p?.start || p?.startDate || p?.date)
      .filter(Boolean)
      .sort();
  }

  function cycleIntervals() {
    const starts = periodStarts();
    const out = [];
    for (let i = 1; i < starts.length; i += 1) {
      const value = daysBetween(starts[i - 1], starts[i]);
      if (value && value > 0) out.push({ from: starts[i - 1], to: starts[i], days: value });
    }
    return out;
  }

  function dailyLogs() {
    return Object.entries(data?.logs || {})
      .filter(([, log]) => log && typeof log === "object")
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, log]) => ({ date, ...log }));
  }

  function pregnancyLogs() {
    return Object.entries(data?.pregnancy?.logs || {})
      .filter(([, log]) => log && typeof log === "object")
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, log]) => ({ date, ...log }));
  }

  function postpartumLogs() {
    return Object.entries(data?.postpartum?.recoveryLogs || {})
      .filter(([, log]) => log && typeof log === "object")
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, log]) => ({ date, ...log }));
  }

  function personalTimeline() {
    const events = [];
    periodStarts().forEach(date => events.push({ date, type: "period", icon: "🩸", label: "Period started", detail: "Saved period history" }));
    dailyLogs().forEach(log => {
      const signals = safeArray(log.symptoms || log.bodySignals || log.signals).slice(0, 3);
      if (signals.length) events.push({ date: log.date, type: "signal", icon: "🌙", label: "Body signals", detail: signals.join(" · ") });
      if (log.sexualActivity?.hadVaginalSex) events.push({ date: log.date, type: "sexual", icon: "💕", label: "Sexual activity logged", detail: "Private reproductive context" });
    });
    pregnancyLogs().forEach(log => events.push({ date: log.date, type: "pregnancy", icon: "🤰", label: "Pregnancy check-in", detail: [log.energy, log.sleep, log.nausea].filter(Boolean).join(" · ") || "Observed pregnancy entry" }));
    postpartumLogs().forEach(log => events.push({ date: log.date, type: "postpartum", icon: "🤱", label: "Postpartum recovery check-in", detail: [log.energy, log.sleep, log.mood].filter(Boolean).join(" · ") || "Observed recovery entry" }));
    safeArray(data?.pregnancy?.appointments).forEach(x => x?.date && events.push({ date: x.date, type: "appointment", icon: "🩺", label: x.type || x.title || "Pregnancy appointment", detail: x.provider || "" }));
    safeArray(data?.postpartum?.appointments).forEach(x => x?.date && events.push({ date: x.date, type: "appointment", icon: "🩺", label: x.title || "Postpartum appointment", detail: x.provider || "" }));
    safeArray(ensureStore().contraceptionHistory).forEach(x => x?.date && events.push({ date: x.date, type: "contraception", icon: "🛡️", label: "Contraception change", detail: x.method || x.note || "Method updated" }));
    safeArray(ensureStore().healthContexts).forEach(x => x?.date && events.push({ date: x.date, type: "context", icon: "🧩", label: "Health context", detail: x.context || x.note || "Context recorded" }));
    return events.filter(x => toDate(x.date)).sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 80);
  }

  function irregularContextMap() {
    const intervals = cycleIntervals();
    if (intervals.length < 2) return { level: "learning", summary: "Tsuki needs more actual period intervals before comparing rhythm changes with context.", links: [] };
    const contexts = safeArray(ensureStore().healthContexts).filter(x => x?.date && x?.context);
    if (!contexts.length) return { level: "learning", summary: "No optional rhythm context has been recorded yet. Tsuki will not guess why a cycle changed.", links: [] };
    const recent = intervals.slice(-4);
    const links = [];
    contexts.forEach(ctx => {
      const near = recent.find(i => {
        const gap = daysBetween(ctx.date, i.to);
        return gap != null && gap >= 0 && gap <= 45;
      });
      if (near) links.push({ context: ctx.context, date: ctx.date, interval: near.days });
    });
    if (!links.length) return { level: "observed", summary: "Tsuki does not see a clear timing overlap between your saved contexts and recent interval changes.", links: [] };
    return { level: "observed", summary: "Some saved context and cycle changes happened near each other. Tsuki treats this as timing overlap, not cause.", links: links.slice(-3) };
  }

  function fertilitySignSummary() {
    const store = ensureStore();
    const signs = safeArray(store.fertilitySigns).filter(x => x?.date).sort((a, b) => String(a.date).localeCompare(String(b.date))).slice(-10);
    const recent = signs.filter(x => {
      const d = daysBetween(x.date, today());
      return d != null && d >= 0 && d <= 7;
    });
    const mucus = recent.filter(x => ["slippery", "watery", "egg-white"].includes(String(x.cervicalMucus || "").toLowerCase()));
    const positiveOPK = recent.filter(x => String(x.opk || "").toLowerCase() === "positive");
    const bbt = recent.filter(x => Number.isFinite(Number(x.bbt))).map(x => Number(x.bbt));
    let tempShift = false;
    if (bbt.length >= 5) {
      const last3 = bbt.slice(-3);
      const earlier = bbt.slice(0, -3);
      const a = last3.reduce((s, x) => s + x, 0) / last3.length;
      const b = earlier.reduce((s, x) => s + x, 0) / earlier.length;
      tempShift = a > b + 0.15;
    }
    const aligned = (mucus.length ? 1 : 0) + (positiveOPK.length ? 1 : 0) + (tempShift ? 1 : 0);
    const irregular = typeof cyclePatternSetting === "function" ? cyclePatternSetting() !== "regular" : false;
    if (!recent.length) return { level: "learning", title: "No recent fertility signs", text: "Optional BBT, cervical mucus and ovulation-test entries can add context. Tsuki does not confirm ovulation from calendar timing alone." };
    if (aligned >= 2) return { level: "higher-context", title: "Several fertility signs are lining up", text: `${aligned} different sign types currently point in a similar direction. This can strengthen fertility context, but it is not proof of ovulation${irregular ? " and irregular cycles add extra uncertainty" : ""}.` };
    if (tempShift) return { level: "after-the-fact", title: "A temperature shift may be forming", text: "Your recorded temperatures show a recent sustained rise. BBT is more useful for suggesting ovulation may have already occurred than predicting it in advance." };
    return { level: "uncertain", title: "Fertility context is still mixed", text: "One sign by itself is not enough for Tsuki to call the pattern strong. Missing observations stay unknown." };
  }

  function pregnancyWeeklyNavigator() {
    if (mode() !== "pregnancy" || !data?.pregnancy?.active) return null;
    const maternal = window.TsukiMaternalIntelligence?.test?.pregnancyCareForecast?.() || [];
    const anticipatory = window.TsukiAnticipatoryCareIntelligence?.test?.pregnancyWeekPlan?.() || [];
    const priorities = [...maternal, ...anticipatory].filter(Boolean);
    const urgent = priorities.find(x => x.level === "urgent");
    if (urgent) return { title: "Safety comes first", items: [urgent], urgent: true };
    const dedupe = [];
    const seen = new Set();
    priorities.forEach(x => {
      const key = `${x.title}|${x.text}`;
      if (!seen.has(key)) { seen.add(key); dedupe.push(x); }
    });
    return { title: "This week in your care", items: dedupe.slice(0, 5), urgent: false };
  }

  function postpartumRecoveryMilestones() {
    if (mode() !== "postpartum" || !data?.postpartum?.active) return null;
    const logs = postpartumLogs().slice(-10);
    if (logs.length < 3) return { title: "Recovery story is still learning", items: ["A few observed recovery check-ins will let Tsuki compare changes without assuming unlogged days were symptom-free."] };
    const first = logs.slice(0, Math.max(1, Math.floor(logs.length / 2)));
    const recent = logs.slice(-Math.max(2, Math.ceil(logs.length / 2)));
    const rate = (arr, field, values) => arr.filter(x => values.includes(String(x[field] || "").toLowerCase())).length / arr.length;
    const items = [];
    const recentLowEnergy = rate(recent, "energy", ["low", "very-low"]), earlyLowEnergy = rate(first, "energy", ["low", "very-low"]);
    if (Math.abs(recentLowEnergy - earlyLowEnergy) >= 0.25) items.push(`Low-energy entries are ${recentLowEnergy > earlyLowEnergy ? "more" : "less"} common recently than in your earlier observed postpartum days.`);
    const recentPoorSleep = rate(recent, "sleep", ["poor", "very-poor"]), earlyPoorSleep = rate(first, "sleep", ["poor", "very-poor"]);
    if (Math.abs(recentPoorSleep - earlyPoorSleep) >= 0.25) items.push(`Poor-sleep entries are ${recentPoorSleep > earlyPoorSleep ? "more" : "less"} common recently.`);
    if (!items.length) items.push("Recent recovery entries look broadly similar to your earlier observed postpartum pattern. Tsuki does not see a strong shift yet.");
    return { title: "Your recovery story", items };
  }

  function babyBaseline() {
    const pp = data?.postpartum || {};
    const logs = Object.entries(pp.babyLogs || {}).filter(([, x]) => x && typeof x === "object").sort((a,b) => a[0].localeCompare(b[0])).slice(-10).map(([date, x]) => ({ date, ...x }));
    if (logs.length < 3) return { level: "learning", title: "Baby baseline is still learning", text: "Optional feeding, alertness and diaper observations can help Tsuki notice changes from baby's own recent logged pattern." };
    const recent = logs.slice(-3), earlier = logs.slice(0, -3);
    const numeric = field => {
      const r = recent.map(x => Number(x[field])).filter(Number.isFinite);
      const e = earlier.map(x => Number(x[field])).filter(Number.isFinite);
      if (!r.length || !e.length) return null;
      return { recent: r.reduce((a,b)=>a+b,0)/r.length, earlier: e.reduce((a,b)=>a+b,0)/e.length };
    };
    const wet = numeric("wetDiapers");
    if (wet && wet.recent <= wet.earlier - 2) return { level: "changed", title: "Wet-diaper entries are lower than earlier recent logs", text: "This is a change in what you recorded, not a diagnosis or universal diaper target. If feeding, hydration or baby's wellbeing worries you, contact baby's healthcare professional." };
    const poorFeed = recent.filter(x => ["poor", "much-less", "less"].includes(String(x.feeding || "").toLowerCase())).length;
    if (poorFeed >= 2) return { level: "changed", title: "Feeding has looked different recently", text: "Poorer feeding was recorded more than once in recent baby checks. Tsuki cannot determine why; use the baby safety guidance and contact the baby's healthcare professional if you are concerned." };
    return { level: "steady", title: "Baby observations look fairly steady", text: "Tsuki does not see a strong change in the optional baby observations you recorded." };
  }

  function healthChangeAlert() {
    const alerts = [];
    const intervals = cycleIntervals();
    if (intervals.length >= 6 && mode() === "cycle") {
      const recent = intervals.slice(-3).map(x => x.days).sort((a,b)=>a-b)[1];
      const earlierVals = intervals.slice(-6, -3).map(x => x.days).sort((a,b)=>a-b);
      const earlier = earlierVals[1];
      if (Math.abs(recent - earlier) >= 7) alerts.push({ key: "cycle-shift", icon: "🌘", title: "Your recent cycle rhythm has shifted", text: `Your last three intervals center around ${recent} days versus about ${earlier} days in the preceding three. Tsuki records the shift but cannot determine the cause.` });
    }
    return alerts.filter(x => feedbackFor(x.key) !== "dismiss");
  }

  function contraceptionSummary() {
    const history = safeArray(ensureStore().contraceptionHistory).filter(x => x?.date).sort((a,b) => String(a.date).localeCompare(String(b.date)));
    const current = history[history.length - 1];
    if (!current) return { title: "No contraception plan saved", text: "Optional contraception tracking can help Tsuki remember method changes and due dates without changing your cycle history." };
    return { title: current.method || "Contraception plan", text: `${current.date}${current.note ? ` · ${current.note}` : ""}. Tsuki treats method changes as context; method-specific missed-dose or replacement instructions should come from your product instructions or clinician/pharmacist.` };
  }

  function somethingFeelsWrongAction() {
    return { key: "user-concern", icon: "🫶", title: "Something feels wrong", text: mode() === "pregnancy" || mode() === "postpartum" ? "If something feels unusual or is worrying you, contact your healthcare provider even if Tsuki has not matched a predefined warning sign. Urgent warning signs need immediate medical care." : "If a health change feels significant, persistent, or worrying, consider contacting a healthcare professional rather than relying on Tsuki to explain it." };
  }

  function renderFeedbackButtons(key) {
    const current = feedbackFor(key);
    return `<div class="phi-feedback" data-phi-key="${esc(key)}"><small>Was this useful?</small><button type="button" data-phi-feedback="helpful" ${current === "helpful" ? "class=\"selected\"" : ""}>Helpful</button><button type="button" data-phi-feedback="dismiss" ${current === "dismiss" ? "class=\"selected\"" : ""}>Not useful</button></div>`;
  }

  function sharedCardHTML() {
    const timeline = personalTimeline().slice(0, 5);
    const changes = healthChangeAlert();
    const fertility = mode() === "cycle" ? fertilitySignSummary() : null;
    const irregular = mode() === "cycle" ? irregularContextMap() : null;
    const contraception = mode() !== "pregnancy" ? contraceptionSummary() : null;
    const pregnancy = pregnancyWeeklyNavigator();
    const recovery = postpartumRecoveryMilestones();
    const baby = mode() === "postpartum" ? babyBaseline() : null;
    const concern = somethingFeelsWrongAction();

    return `<p class="eyebrow">PERSONAL HEALTH INTELLIGENCE 3.0</p><h3>Your health story, connected</h3>
      ${pregnancy ? `<div class="phi-section"><strong>🤰 ${esc(pregnancy.title)}</strong>${pregnancy.items.map(x => `<p><b>${esc(x.icon || "•")} ${esc(x.title || "Care item")}</b><br>${esc(x.text || "")}</p>`).join("")}</div>` : ""}
      ${recovery ? `<div class="phi-section"><strong>🤱 ${esc(recovery.title)}</strong>${recovery.items.map(x => `<p>${esc(x)}</p>`).join("")}</div>` : ""}
      ${baby ? `<div class="phi-section"><strong>👶 ${esc(baby.title)}</strong><p>${esc(baby.text)}</p></div>` : ""}
      ${fertility ? `<div class="phi-section"><strong>🌱 ${esc(fertility.title)}</strong><p>${esc(fertility.text)}</p>${renderFeedbackButtons("fertility-summary")}</div>` : ""}
      ${irregular ? `<div class="phi-section"><strong>🧩 Rhythm context</strong><p>${esc(irregular.summary)}</p>${irregular.links.map(x => `<small>${esc(x.date)} · ${esc(x.context)} · nearby ${x.interval}-day interval</small>`).join("<br>")}</div>` : ""}
      ${changes.map(x => `<div class="phi-section"><strong>${esc(x.icon)} ${esc(x.title)}</strong><p>${esc(x.text)}</p>${renderFeedbackButtons(x.key)}</div>`).join("")}
      ${contraception ? `<div class="phi-section"><strong>🛡️ ${esc(contraception.title)}</strong><p>${esc(contraception.text)}</p></div>` : ""}
      <div class="phi-section phi-concern"><strong>${concern.icon} ${concern.title}</strong><p>${esc(concern.text)}</p></div>
      <details><summary>Recent health timeline</summary>${timeline.length ? timeline.map(x => `<p><small>${esc(x.date)}</small><br><b>${esc(x.icon)} ${esc(x.label)}</b>${x.detail ? `<br>${esc(x.detail)}` : ""}</p>`).join("") : "<p>Tsuki will connect your logged health events here over time.</p>"}</details>
      <details><summary>Why am I seeing this?</summary><p>Tsuki uses only observations you actually recorded. Missing days stay unknown. Personal feedback can hide an insight you find unhelpful, but it can never suppress pregnancy/postpartum or newborn danger-sign guidance.</p></details>`;
  }

  function ensureStyles() {
    if (q("#phiStyles")) return;
    const style = document.createElement("style");
    style.id = "phiStyles";
    style.textContent = `.phi-card{margin:16px 0;padding:18px;border-radius:22px;background:var(--card,#fff);box-shadow:0 8px 26px rgba(70,45,70,.08)}.phi-section{padding:12px 0;border-top:1px solid rgba(120,90,120,.12)}.phi-section:first-of-type{border-top:0}.phi-section p{margin:6px 0;line-height:1.45}.phi-feedback{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:8px}.phi-feedback button{border:0;border-radius:999px;padding:7px 10px;background:rgba(130,100,140,.1)}.phi-feedback button.selected{outline:2px solid rgba(130,100,140,.25)}.phi-feedback small{width:100%}.phi-concern{background:rgba(255,242,246,.7);padding:12px;border-radius:16px;margin-top:8px}`;
    document.head.appendChild(style);
  }

  function targetScreen() {
    if (mode() === "pregnancy") return q('[data-screen="pregnancy-dashboard"]') || q('[data-screen="pregnancy-today"]');
    if (mode() === "postpartum") return q('[data-screen="postpartum-feeding"]');
    return q('[data-screen="insights"]') || q('[data-screen="today"]');
  }

  function render() {
    ensureStyles();
    const screen = targetScreen();
    if (!screen) return;
    let card = q("#personalHealthIntelligenceCard");
    if (!card) {
      card = document.createElement("article");
      card.id = "personalHealthIntelligenceCard";
      card.className = "phi-card period-signal-private";
      const anchor = q("#maternalPregnancyIntel", screen) || q("#maternalPostpartumIntel", screen) || q("#metaIntelligenceCard", screen) || screen.firstElementChild;
      if (anchor) anchor.insertAdjacentElement("afterend", card); else screen.prepend(card);
    } else if (card.parentElement !== screen) {
      card.remove();
      screen.prepend(card);
    }
    card.innerHTML = sharedCardHTML();
    card.querySelectorAll("[data-phi-feedback]").forEach(button => button.addEventListener("click", () => {
      const wrap = button.closest("[data-phi-key]");
      if (!wrap) return;
      setFeedback(wrap.dataset.phiKey, button.dataset.phiFeedback);
      render();
    }));
  }

  function install() {
    if (window.TsukiPersonalHealthIntelligence?.installed) return;
    if (typeof data === "undefined" || typeof showScreen !== "function") return setTimeout(install, 100);

    if (typeof renderEverything === "function" && !renderEverything.__phiWrapped) {
      const base = renderEverything;
      const wrapped = function(...args) { const out = base.apply(this, args); try { render(); } catch (e) { console.warn("Tsuki personal health render skipped", e); } return out; };
      wrapped.__phiWrapped = true;
      try { renderEverything = wrapped; } catch (_) {}
      window.renderEverything = wrapped;
    }
    if (typeof showScreen === "function" && !showScreen.__phiWrapped) {
      const baseShow = showScreen;
      const wrappedShow = function(name, ...args) { const out = baseShow(name, ...args); requestAnimationFrame(render); return out; };
      wrappedShow.__phiWrapped = true;
      try { showScreen = wrappedShow; } catch (_) {}
      window.showScreen = wrappedShow;
    }

    window.TsukiPersonalHealthIntelligence = {
      installed: true,
      version: MODULE_VERSION,
      render,
      test: { personalTimeline, irregularContextMap, fertilitySignSummary, pregnancyWeeklyNavigator, postpartumRecoveryMilestones, babyBaseline, healthChangeAlert, contraceptionSummary, somethingFeelsWrongAction }
    };
    render();
  }

  window.TsukiPersonalHealthIntelligence = { installed: false, version: MODULE_VERSION, install, test: null };
  install();
})();
