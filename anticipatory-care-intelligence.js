/* ============================================================
   TSUKI 🌙 — V1 PRE-RELEASE
   ANTICIPATORY CARE INTELLIGENCE
   Pregnancy + Postpartum/Feeding planning and forecasting.
   Read-only over existing health records. Local-first.
   ============================================================ */
(() => {
  "use strict";

  const MODULE_VERSION = "1.0.0-pre-anticipatory-1";
  const q = (selector, root = document) => root.querySelector(selector);
  const safeArray = value => Array.isArray(value) ? value : [];
  const esc = value => String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  const today = () => typeof todayKey === "function" ? todayKey() : new Date().toISOString().slice(0, 10);
  const toDate = value => {
    if (!value) return null;
    try {
      const d = typeof parseDate === "function" ? parseDate(value) : new Date(`${value}T12:00:00`);
      return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
    } catch (_) { return null; }
  };
  const diffDays = (a, b) => {
    const x = toDate(a), y = toDate(b);
    return x && y ? Math.round((y - x) / 86400000) : null;
  };
  const isPregnancy = () => data?.mode === "pregnancy" && Boolean(data?.pregnancy?.active);
  const isPostpartum = () => data?.mode === "postpartum" && Boolean(data?.postpartum?.active);

  function maternalApi() { return window.TsukiMaternalIntelligence?.test || null; }
  function postpartumApi() { return window.TsukiPostpartumFeedingIntelligence || null; }
  function pregnancyAnalysis() {
    try { return window.TsukiLifeModeIntelligence?.test?.pregnancyAnalysis?.() || null; }
    catch (_) { return null; }
  }

  function upcoming(list, daysAhead = 7) {
    return safeArray(list).filter(item => {
      if (!item?.date) return false;
      const n = diffDays(today(), item.date);
      return n != null && n >= 0 && n <= daysAhead;
    }).sort((a, b) => toDate(a.date) - toDate(b.date));
  }

  function dueRoutines(mode) {
    const care = data?.womensCare || {};
    const completed = care.completions && typeof care.completions === "object" ? care.completions : {};
    return safeArray(care.routines).filter(item => {
      if (!item || item.active === false) return false;
      const target = item.mode || item.lifeMode || "both";
      if (!["both", mode].includes(target)) return false;
      const key = `${today()}:${item.id}`;
      return !completed[key] && !completed?.[today()]?.[item.id];
    });
  }

  function pregnancyUrgent() {
    const analysis = pregnancyAnalysis();
    return Boolean(safeArray(analysis?.currentWarnings).length || analysis?.movementChange);
  }

  function postpartumUrgent() {
    try {
      const maternal = postpartumApi()?.maternalSafety?.() || { level: "routine" };
      const baby = postpartumApi()?.babySafety?.() || { level: "routine" };
      return maternal.level === "urgent" || baby.level === "urgent";
    } catch (_) { return false; }
  }

  function pregnancyWeekPlan() {
    if (!isPregnancy()) return [];
    if (pregnancyUrgent()) return [{ icon: "⚠️", level: "urgent", title: "Do not wait on a forecast", text: "A pregnancy warning sign is recorded. Follow the urgent-care guidance already shown in Tsuki; personalized planning is intentionally suppressed." }];

    const out = [];
    upcoming(data?.pregnancy?.appointments, 7).slice(0, 2).forEach(item => {
      const n = diffDays(today(), item.date);
      out.push({ icon: "🩺", level: n <= 1 ? "soon" : "routine", title: n === 0 ? "Appointment today" : n === 1 ? "Appointment tomorrow" : `Appointment in ${n} days`, text: `${item.type || item.title || "Pregnancy appointment"}${item.provider ? ` · ${item.provider}` : ""}. Tsuki can organize recent changes and your saved questions before you go.` });
    });
    upcoming(data?.pregnancy?.tests, 7).filter(item => !["Completed", "Done"].includes(item.status)).slice(0, 2).forEach(item => {
      const n = diffDays(today(), item.date);
      out.push({ icon: "🧪", level: "routine", title: `${item.name || "Test / scan"}${n === 0 ? " today" : ` in ${n} day${n === 1 ? "" : "s"}`}`, text: "Use the instructions from your maternity team for preparation. Tsuki records the plan but does not invent test instructions." });
    });
    const routines = dueRoutines("pregnancy");
    if (routines.length) out.push({ icon: "💊", level: "routine", title: `${routines.length} personal care routine${routines.length === 1 ? "" : "s"} open today`, text: routines.slice(0, 3).map(x => x.name || x.title || "Routine").join(" · ") + ". These are routines you entered; Tsuki does not change medication instructions." });
    return out.slice(0, 5);
  }

  function pregnancyAppointmentAgenda() {
    if (!isPregnancy() || pregnancyUrgent()) return [];
    const out = [];
    const analysis = pregnancyAnalysis();
    safeArray(data?.pregnancy?.questions).filter(x => !x.answered).slice(0, 4).forEach(x => out.push(`Question: ${x.text || x.question || "Saved pregnancy question"}`));
    safeArray(analysis?.trajectory?.changes).slice(0, 3).forEach(x => out.push(`Recent change: ${x.label} has been logged ${x.direction}.`));
    const meds = safeArray(data?.pregnancy?.medications).filter(x => x?.name).slice(0, 4);
    if (meds.length) out.push(`Medication/supplement list: ${meds.map(x => x.name).join(", ")}.`);
    const recentWarnings = Object.entries(data?.pregnancy?.logs || {}).sort((a,b) => a[0].localeCompare(b[0])).slice(-14).filter(([, log]) => safeArray(log?.warnings).length || log?.movement === "Less than usual");
    if (recentWarnings.length) out.push(`Safety-related entries were recorded on ${recentWarnings.length} recent check-in${recentWarnings.length === 1 ? "" : "s"}; do not wait for a routine visit if urgent guidance applies.`);
    if (!out.length) out.push("No major agenda item has enough recorded context yet. You can still save anything you want to ask your maternity team.");
    return out;
  }

  function pregnancyCareReadiness() {
    if (!isPregnancy()) return null;
    const appt = upcoming(data?.pregnancy?.appointments, 30)[0];
    const logs = Object.keys(data?.pregnancy?.logs || {}).length;
    const questions = safeArray(data?.pregnancy?.questions).filter(x => !x.answered).length;
    const tests = upcoming(data?.pregnancy?.tests, 30).filter(x => !["Completed", "Done"].includes(x.status)).length;
    if (pregnancyUrgent()) return { state: "safety", title: "Safety overrides readiness", text: "Urgent concerns should be acted on now rather than saved for routine preparation." };
    if (appt && diffDays(today(), appt.date) <= 3) return { state: "prepare", title: "Appointment prep window", text: `${questions} saved question${questions === 1 ? "" : "s"} · ${tests} upcoming test/scan item${tests === 1 ? "" : "s"} · ${logs} pregnancy check-in${logs === 1 ? "" : "s"} available for context.` };
    return { state: "steady", title: "Care plan is being organized", text: appt ? `Next saved appointment is in ${diffDays(today(), appt.date)} days.` : "No upcoming maternity appointment is saved in Tsuki. Add your clinician's actual schedule if you want anticipatory reminders." };
  }

  function postpartumRecoveryReserve() {
    if (!isPostpartum()) return null;
    if (postpartumUrgent()) return { state: "urgent", title: "Safety first", text: "A maternal or baby danger sign is recorded, so Tsuki will not score or normalize today's recovery load." };
    const logs = Object.entries(data?.postpartum?.recoveryLogs || {}).sort((a,b) => a[0].localeCompare(b[0])).slice(-4).map(([,log]) => log || {});
    if (logs.length < 2) return { state: "learning", title: "Still learning your recovery rhythm", text: "A few recovery check-ins will help Tsuki distinguish a single hard day from a sustained load." };
    let load = 0;
    logs.forEach(log => {
      if (["poor", "very-poor"].includes(log.sleep)) load += 1;
      if (["low", "very-low"].includes(log.energy)) load += 1;
      if (log.support === "need-more") load += 1;
      if (["very-low", "panicky", "overwhelmed"].includes(log.mood)) load += 2;
    });
    if (load >= 8) return { state: "stretched", title: "Your recovery reserve looks stretched", text: "Several recent check-ins combine poor sleep, low energy, difficult mood or needing more help. Tsuki will prioritize rest and practical support over optional goals." };
    if (load >= 4) return { state: "watch", title: "Your recovery load is building", text: "More than one recovery pressure has repeated recently. Consider protecting rest and asking for help before the load grows." };
    return { state: "steady", title: "Your recent recovery load looks steadier", text: "Tsuki does not see a strong repeated load signal in the recent observed check-ins. This is not a medical clearance." };
  }

  function feedingRecoveryInteraction() {
    if (!isPostpartum() || postpartumUrgent()) return null;
    const pp = data?.postpartum || {};
    const feedByDay = new Map();
    safeArray(pp.feedingLogs).slice(-120).forEach(x => feedByDay.set(x.date, (feedByDay.get(x.date) || 0) + 1));
    const rows = Object.entries(pp.recoveryLogs || {}).filter(([date]) => feedByDay.has(date)).sort((a,b) => a[0].localeCompare(b[0])).slice(-14);
    if (rows.length < 4) return { title: "Feeding + recovery link is still learning", text: "Tsuki needs several days where both feeding and recovery were actually logged before comparing them." };
    const counts = rows.map(([date]) => feedByDay.get(date) || 0).sort((a,b) => a-b);
    const median = counts[Math.floor(counts.length / 2)] || 0;
    const higher = rows.filter(([date]) => (feedByDay.get(date) || 0) > median);
    const other = rows.filter(([date]) => (feedByDay.get(date) || 0) <= median);
    const strained = group => group.filter(([,log]) => ["poor","very-poor"].includes(log.sleep) || ["low","very-low"].includes(log.energy) || log.support === "need-more").length;
    if (higher.length >= 2 && other.length >= 2 && strained(higher) / higher.length >= strained(other) / other.length + 0.25) {
      return { title: "Feeding-heavy logged days have also looked harder", text: "On days where you logged more feeding/pumping entries than your recent middle range, low energy, poor sleep or needing more support also appeared more often. This is an association in your own logging, not proof that feeding caused it." };
    }
    return { title: "No clear feeding/recovery interaction yet", text: "Tsuki does not see a stable enough difference between higher-log feeding days and other observed recovery days yet." };
  }

  function postpartumWeekPlan() {
    if (!isPostpartum()) return [];
    if (postpartumUrgent()) return [{ icon: "⚠️", level: "urgent", title: "Do not wait on a forecast", text: "A maternal or baby danger sign is recorded. Follow the safety guidance now rather than waiting for Tsuki to monitor the pattern." }];
    const out = [];
    upcoming(data?.postpartum?.appointments, 7).slice(0, 2).forEach(item => {
      const n = diffDays(today(), item.date);
      out.push({ icon: "🩺", level: n <= 1 ? "soon" : "routine", title: n === 0 ? "Care visit today" : `${item.title || "Care visit"} in ${n} day${n === 1 ? "" : "s"}`, text: `${item.provider || ""}${item.provider ? " · " : ""}Bring recovery, feeding and baby observations that matter to you.` });
    });
    const reserve = postpartumRecoveryReserve();
    if (reserve && ["stretched", "watch"].includes(reserve.state)) out.push({ icon: "🫶", level: "gentle", title: reserve.title, text: reserve.text });
    const feeding = safeArray(postpartumApi()?.feedingInsights?.());
    if (feeding[0]) out.push({ icon: feeding[0].icon || "🍼", level: "info", title: feeding[0].title, text: feeding[0].text });
    const interaction = feedingRecoveryInteraction();
    if (interaction && !interaction.title.includes("still learning") && !interaction.title.includes("No clear")) out.push({ icon: "🤍", level: "info", title: interaction.title, text: interaction.text });
    return out.slice(0, 5);
  }

  function babyCareTrend() {
    if (!isPostpartum()) return null;
    if (postpartumUrgent()) return { state: "urgent", title: "Baby safety comes first", text: "A baby danger sign is recorded. Tsuki will not turn it into an ordinary trend." };
    const entries = Object.entries(data?.postpartum?.babyLogs || {}).sort((a,b) => a[0].localeCompare(b[0])).slice(-7);
    if (entries.length < 3) return { state: "learning", title: "Baby care trend is still learning", text: "A few optional baby observations can help Tsuki organize what changed without setting universal targets." };
    const recent = entries.slice(-2).map(([,x]) => x || {});
    const earlier = entries.slice(0, -2).map(([,x]) => x || {});
    const wet = group => group.map(x => Number(x.wetDiapers)).filter(Number.isFinite);
    const mean = arr => arr.length ? arr.reduce((a,b) => a+b,0)/arr.length : null;
    const r = mean(wet(recent)), e = mean(wet(earlier));
    if (r != null && e != null && r < e - 1.5) return { state: "changed", title: "Wet-diaper entries are lower than your earlier recent logs", text: "This is a change in what you recorded, not a diagnosis or a universal diaper target. If baby's feeding, hydration or wellbeing worries you, contact the baby's healthcare professional." };
    const feedingConcern = recent.some(x => ["worse", "poor", "less"].includes(String(x.feeding || "").toLowerCase()));
    if (feedingConcern) return { state: "changed", title: "Baby feeding seems different in recent entries", text: "Tsuki noticed a change in your own observations. If feeding has dropped noticeably or baby is not feeding well, use the baby-safety guidance rather than waiting for a trend." };
    return { state: "steady", title: "No strong baby-care change in the recent observed entries", text: "Tsuki keeps this descriptive and does not infer normal growth, hydration or health from tracking alone." };
  }

  function renderItems(items) {
    return items.length ? `<div class="anticipatory-list">${items.map(item => `<article class="anticipatory-item ${esc(item.level || "routine")}"><span>${esc(item.icon || "🌙")}</span><div><strong>${esc(item.title)}</strong><p>${esc(item.text)}</p></div></article>`).join("")}</div>` : `<p class="muted small-text">Nothing time-sensitive is saved for the next seven days.</p>`;
  }

  function pregnancyHTML() {
    const readiness = pregnancyCareReadiness();
    const agenda = pregnancyAppointmentAgenda();
    return `<p class="eyebrow">CARE FORECAST</p><h3>Today → tomorrow → this week</h3>${renderItems(pregnancyWeekPlan())}${readiness ? `<div class="anticipatory-summary"><strong>${esc(readiness.title)}</strong><p>${esc(readiness.text)}</p></div>` : ""}<details><summary>Smart appointment agenda</summary>${agenda.map(x => `<p>• ${esc(x)}</p>`).join("")}<small>Tsuki organizes saved facts. Your maternity team decides what they mean and what care you need.</small></details><details><summary>Why this forecast is cautious</summary><p>Tsuki predicts useful care actions, not diagnoses. Missing check-ins stay unknown, urgent warning signs override personalization, and pregnancy dating is never changed by this module.</p></details>`;
  }

  function postpartumHTML() {
    const reserve = postpartumRecoveryReserve();
    const interaction = feedingRecoveryInteraction();
    const baby = babyCareTrend();
    return `<p class="eyebrow">CARE FORECAST</p><h3>What may help most next</h3>${renderItems(postpartumWeekPlan())}${reserve ? `<div class="anticipatory-summary"><strong>${esc(reserve.title)}</strong><p>${esc(reserve.text)}</p></div>` : ""}${interaction ? `<div class="anticipatory-summary"><strong>${esc(interaction.title)}</strong><p>${esc(interaction.text)}</p></div>` : ""}${baby ? `<div class="anticipatory-summary"><strong>${esc(baby.title)}</strong><p>${esc(baby.text)}</p></div>` : ""}<details><summary>Why this forecast is cautious</summary><p>Tsuki links only observations you actually logged. Maternal and baby danger signs suppress ordinary forecasting. Associations do not prove cause, and this module never diagnoses milk supply, recovery complications or baby health.</p></details>`;
  }

  function ensureStyles() {
    if (q("#tsukiAnticipatoryStyle")) return;
    const style = document.createElement("style");
    style.id = "tsukiAnticipatoryStyle";
    style.textContent = `.anticipatory-card{margin-top:12px;padding:16px;border-radius:22px;background:var(--card,#fff);box-shadow:0 8px 28px rgba(44,37,55,.07)}.anticipatory-card h3{margin:.2rem 0 .7rem}.anticipatory-list{display:grid;gap:9px}.anticipatory-item{display:flex;gap:10px;padding:11px;border-radius:16px;background:rgba(120,120,140,.07)}.anticipatory-item>span{font-size:1.25rem}.anticipatory-item strong{display:block}.anticipatory-item p,.anticipatory-summary p{margin:.25rem 0 0;font-size:.9rem;line-height:1.45}.anticipatory-item.urgent{background:rgba(185,45,65,.1)}.anticipatory-item.soon{background:rgba(216,114,85,.1)}.anticipatory-summary{margin-top:10px;padding:11px 12px;border-radius:16px;background:rgba(140,110,170,.07)}.anticipatory-card details{margin-top:10px}.anticipatory-card summary{cursor:pointer;font-weight:700}`;
    document.head.appendChild(style);
  }

  function renderPregnancy() {
    const screen = q('[data-screen="pregnancy-dashboard"]');
    if (!screen) return;
    let card = q("#anticipatoryPregnancyCard");
    if (!isPregnancy()) { card?.remove(); return; }
    if (!card) {
      card = document.createElement("article");
      card.id = "anticipatoryPregnancyCard";
      card.className = "anticipatory-card pregnancy-sensitive";
      const ref = q("#maternalPregnancyIntel", screen) || q("#pregnancyAdaptiveIntelligence", screen) || screen.firstElementChild;
      ref?.insertAdjacentElement("afterend", card);
    }
    card.innerHTML = pregnancyHTML();
  }

  function renderPostpartum() {
    const screen = q('[data-screen="postpartum-feeding"]');
    if (!screen) return;
    let card = q("#anticipatoryPostpartumCard");
    if (!isPostpartum()) { card?.remove(); return; }
    if (!card) {
      card = document.createElement("article");
      card.id = "anticipatoryPostpartumCard";
      card.className = "anticipatory-card period-signal-private";
      const ref = q("#maternalPostpartumIntel", screen) || screen.firstElementChild;
      ref?.insertAdjacentElement("afterend", card);
    }
    card.innerHTML = postpartumHTML();
  }

  function renderAll() { ensureStyles(); renderPregnancy(); renderPostpartum(); }

  function install() {
    if (window.TsukiAnticipatoryCare?.installed) return;
    if (typeof data === "undefined" || typeof showScreen !== "function" || !window.TsukiMaternalIntelligence?.installed || !window.TsukiPostpartumFeedingIntelligence?.installed) return setTimeout(install, 80);

    if (typeof renderEverything === "function" && !renderEverything.__anticipatoryWrapped) {
      const base = renderEverything;
      const wrapped = function(...args) { const result = base.apply(this,args); try { renderAll(); } catch (error) { console.warn("Tsuki anticipatory render skipped", error); } return result; };
      wrapped.__anticipatoryWrapped = true;
      try { renderEverything = wrapped; } catch (_) {}
      window.renderEverything = wrapped;
    }
    if (typeof showScreen === "function" && !showScreen.__anticipatoryWrapped) {
      const base = showScreen;
      const wrapped = function(name,...args) { const result = base(name,...args); requestAnimationFrame(() => { if (["pregnancy-dashboard","postpartum-feeding"].includes(name)) renderAll(); }); return result; };
      wrapped.__anticipatoryWrapped = true;
      try { showScreen = wrapped; } catch (_) {}
      window.showScreen = wrapped;
    }

    window.TsukiAnticipatoryCare = { installed:true, version:MODULE_VERSION, render:renderAll, test:{ pregnancyWeekPlan, pregnancyAppointmentAgenda, pregnancyCareReadiness, postpartumRecoveryReserve, feedingRecoveryInteraction, postpartumWeekPlan, babyCareTrend } };
    renderAll();
  }

  window.TsukiAnticipatoryCare = { installed:false, version:MODULE_VERSION, install, test:null };
  install();
})();