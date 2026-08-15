/* ============================================================
   TSUKI 7.6 — BODY SIGNALS
   Personal pre-period signal learning based on actual period starts.
   Observational only: never diagnoses a condition or confirms when a period
   will begin. Self-identified signals and learned evidence stay distinct.
   ============================================================ */

(() => {
  const PRE_PERIOD_DAYS = 7;
  const BASELINE_LOOKBACK_DAYS = 35;
  const RECENT_SIGNAL_DAYS = 3;

  const strengthRank = {
    learning: 0,
    emerging: 1,
    common: 2,
    strong: 3
  };

  const coreDefinitions = [
    { id: "spotting", label: "Spotting", icon: "🩸", group: "Bleeding", watchable: true, test: log => log?.flow === "Spotting" },
    { id: "light-bleeding", label: "Light bleeding", icon: "🩸", group: "Bleeding", watchable: false, test: log => log?.flow === "Light" },
    { id: "cramps", label: "Cramps / pelvic discomfort", icon: "🌿", group: "Body", watchable: true, test: log => Number(log?.pain || 0) > 0 },
    { id: "bloating", label: "Bloating", icon: "🫧", group: "Body", watchable: true, symptom: "Bloating" },
    { id: "back-pain", label: "Back pain", icon: "🌿", group: "Body", watchable: true, symptom: "Back Pain" },
    { id: "tender-breasts", label: "Tender breasts", icon: "🌸", group: "Body", watchable: true, symptom: "Tender Breasts" },
    { id: "breast-fullness", label: "Breast fullness", icon: "🌸", group: "Body", watchable: true, symptom: "Breast Fullness" },
    { id: "pelvic-heaviness", label: "Pelvic heaviness / pressure", icon: "🌙", group: "Body", watchable: true, symptom: "Pelvic Heaviness" },
    { id: "water-retention", label: "Puffiness / water retention", icon: "💧", group: "Body", watchable: true, symptom: "Water Retention" },
    { id: "body-aches", label: "Body aches", icon: "🌿", group: "Body", watchable: true, symptom: "Body Aches" },
    { id: "fatigue", label: "Fatigue", icon: "💤", group: "Body", watchable: true, symptom: "Fatigue" },
    { id: "nausea", label: "Nausea", icon: "🍵", group: "Body", watchable: true, symptom: "Nausea" },
    { id: "feeling-warmer", label: "Feeling warmer", icon: "🌡️", group: "Body", watchable: true, symptom: "Feeling Warmer" },

    { id: "headache", label: "Headache", icon: "☁️", group: "Head & focus", watchable: true, symptom: "Headache" },
    { id: "migraine", label: "Migraine", icon: "🌧️", group: "Head & focus", watchable: true, symptom: "Migraine" },
    { id: "brain-fog", label: "Brain fog", icon: "🌫️", group: "Head & focus", watchable: true, symptom: "Brain Fog" },
    { id: "low-focus", label: "Low focus", icon: "🌫️", group: "Head & focus", watchable: false, test: log => log?.focus === "Low" },
    { id: "low-motivation", label: "Low motivation", icon: "🫧", group: "Head & focus", watchable: false, test: log => log?.motivation === "Low" },

    { id: "acne", label: "Acne / breakouts", icon: "✨", group: "Skin", watchable: true, symptom: "Acne" },
    { id: "oily-skin", label: "Oilier skin", icon: "✨", group: "Skin", watchable: true, symptom: "Oily Skin" },
    { id: "dry-sensitive-skin", label: "Dry / sensitive skin", icon: "🌸", group: "Skin", watchable: true, symptom: "Dry Sensitive Skin" },

    { id: "constipation", label: "Constipation", icon: "🌿", group: "Bowel", watchable: true, symptom: "Constipation" },
    { id: "loose-stools", label: "Loose stools", icon: "🌿", group: "Bowel", watchable: true, symptom: "Loose Stools" },
    { id: "frequent-stools", label: "More frequent bowel movements", icon: "🌿", group: "Bowel", watchable: true, symptom: "Frequent Stools" },
    { id: "gas", label: "More gas", icon: "🫧", group: "Bowel", watchable: true, symptom: "Gas" },

    { id: "cravings", label: "Cravings", icon: "🍓", group: "Appetite", watchable: true, test: log => ["Mild", "Strong"].includes(log?.cravingIntensity) || (Array.isArray(log?.symptoms) && log.symptoms.includes("Cravings")) },
    { id: "higher-appetite", label: "Higher appetite", icon: "🍓", group: "Appetite", watchable: true, test: log => log?.appetite === "High" },
    { id: "lower-appetite", label: "Lower appetite", icon: "🍵", group: "Appetite", watchable: true, test: log => log?.appetite === "Low" },

    { id: "poor-sleep", label: "Poor sleep", icon: "🌙", group: "Sleep & energy", watchable: true, test: log => log?.sleep === "Poor" },
    { id: "low-energy", label: "Low energy", icon: "🔋", group: "Sleep & energy", watchable: true, test: log => log?.energy === "Low" },

    { id: "irritable", label: "Irritability", icon: "💗", group: "Mood", watchable: true, test: log => bodySignalMoods(log).includes("Irritable") },
    { id: "anxious", label: "Anxious", icon: "💗", group: "Mood", watchable: true, test: log => bodySignalMoods(log).includes("Anxious") },
    { id: "emotional", label: "More emotional / tearful", icon: "💗", group: "Mood", watchable: true, test: log => bodySignalMoods(log).includes("Emotional") },
    { id: "sad", label: "Low / sad mood", icon: "💗", group: "Mood", watchable: true, test: log => bodySignalMoods(log).includes("Sad") },
    { id: "high-stress", label: "High stress", icon: "☁️", group: "Mood", watchable: true, test: log => log?.stress === "High" },

    { id: "discharge-change", label: "Discharge changes", icon: "💧", group: "Other", watchable: true, test: log => Boolean(log?.discharge) },
    { id: "creamy-discharge", label: "Creamy discharge", icon: "💧", group: "Other", watchable: false, test: log => log?.discharge === "Creamy" },
    { id: "watery-discharge", label: "Watery discharge", icon: "💧", group: "Other", watchable: false, test: log => log?.discharge === "Watery" },
    { id: "sticky-discharge", label: "Sticky discharge", icon: "💧", group: "Other", watchable: false, test: log => log?.discharge === "Sticky" },
    { id: "dry-discharge", label: "Dry discharge pattern", icon: "💧", group: "Other", watchable: false, test: log => log?.discharge === "Dry" },
    { id: "slippery-discharge", label: "Slippery / stretchy discharge", icon: "💧", group: "Other", watchable: false, test: log => log?.discharge === "Slippery / stretchy" },
    { id: "lower-libido", label: "Lower libido", icon: "💕", group: "Other", watchable: true, test: log => log?.libido === "Low" },
    { id: "higher-libido", label: "Higher libido", icon: "💕", group: "Other", watchable: true, test: log => log?.libido === "High" }
  ];

  function bodySignalMoods(log) {
    if (Array.isArray(log?.moods)) return log.moods.filter(Boolean);
    return log?.mood ? [log.mood] : [];
  }

  function symptomSelected(log, symptom) {
    return Array.isArray(log?.symptoms) && log.symptoms.includes(symptom);
  }

  function safeSignalId(label) {
    return `custom:${encodeURIComponent(String(label || "").trim().toLowerCase())}`;
  }

  function signalDefinitions() {
    const definitions = coreDefinitions.map(definition => ({
      ...definition,
      test: definition.test || (log => symptomSelected(log, definition.symptom))
    }));

    const representedSymptoms = new Set(
      coreDefinitions
        .map(definition => definition.symptom)
        .filter(Boolean)
        .map(value => String(value).toLowerCase())
    );

    const custom = new Set(Array.isArray(data?.customSymptoms) ? data.customSymptoms.filter(Boolean) : []);
    Object.values(data?.logs || {}).forEach(log => {
      (Array.isArray(log?.symptoms) ? log.symptoms : []).forEach(symptom => {
        if (symptom) custom.add(symptom);
      });
    });

    custom.forEach(label => {
      if (representedSymptoms.has(String(label).toLowerCase())) return;
      definitions.push({
        id: safeSignalId(label),
        label: String(label),
        icon: "🌙",
        group: "My own signals",
        watchable: true,
        custom: true,
        test: log => symptomSelected(log, label)
      });
    });

    return definitions;
  }

  function ensureBodySignalSettings() {
    data.settings = data.settings || {};
    if (!Array.isArray(data.settings.periodSignalWatchlist)) {
      data.settings.periodSignalWatchlist = [];
    }
    data.settings.periodSignalWatchlist = Array.from(new Set(data.settings.periodSignalWatchlist.filter(Boolean)));
  }

  function signalSetForLog(log, definitions = signalDefinitions()) {
    const result = new Set();
    if (!log) return result;
    definitions.forEach(definition => {
      try {
        if (definition.test(log)) result.add(definition.id);
      }
      catch (_) {}
    });
    return result;
  }

  function dateMax(a, b) {
    if (!a) return b;
    if (!b) return a;
    return a > b ? a : b;
  }

  function quantile(values, q) {
    const clean = values.filter(Number.isFinite).slice().sort((a, b) => a - b);
    if (!clean.length) return null;
    if (clean.length === 1) return clean[0];
    const position = (clean.length - 1) * q;
    const base = Math.floor(position);
    const rest = position - base;
    const next = clean[base + 1];
    return next === undefined ? clean[base] : clean[base] + rest * (next - clean[base]);
  }

  function signalLeadSummary(leads) {
    const clean = leads.filter(Number.isFinite).filter(value => value >= 1 && value <= PRE_PERIOD_DAYS);
    if (!clean.length) return { text: "before your period", low: null, high: null, median: null };
    const low = clean.length >= 5 ? Math.max(1, Math.round(quantile(clean, 0.2))) : Math.min(...clean);
    const high = clean.length >= 5 ? Math.max(low, Math.round(quantile(clean, 0.8))) : Math.max(...clean);
    const median = Math.round(quantile(clean, 0.5));
    if (low === high) {
      return {
        text: `${low} day${low === 1 ? "" : "s"} before`,
        low,
        high,
        median
      };
    }
    return {
      text: `${low}–${high} days before`,
      low,
      high,
      median
    };
  }

  let bodySignalRevision = 0;
  let bodySignalCache = null;

  function invalidateBodySignalCache() {
    bodySignalRevision += 1;
    bodySignalCache = null;
  }

  function analysisStrength({ hits, observableCycles, wellObservedCycles, hitRate, baselineEnough, baselineRate, lift, preRate }) {
    const periodSpecific = hits >= 2 && (
      !baselineEnough
        ? true
        : baselineRate === 0
          ? preRate >= 0.08
          : lift >= 1.25 && preRate >= baselineRate + 0.04
    );

    if (!periodSpecific) {
      return { key: "learning", label: "Still learning", className: "emerging", periodSpecific: false };
    }

    if (
      hits >= 4 &&
      observableCycles >= 4 &&
      wellObservedCycles >= 3 &&
      hitRate >= 0.65 &&
      baselineEnough &&
      (baselineRate === 0 || lift >= 1.5)
    ) {
      return { key: "strong", label: "Strong personal signal", className: "strong", periodSpecific: true };
    }

    if (
      hits >= 3 &&
      observableCycles >= 3 &&
      hitRate >= 0.5 &&
      baselineEnough &&
      (baselineRate === 0 || lift >= 1.3)
    ) {
      return { key: "common", label: "Common signal", className: "recurring", periodSpecific: true };
    }

    if (hits >= 2 && hitRate >= 0.4) {
      return { key: "emerging", label: "Emerging signal", className: "emerging", periodSpecific: true };
    }

    return { key: "learning", label: "Still learning", className: "emerging", periodSpecific: true };
  }

  function periodSignalAnalysis() {
    ensureBodySignalSettings();
    if (bodySignalCache?.revision === bodySignalRevision) return bodySignalCache.value;

    const definitions = signalDefinitions();
    const definitionMap = new Map(definitions.map(definition => [definition.id, definition]));
    const watchlist = new Set(data.settings.periodSignalWatchlist || []);
    const periods = validPeriods();
    const today = parseDate(todayKey());

    const logEntries = Object.entries(data.logs || {})
      .map(([key, log]) => ({ key, date: parseDate(key), log: log || {} }))
      .filter(item => item.date && !Number.isNaN(item.date.getTime()) && (!today || item.date <= today))
      .sort((a, b) => a.date - b.date)
      .map(item => ({ ...item, signals: signalSetForLog(item.log, definitions) }));

    const stats = new Map(definitions.map(definition => [definition.id, {
      definition,
      hitCycles: new Set(),
      leads: [],
      preDays: 0,
      baselineDays: 0
    }]));

    const cycleRecords = [];
    let observableCycles = 0;
    let wellObservedCycles = 0;
    let totalPreLoggedDays = 0;
    let totalBaselineLoggedDays = 0;

    periods.forEach((period, index) => {
      const start = parseDate(period.start);
      if (!start || Number.isNaN(start.getTime()) || (today && start > today)) return;

      const preStart = addDays(start, -PRE_PERIOD_DAYS);
      const preEnd = addDays(start, -1);
      const previous = periods[index - 1];
      const previousEnd = previous
        ? parseDate(previous.end || ensurePeriodEnd(previous.start))
        : null;
      const baselineStart = dateMax(
        addDays(start, -BASELINE_LOOKBACK_DAYS),
        previousEnd ? addDays(previousEnd, 1) : null
      );
      const baselineEnd = addDays(start, -(PRE_PERIOD_DAYS + 1));

      const preLogs = logEntries.filter(item =>
        item.date >= preStart &&
        item.date <= preEnd &&
        !periodForDate(item.key)
      );

      if (!preLogs.length) return;

      const baselineLogs = baselineStart && baselineStart <= baselineEnd
        ? logEntries.filter(item =>
            item.date >= baselineStart &&
            item.date <= baselineEnd &&
            !periodForDate(item.key)
          )
        : [];

      observableCycles += 1;
      if (preLogs.length >= 2) wellObservedCycles += 1;
      totalPreLoggedDays += preLogs.length;
      totalBaselineLoggedDays += baselineLogs.length;

      const cycleSignalIds = new Set();
      const cycleKey = period.id || period.start;

      preLogs.forEach(item => {
        const lead = daysBetween(item.date, start);
        item.signals.forEach(id => {
          const entry = stats.get(id);
          if (!entry) return;
          entry.preDays += 1;
          entry.hitCycles.add(cycleKey);
          entry.leads.push(lead);
          cycleSignalIds.add(id);
        });
      });

      baselineLogs.forEach(item => {
        item.signals.forEach(id => {
          const entry = stats.get(id);
          if (entry) entry.baselineDays += 1;
        });
      });

      cycleRecords.push({
        periodId: cycleKey,
        start: period.start,
        preLogDays: preLogs.length,
        baselineLogDays: baselineLogs.length,
        signalIds: cycleSignalIds
      });
    });

    const baselineEnough = totalBaselineLoggedDays >= Math.max(5, observableCycles);

    const signals = Array.from(stats.values()).map(entry => {
      const hits = entry.hitCycles.size;
      const hitRate = observableCycles ? hits / observableCycles : 0;
      const preRate = totalPreLoggedDays ? entry.preDays / totalPreLoggedDays : 0;
      const baselineRate = totalBaselineLoggedDays ? entry.baselineDays / totalBaselineLoggedDays : 0;
      const lift = baselineRate > 0 ? preRate / baselineRate : (preRate > 0 ? Infinity : 0);
      const strength = analysisStrength({
        hits,
        observableCycles,
        wellObservedCycles,
        hitRate,
        baselineEnough,
        baselineRate,
        lift,
        preRate
      });
      const lead = signalLeadSummary(entry.leads);

      return {
        id: entry.definition.id,
        label: entry.definition.label,
        icon: entry.definition.icon,
        group: entry.definition.group,
        watchable: entry.definition.watchable !== false,
        custom: Boolean(entry.definition.custom),
        hits,
        observableCycles,
        wellObservedCycles,
        hitRate,
        preDays: entry.preDays,
        baselineDays: entry.baselineDays,
        preRate,
        baselineRate,
        lift,
        baselineEnough,
        strengthKey: strength.key,
        strengthLabel: strength.label,
        strengthClass: strength.className,
        periodSpecific: strength.periodSpecific,
        leadText: lead.text,
        leadLow: lead.low,
        leadHigh: lead.high,
        leadMedian: lead.median,
        selfKnown: watchlist.has(entry.definition.id)
      };
    });

    const learned = signals
      .filter(signal => signal.strengthKey !== "learning")
      .sort((a, b) =>
        strengthRank[b.strengthKey] - strengthRank[a.strengthKey] ||
        b.hits - a.hits ||
        b.preRate - a.preRate ||
        a.label.localeCompare(b.label)
      );

    const learnedIds = new Set(learned.map(signal => signal.id));
    const pairCounts = new Map();

    cycleRecords.forEach(record => {
      const ids = Array.from(record.signalIds)
        .filter(id => learnedIds.has(id))
        .sort();
      for (let left = 0; left < ids.length; left += 1) {
        for (let right = left + 1; right < ids.length; right += 1) {
          const key = `${ids[left]}::${ids[right]}`;
          const entry = pairCounts.get(key) || { ids: [ids[left], ids[right]], cycles: 0 };
          entry.cycles += 1;
          pairCounts.set(key, entry);
        }
      }
    });

    const combinations = Array.from(pairCounts.values())
      .filter(entry => entry.cycles >= 2)
      .map(entry => ({
        ...entry,
        signals: entry.ids.map(id => signals.find(signal => signal.id === id)).filter(Boolean),
        strength: entry.cycles >= 4 ? "strong" : entry.cycles >= 3 ? "common" : "emerging"
      }))
      .sort((a, b) => b.cycles - a.cycles)
      .slice(0, 8);

    const value = {
      definitions,
      definitionMap,
      signals,
      learned,
      combinations,
      cycleRecords,
      observableCycles,
      wellObservedCycles,
      totalPreLoggedDays,
      totalBaselineLoggedDays,
      baselineEnough
    };

    bodySignalCache = { revision: bodySignalRevision, value };
    return value;
  }

  function recentSignalState(days = RECENT_SIGNAL_DAYS) {
    const analysis = periodSignalAnalysis();
    const definitions = analysis.definitions;
    const end = parseDate(todayKey());
    const start = addDays(end, -(Math.max(1, days) - 1));
    const active = new Map();

    Object.entries(data.logs || {}).forEach(([key, log]) => {
      const date = parseDate(key);
      if (!date || date < start || date > end || periodForDate(key)) return;
      const daysAgo = daysBetween(date, end);
      signalSetForLog(log, definitions).forEach(id => {
        const existing = active.get(id);
        if (!existing || daysAgo < existing.daysAgo) {
          active.set(id, { id, daysAgo, key });
        }
      });
    });

    return active;
  }

  function recentlyFinishedPeriod() {
    const latest = latestPeriod();
    if (!latest) return false;
    const start = parseDate(latest.start);
    if (!start) return false;
    const since = daysBetween(start, parseDate(todayKey()));
    return since >= 0 && since <= Math.max(7, configuredPeriodLength() + 2);
  }

  function currentPeriodSignalMatch() {
    if (data.mode !== "cycle" || data.settings.hideDetails || periodForDate(todayKey()) || recentlyFinishedPeriod()) {
      return null;
    }

    const analysis = periodSignalAnalysis();
    const active = recentSignalState();
    const watchlist = new Set(data.settings.periodSignalWatchlist || []);

    const learnedMatches = analysis.learned
      .filter(signal => active.has(signal.id))
      .sort((a, b) => strengthRank[b.strengthKey] - strengthRank[a.strengthKey] || b.hits - a.hits);

    const watchedMatches = analysis.signals
      .filter(signal => watchlist.has(signal.id) && active.has(signal.id) && !learnedMatches.some(item => item.id === signal.id));

    const combinationMatches = analysis.combinations
      .filter(combo => combo.ids.every(id => active.has(id)))
      .sort((a, b) => b.cycles - a.cycles);

    const strong = learnedMatches.filter(signal => signal.strengthKey === "strong").length;
    const common = learnedMatches.filter(signal => signal.strengthKey === "common").length;
    const emerging = learnedMatches.filter(signal => signal.strengthKey === "emerging").length;

    let mode = "none";
    if (combinationMatches.some(combo => combo.cycles >= 3) || strong >= 1 || common >= 2 || (common >= 1 && (emerging + watchedMatches.length) >= 1)) {
      mode = "familiar";
    }
    else if (learnedMatches.length >= 2) {
      mode = "emerging";
    }
    else if (watchedMatches.length) {
      mode = "watching";
    }

    if (mode === "none") return null;

    return {
      mode,
      learnedMatches,
      watchedMatches,
      combinationMatches,
      active,
      analysis
    };
  }

  function calendarSignalContextText() {
    const windowData = estimatedWindow();
    if (!windowData) return "";
    const today = parseDate(todayKey());
    if (!today) return "";
    const daysToStart = daysBetween(today, windowData.start);
    if (today >= windowData.start && today <= windowData.end) {
      return " You are also within your estimated period window.";
    }
    if (daysToStart >= 0 && daysToStart <= 7) {
      return " Your estimated period window is also nearby.";
    }
    return "";
  }

  function currentSignalCopy(match) {
    if (!match) return null;
    const learned = match.learnedMatches.slice(0, 3);
    const watched = match.watchedMatches.slice(0, 2);
    const names = [...learned, ...watched].slice(0, 3).map(signal => signal.label);
    const calendarText = calendarSignalContextText();

    if (match.mode === "familiar") {
      const lead = learned[0]?.leadText ? ` ${learned[0].label} has often appeared ${learned[0].leadText} actual period starts.` : "";
      return {
        title: "Your period may be getting closer",
        text: `${names.join(" + ")} ${names.length === 1 ? "matches" : "match"} signals that have shown up in your own pre-period history.${lead}${calendarText} Tsuki does not change your forecast date from symptoms alone.`,
        tone: "familiar"
      };
    }

    if (match.mode === "emerging") {
      return {
        title: "A familiar lead-up may be forming",
        text: `${names.join(" + ")} have shown up before some of your actual periods. Tsuki needs more repeated history before treating this as a stronger personal signal.${calendarText}`,
        tone: "emerging"
      };
    }

    return {
      title: "A signal you watch is showing up",
      text: `${names.join(" + ")} ${names.length === 1 ? "is" : "are"} on the list you told Tsuki to watch. That is your own observation, not learned evidence yet. Tsuki will keep checking whether it repeats before future periods.`,
      tone: "watching"
    };
  }

  function periodSignalInsightObjects() {
    const analysis = periodSignalAnalysis();
    return analysis.learned.slice(0, 5).map(signal => ({
      id: `period-signal:${signal.id}`,
      icon: signal.icon,
      title: `${signal.label} is ${signal.strengthKey === "strong" ? "one of your stronger" : signal.strengthKey === "common" ? "one of your recurring" : "an emerging"} pre-period signal${signal.strengthKey === "emerging" ? "" : "s"}`,
      text: `You logged ${signal.label.toLowerCase()} before ${signal.hits} of ${signal.observableCycles} actual period starts with nearby check-ins. It most often appeared ${signal.leadText}. Tsuki also compared it with your ordinary logged days so common all-month symptoms are less likely to be mistaken for period clues.`,
      cycles: signal.hits,
      observations: signal.preDays,
      category: "period-signal",
      confidence: {
        label: signal.strengthLabel,
        className: signal.strengthClass
      }
    }));
  }

  function formatSignalEvidence(signal) {
    const comparison = signal.baselineEnough
      ? signal.baselineRate === 0
        ? "It did not appear in the ordinary comparison days available for these cycles."
        : signal.lift >= 2
          ? "It was much more concentrated in the week before your periods than on ordinary logged days."
          : "It was more concentrated before your periods than on ordinary logged days."
      : "Tsuki needs more ordinary-day check-ins to strengthen the baseline comparison.";

    return `Seen before ${signal.hits} of ${signal.observableCycles} actual period starts with nearby check-ins. ${comparison}`;
  }

  function renderPeriodSignalTodayCard() {
    const card = document.getElementById("periodSignalTodayCard");
    if (!card) return;

    const todayLog = data.logs?.[todayKey()] || {};
    const unconfirmedBleeding = !periodForDate(todayKey()) && ["Light", "Medium", "Heavy"].includes(todayLog.flow);

    if (data.mode !== "cycle" || data.settings.hideDetails) {
      card.classList.add("hidden");
      return;
    }

    if (unconfirmedBleeding) {
      card.classList.remove("hidden");
      card.dataset.signalTone = "bleeding";
      document.getElementById("periodSignalTodayTitle").textContent = "Bleeding is logged today";
      document.getElementById("periodSignalTodayText").textContent = "Tsuki has not assumed this means your period started. Open your check-in if you want to confirm a period or keep it as a separate bleeding observation.";
      document.getElementById("periodSignalTodayChips").innerHTML = `<span>🩸 ${escapeHTML(todayLog.flow)} bleeding</span>`;
      return;
    }

    const match = currentPeriodSignalMatch();
    const copy = currentSignalCopy(match);
    if (!match || !copy) {
      card.classList.add("hidden");
      return;
    }

    const chips = [...match.learnedMatches, ...match.watchedMatches]
      .filter((signal, index, list) => list.findIndex(item => item.id === signal.id) === index)
      .slice(0, 4);

    card.classList.remove("hidden");
    card.dataset.signalTone = copy.tone;
    document.getElementById("periodSignalTodayTitle").textContent = copy.title;
    document.getElementById("periodSignalTodayText").textContent = copy.text;
    document.getElementById("periodSignalTodayChips").innerHTML = chips.map(signal => `<span>${signal.icon} ${escapeHTML(signal.label)}</span>`).join("");
  }

  function renderBleedingPeriodPrompt() {
    const prompt = document.getElementById("bleedingPeriodPrompt");
    if (!prompt) return;
    const key = logDate?.value || todayKey();
    const log = data.logs?.[key];
    const meaningful = log && ["Light", "Medium", "Heavy"].includes(log.flow);
    const show = Boolean(meaningful && !periodForDate(key) && log.bleedingContext !== "not-period");
    prompt.classList.toggle("hidden", !show);
    if (show) {
      const flow = document.getElementById("bleedingPeriodPromptFlow");
      if (flow) flow.textContent = `${log.flow} bleeding is saved for ${formatDate(parseDate(key))}.`;
    }
  }

  function renderCalendarSignalMarkers() {
    document.querySelectorAll("#calendarGrid [data-date]").forEach(button => {
      const key = button.dataset.date;
      const log = data.logs?.[key];
      button.classList.remove("spotting-day", "bleeding-observation-day");
      if (!log || periodForDate(key)) return;
      if (log.flow === "Spotting") button.classList.add("spotting-day");
      else if (["Light", "Medium", "Heavy"].includes(log.flow)) button.classList.add("bleeding-observation-day");
    });
  }

  function decorateDayDetailSignals(key) {
    const log = data.logs?.[key];
    if (!log) return;
    const chips = document.querySelector("#dayDetailContent .day-detail-chips");
    const preview = document.querySelector("#dayDetailContent .day-log-preview");
    if (!chips) return;

    if (log.flow === "Spotting" && !periodForDate(key)) {
      chips.insertAdjacentHTML("beforeend", "<span>🩸 Spotting</span>");
    }
    else if (["Light", "Medium", "Heavy"].includes(log.flow) && !periodForDate(key)) {
      chips.insertAdjacentHTML("beforeend", `<span>🩸 ${escapeHTML(log.flow)} bleeding observation</span>`);
    }

    if (Number(log.pain || 0) > 0 && !periodForDate(key)) {
      chips.insertAdjacentHTML("beforeend", `<span>🌿 Pelvic discomfort ${Number(log.pain)}/4</span>`);
    }

    if (preview && log.flow && log.flow !== "None" && periodForDate(key)) {
      preview.insertAdjacentHTML("afterbegin", `<p>🩸 ${escapeHTML(log.flow)} flow</p>`);
    }
  }

  function signalCardHTML(signal) {
    const watched = signal.selfKnown ? '<span class="period-signal-source">You told Tsuki to watch this</span>' : "";
    return `
      <article class="period-signal-card">
        <div class="period-signal-card-top">
          <span class="period-signal-icon">${signal.icon}</span>
          <div>
            <h4>${escapeHTML(signal.label)}</h4>
            <p>${escapeHTML(signal.leadText)} actual period starts</p>
          </div>
          <span class="period-signal-strength ${signal.strengthClass}">${escapeHTML(signal.strengthLabel)}</span>
        </div>
        ${watched}
        <p class="period-signal-evidence">${escapeHTML(formatSignalEvidence(signal))}</p>
        <details>
          <summary>Why Tsuki thinks this</summary>
          <p>Tsuki looks only at dates you actually recorded. It compares the ${PRE_PERIOD_DAYS} days before actual period starts with ordinary logged days from the same cycle history. It does not infer a cause, diagnose PMS or PCOS, or confirm when your next period will start.</p>
        </details>
      </article>
    `;
  }

  function renderPeriodSignalWatchlist(analysis) {
    const container = document.getElementById("periodSignalWatchlistGrid");
    if (!container) return;

    const watchlist = new Set(data.settings.periodSignalWatchlist || []);
    const groups = new Map();
    analysis.definitions
      .filter(definition => definition.watchable !== false)
      .forEach(definition => {
        if (!groups.has(definition.group)) groups.set(definition.group, []);
        groups.get(definition.group).push(definition);
      });

    container.innerHTML = Array.from(groups.entries()).map(([group, definitions]) => `
      <section class="period-signal-watch-group">
        <small>${escapeHTML(group)}</small>
        <div class="period-signal-watch-chips">
          ${definitions.map(definition => `
            <label>
              <input type="checkbox" data-period-signal-watch="${escapeHTML(definition.id)}" ${watchlist.has(definition.id) ? "checked" : ""}>
              <span>${definition.icon} ${escapeHTML(definition.label)}</span>
            </label>
          `).join("")}
        </div>
      </section>
    `).join("");

    container.querySelectorAll("[data-period-signal-watch]").forEach(input => {
      input.addEventListener("change", () => {
        const next = new Set(data.settings.periodSignalWatchlist || []);
        if (input.checked) next.add(input.dataset.periodSignalWatch);
        else next.delete(input.dataset.periodSignalWatch);
        data.settings.periodSignalWatchlist = Array.from(next);
        saveData();
        renderPeriodSignalsScreen();
        renderPeriodSignalTodayCard();
        showToast(input.checked ? "Tsuki will keep an eye on that signal 🌙" : "Removed from your signal watchlist");
      });
    });
  }

  function renderPeriodSignalsScreen() {
    const learnedContainer = document.getElementById("periodSignalLearnedList");
    if (!learnedContainer) return;

    ensureBodySignalSettings();
    const analysis = periodSignalAnalysis();
    const current = document.getElementById("periodSignalCurrentState");
    const stats = document.getElementById("periodSignalLearningStats");
    const combo = document.getElementById("periodSignalCombinationList");

    if (data.mode !== "cycle") {
      learnedContainer.innerHTML = '<article class="soft-note">My Period Signals is a Cycle Mode tool. Pregnancy and Postpartum data are kept separate and are never interpreted as pre-period signals.</article>';
      if (current) current.innerHTML = "";
      if (stats) stats.innerHTML = "";
      if (combo) combo.innerHTML = "";
      renderPeriodSignalWatchlist(analysis);
      return;
    }

    const match = currentPeriodSignalMatch();
    const copy = currentSignalCopy(match);
    if (current) {
      current.innerHTML = copy
        ? `<span>🌙</span><div><p class="eyebrow">RIGHT NOW</p><h3>${escapeHTML(copy.title)}</h3><p>${escapeHTML(copy.text)}</p></div>`
        : `<span>🌙</span><div><p class="eyebrow">RIGHT NOW</p><h3>Tsuki is listening</h3><p>No strong familiar pre-period signal is showing in your last ${RECENT_SIGNAL_DAYS} days of check-ins. That is useful information too.</p></div>`;
    }

    if (stats) {
      stats.innerHTML = `
        <div><small>Period starts with nearby check-ins</small><strong>${analysis.observableCycles}</strong></div>
        <div><small>Pre-period check-in days compared</small><strong>${analysis.totalPreLoggedDays}</strong></div>
        <div><small>Ordinary comparison days</small><strong>${analysis.totalBaselineLoggedDays}</strong></div>
        <div><small>Signals learned so far</small><strong>${analysis.learned.length}</strong></div>
      `;
    }

    if (!analysis.learned.length) {
      learnedContainer.innerHTML = `
        <article class="period-signal-empty">
          <span>🌱</span>
          <div>
            <h3>Tsuki is still learning your lead-up</h3>
            <p>Daily check-ins in the week before actual periods are especially useful. Tsuki needs repeated evidence across more than one period before it calls something a personal signal.</p>
          </div>
        </article>
      `;
    }
    else {
      learnedContainer.innerHTML = analysis.learned.map(signalCardHTML).join("");
    }

    if (combo) {
      combo.innerHTML = analysis.combinations.length
        ? analysis.combinations.slice(0, 5).map(item => `
            <article class="period-signal-combo">
              <span>${item.signals.map(signal => signal.icon).join("")}</span>
              <div><strong>${item.signals.map(signal => escapeHTML(signal.label)).join(" + ")}</strong><p>These showed up in the same pre-period week before ${item.cycles} actual periods.</p></div>
            </article>
          `).join("")
        : '<p class="muted small-text">Tsuki needs more repeated lead-up combinations before it shows one here.</p>';
    }

    renderPeriodSignalWatchlist(analysis);
  }

  function renderPeriodSignalReportCard() {
    const container = document.getElementById("reportSummary");
    if (!container) return;
    container.querySelector("#periodSignalReportCard")?.remove();

    const analysis = periodSignalAnalysis();
    if (!analysis.observableCycles && !analysis.learned.length) return;

    const spottingDays = Object.entries(data.logs || {}).filter(([key, log]) => log?.flow === "Spotting" && !periodForDate(key)).length;
    const card = document.createElement("article");
    card.id = "periodSignalReportCard";
    card.className = "report-card period-signal-report-card period-signal-private";
    card.innerHTML = `
      <h3>My Period Signals 🌙</h3>
      <div class="report-row"><span>Period starts with nearby check-ins</span><strong>${analysis.observableCycles}</strong></div>
      <div class="report-row"><span>Learned pre-period signals</span><strong>${analysis.learned.length}</strong></div>
      <div class="report-row"><span>Spotting observations outside saved periods</span><strong>${spottingDays}</strong></div>
      ${analysis.learned.slice(0, 5).map(signal => `<div class="report-row"><span>${signal.icon} ${escapeHTML(signal.label)}</span><strong>${escapeHTML(signal.leadText)}</strong></div>`).join("")}
      <p class="muted small-text">Tsuki compares actual pre-period logs with your own ordinary logged days. These are personal observations, not diagnoses or guarantees about when bleeding will start.</p>
    `;
    container.appendChild(card);
  }

  function renderBetweenMoonsPeriodSignals() {
    if (!usesVeryInfrequentCycle?.() || data.mode !== "cycle") return;
    const container = document.getElementById("betweenMoonsInsights");
    if (!container) return;
    const analysis = periodSignalAnalysis();
    if (!analysis.learned.length) return;

    const top = analysis.learned.slice(0, 3);
    container.insertAdjacentHTML("afterbegin", `
      <article class="between-moons-period-signals period-signal-private">
        <span>🌙</span>
        <div><strong>Your body can give clues even when the calendar cannot</strong><p>${top.map(signal => `${signal.icon} ${escapeHTML(signal.label)} (${escapeHTML(signal.leadText)})`).join(" · ")}</p><small>These come from actual recorded periods, not a guessed ovulation or monthly schedule.</small></div>
      </article>
    `);
  }

  function renderSignalAwarePrep() {
    const match = currentPeriodSignalMatch();
    if (!match || !["familiar", "emerging"].includes(match.mode)) return;
    const card = document.getElementById("beforeItHitsCard");
    if (!card) return;
    const names = match.learnedMatches.slice(0, 2).map(signal => signal.label.toLowerCase());
    const missing = data.periodKit.filter(item => !item.packed).length;
    card.innerHTML = `<span>🫧</span><div><strong>Your body signals are showing up</strong><p>${escapeHTML(names.join(" + ") || "Some familiar signals")} match part of your own pre-period history.${missing ? ` ${missing} Moon Bag item${missing === 1 ? " is" : "s are"} still not ready.` : " Your Moon Bag is ready."} Tsuki is not changing your forecast date from symptoms alone.</p></div>`;
  }

  function installDailyCheckinEnhancements() {
    const form = document.getElementById("dailyLogForm");
    if (!form) return;

    let pendingBodyDraft = null;

    form.addEventListener("submit", () => {
      const key = logDate?.value || todayKey();
      const prior = data.logs?.[key] || {};
      const selectedFlow = getCheckedValue("flow") || "None";
      pendingBodyDraft = {
        key,
        flow: selectedFlow,
        pain: Number(painLevel?.value || 0),
        isPeriod: Boolean(periodForDate(key)),
        priorFlow: prior.flow || "",
        priorContext: prior.bleedingContext || ""
      };
    }, true);

    form.addEventListener("submit", () => {
      const draft = pendingBodyDraft;
      pendingBodyDraft = null;
      if (!draft || !data.logs?.[draft.key]) return;

      const saved = data.logs[draft.key];
      const meaningfulOutsideBleeding = !draft.isPeriod && ["Light", "Medium", "Heavy"].includes(draft.flow);
      const desiredContext = draft.isPeriod
        ? "period"
        : meaningfulOutsideBleeding
          ? (draft.priorFlow === draft.flow && draft.priorContext ? draft.priorContext : "unknown")
          : "";

      const changed = saved.flow !== draft.flow || Number(saved.pain || 0) !== draft.pain || (saved.bleedingContext || "") !== desiredContext;
      if (!changed) {
        renderBleedingPeriodPrompt();
        return;
      }

      saved.flow = draft.flow;
      saved.pain = draft.pain;
      saved.bleedingContext = desiredContext;
      saveData();
      renderToday();
      renderCalendar();
      renderHomeInsights();
      loadLogForm();
    });

    document.getElementById("markBleedingNotPeriod")?.addEventListener("click", () => {
      const key = logDate?.value || todayKey();
      const log = data.logs?.[key];
      if (!log) return;
      log.bleedingContext = "not-period";
      saveData();
      renderBleedingPeriodPrompt();
      renderPeriodSignalTodayCard();
      showToast("Saved as a separate bleeding observation 🌙");
    });

    document.getElementById("confirmPeriodFromBleeding")?.addEventListener("click", () => {
      const key = logDate?.value || todayKey();
      openQuickPeriodEntry("single", key);
    });
  }

  function installFunctionOverrides() {
    const baseSaveData = saveData;
    saveData = function saveData76(...args) {
      invalidateBodySignalCache();
      return baseSaveData(...args);
    };

    renderPhaseSpecificLogFields = function renderPhaseSpecificLogFields76(phase) {
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
        content.innerHTML = segmentedHTML("ovulationDiscomfort", "Mid-cycle pelvic discomfort", ["None", "Mild", "Noticeable"]);
        card.classList.remove("hidden");
        return;
      }

      content.innerHTML = "";
      card.classList.add("hidden");
    };

    const baseRenderLogPhaseUI = renderLogPhaseUI;
    renderLogPhaseUI = function renderLogPhaseUI76() {
      const phase = baseRenderLogPhaseUI();
      document.getElementById("periodFlowCard")?.classList.remove("hidden");
      document.getElementById("periodPainCard")?.classList.remove("hidden");
      return phase;
    };

    const baseLoadLogForm = loadLogForm;
    loadLogForm = function loadLogForm76() {
      const result = baseLoadLogForm();
      renderBleedingPeriodPrompt();
      return result;
    };

    const baseRenderToday = renderToday;
    renderToday = function renderToday76() {
      const result = baseRenderToday();
      renderPeriodSignalTodayCard();
      return result;
    };

    const baseRenderCalendar = renderCalendar;
    renderCalendar = function renderCalendar76() {
      const result = baseRenderCalendar();
      renderCalendarSignalMarkers();
      return result;
    };

    const baseOpenDayDetail = openDayDetail;
    openDayDetail = function openDayDetail76(key) {
      const result = baseOpenDayDetail(key);
      decorateDayDetailSignals(key);
      return result;
    };

    const baseBuildInsights = buildInsights;
    buildInsights = function buildInsights76(options = {}) {
      const base = baseBuildInsights(options);
      if (data.mode !== "cycle") return base;
      const dismissed = new Set(data.insightState?.dismissed || []);
      const additions = periodSignalInsightObjects().filter(item => options.includeDismissed || !dismissed.has(item.id));
      if (!additions.length) return base;
      const withoutLearningOnly = base.filter(item => !String(item.id || "").startsWith("learning:"));
      return Array.from(new Map([...additions, ...withoutLearningOnly].map(item => [item.id, item])).values());
    };

    const baseRenderReports = renderReports;
    renderReports = function renderReports76() {
      const result = baseRenderReports();
      renderPeriodSignalReportCard();
      return result;
    };

    if (typeof renderBeforeItHits === "function") {
      const baseRenderBeforeItHits = renderBeforeItHits;
      renderBeforeItHits = function renderBeforeItHits76() {
        const result = baseRenderBeforeItHits();
        renderSignalAwarePrep();
        return result;
      };
    }

    if (typeof renderBetweenMoons === "function") {
      const baseRenderBetweenMoons = renderBetweenMoons;
      renderBetweenMoons = function renderBetweenMoons76() {
        const result = baseRenderBetweenMoons();
        renderBetweenMoonsPeriodSignals();
        return result;
      };
    }

    const baseShowScreen = showScreen;
    showScreen = function showScreen76(screenName) {
      const result = baseShowScreen(screenName);
      if (screenName === "period-signals") renderPeriodSignalsScreen();
      return result;
    };

    const baseRenderEverything = renderEverything;
    renderEverything = function renderEverything76() {
      ensureBodySignalSettings();
      const result = baseRenderEverything();
      renderPeriodSignalTodayCard();
      if (document.querySelector('[data-screen="period-signals"]')?.classList.contains("active")) {
        renderPeriodSignalsScreen();
      }
      return result;
    };
  }

  function installStaticEvents() {
    document.getElementById("periodSignalTodayOpen")?.addEventListener("click", () => showScreen("period-signals"));
    document.getElementById("periodSignalLogToday")?.addEventListener("click", () => {
      logDate.value = todayKey();
      loadLogForm();
      showScreen("log");
    });
  }

  function installTutorialStep() {
    if (!Array.isArray(TUTORIAL_STEPS) || TUTORIAL_STEPS.some(step => step.title === "Your body has clues too")) return;
    const position = Math.max(1, TUTORIAL_STEPS.length - 2);
    TUTORIAL_STEPS.splice(position, 0, {
      icon: "🌙",
      eyebrow: "BODY SIGNALS",
      title: "Your body has clues too",
      text: "Daily Check-in can record spotting, cramps, bowel changes, breast changes, skin, headaches, discharge, mood, sleep, appetite and more. My Period Signals compares those observations with actual period starts and your ordinary baseline instead of assuming everyone has the same lead-up."
    });
  }

  function install() {
    if (window.TsukiBodySignals?.installed) return;
    ensureBodySignalSettings();
    installFunctionOverrides();
    installDailyCheckinEnhancements();
    installStaticEvents();
    installTutorialStep();

    window.TsukiBodySignals.installed = true;
    window.TsukiBodySignals.test = {
      signalDefinitions,
      signalSetForLog,
      periodSignalAnalysis,
      recentSignalState,
      currentPeriodSignalMatch,
      signalLeadSummary,
      invalidateBodySignalCache
    };
  }

  window.TsukiBodySignals = {
    installed: false,
    install,
    test: null
  };
})();
