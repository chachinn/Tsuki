/* ============================================================
   TSUKI 🌙 — BUILD 4
   TSUKI KNOWS ME — SIGNATURE PERSONAL INTELLIGENCE
   ============================================================ */

const STORAGE_KEY = "tsuki-data-v4";
const BUILD3_STORAGE_KEY = "tsuki-data-v3";
const BUILD2_STORAGE_KEY = "tsuki-data-v2";
const LEGACY_STORAGE_KEY = "tsuki-data-v1";


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

  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
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

  schemaVersion: 4,

  settings: {
    cycleLength: 28,
    periodLength: 5,
    sakura: true,
    reduceMotion: false,
    hideDetails: false,
    discreet: true,
    quietInterface: false
  },

  periods: [],

  logs: {},

  relief: [],

  journal: [],

  trips: [],

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
    schemaVersion: 4,
    settings: {
      ...defaultData.settings,
      ...(parsed?.settings || {})
    },
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
      Array.isArray(parsed?.trips)
        ? parsed.trips
        : [],
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
    schemaVersion: 4,
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
    console.error(
      "Could not load Tsuki data:",
      error
    );

    return clone(defaultData);
  }
}


function saveData() {
  data.schemaVersion = 4;

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(data)
  );
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


function nextEstimatedPeriodDate() {
  const period =
    latestPeriod();

  if (!period) return null;

  const start =
    parseDate(period.start);

  return addDays(
    start,
    averageCycleLength()
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

  const periodLength =
    averagePeriodLength();

  const cycleLength =
    averageCycleLength();

  const estimatedOvulation =
    Math.max(
      periodLength + 3,
      cycleLength - 14
    );

  if (day <= periodLength) {
    return "Period";
  }

  if (
    day <
    estimatedOvulation - 1
  ) {
    return "Follicular phase";
  }

  if (
    Math.abs(
      day -
      estimatedOvulation
    ) <= 1
  ) {
    return "Around mid-cycle";
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

function showScreen(name) {
  document
    .querySelectorAll(".screen")
    .forEach(screen => {
      screen.classList.toggle(
        "active",
        screen.dataset.screen === name
      );
    });

  document
    .querySelectorAll(".nav-button")
    .forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.screenTarget === name
      );
    });

  window.scrollTo({
    top: 0,
    behavior:
      data.settings.reduceMotion
        ? "auto"
        : "smooth"
  });

  if (name === "calendar") renderCalendar();
  if (name === "cycle-history") renderCycleHistory();
  if (name === "insights") renderInsights();
  if (name === "relief") renderRelief();
  if (name === "journal") renderJournal();
  if (name === "kit") renderKit();
  if (name === "going-out") renderGoingOut();
  if (name === "past-moons") renderPastMoons();
  if (name === "reports") renderReports();
  if (name === "care-profile") renderCareProfile();
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

  if (day) {
    cycleDayTitle.textContent =
      `Cycle Day ${day}`;

    cyclePhaseText.textContent =
      cyclePhase(day);
  }
  else {
    cycleDayTitle.textContent =
      "Start your first cycle";

    cyclePhaseText.textContent =
      "Log your most recent period to begin.";
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
    "startPeriodButton"
  )
  .addEventListener(
    "click",
    startPeriodToday
  );


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
   DAILY LOG
   ============================================================ */

const logDate =
  document.getElementById(
    "logDate"
  );

logDate.value =
  todayKey();


const painLevel =
  document.getElementById(
    "painLevel"
  );


painLevel.addEventListener(
  "input",
  () => {
    document
      .getElementById(
        "painOutput"
      )
      .textContent =
        painLevel.value;
  }
);


logDate.addEventListener(
  "change",
  loadLogForm
);


function getCheckedValue(name) {
  return document.querySelector(
    `input[name="${name}"]:checked`
  )?.value || "";
}


function getSymptoms() {
  return Array.from(
    document.querySelectorAll(
      'input[name="symptom"]:checked'
    )
  ).map(
    input =>
      input.value
  );
}


function clearRadioGroup(name) {
  document
    .querySelectorAll(
      `input[name="${name}"]`
    )
    .forEach(
      input => {
        input.checked = false;
      }
    );
}


function loadLogForm() {
  const saved =
    data.logs[
      logDate.value
    ] || {};

  [
    "flow",
    "mood",
    "energy",
    "sleep"
  ].forEach(
    clearRadioGroup
  );

  if (saved.flow) {
    const input =
      document.querySelector(
        `input[name="flow"][value="${saved.flow}"]`
      );

    if (input) input.checked = true;
  }

  if (saved.mood) {
    const input =
      document.querySelector(
        `input[name="mood"][value="${saved.mood}"]`
      );

    if (input) input.checked = true;
  }

  if (saved.energy) {
    const input =
      document.querySelector(
        `input[name="energy"][value="${saved.energy}"]`
      );

    if (input) input.checked = true;
  }

  if (saved.sleep) {
    const input =
      document.querySelector(
        `input[name="sleep"][value="${saved.sleep}"]`
      );

    if (input) input.checked = true;
  }

  document
    .querySelectorAll(
      'input[name="symptom"]'
    )
    .forEach(
      input => {
        input.checked =
          saved.symptoms?.includes(
            input.value
          ) || false;
      }
    );

  painLevel.value =
    saved.pain || 0;

  document
    .getElementById(
      "painOutput"
    )
    .textContent =
      painLevel.value;

  document
    .getElementById(
      "tinyJoy"
    )
    .value =
      saved.tinyJoy || "";

  document
    .getElementById(
      "dailyNotes"
    )
    .value =
      saved.notes || "";
}


document
  .getElementById(
    "dailyLogForm"
  )
  .addEventListener(
    "submit",
    event => {
      event.preventDefault();

      const key =
        logDate.value;

      if (!key) return;

      data.logs[key] = {
        ...(data.logs[key] || {}),
        flow:
          getCheckedValue("flow") || "None",
        pain:
          Number(
            painLevel.value
          ),
        mood:
          getCheckedValue("mood"),
        energy:
          getCheckedValue("energy"),
        sleep:
          getCheckedValue("sleep"),
        symptoms:
          getSymptoms(),
        tinyJoy:
          document
            .getElementById(
              "tinyJoy"
            )
            .value
            .trim(),
        notes:
          document
            .getElementById(
              "dailyNotes"
            )
            .value
            .trim()
      };

      saveData();
      renderEverything();

      showToast(
        "Your check-in is saved 🌸"
      );
    }
  );


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


function renderCalendar() {
  const grid =
    document.getElementById(
      "calendarGrid"
    );

  grid.innerHTML = "";

  const year =
    calendarDate.getFullYear();

  const month =
    calendarDate.getMonth();

  document
    .getElementById(
      "calendarMonthTitle"
    )
    .textContent =
      new Date(
        year,
        month,
        1
      )
      .toLocaleDateString(
        undefined,
        {
          month: "long",
          year: "numeric"
        }
      );

  const firstDay =
    new Date(
      year,
      month,
      1
    )
    .getDay();

  const numberOfDays =
    new Date(
      year,
      month + 1,
      0
    )
    .getDate();

  for (
    let i = 0;
    i < firstDay;
    i++
  ) {
    grid.appendChild(
      document.createElement(
        "div"
      )
    );
  }

  const prediction =
    estimatedWindow();

  for (
    let day = 1;
    day <= numberOfDays;
    day++
  ) {
    const date =
      new Date(
        year,
        month,
        day
      );

    const key =
      dateKey(date);

    const button =
      document.createElement(
        "button"
      );

    button.className =
      "calendar-day";

    button.textContent =
      day;

    if (
      key === todayKey()
    ) {
      button.classList.add(
        "today"
      );
    }

    const matchingPeriod =
      periodForDate(key);

    if (matchingPeriod) {
      button.classList.add(
        "period-range"
      );

      if (
        matchingPeriod.start === key
      ) {
        button.classList.add(
          "period-start"
        );
      }

      if (!matchingPeriod.end) {
        button.classList.add(
          "open-period"
        );
      }
    }
    else if (
      prediction &&
      dateWithin(
        date,
        prediction.start,
        prediction.end
      )
    ) {
      button.classList.add(
        "predicted"
      );
    }

    if (data.logs[key]) {
      button.classList.add(
        "logged"
      );
    }

    button.addEventListener(
      "click",
      () => {
        logDate.value = key;
        loadLogForm();
        showScreen("log");
      }
    );

    grid.appendChild(
      button
    );
  }
}


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
      .slice(0, 2);

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
    const name = document.getElementById("tripName").value.trim() || "Trip / event";
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
    data.trips.unshift({ id: uid(), name, start, end });
    saveData();
    document.getElementById("tripName").value = "";
    document.getElementById("tripStart").value = "";
    document.getElementById("tripEnd").value = "";
    renderTripOverlay();
    showToast("Trip added to your cycle overlay ✈️");
  });

function tripPeriodOverlap(trip) {
  const estimate = estimatedWindow();
  if (!estimate) return false;
  const start = parseDate(trip.start);
  const end = parseDate(trip.end);
  return start <= estimate.end && end >= estimate.start;
}

function renderTripOverlay() {
  const container = document.getElementById("tripOverlay");
  if (!container) return;
  if (!data.trips.length) {
    container.innerHTML = `<article class="soft-note">Save a trip, event, workday, or date and Tsuki will compare it with your estimated period window.</article>`;
    return;
  }
  container.innerHTML = data.trips.slice(0, 8).map(trip => {
    const overlap = tripPeriodOverlap(trip);
    return `<article class="trip-overlay-card ${overlap ? "overlap" : "clear"}"><div><strong>${escapeHTML(trip.name)}</strong><small>${formatDate(parseDate(trip.start))}${trip.end !== trip.start ? `–${formatDate(parseDate(trip.end))}` : ""}</small><p>${overlap ? "🌙 This overlaps your current estimated period window. Consider your Moon Bag and saved comfort actions." : "✨ No overlap with your current estimated period window."}</p></div><button type="button" data-delete-trip="${trip.id}">×</button></article>`;
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
   SETTINGS
   ============================================================ */

function loadSettingsUI() {
  document
    .getElementById(
      "settingsCycleLength"
    )
    .value =
      data.settings.cycleLength;

  document
    .getElementById(
      "settingsPeriodLength"
    )
    .value =
      data.settings.periodLength;

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
          "This backup contains private cycle and wellness information. Continue?"
        )
      ) {
        return;
      }

      const exportData = {
        app: "Tsuki",
        version: 4,
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

      showToast(
        "Private backup created 🌙"
      );
    }
  );


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
      `${greeting} 🌸`;
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
  window.addEventListener(
    "load",
    () => {
      navigator.serviceWorker
        .register(
          "./service-worker.js"
        )
        .catch(
          error => {
            console.error(
              "Service worker registration failed:",
              error
            );
          }
        );
    }
  );
}


/* ============================================================
   RENDER EVERYTHING
   ============================================================ */

function renderEverything() {
  renderGreeting();
  renderToday();
  renderCalendar();
  renderCycleHistory();
  renderInsights();
  renderRelief();
  renderJournal();
  renderKit();
  renderGoingOut();
  renderPastMoons();
  renderReports();
  renderCareProfile();
}


/* ============================================================
   INIT
   ============================================================ */

function init() {
  loadSettingsUI();
  applySettings();
  loadLogForm();
  renderEverything();
  updateOnlineStatus();
}


init();