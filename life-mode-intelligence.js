/* ============================================================
   TSUKI v1 — IRREGULAR + PREGNANCY INTELLIGENCE
   Local-only, observational personalization.
   Never diagnoses a condition, suppresses pregnancy safety guidance,
   rewrites actual period history, or manufactures a forecast date.
   ============================================================ */

(() => {
  "use strict";

  const PUBLIC_VERSION = "v1.0";
  const IRREGULAR_INTERVAL_LIMIT = 8;
  const PREG_RECENT_DAYS = 7;
  const PREG_PRIOR_DAYS = 14;
  const LONG_GAP_DAYS = 90;
  const CONTEXTS = ["Travel", "Illness", "High stress", "Poor sleep", "Medication / treatment change", "Major routine change"];

  const state = {
    installed: false,
    revision: 0,
    irregularCache: null,
    pregnancyCache: null,
    base: {},
    pendingPregnancyContext: null
  };

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, Number(value) || 0));
  const mean = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value || {}, key);
  const unique = values => Array.from(new Set((values || []).filter(Boolean)));

  function median(values) {
    const clean = (values || []).filter(Number.isFinite).slice().sort((a, b) => a - b);
    if (!clean.length) return null;
    const mid = Math.floor(clean.length / 2);
    return clean.length % 2 ? clean[mid] : (clean[mid - 1] + clean[mid]) / 2;
  }

  function modeValue(values) {
    const clean = (values || []).filter(value => value !== "" && value !== null && value !== undefined);
    if (!clean.length) return "";
    const counts = new Map();
    clean.forEach(value => counts.set(value, (counts.get(value) || 0) + 1));
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))[0]?.[0] || "";
  }

  function safeDate(value) {
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : new Date(value);
    if (typeof value !== "string") return null;
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return null;
    const result = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return Number.isNaN(result.getTime()) ? null : result;
  }

  function localKey(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function addLocalDays(date, amount) {
    const next = new Date(date);
    next.setDate(next.getDate() + amount);
    return next;
  }

  function dayDiff(a, b) {
    const left = safeDate(a) || (a instanceof Date ? a : null);
    const right = safeDate(b) || (b instanceof Date ? b : null);
    if (!left || !right) return null;
    const x = new Date(left.getFullYear(), left.getMonth(), left.getDate());
    const y = new Date(right.getFullYear(), right.getMonth(), right.getDate());
    return Math.round((y - x) / 86400000);
  }

  function escape(value) {
    if (typeof escapeHTML === "function") return escapeHTML(value);
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function invalidate() {
    state.revision += 1;
    state.irregularCache = null;
    state.pregnancyCache = null;
  }

  function isIrregularMode() {
    return data?.mode === "cycle" && data?.settings?.cyclePattern === "irregular";
  }

  function veryInfrequent() {
    if (typeof usesVeryInfrequentCycle === "function") {
      try { return Boolean(usesVeryInfrequentCycle()); } catch (_) {}
    }
    return isIrregularMode() && data?.settings?.irregularCycleShape === "infrequent";
  }

  function actualIntervalRecords() {
    if (typeof cycleIntervalRecords === "function") {
      try { return cycleIntervalRecords().map(item => ({ ...item })); } catch (_) {}
    }
    const periods = typeof validPeriods === "function" ? validPeriods() : [];
    const result = [];
    for (let i = 1; i < periods.length; i += 1) {
      const days = dayDiff(periods[i - 1]?.start, periods[i]?.start);
      if (!Number.isFinite(days) || days <= 0) continue;
      result.push({
        key: `${periods[i - 1]?.id || periods[i - 1]?.start}::${periods[i]?.id || periods[i]?.start}`,
        previousStart: periods[i - 1]?.start,
        currentStart: periods[i]?.start,
        days,
        ignored: false,
        irregularLearningEligible: days >= 15 && days <= 365
      });
    }
    return result;
  }

  function intervalFamilies(values) {
    const clean = (values || []).filter(Number.isFinite).slice().sort((a, b) => a - b);
    if (clean.length < 6) return [];
    let gapIndex = -1;
    let biggestGap = 0;
    for (let i = 1; i < clean.length; i += 1) {
      const gap = clean[i] - clean[i - 1];
      if (gap > biggestGap) {
        biggestGap = gap;
        gapIndex = i;
      }
    }
    if (gapIndex < 2 || clean.length - gapIndex < 2 || biggestGap < 10) return [];
    const left = clean.slice(0, gapIndex);
    const right = clean.slice(gapIndex);
    const leftMedian = median(left);
    const rightMedian = median(right);
    if (!Number.isFinite(leftMedian) || !Number.isFinite(rightMedian) || rightMedian - leftMedian < 14) return [];
    return [
      { label: "Shorter recorded rhythm", median: Math.round(leftMedian), min: left[0], max: left[left.length - 1], count: left.length },
      { label: "Longer recorded rhythm", median: Math.round(rightMedian), min: right[0], max: right[right.length - 1], count: right.length }
    ];
  }

  function irregularTrend(values) {
    const clean = (values || []).filter(Number.isFinite);
    if (clean.length < 6) return { key: "learning", text: "Tsuki needs more usable intervals before comparing recent rhythm with earlier history." };
    const recent = clean.slice(-3);
    const earlier = clean.slice(-6, -3);
    const recentMedian = median(recent);
    const earlierMedian = median(earlier);
    const threshold = Math.max(7, Math.round((earlierMedian || 0) * 0.15));
    const delta = Math.round((recentMedian || 0) - (earlierMedian || 0));
    if (delta >= threshold) return { key: "longer", delta, text: `Your last three usable intervals have been about ${Math.abs(delta)} days longer at the median than the three before them.` };
    if (delta <= -threshold) return { key: "shorter", delta, text: `Your last three usable intervals have been about ${Math.abs(delta)} days shorter at the median than the three before them.` };
    return { key: "stable", delta, text: "Your recent usable intervals are not showing a strong directional shift compared with the three before them." };
  }

  function adaptiveEvidence() {
    try {
      const analysis = window.TsukiAdaptiveIntelligence?.test?.analysis?.();
      if (!analysis) return null;
      return {
        weather: analysis.weather || null,
        signals: (analysis.learned || []).slice(0, 4),
        sequences: (analysis.sequences || []).slice(0, 2)
      };
    } catch (_) {
      return null;
    }
  }

  function irregularAnalysis() {
    if (state.irregularCache?.revision === state.revision) return state.irregularCache.value;
    const periods = typeof validPeriods === "function" ? validPeriods() : [];
    const records = actualIntervalRecords();
    const usable = records.filter(record => !record.ignored && record.irregularLearningEligible !== false).slice(-IRREGULAR_INTERVAL_LIMIT);
    const values = usable.map(record => Number(record.days)).filter(Number.isFinite);
    const allValues = records.map(record => Number(record.days)).filter(Number.isFinite);
    const ignored = records.filter(record => record.ignored).length;
    const min = values.length ? Math.min(...values) : null;
    const max = values.length ? Math.max(...values) : null;
    const med = median(values);
    const spread = Number.isFinite(min) && Number.isFinite(max) ? max - min : null;
    const families = intervalFamilies(values);
    const trend = irregularTrend(values);
    const completeness = data?.settings?.cycleHistoryCompleteness || "unsure";
    const shape = data?.settings?.irregularCycleShape || "variable";
    const latestPeriod = periods[periods.length - 1] || null;
    const today = safeDate(typeof todayKey === "function" ? todayKey() : localKey(new Date()));
    const lastStart = safeDate(latestPeriod?.start);
    const currentGap = today && lastStart ? dayDiff(lastStart, today) : null;
    const yearAgo = addLocalDays(new Date(), -365);
    const periodsPastYear = periods.filter(period => {
      const start = safeDate(period.start);
      return start && start >= yearAgo && start <= new Date();
    }).length;
    const reasons = [];
    if (values.length < 3) reasons.push("only a small number of usable recorded intervals are available");
    if (spread !== null && spread > 35) reasons.push(`recent usable intervals span ${spread} days`);
    if (ignored) reasons.push(`${ignored} interval${ignored === 1 ? " is" : "s are"} excluded from learning without deleting the underlying periods`);
    if (completeness === "partial") reasons.push("you marked your cycle history as incomplete");
    if (completeness === "unsure") reasons.push("history completeness is marked as unsure");
    if (veryInfrequent()) reasons.push("you told Tsuki that periods may be several months apart, so next-period date guessing is intentionally off");
    if (!reasons.length) reasons.push("Tsuki still treats irregular timing as uncertain even when a recent pattern is visible");
    const evidenceQuality = values.length >= 6 && completeness === "complete" ? "richer" : values.length >= 3 ? "developing" : "limited";
    const result = {
      active: isIrregularMode(),
      shape,
      periods: periods.length,
      periodsPastYear,
      records,
      usable,
      values,
      min,
      max,
      median: med,
      spread,
      ignored,
      families,
      trend,
      currentGap,
      longGap: Number.isFinite(currentGap) && currentGap >= LONG_GAP_DAYS,
      evidenceQuality,
      uncertaintyReasons: reasons,
      adaptive: adaptiveEvidence()
    };
    state.irregularCache = { revision: state.revision, value: result };
    return result;
  }

  const PREG_METRICS = [
    { key: "nausea", label: "Nausea", map: { None: 0, Mild: 1, Moderate: 2, Severe: 3 }, higher: "higher", lower: "lower" },
    { key: "energy", label: "Energy", map: { Low: 0, Medium: 1, High: 2 }, higher: "higher", lower: "lower" },
    { key: "sleep", label: "Sleep quality", map: { Poor: 0, Okay: 1, Good: 2 }, higher: "higher", lower: "lower" },
    { key: "hydration", label: "Hydration", map: { Low: 0, Okay: 1, Good: 2 }, higher: "higher", lower: "lower" },
    { key: "pain", label: "Pain / discomfort", map: { None: 0, Mild: 1, Moderate: 2, Severe: 3 }, higher: "higher", lower: "lower" },
    { key: "swelling", label: "Swelling", map: { None: 0, Mild: 1, Noticeable: 2 }, higher: "higher", lower: "lower" }
  ];

  function pregnancyLogEntries() {
    return Object.entries(data?.pregnancy?.logs || {})
      .map(([key, log]) => ({ key, date: safeDate(key), log: log || {} }))
      .filter(item => item.date && item.date <= new Date())
      .sort((a, b) => a.date - b.date);
  }

  function pregnancyWindow(entries, start, end) {
    return entries.filter(item => item.date >= start && item.date <= end);
  }

  function observedMetric(entries, metric) {
    const values = entries
      .filter(item => hasOwn(item.log, metric.key) && item.log[metric.key] !== "" && item.log[metric.key] !== null && metric.map[item.log[metric.key]] !== undefined)
      .map(item => metric.map[item.log[metric.key]]);
    return values;
  }

  function pregnancyTrajectories(entries) {
    const today = safeDate(typeof todayKey === "function" ? todayKey() : localKey(new Date())) || new Date();
    const recentStart = addLocalDays(today, -(PREG_RECENT_DAYS - 1));
    const priorEnd = addLocalDays(recentStart, -1);
    const priorStart = addLocalDays(priorEnd, -(PREG_PRIOR_DAYS - 1));
    const recent = pregnancyWindow(entries, recentStart, today);
    const prior = pregnancyWindow(entries, priorStart, priorEnd);
    const changes = [];
    PREG_METRICS.forEach(metric => {
      const recentValues = observedMetric(recent, metric);
      const priorValues = observedMetric(prior, metric);
      if (recentValues.length < 2 || priorValues.length < 2) return;
      const recentMean = mean(recentValues);
      const priorMean = mean(priorValues);
      const delta = recentMean - priorMean;
      if (Math.abs(delta) < 0.55) return;
      changes.push({
        key: metric.key,
        label: metric.label,
        direction: delta > 0 ? metric.higher : metric.lower,
        recentCount: recentValues.length,
        priorCount: priorValues.length,
        delta
      });
    });
    return { recent, prior, changes };
  }

  function pregnancyBaseline(entries) {
    const recent = entries.slice(-60);
    const moodValues = recent.flatMap(item => Array.isArray(item.log.moods) ? item.log.moods : []);
    return {
      logs: recent.length,
      energy: modeValue(recent.map(item => item.log.energy)),
      sleep: modeValue(recent.map(item => item.log.sleep)),
      nausea: modeValue(recent.map(item => item.log.nausea)),
      appetite: modeValue(recent.map(item => item.log.appetite)),
      bowel: modeValue(recent.map(item => item.log.bowel)),
      hydration: modeValue(recent.map(item => item.log.hydration)),
      pain: modeValue(recent.map(item => item.log.pain)),
      mood: modeValue(moodValues),
      movement: modeValue(recent.map(item => item.log.movement))
    };
  }

  function pregnancySignalTags(log) {
    const tags = [];
    if (["Moderate", "Severe"].includes(log?.nausea)) tags.push("more nausea");
    if (log?.energy === "Low") tags.push("low energy");
    if (log?.sleep === "Poor") tags.push("poor sleep");
    if (["Moderate", "Severe"].includes(log?.pain)) tags.push("more discomfort");
    if (log?.hydration === "Low") tags.push("low hydration");
    if (log?.appetite === "Low") tags.push("lower appetite");
    if (log?.appetite === "High") tags.push("higher appetite");
    if (Array.isArray(log?.moods)) {
      if (log.moods.includes("Anxious")) tags.push("anxious mood");
      if (log.moods.includes("Low")) tags.push("low mood");
    }
    return unique(tags);
  }

  function pregnancySequences(entries) {
    const counts = new Map();
    for (let i = 1; i < entries.length; i += 1) {
      if (dayDiff(entries[i - 1].date, entries[i].date) !== 1) continue;
      const from = pregnancySignalTags(entries[i - 1].log);
      const to = pregnancySignalTags(entries[i].log);
      from.forEach(a => to.forEach(b => {
        if (a === b) return;
        const key = `${a}→${b}`;
        counts.set(key, (counts.get(key) || 0) + 1);
      }));
    }
    return Array.from(counts.entries())
      .filter(([, count]) => count >= 3)
      .map(([key, count]) => {
        const [from, to] = key.split("→");
        return { from, to, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }

  function pregnancyContextInsights(entries) {
    const contexts = CONTEXTS.map(context => ({ context, tagged: [], other: [] }));
    entries.slice(-90).forEach(item => {
      const tags = Array.isArray(item.log.contexts) ? item.log.contexts : [];
      const signals = pregnancySignalTags(item.log);
      contexts.forEach(group => {
        (tags.includes(group.context) ? group.tagged : group.other).push(...signals);
      });
    });
    const results = [];
    contexts.forEach(group => {
      if (group.tagged.length < 3 || group.other.length < 6) return;
      const taggedCounts = new Map();
      const otherCounts = new Map();
      group.tagged.forEach(value => taggedCounts.set(value, (taggedCounts.get(value) || 0) + 1));
      group.other.forEach(value => otherCounts.set(value, (otherCounts.get(value) || 0) + 1));
      Array.from(taggedCounts.entries()).forEach(([signal, count]) => {
        const taggedRate = count / group.tagged.length;
        const otherRate = (otherCounts.get(signal) || 0) / group.other.length;
        if (taggedRate >= otherRate + 0.18 && count >= 2) results.push({ context: group.context, signal, taggedRate, otherRate });
      });
    });
    return results.sort((a, b) => (b.taggedRate - b.otherRate) - (a.taggedRate - a.otherRate)).slice(0, 3);
  }

  function completedAppointments() {
    const today = safeDate(typeof todayKey === "function" ? todayKey() : localKey(new Date())) || new Date();
    return (data?.pregnancy?.appointments || [])
      .map(item => ({ ...item, parsedDate: safeDate(item.date) }))
      .filter(item => item.parsedDate && item.parsedDate <= today)
      .sort((a, b) => a.parsedDate - b.parsedDate);
  }

  function nextAppointment() {
    const today = safeDate(typeof todayKey === "function" ? todayKey() : localKey(new Date())) || new Date();
    return (data?.pregnancy?.appointments || [])
      .map(item => ({ ...item, parsedDate: safeDate(item.date) }))
      .filter(item => item.parsedDate && item.parsedDate >= today)
      .sort((a, b) => a.parsedDate - b.parsedDate)[0] || null;
  }

  function appointmentBrief(entries) {
    const completed = completedAppointments();
    const last = completed[completed.length - 1] || null;
    const fallback = addLocalDays(new Date(), -14);
    const since = last?.parsedDate || fallback;
    const relevant = entries.filter(item => item.date >= since);
    const lines = [];
    if (relevant.length) lines.push(`${relevant.length} pregnancy check-in${relevant.length === 1 ? "" : "s"} saved since ${last ? "your last recorded appointment" : "the last 14 days"}.`);
    const severeNausea = relevant.filter(item => ["Moderate", "Severe"].includes(item.log.nausea)).length;
    const poorSleep = relevant.filter(item => item.log.sleep === "Poor").length;
    const lowEnergy = relevant.filter(item => item.log.energy === "Low").length;
    const discomfort = relevant.filter(item => ["Moderate", "Severe"].includes(item.log.pain)).length;
    if (severeNausea) lines.push(`Moderate/severe nausea was recorded on ${severeNausea} check-in${severeNausea === 1 ? "" : "s"}.`);
    if (poorSleep) lines.push(`Poor sleep was recorded on ${poorSleep} check-in${poorSleep === 1 ? "" : "s"}.`);
    if (lowEnergy) lines.push(`Low energy was recorded on ${lowEnergy} check-in${lowEnergy === 1 ? "" : "s"}.`);
    if (discomfort) lines.push(`Moderate/severe discomfort was recorded on ${discomfort} check-in${discomfort === 1 ? "" : "s"}.`);
    const warnings = relevant.flatMap(item => Array.isArray(item.log.warnings) ? item.log.warnings : []);
    if (warnings.length) lines.push(`Urgent-warning selections were saved on ${relevant.filter(item => Array.isArray(item.log.warnings) && item.log.warnings.length).length} check-in(s); these are not treated as ordinary personal patterns.`);
    return { lastAppointment: last, nextAppointment: nextAppointment(), relevant, lines };
  }

  function pregnancyAnalysis() {
    if (state.pregnancyCache?.revision === state.revision) return state.pregnancyCache.value;
    const entries = pregnancyLogEntries();
    const trajectory = pregnancyTrajectories(entries);
    const baseline = pregnancyBaseline(entries);
    const sequences = pregnancySequences(entries);
    const contextInsights = pregnancyContextInsights(entries);
    const brief = appointmentBrief(entries);
    const today = safeDate(typeof todayKey === "function" ? todayKey() : localKey(new Date()));
    const todayLog = today ? (data?.pregnancy?.logs?.[localKey(today)] || null) : null;
    const currentWarnings = Array.isArray(todayLog?.warnings) ? todayLog.warnings : [];
    const movementChange = todayLog?.movement === "Less than usual";
    let ga = null;
    try { ga = typeof gestationalAgeForDate === "function" ? gestationalAgeForDate(localKey(today || new Date())) : null; } catch (_) {}
    const result = {
      active: data?.mode === "pregnancy" && Boolean(data?.pregnancy?.active),
      entries,
      baseline,
      trajectory,
      sequences,
      contextInsights,
      brief,
      todayLog,
      currentWarnings,
      movementChange,
      gestation: ga,
      recentLogs: trajectory.recent.length
    };
    state.pregnancyCache = { revision: state.revision, value: result };
    return result;
  }

  function ensureStyle() {
    if (document.getElementById("lifeModeIntelligenceStyle")) return;
    const style = document.createElement("style");
    style.id = "lifeModeIntelligenceStyle";
    style.textContent = `
      .life-intel-card{border:1px solid rgba(145,112,139,.14);border-radius:22px;padding:16px;margin-top:14px;background:rgba(255,255,255,.72);box-shadow:0 10px 28px rgba(116,82,111,.06)}
      .life-intel-card h3{margin:2px 0 6px}.life-intel-card p{margin:6px 0}.life-intel-card details{margin-top:10px}.life-intel-card summary{cursor:pointer;font-weight:700}
      .life-intel-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:10px}.life-intel-stat{padding:10px;border-radius:16px;background:rgba(255,255,255,.7)}
      .life-intel-stat small,.life-intel-stat span{display:block}.life-intel-stat strong{display:block;font-size:1.02rem;margin-top:2px}
      .life-intel-tags{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}.life-intel-tags span{padding:6px 9px;border-radius:999px;background:rgba(244,224,238,.65);font-size:.78rem}
      .life-intel-safety{border-color:rgba(161,70,70,.24);background:rgba(255,241,241,.9)}.life-intel-safety strong{color:#8b3d46}
      .life-intel-button{border:0;border-radius:999px;padding:8px 11px;font:inherit;font-weight:700;cursor:pointer;background:rgba(244,224,238,.9);color:inherit;margin-top:8px}
      .pregnancy-context-box{margin-top:14px;padding-top:12px;border-top:1px solid rgba(145,112,139,.12)}.pregnancy-context-box label{display:flex;gap:8px;align-items:center;padding:5px 0;font-size:.88rem}.pregnancy-context-box textarea{margin-top:8px}
      @media(max-width:390px){.life-intel-grid{grid-template-columns:1fr 1fr}.life-intel-card{padding:14px}}
    `;
    document.head.appendChild(style);
  }

  function insertAfter(reference, node) {
    if (!reference?.parentNode || !node) return;
    reference.parentNode.insertBefore(node, reference.nextSibling);
  }

  function ensureCard(id, reference, where = "after") {
    let card = document.getElementById(id);
    if (card) return card;
    card = document.createElement("article");
    card.id = id;
    card.className = "life-intel-card";
    if (where === "append") reference?.appendChild(card);
    else insertAfter(reference, card);
    return card;
  }

  function renderIrregularToday() {
    const existing = document.getElementById("irregularRhythmToday");
    if (!isIrregularMode()) {
      existing?.classList.add("hidden");
      return;
    }
    const reference = document.getElementById("betweenMoonsTodayCard") || document.querySelector('[data-screen="today"] .hero-card');
    const card = ensureCard("irregularRhythmToday", reference);
    if (!card) return;
    card.classList.remove("hidden");
    card.classList.add("period-signal-private");
    const a = irregularAnalysis();
    const body = a.adaptive?.weather;
    const intervalText = Number.isFinite(a.min) && Number.isFinite(a.max) ? `${a.min === a.max ? a.min : `${a.min}–${a.max}`} days across recent usable intervals` : "Not enough usable intervals yet";
    card.innerHTML = `<p class="eyebrow">YOUR IRREGULAR RHYTHM</p><h3>${veryInfrequent() ? "Between-period intelligence" : "Timing + body clues"}</h3><p>${escape(intervalText)}.</p>${body ? `<p><strong>${escape(body.icon || "🌙")} ${escape(body.label || "Body signals")}</strong> · Body evidence stays separate from calendar timing.</p>` : ""}<button type="button" class="life-intel-button" data-life-open="cycle-history">See rhythm details</button>`;
    card.querySelector("[data-life-open]")?.addEventListener("click", () => showScreen("cycle-history"));
  }

  function renderIrregularHistory() {
    const screen = document.querySelector('[data-screen="cycle-history"]');
    if (!screen) return;
    const existing = document.getElementById("irregularRhythmIntelligence");
    if (!isIrregularMode()) {
      existing?.classList.add("hidden");
      return;
    }
    const reference = screen.querySelector(".page-title") || screen.firstElementChild;
    const card = ensureCard("irregularRhythmIntelligence", reference);
    if (!card) return;
    card.classList.remove("hidden");
    card.classList.add("period-signal-private");
    const a = irregularAnalysis();
    const families = a.families.length ? `<div class="life-intel-tags">${a.families.map(family => `<span>${escape(family.label)} · ~${family.median}d (${family.count})</span>`).join("")}</div>` : '<p class="muted small-text">No separate interval families are clear yet. Tsuki will not force your history into two groups.</p>';
    const bodySignals = a.adaptive?.signals?.length ? `<p><strong>Body clues near actual periods</strong></p><div class="life-intel-tags">${a.adaptive.signals.map(signal => `<span>${escape(signal.icon || "🌙")} ${escape(signal.label)}</span>`).join("")}</div>` : '<p class="muted small-text">Body clues are still being learned from actual-period lead-ups.</p>';
    card.innerHTML = `<p class="eyebrow">SMARTER IRREGULAR RHYTHM</p><h3>Your timing does not have to fit one average</h3><div class="life-intel-grid"><div class="life-intel-stat"><small>Periods · past 12 months</small><strong>${a.periodsPastYear}</strong></div><div class="life-intel-stat"><small>Usable recent intervals</small><strong>${a.values.length}</strong></div><div class="life-intel-stat"><small>Median interval</small><strong>${Number.isFinite(a.median) ? `${Math.round(a.median)} days` : "Learning"}</strong></div><div class="life-intel-stat"><small>Evidence</small><strong>${escape(a.evidenceQuality)}</strong></div></div><p><strong>Recent direction</strong><br><span>${escape(a.trend.text)}</span></p>${families}${bodySignals}<details><summary>Why Tsuki is uncertain</summary><p>${a.uncertaintyReasons.map(reason => `• ${escape(reason)}`).join("<br>")}</p><small>Uncertainty is information. Tsuki does not silently switch your cycle type or diagnose why timing varies.</small></details>`;
  }

  function renderBetweenMoonsIntelligence() {
    const screen = document.querySelector('[data-screen="between-moons"]');
    if (!screen) return;
    const existing = document.getElementById("betweenMoonsRhythmIntelligence");
    if (!(isIrregularMode() && veryInfrequent())) {
      existing?.classList.add("hidden");
      return;
    }
    const reference = document.getElementById("betweenMoonsStats") || screen.querySelector(".page-title");
    const card = ensureCard("betweenMoonsRhythmIntelligence", reference);
    if (!card) return;
    card.classList.remove("hidden");
    card.classList.add("period-signal-private");
    const a = irregularAnalysis();
    const signals = a.adaptive?.signals || [];
    const sequences = a.adaptive?.sequences || [];
    card.innerHTML = `<p class="eyebrow">BETWEEN MOONS 2.0</p><h3>Your body story can be useful without a next-period date</h3><p>${Number.isFinite(a.currentGap) ? `It has been ${a.currentGap} days since the last recorded period. ` : ""}Tsuki is keeping long gaps factual instead of converting them into an exact countdown.</p>${signals.length ? `<p><strong>Personal clues learned around actual periods</strong></p><div class="life-intel-tags">${signals.map(signal => `<span>${escape(signal.icon || "🌙")} ${escape(signal.label)}</span>`).join("")}</div>` : '<p class="muted small-text">More ordinary-day check-ins and actual periods will help Tsuki distinguish repeated body clues from everyday variation.</p>'}${sequences.length ? `<p><strong>Familiar lead-up order</strong></p>${sequences.map(sequence => `<p>${escape(sequence.fromSignal?.label || "A signal")} → ${escape(sequence.toSignal?.label || "another signal")} · repeated in ${sequence.cycles || 0} observed lead-ups</p>`).join("")}` : ""}<small>Body clues can suggest that something familiar is happening, but they do not create a predicted bleeding date.</small>`;
  }

  function renderIrregularReport() {
    const container = document.getElementById("reportSummary");
    container?.querySelector("#irregularIntelligenceReport")?.remove();
    if (!container || !isIrregularMode()) return;
    const a = irregularAnalysis();
    const card = document.createElement("article");
    card.id = "irregularIntelligenceReport";
    card.className = "report-card period-signal-private";
    card.innerHTML = `<h3>Irregular Rhythm Intelligence 🌘</h3><div class="report-row"><span>Periods recorded · past 12 months</span><strong>${a.periodsPastYear}</strong></div><div class="report-row"><span>Usable recent interval range</span><strong>${Number.isFinite(a.min) && Number.isFinite(a.max) ? `${a.min}–${a.max} days` : "Learning"}</strong></div><div class="report-row"><span>Recent rhythm direction</span><strong>${escape(a.trend.key)}</strong></div><div class="report-row"><span>Interval families</span><strong>${a.families.length || "None clear"}</strong></div><p class="muted small-text">Factual history + personal body observations. This does not diagnose the reason for irregular or infrequent periods.</p>`;
    container.appendChild(card);
  }

  function currentPregnancyContextDraft() {
    const date = document.getElementById("pregnancyLogDate")?.value || (typeof todayKey === "function" ? todayKey() : localKey(new Date()));
    const contexts = Array.from(document.querySelectorAll('input[name="pregLifeContext"]:checked')).map(input => input.value);
    const note = document.getElementById("pregnancyContextNote")?.value?.trim() || "";
    return { date, contexts, contextNote: note };
  }

  function ensurePregnancyContextUI() {
    const form = document.getElementById("pregnancyLogForm");
    if (!form || document.getElementById("pregnancyContextBox")) return;
    const card = document.createElement("article");
    card.id = "pregnancyContextBox";
    card.className = "card pregnancy-context-box";
    card.innerHTML = `<h3>What else is happening?</h3><p class="muted small-text">Optional context helps Tsuki separate pregnancy patterns from travel, illness, stress, poor sleep or routine changes. Context is correlation, not cause.</p>${CONTEXTS.map(context => `<label><input type="checkbox" name="pregLifeContext" value="${escape(context)}"><span>${escape(context)}</span></label>`).join("")}<textarea id="pregnancyContextNote" class="input" rows="2" placeholder="Optional context note"></textarea>`;
    const notesCard = document.getElementById("pregnancyNotes")?.closest("article.card");
    if (notesCard) form.insertBefore(card, notesCard);
    else form.appendChild(card);
  }

  function syncPregnancyContextForm() {
    ensurePregnancyContextUI();
    const key = document.getElementById("pregnancyLogDate")?.value || (typeof todayKey === "function" ? todayKey() : localKey(new Date()));
    const saved = data?.pregnancy?.logs?.[key] || {};
    const contexts = new Set(Array.isArray(saved.contexts) ? saved.contexts : []);
    document.querySelectorAll('input[name="pregLifeContext"]').forEach(input => { input.checked = contexts.has(input.value); });
    const note = document.getElementById("pregnancyContextNote");
    if (note) note.value = saved.contextNote || "";
  }

  function renderPregnancyTodayIntelligence() {
    const screen = document.querySelector('[data-screen="pregnancy-today"]');
    if (!screen) return;
    const existing = document.getElementById("pregnancyPatternToday");
    if (!(data?.mode === "pregnancy" && data?.pregnancy?.active)) {
      existing?.classList.add("hidden");
      return;
    }
    const reference = screen.querySelector(".pregnancy-greeting") || screen.firstElementChild;
    const card = ensureCard("pregnancyPatternToday", reference);
    if (!card) return;
    card.classList.remove("hidden");
    card.classList.add("pregnancy-sensitive");
    const a = pregnancyAnalysis();
    const baseline = a.baseline;
    const bits = [];
    if (baseline.energy) bits.push(`${baseline.energy.toLowerCase()} energy`);
    if (baseline.sleep) bits.push(`${baseline.sleep.toLowerCase()} sleep`);
    if (baseline.nausea) bits.push(`${baseline.nausea.toLowerCase()} nausea`);
    const change = a.trajectory.changes[0];
    card.innerHTML = `<p class="eyebrow">YOUR PREGNANCY PATTERN</p><h3>${a.entries.length < 5 ? "Tsuki is learning this pregnancy" : "Your recent story"}</h3><p>${bits.length ? `Across your saved pregnancy check-ins, the most common entries include ${escape(bits.join(", "))}.` : "A few check-ins over time will help Tsuki build a personal pregnancy baseline."}</p>${change ? `<p><strong>Recent change:</strong> ${escape(change.label)} has been logged ${escape(change.direction)} during the last ${PREG_RECENT_DAYS} days than in the comparison window.</p>` : ""}<button type="button" class="life-intel-button" data-life-open="pregnancy-dashboard">See pregnancy insights</button>`;
    card.querySelector("[data-life-open]")?.addEventListener("click", () => showScreen("pregnancy-dashboard"));
  }

  function renderPregnancyDashboardIntelligence() {
    const screen = document.querySelector('[data-screen="pregnancy-dashboard"]');
    if (!screen) return;
    const existing = document.getElementById("pregnancyAdaptiveIntelligence");
    if (!(data?.mode === "pregnancy" && data?.pregnancy?.active)) {
      existing?.classList.add("hidden");
      document.getElementById("pregnancySafetyRecall")?.remove();
      return;
    }
    const reference = document.getElementById("pregnancyDashboardHero") || screen.querySelector(".page-title");
    const card = ensureCard("pregnancyAdaptiveIntelligence", reference);
    if (!card) return;
    card.classList.remove("hidden");
    card.classList.add("pregnancy-sensitive");
    const a = pregnancyAnalysis();
    const b = a.baseline;
    const trajectory = a.trajectory.changes;
    const baselineParts = [];
    if (b.energy) baselineParts.push(`Energy: ${b.energy}`);
    if (b.sleep) baselineParts.push(`Sleep: ${b.sleep}`);
    if (b.nausea) baselineParts.push(`Nausea: ${b.nausea}`);
    if (b.appetite) baselineParts.push(`Appetite: ${b.appetite}`);
    if (b.mood) baselineParts.push(`Mood most often logged: ${b.mood}`);
    card.innerHTML = `<p class="eyebrow">PREGNANCY INTELLIGENCE</p><h3>This pregnancy, in your own logs</h3><p>${a.entries.length ? `${a.entries.length} pregnancy check-in${a.entries.length === 1 ? "" : "s"} currently inform this view.` : "Tsuki needs pregnancy check-ins before it can learn a personal pattern."}</p>${baselineParts.length ? `<div class="life-intel-tags">${baselineParts.map(part => `<span>${escape(part)}</span>`).join("")}</div>` : ""}<div><p><strong>Recent trajectory</strong></p>${trajectory.length ? trajectory.slice(0, 4).map(change => `<p>${escape(change.label)} has been logged <strong>${escape(change.direction)}</strong> recently compared with the preceding observed window.</p>`).join("") : '<p class="muted small-text">No clear recent change has enough observed data yet. Missing check-ins stay unknown.</p>'}</div>${a.sequences.length ? `<div><p><strong>Repeated day-to-day patterns</strong></p>${a.sequences.slice(0, 3).map(sequence => `<p>${escape(sequence.from)} → ${escape(sequence.to)} · seen ${sequence.count} times on consecutive logged days</p>`).join("")}<small>These are personal-history sequences, not medical cause-and-effect.</small></div>` : ""}${a.contextInsights.length ? `<div><p><strong>Context Tsuki noticed</strong></p>${a.contextInsights.map(item => `<p>${escape(item.signal)} has appeared more often in ${escape(item.context.toLowerCase())}-tagged observations than in other observed days.</p>`).join("")}<small>Association only; Tsuki does not claim the context caused the change.</small></div>` : ""}<details><summary>How Tsuki uses pregnancy logs</summary><p>Pregnancy learning is completely separate from pre-period intelligence. Tsuki compares only your own saved pregnancy observations, keeps missing days unknown, and never uses a personal pattern to dismiss an urgent warning sign.</p></details>`;

    renderPregnancySafetyRecall(a, card);
    renderAppointmentBrief(a, card);
  }

  function renderPregnancySafetyRecall(analysisValue, reference) {
    document.getElementById("pregnancySafetyRecall")?.remove();
    if (!analysisValue.currentWarnings.length && !analysisValue.movementChange) return;
    const card = document.createElement("article");
    card.id = "pregnancySafetyRecall";
    card.className = "life-intel-card life-intel-safety pregnancy-sensitive";
    const items = unique([...analysisValue.currentWarnings, ...(analysisValue.movementChange ? ["Baby movement is less than usual"] : [])]);
    card.innerHTML = `<p class="eyebrow">SAFETY OVERRIDES PERSONAL PATTERNS</p><h3>⚠️ A warning sign was recorded today</h3><p>${items.map(item => escape(item)).join(" · ")}</p><p><strong>Do not wait for Tsuki to learn or monitor this.</strong> Follow the urgent-care guidance shown in Pregnancy Check-in and contact your maternity care team or seek urgent medical care as directed.</p>`;
    insertAfter(reference, card);
  }

  function appointmentSummaryText(a) {
    const brief = a.brief;
    const ga = a.gestation;
    const lines = ["Tsuki Pregnancy Appointment Summary", ga ? `Gestational age today: ${ga.weeks}w ${ga.days}d` : "Gestational age today: not available"];
    if (brief.lastAppointment?.date) lines.push(`Last recorded appointment: ${brief.lastAppointment.date}${brief.lastAppointment.type ? ` · ${brief.lastAppointment.type}` : ""}`);
    if (brief.nextAppointment?.date) lines.push(`Next recorded appointment: ${brief.nextAppointment.date}${brief.nextAppointment.type ? ` · ${brief.nextAppointment.type}` : ""}`);
    lines.push(...brief.lines);
    if (a.trajectory.changes.length) lines.push("Recent logged changes:", ...a.trajectory.changes.slice(0, 4).map(change => `- ${change.label}: ${change.direction} than the preceding observed window`));
    lines.push("This is a factual summary of entries saved in Tsuki. It does not diagnose a condition or replace your maternity care team's advice.");
    return lines.join("\n");
  }

  function renderAppointmentBrief(a, reference) {
    document.getElementById("pregnancyAppointmentIntel")?.remove();
    const card = document.createElement("article");
    card.id = "pregnancyAppointmentIntel";
    card.className = "life-intel-card pregnancy-sensitive";
    const lines = a.brief.lines;
    card.innerHTML = `<p class="eyebrow">FOR YOUR NEXT APPOINTMENT</p><h3>Since your last visit</h3>${lines.length ? lines.map(line => `<p>${escape(line)}</p>`).join("") : '<p class="muted small-text">Keep checking in when useful. Tsuki will organize factual changes between visits without deciding what they mean medically.</p>'}<button type="button" class="life-intel-button" id="copyPregnancyIntelSummary">Copy factual summary</button><small>Provider guidance always wins. Urgent warning signs should not wait for a scheduled appointment.</small>`;
    insertAfter(reference, card);
    card.querySelector("#copyPregnancyIntelSummary")?.addEventListener("click", async () => {
      const text = appointmentSummaryText(a);
      try {
        await navigator.clipboard.writeText(text);
        if (typeof showToast === "function") showToast("Pregnancy summary copied 🤍");
      } catch (_) {
        if (typeof showToast === "function") showToast("Could not copy automatically.");
      }
    });
  }

  function renderPregnancyDashboardInsightsAppend() {
    const container = document.getElementById("pregnancyDashboardInsights");
    if (!container || !(data?.mode === "pregnancy" && data?.pregnancy?.active)) return;
    container.querySelector("#pregnancyLifeIntelInsight")?.remove();
    const a = pregnancyAnalysis();
    const node = document.createElement("article");
    node.id = "pregnancyLifeIntelInsight";
    node.className = "pregnancy-insight-card";
    const change = a.trajectory.changes[0];
    node.innerHTML = change ? `<span>🧠</span><div><strong>Tsuki noticed a recent shift</strong><p>${escape(change.label)} has been logged ${escape(change.direction)} recently than in the preceding observed window. This is a change in your own entries, not a diagnosis.</p></div>` : `<span>🧠</span><div><strong>Personal pregnancy baseline</strong><p>${a.entries.length >= 5 ? "Tsuki is comparing recent check-ins with your own earlier pregnancy logs." : "A few more pregnancy check-ins will help Tsuki compare changes over time."}</p></div>`;
    container.appendChild(node);
  }

  function capturePregnancyContext() {
    state.pendingPregnancyContext = currentPregnancyContextDraft();
  }

  function mergePendingPregnancyContext() {
    const pending = state.pendingPregnancyContext;
    if (!pending?.date || !data?.pregnancy?.logs?.[pending.date]) return;
    const log = data.pregnancy.logs[pending.date];
    log.contexts = unique(pending.contexts);
    log.contextNote = pending.contextNote || "";
    state.pendingPregnancyContext = null;
  }

  function ensureUI() {
    ensureStyle();
    ensurePregnancyContextUI();
  }

  function renderAll() {
    ensureUI();
    renderIrregularToday();
    renderIrregularHistory();
    renderBetweenMoonsIntelligence();
    renderPregnancyTodayIntelligence();
    renderPregnancyDashboardIntelligence();
    renderPregnancyDashboardInsightsAppend();
    if (document.querySelector('[data-screen="reports"]')?.classList.contains("active")) renderIrregularReport();
  }

  function installWrappers() {
    state.base.saveData = saveData;
    saveData = function saveDataLifeMode(...args) {
      mergePendingPregnancyContext();
      invalidate();
      return state.base.saveData(...args);
    };

    if (typeof loadPregnancyLogForm === "function") {
      state.base.loadPregnancyLogForm = loadPregnancyLogForm;
      loadPregnancyLogForm = function loadPregnancyLogFormLifeMode(...args) {
        const result = state.base.loadPregnancyLogForm(...args);
        syncPregnancyContextForm();
        return result;
      };
    }

    if (typeof renderToday === "function") {
      state.base.renderToday = renderToday;
      renderToday = function renderTodayLifeMode(...args) {
        const result = state.base.renderToday(...args);
        renderIrregularToday();
        return result;
      };
    }

    if (typeof renderCycleHistory === "function") {
      state.base.renderCycleHistory = renderCycleHistory;
      renderCycleHistory = function renderCycleHistoryLifeMode(...args) {
        const result = state.base.renderCycleHistory(...args);
        renderIrregularHistory();
        return result;
      };
    }

    if (typeof renderBetweenMoons === "function") {
      state.base.renderBetweenMoons = renderBetweenMoons;
      renderBetweenMoons = function renderBetweenMoonsLifeMode(...args) {
        const result = state.base.renderBetweenMoons(...args);
        renderBetweenMoonsIntelligence();
        return result;
      };
    }

    if (typeof renderReports === "function") {
      state.base.renderReports = renderReports;
      renderReports = function renderReportsLifeMode(...args) {
        const result = state.base.renderReports(...args);
        renderIrregularReport();
        return result;
      };
    }

    if (typeof renderPregnancyToday === "function") {
      state.base.renderPregnancyToday = renderPregnancyToday;
      renderPregnancyToday = function renderPregnancyTodayLifeMode(...args) {
        const result = state.base.renderPregnancyToday(...args);
        renderPregnancyTodayIntelligence();
        return result;
      };
    }

    if (typeof renderPregnancyDashboard === "function") {
      state.base.renderPregnancyDashboard = renderPregnancyDashboard;
      renderPregnancyDashboard = function renderPregnancyDashboardLifeMode(...args) {
        const result = state.base.renderPregnancyDashboard(...args);
        renderPregnancyDashboardIntelligence();
        renderPregnancyDashboardInsightsAppend();
        return result;
      };
    }

    state.base.showScreen = showScreen;
    showScreen = function showScreenLifeMode(name, ...args) {
      const result = state.base.showScreen(name, ...args);
      requestAnimationFrame(() => {
        if (name === "cycle-history") renderIrregularHistory();
        if (name === "between-moons") renderBetweenMoonsIntelligence();
        if (name === "reports") renderIrregularReport();
        if (name === "pregnancy-log") syncPregnancyContextForm();
        if (name === "pregnancy-today") renderPregnancyTodayIntelligence();
        if (name === "pregnancy-dashboard") {
          renderPregnancyDashboardIntelligence();
          renderPregnancyDashboardInsightsAppend();
        }
      });
      return result;
    };

    state.base.renderEverything = renderEverything;
    renderEverything = function renderEverythingLifeMode(...args) {
      const result = state.base.renderEverything(...args);
      renderAll();
      return result;
    };
  }

  function installEvents() {
    const form = document.getElementById("pregnancyLogForm");
    if (form && form.dataset.lifeIntelBound !== "1") {
      form.dataset.lifeIntelBound = "1";
      form.addEventListener("submit", capturePregnancyContext, true);
      document.getElementById("pregnancyLogDate")?.addEventListener("change", syncPregnancyContextForm);
    }
  }

  function install() {
    if (state.installed) return;
    if (typeof data === "undefined" || typeof saveData !== "function" || typeof showScreen !== "function" || !window.TsukiBodySignals?.test || !window.TsukiAdaptiveIntelligence?.installed) {
      setTimeout(install, 40);
      return;
    }
    ensureUI();
    installWrappers();
    installEvents();
    state.installed = true;
    window.TsukiLifeModeIntelligence.installed = true;
    window.TsukiLifeModeIntelligence.test = {
      irregularAnalysis,
      intervalFamilies,
      irregularTrend,
      pregnancyAnalysis,
      pregnancyBaseline,
      pregnancyTrajectories,
      pregnancySequences,
      pregnancyContextInsights,
      appointmentSummaryText,
      invalidate
    };
    renderAll();
  }

  window.TsukiLifeModeIntelligence = {
    installed: false,
    publicVersion: PUBLIC_VERSION,
    install,
    test: null
  };

  install();
})();
