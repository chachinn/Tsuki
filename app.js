/* ============================================================
   TSUKI 🌙
   Local-first Cycle & Body Pattern Tracker
   Version 1
   ============================================================ */

const STORAGE_KEY = "tsuki-data-v1";


/* ============================================================
   DEFAULT DATA
   ============================================================ */

const defaultData = {

  settings: {
    cycleLength: 28,
    periodLength: 5,
    sakura: true,
    reduceMotion: false,
    hideDetails: false,
    discreet: true
  },

  periodStarts: [],

  logs: {},

  relief: [],

  journal: [],

  periodKit: [
    {
      id: crypto.randomUUID(),
      name: "Pads / liners",
      packed: true
    },
    {
      id: crypto.randomUUID(),
      name: "Pain relief",
      packed: true
    },
    {
      id: crypto.randomUUID(),
      name: "Heat pack",
      packed: true
    },
    {
      id: crypto.randomUUID(),
      name: "Water bottle",
      packed: false
    },
    {
      id: crypto.randomUUID(),
      name: "Spare underwear",
      packed: false
    },
    {
      id: crypto.randomUUID(),
      name: "Wet wipes",
      packed: false
    },
    {
      id: crypto.randomUUID(),
      name: "Snacks",
      packed: false
    }
  ]

};



/* ============================================================
   STATE
   ============================================================ */

let data = loadData();

let calendarDate = new Date();

let toastTimer;



/* ============================================================
   STORAGE
   ============================================================ */

function loadData() {

  try {

    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {

      return structuredClone(defaultData);

    }

    const parsed = JSON.parse(saved);


    return {

      ...structuredClone(defaultData),

      ...parsed,

      settings: {
        ...defaultData.settings,
        ...(parsed.settings || {})
      },

      periodStarts:
        parsed.periodStarts || [],

      logs:
        parsed.logs || {},

      relief:
        parsed.relief || [],

      journal:
        parsed.journal || [],

      periodKit:
        parsed.periodKit ||
        structuredClone(defaultData.periodKit)

    };

  }

  catch (error) {

    console.error(
      "Could not load Tsuki data:",
      error
    );

    return structuredClone(defaultData);

  }

}


function saveData() {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(data)
  );

}



/* ============================================================
   DATE HELPERS
   ============================================================ */

function dateKey(date) {

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;

}


function parseDate(value) {

  if (!value) {

    return null;

  }

  const [
    year,
    month,
    day
  ] = value
    .split("-")
    .map(Number);


  return new Date(
    year,
    month - 1,
    day
  );

}


function formatDate(date) {

  if (!date) {

    return "—";

  }

  return date.toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric"
    }
  );

}


function daysBetween(
  earlier,
  later
) {

  const ms =
    later -
    earlier;

  return Math.round(
    ms / 86400000
  );

}


function todayKey() {

  return dateKey(
    new Date()
  );

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


  if (name === "calendar") {

    renderCalendar();

  }

  if (name === "insights") {

    renderInsights();

  }

  if (name === "relief") {

    renderRelief();

  }

  if (name === "journal") {

    renderJournal();

  }

  if (name === "kit") {

    renderKit();

  }

  if (name === "going-out") {

    renderGoingOut();

  }

  if (name === "reports") {

    renderReports();

  }

}


document
  .querySelectorAll(
    "[data-screen-target]"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        showScreen(
          button.dataset.screenTarget
        );

      }
    );

  });


document
  .querySelectorAll(
    "[data-open-screen]"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        showScreen(
          button.dataset.openScreen
        );

      }
    );

  });



/* ============================================================
   CYCLE HELPERS
   ============================================================ */

function sortedPeriodStarts() {

  return data.periodStarts
    .map(parseDate)
    .filter(Boolean)
    .sort(
      (a, b) =>
        a - b
    );

}


function latestPeriodStart() {

  const starts =
    sortedPeriodStarts();

  return starts.length
    ? starts[
        starts.length - 1
      ]
    : null;

}


function averageCycleLength() {

  const starts =
    sortedPeriodStarts();


  if (
    starts.length < 2
  ) {

    return Number(
      data.settings.cycleLength
    ) || 28;

  }


  const intervals = [];


  for (
    let i = 1;
    i < starts.length;
    i++
  ) {

    const difference =
      daysBetween(
        starts[i - 1],
        starts[i]
      );


    if (
      difference >= 15 &&
      difference <= 60
    ) {

      intervals.push(
        difference
      );

    }

  }


  if (!intervals.length) {

    return Number(
      data.settings.cycleLength
    ) || 28;

  }


  return Math.round(

    intervals.reduce(
      (sum, value) =>
        sum + value,
      0
    ) /
    intervals.length

  );

}


function currentCycleDay() {

  const start =
    latestPeriodStart();


  if (!start) {

    return null;

  }


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


function nextEstimatedPeriod() {

  const start =
    latestPeriodStart();


  if (!start) {

    return null;

  }


  const length =
    averageCycleLength();


  const result =
    new Date(start);


  result.setDate(
    result.getDate() +
    length
  );


  return result;

}


function estimatedWindow() {

  const estimate =
    nextEstimatedPeriod();


  if (!estimate) {

    return null;

  }


  const start =
    new Date(estimate);


  const end =
    new Date(estimate);


  start.setDate(
    start.getDate() - 2
  );


  end.setDate(
    end.getDate() + 2
  );


  return {
    start,
    end
  };

}



/* ============================================================
   PHASE LABEL
   ============================================================ */

function cyclePhase(day) {

  if (!day) {

    return "Log your period to begin";

  }


  const cycleLength =
    averageCycleLength();


  const periodLength =
    Number(
      data.settings.periodLength
    ) || 5;


  const estimatedOvulation =
    Math.max(
      periodLength + 3,
      cycleLength - 14
    );


  if (
    day <=
    periodLength
  ) {

    return "Period";

  }


  if (
    day <
    estimatedOvulation
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



/* ============================================================
   TODAY
   ============================================================ */

function renderToday() {

  const today =
    todayKey();

  const todayLog =
    data.logs[today] || {};


  const cycleDay =
    currentCycleDay();


  const cycleDayTitle =
    document.getElementById(
      "cycleDayTitle"
    );


  const cyclePhaseText =
    document.getElementById(
      "cyclePhaseText"
    );


  if (cycleDay) {

    cycleDayTitle.textContent =
      `Cycle Day ${cycleDay}`;

    cyclePhaseText.textContent =
      cyclePhase(
        cycleDay
      );

  }

  else {

    cycleDayTitle.textContent =
      "Start your first cycle";

    cyclePhaseText.textContent =
      "Log your most recent period to begin.";

  }


  const windowEstimate =
    estimatedWindow();


  const nextPeriodText =
    document.getElementById(
      "nextPeriodText"
    );


  if (windowEstimate) {

    nextPeriodText.textContent =
      `${formatDate(
        windowEstimate.start
      )} – ${formatDate(
        windowEstimate.end
      )}`;

  }

  else {

    nextPeriodText.textContent =
      "Not enough data yet";

  }


  document.getElementById(
    "todayFlow"
  ).textContent =
    todayLog.flow ||
    "None";


  document.getElementById(
    "todayMood"
  ).textContent =
    todayLog.mood ||
    "Not logged";


  document.getElementById(
    "todayEnergy"
  ).textContent =
    todayLog.energy ||
    "Not logged";


  renderHomeInsights();

}



/* ============================================================
   START PERIOD
   ============================================================ */

function startPeriodToday() {

  const today =
    todayKey();


  if (
    data.periodStarts.includes(
      today
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


  data.periodStarts.push(
    today
  );


  data.logs[today] = {

    ...(data.logs[today] || {}),

    flow:
      data.logs[today]?.flow ||
      "Medium",

    period:
      true

  };


  saveData();

  renderEverything();

  showToast(
    "New cycle started 🌙"
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

    document.getElementById(
      "painOutput"
    ).textContent =
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
      input =>
        input.checked = false
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

    if (input) {

      input.checked = true;

    }

  }


  if (saved.mood) {

    const input =
      document.querySelector(
        `input[name="mood"][value="${saved.mood}"]`
      );

    if (input) {

      input.checked = true;

    }

  }


  if (saved.energy) {

    const input =
      document.querySelector(
        `input[name="energy"][value="${saved.energy}"]`
      );

    if (input) {

      input.checked = true;

    }

  }


  if (saved.sleep) {

    const input =
      document.querySelector(
        `input[name="sleep"][value="${saved.sleep}"]`
      );

    if (input) {

      input.checked = true;

    }

  }


  document
    .querySelectorAll(
      'input[name="symptom"]'
    )
    .forEach(
      input => {

        input.checked =
          saved.symptoms
            ?.includes(
              input.value
            ) || false;

      }
    );


  painLevel.value =
    saved.pain || 0;


  document.getElementById(
    "painOutput"
  ).textContent =
    painLevel.value;


  document.getElementById(
    "dailyNotes"
  ).value =
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


      if (!key) {

        return;

      }


      data.logs[key] = {

        ...(data.logs[key] || {}),

        flow:
          getCheckedValue(
            "flow"
          ) || "None",

        pain:
          Number(
            painLevel.value
          ),

        mood:
          getCheckedValue(
            "mood"
          ),

        energy:
          getCheckedValue(
            "energy"
          ),

        sleep:
          getCheckedValue(
            "sleep"
          ),

        symptoms:
          getSymptoms(),

        notes:
          document.getElementById(
            "dailyNotes"
          ).value.trim()

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


function isDateInRange(
  date,
  start,
  end
) {

  const time =
    date.setHours(
      0,
      0,
      0,
      0
    );


  return (
    time >=
      new Date(start)
        .setHours(
          0,
          0,
          0,
          0
        )
    &&
    time <=
      new Date(end)
        .setHours(
          0,
          0,
          0,
          0
        )
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


  document.getElementById(
    "calendarMonthTitle"
  ).textContent =
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
    ).getDay();


  const numberOfDays =
    new Date(
      year,
      month + 1,
      0
    ).getDate();


  for (
    let i = 0;
    i < firstDay;
    i++
  ) {

    const blank =
      document.createElement(
        "div"
      );

    grid.appendChild(
      blank
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
      key ===
      todayKey()
    ) {

      button.classList.add(
        "today"
      );

    }


    if (
      data.periodStarts.includes(
        key
      ) ||
      data.logs[key]?.period
    ) {

      button.classList.add(
        "period"
      );

    }

    else if (
      prediction &&
      isDateInRange(
        new Date(date),
        prediction.start,
        prediction.end
      )
    ) {

      button.classList.add(
        "predicted"
      );

    }


    if (
      data.logs[key]
    ) {

      button.classList.add(
        "logged"
      );

    }


    button.addEventListener(
      "click",
      () => {

        logDate.value =
          key;

        loadLogForm();

        showScreen(
          "log"
        );

      }
    );


    grid.appendChild(
      button
    );

  }

}



/* ============================================================
   INSIGHTS
   ============================================================ */

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
          (counts[value] || 0) +
          1;

      }
    );


  const sorted =
    Object.entries(
      counts
    )
    .sort(
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

  const symptoms =
    allLogs().flatMap(
      log =>
        log.symptoms || []
    );


  return frequency(
    symptoms
  );

}


function buildInsights() {

  const logs =
    allLogs();


  const insights = [];


  if (logs.length < 3) {

    insights.push({

      icon: "🌱",

      title:
        "Tsuki is still learning",

      text:
        "Keep checking in. After a few entries, Tsuki can start showing patterns from what you log.",

      badge:
        `${logs.length} check-ins logged`

    });


    return insights;

  }


  const mood =
    commonMood();


  if (
    mood &&
    mood[1] >= 2
  ) {

    insights.push({

      icon: "💗",

      title:
        `${mood[0]} appears often`,

      text:
        `You logged ${mood[0].toLowerCase()} on ${mood[1]} recent check-ins.`,

      badge:
        "Observed in your logs"

    });

  }


  const symptom =
    commonSymptom();


  if (
    symptom &&
    symptom[1] >= 2
  ) {

    insights.push({

      icon: "🌸",

      title:
        `${symptom[0]} keeps appearing`,

      text:
        `You logged ${symptom[0].toLowerCase()} ${symptom[1]} times. Tsuki will keep watching where it appears in your cycles.`,

      badge:
        `${symptom[1]} observations`

    });

  }


  const painful =
    logs.filter(
      log =>
        Number(
          log.pain
        ) >= 3
    );


  if (
    painful.length >= 2
  ) {

    insights.push({

      icon: "☁️",

      title:
        "You’ve had a few stronger pain days",

      text:
        `You recorded stronger pain on ${painful.length} check-ins. Your Relief Tracker can help you remember what felt useful.`,

      badge:
        "Personal observation"

    });

  }


  const lowEnergy =
    logs.filter(
      log =>
        log.energy === "Low"
    );


  if (
    lowEnergy.length >= 2
  ) {

    insights.push({

      icon: "🔋",

      title:
        "Low-energy days are showing up",

      text:
        `Low energy appeared on ${lowEnergy.length} of your logged days.`,

      badge:
        "Emerging pattern"

    });

  }


  if (!insights.length) {

    insights.push({

      icon: "🌙",

      title:
        "Your rhythm is taking shape",

      text:
        "There isn’t a strong repeated pattern yet. That’s okay — Tsuki will only show patterns supported by your entries.",

      badge:
        `${logs.length} check-ins`

    });

  }


  return insights.slice(
    0,
    5
  );

}


function insightCardHTML(
  insight
) {

  return `
    <article class="insight-card">

      <div class="icon">
        ${insight.icon}
      </div>

      <h4>
        ${escapeHTML(
          insight.title
        )}
      </h4>

      <p>
        ${escapeHTML(
          insight.text
        )}
      </p>

      <span class="insight-badge">
        ${escapeHTML(
          insight.badge
        )}
      </span>

    </article>
  `;

}


function renderHomeInsights() {

  const insights =
    buildInsights();


  document.getElementById(
    "homeInsights"
  ).innerHTML =
    insights
      .slice(0, 2)
      .map(
        insightCardHTML
      )
      .join("");

}


function renderInsights() {

  const insights =
    buildInsights();


  document.getElementById(
    "insightList"
  ).innerHTML =
    insights
      .map(
        insightCardHTML
      )
      .join("");


  const average =
    averageCycleLength();


  document.getElementById(
    "averageCycleLength"
  ).textContent =
    `${average} days`;


  document.getElementById(
    "statCycleLength"
  ).textContent =
    `${average} days`;


  document.getElementById(
    "statCyclesLogged"
  ).textContent =
    data.periodStarts.length;


  const mood =
    commonMood();


  document.getElementById(
    "statMood"
  ).textContent =
    mood
      ? mood[0]
      : "—";


  const symptom =
    commonSymptom();


  document.getElementById(
    "statSymptom"
  ).textContent =
    symptom
      ? symptom[0]
      : "—";


  renderTsukiStory();

}



/* ============================================================
   TSUKI STORY
   ============================================================ */

function renderTsukiStory() {

  const logs =
    allLogs();


  const story =
    document.getElementById(
      "tsukiStory"
    );


  if (!logs.length) {

    story.innerHTML = `

      <h3>
        Your story begins here 🌙
      </h3>

      <p>
        As you check in, Tsuki will turn your entries into
        a gentle summary of the patterns you’ve noticed.
      </p>

    `;

    return;

  }


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


  story.innerHTML = `

    <h3>
      Your recent Tsuki Story 🌸
    </h3>

    <p>
      You’ve checked in
      <strong>
        ${logs.length}
      </strong>
      time${logs.length === 1 ? "" : "s"}.
    </p>

    ${
      mood
        ? `
          <p>
            💗 Your most frequently logged mood was
            <strong>
              ${escapeHTML(
                mood[0]
              )}
            </strong>.
          </p>
        `
        : ""
    }

    ${
      symptom
        ? `
          <p>
            🌸 The symptom you logged most often was
            <strong>
              ${escapeHTML(
                symptom[0]
              )}
            </strong>.
          </p>
        `
        : ""
    }

    ${
      painful
        ? `
          <p>
            ☁️ You recorded
            <strong>
              ${painful}
            </strong>
            stronger-pain day${painful === 1 ? "" : "s"}.
          </p>
        `
        : ""
    }

    <p class="muted">
      Here’s what your own entries have been telling you lately.
    </p>

  `;

}



/* ============================================================
   BAD DAY MODE
   ============================================================ */

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
            document.getElementById(
              "badDayPain"
            ).value
          ),

        medication:
          document.getElementById(
            "badDayMedication"
          ).value.trim()

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

            id:
              crypto.randomUUID(),

            date:
              todayKey(),

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
        document.getElementById(
          "reliefAction"
        ).value.trim();


      if (!action) {

        showToast(
          "Add what you tried first 🌙"
        );

        return;

      }


      data.relief.unshift({

        id:
          crypto.randomUUID(),

        date:
          todayKey(),

        action,

        helpful:
          document.getElementById(
            "reliefHelpfulness"
          ).value

      });


      document.getElementById(
        "reliefAction"
      ).value = "";


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
        document.getElementById(
          "journalText"
        ).value.trim();


      if (!text) {

        showToast(
          "Write something first 🌙"
        );

        return;

      }


      data.journal.unshift({

        id:
          crypto.randomUUID(),

        date:
          journalDate.value,

        text

      });


      document.getElementById(
        "journalText"
      ).value = "";


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
                ${escapeHTML(
                  entry.text.length > 85
                    ? entry.text.slice(
                        0,
                        85
                      ) + "…"
                    : entry.text
                )}
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


      if (!name) {

        return;

      }


      data.periodKit.push({

        id:
          crypto.randomUUID(),

        name,

        packed:
          false

      });


      input.value = "";


      saveData();

      renderKit();

      renderGoingOut();

    }
  );


function renderKit() {

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

          }
        );

      }
    );

}



/* ============================================================
   GOING OUT MODE
   ============================================================ */

function renderGoingOut() {

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
        ` Estimated next period: ${formatDate(
          next.start
        )}–${formatDate(
          next.end
        )}.`;

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
                ${item.packed
                  ? "Ready"
                  : "Not packed yet"}
              </small>

            </div>

          </article>

        `
      )
      .join("");

}



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


  const average =
    averageCycleLength();


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
        <span>
          Cycles logged
        </span>

        <strong>
          ${data.periodStarts.length}
        </strong>
      </div>

      <div class="report-row">
        <span>
          Average cycle
        </span>

        <strong>
          ${average} days
        </strong>
      </div>

      <div class="report-row">
        <span>
          Daily check-ins
        </span>

        <strong>
          ${logs.length}
        </strong>
      </div>

      <div class="report-row">
        <span>
          Most logged mood
        </span>

        <strong>
          ${mood
            ? escapeHTML(
                mood[0]
              )
            : "—"}
        </strong>
      </div>

      <div class="report-row">
        <span>
          Most logged symptom
        </span>

        <strong>
          ${symptom
            ? escapeHTML(
                symptom[0]
              )
            : "—"}
        </strong>
      </div>

      <div class="report-row">
        <span>
          Stronger pain days
        </span>

        <strong>
          ${painful}
        </strong>
      </div>

    </article>

  `;

}



/* ============================================================
   SETTINGS
   ============================================================ */

function loadSettingsUI() {

  document.getElementById(
    "settingsCycleLength"
  ).value =
    data.settings.cycleLength;


  document.getElementById(
    "settingsPeriodLength"
  ).value =
    data.settings.periodLength;


  document.getElementById(
    "sakuraToggle"
  ).checked =
    data.settings.sakura;


  document.getElementById(
    "motionToggle"
  ).checked =
    data.settings.reduceMotion;


  document.getElementById(
    "hideDetailsToggle"
  ).checked =
    data.settings.hideDetails;


  document.getElementById(
    "discreetToggle"
  ).checked =
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
          document.getElementById(
            "settingsCycleLength"
          ).value
        ) || 28;


      data.settings.periodLength =
        Number(
          document.getElementById(
            "settingsPeriodLength"
          ).value
        ) || 5;


      saveData();

      renderEverything();

      showToast(
        "Cycle settings saved 🌙"
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

        app:
          "Tsuki",

        version:
          1,

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


      if (!first) {

        return;

      }


      const second =
        confirm(
          "This cannot be undone unless you have a backup. Delete everything?"
        );


      if (!second) {

        return;

      }


      localStorage.removeItem(
        STORAGE_KEY
      );


      data =
        structuredClone(
          defaultData
        );


      saveData();

      loadSettingsUI();

      loadLogForm();

      renderEverything();

      showScreen(
        "today"
      );


      showToast(
        "Tsuki data cleared."
      );

    }
  );



/* ============================================================
   HELPERS
   ============================================================ */

function escapeHTML(value) {

  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}


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

  else if (hour < 18) {

    greeting =
      "Good afternoon";

  }


  document.getElementById(
    "greetingText"
  ).textContent =
    `${greeting} 🌸`;

}



/* ============================================================
   RENDER EVERYTHING
   ============================================================ */

function renderEverything() {

  renderGreeting();

  renderToday();

  renderCalendar();

  renderInsights();

  renderRelief();

  renderJournal();

  renderKit();

  renderGoingOut();

  renderReports();

}



/* ============================================================
   NETWORK
   ============================================================ */

function updateOnlineStatus() {

  document.getElementById(
    "offlineBanner"
  ).classList.toggle(
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
   INITIALIZATION
   ============================================================ */

function init() {

  loadSettingsUI();

  loadLogForm();

  renderEverything();

  updateOnlineStatus();

}


init();