/* ============================================================
   TSUKI 🌙 — SMART REMINDERS BOOTSTRAP
   Keeps the existing Smart Reminders runtime intact while loading the
   phase-aware cycle/reproductive enhancement after the core app is ready.
   ============================================================ */
(() => {
  "use strict";

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

  loadScript("./smart-reminders-core.js")
    .then(() => loadScript("./cycle-reproductive-enhancements.js"))
    .then(() => loadScript("./cycle-phase-guidance.js"))
    .catch(error => console.error("Tsuki runtime enhancement load failed:", error));
})();
