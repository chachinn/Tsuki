/* ============================================================
   TSUKI v1 — ADAPTIVE INTELLIGENCE
   Local-only, observational personalization.
   Never rewrites forecast dates, diagnoses conditions, or uploads health data.
   ============================================================ */

(() => {
  "use strict";

  const PUBLIC_VERSION = "v1.0";
  const PRE_PERIOD_DAYS = 7;
  const BASELINE_DAYS = 35;
  const HISTORY_DAYS = 420;
  const RECENT_DAYS = 3;
  const MAX_PERIODS = 12;
  const CONTEXTS = [
    ["Travel", "✈️"],
    ["Illness", "🫧"],
    ["High stress", "☁️"],
    ["Poor sleep", "💤"],
    ["Medication / treatment change", "💊"],
    ["Major routine change", "🔄"]
  ];

  const adaptiveReleaseNotes = [
    { icon: "🧠", title: "Adaptive intelligence", text: "Tsuki now learns how your own body patterns unfold over time instead of relying only on cycle-day averages." },
    { icon: "🌙", title: "Signal sequences", text: "Repeated personal lead-up sequences can show which body change tends to appear first and what commonly follows next." },
    { icon: "🪞", title: "My Normal 2.0", text: "Your ordinary energy, sleep, mood and body-signal baseline helps Tsuki notice what is different for you without calling it abnormal." },
    { icon: "🌦️", title: "Body Signal Weather", text: "Quiet, a few familiar clues, familiar pattern forming and strong familiar lead-up summarize current evidence without inventing a period date." },
    { icon: "🧩", title: "Pattern families & drift", text: "Tsuki can recognize more than one recurring lead-up style and notice when an old signal becomes stronger, weaker or less recent." },
    { icon: "💭", title: "Smarter questions", text: "Tsuki can ask one focused question when an answer would help distinguish a real personal signal from missing data." },
    { icon: "✈️", title: "Context-aware learning", text: "Optional travel, illness, stress, sleep, treatment and routine context helps Tsuki avoid confusing context-linked changes with period-specific clues." },
    { icon: "🩸", title: "Bleeding intelligence", text: "Tsuki summarizes your recorded period duration, flow progression, spotting lead-up and cramp timing while keeping unexpected bleeding separate." },
    { icon: "🛡️", title: "Private and explainable", text: "Adaptive analysis runs on this device. Missing check-ins stay unknown, Pregnancy remains isolated, and every smart observation can explain its evidence." }
  ];

  const state = {
    installed: false,
    revision: 0,
    cache: null,
    base: {},
    contextDraft: null
  };

  const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value || {}, key);
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const mean = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  const unique = values => Array.from(new Set(values.filter(Boolean)));

  function modeValue(values) {
    const clean = values.filter(Boolean);
    if (!clean.length) return "";
    const counts = new Map();
    clean.forEach(value => counts.set(value, (counts.get(value) || 0) + 1));
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))[0]?.[0] || "";
  }

  function median(values) {
    const clean = values.filter(Number.isFinite).slice().sort((a, b) => a - b);
    if (!clean.length) return null;
    const middle = Math.floor(clean.length / 2);
    return clean.length % 2 ? clean[middle] : (clean[middle - 1] + clean[middle]) / 2;
  }

  function safeDate(value) {
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : new Date(value);
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const parts = value.split("-").map(Number);
    const result = new Date(parts[0], parts[1] - 1, parts[2]);
    return Number.isNaN(result.getTime()) ? null : result;
  }

  function dayKey(value) {
    const date = value instanceof Date ? value : safeDate(value);
    if (!date) return "";
    return dateKey(date);
  }

  function ensureSettings() {
    data.settings = data.settings || {};
    if (!data.settings.adaptiveIntelligence || typeof data.settings.adaptiveIntelligence !== "object") {
      data.settings.adaptiveIntelligence = {};
    }
    const settings = data.settings.adaptiveIntelligence;
    if (!settings.explicitAnswers || typeof settings.explicitAnswers !== "object") settings.explicitAnswers = {};
    if (!Array.isArray(settings.dismissedQuestions)) settings.dismissedQuestions = [];
    if (!settings.lastQuestionId) settings.lastQuestionId = "";
    pruneExplicitAnswers(settings);
    return settings;
  }

  function pruneExplicitAnswers(settings = ensureSettings()) {
    const cutoff = addDays(new Date(), -180);
    Object.keys(settings.explicitAnswers || {}).forEach(key => {
      const date = safeDate(key);
      if (!date || date < cutoff) delete settings.explicitAnswers[key];
    });
    const keys = Object.keys(settings.explicitAnswers || {}).sort();
    if (keys.length > 180) keys.slice(0, keys.length - 180).forEach(key => delete settings.explicitAnswers[key]);
  }

  function signalAPI() {
    return window.TsukiBodySignals?.test || null;
  }

  function definitions() {
    try { return signalAPI()?.signalDefinitions?.() || []; }
    catch (_) { return []; }
  }

  function signalPresent(log, definition) {
    if (!log || !definition) return false;
    try { return Boolean(definition.test?.(log)); }
    catch (_) { return false; }
  }

  function observableFromLog(log, definition) {
    if (!log || !definition) return false;
    const id = definition.id || "";
    if (definition.custom || definition.symptom) return Array.isArray(log.symptoms);
    if (["spotting", "light-bleeding"].includes(id)) return hasOwn(log, "flow");
    if (id === "cramps") return hasOwn(log, "pain");
    if (["low-focus"].includes(id)) return hasOwn(log, "focus");
    if (["low-motivation"].includes(id)) return hasOwn(log, "motivation");
    if (["cravings"].includes(id)) return hasOwn(log, "cravingIntensity") || Array.isArray(log.symptoms);
    if (["higher-appetite", "lower-appetite"].includes(id)) return hasOwn(log, "appetite");
    if (id === "poor-sleep") return hasOwn(log, "sleep");
    if (id === "low-energy") return hasOwn(log, "energy");
    if (["irritable", "anxious", "emotional", "sad"].includes(id)) return Array.isArray(log.moods) || hasOwn(log, "mood");
    if (id === "high-stress") return hasOwn(log, "stress");
    if (id.includes("discharge")) return hasOwn(log, "discharge");
    if (["lower-libido", "higher-libido"].includes(id)) return hasOwn(log, "libido");
    return Array.isArray(log.symptoms);
  }

  function explicitAbsence(key, id) {
    return ensureSettings().explicitAnswers?.[key]?.[id] === "absent";
  }

  function observationFor(key, log, definition) {
    if (explicitAbsence(key, definition.id)) return { observed: true, present: false, explicit: true };
    if (!observableFromLog(log, definition)) return { observed: false, present: false, explicit: false };
    return { observed: true, present: signalPresent(log, definition), explicit: false };
  }

  function dateRangeContains(period, key) {
    const date = safeDate(key);
    const start = safeDate(period?.start);
    const end = safeDate(period?.end || period?.start);
    return Boolean(date && start && end && date >= start && date <= end);
  }

  function periodStarts() {
    return validPeriods().slice(-MAX_PERIODS);
  }

  function unionObservationKeys() {
    const settings = ensureSettings();
    const cutoff = addDays(new Date(), -HISTORY_DAYS);
    return unique([
      ...Object.keys(data.logs || {}),
      ...Object.keys(settings.explicitAnswers || {})
    ]).filter(key => {
      const date = safeDate(key);
      return date && date >= cutoff && date <= new Date();
    }).sort();
  }

  function effectiveContexts(key, log) {
    const result = new Set(Array.isArray(log?.contexts) ? log.contexts.filter(Boolean) : []);
    const date = safeDate(key);
    if (date) {
      (data.trips || []).forEach(trip => {
        const start = safeDate(trip.start);
        const end = safeDate(trip.end || trip.start);
        if (start && end && date >= start && date <= end) result.add("Travel");
      });
    }
    return result;
  }

  function jaccard(a, b) {
    const left = new Set(a || []);
    const right = new Set(b || []);
    if (!left.size && !right.size) return 0;
    let intersection = 0;
    left.forEach(value => { if (right.has(value)) intersection += 1; });
    const union = new Set([...left, ...right]).size;
    return union ? intersection / union : 0;
  }

  function advancedStrength(score, cycles, hits) {
    if (cycles >= 5 && hits >= 4 && score >= 0.68) return { key: "strong", label: "Strong personal signal" };
    if (cycles >= 3 && hits >= 3 && score >= 0.52) return { key: "common", label: "Common signal" };
    if (cycles >= 2 && hits >= 2 && score >= 0.36) return { key: "emerging", label: "Emerging signal" };
    return { key: "learning", label: "Still learning" };
  }

  function buildAdaptiveAnalysis() {
    ensureSettings();
    const defs = definitions();
    const defMap = new Map(defs.map(def => [def.id, def]));
    const keys = unionObservationKeys();
    const logs = new Map(keys.map(key => [key, data.logs?.[key] || null]));
    const periods = periodStarts();
    const periodDateKeys = new Set();
    periods.forEach(period => {
      const start = safeDate(period.start);
      const end = safeDate(period.end || period.start);
      if (!start || !end) return;
      for (let d = new Date(start); d <= end; d = addDays(d, 1)) periodDateKeys.add(dateKey(d));
    });

    const cycleRecords = [];
    const signalStats = new Map(defs.map(def => [def.id, {
      definition: def,
      cyclesObserved: 0,
      hitCycles: 0,
      weightedObserved: 0,
      weightedHits: 0,
      preObservedDays: 0,
      prePresentDays: 0,
      baselineObservedDays: 0,
      baselinePresentDays: 0,
      leads: [],
      recentHits: [],
      cyclePresence: []
    }]));

    periods.forEach((period, index) => {
      const start = safeDate(period.start);
      if (!start || start > new Date()) return;
      const prior = periods[index - 1];
      const priorEnd = prior ? safeDate(prior.end || prior.start) : null;
      const baselineStartCandidate = addDays(start, -BASELINE_DAYS);
      const baselineStart = priorEnd && priorEnd > baselineStartCandidate ? addDays(priorEnd, 1) : baselineStartCandidate;
      const baselineEnd = addDays(start, -(PRE_PERIOD_DAYS + 1));
      const preStart = addDays(start, -PRE_PERIOD_DAYS);
      const preEnd = addDays(start, -1);
      const recencyWeight = Math.pow(0.82, Math.max(0, periods.length - index - 1));
      const record = { periodId: period.id || period.start, start: period.start, signalIds: new Set(), signalFirstLead: new Map(), contexts: new Set(), preKeys: [] };

      defs.forEach(def => {
        const stat = signalStats.get(def.id);
        let cycleObserved = false;
        let cycleHit = false;
        let firstLead = null;

        keys.forEach(key => {
          const date = safeDate(key);
          if (!date || periodDateKeys.has(key)) return;
          const log = logs.get(key);
          const observation = observationFor(key, log, def);
          if (!observation.observed) return;

          if (date >= preStart && date <= preEnd) {
            cycleObserved = true;
            stat.preObservedDays += 1;
            if (observation.present) {
              cycleHit = true;
              stat.prePresentDays += 1;
              const lead = daysBetween(date, start);
              stat.leads.push(lead);
              if (firstLead === null || lead > firstLead) firstLead = lead;
              record.signalIds.add(def.id);
              const previousLead = record.signalFirstLead.get(def.id);
              if (previousLead === undefined || lead > previousLead) record.signalFirstLead.set(def.id, lead);
            }
          } else if (baselineStart <= baselineEnd && date >= baselineStart && date <= baselineEnd) {
            stat.baselineObservedDays += 1;
            if (observation.present) stat.baselinePresentDays += 1;
          }
        });

        if (cycleObserved) {
          stat.cyclesObserved += 1;
          stat.weightedObserved += recencyWeight;
          stat.cyclePresence.push(cycleHit);
          stat.recentHits.push({ hit: cycleHit, weight: recencyWeight, index });
          if (cycleHit) {
            stat.hitCycles += 1;
            stat.weightedHits += recencyWeight;
          }
        }
      });

      keys.forEach(key => {
        const date = safeDate(key);
        if (!date || date < preStart || date > preEnd) return;
        record.preKeys.push(key);
        effectiveContexts(key, logs.get(key)).forEach(context => record.contexts.add(context));
      });
      if (record.preKeys.length || record.signalIds.size) cycleRecords.push(record);
    });

    const signals = Array.from(signalStats.values()).map(stat => {
      const weightedHitRate = stat.weightedObserved ? stat.weightedHits / stat.weightedObserved : 0;
      const preRate = stat.preObservedDays ? stat.prePresentDays / stat.preObservedDays : 0;
      const baselineRate = stat.baselineObservedDays ? stat.baselinePresentDays / stat.baselineObservedDays : 0;
      const specificity = stat.baselineObservedDays >= 4 ? clamp(1 - baselineRate) : 0.55;
      const lift = baselineRate > 0 ? preRate / baselineRate : (preRate > 0 ? 4 : 0);
      const liftScore = clamp((Math.min(lift, 4) - 1) / 3);
      const evidence = clamp(stat.cyclesObserved / 5);
      const falsePositivePenalty = stat.baselineObservedDays >= 4 ? clamp(1 - Math.max(0, baselineRate - preRate) * 1.5) : 0.85;
      const rawScore = (0.44 * weightedHitRate) + (0.24 * specificity) + (0.18 * liftScore) + (0.14 * evidence);
      const score = clamp(rawScore * falsePositivePenalty);
      const strength = advancedStrength(score, stat.cyclesObserved, stat.hitCycles);
      const leadValues = stat.leads.filter(value => Number.isFinite(value) && value >= 1 && value <= PRE_PERIOD_DAYS);
      const leadMedian = median(leadValues);
      const leadMin = leadValues.length ? Math.min(...leadValues) : null;
      const leadMax = leadValues.length ? Math.max(...leadValues) : null;
      const recent = stat.cyclePresence.slice(-3);
      const older = stat.cyclePresence.slice(-7, -3);
      const recentRate = recent.length ? recent.filter(Boolean).length / recent.length : null;
      const olderRate = older.length ? older.filter(Boolean).length / older.length : null;
      let drift = "stable";
      if (recent.length >= 2 && older.length >= 2 && recentRate - olderRate >= 0.34) drift = "strengthening";
      else if (recent.length >= 2 && older.length >= 2 && olderRate - recentRate >= 0.34) drift = "fading";
      const leadText = leadMedian === null
        ? "before recorded periods"
        : leadMin === leadMax
          ? `${Math.round(leadMedian)} day${Math.round(leadMedian) === 1 ? "" : "s"} before`
          : `${leadMin}–${leadMax} days before`;

      return {
        id: stat.definition.id,
        definition: stat.definition,
        label: stat.definition.label,
        icon: stat.definition.icon,
        score,
        strengthKey: strength.key,
        strengthLabel: strength.label,
        cyclesObserved: stat.cyclesObserved,
        hitCycles: stat.hitCycles,
        weightedHitRate,
        preRate,
        baselineRate,
        baselineObservedDays: stat.baselineObservedDays,
        preObservedDays: stat.preObservedDays,
        specificity,
        lift,
        drift,
        leadMedian,
        leadMin,
        leadMax,
        leadText,
        selfKnown: (data.settings.periodSignalWatchlist || []).includes(stat.definition.id)
      };
    }).sort((a, b) => b.score - a.score || b.hitCycles - a.hitCycles || a.label.localeCompare(b.label));

    const learned = signals.filter(signal => signal.strengthKey !== "learning");
    const learnedIds = new Set(learned.map(signal => signal.id));

    const daySignals = new Map();
    keys.forEach(key => {
      const log = logs.get(key);
      const ids = new Set();
      defs.forEach(def => {
        const observation = observationFor(key, log, def);
        if (observation.observed && observation.present) ids.add(def.id);
      });
      daySignals.set(key, ids);
    });

    const preCycleForDate = new Map();
    cycleRecords.forEach(record => record.preKeys.forEach(key => preCycleForDate.set(key, record.periodId)));
    const sequenceMap = new Map();
    keys.forEach((key, index) => {
      const sourceDate = safeDate(key);
      const sourceSignals = Array.from(daySignals.get(key) || []).filter(id => learnedIds.has(id));
      if (!sourceDate || !sourceSignals.length) return;
      for (let nextIndex = index + 1; nextIndex < keys.length; nextIndex += 1) {
        const nextKey = keys[nextIndex];
        const nextDate = safeDate(nextKey);
        const gap = daysBetween(sourceDate, nextDate);
        if (gap < 1) continue;
        if (gap > 4) break;
        const targetSignals = Array.from(daySignals.get(nextKey) || []).filter(id => learnedIds.has(id));
        if (!targetSignals.length) continue;
        sourceSignals.forEach(from => targetSignals.forEach(to => {
          if (from === to) return;
          const id = `${from}::${to}`;
          const entry = sequenceMap.get(id) || { id, from, to, cycleIds: new Set(), ordinary: 0, gaps: [] };
          const sourceCycle = preCycleForDate.get(key);
          const targetCycle = preCycleForDate.get(nextKey);
          if (sourceCycle && sourceCycle === targetCycle) entry.cycleIds.add(sourceCycle);
          else entry.ordinary += 1;
          entry.gaps.push(gap);
          sequenceMap.set(id, entry);
        }));
      }
    });

    const sequences = Array.from(sequenceMap.values())
      .filter(entry => entry.cycleIds.size >= 2)
      .map(entry => ({
        ...entry,
        cycles: entry.cycleIds.size,
        medianGap: Math.round(median(entry.gaps) || 1),
        fromSignal: signals.find(signal => signal.id === entry.from),
        toSignal: signals.find(signal => signal.id === entry.to),
        specificity: entry.cycleIds.size / Math.max(1, entry.cycleIds.size + entry.ordinary)
      }))
      .filter(entry => entry.specificity >= 0.35)
      .sort((a, b) => (b.cycles * b.specificity) - (a.cycles * a.specificity))
      .slice(0, 12);

    const familyCycles = cycleRecords.filter(record => record.signalIds.size >= 2);
    const clusters = [];
    familyCycles.forEach(record => {
      let best = null;
      clusters.forEach(cluster => {
        const similarity = jaccard(record.signalIds, cluster.prototype);
        if (!best || similarity > best.similarity) best = { cluster, similarity };
      });
      if (!best || (best.similarity < 0.34 && clusters.length < 3)) {
        clusters.push({ records: [record], prototype: new Set(record.signalIds) });
        return;
      }
      best.cluster.records.push(record);
      const counts = new Map();
      best.cluster.records.forEach(item => item.signalIds.forEach(id => counts.set(id, (counts.get(id) || 0) + 1)));
      best.cluster.prototype = new Set(Array.from(counts.entries()).filter(([, count]) => count / best.cluster.records.length >= 0.5).map(([id]) => id));
    });

    const families = clusters
      .filter(cluster => cluster.records.length >= 2)
      .map((cluster, index) => {
        const counts = new Map();
        cluster.records.forEach(record => record.signalIds.forEach(id => counts.set(id, (counts.get(id) || 0) + 1)));
        const commonIds = Array.from(counts.entries())
          .filter(([, count]) => count / cluster.records.length >= 0.55)
          .sort((a, b) => b[1] - a[1])
          .map(([id]) => id)
          .slice(0, 5);
        return {
          id: `family-${index + 1}`,
          cycles: cluster.records.length,
          commonIds,
          signals: commonIds.map(id => signals.find(signal => signal.id === id)).filter(Boolean),
          latestStart: cluster.records.map(record => record.start).sort().at(-1) || ""
        };
      })
      .sort((a, b) => b.cycles - a.cycles);

    const contextStats = new Map();
    keys.forEach(key => {
      if (periodDateKeys.has(key)) return;
      const log = logs.get(key);
      const contexts = effectiveContexts(key, log);
      if (!contexts.size) return;
      defs.forEach(def => {
        const observation = observationFor(key, log, def);
        if (!observation.observed) return;
        contexts.forEach(context => {
          const id = `${context}::${def.id}`;
          const entry = contextStats.get(id) || { context, signalId: def.id, observed: 0, present: 0 };
          entry.observed += 1;
          if (observation.present) entry.present += 1;
          contextStats.set(id, entry);
        });
      });
    });

    const contextInsights = [];
    contextStats.forEach(entry => {
      if (entry.observed < 3) return;
      const signal = signals.find(item => item.id === entry.signalId);
      if (!signal) return;
      let comparisonObserved = 0;
      let comparisonPresent = 0;
      keys.forEach(key => {
        if (periodDateKeys.has(key)) return;
        const log = logs.get(key);
        if (effectiveContexts(key, log).has(entry.context)) return;
        const observation = observationFor(key, log, signal.definition);
        if (!observation.observed) return;
        comparisonObserved += 1;
        if (observation.present) comparisonPresent += 1;
      });
      if (comparisonObserved < 5) return;
      const contextRate = entry.present / entry.observed;
      const comparisonRate = comparisonPresent / comparisonObserved;
      const lift = comparisonRate > 0 ? contextRate / comparisonRate : (contextRate > 0 ? 4 : 0);
      if (entry.present >= 2 && lift >= 1.5 && contextRate >= comparisonRate + 0.12) {
        contextInsights.push({ ...entry, signal, contextRate, comparisonRate, lift });
      }
    });
    contextInsights.sort((a, b) => (b.lift * b.present) - (a.lift * a.present));

    const currentKey = todayKey();
    const currentLog = data.logs?.[currentKey] || null;
    const recentKeys = keys.filter(key => {
      const date = safeDate(key);
      const today = safeDate(currentKey);
      return date && today && daysBetween(date, today) >= 0 && daysBetween(date, today) < RECENT_DAYS;
    });
    const currentIds = new Set();
    recentKeys.forEach(key => {
      const log = logs.get(key);
      defs.forEach(def => {
        const observation = observationFor(key, log, def);
        if (observation.observed && observation.present) currentIds.add(def.id);
      });
    });

    const activeLearned = learned.filter(signal => currentIds.has(signal.id));
    const sequenceMatches = sequences.filter(sequence => currentIds.has(sequence.from));
    const familyMatches = families.map(family => ({ ...family, similarity: jaccard(currentIds, family.commonIds) })).sort((a, b) => b.similarity - a.similarity);
    const evidenceScore = activeLearned.reduce((sum, signal) => sum + signal.score, 0) + (sequenceMatches[0]?.cycles || 0) * 0.12 + (familyMatches[0]?.similarity || 0) * 0.4;
    let weather = { key: "quiet", icon: "🌕", label: "Quiet", text: "Nothing especially similar to your learned lead-up is showing in the recent check-ins Tsuki can observe." };
    if (activeLearned.length >= 3 && evidenceScore >= 2.1) {
      weather = { key: "strong", icon: "🌑", label: "Strong familiar lead-up", text: "Several of your stronger personal signals are appearing together in a way Tsuki has seen before recorded periods." };
    } else if (activeLearned.length >= 2 || (activeLearned.length && sequenceMatches.length)) {
      weather = { key: "forming", icon: "🌘", label: "Familiar pattern forming", text: "More than one learned clue—or part of a familiar sequence—is showing up. Tsuki still will not turn this into an exact period date." };
    } else if (activeLearned.length || (data.settings.periodSignalWatchlist || []).some(id => currentIds.has(id))) {
      weather = { key: "clues", icon: "🌗", label: "A few familiar clues", text: "One or more things you or Tsuki watch are showing up, but the evidence is still light." };
    }

    const retrospective = { leadupDays: 0, ordinaryDays: 0 };
    keys.forEach(key => {
      if (periodDateKeys.has(key)) return;
      const ids = daySignals.get(key) || new Set();
      const weighted = learned.filter(signal => ids.has(signal.id)).reduce((sum, signal) => sum + signal.score, 0);
      if (weighted < 0.8) return;
      if (preCycleForDate.has(key)) retrospective.leadupDays += 1;
      else retrospective.ordinaryDays += 1;
    });

    const result = {
      definitions: defs,
      definitionMap: defMap,
      keys,
      logs,
      periods,
      signals,
      learned,
      sequences,
      families,
      contextInsights,
      currentIds,
      activeLearned,
      sequenceMatches,
      familyMatches,
      weather,
      retrospective,
      periodDateKeys,
      cycleRecords
    };
    return result;
  }

  function analysis() {
    if (state.cache?.revision === state.revision) return state.cache.value;
    const value = buildAdaptiveAnalysis();
    state.cache = { revision: state.revision, value };
    return value;
  }

  function invalidate() {
    state.revision += 1;
    state.cache = null;
  }

  function baselineSummary() {
    const cutoff = addDays(new Date(), -120);
    const logs = Object.entries(data.logs || {})
      .map(([key, log]) => ({ key, date: safeDate(key), log }))
      .filter(item => item.date && item.date >= cutoff && item.date <= new Date() && !periodForDate(item.key));
    const moodValues = logs.flatMap(item => Array.isArray(item.log.moods) ? item.log.moods : (item.log.mood ? [item.log.mood] : []));
    const energyValues = logs.map(item => item.log.energy).filter(Boolean);
    const sleepValues = logs.map(item => item.log.sleep).filter(Boolean);
    const appetiteValues = logs.map(item => item.log.appetite).filter(Boolean);
    const stressValues = logs.map(item => item.log.stress).filter(Boolean);
    const symptoms = logs.flatMap(item => Array.isArray(item.log.symptoms) ? item.log.symptoms : []);
    const symptomCounts = new Map();
    symptoms.forEach(value => symptomCounts.set(value, (symptomCounts.get(value) || 0) + 1));
    const commonSymptoms = Array.from(symptomCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const today = data.logs?.[todayKey()] || null;
    const deviations = [];
    const energy = modeValue(energyValues);
    const sleep = modeValue(sleepValues);
    const mood = modeValue(moodValues);
    const appetite = modeValue(appetiteValues);
    const stress = modeValue(stressValues);
    if (today && energyValues.length >= 6 && today.energy && energy && today.energy !== energy) deviations.push(`energy is ${today.energy.toLowerCase()} versus your usual ${energy.toLowerCase()}`);
    if (today && sleepValues.length >= 6 && today.sleep && sleep && today.sleep !== sleep) deviations.push(`sleep is ${today.sleep.toLowerCase()} versus your usual ${sleep.toLowerCase()}`);
    if (today && appetiteValues.length >= 6 && today.appetite && appetite && today.appetite !== appetite) deviations.push(`appetite differs from your usual ${appetite.toLowerCase()} pattern`);
    return { logs: logs.length, energy, sleep, mood, appetite, stress, commonSymptoms, deviations };
  }

  function bleedingProfile() {
    const periods = validPeriods().slice(-8);
    if (!periods.length) return null;
    const durations = periods.map(period => {
      const start = safeDate(period.start);
      const end = safeDate(period.end || period.start);
      return start && end ? daysBetween(start, end) + 1 : null;
    }).filter(Number.isFinite);
    const flowByDay = new Map();
    const crampByDay = new Map();
    periods.forEach(period => {
      const start = safeDate(period.start);
      const end = safeDate(period.end || period.start);
      if (!start || !end) return;
      for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
        const key = dateKey(d);
        const log = data.logs?.[key];
        if (!log) continue;
        const day = daysBetween(start, d) + 1;
        if (log.flow && log.flow !== "None") {
          if (!flowByDay.has(day)) flowByDay.set(day, []);
          flowByDay.get(day).push(log.flow);
        }
        if (hasOwn(log, "pain")) {
          if (!crampByDay.has(day)) crampByDay.set(day, []);
          crampByDay.get(day).push(Number(log.pain || 0));
        }
      }
    });
    let strongestDay = null;
    const flowScore = { Spotting: 0.5, Light: 1, Medium: 2, Heavy: 3 };
    flowByDay.forEach((values, day) => {
      const score = mean(values.map(value => flowScore[value] || 0));
      if (!strongestDay || score > strongestDay.score) strongestDay = { day, score, flow: modeValue(values), observations: values.length };
    });
    let strongestCrampDay = null;
    crampByDay.forEach((values, day) => {
      const score = mean(values);
      if (!strongestCrampDay || score > strongestCrampDay.score) strongestCrampDay = { day, score, observations: values.length };
    });
    let spottingLeadPeriods = 0;
    periods.forEach(period => {
      const start = safeDate(period.start);
      if (!start) return;
      let spotted = false;
      for (let offset = 1; offset <= 3; offset += 1) {
        const key = dateKey(addDays(start, -offset));
        if (data.logs?.[key]?.flow === "Spotting") spotted = true;
      }
      if (spotted) spottingLeadPeriods += 1;
    });
    return {
      periods: periods.length,
      durationMedian: durations.length ? Math.round(median(durations)) : null,
      durationMin: durations.length ? Math.min(...durations) : null,
      durationMax: durations.length ? Math.max(...durations) : null,
      strongestDay,
      strongestCrampDay,
      spottingLeadPeriods
    };
  }

  function bestNextSignal() {
    const a = analysis();
    const recent = a.currentIds;
    const candidates = a.sequences
      .filter(sequence => recent.has(sequence.from) && !recent.has(sequence.to))
      .sort((left, right) => (right.cycles * right.specificity) - (left.cycles * left.specificity));
    return candidates[0] || null;
  }

  function smartQuestion() {
    if (data.mode !== "cycle" || periodForDate(todayKey())) return null;
    const a = analysis();
    const settings = ensureSettings();
    const answered = settings.explicitAnswers?.[todayKey()] || {};
    const present = a.currentIds;
    const candidates = a.signals
      .filter(signal => signal.definition.watchable !== false)
      .filter(signal => !present.has(signal.id) && !answered[signal.id])
      .filter(signal => signal.selfKnown || signal.strengthKey === "emerging" || (signal.hitCycles >= 1 && signal.cyclesObserved <= 4))
      .sort((left, right) => {
        const leftNeed = (left.selfKnown ? 0.25 : 0) + (1 - Math.abs(0.5 - left.score)) + (left.cyclesObserved < 4 ? 0.2 : 0);
        const rightNeed = (right.selfKnown ? 0.25 : 0) + (1 - Math.abs(0.5 - right.score)) + (right.cyclesObserved < 4 ? 0.2 : 0);
        return rightNeed - leftNeed;
      });
    const signal = candidates[0];
    if (!signal) return null;
    return {
      id: signal.id,
      signal,
      title: `Did you notice ${signal.label.toLowerCase()} today?`,
      text: signal.selfKnown
        ? "You told Tsuki this is something you watch. An ordinary-day answer is useful too because it helps separate a true lead-up signal from something that happens throughout the month."
        : "Tsuki has seen this near at least one recorded period, but it needs more observed days to know whether that pattern is specific or just coincidence."
    };
  }

  function markExplicitAbsence(id) {
    const settings = ensureSettings();
    const key = todayKey();
    settings.explicitAnswers[key] = settings.explicitAnswers[key] || {};
    settings.explicitAnswers[key][id] = "absent";
    pruneExplicitAnswers(settings);
    saveData();
    invalidate();
    renderAdaptiveAll();
    showToast("Saved as not noticed today 🌙");
  }

  function selectSignalInCheckin(signal) {
    if (!signal) return false;
    const def = signal.definition || signal;
    const id = def.id || "";
    let input = null;
    if (def.symptom) input = document.querySelector(`input[name="symptom"][value="${CSS.escape(def.symptom)}"]`);
    else if (id === "spotting") input = document.querySelector('input[name="flow"][value="Spotting"]');
    else if (id === "cramps") {
      const range = document.getElementById("painLevel");
      if (range && Number(range.value || 0) === 0) { range.value = "1"; range.dispatchEvent(new Event("input", { bubbles: true })); return true; }
    }
    else if (id === "low-energy") input = document.querySelector('input[name="energy"][value="Low"]');
    else if (id === "poor-sleep") input = document.querySelector('input[name="sleep"][value="Poor"]');
    else if (id === "higher-appetite") input = document.querySelector('input[name="appetite"][value="High"]');
    else if (id === "lower-appetite") input = document.querySelector('input[name="appetite"][value="Low"]');
    else if (id === "high-stress") input = document.querySelector('input[name="stress"][value="High"]');
    else if (id === "higher-libido") input = document.querySelector('input[name="libido"][value="High"]');
    else if (id === "lower-libido") input = document.querySelector('input[name="libido"][value="Low"]');
    else {
      const moodMap = { irritable: "Irritable", anxious: "Anxious", emotional: "Emotional", sad: "Sad" };
      if (moodMap[id]) input = document.querySelector(`input[name="moodChoice"][value="${moodMap[id]}"]`);
    }
    if (!input) return false;
    input.checked = true;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function openQuestionInCheckin(id) {
    const a = analysis();
    const signal = a.signals.find(item => item.id === id);
    const dateInput = document.getElementById("logDate");
    if (dateInput) dateInput.value = todayKey();
    loadLogForm();
    showScreen("log");
    requestAnimationFrame(() => {
      if (selectSignalInCheckin(signal)) showToast("Selected for today — save the check-in when it looks right 🌙");
    });
  }

  function injectContextFields() {
    if (document.getElementById("adaptiveContextCard")) return;
    const form = document.getElementById("dailyLogForm");
    const anchor = document.getElementById("logOptionalDetails");
    if (!form || !anchor) return;
    const wrapper = document.createElement("details");
    wrapper.id = "adaptiveContextCard";
    wrapper.className = "log-more-details adaptive-context-card";
    wrapper.innerHTML = `
      <summary><span>＋ Day context</span><small>Travel, illness, stress, treatment & routine changes</small></summary>
      <article class="card adaptive-context-inner">
        <p class="card-label">Anything that may be shaping today?</p>
        <p class="muted small-text">Optional. Context helps Tsuki avoid calling every repeated symptom a period signal. It never decides that a context caused a symptom.</p>
        <div class="adaptive-context-grid">
          ${CONTEXTS.map(([label, icon]) => `<label><input type="checkbox" data-adaptive-context="${escapeHTML(label)}"><span>${icon} ${escapeHTML(label)}</span></label>`).join("")}
        </div>
        <label class="field-label" for="adaptiveContextNote">Context note <span class="muted">(optional)</span></label>
        <input id="adaptiveContextNote" class="input" maxlength="80" placeholder="e.g. first day of travel, changed work shift…">
      </article>`;
    anchor.parentNode.insertBefore(wrapper, anchor);
  }

  function syncContextForm() {
    injectContextFields();
    const key = document.getElementById("logDate")?.value || todayKey();
    const log = data.logs?.[key] || {};
    const active = new Set(Array.isArray(log.contexts) ? log.contexts : []);
    document.querySelectorAll("[data-adaptive-context]").forEach(input => { input.checked = active.has(input.dataset.adaptiveContext); });
    const note = document.getElementById("adaptiveContextNote");
    if (note) note.value = log.contextNote || "";
  }

  function captureContextDraft() {
    const key = document.getElementById("logDate")?.value || todayKey();
    state.contextDraft = {
      key,
      contexts: Array.from(document.querySelectorAll("[data-adaptive-context]:checked")).map(input => input.dataset.adaptiveContext),
      note: document.getElementById("adaptiveContextNote")?.value.trim() || ""
    };
  }

  function persistContextDraft() {
    const draft = state.contextDraft;
    state.contextDraft = null;
    if (!draft || !data.logs?.[draft.key]) return;
    const log = data.logs[draft.key];
    const oldContexts = Array.isArray(log.contexts) ? log.contexts : [];
    const changed = JSON.stringify(oldContexts) !== JSON.stringify(draft.contexts) || (log.contextNote || "") !== draft.note;
    if (!changed) return;
    log.contexts = draft.contexts;
    log.contextNote = draft.note;
    saveData();
    invalidate();
    syncContextForm();
  }

  function ensureAdaptiveUI() {
    injectStyles();
    injectContextFields();
    const screen = document.querySelector('[data-screen="period-signals"]');
    if (screen && !document.getElementById("adaptiveIntelligenceSection")) {
      const logButton = document.getElementById("periodSignalLogToday");
      const section = document.createElement("section");
      section.id = "adaptiveIntelligenceSection";
      section.className = "section-block period-signal-private adaptive-intelligence-section";
      section.innerHTML = `
        <div class="section-heading"><div><p class="eyebrow">ADAPTIVE INTELLIGENCE</p><h3>How your pattern unfolds</h3></div><span>🧠</span></div>
        <div id="adaptiveWeatherCard"></div>
        <div id="adaptiveSmartQuestion"></div>
        <div class="adaptive-grid">
          <article class="card"><p class="eyebrow">SIGNAL SEQUENCES</p><div id="adaptiveSequences"></div></article>
          <article class="card"><p class="eyebrow">PATTERN DRIFT</p><div id="adaptiveDrift"></div></article>
          <article class="card"><p class="eyebrow">PATTERN FAMILIES</p><div id="adaptiveFamilies"></div></article>
          <article class="card"><p class="eyebrow">CONTEXT MEMORY</p><div id="adaptiveContextInsights"></div></article>
          <article class="card"><p class="eyebrow">BLEEDING RHYTHM</p><div id="adaptiveBleeding"></div></article>
          <article class="card"><p class="eyebrow">SELF-CHECKING</p><div id="adaptiveBacktest"></div></article>
        </div>`;
      if (logButton) logButton.parentNode.insertBefore(section, logButton);
      else screen.appendChild(section);
    }

    const normalGrid = document.querySelector('[data-screen="insights"] .normal-grid');
    if (normalGrid && !document.getElementById("adaptiveNormalCard")) {
      const card = document.createElement("article");
      card.id = "adaptiveNormalCard";
      card.className = "normal-card wide adaptive-normal-card";
      card.innerHTML = '<small>What is different lately</small><strong id="adaptiveNormalText">Tsuki is still learning your ordinary baseline.</strong><p id="adaptiveNormalDetails" class="muted small-text"></p>';
      normalGrid.appendChild(card);
    }

    const todayCard = document.getElementById("periodSignalTodayCard");
    if (todayCard && !document.getElementById("adaptiveWeatherToday")) {
      const weather = document.createElement("article");
      weather.id = "adaptiveWeatherToday";
      weather.className = "adaptive-weather-today period-signal-private hidden";
      todayCard.parentNode.insertBefore(weather, todayCard.nextSibling);
    }
  }

  function injectStyles() {
    if (document.getElementById("tsukiAdaptiveStyles")) return;
    const style = document.createElement("style");
    style.id = "tsukiAdaptiveStyles";
    style.textContent = `
      .adaptive-grid{display:grid;gap:12px}.adaptive-weather{padding:16px;border-radius:20px;background:var(--surface,#fff);box-shadow:0 8px 24px rgba(80,50,70,.06);display:flex;gap:12px;align-items:flex-start}.adaptive-weather>span{font-size:28px}.adaptive-weather h4{margin:2px 0 5px}.adaptive-weather p{margin:0}.adaptive-weather[data-weather="strong"],.adaptive-weather[data-weather="forming"]{background:linear-gradient(135deg,rgba(248,201,217,.35),rgba(225,209,250,.35))}.adaptive-question{padding:15px;border:1px solid rgba(180,120,150,.18);border-radius:18px;margin-top:12px}.adaptive-question-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.adaptive-sequence{display:flex;gap:9px;align-items:flex-start;padding:10px 0;border-bottom:1px solid rgba(120,90,110,.08)}.adaptive-sequence:last-child{border-bottom:0}.adaptive-sequence-arrow{opacity:.55}.adaptive-evidence{font-size:.78rem;opacity:.72;margin-top:4px}.adaptive-context-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:12px 0}.adaptive-context-grid label{position:relative}.adaptive-context-grid input{position:absolute;opacity:0;pointer-events:none}.adaptive-context-grid span{display:block;padding:10px;border:1px solid rgba(120,90,110,.14);border-radius:14px;text-align:center}.adaptive-context-grid input:checked+span{background:rgba(248,201,217,.35);border-color:rgba(205,100,145,.32)}.adaptive-weather-today{margin:12px 0;padding:14px;border-radius:18px;background:rgba(255,255,255,.75);box-shadow:0 8px 22px rgba(80,50,70,.05)}.adaptive-weather-today strong{display:block;margin-bottom:4px}.adaptive-family{padding:9px 0}.adaptive-family+.adaptive-family{border-top:1px solid rgba(120,90,110,.08)}.adaptive-tag-row{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}.adaptive-tag-row span{font-size:.78rem;padding:5px 8px;border-radius:999px;background:rgba(248,201,217,.24)}.adaptive-drift-up{color:#9a4e73}.adaptive-drift-down{color:#6d6883}.adaptive-normal-card p{margin:.4rem 0 0}.adaptive-version-note{font-size:.72rem;opacity:.65}@media(max-width:430px){.adaptive-context-grid{grid-template-columns:1fr 1fr}.adaptive-question-actions button{flex:1 1 auto}}`;
    document.head.appendChild(style);
  }

  function renderWeather() {
    ensureAdaptiveUI();
    const a = analysis();
    const container = document.getElementById("adaptiveWeatherCard");
    const today = document.getElementById("adaptiveWeatherToday");
    if (data.mode !== "cycle" || data.settings.hideDetails) {
      if (container) container.innerHTML = "";
      today?.classList.add("hidden");
      return;
    }
    const weather = a.weather;
    const active = a.activeLearned.slice(0, 4);
    const family = a.familyMatches[0];
    const familyText = family && family.similarity >= 0.45 ? ` This resembles one of your recurring lead-up styles from ${family.cycles} past cycles.` : "";
    const sequence = a.sequenceMatches[0];
    const sequenceText = sequence?.toSignal ? ` After ${sequence.fromSignal?.label?.toLowerCase() || "this clue"}, ${sequence.toSignal.label.toLowerCase()} has followed in ${sequence.cycles} pre-period sequences.` : "";
    const html = `<article class="adaptive-weather" data-weather="${weather.key}"><span>${weather.icon}</span><div><p class="eyebrow">BODY SIGNAL WEATHER</p><h4>${escapeHTML(weather.label)}</h4><p>${escapeHTML(weather.text + familyText + sequenceText)}</p>${active.length ? `<div class="adaptive-tag-row">${active.map(signal => `<span>${signal.icon} ${escapeHTML(signal.label)}</span>`).join("")}</div>` : ""}<details><summary>Why am I seeing this?</summary><p class="adaptive-evidence">Tsuki combines recent observed signals with your personal baseline, signal specificity, recency, repeated sequences and false-positive history. Missing check-ins stay unknown. This does not change your period forecast.</p></details></div></article>`;
    if (container) container.innerHTML = html;
    if (today) {
      if (weather.key === "quiet") today.classList.add("hidden");
      else {
        today.classList.remove("hidden");
        today.innerHTML = `<strong>${weather.icon} ${escapeHTML(weather.label)}</strong><p>${escapeHTML(weather.text)}</p>`;
      }
    }
  }

  function renderSmartQuestion() {
    const container = document.getElementById("adaptiveSmartQuestion");
    if (!container) return;
    const question = smartQuestion();
    if (!question) {
      container.innerHTML = '<article class="adaptive-question"><strong>Tsuki has enough from today for now.</strong><p class="muted small-text">No extra question is useful at the moment. Missing information stays unknown rather than being treated as “no.”</p></article>';
      return;
    }
    container.innerHTML = `<article class="adaptive-question"><p class="eyebrow">ONE USEFUL QUESTION</p><strong>${question.signal.icon} ${escapeHTML(question.title)}</strong><p>${escapeHTML(question.text)}</p><div class="adaptive-question-actions"><button type="button" class="secondary-button small" data-adaptive-noticed="${escapeHTML(question.id)}">I noticed it</button><button type="button" class="text-button" data-adaptive-absent="${escapeHTML(question.id)}">Not today</button></div></article>`;
    container.querySelector("[data-adaptive-noticed]")?.addEventListener("click", event => openQuestionInCheckin(event.currentTarget.dataset.adaptiveNoticed));
    container.querySelector("[data-adaptive-absent]")?.addEventListener("click", event => markExplicitAbsence(event.currentTarget.dataset.adaptiveAbsent));
  }

  function renderSequences() {
    const container = document.getElementById("adaptiveSequences");
    if (!container) return;
    const sequences = analysis().sequences.slice(0, 4);
    container.innerHTML = sequences.length ? sequences.map(sequence => `<div class="adaptive-sequence"><span>${sequence.fromSignal?.icon || "🌙"}</span><div><strong>${escapeHTML(sequence.fromSignal?.label || sequence.from)} <span class="adaptive-sequence-arrow">→</span> ${escapeHTML(sequence.toSignal?.label || sequence.to)}</strong><p class="adaptive-evidence">Repeated before ${sequence.cycles} actual periods · usually about ${sequence.medianGap} day${sequence.medianGap === 1 ? "" : "s"} apart. Tsuki also discounts sequences that happen often on ordinary days.</p></div></div>`).join("") : '<p class="muted small-text">Tsuki needs repeated multi-day lead-ups before it shows an order here.</p>';
  }

  function renderDrift() {
    const container = document.getElementById("adaptiveDrift");
    if (!container) return;
    const drift = analysis().signals.filter(signal => signal.drift !== "stable" && signal.hitCycles >= 2).slice(0, 4);
    container.innerHTML = drift.length ? drift.map(signal => `<p><strong class="${signal.drift === "strengthening" ? "adaptive-drift-up" : "adaptive-drift-down"}">${signal.icon} ${escapeHTML(signal.label)}</strong><br><small>${signal.drift === "strengthening" ? "This has appeared more often in your recent observed lead-ups than in earlier ones." : "This used to appear more often before your periods and has been less present in recent observed lead-ups."}</small></p>`).join("") : '<p class="muted small-text">No clear pattern drift yet. Tsuki gives recent cycles more weight but keeps older history for context.</p>';
  }

  function renderFamilies() {
    const container = document.getElementById("adaptiveFamilies");
    if (!container) return;
    const families = analysis().families.slice(0, 3);
    container.innerHTML = families.length ? families.map((family, index) => `<div class="adaptive-family"><strong>Lead-up style ${index + 1}</strong><small> · ${family.cycles} recorded cycles</small><div class="adaptive-tag-row">${family.signals.map(signal => `<span>${signal.icon} ${escapeHTML(signal.label)}</span>`).join("")}</div></div>`).join("") : '<p class="muted small-text">Tsuki does not assume you have only one PMS pattern. More well-observed cycles are needed before it can separate recurring lead-up styles.</p>';
  }

  function renderContextInsights() {
    const container = document.getElementById("adaptiveContextInsights");
    if (!container) return;
    const insights = analysis().contextInsights.slice(0, 3);
    container.innerHTML = insights.length ? insights.map(item => `<p><strong>${escapeHTML(item.context)} × ${item.signal.icon} ${escapeHTML(item.signal.label)}</strong><br><small>${escapeHTML(item.signal.label)} has been more common in your ${item.context.toLowerCase()}-tagged observations than in your other observed days. Tsuki treats that as context, not a cause.</small></p>`).join("") : '<p class="muted small-text">Add optional day context when it matters. Tsuki needs several context-tagged and comparison days before it surfaces a relationship.</p>';
  }

  function renderBleeding() {
    const container = document.getElementById("adaptiveBleeding");
    if (!container) return;
    const profile = bleedingProfile();
    if (!profile) {
      container.innerHTML = '<p class="muted small-text">Log actual periods and daily bleeding detail to build your bleeding rhythm.</p>';
      return;
    }
    const parts = [];
    if (profile.durationMedian) parts.push(`Recorded periods are usually around ${profile.durationMedian} days${profile.durationMin !== profile.durationMax ? ` (${profile.durationMin}–${profile.durationMax} in recent history)` : ""}.`);
    if (profile.strongestDay?.observations >= 2) parts.push(`Your strongest logged flow has most often centered around Day ${profile.strongestDay.day}.`);
    if (profile.strongestCrampDay?.observations >= 2 && profile.strongestCrampDay.score > 0) parts.push(`Your higher recorded cramp intensity has tended to cluster around Day ${profile.strongestCrampDay.day}.`);
    if (profile.spottingLeadPeriods >= 2) parts.push(`Spotting appeared in the 3 days before ${profile.spottingLeadPeriods} of these recorded periods.`);
    container.innerHTML = parts.length ? parts.map(part => `<p>${escapeHTML(part)}</p>`).join("") + '<small>Actual logs only. Tsuki does not interpret unexpected bleeding as a diagnosis.</small>' : '<p class="muted small-text">Period dates are available, but richer daily flow/cramp detail will make this summary more useful.</p>';
  }

  function renderBacktest() {
    const container = document.getElementById("adaptiveBacktest");
    if (!container) return;
    const backtest = analysis().retrospective;
    if (!backtest.leadupDays && !backtest.ordinaryDays) {
      container.innerHTML = '<p class="muted small-text">Tsuki needs more learned signals before it can retrospectively check how often familiar evidence appeared near periods versus ordinary days.</p>';
      return;
    }
    container.innerHTML = `<p><strong>Tsuki checks its own false positives.</strong></p><p class="adaptive-evidence">Strong-enough combined signal evidence appeared on ${backtest.leadupDays} observed lead-up day${backtest.leadupDays === 1 ? "" : "s"} and ${backtest.ordinaryDays} ordinary observed day${backtest.ordinaryDays === 1 ? "" : "s"} in the available history. Ordinary-day appearances reduce future signal weight rather than being ignored.</p>`;
  }

  function renderNormal2() {
    ensureAdaptiveUI();
    const text = document.getElementById("adaptiveNormalText");
    const details = document.getElementById("adaptiveNormalDetails");
    if (!text || !details) return;
    if (data.mode !== "cycle") {
      text.textContent = "Cycle Mode baseline is paused while Pregnancy Mode is active.";
      details.textContent = "Pregnancy logs are kept separate and are never used as pre-period evidence.";
      return;
    }
    const normal = baselineSummary();
    if (normal.logs < 5) {
      text.textContent = "Tsuki is still learning your ordinary baseline.";
      details.textContent = `${normal.logs} ordinary check-in${normal.logs === 1 ? "" : "s"} available so far.`;
      return;
    }
    const bits = [];
    if (normal.energy) bits.push(`${normal.energy.toLowerCase()} energy`);
    if (normal.sleep) bits.push(`${normal.sleep.toLowerCase()} sleep`);
    if (normal.mood) bits.push(`${normal.mood.toLowerCase()} mood`);
    text.textContent = bits.length ? `Your ordinary logs most often show ${bits.join(", ")}.` : "Your ordinary baseline is becoming clearer.";
    const common = normal.commonSymptoms.length ? ` Commonly logged body signals: ${normal.commonSymptoms.map(([name]) => name).join(", ")}.` : "";
    const different = normal.deviations.length ? ` Today, ${normal.deviations.join("; ")}.` : " Nothing clearly differs from those fields in today's saved check-in.";
    details.textContent = `${normal.logs} ordinary days inform this view.${common}${different} “Different” means different from your own logs, not abnormal.`;
  }

  function renderAdaptiveReport() {
    const container = document.getElementById("reportSummary");
    if (!container) return;
    container.querySelector("#adaptiveIntelligenceReport")?.remove();
    if (data.mode !== "cycle") return;
    const a = analysis();
    if (!a.learned.length && !a.sequences.length) return;
    const card = document.createElement("article");
    card.id = "adaptiveIntelligenceReport";
    card.className = "report-card period-signal-private";
    card.innerHTML = `<h3>Adaptive Body Intelligence 🧠</h3><div class="report-row"><span>Current Body Signal Weather</span><strong>${a.weather.icon} ${escapeHTML(a.weather.label)}</strong></div><div class="report-row"><span>Learned adaptive signals</span><strong>${a.learned.length}</strong></div><div class="report-row"><span>Repeated signal sequences</span><strong>${a.sequences.length}</strong></div><div class="report-row"><span>Recurring lead-up styles</span><strong>${a.families.length}</strong></div>${a.learned.slice(0, 4).map(signal => `<div class="report-row"><span>${signal.icon} ${escapeHTML(signal.label)}</span><strong>${escapeHTML(signal.leadText)}</strong></div>`).join("")}<p class="muted small-text">Adaptive findings use only locally stored observations, preserve missing-data uncertainty, and do not change forecast dates or diagnose a condition.</p>`;
    container.appendChild(card);
  }

  function renderAdaptiveDashboard() {
    ensureAdaptiveUI();
    if (!document.querySelector('[data-screen="period-signals"]')?.classList.contains("active")) return;
    renderWeather();
    renderSmartQuestion();
    renderSequences();
    renderDrift();
    renderFamilies();
    renderContextInsights();
    renderBleeding();
    renderBacktest();
  }

  function renderNextFromSequences(baseRenderer, targetId, label) {
    const next = bestNextSignal();
    const target = document.getElementById(targetId);
    if (!target || !next?.toSignal) return baseRenderer?.();
    target.innerHTML = `<span>🌙</span><div><strong>${escapeHTML(label)}</strong><p>After ${escapeHTML(next.fromSignal?.label?.toLowerCase() || "a familiar signal")}, ${escapeHTML(next.toSignal.label.toLowerCase())} has followed within about ${next.medianGap} day${next.medianGap === 1 ? "" : "s"} in ${next.cycles} of your recorded pre-period sequences. This is a personal-history pattern, not a guarantee.</p></div>`;
    return undefined;
  }

  function applyPublicVersion() {
    document.querySelectorAll(".drawer-about-tsuki-version").forEach(node => { node.textContent = `Tsuki ${PUBLIC_VERSION}`; });
    const diag = document.getElementById("diagAppVersion");
    if (diag) diag.textContent = PUBLIC_VERSION;
    const title = document.getElementById("whatsNewTitle");
    if (title) title.textContent = `Tsuki ${PUBLIC_VERSION}`;
  }

  function renderAdaptiveWhatsNew() {
    applyPublicVersion();
    const list = document.getElementById("whatsNewList");
    if (list) list.innerHTML = adaptiveReleaseNotes.map(note => `<article class="whats-new-item"><span aria-hidden="true">${note.icon}</span><div><strong>${escapeHTML(note.title)}</strong><small>${escapeHTML(note.text)}</small></div></article>`).join("");
  }

  function installWrappers() {
    state.base.saveData = saveData;
    saveData = function saveDataAdaptive(...args) {
      invalidate();
      return state.base.saveData(...args);
    };

    state.base.loadLogForm = loadLogForm;
    loadLogForm = function loadLogFormAdaptive(...args) {
      const result = state.base.loadLogForm(...args);
      syncContextForm();
      return result;
    };

    state.base.renderToday = renderToday;
    renderToday = function renderTodayAdaptive(...args) {
      const result = state.base.renderToday(...args);
      renderWeather();
      applyPublicVersion();
      return result;
    };

    state.base.renderReports = renderReports;
    renderReports = function renderReportsAdaptive(...args) {
      const result = state.base.renderReports(...args);
      renderAdaptiveReport();
      return result;
    };

    if (typeof renderMyNormal === "function") {
      state.base.renderMyNormal = renderMyNormal;
      renderMyNormal = function renderMyNormalAdaptive(...args) {
        const result = state.base.renderMyNormal(...args);
        renderNormal2();
        return result;
      };
    }

    if (typeof renderWhatUsuallyComesNext === "function") {
      state.base.renderWhatUsuallyComesNext = renderWhatUsuallyComesNext;
      renderWhatUsuallyComesNext = function renderWhatUsuallyComesNextAdaptive(...args) {
        return renderNextFromSequences(() => state.base.renderWhatUsuallyComesNext(...args), "whatNextCard", "What usually comes next?");
      };
    }

    if (typeof renderTonightTomorrow === "function") {
      state.base.renderTonightTomorrow = renderTonightTomorrow;
      renderTonightTomorrow = function renderTonightTomorrowAdaptive(...args) {
        return renderNextFromSequences(() => state.base.renderTonightTomorrow(...args), "tonightTomorrowCard", "Tonight / Tomorrow");
      };
    }

    state.base.showScreen = showScreen;
    showScreen = function showScreenAdaptive(name, ...args) {
      const result = state.base.showScreen(name, ...args);
      if (name === "period-signals") requestAnimationFrame(renderAdaptiveDashboard);
      if (name === "insights") requestAnimationFrame(renderNormal2);
      if (name === "reports") requestAnimationFrame(renderAdaptiveReport);
      applyPublicVersion();
      return result;
    };

    state.base.renderEverything = renderEverything;
    renderEverything = function renderEverythingAdaptive(...args) {
      const result = state.base.renderEverything(...args);
      ensureAdaptiveUI();
      renderWeather();
      renderNormal2();
      if (document.querySelector('[data-screen="period-signals"]')?.classList.contains("active")) renderAdaptiveDashboard();
      applyPublicVersion();
      return result;
    };

    if (typeof renderDiagnostics === "function") {
      state.base.renderDiagnostics = renderDiagnostics;
      renderDiagnostics = async function renderDiagnosticsAdaptive(...args) {
        const result = await state.base.renderDiagnostics(...args);
        applyPublicVersion();
        return result;
      };
    }

    if (typeof renderWhatsNew === "function") {
      state.base.renderWhatsNew = renderWhatsNew;
      renderWhatsNew = function renderWhatsNewAdaptive(...args) {
        const result = state.base.renderWhatsNew(...args);
        renderAdaptiveWhatsNew();
        return result;
      };
    }
  }

  function installFormEvents() {
    const form = document.getElementById("dailyLogForm");
    if (!form || form.dataset.adaptiveBound === "1") return;
    form.dataset.adaptiveBound = "1";
    form.addEventListener("submit", captureContextDraft, true);
    form.addEventListener("submit", persistContextDraft);
    document.getElementById("logDate")?.addEventListener("change", syncContextForm);
  }

  function renderAdaptiveAll() {
    ensureAdaptiveUI();
    renderWeather();
    renderNormal2();
    if (document.querySelector('[data-screen="period-signals"]')?.classList.contains("active")) renderAdaptiveDashboard();
    if (document.querySelector('[data-screen="reports"]')?.classList.contains("active")) renderAdaptiveReport();
    applyPublicVersion();
  }

  function install() {
    if (state.installed) return;
    if (!signalAPI() || typeof data === "undefined") {
      setTimeout(install, 40);
      return;
    }
    ensureSettings();
    ensureAdaptiveUI();
    installWrappers();
    installFormEvents();
    state.installed = true;
    window.TsukiAdaptiveIntelligence.installed = true;
    window.TsukiAdaptiveIntelligence.test = {
      analysis,
      baselineSummary,
      bleedingProfile,
      smartQuestion,
      bestNextSignal,
      observableFromLog,
      observationFor,
      effectiveContexts,
      invalidate
    };
    renderAdaptiveAll();
    if (!document.getElementById("whatsNewModal")?.classList.contains("hidden")) renderWhatsNew();
  }

  window.TsukiAdaptiveIntelligence = {
    installed: false,
    install,
    test: null,
    publicVersion: PUBLIC_VERSION
  };

  install();
})();
