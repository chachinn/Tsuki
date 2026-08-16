/* ============================================================
   TSUKI 🌙 — REGULAR-CYCLE MILESTONE HERO
   Rotates the Today prediction card through the next useful milestone for
   regular cycles only. Calendar ovulation timing remains an estimate.
   ============================================================ */
(() => {
  "use strict";
  if (window.TsukiCycleMilestoneHero?.installed) return;

  const VERSION = "1.0.0-pre-cycle-milestones-1";
  const $ = selector => document.querySelector(selector);

  function cyclePattern() {
    try {
      return typeof cyclePatternSetting === "function"
        ? cyclePatternSetting()
        : data?.settings?.cyclePattern || "regular";
    }
    catch (_) {
      return data?.settings?.cyclePattern || "regular";
    }
  }

  function isRegularCycle() {
    return data?.mode === "cycle" && cyclePattern() === "regular";
  }

  function safeDate(value) {
    try { return typeof parseDate === "function" ? parseDate(value) : null; }
    catch (_) { return null; }
  }

  function dayDiff(from, to) {
    try { return typeof daysBetween === "function" ? daysBetween(from, to) : null; }
    catch (_) { return null; }
  }

  function dateText(date) {
    try { return typeof formatDate === "function" ? formatDate(date) : "—"; }
    catch (_) { return "—"; }
  }

  function currentPeriodMilestone(todayKeyValue, today) {
    let period = null;
    try { period = typeof periodForDate === "function" ? periodForDate(todayKeyValue) : null; }
    catch (_) {}
    if (!period) return null;

    const start = safeDate(period.start);
    let end = safeDate(period.end);
    if (!end && start) {
      try {
        const length = Math.max(1, Number(data?.settings?.periodLength) || (typeof averagePeriodLength === "function" ? averagePeriodLength() : 5));
        end = addDays(start, length - 1);
      }
      catch (_) {}
    }
    if (!start || !end) return null;

    const remaining = Math.max(0, dayDiff(today, end) ?? 0);
    const countdown = remaining === 0
      ? "Period ending today"
      : remaining === 1
        ? "Period ending tomorrow"
        : `Period ending in ${remaining} days`;

    return {
      kind: "period",
      label: "Current period",
      primary: `${dateText(start)} – ${dateText(end)}`,
      countdown,
      badge: null
    };
  }

  function ovulationMilestone(todayKeyValue, today) {
    let timing = null;
    try { timing = typeof cycleTimingForDate === "function" ? cycleTimingForDate(todayKeyValue) : null; }
    catch (_) {}
    if (!timing?.estimatedOvulation) return null;

    const ovulation = new Date(timing.estimatedOvulation);
    const windowStart = new Date(timing.ovulationWindowStart || ovulation);
    const windowEnd = new Date(timing.ovulationWindowEnd || ovulation);

    if (today < windowStart) {
      const remaining = Math.max(0, dayDiff(today, ovulation) ?? 0);
      return {
        kind: "ovulation",
        label: "Estimated ovulation",
        primary: dateText(ovulation),
        countdown: remaining === 0
          ? "Estimated ovulation today"
          : remaining === 1
            ? "Ovulation estimate in 1 day"
            : `Ovulation estimate in ${remaining} days`,
        badge: "Calendar estimate"
      };
    }

    if (today <= windowEnd) {
      const centerDiff = dayDiff(today, ovulation) ?? 0;
      return {
        kind: "ovulation",
        label: "Estimated ovulation",
        primary: `${dateText(windowStart)} – ${dateText(windowEnd)}`,
        countdown: centerDiff === 0 ? "Estimated ovulation today" : "Estimated ovulation window now",
        badge: "Calendar estimate"
      };
    }

    return null;
  }

  function periodForecastMilestone(today) {
    let windowData = null;
    try { windowData = typeof estimatedWindow === "function" ? estimatedWindow() : null; }
    catch (_) {}
    if (!windowData?.center || !windowData?.start || !windowData?.end) return null;

    const center = new Date(windowData.center);
    const start = new Date(windowData.start);
    const end = new Date(windowData.end);
    let countdown = "Tsuki is still learning your timing";

    if (today < start) {
      const remaining = Math.max(0, dayDiff(today, center) ?? 0);
      countdown = remaining === 1 ? "Period in 1 day" : `Period in ${remaining} days`;
    }
    else if (today <= end) {
      const centerDiff = dayDiff(today, center) ?? 0;
      if (centerDiff > 0) countdown = `Period expected in ${centerDiff} day${centerDiff === 1 ? "" : "s"}`;
      else if (centerDiff === 0) countdown = "Period expected around today";
      else countdown = "Expected period window is still open";
    }
    else {
      const passed = Math.max(1, dayDiff(end, today) ?? 1);
      countdown = `Expected period window passed ${passed} day${passed === 1 ? "" : "s"} ago`;
    }

    return {
      kind: "next-period",
      label: "Next period",
      primary: `${dateText(start)} – ${dateText(end)}`,
      countdown,
      badge: "prediction"
    };
  }

  function milestoneForToday() {
    if (!isRegularCycle()) return null;
    if (typeof todayKey !== "function") return null;
    const key = todayKey();
    const today = safeDate(key);
    if (!today) return null;

    return currentPeriodMilestone(key, today)
      || ovulationMilestone(key, today)
      || periodForecastMilestone(today);
  }

  function applyBadge(mode) {
    const badge = $("#predictionConfidence");
    if (!badge) return;

    badge.classList.remove("hidden");
    if (mode === null) {
      badge.classList.add("hidden");
      return;
    }

    if (mode === "Calendar estimate") {
      badge.textContent = mode;
      badge.className = "confidence-badge confidence-low";
      badge.setAttribute("aria-label", "Calendar-based ovulation estimate; this does not confirm ovulation");
      return;
    }

    try {
      const confidence = typeof predictionConfidence === "function" ? predictionConfidence() : null;
      if (confidence) {
        badge.textContent = `${confidence.level} confidence`;
        badge.className = `confidence-badge ${confidence.className}`;
        badge.setAttribute("aria-label", "Next-period prediction confidence");
      }
    }
    catch (_) {}
  }

  function apply() {
    const milestone = milestoneForToday();
    if (!milestone) return;

    const card = $("#periodCountdownText")?.closest(".prediction-card");
    const label = card?.querySelector(".small-label");
    const primary = $("#nextPeriodText");
    const countdown = $("#periodCountdownText");

    if (label) label.textContent = milestone.label;
    if (primary) primary.textContent = milestone.primary;
    if (countdown) countdown.textContent = milestone.countdown;
    applyBadge(milestone.badge);
  }

  function wrap() {
    if (typeof renderToday === "function" && !renderToday.__cycleMilestoneWrapped) {
      const base = renderToday;
      const wrapped = function(...args) {
        const result = base.apply(this, args);
        requestAnimationFrame(apply);
        return result;
      };
      wrapped.__cycleMilestoneWrapped = true;
      renderToday = wrapped;
      window.renderToday = wrapped;
    }

    if (typeof showScreen === "function" && !showScreen.__cycleMilestoneWrapped) {
      const base = showScreen;
      const wrapped = function(name, ...args) {
        const result = base.call(this, name, ...args);
        if (name === "today") requestAnimationFrame(() => requestAnimationFrame(apply));
        return result;
      };
      wrapped.__cycleMilestoneWrapped = true;
      showScreen = wrapped;
      window.showScreen = wrapped;
    }
  }

  function install() {
    if (window.TsukiCycleMilestoneHero?.installed) return;
    wrap();
    requestAnimationFrame(() => requestAnimationFrame(apply));
    window.TsukiCycleMilestoneHero = {
      installed: true,
      version: VERSION,
      apply,
      test: { milestoneForToday }
    };
  }

  window.TsukiCycleMilestoneHero = { installed: false, version: VERSION, install };
  install();
})();
