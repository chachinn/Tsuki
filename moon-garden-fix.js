/* ============================================================
   TSUKI 🌙 — MOON GARDEN RENDER FIX
   Compatibility repair for Moon Garden cycle dates stored as YYYY-MM-DD.
   The existing garden renderer passes those strings to formatDate(), which
   expects a Date object. This wrapper normalizes dates only while the garden
   renders, preserving the original renderer and all stored cycle data.
   ============================================================ */
(() => {
  "use strict";

  if (window.TsukiMoonGardenFix?.installed) return;

  const VERSION = "1.0.0-pre-moon-garden-fix-1";
  const baseRender = typeof window.renderMoonGarden === "function"
    ? window.renderMoonGarden
    : (typeof renderMoonGarden === "function" ? renderMoonGarden : null);
  const baseFormat = typeof window.formatDate === "function"
    ? window.formatDate
    : (typeof formatDate === "function" ? formatDate : null);

  if (!baseRender || !baseFormat) {
    console.warn("Tsuki Moon Garden fix could not install because the core renderer is unavailable.");
    return;
  }

  function gardenFormatDate(value) {
    let normalized = value;
    if (typeof value === "string" && typeof window.parseDate === "function") {
      normalized = window.parseDate(value);
    }
    else if (typeof value === "string" && typeof parseDate === "function") {
      normalized = parseDate(value);
    }
    return baseFormat(normalized);
  }

  function renderMoonGardenSafe(...args) {
    const previousWindowFormat = window.formatDate;
    let previousBinding = previousWindowFormat;

    try {
      try { previousBinding = formatDate; } catch (_) {}
      window.formatDate = gardenFormatDate;
      try { formatDate = gardenFormatDate; } catch (_) {}
      return baseRender.apply(this, args);
    }
    finally {
      window.formatDate = previousWindowFormat;
      try { formatDate = previousBinding; } catch (_) {}
    }
  }

  try { renderMoonGarden = renderMoonGardenSafe; } catch (_) {}
  window.renderMoonGarden = renderMoonGardenSafe;

  window.TsukiMoonGardenFix = {
    installed: true,
    version: VERSION,
    render: renderMoonGardenSafe,
    test: { gardenFormatDate }
  };

  if (document.querySelector('[data-screen="moon-garden"]')?.classList.contains("active")) {
    requestAnimationFrame(renderMoonGardenSafe);
  }
})();
