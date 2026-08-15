/* ============================================================
   TSUKI 🌙 — V1 PRE-RELEASE
   MATERNAL INTELLIGENCE 2.0
   Pregnancy + Postpartum/Feeding proactive support.
   Local-first, explainable, non-diagnostic.
   ============================================================ */
(() => {
  "use strict";

  const MODULE_VERSION = "1.0.0-pre-maternal-1";
  const q = (selector, root = document) => root.querySelector(selector);
  const esc = (value) => String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  const today = () => typeof todayKey === "function" ? todayKey() : new Date().toISOString().slice(0, 10);
  const toDate = (value) => {
    if (!value) return null;
    try {
      const d = typeof parseDate === "function" ? parseDate(value) : new Date(`${value}T12:00:00`);
      return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
    } catch (_) { return null; }
  };
  const days = (a, b) => {
    const x = toDate(a), y = toDate(b);
    if (!x || !y) return null;
    return Math.round((y - x) / 86400000);
  };
  const isPregnancy = () => data?.mode === "pregnancy" && Boolean(data?.pregnancy?.active);
  const isPostpartum = () => data?.mode === "postpartum" && Boolean(data?.postpartum?.active);
  const safeArray = (value) => Array.isArray(value) ? value : [];
  const uniq = (values) => [...new Set(values.filter(Boolean))];

  function formatDate(value) {
    const d = toDate(value);
    return d ? d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "";
  }

  function pregnancyAnalysis() {
    try { return window.TsukiLifeModeIntelligence?.test?.pregnancyAnalysis?.() || null; }
    catch (_) { return null; }
  }

  function postpartumApi() {
    return window.TsukiPostpartumFeedingIntelligence || null;
  }

  function recentPregnancyLogs(limit = 14) {
    const entries = Object.entries(data?.pregnancy?.logs || {})
      .filter(([, log]) => log && typeof log === "object")
      .sort((a, b) => a[0].localeCompare(b[0]));
    return entries.slice(-limit).map(([date, log]) => ({ date, ...log }));
  }

  function recentPostpartumLogs(limit = 14) {
    const entries = Object.entries(data?.postpartum?.recoveryLogs || {})
      .filter(([, log]) => log && typeof log === "object")
      .sort((a, b) => a[0].localeCompare(b[0]));
    return entries.slice(-limit).map(([date, log]) => ({ date, ...log }));
  }

  function currentGestation() {
    try {
      if (typeof gestationalAgeForDate === "function") return gestationalAgeForDate(today());
    } catch (_) {}
    return null;
  }

  function nextPregnancyAppointment() {
    const now = toDate(today());
    return safeArray(data?.pregnancy?.appointments)
      .filter(x => x?.date && !x.completed && toDate(x.date) && toDate(x.date) >= now)
      .sort((a, b) => toDate(a.date) - toDate(b.date))[0] || null;
  }

  function nextPregnancyTest() {
    const now = toDate(today());
    return safeArray(data?.pregnancy?.tests)
      .filter(x => x?.date && !["Completed", "Done"].includes(x.status) && toDate(x.date) && toDate(x.date) >= now)
      .sort((a, b) => toDate(a.date) - toDate(b.date))[0] || null;
  }

  function nextPostpartumAppointment() {
    const now = toDate(today());
    return safeArray(data?.postpartum?.appointments)
      .filter(x => x?.date && toDate(x.date) && toDate(x.date) >= now)
      .sort((a, b) => toDate(a.date) - toDate(b.date))[0] || null;
  }

  function dueCareRoutines(mode) {
    const care = data?.womensCare || {};
    const routines = safeArray(care.routines);
    const completed = care.completions && typeof care.completions === "object" ? care.completions : {};
    return routines.filter(routine => {
      if (!routine || routine.active === false) return false;
      const target = routine.mode || routine.lifeMode || "both";
      if (!["both", mode].includes(target)) return false;
      const key = `${today()}:${routine.id}`;
      return !completed[key] && !completed?.[today()]?.[routine.id];
    });
  }

  function pregnancySafetyLevel() {
    const a = pregnancyAnalysis();
    const warnings = safeArray(a?.currentWarnings);
    if (a?.movementChange) warnings.push("Baby movement is less than usual");
    return { urgent: warnings.length > 0, warnings: uniq(warnings) };
  }

  function postpartumSafetyLevel() {
    const api = postpartumApi();
    try {
      const maternal = api?.maternalSafety?.() || { level: "routine", urgent: [], discuss: [] };
      const baby = api?.babySafety?.() || { level: "routine", urgent: [] };
      return { maternal, baby, urgent: maternal.level === "urgent" || baby.level === "urgent" };
    } catch (_) {
      return { maternal: { level: "routine", urgent: [], discuss: [] }, baby: { level: "routine", urgent: [] }, urgent: false };
    }
  }

  function repeatedPregnancyConcern() {
    const logs = recentPregnancyLogs(10);
    if (logs.length < 3) return [];
    const findings = [];
    const count = (predicate) => logs.filter(predicate).length;
    const severeNausea = count(x => ["Severe", "severe"].includes(x.nausea));
    const poorSleep = count(x => ["Poor", "Very poor", "poor", "very-poor"].includes(x.sleep));
    const lowEnergy = count(x => ["Low", "Very low", "low", "very-low"].includes(x.energy));
    const highSwelling = count(x => ["Severe", "severe", "Marked", "marked"].includes(x.swelling));
    if (severeNausea >= 2) findings.push("Severe nausea has been recorded on multiple recent check-ins.");
    if (poorSleep >= 3 && lowEnergy >= 3) findings.push("Poor sleep and low energy have repeatedly appeared together recently.");
    if (highSwelling >= 2) findings.push("Marked swelling has been recorded more than once recently.");
    return findings;
  }

  function pregnancyCareForecast() {
    const safety = pregnancySafetyLevel();
    const priorities = [];
    if (safety.urgent) {
      return [{ level: "urgent", icon: "⚠️", title: "Safety comes first", text: "A pregnancy warning sign was recorded. Follow Tsuki's urgent-care guidance and contact your maternity care team or seek urgent medical care as directed." }];
    }

    const appt = nextPregnancyAppointment();
    if (appt) {
      const until = days(today(), appt.date);
      priorities.push({ level: until <= 1 ? "soon" : "routine", icon: "🩺", title: until === 0 ? "Appointment today" : until === 1 ? "Appointment tomorrow" : `Appointment in ${until} days`, text: `${appt.type || appt.title || "Pregnancy appointment"}${appt.provider ? ` · ${appt.provider}` : ""}. Tsuki can help gather your recent changes and saved questions before you go.` });
    } else {
      priorities.push({ level: "info", icon: "🗓️", title: "No upcoming visit saved in Tsuki", text: "If you already have your next prenatal visit scheduled, adding it can make reminders and appointment prep more useful. Your clinician's schedule remains the source of truth." });
    }

    const test = nextPregnancyTest();
    if (test) {
      const until = days(today(), test.date);
      if (until != null && until <= 7) priorities.push({ level: "routine", icon: "🧪", title: `${test.name || "Test / scan"} is coming up`, text: `${formatDate(test.date)} · ${test.status || "Scheduled"}. Bring any instructions from your maternity provider; Tsuki does not interpret preparation requirements on its own.` });
    }

    const routines = dueCareRoutines("pregnancy");
    if (routines.length) priorities.push({ level: "routine", icon: "💊", title: `${routines.length} care routine${routines.length === 1 ? "" : "s"} still open today`, text: `${routines.slice(0, 3).map(x => x.name || x.title || "Routine").join(" · ")}${routines.length > 3 ? "…" : ""}. These are the routines you entered, not medication instructions from Tsuki.` });

    repeatedPregnancyConcern().slice(0, 1).forEach(text => priorities.push({ level: "discuss", icon: "💬", title: "A repeated pattern may be worth mentioning", text: `${text} Tsuki cannot tell what it means medically, but it can be useful to bring the pattern to your maternity care team.` }));

    return priorities.slice(0, 4);
  }

  function pregnancySmartQuestion() {
    const safety = pregnancySafetyLevel();
    if (safety.urgent) return null;
    const logs = recentPregnancyLogs(7);
    const last = logs[logs.length - 1] || {};
    const appt = nextPregnancyAppointment();
    if (appt && (days(today(), appt.date) ?? 99) <= 3) return { icon: "💭", question: "Is there anything that changed since your last visit that you want Tsuki to put at the top of your appointment summary?", action: "Open Pregnancy Care", screen: "pregnancy-care" };
    if (!last.sleep) return { icon: "🌙", question: "How has sleep been lately? A few observed days can help Tsuki distinguish a temporary rough night from a repeated pattern.", action: "Pregnancy Check-in", screen: "pregnancy-log" };
    if (!last.energy) return { icon: "✨", question: "How is your energy today? Tsuki compares only days you actually log—missing days stay unknown.", action: "Pregnancy Check-in", screen: "pregnancy-log" };
    if (!last.contexts?.length) return { icon: "🧩", question: "Was there anything unusual around today's symptoms—travel, illness, poor sleep, stress or a routine change? Optional context helps Tsuki avoid false patterns.", action: "Pregnancy Check-in", screen: "pregnancy-log" };
    return { icon: "🤍", question: "Would anything from this week be useful to remember for your next maternity visit?", action: "Add a provider question", screen: "pregnancy-care" };
  }

  function pregnancyTrendSummary() {
    const a = pregnancyAnalysis();
    const changes = safeArray(a?.trajectory?.changes).slice(0, 3);
    if (!changes.length) return { title: "No clear new trend yet", text: "Tsuki needs enough observed days on both sides of a comparison before it calls something a trend. Missing check-ins stay unknown." };
    return { title: "What changed lately", text: changes.map(x => `${x.label}: ${x.direction}`).join(" · ") + ". These are changes in your own entries, not diagnoses." };
  }

  function postpartumLoadForecast() {
    const safety = postpartumSafetyLevel();
    if (safety.urgent) {
      return [{ level: "urgent", icon: "⚠️", title: "Safety comes first", text: safety.baby.level === "urgent" ? "A baby danger sign was recorded. Contact the baby's healthcare professional or seek urgent care as directed." : "An urgent maternal warning sign was recorded. Seek medical care now rather than waiting for Tsuki to monitor the pattern." }];
    }
    const out = [];
    const appt = nextPostpartumAppointment();
    if (appt) {
      const until = days(today(), appt.date);
      if (until != null && until <= 7) out.push({ level: "routine", icon: "🩺", title: until === 0 ? "Care appointment today" : `${appt.title || "Care appointment"} in ${until} day${until === 1 ? "" : "s"}`, text: `${appt.provider || ""}${appt.provider ? " · " : ""}${formatDate(appt.date)}. Tsuki can collect recovery, feeding and baby observations before the visit.` });
    }

    const logs = recentPostpartumLogs(7);
    const poorSleep = logs.filter(x => ["poor", "very-poor"].includes(x.sleep)).length;
    const lowEnergy = logs.filter(x => ["low", "very-low"].includes(x.energy)).length;
    const support = logs.filter(x => x.support === "need-more").length;
    if (poorSleep >= 3 && lowEnergy >= 3) out.push({ level: "gentle", icon: "☁️", title: "Your recent load looks heavy", text: "Poor sleep and low energy have repeatedly appeared together. Tsuki will prioritize rest, meals, hydration and practical support over pushing activity." });
    if (support >= 2) out.push({ level: "discuss", icon: "🫶", title: "Support has come up more than once", text: "You recorded needing more help on multiple recent days. Consider making one concrete ask today—food, household help, baby care, transport or protected rest." });

    const feeding = postpartumApi()?.feedingInsights?.() || [];
    if (feeding[0]) out.push({ level: "info", icon: feeding[0].icon || "🍼", title: feeding[0].title, text: feeding[0].text });

    const maternalDiscuss = safeArray(safety.maternal?.discuss);
    if (maternalDiscuss.length) out.push({ level: "discuss", icon: "💬", title: "Worth discussing", text: `${maternalDiscuss[0]}. Tsuki can remember the pattern, but a healthcare or lactation professional can assess it directly.` });

    return out.slice(0, 4);
  }

  function postpartumSmartQuestion() {
    const safety = postpartumSafetyLevel();
    if (safety.urgent) return null;
    const pp = data?.postpartum || {};
    const rec = pp.recoveryLogs?.[today()] || {};
    const baby = pp.babyLogs?.[today()] || {};
    if (!rec.support) return { icon: "🫶", question: "Do you feel you have enough practical support today? Tsuki can notice when support needs keep repeating.", action: "Recovery check-in", open: "recovery" };
    if (!rec.mood) return { icon: "💗", question: "How are you feeling emotionally today—not just physically?", action: "Recovery check-in", open: "recovery" };
    if (!baby.feeding && pp.settings?.showBabyCare !== false) return { icon: "👶", question: "How has baby's feeding seemed today compared with baby's usual pattern?", action: "Baby check", open: "baby" };
    if (["breastfeeding", "pumping", "breast-pump", "combination"].includes(pp.feedingMode) && !safeArray(pp.feedingLogs).some(x => x.date === today())) return { icon: "🍼", question: "Want to save one feeding or pumping observation today? One useful entry is enough—Tsuki does not need every feed.", action: "Log feeding", open: "feeding" };
    return { icon: "🤍", question: "Anything from recovery, feeding or baby care that you want to remember for the next appointment?", action: "Open Postpartum & Feeding", screen: "postpartum-feeding" };
  }

  function postpartumChangeSummary() {
    const logs = recentPostpartumLogs(10);
    if (logs.length < 5) return { title: "Tsuki is still learning recovery", text: "A few more check-ins will help Tsuki compare recent recovery with your own earlier postpartum observations." };
    const split = Math.max(2, Math.floor(logs.length / 2));
    const earlier = logs.slice(0, split), recent = logs.slice(split);
    const score = (arr, key, bad) => arr.filter(x => bad.includes(x[key])).length / Math.max(1, arr.filter(x => x[key]).length);
    const changes = [];
    const compare = (key, label, bad) => {
      const a = score(earlier, key, bad), b = score(recent, key, bad);
      if (Math.abs(b - a) >= 0.35) changes.push(`${label} has been logged ${b > a ? "more often" : "less often"} recently`);
    };
    compare("sleep", "Poor sleep", ["poor", "very-poor"]);
    compare("energy", "Low energy", ["low", "very-low"]);
    compare("mood", "Difficult mood", ["very-low", "panicky", "overwhelmed"]);
    return changes.length ? { title: "Your recovery pattern is shifting", text: `${changes.slice(0, 2).join(" · ")}. This describes your own entries; it does not explain the cause.` } : { title: "Recovery looks fairly similar lately", text: "Tsuki does not see a large enough shift in the recent observed check-ins to call out yet." };
  }

  function renderPriorityCards(items) {
    return items.map(item => `<article class="maternal-priority ${esc(item.level || "info")}"><span>${esc(item.icon || "🌙")}</span><div><strong>${esc(item.title)}</strong><p>${esc(item.text)}</p></div></article>`).join("");
  }

  function ensureStyles() {
    if (q("#maternalIntelStyles")) return;
    const style = document.createElement("style");
    style.id = "maternalIntelStyles";
    style.textContent = `
      .maternal-intel-card{margin:14px 0;padding:16px;border-radius:22px;background:var(--card,#fff);box-shadow:0 8px 28px rgba(68,44,61,.07);border:1px solid rgba(130,90,112,.08)}
      .maternal-intel-card h3{margin:4px 0 8px}.maternal-intel-card p{line-height:1.48}.maternal-intel-card .eyebrow{margin:0;font-size:.72rem;letter-spacing:.08em;font-weight:800;opacity:.65}
      .maternal-priority{display:flex;gap:12px;padding:12px 0;border-top:1px solid rgba(100,70,90,.09)}.maternal-priority:first-of-type{border-top:0}.maternal-priority>span{font-size:1.35rem}.maternal-priority strong{display:block}.maternal-priority p{margin:4px 0 0;font-size:.88rem;opacity:.82}
      .maternal-priority.urgent{padding:13px;border-radius:16px;background:rgba(190,50,70,.09);border:1px solid rgba(190,50,70,.2)}.maternal-priority.discuss{padding-left:10px;border-left:3px solid rgba(190,120,75,.32)}
      .maternal-question{margin-top:12px;padding:13px;border-radius:16px;background:rgba(180,150,190,.10)}.maternal-question button{margin-top:10px}
      .maternal-intel-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.maternal-intel-actions button{min-height:40px;border:0;border-radius:14px;padding:9px 12px;font-weight:700;background:rgba(170,120,160,.12);color:inherit}
      .maternal-trend{margin-top:10px;padding-top:10px;border-top:1px solid rgba(100,70,90,.09)}
      body.hide-sensitive .maternal-intel-card{filter:blur(8px);user-select:none}
    `;
    document.head.appendChild(style);
  }

  function pregnancyCardHTML() {
    const priorities = pregnancyCareForecast();
    const question = pregnancySmartQuestion();
    const trend = pregnancyTrendSummary();
    const ga = currentGestation();
    return `<p class="eyebrow">SMART MATERNITY ASSIST</p><h3>${ga ? `Week ${Math.max(0, ga.weeks)} + ${ga.days} · what matters next` : "What matters next"}</h3>${renderPriorityCards(priorities)}<div class="maternal-trend"><strong>${esc(trend.title)}</strong><p>${esc(trend.text)}</p></div>${question ? `<div class="maternal-question"><strong>${esc(question.icon)} One useful question</strong><p>${esc(question.question)}</p><button type="button" data-maternal-screen="${esc(question.screen)}">${esc(question.action)}</button></div>` : ""}<details><summary>How this works</summary><p>Tsuki prioritizes urgent warning signs first, then scheduled care, repeated non-urgent patterns and your own routines. It does not diagnose conditions, change pregnancy dating or replace your maternity provider's plan.</p></details>`;
  }

  function postpartumCardHTML() {
    const priorities = postpartumLoadForecast();
    const question = postpartumSmartQuestion();
    const trend = postpartumChangeSummary();
    return `<p class="eyebrow">TSUKI TOGETHER 2.0</p><h3>Recovery + feeding + baby, in one view</h3>${renderPriorityCards(priorities)}<div class="maternal-trend"><strong>${esc(trend.title)}</strong><p>${esc(trend.text)}</p></div>${question ? `<div class="maternal-question"><strong>${esc(question.icon)} One useful question</strong><p>${esc(question.question)}</p><button type="button" ${question.open ? `data-maternal-pp-open="${esc(question.open)}"` : `data-maternal-screen="${esc(question.screen)}"`}>${esc(question.action)}</button></div>` : ""}<details><summary>How this works</summary><p>Tsuki combines your own recovery, feeding, baby, appointment and support observations. Maternal and newborn danger signs always override personalized insights.</p></details>`;
  }

  function renderPregnancy() {
    const screen = q('[data-screen="pregnancy-dashboard"]');
    if (!screen) return;
    let card = q("#maternalPregnancyIntel");
    if (!isPregnancy()) { card?.remove(); return; }
    if (!card) {
      card = document.createElement("article");
      card.id = "maternalPregnancyIntel";
      card.className = "maternal-intel-card pregnancy-sensitive";
      const ref = q("#pregnancyAdaptiveIntelligence", screen) || q("#pregnancyDashboardHero", screen) || screen.firstElementChild;
      ref?.insertAdjacentElement("afterend", card);
    }
    card.innerHTML = pregnancyCardHTML();
    card.querySelectorAll("[data-maternal-screen]").forEach(button => button.addEventListener("click", () => typeof showScreen === "function" && showScreen(button.dataset.maternalScreen)));
  }

  function renderPostpartum() {
    const screen = q('[data-screen="postpartum-feeding"]');
    if (!screen) return;
    let card = q("#maternalPostpartumIntel");
    if (!isPostpartum()) { card?.remove(); return; }
    if (!card) {
      card = document.createElement("article");
      card.id = "maternalPostpartumIntel";
      card.className = "maternal-intel-card period-signal-private";
      const ref = screen.firstElementChild;
      if (ref) ref.insertAdjacentElement("afterend", card); else screen.prepend(card);
    }
    card.innerHTML = postpartumCardHTML();
    card.querySelectorAll("[data-maternal-screen]").forEach(button => button.addEventListener("click", () => typeof showScreen === "function" && showScreen(button.dataset.maternalScreen)));
    card.querySelectorAll("[data-maternal-pp-open]").forEach(button => button.addEventListener("click", () => {
      const map = { recovery: "ppRecoverySheet", feeding: "ppFeedingSheet", baby: "ppBabySheet" };
      q(`#${map[button.dataset.maternalPpOpen]}`)?.classList.remove("hidden");
    }));
  }

  function renderAll() {
    ensureStyles();
    renderPregnancy();
    renderPostpartum();
  }

  function install() {
    if (window.TsukiMaternalIntelligence?.installed) return;
    if (typeof data === "undefined" || typeof showScreen !== "function" || !window.TsukiLifeModeIntelligence?.installed || !window.TsukiPostpartumFeedingIntelligence?.installed) return setTimeout(install, 80);

    if (typeof renderEverything === "function" && !renderEverything.__maternalWrapped) {
      const base = renderEverything;
      const wrapped = function(...args) { const result = base.apply(this, args); try { renderAll(); } catch (error) { console.warn("Tsuki maternal intelligence render skipped", error); } return result; };
      wrapped.__maternalWrapped = true;
      try { renderEverything = wrapped; } catch (_) {}
      window.renderEverything = wrapped;
    }

    if (typeof showScreen === "function" && !showScreen.__maternalWrapped) {
      const baseShow = showScreen;
      const wrappedShow = function(name, ...args) { const result = baseShow(name, ...args); requestAnimationFrame(() => { if (name === "pregnancy-dashboard" || name === "postpartum-feeding") renderAll(); }); return result; };
      wrappedShow.__maternalWrapped = true;
      try { showScreen = wrappedShow; } catch (_) {}
      window.showScreen = wrappedShow;
    }

    window.TsukiMaternalIntelligence = {
      installed: true,
      version: MODULE_VERSION,
      render: renderAll,
      test: {
        pregnancyCareForecast,
        pregnancySmartQuestion,
        pregnancyTrendSummary,
        postpartumLoadForecast,
        postpartumSmartQuestion,
        postpartumChangeSummary,
        repeatedPregnancyConcern
      }
    };
    renderAll();
  }

  window.TsukiMaternalIntelligence = { installed: false, version: MODULE_VERSION, install, test: null };
  install();
})();
