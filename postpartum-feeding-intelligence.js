/* ============================================================
   TSUKI 🌙 — V1 PRE-RELEASE
   POSTPARTUM + FEEDING INTELLIGENCE
   Local-first, explainable, non-diagnostic.
   ============================================================ */
(() => {
  "use strict";

  const MODULE_VERSION = "1.0.0-pre-postpartum-1";
  const FEEDING_MODES = [
    ["breastfeeding", "Breastfeeding"],
    ["pumping", "Pumping"],
    ["breast-pump", "Breast + pumping"],
    ["combination", "Combination feeding"],
    ["formula", "Formula feeding"],
    ["weaning", "Weaning / transitioning"]
  ];

  const q = (selector, root = document) => root.querySelector(selector);
  const qa = (selector, root = document) => [...root.querySelectorAll(selector)];
  const uid = () => `pp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const esc = (value) => String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  const today = () => typeof todayKey === "function" ? todayKey() : new Date().toISOString().slice(0, 10);
  const dateObj = (value) => {
    if (!value) return null;
    const d = typeof parseDateKey === "function" ? parseDateKey(value) : new Date(`${value}T12:00:00`);
    return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
  };
  const dayDiff = (a, b) => {
    const x = dateObj(a), y = dateObj(b);
    if (!x || !y) return null;
    return Math.round((y - x) / 86400000);
  };
  const formatDate = (value) => {
    const d = dateObj(value);
    return d ? d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Not set";
  };

  function postpartumDefaults(existing = {}) {
    return {
      active: Boolean(existing.active),
      birthDate: existing.birthDate || "",
      pregnancyId: existing.pregnancyId || "",
      feedingMode: existing.feedingMode || "breastfeeding",
      babyName: existing.babyName || "",
      settings: {
        gentleFeedTracking: existing.settings?.gentleFeedTracking !== false,
        showDiapers: existing.settings?.showDiapers !== false,
        showBabyCare: existing.settings?.showBabyCare !== false,
        feedingGoal: existing.settings?.feedingGoal || "support",
        ...existing.settings
      },
      recoveryLogs: existing.recoveryLogs && typeof existing.recoveryLogs === "object" ? existing.recoveryLogs : {},
      feedingLogs: Array.isArray(existing.feedingLogs) ? existing.feedingLogs : [],
      babyLogs: existing.babyLogs && typeof existing.babyLogs === "object" ? existing.babyLogs : {},
      questions: Array.isArray(existing.questions) ? existing.questions : [],
      appointments: Array.isArray(existing.appointments) ? existing.appointments : [],
      returnOfCycle: {
        status: existing.returnOfCycle?.status || "not-returned",
        firstPeriodDate: existing.returnOfCycle?.firstPeriodDate || "",
        ...existing.returnOfCycle
      },
      intelligence: {
        lastReviewed: existing.intelligence?.lastReviewed || "",
        ...existing.intelligence
      }
    };
  }

  function store() {
    if (typeof data === "undefined") return null;
    const next = postpartumDefaults(data.postpartum || {});
    data.postpartum = next;
    return next;
  }

  function persist() {
    if (typeof saveData === "function") saveData();
  }

  function isPostpartum() {
    const pp = store();
    return Boolean(pp && (pp.active || data.mode === "postpartum"));
  }

  function postpartumDay() {
    const pp = store();
    if (!pp?.birthDate) return null;
    const n = dayDiff(pp.birthDate, today());
    return Number.isFinite(n) && n >= 0 ? n : null;
  }

  function postpartumStage() {
    const day = postpartumDay();
    if (day == null) return { key: "unknown", title: "Postpartum", copy: "Add the birth date when you are ready so Tsuki can organize recovery and baby-care context." };
    if (day <= 6) return { key: "first-week", title: `Day ${day + 1} postpartum`, copy: "The first days are a high-support recovery period for both you and baby." };
    if (day <= 41) return { key: "six-weeks", title: `Week ${Math.floor(day / 7) + 1} postpartum`, copy: "Recovery, feeding support, sleep, mood and follow-up care all matter during these first six weeks." };
    if (day <= 84) return { key: "twelve-weeks", title: `Week ${Math.floor(day / 7) + 1} postpartum`, copy: "Recovery continues beyond the early weeks. Your postpartum questions still belong in your care plan." };
    return { key: "later", title: `${Math.floor(day / 7)} weeks postpartum`, copy: "Tsuki can keep supporting feeding, recovery, contraception and the gradual return of your cycle." };
  }

  const urgentMaternalLabels = {
    severeHeadache: "Severe or persistent headache",
    visionChanges: "Changes in vision",
    fainting: "Dizziness or fainting",
    fever: "Fever 38°C / 100.4°F or higher",
    breathing: "Trouble breathing",
    chestPain: "Chest pain or fast-beating heart",
    severeBellyPain: "Severe belly pain that does not go away",
    heavyBleedingEmergency: "Heavy bleeding (soaking through a pad in an hour / very large clots)",
    badDischarge: "Bad-smelling vaginal discharge",
    severeLimb: "Severe one-sided arm/leg swelling, redness or pain",
    severeVomiting: "Severe vomiting / unable to keep fluids down",
    extremeSwelling: "Extreme swelling of hands or face",
    overwhelmingTiredness: "Overwhelming weakness or tiredness that makes care difficult",
    selfHarm: "Thoughts of harming yourself or your baby"
  };

  const newbornUrgentLabels = {
    poorFeeding: "Baby is not feeding well / feeding has dropped noticeably",
    reducedActivity: "Baby is unusually sleepy, floppy, difficult to wake or much less active",
    breathingDifficulty: "Baby has difficult or unusually fast breathing",
    feverOrCold: "Baby has a fever or feels unusually cold",
    seizure: "Baby has a seizure / fit",
    earlyJaundice: "Jaundice in the first 24 hours, or yellow palms/soles",
    persistentVomiting: "Persistent vomiting / unable to keep feeds down",
    dehydrationConcern: "Possible dehydration / noticeably fewer wet diapers than expected for this baby"
  };

  function maternalSafety(log = store()?.recoveryLogs?.[today()] || {}) {
    const urgent = [];
    Object.entries(urgentMaternalLabels).forEach(([key, label]) => { if (log[key]) urgent.push(label); });

    const discuss = [];
    if (log.incidentConcern) discuss.push("Incision/tear healing concern");
    if (log.breastPain === "persistent") discuss.push("Breast/nipple pain that is persistent or worsening");
    if (log.breastRedness && log.feverish) discuss.push("Breast redness/warmth with feverish or flu-like symptoms");
    if (["very-low", "panicky", "overwhelmed"].includes(log.mood)) discuss.push("Emotional wellbeing has been difficult today");
    if (log.bladdersBowels === "concern") discuss.push("Bladder/bowel concern");

    if (urgent.length) return { level: "urgent", urgent, discuss };
    if (discuss.length) return { level: "discuss", urgent, discuss };
    return { level: "routine", urgent, discuss };
  }

  function babySafety(log = store()?.babyLogs?.[today()] || {}) {
    const urgent = [];
    Object.entries(newbornUrgentLabels).forEach(([key, label]) => { if (log[key]) urgent.push(label); });
    return { level: urgent.length ? "urgent" : "routine", urgent };
  }

  function feedingRecent(days = 7) {
    const pp = store();
    const cutoff = new Date(); cutoff.setHours(0, 0, 0, 0); cutoff.setDate(cutoff.getDate() - (days - 1));
    return pp.feedingLogs.filter(x => {
      const d = dateObj(x.date);
      return d && d >= cutoff;
    }).sort((a, b) => `${a.date}${a.time || ""}`.localeCompare(`${b.date}${b.time || ""}`));
  }

  function feedingInsights() {
    const logs = feedingRecent(14);
    const out = [];
    if (logs.length < 3) return out;

    const painLogs = logs.filter(x => ["moderate", "strong"].includes(x.nipplePain));
    const latchHard = logs.filter(x => ["difficult", "painful"].includes(x.latch));
    if (painLogs.length >= 3) out.push({ icon: "🤍", title: "Feeding discomfort keeps appearing", text: `You recorded moderate/strong nipple discomfort in ${painLogs.length} recent feeding entries. Persistent pain is worth reviewing with a lactation or healthcare professional.` });
    if (latchHard.length >= 3) out.push({ icon: "🫶", title: "Latch support may be useful", text: `Latch difficulty appeared in ${latchHard.length} recent entries. Tsuki can help you remember the pattern, but a lactation professional can assess latch and positioning directly.` });

    const longGapPain = [];
    for (let i = 1; i < logs.length; i++) {
      const a = dateObj(logs[i - 1].date), b = dateObj(logs[i].date);
      if (!a || !b || logs[i - 1].time == null || logs[i].time == null) continue;
      const [ah, am] = String(logs[i - 1].time).split(":").map(Number);
      const [bh, bm] = String(logs[i].time).split(":").map(Number);
      a.setHours(ah || 0, am || 0); b.setHours(bh || 0, bm || 0);
      const hours = (b - a) / 3600000;
      if (hours >= 5 && ["full", "tender", "firm-area"].includes(logs[i].breastFeel)) longGapPain.push(hours);
    }
    if (longGapPain.length >= 2) out.push({ icon: "🌙", title: "A timing pattern may be forming", text: "Breast fullness/tenderness has followed several longer gaps in your own recent feeding log. This is a personal observation, not a diagnosis or a feeding schedule recommendation." });

    const pump = logs.filter(x => Number.isFinite(Number(x.amountMl)) && Number(x.amountMl) > 0);
    if (pump.length >= 5) {
      const vals = pump.map(x => Number(x.amountMl)).sort((a, b) => a - b);
      const median = vals[Math.floor(vals.length / 2)];
      out.push({ icon: "🍼", title: "Your pumping baseline", text: `Your recent recorded pump amounts center around about ${Math.round(median)} mL per logged session. Pump output alone does not measure how much milk a nursing baby gets or diagnose milk supply.` });
    }
    return out.slice(0, 3);
  }

  function recoveryInsights() {
    const pp = store();
    const keys = Object.keys(pp.recoveryLogs).sort().slice(-10);
    const logs = keys.map(k => pp.recoveryLogs[k]).filter(Boolean);
    const out = [];
    if (logs.length < 3) return out;
    const lowSleep = logs.filter(x => ["very-poor", "poor"].includes(x.sleep)).length;
    const lowEnergy = logs.filter(x => ["very-low", "low"].includes(x.energy)).length;
    const lowSupport = logs.filter(x => x.support === "need-more").length;
    const moodHard = logs.filter(x => ["very-low", "panicky", "overwhelmed"].includes(x.mood)).length;
    if (lowSleep >= 3 && lowEnergy >= 3) out.push({ icon: "☁️", title: "Recovery load looks heavy", text: `Poor/very poor sleep and low energy appeared together repeatedly in your recent check-ins. Consider protecting rest and asking for practical support where possible.` });
    if (lowSupport >= 2) out.push({ icon: "🫶", title: "You have asked for more support", text: "You recorded needing more support on multiple recent days. This can be worth raising with someone you trust or your postpartum care team." });
    if (moodHard >= 2) out.push({ icon: "💗", title: "Your emotional wellbeing deserves attention", text: "Very low, panicky or overwhelmed feelings have appeared repeatedly. Consider contacting your healthcare professional rather than carrying this alone." });
    return out.slice(0, 2);
  }

  function togetherInsights() {
    const out = [];
    const pp = store();
    const rec = pp.recoveryLogs[today()] || {};
    const feeds = feedingRecent(2);
    if (["very-poor", "poor"].includes(rec.sleep) && ["very-low", "low"].includes(rec.energy)) {
      out.push({ icon: "🤍", title: "A gentler day may help", text: "You logged poor sleep and low energy today. Tsuki will prioritize rest, food, hydration and support over pushing an activity goal." });
    }
    if (feeds.length >= 6 && rec.support === "need-more") {
      out.push({ icon: "🫶", title: "Feeding + support load", text: "You have several recent feeding entries and also said you need more support. If someone can help with food, household tasks, burping, bottles or rest time, that may be useful today." });
    }
    return out;
  }

  function cycleReturnGuidance() {
    const pp = store();
    if (!pp) return "";
    if (pp.returnOfCycle.status === "confirmed") {
      return `You marked ${formatDate(pp.returnOfCycle.firstPeriodDate)} as your first period after birth. Feeding status can continue independently while Tsuki rebuilds cycle confidence from actual new periods.`;
    }
    if (pp.returnOfCycle.status === "unsure") {
      return "You marked bleeding as uncertain. Tsuki will not treat it as a period until you confirm it.";
    }
    return "Ovulation can return before the first postpartum period, and breastfeeding does not make calendar fertility prediction reliable for everyone. Tsuki keeps ordinary cycle prediction paused until you explicitly confirm a returning period.";
  }

  function upcomingCare() {
    const pp = store();
    const now = today();
    return pp.appointments.filter(x => x.date && x.date >= now).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  }

  function safetyHTML() {
    const mom = maternalSafety();
    const baby = babySafety();
    if (mom.level === "urgent") return `<article class="pp-alert pp-alert-urgent"><strong>⚠️ Please seek medical care now</strong><p>You logged an urgent postpartum warning sign: ${esc(mom.urgent.join(", "))}. Serious pregnancy-related complications can occur during the year after delivery. Seek medical care immediately and say that you recently gave birth.</p></article>`;
    if (baby.level === "urgent") return `<article class="pp-alert pp-alert-urgent"><strong>👶 Please seek prompt medical care for baby</strong><p>You logged a newborn danger sign: ${esc(baby.urgent.join(", "))}. Contact your baby's healthcare professional or seek urgent care rather than waiting for Tsuki to interpret it.</p></article>`;
    if (mom.level === "discuss") return `<article class="pp-alert pp-alert-discuss"><strong>🩺 Worth discussing with your care team</strong><p>${esc(mom.discuss.join(" · "))}</p></article>`;
    return `<article class="pp-alert pp-alert-calm"><strong>🤍 Safety check</strong><p>No urgent maternal or baby warning sign is selected in today's Tsuki check-in. If something feels seriously wrong even when it is not listed here, contact a healthcare professional.</p></article>`;
  }

  function screenHTML() {
    const pp = store();
    const stage = postpartumStage();
    const mom = maternalSafety();
    const baby = babySafety();
    const insights = [...feedingInsights(), ...recoveryInsights(), ...togetherInsights()].slice(0, 5);
    const appointments = upcomingCare();
    const feedsToday = pp.feedingLogs.filter(x => x.date === today()).length;
    const modeLabel = FEEDING_MODES.find(x => x[0] === pp.feedingMode)?.[1] || "Feeding";

    return `
      <div class="pp-header">
        <p class="eyebrow">POSTPARTUM & FEEDING</p>
        <h2>${esc(stage.title)} 🤍</h2>
        <p class="muted">${esc(stage.copy)}</p>
      </div>

      ${safetyHTML()}

      <article class="card pp-hero">
        <div><span class="small-label">CURRENT FEEDING</span><strong>${esc(modeLabel)}</strong></div>
        <div><span class="small-label">FEEDS / PUMPS LOGGED TODAY</span><strong>${feedsToday}</strong></div>
        <button type="button" class="secondary-button small" id="ppChangeFeeding">Change feeding plan</button>
      </article>

      <div class="pp-grid-actions">
        <button class="pp-action" data-pp-open="recovery"><span>🤍</span><strong>My recovery</strong><small>Body, mood, sleep & support</small></button>
        <button class="pp-action" data-pp-open="feeding"><span>🍼</span><strong>Log feeding</strong><small>Breast, pump, bottle or formula</small></button>
        <button class="pp-action" data-pp-open="baby"><span>👶</span><strong>Baby check</strong><small>Feeding, diapers & wellbeing</small></button>
        <button class="pp-action" data-pp-open="cycle"><span>🌙</span><strong>Return of cycle</strong><small>Bleeding ≠ automatically a period</small></button>
      </div>

      <article class="card">
        <p class="eyebrow">TSUKI TOGETHER</p>
        <h3>What your recent days are saying</h3>
        <div id="ppInsights">${insights.length ? insights.map(x => `<div class="pp-insight"><span>${x.icon}</span><div><strong>${esc(x.title)}</strong><p>${esc(x.text)}</p></div></div>`).join("") : `<p class="muted">Keep using the low-effort check-ins. Tsuki will look for your own recovery and feeding patterns without forcing population averages onto you.</p>`}</div>
      </article>

      <article class="card">
        <p class="eyebrow">CARE COMING UP</p>
        <h3>Your postpartum plan</h3>
        ${appointments.length ? appointments.map(a => `<div class="pp-list-row"><div><strong>${esc(a.title || "Care appointment")}</strong><small>${esc(formatDate(a.date))}${a.provider ? ` · ${esc(a.provider)}` : ""}</small></div></div>`).join("") : `<p class="muted">Add postpartum, lactation or baby appointments so Tsuki can keep them together.</p>`}
        <details class="pp-details"><summary>+ Add appointment</summary>
          <label>What<input id="ppAppointmentTitle" type="text" placeholder="Postpartum visit, lactation consult, baby check…"></label>
          <label>Date<input id="ppAppointmentDate" type="date"></label>
          <label>Provider / place<input id="ppAppointmentProvider" type="text" placeholder="Optional"></label>
          <button type="button" id="ppSaveAppointment" class="primary-button small">Save appointment</button>
        </details>
      </article>

      <article class="card">
        <p class="eyebrow">FEEDING & BREAST HEALTH</p>
        <h3>Support, not a score</h3>
        <p class="muted">Tsuki does not diagnose milk supply from pump output or require you to count every feed. Use as much or as little detail as feels useful.</p>
        <div class="pp-note">${esc(cycleReturnGuidance())}</div>
      </article>

      <article class="card">
        <p class="eyebrow">QUESTIONS FOR CARE</p>
        <h3>Things I want to ask</h3>
        <div id="ppQuestions">${pp.questions.length ? pp.questions.slice().reverse().slice(0, 8).map(x => `<div class="pp-list-row"><span>🩺</span><div><strong>${esc(x.text)}</strong><small>${esc(formatDate(x.date))}</small></div><button type="button" class="icon-button" data-pp-question-delete="${esc(x.id)}" aria-label="Delete question">×</button></div>`).join("") : `<p class="muted">Save a question when something comes to mind so it is ready for your next visit.</p>`}</div>
        <div class="pp-inline"><input id="ppQuestionText" type="text" placeholder="Ask about…"><button id="ppSaveQuestion" type="button" class="primary-button small">Add</button></div>
      </article>

      <p class="muted small-text pp-source-note">Tsuki is a tracking and decision-support companion, not a substitute for postpartum, lactation or pediatric care.</p>

      ${modalFormsHTML()}
    `;
  }

  function modalFormsHTML() {
    return `
    <div class="pp-sheet hidden" id="ppRecoverySheet" role="dialog" aria-modal="true" aria-label="Postpartum recovery check-in"><div class="pp-sheet-panel">
      <div class="pp-sheet-head"><div><p class="eyebrow">TODAY</p><h3>My recovery</h3></div><button class="icon-button" data-pp-close>×</button></div>
      <p class="muted">Log only what feels useful. Urgent warning selections override personalized suggestions.</p>
      <label>Postpartum bleeding<select id="ppBleeding"><option value="">Not logged</option><option>Light</option><option>Moderate</option><option>Heavy</option><option>Nearly stopped</option></select></label>
      <label>Energy<select id="ppEnergy"><option value="">Not logged</option><option value="very-low">Very low</option><option value="low">Low</option><option value="okay">Okay</option><option value="good">Good</option></select></label>
      <label>Sleep<select id="ppSleep"><option value="">Not logged</option><option value="very-poor">Very poor</option><option value="poor">Poor</option><option value="okay">Okay</option><option value="good">Good</option></select></label>
      <label>Mood<select id="ppMood"><option value="">Not logged</option><option value="okay">Okay</option><option value="emotional">Emotional</option><option value="anxious">Anxious</option><option value="overwhelmed">Overwhelmed</option><option value="panicky">Panicky</option><option value="very-low">Very low</option></select></label>
      <label>Support today<select id="ppSupport"><option value="">Not logged</option><option value="enough">I have enough support</option><option value="need-more">I need more help/support</option></select></label>
      <label>Breast / nipple comfort<select id="ppBreastPain"><option value="">Not logged</option><option value="none">Comfortable</option><option value="mild">Mild tenderness</option><option value="persistent">Persistent/worsening pain</option></select></label>
      <label>Bladder / bowel<select id="ppBladderBowel"><option value="">Not logged</option><option value="okay">No concern</option><option value="concern">Pain, leakage, constipation or control concern</option></select></label>
      <div class="pp-check-group"><strong>Worth mentioning</strong><label><input type="checkbox" id="ppIncisionConcern"> Incision/tear is not healing as expected</label><label><input type="checkbox" id="ppBreastRedness"> Breast redness/warmth/firm painful area</label><label><input type="checkbox" id="ppFeverish"> Feverish/chills/flu-like feeling with breast symptoms</label></div>
      <div class="pp-check-group pp-danger"><strong>⚠️ Urgent postpartum warning signs</strong>
        ${Object.entries(urgentMaternalLabels).map(([key, label]) => `<label><input type="checkbox" data-pp-maternal-urgent="${key}"> ${esc(label)}</label>`).join("")}
      </div>
      <label>Notes<textarea id="ppRecoveryNotes" rows="3" placeholder="Anything else…"></textarea></label>
      <button type="button" id="ppSaveRecovery" class="primary-button">Save recovery check-in</button>
    </div></div>

    <div class="pp-sheet hidden" id="ppFeedingSheet" role="dialog" aria-modal="true" aria-label="Feeding log"><div class="pp-sheet-panel">
      <div class="pp-sheet-head"><div><p class="eyebrow">FEEDING</p><h3>Log a feed or pump</h3></div><button class="icon-button" data-pp-close>×</button></div>
      <label>Type<select id="ppFeedType"><option value="breastfeed">Breastfeed</option><option value="pump">Pump</option><option value="express">Hand express</option><option value="bottle-breastmilk">Bottle — breast milk</option><option value="formula">Formula</option><option value="combo">Combination feed</option></select></label>
      <label>Time<input id="ppFeedTime" type="time"></label>
      <label>Side<select id="ppFeedSide"><option value="">Not needed</option><option value="left">Left</option><option value="right">Right</option><option value="both">Both</option></select></label>
      <label>Minutes<input id="ppFeedMinutes" type="number" min="0" max="240" inputmode="numeric" placeholder="Optional"></label>
      <label>Amount expressed / bottle (mL)<input id="ppFeedAmount" type="number" min="0" max="2000" step="1" inputmode="decimal" placeholder="Optional"></label>
      <label>Latch / feeding comfort<select id="ppFeedLatch"><option value="">Not logged</option><option value="comfortable">Comfortable</option><option value="learning">Still learning</option><option value="difficult">Difficult</option><option value="painful">Painful</option></select></label>
      <label>Nipple discomfort<select id="ppNipplePain"><option value="">Not logged</option><option value="none">None</option><option value="mild">Mild</option><option value="moderate">Moderate</option><option value="strong">Strong</option></select></label>
      <label>Breast feel<select id="ppBreastFeel"><option value="">Not logged</option><option value="comfortable">Comfortable</option><option value="full">Full</option><option value="tender">Tender</option><option value="firm-area">Firm / sore area</option></select></label>
      <label>Baby after feed<select id="ppBabyAfter"><option value="">Not logged</option><option value="content">Seems content</option><option value="still-cueing">Still showing feeding cues</option><option value="sleepy">Sleepy / hard to keep engaged</option></select></label>
      <label>Notes<textarea id="ppFeedNotes" rows="3" placeholder="Optional"></textarea></label>
      <button type="button" id="ppSaveFeed" class="primary-button">Save feeding entry</button>
    </div></div>

    <div class="pp-sheet hidden" id="ppBabySheet" role="dialog" aria-modal="true" aria-label="Baby check"><div class="pp-sheet-panel">
      <div class="pp-sheet-head"><div><p class="eyebrow">BABY</p><h3>Baby check</h3></div><button class="icon-button" data-pp-close>×</button></div>
      <label>Wet diapers today<input id="ppWetDiapers" type="number" min="0" max="30" inputmode="numeric" placeholder="Optional"></label>
      <label>Dirty diapers today<input id="ppDirtyDiapers" type="number" min="0" max="30" inputmode="numeric" placeholder="Optional"></label>
      <label>Feeding overall<select id="ppBabyFeeding"><option value="">Not logged</option><option value="usual">Usual for baby</option><option value="more">More frequent</option><option value="less">Less / harder than usual</option></select></label>
      <label>Baby's alertness<select id="ppBabyAlertness"><option value="">Not logged</option><option value="usual">Usual for baby</option><option value="sleepier">Sleepier than usual</option><option value="very-hard-wake">Very difficult to wake / unusually floppy</option></select></label>
      <div class="pp-check-group pp-danger"><strong>👶 Newborn danger signs — seek prompt medical care</strong>
        ${Object.entries(newbornUrgentLabels).map(([key, label]) => `<label><input type="checkbox" data-pp-baby-urgent="${key}"> ${esc(label)}</label>`).join("")}
      </div>
      <label>Notes<textarea id="ppBabyNotes" rows="3" placeholder="Optional"></textarea></label>
      <button type="button" id="ppSaveBaby" class="primary-button">Save baby check</button>
    </div></div>

    <div class="pp-sheet hidden" id="ppCycleSheet" role="dialog" aria-modal="true" aria-label="Return of period"><div class="pp-sheet-panel">
      <div class="pp-sheet-head"><div><p class="eyebrow">RETURN OF CYCLE</p><h3>Has your period returned?</h3></div><button class="icon-button" data-pp-close>×</button></div>
      <p class="muted">Postpartum bleeding and spotting are not automatically treated as a period. You decide when to confirm your first period after birth.</p>
      <label>Status<select id="ppCycleStatus"><option value="not-returned">No confirmed period yet</option><option value="unsure">I'm not sure if this bleeding is a period</option><option value="confirmed">Yes, I am confirming a period</option></select></label>
      <label id="ppCycleDateWrap">First confirmed period date<input id="ppCycleDate" type="date"></label>
      <div class="pp-note">Ovulation may return before the first period. Breastfeeding patterns alone cannot guarantee when fertility returns.</div>
      <button type="button" id="ppSaveCycleReturn" class="primary-button">Save status</button>
    </div></div>

    <div class="pp-sheet hidden" id="ppFeedingModeSheet" role="dialog" aria-modal="true" aria-label="Feeding plan"><div class="pp-sheet-panel">
      <div class="pp-sheet-head"><div><p class="eyebrow">FEEDING PLAN</p><h3>How are you feeding right now?</h3></div><button class="icon-button" data-pp-close>×</button></div>
      <p class="muted">This can change anytime. Tsuki keeps the history rather than treating one choice as permanent.</p>
      <div class="pp-mode-grid">${FEEDING_MODES.map(([value, label]) => `<button type="button" class="pp-mode-choice" data-pp-feeding-mode="${value}">${esc(label)}</button>`).join("")}</div>
    </div></div>`;
  }

  function injectStyles() {
    if (q("#tsukiPostpartumStyles")) return;
    const style = document.createElement("style");
    style.id = "tsukiPostpartumStyles";
    style.textContent = `
      body.pp-cycle-paused .prediction-card,body.pp-cycle-paused #latePeriodNotice,body.pp-cycle-paused #periodSignalTodayCard{display:none!important}\n            .pp-header{margin-bottom:16px}.pp-hero{display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:end}.pp-hero>div{display:flex;flex-direction:column;gap:4px}.pp-hero button{grid-column:1/-1}
      .pp-grid-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0}.pp-action{border:0;border-radius:18px;padding:14px;text-align:left;background:var(--card,#fff);box-shadow:var(--shadow-soft,0 6px 20px rgba(70,40,60,.08));display:flex;flex-direction:column;gap:4px;color:inherit}.pp-action>span{font-size:24px}.pp-action small,.pp-list-row small{color:var(--muted,#7f7480);display:block}.pp-alert{border-radius:18px;padding:14px 16px;margin:12px 0}.pp-alert p{margin:6px 0 0}.pp-alert-urgent{background:#fff0f1;border:1px solid #f3aeb5}.pp-alert-discuss{background:#fff8ed;border:1px solid #f0d3a6}.pp-alert-calm{background:#f5fbf7;border:1px solid #cce7d3}.pp-insight{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid rgba(120,90,110,.1)}.pp-insight:last-child{border-bottom:0}.pp-insight span{font-size:22px}.pp-insight p{margin:4px 0 0;color:var(--muted,#7f7480);font-size:.92rem}.pp-list-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(120,90,110,.1)}.pp-list-row>div{flex:1}.pp-note{border-radius:14px;background:rgba(248,201,217,.18);padding:11px 12px;margin-top:10px}.pp-inline{display:flex;gap:8px;margin-top:10px}.pp-inline input{flex:1;min-width:0}.pp-details{margin-top:12px}.pp-details summary{font-weight:700;cursor:pointer}.pp-details label,.pp-sheet label{display:flex;flex-direction:column;gap:6px;margin:12px 0;font-weight:600}.pp-sheet input,.pp-sheet select,.pp-sheet textarea,.pp-details input{width:100%;box-sizing:border-box}.pp-sheet{position:fixed;inset:0;z-index:10080;background:rgba(38,28,34,.42);display:flex;align-items:flex-end;justify-content:center}.pp-sheet.hidden{display:none}.pp-sheet-panel{width:min(100%,620px);max-height:88dvh;overflow:auto;background:var(--surface,#fff);border-radius:24px 24px 0 0;padding:18px 18px calc(20px + env(safe-area-inset-bottom));box-shadow:0 -12px 40px rgba(30,20,30,.16)}.pp-sheet-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;position:sticky;top:-18px;background:var(--surface,#fff);padding:18px 0 8px;z-index:2}.pp-sheet-head h3{margin:2px 0}.pp-check-group{display:flex;flex-direction:column;gap:7px;padding:12px;border-radius:14px;background:rgba(120,90,110,.06);margin:12px 0}.pp-check-group label{flex-direction:row;align-items:flex-start;margin:0;font-weight:500}.pp-check-group input{width:auto;margin-top:3px}.pp-danger{background:#fff3f3}.pp-mode-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pp-mode-choice{border:1px solid rgba(120,90,110,.16);background:var(--card,#fff);border-radius:16px;padding:14px;color:inherit;font-weight:700}.pp-source-note{margin:18px 4px}.pp-drawer-row.hidden{display:none!important}
      @media(max-width:360px){.pp-grid-actions,.pp-mode-grid,.pp-hero{grid-template-columns:1fr}.pp-hero button{grid-column:auto}}
    `;
    document.head.appendChild(style);
  }

  function injectScreen() {
    if (q('[data-screen="postpartum-feeding"]')) return;
    const main = q(".main-content") || q("main");
    if (!main) return;
    const section = document.createElement("section");
    section.className = "screen";
    section.dataset.screen = "postpartum-feeding";
    main.appendChild(section);
  }

  function injectDrawer() {
    if (q("#postpartumDrawerMenu")) return;
    const scroll = q("#appDrawer .drawer-scroll");
    if (!scroll) return;
    const group = document.createElement("section");
    group.id = "postpartumDrawerMenu";
    group.className = "drawer-group pp-drawer-row hidden";
    group.innerHTML = `<p class="drawer-group-title">POSTPARTUM & FEEDING</p>
      <button class="drawer-row" data-pp-nav><span class="drawer-row-icon">🤍</span><span><strong>Postpartum & Feeding</strong><small>Recovery, feeding, baby & care</small></span><b>›</b></button>`;
    scroll.insertBefore(group, scroll.firstElementChild?.nextSibling || scroll.firstChild);
    group.querySelector("[data-pp-nav]")?.addEventListener("click", () => openScreen());
  }

  function openScreen() {
    if (typeof showScreen === "function") showScreen("postpartum-feeding");
    else {
      qa(".screen.active").forEach(x => x.classList.remove("active"));
      q('[data-screen="postpartum-feeding"]')?.classList.add("active");
    }
    q("#appDrawer")?.setAttribute("aria-hidden", "true");
    q("#drawerBackdrop")?.classList.add("hidden");
    render();
  }

  function openSheet(id) { q(`#${id}`)?.classList.remove("hidden"); }
  function closeSheets() { qa(".pp-sheet").forEach(x => x.classList.add("hidden")); }

  function bind() {
    const screen = q('[data-screen="postpartum-feeding"]');
    if (!screen || screen.dataset.bound === "1") return;
    screen.dataset.bound = "1";
    screen.addEventListener("click", e => {
      const opener = e.target.closest("[data-pp-open]");
      if (opener) {
        const map = { recovery: "ppRecoverySheet", feeding: "ppFeedingSheet", baby: "ppBabySheet", cycle: "ppCycleSheet" };
        openSheet(map[opener.dataset.ppOpen]); return;
      }
      if (e.target.closest("[data-pp-close]")) { closeSheets(); return; }
      const del = e.target.closest("[data-pp-question-delete]");
      if (del) {
        const pp = store(); pp.questions = pp.questions.filter(x => x.id !== del.dataset.ppQuestionDelete); persist(); render(); return;
      }
      const mode = e.target.closest("[data-pp-feeding-mode]");
      if (mode) {
        store().feedingMode = mode.dataset.ppFeedingMode; persist(); closeSheets(); render(); return;
      }
    });
  }

  function hydrateForms() {
    const pp = store();
    const rec = pp.recoveryLogs[today()] || {};
    const baby = pp.babyLogs[today()] || {};
    const setVal = (id, value) => { const el = q(`#${id}`); if (el) el.value = value ?? ""; };
    setVal("ppBleeding", rec.bleeding); setVal("ppEnergy", rec.energy); setVal("ppSleep", rec.sleep); setVal("ppMood", rec.mood); setVal("ppSupport", rec.support); setVal("ppBreastPain", rec.breastPain); setVal("ppBladderBowel", rec.bladdersBowels); setVal("ppRecoveryNotes", rec.notes);
    if (q("#ppIncisionConcern")) q("#ppIncisionConcern").checked = Boolean(rec.incidentConcern);
    if (q("#ppBreastRedness")) q("#ppBreastRedness").checked = Boolean(rec.breastRedness);
    if (q("#ppFeverish")) q("#ppFeverish").checked = Boolean(rec.feverish);
    qa("[data-pp-maternal-urgent]").forEach(el => el.checked = Boolean(rec[el.dataset.ppMaternalUrgent]));
    setVal("ppWetDiapers", baby.wetDiapers); setVal("ppDirtyDiapers", baby.dirtyDiapers); setVal("ppBabyFeeding", baby.feeding); setVal("ppBabyAlertness", baby.alertness); setVal("ppBabyNotes", baby.notes);
    qa("[data-pp-baby-urgent]").forEach(el => el.checked = Boolean(baby[el.dataset.ppBabyUrgent]));
    setVal("ppCycleStatus", pp.returnOfCycle.status); setVal("ppCycleDate", pp.returnOfCycle.firstPeriodDate);
    setVal("ppFeedTime", new Date().toTimeString().slice(0, 5));
  }

  function bindButtons() {
    q("#ppChangeFeeding")?.addEventListener("click", () => openSheet("ppFeedingModeSheet"));
    q("#ppSaveRecovery")?.addEventListener("click", () => {
      const pp = store();
      const log = {
        date: today(),
        bleeding: q("#ppBleeding")?.value || "",
        energy: q("#ppEnergy")?.value || "",
        sleep: q("#ppSleep")?.value || "",
        mood: q("#ppMood")?.value || "",
        support: q("#ppSupport")?.value || "",
        breastPain: q("#ppBreastPain")?.value || "",
        bladdersBowels: q("#ppBladderBowel")?.value || "",
        incidentConcern: Boolean(q("#ppIncisionConcern")?.checked),
        breastRedness: Boolean(q("#ppBreastRedness")?.checked),
        feverish: Boolean(q("#ppFeverish")?.checked),
        notes: q("#ppRecoveryNotes")?.value?.trim() || ""
      };
      qa("[data-pp-maternal-urgent]").forEach(el => { log[el.dataset.ppMaternalUrgent] = el.checked; });
      pp.recoveryLogs[today()] = log; persist(); closeSheets(); render();
    });
    q("#ppSaveFeed")?.addEventListener("click", () => {
      const pp = store();
      pp.feedingLogs.push({
        id: uid(), date: today(), time: q("#ppFeedTime")?.value || "",
        type: q("#ppFeedType")?.value || "breastfeed", side: q("#ppFeedSide")?.value || "",
        minutes: q("#ppFeedMinutes")?.value ? Number(q("#ppFeedMinutes").value) : null,
        amountMl: q("#ppFeedAmount")?.value ? Number(q("#ppFeedAmount").value) : null,
        latch: q("#ppFeedLatch")?.value || "", nipplePain: q("#ppNipplePain")?.value || "",
        breastFeel: q("#ppBreastFeel")?.value || "", babyAfter: q("#ppBabyAfter")?.value || "",
        notes: q("#ppFeedNotes")?.value?.trim() || ""
      });
      if (pp.feedingLogs.length > 1500) pp.feedingLogs = pp.feedingLogs.slice(-1500);
      persist(); closeSheets(); render();
    });
    q("#ppSaveBaby")?.addEventListener("click", () => {
      const pp = store(); const log = {
        date: today(), wetDiapers: q("#ppWetDiapers")?.value === "" ? null : Number(q("#ppWetDiapers")?.value), dirtyDiapers: q("#ppDirtyDiapers")?.value === "" ? null : Number(q("#ppDirtyDiapers")?.value), feeding: q("#ppBabyFeeding")?.value || "", alertness: q("#ppBabyAlertness")?.value || "", notes: q("#ppBabyNotes")?.value?.trim() || ""
      };
      qa("[data-pp-baby-urgent]").forEach(el => { log[el.dataset.ppBabyUrgent] = el.checked; });
      pp.babyLogs[today()] = log; persist(); closeSheets(); render();
    });
    q("#ppSaveCycleReturn")?.addEventListener("click", () => {
      const pp = store(); const status = q("#ppCycleStatus")?.value || "not-returned"; const date = q("#ppCycleDate")?.value || "";
      pp.returnOfCycle.status = status; pp.returnOfCycle.firstPeriodDate = status === "confirmed" ? date : "";
      // Confirmation is informational here. The existing period logger remains the only source that creates/changes period history.
      persist(); closeSheets(); render();
    });
    q("#ppSaveQuestion")?.addEventListener("click", () => {
      const text = q("#ppQuestionText")?.value?.trim(); if (!text) return;
      store().questions.push({ id: uid(), text, date: today() }); persist(); render();
    });
    q("#ppSaveAppointment")?.addEventListener("click", () => {
      const title = q("#ppAppointmentTitle")?.value?.trim(); const date = q("#ppAppointmentDate")?.value;
      if (!title || !date) return;
      store().appointments.push({ id: uid(), title, date, provider: q("#ppAppointmentProvider")?.value?.trim() || "" }); persist(); render();
    });
  }

  function render() {
    const pp = store(); if (!pp) return;
    injectStyles(); injectScreen(); injectDrawer();
    document.body?.classList.toggle("pp-cycle-paused", isPostpartum());
    const drawer = q("#postpartumDrawerMenu");
    drawer?.classList.toggle("hidden", !isPostpartum());
    if (isPostpartum()) {
      pp.active = true;
      const screen = q('[data-screen="postpartum-feeding"]');
      if (screen) { screen.innerHTML = screenHTML(); screen.dataset.bound = "0"; bind(); hydrateForms(); bindButtons(); }
    }
  }

  function activate({ birthDate = "", feedingMode = "breastfeeding" } = {}) {
    const pp = store();
    pp.active = true; pp.birthDate = birthDate || pp.birthDate; pp.feedingMode = feedingMode || pp.feedingMode;
    data.mode = "postpartum";
    // Do not clear pregnancy, period, sexual-health, Care Hub or historical data.
    persist();
    if (typeof renderEverything === "function") renderEverything();
    render(); openScreen();
  }

  function install() {
    if (window.TsukiPostpartumFeedingIntelligence?.installed) return;
    if (typeof data === "undefined" || typeof saveData !== "function") return setTimeout(install, 80);
    injectStyles(); injectScreen(); injectDrawer(); render();

    if (typeof renderEverything === "function" && !renderEverything.__ppWrapped) {
      const original = renderEverything;
      const wrapped = function(...args) { const value = original.apply(this, args); try { render(); } catch (e) { console.warn("Tsuki postpartum render skipped", e); } return value; };
      wrapped.__ppWrapped = true;
      window.renderEverything = wrapped;
      try { renderEverything = wrapped; } catch (_) {}
    }

    window.TsukiPostpartumFeedingIntelligence = {
      installed: true,
      version: MODULE_VERSION,
      activate,
      render,
      store,
      maternalSafety,
      babySafety,
      feedingInsights,
      recoveryInsights,
      togetherInsights,
      postpartumStage,
      cycleReturnGuidance
    };
  }

  install();
})();
