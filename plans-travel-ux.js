/* ============================================================
   TSUKI 🌙 — PLANS + TRAVEL UX COORDINATOR
   Organizes existing Plans/Travel features without deleting or
   rewriting saved records, health calculations, or module logic.
   ============================================================ */
(() => {
  "use strict";
  if (window.TsukiPlansTravelUX?.installed) return;

  const VERSION = "1.0.0-pre-plans-travel-ux-4";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  let busy = false;

  function ensureStylesheet() {
    if ($('link[data-tsuki-ui-polish="1"]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "./ui-polish.css";
    link.dataset.tsukiUiPolish = "1";
    document.head.appendChild(link);
  }

  function setText(node, value) {
    if (node && node.textContent !== value) node.textContent = value;
  }

  function cardByControl(id) {
    return document.getElementById(id)?.closest(".plans-events-card,.travel-card") || null;
  }

  function cardByHeading(panel, text) {
    if (!panel) return null;
    return $$(".plans-events-card,.travel-card", panel).find(card =>
      String(card.querySelector("h3")?.textContent || "").trim().includes(text)
    ) || null;
  }

  function ensureShell(screen) {
    let shell = $("#tsukiPlanningWorkspace", screen);
    if (shell) return shell;

    shell = document.createElement("section");
    shell.id = "tsukiPlanningWorkspace";
    shell.className = "tsuki-planning-workspace plans-events-private period-signal-private";
    shell.innerHTML = `
      <article class="tsuki-planning-hero">
        <div class="tsuki-planning-hero-icon" aria-hidden="true">🌙</div>
        <div>
          <p class="eyebrow">PLANS & TRAVEL</p>
          <h2>Plan life around your body</h2>
          <p>Save everyday plans, check important dates, plan trips, and review what already happened — all in one place.</p>
        </div>
      </article>
      <nav class="tsuki-workspace-tabs" aria-label="Plans and travel workspace">
        <button type="button" data-tsuki-workspace="plans" aria-controls="tsukiWorkspacePlans">🗓️ <span>Plans</span></button>
        <button type="button" data-tsuki-workspace="travel" aria-controls="tsukiWorkspaceTravel">✈️ <span>Travel</span></button>
        <button type="button" data-tsuki-workspace="history" aria-controls="tsukiWorkspaceHistory">🕘 <span>History</span></button>
      </nav>
      <div id="tsukiWorkspacePlans" class="tsuki-workspace-panel" data-tsuki-panel="plans">
        <header class="tsuki-workspace-heading"><p class="eyebrow">PLANS</p><h3>Save something important</h3><p>Birthdays, appointments, dates, work events, out-of-town days and anything custom.</p></header>
        <div class="tsuki-workspace-body" data-tsuki-body="plans"></div>
      </div>
      <div id="tsukiWorkspaceTravel" class="tsuki-workspace-panel" data-tsuki-panel="travel" hidden>
        <header class="tsuki-workspace-heading"><p class="eyebrow">TRAVEL</p><h3>Check, choose and save your trip</h3><p>Compare dates with your current cycle or pregnancy context before you commit.</p></header>
        <div id="tsukiTravelContextSlot"></div>
        <div class="tsuki-workspace-body" data-tsuki-body="travel"></div>
      </div>
      <div id="tsukiWorkspaceHistory" class="tsuki-workspace-panel" data-tsuki-panel="history" hidden>
        <header class="tsuki-workspace-heading"><p class="eyebrow">HISTORY</p><h3>Your plans and trips</h3><p>Review saved and completed items without mixing them into the planning forms.</p></header>
        <div class="tsuki-history-tabs" role="tablist" aria-label="History type">
          <button type="button" data-tsuki-history="all">All plans</button>
          <button type="button" data-tsuki-history="travel">Trips only</button>
        </div>
        <section data-tsuki-history-panel="all" class="tsuki-history-panel"></section>
        <section data-tsuki-history-panel="travel" class="tsuki-history-panel" hidden></section>
      </div>`;

    const title = screen.querySelector(".page-title");
    if (title) title.insertAdjacentElement("afterend", shell);
    else screen.prepend(shell);

    shell.addEventListener("click", event => {
      const workspace = event.target.closest("[data-tsuki-workspace]");
      if (workspace) {
        selectWorkspace(workspace.dataset.tsukiWorkspace);
        return;
      }
      const history = event.target.closest("[data-tsuki-history]");
      if (history) selectHistory(history.dataset.tsukiHistory);
    });
    return shell;
  }

  function selectWorkspace(name = "plans") {
    const shell = $("#tsukiPlanningWorkspace");
    if (!shell) return;
    const safe = ["plans","travel","history"].includes(name) ? name : "plans";
    shell.querySelectorAll("[data-tsuki-workspace]").forEach(button => {
      const active = button.dataset.tsukiWorkspace === safe;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });
    shell.querySelectorAll("[data-tsuki-panel]").forEach(panel => {
      panel.hidden = panel.dataset.tsukiPanel !== safe;
    });
    try { sessionStorage.setItem("tsuki-planning-workspace", safe); } catch (_) {}
  }

  function selectHistory(name = "all") {
    const shell = $("#tsukiPlanningWorkspace");
    if (!shell) return;
    const safe = name === "travel" ? "travel" : "all";
    shell.querySelectorAll("[data-tsuki-history]").forEach(button => {
      const active = button.dataset.tsukiHistory === safe;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });
    shell.querySelectorAll("[data-tsuki-history-panel]").forEach(panel => {
      panel.hidden = panel.dataset.tsukiHistoryPanel !== safe;
    });
  }

  function ensureDisclosure(id, label, parent) {
    let details = document.getElementById(id);
    if (!details) {
      details = document.createElement("details");
      details.id = id;
      details.className = "tsuki-planning-disclosure";
      const summary = document.createElement("summary");
      summary.textContent = label;
      details.appendChild(summary);
    }
    if (parent && details.parentElement !== parent) parent.appendChild(details);
    return details;
  }

  function setCustomPlanUI() {
    const select = $("#planLogKind");
    const input = $("#planLogName");
    if (!select || !input) return;
    const label = input.closest("label");
    const labelText = label?.querySelector(".field-label");
    let hint = label?.querySelector(".tsuki-custom-plan-hint");
    const custom = select.value === "custom";
    const wantedLabel = custom ? "What is this plan?" : "Name";
    const wantedPlaceholder = custom ? "e.g. Family reunion, beach day, graduation" : "e.g. Mom's birthday dinner";

    setText(labelText, wantedLabel);
    if (input.placeholder !== wantedPlaceholder) input.placeholder = wantedPlaceholder;
    input.setAttribute("aria-required", custom ? "true" : "false");

    if (custom && label && !hint) {
      hint = document.createElement("small");
      hint.className = "tsuki-custom-plan-hint";
      hint.textContent = "Give this custom plan a name so it stays meaningful later.";
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
        if ($("#planLogName")?.value.trim()) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        $("#planLogName")?.focus();
        if (typeof showToast === "function") showToast("Tell Tsuki what this custom plan is first.");
      }, true);
    }
  }

  function pregnancyContextCard(slot) {
    if (!slot) return;
    let text = "";
    try {
      if (data?.mode === "pregnancy" && data?.pregnancy?.active) {
        text = "🤰 Trip checks include your pregnancy week and pregnancy-specific travel context automatically.";
      } else if (data?.mode === "cycle") {
        const uncertainty = window.TsukiTravelIntelligence?.test?.reproductiveUncertainty?.();
        if (uncertainty) text = "◐ Pregnancy status may still be unresolved from recent activity. Tsuki will keep that uncertainty in mind when checking important travel dates.";
      }
    } catch (_) {}

    let note = slot.querySelector(".tsuki-pregnancy-plan-note");
    if (!text) {
      note?.remove();
      return;
    }
    if (!note) {
      note = document.createElement("p");
      note.className = "tsuki-pregnancy-plan-note";
      slot.appendChild(note);
    }
    setText(note, text);
  }

  function moveHistory(planHistory, travelHistory, shell) {
    const allPanel = shell.querySelector('[data-tsuki-history-panel="all"]');
    const travelPanel = shell.querySelector('[data-tsuki-history-panel="travel"]');
    if (planHistory && allPanel && planHistory.parentElement !== allPanel) allPanel.appendChild(planHistory);
    if (travelHistory && travelPanel && travelHistory.parentElement !== travelPanel) travelPanel.appendChild(travelHistory);
    selectHistory(shell.querySelector('[data-tsuki-history="travel"].active') ? "travel" : "all");
  }

  function organizeCards(shell, plansPanel, travelPanel) {
    const plansBody = shell.querySelector('[data-tsuki-body="plans"]');
    const travelBody = shell.querySelector('[data-tsuki-body="travel"]');
    if (!plansBody || !travelBody) return;

    const savePlan = cardByControl("planSaveEvent");
    const checkPlan = cardByControl("planCheckDates");
    const explainPlan = cardByHeading(plansPanel, "Different plans get different context");
    const planHistory = $("#plansEventsHistory");

    const checkTravel = cardByControl("travelCheckDates");
    const findTravel = cardByControl("travelFindDates");
    const saveTravel = cardByControl("travelSaveTrip");
    const guideTravel = cardByHeading(travelPanel, "How Tsuki uses pregnancy timing");
    const travelHistory = $("#travelIntelHistory");

    if (savePlan) {
      savePlan.classList.add("tsuki-entry-card");
      setText(savePlan.querySelector(".eyebrow"), "SAVE A PLAN");
      setText(savePlan.querySelector("h3"), "Plan or event");
      if (savePlan.parentElement !== plansBody) plansBody.appendChild(savePlan);
    }
    if (checkPlan) {
      setText(checkPlan.querySelector(".eyebrow"), "CHECK DATES");
      setText(checkPlan.querySelector("h3"), "How does this date line up?");
      if (checkPlan.parentElement !== plansBody) plansBody.appendChild(checkPlan);
    }
    if (explainPlan) {
      const details = ensureDisclosure("tsukiPlansHowItWorks", "How Tsuki uses cycle & pregnancy context", plansBody);
      if (explainPlan.parentElement !== details) details.appendChild(explainPlan);
    }

    if (checkTravel) {
      setText(checkTravel.querySelector(".eyebrow"), "CHECK A TRIP");
      setText(checkTravel.querySelector("h3"), "Check possible dates");
      if (checkTravel.parentElement !== travelBody) travelBody.appendChild(checkTravel);
    }
    if (findTravel) {
      setText(findTravel.querySelector(".eyebrow"), "FIND DATES");
      if (findTravel.parentElement !== travelBody) travelBody.appendChild(findTravel);
    }
    if (saveTravel) {
      saveTravel.classList.add("tsuki-entry-card");
      setText(saveTravel.querySelector(".eyebrow"), "SAVE TRIP");
      setText(saveTravel.querySelector("h3"), "Add to your travel history");
      if (saveTravel.parentElement !== travelBody) travelBody.appendChild(saveTravel);
    }
    if (guideTravel) {
      const details = ensureDisclosure("tsukiPregnancyTravelGuide", "Pregnancy travel guidance & sources", travelBody);
      if (guideTravel.parentElement !== details) details.appendChild(guideTravel);
    }

    moveHistory(planHistory, travelHistory, shell);
  }

  function cleanupLegacyChrome() {
    document.getElementById("tsukiPlanningSwitcher")?.remove();
    const legacyHistoryCard = document.getElementById("tsukiTravelHistoryCard");
    if (legacyHistoryCard && !legacyHistoryCard.querySelector("#travelIntelHistory")) legacyHistoryCard.remove();
  }

  function hideSourceChrome(plansPanel, travelPanel) {
    plansPanel.querySelector(".plans-events-hero")?.classList.add("tsuki-source-hero-hidden");
    travelPanel.querySelector(".travel-hero")?.classList.add("tsuki-source-hero-hidden");
    plansPanel.classList.add("tsuki-source-panel");
    travelPanel.classList.add("tsuki-source-panel");
  }

  function harmonize() {
    if (busy) return;
    const screen = $('[data-screen="going-out"]');
    const plansPanel = $("#plansEventsIntelligencePanel");
    const travelPanel = $("#travelIntelligencePanel");
    if (!screen || !plansPanel || !travelPanel) return;

    busy = true;
    try {
      ensureStylesheet();
      const shell = ensureShell(screen);
      hideSourceChrome(plansPanel, travelPanel);
      organizeCards(shell, plansPanel, travelPanel);
      cleanupLegacyChrome();
      setCustomPlanUI();
      pregnancyContextCard(shell.querySelector("#tsukiTravelContextSlot"));

      let saved = "plans";
      try { saved = sessionStorage.getItem("tsuki-planning-workspace") || "plans"; } catch (_) {}
      const current = shell.querySelector("[data-tsuki-workspace].active")?.dataset.tsukiWorkspace || saved;
      selectWorkspace(current);
    } finally {
      busy = false;
    }
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
    const observer = new MutationObserver(() => { if (!busy) schedule(); });
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("change", event => {
      if (event.target?.id === "planLogKind") setCustomPlanUI();
    });
    schedule();
    window.TsukiPlansTravelUX = {
      installed: true,
      version: VERSION,
      apply: schedule,
      show: selectWorkspace,
      disconnect: () => observer.disconnect()
    };
  }

  window.TsukiPlansTravelUX = { installed: false, version: VERSION, install };
  install();
})();
