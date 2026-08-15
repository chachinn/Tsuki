/* ============================================================
   TSUKI 🌙 — VERSION 1.0 PRE-RELEASE
   PERSONAL HEALTH INPUTS
   Optional local entry layer for Personal Health Intelligence 3.0.
   ============================================================ */
(() => {
  "use strict";

  const q = (s, r = document) => r.querySelector(s);
  const today = () => typeof todayKey === "function" ? todayKey() : new Date().toISOString().slice(0, 10);
  const esc = v => String(v ?? "").replace(/[&<>'\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'\"':"&quot;"}[c]));
  const mode = () => data?.mode || "cycle";

  function store() {
    if (!data.personalHealth || typeof data.personalHealth !== "object") data.personalHealth = {};
    const s = data.personalHealth;
    if (!Array.isArray(s.fertilitySigns)) s.fertilitySigns = [];
    if (!Array.isArray(s.healthContexts)) s.healthContexts = [];
    if (!Array.isArray(s.contraceptionHistory)) s.contraceptionHistory = [];
    if (!Array.isArray(s.concerns)) s.concerns = [];
    if (!s.feedback || typeof s.feedback !== "object") s.feedback = {};
    return s;
  }

  function save() {
    try {
      if (typeof saveData === "function") saveData();
      else localStorage.setItem("tsuki-data-v4", JSON.stringify(data));
    } catch (_) {}
    try { window.TsukiPersonalHealthIntelligence?.render?.(); } catch (_) {}
  }

  function upsertByDate(list, entry) {
    const index = list.findIndex(x => x?.date === entry.date);
    if (index >= 0) list[index] = { ...list[index], ...entry };
    else list.push(entry);
  }

  function targetScreen() {
    if (mode() === "pregnancy") return q('[data-screen="pregnancy-dashboard"]') || q('[data-screen="pregnancy-today"]');
    if (mode() === "postpartum") return q('[data-screen="postpartum-feeding"]');
    return q('[data-screen="insights"]') || q('[data-screen="today"]');
  }

  function html() {
    const cycle = mode() === "cycle";
    const pregnantOrPostpartum = mode() === "pregnancy" || mode() === "postpartum";
    return `<p class="eyebrow">ADD PRIVATE HEALTH CONTEXT</p><h3>Teach Tsuki what you actually know</h3>
      <p class="muted">Everything here is optional and stays in your local Tsuki data. Missing fields remain unknown.</p>
      ${cycle ? `<details class="phi-input-detail"><summary>🌱 Fertility signs</summary>
        <form id="phiFertilityForm" class="phi-input-form">
          <label>Date<input name="date" type="date" value="${today()}"></label>
          <label>Basal body temperature<input name="bbt" type="number" step="0.01" inputmode="decimal" placeholder="Optional"></label>
          <label>Cervical mucus<select name="mucus"><option value="">Not logged</option><option>Dry</option><option>Sticky</option><option>Creamy</option><option>Watery</option><option>Slippery</option><option value="egg-white">Egg-white-like</option></select></label>
          <label>Ovulation test<select name="opk"><option value="">Not logged</option><option value="negative">Negative</option><option value="positive">Positive</option><option value="unclear">Unclear</option></select></label>
          <button type="submit" class="secondary-button full-width">Save fertility signs</button>
          <small>Tsuki can combine signs for context, but does not confirm ovulation or label unprotected sex safe.</small>
        </form></details>` : ""}
      ${mode() !== "pregnancy" ? `<details class="phi-input-detail"><summary>🛡️ Contraception context</summary>
        <form id="phiContraceptionForm" class="phi-input-form">
          <label>Date<input name="date" type="date" value="${today()}"></label>
          <label>Method<select name="method"><option value="">Choose…</option><option>Pill</option><option>Progestin-only pill</option><option>Condoms</option><option>IUD</option><option>Implant</option><option>Injection</option><option>Ring</option><option>Patch</option><option>Fertility awareness</option><option>Withdrawal</option><option>None</option><option>Other</option></select></label>
          <label>Note<input name="note" type="text" maxlength="120" placeholder="Optional method/change note"></label>
          <button type="submit" class="secondary-button full-width">Save contraception change</button>
          <small>Tsuki stores this as context. It does not invent method-specific missed-dose or replacement instructions.</small>
        </form></details>` : ""}
      <details class="phi-input-detail"><summary>🧩 Rhythm / health context</summary>
        <form id="phiContextForm" class="phi-input-form">
          <label>Date<input name="date" type="date" value="${today()}"></label>
          <label>Context<select name="context"><option value="">Choose…</option><option>Medication / treatment change</option><option>Stopped hormonal contraception</option><option>Started hormonal contraception</option><option>Illness</option><option>High stress</option><option>Travel</option><option>Major sleep disruption</option><option>Major routine change</option><option>Weight change</option><option>Intense training</option><option>Breastfeeding / weaning change</option><option>Other</option></select></label>
          <label>Note<input name="note" type="text" maxlength="160" placeholder="Optional context"></label>
          <button type="submit" class="secondary-button full-width">Save context</button>
          <small>Tsuki may notice timing overlap, but will not claim that a context caused a cycle or symptom change.</small>
        </form></details>
      <details class="phi-input-detail phi-concern-input"><summary>🫶 Something feels wrong</summary>
        <form id="phiConcernForm" class="phi-input-form">
          <label>What feels different?<textarea name="note" maxlength="300" rows="3" placeholder="Describe what is worrying you"></textarea></label>
          <button type="submit" class="secondary-button full-width">Save concern</button>
          <small>${pregnantOrPostpartum ? "If something feels unusual or is worrying you, contact your healthcare provider even if Tsuki does not match a predefined warning sign. Urgent warning signs need immediate medical care." : "If a health change feels significant, persistent, or worrying, consider contacting a healthcare professional rather than relying on Tsuki to explain it."}</small>
        </form></details>
      <p id="phiInputStatus" class="muted small-text" role="status" aria-live="polite"></p>`;
  }

  function status(text) {
    const el = q("#phiInputStatus");
    if (el) el.textContent = text;
  }

  function bind(card) {
    q("#phiFertilityForm", card)?.addEventListener("submit", e => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget); const date = fd.get("date") || today();
      const entry = { date };
      const bbt = Number(fd.get("bbt")); if (Number.isFinite(bbt) && fd.get("bbt") !== "") entry.bbt = bbt;
      const mucus = String(fd.get("mucus") || ""); if (mucus) entry.cervicalMucus = mucus;
      const opk = String(fd.get("opk") || ""); if (opk) entry.opk = opk;
      upsertByDate(store().fertilitySigns, entry); save(); status("Fertility signs saved locally.");
    });
    q("#phiContraceptionForm", card)?.addEventListener("submit", e => {
      e.preventDefault(); const fd = new FormData(e.currentTarget); const method = String(fd.get("method") || "").trim(); if (!method) return status("Choose a contraception method first.");
      store().contraceptionHistory.push({ date: fd.get("date") || today(), method, note: String(fd.get("note") || "").trim() }); save(); status("Contraception context saved locally.");
    });
    q("#phiContextForm", card)?.addEventListener("submit", e => {
      e.preventDefault(); const fd = new FormData(e.currentTarget); const context = String(fd.get("context") || "").trim(); if (!context) return status("Choose a context first.");
      store().healthContexts.push({ date: fd.get("date") || today(), context, note: String(fd.get("note") || "").trim() }); save(); status("Health context saved locally.");
    });
    q("#phiConcernForm", card)?.addEventListener("submit", e => {
      e.preventDefault(); const fd = new FormData(e.currentTarget); const note = String(fd.get("note") || "").trim(); if (!note) return status("Add a short note about what feels different.");
      store().concerns.push({ date: today(), mode: mode(), note }); save(); status(mode() === "pregnancy" || mode() === "postpartum" ? "Concern saved. If it feels unusual or worrying, contact your healthcare provider." : "Concern saved for your health timeline.");
    });
  }

  function ensureStyles() {
    if (q("#phiInputStyles")) return;
    const style = document.createElement("style"); style.id = "phiInputStyles";
    style.textContent = `.phi-input-card{margin:14px 0;padding:16px;border-radius:22px;background:var(--card,#fff)}.phi-input-detail{padding:10px 0;border-top:1px solid rgba(120,90,120,.12)}.phi-input-detail summary{font-weight:700;cursor:pointer}.phi-input-form{display:grid;gap:10px;padding-top:10px}.phi-input-form label{display:grid;gap:5px;font-size:.88rem}.phi-input-form input,.phi-input-form select,.phi-input-form textarea{width:100%;box-sizing:border-box;border:1px solid rgba(120,90,120,.18);border-radius:12px;padding:10px;background:var(--surface,#fff);font:inherit}.phi-input-form small{line-height:1.4}`;
    document.head.appendChild(style);
  }

  function render() {
    ensureStyles(); const screen = targetScreen(); if (!screen) return;
    let card = q("#personalHealthInputsCard");
    if (!card) { card = document.createElement("article"); card.id = "personalHealthInputsCard"; card.className = "phi-input-card period-signal-private"; }
    if (card.parentElement !== screen) {
      const anchor = q("#personalHealthIntelligenceCard", screen) || screen.firstElementChild;
      if (anchor) anchor.insertAdjacentElement("afterend", card); else screen.prepend(card);
    }
    card.innerHTML = html(); bind(card);
  }

  function install() {
    if (window.TsukiPersonalHealthInputs?.installed) return;
    if (typeof data === "undefined" || typeof showScreen !== "function") return setTimeout(install, 100);
    if (typeof renderEverything === "function" && !renderEverything.__phiInputsWrapped) {
      const base = renderEverything; const wrapped = function(...args){ const out=base.apply(this,args); try{render();}catch(_){} return out; }; wrapped.__phiInputsWrapped=true; try{renderEverything=wrapped;}catch(_){} window.renderEverything=wrapped;
    }
    if (typeof showScreen === "function" && !showScreen.__phiInputsWrapped) {
      const base = showScreen; const wrapped = function(name,...args){ const out=base(name,...args); requestAnimationFrame(render); return out; }; wrapped.__phiInputsWrapped=true; try{showScreen=wrapped;}catch(_){} window.showScreen=wrapped;
    }
    window.TsukiPersonalHealthInputs = { installed:true, render, version:"1.0.0-pre-phi-inputs-1" };
    render();
  }

  window.TsukiPersonalHealthInputs = { installed:false, install };
  install();
})();

/* ============================================================
   TSUKI v1 — REGULAR-CYCLE QUESTION + REPRODUCTIVE CONTEXT PATCH
   Additive layer over Reproductive Intelligence.
   - Regular-cycle questions are phase-appropriate.
   - Non-period bleeding is optional, not a routine flow question.
   - Period start time is optional metadata; calendar date remains Day 1.
   - Earlier same-day spotting is preserved when a period starts later.
   - Sexual-activity protection choices are more specific while pregnancy
     guidance remains conservative and non-numeric.
   ============================================================ */

(() => {
  "use strict";

  function installRegularCycleQuestionPatch() {
    if (!window.TsukiReproductiveIntelligence?.installed || typeof data === "undefined") {
      setTimeout(installRegularCycleQuestionPatch, 50);
      return;
    }

  const patch = {
    base: {},
    dailyDraft: null,
    periodDraft: null,
    quickPeriodDraft: null,
    commonNodes: null
  };

  const protectionOptions = [
    ["condom", "Condom / barrier"],
    ["pill-patch-ring", "Pill / patch / ring"],
    ["long-acting", "IUD / implant / injection"],
    ["dual", "Condom + another method"],
    ["withdrawal", "Withdrawal only"],
    ["none", "No contraception"],
    ["unsure", "Unsure / prefer not to say"]
  ];

  const esc2 = value => typeof escapeHTML === "function"
    ? escapeHTML(value)
    : String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

  function regularCycle() {
    let value = "regular";
    try {
      value = typeof cyclePatternSetting === "function"
        ? cyclePatternSetting()
        : (data.settings?.cyclePattern || "regular");
    }
    catch (_) {}
    return ["regular", "usually-predictable", "predictable", "typical"].includes(String(value).toLowerCase());
  }

  function currentKey() {
    return document.getElementById("logDate")?.value || (typeof todayKey === "function" ? todayKey() : "");
  }

  function currentPhase() {
    try { return typeof phaseForDate === "function" ? phaseForDate(currentKey()) : "No cycle yet"; }
    catch (_) { return "No cycle yet"; }
  }

  function phaseProfile(phase) {
    if (!regularCycle()) return { flow: true, pain: true, discharge: true };
    if (phase === "Period") return { flow: true, pain: true, discharge: false };
    if (phase === "Follicular phase") return { flow: false, pain: false, discharge: true };
    if (phase === "Estimated ovulation") return { flow: false, pain: false, discharge: true };
    if (phase === "Luteal phase") return { flow: false, pain: true, discharge: true };
    return { flow: false, pain: false, discharge: false };
  }

  function ensurePatchStyle() {
    if (document.getElementById("regularCycleQuestionPatchStyle")) return;
    const style = document.createElement("style");
    style.id = "regularCycleQuestionPatchStyle";
    style.textContent = `
      .phase-question-intro{padding:10px 11px;border-radius:14px;background:rgba(255,255,255,.55);margin-bottom:10px}
      .phase-question-intro strong{display:block;margin-bottom:3px}.phase-question-intro p{margin:0;font-size:.82rem;opacity:.8}
      .unexpected-bleeding-toggle{width:100%;margin-top:10px}
      .period-start-time-field{margin-top:12px;padding:12px;border-radius:16px;background:rgba(255,255,255,.52);border:1px solid rgba(145,112,139,.12)}
      .period-start-time-field .period-time-row{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end}
      .period-start-time-field .period-time-row button{white-space:nowrap;min-height:44px}
      .bleeding-sequence-card{margin:8px 0 0;padding:9px 11px;border-radius:13px;background:rgba(255,246,249,.82);font-size:.8rem}
      .bleeding-sequence-card strong{display:block;margin-bottom:3px}
      .period-time-chip{display:inline-flex;align-items:center;gap:4px;margin-left:6px;padding:2px 7px;border-radius:999px;background:rgba(255,255,255,.55);font-size:.72rem}
      .repro-smart-context{margin-top:10px;padding:10px 11px;border-radius:14px;background:rgba(250,246,252,.86);border:1px solid rgba(145,112,139,.1);font-size:.8rem}
      .repro-smart-context strong{display:block;margin-bottom:3px}
      @media(max-width:390px){.period-start-time-field .period-time-row{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function commonNodes() {
    if (patch.commonNodes?.grid?.isConnected) return patch.commonNodes;
    const cardFor = name => document.querySelector(`input[name="${name}"]`)?.closest("article.card") || null;
    const discharge = cardFor("discharge");
    patch.commonNodes = {
      grid: discharge?.parentElement || document.querySelector(".body-signal-details-grid"),
      discharge,
      appetite: cardFor("appetite"),
      cravings: cardFor("cravingIntensity"),
      stress: cardFor("stress"),
      libido: cardFor("libido")
    };
    return patch.commonNodes;
  }

  function restoreCommonNodes() {
    const nodes = commonNodes();
    if (!nodes.grid) return;
    [nodes.discharge, nodes.appetite, nodes.cravings, nodes.stress, nodes.libido]
      .filter(Boolean).forEach(card => nodes.grid.appendChild(card));
  }

  function moveNode(name, destination) {
    const card = commonNodes()[name];
    if (card && destination) destination.appendChild(card);
    return card;
  }

  function setCopy(card, label, helper) {
    if (!card) return;
    const labelNode = card.querySelector(".card-label");
    if (labelNode) labelNode.textContent = label;
    const helperNode = card.querySelector(".muted.small-text, .body-signal-helper");
    if (helperNode && helper) helperNode.textContent = helper;
  }

  function dischargeCopy(card, phase) {
    if (!card) return;
    card.classList.remove("hidden");
    if (phase === "Follicular phase") {
      setCopy(card, "Cervical mucus / discharge", "During the follicular phase, mucus can change as the cycle moves toward ovulation. Log what you notice; Tsuki does not confirm ovulation from discharge alone.");
    }
    else if (phase === "Estimated ovulation") {
      setCopy(card, "Cervical mucus / discharge", "Around estimated ovulation, mucus may be wetter, clearer, slippery or stretchy. This is a body observation, not proof that ovulation occurred.");
    }
    else if (phase === "Luteal phase") {
      setCopy(card, "Discharge after estimated ovulation", "After ovulation, mucus often becomes thicker, drier or less noticeable. Log what is true for you; Tsuki does not diagnose from discharge changes.");
    }
  }

  function intro(title, text) {
    return `<div class="phase-question-intro"><strong>${esc2(title)}</strong><p>${esc2(text)}</p></div>`;
  }

  function renderPhaseQuestions(phase) {
    const card = document.getElementById("phaseSpecificLogCard");
    const content = document.getElementById("phaseSpecificLogContent");
    if (!card || !content) return;

    restoreCommonNodes();
    const nodes = commonNodes();
    nodes.discharge?.classList.remove("hidden");

    if (!regularCycle()) {
      if (typeof patch.base.phaseFields === "function") patch.base.phaseFields(phase);
      return;
    }

    content.innerHTML = "";

    if (phase === "Period") {
      content.innerHTML = intro("Period-day check-in", "Flow and cramps are prioritized. Cervical-mucus questions are skipped while you are bleeding because the observation is harder to interpret.");
      nodes.discharge?.classList.add("hidden");
    }
    else if (phase === "Follicular phase") {
      content.innerHTML = intro("Follicular check-in", "Focus on energy, focus, motivation and cervical-mucus changes rather than period-flow questions.") +
        (typeof segmentedHTML === "function" ? segmentedHTML("focus", "Focus", ["Low", "Medium", "High"]) : "") +
        (typeof segmentedHTML === "function" ? segmentedHTML("motivation", "Motivation", ["Low", "Medium", "High"]) : "");
      dischargeCopy(moveNode("discharge", content), phase);
    }
    else if (phase === "Estimated ovulation") {
      content.innerHTML = intro("Estimated-ovulation check-in", "Focus on cervical mucus and any mid-cycle pelvic sensation. Tsuki keeps ovulation as an estimate unless stronger evidence is available.") +
        (typeof segmentedHTML === "function" ? segmentedHTML("ovulationDiscomfort", "Mid-cycle pelvic discomfort", ["None", "Mild", "Noticeable"]) : "");
      dischargeCopy(moveNode("discharge", content), phase);
      moveNode("libido", content);
    }
    else if (phase === "Luteal phase") {
      content.innerHTML = intro("Luteal check-in", "Focus on changes that can show up before a period: mood, energy, concentration, appetite/cravings, stress, breast or bloating/headache/skin symptoms, and discharge changes.") +
        (typeof segmentedHTML === "function" ? segmentedHTML("focus", "Focus / concentration", ["Low", "Medium", "High"]) : "");
      dischargeCopy(moveNode("discharge", content), phase);
      moveNode("appetite", content); moveNode("cravings", content); moveNode("stress", content);
    }
    else {
      nodes.discharge?.classList.add("hidden");
      content.innerHTML = intro("Daily check-in", "Tsuki does not have a reliable regular-cycle phase for this date yet, so the questions stay general.");
    }

    card.classList.remove("hidden");
  }

  function configureFlowPain() {
    if (data.mode !== "cycle" || !regularCycle()) return;
    const key = currentKey();
    const phase = currentPhase();
    const profile = phaseProfile(phase);
    const saved = data.logs?.[key] || {};
    const flowCard = document.getElementById("periodFlowCard");
    const painCard = document.getElementById("periodPainCard");
    const content = document.getElementById("phaseSpecificLogContent");

    if (flowCard) {
      if (flowCard.dataset.phaseQuestionKey !== key) {
        flowCard.dataset.phaseQuestionKey = key;
        flowCard.dataset.unexpectedBleedingOpen = "0";
      }
      const savedFlow = Boolean(saved.flow && saved.flow !== "None");
      const open = flowCard.dataset.unexpectedBleedingOpen === "1";
      const show = profile.flow || savedFlow || open;
      flowCard.classList.toggle("hidden", !show);
      flowCard.dataset.phaseFlowActive = show ? "1" : "0";
      setCopy(flowCard,
        phase === "Period" ? "Period flow" : "Unexpected spotting / bleeding",
        phase === "Period"
          ? "Track the flow you are experiencing today. Earlier spotting on the same Day 1 date can remain preserved separately."
          : "This is kept as a separate observation unless you explicitly log a period start."
      );

      content?.querySelector("[data-unexpected-bleeding-toggle]")?.remove();
      if (phase !== "Period" && content) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "secondary-button unexpected-bleeding-toggle";
        button.dataset.unexpectedBleedingToggle = "1";
        button.textContent = savedFlow ? "Edit unexpected spotting / bleeding" : "＋ Log unexpected spotting / bleeding";
        button.addEventListener("click", () => {
          flowCard.dataset.unexpectedBleedingOpen = "1";
          configureFlowPain();
          flowCard.scrollIntoView({ block: "center", behavior: data.settings?.reduceMotion ? "auto" : "smooth" });
        });
        content.appendChild(button);
      }
    }

    if (painCard) {
      const showPain = profile.pain || Number(saved.pain || 0) > 0;
      painCard.classList.toggle("hidden", !showPain);
      painCard.dataset.phasePainActive = showPain ? "1" : "0";
      if (showPain) setCopy(painCard,
        phase === "Period" ? "Cramps / pelvic discomfort" : "Pelvic cramps / discomfort",
        phase === "Period"
          ? "Track cramps or pelvic discomfort during your period."
          : "Track this if it happens before bleeding starts. Mid-cycle discomfort has its own ovulation question."
      );
    }

    renderBleedingSequence(key);
  }

  function applyPhasePatch() {
    const phase = currentPhase();
    renderPhaseQuestions(phase);
    configureFlowPain();
  }

  function captureDaily() {
    if (data.mode !== "cycle" || !regularCycle()) return;
    const key = currentKey();
    const phase = currentPhase();
    const flowCard = document.getElementById("periodFlowCard");
    const painCard = document.getElementById("periodPainCard");
    patch.dailyDraft = {
      key, phase,
      previousFlow: data.logs?.[key]?.flow || "",
      flow: document.querySelector('input[name="flow"]:checked')?.value || "",
      pain: Number(document.getElementById("painLevel")?.value || 0),
      keepFlow: phase !== "Period" && flowCard?.dataset.phaseFlowActive === "1",
      keepPain: phase !== "Period" && painCard?.dataset.phasePainActive === "1"
    };
  }

  function addTimeline(log, item) {
    if (!log) return;
    const timeline = Array.isArray(log.bleedingTimeline) ? log.bleedingTimeline : [];
    log.bleedingTimeline = timeline;
    const index = timeline.findIndex(entry => entry?.kind === item.kind);
    if (index >= 0) timeline[index] = { ...timeline[index], ...item };
    else timeline.push(item);
    log.bleedingSequenceVersion = 1;
  }

  function persistDaily() {
    const draft = patch.dailyDraft; patch.dailyDraft = null;
    if (!draft?.key || !data.logs?.[draft.key]) return;
    const log = data.logs[draft.key]; let changed = false;
    if (draft.phase !== "Period" && draft.keepFlow) { log.flow = draft.flow || ""; changed = true; }
    if (draft.phase !== "Period" && draft.keepPain) { log.pain = Number(draft.pain || 0); changed = true; }
    const period = data.periods?.find(item => item.start === draft.key);
    if (period && draft.previousFlow === "Spotting" && ["Light", "Medium", "Heavy"].includes(draft.flow)) {
      addTimeline(log, { kind: "earlier-spotting", flow: "Spotting", time: "" }); changed = true;
    }
    if (period && (period.startTime || Array.isArray(log.bleedingTimeline))) {
      addTimeline(log, { kind: "period-start", flow: ["Light", "Medium", "Heavy"].includes(log.flow) ? log.flow : "", time: normalizeTime2(period.startTime) }); changed = true;
    }
    if (changed) { saveData(); try { loadLogForm?.(); } catch (_) {} }
  }

  function normalizeTime2(value) {
    const match = String(value || "").match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    return match ? `${match[1]}:${match[2]}` : "";
  }

  function formatTime2(value) {
    const normalized = normalizeTime2(value); if (!normalized) return "";
    const [h,m] = normalized.split(":").map(Number);
    return new Date(2000,0,1,h,m).toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"});
  }

  function nowTime2() {
    const d = new Date(); return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  }

  function ensureTimeFields() {
    const hint = document.getElementById("periodLengthHint");
    if (hint && !document.getElementById("periodStartTimeField")) {
      const box = document.createElement("div"); box.id="periodStartTimeField"; box.className="period-start-time-field";
      box.innerHTML=`<label class="field-label" for="periodStartTime">Approximate start time <span class="muted">(optional)</span></label><div class="period-time-row"><input id="periodStartTime" class="input" type="time"><button type="button" id="periodStartTimeNow" class="secondary-button">Use now</button></div><p class="muted small-text">Day 1 stays on the selected calendar date. Time only preserves the order of spotting → period flow within that day.</p>`;
      hint.insertAdjacentElement("afterend",box);
      document.getElementById("periodStartTimeNow")?.addEventListener("click",()=>{document.getElementById("periodStartTime").value=nowTime2();});
    }
    const quick=document.querySelector("#quickPeriodSinglePanel .quick-period-help");
    if(quick&&!document.getElementById("quickPeriodStartTimeField")){
      const box=document.createElement("div");box.id="quickPeriodStartTimeField";box.className="period-start-time-field";
      box.innerHTML=`<label class="field-label" for="quickPeriodStartTime">Approximate start time <span class="muted">(optional)</span></label><div class="period-time-row"><input id="quickPeriodStartTime" class="input" type="time"><button type="button" id="quickPeriodStartTimeNow" class="secondary-button">Use now</button></div><p class="muted small-text">A late-night start is still Day 1 for the selected date. The time does not shift the next-period forecast.</p>`;
      quick.insertAdjacentElement("afterend",box);
      document.getElementById("quickPeriodStartTimeNow")?.addEventListener("click",()=>{document.getElementById("quickPeriodStartTime").value=nowTime2();});
    }
  }

  function capturePeriod(source) {
    let start="",id="",time="";
    if(source==="history"){
      start=document.getElementById("periodStartDate")?.value||"";id=document.getElementById("editingPeriodId")?.value||"";time=document.getElementById("periodStartTime")?.value||"";
    }else{
      try{start=typeof quickPeriodSingleStart!=="undefined"?quickPeriodSingleStart:"";id=typeof quickPeriodSingleEditingId!=="undefined"?quickPeriodSingleEditingId:"";}catch(_){}
      time=document.getElementById("quickPeriodStartTime")?.value||"";
    }
    if(!start)return;
    const draft={start,id,time,priorFlow:data.logs?.[start]?.flow||"",before:(data.periods||[]).map(p=>p.id),editing:Boolean(id)};
    if(source==="history")patch.periodDraft=draft;else patch.quickPeriodDraft=draft;
    setTimeout(()=>persistPeriod(source),0);
  }

  function persistPeriod(source){
    const draft=source==="history"?patch.periodDraft:patch.quickPeriodDraft;if(source==="history")patch.periodDraft=null;else patch.quickPeriodDraft=null;
    if(!draft)return;
    let period=draft.id?data.periods?.find(p=>p.id===draft.id):null;
    if(!period){const before=new Set(draft.before);period=data.periods?.find(p=>p.start===draft.start&&!before.has(p.id))||data.periods?.find(p=>p.start===draft.start);}
    if(!period||period.start!==draft.start)return;
    const t=normalizeTime2(draft.time);if(t)period.startTime=t;else if(draft.editing)delete period.startTime;
    const log=data.logs?.[period.start];
    if(log){if(draft.priorFlow==="Spotting")addTimeline(log,{kind:"earlier-spotting",flow:"Spotting",time:""});addTimeline(log,{kind:"period-start",flow:["Light","Medium","Heavy"].includes(log.flow)?log.flow:"",time:period.startTime||""});}
    saveData();try{renderCycleHistory?.();}catch(_){}renderBleedingSequence(period.start);
  }

  function renderBleedingSequence(key=currentKey()){
    const card=document.getElementById("periodFlowCard");if(!card)return;card.querySelector(".bleeding-sequence-card")?.remove();
    const log=data.logs?.[key],period=data.periods?.find(p=>p.start===key),timeline=Array.isArray(log?.bleedingTimeline)?log.bleedingTimeline:[];
    const earlier=timeline.some(x=>x?.kind==="earlier-spotting"),time=period?.startTime||timeline.find(x=>x?.kind==="period-start")?.time||"";
    if(!earlier&&!time)return;const box=document.createElement("div");box.className="bleeding-sequence-card";
    const flow=log?.flow&&log.flow!=="None"?log.flow:"";box.innerHTML=`<strong>Same-day bleeding sequence</strong><span>${earlier?"Earlier: Spotting":""}${earlier&&time?" · ":""}${time?`Period started: ${esc2(formatTime2(time))}`:""}${flow?` · Current flow: ${esc2(flow)}`:""}</span>`;card.appendChild(box);
  }

  function syncHistoryTime(){ensureTimeFields();const input=document.getElementById("periodStartTime");if(!input)return;const id=document.getElementById("editingPeriodId")?.value||"";input.value=normalizeTime2(data.periods?.find(p=>p.id===id)?.startTime||"");}
  function syncQuickTime(){ensureTimeFields();const input=document.getElementById("quickPeriodStartTime");if(!input)return;let id="";try{id=typeof quickPeriodSingleEditingId!=="undefined"?quickPeriodSingleEditingId:"";}catch(_){}input.value=normalizeTime2(data.periods?.find(p=>p.id===id)?.startTime||"");}
  function annotateHistory(){document.querySelectorAll("[data-period-edit]").forEach(button=>{const period=data.periods?.find(p=>p.id===button.dataset.periodEdit),time=formatTime2(period?.startTime);if(!time)return;const card=button.closest(".period-history-card, article"),target=card?.querySelector("p");if(!target||target.querySelector(".period-time-chip"))return;const chip=document.createElement("span");chip.className="period-time-chip";chip.textContent=`🕒 ${time}`;target.appendChild(chip);});}

  function detailedProtectionContext(value,issue){
    const timing=window.TsukiReproductiveIntelligence?.test?.pregnancyPossibility?.(currentKey());
    const timingLabel=timing?.label||"Timing uncertain";
    if(issue||["withdrawal","none","unsure",""] .includes(value))return {risk:"potential",title:"Potentially unprotected context",text:`${timingLabel}. Tsuki keeps this conservative; if you are avoiding pregnancy, existing emergency-contraception or pregnancy-test follow-up may apply based on timing.`};
    const names={condom:"Condom / barrier","pill-patch-ring":"Pill / patch / ring","long-acting":"IUD / implant / injection",dual:"Condom + another method"};
    return {risk:"protected",title:`${names[value]||"Protection"} logged`,text:`${timingLabel}. Protection can reduce pregnancy chance when used correctly, but Tsuki does not calculate an exact personal percentage or treat calendar timing as contraception.`};
  }

  function enhanceSexCard(){
    const card=document.getElementById("reproductiveSexCard");if(!card)return;const grid=card.querySelector('input[name="reproProtection"]')?.closest(".repro-choice-grid");if(!grid)return;
    const key=currentKey(),saved=data.logs?.[key]?.sexualActivity||{},selectedRaw=saved.protection||card.querySelector('input[name="reproProtection"]:checked')?.value||"",selected=selectedRaw==="hormonal"?"pill-patch-ring":selectedRaw;
    const field=grid.closest(".repro-field");const heading=field?.querySelector("strong");if(heading)heading.textContent="Protection / contraception used";
    grid.innerHTML=protectionOptions.map(([value,label])=>`<label class="repro-choice"><input type="radio" name="reproProtection" value="${value}" ${selected===value?"checked":""}><span>${label}</span></label>`).join("");
    const issue=document.getElementById("reproCondomIssue");if(issue){const span=issue.closest("label")?.querySelector("span");if(span)span.textContent="Protection issue: condom broke/slipped, a method was missed/late, or you are unsure it worked";}
    let context=document.getElementById("reproSmartProtectionContext");if(!context){context=document.createElement("div");context.id="reproSmartProtectionContext";context.className="repro-smart-context";(issue?.closest("label")||grid).insertAdjacentElement("afterend",context);}
    const update=()=>{const method=card.querySelector('input[name="reproProtection"]:checked')?.value||"",result=detailedProtectionContext(method,Boolean(issue?.checked));context.innerHTML=`<strong>${esc2(result.title)}</strong><span>${esc2(result.text)}</span>`;};
    grid.querySelectorAll('input[name="reproProtection"]').forEach(input=>input.addEventListener("change",update));issue?.addEventListener("change",update);update();
  }

  function afterLogRender(){applyPhasePatch();enhanceSexCard();ensureTimeFields();}

  ensurePatchStyle();ensureTimeFields();

  if(typeof renderPhaseSpecificLogFields==="function"){patch.base.phaseFields=renderPhaseSpecificLogFields;renderPhaseSpecificLogFields=function(phase){return renderPhaseQuestions(phase);};}
  if(typeof loadLogForm==="function"){patch.base.loadLog=loadLogForm;loadLogForm=function(...args){const result=patch.base.loadLog(...args);afterLogRender();return result;};}
  if(typeof renderEverything==="function"){patch.base.renderEverything=renderEverything;renderEverything=function(...args){const result=patch.base.renderEverything(...args);afterLogRender();annotateHistory();return result;};}
  if(typeof showScreen==="function"){patch.base.showScreen=showScreen;showScreen=function(name,...args){const result=patch.base.showScreen(name,...args);if(name==="log")requestAnimationFrame(afterLogRender);if(name==="cycle-history")requestAnimationFrame(()=>{ensureTimeFields();annotateHistory();});return result;};}
  if(typeof renderCycleHistory==="function"){patch.base.renderHistory=renderCycleHistory;renderCycleHistory=function(...args){const result=patch.base.renderHistory(...args);annotateHistory();return result;};}
  if(typeof editPeriod==="function"){patch.base.editPeriod=editPeriod;editPeriod=function(...args){const result=patch.base.editPeriod(...args);syncHistoryTime();return result;};}
  if(typeof resetPeriodForm==="function"){patch.base.resetPeriod=resetPeriodForm;resetPeriodForm=function(...args){const result=patch.base.resetPeriod(...args);const input=document.getElementById("periodStartTime");if(input)input.value="";return result;};}
  if(typeof openQuickPeriodEntry==="function"){patch.base.openQuick=openQuickPeriodEntry;openQuickPeriodEntry=function(...args){const result=patch.base.openQuick(...args);syncQuickTime();return result;};}
  if(typeof renderQuickPeriodSingle==="function"){patch.base.renderQuick=renderQuickPeriodSingle;renderQuickPeriodSingle=function(...args){const result=patch.base.renderQuick(...args);syncQuickTime();return result;};}

  const form=document.getElementById("dailyLogForm");if(form&&form.dataset.phasePatchBound!=="1"){form.dataset.phasePatchBound="1";form.addEventListener("submit",captureDaily,true);form.addEventListener("submit",()=>setTimeout(persistDaily,0));document.getElementById("logDate")?.addEventListener("change",()=>requestAnimationFrame(afterLogRender));}
  const historySave=document.getElementById("savePeriodButton");if(historySave&&historySave.dataset.periodTimePatch!=="1"){historySave.dataset.periodTimePatch="1";historySave.addEventListener("click",()=>capturePeriod("history"),true);}
  const quickSave=document.getElementById("quickPeriodSaveSingle");if(quickSave&&quickSave.dataset.periodTimePatch!=="1"){quickSave.dataset.periodTimePatch="1";quickSave.addEventListener("click",()=>capturePeriod("quick"),true);}

  const existingTest=window.TsukiReproductiveIntelligence.test||{};
  window.TsukiReproductiveIntelligence.patchVersion=2;
  window.TsukiReproductiveIntelligence.test={...existingTest,phaseQuestionProfile:phaseProfile,detailedProtectionContext,normalizePeriodStartTime:normalizeTime2};

  afterLogRender();annotateHistory();
  }

  installRegularCycleQuestionPatch();
})();
