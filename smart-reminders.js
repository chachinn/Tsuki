/* ============================================================
   TSUKI 🌙 — SMART REMINDERS BOOTSTRAP
   Keeps the existing Smart Reminders runtime intact while loading the
   phase-aware cycle/reproductive, medical, and UI enhancements after
   the core app is ready.
   ============================================================ */
(() => {
  "use strict";

  function ensureStylesheet(src, key) {
    if (document.querySelector(`link[data-tsuki-style="${key}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = src;
    link.dataset.tsukiStyle = key;
    document.head.appendChild(link);
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-tsuki-runtime="${src}"]`);
      if (existing) {
        if (existing.dataset.loaded === "1") resolve();
        else existing.addEventListener("load", resolve, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.dataset.tsukiRuntime = src;
      script.addEventListener("load", () => {
        script.dataset.loaded = "1";
        resolve();
      }, { once: true });
      script.addEventListener("error", () => reject(new Error(`Could not load ${src}`)), { once: true });
      document.head.appendChild(script);
    });
  }

  /* Loaded here as well as through the service-worker shell so an older
     active worker can still fetch the usability fix on its next online load. */
  ensureStylesheet("./period-modal-scroll-fix.css", "period-modal-scroll-fix");

  loadScript("./smart-reminders-core.js")
    .then(() => loadScript("./cycle-reproductive-enhancements.js"))
    .then(() => loadScript("./cycle-phase-guidance.js"))
    .then(() => loadScript("./cycle-phase-dedupe.js"))
    .then(() => loadScript("./medical-accuracy-hardening.js"))
    .then(() => loadScript("./cycle-milestone-hero.js"))
    .then(() => loadScript("./plans-travel-ux.js"))
    .catch(error => console.error("Tsuki runtime enhancement load failed:", error));
})();
