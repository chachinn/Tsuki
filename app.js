/* ============================================================
   TSUKI 🌙 — VERSION 1.0 PRE-RELEASE
   BODY SIGNALS + ADAPTIVE PERSONAL INTELLIGENCE
   ============================================================ */

const STORAGE_KEY = "tsuki-data-v4";
const BUILD3_STORAGE_KEY = "tsuki-data-v3";
const BUILD2_STORAGE_KEY = "tsuki-data-v2";
const LEGACY_STORAGE_KEY = "tsuki-data-v1";
const APP_LOCK_STORAGE_KEY = "tsuki-app-lock-v1";
const APP_VERSION = "1.0.0";
const APP_CACHE_NAME = "tsuki-cache-v1-pre-postpartum-feed-6";
const TUTORIAL_STORAGE_KEY = "tsuki-tutorial-complete-v1";
const WHATS_NEW_STORAGE_KEY = "tsuki-whats-new-seen-v1";
const RECOVERY_ASSET_KEY = "tsuki-last-good-data-v1";

const RELEASE_NOTES = [
  { icon: "🤱", title: "Postpartum & Feeding Intelligence", text: "A dedicated postpartum mode now connects recovery, breastfeeding/pumping or other feeding plans, baby observations, return-of-cycle tracking and source-backed safety support." },
  { icon: "🤍", title: "Care Hub & women’s health support", text: "Activity, medicine/vitamin routines, appointments, baby-care guidance and safety-aware suggestions now come together without changing cycle or pregnancy dating." },
  { icon: "💕", title: "Sexual activity & pregnancy context", text: "Optional private sexual-activity tracking can add pregnancy-possibility, testing and time-sensitive follow-up context without changing period forecasts." },
  { icon: "◐", title: "Pregnancy possibility, not safe days", text: "Tsuki can show Lower, Uncertain or Higher estimated pregnancy possibility, but never labels unprotected sex safe and stays conservative for irregular cycles." },
  { icon: "🧠", title: "Adaptive intelligence", text: "Tsuki learns how your own body patterns unfold over time instead of relying only on cycle-day averages." },
  { icon: "🌙", title: "Signal sequences", text: "Repeated personal lead-up sequences can show which body change tends to appear first and what commonly follows next." },
  { icon: "🪞", title: "My Normal 2.0", text: "Your ordinary baseline helps Tsuki notice what is different for you without calling it abnormal." },
  { icon: "🌦️", title: "Body Signal Weather", text: "Familiar clues and patterns summarize current evidence without inventing a period date." },
  { icon: "🧩", title: "Pattern families & drift", text: "Tsuki can recognize more than one recurring lead-up style and notice when personal signals change over time." },
  { icon: "💭", title: "Smarter questions", text: "Tsuki can ask one focused question when an answer would help distinguish a signal from missing data." },
  { icon: "✈️", title: "Context-aware learning", text: "Optional travel, illness, stress, sleep, treatment and routine context helps reduce false patterns." },
  { icon: "🩸", title: "Bleeding intelligence", text: "Tsuki summarizes recorded duration, flow, spotting lead-up and cramp timing while keeping unexpected bleeding separate." },
  { icon: "🛡️", title: "Private and explainable", text: "Adaptive analysis runs on this device. Missing check-ins stay unknown, Pregnancy remains isolated, and symptoms never rewrite forecast dates." }
];


/* ============================================================
   HELPERS
   ============================================================ */

function uid() {
  if (crypto?.randomUUID) {
    return crypto.randomUUID();
  }

  return `tsuki-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}


function clone(value) {
  return JSON.parse(JSON.stringify(value));
}


function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value);
  }
  if (typeof value !== "string") return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const result = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(result.getTime()) ? null : result;
}


function todayKey() {
  return dateKey(new Date());
}


function addDays(date, amount) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);

  return result;
}


function daysBetween(earlier, later) {
  const a = new Date(
    earlier.getFullYear(),
    earlier.getMonth(),
    earlier.getDate()
  );

  const b = new Date(
    later.getFullYear(),
    later.getMonth(),
    later.getDate()
  );

  return Math.round((b - a) / 86400000);
}


function formatDate(date) {
  if (!date) return "—";

  return date.toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric"
    }
  );
}


function formatDateLong(date) {
  if (!date) return "—";

  return date.toLocaleDateString(
    undefined,
    {
      month: "long",
      day: "numeric",
      year: "numeric"
    }
  );
}


function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function average(numbers) {
  if (!numbers.length) return null;

  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}


function standardDeviation(numbers) {
  if (numbers.length < 2) return 0;

  const mean = average(numbers);

  const squared = numbers.map(
    number => Math.pow(number - mean, 2)
  );

  return Math.sqrt(
    squared.reduce((sum, value) => sum + value, 0) / numbers.length
  );
}


/* ============================================================
   DEFAULT DATA
   ============================================================ */

const defaultData = {

  schemaVersion: 7.3,

  mode: "cycle",

  settings: {
    cycleLength: 28,
    periodLength: 5,
    sakura: true,
    reduceMotion: false,
    hideDetails: false,
    discreet: true,
    quietInterface: false,
    theme: "sakura",
    wallpaperEnabled: false,
    wallpaperOverlay: "medium",
    wallpaperPosition: "center",
    predictionMode: "typical",
    weekStart: "sunday",
    textSize: "normal",
    density: "comfortable",
    customAccent: "",
    customGreeting: "",
    seasonalRoom: true,
    todayOrder: ["checkin", "forecast", "insights", "companion"],
    todayHidden: []
  },

  periods: [],

  logs: {},

  relief: [],

  journal: [],

  trips: [],

  customSymptoms: [],

  gardenState: { plantedCycleIds: [] },

  meta: { lastBackupAt: "" },

  pregnancy: {
    active: false,
    id: "",
    startedAt: "",
    datingMethod: "",
    lmp: "",
    edd: "",
    clinicianConfirmed: false,
    transferDate: "",
    embryoAge: 5,
    babyNickname: "",
    logs: {},
    appointments: [],
    questions: [],
    medications: [],
    tests: [],
    journal: [],
    photos: [],
    careTeam: { provider: "", contact: "", hospital: "", emergencyContact: "" },
    hospitalBag: [
      { id: "preg-bag-me-1", category: "For me", name: "Comfortable clothes", packed: false },
      { id: "preg-bag-me-2", category: "For me", name: "Toiletries", packed: false },
      { id: "preg-bag-baby-1", category: "For baby", name: "Going-home clothes", packed: false },
      { id: "preg-bag-baby-2", category: "For baby", name: "Blanket", packed: false },
      { id: "preg-bag-doc-1", category: "Documents", name: "IDs / hospital documents", packed: false },
      { id: "preg-bag-partner-1", category: "For partner", name: "Phone charger", packed: false }
    ],
    birthPreferences: { facility: "", support: "", comfort: "", pain: "", questions: "", notes: "" },
    gardenMilestones: [],
    modules: {
      vaccinations: true,
      bloodPressure: false,
      glucose: false,
      wellbeing: true,
      movementJournal: true,
      contractions: false,
      fluidNotes: false,
      multiples: false,
      documents: true,
      reminders: true
    },
    healthProfile: { bloodType: "", rh: "", allergies: "", conditions: "", priorPregnancies: "", providerInstructions: "" },
    vaccinations: [],
    bpReadings: [],
    glucoseReadings: [],
    wellbeing: [],
    movementJournal: [],
    contractions: [],
    fluidNotes: [],
    reminders: [],
    documents: [],
    postpartumPrep: [
      { id: "pp-prep-1", name: "Postpartum care contact / follow-up plan", done: false },
      { id: "pp-prep-2", name: "Support person / help plan", done: false },
      { id: "pp-prep-3", name: "Recovery supplies", done: false },
      { id: "pp-prep-4", name: "Feeding questions for my care team", done: false },
      { id: "pp-prep-5", name: "Mental-health support plan / contacts", done: false },
      { id: "pp-prep-6", name: "Pediatric care notes", done: false }
    ],
    babyCount: 1,
    babyNames: [""],
    babySizeTheme: "fruit",
    companionOutfit: "classic",
    fun: {
      memoryJar: [], weirdMoments: [], cravings: [], aversions: [], playlists: [],
      babyNames: [], wishlist: [], nursery: [], gifts: [], whoKnows: [], announcements: [],
      nicknameHistory: [], dreams: [], partnerTasks: [], guesses: []
    },
    endedAt: "",
    outcome: ""
  },

  pregnancyHistory: [],

  postpartum: { active: false, birthDate: "", pregnancyId: "" },

  careProfile: {
    options: [],
    message: ""
  },

  insightState: {
    saved: [],
    dismissed: []
  },

  periodKit: [
    {
      id: uid(),
      name: "Pads / liners",
      packed: true
    },
    {
      id: uid(),
      name: "Pain relief",
      packed: true
    },
    {
      id: uid(),
      name: "Heat pack",
      packed: true
    },
    {
      id: uid(),
      name: "Water bottle",
      packed: false
    },
    {
      id: uid(),
      name: "Spare underwear",
      packed: false
    },
    {
      id: uid(),
      name: "Wet wipes",
      packed: false
    },
    {
      id: uid(),
      name: "Snacks",
      packed: false
    }
  ]

};


/* ============================================================
   MIGRATION + STORAGE
   ============================================================ */

function normalizeData(parsed) {
  return {
    ...clone(defaultData),
    ...(parsed || {}),
    schemaVersion: 7.3,
    mode: ["cycle", "pregnancy", "postpartum"].includes(parsed?.mode) ? parsed.mode : "cycle",
    settings: {
      ...defaultData.settings,
      ...(parsed?.settings || {})
    },
    pregnancy: {
      ...defaultData.pregnancy,
      ...(parsed?.pregnancy || {}),
      logs: parsed?.pregnancy?.logs || {},
      appointments: Array.isArray(parsed?.pregnancy?.appointments) ? parsed.pregnancy.appointments : [],
      questions: Array.isArray(parsed?.pregnancy?.questions) ? parsed.pregnancy.questions : [],
      medications: Array.isArray(parsed?.pregnancy?.medications) ? parsed.pregnancy.medications : [],
      tests: Array.isArray(parsed?.pregnancy?.tests) ? parsed.pregnancy.tests : [],
      journal: Array.isArray(parsed?.pregnancy?.journal) ? parsed.pregnancy.journal : [],
      photos: Array.isArray(parsed?.pregnancy?.photos) ? parsed.pregnancy.photos : [],
      hospitalBag: Array.isArray(parsed?.pregnancy?.hospitalBag) && parsed.pregnancy.hospitalBag.length ? parsed.pregnancy.hospitalBag : clone(defaultData.pregnancy.hospitalBag),
      careTeam: { ...defaultData.pregnancy.careTeam, ...(parsed?.pregnancy?.careTeam || {}) },
      birthPreferences: { ...defaultData.pregnancy.birthPreferences, ...(parsed?.pregnancy?.birthPreferences || {}) },
      gardenMilestones: Array.isArray(parsed?.pregnancy?.gardenMilestones) ? parsed.pregnancy.gardenMilestones : [],
      modules: { ...defaultData.pregnancy.modules, ...(parsed?.pregnancy?.modules || {}) },
      healthProfile: { ...defaultData.pregnancy.healthProfile, ...(parsed?.pregnancy?.healthProfile || {}) },
      vaccinations: Array.isArray(parsed?.pregnancy?.vaccinations) ? parsed.pregnancy.vaccinations : [],
      bpReadings: Array.isArray(parsed?.pregnancy?.bpReadings) ? parsed.pregnancy.bpReadings : [],
      glucoseReadings: Array.isArray(parsed?.pregnancy?.glucoseReadings) ? parsed.pregnancy.glucoseReadings : [],
      wellbeing: Array.isArray(parsed?.pregnancy?.wellbeing) ? parsed.pregnancy.wellbeing : [],
      movementJournal: Array.isArray(parsed?.pregnancy?.movementJournal) ? parsed.pregnancy.movementJournal : [],
      contractions: Array.isArray(parsed?.pregnancy?.contractions) ? parsed.pregnancy.contractions : [],
      fluidNotes: Array.isArray(parsed?.pregnancy?.fluidNotes) ? parsed.pregnancy.fluidNotes : [],
      reminders: Array.isArray(parsed?.pregnancy?.reminders) ? parsed.pregnancy.reminders : [],
      documents: Array.isArray(parsed?.pregnancy?.documents) ? parsed.pregnancy.documents : [],
      postpartumPrep: Array.isArray(parsed?.pregnancy?.postpartumPrep) && parsed.pregnancy.postpartumPrep.length ? parsed.pregnancy.postpartumPrep : clone(defaultData.pregnancy.postpartumPrep),
      babyCount: Math.max(1, Math.min(4, Number(parsed?.pregnancy?.babyCount || 1))),
      babyNames: Array.isArray(parsed?.pregnancy?.babyNames) ? parsed.pregnancy.babyNames : [""],
      babySizeTheme: ["fruit","japanese","flowers","moon","cute"].includes(parsed?.pregnancy?.babySizeTheme) ? parsed.pregnancy.babySizeTheme : "fruit",
      companionOutfit: ["classic","ribbon","pajamas","star","blanket"].includes(parsed?.pregnancy?.companionOutfit) ? parsed.pregnancy.companionOutfit : "classic",
      fun: {
        ...defaultData.pregnancy.fun,
        ...(parsed?.pregnancy?.fun || {}),
        memoryJar: Array.isArray(parsed?.pregnancy?.fun?.memoryJar) ? parsed.pregnancy.fun.memoryJar : [],
        weirdMoments: Array.isArray(parsed?.pregnancy?.fun?.weirdMoments) ? parsed.pregnancy.fun.weirdMoments : [],
        cravings: Array.isArray(parsed?.pregnancy?.fun?.cravings) ? parsed.pregnancy.fun.cravings : [],
        aversions: Array.isArray(parsed?.pregnancy?.fun?.aversions) ? parsed.pregnancy.fun.aversions : [],
        playlists: Array.isArray(parsed?.pregnancy?.fun?.playlists) ? parsed.pregnancy.fun.playlists : [],
        babyNames: Array.isArray(parsed?.pregnancy?.fun?.babyNames) ? parsed.pregnancy.fun.babyNames : [],
        wishlist: Array.isArray(parsed?.pregnancy?.fun?.wishlist) ? parsed.pregnancy.fun.wishlist : [],
        nursery: Array.isArray(parsed?.pregnancy?.fun?.nursery) ? parsed.pregnancy.fun.nursery : [],
        gifts: Array.isArray(parsed?.pregnancy?.fun?.gifts) ? parsed.pregnancy.fun.gifts : [],
        whoKnows: Array.isArray(parsed?.pregnancy?.fun?.whoKnows) ? parsed.pregnancy.fun.whoKnows : [],
        announcements: Array.isArray(parsed?.pregnancy?.fun?.announcements) ? parsed.pregnancy.fun.announcements : [],
        nicknameHistory: Array.isArray(parsed?.pregnancy?.fun?.nicknameHistory) ? parsed.pregnancy.fun.nicknameHistory : [],
        dreams: Array.isArray(parsed?.pregnancy?.fun?.dreams) ? parsed.pregnancy.fun.dreams : [],
        partnerTasks: Array.isArray(parsed?.pregnancy?.fun?.partnerTasks) ? parsed.pregnancy.fun.partnerTasks : [],
        guesses: Array.isArray(parsed?.pregnancy?.fun?.guesses) ? parsed.pregnancy.fun.guesses : []
      }
    },
    pregnancyHistory: Array.isArray(parsed?.pregnancyHistory) ? parsed.pregnancyHistory : [],
    postpartum: { ...defaultData.postpartum, ...(parsed?.postpartum || {}) },
    periods:
      Array.isArray(parsed?.periods)
        ? parsed.periods
        : [],
    logs:
      parsed?.logs || {},
    relief:
      parsed?.relief || [],
    journal:
      parsed?.journal || [],
    trips:
      Array.isArray(parsed?.trips) ? parsed.trips : [],
    customSymptoms:
      Array.isArray(parsed?.customSymptoms) ? parsed.customSymptoms : [],
    gardenState: {
      plantedCycleIds: Array.isArray(parsed?.gardenState?.plantedCycleIds) ? parsed.gardenState.plantedCycleIds : []
    },
    meta: {
      ...defaultData.meta,
      ...(parsed?.meta || {})
    },
    careProfile: {
      ...defaultData.careProfile,
      ...(parsed?.careProfile || {}),
      options:
        Array.isArray(parsed?.careProfile?.options)
          ? parsed.careProfile.options
          : []
    },
    insightState: {
      saved:
        Array.isArray(parsed?.insightState?.saved)
          ? parsed.insightState.saved
          : [],
      dismissed:
        Array.isArray(parsed?.insightState?.dismissed)
          ? parsed.insightState.dismissed
          : []
    },
    periodKit:
      parsed?.periodKit ||
      clone(defaultData.periodKit)
  };
}


function migrateBuild1(oldData) {
  const migrated = {
    ...clone(defaultData),
    ...oldData,
    schemaVersion: 7.3,
    settings: {
      ...defaultData.settings,
      ...(oldData.settings || {})
    },
    periods: [],
    insightState: {
      saved: [],
      dismissed: []
    }
  };

  const periodStarts =
    Array.isArray(oldData.periodStarts)
      ? oldData.periodStarts
      : [];

  migrated.periods =
    periodStarts.map(start => {
      const startDate =
        parseDate(start);

      const endDate =
        startDate
          ? addDays(
              startDate,
              Math.max(
                1,
                Number(
                  oldData.settings?.periodLength || 5
                )
              ) - 1
            )
          : null;

      return {
        id: uid(),
        start,
        end:
          endDate
            ? dateKey(endDate)
            : ""
      };
    });

  delete migrated.periodStarts;

  return normalizeData(migrated);
}


function loadData() {
  try {
    const build4Saved =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (build4Saved) {
      return normalizeData(
        JSON.parse(build4Saved)
      );
    }

    const build3Saved =
      localStorage.getItem(
        BUILD3_STORAGE_KEY
      );

    if (build3Saved) {
      const migrated =
        normalizeData(
          JSON.parse(build3Saved)
        );

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(migrated)
      );

      return migrated;
    }

    const build2Saved =
      localStorage.getItem(
        BUILD2_STORAGE_KEY
      );

    if (build2Saved) {
      const migrated =
        normalizeData(
          JSON.parse(build2Saved)
        );

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(migrated)
      );

      return migrated;
    }

    const legacySaved =
      localStorage.getItem(
        LEGACY_STORAGE_KEY
      );

    if (legacySaved) {
      const migrated =
        migrateBuild1(
          JSON.parse(legacySaved)
        );

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(migrated)
      );

      return migrated;
    }

    return clone(defaultData);
  }
  catch (error) {
    console.error("Could not load Tsuki data:", error);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) localStorage.setItem("tsuki-recovery-raw-v1", raw);
      localStorage.setItem("tsuki-recovery-needed", "1");
    } catch (_) {}
    return clone(defaultData);
  }
}


let lastSavedSnapshot = "";
let recoverySnapshotTimer = null;
let lastRecoverySnapshotAt = 0;

function scheduleRecoverySnapshot(serialized) {
  const now = Date.now();
  if (now - lastRecoverySnapshotAt < 120000) return;
  clearTimeout(recoverySnapshotTimer);
  recoverySnapshotTimer = setTimeout(async () => {
    try {
      await appearanceAssetSet(RECOVERY_ASSET_KEY, serialized);
      lastRecoverySnapshotAt = Date.now();
    }
    catch (_) {
      // Recovery snapshots are best-effort and must never block a normal save.
    }
  }, 900);
}

function saveData() {
  data.schemaVersion = 7.3;
  try {
    const serialized = JSON.stringify(data);
    if (serialized === lastSavedSnapshot) return true;
    localStorage.setItem(STORAGE_KEY, serialized);
    lastSavedSnapshot = serialized;
    scheduleRecoverySnapshot(serialized);
    return true;
  }
  catch (error) {
    console.error("Could not save Tsuki data:", error);
    try { showToast("Tsuki couldn't save that change. Storage on this device may be full."); } catch (_) {}
    return false;
  }
}


let data = loadData();
let calendarDate = new Date();
let toastTimer;
let insightView = "all";


/* ============================================================
   PERIOD ENGINE
   ============================================================ */

function validPeriods() {
  return data.periods
    .filter(period => parseDate(period.start))
    .sort(
      (a, b) =>
        parseDate(a.start) -
        parseDate(b.start)
    );
}


function latestPeriod() {
  const periods = validPeriods();

  return periods.length
    ? periods[periods.length - 1]
    : null;
}


function periodDuration(period) {
  if (!period?.start) return null;

  const start = parseDate(period.start);

  if (!period.end) {
    return null;
  }

  const end = parseDate(period.end);

  if (!start || !end || end < start) {
    return null;
  }

  return daysBetween(start, end) + 1;
}


function completedPeriodDurations() {
  return validPeriods()
    .map(periodDuration)
    .filter(
      value =>
        Number.isFinite(value) &&
        value >= 1 &&
        value <= 15
    );
}


function averagePeriodLength() {
  const durations =
    completedPeriodDurations();

  if (!durations.length) {
    return Number(
      data.settings.periodLength
    ) || 5;
  }

  return Math.round(
    average(durations)
  );
}


function assumedPeriodEnd(startValue) {
  const start =
    typeof startValue === "string"
      ? parseDate(startValue)
      : startValue;

  if (!start) return null;

  const configuredLength =
    Math.max(
      1,
      Number(data.settings.periodLength) ||
      averagePeriodLength()
    );

  return addDays(
    start,
    configuredLength - 1
  );
}


function ensurePeriodEnd(startValue, endValue = "") {
  if (endValue) return endValue;

  const assumed = assumedPeriodEnd(startValue);
  return assumed ? dateKey(assumed) : "";
}


function numberRange(values) {
  const clean = values.filter(Number.isFinite);
  if (!clean.length) return null;
  return {
    min: Math.min(...clean),
    max: Math.max(...clean)
  };
}


function cycleIntervals() {
  const periods = validPeriods();
  const intervals = [];

  for (
    let i = 1;
    i < periods.length;
    i++
  ) {
    const previous =
      parseDate(periods[i - 1].start);

    const current =
      parseDate(periods[i].start);

    const difference =
      daysBetween(previous, current);

    if (
      difference >= 15 &&
      difference <= 60
    ) {
      intervals.push(difference);
    }
  }

  return intervals;
}


function averageCycleLength() {
  const intervals =
    cycleIntervals();

  if (!intervals.length) {
    return Number(
      data.settings.cycleLength
    ) || 28;
  }

  return Math.round(
    average(intervals)
  );
}


function typicalCycleLength() {
  const configured = Number(data.settings.cycleLength);

  if (Number.isFinite(configured) && configured >= 15 && configured <= 60) {
    return Math.round(configured);
  }

  return 28;
}


function cycleVariability() {
  const intervals =
    cycleIntervals();

  if (intervals.length < 2) {
    return null;
  }

  return Math.round(
    standardDeviation(intervals) * 10
  ) / 10;
}


function predictionConfidence() {
  const intervals =
    cycleIntervals();

  if (intervals.length < 2) {
    return {
      level: "Low",
      className: "confidence-low",
      reason: "Needs more cycle history"
    };
  }

  const variability =
    standardDeviation(intervals);

  if (
    intervals.length >= 5 &&
    variability <= 2.5
  ) {
    return {
      level: "High",
      className: "confidence-high",
      reason: "Several consistent cycles"
    };
  }

  if (
    intervals.length >= 3 &&
    variability <= 5
  ) {
    return {
      level: "Medium",
      className: "confidence-medium",
      reason: "Some consistent history"
    };
  }

  return {
    level: "Low",
    className: "confidence-low",
    reason: "Cycles vary more"
  };
}


function predictionPaddingDays() {
  const intervals =
    cycleIntervals();

  if (intervals.length < 2) {
    return 3;
  }

  const variability =
    standardDeviation(intervals);

  return Math.min(
    7,
    Math.max(
      2,
      Math.ceil(variability)
    )
  );
}


function currentCycleDay() {
  const period =
    latestPeriod();

  if (!period) return null;

  const start =
    parseDate(period.start);

  const difference =
    daysBetween(
      start,
      new Date()
    );

  if (difference < 0) {
    return null;
  }

  return difference + 1;
}



function cycleDayForDate(dateValue) {
  const target = typeof dateValue === "string"
    ? parseDate(dateValue)
    : dateValue;

  if (!target) return null;

  const periods = validPeriods()
    .filter(period => parseDate(period.start) <= target);

  if (!periods.length) return null;

  const anchor = periods[periods.length - 1];
  const start = parseDate(anchor.start);
  const difference = daysBetween(start, target);

  return difference >= 0 ? difference + 1 : null;
}


function cycleTimingForDate(dateValue) {
  const target = typeof dateValue === "string"
    ? parseDate(dateValue)
    : dateValue;

  if (!target) return null;

  const periods = validPeriods();
  let anchorIndex = -1;

  for (let index = 0; index < periods.length; index++) {
    const start = parseDate(periods[index].start);
    if (start && start <= target) anchorIndex = index;
  }

  if (anchorIndex < 0) return null;

  const anchor = periods[anchorIndex];
  const start = parseDate(anchor.start);
  const nextSaved = periods[anchorIndex + 1];
  const nextStart = nextSaved
    ? parseDate(nextSaved.start)
    : addDays(start, forecastCycleLength());

  if (!start || !nextStart) return null;

  // Calendar-only ovulation timing is an estimate. ACOG notes that ovulation
  // commonly occurs about 14 days before the next period, rather than always
  // on cycle day 14. Tsuki uses a small ±1 day visual window around that date.
  const estimatedOvulation = addDays(nextStart, -14);
  const ovulationWindowStart = addDays(estimatedOvulation, -1);
  const ovulationWindowEnd = addDays(estimatedOvulation, 1);

  return {
    start,
    nextStart,
    estimatedOvulation,
    ovulationWindowStart,
    ovulationWindowEnd
  };
}


function phaseForDate(dateValue) {
  const key = typeof dateValue === "string"
    ? dateValue
    : dateKey(dateValue);

  if (periodForDate(key)) {
    return "Period";
  }

  const target = parseDate(key);
  const timing = cycleTimingForDate(key);
  if (!target || !timing) return "No cycle yet";

  if (target < timing.ovulationWindowStart) {
    return "Follicular phase";
  }

  if (target <= timing.ovulationWindowEnd) {
    return "Estimated ovulation";
  }

  return "Luteal phase";
}


function periodCountdownText() {
  const estimate = nextEstimatedPeriodDate();
  if (!estimate) return "Tsuki is still learning your timing";

  const today = parseDate(todayKey());
  const difference = daysBetween(today, estimate);

  if (difference > 1) return `Period in ${difference} days`;
  if (difference === 1) return "Period in 1 day";
  if (difference === 0) return "Period expected today";

  const lateBy = Math.abs(difference);
  return `Period is ${lateBy} day${lateBy === 1 ? "" : "s"} later than expected`;
}


function recentAverageCycleLength() {
  const intervals = cycleIntervals().slice(-3);
  if (!intervals.length) return typicalCycleLength();
  return Math.max(15, Math.min(60, Math.round(average(intervals))));
}

function forecastCycleLength() {
  return data.settings.predictionMode === "recentAverage"
    ? recentAverageCycleLength()
    : typicalCycleLength();
}

function nextEstimatedPeriodDate() {
  const period =
    latestPeriod();

  if (!period) return null;

  const start =
    parseDate(period.start);

  return addDays(
    start,
    forecastCycleLength()
  );
}


function estimatedWindow() {
  const estimate =
    nextEstimatedPeriodDate();

  if (!estimate) return null;

  const padding =
    predictionPaddingDays();

  return {
    center: estimate,
    start:
      addDays(
        estimate,
        -padding
      ),
    end:
      addDays(
        estimate,
        padding
      ),
    padding
  };
}


function calendarPredictionWindows(monthsAhead = 12) {
  const period = latestPeriod();
  if (!period) return [];

  const anchor = parseDate(period.start);
  if (!anchor) return [];

  const cycleLength = forecastCycleLength();
  const padding = predictionPaddingDays();
  const horizon = new Date(anchor.getFullYear(), anchor.getMonth() + monthsAhead, anchor.getDate());
  const windows = [];

  // Every future estimate is anchored to the latest ACTUAL period start.
  // If a period arrives late and the user logs that later start date,
  // latestPeriod() changes and the entire forecast automatically shifts.
  let center = addDays(anchor, cycleLength);
  let guard = 0;

  while (center <= horizon && guard < 24) {
    windows.push({
      center,
      start: addDays(center, -padding),
      end: addDays(center, padding),
      padding
    });

    center = addDays(center, cycleLength);
    guard += 1;
  }

  return windows;
}


function dateInAnyPredictionWindow(date, windows) {
  return windows.some(window => dateWithin(date, window.start, window.end));
}


function isLatePeriod() {
  const estimate =
    estimatedWindow();

  if (!estimate) return false;

  const today =
    parseDate(todayKey());

  return today > estimate.end;
}


function cyclePhase(day) {
  if (!day) {
    return "Log your period to begin";
  }

  const periodLength = averagePeriodLength();
  const cycleLength = averageCycleLength();
  const estimatedOvulationDay = Math.max(periodLength + 1, cycleLength - 14);

  if (day <= periodLength) {
    return "Period";
  }

  if (day < estimatedOvulationDay - 1) {
    return "Follicular phase";
  }

  if (day <= estimatedOvulationDay + 1) {
    return "Estimated ovulation";
  }

  return "Luteal phase";
}


function periodForDate(dateValue) {
  const date =
    parseDate(dateValue);

  if (!date) return null;

  return validPeriods().find(period => {
    const start =
      parseDate(period.start);

    const end = period.end
      ? parseDate(period.end)
      : addDays(
          start,
          averagePeriodLength() - 1
        );

    return (
      date >= start &&
      date <= end
    );
  }) || null;
}


/* ============================================================
   NAVIGATION
   ============================================================ */

function resolveModeScreen(name) {
  if (data.mode === "pregnancy" && data.pregnancy?.active) {
    const map = {
      today: "pregnancy-today",
      calendar: "pregnancy-calendar",
      insights: "pregnancy-journey",
      log: "pregnancy-log",
      journal: "pregnancy-journal",
      "going-out": "pregnancy-care"
    };
    return map[name] || name;
  }

  if (data.mode === "postpartum" && data.postpartum?.active) {
    if (["today", "pregnancy-today"].includes(name)) return "postpartum-today";
    if (name === "insights") return "postpartum-today";
  }

  return name;
}

function showScreen(name) {
  if (typeof closeAppDrawer === "function") closeAppDrawer();
  if (typeof closeQuickAdd === "function") closeQuickAdd();

  let resolvedName = resolveModeScreen(name);
  const allScreens = Array.from(document.querySelectorAll(".screen"));
  if (!allScreens.some(screen => screen.dataset.screen === resolvedName)) {
    console.warn(`Tsuki ignored unknown screen: ${resolvedName}`);
    resolvedName = data.mode === "pregnancy" && data.pregnancy?.active
      ? "pregnancy-today"
      : data.mode === "postpartum" && data.postpartum?.active
        ? "postpartum-today"
        : "today";
  }

  allScreens.forEach(screen => {
      screen.classList.toggle(
        "active",
        screen.dataset.screen === resolvedName
      );
    });

  document
    .querySelectorAll(".nav-button")
    .forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.screenTarget === resolvedName
      );
    });

  window.scrollTo({
    top: 0,
    behavior:
      data.settings.reduceMotion
        ? "auto"
        : "smooth"
  });

  if (resolvedName === "calendar") renderCalendar();
  if (resolvedName === "cycle-history") renderCycleHistory();
  if (resolvedName === "insights") renderInsights();
  if (resolvedName === "relief") renderRelief();
  if (resolvedName === "journal") renderJournal();
  if (resolvedName === "kit") renderKit();
  if (resolvedName === "going-out") renderGoingOut();
  if (resolvedName === "past-moons") renderPastMoons();
  if (resolvedName === "reports") renderReports();
  if (resolvedName === "care-profile") renderCareProfile();
  if (resolvedName === "me") renderLifeModeUI();
  if (resolvedName === "moon-room") renderMoonRoom();
  if (resolvedName === "moon-garden") renderMoonGarden();
  if (resolvedName === "moon-year") renderMoonYear();
  if (resolvedName === "pregnancy-today") renderPregnancyToday();
  if (resolvedName === "pregnancy-calendar") renderPregnancyCalendar();
  if (resolvedName === "pregnancy-log") loadPregnancyLogForm();
  if (resolvedName === "pregnancy-journey") renderPregnancyJourney();
  if (resolvedName === "pregnancy-care") renderPregnancyCare();
  if (resolvedName === "pregnancy-journal") renderPregnancyJournal();
  if (resolvedName === "pregnancy-photos") renderPregnancyPhotos();
  if (resolvedName === "pregnancy-hospital") renderPregnancyHospitalBag();
  if (resolvedName === "pregnancy-preferences") renderBirthPreferences();
  if (resolvedName === "pregnancy-garden") renderPregnancyGarden();
  if (resolvedName === "pregnancy-dashboard") renderPregnancyDashboard();
  if (resolvedName === "pregnancy-health") renderPregnancyHealth();
  if (resolvedName === "pregnancy-planner") renderPregnancyPlanner();
  if (resolvedName === "pregnancy-fun") renderPregnancyFun();
  if (resolvedName === "pregnancy-story") renderPregnancyStory();
  if (resolvedName === "postpartum-today") renderPostpartumToday();
}



document
  .querySelectorAll("[data-screen-target]")
  .forEach(button => {
    button.addEventListener(
      "click",
      () =>
        showScreen(
          button.dataset.screenTarget
        )
    );
  });


document
  .querySelectorAll("[data-open-screen]")
  .forEach(button => {
    button.addEventListener(
      "click",
      () =>
        showScreen(
          button.dataset.openScreen
        )
    );
  });


/* ============================================================
   BUILD 4.3 — DRAWER + QUICK ADD
   ============================================================ */

const appDrawer = document.getElementById("appDrawer");
const drawerBackdrop = document.getElementById("drawerBackdrop");
const menuButton = document.getElementById("menuButton");

function openAppDrawer() {
  if (!appDrawer || !drawerBackdrop) return;
  appDrawer.classList.add("open");
  drawerBackdrop.classList.remove("hidden");
  appDrawer.setAttribute("aria-hidden", "false");
  drawerBackdrop.setAttribute("aria-hidden", "false");
  menuButton?.setAttribute("aria-expanded", "true");
  document.body.classList.add("drawer-open");
}

function closeAppDrawer() {
  if (!appDrawer || !drawerBackdrop) return;
  appDrawer.classList.remove("open");
  drawerBackdrop.classList.add("hidden");
  appDrawer.setAttribute("aria-hidden", "true");
  drawerBackdrop.setAttribute("aria-hidden", "true");
  menuButton?.setAttribute("aria-expanded", "false");
  document.body.classList.remove("drawer-open");
}

menuButton?.addEventListener("click", openAppDrawer);
document.getElementById("closeMenuButton")?.addEventListener("click", closeAppDrawer);
drawerBackdrop?.addEventListener("click", closeAppDrawer);
appDrawer?.querySelectorAll("[data-open-screen]").forEach(button => {
  button.addEventListener("click", closeAppDrawer);
});

document.getElementById("drawerAppearance")?.addEventListener("click", () => {
  closeAppDrawer();
  openAppearanceModal();
});

const quickAddSheet = document.getElementById("quickAddSheet");
const quickAddBackdrop = document.getElementById("quickAddBackdrop");
const quickAddButton = document.getElementById("quickAddButton");

function openQuickAdd() {
  if (!quickAddSheet || !quickAddBackdrop) return;
  quickAddSheet.classList.add("open");
  quickAddBackdrop.classList.remove("hidden");
  quickAddSheet.setAttribute("aria-hidden", "false");
  quickAddBackdrop.setAttribute("aria-hidden", "false");
  quickAddButton?.setAttribute("aria-expanded", "true");
  document.body.classList.add("quick-sheet-open");
}

function closeQuickAdd() {
  if (!quickAddSheet || !quickAddBackdrop) return;
  quickAddSheet.classList.remove("open");
  quickAddBackdrop.classList.add("hidden");
  quickAddSheet.setAttribute("aria-hidden", "true");
  quickAddBackdrop.setAttribute("aria-hidden", "true");
  quickAddButton?.setAttribute("aria-expanded", "false");
  document.body.classList.remove("quick-sheet-open");
}

quickAddButton?.addEventListener("click", openQuickAdd);
document.getElementById("closeQuickAdd")?.addEventListener("click", closeQuickAdd);
quickAddBackdrop?.addEventListener("click", closeQuickAdd);

document.querySelectorAll("[data-quick-add]").forEach(button => {
  button.addEventListener("click", () => {
    const action = button.dataset.quickAdd;
    closeQuickAdd();

    if (action === "period") {
      openQuickPeriodEntry("single", todayKey());
      return;
    }

    const screens = {
      log: "log",
      "bad-day": "bad-day",
      relief: "relief",
      journal: "journal"
    };

    if (screens[action]) showScreen(screens[action]);
  });
});

document.getElementById("toggleTodayPatterns")?.addEventListener("click", event => {
  const details = document.getElementById("todayPatternDetails");
  const button = event.currentTarget;
  if (!details) return;
  const isOpening = details.classList.contains("hidden");
  details.classList.toggle("hidden", !isOpening);
  button.setAttribute("aria-expanded", String(isOpening));
  document.getElementById("todayPatternsChevron").textContent = isOpening ? "⌃" : "⌄";
});

document.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  closeAppDrawer();
  closeQuickAdd();
  closeQuickPeriodEntry();
});

/* ============================================================
   TODAY
   ============================================================ */

function renderToday() {
  const today = todayKey();
  const todayLog =
    data.logs[today] || {};

  const day =
    currentCycleDay();

  const cycleDayTitle =
    document.getElementById(
      "cycleDayTitle"
    );

  const cyclePhaseText =
    document.getElementById(
      "cyclePhaseText"
    );

  const todayCheckinQuestion =
    document.getElementById("todayCheckinQuestion");

  if (day) {
    cycleDayTitle.textContent =
      `Cycle Day ${day}`;

    cyclePhaseText.textContent =
      phaseForDate(today);
  }
  else {
    cycleDayTitle.textContent =
      "Start your first cycle";

    cyclePhaseText.textContent =
      "Log your most recent period to begin.";
  }

  if (todayCheckinQuestion) {
    todayCheckinQuestion.textContent = dailyQuestionForPhase(phaseForDate(today));
  }

  const estimate =
    estimatedWindow();

  const nextPeriodText =
    document.getElementById(
      "nextPeriodText"
    );

  if (estimate) {
    nextPeriodText.textContent =
      `${formatDate(estimate.start)} – ${formatDate(estimate.end)}`;
  }
  else {
    nextPeriodText.textContent =
      "Not enough data yet";
  }

  const countdown = document.getElementById("periodCountdownText");
  if (countdown) {
    countdown.textContent = periodCountdownText();
  }

  const confidence =
    predictionConfidence();

  const badge =
    document.getElementById(
      "predictionConfidence"
    );

  badge.textContent =
    `${confidence.level} confidence`;

  badge.className =
    `confidence-badge ${confidence.className}`;

  document
    .getElementById(
      "latePeriodNotice"
    )
    .classList.toggle(
      "hidden",
      !isLatePeriod()
    );

  document
    .getElementById("todayFlow")
    .textContent =
      todayLog.flow || "None";

  document
    .getElementById("todayMood")
    .textContent =
      todayLog.mood || "Not logged";

  document
    .getElementById("todayEnergy")
    .textContent =
      todayLog.energy || "Not logged";

  renderHomeInsights();
  renderSignatureToday();
  applyGentlePrepWindow();
}


/* ============================================================
   PERIOD QUICK START
   ============================================================ */

function startPeriodToday() {
  const today = todayKey();

  if (
    data.periods.some(
      period =>
        period.start === today
    )
  ) {
    showToast(
      "Today is already marked as a period start 🌙"
    );

    return;
  }

  if (
    !confirm(
      "Mark today as the first day of your period?"
    )
  ) {
    return;
  }

  data.periods.push({
    id: uid(),
    start: today,
    end: ensurePeriodEnd(today),
    context: "",
    nextMoonNote: ""
  });

  data.logs[today] = {
    ...(data.logs[today] || {}),
    flow:
      data.logs[today]?.flow ||
      "Medium",
    period: true
  };

  saveData();
  renderEverything();

  showToast(
    `New cycle started · ${Number(data.settings.periodLength) || averagePeriodLength()} days marked 🌙`
  );
}


document
  .getElementById(
    "badDayPeriodStart"
  )
  .addEventListener(
    "click",
    startPeriodToday
  );


/* ============================================================
   CYCLE HISTORY
   ============================================================ */


let periodCalendarMode = "start";
let periodCalendarAnchor = new Date();
let periodCalendarDraftStart = "";
let periodCalendarDraftEnd = "";


function configuredPeriodLength() {
  return Math.max(1, Number(data.settings.periodLength) || 5);
}


function formatPeriodRange(startValue, endValue) {
  const start = parseDate(startValue);
  const end = parseDate(endValue);

  if (!start) return "Choose period days";
  if (!end) return formatDateLong(start);

  const length = daysBetween(start, end) + 1;
  return `${formatDateLong(start)} – ${formatDateLong(end)} · ${length} day${length === 1 ? "" : "s"}`;
}


function updatePeriodRangeSummary() {
  const summary = document.getElementById("periodRangeSummary");
  const hint = document.getElementById("periodLengthHint");

  if (summary) {
    summary.textContent = formatPeriodRange(
      periodStartDate?.value || "",
      periodEndDate?.value || ""
    );
  }

  if (hint) {
    const length = configuredPeriodLength();
    hint.textContent = `New periods default to ${length} day${length === 1 ? "" : "s"}, based on Me → Typical period length.`;
  }
}


const periodStartDate =
  document.getElementById(
    "periodStartDate"
  );

const periodEndDate =
  document.getElementById(
    "periodEndDate"
  );

const editingPeriodId =
  document.getElementById(
    "editingPeriodId"
  );

const periodContext =
  document.getElementById(
    "periodContext"
  );

const periodContextCustom =
  document.getElementById(
    "periodContextCustom"
  );

periodContext.addEventListener(
  "change",
  () => {
    periodContextCustom.classList.toggle(
      "hidden",
      periodContext.value !== "Custom"
    );
  }
);

periodStartDate.addEventListener(
  "change",
  () => {
    if (!editingPeriodId.value && periodStartDate.value) {
      periodEndDate.value = ensurePeriodEnd(periodStartDate.value);
    }
  }
);


function resetPeriodForm() {
  editingPeriodId.value = "";
  periodStartDate.value = "";
  periodEndDate.value = "";
  periodContext.value = "";
  periodContextCustom.value = "";
  periodContextCustom.classList.add("hidden");
  updatePeriodRangeSummary();

  document
    .getElementById(
      "periodFormTitle"
    )
    .textContent =
      "Add a period";

  document
    .getElementById(
      "savePeriodButton"
    )
    .textContent =
      "Save period";

  document
    .getElementById(
      "cancelPeriodEdit"
    )
    .classList.add(
      "hidden"
    );
}


function validatePeriodDates(
  startValue,
  endValue
) {
  if (!startValue) {
    return "Choose a start date.";
  }

  const start =
    parseDate(startValue);

  if (endValue) {
    const end =
      parseDate(endValue);

    if (end < start) {
      return "The end date cannot be before the start date.";
    }

    const duration =
      daysBetween(
        start,
        end
      ) + 1;

    if (duration > 20) {
      return "That period is longer than 20 days. Please double-check the dates.";
    }
  }

  return "";
}


document
  .getElementById(
    "savePeriodButton"
  )
  .addEventListener(
    "click",
    () => {
      const start =
        periodStartDate.value;

      const end =
        ensurePeriodEnd(
          start,
          periodEndDate.value
        );

      const context =
        periodContext.value === "Custom"
          ? periodContextCustom.value.trim()
          : periodContext.value;

      const error =
        validatePeriodDates(
          start,
          end
        );

      if (error) {
        showToast(error);
        return;
      }

      const id =
        editingPeriodId.value;

      const duplicate =
        data.periods.find(
          period =>
            period.start === start &&
            period.id !== id
        );

      if (duplicate) {
        showToast(
          "You already have a period starting on that date."
        );

        return;
      }

      const newStartDate = parseDate(start);
      const newEndDate = parseDate(end);
      const overlap = data.periods.find(period => {
        if (period.id === id) return false;
        const existingStart = parseDate(period.start);
        const existingEnd = parseDate(period.end || ensurePeriodEnd(period.start));
        return existingStart && existingEnd && newStartDate <= existingEnd && newEndDate >= existingStart;
      });

      if (overlap) {
        showToast("Those dates overlap another saved period.");
        return;
      }

      if (id) {
        const period =
          data.periods.find(
            item =>
              item.id === id
          );

        if (period) {
          period.start = start;
          period.end = end;
          period.context = context;
        }
      }
      else {
        data.periods.push({
          id: uid(),
          start,
          end,
          context,
          nextMoonNote: ""
        });
      }

      saveData();

      resetPeriodForm();
      renderEverything();
      renderCycleHistory();

      showToast(
        id
          ? "Period updated 🌙"
          : "Period added 🌸"
      );
    }
  );


document
  .getElementById(
    "cancelPeriodEdit"
  )
  .addEventListener(
    "click",
    resetPeriodForm
  );


function editPeriod(id) {
  const period =
    data.periods.find(
      item =>
        item.id === id
    );

  if (!period) return;

  editingPeriodId.value =
    period.id;

  periodStartDate.value =
    period.start;

  periodEndDate.value =
    period.end || ensurePeriodEnd(period.start);

  updatePeriodRangeSummary();

  const knownContexts = [
    "", "Travel", "High Stress", "Illness",
    "Busy Month", "Poor Sleep", "Vacation"
  ];

  if (knownContexts.includes(period.context || "")) {
    periodContext.value = period.context || "";
    periodContextCustom.value = "";
    periodContextCustom.classList.add("hidden");
  } else {
    periodContext.value = "Custom";
    periodContextCustom.value = period.context || "";
    periodContextCustom.classList.remove("hidden");
  }

  document
    .getElementById(
      "periodFormTitle"
    )
    .textContent =
      "Edit period";

  document
    .getElementById(
      "savePeriodButton"
    )
    .textContent =
      "Update period";

  document
    .getElementById(
      "cancelPeriodEdit"
    )
    .classList.remove(
      "hidden"
    );

  window.scrollTo({
    top: 0,
    behavior:
      data.settings.reduceMotion
        ? "auto"
        : "smooth"
  });
}


function deletePeriod(id) {
  const period =
    data.periods.find(
      item =>
        item.id === id
    );

  if (!period) return;

  if (
    !confirm(
      `Delete the period starting ${formatDateLong(parseDate(period.start))}?`
    )
  ) {
    return;
  }

  data.periods =
    data.periods.filter(
      item =>
        item.id !== id
    );

  saveData();
  renderEverything();
  renderCycleHistory();

  showToast(
    "Period removed."
  );
}


function renderCycleHistory() {
  const container =
    document.getElementById(
      "periodHistoryList"
    );

  const periods =
    validPeriods()
      .slice()
      .reverse();

  if (!periods.length) {
    container.innerHTML = `
      <article class="soft-note">
        No periods logged yet. Add your most recent period above,
        then add older periods if you want Tsuki to learn your usual rhythm faster.
      </article>
    `;

    return;
  }

  const averageCycle =
    averageCycleLength();

  const averagePeriod =
    averagePeriodLength();

  const variability =
    cycleVariability();

  const summary = `
    <div class="cycle-stat-strip">

      <div>
        <small>Average cycle</small>
        <strong>${averageCycle} days</strong>
      </div>

      <div>
        <small>Average period</small>
        <strong>${averagePeriod} days</strong>
      </div>

      <div>
        <small>Variability</small>
        <strong>
          ${
            variability === null
              ? "Need more cycles"
              : `±${variability} days`
          }
        </strong>
      </div>

    </div>
  `;

  const cards =
    periods
      .map(
        (period, index) => {
          const start =
            parseDate(period.start);

          const end =
            period.end
              ? parseDate(period.end)
              : null;

          const duration =
            periodDuration(period);

          const nextOlder =
            periods[index + 1];

          let cycleLength =
            null;

          if (nextOlder) {
            cycleLength =
              daysBetween(
                parseDate(nextOlder.start),
                start
              );
          }

          return `
            <article class="period-history-card">

              <div class="period-history-top">

                <div>
                  <h4>
                    ${formatDateLong(start)}
                  </h4>

                  <p>
                    ${
                      end
                        ? `Ended ${formatDateLong(end)}`
                        : "Ongoing / end date not entered"
                    }
                  </p>

                  <p>
                    ${
                      duration
                        ? `${duration} period day${duration === 1 ? "" : "s"}`
                        : "Period length not final yet"
                    }
                    ${
                      cycleLength &&
                      cycleLength >= 15 &&
                      cycleLength <= 60
                        ? ` · ${cycleLength}-day cycle`
                        : ""
                    }
                  </p>
                  ${period.context ? `<span class="cycle-context-chip">${escapeHTML(period.context)}</span>` : ""}
                </div>

                <span>🌸</span>

              </div>

              <div class="period-history-actions">

                <button
                  class="edit-period"
                  data-period-edit="${period.id}"
                >
                  Edit
                </button>

                <button
                  class="delete-period"
                  data-period-delete="${period.id}"
                >
                  Delete
                </button>

              </div>

            </article>
          `;
        }
      )
      .join("");

  container.innerHTML =
    summary + cards;

  document
    .querySelectorAll(
      "[data-period-edit]"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () =>
            editPeriod(
              button.dataset.periodEdit
            )
        );
      }
    );

  document
    .querySelectorAll(
      "[data-period-delete]"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () =>
            deletePeriod(
              button.dataset.periodDelete
            )
        );
      }
    );
}




/* ============================================================
   BUILD 6.1.2 — MULTIPLE PERIODS PER MONTH
   ============================================================ */

let quickPeriodEntryMode = "single";
let quickPeriodSingleAnchor = new Date();
let quickPeriodSingleStart = "";
let quickPeriodSingleEnd = "";
let quickPeriodSingleEditingId = "";
let bulkPeriodAnchor = new Date();
let bulkPeriodDrafts = new Map();

function sameMonth(dateA, dateB) {
  return Boolean(dateA && dateB) &&
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth();
}

function monthKeyFromDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function periodsStartingInMonth(year, month) {
  return data.periods.filter(period => {
    const start = parseDate(period.start);
    return start && start.getFullYear() === year && start.getMonth() === month;
  });
}

function bulkDraftPeriods() {
  return Array.from(bulkPeriodDrafts.values()).map(start => ({
    start,
    end: ensurePeriodEnd(start)
  }));
}

function quickPeriodSelectionError(start, end, ignoreId = "", extraPeriods = []) {
  const basic = validatePeriodDates(start, end);
  if (basic) return basic;

  const startDate = parseDate(start);
  const endDate = parseDate(end);
  const candidates = [
    ...data.periods.filter(period => period.id !== ignoreId),
    ...extraPeriods
  ];

  const overlap = candidates.find(period => {
    const existingStart = parseDate(period.start);
    const existingEnd = parseDate(period.end || ensurePeriodEnd(period.start));
    return existingStart && existingEnd && startDate <= existingEnd && endDate >= existingStart;
  });

  return overlap ? "Those dates overlap another saved period." : "";
}

function setQuickPeriodEntryMode(mode) {
  quickPeriodEntryMode = mode === "bulk" ? "bulk" : "single";
  document.querySelectorAll("[data-period-entry-mode]").forEach(button => {
    button.classList.toggle("active", button.dataset.periodEntryMode === quickPeriodEntryMode);
  });
  document.getElementById("quickPeriodSinglePanel")?.classList.toggle("hidden", quickPeriodEntryMode !== "single");
  document.getElementById("quickPeriodBulkPanel")?.classList.toggle("hidden", quickPeriodEntryMode !== "bulk");
  document.getElementById("quickPeriodTitle").textContent = quickPeriodEntryMode === "bulk" ? "Add previous periods" : "Log your period";

  if (quickPeriodEntryMode === "single") renderQuickPeriodSingle();
  else renderBulkPeriodMonths();
}

function openQuickPeriodEntry(mode = "single", initialDate = "") {
  const modal = document.getElementById("quickPeriodModal");
  setBulkPeriodFeedback("");
  if (!modal) return;

  const initial = parseDate(initialDate) || new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
  quickPeriodSingleAnchor = new Date(initial.getFullYear(), initial.getMonth(), 1);
  bulkPeriodAnchor = new Date(initial.getFullYear(), initial.getMonth(), 1);
  if (bulkPeriodAnchor > new Date()) bulkPeriodAnchor = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  quickPeriodSingleStart = "";
  quickPeriodSingleEnd = "";
  quickPeriodSingleEditingId = "";
  bulkPeriodDrafts = new Map();

  if (initialDate) {
    const existing = periodForDate(initialDate);
    if (existing) {
      quickPeriodSingleEditingId = existing.id;
      quickPeriodSingleStart = existing.start;
      quickPeriodSingleEnd = existing.end || ensurePeriodEnd(existing.start);
      const existingStart = parseDate(existing.start);
      if (existingStart) quickPeriodSingleAnchor = new Date(existingStart.getFullYear(), existingStart.getMonth(), 1);
    }
  }

  const length = configuredPeriodLength();
  document.getElementById("quickPeriodDefaultBadge").textContent = `${length}-day default`;
  document.getElementById("bulkPeriodDefaultBadge").textContent = `${length}-day default`;

  setQuickPeriodEntryMode(mode);
  modal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeQuickPeriodEntry() {
  document.getElementById("quickPeriodModal")?.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

function renderQuickPeriodSingle() {
  const title = document.getElementById("quickPeriodMonthTitle");
  const grid = document.getElementById("quickPeriodSingleGrid");
  const summary = document.getElementById("quickPeriodSingleSummary");
  const saveButton = document.getElementById("quickPeriodSaveSingle");
  if (!title || !grid || !summary || !saveButton) return;

  const year = quickPeriodSingleAnchor.getFullYear();
  const month = quickPeriodSingleAnchor.getMonth();
  title.textContent = quickPeriodSingleAnchor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const firstDay = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const blanks = Array.from({ length: firstDay }, () => "<span></span>").join("");
  const selectedStart = parseDate(quickPeriodSingleStart);
  const selectedEnd = parseDate(quickPeriodSingleEnd);
  const today = parseDate(todayKey());

  const buttons = Array.from({ length: days }, (_, index) => {
    const date = new Date(year, month, index + 1);
    const key = dateKey(date);
    const existing = periodForDate(key);
    const classes = ["period-picker-day", "quick-period-day"];
    const isFuture = date > today;

    if (key === todayKey()) classes.push("today");
    if (existing) classes.push("saved-period");
    if (selectedStart && selectedEnd && dateWithin(date, selectedStart, selectedEnd)) classes.push("draft-period");
    if (key === quickPeriodSingleStart) classes.push("draft-start");
    if (key === quickPeriodSingleEnd) classes.push("draft-end");

    return `<button type="button" class="${classes.join(" ")}" data-quick-period-date="${key}" ${isFuture ? "disabled" : ""}>${index + 1}</button>`;
  }).join("");

  grid.innerHTML = blanks + buttons;
  grid.querySelectorAll("[data-quick-period-date]").forEach(button => {
    button.addEventListener("click", () => selectQuickPeriodSingleDate(button.dataset.quickPeriodDate));
  });

  summary.textContent = quickPeriodSingleStart
    ? formatPeriodRange(quickPeriodSingleStart, quickPeriodSingleEnd)
    : "Tap the first day of your period";
  saveButton.disabled = !quickPeriodSingleStart;
  saveButton.textContent = quickPeriodSingleEditingId ? "Update period" : "Save period";
}

function selectQuickPeriodSingleDate(key) {
  const existing = periodForDate(key);
  if (existing) {
    quickPeriodSingleEditingId = existing.id;
    quickPeriodSingleStart = existing.start;
    quickPeriodSingleEnd = existing.end || ensurePeriodEnd(existing.start);
  } else {
    quickPeriodSingleEditingId = "";
    quickPeriodSingleStart = key;
    quickPeriodSingleEnd = ensurePeriodEnd(key);
  }
  renderQuickPeriodSingle();
}

function saveQuickPeriodSingle() {
  if (!quickPeriodSingleStart) return;
  const end = quickPeriodSingleEnd || ensurePeriodEnd(quickPeriodSingleStart);
  const error = quickPeriodSelectionError(quickPeriodSingleStart, end, quickPeriodSingleEditingId);
  if (error) {
    showToast(error);
    return;
  }

  if (quickPeriodSingleEditingId) {
    const period = data.periods.find(item => item.id === quickPeriodSingleEditingId);
    if (period) {
      period.start = quickPeriodSingleStart;
      period.end = end;
    }
  } else {
    data.periods.push({
      id: uid(),
      start: quickPeriodSingleStart,
      end,
      context: "",
      nextMoonNote: ""
    });
  }

  saveData();
  renderEverything();
  closeQuickPeriodEntry();
  showToast(quickPeriodSingleEditingId ? "Period updated 🌙" : "Period saved 🌸");
}

function bulkPeriodWindowMonths() {
  const anchor = new Date(bulkPeriodAnchor.getFullYear(), bulkPeriodAnchor.getMonth(), 1);
  return Array.from({ length: 12 }, (_, index) => new Date(anchor.getFullYear(), anchor.getMonth() - 11 + index, 1));
}

function bulkPeriodMonthHTML(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const key = monthKeyFromDate(monthDate);
  const existingPeriods = periodsStartingInMonth(year, month);
  const monthDraftStarts = Array.from(bulkPeriodDrafts.values()).filter(start => {
    const date = parseDate(start);
    return date && date.getFullYear() === year && date.getMonth() === month;
  });
  const monthDraftPeriods = monthDraftStarts.map(start => ({ start, end: ensurePeriodEnd(start) }));
  const firstDay = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const today = parseDate(todayKey());
  const blanks = Array.from({ length: firstDay }, () => "<span></span>").join("");

  const dayButtons = Array.from({ length: days }, (_, index) => {
    const date = new Date(year, month, index + 1);
    const dateValue = dateKey(date);
    const existing = periodForDate(dateValue);
    const draftPeriod = monthDraftPeriods.find(period => {
      const draftStart = parseDate(period.start);
      const draftEnd = parseDate(period.end);
      return draftStart && draftEnd && dateWithin(date, draftStart, draftEnd);
    });
    const isDraftStart = monthDraftStarts.includes(dateValue);
    const isDraftEnd = monthDraftPeriods.some(period => period.end === dateValue);
    const classes = ["period-picker-day", "bulk-period-day"];

    if (date > today) classes.push("future");
    if (existing) classes.push("saved-period");
    if (draftPeriod) classes.push("draft-period");
    if (isDraftStart) classes.push("draft-start");
    if (isDraftEnd) classes.push("draft-end");

    /* Only the exact saved dates and future dates are untappable.
       Another non-overlapping period may still be added in the same month. */
    const disabled = date > today || Boolean(existing);
    return `<button type="button" class="${classes.join(" ")}" data-bulk-period-date="${dateValue}" data-bulk-month="${key}" ${disabled ? "disabled" : ""}>${index + 1}</button>`;
  }).join("");

  const savedRanges = existingPeriods.map(period =>
    formatPeriodRange(period.start, period.end || ensurePeriodEnd(period.start))
  );
  const selectedRanges = monthDraftPeriods.map(period =>
    formatPeriodRange(period.start, period.end)
  );

  let statusText = "Tap the first day";
  let statusClass = "";
  if (savedRanges.length && selectedRanges.length) {
    statusText = `Saved · ${savedRanges.join("; ")} · Adding · ${selectedRanges.join("; ")}`;
    statusClass = "selected";
  } else if (selectedRanges.length) {
    statusText = `Selected · ${selectedRanges.join("; ")}`;
    statusClass = "selected";
  } else if (savedRanges.length) {
    statusText = `Saved · ${savedRanges.join("; ")} · You can add another non-overlapping period`;
    statusClass = "saved";
  }

  return `
    <section class="bulk-period-month ${existingPeriods.length ? "has-saved-period" : ""}" data-bulk-period-month="${key}">
      <div class="bulk-period-month-header">
        <h4>${monthDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h4>
        <span class="bulk-month-status ${statusClass}">${escapeHTML(statusText)}</span>
      </div>
      <div class="period-picker-weekdays"><span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span></div>
      <div class="period-picker-grid">${blanks}${dayButtons}</div>
    </section>`;
}

function renderBulkPeriodMonths() {
  const container = document.getElementById("bulkPeriodMonths");
  const count = document.getElementById("bulkPeriodCount");
  const saveButton = document.getElementById("bulkPeriodSave");
  const range = document.getElementById("bulkPeriodRangeLabel");
  const later = document.getElementById("bulkPeriodLater");
  if (!container || !count || !saveButton || !range) return;

  const months = bulkPeriodWindowMonths();
  const first = months[0];
  const last = months[months.length - 1];
  range.textContent = `${first.toLocaleDateString(undefined, { month: "short", year: "numeric" })} – ${last.toLocaleDateString(undefined, { month: "short", year: "numeric" })}`;
  container.innerHTML = months.map(bulkPeriodMonthHTML).join("");

  container.querySelectorAll("[data-bulk-period-date]").forEach(button => {
    button.addEventListener("click", () => {
      const start = button.dataset.bulkPeriodDate;

      /* Tapping the first day again removes that draft. */
      if (bulkPeriodDrafts.has(start)) {
        bulkPeriodDrafts.delete(start);
        setBulkPeriodFeedback("");
        renderBulkPeriodMonths();
        return;
      }

      const end = ensurePeriodEnd(start);
      const draftPeriods = bulkDraftPeriods();
      const error = quickPeriodSelectionError(start, end, "", draftPeriods);

      if (error) {
        setBulkPeriodFeedback(
          `${formatPeriodRange(start, end)} can’t be added because it overlaps another saved or selected period. Choose a different start date.`,
          "error"
        );
        return;
      }

      /* Key drafts by their actual start date so multiple periods can be
         selected in one calendar month. */
      bulkPeriodDrafts.set(start, start);
      setBulkPeriodFeedback("");
      renderBulkPeriodMonths();
      requestAnimationFrame(() => {
        container.querySelector(`[data-bulk-period-month="${button.dataset.bulkMonth}"]`)?.scrollIntoView({ block: "center" });
      });
    });
  });

  const selected = bulkPeriodDrafts.size;
  count.textContent = `${selected} period${selected === 1 ? "" : "s"}`;
  saveButton.disabled = selected === 0;
  saveButton.textContent = selected ? `Save ${selected} period${selected === 1 ? "" : "s"}` : "Save selected periods";

  const currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  if (later) later.disabled = bulkPeriodAnchor >= currentMonth;
}

function setBulkPeriodFeedback(message = "", type = "info") {
  const feedback = document.getElementById("bulkPeriodFeedback");
  if (!feedback) return;

  feedback.textContent = message;
  feedback.classList.toggle("hidden", !message);
  feedback.classList.toggle("is-error", type === "error");
  feedback.classList.toggle("is-success", type === "success");
}

function saveBulkPeriods(event) {
  event?.preventDefault?.();
  event?.stopPropagation?.();

  const saveButton = document.getElementById("bulkPeriodSave");

  if (!bulkPeriodDrafts.size) {
    setBulkPeriodFeedback("Choose at least one period start date first.", "error");
    return;
  }

  const drafts = Array.from(bulkPeriodDrafts.values())
    .map(start => ({
      id: uid(),
      start,
      end: ensurePeriodEnd(start),
      context: "",
      nextMoonNote: ""
    }))
    .sort((a, b) => parseDate(a.start) - parseDate(b.start));

  const accepted = [];
  const rejected = [];

  for (const period of drafts) {
    const startDate = parseDate(period.start);

    if (!startDate) {
      rejected.push("One selected date could not be read.");
      continue;
    }

    const error = quickPeriodSelectionError(period.start, period.end, "", accepted);
    if (error) {
      rejected.push(`${formatDateLong(startDate)}: ${error}`);
      continue;
    }

    accepted.push(period);
  }

  if (!accepted.length) {
    setBulkPeriodFeedback(rejected[0] || "None of those selections could be saved.", "error");
    return;
  }

  if (saveButton) {
    saveButton.disabled = true;
    saveButton.textContent = "Saving…";
  }

  const previousPeriods = data.periods.slice();

  try {
    data.periods.push(...accepted);
    data.periods.sort((a, b) => parseDate(a.start) - parseDate(b.start));
    saveData();
  }
  catch (error) {
    data.periods = previousPeriods;
    console.error("Could not save bulk periods:", error);
    setBulkPeriodFeedback("Tsuki could not save those periods on this device. Please try again.", "error");
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.textContent = `Save ${bulkPeriodDrafts.size} period${bulkPeriodDrafts.size === 1 ? "" : "s"}`;
    }
    return;
  }

  bulkPeriodDrafts = new Map();

  /* Close first so a later render error can never make Save look unresponsive. */
  closeQuickPeriodEntry();

  try {
    renderEverything();
  }
  catch (error) {
    console.error("Tsuki saved the periods but could not refresh every screen:", error);
  }

  const skipped = rejected.length;
  showToast(
    `${accepted.length} past period${accepted.length === 1 ? "" : "s"} saved${skipped ? ` · ${skipped} skipped` : ""} 🌸`
  );
}

document.querySelectorAll("[data-period-entry-mode]").forEach(button => {
  button.addEventListener("click", () => setQuickPeriodEntryMode(button.dataset.periodEntryMode));
});

document.getElementById("closeQuickPeriod")?.addEventListener("click", closeQuickPeriodEntry);
document.getElementById("quickPeriodModal")?.addEventListener("click", event => {
  if (event.target.id === "quickPeriodModal") closeQuickPeriodEntry();
});

document.getElementById("calendarLogPeriodButton")?.addEventListener("click", () => {
  openQuickPeriodEntry("single", dateKey(new Date(calendarDate.getFullYear(), calendarDate.getMonth(), Math.min(new Date().getDate(), new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate()))));
});

document.getElementById("calendarBulkPeriodButton")?.addEventListener("click", () => {
  openQuickPeriodEntry("bulk", dateKey(new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1)));
});

document.getElementById("quickPeriodPreviousMonth")?.addEventListener("click", () => {
  quickPeriodSingleAnchor.setMonth(quickPeriodSingleAnchor.getMonth() - 1);
  renderQuickPeriodSingle();
});

document.getElementById("quickPeriodNextMonth")?.addEventListener("click", () => {
  const next = new Date(quickPeriodSingleAnchor.getFullYear(), quickPeriodSingleAnchor.getMonth() + 1, 1);
  const current = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  if (next <= current) quickPeriodSingleAnchor = next;
  renderQuickPeriodSingle();
});

document.getElementById("quickPeriodClearSingle")?.addEventListener("click", () => {
  quickPeriodSingleStart = "";
  quickPeriodSingleEnd = "";
  quickPeriodSingleEditingId = "";
  renderQuickPeriodSingle();
});

document.getElementById("quickPeriodSaveSingle")?.addEventListener("click", saveQuickPeriodSingle);

document.getElementById("bulkPeriodEarlier")?.addEventListener("click", () => {
  bulkPeriodAnchor.setMonth(bulkPeriodAnchor.getMonth() - 12);
  renderBulkPeriodMonths();
});

document.getElementById("bulkPeriodLater")?.addEventListener("click", () => {
  const current = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const candidate = new Date(bulkPeriodAnchor.getFullYear(), bulkPeriodAnchor.getMonth() + 12, 1);
  bulkPeriodAnchor = candidate > current ? current : candidate;
  renderBulkPeriodMonths();
});

document.getElementById("bulkPeriodClear")?.addEventListener("click", () => {
  bulkPeriodDrafts = new Map();
  setBulkPeriodFeedback("");
  renderBulkPeriodMonths();
});

document.getElementById("bulkPeriodSave")?.addEventListener("click", saveBulkPeriods);

document.getElementById("quickPeriodManageHistory")?.addEventListener("click", () => {
  closeQuickPeriodEntry();
  showScreen("cycle-history");
});

/* ============================================================
   SCROLLABLE PERIOD CALENDAR
   ============================================================ */

function setPeriodCalendarMode(mode) {
  periodCalendarMode = mode === "end" ? "end" : "start";

  document
    .querySelectorAll("[data-period-mode]")
    .forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.periodMode === periodCalendarMode
      );
    });
}


function loadPeriodIntoCalendar(period) {
  if (!period) return;

  editingPeriodId.value = period.id;
  periodCalendarDraftStart = period.start;
  periodCalendarDraftEnd = period.end || ensurePeriodEnd(period.start);
  periodStartDate.value = periodCalendarDraftStart;
  periodEndDate.value = periodCalendarDraftEnd;
  updatePeriodRangeSummary();

  const knownContexts = [
    "", "Travel", "High Stress", "Illness",
    "Busy Month", "Poor Sleep", "Vacation"
  ];

  if (knownContexts.includes(period.context || "")) {
    periodContext.value = period.context || "";
    periodContextCustom.value = "";
    periodContextCustom.classList.add("hidden");
  }
  else {
    periodContext.value = "Custom";
    periodContextCustom.value = period.context || "";
    periodContextCustom.classList.remove("hidden");
  }

  document.getElementById("periodFormTitle").textContent = "Edit period";
  document.getElementById("savePeriodButton").textContent = "Update period";
  document.getElementById("cancelPeriodEdit").classList.remove("hidden");
}


function updatePeriodCalendarDraft() {
  const text = document.getElementById("periodCalendarDraftText");
  if (!text) return;

  text.textContent = formatPeriodRange(
    periodCalendarDraftStart,
    periodCalendarDraftEnd
  );
}


function selectPeriodPickerDay(key) {
  const matchingPeriod = periodForDate(key);

  if (periodCalendarMode === "start") {
    if (matchingPeriod && matchingPeriod.id !== editingPeriodId.value) {
      loadPeriodIntoCalendar(matchingPeriod);
      periodCalendarAnchor = parseDate(matchingPeriod.start) || periodCalendarAnchor;
      setPeriodCalendarMode("end");
      renderPeriodCalendarMonths();
      updatePeriodCalendarDraft();
      return;
    }

    periodCalendarDraftStart = key;
    periodCalendarDraftEnd = ensurePeriodEnd(key);
    setPeriodCalendarMode("end");
  }
  else {
    if (!periodCalendarDraftStart || parseDate(key) < parseDate(periodCalendarDraftStart)) {
      periodCalendarDraftStart = key;
      periodCalendarDraftEnd = ensurePeriodEnd(key);
      setPeriodCalendarMode("end");
    }
    else {
      periodCalendarDraftEnd = key;
    }
  }

  updatePeriodCalendarDraft();
  renderPeriodCalendarMonths();
}


function periodPickerMonthHTML(year, month) {
  const monthDate = new Date(year, month, 1);
  const firstDay = monthDate.getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
  const blanks = Array.from({ length: firstDay }, () => "<span></span>").join("");

  const dayButtons = Array.from({ length: days }, (_, index) => {
    const date = new Date(year, month, index + 1);
    const key = dateKey(date);
    const classes = ["period-picker-day"];
    const existing = periodForDate(key);

    if (key === todayKey()) classes.push("today");
    if (existing) classes.push("saved-period");

    if (
      periodCalendarDraftStart &&
      periodCalendarDraftEnd &&
      dateWithin(date, parseDate(periodCalendarDraftStart), parseDate(periodCalendarDraftEnd))
    ) {
      classes.push("draft-period");
    }

    if (key === periodCalendarDraftStart) classes.push("draft-start");
    if (key === periodCalendarDraftEnd) classes.push("draft-end");

    return `<button type="button" class="${classes.join(" ")}" data-period-picker-date="${key}">${index + 1}</button>`;
  }).join("");

  return `
    <section class="period-picker-month" data-period-picker-month="${monthKey}">
      <h4>${monthDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h4>
      <div class="period-picker-weekdays">
        <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
      </div>
      <div class="period-picker-grid">${blanks}${dayButtons}</div>
    </section>
  `;
}


function renderPeriodCalendarMonths() {
  const container = document.getElementById("periodCalendarMonths");
  if (!container) return;

  const anchor = new Date(
    periodCalendarAnchor.getFullYear(),
    periodCalendarAnchor.getMonth(),
    1
  );

  container.innerHTML = Array.from({ length: 13 }, (_, index) => {
    const date = new Date(anchor.getFullYear(), anchor.getMonth() + index - 6, 1);
    return periodPickerMonthHTML(date.getFullYear(), date.getMonth());
  }).join("");

  container.querySelectorAll("[data-period-picker-date]").forEach(button => {
    button.addEventListener("click", () => selectPeriodPickerDay(button.dataset.periodPickerDate));
  });
}


function openPeriodCalendar() {
  periodCalendarDraftStart = periodStartDate.value;
  periodCalendarDraftEnd = periodEndDate.value;
  periodCalendarAnchor = parseDate(periodCalendarDraftStart) || new Date();
  setPeriodCalendarMode("start");

  const length = configuredPeriodLength();
  document.getElementById("periodCalendarDefaultBadge").textContent =
    `${length}-day default`;

  renderPeriodCalendarMonths();
  updatePeriodCalendarDraft();

  document.getElementById("periodCalendarModal").classList.remove("hidden");
  document.body.classList.add("modal-open");

  requestAnimationFrame(() => {
    const monthKey = `${periodCalendarAnchor.getFullYear()}-${String(periodCalendarAnchor.getMonth() + 1).padStart(2, "0")}`;
    document.querySelector(`[data-period-picker-month="${monthKey}"]`)?.scrollIntoView({ block: "start" });
  });
}


function closePeriodCalendar() {
  document.getElementById("periodCalendarModal").classList.add("hidden");
  document.body.classList.remove("modal-open");
}


document.getElementById("openPeriodCalendar")?.addEventListener("click", openPeriodCalendar);
document.getElementById("closePeriodCalendar")?.addEventListener("click", closePeriodCalendar);

document.getElementById("periodCalendarEarlier")?.addEventListener("click", () => {
  periodCalendarAnchor.setMonth(periodCalendarAnchor.getMonth() - 12);
  renderPeriodCalendarMonths();
});

document.getElementById("periodCalendarLater")?.addEventListener("click", () => {
  periodCalendarAnchor.setMonth(periodCalendarAnchor.getMonth() + 12);
  renderPeriodCalendarMonths();
});

document.querySelectorAll("[data-period-mode]").forEach(button => {
  button.addEventListener("click", () => setPeriodCalendarMode(button.dataset.periodMode));
});

document.getElementById("periodCalendarUseDefault")?.addEventListener("click", () => {
  if (!periodCalendarDraftStart) {
    showToast("Choose the first day first.");
    return;
  }
  periodCalendarDraftEnd = ensurePeriodEnd(periodCalendarDraftStart);
  updatePeriodCalendarDraft();
  renderPeriodCalendarMonths();
});

document.getElementById("periodCalendarClear")?.addEventListener("click", () => {
  resetPeriodForm();
  periodCalendarDraftStart = "";
  periodCalendarDraftEnd = "";
  setPeriodCalendarMode("start");
  updatePeriodCalendarDraft();
  renderPeriodCalendarMonths();
});

document.getElementById("periodCalendarDone")?.addEventListener("click", () => {
  if (!periodCalendarDraftStart) {
    showToast("Choose the first day of your period.");
    return;
  }

  periodStartDate.value = periodCalendarDraftStart;
  periodEndDate.value = periodCalendarDraftEnd || ensurePeriodEnd(periodCalendarDraftStart);
  updatePeriodRangeSummary();
  closePeriodCalendar();
});

document.getElementById("periodCalendarModal")?.addEventListener("click", event => {
  if (event.target.id === "periodCalendarModal") closePeriodCalendar();
});


/* ============================================================
   DAILY LOG
   ============================================================ */

const logDate =
  document.getElementById(
    "logDate"
  );

logDate.value = todayKey();

const painLevel = document.getElementById("painLevel");

painLevel.addEventListener("input", () => {
  document.getElementById("painOutput").textContent = painLevel.value;
});

logDate.addEventListener("change", loadLogForm);


function getCheckedValue(name) {
  return document.querySelector(`input[name="${name}"]:checked`)?.value || "";
}


function setCheckedValue(name, value) {
  if (!value) return;
  const input = document.querySelector(`input[name="${name}"][value="${CSS.escape(String(value))}"]`);
  if (input) input.checked = true;
}


function getSymptoms() {
  return Array.from(document.querySelectorAll('input[name="symptom"]:checked'))
    .map(input => input.value);
}


function clearRadioGroup(name) {
  document.querySelectorAll(`input[name="${name}"]`).forEach(input => {
    input.checked = false;
  });
}


function phaseLogCopy(phase, day) {
  if (phase === "Period") {
    return {
      icon: "🩸",
      title: "Period check-in",
      question: "How is your period feeling today?",
      eyebrow: day ? `CYCLE DAY ${day} · PERIOD` : "PERIOD",
      description: "Flow, cramps and symptoms are prioritized because this date is inside a period you logged."
    };
  }

  if (phase === "Follicular phase") {
    return {
      icon: "🌱",
      title: "Follicular check-in",
      question: "How are you feeling in this part of your cycle?",
      eyebrow: day ? `CYCLE DAY ${day} · FOLLICULAR` : "FOLLICULAR",
      description: "Tsuki emphasizes focus and motivation here, while mood, energy, sleep and symptoms stay available."
    };
  }

  if (phase === "Estimated ovulation") {
    return {
      icon: "✨",
      title: "Estimated ovulation check-in",
      question: "Are you noticing any mid-cycle changes?",
      eyebrow: day ? `CYCLE DAY ${day} · EST. OVULATION` : "ESTIMATED OVULATION",
      description: "This timing is estimated from your cycle dates. Discharge, libido and mid-cycle discomfort are optional clues, not confirmation of ovulation."
    };
  }

  if (phase === "Luteal phase") {
    return {
      icon: "🌙",
      title: "Luteal check-in",
      question: "How is your late-cycle day feeling?",
      eyebrow: day ? `CYCLE DAY ${day} · LUTEAL` : "LUTEAL",
      description: "Tsuki emphasizes stress, appetite and cravings while keeping your usual mood, energy, sleep and symptoms."
    };
  }

  return {
    icon: "🌙",
    title: "Daily check-in",
    question: "How are you feeling today?",
    eyebrow: "DAILY LOG",
    description: "Log a period first if you want Tsuki to estimate where this day falls in your cycle."
  };
}


function dailyQuestionForPhase(phase) {
  return phaseLogCopy(phase, null).question;
}


function segmentedHTML(name, label, options) {
  return `
    <div class="phase-field-block">
      <p class="card-label">${escapeHTML(label)}</p>
      <div class="segmented">
        ${options.map(option => `
          <label>
            <input type="radio" name="${escapeHTML(name)}" value="${escapeHTML(option)}">
            <span>${escapeHTML(option)}</span>
          </label>
        `).join("")}
      </div>
    </div>
  `;
}


function renderPhaseSpecificLogFields(phase) {
  const card = document.getElementById("phaseSpecificLogCard");
  const content = document.getElementById("phaseSpecificLogContent");
  if (!card || !content) return;

  if (phase === "Follicular phase") {
    content.innerHTML =
      segmentedHTML("focus", "Focus", ["Low", "Medium", "High"]) +
      segmentedHTML("motivation", "Motivation", ["Low", "Medium", "High"]);
    card.classList.remove("hidden");
    return;
  }

  if (phase === "Estimated ovulation") {
    content.innerHTML =
      segmentedHTML("discharge", "Cervical mucus / discharge", ["Dry", "Sticky", "Creamy", "Watery", "Slippery / stretchy"]) +
      segmentedHTML("libido", "Libido", ["Low", "Medium", "High"]) +
      segmentedHTML("ovulationDiscomfort", "Mid-cycle pelvic discomfort", ["None", "Mild", "Noticeable"]);
    card.classList.remove("hidden");
    return;
  }

  if (phase === "Luteal phase") {
    content.innerHTML =
      segmentedHTML("stress", "Stress", ["Low", "Medium", "High"]) +
      segmentedHTML("appetite", "Appetite", ["Low", "Usual", "High"]) +
      segmentedHTML("cravingIntensity", "Cravings", ["None", "Mild", "Strong"]);
    card.classList.remove("hidden");
    return;
  }

  content.innerHTML = "";
  card.classList.add("hidden");
}


function renderLogPhaseUI() {
  const key = logDate.value || todayKey();
  const phase = phaseForDate(key);
  const day = cycleDayForDate(key);
  const copy = phaseLogCopy(phase, day);
  const isPeriod = phase === "Period";

  document.getElementById("logScreenEyebrow").textContent = copy.eyebrow;
  document.getElementById("logScreenTitle").textContent = copy.title;
  document.getElementById("logPhaseIcon").textContent = copy.icon;
  document.getElementById("logPhaseEyebrow").textContent = copy.eyebrow;
  document.getElementById("logPhaseTitle").textContent = phase === "No cycle yet" ? "Daily check-in" : phase;
  document.getElementById("logPhaseQuestion").textContent = copy.question;
  document.getElementById("logPhaseDescription").textContent = copy.description;

  document.getElementById("periodFlowCard").classList.toggle("hidden", !isPeriod);
  document.getElementById("periodPainCard").classList.toggle("hidden", !isPeriod);
  renderPhaseSpecificLogFields(phase);

  return phase;
}


function loadLogForm() {
  const key = logDate.value || todayKey();
  const saved = data.logs[key] || {};
  const phase = renderLogPhaseUI();

  [
    "flow", "moodIntensity", "energy", "sleep",
    "focus", "motivation", "discharge", "libido", "ovulationDiscomfort",
    "stress", "appetite", "cravingIntensity"
  ].forEach(clearRadioGroup);

  setCheckedValue("flow", saved.flow);
  document.querySelectorAll('input[name="moodChoice"]').forEach(input => {
    const moods = Array.isArray(saved.moods) ? saved.moods : (saved.mood ? [saved.mood] : []);
    input.checked = moods.includes(input.value);
  });
  setCheckedValue("moodIntensity", saved.moodIntensity);
  setCheckedValue("energy", saved.energy);
  setCheckedValue("sleep", saved.sleep);
  setCheckedValue("focus", saved.focus);
  setCheckedValue("motivation", saved.motivation);
  setCheckedValue("discharge", saved.discharge);
  setCheckedValue("libido", saved.libido);
  setCheckedValue("ovulationDiscomfort", saved.ovulationDiscomfort);
  setCheckedValue("stress", saved.stress);
  setCheckedValue("appetite", saved.appetite);
  setCheckedValue("cravingIntensity", saved.cravingIntensity);

  renderCustomSymptoms(saved.symptoms || []);
  document.querySelectorAll('input[name="symptom"]').forEach(input => {
    input.checked = saved.symptoms?.includes(input.value) || false;
  });
  renderSymptomSeverityControls(saved.symptomSeverity || {});

  painLevel.value = saved.pain || 0;
  document.getElementById("painOutput").textContent = painLevel.value;
  document.getElementById("sleepHours").value = saved.sleepHours ?? "";
  document.getElementById("tinyJoy").value = saved.tinyJoy || "";
  document.getElementById("dailyNotes").value = saved.notes || "";
  document.getElementById("deleteDailyLog")?.classList.toggle("hidden", !data.logs[key]);

  return phase;
}



let lastDeletedLog = null;

function renderCustomSymptoms(selected = []) {
  const grid = document.getElementById("customSymptomGrid");
  if (!grid) return;
  grid.innerHTML = (data.customSymptoms || []).map(symptom => `
    <label><input type="checkbox" name="symptom" value="${escapeHTML(symptom)}" ${selected.includes(symptom) ? "checked" : ""}><span>🌙 ${escapeHTML(symptom)}</span></label>
  `).join("");
  grid.querySelectorAll('input[name="symptom"]').forEach(input => input.addEventListener("change", () => renderSymptomSeverityControls(data.logs[logDate.value]?.symptomSeverity || {})));
}

function renderSymptomSeverityControls(saved = {}) {
  const container = document.getElementById("symptomSeverityList");
  if (!container) return;
  const selected = getSymptoms();
  container.innerHTML = selected.map(symptom => {
    const value = saved[symptom] || "Mild";
    return `<div class="symptom-severity-row"><strong>${escapeHTML(symptom)}</strong><div class="segmented compact-segmented">${["Mild","Medium","Strong"].map(level => `<label><input type="radio" name="severity-${escapeHTML(symptom)}" data-symptom-severity="${escapeHTML(symptom)}" value="${level}" ${value === level ? "checked" : ""}><span>${level}</span></label>`).join("")}</div></div>`;
  }).join("");
}

function collectSymptomSeverity() {
  const result = {};
  document.querySelectorAll('[data-symptom-severity]:checked').forEach(input => { result[input.dataset.symptomSeverity] = input.value; });
  return result;
}

document.getElementById("addCustomSymptom")?.addEventListener("click", () => {
  const input = document.getElementById("customSymptomInput");
  const value = input?.value.trim();
  if (!value) return;
  if (!(data.customSymptoms || []).some(item => item.toLowerCase() === value.toLowerCase())) data.customSymptoms.push(value);
  saveData();
  if (input) input.value = "";
  const selected = [...new Set(getSymptoms().concat(value))];
  renderCustomSymptoms(selected);
  renderSymptomSeverityControls(data.logs[logDate.value]?.symptomSeverity || {});
  showToast("Custom symptom added 🌸");
});

document.addEventListener("change", event => {
  if (event.target?.matches?.('input[name="symptom"]')) renderSymptomSeverityControls(data.logs[logDate.value]?.symptomSeverity || {});
});

document.getElementById("deleteDailyLog")?.addEventListener("click", () => {
  const key = logDate.value;
  if (!data.logs[key] || !confirm(`Delete the check-in for ${formatDate(parseDate(key))}?`)) return;
  lastDeletedLog = { key, value: clone(data.logs[key]) };
  delete data.logs[key];
  saveData();
  renderEverything();
  loadLogForm();
  showUndoToast("Check-in deleted", () => {
    if (!lastDeletedLog) return;
    data.logs[lastDeletedLog.key] = lastDeletedLog.value;
    saveData(); renderEverything(); loadLogForm(); lastDeletedLog = null;
  });
});

document.getElementById("dailyLogForm").addEventListener("submit", event => {
  event.preventDefault();

  const key = logDate.value;
  if (!key) return;

  const phase = phaseForDate(key);
  const existing = data.logs[key] || {};
  const isPeriod = phase === "Period";

  data.logs[key] = {
    ...existing,
    phaseAtLog: phase,
    flow: isPeriod ? (getCheckedValue("flow") || "None") : "",
    pain: isPeriod ? Number(painLevel.value) : 0,
    moods: Array.from(document.querySelectorAll('input[name="moodChoice"]:checked')).map(input => input.value),
    mood: Array.from(document.querySelectorAll('input[name="moodChoice"]:checked')).map(input => input.value)[0] || "",
    moodIntensity: getCheckedValue("moodIntensity"),
    energy: getCheckedValue("energy"),
    sleep: getCheckedValue("sleep"),
    sleepHours: document.getElementById("sleepHours").value === "" ? "" : Number(document.getElementById("sleepHours").value),
    focus: getCheckedValue("focus"),
    motivation: getCheckedValue("motivation"),
    discharge: getCheckedValue("discharge"),
    libido: getCheckedValue("libido"),
    ovulationDiscomfort: getCheckedValue("ovulationDiscomfort"),
    stress: getCheckedValue("stress"),
    appetite: getCheckedValue("appetite"),
    cravingIntensity: getCheckedValue("cravingIntensity"),
    symptoms: getSymptoms(),
    symptomSeverity: collectSymptomSeverity(),
    tinyJoy: document.getElementById("tinyJoy").value.trim(),
    notes: document.getElementById("dailyNotes").value.trim()
  };

  saveData();
  renderEverything();
  loadLogForm();
  showToast(`${phase === "No cycle yet" ? "Daily" : phase.replace(" phase", "")} check-in saved 🌸`);
});


/* ============================================================
   CALENDAR
   ============================================================ */

document
  .getElementById(
    "previousMonth"
  )
  .addEventListener(
    "click",
    () => {
      calendarDate.setMonth(
        calendarDate.getMonth() - 1
      );

      renderCalendar();
    }
  );


document
  .getElementById(
    "nextMonth"
  )
  .addEventListener(
    "click",
    () => {
      calendarDate.setMonth(
        calendarDate.getMonth() + 1
      );

      renderCalendar();
    }
  );


function dateWithin(
  date,
  start,
  end
) {
  const value =
    new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

  const startValue =
    new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate()
    );

  const endValue =
    new Date(
      end.getFullYear(),
      end.getMonth(),
      end.getDate()
    );

  return (
    value >= startValue &&
    value <= endValue
  );
}


function projectedCycleStartForDate(dateValue) {
  const period = latestPeriod();
  const target = typeof dateValue === "string" ? parseDate(dateValue) : dateValue;
  const anchor = period ? parseDate(period.start) : null;
  if (!anchor || !target || target < anchor) return null;
  const length = forecastCycleLength();
  const elapsed = daysBetween(anchor, target);
  const index = Math.max(0, Math.floor(elapsed / length));
  return addDays(anchor, index * length);
}

function projectedPhaseForDate(dateValue) {
  const key = typeof dateValue === "string" ? dateValue : dateKey(dateValue);
  if (periodForDate(key)) return "Period";
  const target = parseDate(key);
  const start = projectedCycleStartForDate(target);
  if (!target || !start) return phaseForDate(key);
  const cycleLength = forecastCycleLength();
  const periodLength = configuredPeriodLength();
  const cycleDay = daysBetween(start, target) + 1;
  if (cycleDay <= periodLength) return "Predicted period";
  const ovulationDay = Math.max(periodLength + 2, cycleLength - 14 + 1);
  if (cycleDay < ovulationDay - 1) return "Follicular phase";
  if (cycleDay <= ovulationDay + 1) return "Estimated ovulation";
  return "Luteal phase";
}

function projectedCycleDayForDate(dateValue) {
  const target = typeof dateValue === "string" ? parseDate(dateValue) : dateValue;
  const start = projectedCycleStartForDate(target);
  if (!target || !start) return cycleDayForDate(dateValue);
  return daysBetween(start, target) + 1;
}

function renderCalendar() {
  const grid = document.getElementById("calendarGrid");
  const weekdays = document.getElementById("calendarWeekdays");
  if (!grid) return;
  grid.innerHTML = "";

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  document.getElementById("calendarMonthTitle").textContent = new Date(year, month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const mondayFirst = data.settings.weekStart === "monday";
  const labels = mondayFirst ? ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] : ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  if (weekdays) weekdays.innerHTML = labels.map(day => `<span>${day}</span>`).join("");

  const nativeFirst = new Date(year, month, 1).getDay();
  const firstDay = mondayFirst ? (nativeFirst + 6) % 7 : nativeFirst;
  const numberOfDays = new Date(year, month + 1, 0).getDate();
  for (let i = 0; i < firstDay; i++) grid.appendChild(document.createElement("div"));

  const predictionWindows = calendarPredictionWindows(12);
  for (let day = 1; day <= numberOfDays; day++) {
    const date = new Date(year, month, day);
    const key = dateKey(date);
    const button = document.createElement("button");
    button.className = "calendar-day";
    button.textContent = day;
    button.dataset.date = key;

    if (key === todayKey()) button.classList.add("today");
    const matchingPeriod = periodForDate(key);
    const futureOrCurrent = date >= parseDate(latestPeriod()?.start || key);

    if (matchingPeriod) {
      button.classList.add("period-range");
      if (matchingPeriod.start === key) button.classList.add("period-start");
      if (!matchingPeriod.end) button.classList.add("open-period");
    } else if (dateInAnyPredictionWindow(date, predictionWindows)) {
      button.classList.add("predicted");
    }

    const phase = futureOrCurrent ? projectedPhaseForDate(key) : phaseForDate(key);
    if (!matchingPeriod) {
      if (phase === "Follicular phase") button.classList.add("phase-follicular");
      if (phase === "Estimated ovulation") button.classList.add("phase-ovulation");
      if (phase === "Luteal phase") button.classList.add("phase-luteal");
    }

    if (data.logs[key]) button.classList.add("logged");
    button.addEventListener("click", () => openDayDetail(key));
    grid.appendChild(button);
  }
}

let selectedDayDetailKey = todayKey();
function openDayDetail(key) {
  selectedDayDetailKey = key;
  const date = parseDate(key);
  const phase = date >= parseDate(latestPeriod()?.start || key) ? projectedPhaseForDate(key) : phaseForDate(key);
  const cycleDay = date >= parseDate(latestPeriod()?.start || key) ? projectedCycleDayForDate(key) : cycleDayForDate(key);
  const log = data.logs[key];
  const period = periodForDate(key);
  const predicted = dateInAnyPredictionWindow(date, calendarPredictionWindows(12));
  document.getElementById("dayDetailTitle").textContent = formatDate(date);
  document.getElementById("dayDetailContent").innerHTML = `
    <div class="day-detail-summary"><span class="day-phase-icon">${phase === "Period" ? "🩸" : phase === "Estimated ovulation" ? "✨" : phase === "Follicular phase" ? "🌱" : "🌙"}</span><div><strong>${escapeHTML(phase)}</strong><small>${cycleDay ? `Cycle Day ${cycleDay}` : "No cycle anchor yet"}</small></div></div>
    <div class="day-detail-chips">${period ? '<span>🩸 Saved period</span>' : ""}${predicted ? '<span>🌸 Estimated period window</span>' : ""}${log ? '<span>📝 Check-in saved</span>' : ""}</div>
    ${log ? `<article class="day-log-preview"><p>${log.mood ? `💗 ${escapeHTML(log.mood)}` : ""} ${log.energy ? ` · ✨ ${escapeHTML(log.energy)} energy` : ""}</p>${log.symptoms?.length ? `<p>🌸 ${log.symptoms.map(escapeHTML).join(", ")}</p>` : ""}${log.notes ? `<p class="muted">“${escapeHTML(log.notes)}”</p>` : ""}</article>` : '<p class="muted small-text">No check-in saved for this day.</p>'}
  `;
  document.getElementById("dayDetailSheet")?.classList.add("open");
  document.getElementById("dayDetailBackdrop")?.classList.remove("hidden");
  document.body.classList.add("quick-sheet-open");
}
function closeDayDetail() { document.getElementById("dayDetailSheet")?.classList.remove("open"); document.getElementById("dayDetailBackdrop")?.classList.add("hidden"); document.body.classList.remove("quick-sheet-open"); }
document.getElementById("closeDayDetail")?.addEventListener("click", closeDayDetail);
document.getElementById("dayDetailBackdrop")?.addEventListener("click", closeDayDetail);
document.getElementById("dayDetailLogButton")?.addEventListener("click", () => { closeDayDetail(); logDate.value = selectedDayDetailKey; loadLogForm(); showScreen("log"); });
document.getElementById("dayDetailPeriodButton")?.addEventListener("click", () => {
  closeDayDetail();
  openQuickPeriodEntry("single", selectedDayDetailKey || todayKey());
});

function predictionInfoHTML() {
  const intervals = cycleIntervals();
  const mode = data.settings.predictionMode === "recentAverage" ? "recent-cycle average" : "Typical Cycle Length";
  const length = forecastCycleLength();
  const padding = predictionPaddingDays();
  const variability = cycleVariability();
  return `<article class="prediction-explain-card"><strong>Forecast: ${length} days</strong><p>Tsuki is currently using your <b>${mode}</b> and anchors future estimates to your latest logged period.</p><p>Estimated period window: ±${padding} day${padding === 1 ? "" : "s"}.${variability !== null ? ` Your logged cycle variability is about ±${variability.toFixed(1)} days.` : " More history will make the confidence explanation richer."}</p><p class="muted small-text">Predictions are estimates. Logging the actual start of a delayed or early period shifts future forecasts from that new real date.</p></article>`;
}
function openPredictionInfo() { document.getElementById("predictionInfoContent").innerHTML = predictionInfoHTML(); document.getElementById("predictionInfoModal").classList.remove("hidden"); document.body.classList.add("modal-open"); }
function closePredictionInfo() { document.getElementById("predictionInfoModal").classList.add("hidden"); document.body.classList.remove("modal-open"); }
document.getElementById("predictionConfidence")?.addEventListener("click", openPredictionInfo);
document.getElementById("closePredictionInfo")?.addEventListener("click", closePredictionInfo);
document.getElementById("predictionInfoDone")?.addEventListener("click", closePredictionInfo);


/* ============================================================
   TSUKI SIGNATURE — FORECAST, ECHOES & PREP
   ============================================================ */

function historicalLogsNearCycleDay(targetDay, tolerance = 1) {
  return logsWithCycleContext().filter(
    log => Math.abs(log.context.cycleDay - targetDay) <= tolerance
  );
}

function summarizePersonalDay(targetDay) {
  const logs = historicalLogsNearCycleDay(targetDay, 1);
  const cycles = distinctCount(logs.map(log => log.context.cycleId));
  const mood = frequency(logs.map(log => log.mood));
  const energy = frequency(logs.map(log => log.energy));
  const symptom = frequency(logs.flatMap(log => log.symptoms || []));

  return {
    samples: logs.length,
    cycles,
    mood: mood ? mood[0] : null,
    energy: energy ? energy[0] : null,
    symptom: symptom ? symptom[0] : null
  };
}

function renderTsukiForecast() {
  const container = document.getElementById("tsukiForecast");
  if (!container) return;

  const day = currentCycleDay();
  if (!day) {
    container.innerHTML = `<article class="forecast-empty">Log your period to start your personal forecast 🌙</article>`;
    return;
  }

  container.innerHTML = Array.from({ length: 7 }, (_, index) => {
    const targetDay = day + index;
    const summary = summarizePersonalDay(targetDay);
    const date = addDays(new Date(), index);
    let icon = "🌙";
    let text = "Still learning";

    if (summary.cycles >= 2) {
      if (summary.symptom) {
        icon = summary.symptom === "Headache" ? "☁️" : summary.symptom === "Fatigue" ? "💤" : "🌸";
        text = summary.symptom;
      } else if (summary.energy) {
        icon = summary.energy === "Low" ? "🫧" : "✨";
        text = `${summary.energy} energy`;
      } else if (summary.mood) {
        icon = "💗";
        text = summary.mood;
      }
    }

    return `
      <article class="forecast-day ${index === 0 ? "today-forecast" : ""}">
        <small>${index === 0 ? "Today" : date.toLocaleDateString(undefined, { weekday: "short" })}</small>
        <span>${icon}</span>
        <strong>Day ${targetDay}</strong>
        <em>${escapeHTML(text)}</em>
      </article>
    `;
  }).join("");
}

function renderTonightTomorrow() {
  const card = document.getElementById("tonightTomorrowCard");
  if (!card) return;
  const day = currentCycleDay();
  if (!day) {
    card.innerHTML = `<span>🌙</span><div><strong>Tonight / Tomorrow</strong><p>Once Tsuki knows your cycle, this becomes a tiny personal heads-up for the next day.</p></div>`;
    return;
  }
  const tomorrow = summarizePersonalDay(day + 1);
  if (tomorrow.cycles < 2) {
    card.innerHTML = `<span>🌙</span><div><strong>Tonight / Tomorrow</strong><p>Tomorrow is around Cycle Day ${day + 1}. Tsuki is still learning what your own history usually looks like there.</p></div>`;
    return;
  }
  const bits = [];
  if (tomorrow.energy) bits.push(`${tomorrow.energy.toLowerCase()} energy`);
  if (tomorrow.mood) bits.push(`${tomorrow.mood.toLowerCase()} mood`);
  if (tomorrow.symptom) bits.push(tomorrow.symptom.toLowerCase());
  card.innerHTML = `<span>🌙</span><div><strong>Tonight / Tomorrow</strong><p>Tomorrow is around Cycle Day ${day + 1}. In ${tomorrow.cycles} past cycles, your logs around this point often included ${escapeHTML(bits.join(", ") || "a similar rhythm")}. This is only a personal-history hint.</p></div>`;
}


function renderWhatUsuallyComesNext() {
  const card = document.getElementById("whatNextCard");
  if (!card) return;
  const day = currentCycleDay();
  if (!day) {
    card.innerHTML = `<span>🔮</span><div><strong>What usually comes next?</strong><p>Add cycle history and daily logs so Tsuki can compare similar days.</p></div>`;
    return;
  }

  const upcoming = [1, 2, 3]
    .map(offset => ({ offset, summary: summarizePersonalDay(day + offset) }))
    .filter(item => item.summary.cycles >= 2 && (item.summary.symptom || item.summary.energy || item.summary.mood));

  if (!upcoming.length) {
    card.innerHTML = `<span>🔮</span><div><strong>What usually comes next?</strong><p>Tsuki is still collecting enough similar days to answer this reliably.</p></div>`;
    return;
  }

  const first = upcoming[0];
  const detail = first.summary.symptom || (first.summary.energy ? `${first.summary.energy.toLowerCase()} energy` : first.summary.mood);
  card.innerHTML = `<span>🔮</span><div><strong>What usually comes next?</strong><p>About ${first.offset} day${first.offset === 1 ? "" : "s"} from now, you often logged <b>${escapeHTML(detail)}</b> in ${first.summary.cycles} previous cycles.</p></div>`;
}

function bestHelpfulRelief() {
  const scores = new Map();
  data.relief.forEach(item => {
    if (!item.action) return;
    const entry = scores.get(item.action) || { action: item.action, positive: 0, total: 0 };
    entry.total += 1;
    if (item.helpful === "Helped a lot" || item.helpful === "Helped a little") entry.positive += 1;
    scores.set(item.action, entry);
  });
  return Array.from(scores.values()).sort((a, b) => b.positive - a.positive || b.total - a.total)[0] || null;
}

function renderBeforeItHits() {
  const card = document.getElementById("beforeItHitsCard");
  if (!card) return;
  const windowData = estimatedWindow();
  if (!windowData) {
    card.innerHTML = `<span>🫧</span><div><strong>Before it hits</strong><p>Tsuki will prepare a gentle reminder once it can estimate your next period window.</p></div>`;
    return;
  }

  const days = daysBetween(parseDate(todayKey()), windowData.start);
  const relief = bestHelpfulRelief();
  if (days > 7) {
    card.innerHTML = `<span>🫧</span><div><strong>Before it hits</strong><p>Your estimated window is ${formatDate(windowData.start)}–${formatDate(windowData.end)}. Nothing to prep yet.</p></div>`;
    return;
  }

  const missing = data.periodKit.filter(item => !item.packed).length;
  const reliefText = relief && relief.positive > 0 ? ` You previously marked ${escapeHTML(relief.action)} as helpful.` : "";
  card.innerHTML = `<span>🫧</span><div><strong>Before it hits</strong><p>Your estimated window is close.${missing ? ` ${missing} Moon Bag item${missing === 1 ? " is" : "s are"} not ready.` : " Your Moon Bag is ready."}${reliefText}</p></div>`;
}

function renderTsukiEchoes() {
  const card = document.getElementById("tsukiEchoesCard");
  if (!card) return;
  const day = currentCycleDay();
  if (!day) {
    card.innerHTML = `<span>🌗</span><div><strong>Tsuki Echoes</strong><p>Days like today will appear here after you build some history.</p></div>`;
    return;
  }
  const logs = historicalLogsNearCycleDay(day, 0);
  const cycles = distinctCount(logs.map(log => log.context.cycleId));
  if (cycles < 2) {
    card.innerHTML = `<span>🌗</span><div><strong>Tsuki Echoes · Day ${day}</strong><p>Tsuki needs at least two past cycles with a log around this exact cycle day.</p></div>`;
    return;
  }
  const symptom = frequency(logs.flatMap(log => log.symptoms || []));
  const mood = frequency(logs.map(log => log.mood));
  const joyCount = logs.filter(log => log.tinyJoy).length;
  const bits = [];
  if (symptom) bits.push(`${symptom[0]} appeared most often`);
  if (mood) bits.push(`${mood[0]} was the most common mood`);
  if (joyCount) bits.push(`${joyCount} tiny joy${joyCount === 1 ? "" : "s"} were saved`);
  card.innerHTML = `<span>🌗</span><div><strong>Tsuki Echoes · Day ${day}</strong><p>${bits.length ? escapeHTML(bits.join(" · ")) : "You logged this cycle day before, but there is no strong detail to summarize yet."} · ${cycles} past cycles.</p></div>`;
}

function renderNextMoonMessage() {
  const card = document.getElementById("nextMoonMessageCard");
  if (!card) return;
  const periods = validPeriods();
  const current = latestPeriod();
  if (!current || periods.length < 2) {
    card.classList.add("hidden");
    return;
  }
  const previous = periods[periods.length - 2];
  if (!previous.nextMoonNote) {
    card.classList.add("hidden");
    return;
  }
  const day = currentCycleDay();
  if (!day || day > Math.max(7, averagePeriodLength() + 2)) {
    card.classList.add("hidden");
    return;
  }
  card.classList.remove("hidden");
  card.innerHTML = `<span>💌</span><div><strong>A note from your last moon</strong><p>${escapeHTML(previous.nextMoonNote)}</p></div>`;
}

function applyGentlePrepWindow() {
  const estimate = estimatedWindow();
  document.body.classList.remove("prep-soon", "prep-now");
  if (!estimate) return;
  const today = parseDate(todayKey());
  const daysToStart = daysBetween(today, estimate.start);
  if (daysToStart <= 2 && today <= estimate.end) document.body.classList.add("prep-now");
  else if (daysToStart <= 7 && daysToStart >= 0) document.body.classList.add("prep-soon");
}

function renderSignatureToday() {
  renderTsukiForecast();
  renderTonightTomorrow();
  renderWhatUsuallyComesNext();
  renderBeforeItHits();
  renderTsukiEchoes();
  renderNextMoonMessage();
}


/* ============================================================
   SIGNATURE INSIGHT ENGINE
   ============================================================ */

/*
  Minimum-evidence rules:

  - Timing insights require repeated observations across at least
    3 completed cycles.
  - Tsuki reports associations in the user's own logs.
  - Tsuki does not claim diagnosis, cause, or certainty.
*/

function allLogs() {
  return Object.entries(
    data.logs
  ).map(
    ([date, log]) => ({
      date,
      ...log
    })
  );
}


function frequency(values) {
  const counts = {};

  values
    .filter(Boolean)
    .forEach(
      value => {
        counts[value] =
          (counts[value] || 0) + 1;
      }
    );

  const sorted =
    Object.entries(
      counts
    ).sort(
      (a, b) =>
        b[1] - a[1]
    );

  return sorted[0] || null;
}


function commonMood() {
  return frequency(
    allLogs().map(
      log =>
        log.mood
    )
  );
}


function commonSymptom() {
  return frequency(
    allLogs().flatMap(
      log =>
        log.symptoms || []
    )
  );
}


function completedCycles() {
  const periods =
    validPeriods();

  const cycles = [];

  for (
    let i = 0;
    i < periods.length - 1;
    i++
  ) {
    const period =
      periods[i];

    const next =
      periods[i + 1];

    const start =
      parseDate(period.start);

    const nextStart =
      parseDate(next.start);

    const cycleLength =
      daysBetween(
        start,
        nextStart
      );

    if (
      cycleLength < 15 ||
      cycleLength > 60
    ) {
      continue;
    }

    cycles.push({
      id: period.id,
      start: period.start,
      end:
        dateKey(
          addDays(
            nextStart,
            -1
          )
        ),
      nextStart:
        next.start,
      cycleLength,
      periodLength:
        periodDuration(period) ||
        averagePeriodLength(),
      context:
        period.context || "",
      nextMoonNote:
        period.nextMoonNote || ""
    });
  }

  return cycles;
}


function cycleContextForDate(
  dateValue
) {
  const date =
    parseDate(dateValue);

  if (!date) {
    return null;
  }

  const cycles =
    completedCycles();

  const cycle =
    cycles.find(
      item => {
        const start =
          parseDate(item.start);

        const nextStart =
          parseDate(
            item.nextStart
          );

        return (
          date >= start &&
          date < nextStart
        );
      }
    );

  if (!cycle) {
    return null;
  }

  const start =
    parseDate(cycle.start);

  const nextStart =
    parseDate(
      cycle.nextStart
    );

  const cycleDay =
    daysBetween(
      start,
      date
    ) + 1;

  const daysBeforeNextPeriod =
    daysBetween(
      date,
      nextStart
    );

  const ovulationEstimate =
    Math.max(
      cycle.periodLength + 3,
      cycle.cycleLength - 14
    );

  let phase =
    "Luteal";

  if (
    cycleDay <=
    cycle.periodLength
  ) {
    phase =
      "Period";
  }
  else if (
    Math.abs(
      cycleDay -
      ovulationEstimate
    ) <= 2
  ) {
    phase =
      "Mid-cycle";
  }
  else if (
    cycleDay <
    ovulationEstimate - 2
  ) {
    phase =
      "Follicular";
  }

  return {
    cycleId:
      cycle.id,
    cycleStart:
      cycle.start,
    cycleEnd:
      cycle.end,
    cycleDay,
    cycleLength:
      cycle.cycleLength,
    periodLength:
      cycle.periodLength,
    daysBeforeNextPeriod,
    phase
  };
}


function logsWithCycleContext() {
  return allLogs()
    .map(
      log => ({
        ...log,
        context:
          cycleContextForDate(
            log.date
          )
      })
    )
    .filter(
      log =>
        log.context
    );
}


function distinctCount(values) {
  return new Set(
    values.filter(Boolean)
  ).size;
}


function timingBucket(context) {
  if (!context) {
    return null;
  }

  if (
    context.cycleDay <= 2
  ) {
    return {
      id: "period-days-1-2",
      label:
        "on Days 1–2 of your period"
    };
  }

  if (
    context.daysBeforeNextPeriod >= 1 &&
    context.daysBeforeNextPeriod <= 3
  ) {
    return {
      id: "pre-period-1-3",
      label:
        "1–3 days before your next period"
    };
  }

  if (
    context.phase ===
    "Mid-cycle"
  ) {
    return {
      id: "mid-cycle",
      label:
        "around the middle of your cycle"
    };
  }

  if (
    context.phase ===
    "Follicular"
  ) {
    return {
      id: "follicular",
      label:
        "during your follicular phase"
    };
  }

  if (
    context.phase ===
    "Luteal"
  ) {
    return {
      id: "luteal",
      label:
        "during your luteal phase"
    };
  }

  return {
    id: "period",
    label:
      "during your period"
  };
}


function patternConfidence(
  cycles,
  observations
) {
  if (
    cycles >= 6 &&
    observations >= 6
  ) {
    return {
      label: "Strong",
      className: "strong"
    };
  }

  if (
    cycles >= 4
  ) {
    return {
      label: "Recurring",
      className: "recurring"
    };
  }

  return {
    label: "Emerging",
    className: "emerging"
  };
}


function createInsight({
  id,
  icon,
  title,
  text,
  cycles,
  observations,
  category
}) {
  const confidence =
    patternConfidence(
      cycles,
      observations
    );

  return {
    id,
    icon,
    title,
    text,
    cycles,
    observations,
    category,
    confidence
  };
}


function symptomTimingInsights() {
  const contextualLogs =
    logsWithCycleContext();

  const occurrences =
    new Map();

  contextualLogs.forEach(
    log => {
      const symptoms =
        log.symptoms || [];

      const bucket =
        timingBucket(
          log.context
        );

      if (!bucket) return;

      symptoms.forEach(
        symptom => {
          const key =
            `${symptom}::${bucket.id}`;

          if (
            !occurrences.has(key)
          ) {
            occurrences.set(
              key,
              {
                symptom,
                bucket,
                logs: [],
                cycles: new Set()
              }
            );
          }

          const entry =
            occurrences.get(key);

          entry.logs.push(log);
          entry.cycles.add(
            log.context.cycleId
          );
        }
      );
    }
  );

  const insights = [];

  occurrences.forEach(
    entry => {
      const cycleCount =
        entry.cycles.size;

      const observations =
        entry.logs.length;

      if (
        cycleCount < 3
      ) {
        return;
      }

      const symptomLower =
        entry.symptom.toLowerCase();

      let icon = "🌸";

      if (
        entry.symptom === "Headache"
      ) {
        icon = "☁️";
      }
      else if (
        entry.symptom === "Acne"
      ) {
        icon = "✨";
      }
      else if (
        entry.symptom === "Fatigue"
      ) {
        icon = "💤";
      }
      else if (
        entry.symptom === "Cravings"
      ) {
        icon = "🍓";
      }

      insights.push(
        createInsight({
          id:
            `symptom:${entry.symptom}:${entry.bucket.id}`,
          icon,
          title:
            `${entry.symptom} has a timing pattern`,
          text:
            `You logged ${symptomLower} ${entry.bucket.label} in ${cycleCount} completed cycles.`,
          cycles:
            cycleCount,
          observations,
          category:
            "symptom"
        })
      );
    }
  );

  return insights;
}


function phaseValueInsights(
  field,
  icon,
  category
) {
  const contextualLogs =
    logsWithCycleContext()
      .filter(
        log =>
          Boolean(
            log[field]
          )
      );

  const groups =
    new Map();

  contextualLogs.forEach(
    log => {
      const value =
        log[field];

      const phase =
        log.context.phase;

      const key =
        `${phase}::${value}`;

      if (
        !groups.has(key)
      ) {
        groups.set(
          key,
          {
            phase,
            value,
            logs: [],
            cycles: new Set()
          }
        );
      }

      const entry =
        groups.get(key);

      entry.logs.push(log);
      entry.cycles.add(
        log.context.cycleId
      );
    }
  );

  const insights = [];

  groups.forEach(
    entry => {
      const cycles =
        entry.cycles.size;

      const observations =
        entry.logs.length;

      if (
        cycles < 3
      ) {
        return;
      }

      const phaseText =
        entry.phase === "Mid-cycle"
          ? "around mid-cycle"
          : `during your ${entry.phase.toLowerCase()} phase`;

      const fieldLabel =
        field === "mood"
          ? "mood"
          : "energy";

      insights.push(
        createInsight({
          id:
            `${field}:${entry.value}:${entry.phase}`,
          icon,
          title:
            `${entry.value} ${fieldLabel} repeats ${phaseText}`,
          text:
            `You logged ${entry.value.toLowerCase()} ${fieldLabel} ${phaseText} across ${cycles} completed cycles.`,
          cycles,
          observations,
          category
        })
      );
    }
  );

  return insights;
}


function strongPainTimingInsights() {
  const contextualLogs =
    logsWithCycleContext()
      .filter(
        log =>
          Number(
            log.pain
          ) >= 3
      );

  const groups =
    new Map();

  contextualLogs.forEach(
    log => {
      const bucket =
        timingBucket(
          log.context
        );

      if (!bucket) return;

      if (
        !groups.has(
          bucket.id
        )
      ) {
        groups.set(
          bucket.id,
          {
            bucket,
            logs: [],
            cycles: new Set()
          }
        );
      }

      const entry =
        groups.get(
          bucket.id
        );

      entry.logs.push(log);
      entry.cycles.add(
        log.context.cycleId
      );
    }
  );

  const insights = [];

  groups.forEach(
    entry => {
      const cycles =
        entry.cycles.size;

      if (
        cycles < 3
      ) {
        return;
      }

      insights.push(
        createInsight({
          id:
            `pain:${entry.bucket.id}`,
          icon:
            "⚡",
          title:
            "Stronger pain has a recurring time",
          text:
            `You logged stronger pain ${entry.bucket.label} in ${cycles} completed cycles.`,
          cycles,
          observations:
            entry.logs.length,
          category:
            "pain"
        })
      );
    }
  );

  return insights;
}


function cycleVariabilityInsight() {
  const intervals =
    cycleIntervals();

  if (
    intervals.length < 3
  ) {
    return [];
  }

  const variability =
    cycleVariability();

  if (
    variability === null
  ) {
    return [];
  }

  const cycles =
    intervals.length;

  if (
    variability <= 3
  ) {
    return [
      createInsight({
        id:
          "cycle:variability:consistent",
        icon:
          "🌙",
        title:
          "Your recent cycles look fairly consistent",
        text:
          `Your cycle length has varied by about ±${variability} days across your recent history.`,
        cycles,
        observations:
          intervals.length,
        category:
          "cycle"
      })
    ];
  }

  return [
    createInsight({
      id:
        "cycle:variability:variable",
      icon:
        "🌙",
      title:
        "Your cycle length varies more",
      text:
        `Your recent cycle lengths varied by about ±${variability} days, so Tsuki uses a wider prediction window.`,
      cycles,
      observations:
        intervals.length,
      category:
        "cycle"
    })
  ];
}


function buildInsights({
  includeDismissed = false
} = {}) {
  const completed =
    completedCycles();

  const insights = [
    ...cycleVariabilityInsight(),
    ...symptomTimingInsights(),
    ...phaseValueInsights(
      "mood",
      "💗",
      "mood"
    ),
    ...phaseValueInsights(
      "energy",
      "🔋",
      "energy"
    ),
    ...strongPainTimingInsights()
  ];

  /*
    Prefer patterns with evidence from more cycles,
    then more observations.
  */
  insights.sort(
    (a, b) =>
      b.cycles -
        a.cycles ||
      b.observations -
        a.observations
  );

  const unique =
    Array.from(
      new Map(
        insights.map(
          insight => [
            insight.id,
            insight
          ]
        )
      ).values()
    );

  const dismissed =
    new Set(
      data.insightState.dismissed
    );

  const visible =
    includeDismissed
      ? unique
      : unique.filter(
          insight =>
            !dismissed.has(
              insight.id
            )
        );

  if (
    visible.length
  ) {
    return visible;
  }

  if (
    completed.length < 3
  ) {
    return [
      {
        id:
          "learning:cycles",
        icon:
          "🌱",
        title:
          "Tsuki is still learning your rhythm",
        text:
          `You have ${completed.length} completed cycle${completed.length === 1 ? "" : "s"} available for pattern analysis. Timing insights begin after repeated observations across at least 3 completed cycles.`,
        cycles:
          completed.length,
        observations:
          allLogs().length,
        category:
          "learning",
        confidence: {
          label:
            "Learning",
          className:
            "emerging"
        },
        informational:
          true
      }
    ];
  }

  return [
    {
      id:
        "learning:no-pattern",
      icon:
        "🌙",
      title:
        "No repeated timing pattern yet",
      text:
        "You have enough cycle history, but Tsuki has not found a pattern that repeats across at least 3 completed cycles. That is completely valid data too.",
      cycles:
        completed.length,
      observations:
        allLogs().length,
      category:
        "learning",
      confidence: {
        label:
          "No strong pattern",
        className:
          "emerging"
      },
      informational:
        true
    }
  ];
}


function insightCardHTML(
  insight
) {
  const saved =
    data.insightState.saved.includes(
      insight.id
    );

  return `
    <article
      class="insight-card"
      data-insight-id="${escapeHTML(insight.id)}"
    >

      <div class="insight-card-top">

        <div class="insight-card-heading">

          <div class="icon">
            ${insight.icon}
          </div>

          <h4>
            ${escapeHTML(
              insight.title
            )}
          </h4>

        </div>

        ${
          insight.informational
            ? ""
            : `
              <div class="insight-actions">

                <button
                  type="button"
                  class="insight-action save-insight ${saved ? "saved" : ""}"
                  data-save-insight="${escapeHTML(insight.id)}"
                  aria-label="${saved ? "Remove saved insight" : "Save insight"}"
                  title="${saved ? "Remove from saved" : "Save insight"}"
                >
                  ${saved ? "♥" : "♡"}
                </button>

                <button
                  type="button"
                  class="insight-action dismiss dismiss-insight"
                  data-dismiss-insight="${escapeHTML(insight.id)}"
                  aria-label="Dismiss insight"
                  title="Dismiss insight"
                >
                  ×
                </button>

              </div>
            `
        }

      </div>

      <p>
        ${escapeHTML(
          insight.text
        )}
      </p>

      ${
        insight.informational
          ? ""
          : `
            <details class="evidence-drawer">
              <summary>Why am I seeing this?</summary>
              <p>Tsuki found ${insight.observations} matching observation${insight.observations === 1 ? "" : "s"} across ${insight.cycles} completed cycle${insight.cycles === 1 ? "" : "s"}. It only describes your own logs and does not infer a diagnosis or cause.</p>
            </details>
          `
      }

      <div class="insight-meta">

        <span
          class="pattern-confidence ${insight.confidence.className}"
        >
          ${escapeHTML(
            insight.confidence.label
          )}
        </span>

        ${
          insight.informational
            ? ""
            : `
              <span class="evidence-badge">
                Seen across ${insight.cycles} cycles
              </span>
            `
        }

      </div>

    </article>
  `;
}


function bindInsightActions() {
  document
    .querySelectorAll(
      "[data-save-insight]"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () => {
            const id =
              button.dataset.saveInsight;

            const saved =
              data.insightState.saved;

            if (
              saved.includes(id)
            ) {
              data.insightState.saved =
                saved.filter(
                  item =>
                    item !== id
                );

              showToast(
                "Removed from saved insights."
              );
            }
            else {
              data.insightState.saved.push(
                id
              );

              showToast(
                "Insight saved ♡"
              );
            }

            saveData();
            renderInsights();
            renderHomeInsights();
          }
        );
      }
    );

  document
    .querySelectorAll(
      "[data-dismiss-insight]"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () => {
            const id =
              button.dataset.dismissInsight;

            if (
              !data.insightState.dismissed.includes(
                id
              )
            ) {
              data.insightState.dismissed.push(
                id
              );
            }

            data.insightState.saved =
              data.insightState.saved.filter(
                item =>
                  item !== id
              );

            saveData();
            renderInsights();
            renderHomeInsights();

            showToast(
              "Insight dismissed."
            );
          }
        );
      }
    );
}


function renderHomeInsights() {
  const insights =
    buildInsights()
      .slice(0, 1);

  document
    .getElementById(
      "homeInsights"
    )
    .innerHTML =
      insights
        .map(
          insightCardHTML
        )
        .join("");

  bindInsightActions();
}


function phaseSummary(
  phase
) {
  const logs =
    logsWithCycleContext()
      .filter(
        log =>
          log.context.phase ===
          phase
      );

  const mood =
    frequency(
      logs.map(
        log =>
          log.mood
      )
    );

  const energy =
    frequency(
      logs.map(
        log =>
          log.energy
      )
    );

  const symptom =
    frequency(
      logs.flatMap(
        log =>
          log.symptoms || []
      )
    );

  return {
    phase,
    samples:
      logs.length,
    cycles:
      distinctCount(
        logs.map(
          log =>
            log.context.cycleId
        )
      ),
    mood:
      mood
        ? mood[0]
        : null,
    energy:
      energy
        ? energy[0]
        : null,
    symptom:
      symptom
        ? symptom[0]
        : null
  };
}


function renderPhasePatternGrid() {
  const phases = [
    {
      name:
        "Period",
      icon:
        "🌸",
      className:
        "period-phase"
    },
    {
      name:
        "Follicular",
      icon:
        "🌱",
      className:
        "follicular-phase"
    },
    {
      name:
        "Mid-cycle",
      icon:
        "✨",
      className:
        "midcycle-phase"
    },
    {
      name:
        "Luteal",
      icon:
        "🌙",
      className:
        "luteal-phase"
    }
  ];

  const container =
    document.getElementById(
      "phasePatternGrid"
    );

  if (!container) {
    return;
  }

  container.innerHTML =
    phases.map(
      phaseInfo => {
        const summary =
          phaseSummary(
            phaseInfo.name
          );

        return `
          <article
            class="phase-card ${phaseInfo.className}"
          >

            <div class="phase-card-icon">
              ${phaseInfo.icon}
            </div>

            <h4>
              ${phaseInfo.name}
            </h4>

            <p class="phase-line">
              Mood:
              <strong>
                ${summary.mood ? escapeHTML(summary.mood) : "Still learning"}
              </strong>
            </p>

            <p class="phase-line">
              Energy:
              <strong>
                ${summary.energy ? escapeHTML(summary.energy) : "Still learning"}
              </strong>
            </p>

            <p class="phase-line">
              Common log:
              <strong>
                ${summary.symptom ? escapeHTML(summary.symptom) : "No clear pattern"}
              </strong>
            </p>

            <span class="phase-sample">
              ${summary.samples} check-in${summary.samples === 1 ? "" : "s"} · ${summary.cycles} cycle${summary.cycles === 1 ? "" : "s"}
            </span>

          </article>
        `;
      }
    ).join("");
}


function renderMyNormal() {
  const cycleRange = numberRange(cycleIntervals());
  const periodRange = numberRange(completedPeriodDurations());
  const cycleEl = document.getElementById("normalCycleRange");
  const periodEl = document.getElementById("normalPeriodRange");
  const todayEl = document.getElementById("normalTodayText");

  if (cycleEl) cycleEl.textContent = cycleRange ? `${cycleRange.min}–${cycleRange.max} days` : "Still learning";
  if (periodEl) periodEl.textContent = periodRange ? `${periodRange.min}–${periodRange.max} days` : `${averagePeriodLength()} days estimated`;

  if (todayEl) {
    const day = currentCycleDay();
    const summary = day ? summarizePersonalDay(day) : null;
    if (!summary || summary.cycles < 2) todayEl.textContent = "Tsuki needs more similar days first.";
    else {
      const bits = [];
      if (summary.mood) bits.push(`${summary.mood} mood`);
      if (summary.energy) bits.push(`${summary.energy.toLowerCase()} energy`);
      if (summary.symptom) bits.push(summary.symptom);
      todayEl.textContent = bits.length ? `Around Day ${day}, your usual logs include ${bits.join(", ")}.` : `Day ${day} has no strong recurring detail yet.`;
    }
  }
}

function renderMoonMap() {
  const container = document.getElementById("moonMap");
  if (!container) return;
  const phases = ["Period", "Follicular", "Mid-cycle", "Luteal"];
  const icons = { Period: "🌸", Follicular: "🌱", "Mid-cycle": "✨", Luteal: "🌙" };
  container.innerHTML = phases.map((phase, index) => {
    const summary = phaseSummary(phase);
    const detail = summary.symptom || summary.energy || summary.mood || "Learning";
    return `<div class="moon-map-orbit orbit-${index + 1}"><span>${icons[phase]}</span><strong>${phase}</strong><small>${escapeHTML(detail)}</small></div>`;
  }).join("");
}

function renderLearningMap() {
  const container = document.getElementById("learningMap");
  if (!container) return;
  const completed = completedCycles().length;
  const logs = allLogs().length;
  const metrics = [
    { label: "Cycle length", level: cycleIntervals().length >= 4 ? "Established" : cycleIntervals().length >= 2 ? "Recurring" : "Emerging" },
    { label: "Period length", level: completedPeriodDurations().length >= 4 ? "Established" : completedPeriodDurations().length >= 2 ? "Recurring" : "Emerging" },
    { label: "Symptom timing", level: completed >= 4 && logs >= 12 ? "Established" : completed >= 3 ? "Recurring" : "Emerging" },
    { label: "Mood & energy", level: completed >= 4 && logs >= 16 ? "Established" : completed >= 2 && logs >= 8 ? "Recurring" : "Emerging" },
    { label: "Relief patterns", level: data.relief.filter(item => item.helpful !== "Not sure").length >= 5 ? "Established" : data.relief.length >= 2 ? "Recurring" : "Emerging" }
  ];
  const icon = { Established: "●", Recurring: "◐", Emerging: "○" };
  container.innerHTML = metrics.map(item => `<div class="learning-row ${item.level.toLowerCase()}"><span>${icon[item.level]}</span><strong>${item.label}</strong><em>${item.level}</em></div>`).join("");
}

function renderSymptomConstellations() {
  const container = document.getElementById("symptomConstellations");
  if (!container) return;
  const pairs = new Map();
  allLogs().forEach(log => {
    const symptoms = [...new Set(log.symptoms || [])].sort();
    for (let i = 0; i < symptoms.length; i++) {
      for (let j = i + 1; j < symptoms.length; j++) {
        const key = `${symptoms[i]} + ${symptoms[j]}`;
        pairs.set(key, (pairs.get(key) || 0) + 1);
      }
    }
  });
  const best = Array.from(pairs.entries()).sort((a, b) => b[1] - a[1])[0];
  container.innerHTML = best && best[1] >= 2
    ? `<p><strong>${escapeHTML(best[0])}</strong> were logged together on ${best[1]} days.</p><small>Association only — Tsuki does not infer a cause.</small>`
    : `<p>Log symptoms together over time and Tsuki can notice recurring combinations.</p>`;
}

function renderTinyJoyPattern() {
  const container = document.getElementById("tinyJoyPattern");
  if (!container) return;
  const joyLogs = allLogs().filter(log => log.tinyJoy);
  if (!joyLogs.length) {
    container.innerHTML = `<p>No tiny joys logged yet. Add one during a daily check-in whenever something good happens.</p>`;
    return;
  }
  const withPositiveMood = joyLogs.filter(log => log.mood === "Happy" || log.mood === "Calm").length;
  container.innerHTML = `<p>You saved <strong>${joyLogs.length}</strong> tiny joy${joyLogs.length === 1 ? "" : "s"}.${withPositiveMood ? ` ${withPositiveMood} were on days you also logged Happy or Calm.` : ""}</p><small>Tsuki records this as a pattern, not a claim of causation.</small>`;
}

function renderLivingStory() {
  const container = document.getElementById("livingTsukiStory");
  if (!container) return;
  const current = latestPeriod();
  if (!current) {
    container.innerHTML = `<h3>Your living story is waiting 🌙</h3><p class="story-empty">Start your first cycle and it will grow as you check in.</p>`;
    return;
  }
  const start = parseDate(current.start);
  const logs = allLogs().filter(log => parseDate(log.date) >= start);
  const mood = frequency(logs.map(log => log.mood));
  const symptom = frequency(logs.flatMap(log => log.symptoms || []));
  const joys = logs.filter(log => log.tinyJoy).length;
  const parts = [`Cycle Day ${currentCycleDay() || 1}`, `${logs.length} check-in${logs.length === 1 ? "" : "s"}`];
  if (mood) parts.push(`most logged mood: ${mood[0]}`);
  if (symptom) parts.push(`common symptom: ${symptom[0]}`);
  if (joys) parts.push(`${joys} tiny joy${joys === 1 ? "" : "s"}`);
  container.innerHTML = `<h3>This moon is still unfolding ✨</h3><p>${escapeHTML(parts.join(" · "))}</p><p class="muted small-text">This recap updates as you log more days.</p>`;
}


function sameMoonData() {
  const day = currentCycleDay(); const cycles = completedCycles();
  if (!day || !cycles.length) return null;
  const last = cycles[cycles.length - 1];
  const date = dateKey(addDays(parseDate(last.start), day - 1));
  return { date, log: data.logs[date] || null, day };
}
function renderSameMoonInsight() {
  const c=document.getElementById("sameMoonInsight"); if(!c)return;
  const item=sameMoonData();
  if(!item||!item.log){c.innerHTML='<p>Tsuki needs a check-in from roughly the same cycle day in a previous cycle.</p>';return;}
  const l=item.log;c.innerHTML=`<p><strong>Last cycle · Day ${item.day}</strong></p><p>${l.mood?`💗 ${escapeHTML(l.mood)} `:""}${l.energy?`✨ ${escapeHTML(l.energy)} energy`:""}</p>${l.symptoms?.length?`<p>🌸 ${l.symptoms.map(escapeHTML).join(", ")}</p>`:""}${l.tinyJoy?`<small>🌷 ${escapeHTML(l.tinyJoy)}</small>`:""}`;
}
function renderFeelOffInsight() {
  const c=document.getElementById("feelOffInsight"); if(!c)return;
  const today=data.logs[todayKey()]; const day=currentCycleDay(); if(!today||!day){c.innerHTML='<p>Check in today and Tsuki can compare it with similar cycle days.</p>';return;}
  const history=historicalLogsNearCycleDay(day,1).filter(l=>l.date!==todayKey()); if(history.length<2){c.innerHTML='<p>Still learning your personal baseline for this point in the cycle.</p>';return;}
  const usualEnergy=frequency(history.map(l=>l.energy)); const usualMood=frequency(history.map(l=>l.mood)); const differences=[];
  if(today.energy&&usualEnergy&&today.energy!==usualEnergy[0]) differences.push(`Energy is ${today.energy.toLowerCase()} vs your usual ${usualEnergy[0].toLowerCase()}.`);
  if(today.mood&&usualMood&&today.mood!==usualMood[0]) differences.push(`Mood differs from your most common “${usualMood[0]}” around here.`);
  c.innerHTML=differences.length?`<p>${differences.map(escapeHTML).join(" ")}</p><small>Different is not bad — this only compares your own logs.</small>`:'<p>Today looks fairly similar to your previous nearby cycle days.</p>';
}
function allSymptomsList(){return [...new Set(allLogs().flatMap(l=>l.symptoms||[]).concat(data.customSymptoms||[]))].sort();}
function renderMoonLensOptions(){const s=document.getElementById("moonLensSymptom");if(!s)return;const current=s.value;const symptoms=allSymptomsList();s.innerHTML=symptoms.length?symptoms.map(v=>`<option value="${escapeHTML(v)}">${escapeHTML(v)}</option>`).join(""):'<option value="">No symptoms yet</option>';if(symptoms.includes(current))s.value=current;renderMoonLens();}
function renderMoonLens(){const s=document.getElementById("moonLensSymptom");const c=document.getElementById("moonLensResult");if(!s||!c)return;const symptom=s.value;if(!symptom){c.innerHTML='<p>Log symptoms first to use Moon Lens.</p>';return;}const occurrences=allLogs().filter(l=>(l.symptoms||[]).includes(symptom));const nearby=[];occurrences.forEach(o=>{const d=parseDate(o.date);[-1,1].forEach(offset=>{const log=data.logs[dateKey(addDays(d,offset))];if(log)nearby.push({offset,log});});});const before=frequency(nearby.filter(x=>x.offset<0).flatMap(x=>x.log.symptoms||[]).filter(x=>x!==symptom));const after=frequency(nearby.filter(x=>x.offset>0).flatMap(x=>x.log.symptoms||[]).filter(x=>x!==symptom));c.innerHTML=`<p><strong>${escapeHTML(symptom)}</strong> appears in ${occurrences.length} check-in${occurrences.length===1?"":"s"}.</p><p>${before?`Before: ${escapeHTML(before[0])}. `:""}${after?`After: ${escapeHTML(after[0])}.`:""}</p><small>Nearby observations only — not causes.</small>`;}
document.getElementById("moonLensSymptom")?.addEventListener("change",renderMoonLens);
function renderSymptomChainsAdvanced(){const c=document.getElementById("symptomChains");if(!c)return;const logs=allLogs().sort((a,b)=>parseDate(a.date)-parseDate(b.date));const chains=new Map();for(let i=0;i<logs.length;i++){for(let j=i+1;j<logs.length;j++){const gap=daysBetween(parseDate(logs[i].date),parseDate(logs[j].date));if(gap<1)continue;if(gap>2)break;for(const a of logs[i].symptoms||[])for(const b of logs[j].symptoms||[]){if(a===b)continue;const k=`${a} → ${b}`;chains.set(k,(chains.get(k)||0)+1);}}}const top=[...chains.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3).filter(x=>x[1]>=2);c.innerHTML=top.length?top.map(([k,n])=>`<p><strong>${escapeHTML(k)}</strong><br><small>${n} repeated sequences within 2 days</small></p>`).join(""):'<p>No repeated symptom sequences yet.</p>';}
function renderCycleForkOptions(){const s=document.getElementById("cycleForkContext");if(!s)return;const contexts=[...new Set(completedCycles().map(c=>c.context).filter(Boolean))];s.innerHTML=contexts.length?contexts.map(v=>`<option value="${escapeHTML(v)}">${escapeHTML(v)} vs other cycles</option>`).join(""):'<option value="">No cycle contexts yet</option>';renderCycleFork();}
function renderCycleFork(){const s=document.getElementById("cycleForkContext");const c=document.getElementById("cycleForkResult");if(!s||!c)return;const ctx=s.value;if(!ctx){c.innerHTML='<p>Add cycle context labels such as Travel or High Stress first.</p>';return;}const cycles=completedCycles();const a=cycles.filter(x=>x.context===ctx),b=cycles.filter(x=>x.context!==ctx);if(!a.length||!b.length){c.innerHTML='<p>Tsuki needs both labeled and comparison cycles.</p>';return;}const aa=Math.round(average(a.map(x=>x.cycleLength))),bb=Math.round(average(b.map(x=>x.cycleLength)));c.innerHTML=`<p><strong>${escapeHTML(ctx)}:</strong> ${aa}-day average<br><strong>Other cycles:</strong> ${bb}-day average</p><small>This compares your own labeled cycle history.</small>`;}
document.getElementById("cycleForkContext")?.addEventListener("change",renderCycleFork);
function renderEnergyCompass(){const c=document.getElementById("energyCompass");if(!c)return;const phases=["Period","Follicular phase","Estimated ovulation","Luteal phase"];const score={Low:1,Medium:2,High:3};const rows=phases.map(p=>{const logs=allLogs().filter(l=>(l.phaseAtLog||phaseForDate(l.date))===p&&score[l.energy]);const avg=logs.length?average(logs.map(l=>score[l.energy])):0;return{p,avg,n:logs.length};});const best=rows.filter(r=>r.n).sort((a,b)=>b.avg-a.avg)[0];c.innerHTML=rows.some(r=>r.n)?`<div class="energy-compass-bars">${rows.map(r=>`<div><span>${escapeHTML(r.p.replace(" phase",""))}</span><i style="--energy:${Math.round((r.avg/3)*100)}%"></i><small>${r.n} logs</small></div>`).join("")}</div>${best?`<p class="muted small-text">Your historically higher-energy window so far is <strong>${escapeHTML(best.p)}</strong>.</p>`:""}`:'<p>Log energy across your cycle to build your Energy Compass.</p>';}
function renderPhaseHeatmap(){const c=document.getElementById("phaseHeatmap");if(!c)return;const phases=["Period","Follicular phase","Estimated ovulation","Luteal phase"];c.innerHTML=`<div class="phase-heatmap-grid">${phases.map(p=>{const logs=allLogs().filter(l=>(l.phaseAtLog||phaseForDate(l.date))===p);const symptomCount=logs.reduce((s,l)=>s+(l.symptoms?.length||0),0);const mood=frequency(logs.map(l=>l.mood));return`<div><strong>${escapeHTML(p.replace(" phase",""))}</strong><span>${logs.length} logs</span><small>${symptomCount} symptom entries${mood?` · ${escapeHTML(mood[0])}`:""}</small></div>`;}).join("")}</div>`;}
function renderAdvancedInsights(){renderSameMoonInsight();renderFeelOffInsight();renderMoonLensOptions();renderSymptomChainsAdvanced();renderCycleForkOptions();renderEnergyCompass();renderPhaseHeatmap();}

function renderInsights() {
  const allInsights =
    buildInsights();

  let insights =
    allInsights;

  if (
    insightView ===
    "saved"
  ) {
    const savedIds =
      new Set(
        data.insightState.saved
      );

    insights =
      buildInsights({
        includeDismissed:
          true
      }).filter(
        insight =>
          savedIds.has(
            insight.id
          )
      );
  }

  const insightList =
    document.getElementById(
      "insightList"
    );

  if (
    insightView === "saved" &&
    !insights.length
  ) {
    insightList.innerHTML = `
      <article class="empty-insight-card">
        <span>♡</span>
        <h4>No saved insights yet</h4>
        <p>
          Tap the heart on a Tsuki Noticed card when you want to keep it here.
        </p>
      </article>
    `;
  }
  else {
    insightList.innerHTML =
      insights
        .map(
          insightCardHTML
        )
        .join("");
  }

  bindInsightActions();

  const savedCount =
    document.getElementById(
      "savedInsightCount"
    );

  if (savedCount) {
    savedCount.textContent =
      data.insightState.saved.length;
  }

  document
    .getElementById(
      "showAllInsights"
    )
    ?.classList.toggle(
      "active",
      insightView === "all"
    );

  document
    .getElementById(
      "showSavedInsights"
    )
    ?.classList.toggle(
      "active",
      insightView === "saved"
    );

  const avgCycle =
    averageCycleLength();

  const avgPeriod =
    averagePeriodLength();

  const variability =
    cycleVariability();

  document
    .getElementById(
      "averageCycleLength"
    )
    .textContent =
      `${avgCycle} days`;

  document
    .getElementById(
      "statCycleLength"
    )
    .textContent =
      `${avgCycle} days`;

  document
    .getElementById(
      "statPeriodLength"
    )
    .textContent =
      `${avgPeriod} days`;

  document
    .getElementById(
      "statVariability"
    )
    .textContent =
      variability === null
        ? "Need more cycles"
        : `±${variability} days`;

  document
    .getElementById(
      "statCyclesLogged"
    )
    .textContent =
      data.periods.length;

  const mood =
    commonMood();

  document
    .getElementById(
      "statMood"
    )
    .textContent =
      mood
        ? mood[0]
        : "—";

  const symptom =
    commonSymptom();

  document
    .getElementById(
      "statSymptom"
    )
    .textContent =
      symptom
        ? symptom[0]
        : "—";

  renderMyNormal();
  renderMoonMap();
  renderLearningMap();
  renderSymptomConstellations();
  renderTinyJoyPattern();
  renderPhasePatternGrid();
  renderAdvancedInsights();
  renderLivingStory();
  renderTsukiStory();
}


/* ============================================================
   TSUKI STORY + PAST MOONS
   ============================================================ */

function logsForCycle(
  cycle
) {
  const start =
    parseDate(
      cycle.start
    );

  const nextStart =
    parseDate(
      cycle.nextStart
    );

  return allLogs()
    .filter(
      log => {
        const date =
          parseDate(
            log.date
          );

        return (
          date >= start &&
          date < nextStart
        );
      }
    )
    .sort(
      (a, b) =>
        parseDate(a.date) -
        parseDate(b.date)
    );
}


function cycleStoryData(
  cycle
) {
  const logs =
    logsForCycle(
      cycle
    );

  const mood =
    frequency(
      logs.map(
        log =>
          log.mood
      )
    );

  const symptom =
    frequency(
      logs.flatMap(
        log =>
          log.symptoms || []
      )
    );

  const lowEnergyDays =
    logs.filter(
      log =>
        log.energy ===
        "Low"
    ).length;

  const strongerPainDays =
    logs.filter(
      log =>
        Number(
          log.pain
        ) >= 3
    ).length;

  const flowLogs =
    logs.filter(
      log =>
        log.flow &&
        log.flow !==
        "None"
    );

  const tinyJoys =
    logs.filter(
      log =>
        log.tinyJoy
    );

  const facts = [];

  if (mood) {
    facts.push(
      `💗 Your most frequently logged mood was ${mood[0]}.`
    );
  }

  if (symptom) {
    facts.push(
      `🌸 ${symptom[0]} was your most frequently logged symptom.`
    );
  }

  if (lowEnergyDays) {
    facts.push(
      `🔋 You logged low energy on ${lowEnergyDays} day${lowEnergyDays === 1 ? "" : "s"}.`
    );
  }

  if (strongerPainDays) {
    facts.push(
      `☁️ You logged stronger pain on ${strongerPainDays} day${strongerPainDays === 1 ? "" : "s"}.`
    );
  }

  if (flowLogs.length) {
    facts.push(
      `🩸 You recorded flow on ${flowLogs.length} check-in${flowLogs.length === 1 ? "" : "s"}.`
    );
  }

  if (tinyJoys.length) {
    facts.push(
      `🌷 A tiny joy you saved: ${tinyJoys[tinyJoys.length - 1].tinyJoy}`
    );
  }

  return {
    cycle,
    logs,
    mood:
      mood
        ? mood[0]
        : null,
    symptom:
      symptom
        ? symptom[0]
        : null,
    strongerPainDays,
    lowEnergyDays,
    tinyJoys,
    facts
  };
}


function renderTsukiStory() {
  const story =
    document.getElementById(
      "tsukiStory"
    );

  if (!story) {
    return;
  }

  const cycles =
    completedCycles();

  if (!cycles.length) {
    story.innerHTML = `
      <h3>
        Your first Tsuki Story is still growing 🌙
      </h3>

      <p class="story-empty">
        A Past Moon is created after a cycle is completed by logging the start of the next period.
        Keep checking in and Tsuki will build the recap from your own entries.
      </p>
    `;

    return;
  }

  const cycle =
    cycles[
      cycles.length - 1
    ];

  const storyData =
    cycleStoryData(
      cycle
    );

  story.innerHTML = `
    <h3>
      ${formatDateLong(
        parseDate(
          cycle.start
        )
      )} 🌙
    </h3>

    <p>
      This cycle lasted
      <strong>
        ${cycle.cycleLength} days
      </strong>
      with an entered/estimated period length of
      <strong>
        ${cycle.periodLength} days
      </strong>.
      You made
      <strong>
        ${storyData.logs.length}
      </strong>
      check-in${storyData.logs.length === 1 ? "" : "s"}.
    </p>

    ${
      storyData.facts.length
        ? `
          <div class="story-fact-list">
            ${storyData.facts
              .slice(0, 4)
              .map(
                fact => `
                  <div class="story-fact">
                    ${escapeHTML(fact)}
                  </div>
                `
              )
              .join("")}
          </div>
        `
        : `
          <p class="story-empty">
            There were only a few details logged in this cycle.
            Your story will get richer as you check in more often.
          </p>
        `
    }

    <p class="muted small-text">
      Here’s what your own entries told Tsuki about this cycle.
    </p>
  `;
}


function renderPastMoons() {
  const container =
    document.getElementById(
      "pastMoonsList"
    );

  if (!container) {
    return;
  }

  const cycles =
    completedCycles()
      .slice()
      .reverse();

  if (!cycles.length) {
    container.innerHTML = `
      <article class="empty-insight-card">
        <span>🌙</span>
        <h4>No Past Moons yet</h4>
        <p>
          Your first Past Moon appears after one cycle is completed by logging the start of your next period.
        </p>
      </article>
    `;

    return;
  }

  container.innerHTML =
    cycles.map(
      cycle => {
        const story =
          cycleStoryData(
            cycle
          );

        const endDate =
          parseDate(
            cycle.end
          );

        const narrativeParts = [];

        if (
          story.mood
        ) {
          narrativeParts.push(
            `${story.mood} was your most frequently logged mood`
          );
        }

        if (
          story.symptom
        ) {
          narrativeParts.push(
            `${story.symptom.toLowerCase()} appeared most often in your symptom logs`
          );
        }

        if (
          story.strongerPainDays
        ) {
          narrativeParts.push(
            `${story.strongerPainDays} stronger-pain day${story.strongerPainDays === 1 ? "" : "s"} were logged`
          );
        }

        const narrative =
          narrativeParts.length
            ? `${narrativeParts.join(". ")}.`
            : "This cycle has only a few wellness details logged so far.";

        return `
          <article class="past-moon-card">

            <h3 class="past-moon-date">
              ${formatDateLong(
                parseDate(
                  cycle.start
                )
              )}
            </h3>

            <p class="past-moon-subtitle">
              Through
              ${formatDateLong(
                endDate
              )}
            </p>

            <div class="past-moon-stats">

              <div class="past-moon-stat">
                <small>Cycle</small>
                <strong>
                  ${cycle.cycleLength} days
                </strong>
              </div>

              <div class="past-moon-stat">
                <small>Period</small>
                <strong>
                  ${cycle.periodLength} days
                </strong>
              </div>

              <div class="past-moon-stat">
                <small>Check-ins</small>
                <strong>
                  ${story.logs.length}
                </strong>
              </div>

            </div>

            <p class="past-moon-story">
              ${escapeHTML(
                narrative
              )}
            </p>

            ${story.tinyJoys?.length ? `<p class="moon-memory-joy">🌷 ${escapeHTML(story.tinyJoys[story.tinyJoys.length - 1].tinyJoy)}</p>` : ""}

            ${cycle.context ? `<span class="cycle-context-chip">${escapeHTML(cycle.context)}</span>` : ""}

            <div class="next-moon-note">
              <label>💌 Note to my next moon</label>
              <textarea data-next-moon-note="${cycle.id}" placeholder="What should future-you remember?">${escapeHTML(cycle.nextMoonNote || "")}</textarea>
              <button type="button" data-save-next-moon="${cycle.id}">Save note</button>
            </div>

          </article>
        `;
      }
    ).join("");

  document.querySelectorAll("[data-save-next-moon]").forEach(button => {
    button.addEventListener("click", () => {
      const period = data.periods.find(item => item.id === button.dataset.saveNextMoon);
      const field = document.querySelector(`[data-next-moon-note="${button.dataset.saveNextMoon}"]`);
      if (!period || !field) return;
      period.nextMoonNote = field.value.trim();
      saveData();
      renderNextMoonMessage();
      showToast("Note saved for your next moon 💌");
    });
  });
}


document
  .getElementById(
    "showAllInsights"
  )
  ?.addEventListener(
    "click",
    () => {
      insightView =
        "all";

      renderInsights();
    }
  );


document
  .getElementById(
    "showSavedInsights"
  )
  ?.addEventListener(
    "click",
    () => {
      insightView =
        "saved";

      renderInsights();
    }
  );


/* ============================================================
   BAD DAY MODE
   ============================================================ */

let quietDayMood = "";

document
  .getElementById("toggleQuietInterface")
  ?.addEventListener("click", () => {
    data.settings.quietInterface = !data.settings.quietInterface;
    saveData();
    applySettings();
    showToast(data.settings.quietInterface ? "Extra quiet mode on ☁️" : "Full interface restored 🌙");
  });

document.querySelectorAll("[data-quiet-mood]").forEach(button => {
  button.addEventListener("click", () => {
    quietDayMood = button.dataset.quietMood;
    document.querySelectorAll("[data-quiet-mood]").forEach(item => item.classList.toggle("selected", item === button));
  });
});


document
  .getElementById(
    "saveBadDay"
  )
  .addEventListener(
    "click",
    () => {
      const key =
        todayKey();

      data.logs[key] = {
        ...(data.logs[key] || {}),
        pain:
          Number(
            document
              .getElementById(
                "badDayPain"
              )
              .value
          ),
        mood:
          quietDayMood || data.logs[key]?.mood || "",
        medication:
          document
            .getElementById(
              "badDayMedication"
            )
            .value
            .trim()
      };

      saveData();
      renderEverything();

      showToast(
        "Saved. Take it easy today 🌙"
      );
    }
  );


document
  .querySelectorAll(
    "[data-relief]"
  )
  .forEach(
    button => {
      button.addEventListener(
        "click",
        () => {
          data.relief.unshift({
            id: uid(),
            date: todayKey(),
            action:
              button.dataset.relief,
            helpful:
              "Not sure"
          });

          saveData();

          showToast(
            `${button.dataset.relief} added to your Relief Tracker 🌸`
          );
        }
      );
    }
  );


/* ============================================================
   RELIEF TRACKER
   ============================================================ */

document
  .getElementById(
    "addReliefButton"
  )
  .addEventListener(
    "click",
    () => {
      const action =
        document
          .getElementById(
            "reliefAction"
          )
          .value
          .trim();

      if (!action) {
        showToast(
          "Add what you tried first 🌙"
        );

        return;
      }

      data.relief.unshift({
        id: uid(),
        date:
          todayKey(),
        action,
        helpful:
          document
            .getElementById(
              "reliefHelpfulness"
            )
            .value
      });

      document
        .getElementById(
          "reliefAction"
        )
        .value = "";

      saveData();
      renderRelief();

      showToast(
        "Relief action saved 🌸"
      );
    }
  );


function renderRelief() {
  const container =
    document.getElementById(
      "reliefList"
    );

  if (!data.relief.length) {
    container.innerHTML = `
      <article class="soft-note">
        Try something comforting and log it here.
        Over time, Tsuki can help you remember what
        you personally found useful.
      </article>
    `;

    return;
  }

  container.innerHTML =
    data.relief
      .map(
        item => `
          <article class="list-card">

            <div class="list-icon">
              🌿
            </div>

            <div class="list-card-content">

              <strong>
                ${escapeHTML(
                  item.action
                )}
              </strong>

              <small>
                ${escapeHTML(
                  item.helpful
                )}
                ·
                ${escapeHTML(
                  item.date
                )}
              </small>

            </div>

            <button
              class="icon-button delete-relief"
              data-id="${item.id}"
            >
              ×
            </button>

          </article>
        `
      )
      .join("");

  document
    .querySelectorAll(
      ".delete-relief"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () => {
            data.relief =
              data.relief.filter(
                item =>
                  item.id !==
                  button.dataset.id
              );

            saveData();
            renderRelief();
          }
        );
      }
    );
}


/* ============================================================
   JOURNAL
   ============================================================ */

const journalDate =
  document.getElementById(
    "journalDate"
  );

journalDate.value =
  todayKey();


document
  .getElementById(
    "saveJournal"
  )
  .addEventListener(
    "click",
    () => {
      const text =
        document
          .getElementById(
            "journalText"
          )
          .value
          .trim();

      if (!text) {
        showToast(
          "Write something first 🌙"
        );

        return;
      }

      data.journal.unshift({
        id: uid(),
        date:
          journalDate.value,
        text
      });

      document
        .getElementById(
          "journalText"
        )
        .value = "";

      saveData();
      renderJournal();

      showToast(
        "Journal entry saved 🌸"
      );
    }
  );


function renderJournal() {
  const container =
    document.getElementById(
      "journalEntries"
    );

  if (!data.journal.length) {
    container.innerHTML = `
      <article class="soft-note">
        Your cycle journal is completely yours.
        Thoughts, moods, tiny wins, complaints — anything belongs here.
      </article>
    `;

    return;
  }

  container.innerHTML =
    data.journal
      .slice(0, 20)
      .map(
        entry => `
          <article class="list-card">

            <div class="list-icon">
              🌸
            </div>

            <div class="list-card-content">

              <strong>
                ${escapeHTML(
                  entry.date
                )}
              </strong>

              <small>
                ${
                  escapeHTML(
                    entry.text.length > 85
                      ? entry.text.slice(0, 85) + "…"
                      : entry.text
                  )
                }
              </small>

            </div>

          </article>
        `
      )
      .join("");
}


/* ============================================================
   PERIOD KIT
   ============================================================ */

document
  .getElementById(
    "addKitItem"
  )
  .addEventListener(
    "click",
    () => {
      const input =
        document.getElementById(
          "newKitItem"
        );

      const name =
        input.value.trim();

      if (!name) return;

      data.periodKit.push({
        id: uid(),
        name,
        packed: false
      });

      input.value = "";

      saveData();
      renderKit();
      renderGoingOut();
    }
  );


function renderMoonBagIntelligence() {
  const card = document.getElementById("moonBagIntelligence");
  if (!card) return;
  const total = data.periodKit.length;
  const ready = data.periodKit.filter(item => item.packed).length;
  const missing = total - ready;
  const estimate = estimatedWindow();
  let timing = "";
  if (estimate) {
    const days = daysBetween(parseDate(todayKey()), estimate.start);
    if (days >= 0 && days <= 7) timing = ` Your estimated period window begins in about ${days} day${days === 1 ? "" : "s"}.`;
  }
  card.innerHTML = `<span>${missing ? "🎀" : "✅"}</span><div><p class="eyebrow">MOON BAG INTELLIGENCE</p><h3>${missing ? `${missing} item${missing === 1 ? "" : "s"} still to pack` : "Your Moon Bag is ready"}</h3><p>${ready}/${total || 0} items ready.${timing}</p></div>`;
}


function renderKit() {
  renderMoonBagIntelligence();
  const container =
    document.getElementById(
      "kitList"
    );

  container.innerHTML =
    data.periodKit
      .map(
        item => `
          <div class="kit-row">

            <input
              type="checkbox"
              class="kit-toggle"
              data-id="${item.id}"
              ${item.packed ? "checked" : ""}
            >

            <span>
              ${escapeHTML(
                item.name
              )}
            </span>

            <button
              class="delete-kit"
              data-id="${item.id}"
              aria-label="Remove item"
            >
              ×
            </button>

          </div>
        `
      )
      .join("");

  document
    .querySelectorAll(
      ".kit-toggle"
    )
    .forEach(
      checkbox => {
        checkbox.addEventListener(
          "change",
          () => {
            const item =
              data.periodKit.find(
                item =>
                  item.id ===
                  checkbox.dataset.id
              );

            if (item) {
              item.packed =
                checkbox.checked;

              saveData();
              renderKit();
              renderGoingOut();
            }
          }
        );
      }
    );

  document
    .querySelectorAll(
      ".delete-kit"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () => {
            data.periodKit =
              data.periodKit.filter(
                item =>
                  item.id !==
                  button.dataset.id
              );

            saveData();
            renderKit();
            renderGoingOut();
          }
        );
      }
    );
}


/* ============================================================
   GOING OUT MODE
   ============================================================ */

document
  .getElementById("saveTrip")
  ?.addEventListener("click", () => {
    const type = document.getElementById("tripType")?.value || "Other";
    const name = document.getElementById("tripName").value.trim() || type;
    const notes = document.getElementById("tripNotes")?.value.trim() || "";
    const start = document.getElementById("tripStart").value;
    const end = document.getElementById("tripEnd").value || start;
    if (!start) {
      showToast("Choose a trip or event date first 🌙");
      return;
    }
    if (parseDate(end) < parseDate(start)) {
      showToast("Trip end cannot be before its start.");
      return;
    }
    data.trips.unshift({ id: uid(), type, name, notes, start, end });
    saveData();
    document.getElementById("tripName").value = "";
    document.getElementById("tripStart").value = "";
    document.getElementById("tripEnd").value = "";
    if (document.getElementById("tripNotes")) document.getElementById("tripNotes").value = "";
    renderTripOverlay();
    showToast("Trip added to your cycle overlay ✈️");
  });

function tripPeriodOverlap(trip) {
  const start = parseDate(trip.start); const end = parseDate(trip.end);
  return calendarPredictionWindows(12).find(window => start <= window.end && end >= window.start) || null;
}
function tripTypeIcon(type){return {Trip:"✈️",Wedding:"💍",Exam:"📚",Presentation:"💼",Date:"💗",Concert:"🎵",Vacation:"🌸",Other:"✨"}[type]||"✨";}

function renderTripOverlay() {
  const container = document.getElementById("tripOverlay");
  if (!container) return;
  if (!data.trips.length) {
    container.innerHTML = `<article class="soft-note">Save a trip, event, workday, or date and Tsuki will compare it with your estimated period window.</article>`;
    return;
  }
  container.innerHTML = data.trips.slice(0, 8).map(trip => {
    const overlap = tripPeriodOverlap(trip);
    return `<article class="trip-overlay-card ${overlap ? "overlap" : "clear"}"><div><strong>${tripTypeIcon(trip.type)} ${escapeHTML(trip.name)}</strong><small>${formatDate(parseDate(trip.start))}${trip.end !== trip.start ? `–${formatDate(parseDate(trip.end))}` : ""}</small><p>${overlap ? `🌙 Likely overlap with an estimated period window around ${formatDate(overlap.center)}. Prepare your Moon Bag if useful.` : "✨ No overlap with Tsuki’s current 12-month period forecast."}</p>${trip.notes ? `<small>${escapeHTML(trip.notes)}</small>` : ""}</div><button type="button" data-delete-trip="${trip.id}">×</button></article>`;
  }).join("");
  document.querySelectorAll("[data-delete-trip]").forEach(button => button.addEventListener("click", () => {
    data.trips = data.trips.filter(item => item.id !== button.dataset.deleteTrip);
    saveData();
    renderTripOverlay();
  }));
}


function renderGoingOut() {
  renderTripOverlay();
  const day =
    currentCycleDay();

  const phase =
    cyclePhase(day);

  const next =
    estimatedWindow();

  const headline =
    document.getElementById(
      "goingOutHeadline"
    );

  const details =
    document.getElementById(
      "goingOutCycle"
    );

  if (!day) {
    headline.textContent =
      "Add your cycle first 🌙";

    details.textContent =
      "Tsuki can help you prepare once you’ve logged your period.";
  }
  else {
    headline.textContent =
      "You’re good to go ✨";

    let text =
      `Cycle Day ${day} · ${phase}.`;

    if (next) {
      text +=
        ` Estimated next period: ${formatDate(next.start)}–${formatDate(next.end)}.`;
    }

    details.textContent =
      text;
  }

  const kit =
    document.getElementById(
      "goingOutKit"
    );

  if (!data.periodKit.length) {
    kit.innerHTML = `
      <article class="soft-note">
        Add items to your Period Kit first.
      </article>
    `;

    return;
  }

  kit.innerHTML =
    data.periodKit
      .map(
        item => `
          <article class="list-card">

            <div class="list-icon">
              ${item.packed ? "✅" : "🎀"}
            </div>

            <div class="list-card-content">

              <strong>
                ${escapeHTML(
                  item.name
                )}
              </strong>

              <small>
                ${
                  item.packed
                    ? "Ready"
                    : "Not packed yet"
                }
              </small>

            </div>

          </article>
        `
      )
      .join("");
}


/* ============================================================
   HOW TO CARE FOR ME
   ============================================================ */

function renderCareProfile() {
  const profile = data.careProfile || { options: [], message: "" };
  document.querySelectorAll('input[name="careOption"]').forEach(input => {
    input.checked = profile.options.includes(input.value);
  });
  const message = document.getElementById("careMessage");
  if (message) message.value = profile.message || "";
  const preview = document.getElementById("carePreview");
  if (!preview) return;
  const options = profile.options.length ? profile.options.map(item => `<span>${escapeHTML(item)}</span>`).join("") : `<small>No comfort preferences saved yet.</small>`;
  preview.innerHTML = `<p class="eyebrow">MY PRIVATE COMFORT CARD</p><h3>What helps me 💗</h3><div class="care-preview-tags">${options}</div>${profile.message ? `<p>${escapeHTML(profile.message)}</p>` : ""}<small>Stored locally. Nothing is shared automatically.</small>`;
}

document.getElementById("saveCareProfile")?.addEventListener("click", () => {
  data.careProfile = {
    options: Array.from(document.querySelectorAll('input[name="careOption"]:checked')).map(input => input.value),
    message: document.getElementById("careMessage").value.trim()
  };
  saveData();
  renderCareProfile();
  showToast("Comfort card saved privately 💗");
});


/* ============================================================
   REPORTS
   ============================================================ */

function renderReports() {
  const container =
    document.getElementById(
      "reportSummary"
    );

  const logs =
    allLogs();

  const avgCycle =
    averageCycleLength();

  const avgPeriod =
    averagePeriodLength();

  const variability =
    cycleVariability();

  const confidence =
    predictionConfidence();

  const mood =
    commonMood();

  const symptom =
    commonSymptom();

  const painful =
    logs.filter(
      log =>
        Number(
          log.pain
        ) >= 3
    ).length;

  container.innerHTML = `

    <article class="report-card">

      <h3>
        Cycle summary 🌙
      </h3>

      <div class="report-row">
        <span>Periods logged</span>
        <strong>${data.periods.length}</strong>
      </div>

      <div class="report-row">
        <span>Average cycle</span>
        <strong>${avgCycle} days</strong>
      </div>

      <div class="report-row">
        <span>Average period</span>
        <strong>${avgPeriod} days</strong>
      </div>

      <div class="report-row">
        <span>Cycle variability</span>
        <strong>
          ${
            variability === null
              ? "Need more history"
              : `±${variability} days`
          }
        </strong>
      </div>

      <div class="report-row">
        <span>Prediction confidence</span>
        <strong>${confidence.level}</strong>
      </div>

      <div class="report-row">
        <span>Daily check-ins</span>
        <strong>${logs.length}</strong>
      </div>

      <div class="report-row">
        <span>Most logged mood</span>
        <strong>
          ${mood ? escapeHTML(mood[0]) : "—"}
        </strong>
      </div>

      <div class="report-row">
        <span>Most logged symptom</span>
        <strong>
          ${symptom ? escapeHTML(symptom[0]) : "—"}
        </strong>
      </div>

      <div class="report-row">
        <span>Stronger pain days</span>
        <strong>${painful}</strong>
      </div>

    </article>
  `;
}



/* ============================================================
   APPEARANCE + LOCAL WALLPAPER
   ============================================================ */

const THEME_NAMES = {
  sakura: "Sakura Pink",
  lavender: "Lavender Purple",
  sky: "Sky Blue",
  mint: "Mint Green",
  yellow: "Soft Yellow"
};

const THEME_COLORS = {
  sakura: "#f8c9d9",
  lavender: "#ad8bd8",
  sky: "#8ec0e2",
  mint: "#91cab6",
  yellow: "#e4c36a"
};

const APPEARANCE_DB = "tsuki-appearance-v1";
const APPEARANCE_STORE = "assets";
let wallpaperObjectUrl = "";
let wallpaperAvailable = false;


function openAppearanceDatabase() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB is unavailable"));
      return;
    }

    const request = indexedDB.open(APPEARANCE_DB, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(APPEARANCE_STORE)) {
        db.createObjectStore(APPEARANCE_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}


async function appearanceAssetGet(key) {
  const db = await openAppearanceDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(APPEARANCE_STORE, "readonly");
    const request = tx.objectStore(APPEARANCE_STORE).get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}


async function appearanceAssetPut(key, value) {
  const db = await openAppearanceDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(APPEARANCE_STORE, "readwrite");
    tx.objectStore(APPEARANCE_STORE).put(value, key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}


async function appearanceAssetDelete(key) {
  const db = await openAppearanceDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(APPEARANCE_STORE, "readwrite");
    tx.objectStore(APPEARANCE_STORE).delete(key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}


function applyWallpaperClasses() {
  const overlay = ["light", "medium", "strong"].includes(data.settings.wallpaperOverlay)
    ? data.settings.wallpaperOverlay
    : "medium";

  document.body.classList.remove("wallpaper-light", "wallpaper-medium", "wallpaper-strong");
  document.body.classList.add(`wallpaper-${overlay}`);
  document.body.classList.toggle("wallpaper-enabled", Boolean(data.settings.wallpaperEnabled && wallpaperAvailable && wallpaperObjectUrl));
  document.documentElement.style.setProperty("--wallpaper-position", data.settings.wallpaperPosition || "center");
}


async function refreshWallpaperAsset() {
  try {
    const blob = await appearanceAssetGet("wallpaper");
    wallpaperAvailable = Boolean(blob);

    if (wallpaperObjectUrl) {
      URL.revokeObjectURL(wallpaperObjectUrl);
      wallpaperObjectUrl = "";
    }

    if (blob) {
      wallpaperObjectUrl = URL.createObjectURL(blob);
      document.documentElement.style.setProperty(
        "--tsuki-wallpaper",
        `url("${wallpaperObjectUrl}")`
      );
    }
    else {
      document.documentElement.style.removeProperty("--tsuki-wallpaper");
    }
  }
  catch (error) {
    console.warn("Tsuki could not load the wallpaper:", error);
    wallpaperAvailable = false;
  }

  applyWallpaperClasses();
  renderAppearanceUI();
}


function renderAppearanceUI() {
  const theme = THEME_NAMES[data.settings.theme] ? data.settings.theme : "sakura";
  const themeName = THEME_NAMES[theme];

  document.getElementById("appearanceSummary")?.replaceChildren(themeName);
  document.getElementById("appearanceThemeName")?.replaceChildren(themeName);

  document.querySelectorAll("[data-theme-option]").forEach(button => {
    button.classList.toggle("active", button.dataset.themeOption === theme);
  });

  const preview = document.getElementById("wallpaperPreview");
  if (preview) {
    preview.classList.toggle("has-image", wallpaperAvailable);
    preview.style.backgroundImage = wallpaperAvailable && wallpaperObjectUrl
      ? `url("${wallpaperObjectUrl}")`
      : "";
  }

  const toggle = document.getElementById("wallpaperToggle");
  if (toggle) toggle.checked = Boolean(data.settings.wallpaperEnabled && wallpaperAvailable);

  const status = document.getElementById("wallpaperStatus");
  if (status) status.textContent = data.settings.wallpaperEnabled && wallpaperAvailable ? "On" : "Off";

  document.querySelectorAll("[data-overlay]").forEach(button => button.classList.toggle("active", button.dataset.overlay === data.settings.wallpaperOverlay));
  document.querySelectorAll("[data-wallpaper-position]").forEach(button => button.classList.toggle("active", button.dataset.wallpaperPosition === (data.settings.wallpaperPosition || "center")));
  const accent = document.getElementById("customAccentColor"); if (accent) accent.value = data.settings.customAccent || "#d95788";
  const seasonal = document.getElementById("seasonalRoomToggle"); if (seasonal) seasonal.checked = data.settings.seasonalRoom !== false;
}


function openAppearanceModal() {
  renderAppearanceUI();
  document.getElementById("appearanceModal").classList.remove("hidden");
  document.body.classList.add("modal-open");
}


function closeAppearanceModal() {
  document.getElementById("appearanceModal").classList.add("hidden");
  document.body.classList.remove("modal-open");
}


document.getElementById("openAppearance")?.addEventListener("click", openAppearanceModal);
document.getElementById("closeAppearance")?.addEventListener("click", closeAppearanceModal);
document.getElementById("appearanceDone")?.addEventListener("click", closeAppearanceModal);

document.getElementById("appearanceModal")?.addEventListener("click", event => {
  if (event.target.id === "appearanceModal") closeAppearanceModal();
});

document.querySelectorAll("[data-theme-option]").forEach(button => {
  button.addEventListener("click", () => {
    data.settings.theme = button.dataset.themeOption;
    saveData();
    applySettings();
    renderAppearanceUI();
  });
});

document.getElementById("chooseWallpaper")?.addEventListener("click", () => {
  document.getElementById("wallpaperFileInput")?.click();
});

document.getElementById("wallpaperFileInput")?.addEventListener("change", async event => {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showToast("Choose an image file.");
    return;
  }

  try {
    await appearanceAssetPut("wallpaper", file);
    data.settings.wallpaperEnabled = true;
    saveData();
    await refreshWallpaperAsset();
    showToast("Wallpaper saved locally 🌙");
  }
  catch (error) {
    console.error("Could not save wallpaper:", error);
    showToast("Tsuki couldn't save that wallpaper on this device.");
  }

  event.target.value = "";
});

document.getElementById("wallpaperToggle")?.addEventListener("change", event => {
  if (event.target.checked && !wallpaperAvailable) {
    event.target.checked = false;
    showToast("Choose a wallpaper photo first.");
    return;
  }

  data.settings.wallpaperEnabled = event.target.checked;
  saveData();
  applyWallpaperClasses();
  renderAppearanceUI();
});

document.querySelectorAll("[data-overlay]").forEach(button => {
  button.addEventListener("click", () => {
    data.settings.wallpaperOverlay = button.dataset.overlay;
    saveData();
    applyWallpaperClasses();
    renderAppearanceUI();
  });
});

document.querySelectorAll("[data-wallpaper-position]").forEach(button => button.addEventListener("click", () => { data.settings.wallpaperPosition = button.dataset.wallpaperPosition; saveData(); applyWallpaperClasses(); renderAppearanceUI(); }));
document.getElementById("customAccentColor")?.addEventListener("input", event => { data.settings.customAccent = event.target.value; saveData(); applySettings(); });
document.getElementById("seasonalRoomToggle")?.addEventListener("change", event => { data.settings.seasonalRoom = event.target.checked; saveData(); renderMoonRoom(); });

document.getElementById("resetAppearance")?.addEventListener("click", async () => {
  data.settings.theme = "sakura";
  data.settings.wallpaperEnabled = false;
  data.settings.wallpaperOverlay = "medium";
  data.settings.wallpaperPosition = "center";
  data.settings.customAccent = "";
  data.settings.seasonalRoom = true;
  saveData();

  try {
    await appearanceAssetDelete("wallpaper");
  }
  catch (error) {
    console.warn("Wallpaper could not be removed:", error);
  }

  await refreshWallpaperAsset();
  applySettings();
  renderAppearanceUI();
  showToast("Appearance reset 🌸");
});


/* ============================================================
   SETTINGS
   ============================================================ */

function loadSettingsUI() {
  document
    .getElementById(
      "settingsCycleLength"
    )
    .value =
      data.settings.cycleLength;

  document.getElementById("settingsPeriodLength").value = data.settings.periodLength;
  if (document.getElementById("predictionMode")) document.getElementById("predictionMode").value = data.settings.predictionMode || "typical";

  document
    .getElementById(
      "sakuraToggle"
    )
    .checked =
      data.settings.sakura;

  document
    .getElementById(
      "motionToggle"
    )
    .checked =
      data.settings.reduceMotion;

  document
    .getElementById(
      "hideDetailsToggle"
    )
    .checked =
      data.settings.hideDetails;

  document
    .getElementById(
      "discreetToggle"
    )
    .checked =
      data.settings.discreet;

  applySettings();
}


document
  .getElementById(
    "saveSettings"
  )
  .addEventListener(
    "click",
    () => {
      data.settings.cycleLength =
        Number(
          document
            .getElementById(
              "settingsCycleLength"
            )
            .value
        ) || 28;

      data.settings.periodLength =
        Number(
          document
            .getElementById(
              "settingsPeriodLength"
            )
            .value
        ) || 5;

      data.settings.predictionMode =
        document.getElementById("predictionMode")?.value || "typical";

      saveData();
      renderEverything();

      showToast(
        "Cycle defaults saved 🌙"
      );
    }
  );


document
  .getElementById(
    "sakuraToggle"
  )
  .addEventListener(
    "change",
    event => {
      data.settings.sakura =
        event.target.checked;

      saveData();
      applySettings();
    }
  );


document
  .getElementById(
    "motionToggle"
  )
  .addEventListener(
    "change",
    event => {
      data.settings.reduceMotion =
        event.target.checked;

      saveData();
      applySettings();
    }
  );


document
  .getElementById(
    "hideDetailsToggle"
  )
  .addEventListener(
    "change",
    event => {
      data.settings.hideDetails =
        event.target.checked;

      saveData();
      applySettings();
    }
  );


document
  .getElementById(
    "discreetToggle"
  )
  .addEventListener(
    "change",
    event => {
      data.settings.discreet =
        event.target.checked;

      saveData();
    }
  );


function applySettings() {
  const theme = THEME_NAMES[data.settings.theme] ? data.settings.theme : "sakura";
  document.body.dataset.theme = theme;
  document.body.dataset.textSize = data.settings.textSize || "normal";
  document.body.dataset.density = data.settings.density || "comfortable";
  if (data.settings.customAccent) {
    document.documentElement.style.setProperty("--pink-500", data.settings.customAccent);
    document.documentElement.style.setProperty("--pink-600", data.settings.customAccent);
  } else {
    document.documentElement.style.removeProperty("--pink-500");
    document.documentElement.style.removeProperty("--pink-600");
  }
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[theme]);
  applyWallpaperClasses();

  document.body.classList.toggle(
    "reduce-motion",
    data.settings.reduceMotion
  );

  document.body.classList.toggle(
    "hide-sensitive",
    data.settings.hideDetails
  );

  document.body.classList.toggle(
    "quiet-interface",
    Boolean(data.settings.quietInterface)
  );

  document
    .querySelectorAll(
      ".sakura"
    )
    .forEach(
      flower => {
        flower.style.display =
          data.settings.sakura
            ? ""
            : "none";
      }
    );
}


/* ============================================================
   PRIVACY BUTTON
   ============================================================ */

document
  .getElementById(
    "privacyButton"
  )
  .addEventListener(
    "click",
    () => {
      data.settings.hideDetails =
        !data.settings.hideDetails;

      saveData();
      loadSettingsUI();

      showToast(
        data.settings.hideDetails
          ? "Cycle details hidden 🔒"
          : "Cycle details visible 🌙"
      );
    }
  );




/* ============================================================
   BUILD 5.2 — OPTIONAL APP LOCK
   Off by default. Lock settings stay outside the Tsuki backup.
   ============================================================ */

const defaultAppLockSettings = {
  enabled: false,
  pinHash: "",
  pinSalt: "",
  lockOnBackground: true
};

function loadAppLockSettings() {
  try {
    const saved = localStorage.getItem(APP_LOCK_STORAGE_KEY);
    return saved
      ? { ...defaultAppLockSettings, ...JSON.parse(saved) }
      : { ...defaultAppLockSettings };
  }
  catch (error) {
    console.error("Could not load Tsuki App Lock settings:", error);
    return { ...defaultAppLockSettings };
  }
}

let appLockSettings = loadAppLockSettings();

function saveAppLockSettings() {
  try {
    localStorage.setItem(APP_LOCK_STORAGE_KEY, JSON.stringify(appLockSettings));
    return true;
  }
  catch (error) {
    console.error("Could not save App Lock settings:", error);
    showToast("Tsuki couldn't save App Lock settings on this device.");
    return false;
  }
}

function randomLockSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, value => value.toString(16).padStart(2, "0")).join("");
}

async function hashAppPin(pin, salt) {
  const bytes = new TextEncoder().encode(`tsuki:${salt}:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, "0")).join("");
}

function validAppPin(pin) {
  return /^\d{4,6}$/.test(pin);
}

function renderAppLockSettings() {
  const toggle = document.getElementById("appLockToggle");
  const controls = document.getElementById("appLockControls");
  const status = document.getElementById("appLockStatusBadge");
  const backgroundToggle = document.getElementById("lockOnBackgroundToggle");
  const lockNow = document.getElementById("lockNowButton");
  const savePin = document.getElementById("saveAppLockPin");
  if (!toggle || !controls || !status || !backgroundToggle || !lockNow || !savePin) return;

  toggle.checked = Boolean(appLockSettings.enabled);
  backgroundToggle.checked = appLockSettings.lockOnBackground !== false;
  status.textContent = appLockSettings.enabled ? "On" : "Off";
  status.classList.toggle("on", Boolean(appLockSettings.enabled));

  controls.classList.toggle("hidden", !appLockSettings.enabled && !toggle.checked);
  lockNow.classList.toggle("hidden", !appLockSettings.enabled);
  savePin.textContent = appLockSettings.pinHash ? "Change PIN" : "Set PIN & turn on lock";
}

function showAppLockSetup() {
  const controls = document.getElementById("appLockControls");
  const toggle = document.getElementById("appLockToggle");
  controls?.classList.remove("hidden");
  if (toggle) toggle.checked = true;
  document.getElementById("appLockPin")?.focus();
}

function lockApp() {
  if (!appLockSettings.enabled || !appLockSettings.pinHash) return;
  const overlay = document.getElementById("appLockOverlay");
  const input = document.getElementById("unlockPinInput");
  const error = document.getElementById("unlockPinError");
  if (!overlay) return;

  overlay.classList.remove("hidden");
  document.body.classList.add("app-locked");
  if (input) input.value = "";
  error?.classList.add("hidden");
  setTimeout(() => input?.focus(), 80);
}

function unlockAppView() {
  document.getElementById("appLockOverlay")?.classList.add("hidden");
  document.body.classList.remove("app-locked");
  document.getElementById("unlockPinError")?.classList.add("hidden");
  setTimeout(runLaunchOverlays, 180);
}

async function tryUnlockApp() {
  const input = document.getElementById("unlockPinInput");
  const error = document.getElementById("unlockPinError");
  const pin = input?.value || "";
  if (!pin || !appLockSettings.pinSalt || !appLockSettings.pinHash) return;

  const hashed = await hashAppPin(pin, appLockSettings.pinSalt);
  if (hashed === appLockSettings.pinHash) {
    unlockAppView();
    return;
  }

  error?.classList.remove("hidden");
  if (input) {
    input.value = "";
    input.focus();
  }
}

document.getElementById("appLockToggle")?.addEventListener("change", event => {
  if (event.target.checked) {
    if (appLockSettings.pinHash) {
      appLockSettings.enabled = true;
      saveAppLockSettings();
      renderAppLockSettings();
      showToast("App Lock turned on 🔐");
    }
    else {
      showAppLockSetup();
      showToast("Choose a PIN below to finish turning on App Lock.");
    }
    return;
  }

  appLockSettings.enabled = false;
  saveAppLockSettings();
  renderAppLockSettings();
  showToast("App Lock is off 🌙");
});

document.getElementById("saveAppLockPin")?.addEventListener("click", async () => {
  const pinInput = document.getElementById("appLockPin");
  const confirmInput = document.getElementById("appLockPinConfirm");
  const pin = pinInput?.value || "";
  const confirmation = confirmInput?.value || "";

  if (!validAppPin(pin)) {
    showToast("Use a 4–6 digit PIN.");
    return;
  }

  if (pin !== confirmation) {
    showToast("The PINs do not match.");
    return;
  }

  const salt = randomLockSalt();
  const pinHash = await hashAppPin(pin, salt);
  appLockSettings = {
    ...appLockSettings,
    enabled: true,
    pinSalt: salt,
    pinHash
  };
  saveAppLockSettings();

  if (pinInput) pinInput.value = "";
  if (confirmInput) confirmInput.value = "";
  renderAppLockSettings();
  showToast("App Lock is ready 🔐");
});

document.getElementById("lockOnBackgroundToggle")?.addEventListener("change", event => {
  appLockSettings.lockOnBackground = event.target.checked;
  saveAppLockSettings();
});

document.getElementById("lockNowButton")?.addEventListener("click", lockApp);
document.getElementById("unlockAppButton")?.addEventListener("click", tryUnlockApp);
document.getElementById("unlockPinInput")?.addEventListener("keydown", event => {
  if (event.key === "Enter") tryUnlockApp();
});

document.getElementById("resetAppLockButton")?.addEventListener("click",()=>{if(!confirm("Turn off App Lock and remove this device’s Tsuki PIN?"))return;appLockSettings={enabled:false,pinHash:"",pinSalt:"",lockOnBackground:true};saveAppLockSettings();renderAppLockSettings();showToast("App Lock turned off");});

document.addEventListener("visibilitychange", () => {
  if (
    document.visibilityState === "hidden" &&
    appLockSettings.enabled &&
    appLockSettings.lockOnBackground
  ) {
    lockApp();
  }
});


/* ============================================================
   EXPORT
   ============================================================ */

document
  .getElementById(
    "exportData"
  )
  .addEventListener(
    "click",
    () => {
      if (
        !confirm(
          "This backup contains private cycle, pregnancy, and wellness information. Continue?"
        )
      ) {
        return;
      }

      const exportData = {
        app: "Tsuki",
        version: 7,
        exportedAt:
          new Date()
            .toISOString(),
        data
      };

      const blob =
        new Blob(
          [
            JSON.stringify(
              exportData,
              null,
              2
            )
          ],
          {
            type:
              "application/json"
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href =
        url;

      link.download =
        `tsuki-backup-${todayKey()}.json`;

      link.click();

      URL.revokeObjectURL(
        url
      );

      data.meta = { ...(data.meta || {}), lastBackupAt: new Date().toISOString() };
      saveData(); renderBackupStatus();
      showToast("Private backup created 🌙");
    }
  );

let pendingRestoreData = null;
function renderBackupStatus(){const el=document.getElementById("lastBackupText");if(!el)return;const stamp=data.meta?.lastBackupAt;el.textContent=stamp?`Last backup created on this device: ${new Date(stamp).toLocaleString()}`:"No backup created on this device yet.";document.getElementById("recoveryNotice")?.classList.toggle("hidden",localStorage.getItem("tsuki-recovery-needed")!=="1");}
function validateTsukiBackup(parsed){if(!parsed||parsed.app!=="Tsuki"||!parsed.data||typeof parsed.data!=="object")throw new Error("This is not a valid Tsuki backup.");const normalized=normalizeData(parsed.data);return{normalized,version:parsed.version||"unknown",exportedAt:parsed.exportedAt||"",counts:{periods:normalized.periods.length,logs:Object.keys(normalized.logs).length,journal:normalized.journal.length,events:normalized.trips.length,pregnancyLogs:Object.keys(normalized.pregnancy?.logs||{}).length,pregnancyAppointments:(normalized.pregnancy?.appointments||[]).length,pregnancyJournal:(normalized.pregnancy?.journal||[]).length,pregnancyMode:normalized.mode}};}
document.getElementById("restoreData")?.addEventListener("click",()=>document.getElementById("restoreDataInput")?.click());
document.getElementById("restoreDataInput")?.addEventListener("change",async event=>{const file=event.target.files?.[0];if(!file)return;try{const parsed=JSON.parse(await file.text());const check=validateTsukiBackup(parsed);pendingRestoreData=check.normalized;document.getElementById("restorePreviewContent").innerHTML=`<article class="restore-preview-card"><p><strong>Backup version:</strong> ${escapeHTML(String(check.version))}</p>${check.exportedAt?`<p><strong>Exported:</strong> ${escapeHTML(new Date(check.exportedAt).toLocaleString())}</p>`:""}<div class="restore-count-grid"><span>${check.counts.periods}<small>Periods</small></span><span>${check.counts.logs}<small>Cycle check-ins</small></span><span>${check.counts.pregnancyLogs}<small>Pregnancy check-ins</small></span><span>${check.counts.pregnancyAppointments}<small>Appointments</small></span><span>${check.counts.pregnancyJournal}<small>Pregnancy memories</small></span><span>${escapeHTML(check.counts.pregnancyMode)}<small>Life mode</small></span></div><p class="muted small-text">Restoring replaces Tsuki’s current cycle and pregnancy tracking data. Your device-specific App Lock PIN, wallpaper file, and local pregnancy photos stay on this device.</p></article>`;document.getElementById("restorePreviewModal").classList.remove("hidden");document.body.classList.add("modal-open");}catch(error){showToast(error.message||"Tsuki could not read that backup.");}event.target.value="";});
function closeRestorePreview(){document.getElementById("restorePreviewModal")?.classList.add("hidden");document.body.classList.remove("modal-open");pendingRestoreData=null;}
document.getElementById("closeRestorePreview")?.addEventListener("click",closeRestorePreview);document.getElementById("cancelRestore")?.addEventListener("click",closeRestorePreview);
document.getElementById("confirmRestore")?.addEventListener("click",()=>{if(!pendingRestoreData)return;const currentLock={...appLockSettings};data=normalizeData(pendingRestoreData);saveData();appLockSettings=currentLock;saveAppLockSettings();localStorage.removeItem("tsuki-recovery-needed");pendingRestoreData=null;document.getElementById("restorePreviewModal")?.classList.add("hidden");document.body.classList.remove("modal-open");loadSettingsUI();applySettings();renderEverything();if(data.mode==="pregnancy"&&data.pregnancy?.active)showScreen("pregnancy-today");else if(data.mode==="postpartum"&&data.postpartum?.active)showScreen("postpartum-today");else showScreen("today");showToast("Backup restored 🌙");});


/* ============================================================
   DELETE ALL
   ============================================================ */

document
  .getElementById(
    "deleteAllData"
  )
  .addEventListener(
    "click",
    () => {
      const first =
        confirm(
          "Delete ALL Tsuki entries from this device?"
        );

      if (!first) return;

      const second =
        confirm(
          "This cannot be undone unless you have a backup. Delete everything?"
        );

      if (!second) return;

      localStorage.removeItem(
        STORAGE_KEY
      );

      localStorage.removeItem(
        BUILD3_STORAGE_KEY
      );

      localStorage.removeItem(
        BUILD2_STORAGE_KEY
      );

      localStorage.removeItem(
        LEGACY_STORAGE_KEY
      );

      data =
        clone(
          defaultData
        );

      appearanceAssetDelete("wallpaper")
        .then(refreshWallpaperAsset)
        .catch(error => console.warn("Wallpaper cleanup failed:", error));

      saveData();
      resetPeriodForm();
      loadSettingsUI();
      loadLogForm();
      renderEverything();
      showScreen("today");

      showToast(
        "Tsuki data cleared."
      );
    }
  );


/* ============================================================
   TOAST
   ============================================================ */

function showToast(message) {
  const toast =
    document.getElementById(
      "toast"
    );

  if (!toast) return;

  toast.textContent =
    message;

  toast.classList.add(
    "show"
  );

  clearTimeout(
    toastTimer
  );

  toastTimer =
    setTimeout(
      () => {
        toast.classList.remove(
          "show"
        );
      },
      2500
    );
}

function showUndoToast(message, undoAction) {
  const toast = document.getElementById("toast");
  clearTimeout(toastTimer);
  toast.innerHTML = `<span>${escapeHTML(message)}</span><button type="button" class="toast-undo">Undo</button>`;
  toast.classList.add("show", "has-action");
  toast.querySelector(".toast-undo")?.addEventListener("click", () => {
    toast.classList.remove("show", "has-action");
    toast.textContent = "";
    undoAction?.();
    showToast("Restored 🌙");
  }, { once: true });
  toastTimer = setTimeout(() => { toast.classList.remove("show", "has-action"); toast.textContent = ""; }, 5500);
}



/* ============================================================
   GREETING
   ============================================================ */

function renderGreeting() {
  const hour =
    new Date().getHours();

  let greeting =
    "Good evening";

  if (hour < 12) {
    greeting =
      "Good morning";
  }
  else if (
    hour < 18
  ) {
    greeting =
      "Good afternoon";
  }

  document
    .getElementById(
      "greetingText"
    )
    .textContent =
      data.settings.customGreeting?.trim() || `${greeting} 🌸`;
}


/* ============================================================
   NATIVE TOUCH GUARDS
   Prevent pinch zoom + double-tap zoom while preserving normal
   one-finger scrolling and form interaction in the installed PWA.
   ============================================================ */

function installNativeTouchGuards() {
  const preventGesture = event => {
    event.preventDefault();
  };

  [
    "gesturestart",
    "gesturechange",
    "gestureend"
  ].forEach(type => {
    document.addEventListener(
      type,
      preventGesture,
      { passive: false }
    );
  });

  document.addEventListener(
    "touchmove",
    event => {
      if (event.touches && event.touches.length > 1) {
        event.preventDefault();
      }
    },
    { passive: false }
  );

  let lastTouch = {
    time: 0,
    target: null,
    x: 0,
    y: 0
  };

  document.addEventListener(
    "touchend",
    event => {
      const touch = event.changedTouches?.[0];
      if (!touch) return;

      const now = Date.now();
      const sameTarget = lastTouch.target === event.target;
      const closeEnough =
        Math.abs(touch.clientX - lastTouch.x) < 28 &&
        Math.abs(touch.clientY - lastTouch.y) < 28;

      if (
        sameTarget &&
        closeEnough &&
        now - lastTouch.time < 320
      ) {
        event.preventDefault();
      }

      lastTouch = {
        time: now,
        target: event.target,
        x: touch.clientX,
        y: touch.clientY
      };
    },
    { passive: false }
  );

  document.addEventListener(
    "dblclick",
    event => {
      event.preventDefault();
    },
    { passive: false }
  );
}


/* ============================================================
   NETWORK
   ============================================================ */

function updateOnlineStatus() {
  document
    .getElementById(
      "offlineBanner"
    )
    .classList.toggle(
      "hidden",
      navigator.onLine
    );
}


window.addEventListener(
  "online",
  updateOnlineStatus
);


window.addEventListener(
  "offline",
  updateOnlineStatus
);


/* ============================================================
   SERVICE WORKER
   ============================================================ */

if (
  "serviceWorker"
  in navigator
) {
  let waitingServiceWorker = null;
  let updateReloading = false;

  function showUpdateBanner(worker) {
    if (!worker || !navigator.serviceWorker.controller) return;
    waitingServiceWorker = worker;
    const banner = document.getElementById("updateBanner");
    const button = document.getElementById("updateAppButton");
    banner?.classList.remove("hidden");
    if (button) {
      button.disabled = false;
      button.textContent = "Update";
    }
  }

  function watchServiceWorker(registration) {
    if (!registration) return;
    if (registration.waiting) {
      showUpdateBanner(registration.waiting);
    }

    registration.addEventListener("updatefound", () => {
      const installing = registration.installing;
      if (!installing) return;

      installing.addEventListener("statechange", () => {
        if (
          installing.state === "installed" &&
          navigator.serviceWorker.controller
        ) {
          showUpdateBanner(registration.waiting || installing);
        }
      });
    });
  }

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        "./service-worker.js"
      );

      watchServiceWorker(registration);

      // Ask for a fresh service-worker check whenever Tsuki is opened online.
      if (navigator.onLine && registration?.update) {
        registration.update().catch(() => {});
      }
    }
    catch (error) {
      console.error(
        "Service worker registration failed:",
        error
      );
    }
  });

  document.getElementById("updateAppButton")?.addEventListener("click", () => {
    const button = document.getElementById("updateAppButton");

    if (!waitingServiceWorker) {
      window.location.reload();
      return;
    }

    if (button) {
      button.disabled = true;
      button.textContent = "Updating…";
    }

    waitingServiceWorker.postMessage({ type: "SKIP_WAITING" });
  });

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (updateReloading) return;
    updateReloading = true;
    window.location.reload();
  });
}


const TODAY_SECTIONS={checkin:{id:"todayCheckinSection",label:"Your Check-in",icon:"📝"},forecast:{id:"todayForecastSection",label:"Tsuki Forecast",icon:"🌙"},insights:{id:"todayInsightsSection",label:"Tsuki Noticed",icon:"✨"},companion:{id:"todayCompanionSection",label:"Moon Room",icon:"🐇"}};
function normalizedTodayOrder(){const saved=Array.isArray(data.settings.todayOrder)?data.settings.todayOrder:[];return [...saved.filter(k=>TODAY_SECTIONS[k]),...Object.keys(TODAY_SECTIONS).filter(k=>!saved.includes(k))];}
function renderTodayLayout(){const today=document.querySelector('[data-screen="today"]');if(!today)return;const hint=today.querySelector('.today-menu-hint');const hidden=new Set(data.settings.todayHidden||[]);normalizedTodayOrder().forEach(key=>{const el=document.getElementById(TODAY_SECTIONS[key].id);if(el){el.classList.toggle("hidden",hidden.has(key));if(hint)today.insertBefore(el,hint);}});}
function renderTodayCustomize(){const c=document.getElementById("todaySectionSettings");if(!c)return;const order=normalizedTodayOrder(),hidden=new Set(data.settings.todayHidden||[]);c.innerHTML=order.map((key,index)=>{const item=TODAY_SECTIONS[key];return`<div class="today-setting-row" data-today-key="${key}"><label><input type="checkbox" data-today-visible="${key}" ${hidden.has(key)?"":"checked"}><span>${item.icon} ${item.label}</span></label><div><button type="button" data-today-move="up" ${index===0?"disabled":""}>↑</button><button type="button" data-today-move="down" ${index===order.length-1?"disabled":""}>↓</button></div></div>`;}).join("");c.querySelectorAll('[data-today-move]').forEach(btn=>btn.addEventListener("click",()=>{const row=btn.closest('[data-today-key]');const key=row.dataset.todayKey;const order=normalizedTodayOrder();const i=order.indexOf(key),j=btn.dataset.todayMove==="up"?i-1:i+1;if(j<0||j>=order.length)return;[order[i],order[j]]=[order[j],order[i]];data.settings.todayOrder=order;renderTodayCustomize();}));}
function openTodayCustomize(){document.getElementById("customGreetingInput").value=data.settings.customGreeting||"";document.getElementById("weekStartSelect").value=data.settings.weekStart||"sunday";document.getElementById("textSizeSelect").value=data.settings.textSize||"normal";document.getElementById("densitySelect").value=data.settings.density||"comfortable";renderTodayCustomize();document.getElementById("todayCustomizeModal").classList.remove("hidden");document.body.classList.add("modal-open");}
function closeTodayCustomize(){document.getElementById("todayCustomizeModal")?.classList.add("hidden");document.body.classList.remove("modal-open");}
document.getElementById("openTodayCustomize")?.addEventListener("click",openTodayCustomize);document.getElementById("closeTodayCustomize")?.addEventListener("click",closeTodayCustomize);
document.getElementById("saveTodayCustomize")?.addEventListener("click",()=>{data.settings.customGreeting=document.getElementById("customGreetingInput").value.trim();data.settings.weekStart=document.getElementById("weekStartSelect").value;data.settings.textSize=document.getElementById("textSizeSelect").value;data.settings.density=document.getElementById("densitySelect").value;data.settings.todayHidden=Array.from(document.querySelectorAll('[data-today-visible]')).filter(x=>!x.checked).map(x=>x.dataset.todayVisible);saveData();applySettings();renderEverything();closeTodayCustomize();showToast("Today personalized 🌸");});

/* ============================================================
   BUILD 7.0 — LIFE MODE + PREGNANCY EXPERIENCE
   Clinical framing: ACOG pregnancy dating / trimesters,
   CDC urgent maternal warning signs, WHO antenatal contacts.
   ============================================================ */

let pregnancyCalendarDate = new Date();
let selectedPregnancyCalendarDate = todayKey();
let pendingPregnancyPhotoFile = null;
let pendingPregnancyPhotoPreviewUrl = "";
let pregnancyPhotoObjectUrls = [];

function pregnancyRecord() {
  return data.pregnancy || defaultData.pregnancy;
}

function pregnancyEDD() {
  return parseDate(pregnancyRecord().edd);
}

function pregnancyStartDate() {
  const edd = pregnancyEDD();
  return edd ? addDays(edd, -280) : null;
}

function gestationalAgeForDate(value = todayKey()) {
  const edd = pregnancyEDD();
  const date = typeof value === "string" ? parseDate(value) : new Date(value);
  if (!edd || !date) return null;
  const totalDays = 280 - daysBetween(date, edd);
  const weeks = Math.floor(totalDays / 7);
  const days = ((totalDays % 7) + 7) % 7;
  return { totalDays, weeks, days, date, edd };
}

function trimesterForGestation(ga) {
  if (!ga) return "Pregnancy";
  if (ga.totalDays <= 97) return "First trimester"; // through 13w6d
  if (ga.totalDays <= 195) return "Second trimester"; // through 27w6d
  return "Third trimester";
}

function pregnancyWeekLabel(value = todayKey()) {
  const ga = gestationalAgeForDate(value);
  if (!ga) return "Pregnancy week —";
  if (ga.totalDays < 0) return "Before pregnancy dating";
  return `${Math.max(0, ga.weeks)} weeks + ${ga.days} days`;
}

function pregnancyDateInRange(value) {
  const ga = gestationalAgeForDate(value);
  return Boolean(ga && ga.totalDays >= 0 && ga.totalDays <= 294);
}

function pregnancyWeekInfo(week) {
  if (week < 4) return { icon: "🌱", title: "Very early pregnancy", text: "Pregnancy dating begins from the first day of the last menstrual period, so the earliest counted weeks begin before conception has occurred." };
  if (week <= 7) return { icon: "🌱", title: "Early development", text: "Early pregnancy is a period of rapid development. Your maternity provider can guide you on when to schedule your first prenatal care and dating assessment." };
  if (week <= 13) return { icon: "🌿", title: "First trimester", text: "Development continues quickly through the first trimester. First-trimester ultrasound is the most accurate ultrasound period for establishing or confirming gestational age." };
  if (week <= 20) return { icon: "🌷", title: "Growing into the second trimester", text: "The second trimester is a period of rapid growth and development. Some people begin noticing movement during this part of pregnancy, but timing varies." };
  if (week <= 27) return { icon: "🌸", title: "Second-trimester growth", text: "Growth and development continue through the second trimester. Keep your provider's own schedule for visits, scans, and tests as your main guide." };
  if (week <= 32) return { icon: "🪻", title: "Third trimester", text: "The third trimester begins at 28 weeks. Fetal growth and organ maturation continue while your care team follows your health and your baby's health." };
  if (week <= 36) return { icon: "🌼", title: "Later pregnancy", text: "Late-pregnancy growth continues. Many care plans include more frequent contact as pregnancy advances, depending on individual needs." };
  if (week <= 40) return { icon: "🌕", title: "Approaching your due date", text: "Your estimated due date is a guide rather than a guaranteed birth date. Keep following the plan you made with your maternity provider." };
  return { icon: "🌙", title: "Past the estimated due date", text: "The estimated due date is only an estimate. If you are still pregnant after your EDD, use your maternity provider's plan for follow-up and timing of care." };
}

function pregnancyCuteComparison(week) {
  const theme = pregnancyRecord().babySizeTheme || "fruit";
  const themes = {
    fruit: [
      [4,"🌱 tiny seed"],[6,"🫐 little berry"],[8,"🍓 strawberry"],[10,"🍑 tiny peach"],[12,"🍋 little lemon"],[14,"🥑 avocado"],[18,"🍠 sweet potato"],[22,"🥭 mango"],[26,"🥬 little lettuce"],[30,"🥥 coconut"],[34,"🍍 pineapple"],[38,"🎃 little pumpkin"],[40,"🌕 full moon"]
    ],
    japanese: [
      [6,"🍬 konpeitō"],[10,"🍡 little dango"],[14,"🍙 onigiri"],[18,"🍠 yaki-imo"],[22,"🥐 melonpan"],[26,"🍱 bento box"],[30,"🍵 tea bowl"],[34,"🍈 Japanese melon"],[38,"🎐 summer-festival lantern"],[40,"🌕 full moon"]
    ],
    flowers: [
      [6,"🌱 flower seed"],[10,"🌼 daisy"],[14,"🌸 sakura bloom"],[18,"🌷 tulip"],[22,"🪻 hyacinth"],[26,"🌺 hibiscus"],[30,"💐 little bouquet"],[34,"🌻 sunflower"],[38,"🌹 garden rose"],[40,"🌸 full garden bloom"]
    ],
    moon: [
      [6,"✨ tiny star"],[10,"⭐ star charm"],[14,"🌙 crescent charm"],[18,"🪐 little planet"],[22,"☁️ moon cloud"],[26,"🔭 tiny telescope"],[30,"🌛 sleepy moon"],[34,"🌌 little night sky"],[38,"🌕 almost-full moon"],[40,"🌕 full moon"]
    ],
    cute: [
      [6,"🫘 tiny bean"],[10,"🎀 little ribbon"],[14,"🧸 tiny plush"],[18,"🧦 baby sock"],[22,"🫖 little teacup"],[26,"👜 tiny bag"],[30,"🧸 cuddle plush"],[34,"🛏️ little pillow"],[38,"🧺 cozy basket"],[40,"🌕 full moon"]
    ]
  };
  const items = themes[theme] || themes.fruit;
  const found = items.find(([maxWeek]) => week <= maxWeek) || items[items.length - 1];
  return `${found[1]} · just for fun, not a measurement`;
}

function pregnancyDatingDescription() {
  const p = pregnancyRecord();
  const labels = {
    lmp: "Estimated from last menstrual period",
    clinician: "Clinician-confirmed due date",
    ultrasound: "Ultrasound-confirmed due date",
    ivf: p.edd ? "ART / IVF dating" : "Pregnancy dating"
  };
  return labels[p.datingMethod] || "Pregnancy dating";
}

function calculatePregnancyDatingFromForm() {
  const method = document.getElementById("pregnancyDatingMethod")?.value || "lmp";
  let edd = null;
  let lmp = "";
  let transferDate = "";
  let embryoAge = Number(document.getElementById("pregnancyEmbryoAge")?.value || 5);
  let clinicianConfirmed = false;

  if (method === "lmp") {
    lmp = document.getElementById("pregnancyLMPDate")?.value || "";
    const date = parseDate(lmp);
    if (date) edd = addDays(date, 280);
  }
  else if (["clinician", "ultrasound"].includes(method)) {
    edd = parseDate(document.getElementById("pregnancyDirectEDD")?.value || "");
    clinicianConfirmed = Boolean(edd);
  }
  else if (method === "ivf") {
    const direct = parseDate(document.getElementById("pregnancyIVFDirectEDD")?.value || "");
    transferDate = document.getElementById("pregnancyTransferDate")?.value || "";
    if (direct) {
      edd = direct;
      clinicianConfirmed = true;
    }
    else {
      const transfer = parseDate(transferDate);
      if (transfer) edd = addDays(transfer, embryoAge === 3 ? 263 : 261);
    }
  }

  return { method, edd, lmp, transferDate, embryoAge, clinicianConfirmed };
}

function updatePregnancySetupFields() {
  const method = document.getElementById("pregnancyDatingMethod")?.value || "lmp";
  document.getElementById("pregnancyLMPFields")?.classList.toggle("hidden", method !== "lmp");
  document.getElementById("pregnancyEDDFields")?.classList.toggle("hidden", !["clinician", "ultrasound"].includes(method));
  document.getElementById("pregnancyIVFFields")?.classList.toggle("hidden", method !== "ivf");

  const preview = document.getElementById("pregnancyDatingPreview");
  if (!preview) return;
  const dating = calculatePregnancyDatingFromForm();
  if (!dating.edd) {
    preview.innerHTML = "Enter your dating information to preview the estimate.";
    return;
  }
  const ga = { totalDays: 280 - daysBetween(new Date(), dating.edd) };
  const weeks = Math.floor(ga.totalDays / 7);
  const days = ((ga.totalDays % 7) + 7) % 7;
  preview.innerHTML = `<strong>${weeks} weeks + ${days} days today</strong><span>Estimated due date: ${formatDateLong(dating.edd)}</span>`;
}

function openPregnancySetup() {
  const p = pregnancyRecord();
  const latest = latestPeriod();
  const method = p.datingMethod || "lmp";
  document.getElementById("pregnancyDatingMethod").value = method;
  document.getElementById("pregnancyLMPDate").value = p.lmp || latest?.start || "";
  document.getElementById("pregnancyDirectEDD").value = ["clinician", "ultrasound"].includes(method) ? (p.edd || "") : "";
  document.getElementById("pregnancyTransferDate").value = p.transferDate || "";
  document.getElementById("pregnancyEmbryoAge").value = String(p.embryoAge || 5);
  document.getElementById("pregnancyIVFDirectEDD").value = method === "ivf" && p.clinicianConfirmed ? (p.edd || "") : "";
  document.getElementById("pregnancyBabyNickname").value = p.babyNickname || "";
  updatePregnancySetupFields();
  document.getElementById("pregnancySetupModal")?.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closePregnancySetup() {
  document.getElementById("pregnancySetupModal")?.classList.add("hidden");
  document.body.classList.remove("modal-open");
  renderLifeModeUI();
}

function savePregnancySetup() {
  const dating = calculatePregnancyDatingFromForm();
  if (!dating.edd) {
    showToast("Add the pregnancy dating information first.");
    return;
  }

  if (!data.pregnancy?.active && data.pregnancy?.endedAt) {
    data.pregnancy = clone(defaultData.pregnancy);
  }

  data.pregnancy = {
    ...clone(defaultData.pregnancy),
    ...data.pregnancy,
    active: true,
    id: data.pregnancy?.id || uid(),
    startedAt: data.pregnancy?.startedAt || todayKey(),
    datingMethod: dating.method,
    lmp: dating.lmp,
    edd: dateKey(dating.edd),
    clinicianConfirmed: dating.clinicianConfirmed || ["clinician", "ultrasound"].includes(dating.method),
    transferDate: dating.transferDate,
    embryoAge: dating.embryoAge,
    babyNickname: document.getElementById("pregnancyBabyNickname")?.value.trim() || "",
    endedAt: "",
    outcome: ""
  };
  data.mode = "pregnancy";
  data.postpartum.active = false;
  saveData();
  closePregnancySetup();
  renderEverything();
  showScreen("pregnancy-today");
  showToast("Pregnancy Mode is on 🤍");
}

function openPregnancyTransition() {
  document.getElementById("pregnancyTransitionDate").value = todayKey();
  document.getElementById("pregnancyTransitionModal")?.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closePregnancyTransition() {
  document.getElementById("pregnancyTransitionModal")?.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

function archiveCurrentPregnancy(outcome, endDate) {
  const snapshot = clone(pregnancyRecord());
  snapshot.active = false;
  snapshot.outcome = outcome;
  snapshot.endedAt = endDate || todayKey();
  snapshot.archivedAt = new Date().toISOString();
  data.pregnancyHistory = Array.isArray(data.pregnancyHistory) ? data.pregnancyHistory : [];
  data.pregnancyHistory.push(snapshot);
  data.pregnancy.active = false;
  data.pregnancy.outcome = outcome;
  data.pregnancy.endedAt = snapshot.endedAt;
}

function renderLifeModeUI() {
  const pregnancyActive = Boolean(data.pregnancy?.active);
  const isPregnancy = data.mode === "pregnancy" && pregnancyActive;
  const isPostpartum = data.mode === "postpartum" && data.postpartum?.active;

  document.body.classList.toggle("pregnancy-mode", isPregnancy);
  document.body.classList.toggle("postpartum-mode", isPostpartum);
  document.body.dataset.lifeMode = isPregnancy ? "pregnancy" : isPostpartum ? "postpartum" : "cycle";

  const subtitle = document.getElementById("brandSubtitle");
  if (subtitle) subtitle.textContent = isPregnancy ? "with you through every week" : isPostpartum ? "with you through every season" : "your body has a rhythm";

  const status = document.getElementById("lifeModeStatus");
  if (status) status.textContent = isPregnancy ? "Pregnancy Mode" : isPostpartum ? "Postpartum" : "Cycle Mode";
  const privacyLabel = document.getElementById("hideDetailsLabel");
  if (privacyLabel) privacyLabel.textContent = isPregnancy ? "🙈 Hide pregnancy details" : isPostpartum ? "🙈 Hide postpartum details" : "🙈 Hide cycle details";

  const cycleModeButton = document.getElementById("chooseCycleMode");
  const pregnancyModeButton = document.getElementById("choosePregnancyMode");
  const cycleSelected = !isPregnancy && !isPostpartum;
  cycleModeButton?.classList.toggle("active", cycleSelected);
  pregnancyModeButton?.classList.toggle("active", isPregnancy);
  cycleModeButton?.setAttribute("aria-pressed", String(cycleSelected));
  pregnancyModeButton?.setAttribute("aria-pressed", String(isPregnancy));
  document.getElementById("activePregnancySettings")?.classList.toggle("hidden", !pregnancyActive);
  document.querySelectorAll(".cycle-settings-card").forEach(card => card.classList.toggle("hidden", isPregnancy || isPostpartum));

  document.querySelectorAll("#appDrawer .drawer-group").forEach(group => group.classList.toggle("hidden", isPregnancy));
  document.getElementById("pregnancyDrawerMenu")?.classList.toggle("hidden", !isPregnancy);

  const navToday = document.getElementById("navTodayButton");
  const navCalendar = document.getElementById("navCalendarButton");
  const navInsights = document.getElementById("navInsightsButton");
  if (isPregnancy) {
    if (navToday) navToday.dataset.screenTarget = "pregnancy-today";
    if (navCalendar) navCalendar.dataset.screenTarget = "pregnancy-calendar";
    if (navInsights) navInsights.dataset.screenTarget = "pregnancy-journey";
    document.getElementById("navInsightsIcon").textContent = "🌱";
    document.getElementById("navInsightsLabel").textContent = "Journey";
  }
  else if (isPostpartum) {
    if (navToday) navToday.dataset.screenTarget = "postpartum-today";
    if (navCalendar) navCalendar.dataset.screenTarget = "pregnancy-calendar";
    if (navInsights) navInsights.dataset.screenTarget = "pregnancy-journey";
    document.getElementById("navInsightsIcon").textContent = "🌱";
    document.getElementById("navInsightsLabel").textContent = "Journey";
  }
  else {
    if (navToday) navToday.dataset.screenTarget = "today";
    if (navCalendar) navCalendar.dataset.screenTarget = "calendar";
    if (navInsights) navInsights.dataset.screenTarget = "insights";
    document.getElementById("navInsightsIcon").textContent = "✨";
    document.getElementById("navInsightsLabel").textContent = "Insights";
  }

  document.getElementById("cycleQuickAddGrid")?.classList.toggle("hidden", isPregnancy);
  document.getElementById("pregnancyQuickAddGrid")?.classList.toggle("hidden", !isPregnancy);
  const quickTitle = document.querySelector("#quickAddSheet .quick-sheet-header h2");
  if (quickTitle) quickTitle.textContent = isPregnancy ? "What would you like to add?" : "What would you like to log?";
}

function pregnancyGreetingText() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning 🤍";
  if (hour < 18) return "Good afternoon 🤍";
  return "Good evening 🤍";
}

function nextPregnancyAppointment() {
  const today = parseDate(todayKey());
  return [...(pregnancyRecord().appointments || [])]
    .filter(item => parseDate(item.date) && parseDate(item.date) >= today)
    .sort((a, b) => parseDate(a.date) - parseDate(b.date))[0] || null;
}

function renderPregnancyToday() {
  const p = pregnancyRecord();
  const ga = gestationalAgeForDate(todayKey());
  if (!p.edd || !ga) return;

  const trimester = trimesterForGestation(ga);
  const info = pregnancyWeekInfo(ga.weeks);
  const daysUntil = daysBetween(new Date(), parseDate(p.edd));
  const nickname = p.babyNickname || "baby";

  document.getElementById("pregnancyGreeting").textContent = pregnancyGreetingText();
  document.getElementById("pregnancyHomeGreeting").textContent = ga.weeks >= 0 ? `Another week with ${nickname}.` : "One week at a time.";
  document.getElementById("pregnancyWeekTitle").textContent = `${ga.weeks} weeks + ${ga.days} days`;
  document.getElementById("pregnancyTrimesterText").textContent = trimester;
  document.getElementById("pregnancyEDDText").textContent = formatDateLong(parseDate(p.edd));
  document.getElementById("pregnancyCountdownText").textContent = daysUntil >= 0 ? `~${daysUntil} day${daysUntil === 1 ? "" : "s"}` : `${Math.abs(daysUntil)} days past EDD`;
  document.getElementById("pregnancyDatingMethodText").textContent = pregnancyDatingDescription();
  document.getElementById("pregnancyWeekHeading").textContent = `Week ${ga.weeks}`;
  document.getElementById("pregnancyWeekIcon").textContent = info.icon;
  document.getElementById("pregnancyWeekSummaryTitle").textContent = info.title;
  document.getElementById("pregnancyWeekSummary").textContent = info.text;
  document.getElementById("pregnancyCuteComparison").textContent = pregnancyCuteComparison(ga.weeks);

  const prompts = {
    "First trimester": "How is early pregnancy feeling today?",
    "Second trimester": "How are you feeling in your second trimester?",
    "Third trimester": "How is your body feeling today?"
  };
  document.getElementById("pregnancyCheckinPrompt").textContent = prompts[trimester] || "How are you feeling today?";

  const next = nextPregnancyAppointment();
  const nextCard = document.getElementById("pregnancyNextAppointment");
  nextCard.innerHTML = next ? `<span class="pregnancy-next-icon">🩺</span><div><small>Next appointment</small><strong>${escapeHTML(next.type || "Prenatal visit")}</strong><p>${formatDateLong(parseDate(next.date))}${next.time ? ` · ${escapeHTML(next.time)}` : ""}</p></div><b>›</b>` : `<span class="pregnancy-next-icon">🩺</span><div><small>Next appointment</small><strong>Nothing added yet</strong><p>Keep your provider's care plan here.</p></div><b>›</b>`;
  nextCard.onclick = () => showScreen("pregnancy-care");
  const dashStrip=document.getElementById("pregnancyDashboardStripText"); if(dashStrip) dashStrip.textContent=next?`${formatDate(parseDate(next.date))} · ${next.type}`:`${ga.weeks}w ${ga.days}d · ${Math.max(0,daysUntil)} days to EDD`;

  document.getElementById("pregnancyCompanionMessage").textContent = ga.weeks < 14 ? "A tiny seedling is growing in our room 🌱" : ga.weeks < 28 ? "The Moon Room has more flowers now 🌸" : "I’m keeping the little hospital bag nearby 👜";
  document.getElementById("pregnancyCompanionSubtext").textContent = `Week ${ga.weeks} · ${trimester}`;
}

function pregnancyWarningsSelected() {
  const warnings = Array.from(document.querySelectorAll('input[name="pregWarning"]:checked')).map(input => input.value);
  const movement = document.getElementById("pregnancyMovement")?.value || "";
  if (movement === "Less than usual") warnings.push("Baby movement is less than usual");
  return warnings;
}

function updatePregnancySafetyAlert() {
  const alert = document.getElementById("pregnancySafetyAlert");
  if (!alert) return;
  alert.classList.toggle("hidden", pregnancyWarningsSelected().length === 0);
}

document.querySelectorAll('input[name="pregWarning"]').forEach(input => input.addEventListener("change", updatePregnancySafetyAlert));
document.getElementById("pregnancyMovement")?.addEventListener("change", updatePregnancySafetyAlert);

function pregnancyStageForDate(value) {
  const ga = gestationalAgeForDate(value);
  if (!ga) return { ga: null, trimester: "Pregnancy" };
  return { ga, trimester: trimesterForGestation(ga) };
}

function loadPregnancyLogForm() {
  const dateInput = document.getElementById("pregnancyLogDate");
  if (!dateInput) return;
  if (!dateInput.value) dateInput.value = todayKey();
  const key = dateInput.value;
  const saved = pregnancyRecord().logs?.[key] || {};
  const { ga, trimester } = pregnancyStageForDate(key);
  document.getElementById("pregnancyLogGestation").textContent = ga ? `${ga.weeks} weeks + ${ga.days} days · ${trimester}` : "Pregnancy";
  document.getElementById("pregnancyBodyCheckTitle").textContent = trimester === "First trimester" ? "Early-pregnancy body check" : trimester === "Second trimester" ? "Second-trimester body check" : "Third-trimester body check";
  document.getElementById("pregnancyMovementBlock")?.classList.toggle("hidden", !ga || ga.weeks < 18);

  document.querySelectorAll('input[name="pregMood"]').forEach(input => input.checked = (saved.moods || []).includes(input.value));
  document.querySelectorAll('input[name="pregWarning"]').forEach(input => input.checked = (saved.warnings || []).includes(input.value));
  const values = {
    pregnancyEnergy: saved.energy || "",
    pregnancySleep: saved.sleep || "",
    pregnancyNausea: saved.nausea || "None",
    pregnancyVomiting: saved.vomiting ?? "",
    pregnancyAppetite: saved.appetite || "",
    pregnancyBowel: saved.bowel || "",
    pregnancyHydration: saved.hydration || "",
    pregnancyPain: saved.pain || "None",
    pregnancySwelling: saved.swelling || "None",
    pregnancyDischarge: saved.discharge || "",
    pregnancyMovement: saved.movement || "",
    pregnancyMedsToday: saved.medsToday || "",
    pregnancyTinyJoy: saved.tinyJoy || "",
    pregnancyNotes: saved.notes || ""
  };
  Object.entries(values).forEach(([id, value]) => { const el = document.getElementById(id); if (el) el.value = value; });
  updatePregnancySafetyAlert();
}

document.getElementById("pregnancyLogDate")?.addEventListener("change", loadPregnancyLogForm);
document.getElementById("pregnancyLogForm")?.addEventListener("submit", event => {
  event.preventDefault();
  const key = document.getElementById("pregnancyLogDate").value || todayKey();
  const moods = Array.from(document.querySelectorAll('input[name="pregMood"]:checked')).map(input => input.value);
  const warnings = pregnancyWarningsSelected();
  data.pregnancy.logs[key] = {
    date: key,
    moods,
    energy: document.getElementById("pregnancyEnergy").value,
    sleep: document.getElementById("pregnancySleep").value,
    nausea: document.getElementById("pregnancyNausea").value,
    vomiting: document.getElementById("pregnancyVomiting").value === "" ? null : Number(document.getElementById("pregnancyVomiting").value),
    appetite: document.getElementById("pregnancyAppetite").value,
    bowel: document.getElementById("pregnancyBowel").value,
    hydration: document.getElementById("pregnancyHydration").value,
    pain: document.getElementById("pregnancyPain").value,
    swelling: document.getElementById("pregnancySwelling").value,
    discharge: document.getElementById("pregnancyDischarge").value,
    movement: document.getElementById("pregnancyMovement").value,
    medsToday: document.getElementById("pregnancyMedsToday").value.trim(),
    tinyJoy: document.getElementById("pregnancyTinyJoy").value.trim(),
    notes: document.getElementById("pregnancyNotes").value.trim(),
    warnings,
    gestationalAge: pregnancyWeekLabel(key),
    updatedAt: new Date().toISOString()
  };
  saveData();
  renderEverything();
  showToast(warnings.length ? "Check-in saved. Please follow the safety guidance shown above." : "Pregnancy check-in saved 🤍");
});

function pregnancyCalendarWeekdayLabels() {
  return data.settings.weekStart === "monday" ? ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] : ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
}

function pregnancyEventsForDate(key) {
  const p = pregnancyRecord();
  return {
    appointments: (p.appointments || []).filter(item => item.date === key),
    checkin: p.logs?.[key] || null,
    journal: (p.journal || []).filter(item => item.date === key),
    photos: (p.photos || []).filter(item => item.date === key)
  };
}

function renderPregnancyCalendar() {
  const title = document.getElementById("pregnancyCalendarMonthTitle");
  const grid = document.getElementById("pregnancyCalendarGrid");
  const weekdays = document.getElementById("pregnancyCalendarWeekdays");
  if (!title || !grid || !weekdays) return;
  const year = pregnancyCalendarDate.getFullYear();
  const month = pregnancyCalendarDate.getMonth();
  title.textContent = new Date(year, month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  weekdays.innerHTML = pregnancyCalendarWeekdayLabels().map(day => `<span>${day}</span>`).join("");

  const first = new Date(year, month, 1);
  let offset = first.getDay();
  if (data.settings.weekStart === "monday") offset = (offset + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let html = "";
  for (let i = 0; i < offset; i++) html += '<span class="calendar-empty"></span>';
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const key = dateKey(date);
    const ga = gestationalAgeForDate(key);
    const ev = pregnancyEventsForDate(key);
    const inPregnancy = ga && ga.totalDays >= 0 && ga.totalDays <= 294;
    const selected = key === selectedPregnancyCalendarDate;
    html += `<button type="button" class="calendar-day pregnancy-calendar-day ${selected ? "selected" : ""} ${key === todayKey() ? "today" : ""}" data-preg-calendar-date="${key}"><span>${day}</span>${inPregnancy ? `<small>w${ga.weeks}+${ga.days}</small>` : ""}<i class="pregnancy-calendar-markers">${ev.appointments.length ? '<b class="appointment"></b>' : ""}${ev.checkin ? '<b class="checkin"></b>' : ""}${ev.journal.length || ev.photos.length ? '<b class="memory"></b>' : ""}</i></button>`;
  }
  grid.innerHTML = html;
  grid.querySelectorAll("[data-preg-calendar-date]").forEach(button => button.addEventListener("click", () => {
    selectedPregnancyCalendarDate = button.dataset.pregCalendarDate;
    renderPregnancyCalendar();
  }));
  renderPregnancyCalendarDayDetail();
}

function renderPregnancyCalendarDayDetail() {
  const el = document.getElementById("pregnancyCalendarDayDetail");
  if (!el) return;
  const key = selectedPregnancyCalendarDate || todayKey();
  const date = parseDate(key);
  const ga = gestationalAgeForDate(key);
  const ev = pregnancyEventsForDate(key);
  const trimester = ga ? trimesterForGestation(ga) : "";
  el.innerHTML = `<div class="pregnancy-day-detail-head"><div><p class="eyebrow">${date.toLocaleDateString(undefined,{weekday:"long"}).toUpperCase()}</p><h3>${formatDateLong(date)}</h3><p class="pregnancy-sensitive">${ga && ga.totalDays >= 0 ? `${ga.weeks}w ${ga.days}d · ${trimester}` : "Outside current pregnancy dating"}</p></div><span>🤍</span></div><div class="pregnancy-day-event-list">${ev.appointments.map(a=>`<p>🩺 ${escapeHTML(a.type)}${a.time?` · ${escapeHTML(a.time)}`:""}</p>`).join("")}${ev.checkin?'<p>📝 Pregnancy check-in saved</p>':""}${ev.journal.map(j=>`<p>📖 ${escapeHTML(j.type)}</p>`).join("")}${ev.photos.length?`<p>📷 ${ev.photos.length} photo${ev.photos.length===1?"":"s"}</p>`:""}${!ev.appointments.length&&!ev.checkin&&!ev.journal.length&&!ev.photos.length?'<p class="muted">Nothing saved for this day yet.</p>':""}</div><div class="pregnancy-day-actions"><button type="button" data-preg-day-action="checkin">📝 Check in</button><button type="button" data-preg-day-action="appointment">🩺 Appointment</button><button type="button" data-preg-day-action="memory">📖 Memory</button></div>`;
  el.querySelector('[data-preg-day-action="checkin"]')?.addEventListener("click",()=>{document.getElementById("pregnancyLogDate").value=key;showScreen("pregnancy-log");loadPregnancyLogForm();});
  el.querySelector('[data-preg-day-action="appointment"]')?.addEventListener("click",()=>{document.getElementById("pregnancyAppointmentDate").value=key;showScreen("pregnancy-care");});
  el.querySelector('[data-preg-day-action="memory"]')?.addEventListener("click",()=>{document.getElementById("pregnancyJournalDate").value=key;showScreen("pregnancy-journal");});
}

document.getElementById("pregnancyPreviousMonth")?.addEventListener("click",()=>{pregnancyCalendarDate.setMonth(pregnancyCalendarDate.getMonth()-1);renderPregnancyCalendar();});
document.getElementById("pregnancyNextMonth")?.addEventListener("click",()=>{pregnancyCalendarDate.setMonth(pregnancyCalendarDate.getMonth()+1);renderPregnancyCalendar();});

function renderPregnancyJourney() {
  const p = pregnancyRecord();
  const ga = gestationalAgeForDate(todayKey());
  const hero = document.getElementById("pregnancyJourneyHero");
  const timeline = document.getElementById("pregnancyTrimesterTimeline");
  if (!ga || !hero || !timeline) return;
  hero.innerHTML = `<span>${pregnancyWeekInfo(ga.weeks).icon}</span><div><p class="eyebrow">PREGNANCY STORY</p><h3>${ga.weeks} weeks + ${ga.days} days</h3><p>${trimesterForGestation(ga)} · EDD ${formatDateLong(parseDate(p.edd))}</p></div>`;
  const trimesters = [
    { name:"First trimester", start:0, end:97, icon:"🌱" },
    { name:"Second trimester", start:98, end:195, icon:"🌸" },
    { name:"Third trimester", start:196, end:280, icon:"🌕" }
  ];
  timeline.innerHTML = trimesters.map(t=>{const status=ga.totalDays>t.end?"complete":ga.totalDays>=t.start?"current":"future";return `<article class="trimester-card ${status}"><span>${t.icon}</span><div><strong>${t.name}</strong><small>${status==="complete"?"Completed":status==="current"?"You are here":"Ahead"}</small></div></article>`;}).join("");
  const props=[];
  if(ga.weeks<14)props.push("🌱 seedling","🌙 moon mobile");
  else if(ga.weeks<28)props.push("🌸 flowers","⭐ baby-star mobile");
  else props.push("👜 hospital bag","🧸 tiny folded clothes");
  if((p.journal||[]).length)props.push("📖 little book");
  if((p.photos||[]).length)props.push("📷 photo frame");
  const outfitProps={classic:"🌙 moon charm",ribbon:"🎀 sakura ribbon",pajamas:"🩷 soft pajamas",star:"⭐ star bonnet",blanket:"☁️ cozy blanket"};
  props.push(outfitProps[p.companionOutfit]||outfitProps.classic);
  const room=document.querySelector(".pregnancy-moon-room"); if(room) room.dataset.outfit=p.companionOutfit||"classic";
  document.getElementById("pregnancyRoomProps").textContent=props.join("  ");
  document.getElementById("pregnancyRoomSpeech").textContent = ga.weeks < 14 ? "A small seedling for a new chapter 🌱" : ga.weeks < 28 ? `Week ${ga.weeks} already 🌸` : "I saved a little space for the things you're preparing 👜";
}

function renderPregnancyCare() {
  const p = pregnancyRecord();
  const team = p.careTeam || {};
  [["pregnancyProviderName",team.provider],["pregnancyProviderContact",team.contact],["pregnancyHospital",team.hospital],["pregnancyEmergencyContact",team.emergencyContact]].forEach(([id,value])=>{const el=document.getElementById(id);if(el)el.value=value||"";});
  const list = document.getElementById("pregnancyAppointmentList");
  if (list) {
    const sorted=[...(p.appointments||[])].sort((a,b)=>parseDate(a.date)-parseDate(b.date));
    list.innerHTML=sorted.length?sorted.map(a=>`<article class="pregnancy-list-card"><span>🩺</span><div><strong>${escapeHTML(a.type)}</strong><p>${formatDateLong(parseDate(a.date))}${a.time?` · ${escapeHTML(a.time)}`:""}${a.location?` · ${escapeHTML(a.location)}`:""}</p>${a.notes?`<small>${escapeHTML(a.notes)}</small>`:""}</div><button type="button" data-delete-preg-appt="${a.id}">×</button></article>`).join(""):'<article class="soft-note">No appointments added yet.</article>';
    list.querySelectorAll("[data-delete-preg-appt]").forEach(btn=>btn.addEventListener("click",()=>{data.pregnancy.appointments=data.pregnancy.appointments.filter(a=>a.id!==btn.dataset.deletePregAppt);saveData();renderPregnancyCare();renderPregnancyToday();renderPregnancyCalendar();}));
  }
  renderPregnancyQuestions();
  renderPregnancyMedications();
  renderPregnancyTests();
  renderWHOContactTimeline();
}

function renderPregnancyQuestions(){const c=document.getElementById("pregnancyQuestionList");if(!c)return;const qs=pregnancyRecord().questions||[];c.innerHTML=qs.length?qs.map(q=>`<article class="question-row ${q.answered?"answered":""}"><button type="button" data-toggle-preg-q="${q.id}">${q.answered?"✓":"○"}</button><div><strong>${escapeHTML(q.text)}</strong>${q.answer?`<small>${escapeHTML(q.answer)}</small>`:""}</div><button type="button" data-answer-preg-q="${q.id}">Answer</button><button type="button" data-delete-preg-q="${q.id}">×</button></article>`).join(""):'<p class="muted small-text">No questions saved yet.</p>';c.querySelectorAll("[data-toggle-preg-q]").forEach(btn=>btn.addEventListener("click",()=>{const q=qs.find(x=>x.id===btn.dataset.togglePregQ);if(q){q.answered=!q.answered;saveData();renderPregnancyQuestions();}}));c.querySelectorAll("[data-answer-preg-q]").forEach(btn=>btn.addEventListener("click",()=>{const q=qs.find(x=>x.id===btn.dataset.answerPregQ);if(!q)return;const answer=prompt("Write the answer or note from your provider:",q.answer||"");if(answer!==null){q.answer=answer.trim();q.answered=Boolean(q.answer);saveData();renderPregnancyQuestions();}}));c.querySelectorAll("[data-delete-preg-q]").forEach(btn=>btn.addEventListener("click",()=>{data.pregnancy.questions=qs.filter(x=>x.id!==btn.dataset.deletePregQ);saveData();renderPregnancyQuestions();}));}
function renderPregnancyTests(){const c=document.getElementById("pregnancyTestList");if(!c)return;const tests=pregnancyRecord().tests||[];c.innerHTML=tests.length?tests.slice().sort((a,b)=>parseDate(b.date)-parseDate(a.date)).map(t=>`<article class="pregnancy-list-card"><span>🧪</span><div><strong>${escapeHTML(t.name)}</strong><p>${t.date?formatDateLong(parseDate(t.date)):"No date"}</p>${t.result?`<small>${escapeHTML(t.result)}</small>`:""}</div><button type="button" data-delete-preg-test="${t.id}">×</button></article>`).join(""):'<p class="muted small-text">No tests or results added yet.</p>';c.querySelectorAll("[data-delete-preg-test]").forEach(btn=>btn.addEventListener("click",()=>{data.pregnancy.tests=tests.filter(t=>t.id!==btn.dataset.deletePregTest);saveData();renderPregnancyTests();}));}
function renderPregnancyMedications(){const c=document.getElementById("pregnancyMedicationList");if(!c)return;const meds=pregnancyRecord().medications||[];c.innerHTML=meds.length?meds.map(m=>`<article class="medication-row"><span>💊</span><div><strong>${escapeHTML(m.name)}</strong><small>${escapeHTML(m.dose||"No dose/schedule noted")}</small></div><button type="button" data-delete-preg-med="${m.id}">×</button></article>`).join(""):'<p class="muted small-text">No medicines or supplements added.</p>';c.querySelectorAll("[data-delete-preg-med]").forEach(btn=>btn.addEventListener("click",()=>{data.pregnancy.medications=meds.filter(m=>m.id!==btn.dataset.deletePregMed);saveData();renderPregnancyMedications();}));}
function renderWHOContactTimeline(){const c=document.getElementById("whoContactTimeline");if(!c)return;const ga=gestationalAgeForDate(todayKey());const weeks=[12,20,26,30,34,36,38,40];c.innerHTML=weeks.map((w,i)=>`<span class="who-contact ${ga&&ga.weeks>=w?"past":""}"><b>${i+1}</b><small>~${w}w</small></span>`).join("");}

document.getElementById("savePregnancyCareTeam")?.addEventListener("click",()=>{data.pregnancy.careTeam={provider:document.getElementById("pregnancyProviderName").value.trim(),contact:document.getElementById("pregnancyProviderContact").value.trim(),hospital:document.getElementById("pregnancyHospital").value.trim(),emergencyContact:document.getElementById("pregnancyEmergencyContact").value.trim()};saveData();showToast("Care team saved 🩺");});
document.getElementById("savePregnancyAppointment")?.addEventListener("click",()=>{const date=document.getElementById("pregnancyAppointmentDate").value;if(!date){showToast("Choose an appointment date.");return;}data.pregnancy.appointments.push({id:uid(),date,time:document.getElementById("pregnancyAppointmentTime").value,type:document.getElementById("pregnancyAppointmentType").value,location:document.getElementById("pregnancyAppointmentLocation").value.trim(),notes:document.getElementById("pregnancyAppointmentNotes").value.trim()});saveData();document.getElementById("pregnancyAppointmentNotes").value="";renderPregnancyCare();renderPregnancyToday();renderPregnancyCalendar();showToast("Appointment added 🩺");});
document.getElementById("addPregnancyQuestion")?.addEventListener("click",()=>{const input=document.getElementById("pregnancyQuestionInput");const text=input.value.trim();if(!text)return;data.pregnancy.questions.push({id:uid(),text,answer:"",answered:false});input.value="";saveData();renderPregnancyQuestions();});
document.getElementById("addPregnancyMedication")?.addEventListener("click",()=>{const name=document.getElementById("pregnancyMedicationName").value.trim();if(!name)return;data.pregnancy.medications.push({id:uid(),name,dose:document.getElementById("pregnancyMedicationDose").value.trim()});document.getElementById("pregnancyMedicationName").value="";document.getElementById("pregnancyMedicationDose").value="";saveData();renderPregnancyMedications();});
document.getElementById("addPregnancyTest")?.addEventListener("click",()=>{const name=document.getElementById("pregnancyTestName").value.trim();if(!name){showToast("Add the test or scan name first.");return;}data.pregnancy.tests.push({id:uid(),name,date:document.getElementById("pregnancyTestDate").value||todayKey(),result:document.getElementById("pregnancyTestResult").value.trim()});document.getElementById("pregnancyTestName").value="";document.getElementById("pregnancyTestResult").value="";saveData();renderPregnancyTests();showToast("Test result saved 🧪");});

function renderPregnancyJournal(){const p=pregnancyRecord();const date=document.getElementById("pregnancyJournalDate");if(date&&!date.value)date.value=todayKey();const list=document.getElementById("pregnancyJournalList");if(!list)return;const entries=[...(p.journal||[])].sort((a,b)=>parseDate(b.date)-parseDate(a.date)).slice(0,150);if(!entries.length){list.innerHTML='<article class="soft-note">Your pregnancy journal is waiting for its first memory.</article>';return;}const groups={"First trimester":[],"Second trimester":[],"Third trimester":[],"Other":[]};entries.forEach(j=>{const ga=gestationalAgeForDate(j.date);const key=ga&&ga.totalDays>=0?trimesterForGestation(ga):"Other";groups[key].push(j);});list.innerHTML=Object.entries(groups).filter(([,items])=>items.length).map(([group,items])=>`<section class="pregnancy-journal-group"><div class="section-heading compact-heading"><div><p class="eyebrow">${escapeHTML(group).toUpperCase()}</p><h3>${items.length} memor${items.length===1?"y":"ies"}</h3></div></div>${items.map(j=>{const ga=gestationalAgeForDate(j.date);return`<article class="pregnancy-journal-card"><div><p class="eyebrow">${escapeHTML(j.type).toUpperCase()}</p><h3>${formatDateLong(parseDate(j.date))}</h3><small>${ga&&ga.totalDays>=0?`${ga.weeks}w ${ga.days}d`:""}</small></div><p>${escapeHTML(j.text)}</p><button type="button" data-delete-preg-journal="${j.id}">Delete</button></article>`;}).join("")}</section>`).join("");list.querySelectorAll("[data-delete-preg-journal]").forEach(btn=>btn.addEventListener("click",()=>{data.pregnancy.journal=data.pregnancy.journal.filter(j=>j.id!==btn.dataset.deletePregJournal);saveData();renderPregnancyJournal();renderPregnancyJourney();}));}
document.getElementById("savePregnancyJournal")?.addEventListener("click",()=>{const text=document.getElementById("pregnancyJournalText").value.trim();if(!text){showToast("Write something first.");return;}data.pregnancy.journal.push({id:uid(),date:document.getElementById("pregnancyJournalDate").value||todayKey(),type:document.getElementById("pregnancyJournalType").value,text});document.getElementById("pregnancyJournalText").value="";saveData();renderPregnancyJournal();renderPregnancyJourney();renderPregnancyGarden();showToast("Memory saved 📖");});

function clearPregnancyPhotoUrls(){pregnancyPhotoObjectUrls.forEach(url=>URL.revokeObjectURL(url));pregnancyPhotoObjectUrls=[];}
async function renderPregnancyPhotos(){const date=document.getElementById("pregnancyPhotoDate");if(date&&!date.value)date.value=todayKey();const timeline=document.getElementById("pregnancyPhotoTimeline");if(!timeline)return;clearPregnancyPhotoUrls();const photos=[...(pregnancyRecord().photos||[])].sort((a,b)=>parseDate(b.date)-parseDate(a.date)).slice(0,60);if(!photos.length){timeline.innerHTML='<article class="soft-note">No belly photos yet. Add them only if this is a memory you want to keep.</article>';return;}timeline.innerHTML="";for(const photo of photos){let url="";try{const blob=await appearanceAssetGet(photo.assetKey);if(blob){url=URL.createObjectURL(blob);pregnancyPhotoObjectUrls.push(url);}}catch{}const ga=gestationalAgeForDate(photo.date);const card=document.createElement("article");card.className="pregnancy-photo-card";card.innerHTML=`${url?`<img loading="lazy" decoding="async" src="${url}" alt="Pregnancy photo from ${escapeHTML(photo.date)}">`:'<div class="pregnancy-photo-missing">Photo file is not on this device</div>'}<div><strong>${ga&&ga.totalDays>=0?`Week ${ga.weeks} + ${ga.days}`:formatDateLong(parseDate(photo.date))}</strong><small>${formatDateLong(parseDate(photo.date))}</small>${photo.caption?`<p>${escapeHTML(photo.caption)}</p>`:""}<button type="button" data-delete-preg-photo="${photo.id}">Delete</button></div>`;timeline.appendChild(card);}timeline.querySelectorAll("[data-delete-preg-photo]").forEach(btn=>btn.addEventListener("click",async()=>{const photo=data.pregnancy.photos.find(p=>p.id===btn.dataset.deletePregPhoto);if(photo)await appearanceAssetDelete(photo.assetKey).catch(()=>{});data.pregnancy.photos=data.pregnancy.photos.filter(p=>p.id!==btn.dataset.deletePregPhoto);saveData();renderPregnancyPhotos();renderPregnancyGarden();}));}

document.getElementById("choosePregnancyPhoto")?.addEventListener("click",()=>document.getElementById("pregnancyPhotoInput")?.click());
document.getElementById("pregnancyPhotoInput")?.addEventListener("change",event=>{const file=event.target.files?.[0];if(!file)return;pendingPregnancyPhotoFile=file;if(pendingPregnancyPhotoPreviewUrl)URL.revokeObjectURL(pendingPregnancyPhotoPreviewUrl);pendingPregnancyPhotoPreviewUrl=URL.createObjectURL(file);const pending=document.getElementById("pregnancyPhotoPending");pending.classList.remove("hidden");pending.innerHTML=`<img src="${pendingPregnancyPhotoPreviewUrl}" alt="Selected pregnancy photo"><span>Ready to save</span>`;document.getElementById("savePregnancyPhoto").disabled=false;});
document.getElementById("savePregnancyPhoto")?.addEventListener("click",async()=>{if(!pendingPregnancyPhotoFile)return;const id=uid();const assetKey=`pregnancy-photo:${id}`;try{await appearanceAssetPut(assetKey,pendingPregnancyPhotoFile);data.pregnancy.photos.push({id,assetKey,date:document.getElementById("pregnancyPhotoDate").value||todayKey(),caption:document.getElementById("pregnancyPhotoCaption").value.trim()});saveData();pendingPregnancyPhotoFile=null;document.getElementById("pregnancyPhotoInput").value="";document.getElementById("pregnancyPhotoCaption").value="";document.getElementById("pregnancyPhotoPending").classList.add("hidden");document.getElementById("savePregnancyPhoto").disabled=true;await renderPregnancyPhotos();renderPregnancyGarden();showToast("Photo saved locally 📷");}catch(error){showToast("Tsuki couldn't save that photo on this device.");}});

function renderPregnancyHospitalBag(){const c=document.getElementById("pregnancyHospitalBagList");if(!c)return;const items=pregnancyRecord().hospitalBag||[];const groups=[...new Set(items.map(i=>i.category))];c.innerHTML=groups.map(group=>`<section class="bag-category"><div class="section-heading compact-heading"><div><p class="eyebrow">${escapeHTML(group).toUpperCase()}</p><h3>${items.filter(i=>i.category===group&&i.packed).length}/${items.filter(i=>i.category===group).length} packed</h3></div></div>${items.filter(i=>i.category===group).map(item=>`<label class="bag-item"><input type="checkbox" data-preg-bag-item="${item.id}" ${item.packed?"checked":""}><span>${escapeHTML(item.name)}</span><button type="button" data-delete-preg-bag="${item.id}">×</button></label>`).join("")}</section>`).join("");c.querySelectorAll("[data-preg-bag-item]").forEach(input=>input.addEventListener("change",()=>{const item=items.find(i=>i.id===input.dataset.pregBagItem);if(item){item.packed=input.checked;saveData();renderPregnancyHospitalBag();renderPregnancyJourney();}}));c.querySelectorAll("[data-delete-preg-bag]").forEach(btn=>btn.addEventListener("click",event=>{event.preventDefault();data.pregnancy.hospitalBag=items.filter(i=>i.id!==btn.dataset.deletePregBag);saveData();renderPregnancyHospitalBag();}));}
document.getElementById("addHospitalBagItem")?.addEventListener("click",()=>{const input=document.getElementById("hospitalBagItem");const name=input.value.trim();if(!name)return;data.pregnancy.hospitalBag.push({id:uid(),category:document.getElementById("hospitalBagCategory").value,name,packed:false});input.value="";saveData();renderPregnancyHospitalBag();});

function renderBirthPreferences(){const pref=pregnancyRecord().birthPreferences||{};[["birthPrefFacility",pref.facility],["birthPrefSupport",pref.support],["birthPrefComfort",pref.comfort],["birthPrefPain",pref.pain],["birthPrefQuestions",pref.questions],["birthPrefNotes",pref.notes]].forEach(([id,value])=>{const el=document.getElementById(id);if(el)el.value=value||"";});}
document.getElementById("saveBirthPreferences")?.addEventListener("click",()=>{data.pregnancy.birthPreferences={facility:document.getElementById("birthPrefFacility").value.trim(),support:document.getElementById("birthPrefSupport").value.trim(),comfort:document.getElementById("birthPrefComfort").value.trim(),pain:document.getElementById("birthPrefPain").value.trim(),questions:document.getElementById("birthPrefQuestions").value.trim(),notes:document.getElementById("birthPrefNotes").value.trim()};saveData();showToast("Birth preferences saved 💌");});

function pregnancyMilestones(){const p=pregnancyRecord();const ga=gestationalAgeForDate(todayKey());const weeks=ga?.weeks??0;return[
  {icon:"🌱",title:"Pregnancy Mode began",done:Boolean(p.startedAt),note:p.startedAt?formatDateLong(parseDate(p.startedAt)):"Waiting"},
  {icon:"🩺",title:"First appointment saved",done:(p.appointments||[]).length>0,note:(p.appointments||[]).length?"A care memory is in your timeline":"Add an appointment when you want"},
  {icon:"🌸",title:"Second trimester",done:weeks>=14,note:"Begins at 14w0d"},
  {icon:"📷",title:"First photo memory",done:(p.photos||[]).length>0,note:"Optional and private to this device"},
  {icon:"📖",title:"First journal memory",done:(p.journal||[]).length>0,note:"Letters, tiny joys, or notes"},
  {icon:"🪻",title:"Third trimester",done:weeks>=28,note:"Begins at 28w0d"},
  {icon:"👜",title:"Hospital bag started",done:(p.hospitalBag||[]).some(i=>i.packed),note:"Your own checklist, your own pace"},
  {icon:"🌕",title:"Due-date week",done:weeks>=40,note:"EDD is a guide, not a guaranteed birth date"}
];}
function renderPregnancyGarden(){const ga=gestationalAgeForDate(todayKey());const weeks=ga?.weeks??0;const plant=document.getElementById("pregnancyGardenPlant");const title=document.getElementById("pregnancyGardenTitle");const text=document.getElementById("pregnancyGardenText");const grid=document.getElementById("pregnancyGardenMilestones");if(!plant||!title||!text||!grid)return;plant.textContent=weeks<14?"🌱":weeks<28?"🌿":weeks<37?"🌷":"🌸";title.textContent=weeks<14?"A new little seed":weeks<28?"Your garden is filling in":"Your garden is in bloom";text.textContent=`Week ${weeks} · Your garden grows from milestones, never daily streaks.`;grid.innerHTML=pregnancyMilestones().map(m=>`<article class="pregnancy-milestone ${m.done?"done":""}"><span>${m.icon}</span><div><strong>${escapeHTML(m.title)}</strong><small>${escapeHTML(m.note)}</small></div><b>${m.done?"✓":"○"}</b></article>`).join("");}

function renderPostpartumToday(){const birth=parseDate(data.postpartum?.birthDate);const age=document.getElementById("postpartumAgeText");if(!age)return;if(!birth){age.textContent="Postpartum";return;}const days=Math.max(0,daysBetween(birth,new Date()));age.textContent=days<14?`Day ${days} postpartum`:`${Math.floor(days/7)} weeks postpartum`;document.getElementById("postpartumModeText").textContent="Cycle predictions are paused until you choose Cycle Mode.";}

function archiveForBirth(){const date=document.getElementById("pregnancyTransitionDate").value||todayKey();archiveCurrentPregnancy("birth",date);data.postpartum={active:true,birthDate:date,pregnancyId:data.pregnancy.id};data.mode="postpartum";saveData();closePregnancyTransition();renderEverything();showScreen("postpartum-today");showToast("Pregnancy archived. Tsuki is ready for your postpartum transition 🌙");}
function archivePregnancyEnded(){const date=document.getElementById("pregnancyTransitionDate").value||todayKey();archiveCurrentPregnancy("ended",date);data.mode="cycle";data.postpartum.active=false;saveData();closePregnancyTransition();renderEverything();showScreen("today");showToast("Pregnancy archived. Your cycle history is still here.");}

function pregnancyQuickAction(action){closeQuickAdd();if(action==="checkin")showScreen("pregnancy-log");if(action==="appointment"){document.getElementById("pregnancyAppointmentDate").value=todayKey();showScreen("pregnancy-care");}if(action==="journal"){document.getElementById("pregnancyJournalDate").value=todayKey();showScreen("pregnancy-journal");}if(action==="photo"){document.getElementById("pregnancyPhotoDate").value=todayKey();showScreen("pregnancy-photos");}if(action==="question"){showScreen("pregnancy-care");requestAnimationFrame(()=>document.getElementById("pregnancyQuestionInput")?.focus());}}
document.querySelectorAll("[data-pregnancy-quick]").forEach(btn=>btn.addEventListener("click",()=>pregnancyQuickAction(btn.dataset.pregnancyQuick)));

document.getElementById("pregnancyDatingMethod")?.addEventListener("change",updatePregnancySetupFields);
["pregnancyLMPDate","pregnancyDirectEDD","pregnancyTransferDate","pregnancyEmbryoAge","pregnancyIVFDirectEDD"].forEach(id=>document.getElementById(id)?.addEventListener("input",updatePregnancySetupFields));
document.getElementById("closePregnancySetup")?.addEventListener("click",closePregnancySetup);
document.getElementById("savePregnancySetup")?.addEventListener("click",savePregnancySetup);
document.getElementById("pregnancySetupModal")?.addEventListener("click",event=>{if(event.target.id==="pregnancySetupModal")closePregnancySetup();});
document.getElementById("closePregnancyTransition")?.addEventListener("click",closePregnancyTransition);
document.getElementById("pregnancyTransitionModal")?.addEventListener("click",event=>{if(event.target.id==="pregnancyTransitionModal")closePregnancyTransition();});
document.getElementById("pregnancyOutcomeBirth")?.addEventListener("click",archiveForBirth);
document.getElementById("pregnancyOutcomeEnded")?.addEventListener("click",archivePregnancyEnded);
document.getElementById("pregnancyPauseMode")?.addEventListener("click",()=>{data.mode="cycle";saveData();closePregnancyTransition();renderEverything();showScreen("today");showToast("Cycle Mode is back. Pregnancy data is still saved.");});
document.getElementById("choosePregnancyMode")?.addEventListener("click",()=>{
  if(data.pregnancy?.active){
    data.mode="pregnancy";
    saveData();
    renderLifeModeUI();
    renderEverything();
    showScreen("pregnancy-today");
    return;
  }

  // Give immediate visual feedback while the user completes Pregnancy setup.
  document.getElementById("chooseCycleMode")?.classList.remove("active");
  document.getElementById("choosePregnancyMode")?.classList.add("active");
  document.getElementById("chooseCycleMode")?.setAttribute("aria-pressed","false");
  document.getElementById("choosePregnancyMode")?.setAttribute("aria-pressed","true");
  const status=document.getElementById("lifeModeStatus");
  if(status) status.textContent="Setting up Pregnancy Mode";
  openPregnancySetup();
});
document.getElementById("chooseCycleMode")?.addEventListener("click",()=>{
  const alreadyCycle=data.mode==="cycle" && !data.postpartum?.active;
  if(alreadyCycle){renderLifeModeUI();return;}
  if(!confirm("Switch to Cycle Mode? Your pregnancy record will stay saved.")){renderLifeModeUI();return;}
  data.mode="cycle";
  saveData();
  renderLifeModeUI();
  renderEverything();
  showScreen("today");
});
document.getElementById("editPregnancyDetails")?.addEventListener("click",openPregnancySetup);
document.getElementById("pregnancyTransitionButton")?.addEventListener("click",openPregnancyTransition);
document.getElementById("drawerEditPregnancy")?.addEventListener("click",()=>{closeAppDrawer();openPregnancySetup();});
document.getElementById("drawerEndPregnancy")?.addEventListener("click",()=>{closeAppDrawer();openPregnancyTransition();});
document.getElementById("returnToCycleFromPostpartum")?.addEventListener("click",()=>{if(!confirm("Restart Cycle Mode? Pregnancy and postpartum history will remain saved."))return;data.mode="cycle";data.postpartum.active=false;saveData();renderEverything();showScreen("today");});



/* ============================================================
   BUILD 7.1 — PREGNANCY COMPLETE+ TOOLKIT
   Performance rule: heavy pregnancy screens render on demand.
   ============================================================ */

const PREGNANCY_MODULE_LABELS = {
  vaccinations: ["💉", "Vaccination record"],
  bloodPressure: ["🩸", "Blood pressure"],
  glucose: ["🍬", "Glucose log"],
  wellbeing: ["🧠", "Mental wellbeing"],
  movementJournal: ["👶", "Movement journal"],
  contractions: ["⏱️", "Contraction timer"],
  fluidNotes: ["💧", "Fluid notes"],
  multiples: ["🤰", "Twins / multiples"],
  documents: ["🗃️", "Document vault"],
  reminders: ["🔔", "Smart reminders"]
};

let selectedWellbeingValue = "";
let contractionStartedAt = 0;
let contractionTimerInterval = null;
let pendingPregnancyDocumentFile = null;
let pregnancyStoryObjectUrls = [];
let pregnancyTimelapseTimer = null;

function safePregnancyArray(key) {
  const p = pregnancyRecord();
  if (!Array.isArray(p[key])) p[key] = [];
  return p[key];
}

function capPregnancyList(list, limit = 500) {
  if (list.length > limit) list.splice(0, list.length - limit);
}

function localDateTimeValue(date = new Date()) {
  const pad = n => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatPregDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function pregnancyDaysUntilEDD() {
  const edd = pregnancyEDD();
  return edd ? daysBetween(new Date(), edd) : null;
}

function pregnancyProgressPercent() {
  const ga = gestationalAgeForDate(todayKey());
  if (!ga) return 0;
  return Math.max(0, Math.min(100, Math.round((ga.totalDays / 280) * 100)));
}

function pregnancyLogsSorted() {
  return Object.values(pregnancyRecord().logs || {})
    .filter(item => item && item.date)
    .sort((a,b) => parseDate(a.date) - parseDate(b.date));
}

function pregnancyCommonValue(values) {
  const counts = new Map();
  values.filter(Boolean).forEach(value => counts.set(value, (counts.get(value) || 0) + 1));
  return [...counts.entries()].sort((a,b) => b[1]-a[1])[0] || null;
}

function pregnancyInsightCards() {
  const logs = pregnancyLogsSorted();
  const cards = [];
  if (!logs.length) return [{icon:"🌙",title:"Tsuki is still learning",text:"Pregnancy insights appear from your own check-ins. They describe patterns only and do not diagnose anything."}];

  const moods = pregnancyCommonValue(logs.flatMap(log => log.moods || []));
  if (moods) cards.push({icon:"💗",title:"Most logged mood",text:`${moods[0]} appeared in ${moods[1]} of your saved mood selections.`});

  const nauseaLogs = logs.filter(log => log.nausea && log.nausea !== "None");
  if (nauseaLogs.length) {
    const weeks = nauseaLogs.map(log => gestationalAgeForDate(log.date)?.weeks).filter(Number.isFinite);
    if (weeks.length) cards.push({icon:"🌿",title:"Nausea timing",text:`You logged nausea on ${nauseaLogs.length} check-in${nauseaLogs.length===1?"":"s"}, spanning roughly weeks ${Math.min(...weeks)}–${Math.max(...weeks)}.`});
  }

  const recent = logs.slice(-5);
  const lowEnergy = recent.filter(log => log.energy === "Low").length;
  if (recent.length >= 3) cards.push({icon:"✨",title:"Recent energy",text:lowEnergy >= Math.ceil(recent.length/2) ? "Low energy appears in several of your recent check-ins." : "Your recent energy logs are mixed or mostly above low."});

  const warningLogs = logs.filter(log => (log.warnings || []).length);
  if (warningLogs.length) cards.push({icon:"⚠️",title:"Safety notes logged",text:`You saved urgent-warning selections on ${warningLogs.length} date${warningLogs.length===1?"":"s"}. Tsuki keeps these visible for appointment review; it does not interpret the cause.`});

  return cards.slice(0,4);
}

function pregnancyReadinessData() {
  const p = pregnancyRecord();
  const bag = p.hospitalBag || [];
  const bagPacked = bag.length ? Math.round((bag.filter(i=>i.packed).length / bag.length) * 100) : 0;
  const prep = p.postpartumPrep || [];
  const prepDone = prep.length ? Math.round((prep.filter(i=>i.done).length / prep.length) * 100) : 0;
  const pref = p.birthPreferences || {};
  const prefFields = [pref.facility,pref.support,pref.comfort,pref.pain,pref.questions,pref.notes].filter(Boolean).length;
  const careReady = [p.careTeam?.provider,p.careTeam?.contact,p.careTeam?.hospital,p.careTeam?.emergencyContact].filter(Boolean).length;
  const total = Math.round((bagPacked + prepDone + Math.round(prefFields/6*100) + Math.round(careReady/4*100)) / 4);
  return { total, bagPacked, prepDone, prefPercent: Math.round(prefFields/6*100), carePercent: Math.round(careReady/4*100) };
}

function duePregnancyReminders() {
  const now = new Date();
  const next48h = new Date(now.getTime() + 48*3600000);
  return (pregnancyRecord().reminders || []).filter(r => {
    const d = new Date(r.date);
    return !r.done && !Number.isNaN(d.getTime()) && d <= next48h;
  }).sort((a,b)=>new Date(a.date)-new Date(b.date));
}

function renderPregnancyDashboard() {
  const hero = document.getElementById("pregnancyDashboardHero");
  const grid = document.getElementById("pregnancyDashboardGrid");
  const upcoming = document.getElementById("pregnancyDashboardUpcoming");
  const readiness = document.getElementById("pregnancyBirthReadiness");
  if (!hero || !grid || !upcoming || !readiness) return;
  const p = pregnancyRecord();
  const ga = gestationalAgeForDate(todayKey());
  if (!ga || !p.edd) return;
  const days = pregnancyDaysUntilEDD();
  const next = nextPregnancyAppointment();
  const ready = pregnancyReadinessData();
  const reminders = duePregnancyReminders();
  const meds = p.medications || [];
  const insightsContainer = document.getElementById("pregnancyDashboardInsights");
  const recentBP = (p.bpReadings || []).slice(-1)[0];
  const recentGlucose = (p.glucoseReadings || []).slice(-1)[0];

  hero.innerHTML = `<div><p class="eyebrow">TODAY</p><h2>${ga.weeks} weeks + ${ga.days} days</h2><p>${trimesterForGestation(ga)} · EDD ${formatDateLong(parseDate(p.edd))}</p></div><div class="dashboard-progress"><span style="--progress:${pregnancyProgressPercent()}%"></span><strong>${pregnancyProgressPercent()}%</strong><small>of 40 weeks</small></div>`;

  const cells = [
    ["🩺","Next appointment", next ? `${next.type} · ${formatDate(parseDate(next.date))}` : "Nothing scheduled"],
    ["💊","Medication list", `${meds.length} item${meds.length===1?"":"s"}`],
    ["👜","Hospital bag", `${ready.bagPacked}% packed`],
    ["🍼","Postpartum prep", `${ready.prepDone}% ready`],
    ["🩸","Latest BP", recentBP ? `${recentBP.systolic}/${recentBP.diastolic}` : "Not tracked"],
    ["🍬","Latest glucose", recentGlucose ? `${recentGlucose.value}${recentGlucose.unit?` ${recentGlucose.unit}`:""} · ${recentGlucose.context}` : "Not tracked"],
    ["🌙","Due date", days === null ? "—" : days >= 0 ? `${days} days` : `${Math.abs(days)} days past EDD`],
    ["🌸","Memories", `${(p.journal||[]).length + (p.photos||[]).length + (p.fun?.memoryJar||[]).length} saved`]
  ];
  grid.innerHTML = cells.map(c=>`<article class="pregnancy-dashboard-cell"><span>${c[0]}</span><small>${escapeHTML(c[1])}</small><strong>${escapeHTML(String(c[2]))}</strong></article>`).join("");

  const upcomingItems = [];
  if (next) upcomingItems.push(`<article class="pregnancy-list-card"><span>🩺</span><div><strong>${escapeHTML(next.type)}</strong><p>${formatDateLong(parseDate(next.date))}${next.time?` · ${escapeHTML(next.time)}`:""}</p></div></article>`);
  reminders.slice(0,4).forEach(r=>upcomingItems.push(`<article class="pregnancy-list-card"><span>🔔</span><div><strong>${escapeHTML(r.text)}</strong><p>${formatPregDateTime(r.date)}</p></div></article>`));
  upcoming.innerHTML = upcomingItems.length ? upcomingItems.join("") : '<article class="soft-note">Nothing urgent on your pregnancy planner right now.</article>';

  readiness.innerHTML = `<div class="readiness-meter"><div style="width:${ready.total}%"></div></div><div class="readiness-score"><strong>${ready.total}%</strong><span>overall preparation</span></div><div class="readiness-mini-grid"><span>👜 Bag <b>${ready.bagPacked}%</b></span><span>💌 Birth prefs <b>${ready.prefPercent}%</b></span><span>🩺 Care contacts <b>${ready.carePercent}%</b></span><span>🍼 Postpartum <b>${ready.prepDone}%</b></span></div>`;
  if (insightsContainer) insightsContainer.innerHTML = pregnancyInsightCards().map(i=>`<article class="pregnancy-insight-card"><span>${i.icon}</span><div><strong>${escapeHTML(i.title)}</strong><p>${escapeHTML(i.text)}</p></div></article>`).join("");

  const strip = document.getElementById("pregnancyDashboardStripText");
  if (strip) strip.textContent = next ? `${formatDate(parseDate(next.date))} · ${next.type}` : `${ga.weeks}w ${ga.days}d · ${days} days to EDD`;
}

function renderPregnancyModuleToggles() {
  const container = document.getElementById("pregnancyModuleToggles");
  if (!container) return;
  const modules = pregnancyRecord().modules || {};
  container.innerHTML = Object.entries(PREGNANCY_MODULE_LABELS).map(([key,[icon,label]]) => `<label class="module-toggle-row"><span>${icon} ${escapeHTML(label)}</span><input type="checkbox" data-preg-module="${key}" ${modules[key] ? "checked" : ""}></label>`).join("");
  container.querySelectorAll("[data-preg-module]").forEach(input => input.addEventListener("change", () => {
    data.pregnancy.modules[input.dataset.pregModule] = input.checked;
    saveData();
    applyPregnancyModuleVisibility();
  }));
}

function applyPregnancyModuleVisibility() {
  const modules = pregnancyRecord().modules || {};
  const map = {
    vaccinations:"pregVaccinationModule", bloodPressure:"pregBloodPressureModule", glucose:"pregGlucoseModule",
    wellbeing:"pregWellbeingModule", movementJournal:"pregMovementJournalModule", contractions:"pregContractionModule",
    fluidNotes:"pregFluidModule", multiples:"pregMultiplesModule"
  };
  Object.entries(map).forEach(([key,id]) => document.getElementById(id)?.classList.toggle("hidden", !modules[key]));
}

function listCard(icon, title, meta, id, attr) {
  return `<article class="mini-record"><span>${icon}</span><div><strong>${escapeHTML(String(title))}</strong><small>${escapeHTML(String(meta||""))}</small></div>${id?`<button type="button" ${attr}="${id}">×</button>`:""}</article>`;
}

function renderPregnancyHealth() {
  const p = pregnancyRecord();
  renderPregnancyModuleToggles();
  applyPregnancyModuleVisibility();
  const hp = p.healthProfile || {};
  const assign = (id,value)=>{const el=document.getElementById(id); if(el)el.value=value||"";};
  assign("pregHealthBloodType",hp.bloodType); assign("pregHealthRh",hp.rh); assign("pregHealthAllergies",hp.allergies); assign("pregHealthConditions",hp.conditions); assign("pregHealthPrior",hp.priorPregnancies); assign("pregHealthInstructions",hp.providerInstructions);
  ["pregVaccinationDate","pregMovementJournalDate","pregFluidDate","pregBPDate","pregGlucoseDate"].forEach(id=>{const el=document.getElementById(id);if(el&&!el.value)el.value=id==="pregVaccinationDate"?todayKey():localDateTimeValue();});
  renderPregVaccinations(); renderPregBP(); renderPregGlucose(); renderPregWellbeing(); renderPregMovementJournal(); renderContractions(); renderPregFluidNotes(); renderPregMultiples();
}

function renderPregVaccinations(){const c=document.getElementById("pregVaccinationList");if(!c)return;const list=[...(pregnancyRecord().vaccinations||[])].slice().reverse();c.innerHTML=list.length?list.slice(0,20).map(v=>listCard("💉",v.name,`${v.date?formatDateLong(parseDate(v.date)):"No date"}${v.notes?` · ${v.notes}`:""}`,v.id,"data-delete-vax")).join(""):'<p class="muted small-text">No vaccination records added.</p>';c.querySelectorAll("[data-delete-vax]").forEach(b=>b.onclick=()=>{data.pregnancy.vaccinations=data.pregnancy.vaccinations.filter(x=>x.id!==b.dataset.deleteVax);saveData();renderPregVaccinations();});}
function renderPregBP(){const c=document.getElementById("pregBPList");if(!c)return;const list=[...(pregnancyRecord().bpReadings||[])].slice().reverse();c.innerHTML=list.length?list.slice(0,12).map(v=>listCard("🩸",`${v.systolic}/${v.diastolic}`,`${formatPregDateTime(v.date)}${v.notes?` · ${v.notes}`:""}`,v.id,"data-delete-bp")).join(""):'<p class="muted small-text">No BP readings saved.</p>';c.querySelectorAll("[data-delete-bp]").forEach(b=>b.onclick=()=>{data.pregnancy.bpReadings=data.pregnancy.bpReadings.filter(x=>x.id!==b.dataset.deleteBp);saveData();renderPregBP();});}
function renderPregGlucose(){const c=document.getElementById("pregGlucoseList");if(!c)return;const list=[...(pregnancyRecord().glucoseReadings||[])].slice().reverse();c.innerHTML=list.length?list.slice(0,12).map(v=>listCard("🍬",`${v.value} ${v.unit||""}`.trim(),`${v.context} · ${formatPregDateTime(v.date)}${v.notes?` · ${v.notes}`:""}`,v.id,"data-delete-glucose")).join(""):'<p class="muted small-text">No glucose readings saved.</p>';c.querySelectorAll("[data-delete-glucose]").forEach(b=>b.onclick=()=>{data.pregnancy.glucoseReadings=data.pregnancy.glucoseReadings.filter(x=>x.id!==b.dataset.deleteGlucose);saveData();renderPregGlucose();});}
function renderPregWellbeing(){const c=document.getElementById("pregWellbeingList");if(!c)return;const list=[...(pregnancyRecord().wellbeing||[])].slice().reverse();c.innerHTML=list.length?list.slice(0,10).map(v=>listCard("🧠",v.value,`${formatDateLong(parseDate(v.date))}${v.note?` · ${v.note}`:""}`,v.id,"data-delete-wellbeing")).join(""):'<p class="muted small-text">No wellbeing notes yet.</p>';c.querySelectorAll("[data-delete-wellbeing]").forEach(b=>b.onclick=()=>{data.pregnancy.wellbeing=data.pregnancy.wellbeing.filter(x=>x.id!==b.dataset.deleteWellbeing);saveData();renderPregWellbeing();});}
function renderPregMovementJournal(){const c=document.getElementById("pregMovementJournalList");if(!c)return;const list=[...(pregnancyRecord().movementJournal||[])].slice().reverse();c.innerHTML=list.length?list.slice(0,12).map(v=>listCard("👶",v.value,`${formatPregDateTime(v.date)}${v.note?` · ${v.note}`:""}`,v.id,"data-delete-movejournal")).join(""):'<p class="muted small-text">No movement notes saved.</p>';c.querySelectorAll("[data-delete-movejournal]").forEach(b=>b.onclick=()=>{data.pregnancy.movementJournal=data.pregnancy.movementJournal.filter(x=>x.id!==b.dataset.deleteMovejournal);saveData();renderPregMovementJournal();});}
function renderPregFluidNotes(){const c=document.getElementById("pregFluidList");if(!c)return;const list=[...(pregnancyRecord().fluidNotes||[])].slice().reverse();c.innerHTML=list.length?list.slice(0,10).map(v=>listCard("💧",v.color,`${formatPregDateTime(v.date)}${v.note?` · ${v.note}`:""}`,v.id,"data-delete-fluid")).join(""):'<p class="muted small-text">No fluid notes saved.</p>';c.querySelectorAll("[data-delete-fluid]").forEach(b=>b.onclick=()=>{data.pregnancy.fluidNotes=data.pregnancy.fluidNotes.filter(x=>x.id!==b.dataset.deleteFluid);saveData();renderPregFluidNotes();});}

function renderPregMultiples(){const p=pregnancyRecord();const count=document.getElementById("pregBabyCount");const fields=document.getElementById("pregBabyNamesFields");if(!count||!fields)return;count.value=String(p.babyCount||1);const n=Number(count.value);fields.innerHTML=Array.from({length:n},(_,i)=>`<label class="field-label">${n===1?"Baby nickname":`Baby ${String.fromCharCode(65+i)} nickname`}<input class="input" data-baby-name-index="${i}" value="${escapeHTML(p.babyNames?.[i]||"")}" placeholder="Optional"></label>`).join("");}

document.getElementById("pregBabyCount")?.addEventListener("change",renderPregMultiples);
document.getElementById("savePregHealthProfile")?.addEventListener("click",()=>{data.pregnancy.healthProfile={bloodType:document.getElementById("pregHealthBloodType").value.trim(),rh:document.getElementById("pregHealthRh").value,allergies:document.getElementById("pregHealthAllergies").value.trim(),conditions:document.getElementById("pregHealthConditions").value.trim(),priorPregnancies:document.getElementById("pregHealthPrior").value.trim(),providerInstructions:document.getElementById("pregHealthInstructions").value.trim()};saveData();showToast("Pregnancy health profile saved 🩺");});
document.getElementById("addPregVaccination")?.addEventListener("click",()=>{const name=document.getElementById("pregVaccinationName").value.trim();if(!name)return;const list=safePregnancyArray("vaccinations");list.push({id:uid(),name,date:document.getElementById("pregVaccinationDate").value||todayKey(),notes:document.getElementById("pregVaccinationNotes").value.trim()});capPregnancyList(list,100);document.getElementById("pregVaccinationName").value="";document.getElementById("pregVaccinationNotes").value="";saveData();renderPregVaccinations();});
document.getElementById("addPregBP")?.addEventListener("click",()=>{const s=Number(document.getElementById("pregBPSystolic").value),d=Number(document.getElementById("pregBPDiastolic").value);if(!s||!d){showToast("Enter both BP numbers.");return;}const list=safePregnancyArray("bpReadings");list.push({id:uid(),systolic:s,diastolic:d,date:document.getElementById("pregBPDate").value||localDateTimeValue(),notes:document.getElementById("pregBPNotes").value.trim()});capPregnancyList(list);document.getElementById("pregBPSystolic").value="";document.getElementById("pregBPDiastolic").value="";document.getElementById("pregBPNotes").value="";saveData();renderPregBP();});
document.getElementById("addPregGlucose")?.addEventListener("click",()=>{const v=document.getElementById("pregGlucoseValue").value.trim();if(!v)return;const list=safePregnancyArray("glucoseReadings");list.push({id:uid(),value:v,unit:document.getElementById("pregGlucoseUnit").value,context:document.getElementById("pregGlucoseContext").value,date:document.getElementById("pregGlucoseDate").value||localDateTimeValue(),notes:document.getElementById("pregGlucoseNotes").value.trim()});capPregnancyList(list);document.getElementById("pregGlucoseValue").value="";document.getElementById("pregGlucoseNotes").value="";saveData();renderPregGlucose();});
document.querySelectorAll("[data-wellbeing]").forEach(btn=>btn.addEventListener("click",()=>{selectedWellbeingValue=btn.dataset.wellbeing;document.querySelectorAll("[data-wellbeing]").forEach(b=>b.classList.toggle("active",b===btn));}));
document.getElementById("savePregWellbeing")?.addEventListener("click",()=>{if(!selectedWellbeingValue){showToast("Choose how you feel first.");return;}const list=safePregnancyArray("wellbeing");list.push({id:uid(),date:todayKey(),value:selectedWellbeingValue,note:document.getElementById("pregWellbeingNote").value.trim()});capPregnancyList(list,200);document.getElementById("pregWellbeingNote").value="";if(selectedWellbeingValue==="Very low")showToast("Saved. If you're struggling or feel unsafe, contact your provider or a trusted support person now.");else showToast("Wellbeing check-in saved 🧠");selectedWellbeingValue="";document.querySelectorAll("[data-wellbeing]").forEach(b=>b.classList.remove("active"));saveData();renderPregWellbeing();});
document.getElementById("addPregMovementJournal")?.addEventListener("click",()=>{const list=safePregnancyArray("movementJournal");list.push({id:uid(),date:document.getElementById("pregMovementJournalDate").value||localDateTimeValue(),value:document.getElementById("pregMovementJournalValue").value,note:document.getElementById("pregMovementJournalNote").value.trim()});capPregnancyList(list);document.getElementById("pregMovementJournalNote").value="";saveData();renderPregMovementJournal();if(document.getElementById("pregMovementJournalValue").value==="Less than usual")showToast("A meaningful reduction in your baby's usual movement can need prompt medical attention. Contact your maternity provider now.");});
document.getElementById("addPregFluid")?.addEventListener("click",()=>{const list=safePregnancyArray("fluidNotes");list.push({id:uid(),date:document.getElementById("pregFluidDate").value||localDateTimeValue(),color:document.getElementById("pregFluidColor").value,note:document.getElementById("pregFluidNote").value.trim()});capPregnancyList(list,100);document.getElementById("pregFluidNote").value="";saveData();renderPregFluidNotes();showToast("Fluid note saved. If you think your water may have broken or you have bleeding, contact your maternity provider for guidance.");});
document.getElementById("savePregMultiples")?.addEventListener("click",()=>{const n=Number(document.getElementById("pregBabyCount").value||1);data.pregnancy.babyCount=n;data.pregnancy.babyNames=Array.from(document.querySelectorAll("[data-baby-name-index]")).map(i=>i.value.trim());saveData();showToast("Baby details saved 🤍");});

function renderContractions(){const c=document.getElementById("contractionList");if(!c)return;const list=[...(pregnancyRecord().contractions||[])].slice().reverse();c.innerHTML=list.length?list.slice(0,12).map((v,i)=>{const prev=list[i+1];const interval=prev?Math.round((new Date(v.startedAt)-new Date(prev.startedAt))/60000):null;return listCard("⏱️",`${v.durationSec}s`,`${formatPregDateTime(v.startedAt)}${interval!==null?` · ~${Math.abs(interval)} min from previous`:""}`,v.id,"data-delete-contraction");}).join(""):'<p class="muted small-text">No contractions timed.</p>';c.querySelectorAll("[data-delete-contraction]").forEach(b=>b.onclick=()=>{data.pregnancy.contractions=data.pregnancy.contractions.filter(x=>x.id!==b.dataset.deleteContraction);saveData();renderContractions();});}
function updateContractionTimer(){const display=document.getElementById("contractionTimerDisplay");if(!display||!contractionStartedAt)return;const sec=Math.floor((Date.now()-contractionStartedAt)/1000);display.textContent=`${String(Math.floor(sec/60)).padStart(2,"0")}:${String(sec%60).padStart(2,"0")}`;}
document.getElementById("toggleContractionTimer")?.addEventListener("click",()=>{const btn=document.getElementById("toggleContractionTimer"),status=document.getElementById("contractionTimerStatus"),display=document.getElementById("contractionTimerDisplay");if(!contractionStartedAt){contractionStartedAt=Date.now();btn.textContent="Stop contraction";status.textContent="Timing…";contractionTimerInterval=setInterval(updateContractionTimer,1000);updateContractionTimer();}else{const ended=Date.now();const list=safePregnancyArray("contractions");list.push({id:uid(),startedAt:new Date(contractionStartedAt).toISOString(),endedAt:new Date(ended).toISOString(),durationSec:Math.max(1,Math.round((ended-contractionStartedAt)/1000))});capPregnancyList(list,200);clearInterval(contractionTimerInterval);contractionTimerInterval=null;contractionStartedAt=0;btn.textContent="Start contraction";status.textContent="Saved";display.textContent="00:00";saveData();renderContractions();}});

function renderPregnancyPlanner(){const p=pregnancyRecord();const quick=document.getElementById("pregHospitalQuickAccess");if(quick){const t=p.careTeam||{};quick.innerHTML=`<div class="quick-access-grid"><div><small>Hospital / facility</small><strong>${escapeHTML(t.hospital||"Not added")}</strong></div><div><small>Provider</small><strong>${escapeHTML(t.provider||"Not added")}</strong></div><div><small>Provider contact</small><strong>${escapeHTML(t.contact||"Not added")}</strong>${t.contact?`<a href="tel:${escapeHTML(t.contact.replace(/[^+0-9]/g,""))}">Call</a>`:""}</div><div><small>Emergency contact</small><strong>${escapeHTML(t.emergencyContact||"Not added")}</strong></div></div>`;}renderAppointmentPrep();renderAppointmentRecaps();renderPregReminders();renderPrenatalTracker();renderMedicationSchedule();renderPregDocuments();renderPostpartumPrep();renderEnhancedCareTimeline();}

function appointmentPrepText(){const p=pregnancyRecord();const next=nextPregnancyAppointment();const qs=(p.questions||[]).filter(q=>!q.answered).slice(0,10);const meds=p.medications||[];const bps=(p.bpReadings||[]).slice(-5);const gluc=(p.glucoseReadings||[]).slice(-5);const recentLogs=pregnancyLogsSorted().slice(-5);return [
  `TSUKI APPOINTMENT PREP`,
  next?`Next appointment: ${next.type} — ${formatDateLong(parseDate(next.date))}${next.time?` ${next.time}`:""}`:"Next appointment: not added",
  `Pregnancy: ${pregnancyWeekLabel(todayKey())} · EDD ${p.edd?formatDateLong(parseDate(p.edd)):"—"}`,
  `\nQuestions (${qs.length})`,...(qs.map(q=>`• ${q.text}`)),
  `\nMedications / supplements (${meds.length})`,...(meds.map(m=>`• ${m.name}${m.dose?` — ${m.dose}`:""}`)),
  bps.length?`\nRecent BP: ${bps.map(b=>`${b.systolic}/${b.diastolic}`).join(", ")}`:"",
  gluc.length?`Recent glucose: ${gluc.map(g=>`${g.value}${g.unit?` ${g.unit}`:""} (${g.context})`).join(", ")}`:"",
  recentLogs.length?`Recent symptoms/check-ins: ${recentLogs.map(l=>`${l.date}: ${l.nausea||""} nausea, ${l.energy||""} energy${(l.warnings||[]).length?`, warning signs selected`:""}`).join(" | ")}`:""
].filter(Boolean).join("\n");}
function renderAppointmentPrep(){const c=document.getElementById("appointmentPrepPreview");if(!c)return;const lines=appointmentPrepText().split("\n").slice(0,12);c.innerHTML=`<pre class="appointment-prep-card">${escapeHTML(lines.join("\n"))}</pre>`;}
document.getElementById("copyAppointmentPrep")?.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(appointmentPrepText());showToast("Appointment prep copied 📋");}catch{showToast("Copy isn't available here. You can select the prep text manually.");}});

function renderAppointmentRecaps(){const select=document.getElementById("appointmentRecapSelect"),list=document.getElementById("appointmentRecapList");if(!select||!list)return;const appts=pregnancyRecord().appointments||[];select.innerHTML='<option value="">Choose appointment</option>'+appts.slice().sort((a,b)=>parseDate(b.date)-parseDate(a.date)).map(a=>`<option value="${a.id}">${escapeHTML(formatDate(parseDate(a.date)))} · ${escapeHTML(a.type)}</option>`).join("");const withRecap=appts.filter(a=>a.recap);list.innerHTML=withRecap.length?withRecap.slice().reverse().map(a=>listCard("✅",`${formatDate(parseDate(a.date))} · ${a.type}`,a.recap,null,null)).join(""):'<p class="muted small-text">No appointment recaps yet.</p>';}
document.getElementById("saveAppointmentRecap")?.addEventListener("click",()=>{const id=document.getElementById("appointmentRecapSelect").value,text=document.getElementById("appointmentRecapText").value.trim();const a=data.pregnancy.appointments.find(x=>x.id===id);if(!a||!text){showToast("Choose an appointment and write the recap first.");return;}a.recap=text;a.completed=true;document.getElementById("appointmentRecapText").value="";saveData();renderAppointmentRecaps();showToast("Appointment recap saved ✅");});

function renderPregReminders(){const c=document.getElementById("pregReminderList");if(!c)return;const list=[...(pregnancyRecord().reminders||[])].sort((a,b)=>new Date(a.date)-new Date(b.date));c.innerHTML=list.length?list.map(r=>`<article class="mini-record ${r.done?"done":""}"><span>🔔</span><div><strong>${escapeHTML(r.text)}</strong><small>${formatPregDateTime(r.date)}</small></div><button type="button" data-toggle-reminder="${r.id}">${r.done?"↺":"✓"}</button><button type="button" data-delete-reminder="${r.id}">×</button></article>`).join(""):'<p class="muted small-text">No reminders added.</p>';c.querySelectorAll("[data-toggle-reminder]").forEach(b=>b.onclick=()=>{const r=data.pregnancy.reminders.find(x=>x.id===b.dataset.toggleReminder);if(r){r.done=!r.done;saveData();renderPregReminders();}});c.querySelectorAll("[data-delete-reminder]").forEach(b=>b.onclick=()=>{data.pregnancy.reminders=data.pregnancy.reminders.filter(x=>x.id!==b.dataset.deleteReminder);saveData();renderPregReminders();});}
document.getElementById("addPregReminder")?.addEventListener("click",()=>{const text=document.getElementById("pregReminderText").value.trim(),date=document.getElementById("pregReminderDate").value;if(!text||!date){showToast("Add the reminder and date/time first.");return;}const list=safePregnancyArray("reminders");list.push({id:uid(),text,date,done:false,notifiedAt:""});capPregnancyList(list,250);document.getElementById("pregReminderText").value="";saveData();renderPregReminders();});
document.getElementById("enablePregNotifications")?.addEventListener("click",async()=>{if(!("Notification" in window)){showToast("Browser notifications aren't available on this device.");return;}const result=await Notification.requestPermission();showToast(result==="granted"?"Notifications enabled. Tsuki can alert you when the app is active/opened.":"Notifications were not enabled.");});
let lastPregnancyReminderCheckAt = 0;
async function notifyDuePregnancyReminders(){
  const nowMs = Date.now();
  if (nowMs - lastPregnancyReminderCheckAt < 60000) return;
  lastPregnancyReminderCheckAt = nowMs;
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const now = new Date();
  let changed = false;
  for (const r of pregnancyRecord().reminders || []) {
    const d = new Date(r.date);
    if (!r.done && !r.notifiedAt && !Number.isNaN(d.getTime()) && d <= now) {
      try {
        const reg = await navigator.serviceWorker?.ready;
        await reg?.showNotification?.("Tsuki 🌙", { body: r.text, icon: "./icons/icon-192.png" });
        r.notifiedAt = new Date().toISOString();
        changed = true;
      }
      catch (_) {}
    }
  }
  if (changed) saveData();
}

function renderPrenatalTracker(){const c=document.getElementById("prenatalTrackerList");if(!c)return;const tests=pregnancyRecord().tests||[];c.innerHTML=tests.length?tests.slice().sort((a,b)=>parseDate(a.date||"1900-01-01")-parseDate(b.date||"1900-01-01")).map(t=>`<article class="mini-record"><span>🧪</span><div><strong>${escapeHTML(t.name)}</strong><small>${escapeHTML(t.status||"Completed")} · ${t.date?formatDateLong(parseDate(t.date)):"No date"}${t.result?` · ${escapeHTML(t.result)}`:""}</small></div></article>`).join(""):'<p class="muted small-text">No prenatal tests or scans tracked.</p>';}
document.getElementById("addPrenatalTracker")?.addEventListener("click",()=>{const preset=document.getElementById("pregPrenatalPreset").value,custom=document.getElementById("pregPrenatalCustomName").value.trim(),name=custom||preset;if(!name){showToast("Choose or enter a test / scan.");return;}data.pregnancy.tests.push({id:uid(),name,date:document.getElementById("pregPrenatalDate").value||todayKey(),result:document.getElementById("pregPrenatalNotes").value.trim(),status:document.getElementById("pregPrenatalStatus").value});document.getElementById("pregPrenatalCustomName").value="";document.getElementById("pregPrenatalNotes").value="";saveData();renderPrenatalTracker();});

function renderMedicationSchedule(){const c=document.getElementById("pregMedicationScheduleList");if(!c)return;const meds=pregnancyRecord().medications||[];c.innerHTML=meds.length?meds.map(m=>`<article class="mini-record"><span>💊</span><div><strong>${escapeHTML(m.name)}</strong><small>${escapeHTML(m.dose||"No schedule noted")}${m.lastTakenDate?` · last marked ${escapeHTML(m.lastTakenDate)}`:""}</small></div><button type="button" data-mark-med-taken="${m.id}">Taken today</button></article>`).join(""):'<p class="muted small-text">Add medications or supplements in Pregnancy Care.</p>';c.querySelectorAll("[data-mark-med-taken]").forEach(b=>b.onclick=()=>{const m=data.pregnancy.medications.find(x=>x.id===b.dataset.markMedTaken);if(m){m.lastTakenDate=todayKey();saveData();renderMedicationSchedule();showToast(`${m.name} marked taken today.`);}});}

function renderPostpartumPrep(){const c=document.getElementById("postpartumPrepList");if(!c)return;const list=pregnancyRecord().postpartumPrep||[];c.innerHTML=list.map(i=>`<label class="bag-item"><input type="checkbox" data-postpartum-prep="${i.id}" ${i.done?"checked":""}><span>${escapeHTML(i.name)}</span><button type="button" data-delete-postpartum-prep="${i.id}">×</button></label>`).join("");c.querySelectorAll("[data-postpartum-prep]").forEach(i=>i.onchange=()=>{const x=list.find(v=>v.id===i.dataset.postpartumPrep);if(x){x.done=i.checked;saveData();}});c.querySelectorAll("[data-delete-postpartum-prep]").forEach(b=>b.onclick=e=>{e.preventDefault();data.pregnancy.postpartumPrep=list.filter(x=>x.id!==b.dataset.deletePostpartumPrep);saveData();renderPostpartumPrep();});}
document.getElementById("addPostpartumPrep")?.addEventListener("click",()=>{const input=document.getElementById("postpartumPrepInput"),name=input.value.trim();if(!name)return;data.pregnancy.postpartumPrep.push({id:uid(),name,done:false});input.value="";saveData();renderPostpartumPrep();});

function renderEnhancedCareTimeline(){const c=document.getElementById("pregCareTimelineEnhanced");if(!c)return;const p=pregnancyRecord();const entries=[];(p.appointments||[]).forEach(a=>entries.push({date:a.date,icon:"🩺",title:a.type,meta:a.completed?"Completed / recap saved":"Appointment"}));(p.tests||[]).forEach(t=>entries.push({date:t.date,icon:"🧪",title:t.name,meta:t.status||"Test / scan"}));(p.vaccinations||[]).forEach(v=>entries.push({date:v.date,icon:"💉",title:v.name,meta:"Vaccination record"}));entries.sort((a,b)=>parseDate(a.date)-parseDate(b.date));c.innerHTML=entries.length?entries.map(e=>listCard(e.icon,e.title,`${e.date?formatDateLong(parseDate(e.date)):"No date"} · ${e.meta}`,null,null)).join(""):'<p class="muted small-text">Your care timeline will combine appointments, tests and vaccination records here.</p>';}

let documentObjectUrls=[];
function clearPregDocumentUrls(){documentObjectUrls.forEach(URL.revokeObjectURL);documentObjectUrls=[];}
async function renderPregDocuments(){const c=document.getElementById("pregDocumentList");if(!c)return;clearPregDocumentUrls();const docs=[...(pregnancyRecord().documents||[])].slice().reverse();if(!docs.length){c.innerHTML='<p class="muted small-text">No documents saved locally.</p>';return;}c.innerHTML="";for(const d of docs){const row=document.createElement("article");row.className="mini-record";let hasFile=false,url="";try{const blob=await appearanceAssetGet(d.assetKey);if(blob){url=URL.createObjectURL(blob);documentObjectUrls.push(url);hasFile=true;}}catch{}row.innerHTML=`<span>🗃️</span><div><strong>${escapeHTML(d.label||d.name||"Document")}</strong><small>${escapeHTML(d.name||"")} · ${d.date?formatDateLong(parseDate(d.date)):""}</small></div>${hasFile?`<a href="${url}" target="_blank" rel="noopener">Open</a>`:"<small>Missing</small>"}<button type="button" data-delete-doc="${d.id}">×</button>`;c.appendChild(row);}c.querySelectorAll("[data-delete-doc]").forEach(b=>b.onclick=async()=>{const d=data.pregnancy.documents.find(x=>x.id===b.dataset.deleteDoc);if(d)await appearanceAssetDelete(d.assetKey).catch(()=>{});data.pregnancy.documents=data.pregnancy.documents.filter(x=>x.id!==b.dataset.deleteDoc);saveData();renderPregDocuments();});}
document.getElementById("choosePregDocument")?.addEventListener("click",()=>document.getElementById("pregDocumentInput")?.click());
document.getElementById("pregDocumentInput")?.addEventListener("change",e=>{pendingPregnancyDocumentFile=e.target.files?.[0]||null;const pending=document.getElementById("pregDocumentPending"),save=document.getElementById("savePregDocument");if(pending)pending.textContent=pendingPregnancyDocumentFile?`Selected: ${pendingPregnancyDocumentFile.name}`:"";if(save)save.disabled=!pendingPregnancyDocumentFile;});
document.getElementById("savePregDocument")?.addEventListener("click",async()=>{if(!pendingPregnancyDocumentFile)return;const id=uid(),assetKey=`pregnancy-document:${id}`;try{await appearanceAssetPut(assetKey,pendingPregnancyDocumentFile);data.pregnancy.documents.push({id,assetKey,name:pendingPregnancyDocumentFile.name,label:document.getElementById("pregDocumentLabel").value.trim(),date:todayKey(),type:pendingPregnancyDocumentFile.type||"file"});saveData();pendingPregnancyDocumentFile=null;document.getElementById("pregDocumentInput").value="";document.getElementById("pregDocumentLabel").value="";document.getElementById("pregDocumentPending").textContent="";document.getElementById("savePregDocument").disabled=true;await renderPregDocuments();showToast("Document saved locally 🗃️");}catch{showToast("Tsuki couldn't save that document on this device.");}});

function pregnancySummaryHTML(){const p=pregnancyRecord(),ga=gestationalAgeForDate(todayKey()),hp=p.healthProfile||{};const esc=escapeHTML;const rows=(p.appointments||[]).slice().sort((a,b)=>parseDate(a.date)-parseDate(b.date)).map(a=>`<li>${esc(a.date)} — ${esc(a.type)}${a.recap?` — recap: ${esc(a.recap)}`:""}</li>`).join("");const meds=(p.medications||[]).map(m=>`<li>${esc(m.name)}${m.dose?` — ${esc(m.dose)}`:""}</li>`).join("");const tests=(p.tests||[]).map(t=>`<li>${esc(t.name)} — ${esc(t.status||"")} ${esc(t.date||"")} ${t.result?`— ${esc(t.result)}`:""}</li>`).join("");const bp=(p.bpReadings||[]).slice(-10).map(b=>`<li>${esc(b.date)} — ${b.systolic}/${b.diastolic}</li>`).join("");const glu=(p.glucoseReadings||[]).slice(-10).map(g=>`<li>${esc(g.date)} — ${esc(g.value)} (${esc(g.context)})</li>`).join("");return `<!doctype html><meta charset="utf-8"><title>Tsuki Pregnancy Summary</title><style>body{font:16px system-ui;max-width:820px;margin:40px auto;padding:0 20px;color:#453640}h1,h2{font-family:Georgia,serif}section{margin:24px 0;padding:18px;border:1px solid #ead7df;border-radius:18px}</style><h1>Tsuki Pregnancy Summary</h1><p>Generated ${new Date().toLocaleString()}</p><section><h2>Pregnancy</h2><p>${ga?`${ga.weeks} weeks + ${ga.days} days`:""}<br>EDD: ${esc(p.edd||"")}<br>Dating: ${esc(pregnancyDatingDescription())}</p></section><section><h2>Health profile</h2><p>Blood type: ${esc(hp.bloodType||"Not entered")} ${esc(hp.rh||"")}<br>Allergies: ${esc(hp.allergies||"Not entered")}<br>Conditions/history: ${esc(hp.conditions||"Not entered")}<br>Provider instructions: ${esc(hp.providerInstructions||"Not entered")}</p></section><section><h2>Medications / supplements</h2><ul>${meds||"<li>None added</li>"}</ul></section><section><h2>Appointments</h2><ul>${rows||"<li>None added</li>"}</ul></section><section><h2>Tests / scans</h2><ul>${tests||"<li>None added</li>"}</ul></section>${bp?`<section><h2>Recent BP</h2><ul>${bp}</ul></section>`:""}${glu?`<section><h2>Recent glucose</h2><ul>${glu}</ul></section>`:""}<p><strong>Personal tracking summary only.</strong> This does not replace a medical record or clinical assessment. Private journal text and photos are excluded by default.</p>`;}
document.getElementById("exportPregnancySummary")?.addEventListener("click",()=>{const blob=new Blob([pregnancySummaryHTML()],{type:"text/html"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`tsuki-pregnancy-summary-${todayKey()}.html`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);showToast("Pregnancy summary exported 📄");});

function renderPregnancyFun(){const p=pregnancyRecord();document.querySelectorAll("[data-size-theme]").forEach(b=>b.classList.toggle("active",b.dataset.sizeTheme===p.babySizeTheme));document.querySelectorAll("[data-preg-outfit]").forEach(b=>b.classList.toggle("active",b.dataset.pregOutfit===p.companionOutfit));const ga=gestationalAgeForDate(todayKey());const preview=document.getElementById("babySizeThemePreview");if(preview&&ga)preview.textContent=pregnancyCuteComparison(ga.weeks);renderPregnancyFunCollections();}

document.querySelectorAll("[data-size-theme]").forEach(b=>b.addEventListener("click",()=>{data.pregnancy.babySizeTheme=b.dataset.sizeTheme;saveData();renderPregnancyFun();renderPregnancyToday();}));
document.querySelectorAll("[data-preg-outfit]").forEach(b=>b.addEventListener("click",()=>{data.pregnancy.companionOutfit=b.dataset.pregOutfit;saveData();renderPregnancyFun();renderPregnancyJourney();}));

function renderPregnancyFunCollections(){const fun=pregnancyRecord().fun||{};document.querySelectorAll("[data-fun-list]").forEach(c=>{const key=c.dataset.funList;const items=Array.isArray(fun[key])?fun[key]:[];c.innerHTML=items.length?items.slice().reverse().slice(0,50).map(i=>`<article class="fun-entry"><span>${escapeHTML(i.text)}</span><small>${i.date?formatDate(parseDate(i.date)):""}</small><button type="button" data-delete-fun="${i.id}" data-delete-fun-key="${key}">×</button></article>`).join(""):'<p class="muted small-text">Nothing here yet.</p>';});document.querySelectorAll("[data-delete-fun]").forEach(b=>b.onclick=()=>{const key=b.dataset.deleteFunKey;data.pregnancy.fun[key]=(data.pregnancy.fun[key]||[]).filter(x=>x.id!==b.dataset.deleteFun);saveData();renderPregnancyFunCollections();});}
document.querySelectorAll("[data-add-fun]").forEach(b=>b.addEventListener("click",()=>{const key=b.dataset.addFun,input=document.querySelector(`[data-fun-input="${key}"]`),text=input?.value.trim();if(!text)return;if(!Array.isArray(data.pregnancy.fun[key]))data.pregnancy.fun[key]=[];data.pregnancy.fun[key].push({id:uid(),text,date:todayKey()});capPregnancyList(data.pregnancy.fun[key],300);input.value="";saveData();renderPregnancyFunCollections();}));

function pregnancyStoryEntries(){const p=pregnancyRecord(),entries=[];(p.appointments||[]).forEach(a=>entries.push({date:a.date,icon:"🩺",title:a.type,text:a.recap||a.notes||"Appointment"}));(p.journal||[]).forEach(j=>entries.push({date:j.date,icon:"📖",title:j.type,text:j.text}));(p.photos||[]).forEach(ph=>entries.push({date:ph.date,icon:"📷",title:"Belly photo",text:ph.caption||"Photo memory"}));(p.fun?.memoryJar||[]).forEach(m=>entries.push({date:m.date,icon:"🫙",title:"Memory jar",text:m.text}));(p.fun?.weirdMoments||[]).forEach(m=>entries.push({date:m.date,icon:"😂",title:"Pregnancy moment",text:m.text}));return entries.filter(e=>e.date).sort((a,b)=>parseDate(a.date)-parseDate(b.date)).slice(-250);}
function pregnancyMilestoneCardData(){const p=pregnancyRecord(),ga=gestationalAgeForDate(todayKey()),days=pregnancyDaysUntilEDD();const cards=[{icon:"🌱",title:"Pregnancy began",done:Boolean(p.startedAt),text:p.startedAt?formatDateLong(parseDate(p.startedAt)):""},{icon:"🌸",title:"Second trimester",done:(ga?.weeks||0)>=14,text:"14 weeks"},{icon:"🌕",title:"Halfway-ish",done:(ga?.weeks||0)>=20,text:"20 weeks"},{icon:"🪻",title:"Third trimester",done:(ga?.weeks||0)>=28,text:"28 weeks"},{icon:"💯",title:"100 days to go",done:days!==null&&days<=100,text:days!==null&&days<=100?`${Math.max(0,days)} days to EDD`:"Waiting"},{icon:"👜",title:"Hospital bag started",done:(p.hospitalBag||[]).some(i=>i.packed),text:"Your own pace"},{icon:"🌙",title:"Due-date week",done:(ga?.weeks||0)>=40,text:"EDD is an estimate"}];return cards;}
function renderPregnancyStory(){const hero=document.getElementById("pregnancyStoryHero"),cards=document.getElementById("pregnancyMilestoneCards"),moons=document.getElementById("pregnancyMoonMilestones"),timeline=document.getElementById("pregnancyStoryTimeline");if(!hero||!cards||!moons||!timeline)return;const p=pregnancyRecord(),ga=gestationalAgeForDate(todayKey()),entries=pregnancyStoryEntries(),days=ga?.totalDays||0;hero.innerHTML=`<span>🌕</span><div><p class="eyebrow">OUR LITTLE MOON</p><h2>${ga?`${ga.weeks} weeks + ${ga.days} days`:"Pregnancy Story"}</h2><p>${entries.length} memor${entries.length===1?"y":"ies"} gathered so far · ${p.babyNickname?escapeHTML(p.babyNickname):"your pregnancy"}</p></div>`;cards.innerHTML=pregnancyMilestoneCardData().map(c=>`<article class="pregnancy-story-card ${c.done?"done":""}"><span>${c.icon}</span><strong>${escapeHTML(c.title)}</strong><small>${escapeHTML(c.text)}</small><b>${c.done?"✓":"○"}</b></article>`).join("");const moonCount=Math.max(1,Math.ceil(days/29.53));moons.innerHTML=Array.from({length:moonCount},(_,i)=>`<span title="Pregnancy moon ${i+1}">🌕<small>${i+1}</small></span>`).join("");timeline.innerHTML=entries.length?entries.map(e=>`<article class="pregnancy-story-entry"><span>${e.icon}</span><div><small>${formatDateLong(parseDate(e.date))}</small><strong>${escapeHTML(e.title)}</strong><p>${escapeHTML(e.text)}</p></div></article>`).join(""):'<article class="soft-note">Your story grows from journal entries, photos, appointments and little memories.</article>';renderPregnancyBumpCompare();}
async function renderPregnancyBumpCompare(){const c=document.getElementById("pregnancyBumpCompare");if(!c)return;pregnancyStoryObjectUrls.forEach(URL.revokeObjectURL);pregnancyStoryObjectUrls=[];clearInterval(pregnancyTimelapseTimer);pregnancyTimelapseTimer=null;const photos=[...(pregnancyRecord().photos||[])].sort((a,b)=>parseDate(a.date)-parseDate(b.date));if(!photos.length){c.innerHTML='<article class="soft-note">Add belly photos to compare your timeline here.</article>';return;}const chosen=photos.length<=3?photos:[photos[0],photos[Math.floor((photos.length-1)/2)],photos[photos.length-1]];const cards=[];for(const ph of chosen){let url="";try{const blob=await appearanceAssetGet(ph.assetKey);if(blob){url=URL.createObjectURL(blob);pregnancyStoryObjectUrls.push(url);}}catch{}const ga=gestationalAgeForDate(ph.date);cards.push(`<figure>${url?`<img src="${url}" alt="Belly photo">`:'<div class="pregnancy-photo-missing">Photo unavailable</div>'}<figcaption>${ga?`Week ${ga.weeks}`:formatDate(parseDate(ph.date))}</figcaption></figure>`);}c.innerHTML=`<div class="bump-compare-grid">${cards.join("")}</div>${photos.length>=2?'<button type="button" id="playBumpTimeline" class="secondary-button full-width">🎞️ Play bump timeline</button><div id="bumpTimelineStage" class="bump-timeline-stage hidden"></div>':""}`;document.getElementById("playBumpTimeline")?.addEventListener("click",async()=>{const stage=document.getElementById("bumpTimelineStage");if(!stage)return;const urls=[];for(const ph of photos.slice(-20)){try{const blob=await appearanceAssetGet(ph.assetKey);if(blob){const url=URL.createObjectURL(blob);pregnancyStoryObjectUrls.push(url);urls.push({url,date:ph.date});}}catch{}}if(!urls.length)return;stage.classList.remove("hidden");let i=0;const show=()=>{const item=urls[i%urls.length],ga=gestationalAgeForDate(item.date);stage.innerHTML=`<img src="${item.url}" alt="Pregnancy photo timeline"><span>${ga?`Week ${ga.weeks} + ${ga.days}`:formatDate(parseDate(item.date))}</span>`;i++;};show();pregnancyTimelapseTimer=setInterval(()=>{if(i>=urls.length){clearInterval(pregnancyTimelapseTimer);pregnancyTimelapseTimer=null;return;}show();},850);});}

function renderPregnancyPlannerDueDefaults(){const r=document.getElementById("pregReminderDate");if(r&&!r.value)r.value=localDateTimeValue(new Date(Date.now()+86400000));const d=document.getElementById("pregPrenatalDate");if(d&&!d.value)d.value=todayKey();}

function renderPregnancyPerformanceHomeExtras(){if(data.mode!=="pregnancy"||!data.pregnancy?.active)return;notifyDuePregnancyReminders();}



/* ============================================================
   RENDER EVERYTHING
   ============================================================ */

function activeScreenName() {
  return document.querySelector(".screen.active")?.dataset.screen || (data.mode === "pregnancy" ? "pregnancy-today" : data.mode === "postpartum" ? "postpartum-today" : "today");
}

function renderCycleScreenOnDemand(name) {
  const renderers = {
    calendar: renderCalendar,
    "cycle-history": renderCycleHistory,
    insights: renderInsights,
    relief: renderRelief,
    journal: renderJournal,
    kit: renderKit,
    "going-out": renderGoingOut,
    "past-moons": renderPastMoons,
    reports: renderReports,
    "care-profile": renderCareProfile,
    "moon-room": renderMoonRoom,
    "moon-garden": renderMoonGarden,
    "moon-year": renderMoonYear
  };
  try { renderers[name]?.(); } catch (error) { console.error(`Tsuki render failed: ${name}`, error); }
}

function renderPregnancyScreenOnDemand(name) {
  const renderers = {
    "pregnancy-calendar": renderPregnancyCalendar,
    "pregnancy-log": loadPregnancyLogForm,
    "pregnancy-journey": renderPregnancyJourney,
    "pregnancy-care": renderPregnancyCare,
    "pregnancy-journal": renderPregnancyJournal,
    "pregnancy-photos": renderPregnancyPhotos,
    "pregnancy-hospital": renderPregnancyHospitalBag,
    "pregnancy-preferences": renderBirthPreferences,
    "pregnancy-garden": renderPregnancyGarden,
    "pregnancy-dashboard": renderPregnancyDashboard,
    "pregnancy-health": renderPregnancyHealth,
    "pregnancy-planner": () => { renderPregnancyPlannerDueDefaults(); renderPregnancyPlanner(); },
    "pregnancy-fun": renderPregnancyFun,
    "pregnancy-story": renderPregnancyStory
  };
  try { renderers[name]?.(); } catch (error) { console.error(`Tsuki pregnancy render failed: ${name}`, error); }
}

function renderEverything() {
  const active = activeScreenName();
  try { updatePeriodRangeSummary(); } catch {}
  try { renderAppearanceUI(); } catch {}
  try { renderBackupStatus(); } catch {}
  try { renderAppLockSettings(); } catch {}
  try { renderLifeModeUI(); } catch {}

  if (data.mode === "pregnancy" && data.pregnancy?.active) {
    try { renderPregnancyToday(); } catch (error) { console.error("Pregnancy home render failed", error); }
    if (active !== "pregnancy-today") renderPregnancyScreenOnDemand(active);
    renderPregnancyPerformanceHomeExtras();
    return;
  }

  if (data.mode === "postpartum") {
    try { renderPostpartumToday(); } catch (error) { console.error("Postpartum render failed", error); }
    return;
  }

  try { renderGreeting(); renderToday(); renderCompanionHome(); renderTodayLayout(); } catch (error) { console.error("Cycle home render failed", error); }
  if (active !== "today") renderCycleScreenOnDemand(active);
}




/* ============================================================
   BUILD 5.1 — TSUKI COMPANION + MOON ROOM + MOON GARDEN
   ============================================================ */

const GARDEN_FLOWERS = ["🌷", "🌸", "🪻", "🌼", "🌺", "🌹"];
let selectedGardenCycleId = null;
let companionPetTimer = null;

function companionPhaseState() {
  const phase = phaseForDate(todayKey());
  if (phase === "Period") return "period";
  if (phase === "Follicular phase") return "follicular";
  if (phase === "Estimated ovulation") return "midcycle";
  if (phase === "Luteal phase") return "luteal";
  return "neutral";
}

function companionPrimaryMessage() {
  const phase = phaseForDate(todayKey());
  const today = data.logs[todayKey()] || {};
  const estimate = estimatedWindow();
  const completed = completedCycles().length;

  if (today.tinyJoy) {
    return `You saved a tiny joy today: “${today.tinyJoy}” 🌸`;
  }

  if (phase === "Period") {
    return "Period days can be soft days. I brought a blanket 🌙";
  }

  if (estimate) {
    const diff = daysBetween(new Date(), typeof estimate.start === "string" ? parseDate(estimate.start) : estimate.start);
    if (diff > 0 && diff <= 7) {
      return `Your next moon is in ${diff} day${diff === 1 ? "" : "s"}. I’m keeping watch ✨`;
    }
  }

  if (data.journal.length) {
    return "I kept one of your little thoughts safe in the room 📖";
  }

  if (completed) {
    return `${completed} moon bloom${completed === 1 ? " has" : "s have"} opened in your garden already 🌸`;
  }

  return "I’m here. A quiet day is still a day. 🌙";
}

function companionSecondaryNote() {
  const phase = phaseForDate(todayKey());
  if (phase === "Period") return "Warm light, tea, and extra softness.";
  if (phase === "Follicular phase") return "Fresh and light — a gentle new-cycle feeling.";
  if (phase === "Estimated ovulation") return "A brighter room with tiny sparkles today.";
  if (phase === "Luteal phase") return "A cozy evening room for slowing down.";
  return "Log a period to let Tsuki understand your rhythm more clearly.";
}

function companionDecorations() {
  const decorations = [];

  if (data.journal.length) {
    decorations.push({ icon: "📚", title: "Tiny bookshelf", note: `${data.journal.length} journal entr${data.journal.length === 1 ? "y" : "ies"} helped decorate the room.` });
  }

  if (data.relief.length) {
    decorations.push({ icon: "🫖", title: "Tea corner", note: `${data.relief.length} relief note${data.relief.length === 1 ? "" : "s"} became a comforting tea set.` });
  }

  if (data.trips.length) {
    decorations.push({ icon: "✈️", title: "Travel keepsake", note: `${data.trips.length} plan${data.trips.length === 1 ? "" : "s"} added a little travel keepsake.` });
  }

  if (data.careProfile.options?.length || data.careProfile.message) {
    decorations.push({ icon: "💗", title: "Comfort cushion", note: "Your care profile gave Tsuki a soft comfort corner." });
  }

  if (data.periodKit?.some(item => item.packed)) {
    const packed = data.periodKit.filter(item => item.packed).length;
    decorations.push({ icon: "👜", title: "Moon bag", note: `${packed} packed item${packed === 1 ? "" : "s"} inspired a tiny bag in the room.` });
  }

  if (!decorations.length) {
    decorations.push({ icon: "🌙", title: "Room waiting", note: "As you use Tsuki, little keepsakes will appear here automatically." });
  }

  return decorations;
}

function companionUnlocks() {
  const cycles = completedCycles().length;
  const journalCount = data.journal.length;
  const logsCount = allLogs().length;
  const unlocks = [];

  unlocks.push({ icon: cycles >= 1 ? "🌸" : "🌱", title: cycles >= 1 ? "First bloom unlocked" : "First bloom waiting", note: cycles >= 1 ? "Your first completed cycle became a flower." : "Log the start of your next period to bloom your first flower." });
  unlocks.push({ icon: journalCount >= 3 ? "🎀" : "🪡", title: journalCount >= 3 ? "Sakura ribbon" : "Sakura ribbon waiting", note: journalCount >= 3 ? "Three journal entries unlocked a soft ribbon for Tsuki." : "Write 3 journal notes to unlock Tsuki’s sakura ribbon." });
  unlocks.push({ icon: logsCount >= 10 ? "⭐" : "✨", title: logsCount >= 10 ? "Moon star charm" : "Moon star charm waiting", note: logsCount >= 10 ? "Ten check-ins brought a tiny star charm into the room." : "Complete 10 daily check-ins to unlock a moon star charm." });

  return unlocks;
}

function renderCompanionHome() {
  const title = document.getElementById("companionHomeTitle");
  const message = document.getElementById("companionHomeMessage");
  const garden = document.getElementById("companionHomeGarden");
  if (!title || !message || !garden) return;

  const phase = phaseForDate(todayKey());
  const completed = completedCycles().length;
  title.textContent = phase === "No cycle yet" ? "Tsuki is waiting" : `Tsuki is here for your ${phase.replace(" phase", "").toLowerCase()}`;
  message.textContent = companionPrimaryMessage();
  garden.textContent = `${completed} bloom${completed === 1 ? "" : "s"}`;
}

function renderMoonRoom() {
  const stage = document.getElementById("moonRoomStage");
  const speech = document.getElementById("moonRoomSpeech");
  const phaseBadge = document.getElementById("companionPhaseBadge");
  const gardenBadge = document.getElementById("companionGardenBadge");
  const decorBadge = document.getElementById("companionDecorBadge");
  const note = document.getElementById("moonRoomNote");
  const blanket = document.getElementById("companionBlanket");
  const decorList = document.getElementById("companionDecorList");
  const unlockList = document.getElementById("companionUnlockList");
  if (!stage || !speech || !phaseBadge || !gardenBadge || !decorBadge || !decorList || !unlockList) return;

  stage.classList.remove("phase-period", "phase-follicular", "phase-midcycle", "phase-luteal", "phase-neutral", "season-1", "season-2", "season-3", "season-4");
  const phaseState = companionPhaseState();
  stage.classList.add(`phase-${phaseState}`);
  if (data.settings.seasonalRoom !== false) stage.classList.add(`season-${Math.floor(new Date().getMonth()/3)+1}`);
  document.getElementById("companionRibbon")?.classList.toggle("hidden", data.journal.length < 3);
  document.getElementById("companionStarCharm")?.classList.toggle("hidden", allLogs().length < 10);

  const phase = phaseForDate(todayKey());
  const completed = completedCycles().length;
  const decorations = companionDecorations();
  const unlocks = companionUnlocks();

  speech.textContent = companionPrimaryMessage();
  phaseBadge.textContent = phase === "No cycle yet" ? "Still learning" : phase;
  gardenBadge.textContent = `${completed} bloom${completed === 1 ? "" : "s"}`;
  decorBadge.textContent = `${decorations.length} keepsake${decorations.length === 1 ? "" : "s"}`;
  note.textContent = companionSecondaryNote();
  blanket.classList.toggle("hidden", phase !== "Period");

  decorList.innerHTML = decorations.map(item => `
    <article class="companion-detail-card">
      <span class="companion-detail-icon">${item.icon}</span>
      <div>
        <strong>${escapeHTML(item.title)}</strong>
        <p>${escapeHTML(item.note)}</p>
      </div>
    </article>
  `).join("");

  unlockList.innerHTML = unlocks.map(item => `
    <article class="unlock-card">
      <span class="unlock-icon">${item.icon}</span>
      <div>
        <strong>${escapeHTML(item.title)}</strong>
        <p>${escapeHTML(item.note)}</p>
      </div>
    </article>
  `).join("");
}

function gardenFlowerForCycle(cycle, index) {
  return GARDEN_FLOWERS[index % GARDEN_FLOWERS.length];
}

function moonGardenDetailHTML(cycle, index) {
  const story = cycleStoryData(cycle);
  const flower = gardenFlowerForCycle(cycle, index);
  const context = cycle.context || "No special label";
  const tinyJoy = story.tinyJoys.length ? story.tinyJoys[story.tinyJoys.length - 1].tinyJoy : "No tiny joy was saved in this cycle.";
  const strongestMood = story.mood || "Not enough mood logs yet";
  const strongestSymptom = story.symptom || "No repeating symptom noted";

  return `
    <div class="moon-garden-detail-head">
      <span class="detail-flower">${flower}</span>
      <div>
        <p class="eyebrow">MOON MEMORY</p>
        <h3>${formatDate(cycle.start)} Moon</h3>
        <p class="muted">${formatDate(cycle.start)} – ${formatDate(cycle.end)}</p>
      </div>
    </div>
    <div class="moon-memory-stats">
      <span><strong>${cycle.cycleLength}</strong><small>Cycle days</small></span>
      <span><strong>${cycle.periodLength}</strong><small>Period days</small></span>
      <span><strong>${escapeHTML(context)}</strong><small>Context</small></span>
    </div>
    <div class="moon-memory-facts">
      <p>💗 <strong>Mood:</strong> ${escapeHTML(String(strongestMood))}</p>
      <p>🌸 <strong>Most repeated symptom:</strong> ${escapeHTML(String(strongestSymptom))}</p>
      <p>✨ <strong>Tiny Joy:</strong> ${escapeHTML(String(tinyJoy))}</p>
      ${cycle.nextMoonNote ? `<p>💌 <strong>Note to my next moon:</strong> ${escapeHTML(cycle.nextMoonNote)}</p>` : ""}
    </div>
  `;
}

function unplantedCycles(){const planted=new Set(data.gardenState?.plantedCycleIds||[]);return completedCycles().filter(c=>!planted.has(c.id));}
function renderMoonSeed(){const card=document.getElementById("moonSeedCard");if(!card)return;const seeds=unplantedCycles();card.classList.toggle("hidden",!seeds.length);if(seeds.length)card.querySelector("small").textContent=`${seeds.length} completed cycle${seeds.length===1?" is":"s are"} ready for a little garden celebration.`;}
document.getElementById("plantMoonSeed")?.addEventListener("click",()=>{const seed=unplantedCycles().slice(-1)[0];if(!seed)return;data.gardenState=data.gardenState||{plantedCycleIds:[]};data.gardenState.plantedCycleIds.push(seed.id);saveData();renderMoonGarden();showToast("Your Moon Seed bloomed 🌸");document.querySelector(`[data-garden-cycle-id="${CSS.escape(seed.id)}"]`)?.classList.add("just-bloomed");});
function renderMoonYear(){const select=document.getElementById("moonYearSelect"),grid=document.getElementById("moonYearGrid"),summary=document.getElementById("moonYearSummary");if(!select||!grid||!summary)return;const cycles=completedCycles();const years=[...new Set(cycles.map(c=>parseDate(c.start).getFullYear()))].sort((a,b)=>b-a);const current=Number(select.value)||years[0]||new Date().getFullYear();select.innerHTML=(years.length?years:[current]).map(y=>`<option value="${y}">${y}</option>`).join("");select.value=String(current);const list=cycles.filter(c=>parseDate(c.start).getFullYear()===current);summary.innerHTML=`<article class="moon-year-hero"><span>🌕</span><div><strong>${list.length} completed moon${list.length===1?"":"s"}</strong><small>${current} · every cycle is remembered without judging it as good or bad.</small></div></article>`;grid.innerHTML=list.length?list.map((c,i)=>`<button type="button" class="moon-year-item" data-year-cycle="${c.id}"><span>${GARDEN_FLOWERS[i%GARDEN_FLOWERS.length]}</span><strong>${formatDate(parseDate(c.start))}</strong><small>${c.cycleLength} days</small></button>`).join(""):'<article class="garden-empty-state"><span>🌱</span><h3>No completed moons yet</h3><p>Your year fills as cycles are completed.</p></article>';grid.querySelectorAll("[data-year-cycle]").forEach(btn=>btn.addEventListener("click",()=>{selectedGardenCycleId=btn.dataset.yearCycle;showScreen("moon-garden");renderMoonGarden();}));}
document.getElementById("moonYearSelect")?.addEventListener("change",renderMoonYear);

function renderMoonGarden() {
  const grid = document.getElementById("moonGardenGrid");
  const detail = document.getElementById("moonGardenDetail");
  const summary = document.getElementById("moonGardenSummary");
  if (!grid || !detail || !summary) return;

  const cycles = completedCycles().slice().reverse();
  renderMoonSeed();
  summary.textContent = cycles.length
    ? `Each completed cycle becomes one flower. You currently have ${cycles.length} bloom${cycles.length === 1 ? "" : "s"} in your Moon Garden.`
    : "Your garden begins after your first completed cycle. Log the start of your next period and your first flower will bloom here.";

  if (!cycles.length) {
    grid.innerHTML = `
      <article class="garden-empty-state">
        <span>🌱</span>
        <h3>Your first bloom is waiting</h3>
        <p>Moon Garden grows from completed cycles, not from streaks or perfect logging.</p>
      </article>
    `;
    detail.classList.add("hidden");
    detail.innerHTML = "";
    selectedGardenCycleId = null;
    return;
  }

  if (!selectedGardenCycleId || !cycles.some(cycle => cycle.id === selectedGardenCycleId)) {
    selectedGardenCycleId = cycles[0].id;
  }

  grid.innerHTML = cycles.map((cycle, index) => `
    <button type="button" class="garden-flower-card ${cycle.id === selectedGardenCycleId ? "active" : ""}" data-garden-cycle-id="${cycle.id}">
      <span class="garden-flower-emoji">${gardenFlowerForCycle(cycle, index)}</span>
      <strong>${formatDate(cycle.start)}</strong>
      <small>${cycle.cycleLength}-day cycle</small>
    </button>
  `).join("");

  grid.querySelectorAll("[data-garden-cycle-id]").forEach(button => {
    button.addEventListener("click", () => {
      selectedGardenCycleId = button.dataset.gardenCycleId;
      renderMoonGarden();
    });
  });

  const selectedCycle = cycles.find(cycle => cycle.id === selectedGardenCycleId) || cycles[0];
  const selectedIndex = cycles.findIndex(cycle => cycle.id === selectedCycle.id);
  detail.classList.remove("hidden");
  detail.innerHTML = moonGardenDetailHTML(selectedCycle, selectedIndex);
}

document.getElementById("petCompanionButton")?.addEventListener("click", () => {
  const bunny = document.getElementById("tsukiCompanionBunny");
  const speech = document.getElementById("moonRoomSpeech");
  if (!bunny) return;

  bunny.classList.remove("petting");
  void bunny.offsetWidth;
  bunny.classList.add("petting");

  clearTimeout(companionPetTimer);
  companionPetTimer = setTimeout(() => bunny.classList.remove("petting"), 1800);

  if (speech) {
    const notes = [
      "Hehe 🌸",
      "A tiny wiggle just for you ✨",
      "I’m still here 🌙",
      "Thanks for checking in 🩷"
    ];
    speech.textContent = notes[Math.floor(Math.random() * notes.length)];
  }

  showToast("Tsuki wiggled a little 🐇");
});




/* ============================================================
   BUILD 7.2 — STABILITY, TUTORIAL, WHAT'S NEW & DIAGNOSTICS
   ============================================================ */

let tutorialStepIndex = 0;
let launchOverlayHandled = false;
let runtimeErrorCount = 0;

const TUTORIAL_STEPS = [
  {
    icon: "🌙",
    eyebrow: "WELCOME TO TSUKI",
    title: "Your body has a rhythm",
    text: "Tsuki is a private, local-first space for following your cycle, body patterns, and—only if you choose it—your pregnancy journey.",
    tip: "Your entries stay on this device unless you export a backup yourself."
  },
  {
    icon: "🏠",
    eyebrow: "TODAY",
    title: "Start with what matters today",
    text: "Today keeps your current cycle or pregnancy information light and useful. Use the check-in when you want to log how you feel; you never have to fill everything in.",
    tip: "You can customize which Today cards appear from Me → Customize Today."
  },
  {
    icon: "📅",
    eyebrow: "LOG & CALENDAR",
    title: "Build your own timeline",
    text: "Use the pink + button for quick actions. Calendar lets you log periods, previous months, symptoms, appointments, and memories without digging through menus.",
    tip: "Actual period dates anchor future cycle predictions. Estimates never replace the dates you save."
  },
  {
    icon: "✨",
    eyebrow: "TSUKI LEARNS",
    title: "Patterns, not diagnoses",
    text: "Insights such as My Normal, Same Moon, and Before It Hits look for patterns in your own logs. Tsuki describes what tends to happen without diagnosing a condition.",
    tip: "Tap the lock in the header anytime you want to hide sensitive cycle or pregnancy details on screen."
  },
  {
    icon: "🤰",
    eyebrow: "LIFE MODES",
    title: "Pregnancy Mode is always your choice",
    text: "Switch between Cycle and Pregnancy Mode from Me. Tsuki never assumes pregnancy because a period is late, and your cycle history stays saved when modes change.",
    tip: "Pregnancy health modules are optional, so you can turn on only the trackers that apply to you."
  },
  {
    icon: "📦",
    eyebrow: "KEEP TSUKI SAFE",
    title: "Back up, update, and make it yours",
    text: "Export backups from Me, personalize your theme, use optional App Lock, and watch for the update banner when a newer Tsuki build is ready.",
    tip: "After every version update, What's New appears once. You can replay this tutorial anytime from the ☰ menu."
  }
];

function hasMeaningfulTsukiData() {
  return Boolean(
    data.periods?.length ||
    Object.keys(data.logs || {}).length ||
    data.journal?.length ||
    data.relief?.length ||
    data.trips?.length ||
    data.pregnancy?.active ||
    data.pregnancyHistory?.length ||
    data.postpartum?.active
  );
}

function setModalOpenState() {
  const anyModal = Array.from(document.querySelectorAll(".app-modal-backdrop"))
    .some(modal => !modal.classList.contains("hidden"));
  document.body.classList.toggle("modal-open", anyModal);
}

function renderTutorialStep() {
  const step = TUTORIAL_STEPS[tutorialStepIndex] || TUTORIAL_STEPS[0];
  const icon = document.getElementById("tutorialIcon");
  const eyebrow = document.getElementById("tutorialEyebrow");
  const title = document.getElementById("tutorialTitle");
  const text = document.getElementById("tutorialText");
  const tip = document.getElementById("tutorialTip");
  const label = document.getElementById("tutorialStepLabel");
  const dots = document.getElementById("tutorialDots");
  const back = document.getElementById("tutorialBackButton");
  const next = document.getElementById("tutorialNextButton");
  if (!icon || !eyebrow || !title || !text || !tip || !label || !dots || !back || !next) return;

  icon.textContent = step.icon;
  eyebrow.textContent = step.eyebrow;
  title.textContent = step.title;
  text.textContent = step.text;
  tip.textContent = step.tip;
  label.textContent = `${tutorialStepIndex + 1} of ${TUTORIAL_STEPS.length}`;
  dots.innerHTML = TUTORIAL_STEPS.map((_, index) => `<span class="tutorial-dot ${index === tutorialStepIndex ? "active" : ""}"></span>`).join("");
  back.disabled = tutorialStepIndex === 0;
  next.textContent = tutorialStepIndex === TUTORIAL_STEPS.length - 1 ? "Finish" : "Next";
}

function openTutorial({ fromWhatsNew = false } = {}) {
  if (fromWhatsNew) closeWhatsNew({ markSeen: true });
  tutorialStepIndex = 0;
  renderTutorialStep();
  document.getElementById("tutorialModal")?.classList.remove("hidden");
  setModalOpenState();
}

function finishTutorial() {
  try {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "1");
    if (!hasMeaningfulTsukiData()) localStorage.setItem(WHATS_NEW_STORAGE_KEY, APP_VERSION);
  } catch (_) {}
  document.getElementById("tutorialModal")?.classList.add("hidden");
  setModalOpenState();
}

function renderWhatsNew() {
  const title = document.getElementById("whatsNewTitle");
  const list = document.getElementById("whatsNewList");
  if (title) title.textContent = `Tsuki ${APP_VERSION.replace(/\.0$/, "")}`;
  if (list) {
    list.innerHTML = RELEASE_NOTES.map(note => `
      <article class="whats-new-item">
        <span aria-hidden="true">${note.icon}</span>
        <div><strong>${escapeHTML(note.title)}</strong><small>${escapeHTML(note.text)}</small></div>
      </article>
    `).join("");
  }
}

function openWhatsNew() {
  renderWhatsNew();
  document.getElementById("whatsNewModal")?.classList.remove("hidden");
  setModalOpenState();
}

function closeWhatsNew({ markSeen = true } = {}) {
  if (markSeen) {
    try { localStorage.setItem(WHATS_NEW_STORAGE_KEY, APP_VERSION); } catch (_) {}
  }
  document.getElementById("whatsNewModal")?.classList.add("hidden");
  setModalOpenState();
}

function runLaunchOverlays() {
  if (launchOverlayHandled) return;
  if (!document.getElementById("appLockOverlay")?.classList.contains("hidden")) return;
  launchOverlayHandled = true;

  let tutorialComplete = false;
  let seenVersion = "";
  try {
    tutorialComplete = localStorage.getItem(TUTORIAL_STORAGE_KEY) === "1";
    seenVersion = localStorage.getItem(WHATS_NEW_STORAGE_KEY) || "";
  } catch (_) {}

  if (!hasMeaningfulTsukiData() && !tutorialComplete) {
    openTutorial();
    return;
  }

  if (seenVersion !== APP_VERSION) openWhatsNew();
}

async function tryRecoverLastGoodSnapshot() {
  let needsRecovery = false;
  try { needsRecovery = localStorage.getItem("tsuki-recovery-needed") === "1"; } catch (_) {}
  if (!needsRecovery) return false;
  try {
    const raw = await appearanceAssetGet(RECOVERY_ASSET_KEY);
    if (typeof raw !== "string" || !raw.trim()) return false;
    const parsed = JSON.parse(raw);
    const recovered = normalizeData(parsed);
    data = recovered;
    const serialized = JSON.stringify(recovered);
    localStorage.setItem(STORAGE_KEY, serialized);
    lastSavedSnapshot = serialized;
    localStorage.removeItem("tsuki-recovery-needed");
    showToast("Tsuki restored the last healthy local snapshot 🌙");
    return true;
  }
  catch (error) {
    console.error("Tsuki recovery snapshot could not be restored:", error);
    return false;
  }
}

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (!value) return "0 KB";
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

async function renderDiagnostics() {
  const version = document.getElementById("diagAppVersion");
  const mode = document.getElementById("diagLifeMode");
  const local = document.getElementById("diagLocalData");
  const storage = document.getElementById("diagStorage");
  const cache = document.getElementById("diagCache");
  const runtime = document.getElementById("diagRuntime");
  const detail = document.getElementById("diagDetail");
  if (!version || !mode || !local || !storage || !cache || !runtime || !detail) return;

  version.textContent = APP_VERSION;
  mode.textContent = data.mode === "pregnancy" ? "Pregnancy" : data.mode === "postpartum" ? "Postpartum" : "Cycle";
  runtime.textContent = runtimeErrorCount ? `${runtimeErrorCount} issue${runtimeErrorCount === 1 ? "" : "s"} this session` : "Healthy";

  try {
    const raw = localStorage.getItem(STORAGE_KEY) || "";
    JSON.parse(raw || "{}");
    local.textContent = `${formatBytes(new Blob([raw]).size)} · Healthy`;
  }
  catch (_) {
    local.textContent = "Needs repair";
  }

  try {
    const estimate = await navigator.storage?.estimate?.();
    if (estimate?.quota) storage.textContent = `${formatBytes(estimate.usage)} / ${formatBytes(estimate.quota)}`;
    else storage.textContent = "Available";
  }
  catch (_) { storage.textContent = "Unavailable"; }

  try {
    const keys = "caches" in window ? await caches.keys() : [];
    const current = keys.includes(APP_CACHE_NAME);
    cache.textContent = current ? "Current" : keys.length ? "Refreshing" : "Not cached yet";
  }
  catch (_) { cache.textContent = "Unavailable"; }

  const photoCount = pregnancyRecord()?.photos?.length || 0;
  const docCount = pregnancyRecord()?.documents?.length || 0;
  const backup = data.meta?.lastBackupAt ? new Date(data.meta.lastBackupAt).toLocaleDateString() : "none yet";
  detail.textContent = `Local media index: ${photoCount} photo${photoCount === 1 ? "" : "s"}, ${docCount} document${docCount === 1 ? "" : "s"}. Last backup: ${backup}. No diagnostic data is uploaded.`;
}

function repairLocalData() {
  try {
    data = normalizeData(data);
    const saved = saveData();
    if (!saved) throw new Error("save failed");
    localStorage.removeItem("tsuki-recovery-needed");
    loadSettingsUI();
    applySettings();
    renderEverything();
    renderDiagnostics();
    showToast("Local Tsuki data normalized and repaired 🌙");
  }
  catch (error) {
    console.error("Tsuki repair failed:", error);
    showToast("Tsuki couldn't complete the repair. Export a backup before making more changes.");
  }
}

window.addEventListener("error", () => { runtimeErrorCount += 1; });
window.addEventListener("unhandledrejection", () => { runtimeErrorCount += 1; });
window.addEventListener("pageshow", () => {
  updateOnlineStatus();
  renderLifeModeUI();
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    updateOnlineStatus();
    renderLifeModeUI();
  }
});

document.getElementById("tutorialNextButton")?.addEventListener("click", () => {
  if (tutorialStepIndex >= TUTORIAL_STEPS.length - 1) { finishTutorial(); return; }
  tutorialStepIndex += 1;
  renderTutorialStep();
});
document.getElementById("tutorialBackButton")?.addEventListener("click", () => {
  tutorialStepIndex = Math.max(0, tutorialStepIndex - 1);
  renderTutorialStep();
});
document.getElementById("skipTutorialButton")?.addEventListener("click", finishTutorial);
document.getElementById("dismissWhatsNewButton")?.addEventListener("click", () => closeWhatsNew());
document.getElementById("closeWhatsNewButton")?.addEventListener("click", () => closeWhatsNew());
document.getElementById("whatsNewTutorialButton")?.addEventListener("click", () => openTutorial({ fromWhatsNew: true }));
document.getElementById("openTutorialButton")?.addEventListener("click", () => openTutorial());
document.getElementById("openWhatsNewButton")?.addEventListener("click", openWhatsNew);
document.getElementById("drawerTutorialButton")?.addEventListener("click", () => { closeAppDrawer(); openTutorial(); });
document.getElementById("drawerWhatsNewButton")?.addEventListener("click", () => { closeAppDrawer(); openWhatsNew(); });
document.getElementById("refreshDiagnostics")?.addEventListener("click", renderDiagnostics);
document.getElementById("repairLocalData")?.addEventListener("click", repairLocalData);
document.getElementById("diagnosticsCard")?.addEventListener("toggle", event => { if (event.currentTarget.open) renderDiagnostics(); });

document.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  if (!document.getElementById("tutorialModal")?.classList.contains("hidden")) finishTutorial();
  else if (!document.getElementById("whatsNewModal")?.classList.contains("hidden")) closeWhatsNew();
});

/* ============================================================
   BUILD 7.1.2 — COMPANION IMAGE ASSET GUARD
   ============================================================ */
function installCompanionImageGuard() {
  const image = document.querySelector("#tsukiCompanionBunny .companion-png");
  const wrapper = document.getElementById("tsukiCompanionBunny");
  if (!image || !wrapper) return;

  const markLoaded = () => wrapper.classList.remove("image-missing");
  const markMissing = () => wrapper.classList.add("image-missing");

  image.addEventListener("load", markLoaded);
  image.addEventListener("error", markMissing);

  if (image.complete) {
    if (image.naturalWidth > 0) markLoaded();
    else markMissing();
  }
}


/* ============================================================
   BUILD 7.3 — PERSONAL RHYTHMS + IRREGULAR CYCLE SUPPORT
   Uncertainty-aware forecasting without changing regular-cycle defaults.
   ============================================================ */

const TSUKI73_CYCLE_PATTERNS = new Set(["regular", "irregular", "unsure"]);
const TSUKI73_HISTORY_COMPLETENESS = new Set(["complete", "partial", "unsure"]);

function ensureCycleProfileSettings() {
  data.settings = data.settings || {};

  if (!TSUKI73_CYCLE_PATTERNS.has(data.settings.cyclePattern)) {
    const hasCycleHistory = Array.isArray(data.periods) && data.periods.length > 0;
    const hasDailyHistory = data.logs && Object.keys(data.logs).length > 0;
    data.settings.cyclePattern = (hasCycleHistory || hasDailyHistory) ? "regular" : "unsure";
  }

  if (!TSUKI73_HISTORY_COMPLETENESS.has(data.settings.cycleHistoryCompleteness)) {
    data.settings.cycleHistoryCompleteness = "complete";
  }

  if (!Array.isArray(data.settings.ignoredCycleIntervals)) {
    data.settings.ignoredCycleIntervals = [];
  }

  if (typeof data.settings.showIrregularPredictionWindow !== "boolean") {
    data.settings.showIrregularPredictionWindow = true;
  }

  if (typeof data.settings.showIrregularConfidence !== "boolean") {
    data.settings.showIrregularConfidence = true;
  }
}

function cyclePatternValue() {
  ensureCycleProfileSettings();
  return TSUKI73_CYCLE_PATTERNS.has(data.settings.cyclePattern)
    ? data.settings.cyclePattern
    : "unsure";
}

function usesUncertainCycleForecast() {
  return cyclePatternValue() !== "regular";
}

function cycleIntervalKey(previousPeriod, currentPeriod) {
  if (!previousPeriod || !currentPeriod) return "";
  return `${previousPeriod.id || previousPeriod.start}::${currentPeriod.id || currentPeriod.start}`;
}

function cycleIntervalRecords() {
  const periods = validPeriods();
  const ignored = new Set(data.settings.ignoredCycleIntervals || []);
  const records = [];

  for (let index = 1; index < periods.length; index += 1) {
    const previous = periods[index - 1];
    const current = periods[index];
    const previousStart = parseDate(previous.start);
    const currentStart = parseDate(current.start);
    if (!previousStart || !currentStart) continue;

    const days = daysBetween(previousStart, currentStart);
    if (!Number.isFinite(days) || days <= 0) continue;

    const key = cycleIntervalKey(previous, current);
    records.push({
      key,
      previousId: previous.id,
      currentId: current.id,
      previousStart: previous.start,
      currentStart: current.start,
      days,
      ignored: ignored.has(key),
      irregularLearningEligible: days >= 15 && days <= 365,
      regularLearningEligible: days >= 15 && days <= 60
    });
  }

  return records;
}

function irregularLearningIntervals() {
  return cycleIntervalRecords()
    .filter(record => record.irregularLearningEligible && !record.ignored)
    .slice(-8);
}

function medianNumber(values) {
  const clean = values.filter(Number.isFinite).slice().sort((a, b) => a - b);
  if (!clean.length) return null;
  const middle = Math.floor(clean.length / 2);
  return clean.length % 2
    ? clean[middle]
    : (clean[middle - 1] + clean[middle]) / 2;
}

function irregularForecastWindow() {
  ensureCycleProfileSettings();
  const latest = latestPeriod();
  if (!latest) return null;

  const records = irregularLearningIntervals();
  const values = records.map(record => record.days);
  if (values.length < 2) {
    return {
      useful: false,
      reason: "needs-history",
      sampleCount: values.length,
      values
    };
  }

  const low = Math.min(...values);
  const high = Math.max(...values);
  const median = medianNumber(values);
  const spread = high - low;
  const ratio = low > 0 ? high / low : Infinity;
  const useful = spread <= 60 && ratio <= 2.25;
  const cushion = values.length >= 4 ? 2 : 4;
  const periodFloor = Math.max(2, configuredPeriodLength() + 1);
  const startOffset = Math.max(periodFloor, low - cushion);
  const endOffset = Math.min(365, high + cushion);
  const anchor = parseDate(latest.start);

  if (!anchor) return null;

  return {
    useful,
    reason: useful ? "observed-range" : "too-variable",
    sampleCount: values.length,
    values,
    low,
    high,
    median,
    spread,
    startOffset,
    endOffset,
    start: addDays(anchor, startOffset),
    end: addDays(anchor, endOffset),
    center: addDays(anchor, Math.round(median)),
    anchor
  };
}

function irregularPredictionConfidence() {
  const forecast = irregularForecastWindow();
  const completeness = data.settings.cycleHistoryCompleteness || "complete";

  if (!forecast || forecast.sampleCount < 2) {
    return { level: "Low", className: "confidence-low", reason: "Needs more usable cycle history" };
  }

  if (!forecast.useful) {
    return { level: "Low", className: "confidence-low", reason: "Recent timing varies too much for a useful window" };
  }

  let level = "Low";
  let className = "confidence-low";
  let reason = "A wider range is still emerging";

  if (forecast.sampleCount >= 6 && forecast.spread <= 18) {
    level = "High";
    className = "confidence-high";
    reason = "Several recent intervals cluster within a similar range";
  }
  else if (forecast.sampleCount >= 4 && forecast.spread <= 35) {
    level = "Medium";
    className = "confidence-medium";
    reason = "A usable recent range is emerging";
  }

  if (completeness !== "complete" && level === "High") {
    level = "Medium";
    className = "confidence-medium";
    reason = "Some cycle history may be incomplete";
  }
  else if (completeness !== "complete" && level === "Medium") {
    level = "Low";
    className = "confidence-low";
    reason = "Some cycle history may be incomplete";
  }

  return { level, className, reason };
}

const tsuki72CycleIntervals = cycleIntervals;
const tsuki72TypicalCycleLength = typicalCycleLength;
const tsuki72RecentAverageCycleLength = recentAverageCycleLength;
const tsuki72ForecastCycleLength = forecastCycleLength;
const tsuki72PredictionConfidence = predictionConfidence;
const tsuki72PredictionPaddingDays = predictionPaddingDays;
const tsuki72NextEstimatedPeriodDate = nextEstimatedPeriodDate;
const tsuki72EstimatedWindow = estimatedWindow;
const tsuki72CalendarPredictionWindows = calendarPredictionWindows;
const tsuki72PeriodCountdownText = periodCountdownText;
const tsuki72IsLatePeriod = isLatePeriod;
const tsuki72CyclePhase = cyclePhase;
const tsuki72PhaseForDate = phaseForDate;
const tsuki72ProjectedCycleStartForDate = projectedCycleStartForDate;
const tsuki72ProjectedPhaseForDate = projectedPhaseForDate;
const tsuki72CompletedCycles = completedCycles;
const tsuki72CycleContextForDate = cycleContextForDate;
const tsuki72TimingBucket = timingBucket;
const tsuki72BuildInsights = buildInsights;
const tsuki72PhaseLogCopy = phaseLogCopy;

cycleIntervals = function cycleIntervals73() {
  if (!usesUncertainCycleForecast()) return tsuki72CycleIntervals();
  return irregularLearningIntervals().map(record => record.days);
};

typicalCycleLength = function typicalCycleLength73() {
  if (!usesUncertainCycleForecast()) return tsuki72TypicalCycleLength();
  const configured = Number(data.settings.cycleLength);
  return Number.isFinite(configured) && configured >= 15 && configured <= 365
    ? Math.round(configured)
    : 28;
};

recentAverageCycleLength = function recentAverageCycleLength73() {
  if (!usesUncertainCycleForecast()) return tsuki72RecentAverageCycleLength();
  const values = irregularLearningIntervals().slice(-3).map(record => record.days);
  return values.length ? Math.round(average(values)) : typicalCycleLength();
};

forecastCycleLength = function forecastCycleLength73() {
  if (!usesUncertainCycleForecast()) return tsuki72ForecastCycleLength();
  const values = irregularLearningIntervals().map(record => record.days);
  const middle = medianNumber(values);
  return Number.isFinite(middle) ? Math.round(middle) : typicalCycleLength();
};

predictionConfidence = function predictionConfidence73() {
  return usesUncertainCycleForecast()
    ? irregularPredictionConfidence()
    : tsuki72PredictionConfidence();
};

predictionPaddingDays = function predictionPaddingDays73() {
  if (!usesUncertainCycleForecast()) return tsuki72PredictionPaddingDays();
  const forecast = irregularForecastWindow();
  if (!forecast?.useful) return 0;
  return Math.max(0, Math.round((forecast.endOffset - forecast.startOffset) / 2));
};

nextEstimatedPeriodDate = function nextEstimatedPeriodDate73() {
  if (!usesUncertainCycleForecast()) return tsuki72NextEstimatedPeriodDate();
  const forecast = irregularForecastWindow();
  return forecast?.useful && data.settings.showIrregularPredictionWindow !== false
    ? forecast.center
    : null;
};

estimatedWindow = function estimatedWindow73() {
  if (!usesUncertainCycleForecast()) return tsuki72EstimatedWindow();
  if (data.settings.showIrregularPredictionWindow === false) return null;
  const forecast = irregularForecastWindow();
  if (!forecast?.useful) return null;
  return {
    center: forecast.center,
    start: forecast.start,
    end: forecast.end,
    padding: null,
    irregular: true,
    sampleCount: forecast.sampleCount,
    observedLow: forecast.low,
    observedHigh: forecast.high
  };
};

calendarPredictionWindows = function calendarPredictionWindows73(monthsAhead = 12) {
  if (!usesUncertainCycleForecast()) return tsuki72CalendarPredictionWindows(monthsAhead);
  const window = estimatedWindow();
  return window ? [window] : [];
};

periodCountdownText = function periodCountdownText73() {
  if (!usesUncertainCycleForecast()) return tsuki72PeriodCountdownText();
  if (!latestPeriod()) return "Tsuki is still learning your timing";
  if (data.settings.showIrregularPredictionWindow === false) return "Period prediction hidden by you";

  const forecast = irregularForecastWindow();
  if (!forecast || forecast.sampleCount < 2) return "Tsuki needs more cycle history";
  if (!forecast.useful) return "Timing is uncertain this cycle";

  const today = parseDate(todayKey());
  if (today < forecast.start) return `Possible window begins ${formatDate(forecast.start)}`;
  if (today <= forecast.end) return "You're within your estimated window";
  return "This cycle is longer than your recent range";
};

isLatePeriod = function isLatePeriod73() {
  if (!usesUncertainCycleForecast()) return tsuki72IsLatePeriod();
  const forecast = irregularForecastWindow();
  if (!forecast?.useful || data.settings.showIrregularPredictionWindow === false) return false;
  return parseDate(todayKey()) > forecast.end;
};

cyclePhase = function cyclePhase73(day) {
  if (!usesUncertainCycleForecast()) return tsuki72CyclePhase(day);
  if (!day) return "Log your period to begin";
  if (day <= averagePeriodLength()) return "Period";
  return "Cycle timing uncertain";
};

phaseForDate = function phaseForDate73(dateValue) {
  if (!usesUncertainCycleForecast()) return tsuki72PhaseForDate(dateValue);
  const key = typeof dateValue === "string" ? dateValue : dateKey(dateValue);
  if (periodForDate(key)) return "Period";

  const target = parseDate(key);
  if (!target) return "No cycle yet";
  const periods = validPeriods();
  const hasAnchor = periods.some(period => parseDate(period.start) <= target);
  if (!hasAnchor) return "No cycle yet";

  const nextActual = periods.find(period => parseDate(period.start) > target);
  if (nextActual) return tsuki72PhaseForDate(key);
  return "Cycle timing uncertain";
};

projectedCycleStartForDate = function projectedCycleStartForDate73(dateValue) {
  if (!usesUncertainCycleForecast()) return tsuki72ProjectedCycleStartForDate(dateValue);
  const target = typeof dateValue === "string" ? parseDate(dateValue) : dateValue;
  const anchor = latestPeriod() ? parseDate(latestPeriod().start) : null;
  if (!target || !anchor || target < anchor) return null;
  return anchor;
};

projectedPhaseForDate = function projectedPhaseForDate73(dateValue) {
  if (!usesUncertainCycleForecast()) return tsuki72ProjectedPhaseForDate(dateValue);
  const key = typeof dateValue === "string" ? dateValue : dateKey(dateValue);
  if (periodForDate(key)) return "Period";
  return latestPeriod() ? "Cycle timing uncertain" : "No cycle yet";
};

completedCycles = function completedCycles73() {
  if (!usesUncertainCycleForecast()) return tsuki72CompletedCycles();
  const periods = validPeriods();
  const ignored = new Set(data.settings.ignoredCycleIntervals || []);
  const cycles = [];

  for (let index = 0; index < periods.length - 1; index += 1) {
    const period = periods[index];
    const next = periods[index + 1];
    const start = parseDate(period.start);
    const nextStart = parseDate(next.start);
    if (!start || !nextStart) continue;
    const cycleLength = daysBetween(start, nextStart);
    const key = cycleIntervalKey(period, next);
    if (cycleLength < 15 || cycleLength > 365 || ignored.has(key)) continue;

    cycles.push({
      id: period.id,
      start: period.start,
      end: dateKey(addDays(nextStart, -1)),
      nextStart: next.start,
      cycleLength,
      periodLength: periodDuration(period) || averagePeriodLength(),
      context: period.context || "",
      nextMoonNote: period.nextMoonNote || "",
      intervalKey: key
    });
  }

  return cycles;
};

cycleContextForDate = function cycleContextForDate73(dateValue) {
  if (!usesUncertainCycleForecast()) return tsuki72CycleContextForDate(dateValue);
  const date = parseDate(dateValue);
  if (!date) return null;

  const cycle = completedCycles().find(item => {
    const start = parseDate(item.start);
    const nextStart = parseDate(item.nextStart);
    return start && nextStart && date >= start && date < nextStart;
  });
  if (!cycle) return null;

  const start = parseDate(cycle.start);
  const nextStart = parseDate(cycle.nextStart);
  const cycleDay = daysBetween(start, date) + 1;
  const daysBeforeNextPeriod = daysBetween(date, nextStart);
  let phase = "Between periods";

  if (cycleDay <= cycle.periodLength) phase = "Period";
  else if (daysBeforeNextPeriod >= 1 && daysBeforeNextPeriod <= 7) phase = "Pre-period";
  else if (cycleDay <= cycle.periodLength + 3) phase = "After period";

  return {
    cycleId: cycle.id,
    cycleStart: cycle.start,
    cycleEnd: cycle.end,
    cycleDay,
    cycleLength: cycle.cycleLength,
    periodLength: cycle.periodLength,
    daysBeforeNextPeriod,
    phase
  };
};

timingBucket = function timingBucket73(context) {
  if (!usesUncertainCycleForecast()) return tsuki72TimingBucket(context);
  if (!context) return null;

  if (context.cycleDay <= 2) {
    return { id: "period-days-1-2", label: "on Days 1–2 of your period" };
  }
  if (context.cycleDay <= context.periodLength) {
    return { id: "period", label: "during your recorded period" };
  }
  if (context.daysBeforeNextPeriod >= 1 && context.daysBeforeNextPeriod <= 3) {
    return { id: "pre-period-1-3", label: "1–3 days before your next recorded period" };
  }
  if (context.daysBeforeNextPeriod >= 4 && context.daysBeforeNextPeriod <= 7) {
    return { id: "pre-period-4-7", label: "4–7 days before your next recorded period" };
  }
  if (context.cycleDay > context.periodLength && context.cycleDay <= context.periodLength + 3) {
    return { id: "after-period-1-3", label: "within 3 days after your recorded period" };
  }
  return null;
};

phaseLogCopy = function phaseLogCopy73(phase, day) {
  if (phase !== "Cycle timing uncertain") return tsuki72PhaseLogCopy(phase, day);
  return {
    icon: "🌙",
    title: "Body check-in",
    question: "What are you noticing in your body today?",
    eyebrow: day ? `CYCLE DAY ${day} · TIMING VARIES` : "YOUR RHYTHM",
    description: "Your cycle timing varies, so Tsuki keeps this check-in focused on what you actually notice instead of guessing a phase."
  };
};

function irregularEventPatternInsights() {
  const contextualLogs = logsWithCycleContext();
  const groups = new Map();

  contextualLogs.forEach(log => {
    const bucket = timingBucket(log.context);
    if (!bucket) return;

    (log.symptoms || []).forEach(symptom => {
      const key = `symptom:${symptom}:${bucket.id}`;
      if (!groups.has(key)) groups.set(key, { kind: "symptom", value: symptom, bucket, logs: [], cycles: new Set() });
      const entry = groups.get(key);
      entry.logs.push(log);
      entry.cycles.add(log.context.cycleId);
    });

    [["mood", log.mood], ["energy", log.energy]].forEach(([kind, value]) => {
      if (!value) return;
      const key = `${kind}:${value}:${bucket.id}`;
      if (!groups.has(key)) groups.set(key, { kind, value, bucket, logs: [], cycles: new Set() });
      const entry = groups.get(key);
      entry.logs.push(log);
      entry.cycles.add(log.context.cycleId);
    });

    if (Number(log.pain) >= 3) {
      const key = `pain:${bucket.id}`;
      if (!groups.has(key)) groups.set(key, { kind: "pain", value: "Stronger pain", bucket, logs: [], cycles: new Set() });
      const entry = groups.get(key);
      entry.logs.push(log);
      entry.cycles.add(log.context.cycleId);
    }
  });

  const insights = [];
  groups.forEach(entry => {
    const cycles = entry.cycles.size;
    if (cycles < 3) return;
    const observations = entry.logs.length;
    const label = String(entry.value || "");
    const lower = label.toLowerCase();
    const icon = entry.kind === "mood" ? "💗" : entry.kind === "energy" ? "🔋" : entry.kind === "pain" ? "⚡" : label === "Headache" ? "☁️" : "🌸";
    const title = entry.kind === "mood"
      ? `${label} mood has a timing pattern`
      : entry.kind === "energy"
        ? `${label} energy has a timing pattern`
        : entry.kind === "pain"
          ? "Stronger pain has a timing pattern"
          : `${label} has a timing pattern`;
    const subject = entry.kind === "mood" ? `${lower} mood` : entry.kind === "energy" ? `${lower} energy` : entry.kind === "pain" ? "stronger pain" : lower;

    insights.push(createInsight({
      id: `irregular:${entry.kind}:${label}:${entry.bucket.id}`,
      icon,
      title,
      text: `You logged ${subject} ${entry.bucket.label} across ${cycles} completed cycles.`,
      cycles,
      observations,
      category: entry.kind === "pain" ? "pain" : entry.kind
    }));
  });

  return insights;
}

function irregularCycleSummaryInsights() {
  const records = irregularLearningIntervals();
  const values = records.map(record => record.days);
  if (values.length < 2) return [];
  const low = Math.min(...values);
  const high = Math.max(...values);
  const middle = Math.round(medianNumber(values));
  const results = [createInsight({
    id: "irregular:cycle-range",
    icon: "🌙",
    title: high - low <= 10 ? "Your recent timing has a fairly close range" : "Your cycle timing varies",
    text: `Your recent usable cycle lengths ranged from ${low}–${high} days, with a middle value around ${middle} days. Tsuki uses this as a range rather than an exact promise.`,
    cycles: values.length,
    observations: values.length,
    category: "cycle"
  })];

  const day = currentCycleDay();
  if (day && values.length >= 3 && day > high) {
    results.push(createInsight({
      id: "irregular:current-longer-than-range",
      icon: "🌙",
      title: "This cycle is running longer",
      text: `Today is Cycle Day ${day}, which is longer than your recent usable range of ${low}–${high} days. This is an observation from your logs, not a diagnosis.`,
      cycles: values.length,
      observations: values.length,
      category: "cycle"
    }));
  }

  return results;
}

function buildIrregularInsights({ includeDismissed = false } = {}) {
  const insights = [
    ...irregularCycleSummaryInsights(),
    ...irregularEventPatternInsights()
  ];

  insights.sort((a, b) => b.cycles - a.cycles || b.observations - a.observations);
  const unique = Array.from(new Map(insights.map(insight => [insight.id, insight])).values());
  const dismissed = new Set(data.insightState?.dismissed || []);
  const visible = includeDismissed ? unique : unique.filter(insight => !dismissed.has(insight.id));
  if (visible.length) return visible;

  const count = irregularLearningIntervals().length;
  return [{
    id: "irregular:learning",
    icon: "🌱",
    title: "Tsuki is learning your personal rhythm",
    text: count < 2
      ? "Add more actual period starts when you can. Tsuki will avoid an exact countdown until there is enough usable history for a meaningful range."
      : "Your timing varies, so Tsuki is focusing on repeated observations around actual recorded periods rather than guessing a fixed phase schedule.",
    cycles: count,
    observations: count,
    category: "cycle",
    confidence: { label: "Emerging", className: "emerging" }
  }];
}

buildInsights = function buildInsights73(options = {}) {
  return usesUncertainCycleForecast()
    ? buildIrregularInsights(options)
    : tsuki72BuildInsights(options);
};

function shouldSuggestIrregularProfile() {
  if (cyclePatternValue() !== "regular" || data.settings.dismissCyclePatternSuggestion) return false;
  const values = cycleIntervalRecords()
    .filter(record => record.days >= 15 && record.days <= 365)
    .slice(-5)
    .map(record => record.days);
  if (values.length < 3) return false;
  const spread = Math.max(...values) - Math.min(...values);
  return spread >= 14 || values.some(value => value > 60);
}

function applyCyclePatternToday() {
  const predictionCard = document.querySelector(".prediction-card");
  predictionCard?.classList.toggle("irregular-prediction", usesUncertainCycleForecast());

  const phase = document.getElementById("cyclePhaseText");
  const day = currentCycleDay();
  if (usesUncertainCycleForecast() && day && phaseForDate(todayKey()) !== "Period" && phase) {
    phase.textContent = cyclePatternValue() === "unsure"
      ? "Tsuki is learning how predictable your timing is."
      : "Your timing varies, so Tsuki is following what you actually log.";
  }

  const forecast = irregularForecastWindow();
  const nextText = document.getElementById("nextPeriodText");
  if (usesUncertainCycleForecast() && nextText) {
    if (data.settings.showIrregularPredictionWindow === false) {
      nextText.textContent = "Hidden in your settings";
    }
    else if (!forecast || forecast.sampleCount < 2) {
      nextText.textContent = "More history needed";
    }
    else if (!forecast.useful) {
      nextText.textContent = "Timing too variable for a useful range";
    }
    else {
      nextText.textContent = `${formatDate(forecast.start)} – ${formatDate(forecast.end)}`;
    }
  }

  const badge = document.getElementById("predictionConfidence");
  if (badge && usesUncertainCycleForecast()) {
    const confidence = irregularPredictionConfidence();
    badge.textContent = `${confidence.level} confidence`;
    badge.className = `confidence-badge ${confidence.className}`;
    badge.title = confidence.reason;
    badge.classList.toggle("hidden", data.settings.showIrregularConfidence === false);
  }
  else if (badge) {
    badge.classList.remove("hidden");
  }

  const late = document.getElementById("latePeriodNotice");
  if (late && usesUncertainCycleForecast() && !late.classList.contains("hidden")) {
    late.textContent = "🌙 This cycle is running longer than your recent recorded range. Tsuki will wait for your next actual period instead of sliding the forecast forward.";
  }

  let suggestion = document.getElementById("cyclePatternSuggestion");
  if (!suggestion) {
    suggestion = document.createElement("div");
    suggestion.id = "cyclePatternSuggestion";
    suggestion.className = "cycle-pattern-suggestion hidden";
    const hero = document.querySelector('[data-screen="today"] .hero-card');
    hero?.appendChild(suggestion);
  }

  const showSuggestion = shouldSuggestIrregularProfile() && !data.settings.hideDetails;
  suggestion?.classList.toggle("hidden", !showSuggestion);
  if (suggestion && showSuggestion) {
    suggestion.innerHTML = `<div><strong>🌙 Your recent cycle lengths vary more</strong><p>Tsuki is still using your regular-cycle setting. You can switch to wider, uncertainty-aware windows without changing any saved history.</p></div><div class="cycle-pattern-suggestion-actions"><button type="button" data-review-cycle-pattern>Review setting</button><button type="button" data-dismiss-cycle-pattern>Not now</button></div>`;
    suggestion.querySelector("[data-review-cycle-pattern]")?.addEventListener("click", () => {
      showScreen("me");
      loadSettingsUI();
      requestAnimationFrame(() => document.getElementById("cyclePattern")?.focus());
    });
    suggestion.querySelector("[data-dismiss-cycle-pattern]")?.addEventListener("click", () => {
      data.settings.dismissCyclePatternSuggestion = true;
      saveData();
      suggestion.classList.add("hidden");
    });
  }
}

function applyIrregularCalendarNote() {
  const grid = document.getElementById("calendarGrid");
  if (!grid) return;
  let note = document.getElementById("irregularCalendarNote");
  if (!note) {
    note = document.createElement("div");
    note.id = "irregularCalendarNote";
    note.className = "irregular-calendar-note";
    grid.insertAdjacentElement("afterend", note);
  }

  const show = usesUncertainCycleForecast() && !data.settings.hideDetails;
  note.classList.toggle("hidden", !show);
  if (!show) return;

  const forecast = irregularForecastWindow();
  note.innerHTML = forecast?.useful && data.settings.showIrregularPredictionWindow !== false
    ? `<strong>🌙 One window at a time</strong><span>Only your next estimated period window is shown. Future phase and ovulation coloring stays quiet until you log the next actual period.</span>`
    : `<strong>🌙 No forced prediction</strong><span>Tsuki does not have a useful next-period range right now, so future phase and ovulation coloring stays quiet.</span>`;
}

function decorateCycleHistory73() {
  const container = document.getElementById("periodHistoryList");
  if (!container) return;
  container.querySelector("#irregularRhythmPanel")?.remove();
  container.querySelectorAll(".interval-learning-control").forEach(node => node.remove());
  if (!usesUncertainCycleForecast()) return;

  const records = cycleIntervalRecords();
  const usable = irregularLearningIntervals();
  const values = usable.map(record => record.days);
  const panel = document.createElement("article");
  panel.id = "irregularRhythmPanel";
  panel.className = "irregular-rhythm-panel";

  if (values.length) {
    const low = Math.min(...values);
    const high = Math.max(...values);
    const middle = Math.round(medianNumber(values));
    panel.innerHTML = `<div><p class="eyebrow">YOUR RECENT RHYTHM</p><h3>${low}–${high} days</h3><p>Middle of usable history: about ${middle} days · ${values.length} interval${values.length === 1 ? "" : "s"} used for learning.</p></div><span>🌙</span><small>Tsuki keeps unusual or long recorded gaps visible. If a gap probably contains a period you forgot to log, you can exclude only that interval from prediction learning below.</small>`;
  }
  else {
    panel.innerHTML = `<div><p class="eyebrow">YOUR RECENT RHYTHM</p><h3>Still learning</h3><p>Add actual period starts when you remember them. Tsuki will not force a precise forecast from too little history.</p></div><span>🌱</span>`;
  }
  container.prepend(panel);

  container.querySelectorAll(".period-history-card").forEach(card => {
    const periodId = card.querySelector("[data-period-edit]")?.dataset.periodEdit;
    const record = records.find(item => item.currentId === periodId);
    if (!record) return;

    const control = document.createElement("div");
    control.className = "interval-learning-control";
    const eligible = record.irregularLearningEligible;
    const state = record.ignored
      ? "Excluded from prediction learning"
      : eligible
        ? "Used for prediction learning"
        : "Kept in history only";
    control.innerHTML = `<div><strong>${record.days} days from the previous recorded start</strong><small>${state}</small></div>${eligible ? `<button type="button" data-cycle-interval-toggle="${escapeHTML(record.key)}">${record.ignored ? "Use interval" : "Exclude interval"}</button>` : ""}`;
    card.appendChild(control);
  });

  container.querySelectorAll("[data-cycle-interval-toggle]").forEach(button => {
    button.addEventListener("click", () => toggleCycleIntervalLearning(button.dataset.cycleIntervalToggle));
  });
}

function toggleCycleIntervalLearning(key) {
  ensureCycleProfileSettings();
  const ignored = new Set(data.settings.ignoredCycleIntervals || []);
  if (ignored.has(key)) ignored.delete(key);
  else ignored.add(key);
  data.settings.ignoredCycleIntervals = Array.from(ignored);
  saveData();
  renderCycleHistory();
  renderToday();
  renderCalendar();
  renderReports();
  renderHomeInsights();
  showToast(ignored.has(key) ? "That interval is excluded from prediction learning 🌙" : "That interval is used for prediction learning again 🌸");
}

function irregularReportHTML() {
  if (!usesUncertainCycleForecast()) return "";
  const allRecords = cycleIntervalRecords();
  const usable = irregularLearningIntervals();
  const values = usable.map(record => record.days);
  const ignoredCount = allRecords.filter(record => record.ignored).length;
  const recordedValues = allRecords.map(record => record.days);
  const recordedRange = recordedValues.length ? `${Math.min(...recordedValues)}–${Math.max(...recordedValues)} days` : "Need more history";
  const usableRange = values.length ? `${Math.min(...values)}–${Math.max(...values)} days` : "Need more usable history";
  const middle = values.length ? `${Math.round(medianNumber(values))} days` : "—";
  const confidence = irregularPredictionConfidence();

  return `<article class="report-card irregular-report-card"><h3>Personal rhythm summary 🌙</h3><div class="report-row"><span>Cycle pattern</span><strong>${cyclePatternValue() === "irregular" ? "Varies a lot" : "Still learning"}</strong></div><div class="report-row"><span>All recorded intervals</span><strong>${recordedRange}</strong></div><div class="report-row"><span>Recent usable range</span><strong>${usableRange}</strong></div><div class="report-row"><span>Middle of recent history</span><strong>${middle}</strong></div><div class="report-row"><span>Intervals excluded from learning</span><strong>${ignoredCount}</strong></div><div class="report-row"><span>Prediction confidence</span><strong>${confidence.level}</strong></div><p class="muted small-text">These numbers summarize dates you recorded. They do not diagnose a condition or confirm ovulation.</p></article>`;
}

function loadCycleProfileUI() {
  ensureCycleProfileSettings();
  const select = document.getElementById("cyclePattern");
  const completeness = document.getElementById("cycleHistoryCompleteness");
  const windowToggle = document.getElementById("showIrregularPredictionWindow");
  const confidenceToggle = document.getElementById("showIrregularConfidence");
  const options = document.getElementById("irregularCycleOptions");
  const predictable = document.getElementById("predictablePredictionOptions");
  const cycleLength = document.getElementById("settingsCycleLength");
  const help = document.getElementById("cyclePatternHelp");
  const uncertain = usesUncertainCycleForecast();

  if (select) select.value = cyclePatternValue();
  if (completeness) completeness.value = data.settings.cycleHistoryCompleteness || "complete";
  if (windowToggle) windowToggle.checked = data.settings.showIrregularPredictionWindow !== false;
  if (confidenceToggle) confidenceToggle.checked = data.settings.showIrregularConfidence !== false;
  options?.classList.toggle("hidden", !uncertain);
  predictable?.classList.toggle("cycle-prediction-options-muted", uncertain);
  const predictionSelect = document.getElementById("predictionMode");
  if (predictionSelect) predictionSelect.disabled = uncertain;
  if (cycleLength) cycleLength.max = uncertain ? "365" : "60";
  if (help) {
    help.textContent = cyclePatternValue() === "regular"
      ? "Tsuki can use a more precise countdown when your timing is usually predictable."
      : cyclePatternValue() === "irregular"
        ? "Tsuki will use actual recorded ranges, avoid repeated future projections, and keep future ovulation timing uncertain."
        : "Tsuki will stay cautious while it learns your timing. You can change this anytime.";
  }
}

function syncCycleProfileDraftUI() {
  const select = document.getElementById("cyclePattern");
  if (!select) return;
  const uncertain = select.value !== "regular";
  document.getElementById("irregularCycleOptions")?.classList.toggle("hidden", !uncertain);
  document.getElementById("predictablePredictionOptions")?.classList.toggle("cycle-prediction-options-muted", uncertain);
  const predictionSelect = document.getElementById("predictionMode");
  if (predictionSelect) predictionSelect.disabled = uncertain;
  const cycleLength = document.getElementById("settingsCycleLength");
  if (cycleLength) cycleLength.max = uncertain ? "365" : "60";
}

ensureCycleProfileSettings();

const tsuki72RenderToday = renderToday;
renderToday = function renderToday73() {
  const result = tsuki72RenderToday();
  applyCyclePatternToday();
  return result;
};

const tsuki72RenderCalendar = renderCalendar;
renderCalendar = function renderCalendar73() {
  const result = tsuki72RenderCalendar();
  applyIrregularCalendarNote();
  return result;
};

const tsuki72RenderCycleHistory = renderCycleHistory;
renderCycleHistory = function renderCycleHistory73() {
  const result = tsuki72RenderCycleHistory();
  decorateCycleHistory73();
  return result;
};

const tsuki72RenderReports = renderReports;
renderReports = function renderReports73() {
  const result = tsuki72RenderReports();
  const container = document.getElementById("reportSummary");
  if (container && usesUncertainCycleForecast()) container.insertAdjacentHTML("beforeend", irregularReportHTML());
  return result;
};

const tsuki72LoadSettingsUI = loadSettingsUI;
loadSettingsUI = function loadSettingsUI73() {
  ensureCycleProfileSettings();
  const result = tsuki72LoadSettingsUI();
  loadCycleProfileUI();
  return result;
};

const tsuki72RenderEverything = renderEverything;
renderEverything = function renderEverything73() {
  ensureCycleProfileSettings();
  return tsuki72RenderEverything();
};

const tsuki72CompanionPrimaryMessage = companionPrimaryMessage;
companionPrimaryMessage = function companionPrimaryMessage73() {
  if (!usesUncertainCycleForecast()) return tsuki72CompanionPrimaryMessage();
  const today = todayKey();
  const todayLog = data.logs[today] || {};
  if (todayLog.tinyJoy) return `You saved a tiny joy today: “${todayLog.tinyJoy}” 🌸`;
  if (periodForDate(today)) return "Period days can be soft days. I brought a blanket 🌙";
  const forecast = irregularForecastWindow();
  if (forecast?.useful && data.settings.showIrregularPredictionWindow !== false) return "Your next moon has a wider window, so I’m watching gently instead of counting down to one exact day ✨";
  return "I’m learning your rhythm without forcing it into a schedule. 🌙";
};

const tsuki72CompanionSecondaryNote = companionSecondaryNote;
companionSecondaryNote = function companionSecondaryNote73() {
  if (!usesUncertainCycleForecast()) return tsuki72CompanionSecondaryNote();
  if (periodForDate(todayKey())) return "Warm light, tea, and extra softness.";
  return "Your timing can vary. Today’s observations matter more than a guessed phase.";
};

const tsuki72RenderCompanionHome = renderCompanionHome;
renderCompanionHome = function renderCompanionHome73() {
  const result = tsuki72RenderCompanionHome();
  if (usesUncertainCycleForecast() && latestPeriod() && phaseForDate(todayKey()) !== "Period") {
    const title = document.getElementById("companionHomeTitle");
    if (title) title.textContent = "Tsuki is following your rhythm";
  }
  return result;
};

document.getElementById("cyclePattern")?.addEventListener("change", syncCycleProfileDraftUI);

document.getElementById("saveSettings")?.addEventListener("click", () => {
  const pattern = document.getElementById("cyclePattern")?.value || cyclePatternValue();
  data.settings.cyclePattern = TSUKI73_CYCLE_PATTERNS.has(pattern) ? pattern : "unsure";
  data.settings.cycleHistoryCompleteness = document.getElementById("cycleHistoryCompleteness")?.value || "complete";
  data.settings.showIrregularPredictionWindow = document.getElementById("showIrregularPredictionWindow")?.checked !== false;
  data.settings.showIrregularConfidence = document.getElementById("showIrregularConfidence")?.checked !== false;
  if (pattern !== "regular") data.settings.dismissCyclePatternSuggestion = false;

  const cycleLengthInput = document.getElementById("settingsCycleLength");
  if (cycleLengthInput) {
    const max = pattern === "regular" ? 60 : 365;
    const value = Number(cycleLengthInput.value) || 28;
    cycleLengthInput.value = String(Math.max(15, Math.min(max, Math.round(value))));
  }
}, { capture: true });

if (Array.isArray(TUTORIAL_STEPS) && !TUTORIAL_STEPS.some(step => step.title === "Your rhythm can vary")) {
  const position = Math.max(1, TUTORIAL_STEPS.length - 2);
  TUTORIAL_STEPS.splice(position, 0, {
    icon: "🌙",
    eyebrow: "PERSONAL RHYTHMS",
    title: "Your rhythm can vary",
    text: "In Me → Cycle defaults, choose whether your timing is usually predictable, varies a lot, or is still unclear. Tsuki can switch from exact countdowns to wider, uncertainty-aware windows without changing your saved history."
  });
}



/* ============================================================
   BUILD 7.3.1 — BETWEEN MOONS + VERY INFREQUENT CYCLES
   Makes Tsuki useful between sparse periods instead of forcing a forecast.
   ============================================================ */

const TSUKI731_IRREGULAR_SHAPES = new Set(["variable", "infrequent", "unpredictable", "unsure"]);
const TSUKI731_LONG_GAP_CONTEXTS = new Set(["unknown", "expected", "care-plan"]);
const TSUKI731_LONG_GAP_DAYS = 90;

function ensureBetweenMoonsSettings() {
  ensureCycleProfileSettings();
  if (!TSUKI731_IRREGULAR_SHAPES.has(data.settings.irregularCycleShape)) {
    data.settings.irregularCycleShape = cyclePatternValue() === "irregular" ? "variable" : "unsure";
  }
  if (!TSUKI731_LONG_GAP_CONTEXTS.has(data.settings.longGapContext)) {
    data.settings.longGapContext = "unknown";
  }
}

function irregularCycleShapeValue() {
  ensureBetweenMoonsSettings();
  return data.settings.irregularCycleShape;
}

function usesVeryInfrequentCycle() {
  return cyclePatternValue() === "irregular" && irregularCycleShapeValue() === "infrequent";
}

function validDateFromKey(key) {
  const value = parseDate(key);
  return value && !Number.isNaN(value.getTime()) ? value : null;
}

function daysSinceLastRecordedPeriod() {
  const latest = latestPeriod();
  const start = latest ? parseDate(latest.start) : null;
  return start ? Math.max(0, daysBetween(start, new Date())) : null;
}

function periodsRecordedInLastDays(days = 365) {
  const end = new Date();
  const start = addDays(end, -Math.max(1, days));
  return validPeriods().filter(period => {
    const date = parseDate(period.start);
    return date && date >= start && date <= end;
  });
}

function recentBodyLogs(days = 60) {
  const cutoff = addDays(new Date(), -Math.max(1, days - 1));
  cutoff.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return Object.entries(data.logs || {})
    .map(([key, log]) => ({ key, date: validDateFromKey(key), log: log || {} }))
    .filter(item => item.date && item.date >= cutoff && item.date <= end)
    .sort((a, b) => a.date - b.date);
}

function topLoggedItem(values) {
  const counts = new Map();
  values.filter(Boolean).forEach(value => {
    const label = String(value).trim();
    if (!label) return;
    counts.set(label, (counts.get(label) || 0) + 1);
  });
  if (!counts.size) return null;
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))[0];
}

function betweenMoonsSnapshot() {
  ensureBetweenMoonsSettings();
  const logs30 = recentBodyLogs(30);
  const logs60 = recentBodyLogs(60);
  const symptoms = [];
  const moods = [];
  const energies = [];
  const sleeps = [];

  logs60.forEach(({ log }) => {
    (Array.isArray(log.symptoms) ? log.symptoms : []).forEach(value => symptoms.push(value));
    const logMoods = Array.isArray(log.moods) ? log.moods : (log.mood ? [log.mood] : []);
    logMoods.forEach(value => moods.push(value));
    if (log.energy) energies.push(log.energy);
    if (log.sleep) sleeps.push(log.sleep);
  });

  const records = cycleIntervalRecords();
  const intervalValues = records.map(record => record.days).filter(Number.isFinite);
  const latest = latestPeriod();
  const lastStart = latest ? parseDate(latest.start) : null;

  return {
    lastPeriod: lastStart,
    daysSince: daysSinceLastRecordedPeriod(),
    periods12m: periodsRecordedInLastDays(365).length,
    checkins30: logs30.length,
    checkins60: logs60.length,
    topSymptom: topLoggedItem(symptoms),
    topMood: topLoggedItem(moods),
    topEnergy: topLoggedItem(energies),
    topSleep: topLoggedItem(sleeps),
    intervalValues,
    intervalLow: intervalValues.length ? Math.min(...intervalValues) : null,
    intervalHigh: intervalValues.length ? Math.max(...intervalValues) : null
  };
}

const tsuki73IrregularForecastWindow = irregularForecastWindow;
irregularForecastWindow = function irregularForecastWindow731() {
  if (usesVeryInfrequentCycle()) {
    const values = irregularLearningIntervals().map(record => record.days);
    return {
      useful: false,
      reason: "very-infrequent",
      sampleCount: values.length,
      values,
      low: values.length ? Math.min(...values) : null,
      high: values.length ? Math.max(...values) : null,
      median: values.length ? medianNumber(values) : null
    };
  }
  return tsuki73IrregularForecastWindow();
};

const tsuki73IrregularPredictionConfidence = irregularPredictionConfidence;
irregularPredictionConfidence = function irregularPredictionConfidence731() {
  if (usesVeryInfrequentCycle()) {
    return {
      level: "Not used",
      className: "confidence-low",
      reason: "Tsuki is intentionally not forecasting a next period for this pattern"
    };
  }
  return tsuki73IrregularPredictionConfidence();
};

const tsuki73PeriodCountdownText = periodCountdownText;
periodCountdownText = function periodCountdownText731() {
  if (!usesVeryInfrequentCycle()) return tsuki73PeriodCountdownText();
  if (!latestPeriod()) return "Log a period when it happens";
  return "Tsuki isn’t guessing your next period";
};

function betweenMoonsCareHTML(snapshot) {
  if (!snapshot.lastPeriod || snapshot.daysSince == null || snapshot.daysSince < TSUKI731_LONG_GAP_DAYS) {
    return `<div class="between-moons-care-calm"><span>🤍</span><div><p class="eyebrow">CARE CONTEXT</p><h3>No long-gap note right now</h3><p>Tsuki keeps this area quiet unless a recorded gap becomes long enough that a gentle check-in may be useful.</p></div></div>`;
  }

  const context = data.settings.longGapContext || "unknown";
  if (context === "expected") {
    return `<div class="between-moons-care-calm"><span>🌙</span><div><p class="eyebrow">CARE CONTEXT</p><h3>Long gaps are expected for you</h3><p>You marked this pattern as expected. Tsuki will keep recording your body story without repeatedly flagging the gap.</p><button type="button" class="text-button" data-long-gap-context="unknown">Change this</button></div></div>`;
  }
  if (context === "care-plan") {
    return `<div class="between-moons-care-calm"><span>🤍</span><div><p class="eyebrow">CARE CONTEXT</p><h3>You’re already following a care plan</h3><p>Tsuki will stay in record-keeping mode and won’t repeatedly warn you about the same expected long-gap pattern.</p><button type="button" class="text-button" data-long-gap-context="unknown">Change this</button></div></div>`;
  }

  return `<div class="between-moons-care-note"><span>🫧</span><div><p class="eyebrow">A GENTLE NOTE</p><h3>It’s been over 3 months since your last recorded period</h3><p>If this isn’t expected for you or already part of a plan with a healthcare professional, consider checking in with them. There are many possible reasons for long gaps, and Tsuki can’t tell why a period hasn’t happened.</p><div class="between-moons-care-actions"><button type="button" class="secondary-button small" data-long-gap-context="expected">This is expected for me</button><button type="button" class="secondary-button small" data-long-gap-context="care-plan">I’m following a care plan</button></div></div></div>`;
}

function betweenMoonsSummaryText() {
  const snapshot = betweenMoonsSnapshot();
  const lines = [
    "Tsuki — Between Moons factual summary",
    `Last recorded period: ${snapshot.lastPeriod ? formatDateLong(snapshot.lastPeriod) : "None recorded"}`,
    `Days since last recorded period: ${snapshot.daysSince == null ? "—" : snapshot.daysSince}`,
    `Periods recorded in the past 12 months: ${snapshot.periods12m}`,
    `Recorded cycle intervals: ${snapshot.intervalValues.length ? snapshot.intervalValues.join(", ") + " days" : "Not enough recorded starts"}`,
    `Daily check-ins in the past 30 days: ${snapshot.checkins30}`,
    `Most logged symptom in the past 60 days: ${snapshot.topSymptom ? `${snapshot.topSymptom.value} (${snapshot.topSymptom.count} check-ins)` : "None"}`,
    `Most logged mood in the past 60 days: ${snapshot.topMood ? `${snapshot.topMood.value} (${snapshot.topMood.count} check-ins)` : "None"}`,
    `Most logged energy in the past 60 days: ${snapshot.topEnergy ? `${snapshot.topEnergy.value} (${snapshot.topEnergy.count} check-ins)` : "None"}`,
    "",
    "This is a factual summary of entries recorded in Tsuki. It does not diagnose a condition, confirm ovulation, or explain why periods are infrequent."
  ];
  return lines.join("\n");
}

function betweenMoonsInsightHTML() {
  const snapshot = betweenMoonsSnapshot();
  const items = [];

  if (snapshot.checkins60 >= 3 && snapshot.topSymptom) {
    items.push(`<article class="between-moons-insight"><span>🌸</span><div><strong>${escapeHTML(snapshot.topSymptom.value)} is one of your most logged recent body signals</strong><p>You recorded it on ${snapshot.topSymptom.count} of your last 60 days of check-ins. That is an observation from your entries, not a diagnosis.</p></div></article>`);
  }
  if (snapshot.checkins60 >= 3 && snapshot.topMood) {
    items.push(`<article class="between-moons-insight"><span>💗</span><div><strong>${escapeHTML(snapshot.topMood.value)} is your most logged recent mood</strong><p>It appeared in ${snapshot.topMood.count} recent check-in${snapshot.topMood.count === 1 ? "" : "s"}. Tsuki can follow this even when no period is nearby.</p></div></article>`);
  }
  if (snapshot.checkins60 >= 3 && snapshot.topEnergy) {
    items.push(`<article class="between-moons-insight"><span>✨</span><div><strong>${escapeHTML(snapshot.topEnergy.value)} energy appears most often recently</strong><p>You logged it in ${snapshot.topEnergy.count} recent check-in${snapshot.topEnergy.count === 1 ? "" : "s"}.</p></div></article>`);
  }

  if (!items.length) {
    items.push(`<article class="between-moons-empty"><span>🌱</span><div><strong>Your between-period story starts with ordinary days</strong><p>Check in when something feels worth remembering. Tsuki can build useful body patterns without waiting for another period.</p></div></article>`);
  }
  return items.join("");
}

function renderBetweenMoonsTodayCard() {
  ensureBetweenMoonsSettings();
  const active = data.mode === "cycle" && usesVeryInfrequentCycle();
  const card = document.getElementById("betweenMoonsTodayCard");
  const drawerRow = document.getElementById("betweenMoonsDrawerRow");
  card?.classList.toggle("hidden", !active);
  drawerRow?.classList.toggle("hidden", !active);
  if (!active) {
    document.getElementById("predictionConfidence")?.classList.remove("hidden");
    return;
  }
  if (!card) return;

  const snapshot = betweenMoonsSnapshot();
  const title = document.getElementById("betweenMoonsTodayTitle");
  const text = document.getElementById("betweenMoonsTodayText");
  if (title) title.textContent = "Your body still has a story";
  if (text) {
    const day = currentCycleDay();
    const periodWord = snapshot.periods12m === 1 ? "period" : "periods";
    const dayText = day ? `Cycle Day ${day}. ` : "";
    text.textContent = `${dayText}${snapshot.periods12m} recorded ${periodWord} in the past 12 months. Tsuki is following your check-ins between periods instead of guessing one exact next date.`;
  }

  const nextText = document.getElementById("nextPeriodText");
  const countdown = document.getElementById("periodCountdownText");
  const confidence = document.getElementById("predictionConfidence");
  const late = document.getElementById("latePeriodNotice");
  if (nextText) nextText.textContent = "Not predicting a date";
  if (countdown) countdown.textContent = "Your between-period observations still count";
  confidence?.classList.add("hidden");
  late?.classList.add("hidden");
}

function renderBetweenMoons() {
  ensureBetweenMoonsSettings();
  const stats = document.getElementById("betweenMoonsStats");
  if (!stats) return;

  const active = data.mode === "cycle" && usesVeryInfrequentCycle();
  const intro = document.getElementById("betweenMoonsIntro");
  if (!active) {
    stats.innerHTML = `<article class="card between-moons-setup"><span>🌘</span><div><h3>Between Moons is ready when you need it</h3><p>Choose <strong>Varies a lot</strong> and then <strong>I may go several months without a period</strong> in Me → Cycle defaults.</p><button type="button" class="secondary-button" data-open-screen="me">Open Cycle defaults</button></div></article>`;
    if (intro) intro.classList.add("hidden");
    document.getElementById("betweenMoonsSignals").innerHTML = "";
    document.getElementById("betweenMoonsInsights").innerHTML = "";
    document.getElementById("betweenMoonsCareCard").innerHTML = "";
    document.getElementById("betweenMoonsSummaryPreview").textContent = "";
    stats.querySelector('[data-open-screen="me"]')?.addEventListener("click", () => showScreen("me"));
    return;
  }
  if (intro) intro.classList.remove("hidden");

  const snapshot = betweenMoonsSnapshot();
  const periodWord = snapshot.periods12m === 1 ? "period" : "periods";
  stats.innerHTML = `
    <article class="between-moons-stat"><span>🌙</span><small>Last recorded period</small><strong>${snapshot.lastPeriod ? escapeHTML(formatDateLong(snapshot.lastPeriod)) : "None yet"}</strong></article>
    <article class="between-moons-stat"><span>🗓️</span><small>Days since</small><strong>${snapshot.daysSince == null ? "—" : snapshot.daysSince}</strong></article>
    <article class="between-moons-stat"><span>🩸</span><small>Past 12 months</small><strong>${snapshot.periods12m} ${periodWord}</strong></article>
    <article class="between-moons-stat"><span>📝</span><small>Last 30 days</small><strong>${snapshot.checkins30} check-in${snapshot.checkins30 === 1 ? "" : "s"}</strong></article>
  `;

  const signals = document.getElementById("betweenMoonsSignals");
  const signalRows = [];
  if (snapshot.topSymptom) signalRows.push(`<div class="between-moons-signal-row"><span>🌸 Body signal</span><strong>${escapeHTML(snapshot.topSymptom.value)} · ${snapshot.topSymptom.count}×</strong></div>`);
  if (snapshot.topMood) signalRows.push(`<div class="between-moons-signal-row"><span>💗 Mood</span><strong>${escapeHTML(snapshot.topMood.value)} · ${snapshot.topMood.count}×</strong></div>`);
  if (snapshot.topEnergy) signalRows.push(`<div class="between-moons-signal-row"><span>✨ Energy</span><strong>${escapeHTML(snapshot.topEnergy.value)} · ${snapshot.topEnergy.count}×</strong></div>`);
  if (snapshot.topSleep) signalRows.push(`<div class="between-moons-signal-row"><span>🌙 Sleep</span><strong>${escapeHTML(snapshot.topSleep.value)} · ${snapshot.topSleep.count}×</strong></div>`);
  signals.innerHTML = signalRows.length
    ? signalRows.join("")
    : `<div class="between-moons-empty"><span>🌱</span><div><strong>No recent check-ins yet</strong><p>You do not have to wait for a period. Ordinary-day logs are what make this view useful.</p></div></div>`;

  document.getElementById("betweenMoonsInsights").innerHTML = betweenMoonsInsightHTML();

  const care = document.getElementById("betweenMoonsCareCard");
  care.innerHTML = betweenMoonsCareHTML(snapshot);
  care.querySelectorAll("[data-long-gap-context]").forEach(button => {
    button.addEventListener("click", () => {
      const next = button.dataset.longGapContext;
      data.settings.longGapContext = TSUKI731_LONG_GAP_CONTEXTS.has(next) ? next : "unknown";
      saveData();
      renderBetweenMoons();
      showToast(next === "expected" ? "Tsuki will treat long gaps as expected for you 🌙" : next === "care-plan" ? "Care-plan context saved 🤍" : "Care context reset");
    });
  });

  document.getElementById("betweenMoonsSummaryPreview").textContent = betweenMoonsSummaryText();
}

async function copyBetweenMoonsSummaryToClipboard() {
  const text = betweenMoonsSummaryText();
  try {
    await navigator.clipboard.writeText(text);
    showToast("Between Moons summary copied 📋");
    return;
  }
  catch (_) {}

  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  try { document.execCommand("copy"); } catch (_) {}
  area.remove();
  showToast("Between Moons summary ready to paste 📋");
}

function renderInfrequentReportCard() {
  const container = document.getElementById("reportSummary");
  if (!container) return;
  container.querySelector("#betweenMoonsReportCard")?.remove();
  if (!usesVeryInfrequentCycle()) return;

  const snapshot = betweenMoonsSnapshot();
  const card = document.createElement("article");
  card.id = "betweenMoonsReportCard";
  card.className = "report-card between-moons-report-card";
  card.innerHTML = `<h3>Between Moons summary 🌘</h3>
    <div class="report-row"><span>Periods recorded in the past 12 months</span><strong>${snapshot.periods12m}</strong></div>
    <div class="report-row"><span>Days since last recorded period</span><strong>${snapshot.daysSince == null ? "—" : snapshot.daysSince}</strong></div>
    <div class="report-row"><span>Daily check-ins in the past 30 days</span><strong>${snapshot.checkins30}</strong></div>
    <div class="report-row"><span>Recorded interval range</span><strong>${snapshot.intervalLow == null ? "Need more history" : `${snapshot.intervalLow}–${snapshot.intervalHigh} days`}</strong></div>
    <p class="muted small-text">For this pattern, Tsuki prioritizes factual history and between-period observations instead of a next-period forecast.</p>`;
  container.appendChild(card);
}

function decorateInfrequentCycleHistory() {
  if (!usesVeryInfrequentCycle()) return;
  const panel = document.getElementById("irregularRhythmPanel");
  if (!panel) return;
  const snapshot = betweenMoonsSnapshot();
  const ranges = snapshot.intervalLow == null ? "Still building your interval history" : `${snapshot.intervalLow}–${snapshot.intervalHigh} days between recorded starts`;
  panel.innerHTML = `<div><p class="eyebrow">YOUR BETWEEN-MOONS RHYTHM</p><h3>${snapshot.periods12m} recorded period${snapshot.periods12m === 1 ? "" : "s"} in the past 12 months</h3><p>${ranges}. Tsuki keeps these long real gaps visible but does not turn them into a next-period countdown.</p></div><span>🌘</span><small>Your daily check-ins can still build a useful body story between actual periods.</small>`;
}

function betweenMoonsHomeInsights() {
  if (!usesVeryInfrequentCycle()) return [];
  const snapshot = betweenMoonsSnapshot();
  const insights = [];

  if (snapshot.checkins60 >= 3 && snapshot.topSymptom) {
    insights.push(createInsight({
      id: `between-moons:symptom:${snapshot.topSymptom.value}`,
      icon: "🌸",
      title: `${snapshot.topSymptom.value} has been showing up recently`,
      text: `You logged ${String(snapshot.topSymptom.value).toLowerCase()} on ${snapshot.topSymptom.count} recent check-ins. Tsuki can follow this pattern even when your periods are months apart.`,
      cycles: Math.max(1, snapshot.periods12m),
      observations: snapshot.topSymptom.count,
      category: "symptom"
    }));
  }
  if (snapshot.checkins60 >= 3 && snapshot.topEnergy) {
    insights.push(createInsight({
      id: `between-moons:energy:${snapshot.topEnergy.value}`,
      icon: "✨",
      title: `${snapshot.topEnergy.value} energy appears most often recently`,
      text: `You logged ${String(snapshot.topEnergy.value).toLowerCase()} energy on ${snapshot.topEnergy.count} recent check-ins. This is based on your entries, not a guessed cycle phase.`,
      cycles: Math.max(1, snapshot.periods12m),
      observations: snapshot.topEnergy.count,
      category: "energy"
    }));
  }
  return insights;
}

const tsuki73BuildInsights731 = buildInsights;
buildInsights = function buildInsights731(options = {}) {
  const base = tsuki73BuildInsights731(options);
  if (!usesVeryInfrequentCycle()) return base;
  const additions = betweenMoonsHomeInsights();
  const filtered = base.filter(item => item.id !== "irregular:current-longer-than-range");
  return Array.from(new Map([...additions, ...filtered].map(item => [item.id, item])).values());
};

function loadBetweenMoonsSettingsUI() {
  ensureBetweenMoonsSettings();
  const shape = document.getElementById("irregularCycleShape");
  const help = document.getElementById("irregularCycleShapeHelp");
  const windowToggle = document.getElementById("showIrregularPredictionWindow");
  if (shape) shape.value = irregularCycleShapeValue();

  const infrequent = cyclePatternValue() === "irregular" && irregularCycleShapeValue() === "infrequent";
  if (windowToggle) windowToggle.disabled = infrequent;
  if (help) {
    help.textContent = infrequent
      ? "Tsuki will stop forecasting a next-period date and focus on your body story between actual periods. Your saved history stays unchanged."
      : irregularCycleShapeValue() === "unpredictable"
        ? "Tsuki will stay cautious and only show a window when your actual history supports something useful."
        : "This changes how Tsuki helps between periods. It does not diagnose why your timing varies.";
  }
}

function syncBetweenMoonsDraftUI() {
  const cyclePattern = document.getElementById("cyclePattern")?.value;
  const shape = document.getElementById("irregularCycleShape")?.value;
  const infrequent = cyclePattern === "irregular" && shape === "infrequent";
  const windowToggle = document.getElementById("showIrregularPredictionWindow");
  if (windowToggle) windowToggle.disabled = infrequent;
  const help = document.getElementById("irregularCycleShapeHelp");
  if (help) {
    help.textContent = infrequent
      ? "Tsuki will stop forecasting a next-period date and focus on your body story between actual periods. Your saved history stays unchanged."
      : "This changes how Tsuki helps between periods. It does not diagnose why your timing varies.";
  }
}

ensureBetweenMoonsSettings();

const tsuki73ApplyCyclePatternToday731 = applyCyclePatternToday;
applyCyclePatternToday = function applyCyclePatternToday731() {
  const result = tsuki73ApplyCyclePatternToday731();
  renderBetweenMoonsTodayCard();
  return result;
};

const tsuki73RenderCycleHistory731 = renderCycleHistory;
renderCycleHistory = function renderCycleHistory731() {
  const result = tsuki73RenderCycleHistory731();
  decorateInfrequentCycleHistory();
  return result;
};

const tsuki73RenderReports731 = renderReports;
renderReports = function renderReports731() {
  const result = tsuki73RenderReports731();
  renderInfrequentReportCard();
  return result;
};

const tsuki73LoadSettingsUI731 = loadSettingsUI;
loadSettingsUI = function loadSettingsUI731() {
  ensureBetweenMoonsSettings();
  const result = tsuki73LoadSettingsUI731();
  loadBetweenMoonsSettingsUI();
  return result;
};

const tsuki73RenderEverything731 = renderEverything;
renderEverything = function renderEverything731() {
  ensureBetweenMoonsSettings();
  const result = tsuki73RenderEverything731();
  renderBetweenMoonsTodayCard();
  if (document.querySelector('[data-screen="between-moons"]')?.classList.contains("active")) renderBetweenMoons();
  return result;
};

const tsuki73ShowScreen731 = showScreen;
showScreen = function showScreen731(screenName) {
  const result = tsuki73ShowScreen731(screenName);
  if (screenName === "between-moons") renderBetweenMoons();
  return result;
};

const tsuki73CompanionPrimaryMessage731 = companionPrimaryMessage;
companionPrimaryMessage = function companionPrimaryMessage731() {
  if (!usesVeryInfrequentCycle()) return tsuki73CompanionPrimaryMessage731();
  if (periodForDate(todayKey())) return "Your moon is here. I’m staying soft with you today 🌙";
  const log = data.logs[todayKey()] || {};
  if (log.tinyJoy) return `You saved a tiny joy today: “${log.tinyJoy}” 🌸`;
  return "I’m following the days between your moons too. Your ordinary-day check-ins still tell a story. 🌘";
};

const tsuki73CompanionSecondaryNote731 = companionSecondaryNote;
companionSecondaryNote = function companionSecondaryNote731() {
  if (!usesVeryInfrequentCycle()) return tsuki73CompanionSecondaryNote731();
  return "You don’t need a monthly period for your observations to matter.";
};

document.getElementById("irregularCycleShape")?.addEventListener("change", syncBetweenMoonsDraftUI);
document.getElementById("cyclePattern")?.addEventListener("change", syncBetweenMoonsDraftUI);
document.getElementById("copyBetweenMoonsSummary")?.addEventListener("click", copyBetweenMoonsSummaryToClipboard);

document.getElementById("saveSettings")?.addEventListener("click", () => {
  const pattern = document.getElementById("cyclePattern")?.value || cyclePatternValue();
  const shape = document.getElementById("irregularCycleShape")?.value || irregularCycleShapeValue();
  data.settings.irregularCycleShape = pattern === "irregular" && TSUKI731_IRREGULAR_SHAPES.has(shape) ? shape : (pattern === "irregular" ? "variable" : "unsure");
  saveData();
  loadBetweenMoonsSettingsUI();
  renderBetweenMoonsTodayCard();
}, { capture: true });

if (Array.isArray(TUTORIAL_STEPS) && !TUTORIAL_STEPS.some(step => step.title === "The days between periods count too")) {
  const position = Math.max(1, TUTORIAL_STEPS.length - 2);
  TUTORIAL_STEPS.splice(position, 0, {
    icon: "🌘",
    eyebrow: "BETWEEN MOONS",
    title: "The days between periods count too",
    text: "If your periods may be months apart, choose that pattern in Me → Cycle defaults. Tsuki can stop guessing a next date and instead follow your symptoms, mood, energy, sleep and other check-ins between actual periods."
  });
}


/* ============================================================
   BUILD 7.6 — BODY SIGNALS INSTALL
   The module is loaded before app.js and installed here so it can wrap the
   final Cycle/Between Moons functions before the first render.
   ============================================================ */
window.TsukiBodySignals?.install?.();


/* ============================================================
   INIT
   ============================================================ */

async function init() {
  installCompanionImageGuard();
  installNativeTouchGuards();
  await tryRecoverLastGoodSnapshot();
  loadSettingsUI();
  applySettings();
  loadLogForm();
  renderEverything();
  updateOnlineStatus();
  renderAppLockSettings();
  if (data.mode === "pregnancy" && data.pregnancy?.active) showScreen("pregnancy-today");
  else if (data.mode === "postpartum" && data.postpartum?.active) showScreen("postpartum-today");

  const defer = window.requestIdleCallback || (callback => setTimeout(callback, 120));
  defer(() => refreshWallpaperAsset());

  if (appLockSettings.enabled && appLockSettings.pinHash) lockApp();
  else setTimeout(runLaunchOverlays, 280);
}


init().catch(error => {
  console.error("Tsuki initialization failed:", error);
  runtimeErrorCount += 1;
  try { showToast("Tsuki hit a startup issue. Your saved data has not been deleted."); } catch (_) {}
});
