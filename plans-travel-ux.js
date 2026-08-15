/* ============================================================
   TSUKI 🌙 — PLANS + TRAVEL UX COORDINATOR
   Presentation-only coordination for existing modules.
   No health calculations or stored records are rewritten.
   ============================================================ */
(() => {
  "use strict";
  if (window.TsukiPlansTravelUX?.installed) return;

  const VERSION = "1.0.0-pre-plans-travel-ux-1";
  const $ = (s, r = document) => r.querySelector(s);

  function ensureStylesheet() {
    if ($('link[data-tsuki-ui-polish="1"]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "./ui-polish.css";
    link.dataset.tsukiUiPolish = "1";
    document.head.appendChild(link);
  }

  function setCustomPlanUI() {
    const select = $("#planLogKind");
    const input = $("#planLogName");
    if (!select || !input) return;
    const label = input.closest("label");
    const labelText = label?.querySelector(".field-label");
    let hint = label?.querySelector(".tsuki-custom-plan-hint");
    const custom = select.value === "custom";

    if (labelText) labelText.textContent = custom ? "What is this plan?" : "Name";
    input.placeholder = custom ? "e.g. Family reunion, beach day, graduation" : "e.g. Mom's birthday dinner";
    input.setAttribute("aria-required", custom ? "true" : "false");

    if (custom && label && !hint) {
      hint = document.createElement("small");
      hint.className = "tsuki-custom-plan-hint";
      hint.textContent = "Custom plans need a name so they stay meaningful in your timeline.";
      label.appendChild(hint);
    }
    if (hint) hint.classList.toggle("hidden", !custom);

    if (select.dataset.customPlanUx !== "1") {
      select.dataset.customPlanUx = "1";
      select.addEventListener("change", setCustomPlanUI);
    }

    const save = $("#planSaveEvent");
    if (save && save.dataset.customPlanGuard !== "1") {
      save.dataset.customPlanGuard = "1";
      save.addEventListener("click", event => {
        if ($("#planLogKind")?.value !== "custom") return;
        const value = $("#planLogName")?.value.trim() || "";
        if (value) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        $("#planLogName")?.focus();
        if (typeof showToast === "function") showToast("Tell Tsuki what this custom plan is first.");
      }, true);
    }
  }

  function splitTravelHistory() {
    const history = $("#travelIntelHistory");
    const travelPanel = $("#travelIntelligencePanel");
    if (!history || !travelPanel) return;
    const formCard = $("#travelSaveTrip")?.closest(".travel-card");
    if (formCard) {
      formCard.classList.add("tsuki-entry-card");
      const eyebrow = formCard.querySelector(".eyebrow");
      const h3 = formCard.querySelector("h3");
      if (eyebrow) eyebrow.textContent = "LOG IT";
      if (h3) h3.textContent = "Save a trip";
    }

    let historyCard = $("#tsukiTravelHistoryCard");
    if (!historyCard) {
      historyCard = document.createElement("article");
      historyCard.id = "tsukiTravelHistoryCard";
      historyCard.className = "travel-card tsuki-travel-history-card";
      historyCard.innerHTML = '<p class="eyebrow">PAST & SAVED TRIPS</p><h3>Travel history</h3><p class="muted small-text">Your saved and completed trips live here, separate from planning.</p>';
      travelPanel.appendChild(historyCard);
    }
    if (history.parentElement !== historyCard) historyCard.appendChild(history);
  }

  function markPlanForm() {
    const card = $("#planSaveEvent")?.closest(".plans-events-card");
    if (!card) return;
    card.classList.add("tsuki-entry-card");
    const eyebrow = card.querySelector(".eyebrow");
    const h3 = card.querySelector("h3");
    if (eyebrow) eyebrow.textContent = "LOG IT";
    if (h3) h3.textContent = "Save a plan or event";
  }

  function addPlanningSwitcher(screen) {
    let switcher = $("#tsukiPlanningSwitcher");
    if (!switcher) {
      switcher = document.createElement("nav");
      switcher.id = "tsukiPlanningSwitcher";
      switcher.className = "tsuki-planning-switcher";
      switcher.setAttribute("aria-label", "Plans and travel sections");
      switcher.innerHTML = '<button type="button" data-tsuki-plan-jump="plans">🗓️ Plans & Events</button><button type="button" data-tsuki-plan-jump="travel">✈️ Travel</button>';
      const plans = $("#plansEventsIntelligencePanel");
      if (plans) plans.before(switcher);
      else screen.prepend(switcher);
      switcher.addEventListener("click", event => {
        const button = event.target.closest("[data-tsuki-plan-jump]");
        if (!button) return;
        const target = button.dataset.tsukiPlanJump === "travel" ? $("#travelIntelligencePanel") : $("#plansEventsIntelligencePanel");
        target?.scrollIntoView({ behavior: data?.settings?.reduceMotion ? "auto" : "smooth", block: "start" });
        switcher.querySelectorAll("button").forEach(b => b.classList.toggle("active", b === button));
      });
    }
    if (!switcher.querySelector("button.active")) switcher.querySelector("button")?.classList.add("active");
  }

  function pregnancyPlanningNote() {
    const travelCard = $("#travelSaveTrip")?.closest(".travel-card");
    if (!travelCard) return;
    let note = travelCard.querySelector(".tsuki-pregnancy-plan-note");
    let text = "";
    try {
      if (data?.mode === "pregnancy" && data?.pregnancy?.active) {
        text = "🤰 Trip date checks automatically include your pregnancy week and pregnancy-specific travel context.";
      } else if (data?.mode === "cycle") {
        const uncertainty = window.TsukiTravelIntelligence?.test?.reproductiveUncertainty?.();
        if (uncertainty) text = "◐ Tsuki will also flag when pregnancy status may still be unresolved from recent activity before an important trip.";
      }
    } catch (_) {}
    if (!text) {
      note?.remove();
      return;
    }
    if (!note) {
      note = document.createElement("p");
      note.className = "tsuki-pregnancy-plan-note";
      travelCard.querySelector("button")?.insertAdjacentElement("afterend", note);
    }
    if (note.textContent !== text) note.textContent = text;
  }

  function harmonize() {
    const screen = $('[data-screen="going-out"]');
    const plans = $("#plansEventsIntelligencePanel");
    const travel = $("#travelIntelligencePanel");
    if (!screen || !plans || !travel) return;

    ensureStylesheet();
    plans.classList.add("tsuki-planning-module");
    travel.classList.add("tsuki-planning-module");
    travel.querySelector(".travel-hero")?.classList.add("tsuki-ux-secondary-hero");
    addPlanningSwitcher(screen);
    markPlanForm();
    splitTravelHistory();
    setCustomPlanUI();
    pregnancyPlanningNote();
  }

  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      harmonize();
    });
  }

  function install() {
    if (window.TsukiPlansTravelUX?.installed) return;
    if (!document.body) return setTimeout(install, 60);
    ensureStylesheet();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("change", event => {
      if (event.target?.id === "planLogKind" || event.target?.closest?.('[data-screen="going-out"]')) schedule();
    });
    schedule();
    window.TsukiPlansTravelUX = { installed: true, version: VERSION, apply: schedule, disconnect: () => observer.disconnect() };
  }

  window.TsukiPlansTravelUX = { installed: false, version: VERSION, install };
  install();
})();
