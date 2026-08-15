/* ============================================================
   TSUKI v1 — CARE + WOMEN'S HEALTH INTELLIGENCE
   Local-first care hub for Cycle and Pregnancy modes.
   Educational and organizational only; never diagnoses, prescribes,
   changes pregnancy dating, or suppresses urgent maternal warnings.
   ============================================================ */

(() => {
  "use strict";

  const PUBLIC_VERSION = "v1.0";
  const PREG_ACTIVITY_GUIDE_MINUTES = 150;
  const ACTIVITY_TYPES = ["Walking", "Strength / gym", "Yoga / Pilates", "Swimming", "Cycling", "Running", "Sports", "Stretching", "Household activity", "Rest / recovery", "Other"];
  const ROUTINE_TYPES = ["Medicine", "Prenatal vitamin", "Vitamin / supplement", "Hydration", "Other routine"];
  const SAFETY_SOURCE = "CDC urgent maternal warning signs + ACOG pregnancy exercise guidance";
  const state = { installed: false, base: {} };

  const esc = value => typeof escapeHTML === "function" ? escapeHTML(value) : String(value ?? "").replace(/[&<>\"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;","'":"&#039;"}[ch]));
  const keyToday = () => typeof todayKey === "function" ? todayKey() : new Date().toISOString().slice(0, 10);
  const uidCare = () => typeof uid === "function" ? uid() : `care-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const safeDate = value => {
    if (!value) return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : new Date(value);
    if (typeof value !== "string") return null;
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return null;
    const out = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return Number.isNaN(out.getTime()) ? null : out;
  };
  const dayDiff = (a, b) => {
    const x = safeDate(a); const y = safeDate(b);
    if (!x || !y) return null;
    return Math.round((new Date(y.getFullYear(), y.getMonth(), y.getDate()) - new Date(x.getFullYear(), x.getMonth(), x.getDate())) / 86400000);
  };

  function ensureData() {
    data.womensCare = data.womensCare && typeof data.womensCare === "object" ? data.womensCare : {};
    const c = data.womensCare;
    c.settings = { cycleActivityGoal: 150, pregnancyActivityGoal: PREG_ACTIVITY_GUIDE_MINUTES, pregnancyExerciseStatus: "ask", smartSuggestions: true, babyCare: true, ...(c.settings || {}) };
    c.activities = Array.isArray(c.activities) ? c.activities : [];
    c.routines = Array.isArray(c.routines) ? c.routines : [];
    c.routineChecks = Array.isArray(c.routineChecks) ? c.routineChecks : [];
    c.appointments = Array.isArray(c.appointments) ? c.appointments : [];
    c.notesForDoctor = Array.isArray(c.notesForDoctor) ? c.notesForDoctor : [];
    return c;
  }

  function persist() {
    ensureData();
    if (typeof saveData === "function") saveData();
  }

  function isPregnancy() { return data?.mode === "pregnancy" && Boolean(data?.pregnancy?.active); }
  function gestation() {
    if (!isPregnancy() || typeof gestationalAgeForDate !== "function") return null;
    try { return gestationalAgeForDate(keyToday()); } catch (_) { return null; }
  }

  function startOfWeek(date = new Date()) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = d.getDay();
    const diff = data?.settings?.weekStart === "monday" ? (day === 0 ? -6 : 1 - day) : -day;
    d.setDate(d.getDate() + diff);
    return d;
  }

  function weeklyActivity(scope = isPregnancy() ? "pregnancy" : "cycle") {
    const c = ensureData();
    const start = startOfWeek();
    const end = new Date(start); end.setDate(end.getDate() + 6);
    const entries = c.activities.filter(item => item.scope === scope && safeDate(item.date) >= start && safeDate(item.date) <= end);
    return {
      entries,
      minutes: entries.reduce((sum, item) => sum + Math.max(0, Number(item.minutes) || 0), 0)
    };
  }

  function routineDueToday(item) {
    if (!item?.active) return false;
    const today = new Date();
    const days = Array.isArray(item.days) && item.days.length ? item.days : [0,1,2,3,4,5,6];
    return days.includes(today.getDay());
  }

  function routineCheckedToday(id) {
    return ensureData().routineChecks.some(item => item.routineId === id && item.date === keyToday() && item.status === "done");
  }

  function dueRoutines() {
    return ensureData().routines.filter(routineDueToday).map(item => ({ ...item, done: routineCheckedToday(item.id) }));
  }

  function upcomingCareItems() {
    const today = safeDate(keyToday());
    const generic = ensureData().appointments.map(item => ({ ...item, source: "Care Hub" }));
    const preg = isPregnancy() ? (data?.pregnancy?.appointments || []).map(item => ({ ...item, source: "Pregnancy care" })) : [];
    return [...generic, ...preg]
      .filter(item => safeDate(item.date) && safeDate(item.date) >= today)
      .sort((a, b) => safeDate(a.date) - safeDate(b.date))
      .slice(0, 5);
  }

  function todayPregnancyLog() {
    return isPregnancy() ? (data?.pregnancy?.logs?.[keyToday()] || null) : null;
  }

  function recentPregnancyLogs(days = 4) {
    if (!isPregnancy()) return [];
    const today = safeDate(keyToday());
    return Object.entries(data?.pregnancy?.logs || {})
      .map(([date, log]) => ({ date, parsed: safeDate(date), log: log || {} }))
      .filter(item => item.parsed && dayDiff(item.parsed, today) >= 0 && dayDiff(item.parsed, today) < days)
      .sort((a, b) => a.parsed - b.parsed);
  }

  function pregnancySafety() {
    if (!isPregnancy()) return { level: "none", urgent: [], discuss: [], reasons: [] };
    const log = todayPregnancyLog() || {};
    const urgent = Array.isArray(log.warnings) ? [...log.warnings] : [];
    if (log.movement === "Less than usual") urgent.push("Baby movement is less than usual");

    const discuss = [];
    const recent = recentPregnancyLogs(4);
    const severeNauseaDays = recent.filter(item => item.log.nausea === "Severe").length;
    const moderatePainDays = recent.filter(item => ["Moderate", "Severe"].includes(item.log.pain)).length;
    const lowHydrationDays = recent.filter(item => item.log.hydration === "Low").length;
    const poorSleepDays = recent.filter(item => item.log.sleep === "Poor").length;
    const lowMoodDays = recent.filter(item => Array.isArray(item.log.moods) && item.log.moods.some(m => ["Low", "Anxious"].includes(m))).length;

    if (!urgent.length) {
      if (severeNauseaDays) discuss.push("Severe nausea was recorded recently. If it is persistent, worsening, or you cannot keep fluids down, contact your maternity care team promptly.");
      if (moderatePainDays >= 2) discuss.push("Moderate or severe discomfort has been recorded on multiple recent check-ins. Consider discussing the pattern with your maternity care team.");
      if (lowHydrationDays >= 2) discuss.push("Low hydration has been recorded repeatedly. Consider discussing hydration or vomiting concerns with your care team if this is difficult to improve.");
      if (poorSleepDays >= 3) discuss.push("Poor sleep has been frequent recently. This may be worth adding to your next appointment questions if it is affecting you.");
      if (lowMoodDays >= 3) discuss.push("Low or anxious mood has appeared repeatedly. Consider mentioning this to your care team, especially if it is worsening or hard to cope with.");
    }

    return {
      level: urgent.length ? "urgent" : discuss.length ? "discuss" : "none",
      urgent: Array.from(new Set(urgent)),
      discuss,
      reasons: urgent.length ? ["Urgent maternal warning signs are never normalized by Tsuki's personal-learning systems."] : []
    };
  }

  function pregnancyCareSuggestions() {
    if (!isPregnancy()) return [];
    const c = ensureData();
    const ga = gestation();
    const suggestions = [];
    const due = dueRoutines().filter(item => ["pregnancy", "both"].includes(item.scope));
    const week = weeklyActivity("pregnancy");
    const exerciseStatus = c.settings.pregnancyExerciseStatus || "ask";
    const next = upcomingCareItems()[0] || null;

    if (due.some(item => !item.done)) suggestions.push({ icon: "💊", title: "Routine due today", text: `${due.filter(item => !item.done).length} medication/vitamin routine${due.filter(item => !item.done).length === 1 ? " is" : "s are"} still unchecked. Follow the plan your clinician or pharmacist gave you.` });
    if (!next) suggestions.push({ icon: "🩺", title: "Keep prenatal care on your radar", text: "No upcoming appointment is saved in Tsuki. Follow your own maternity provider's schedule; Tsuki can store it here once you have it." });
    else suggestions.push({ icon: "🗓️", title: "Coming up", text: `${next.type || next.name || "Care appointment"} is saved for ${next.date}.` });

    if (exerciseStatus === "cleared") {
      const goal = Math.max(0, Number(c.settings.pregnancyActivityGoal) || PREG_ACTIVITY_GUIDE_MINUTES);
      suggestions.push({ icon: "🚶", title: "Movement this week", text: `${week.minutes}/${goal} minutes logged. For uncomplicated pregnancy, ACOG recommends at least 150 minutes/week of moderate aerobic activity; your own clinician's advice comes first.` });
    } else if (exerciseStatus === "restricted") {
      suggestions.push({ icon: "🫶", title: "Follow your activity restrictions", text: "Tsuki is not showing a pregnancy exercise target because you marked clinician-advised restrictions. Record activity only if it is useful to you." });
    } else {
      suggestions.push({ icon: "🚶", title: "Before using an exercise target", text: "Ask your maternity provider what activity is appropriate for your pregnancy. Tsuki will only show a weekly target after you mark exercise as cleared." });
    }

    if (c.settings.babyCare !== false && ga) {
      if (ga.weeks < 14) suggestions.push({ icon: "🌱", title: "Baby care starts with your care", text: "Keep prenatal appointments and review medicines, vitamins and supplements with your maternity provider. ACOG recommends folic acid in pregnancy, but your clinician should guide your actual prenatal-vitamin plan." });
      else if (ga.weeks < 28) suggestions.push({ icon: "🌸", title: "Growing together", text: "Keep your prenatal visits, tests and provider-recommended routines organized. If you begin noticing a usual baby-movement pattern, Tsuki can help you record changes without imposing a universal kick-count target." });
      else suggestions.push({ icon: "👶", title: "Later-pregnancy baby care", text: "Keep following your prenatal schedule and your baby's usual movement pattern. A noticeable slowing or stopping of movement is an urgent warning sign—contact your maternity care provider rather than waiting on the app." });
    }
    return suggestions;
  }

  function cycleCareSuggestions() {
    if (isPregnancy()) return [];
    const c = ensureData();
    const week = weeklyActivity("cycle");
    const suggestions = [];
    const todayLog = data?.logs?.[keyToday()] || {};
    const pain = Number(todayLog.pain || 0);
    const energy = String(todayLog.energy || "");
    const due = dueRoutines().filter(item => ["cycle", "both"].includes(item.scope));
    if (due.some(item => !item.done)) suggestions.push({ icon: "💊", title: "Routine due today", text: `${due.filter(item => !item.done).length} medicine/vitamin routine${due.filter(item => !item.done).length === 1 ? " is" : "s are"} still unchecked.` });
    if (pain >= 3) suggestions.push({ icon: "🌿", title: "A gentler day may fit", text: "You logged stronger pain today. Rest or lighter movement may fit better if that feels good; persistent or severe pain is worth discussing with a healthcare professional." });
    else if (/low/i.test(energy)) suggestions.push({ icon: "☁️", title: "Low-energy day", text: "Your check-in says energy is low. Tsuki won't push a workout goal today—rest, stretching or your usual lighter activity are all valid choices." });
    else suggestions.push({ icon: "✨", title: "Activity is personal", text: `${week.minutes} minutes of activity are logged this week. Tsuki learns from what helps you rather than prescribing workouts by menstrual phase.` });
    return suggestions;
  }

  function activityLearning(scope = isPregnancy() ? "pregnancy" : "cycle") {
    const entries = ensureData().activities.filter(item => item.scope === scope && item.energyBefore && item.energyAfter).slice(-30);
    if (entries.length < 4) return null;
    const score = { Low: 0, Medium: 1, High: 2 };
    const comparable = entries.filter(item => score[item.energyBefore] !== undefined && score[item.energyAfter] !== undefined);
    if (comparable.length < 4) return null;
    const sameOrBetter = comparable.filter(item => score[item.energyAfter] >= score[item.energyBefore]).length;
    return { count: comparable.length, sameOrBetter, rate: sameOrBetter / comparable.length };
  }

  function exerciseSafetyText() {
    return "During pregnancy, stop exercise and contact your maternity provider for warning signs such as vaginal bleeding, dizziness/fainting, chest pain, painful regular contractions, fluid leakage, or calf pain/swelling. Your clinician's advice takes priority.";
  }

  function createScreen() {
    if (document.querySelector('[data-screen="care-hub"]')) return;
    const parent = document.querySelector('[data-screen="today"]')?.parentNode || document.querySelector("main");
    if (!parent) return;
    const section = document.createElement("section");
    section.className = "screen";
    section.dataset.screen = "care-hub";
    section.innerHTML = `
      <button type="button" class="back-button" id="careHubBack">← Back</button>
      <div class="page-title"><div><p class="eyebrow">CARE HUB</p><h2 id="careHubTitle">Your care, together</h2></div><span>🤍</span></div>
      <article id="careHubSafety" class="care-health-card care-health-safety hidden"></article>
      <article class="care-health-card"><div class="section-heading compact-heading"><div><p class="eyebrow">TODAY</p><h3>What needs attention</h3></div><span>✨</span></div><div id="careHubToday"></div></article>
      <article class="care-health-card"><div class="section-heading compact-heading"><div><p class="eyebrow">SMART SUGGESTIONS</p><h3 id="careSuggestionTitle">Helpful next steps</h3></div><span>🌙</span></div><div id="careSuggestionList"></div></article>
      <article class="care-health-card"><div class="section-heading compact-heading"><div><p class="eyebrow">ACTIVITY</p><h3>Movement & recovery</h3></div><span>🚶</span></div><div id="careActivitySummary"></div>
        <details><summary>+ Log activity</summary><div class="care-form-grid"><label>Date<input id="careActivityDate" class="input" type="date"></label><label>Activity<select id="careActivityType" class="input">${ACTIVITY_TYPES.map(v => `<option>${v}</option>`).join("")}</select></label><label>Minutes<input id="careActivityMinutes" class="input" type="number" min="0" max="600" inputmode="numeric" value="20"></label><label>Intensity<select id="careActivityIntensity" class="input"><option>Light</option><option>Moderate</option><option>Vigorous</option><option>Recovery / rest</option></select></label><label>Energy before<select id="careActivityBefore" class="input"><option value="">Not logged</option><option>Low</option><option>Medium</option><option>High</option></select></label><label>Energy after<select id="careActivityAfter" class="input"><option value="">Not logged</option><option>Low</option><option>Medium</option><option>High</option></select></label></div><label class="field-label">Anything concerning during pregnancy exercise?</label><select id="careActivityConcern" class="input"><option value="">No / not applicable</option><option>Vaginal bleeding</option><option>Dizziness or fainting</option><option>Shortness of breath before exercise</option><option>Chest pain</option><option>Headache</option><option>Calf pain or swelling</option><option>Painful regular contractions</option><option>Fluid leaking</option></select><button type="button" id="saveCareActivity" class="primary-button small">Save activity</button><p id="careExerciseSafety" class="muted small-text"></p></details><div id="careActivityList" class="compact-list"></div></article>
      <article class="care-health-card"><div class="section-heading compact-heading"><div><p class="eyebrow">MEDICINES & VITAMINS</p><h3>My routine schedule</h3></div><span>💊</span></div><p class="muted small-text">Track the plan given by your clinician or pharmacist. Tsuki does not decide whether a medicine or supplement is safe for pregnancy and never tells you to start or stop one.</p><div id="careRoutineList"></div><details><summary>+ Add routine</summary><div class="care-form-grid"><label>Name<input id="careRoutineName" class="input" placeholder="e.g. prenatal vitamin"></label><label>Type<select id="careRoutineType" class="input">${ROUTINE_TYPES.map(v => `<option>${v}</option>`).join("")}</select></label><label>Time<input id="careRoutineTime" class="input" type="time"></label><label>Use in<select id="careRoutineScope" class="input"><option value="both">Both modes</option><option value="cycle">Cycle Mode</option><option value="pregnancy">Pregnancy Mode</option></select></label></div><input id="careRoutineNotes" class="input" placeholder="Dose/instructions exactly as prescribed (optional)"><button type="button" id="saveCareRoutine" class="primary-button small">Add routine</button></details></article>
      <article class="care-health-card"><div class="section-heading compact-heading"><div><p class="eyebrow">SCHEDULE</p><h3>Appointments & reminders</h3></div><span>🗓️</span></div><div id="careScheduleList"></div><details><summary>+ Add general appointment/reminder</summary><div class="care-form-grid"><label>Date<input id="careAppointmentDate" class="input" type="date"></label><label>Type<input id="careAppointmentName" class="input" placeholder="Check-up / screening"></label></div><input id="careAppointmentNotes" class="input" placeholder="Notes"><button type="button" id="saveCareAppointment" class="primary-button small">Add</button></details></article>
      <article id="pregnancyBabyCareCard" class="care-health-card hidden"><div class="section-heading compact-heading"><div><p class="eyebrow">BABY CARE DURING PREGNANCY</p><h3>Care for baby by caring for you</h3></div><span>👶</span></div><div id="pregnancyBabyCareBody"></div></article>
      <article class="care-health-card"><div class="section-heading compact-heading"><div><p class="eyebrow">FOR MY DOCTOR</p><h3>Things I want to discuss</h3></div><span>🩺</span></div><div class="inline-add-row"><input id="careDoctorNoteInput" class="input" placeholder="Question, symptom or concern"><button type="button" id="addCareDoctorNote" class="secondary-button small">Add</button></div><div id="careDoctorNotes"></div></article>
      <article class="soft-note">Tsuki organizes your own records and source-backed safety prompts. It does not diagnose disease, prescribe treatment, replace prenatal care, or guarantee that an unlisted symptom is harmless.</article>
    `;
    parent.appendChild(section);
  }

  function ensureStyle() {
    if (document.getElementById("careHealthIntelStyle")) return;
    const style = document.createElement("style");
    style.id = "careHealthIntelStyle";
    style.textContent = `
      .care-health-card{border:1px solid rgba(145,112,139,.14);border-radius:22px;padding:16px;margin:14px 0;background:rgba(255,255,255,.76);box-shadow:0 10px 28px rgba(116,82,111,.06)}
      .care-health-card h3{margin:2px 0 7px}.care-health-card p{margin:6px 0}.care-health-safety{background:rgba(255,239,239,.94);border-color:rgba(156,67,75,.25)}.care-health-safety h3,.care-health-safety strong{color:#8b3d46}
      .care-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:10px 0}.care-form-grid label{font-size:.82rem;font-weight:700}.care-form-grid .input{margin-top:5px}
      .care-smart-item,.care-routine-row,.care-activity-row,.care-schedule-row,.care-doctor-row{padding:11px 12px;border-radius:16px;background:rgba(255,255,255,.68);margin:8px 0;display:flex;gap:10px;align-items:flex-start}.care-smart-item>span{font-size:1.15rem}.care-smart-item div,.care-routine-row div,.care-activity-row div,.care-schedule-row div,.care-doctor-row div{flex:1}.care-smart-item small,.care-routine-row small,.care-activity-row small,.care-schedule-row small{display:block;margin-top:3px}.care-progress{height:8px;border-radius:99px;background:rgba(130,110,130,.12);overflow:hidden;margin:8px 0}.care-progress>i{display:block;height:100%;background:currentColor;border-radius:99px;opacity:.45;max-width:100%}.care-pill{display:inline-flex;padding:5px 8px;border-radius:999px;background:rgba(244,224,238,.7);font-size:.76rem;margin:3px 4px 3px 0}.care-check{border:0;border-radius:999px;padding:6px 9px;font:inherit;font-size:.78rem;font-weight:700;cursor:pointer}.care-danger{color:#8b3d46;font-weight:700}.care-entry-card{margin-top:14px}.care-hub-entry{width:100%;border:0;text-align:left;cursor:pointer}.care-baby-list{padding-left:18px;margin:8px 0}.care-baby-list li{margin:7px 0}.care-status-good{color:#47775f}.care-status-warn{color:#8b6541}
      @media(max-width:390px){.care-form-grid{grid-template-columns:1fr}.care-health-card{padding:14px}.care-routine-row,.care-activity-row,.care-schedule-row{flex-wrap:wrap}}
    `;
    document.head.appendChild(style);
  }

  function entryCards() {
    const todayScreen = document.querySelector(isPregnancy() ? '[data-screen="pregnancy-today"]' : '[data-screen="today"]');
    if (!todayScreen) return;
    let card = document.getElementById("careHubTodayEntry");
    if (!card) {
      card = document.createElement("button");
      card.type = "button";
      card.id = "careHubTodayEntry";
      card.className = "care-health-card care-hub-entry pregnancy-sensitive";
      card.addEventListener("click", () => showScreen("care-hub"));
    }
    const safety = pregnancySafety();
    const due = dueRoutines().filter(item => isPregnancy() ? ["pregnancy","both"].includes(item.scope) : ["cycle","both"].includes(item.scope));
    card.innerHTML = `<div class="section-heading compact-heading"><div><p class="eyebrow">CARE HUB</p><h3>${safety.level === "urgent" ? "⚠️ Something needs attention" : due.some(x => !x.done) ? "You have care items today" : "Your health routines, together"}</h3></div><span>›</span></div><p>${safety.level === "urgent" ? "Open for urgent pregnancy safety guidance." : `${due.filter(x => !x.done).length} routine${due.filter(x => !x.done).length === 1 ? "" : "s"} due · activity, medicines, vitamins, appointments & smart suggestions.`}</p>`;
    const anchor = isPregnancy() ? todayScreen.querySelector(".pregnancy-dashboard-strip") : todayScreen.querySelector(".today-checkin-cta");
    if (anchor?.parentNode && card.parentNode !== anchor.parentNode) anchor.parentNode.insertBefore(card, anchor.nextSibling);
    else if (!card.parentNode) todayScreen.appendChild(card);
  }

  function babyCareHTML() {
    const ga = gestation();
    if (!ga) return "<p>Pregnancy dating is needed before week-based care guidance can appear.</p>";
    const items = [];
    items.push("Keep the prenatal visit and test schedule given by your maternity provider. WHO recommends regular antenatal contacts, but your personal care plan may require more or different visits.");
    items.push("Keep a current list of every medicine, vitamin and supplement and review pregnancy safety with your clinician or pharmacist before starting or stopping anything.");
    if (ga.weeks < 14) items.push("Early pregnancy is a good time to confirm your prenatal-vitamin plan and dating with your care team. ACOG highlights folic acid as important in pregnancy.");
    if (ga.weeks >= 18) items.push("If you are noticing baby movement, record what is usual for this pregnancy. A slowing or stopping of movement is more important than hitting one universal number.");
    if (ga.weeks >= 28) items.push("Keep birth-readiness details, emergency contacts and the hospital plan easy to reach. Continue following your clinician's monitoring schedule.");
    return `<p><strong>${ga.weeks} weeks + ${ga.days} days</strong> · educational care support</p><ul class="care-baby-list">${items.map(x => `<li>${esc(x)}</li>`).join("")}</ul><p class="muted small-text">Tsuki does not change your clinician-confirmed EDD after later scans. Ultrasound/test records remain factual history.</p>`;
  }

  function renderSafety() {
    const box = document.getElementById("careHubSafety");
    if (!box) return;
    const safety = pregnancySafety();
    if (safety.level === "none") { box.classList.add("hidden"); return; }
    box.classList.remove("hidden");
    if (safety.level === "urgent") {
      box.innerHTML = `<p class="eyebrow">PREGNANCY SAFETY</p><h3>⚠️ Please seek medical care now</h3><p>Tsuki found an urgent warning sign you explicitly logged. Contact your maternity care provider or seek emergency medical care rather than waiting for the app.</p><div>${safety.urgent.map(x => `<span class="care-pill">${esc(x)}</span>`).join("")}</div><p class="muted small-text">${SAFETY_SOURCE}. Tell the healthcare team that you are pregnant.</p>`;
    } else {
      box.innerHTML = `<p class="eyebrow">CHECK WITH YOUR CARE TEAM</p><h3>A recent pattern may be worth discussing</h3>${safety.discuss.map(x => `<p>• ${esc(x)}</p>`).join("")}<p class="muted small-text">This is not an emergency diagnosis. If symptoms become severe, sudden, or feel seriously wrong, seek medical care promptly.</p>`;
    }
  }

  function renderTodayCare() {
    const root = document.getElementById("careHubToday"); if (!root) return;
    const due = dueRoutines().filter(item => isPregnancy() ? ["pregnancy","both"].includes(item.scope) : ["cycle","both"].includes(item.scope));
    const upcoming = upcomingCareItems();
    const unfinished = due.filter(item => !item.done);
    root.innerHTML = `${unfinished.length ? `<div class="care-smart-item"><span>💊</span><div><strong>${unfinished.length} routine${unfinished.length === 1 ? "" : "s"} due</strong><small>${unfinished.map(x => esc(x.name)).join(" · ")}</small></div></div>` : `<div class="care-smart-item"><span>✅</span><div><strong>No unchecked scheduled routines right now</strong><small>Only routines you created are tracked.</small></div></div>`}${upcoming[0] ? `<div class="care-smart-item"><span>🗓️</span><div><strong>${esc(upcoming[0].type || upcoming[0].name || "Appointment")}</strong><small>${esc(upcoming[0].date)} · ${esc(upcoming[0].source)}</small></div></div>` : ""}`;
  }

  function renderSuggestions() {
    const root = document.getElementById("careSuggestionList"); if (!root) return;
    const list = isPregnancy() ? pregnancyCareSuggestions() : cycleCareSuggestions();
    root.innerHTML = list.length ? list.map(item => `<div class="care-smart-item"><span>${item.icon}</span><div><strong>${esc(item.title)}</strong><small>${esc(item.text)}</small></div></div>`).join("") : `<p class="muted">Nothing special is due from your saved care information today.</p>`;
  }

  function renderActivity() {
    const scope = isPregnancy() ? "pregnancy" : "cycle";
    const week = weeklyActivity(scope);
    const c = ensureData();
    const root = document.getElementById("careActivitySummary");
    const goal = Math.max(0, Number(isPregnancy() ? c.settings.pregnancyActivityGoal : c.settings.cycleActivityGoal) || 150);
    const status = c.settings.pregnancyExerciseStatus || "ask";
    if (root) {
      const showGoal = !isPregnancy() || status === "cleared";
      root.innerHTML = `<strong>${week.minutes} minute${week.minutes === 1 ? "" : "s"} logged this week</strong>${showGoal ? `<div class="care-progress"><i style="width:${Math.min(100, goal ? week.minutes / goal * 100 : 0)}%"></i></div><small>${week.minutes}/${goal} minutes · a personal tracking goal${isPregnancy() ? "; ACOG's general guideline is 150 minutes/week for uncomplicated pregnancy when medically appropriate" : ""}</small>` : `<p class="muted small-text">Pregnancy activity target is hidden until you mark exercise as cleared by your maternity provider.</p>`}`;
      const learned = activityLearning(scope);
      if (learned) root.innerHTML += `<p class="muted small-text">Tsuki noticed: energy was the same or higher after ${learned.sameOrBetter} of your last ${learned.count} activities with before/after energy logged. This is your observation, not proof that exercise caused the change.</p>`;
    }
    const date = document.getElementById("careActivityDate"); if (date && !date.value) date.value = keyToday();
    const safety = document.getElementById("careExerciseSafety"); if (safety) safety.textContent = isPregnancy() ? exerciseSafetyText() : "Track what feels useful. Tsuki does not prescribe workouts by menstrual phase.";
    const list = document.getElementById("careActivityList"); if (list) list.innerHTML = c.activities.filter(x => x.scope === scope).slice(-8).reverse().map(item => `<div class="care-activity-row"><div><strong>${esc(item.type)} · ${Number(item.minutes)||0} min</strong><small>${esc(item.date)} · ${esc(item.intensity || "")}${item.energyBefore && item.energyAfter ? ` · energy ${esc(item.energyBefore)} → ${esc(item.energyAfter)}` : ""}</small>${item.concern ? `<small class="care-danger">⚠️ ${esc(item.concern)} recorded</small>` : ""}</div><button type="button" class="text-button" data-delete-care-activity="${esc(item.id)}">×</button></div>`).join("") || `<p class="muted small-text">No activities logged here yet.</p>`;
  }

  function renderRoutines() {
    const root = document.getElementById("careRoutineList"); if (!root) return;
    const scope = isPregnancy() ? "pregnancy" : "cycle";
    const routines = ensureData().routines.filter(item => [scope, "both"].includes(item.scope));
    root.innerHTML = routines.map(item => {
      const due = routineDueToday(item); const done = routineCheckedToday(item.id);
      return `<div class="care-routine-row"><div><strong>${esc(item.name)}</strong><small>${esc(item.type)}${item.time ? ` · ${esc(item.time)}` : ""}${item.notes ? ` · ${esc(item.notes)}` : ""}</small></div>${due ? `<button type="button" class="care-check" data-check-routine="${esc(item.id)}">${done ? "✓ Done" : "Mark done"}</button>` : ""}<button type="button" class="text-button" data-delete-care-routine="${esc(item.id)}">×</button></div>`;
    }).join("") || `<p class="muted small-text">No medicine/vitamin routines added. Add only the routine you actually use.</p>`;
  }

  function renderSchedule() {
    const root = document.getElementById("careScheduleList"); if (!root) return;
    const items = upcomingCareItems();
    root.innerHTML = items.map(item => `<div class="care-schedule-row"><div><strong>${esc(item.type || item.name || "Care item")}</strong><small>${esc(item.date)} · ${esc(item.source)}${item.notes ? ` · ${esc(item.notes)}` : ""}</small></div>${item.source === "Care Hub" ? `<button type="button" class="text-button" data-delete-care-appointment="${esc(item.id)}">×</button>` : ""}</div>`).join("") || `<p class="muted small-text">No upcoming items saved.</p>`;
    const date = document.getElementById("careAppointmentDate"); if (date && !date.value) date.value = keyToday();
  }

  function renderDoctorNotes() {
    const root = document.getElementById("careDoctorNotes"); if (!root) return;
    root.innerHTML = ensureData().notesForDoctor.slice().reverse().map(item => `<div class="care-doctor-row"><div><strong>${esc(item.text)}</strong><small>${esc(item.date)}</small></div><button type="button" class="text-button" data-delete-doctor-note="${esc(item.id)}">×</button></div>`).join("") || `<p class="muted small-text">Nothing saved for your next appointment yet.</p>`;
  }

  function renderBabyCare() {
    const card = document.getElementById("pregnancyBabyCareCard");
    if (!card) return;
    card.classList.toggle("hidden", !isPregnancy());
    const body = document.getElementById("pregnancyBabyCareBody"); if (body && isPregnancy()) body.innerHTML = babyCareHTML();
  }

  function renderCareHub() {
    ensureData();
    createScreen();
    const title = document.getElementById("careHubTitle"); if (title) title.textContent = isPregnancy() ? "Pregnancy care, together" : "Your care, together";
    const back = document.getElementById("careHubBack"); if (back) back.onclick = () => showScreen(isPregnancy() ? "pregnancy-today" : "today");
    const concern = document.getElementById("careActivityConcern"); if (concern) concern.closest("label")?.classList.toggle("hidden", !isPregnancy());
    renderSafety(); renderTodayCare(); renderSuggestions(); renderActivity(); renderRoutines(); renderSchedule(); renderDoctorNotes(); renderBabyCare();
  }

  function addPregnancyCareEnhancements() {
    const screen = document.querySelector('[data-screen="pregnancy-care"]');
    if (!screen) return;
    let card = document.getElementById("pregnancySmartCareBridge");
    if (!card) {
      card = document.createElement("article"); card.id = "pregnancySmartCareBridge"; card.className = "care-health-card";
      const title = screen.querySelector(".page-title"); title?.parentNode?.insertBefore(card, title.nextSibling);
    }
    const safety = pregnancySafety(); const week = weeklyActivity("pregnancy"); const due = dueRoutines().filter(x => ["pregnancy","both"].includes(x.scope) && !x.done);
    card.innerHTML = `<div class="section-heading compact-heading"><div><p class="eyebrow">SMART CARE</p><h3>${safety.level === "urgent" ? "⚠️ Safety needs attention" : "Your care at a glance"}</h3></div><button type="button" class="text-button" data-open-care-hub>Care Hub</button></div><p>${due.length} routine${due.length === 1 ? "" : "s"} due · ${week.minutes} activity minutes this week.</p>${safety.level === "discuss" ? `<p class="care-status-warn">Tsuki noticed a recent pattern that may be worth discussing with your care team.</p>` : ""}`;
    card.querySelector("[data-open-care-hub]")?.addEventListener("click", () => showScreen("care-hub"));
  }

  function handleClick(event) {
    const target = event.target.closest("button"); if (!target) return;
    const c = ensureData();
    if (target.id === "saveCareActivity") {
      const date = document.getElementById("careActivityDate")?.value || keyToday();
      const concern = isPregnancy() ? (document.getElementById("careActivityConcern")?.value || "") : "";
      c.activities.push({ id: uidCare(), date, scope: isPregnancy() ? "pregnancy" : "cycle", type: document.getElementById("careActivityType")?.value || "Other", minutes: Math.max(0, Number(document.getElementById("careActivityMinutes")?.value) || 0), intensity: document.getElementById("careActivityIntensity")?.value || "", energyBefore: document.getElementById("careActivityBefore")?.value || "", energyAfter: document.getElementById("careActivityAfter")?.value || "", concern });
      persist(); renderCareHub();
      if (concern && typeof showToast === "function") showToast("Activity saved. Because you logged a pregnancy exercise warning sign, stop exercise and contact your maternity provider.");
      else if (typeof showToast === "function") showToast("Activity saved 🌙");
    }
    if (target.id === "saveCareRoutine") {
      const name = document.getElementById("careRoutineName")?.value.trim(); if (!name) return;
      c.routines.push({ id: uidCare(), name, type: document.getElementById("careRoutineType")?.value || "Other routine", time: document.getElementById("careRoutineTime")?.value || "", scope: document.getElementById("careRoutineScope")?.value || "both", notes: document.getElementById("careRoutineNotes")?.value.trim() || "", days: [0,1,2,3,4,5,6], active: true });
      persist(); renderCareHub(); if (typeof showToast === "function") showToast("Care routine added 💊");
    }
    if (target.dataset.checkRoutine) {
      const id = target.dataset.checkRoutine; const existing = c.routineChecks.find(x => x.routineId === id && x.date === keyToday());
      if (existing) existing.status = existing.status === "done" ? "" : "done"; else c.routineChecks.push({ routineId: id, date: keyToday(), status: "done" });
      persist(); renderCareHub();
    }
    if (target.id === "saveCareAppointment") {
      const date = document.getElementById("careAppointmentDate")?.value; const name = document.getElementById("careAppointmentName")?.value.trim(); if (!date || !name) return;
      c.appointments.push({ id: uidCare(), date, name, type: name, notes: document.getElementById("careAppointmentNotes")?.value.trim() || "" }); persist(); renderCareHub();
    }
    if (target.id === "addCareDoctorNote") {
      const input = document.getElementById("careDoctorNoteInput"); const text = input?.value.trim(); if (!text) return;
      c.notesForDoctor.push({ id: uidCare(), date: keyToday(), text }); input.value = ""; persist(); renderDoctorNotes();
    }
    if (target.dataset.deleteCareActivity) { c.activities = c.activities.filter(x => x.id !== target.dataset.deleteCareActivity); persist(); renderCareHub(); }
    if (target.dataset.deleteCareRoutine) { c.routines = c.routines.filter(x => x.id !== target.dataset.deleteCareRoutine); c.routineChecks = c.routineChecks.filter(x => x.routineId !== target.dataset.deleteCareRoutine); persist(); renderCareHub(); }
    if (target.dataset.deleteCareAppointment) { c.appointments = c.appointments.filter(x => x.id !== target.dataset.deleteCareAppointment); persist(); renderCareHub(); }
    if (target.dataset.deleteDoctorNote) { c.notesForDoctor = c.notesForDoctor.filter(x => x.id !== target.dataset.deleteDoctorNote); persist(); renderDoctorNotes(); }
  }

  function installSettingsControls() {
    const me = document.querySelector('[data-screen="me"]'); if (!me || document.getElementById("careHealthSettings")) return;
    const card = document.createElement("article"); card.id = "careHealthSettings"; card.className = "card";
    card.innerHTML = `<div class="section-heading compact-heading"><div><p class="eyebrow">CARE & ACTIVITY</p><h3>Health support settings</h3></div><button type="button" id="openCareHubSettings" class="text-button">Open Care Hub</button></div><label class="field-label">Pregnancy exercise status</label><select id="carePregExerciseStatus" class="input"><option value="ask">Not discussed / not sure</option><option value="cleared">My maternity provider says normal activity is okay</option><option value="restricted">My maternity provider gave activity restrictions</option></select><label class="field-label">Pregnancy weekly activity tracking goal</label><input id="carePregActivityGoal" class="input" type="number" min="0" max="1000" inputmode="numeric"><p class="muted small-text">ACOG's general guideline for uncomplicated pregnancy is at least 150 minutes/week of moderate activity, but your own provider's advice overrides the number.</p><button type="button" id="saveCareHealthSettings" class="secondary-button small">Save care settings</button>`;
    const anchor = me.querySelector(".life-mode-card") || me.querySelector(".page-title"); anchor?.parentNode?.insertBefore(card, anchor.nextSibling);
    card.querySelector("#openCareHubSettings")?.addEventListener("click", () => showScreen("care-hub"));
    card.querySelector("#saveCareHealthSettings")?.addEventListener("click", () => { const c = ensureData(); c.settings.pregnancyExerciseStatus = document.getElementById("carePregExerciseStatus")?.value || "ask"; c.settings.pregnancyActivityGoal = Math.max(0, Number(document.getElementById("carePregActivityGoal")?.value) || PREG_ACTIVITY_GUIDE_MINUTES); persist(); if (typeof showToast === "function") showToast("Care settings saved 🤍"); });
  }

  function loadSettings() {
    const c = ensureData(); const s = document.getElementById("carePregExerciseStatus"); if (s) s.value = c.settings.pregnancyExerciseStatus || "ask"; const g = document.getElementById("carePregActivityGoal"); if (g) g.value = String(c.settings.pregnancyActivityGoal || PREG_ACTIVITY_GUIDE_MINUTES);
  }

  function install() {
    if (state.installed) return;
    if (typeof data === "undefined" || typeof showScreen !== "function" || typeof renderEverything !== "function") { setTimeout(install, 40); return; }
    state.installed = true; ensureData(); ensureStyle(); createScreen(); installSettingsControls(); loadSettings(); document.addEventListener("click", handleClick);
    state.base.renderEverything = renderEverything;
    renderEverything = function renderEverythingCareHealth() { const result = state.base.renderEverything(); entryCards(); addPregnancyCareEnhancements(); loadSettings(); if (document.querySelector('[data-screen="care-hub"]')?.classList.contains("active")) renderCareHub(); return result; };
    state.base.showScreen = showScreen;
    showScreen = function showScreenCareHealth(name) { const result = state.base.showScreen(name); if (name === "care-hub") renderCareHub(); if (name === "pregnancy-care") addPregnancyCareEnhancements(); if (name === "me") { installSettingsControls(); loadSettings(); } return result; };
    entryCards(); addPregnancyCareEnhancements();
    window.TsukiCareHealthIntelligence = { version: PUBLIC_VERSION, render: renderCareHub, safety: pregnancySafety, suggestions: () => isPregnancy() ? pregnancyCareSuggestions() : cycleCareSuggestions(), test: { ensureData, weeklyActivity, pregnancySafety, pregnancyCareSuggestions, cycleCareSuggestions, activityLearning, babyCareHTML } };
  }

  install();
})();
