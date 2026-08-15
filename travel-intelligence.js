/* ============================================================
   TSUKI v1 — TRAVEL INTELLIGENCE
   Local-first trip logging + cycle/pregnancy-aware planning.
   Travel context never rewrites period history, forecasts, pregnancy dating,
   sexual-activity history, or clinical guidance.
   ============================================================ */

(() => {
  "use strict";

  const PUBLIC_VERSION = "v1.0";
  const state = { installed: false };
  const DAY = 86400000;

  const esc = value => typeof escapeHTML === "function"
    ? escapeHTML(value)
    : String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

  function safeDate(value) {
    if (typeof parseDate === "function") return parseDate(value);
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : new Date(value);
    if (typeof value !== "string") return null;
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
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

  function dayDiff(a, b) {
    if (typeof daysBetween === "function") return daysBetween(a, b);
    const x = new Date(a.getFullYear(), a.getMonth(), a.getDate());
    const y = new Date(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((y - x) / DAY);
  }

  function fmt(date, year = false) {
    if (!date) return "—";
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", ...(year ? { year: "numeric" } : {}) });
  }

  function ensureTrips() {
    if (!Array.isArray(data.trips)) data.trips = [];
    return data.trips;
  }

  function cyclePattern() {
    try { return typeof cyclePatternSetting === "function" ? cyclePatternSetting() : (data.settings?.cyclePattern || "regular"); }
    catch (_) { return data.settings?.cyclePattern || "regular"; }
  }

  function predictionWindows() {
    if (data.mode !== "cycle" || cyclePattern() !== "regular") return [];
    try { return typeof calendarPredictionWindows === "function" ? calendarPredictionWindows(12) : []; }
    catch (_) { return []; }
  }

  function overlaps(aStart, aEnd, bStart, bEnd) {
    return Boolean(aStart && aEnd && bStart && bEnd && aStart <= bEnd && aEnd >= bStart);
  }

  function predictedPeriodOverlap(start, end) {
    return predictionWindows().find(w => overlaps(start, end, safeDate(w.start), safeDate(w.end))) || null;
  }

  function actualPeriodOverlap(start, end) {
    let periods = [];
    try { periods = typeof validPeriods === "function" ? validPeriods() : (Array.isArray(data.periods) ? data.periods : []); }
    catch (_) { periods = Array.isArray(data.periods) ? data.periods : []; }
    return periods.find(p => {
      const s = safeDate(p.start);
      const e = safeDate(p.end) || (s ? plusDays(s, Math.max(0, Number(p.length || data.settings?.periodLength || 5) - 1)) : null);
      return overlaps(start, end, s, e);
    }) || null;
  }

  function periodTravelState(startValue, endValue, isPast = false) {
    const start = safeDate(startValue); const end = safeDate(endValue) || start;
    if (!start || !end) return { key: "unknown", label: "Choose dates", text: "Add trip dates to compare them with your cycle." };
    if (isPast) {
      const actual = actualPeriodOverlap(start, end);
      return actual
        ? { key: "actual-overlap", label: "Period happened during this trip", text: `Your recorded period overlapped this trip around ${fmt(safeDate(actual.start), true)}.` }
        : { key: "actual-clear", label: "No recorded period overlap", text: "No period you actually recorded overlaps these travel dates." };
    }
    if (data.mode !== "cycle") return { key: "not-cycle", label: "Cycle forecast paused", text: "Cycle-date planning is paused outside Cycle Mode." };
    if (cyclePattern() !== "regular") return { key: "uncertain", label: "Period timing uncertain", text: "Your rhythm is irregular or still being learned, so Tsuki will not call travel dates period-free from calendar estimates alone." };
    const windows = predictionWindows();
    if (!windows.length) return { key: "uncertain", label: "Still learning your timing", text: "Tsuki does not have enough period forecast information to recommend travel dates yet." };
    const hit = predictedPeriodOverlap(start, end);
    return hit
      ? { key: "period-overlap", label: "Predicted period overlap", text: `These dates overlap Tsuki's current estimated period window around ${fmt(safeDate(hit.center || hit.start), true)}. Predictions can shift.` }
      : { key: "period-clear", label: "No predicted period overlap", text: "These dates do not overlap Tsuki's current estimated period windows. This is a planning estimate, not a guarantee." };
  }

  function reproductiveUncertainty() {
    const api = window.TsukiReproductiveIntelligence?.test;
    if (!api?.pregnancyContext) return null;
    let ctx = null;
    try { ctx = api.pregnancyContext(); } catch (_) { return null; }
    if (!ctx?.latest?.date || ctx.type === "none") return null;
    const sexDate = safeDate(ctx.latest.date || ctx.latest.key);
    if (!sexDate) return null;
    const testDate = plusDays(sexDate, 21);
    return {
      sexDate,
      testDate,
      type: ctx.type,
      possibility: ctx.possibility,
      text: ctx.text || "Pregnancy possibility is not resolved from the saved information yet."
    };
  }

  function pregnancyAnchor() {
    if (data.mode !== "pregnancy" || !data.pregnancy?.active) return null;
    const edd = safeDate(data.pregnancy.edd);
    return edd ? { edd } : null;
  }

  function gestationOn(dateValue) {
    const date = safeDate(dateValue); const anchor = pregnancyAnchor();
    if (!date || !anchor) return null;
    const days = 280 - dayDiff(date, anchor.edd);
    if (!Number.isFinite(days)) return null;
    return { days, weeks: Math.floor(days / 7), extraDays: ((days % 7) + 7) % 7 };
  }

  function pregnancyTravelState(startValue, endValue) {
    const start = safeDate(startValue); const end = safeDate(endValue) || start;
    const anchor = pregnancyAnchor();
    if (!start || !end || !anchor) return null;
    const a = gestationOn(start); const b = gestationOn(end);
    if (!a || !b) return null;
    if (a.days < 0) return { key: "before-pregnancy", label: "Before pregnancy dating", text: "These dates fall before the current pregnancy dating anchor." };
    if (a.weeks >= 42) return { key: "after-due", label: "Beyond the expected delivery period", text: "These dates are beyond the current estimated due-date period. Use your maternity team's actual plan instead of Tsuki for travel planning." };
    if (a.weeks >= 14 && b.weeks <= 28) return { key: "preferred", label: "Mid-pregnancy window", text: `You would be about ${a.weeks}–${b.weeks} weeks pregnant. ACOG describes 14–28 weeks as generally the best time to travel in an uncomplicated pregnancy.` };
    if (a.weeks < 14) return { key: "early", label: "Early pregnancy", text: `You would be about ${Math.max(0,a.weeks)}–${Math.max(0,b.weeks)} weeks pregnant. Travel can still be possible in an uncomplicated pregnancy, but nausea/fatigue are common and obstetric emergencies are more common in the first trimester.` };
    if (a.weeks >= 36 || b.weeks >= 36) return { key: "late", label: "Very late pregnancy", text: `You would be about ${a.weeks}–${b.weeks} weeks pregnant. Many airlines restrict travel around 36 weeks or earlier for some international trips; confirm with your maternity team and carrier.` };
    return { key: "later", label: "Later pregnancy", text: `You would be about ${a.weeks}–${b.weeks} weeks pregnant. After 28 weeks travel can become less comfortable and may carry more logistical risk, so confirm the plan with your maternity team and carrier.` };
  }

  function tripAnalysis(trip) {
    const start = safeDate(trip.start); const end = safeDate(trip.end) || start;
    if (!start) return null;
    const today = safeDate(typeof todayKey === "function" ? todayKey() : key(new Date())) || new Date();
    const past = end < today || trip.status === "completed";
    return {
      period: periodTravelState(start, end, past),
      pregnancy: pregnancyTravelState(start, end),
      uncertainty: data.mode === "cycle" ? reproductiveUncertainty() : null
    };
  }

  function candidateSafety(start, duration) {
    const end = plusDays(start, duration - 1);
    if (data.mode === "pregnancy") {
      const p = pregnancyTravelState(start, end);
      return { start, end, ok: p?.key === "preferred", state: p };
    }
    if (data.mode === "cycle") {
      const p = periodTravelState(start, end, false);
      const uncertainty = reproductiveUncertainty();
      const uncertaintyBlocks = uncertainty && end < uncertainty.testDate;
      return { start, end, ok: p.key === "period-clear" && !uncertaintyBlocks, state: p, uncertaintyBlocks, uncertainty };
    }
    return { start, end, ok: false, state: { key: "unsupported", label: "Planning unavailable", text: "Date recommendations are available in Cycle or Pregnancy Mode." } };
  }

  function recommendedWindows(duration = 4, fromValue = null, horizonDays = 270) {
    const from = safeDate(fromValue) || plusDays(new Date(), 1);
    const out = [];
    const mode = data.mode;
    if (mode === "cycle" && cyclePattern() !== "regular") return out;

    // Cache expensive inputs once for the scan. A recommendation run can inspect
    // hundreds of candidate starts, but forecasts and reproductive context do not
    // change during that single synchronous calculation.
    const cachedWindows = mode === "cycle" ? predictionWindows().map(w => ({
      ...w,
      startDate: safeDate(w.start),
      endDate: safeDate(w.end)
    })) : [];
    const cachedUncertainty = mode === "cycle" ? reproductiveUncertainty() : null;
    const anchor = mode === "pregnancy" ? pregnancyAnchor() : null;

    for (let i = 0; i < horizonDays && out.length < 6; i++) {
      const start = plusDays(from, i);
      const end = plusDays(start, duration - 1);
      let result;

      if (mode === "cycle") {
        const hit = cachedWindows.find(w => overlaps(start, end, w.startDate, w.endDate));
        const uncertaintyBlocks = Boolean(cachedUncertainty && end < cachedUncertainty.testDate);
        result = {
          start, end,
          ok: !hit && cachedWindows.length > 0 && !uncertaintyBlocks,
          state: hit
            ? { key: "period-overlap", label: "Predicted period overlap", text: "These dates overlap Tsuki's current estimated period window. Predictions can shift." }
            : { key: "period-clear", label: "No predicted period overlap", text: "These dates do not overlap Tsuki's current estimated period windows. This is a planning estimate, not a guarantee." },
          uncertaintyBlocks,
          uncertainty: cachedUncertainty
        };
      }
      else if (mode === "pregnancy" && anchor) {
        const p = pregnancyTravelState(start, end);
        result = { start, end, ok: p?.key === "preferred", state: p };
      }
      else {
        result = { start, end, ok: false, state: { key: "unsupported", label: "Planning unavailable", text: "Date recommendations are available in Cycle or Pregnancy Mode." } };
      }

      if (!result.ok) continue;
      const previous = out[out.length - 1];
      if (previous && dayDiff(previous.end, start) < Math.max(4, duration)) continue;
      out.push(result);
    }
    return out;
  }

  function ensureStyle() {
    if (document.getElementById("travelIntelStyle")) return;
    const style = document.createElement("style");
    style.id = "travelIntelStyle";
    style.textContent = `
      .travel-intel{margin:12px 0 18px}.travel-hero{padding:18px;border-radius:24px;background:linear-gradient(145deg,rgba(255,244,248,.96),rgba(245,241,255,.96));border:1px solid rgba(146,112,139,.14)}
      .travel-hero h2,.travel-card h3{margin:4px 0 7px}.travel-tabs{display:flex;gap:8px;margin:12px 0}.travel-tab{flex:1;min-height:40px;border-radius:14px;border:1px solid rgba(146,112,139,.16);background:rgba(255,255,255,.7);font-weight:800}.travel-tab.active{background:rgba(246,212,224,.82)}
      .travel-card{margin-top:12px;padding:15px;border-radius:20px;background:rgba(255,255,255,.78);border:1px solid rgba(146,112,139,.13)}.travel-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.travel-grid .wide{grid-column:1/-1}
      .travel-result{margin-top:10px;padding:12px;border-radius:15px;background:rgba(248,244,250,.82)}.travel-result strong{display:block;margin-bottom:4px}.travel-result.period-overlap,.travel-result.late{background:rgba(255,237,240,.92)}.travel-result.preferred,.travel-result.period-clear{background:rgba(239,250,244,.92)}
      .travel-window-list,.travel-history{display:grid;gap:9px;margin-top:10px}.travel-window{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:11px 12px;border-radius:15px;background:rgba(255,255,255,.7);border:1px solid rgba(146,112,139,.12)}
      .travel-history-card{padding:13px;border-radius:16px;background:rgba(255,255,255,.68);border:1px solid rgba(146,112,139,.11)}.travel-history-card header{display:flex;justify-content:space-between;gap:10px}.travel-history-card small{display:block;margin-top:3px}.travel-badge{display:inline-flex;margin-top:7px;padding:5px 8px;border-radius:999px;background:rgba(245,226,235,.82);font-size:.72rem;font-weight:800}
      .travel-source{font-size:.74rem;line-height:1.45;opacity:.78}.travel-source a{color:inherit;font-weight:800}.travel-warning{padding:11px;border-radius:14px;background:rgba(255,244,224,.66);margin-top:10px}.travel-actions{display:flex;gap:8px;margin-top:10px}.travel-actions button{flex:1}
      body.hide-cycle-details .travel-private{filter:blur(5px);pointer-events:none;user-select:none}
      @media(max-width:390px){.travel-grid{grid-template-columns:1fr}.travel-grid .wide{grid-column:auto}.travel-window{align-items:flex-start;flex-direction:column}.travel-actions{flex-direction:column}}
    `;
    document.head.appendChild(style);
  }

  function ensureDrawerLabels() {
    const row = document.querySelector('[data-open-screen="going-out"]');
    if (row) {
      const strong = row.querySelector("strong"); const small = row.querySelector("small"); const icon = row.querySelector(".drawer-row-icon");
      if (strong) strong.textContent = "Travel & Plans";
      if (small) small.textContent = "Trips, period timing & pregnancy planning";
      if (icon) icon.textContent = "✈️";
    }
    const pregMenu = document.getElementById("pregnancyDrawerMenu");
    if (pregMenu && !document.getElementById("pregnancyTravelDrawerRow")) {
      const careSection = pregMenu.querySelector(".pregnancy-drawer-section:nth-of-type(2)") || pregMenu.querySelector(".pregnancy-drawer-section");
      if (careSection) {
        const button = document.createElement("button");
        button.type = "button";
        button.id = "pregnancyTravelDrawerRow";
        button.className = "drawer-row";
        button.innerHTML = '<span class="drawer-row-icon">✈️</span><span><strong>Travel Planner</strong><small>Check gestational age for possible trips</small></span><b>›</b>';
        button.addEventListener("click", () => { if (typeof showScreen === "function") showScreen("going-out"); });
        careSection.appendChild(button);
      }
    }
  }

  function ensurePanel() {
    const screen = document.querySelector('[data-screen="going-out"]');
    if (!screen) return null;
    let panel = document.getElementById("travelIntelligencePanel");
    if (panel) return panel;
    panel = document.createElement("section");
    panel.id = "travelIntelligencePanel";
    panel.className = "travel-intel travel-private period-signal-private";
    const anchor = screen.querySelector(".page-title") || screen.firstElementChild;
    if (anchor?.nextSibling) screen.insertBefore(panel, anchor.nextSibling); else screen.prepend(panel);
    return panel;
  }

  function renderPlannerResult(start, end) {
    const box = document.getElementById("travelPlannerResult");
    if (!box) return;
    const period = periodTravelState(start, end, false);
    const preg = pregnancyTravelState(start, end);
    const uncertainty = data.mode === "cycle" ? reproductiveUncertainty() : null;
    let html = `<div class="travel-result ${esc(period.key)}"><strong>${esc(period.label)}</strong><span>${esc(period.text)}</span></div>`;
    if (preg) html += `<div class="travel-result ${esc(preg.key)}"><strong>🤰 ${esc(preg.label)}</strong><span>${esc(preg.text)}</span></div>`;
    if (uncertainty) {
      const tripEnd = safeDate(end);
      const beforeTest = tripEnd && tripEnd < uncertainty.testDate;
      html += `<div class="travel-warning"><strong>◐ Pregnancy possibility is not resolved yet</strong><p>${beforeTest ? `This trip would happen before ${fmt(uncertainty.testDate, true)}, about 21 days after the latest potentially unprotected vaginal sex you logged. If knowing pregnancy status would change your trip, consider waiting to make non-refundable plans until testing can clarify it.` : `A pregnancy test may help clarify your status from ${fmt(uncertainty.testDate, true)} onward if there has not been a later recorded period.`}</p><small>Tsuki is not saying travel itself is unsafe and does not diagnose pregnancy.</small></div>`;
    }
    box.innerHTML = html;
  }

  function renderRecommendations() {
    const box = document.getElementById("travelRecommendations");
    if (!box) return;
    const duration = Math.max(1, Math.min(30, Number(document.getElementById("travelDuration")?.value || 4)));
    const earliest = document.getElementById("travelEarliest")?.value || "";
    if (data.mode === "cycle" && cyclePattern() !== "regular") {
      box.innerHTML = `<article class="travel-result uncertain"><strong>Tsuki won't invent period-free dates</strong><span>Your rhythm is irregular or still being learned. You can still check specific dates, but Tsuki won't rank dates as period-free from an unsupported forecast.</span></article>`;
      return;
    }
    const windows = recommendedWindows(duration, earliest, data.mode === "pregnancy" ? 300 : 240);
    if (!windows.length) {
      box.innerHTML = `<article class="travel-result uncertain"><strong>No strong recommendation yet</strong><span>${data.mode === "pregnancy" ? "Tsuki could not find a candidate entirely inside the 14–28 week preference window from the selected starting point. Check specific dates with your maternity team." : "Tsuki needs enough cycle timing information and a clear pregnancy-uncertainty window before it can suggest dates."}</span></article>`;
      return;
    }
    box.innerHTML = `<div class="travel-window-list">${windows.map(item => `<div class="travel-window"><div><strong>${fmt(item.start,true)} – ${fmt(item.end,true)}</strong><small>${data.mode === "pregnancy" ? esc(item.state.text) : "No overlap with Tsuki's current predicted period windows."}</small></div><button type="button" class="secondary-button small" data-use-travel-window="${key(item.start)}|${key(item.end)}">Use dates</button></div>`).join("")}</div>`;
    box.querySelectorAll("[data-use-travel-window]").forEach(btn => btn.addEventListener("click", () => {
      const [s,e] = btn.dataset.useTravelWindow.split("|");
      const start = document.getElementById("travelPlanStart"); const end = document.getElementById("travelPlanEnd");
      if (start) start.value = s; if (end) end.value = e; renderPlannerResult(s,e);
    }));
  }

  function travelRecords() {
    return ensureTrips().filter(t => t.travel === true || t.type === "Trip" || t.type === "Vacation");
  }

  function renderHistory() {
    const box = document.getElementById("travelIntelHistory");
    if (!box) return;
    const trips = travelRecords().slice().sort((a,b) => String(b.start||"").localeCompare(String(a.start||"")));
    if (!trips.length) {
      box.innerHTML = `<article class="soft-note">No travel logged yet. Add past trips too—Tsuki can compare them with periods you actually recorded.</article>`;
      return;
    }
    box.innerHTML = `<div class="travel-history">${trips.slice(0,20).map(trip => {
      const a = tripAnalysis(trip); const start = safeDate(trip.start); const end = safeDate(trip.end)||start;
      const primary = a?.pregnancy || a?.period;
      return `<article class="travel-history-card"><header><div><strong>✈️ ${esc(trip.name || trip.destination || "Travel")}</strong><small>${esc(trip.destination || "")}${trip.destination ? " · " : ""}${fmt(start,true)}${end && key(end)!==key(start) ? ` – ${fmt(end,true)}` : ""}</small></div><span class="travel-badge">${esc(trip.status || (end < new Date() ? "past" : "planned"))}</span></header>${primary ? `<p><strong>${esc(primary.label)}</strong><br><small>${esc(primary.text)}</small></p>` : ""}${trip.notes ? `<small>${esc(trip.notes)}</small>` : ""}</article>`;
    }).join("")}</div>`;
  }

  function saveTravel() {
    const name = document.getElementById("travelLogName")?.value.trim() || "Travel";
    const destination = document.getElementById("travelLogDestination")?.value.trim() || "";
    const start = document.getElementById("travelLogStart")?.value || "";
    const end = document.getElementById("travelLogEnd")?.value || start;
    const status = document.getElementById("travelLogStatus")?.value || "planned";
    const transport = document.getElementById("travelLogTransport")?.value || "";
    const notes = document.getElementById("travelLogNotes")?.value.trim() || "";
    if (!start) { if (typeof showToast === "function") showToast("Choose your travel date first."); return; }
    if (safeDate(end) < safeDate(start)) { if (typeof showToast === "function") showToast("Travel end cannot be before the start."); return; }
    ensureTrips().unshift({ id: typeof uid === "function" ? uid() : `travel-${Date.now()}`, type: "Trip", travel: true, name, destination, start, end, status, transport, notes, createdAt: new Date().toISOString() });
    saveData();
    ["travelLogName","travelLogDestination","travelLogStart","travelLogEnd","travelLogNotes"].forEach(id => { const el=document.getElementById(id); if(el) el.value=""; });
    renderHistory();
    if (typeof renderTripOverlay === "function") try { renderTripOverlay(); } catch (_) {}
    if (typeof showToast === "function") showToast("Travel saved to Tsuki ✈️");
  }

  function renderPanel() {
    ensureStyle(); ensureDrawerLabels(); const panel = ensurePanel(); if (!panel) return;
    panel.innerHTML = `
      <article class="travel-hero"><p class="eyebrow">TSUKI TRAVEL</p><h2>Plan around your body, not against it ✈️</h2><p>Log past or upcoming travel, compare dates with your period forecast, and—when Pregnancy Mode is active—see how far along you would be for a trip.</p></article>
      <article class="travel-card"><p class="eyebrow">CHECK POSSIBLE DATES</p><h3>Travel Planner</h3><div class="travel-grid"><label><span class="field-label">Start</span><input id="travelPlanStart" class="input" type="date"></label><label><span class="field-label">End</span><input id="travelPlanEnd" class="input" type="date"></label></div><button type="button" id="travelCheckDates" class="primary-button full-width">Check these dates</button><div id="travelPlannerResult"></div></article>
      <article class="travel-card"><p class="eyebrow">FIND BETTER DATES</p><h3>${data.mode === "pregnancy" ? "Mid-pregnancy travel ideas" : "Avoid predicted period windows"}</h3><div class="travel-grid"><label><span class="field-label">Trip length</span><input id="travelDuration" class="input" type="number" min="1" max="30" value="4"></label><label><span class="field-label">Start looking from</span><input id="travelEarliest" class="input" type="date" value="${key(plusDays(new Date(),1))}"></label></div><button type="button" id="travelFindDates" class="secondary-button full-width">Suggest date windows</button><div id="travelRecommendations"></div></article>
      <article class="travel-card"><p class="eyebrow">LOG A TRIP</p><h3>Travel history</h3><div class="travel-grid"><label class="wide"><span class="field-label">Trip name</span><input id="travelLogName" class="input" maxlength="60" placeholder="e.g. Tokyo autumn trip"></label><label class="wide"><span class="field-label">Destination</span><input id="travelLogDestination" class="input" maxlength="80" placeholder="City / country"></label><label><span class="field-label">Start</span><input id="travelLogStart" class="input" type="date"></label><label><span class="field-label">End</span><input id="travelLogEnd" class="input" type="date"></label><label><span class="field-label">Status</span><select id="travelLogStatus" class="input"><option value="planned">Planned</option><option value="completed">Completed</option></select></label><label><span class="field-label">Travel by</span><select id="travelLogTransport" class="input"><option value="">Not specified</option><option>Plane</option><option>Car</option><option>Train</option><option>Bus</option><option>Cruise</option><option>Other</option></select></label><label class="wide"><span class="field-label">Notes</span><textarea id="travelLogNotes" class="textarea" placeholder="Optional plans, comfort needs, appointment notes…"></textarea></label></div><button type="button" id="travelSaveTrip" class="primary-button full-width">Save travel</button><div id="travelIntelHistory"></div></article>
      <article class="travel-card"><p class="eyebrow">PREGNANCY TRAVEL GUIDE</p><h3>How Tsuki uses pregnancy timing</h3><p><strong>14–28 weeks:</strong> ACOG describes mid-pregnancy as generally the best time to travel in an uncomplicated pregnancy.</p><p><strong>After 28 weeks:</strong> travel can be harder and may carry more logistical risk. Airline/cruise cutoffs vary.</p><p><strong>Any pregnancy complication:</strong> your maternity team's advice overrides Tsuki. Travel may be inappropriate when a condition could worsen or require emergency care.</p><p class="travel-source">Sources checked Aug 2026: <a href="https://www.acog.org/womens-health/faqs/travel-during-pregnancy" target="_blank" rel="noopener noreferrer">ACOG Travel During Pregnancy</a> · <a href="https://wwwnc.cdc.gov/travel/page/pregnant-travelers" target="_blank" rel="noopener noreferrer">CDC Pregnant Travelers</a>. CDC also advises destination-specific review for risks such as malaria and Zika.</p></article>`;

    document.getElementById("travelCheckDates")?.addEventListener("click", () => {
      const start=document.getElementById("travelPlanStart")?.value; const end=document.getElementById("travelPlanEnd")?.value || start;
      if (!start) { if(typeof showToast==="function") showToast("Choose travel dates first."); return; }
      if (safeDate(end) < safeDate(start)) { if(typeof showToast==="function") showToast("Travel end cannot be before the start."); return; }
      renderPlannerResult(start,end);
    });
    document.getElementById("travelFindDates")?.addEventListener("click", renderRecommendations);
    document.getElementById("travelSaveTrip")?.addEventListener("click", saveTravel);
    renderHistory();
  }

  function installWrappers() {
    if (typeof showScreen === "function" && !showScreen.__travelWrapped) {
      const base = showScreen;
      const wrapped = function(name, ...args) { const result = base.call(this, name, ...args); if (name === "going-out") setTimeout(renderPanel, 0); return result; };
      wrapped.__travelWrapped = true;
      try { showScreen = wrapped; } catch (_) {}
    }
    document.addEventListener("submit", event => {
      if (event.target?.closest?.('[data-screen="going-out"]')) setTimeout(() => { renderHistory(); }, 30);
    }, true);
  }

  function install() {
    if (state.installed) return;
    if (typeof data === "undefined" || typeof saveData !== "function") { setTimeout(install, 50); return; }
    ensureTrips(); ensureStyle(); ensureDrawerLabels(); ensurePanel(); installWrappers(); renderPanel();
    state.installed = true;
    window.TsukiTravelIntelligence.installed = true;
    window.TsukiTravelIntelligence.test = { periodTravelState, pregnancyTravelState, gestationOn, reproductiveUncertainty, recommendedWindows, tripAnalysis, actualPeriodOverlap, predictedPeriodOverlap };
  }

  window.TsukiTravelIntelligence = { installed: false, publicVersion: PUBLIC_VERSION, test: null, install };
  install();
})();
