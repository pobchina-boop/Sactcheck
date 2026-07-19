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
        <div class="toolbar" style="margin:0">
          <a href="#libraryScreen" class="btn secondary" id="jsonBackLibrary" role="button">← Regimen library</a>
          <a class="btn secondary official-pdf-link hidden" id="jsonOfficialPdf" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">📄</span> Official NCCP PDF</a>
        </div>
        <span class="badge engine-json">JSON engine v${escapeHtml(Engine.version)}</span>
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
          <p class="subtle"><strong>Safety design:</strong> enter any clinically relevant value and run the assessment. Independent rules are evaluated immediately; omitted domains remain explicitly unassessed and are never assumed normal. A single normal value cannot clear the whole regimen.</p>
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

        <section id="jsonTreatmentContextSection">
          <div class="section-heading"><h2>Protocol and treatment context</h2><span class="step" id="jsonContextCount">—</span></div>
          <div id="jsonTreatmentContextGrid" class="grid three"></div>
        </section>

        <section>
          <div class="section-heading"><h2>Clinical inputs</h2><span class="step" id="jsonInputCount">—</span></div>
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

    [document.getElementById("jsonTreatmentContextGrid"), document.getElementById("jsonInputGrid")]
      .filter(Boolean)
      .forEach(grid => {
        grid.addEventListener("change", updateConditionalInputs);
        grid.addEventListener("input", updateConditionalInputs);
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
    const officialPdf = document.getElementById("jsonOfficialPdf");
    if (metadata.source_url) {
      officialPdf.href = metadata.source_url;
      officialPdf.classList.remove("hidden");
    } else {
      officialPdf.removeAttribute("href");
      officialPdf.classList.add("hidden");
    }
  }

  const TREATMENT_CONTEXT_FIELDS = new Set([
    "indication_id", "assessment_type", "cycle_number", "day_number",
    "schedule_q3w_or_q6w", "etoposide_schedule", "weight_kg",
    "days_since_chemoradiotherapy", "disease_progressed_after_crt"
  ]);

  function isTreatmentContext(definition) {
    return definition.ui_section === "treatment_context" || TREATMENT_CONTEXT_FIELDS.has(definition.id);
  }

  function renderInputs(rawInputs = {}) {
    if (!activeProtocol) return;
    const definitions = Engine.getInputDefinitions(activeProtocol, activeProfileId, rawInputs);
    const contextDefinitions = definitions.filter(isTreatmentContext);
    const clinicalDefinitions = definitions.filter(definition => !isTreatmentContext(definition));
    document.getElementById("jsonTreatmentContextGrid").innerHTML = contextDefinitions.map(renderInput).join("");
    document.getElementById("jsonInputGrid").innerHTML = clinicalDefinitions.map(renderInput).join("");
    document.getElementById("jsonTreatmentContextSection").classList.toggle("hidden", contextDefinitions.length === 0);
    document.getElementById("jsonContextCount").textContent = `${contextDefinitions.filter(definition => definition.visible !== false).length} context field${contextDefinitions.length === 1 ? "" : "s"}`;
    updateInputCount(clinicalDefinitions);
  }

  function updateInputCount(definitions) {
    const visible = definitions.filter(definition => definition.visible !== false);
    const conditional = visible.filter(definition => definition.conditionalRequired).length;
    const parts = [`${visible.length} clinical field${visible.length === 1 ? "" : "s"}`];
    if (conditional) parts.push(`${conditional} pathway-specific`);
    parts.push("partial assessment enabled");
    document.getElementById("jsonInputCount").textContent = parts.join(" · ");
  }

  function renderInput(definition) {
    const contextRequired = isTreatmentContext(definition) && definition.required === true;
    const requiredMark = contextRequired ? " *" : "";
    const requiredAttribute = contextRequired ? " required" : "";
    const disabledAttribute = definition.visible === false ? " disabled" : "";
    const wrapperClass = definition.visible === false ? "hidden" : "";
    let control = "";

    if (definition.type === "boolean") {
      control = `
        <select id="jsonInput_${escapeHtml(definition.id)}" data-field="${escapeHtml(definition.id)}" data-type="boolean"${requiredAttribute}${disabledAttribute}>
          <option value="">Select…</option>
          <option value="false">No</option>
          <option value="true">Yes</option>
        </select>`;
    } else if (definition.type === "select") {
      control = `
        <select id="jsonInput_${escapeHtml(definition.id)}" data-field="${escapeHtml(definition.id)}" data-type="select"${requiredAttribute}${disabledAttribute}>
          ${(definition.options || []).length === 1 ? "" : '<option value="">Select…</option>'}
          ${(definition.options || []).map((option, index, all) => `<option value="${escapeHtml(option.value)}"${all.length === 1 ? " selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}
        </select>`;
    } else if (definition.type === "text") {
      control = `<input id="jsonInput_${escapeHtml(definition.id)}" data-field="${escapeHtml(definition.id)}" data-type="text" type="text"${requiredAttribute}${disabledAttribute}>`;
    } else {
      const minimum = definition.min !== undefined ? ` min="${escapeHtml(definition.min)}"` : "";
      const maximum = definition.max !== undefined ? ` max="${escapeHtml(definition.max)}"` : "";
      control = `<input id="jsonInput_${escapeHtml(definition.id)}" data-field="${escapeHtml(definition.id)}" data-type="number" type="number"${minimum}${maximum} step="${escapeHtml(definition.step ?? "any")}"${requiredAttribute}${disabledAttribute}>`;
    }

    const unit = definition.unit ? ` <span class="subtle">(${escapeHtml(definition.unit)})</span>` : "";
    const hints = [];
    if (definition.help) hints.push(escapeHtml(definition.help));
    if (definition.conditionalRequired) hints.push("This pathway-specific value may refine the action, but it does not block independent findings.");
    else hints.push("May be left blank; relevant unevaluated rules will be reported as coverage gaps.");

    return `
      <div class="${wrapperClass}" data-input-wrapper="${escapeHtml(definition.id)}">
        <label for="jsonInput_${escapeHtml(definition.id)}">${escapeHtml(definition.label)}${unit}<span data-required-marker>${requiredMark}</span></label>
        ${control}
        <span class="hint" data-input-hint>${hints.join(" ")}</span>
      </div>`;
  }

  function updateConditionalInputs() {
    if (!activeProtocol) return;
    const rawInputs = collectRawInputs(true);
    const definitions = Engine.getInputDefinitions(activeProtocol, activeProfileId, rawInputs);

    definitions.forEach(definition => {
      const wrapper = document.querySelector(`[data-input-wrapper="${cssEscape(definition.id)}"]`);
      const control = document.getElementById(`jsonInput_${definition.id}`);
      if (!wrapper || !control) return;

      const visible = definition.visible !== false;
      wrapper.classList.toggle("hidden", !visible);
      control.disabled = !visible;
      control.required = visible && isTreatmentContext(definition) && definition.required === true;
      if (!visible && control.value !== "") control.value = "";

      const marker = wrapper.querySelector("[data-required-marker]");
      if (marker) marker.textContent = "";
      const hint = wrapper.querySelector("[data-input-hint]");
      if (hint) {
        const parts = [];
        if (definition.help) parts.push(definition.help);
        if (definition.conditionalRequired) parts.push("This pathway-specific value may refine the action, but it does not block independent findings.");
        else parts.push("May be left blank; relevant unevaluated rules will be reported as coverage gaps.");
        hint.textContent = parts.join(" ");
      }
    });

    updateInputCount(definitions);
    hideResult();
  }

  function cssEscape(value) {
    if (root.CSS?.escape) return root.CSS.escape(String(value));
    return String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }

  function fallbackDemoValue(definition) {
    if (definition.demo_value !== undefined) return definition.demo_value;
    if (definition.type === "boolean") return false;
    if (definition.type === "select") return definition.options?.[0]?.value ?? "";
    if (definition.type === "number") {
      if (definition.min !== undefined && definition.min > 0) return definition.min;
      return 0;
    }
    return "";
  }

  function loadDemonstrationValues() {
    // Populate visible fields, recalculate conditional visibility, and repeat
    // so a demonstration trigger can reveal and populate its dependent field.
    for (let pass = 0; pass < 3; pass += 1) {
      const definitions = Engine.getInputDefinitions(activeProtocol, activeProfileId, collectRawInputs(true));
      const byId = new Map(definitions.map(definition => [definition.id, definition]));
      document.querySelectorAll("#jsonTreatmentContextGrid [data-field], #jsonInputGrid [data-field]").forEach(element => {
        const definition = byId.get(element.dataset.field);
        if (!definition || definition.visible === false) return;
        const value = fallbackDemoValue(definition);
        if (value !== undefined && value !== null) element.value = String(value);
      });
      updateConditionalInputs();
    }
    hideResult();
  }

  function collectRawInputs(includeDisabled = false) {
    const inputs = {};
    document.querySelectorAll("#jsonTreatmentContextGrid [data-field], #jsonInputGrid [data-field]").forEach(element => {
      if (!includeDisabled && element.disabled) return;
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
    document.getElementById("jsonProfileMetric").textContent = result.context.indicationLabel || result.profile.label;
    document.getElementById("jsonApplicableMetric").textContent = String(result.applicableRuleCount);
    document.getElementById("jsonEvaluatedMetric").textContent = String(result.assessedRuleCount);
    document.getElementById("jsonCompleteMetric").textContent = !result.complete
      ? "Incomplete"
      : result.coverageComplete === false
        ? `Core complete · ${result.unassessed?.length || 0} optional gap${(result.unassessed?.length || 0) === 1 ? "" : "s"}`
        : "Complete";

    renderErrors(result);
    renderFindings(result);
    document.getElementById("jsonSummary").value = Engine.documentationSummary(result, latestAssessmentId);
    container.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderErrors(result) {
    const messages = [
      ...result.missing.map(item => `Missing: ${item.label}`),
      ...(result.unassessed || []).map(item => `Not assessed: ${item.label}`),
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
    version: "0.27.2",
    open,
    ensureScreen
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureScreen);
  } else {
    ensureScreen();
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
