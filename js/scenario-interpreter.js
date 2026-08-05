/**
 * SACTCheck constrained scenario interpreter.
 *
 * This module performs local, deterministic extraction only. It does not call
 * an external model or clinical service. Extracted values must be confirmed
 * before they are copied into the assessment form. The assessment engine,
 * not this interpreter, determines the protocol result.
 */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SACTCheckScenarioInterpreter = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  const VERSION = "0.55.0";
  let activeProtocol = null;
  let activeDefinitions = [];
  let callbacks = {};
  let extractions = [];
  let warnings = [];
  let panelOpen = false;
  let pendingDraftText = "";
  let pendingAutoParse = false;

  const FIELD_ALIASES = Object.freeze({
    anc: ["anc", "absolute neutrophil count", "neutrophils", "neutrophil count"],
    platelets: ["platelets", "platelet count", "plt", "plts"],
    haemoglobin: ["haemoglobin", "hemoglobin", "hb"],
    wbc: ["white cell count", "white blood cells", "wbc"],
    creatinine: ["creatinine", "serum creatinine"],
    crcl: ["creatinine clearance", "crcl"],
    egfr: ["egfr", "estimated gfr", "gfr"],
    bilirubin: ["bilirubin", "bili"],
    alt: ["alt", "alanine aminotransferase"],
    ast: ["ast", "aspartate aminotransferase"],
    alp: ["alp", "alkaline phosphatase"],
    tsh: ["tsh", "thyroid stimulating hormone"],
    free_t4: ["free t4", "ft4", "free thyroxine"],
    cortisol: ["cortisol"],
    acth: ["acth"],
    glucose: ["glucose", "blood glucose"],
    ketones: ["ketones", "blood ketones"],
    ecog: ["ecog", "performance status"],
    cycle: ["cycle", "cycle number"],
    day: ["day", "treatment day"]
  });

  const SEMANTIC_PATTERNS = Object.freeze([
    { key: "anc", field: /(^|_)(anc|neutrophil)/i, unit: "×10⁹/L" },
    { key: "platelets", field: /platelet|(^|_)plt/i, unit: "×10⁹/L" },
    { key: "haemoglobin", field: /ha?emoglobin|(^|_)hb($|_)/i, unit: "g/L" },
    { key: "wbc", field: /(^|_)(wbc|white_cell)/i, unit: "×10⁹/L" },
    { key: "crcl", field: /crcl|creatinine_clearance/i, unit: "mL/min" },
    { key: "egfr", field: /egfr|(^|_)gfr/i, unit: "mL/min" },
    { key: "creatinine", field: /creatinine/i, unit: "µmol/L" },
    { key: "bilirubin", field: /bilirubin/i, unit: "µmol/L", labAnalyte: "bilirubin" },
    { key: "alt", field: /(^|_)alt($|_)|alanine/i, unit: "U/L", labAnalyte: "alt" },
    { key: "ast", field: /(^|_)ast($|_)|aspartate/i, unit: "U/L", labAnalyte: "ast" },
    { key: "alp", field: /(^|_)alp($|_)|alkaline/i, unit: "U/L" },
    { key: "tsh", field: /(^|_)tsh($|_)/i, unit: "mIU/L" },
    { key: "free_t4", field: /free_?t4|ft4/i, unit: "pmol/L" },
    { key: "cortisol", field: /cortisol/i, unit: "nmol/L" },
    { key: "acth", field: /acth/i, unit: "ng/L" },
    { key: "glucose", field: /glucose/i, unit: "mmol/L" },
    { key: "ketones", field: /ketone/i, unit: "mmol/L" },
    { key: "ecog", field: /ecog|performance_status/i, unit: "" },
    { key: "cycle", field: /cycle_number|(^|_)cycle($|_)/i, unit: "" },
    { key: "day", field: /cycle_day|treatment_day|(^|_)day($|_)/i, unit: "" }
  ]);

  const BOOLEAN_ALIASES = Object.freeze([
    { field: /febrile_neutropenia/i, positive: ["febrile neutropenia", "neutropenic fever", "neutropenic sepsis"], negative: ["no febrile neutropenia", "no history of febrile neutropenia"] },
    { field: /pregnan/i, positive: ["pregnant", "pregnancy"], negative: ["not pregnant", "pregnancy negative"] },
    { field: /breastfeed|lactat/i, positive: ["breastfeeding", "lactating"], negative: ["not breastfeeding", "not lactating"] },
    { field: /dialysis/i, positive: ["on dialysis", "dialysis", "haemodialysis"], negative: ["not on dialysis", "no dialysis"] },
    { field: /hypersensitiv|allerg/i, positive: ["hypersensitivity", "allergic reaction", "allergy"], negative: ["no hypersensitivity", "no allergy"] }
  ]);

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalise(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[×x]\s*10\s*[\^]?\s*9\s*\/?\s*l/g, " x10e9/l ")
      .replace(/[–—]/g, "-")
      .replace(/\s+/g, " ")
      .trim();
  }

  function protocolText(protocol) {
    const m = protocol?.metadata || {};
    return normalise([
      m.title, m.short_title, m.indication,
      ...(m.drugs || []), ...(m.common_trade_names || [])
    ].filter(Boolean).join(" "));
  }

  function definitionText(definition) {
    return normalise(`${definition?.id || ""} ${definition?.label || ""} ${definition?.unit || ""}`);
  }

  function findDefinition(pattern) {
    return activeDefinitions.find(definition => pattern.test(`${definition.id || ""} ${definition.label || ""}`));
  }

  function matchNumber(text, aliases) {
    const escaped = aliases
      .sort((a, b) => b.length - a.length)
      .map(alias => alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const aliasPattern = `(?:${escaped.join("|")})`;
    const expressions = [
      new RegExp(`\\b${aliasPattern}\\b\\s*(?:is|was|of|=|:)?\\s*(-?\\d+(?:\\.\\d+)?)`, "i"),
      new RegExp(`(-?\\d+(?:\\.\\d+)?)\\s*(?:[^.;,]{0,12})\\b${aliasPattern}\\b`, "i")
    ];
    for (const expression of expressions) {
      const match = text.match(expression);
      if (match) return Number(match[1]);
    }
    return null;
  }

  function optionForNumber(definition, number) {
    if (definition?.type !== "select") return null;
    return (definition.options || []).find(option => {
      const low = option.range_min_inclusive;
      const high = option.range_max_inclusive;
      if (low !== undefined || high !== undefined) {
        return (low === undefined || low === null || number >= Number(low)) &&
          (high === undefined || high === null || number <= Number(high));
      }
      return Number(option.decision_value) === number || Number(option.value) === number;
    }) || null;
  }

  function addExtraction(item) {
    if (!item?.fieldId) return;
    const duplicate = extractions.find(existing => existing.fieldId === item.fieldId && existing.labAnalyte === item.labAnalyte);
    if (duplicate) Object.assign(duplicate, item);
    else extractions.push({ confirmed: true, confidence: "High", ...item });
  }

  function parseSemanticNumbers(text) {
    SEMANTIC_PATTERNS.forEach(pattern => {
      const definition = activeDefinitions.find(item => pattern.field.test(`${item.id || ""} ${item.label || ""}`));
      if (!definition) return;
      const number = matchNumber(text, FIELD_ALIASES[pattern.key] || [pattern.key]);
      if (number === null || !Number.isFinite(number)) return;
      const option = optionForNumber(definition, number);
      if (definition.type === "select" && !option) {
        warnings.push(`${definition.label}: ${number} could not be mapped to an available protocol band.`);
        return;
      }
      addExtraction({
        fieldId: definition.id,
        label: definition.label,
        value: option ? option.value : String(number),
        displayValue: option ? `${number} ${pattern.unit || ""} → ${option.label}`.trim() : `${number}${pattern.unit ? ` ${pattern.unit}` : ""}`,
        labAnalyte: pattern.labAnalyte || null,
        evidence: `${FIELD_ALIASES[pattern.key]?.[0] || pattern.key} ${number}`
      });
    });
  }

  function parseBooleanFields(text) {
    BOOLEAN_ALIASES.forEach(config => {
      const definition = activeDefinitions.find(item => config.field.test(`${item.id || ""} ${item.label || ""}`));
      if (!definition || definition.type !== "boolean") return;
      const negative = config.negative.find(alias => text.includes(alias));
      const positive = config.positive.find(alias => text.includes(alias));
      if (!negative && !positive) return;
      const value = negative ? false : true;
      addExtraction({
        fieldId: definition.id,
        label: definition.label,
        value: String(value),
        displayValue: value ? "Yes" : "No",
        evidence: negative || positive
      });
    });
  }

  function parseGrades(text) {
    activeDefinitions.filter(definition => definition.type === "select" && /grade|toxicit|neuropath|rash|diarr|mucos|pneumon|colitis|hepatitis|nephritis/i.test(definitionText(definition))).forEach(definition => {
      const label = normalise(definition.label).replace(/\([^)]*\)/g, "").replace(/\bgrade\b/g, "").trim();
      const tokens = label.split(/\s+/).filter(token => token.length > 3 && !["toxicity", "immune", "lasting", "more", "than", "week"].includes(token));
      const keyword = tokens.find(token => text.includes(token));
      if (!keyword) return;
      const expressions = [
        new RegExp(`(?:grade|g)\\s*([0-5])[^.;,]{0,40}\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"),
        new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b[^.;,]{0,40}(?:grade|g)\\s*([0-5])`, "i")
      ];
      const match = expressions.map(expression => text.match(expression)).find(Boolean);
      if (!match) return;
      const grade = Number(match[1]);
      const option = (definition.options || []).find(item => Number(item.value) === grade || String(item.value) === String(grade));
      if (!option) return;
      addExtraction({ fieldId: definition.id, label: definition.label, value: String(option.value), displayValue: option.label || `Grade ${grade}`, evidence: match[0], confidence: "Medium" });
    });
  }

  function parseCurrentDose(text) {
    const definition = activeDefinitions.find(item => /current_dose|dose_level/i.test(item.id || "") && item.type === "select");
    if (!definition) return;
    const match = text.match(/(?:current\s+)?dose(?:\s+level)?\s*(?:is|=|:|of)?\s*(\d+(?:\.\d+)?)/i);
    if (!match) return;
    const value = Number(match[1]);
    const option = (definition.options || []).find(item => Number(item.value) === value || String(item.label || "").startsWith(String(value)));
    if (!option) { warnings.push(`${definition.label}: ${value} did not match an encoded dose level.`); return; }
    addExtraction({ fieldId: definition.id, label: definition.label, value: String(option.value), displayValue: option.label, evidence: match[0] });
  }

  function detectIdentifiers(text) {
    if (/\b(?:mrn|medical record|hospital number|dob|date of birth|pps|email|phone|mobile)\b/i.test(text) || /\b\d{7,}\b/.test(text)) {
      warnings.push("Possible patient-identifiable information detected. Remove names, record numbers, dates of birth and contact details before continuing.");
    }
  }

  function detectRegimenContext(text) {
    const current = protocolText(activeProtocol);
    const commonMentions = ["lonsurf", "avastin", "bevacizumab", "folfox", "folfiri", "folfirinox", "capox", "xelox", "ac", "tchp", "pembrolizumab", "nivolumab", "atezolizumab", "durvalumab", "paclitaxel", "docetaxel"];
    const mentioned = commonMentions.filter(item => new RegExp(`\\b${item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text));
    const unmatched = mentioned.filter(item => !current.includes(item) && !(item === "avastin" && current.includes("bevacizumab")));
    if (unmatched.length) warnings.push(`Scenario mentions ${unmatched.join(", ")}, which may not match the opened regimen. Confirm the regimen before assessment.`);
  }

  function parse(textValue) {
    extractions = [];
    warnings = [];
    const text = normalise(textValue);
    if (!text) return { extractions, warnings: ["Enter a clinical scenario first."] };
    detectIdentifiers(text);
    detectRegimenContext(text);
    parseSemanticNumbers(text);
    parseBooleanFields(text);
    if (/\b(?:afebrile|no fever|not febrile)\b/i.test(text) && activeDefinitions.some(item => /febrile_neutropenia/i.test(item.id || ""))) {
      warnings.push("Current fever status was noted but was not mapped to the protocol's febrile-neutropenia history field. That field remains unassessed unless the scenario explicitly states whether febrile neutropenia occurred.");
    }
    parseGrades(text);
    parseCurrentDose(text);
    if (!extractions.length) warnings.push("No values could be matched to fields in this regimen. Enter values using labels such as ANC, platelets, bilirubin, CrCl, ECOG or a named toxicity grade.");
    return { extractions, warnings };
  }

  function panel() {
    return typeof document !== "undefined" ? document.getElementById("jsonScenarioInterpreterPanel") : null;
  }

  function renderResults() {
    const target = panel()?.querySelector("[data-scenario-results]");
    if (!target) return;
    const rows = extractions.length ? extractions.map((item, index) => `
      <label class="scenario-extraction-row">
        <input type="checkbox" data-scenario-confirm="${index}" ${item.confirmed ? "checked" : ""}>
        <span><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.displayValue)}</small></span>
        <span class="scenario-confidence">${escapeHtml(item.confidence)}</span>
      </label>`).join("") : '<p class="subtle">No structured values extracted yet.</p>';
    const warningHtml = warnings.length ? `<div class="scenario-warnings">${warnings.map(item => `<p>${escapeHtml(item)}</p>`).join("")}</div>` : "";
    target.innerHTML = `${warningHtml}<div class="scenario-extraction-list">${rows}</div>${extractions.length ? '<p class="subtle">Only checked values will be copied. Every other protocol field remains blank and unassessed.</p>' : ""}`;
    const actions = panel()?.querySelector("[data-scenario-actions]");
    actions?.classList.toggle("hidden", extractions.length === 0);
  }

  function render() {
    const target = panel();
    if (!target || !activeProtocol) return;
    if (!target.dataset.scenarioInitialised) {
      target.innerHTML = `
        <div class="scenario-interpreter-head">
          <div><span class="scenario-eyebrow">Constrained scenario interpreter</span><h2>Describe the clinical scenario</h2><p>Local extraction only. Confirm the structured values before the deterministic protocol assessment runs.</p></div>
          <button type="button" class="btn secondary" data-scenario-close>Close</button>
        </div>
        <div class="scenario-privacy"><strong>Do not enter patient identifiers.</strong><span>The text is processed only in this browser and is not sent to an external AI service.</span></div>
        <label for="jsonScenarioText">Scenario</label>
        <textarea id="jsonScenarioText" rows="4" placeholder="Example: Metastatic CRC on Lonsurf, ANC 0.3, afebrile, cycle 3 day 1, current dose 30 mg/m² twice daily."></textarea>
        <div class="scenario-toolbar">
          <button type="button" class="btn primary" data-scenario-parse>Extract fields</button>
          <button type="button" class="btn secondary" data-scenario-clear>Clear</button>
        </div>
        <section data-scenario-results aria-live="polite"><p class="subtle">No scenario interpreted yet.</p></section>
        <div class="scenario-actions hidden" data-scenario-actions>
          <button type="button" class="btn secondary" data-scenario-apply>Apply confirmed values</button>
          <button type="button" class="btn primary" data-scenario-assess>Apply and assess</button>
        </div>
        <details class="scenario-scope"><summary>Scope and safety boundary</summary><div class="details-body"><p>The interpreter extracts values only into fields that already exist in the opened regimen. It does not create thresholds, diagnose a condition, select treatment or alter the deterministic SACTCheck result.</p></div></details>`;
      target.dataset.scenarioInitialised = "true";
      bind(target);
    }
    const heading = target.querySelector(".scenario-interpreter-head p");
    if (heading) heading.textContent = `${activeProtocol?.metadata?.title || activeProtocol?.metadata?.short_title || "Current regimen"}. Confirm the structured values before the deterministic protocol assessment runs.`;
    renderResults();
  }

  function bind(target) {
    target.addEventListener("click", event => {
      if (event.target.closest("[data-scenario-close]")) { close(); return; }
      if (event.target.closest("[data-scenario-parse]")) {
        parse(target.querySelector("#jsonScenarioText")?.value || "");
        renderResults();
        return;
      }
      if (event.target.closest("[data-scenario-clear]")) {
        const textarea = target.querySelector("#jsonScenarioText");
        if (textarea) textarea.value = "";
        extractions = []; warnings = []; renderResults();
        return;
      }
      if (event.target.closest("[data-scenario-apply]")) { apply(false); return; }
      if (event.target.closest("[data-scenario-assess]")) { apply(true); return; }
    });
    target.addEventListener("change", event => {
      const checkbox = event.target.closest("[data-scenario-confirm]");
      if (!checkbox) return;
      const item = extractions[Number(checkbox.dataset.scenarioConfirm)];
      if (item) item.confirmed = checkbox.checked;
    });
  }

  function apply(assess) {
    const selected = extractions.filter(item => item.confirmed);
    if (!selected.length) { warnings.push("Select at least one extracted value before applying."); renderResults(); return; }
    callbacks.apply?.(selected, { assess });
  }

  function prepare(protocol, definitions = [], options = {}) {
    activeProtocol = protocol;
    activeDefinitions = definitions || [];
    callbacks = options || {};
    const button = typeof document !== "undefined" ? document.getElementById("jsonScenarioInterpreterButton") : null;
    button?.classList.toggle("hidden", !protocol);
    if (panelOpen) render();
    return Boolean(protocol);
  }

  function open(protocol = activeProtocol, options = {}) {
    if (protocol) activeProtocol = protocol;
    if (!activeProtocol) return false;
    if (options?.draftText !== undefined) {
      pendingDraftText = String(options.draftText || "");
      pendingAutoParse = Boolean(options.autoParse);
    }
    panelOpen = true;
    const target = panel();
    target?.classList.remove("hidden");
    render();
    const textarea = target?.querySelector("#jsonScenarioText");
    if (textarea && pendingDraftText) {
      textarea.value = pendingDraftText;
      if (pendingAutoParse) {
        parse(pendingDraftText);
        renderResults();
      }
      pendingDraftText = "";
      pendingAutoParse = false;
    }
    target?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    return true;
  }

  function setDraft(textValue, options = {}) {
    pendingDraftText = String(textValue || "");
    pendingAutoParse = Boolean(options.autoParse);
    if (panelOpen) open(activeProtocol, { draftText: pendingDraftText, autoParse: pendingAutoParse });
    return true;
  }

  function close() {
    panelOpen = false;
    panel()?.classList.add("hidden");
  }

  return Object.freeze({ version: VERSION, parse, prepare, open, close, setDraft });
});
