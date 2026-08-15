/* ============================================================
   TSUKI v1 — META INTELLIGENCE
   Read-only intelligence over existing Cycle + Pregnancy records.
   No new storage key, no health-data upload, no forecast mutation.
   ============================================================ */

(() => {
  "use strict";

  const PUBLIC_VERSION = "v1.0";
  const state = { installed:false, base:{}, revision:0, cache:null };

  const clamp = (v,min=0,max=1) => Math.min(max, Math.max(min, Number(v)||0));
  const median = values => {
    const clean = (values||[]).filter(Number.isFinite).slice().sort((a,b)=>a-b);
    if (!clean.length) return null;
    const i = Math.floor(clean.length/2);
    return clean.length%2 ? clean[i] : (clean[i-1]+clean[i])/2;
  };
  const mad = values => {
    const m = median(values);
    if (!Number.isFinite(m)) return null;
    return median(values.map(v=>Math.abs(v-m)));
  };
  const esc = value => typeof escapeHTML === "function" ? escapeHTML(value) : String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");

  function adaptive(){ try { return window.TsukiAdaptiveIntelligence?.test?.analysis?.() || null; } catch(_) { return null; } }
  function life(){ try { return window.TsukiLifeModeIntelligence?.test || null; } catch(_) { return null; } }

  function familyFor(signal){
    const text = `${signal?.id||""} ${signal?.label||""}`.toLowerCase();
    if (/spot|bleed|flow/.test(text)) return "bleeding";
    if (/bloat|puff|water|swelling/.test(text)) return "fluid";
    if (/cramp|pelvic|pain|ache|heav/.test(text)) return "pain";
    if (/headache|migraine/.test(text)) return "head";
    if (/sleep|fatigue|energy|tired/.test(text)) return "rest";
    if (/acne|skin|oily|dry/.test(text)) return "skin";
    if (/mood|irrit|anx|emotional|sad|stress/.test(text)) return "mood";
    if (/appetite|crav|nausea|bowel|constip|stool|gas/.test(text)) return "digestive";
    if (/discharge|libido/.test(text)) return "reproductive";
    return `other:${signal?.id||signal?.label||"unknown"}`;
  }

  function independentActiveSignals(a){
    const best = new Map();
    (a?.activeLearned||[]).forEach(signal => {
      const family = familyFor(signal);
      const current = best.get(family);
      if (!current || (signal.score||0) > (current.score||0)) best.set(family, signal);
    });
    return Array.from(best.entries()).map(([family,signal])=>({family,signal}));
  }

  function cycleCoverage(a){
    const keys = a?.keys || [];
    const recentCut = new Date(); recentCut.setDate(recentCut.getDate()-89);
    const recent = keys.filter(key => {
      const d = typeof parseDate === "function" ? parseDate(key) : null;
      return d && d >= recentCut && d <= new Date();
    });
    const periods = a?.periods?.length || 0;
    const observedCycles = Math.max(0, ...((a?.signals||[]).map(s=>s.cyclesObserved||0)), 0);
    let label = "Limited evidence";
    if (recent.length >= 18 && observedCycles >= 4) label = "Richer evidence";
    else if (recent.length >= 7 || observedCycles >= 2) label = "Developing evidence";
    return { label, recentDays:recent.length, periods, observedCycles };
  }

  function signalCalibration(a){
    return (a?.learned||[]).map(signal => {
      const sample = (signal.cyclesObserved||0) + Math.min(12, (signal.baselineObservedDays||0)/4);
      const specificity = clamp(signal.specificity||0);
      const repeat = signal.cyclesObserved ? (signal.hitCycles||0)/signal.cyclesObserved : 0;
      const score = clamp((0.45*repeat)+(0.35*specificity)+(0.20*clamp(sample/8)));
      let band = "Early";
      if ((signal.cyclesObserved||0) >= 5 && (signal.baselineObservedDays||0) >= 10 && score >= .68) band = "Well supported";
      else if ((signal.cyclesObserved||0) >= 3 && score >= .5) band = "Developing";
      return { ...signal, calibrationScore:score, calibrationBand:band };
    }).sort((a,b)=>b.calibrationScore-a.calibrationScore);
  }

  function calibratedWeather(a, coverage, independent){
    const original = a?.weather || {key:"quiet",icon:"🌕",label:"Quiet"};
    let key = original.key;
    let note = "Tsuki is using the current body-signal reading as-is.";
    if (original.key === "strong" && independent.length < 2) {
      key = "forming";
      note = "Several current clues come from the same symptom family, so Tsuki is avoiding double-counting them as independent evidence.";
    } else if (["strong","forming"].includes(original.key) && coverage.label === "Limited evidence") {
      key = "clues";
      note = "The current pattern looks familiar, but the available observed history is still limited, so Tsuki is holding the conclusion gently.";
    }
    const map = {
      quiet:["🌕","Quiet"], clues:["🌗","A few familiar clues"], forming:["🌘","Familiar pattern forming"], strong:["🌑","Strong familiar lead-up"]
    };
    const [icon,label] = map[key] || map.quiet;
    return { key, icon, label, note, originalKey:original.key };
  }

  function irregularShift(){
    try {
      const a = life()?.irregularAnalysis?.();
      const values = (a?.values||[]).filter(Number.isFinite);
      if (values.length < 6) return {active:false, text:"Not enough usable intervals for a robust shift check yet."};
      const recent = values.slice(-3), earlier = values.slice(-8,-3);
      const r = median(recent), e = median(earlier), spread = mad(earlier) || 0;
      const threshold = Math.max(10, Math.round(spread*2.5));
      const delta = Math.round(r-e);
      if (Math.abs(delta) < threshold) return {active:false, delta, threshold, text:"Recent interval timing is still within the broad variation of your earlier usable history."};
      return {active:true, direction:delta>0?"longer":"shorter", delta, threshold, text:`The median of your last three usable intervals is about ${Math.abs(delta)} days ${delta>0?"longer":"shorter"} than the earlier comparison window. Tsuki treats this as a recorded shift, not an explanation.`};
    } catch(_) { return {active:false,text:"Irregular rhythm comparison is unavailable right now."}; }
  }

  function pregnancyMeta(){
    try {
      const a = life()?.pregnancyAnalysis?.();
      if (!a?.active) return null;
      const logs = a.entries?.length || 0;
      const recent = a.trajectory?.recent?.length || 0;
      const prior = a.trajectory?.prior?.length || 0;
      let evidence = "Limited evidence";
      if (logs >= 18 && recent >= 4 && prior >= 6) evidence = "Richer evidence";
      else if (logs >= 7 && (recent >= 2 || prior >= 3)) evidence = "Developing evidence";
      const changes = (a.trajectory?.changes||[]).map(change => ({...change, support:Math.min(change.recentCount||0, change.priorCount||0)}));
      const strongest = changes.sort((x,y)=>y.support-x.support)[0] || null;
      return { evidence, logs, recent, prior, strongest, warnings:a.currentWarnings||[], movementChange:Boolean(a.movementChange) };
    } catch(_) { return null; }
  }

  function analysis(){
    if (state.cache?.revision === state.revision) return state.cache.value;
    const a = adaptive();
    const coverage = cycleCoverage(a);
    const independent = independentActiveSignals(a);
    const calibration = signalCalibration(a);
    const weather = calibratedWeather(a, coverage, independent);
    const result = { cycle:{coverage,independent,calibration,weather,retrospective:a?.retrospective||{leadupDays:0,ordinaryDays:0}}, irregular:irregularShift(), pregnancy:pregnancyMeta() };
    state.cache = {revision:state.revision,value:result};
    return result;
  }

  function invalidate(){ state.revision += 1; state.cache = null; }

  function ensureStyle(){
    if (document.getElementById("metaIntelStyle")) return;
    const style = document.createElement("style");
    style.id = "metaIntelStyle";
    style.textContent = `.meta-intel-card{margin-top:14px;padding:15px;border-radius:20px;background:rgba(255,255,255,.74);border:1px solid rgba(145,112,139,.14)}.meta-intel-card h3{margin:2px 0 7px}.meta-intel-row{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid rgba(145,112,139,.09)}.meta-intel-row:last-child{border-bottom:0}.meta-intel-row span{font-size:.84rem}.meta-intel-row strong{text-align:right;font-size:.84rem}.meta-intel-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.meta-intel-chips span{font-size:.76rem;padding:5px 8px;border-radius:999px;background:rgba(244,224,238,.7)}.meta-intel-note{font-size:.8rem;opacity:.78}`;
    document.head.appendChild(style);
  }

  function upsert(id, reference, html, className="meta-intel-card"){
    if (!reference?.parentNode) return null;
    let card = document.getElementById(id);
    if (!card){ card=document.createElement("article"); card.id=id; card.className=className; reference.parentNode.insertBefore(card, reference.nextSibling); }
    card.innerHTML = html; return card;
  }

  function renderCycleLearningHealth(){
    if (data?.mode !== "cycle") { document.getElementById("metaCycleLearningHealth")?.remove(); return; }
    const screen = document.querySelector('[data-screen="period-signals"]');
    const ref = document.getElementById("adaptiveBacktest")?.closest("article") || screen?.querySelector("article:last-of-type") || screen?.firstElementChild;
    if (!ref) return;
    const m = analysis().cycle;
    const independentText = m.independent.length ? `${m.independent.length} independent clue famil${m.independent.length===1?"y":"ies"}` : "No independent learned clues active";
    const top = m.calibration.slice(0,3);
    upsert("metaCycleLearningHealth", ref, `<p class="eyebrow">LEARNING HEALTH</p><h3>How much should Tsuki trust itself?</h3><div class="meta-intel-row"><span>Observed-history depth</span><strong>${esc(m.coverage.label)}</strong></div><div class="meta-intel-row"><span>Current independent evidence</span><strong>${esc(independentText)}</strong></div><div class="meta-intel-row"><span>Self-check history</span><strong>${m.retrospective.leadupDays} lead-up · ${m.retrospective.ordinaryDays} ordinary</strong></div><p class="meta-intel-note">Missing days remain unknown. Related symptoms are grouped before Tsuki interprets current evidence, so several versions of the same body change cannot inflate confidence.</p>${top.length?`<div class="meta-intel-chips">${top.map(s=>`<span>${esc(s.icon)} ${esc(s.label)} · ${esc(s.calibrationBand)}</span>`).join("")}</div>`:""}`);
  }

  function renderCalibratedToday(){
    const existing=document.getElementById("metaCalibratedToday");
    if (data?.mode !== "cycle") { existing?.remove(); return; }
    const ref=document.getElementById("adaptiveWeatherToday") || document.getElementById("periodSignalTodayCard") || document.querySelector('[data-screen="today"] .hero-card');
    if (!ref) return;
    const w=analysis().cycle.weather;
    upsert("metaCalibratedToday",ref,`<p class="eyebrow">TSUKI'S CALIBRATED READ</p><h3>${w.icon} ${esc(w.label)}</h3><p>${esc(w.note)}</p><small>This calibration can only lower certainty; it never creates an earlier period date or increases medical certainty.</small>`);
  }

  function renderIrregularMeta(){
    const existing=document.getElementById("metaIrregularShift");
    if (!(data?.mode==="cycle" && data?.settings?.cyclePattern==="irregular")) { existing?.remove(); return; }
    const ref=document.getElementById("irregularRhythmIntelligence") || document.getElementById("betweenMoonsRhythmIntelligence") || document.querySelector('[data-screen="cycle-history"] article:last-of-type');
    if (!ref) return;
    const s=analysis().irregular;
    upsert("metaIrregularShift",ref,`<p class="eyebrow">RHYTHM CHANGE CHECK</p><h3>${s.active?"A sustained timing shift may be forming":"Recent timing in context"}</h3><p>${esc(s.text)}</p><small>Tsuki compares recent actual intervals with your own earlier usable history. This does not diagnose why a change happened and does not alter forecasts.</small>`);
  }

  function renderPregnancyMeta(){
    const existing=document.getElementById("metaPregnancyLearningHealth");
    const p=analysis().pregnancy;
    if (!p) { existing?.remove(); return; }
    const ref=document.getElementById("pregnancyAdaptiveIntelligence") || document.querySelector('[data-screen="pregnancy-dashboard"] article:last-of-type');
    if (!ref) return;
    const change=p.strongest ? `${p.strongest.label}: ${p.strongest.direction} in the recent observed window` : "No well-supported recent trajectory shift";
    const safety = (p.warnings.length || p.movementChange) ? "Safety guidance takes priority over personalization" : "No current saved urgent-warning override in this analysis";
    upsert("metaPregnancyLearningHealth",ref,`<p class="eyebrow">PREGNANCY LEARNING HEALTH</p><h3>What Tsuki knows vs. what it should not guess</h3><div class="meta-intel-row"><span>Pregnancy history depth</span><strong>${esc(p.evidence)}</strong></div><div class="meta-intel-row"><span>Recent vs earlier comparison</span><strong>${esc(change)}</strong></div><div class="meta-intel-row"><span>Safety layer</span><strong>${esc(safety)}</strong></div><p class="meta-intel-note">Pregnancy personalization is observational only. Urgent maternal warning signs are never normalized by a personal baseline.</p>`);
  }

  function renderAll(){ ensureStyle(); renderCalibratedToday(); renderCycleLearningHealth(); renderIrregularMeta(); renderPregnancyMeta(); }

  function installWrappers(){
    if (typeof saveData === "function") { state.base.saveData=saveData; saveData=function saveDataMeta(...args){ invalidate(); return state.base.saveData(...args); }; }
    if (typeof renderEverything === "function") { state.base.renderEverything=renderEverything; renderEverything=function renderEverythingMeta(...args){ const r=state.base.renderEverything(...args); renderAll(); return r; }; }
    if (typeof showScreen === "function") { state.base.showScreen=showScreen; showScreen=function showScreenMeta(name,...args){ const r=state.base.showScreen(name,...args); requestAnimationFrame(renderAll); return r; }; }
    if (typeof renderPregnancyDashboard === "function") { state.base.renderPregnancyDashboard=renderPregnancyDashboard; renderPregnancyDashboard=function renderPregnancyDashboardMeta(...args){ const r=state.base.renderPregnancyDashboard(...args); renderPregnancyMeta(); return r; }; }
    if (typeof renderBetweenMoons === "function") { state.base.renderBetweenMoons=renderBetweenMoons; renderBetweenMoons=function renderBetweenMoonsMeta(...args){ const r=state.base.renderBetweenMoons(...args); renderIrregularMeta(); return r; }; }
  }

  function install(){
    if (state.installed) return;
    if (!window.TsukiAdaptiveIntelligence?.installed || !window.TsukiLifeModeIntelligence?.installed || typeof data === "undefined") { setTimeout(install,50); return; }
    ensureStyle(); installWrappers(); state.installed=true;
    window.TsukiMetaIntelligence.installed=true;
    window.TsukiMetaIntelligence.test={analysis, independentActiveSignals, signalCalibration, calibratedWeather, irregularShift, pregnancyMeta, invalidate};
    renderAll();
  }

  window.TsukiMetaIntelligence={installed:false,publicVersion:PUBLIC_VERSION,test:null,install};
  install();
})();
