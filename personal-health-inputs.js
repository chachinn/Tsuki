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
