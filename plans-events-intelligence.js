/* ============================================================
   TSUKI v1 — PLANS & EVENTS INTELLIGENCE
   Local-first birthdays, parties, out-of-town plans, travel and
   other important dates connected to existing cycle/pregnancy context.
   This module never rewrites period history, forecasts, pregnancy dating,
   sexual-activity history, or clinical guidance.
   ============================================================ */

(() => {
  "use strict";

  const PUBLIC_VERSION = "v1.0";
  const TRAVEL_KINDS = new Set(["travel", "out-of-town"]);
  const KIND_META = {
    birthday: { icon: "🎂", label: "Birthday" },
    party: { icon: "🎉", label: "Party" },
    wedding: { icon: "💍", label: "Wedding" },
    concert: { icon: "🎵", label: "Concert / Show" },
    date: { icon: "💕", label: "Date" },
    work: { icon: "💼", label: "Work event" },
    appointment: { icon: "📅", label: "Appointment" },
    "out-of-town": { icon: "🚗", label: "Out of town" },
    travel: { icon: "✈️", label: "Travel / Vacation" },
    custom: { icon: "🌙", label: "Custom plan" }
  };

  const esc = value => typeof escapeHTML === "function"
    ? escapeHTML(value)
    : String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

  function safeDate(value) {
    if (typeof parseDate === "function") return parseDate(value);
    if (!value) return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : new Date(value);
    const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function key(date) {
    if (typeof dateKey === "function") return dateKey(date);
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
  }

  function plusDays(date, amount) {
    if (typeof addDays === "function") return addDays(date, amount);
    const d = new Date(date); d.setDate(d.getDate() + amount); return d;
  }

  function fmt(date, withYear = false) {
    if (!date) return "—";
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", ...(withYear ? { year: "numeric" } : {}) });
  }

  function ensureStore() {
    if (!Array.isArray(data.trips)) data.trips = [];
    return data.trips;
  }

  function normalizeKind(record) {
    if (record?.planKind && KIND_META[record.planKind]) return record.planKind;
    if (record?.travel === true || record?.type === "Trip" || record?.type === "Vacation") return "travel";
    const raw = String(record?.type || "").toLowerCase();
    if (raw.includes("birthday")) return "birthday";
    if (raw.includes("party")) return "party";
    if (raw.includes("wedding")) return "wedding";
    if (raw.includes("concert") || raw.includes("show")) return "concert";
    if (raw.includes("appointment")) return "appointment";
    if (raw.includes("work")) return "work";
    if (raw.includes("date")) return "date";
    return "custom";
  }

  function isTravelLike(kind) { return TRAVEL_KINDS.has(kind); }
  function travelApi() { return window.TsukiTravelIntelligence?.test || null; }

  function periodContext(start, end, past = false) {
    const api = travelApi();
    if (!api?.periodTravelState) return null;
    try { return api.periodTravelState(start, end, past); } catch (_) { return null; }
  }

  function pregnancyWeekContext(start, end) {
    const api = travelApi();
    if (!api?.gestationOn || data.mode !== "pregnancy" || !data.pregnancy?.active) return null;
    try {
      const a = api.gestationOn(start); const b = api.gestationOn(end || start);
      if (!a || !b || a.days < 0) return null;
      return {
        startWeeks: a.weeks,
        startDays: a.extraDays,
        endWeeks: b.weeks,
        endDays: b.extraDays,
        text: a.weeks === b.weeks
          ? `You would be about ${a.weeks} weeks pregnant on this plan.`
          : `You would be about ${a.weeks}–${b.weeks} weeks pregnant during this plan.`
      };
    } catch (_) { return null; }
  }

  function travelPregnancyContext(kind, start, end) {
    if (!isTravelLike(kind)) return null;
    const api = travelApi();
    if (!api?.pregnancyTravelState) return null;
    try { return api.pregnancyTravelState(start, end); } catch (_) { return null; }
  }

  function reproductiveUncertainty() {
    const api = travelApi();
    if (!api?.reproductiveUncertainty || data.mode !== "cycle") return null;
    try { return api.reproductiveUncertainty(); } catch (_) { return null; }
  }

  function analyzePlan(record) {
    const start = safeDate(record?.start); const end = safeDate(record?.end) || start;
    if (!start) return null;
    const today = safeDate(typeof todayKey === "function" ? todayKey() : key(new Date())) || new Date();
    const past = end < today || record.status === "completed";
    const kind = normalizeKind(record);
    return {
      kind,
      past,
      period: periodContext(start, end, past),
      pregnancyWeek: pregnancyWeekContext(start, end),
      pregnancyTravel: travelPregnancyContext(kind, start, end),
      uncertainty: reproductiveUncertainty()
    };
  }

  function ensureStyle() {
    if (document.getElementById("plansEventsIntelStyle")) return;
    const style = document.createElement("style");
    style.id = "plansEventsIntelStyle";
    style.textContent = `
      .plans-events-intel{margin:12px 0 18px}.plans-events-hero{padding:18px;border-radius:24px;background:linear-gradient(145deg,rgba(255,246,250,.98),rgba(246,243,255,.98));border:1px solid rgba(146,112,139,.14)}
      .plans-events-card{margin-top:12px;padding:15px;border-radius:20px;background:rgba(255,255,255,.8);border:1px solid rgba(146,112,139,.13)}.plans-events-card h3,.plans-events-hero h2{margin:4px 0 7px}
      .plans-events-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.plans-events-grid .wide{grid-column:1/-1}.plans-events-result{margin-top:10px;padding:12px;border-radius:15px;background:rgba(248,244,250,.82)}
      .plans-events-result strong{display:block;margin-bottom:4px}.plans-events-result.period-overlap{background:rgba(255,237,240,.92)}.plans-events-result.period-clear{background:rgba(239,250,244,.92)}
      .plans-events-history{display:grid;gap:9px;margin-top:10px}.plans-events-item{padding:13px;border-radius:16px;background:rgba(255,255,255,.7);border:1px solid rgba(146,112,139,.11)}.plans-events-item header{display:flex;justify-content:space-between;gap:10px}.plans-events-item small{display:block;margin-top:3px}.plans-events-badge{display:inline-flex;padding:5px 8px;border-radius:999px;background:rgba(245,226,235,.82);font-size:.72rem;font-weight:800;white-space:nowrap}.plans-events-note{margin-top:9px;padding:10px 11px;border-radius:14px;background:rgba(250,246,252,.86)}
      body.hide-cycle-details .plans-events-private{filter:blur(5px);pointer-events:none;user-select:none}@media(max-width:390px){.plans-events-grid{grid-template-columns:1fr}.plans-events-grid .wide{grid-column:auto}}
    `;
    document.head.appendChild(style);
  }

  function updateLabels() {
    const row = document.querySelector('[data-open-screen="going-out"]');
    if (row) {
      const strong = row.querySelector("strong"); const small = row.querySelector("small"); const icon = row.querySelector(".drawer-row-icon");
      if (strong) strong.textContent = "Plans & Events";
      if (small) small.textContent = "Birthdays, parties, travel & body-aware planning";
      if (icon) icon.textContent = "🗓️";
    }
  }

  function ensurePanel() {
    const screen = document.querySelector('[data-screen="going-out"]');
    if (!screen) return null;
    let panel = document.getElementById("plansEventsIntelligencePanel");
    if (panel) return panel;
    panel = document.createElement("section");
    panel.id = "plansEventsIntelligencePanel";
    panel.className = "plans-events-intel plans-events-private period-signal-private";
    const travelPanel = document.getElementById("travelIntelligencePanel");
    if (travelPanel) travelPanel.before(panel);
    else {
      const title = screen.querySelector(".page-title") || screen.firstElementChild;
      if (title?.nextSibling) screen.insertBefore(panel, title.nextSibling); else screen.prepend(panel);
    }
    return panel;
  }

  function kindOptions(selected = "birthday") {
    return Object.entries(KIND_META).map(([value, meta]) => `<option value="${value}"${value===selected?" selected":""}>${meta.icon} ${meta.label}</option>`).join("");
  }

  function renderCheckResult() {
    const box = document.getElementById("planCheckResult");
    if (!box) return;
    const kind = document.getElementById("planCheckKind")?.value || "birthday";
    const start = document.getElementById("planCheckStart")?.value || "";
    const end = document.getElementById("planCheckEnd")?.value || start;
    if (!start) { box.innerHTML = '<div class="plans-events-result"><strong>Choose a date</strong><span>Add the event date first.</span></div>'; return; }
    const startDate = safeDate(start); const endDate = safeDate(end) || startDate;
    if (endDate < startDate) { box.innerHTML = '<div class="plans-events-result"><strong>Check the dates</strong><span>The end cannot be before the start.</span></div>'; return; }
    const today = safeDate(typeof todayKey === "function" ? todayKey() : key(new Date())) || new Date();
    const past = endDate < today;
    const period = periodContext(startDate, endDate, past);
    const pregWeek = pregnancyWeekContext(startDate, endDate);
    const pregTravel = travelPregnancyContext(kind, startDate, endDate);
    const uncertainty = reproductiveUncertainty();
    let html = "";
    if (period) html += `<div class="plans-events-result ${esc(period.key)}"><strong>${esc(period.label)}</strong><span>${esc(period.text)}</span></div>`;
    if (pregWeek) html += `<div class="plans-events-result"><strong>🤰 Pregnancy timing</strong><span>${esc(pregWeek.text)}</span></div>`;
    if (pregTravel) html += `<div class="plans-events-result ${esc(pregTravel.key)}"><strong>✈️ Travel-specific pregnancy context</strong><span>${esc(pregTravel.text)}</span></div>`;
    if (uncertainty && !past) {
      const beforeTest = endDate < uncertainty.testDate;
      html += `<div class="plans-events-note"><strong>◐ Pregnancy status may still be unresolved</strong><small>${beforeTest ? `This plan is before ${fmt(uncertainty.testDate,true)}, about 21 days after the latest potentially unprotected vaginal sex you logged. If pregnancy status would change an expensive or important plan, consider keeping it flexible until testing can clarify.` : `Testing may help clarify pregnancy status from ${fmt(uncertainty.testDate,true)} onward if no later period has been recorded.`}</small></div>`;
    }
    box.innerHTML = html || '<div class="plans-events-result"><strong>No extra context yet</strong><span>Tsuki does not have enough supported cycle or Pregnancy information to add a body-aware note for these dates.</span></div>';
  }

  function savePlan() {
    const kind = document.getElementById("planLogKind")?.value || "custom";
    const name = document.getElementById("planLogName")?.value.trim() || KIND_META[kind]?.label || "Plan";
    const place = document.getElementById("planLogPlace")?.value.trim() || "";
    const start = document.getElementById("planLogStart")?.value || "";
    const end = document.getElementById("planLogEnd")?.value || start;
    const status = document.getElementById("planLogStatus")?.value || "planned";
    const flexibility = document.getElementById("planLogFlexibility")?.value || "fixed";
    const notes = document.getElementById("planLogNotes")?.value.trim() || "";
    if (!start) { if (typeof showToast === "function") showToast("Choose the plan date first."); return; }
    const s = safeDate(start); const e = safeDate(end) || s;
    if (e < s) { if (typeof showToast === "function") showToast("Plan end cannot be before the start."); return; }
    const meta = KIND_META[kind] || KIND_META.custom;
    ensureStore().unshift({
      id: typeof uid === "function" ? uid() : `plan-${Date.now()}`,
      type: meta.label,
      plan: true,
      planKind: kind,
      travel: isTravelLike(kind),
      name,
      destination: isTravelLike(kind) ? place : "",
      place,
      start,
      end,
      status,
      flexibility,
      notes,
      createdAt: new Date().toISOString()
    });
    saveData();
    ["planLogName","planLogPlace","planLogStart","planLogEnd","planLogNotes"].forEach(id => { const el=document.getElementById(id); if(el) el.value=""; });
    renderHistory();
    if (typeof renderTripOverlay === "function") try { renderTripOverlay(); } catch (_) {}
    if (typeof showToast === "function") showToast(`${meta.label} saved to Tsuki ${meta.icon}`);
  }

  function planRecords() {
    return ensureStore().filter(r => r.plan === true || r.travel === true || r.type === "Trip" || r.type === "Vacation");
  }

  function renderHistory() {
    const box = document.getElementById("plansEventsHistory");
    if (!box) return;
    const records = planRecords().slice().sort((a,b)=>String(b.start||"").localeCompare(String(a.start||"")));
    if (!records.length) { box.innerHTML = '<article class="soft-note">No plans logged yet. Birthdays, parties, out-of-town days and travel can all live here.</article>'; return; }
    box.innerHTML = `<div class="plans-events-history">${records.slice(0,30).map(record => {
      const a = analyzePlan(record); const kind = a?.kind || normalizeKind(record); const meta = KIND_META[kind] || KIND_META.custom;
      const s = safeDate(record.start); const e = safeDate(record.end)||s;
      const period = a?.period; const week = a?.pregnancyWeek;
      return `<article class="plans-events-item"><header><div><strong>${meta.icon} ${esc(record.name || meta.label)}</strong><small>${esc(record.place || record.destination || "")}${(record.place||record.destination)?" · ":""}${fmt(s,true)}${e&&key(e)!==key(s)?` – ${fmt(e,true)}`:""}</small></div><span class="plans-events-badge">${esc(meta.label)}</span></header>${period?`<div class="plans-events-note"><strong>${esc(period.label)}</strong><small>${esc(period.text)}</small></div>`:""}${week?`<div class="plans-events-note"><strong>Pregnancy timing</strong><small>${esc(week.text)}</small></div>`:""}${record.notes?`<small>${esc(record.notes)}</small>`:""}</article>`;
    }).join("")}</div>`;
  }

  function renderPanel() {
    ensureStyle(); updateLabels(); const panel = ensurePanel(); if (!panel) return;
    panel.innerHTML = `
      <article class="plans-events-hero"><p class="eyebrow">PLANS & EVENTS</p><h2>See how important dates line up with your body 🗓️</h2><p>Birthdays, parties, weddings, concerts, dates, work events, appointments, out-of-town days and travel can all be checked against your saved cycle or Pregnancy context.</p></article>
      <article class="plans-events-card"><p class="eyebrow">CHECK A DATE</p><h3>What happens around this plan?</h3><div class="plans-events-grid"><label class="wide"><span class="field-label">Plan type</span><select id="planCheckKind" class="input">${kindOptions("birthday")}</select></label><label><span class="field-label">Start</span><input id="planCheckStart" class="input" type="date"></label><label><span class="field-label">End</span><input id="planCheckEnd" class="input" type="date"></label></div><button id="planCheckDates" type="button" class="primary-button full-width">Check these dates</button><div id="planCheckResult"></div></article>
      <article class="plans-events-card"><p class="eyebrow">LOG IT</p><h3>Save a plan or event</h3><div class="plans-events-grid"><label><span class="field-label">Type</span><select id="planLogKind" class="input">${kindOptions("birthday")}</select></label><label><span class="field-label">Status</span><select id="planLogStatus" class="input"><option value="planned">Planned</option><option value="completed">Completed</option></select></label><label class="wide"><span class="field-label">Name</span><input id="planLogName" class="input" maxlength="70" placeholder="e.g. Mom's birthday dinner"></label><label class="wide"><span class="field-label">Place / destination</span><input id="planLogPlace" class="input" maxlength="90" placeholder="Optional"></label><label><span class="field-label">Start</span><input id="planLogStart" class="input" type="date"></label><label><span class="field-label">End</span><input id="planLogEnd" class="input" type="date"></label><label class="wide"><span class="field-label">Date flexibility</span><select id="planLogFlexibility" class="input"><option value="fixed">Fixed date</option><option value="flexible">Flexible / can move</option></select></label><label class="wide"><span class="field-label">Notes</span><textarea id="planLogNotes" class="textarea" placeholder="Optional details"></textarea></label></div><button id="planSaveEvent" type="button" class="primary-button full-width">Save plan</button><div id="plansEventsHistory"></div></article>
      <article class="plans-events-card"><p class="eyebrow">HOW TSUKI THINKS</p><h3>Different plans get different context</h3><p><strong>Cycle Mode:</strong> future plans compare with supported predicted period windows; past plans compare with periods you actually recorded. Irregular timing stays uncertain.</p><p><strong>Pregnancy Mode:</strong> every plan can show how many weeks pregnant you would be. Only Travel / Out of town plans receive travel-specific pregnancy guidance.</p><p><strong>Recent sexual activity:</strong> Tsuki can flag that pregnancy status is still unresolved before an important or expensive plan, but never calls a birthday, party or trip medically “unsafe” just because pregnancy is possible.</p></article>`;
    document.getElementById("planCheckDates")?.addEventListener("click", renderCheckResult);
    document.getElementById("planSaveEvent")?.addEventListener("click", savePlan);
    renderHistory();
  }

  function install() {
    if (typeof data === "undefined" || typeof saveData !== "function") { setTimeout(install,50); return; }
    if (!window.TsukiTravelIntelligence?.installed) { setTimeout(install,50); return; }
    ensureStore();
    if (typeof showScreen === "function" && !showScreen.__plansEventsWrapped) {
      const base = showScreen;
      const wrapped = function(name, ...args) {
        const result = base.call(this, name, ...args);
        if (name === "going-out") setTimeout(renderPanel, 0);
        return result;
      };
      wrapped.__plansEventsWrapped = true;
      try { showScreen = wrapped; } catch (_) {}
    }
    renderPanel();
    window.TsukiPlansEventsIntelligence.installed = true;
    window.TsukiPlansEventsIntelligence.test = { normalizeKind, isTravelLike, analyzePlan, pregnancyWeekContext, periodContext, reproductiveUncertainty };
  }

  window.TsukiPlansEventsIntelligence = { installed:false, publicVersion:PUBLIC_VERSION, test:null, install };
  install();
})();
