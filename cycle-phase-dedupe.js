/* ============================================================
   TSUKI 🌙 — VERSION 1.0 PRE-RELEASE
   PHASE QUESTION DE-DUPLICATION
   Keeps one visible control per stored daily-check-in field and removes
   phase-inappropriate generic fields (for example discharge in menstruation).
   ============================================================ */
(() => {
  "use strict";

  if (window.TsukiCyclePhaseDedupe?.installed) return;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const BODY_FIELDS = ["discharge", "appetite", "cravingIntensity", "stress", "libido"];
  const BODY_LABELS = {
    discharge: "discharge",
    appetite: "appetite",
    cravingIntensity: "cravings",
    stress: "stress",
    libido: "libido"
  };

  function phaseContent() {
    return $("#phaseSpecificLogContent");
  }

  function currentPhase() {
    const key = $("#logDate")?.value || (typeof todayKey === "function" ? todayKey() : "");
    try {
      if (typeof periodForDate === "function" && periodForDate(key)) return "Period";
      return typeof phaseForDate === "function" ? phaseForDate(key) : "";
    }
    catch (_) { return ""; }
  }

  function excludedForPhase() {
    const excluded = new Set();
    if (currentPhase() === "Period") excluded.add("discharge");
    return excluded;
  }

  function restoreBodyDetails() {
    const details = $(".body-signal-details");
    if (!details) return;
    details.classList.remove("hidden");
    details.querySelectorAll("article.card[data-phase-dedupe-hidden='1']").forEach(card => {
      card.classList.remove("hidden");
      delete card.dataset.phaseDedupeHidden;
      delete card.dataset.phaseDedupeReason;
    });
  }

  function syncPromotedValues() {
    const content = phaseContent();
    const details = $(".body-signal-details");
    if (!content || !details) return;

    BODY_FIELDS.forEach(name => {
      const visibleInputs = $$(`input[name="${name}"]`, content);
      if (!visibleInputs.length || visibleInputs.some(input => input.checked)) return;

      const savedInput = $$(`input[name="${name}"]`, details).find(input => input.checked);
      if (!savedInput) return;

      const visibleMatch = visibleInputs.find(input => input.value === savedInput.value);
      if (visibleMatch) visibleMatch.checked = true;
    });
  }

  function hideBodyCard(details, name, reason) {
    const input = details.querySelector(`input[name="${name}"]`);
    const card = input?.closest("article.card");
    if (!card) return;
    card.classList.add("hidden");
    card.dataset.phaseDedupeHidden = "1";
    card.dataset.phaseDedupeReason = reason;
  }

  function syncBodyDetails() {
    const content = phaseContent();
    const details = $(".body-signal-details");
    if (!content || !details) return;

    restoreBodyDetails();
    syncPromotedValues();

    const promoted = new Set(
      BODY_FIELDS.filter(name => content.querySelector(`input[name="${name}"]`))
    );
    const excluded = excludedForPhase();

    BODY_FIELDS.forEach(name => {
      if (promoted.has(name)) hideBodyCard(details, name, "promoted");
      else if (excluded.has(name)) hideBodyCard(details, name, "phase-inappropriate");
    });

    const bodyCards = BODY_FIELDS
      .map(name => details.querySelector(`input[name="${name}"]`)?.closest("article.card"))
      .filter(Boolean);
    const visibleCards = bodyCards.filter(card => !card.classList.contains("hidden"));
    details.classList.toggle("hidden", bodyCards.length > 0 && visibleCards.length === 0);

    const summary = details.querySelector("summary small");
    if (summary) {
      const remaining = BODY_FIELDS.filter(name => {
        const card = details.querySelector(`input[name="${name}"]`)?.closest("article.card");
        return card && !card.classList.contains("hidden");
      });
      summary.textContent = remaining.length
        ? remaining.map(name => BODY_LABELS[name]).join(", ")
        : "Phase-specific questions shown above";
    }
  }

  function restoreSymptomList() {
    $$('label[data-phase-symptom-dedupe="1"]').forEach(label => {
      label.classList.remove("hidden");
      delete label.dataset.phaseSymptomDedupe;
    });
  }

  function syncSymptomList() {
    const content = phaseContent();
    if (!content) return;

    restoreSymptomList();

    const promoted = new Set(
      $$('[data-four-phase-symptom]', content)
        .map(button => button.dataset.fourPhaseSymptom)
        .filter(Boolean)
    );

    if (!promoted.size) return;

    $$('input[name="symptom"]').forEach(input => {
      if (!promoted.has(input.value)) return;
      if (content.contains(input)) return;
      const label = input.closest("label");
      if (!label) return;
      label.classList.add("hidden");
      label.dataset.phaseSymptomDedupe = "1";
    });
  }

  function apply() {
    syncBodyDetails();
    syncSymptomList();
  }

  function install() {
    const content = phaseContent();
    if (!content) {
      setTimeout(install, 50);
      return;
    }

    if (window.TsukiCyclePhaseDedupe?.installed) return;

    const observer = new MutationObserver(() => requestAnimationFrame(apply));
    observer.observe(content, { childList: true, subtree: true });

    $("#logDate")?.addEventListener("change", () => requestAnimationFrame(apply));
    document.addEventListener("change", event => {
      if (event.target?.matches?.('input[name="symptom"], input[name="discharge"], input[name="appetite"], input[name="cravingIntensity"], input[name="stress"], input[name="libido"]')) {
        requestAnimationFrame(apply);
      }
    });

    window.TsukiCyclePhaseDedupe = {
      installed: true,
      version: "1.0.0-pre-phase-dedupe-3",
      apply,
      disconnect: () => observer.disconnect()
    };

    apply();
  }

  window.TsukiCyclePhaseDedupe = { installed: false, install };
  if (!window.__TSUKI_TEST__) install();
})();
