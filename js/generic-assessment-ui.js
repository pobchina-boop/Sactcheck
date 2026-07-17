/**
 * SACTCheck generic JSON assessment interface.
 * Builds a protocol-driven form and delegates all clinical logic to the
 * assessment and rule engines.
 */
(function (root) {
  "use strict";

  const Engine = root.SACTCheckAssessmentEngine;
  if (!Engine) throw new Error("SACTCheckAssessmentEngine must load before generic-assessment-ui.js.");

  let activeProtocol = null;
  let activeProfileId = null;
  let latestResult = null;
  let latestAssessmentId = "";

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function ensureScreen() {
    if (document.getElementById("jsonAssessmentScreen")) return;
    const main = document.querySelector("main");
    if (!main) throw new Error("Could not find the SACTCheck main element.");

    const screen = document.createElement("div");
    screen.id = "jsonAssessmentScreen";
    screen.className = "screen";
    screen.innerHTML = `
      <div class="toolbar spread">
        <a href="#libraryScreen" class="btn secondary" id="jsonBackLibrary" role="button">← Regimen library</a>
        <span class="badge review">JSON engine v${escapeHtml(Engine.version)}</span>
      </div>

      <details open>
        <summary>Protocol information and validation status</summary>
        <div class="details-body">
          <div class="protocol-grid">
            <div class="protocol-item"><span>Regimen</span><strong id="jsonProtocolTitle">—</strong></div>
            <div class="protocol-item"><span>NCCP code / version</span><strong id="jsonProtocolCode">—</strong></div>
            <div class="protocol-item"><span>Tumour group</span><strong id="jsonProtocolTumour">—</strong></div>
            <div class="protocol-item"><span>Encoding status</span><strong id="jsonProtocolStatus">—</strong></div>
            <div class="protocol-item"><span>Rules encoded</span><strong id="jsonProtocolRuleCount">—</strong></div>
            <div class="protocol-item"><span>Clinical validation</span><strong id="jsonProtocolValidation">—</strong></div>
          </div>
          <p class="subtle" id="jsonProtocolIndication"></p>
          <p class="subtle"><strong>Safety design:</strong> all fields displayed by this generic screen must be completed. Missing information produces an incomplete assessment rather than an inferred proceed decision.</p>
        </div>
      </details>

      <form id="jsonAssessmentForm">
        <section>
          <div class="section-heading"><h2>Assessment context</h2><span class="step">Protocol-driven form</span></div>
          <div class="grid three">
            <div>
              <label for="jsonAssessmentId">Anonymous assessment ID</label>
              <input id="jsonAssessmentId" value="JSON-DEMO-001" autocomplete="off">
              <span class="hint">Do not enter a name, MRN or date of birth.</span>
            </div>
            <div id="jsonProfileWrapper">
              <label for="jsonProfile">Assessment profile</label>
              <select id="jsonProfile"></select>
              <span class="hint">Select the treatment phase or assessment context.</span>
            </div>
          </div>
        </section>

        <section>
          <div class="section-heading"><h2>Required clinical inputs</h2><span class="step" id="jsonInputCount">—</span></div>
          <div id="jsonInputGrid" class="grid three"></div>
        </section>

        <div class="toolbar">
          <button class="btn" type="submit">Run JSON protocol assessment</button>
          <button class="btn secondary" type="button" id="jsonDemo">Load demonstration values</button>
          <button class="btn secondary" type="button" id="jsonReset">Reset</button>
        </div>
      </form>

      <div id="jsonResult" class="hidden">
        <div id="jsonStatusBox" class="status warn">
          <h2 id="jsonStatusTitle"></h2>
          <p id="jsonStatusAction"></p>
        </div>

        <div class="metrics">
          <div class="metric"><span>Assessment profile</span><strong id="jsonProfileMetric">—</strong></div>
          <div class="metric"><span>Applicable rules</span><strong id="jsonApplicableMetric">—</strong></div>
          <div class="metric"><span>Rules evaluated</span><strong id="jsonEvaluatedMetric">—</strong></div>
          <div class="metric"><span>Completeness</span><strong id="jsonCompleteMetric">—</strong></div>
        </div>

        <div id="jsonErrors"></div>

        <div class="result-block">
          <h2>Triggered encoded rules</h2>
          <div id="jsonFindings"></div>
        </div>

        <div class="result-block">
          <h2>Copyable assessment summary</h2>
          <textarea id="jsonSummary" class="summary-box" readonly></textarea>
          <div class="toolbar result-actions" style="margin-top:10px">
            <button type="button" class="btn" id="jsonCopy">Copy summary</button>
            <button type="button" class="btn secondary" id="jsonDownload">Download text summary</button>
            <button type="button" class="btn secondary" onclick="window.print()">Print / save as PDF</button>
          </div>
        </div>

        <p class="footer-note">This generic screen evaluates the machine-readable JSON rules loaded from the repository. The encoded protocols remain pending formal consultant, oncology-pharmacy and software validation.</p>
      </div>
    `;

    main.appendChild(screen);
    bindEvents();
  }

  function bindEvents() {
    document.getElementById("jsonBackLibrary").addEventListener("click", event => {
      event.preventDefault();
      document.body.classList.remove("json-assessment-open");
      showScreen("libraryScreen");
      history.replaceState(null, "", "#libraryScreen");
    });

    document.getElementById("jsonProfile").addEventListener("change", event => {
      activeProfileId = event.target.value;
      renderInputs();
      hideResult();
    });

    document.getElementById("jsonAssessmentForm").addEventListener("submit", event => {
      event.preventDefault();
      runAssessment();
    });

    document.getElementById("jsonDemo").addEventListener("click", loadDemonstrationValues);

    document.getElementById("jsonReset").addEventListener("click", () => {
      renderInputs();
      hideResult();
    });

    document.getElementById("jsonCopy").addEventListener("click", copySummary);
    document.getElementById("jsonDownload").addEventListener("click", downloadSummary);
  }

  function showScreen(id) {
    if (typeof root.showScreen === "function") {
      root.showScreen(id);
      return;
    }
    document.querySelectorAll(".screen").forEach(screen => screen.classList.remove("active"));
    document.getElementById(id)?.classList.add("active");
    window.scrollTo(0, 0);
  }

  function open(protocol) {
    ensureScreen();
    activeProtocol = protocol;
    const validation = Engine.validateProtocol(protocol);
    if (!validation.valid) {
      throw new Error(`Protocol cannot be assessed: ${validation.errors.join(" ")}`);
    }

    const profiles = Engine.getProfiles(protocol);
    activeProfileId = profiles[0]?.id || "default";
    latestResult = null;

    document.getElementById("jsonProfile").innerHTML = profiles
      .map(profile => `<option value="${escapeHtml(profile.id)}">${escapeHtml(profile.label)}</option>`)
      .join("");
    document.getElementById("jsonProfile").value = activeProfileId;
    document.getElementById("jsonProfileWrapper").style.display = profiles.length > 1 ? "block" : "none";

    renderProtocolInformation(protocol);
    renderInputs();
    hideResult();
    document.body.classList.add("json-assessment-open");
    showScreen("jsonAssessmentScreen");
    history.replaceState(null, "", "#jsonAssessmentScreen");
  }

  function renderProtocolInformation(protocol) {
    const metadata = protocol.metadata || {};
    const validation = metadata.validation || {};
    const validationComplete = Boolean(
      validation.consultant_reviewed &&
      validation.oncology_pharmacy_reviewed &&
      validation.software_tests_completed &&
      validation.clinical_use_authorised
    );

    document.getElementById("jsonProtocolTitle").textContent = Engine.getProtocolTitle(protocol);
    document.getElementById("jsonProtocolCode").textContent = `${Engine.getProtocolCode(protocol)}${metadata.nccp_version ? ` / ${metadata.nccp_version}` : ""}`;
    document.getElementById("jsonProtocolTumour").textContent = asArray(metadata.tumour_groups || metadata.tumour_group).join(" · ") || "Uncategorised";
    document.getElementById("jsonProtocolStatus").textContent = humanise(protocol.status || "not specified");
    const deterministicRules = asArray(protocol.rule_engine?.rules).length;
    const iraeReferenceRules = asArray(protocol.pembrolizumab_irae_rules?.rules).length;
    document.getElementById("jsonProtocolRuleCount").textContent = iraeReferenceRules
      ? `${deterministicRules} deterministic + ${iraeReferenceRules} irAE reference`
      : String(deterministicRules);
    document.getElementById("jsonProtocolValidation").textContent = validationComplete ? "Validated" : "Pending formal validation";
    document.getElementById("jsonProtocolIndication").textContent = metadata.indication || indicationSummary(protocol);
  }

  function renderInputs() {
    if (!activeProtocol) return;
    const definitions = Engine.getInputDefinitions(activeProtocol, activeProfileId);
    const grid = document.getElementById("jsonInputGrid");
    grid.innerHTML = definitions.map(renderInput).join("");
    document.getElementById("jsonInputCount").textContent = `${definitions.length} required field${definitions.length === 1 ? "" : "s"}`;
  }

  function renderInput(definition) {
    const requiredMark = definition.required ? " *" : "";
    let control = "";

    if (definition.type === "boolean") {
      control = `
        <select id="jsonInput_${escapeHtml(definition.id)}" data-field="${escapeHtml(definition.id)}" data-type="boolean" required>
          <option value="">Select…</option>
          <option value="false">No</option>
          <option value="true">Yes</option>
        </select>`;
    } else if (definition.type === "select") {
      control = `
        <select id="jsonInput_${escapeHtml(definition.id)}" data-field="${escapeHtml(definition.id)}" data-type="select" required>
          <option value="">Select…</option>
          ${definition.options.map(option => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`).join("")}
        </select>`;
    } else {
      const maximum = definition.max !== undefined ? ` max="${escapeHtml(definition.max)}"` : "";
      control = `<input id="jsonInput_${escapeHtml(definition.id)}" data-field="${escapeHtml(definition.id)}" data-type="number" type="number" min="${escapeHtml(definition.min ?? 0)}"${maximum} step="${escapeHtml(definition.step || "any")}" required>`;
    }

    return `
      <div>
        <label for="jsonInput_${escapeHtml(definition.id)}">${escapeHtml(definition.label)}${requiredMark}</label>
        ${control}
        ${definition.explicitlyRequired ? "" : '<span class="hint">Required to evaluate an applicable encoded rule.</span>'}
      </div>`;
  }


  function loadDemonstrationValues() {
    const defaults = {
      indication_id: activeProtocol?.indications?.[0]?.indication_id || "",
      cycle_number: activeProfileId === "neoadjuvant_cycles_5_to_8_day_1" ? 5 : activeProfileId === "adjuvant_pembrolizumab" ? 9 : 2,
      day_number: activeProfileId === "neoadjuvant_cycles_1_to_4_day_8_or_15" ? 8 : 1,
      schedule_q3w_or_q6w: "q3w",
      anc_x10e9_l: 2,
      platelets_x10e9_l: 200,
      platelet_nadir_x10e9_l: 200,
      anc_below_0_5_duration_days: 0,
      febrile_neutropenia: false,
      febrile_neutropenia_grade: 0,
      bleeding_tendency: false,
      haematological_delay_days: 0,
      haematological_delay_occurrence: 0,
      haematological_toxicity_occurrence_number: 0,
      gfr_ml_min: 90,
      crcl_ml_min: 90,
      haemodialysis: false,
      alt_ratio_uln: 1,
      bilirubin_ratio_uln: 1,
      bilirubin_umol_l: 10,
      child_pugh_class: "A",
      lvef_percent: 60,
      neuropathy_grade: 0,
      neuropathy_occurrence: 0,
      neuropathy_persistent_or_second_occurrence: false,
      other_non_haematological_toxicity_grade: 0,
      paclitaxel_non_haematological_toxicity_grade: 0,
      paclitaxel_delay_days: 0,
      paclitaxel_dose_reduction_count: 0,
      active_pembrolizumab_irae: false,
      cyp3a_inhibitor_class: "none",
      current_dose_level: "starting"
    };

    document.querySelectorAll("#jsonInputGrid [data-field]").forEach(element => {
      const value = defaults[element.dataset.field];
      if (value !== undefined && value !== null) element.value = String(value);
    });
    hideResult();
  }

  function collectRawInputs() {
    const inputs = {};
    document.querySelectorAll("#jsonInputGrid [data-field]").forEach(element => {
      inputs[element.dataset.field] = element.value;
    });
    return inputs;
  }

  function runAssessment() {
    if (!activeProtocol) return;
    latestAssessmentId = document.getElementById("jsonAssessmentId").value.trim();
    latestResult = Engine.assess(activeProtocol, collectRawInputs(), { profileId: activeProfileId });
    renderResult(latestResult);
  }

  function renderResult(result) {
    const container = document.getElementById("jsonResult");
    container.classList.remove("hidden");

    const statusBox = document.getElementById("jsonStatusBox");
    statusBox.className = `status ${result.statusClass}`;
    document.getElementById("jsonStatusTitle").textContent = result.status;
    document.getElementById("jsonStatusAction").textContent = result.recommendation;
    document.getElementById("jsonProfileMetric").textContent = result.profile.label;
    document.getElementById("jsonApplicableMetric").textContent = String(result.applicableRuleCount);
    document.getElementById("jsonEvaluatedMetric").textContent = String(result.assessedRuleCount);
    document.getElementById("jsonCompleteMetric").textContent = result.complete ? "Complete" : "Incomplete";

    renderErrors(result);
    renderFindings(result);
    document.getElementById("jsonSummary").value = Engine.documentationSummary(result, latestAssessmentId);
    container.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderErrors(result) {
    const messages = [
      ...result.missing.map(item => `Missing: ${item.label}`),
      ...result.invalid.map(item => `Invalid: ${item.label} — ${item.reason}`),
      ...result.errors.map(item => `Rule error ${item.ruleId}: ${item.message}`)
    ];
    document.getElementById("jsonErrors").innerHTML = messages.length
      ? `<div class="error-list">${messages.map(escapeHtml).join("<br>")}</div>`
      : "";
  }

  function renderFindings(result) {
    const target = document.getElementById("jsonFindings");
    if (!result.findings.length) {
      target.innerHTML = '<div class="finding consult"><h3>No deterministic rule result</h3><p>No encoded rule was triggered for the supplied values. Senior review is required before this can be treated as a proceed decision.</p></div>';
      return;
    }

    target.innerHTML = result.findings.map(finding => {
      const className = findingClass(finding.actionType);
      const detail = Engine.actionDetail(finding.action);
      return `
        <div class="finding ${className}">
          <h3>${escapeHtml(finding.ruleId)}</h3>
          <p><strong>${escapeHtml(Engine.actionLabels[finding.actionType] || humanise(finding.actionType))}</strong></p>
          <p>${escapeHtml(finding.explanation)}</p>
          ${detail ? `<p><strong>Encoded action detail:</strong> ${escapeHtml(detail)}</p>` : ""}
          <div class="source">${escapeHtml(finding.sourceText)}</div>
        </div>`;
    }).join("");
  }

  function findingClass(actionType) {
    if (["permanently_discontinue", "contraindicated", "discontinue", "cease"].includes(actionType)) return "critical";
    if (["omit", "withhold", "withhold_then_reduce", "delay", "delay_then_dose_reduce"].includes(actionType)) return "hold";
    if (actionType === "consultant_review") return "consult";
    if (actionType.includes("dose_reduce")) return "modify";
    return "info";
  }

  function hideResult() {
    document.getElementById("jsonResult")?.classList.add("hidden");
    latestResult = null;
  }

  async function copySummary() {
    const text = document.getElementById("jsonSummary").value;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      const textarea = document.getElementById("jsonSummary");
      textarea.select();
      document.execCommand("copy");
    }
    if (typeof root.showToast === "function") root.showToast("Summary copied");
  }

  function downloadSummary() {
    if (!latestResult) return;
    const text = document.getElementById("jsonSummary").value;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `SACTCheck_${latestAssessmentId || activeProtocol.protocol_id || "assessment"}.txt`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  }

  function indicationSummary(protocol) {
    const descriptions = asArray(protocol.indications).map(item => item.description).filter(Boolean);
    if (!descriptions.length) return "Machine-readable NCCP regimen encoded for the SACTCheck protocol library.";
    return `${descriptions.length} encoded indication${descriptions.length === 1 ? "" : "s"}. Select the relevant indication in the assessment form.`;
  }

  function asArray(value) {
    if (value === undefined || value === null) return [];
    return Array.isArray(value) ? value : [value];
  }

  function humanise(value) {
    return String(value || "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, character => character.toUpperCase());
  }

  root.SACTCheckGenericAssessment = Object.freeze({
    version: "0.1.0",
    open,
    ensureScreen
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureScreen);
  } else {
    ensureScreen();
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
