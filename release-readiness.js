/* ============================================================
   TSUKI 🌙 — VERSION 1.0 PRE-RELEASE
   RELEASE READINESS + DATA HEALTH CHECK
   Local-only diagnostics. Does not upload, diagnose, or rewrite health history.
   ============================================================ */
(() => {
  "use strict";

  const STORAGE_KEY = "tsuki-data-v4";
  const RECOVERY_KEY = "tsuki-last-good-data-v1";
  const ALLOWED_MODES = new Set(["cycle", "pregnancy", "postpartum"]);
  const q = (s, r = document) => r.querySelector(s);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  function safeJson(raw) {
    if (!raw || typeof raw !== "string") return { ok: false, value: null };
    try { return { ok: true, value: JSON.parse(raw) }; }
    catch (_) { return { ok: false, value: null }; }
  }

  async function readRecoverySnapshot() {
    try {
      if (typeof appearanceAssetGet === "function") {
        const raw = await appearanceAssetGet(RECOVERY_KEY);
        if (typeof raw === "string" && raw.trim()) return { raw, source: "local recovery store" };
      }
    } catch (_) {}
    try {
      const legacy = localStorage.getItem(RECOVERY_KEY) || "";
      if (legacy) return { raw: legacy, source: "legacy local recovery" };
    } catch (_) {}
    return { raw: "", source: "none" };
  }

  function bytes(text = "") {
    try { return new Blob([text]).size; }
    catch (_) { return String(text).length; }
  }

  function formatBytes(value) {
    const n = Number(value || 0);
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  }

  function countArray(obj, key) {
    return Array.isArray(obj?.[key]) ? obj[key].length : 0;
  }

  function summarizeRecords(value) {
    const seen = new WeakSet();
    let arrays = 0;
    let entries = 0;
    function walk(node) {
      if (!node || typeof node !== "object") return;
      if (seen.has(node)) return;
      seen.add(node);
      if (Array.isArray(node)) {
        arrays += 1;
        entries += node.length;
        for (const item of node) walk(item);
        return;
      }
      for (const child of Object.values(node)) walk(child);
    }
    walk(value);
    return { arrays, entries };
  }

  function structuralChecks(value) {
    const issues = [];
    if (!value || typeof value !== "object" || Array.isArray(value)) issues.push("Stored Tsuki data is not a valid root object.");
    if (!Array.isArray(value?.periods)) issues.push("Period history is not in the expected list format.");
    if (value?.mode && !ALLOWED_MODES.has(value.mode)) issues.push("Life-mode value is not recognized.");
    if (value?.pregnancy != null && typeof value.pregnancy !== "object") issues.push("Pregnancy record shape needs repair.");
    if (value?.postpartum != null && typeof value.postpartum !== "object") issues.push("Postpartum record shape needs repair.");
    if (value?.personalHealth != null && typeof value.personalHealth !== "object") issues.push("Personal Health record shape needs repair.");
    return issues;
  }

  async function runCheck() {
    const raw = localStorage.getItem(STORAGE_KEY) || "";
    const parsed = safeJson(raw);
    const recoveryResult = await readRecoverySnapshot();
    const recoveryRaw = recoveryResult.raw;
    const recovery = safeJson(recoveryRaw);
    const issues = [];
    const cautions = [];

    if (!raw) issues.push("No current local Tsuki data snapshot was found.");
    else if (!parsed.ok) issues.push("Current local Tsuki data cannot be parsed safely.");
    else issues.push(...structuralChecks(parsed.value));

    if (!recoveryRaw) cautions.push("No last-good local recovery snapshot is currently available.");
    else if (!recovery.ok) cautions.push("The last-good recovery snapshot is unreadable.");

    let quota = null;
    let usage = null;
    try {
      const estimate = await navigator.storage?.estimate?.();
      quota = Number(estimate?.quota || 0) || null;
      usage = Number(estimate?.usage || 0) || null;
      if (quota && usage && usage / quota >= 0.85) cautions.push("Browser storage is above 85% of its estimated quota.");
    } catch (_) {}

    let cacheState = "Unavailable";
    try {
      const keys = "caches" in window ? await caches.keys() : [];
      const expected = typeof APP_CACHE_NAME !== "undefined" ? APP_CACHE_NAME : "";
      cacheState = expected && keys.includes(expected) ? "Current" : keys.length ? "Refreshing / older cache present" : "Not cached yet";
    } catch (_) {}

    const base = parsed.ok ? parsed.value : (typeof data !== "undefined" ? data : {});
    const records = summarizeRecords(base);
    const periodCount = countArray(base, "periods");
    const concernCount = countArray(base?.personalHealth, "concerns");
    const status = issues.length ? "attention" : cautions.length ? "watch" : "healthy";

    const result = {
      status,
      checkedAt: new Date().toISOString(),
      parseHealthy: parsed.ok,
      currentBytes: bytes(raw),
      recoveryHealthy: recovery.ok,
      recoveryBytes: bytes(recoveryRaw),
      recoverySource: recoveryResult.source,
      records,
      periodCount,
      concernCount,
      cacheState,
      usage,
      quota,
      issues,
      cautions
    };
    renderResult(result);
    return result;
  }

  function statusLabel(status) {
    if (status === "healthy") return "Healthy";
    if (status === "watch") return "Healthy · check note";
    return "Needs attention";
  }

  function renderResult(result) {
    const pill = q("#releaseHealthPill");
    const body = q("#releaseHealthResult");
    if (!pill || !body) return;
    pill.textContent = statusLabel(result.status);
    pill.dataset.state = result.status;
    const storage = result.quota && result.usage ? `${formatBytes(result.usage)} / ${formatBytes(result.quota)}` : "Estimate unavailable";
    const notes = [
      ...result.issues.map(text => `<li><strong>Needs attention:</strong> ${esc(text)}</li>`),
      ...result.cautions.map(text => `<li>${esc(text)}</li>`)
    ];
    body.innerHTML = `
      <div class="rr-health-grid">
        <div><small>Current data</small><strong>${result.parseHealthy ? "Readable" : "Problem"} · ${formatBytes(result.currentBytes)}</strong></div>
        <div><small>Local recovery</small><strong>${result.recoveryHealthy ? `Available · ${formatBytes(result.recoveryBytes)}` : "Not ready"}</strong></div>
        <div><small>Stored list entries</small><strong>${result.records.entries.toLocaleString()}</strong></div>
        <div><small>Browser storage</small><strong>${esc(storage)}</strong></div>
        <div><small>PWA cache</small><strong>${esc(result.cacheState)}</strong></div>
        <div><small>Period records</small><strong>${result.periodCount.toLocaleString()}</strong></div>
      </div>
      ${notes.length ? `<ul class="rr-health-notes">${notes.join("")}</ul>` : `<p class="rr-good">✓ Tsuki's current local data passed the structural health check.</p>`}
      <p class="muted small-text">Checked ${new Date(result.checkedAt).toLocaleString()}. This diagnostic stays on this device and does not upload health data.</p>`;
  }

  function ensureStyles() {
    if (q("#releaseReadinessStyles")) return;
    const style = document.createElement("style");
    style.id = "releaseReadinessStyles";
    style.textContent = `
      .rr-card{margin:16px 0;padding:18px;border-radius:22px;background:var(--card,#fff)}
      .rr-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
      .rr-pill{font-size:.76rem;font-weight:800;padding:6px 10px;border-radius:999px;background:rgba(120,90,120,.09);white-space:nowrap}
      .rr-pill[data-state="healthy"]{background:rgba(59,147,94,.12)}
      .rr-pill[data-state="attention"]{background:rgba(190,75,75,.12)}
      .rr-health-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:14px 0}
      .rr-health-grid>div{padding:11px;border-radius:14px;background:rgba(120,90,120,.055);min-width:0}
      .rr-health-grid small,.rr-health-grid strong{display:block;overflow-wrap:anywhere}.rr-health-grid small{opacity:.68;margin-bottom:3px}
      .rr-health-notes{padding-left:20px;line-height:1.45}.rr-good{font-weight:700}
      .rr-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px}
      @media(max-width:360px){.rr-health-grid,.rr-actions{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function renderCard() {
    ensureStyles();
    const screen = q('[data-screen="me"]');
    if (!screen) return;
    let card = q("#releaseReadinessCard");
    if (!card) {
      card = document.createElement("article");
      card.id = "releaseReadinessCard";
      card.className = "rr-card period-signal-private";
      card.innerHTML = `
        <div class="rr-heading"><div><p class="eyebrow">DATA HEALTH CHECK</p><h3>Is my Tsuki data healthy?</h3><p class="muted small-text">Checks local data readability, recovery readiness, storage pressure and PWA cache status without changing your health records.</p></div><span id="releaseHealthPill" class="rr-pill">Not checked</span></div>
        <div id="releaseHealthResult"><p class="muted">Run a check whenever you want reassurance before an update, restore or major change.</p></div>
        <div class="rr-actions"><button type="button" id="runReleaseHealthCheck" class="secondary-button">Run health check</button><button type="button" id="releaseSafeRepair" class="secondary-button">Repair structure safely</button></div>`;
      const diagnostics = q("#diagnosticsCard", screen);
      if (diagnostics) diagnostics.insertAdjacentElement("afterend", card);
      else screen.appendChild(card);
      q("#runReleaseHealthCheck", card)?.addEventListener("click", () => runCheck());
      q("#releaseSafeRepair", card)?.addEventListener("click", () => {
        if (typeof repairLocalData === "function") repairLocalData();
        setTimeout(() => runCheck(), 50);
      });
    }
  }

  function install() {
    if (window.TsukiReleaseReadiness?.installed) return;
    if (typeof data === "undefined") return setTimeout(install, 100);
    renderCard();
    window.TsukiReleaseReadiness = { installed: true, runCheck, render: renderCard, version: "1.0.0-pre-release-readiness-2" };
  }

  window.TsukiReleaseReadiness = { installed: false, install };
  install();
})();
