/**
 * SACTCheck generic JSON assessment interface.
 * Builds a protocol-driven form and delegates all clinical logic to the
 * assessment and rule engines.
 */
(function (root) {
  "use strict";

  const Engine = root.SACTCheckAssessmentEngine;
  const LocalLab = root.SACTCheckLocalLab;
  if (!Engine) throw new Error("SACTCheckAssessmentEngine must load before generic-assessment-ui.js.");

  let activeProtocol = null;
  let activeProfileId = null;
  let latestResult = null;
  let latestAssessmentId = "";
  let latestLabCalculations = {};

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
          <a class="btn secondary antiemetic-proforma-link hidden" id="jsonAntiemeticProforma" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">●</span> Supportive medicines</a>
        </div>
        <span class="badge engine-json">JSON engine v${escapeHtml(Engine.version)}</span>
      </div>

      <details open>
        <summary>Protocol information and validation status</summary>
        <div class="details-body">
          <div class="protocol-grid">
            <div class="protocol-item"><span>Regimen</span><strong id="jsonProtocolTitle">—</strong></div>
            <div class="protocol-item"><span>Common / trade names</span><strong id="jsonProtocolAliases">None mapped</strong></div>
            <div class="protocol-item"><span>NCCP code / version</span><strong id="jsonProtocolCode">—</strong></div>
            <div class="protocol-item"><span>Tumour group</span><strong id="jsonProtocolTumour">—</strong></div>
            <div class="protocol-item"><span>Encoding status</span><strong id="jsonProtocolStatus">—</strong></div>
            <div class="protocol-item"><span>Rules encoded</span><strong id="jsonProtocolRuleCount">—</strong></div>
            <div class="protocol-item"><span>Clinical validation</span><strong id="jsonProtocolValidation">—</strong></div>
            <div class="protocol-item"><span>Emetogenic potential</span><strong id="jsonEmetogenicRisk" class="emetogenic-inline emetogenic-pending">Supportive-care mapping requires review</strong></div>
          </div>
          <p class="subtle" id="jsonProtocolIndication"></p>
          <div id="jsonSupportiveCareSummary" class="supportive-care-summary" aria-live="polite"></div>
          <p class="subtle"><strong>Safety design:</strong> enter any clinically relevant value and run the assessment. Independent rules are evaluated immediately; omitted domains remain explicitly unassessed and are never assumed normal. A single normal value cannot clear the whole regimen.</p>
        </div>
      </details>

      <form id="jsonAssessmentForm" novalidate>
        <section class="blood-threshold-section">
          <div class="section-heading"><div><h2>Blood thresholds</h2><p class="subtle">Enter any available blood result. These are deliberately placed first for rapid day-ward checks.</p></div><span class="step" id="jsonBloodInputCount">—</span></div>
          <div id="jsonBloodInputGrid" class="grid blood-input-grid"></div>
          <p class="subtle" id="jsonNoBloodInputs">This regimen has no encoded blood-count input.</p>
          <details id="jsonLabProfilePanel" class="lab-profile-details hidden">
            <summary>Local laboratory profile · automatic ×ULN calculation</summary>
            <div class="details-body">
              <p class="subtle">Enter the actual ALT, AST or bilirubin result. SACTCheck calculates the protocol decision value using the centrally configured CUH upper limits.</p>
              <div class="grid three">
                <div><label for="jsonLabAltUln">ALT ULN (U/L)</label><input id="jsonLabAltUln" type="number" min="1" step="1"></div>
                <div><label for="jsonLabAstUln">AST ULN (U/L)</label><input id="jsonLabAstUln" type="number" min="1" step="1"></div>
                <div><label for="jsonLabBilirubinUln">Bilirubin ULN (µmol/L)</label><input id="jsonLabBilirubinUln" type="number" min="1" step="1"></div>
              </div>
              <div class="toolbar" style="margin-top:10px"><button class="btn secondary" type="button" id="jsonLabReset">Reset CUH defaults</button><span class="subtle">Defaults: ALT 34 U/L · AST 42 U/L · bilirubin 20 µmol/L.</span></div>
            </div>
          </details>
        </section>

        <section id="jsonImmunotherapyBloodSection" class="immunotherapy-blood-section hidden">
          <div class="section-heading"><div><h2>Optional immunotherapy bloods</h2><p class="subtle">Endocrine screening and symptom-triggered results only. These fields never block an assessment.</p></div><span class="step" id="jsonImmunotherapyBloodCount">—</span></div>
          <div id="jsonImmunotherapyBloodGrid" class="grid blood-input-grid"></div>
        </section>

        <section>
          <div class="section-heading"><h2>Other clinical inputs</h2><span class="step" id="jsonInputCount">—</span></div>
          <p class="subtle">All fields are optional. Tap a compact row to assess that domain; omitted domains remain explicitly unassessed.</p>
          <div id="jsonInputGrid" class="compact-input-list"></div>
        </section>

        <section id="jsonTreatmentContextSection">
          <div class="section-heading"><h2>Protocol and treatment context</h2><span class="step" id="jsonContextCount">—</span></div>
          <p class="subtle">Context can refine pathway-specific rules but does not block an independent single-value assessment.</p>
          <div id="jsonTreatmentContextGrid" class="compact-input-list"></div>
        </section>

        <section class="assessment-admin-section">
          <div class="section-heading"><h2>Assessment details</h2><span class="step">Optional documentation</span></div>
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
          <h2>Assessment findings</h2>
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
      renderProtocolInformation(activeProtocol);
      renderInputs();
      hideResult();
    });

    document.getElementById("jsonAssessmentForm").addEventListener("submit", event => {
      event.preventDefault();
      runAssessment();
    });

    [document.getElementById("jsonBloodInputGrid"), document.getElementById("jsonImmunotherapyBloodGrid"), document.getElementById("jsonTreatmentContextGrid"), document.getElementById("jsonInputGrid")]
      .filter(Boolean)
      .forEach(grid => {
        grid.addEventListener("change", updateConditionalInputs);
        grid.addEventListener("input", updateConditionalInputs);
      });

    ["jsonLabAltUln", "jsonLabAstUln", "jsonLabBilirubinUln"].forEach(id => {
      document.getElementById(id)?.addEventListener("change", saveLabProfile);
    });
    document.getElementById("jsonLabReset")?.addEventListener("click", () => {
      LocalLab?.reset();
      populateLabProfileControls();
      refreshCompactInputStates();
      hideResult();
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
    const aliases = root.SACTCheckDrugAliases?.forProtocol(protocol) || [];
    document.getElementById("jsonProtocolAliases").textContent = aliases.length ? aliases.join(" · ") : "None mapped";
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

    const risk = root.SACTCheckEmetogenicRisk?.get(protocol, { profileId: activeProfileId }) || {
      level: "pending",
      label: "Supportive-care mapping requires review",
      className: "emetogenic-pending",
      proformaUrl: null,
      summary: "No supportive-care mapping is available.",
      warning: "Confirm the current NCCP regimen and local pharmacy policy."
    };
    const riskElement = document.getElementById("jsonEmetogenicRisk");
    riskElement.textContent = risk.label;
    riskElement.className = `emetogenic-inline ${risk.className}`;
    const proformaLink = document.getElementById("jsonAntiemeticProforma");
    const supportiveUrl = protocol.supportive_care?.supportive_medications_pdf_url || risk.proformaUrl;
    if (supportiveUrl) {
      proformaLink.href = supportiveUrl;
      const isLocalAsset = !/^https?:/i.test(supportiveUrl);
      proformaLink.innerHTML = isLocalAsset
        ? '<span aria-hidden="true">●</span> Local supportive sheet (validate)'
        : '<span aria-hidden="true">●</span> NCCP antiemetic guidance';
      proformaLink.classList.remove("hidden");
    } else {
      proformaLink.removeAttribute("href");
      proformaLink.innerHTML = '<span aria-hidden="true">●</span> Supportive medicines';
      proformaLink.classList.add("hidden");
    }

    const supportiveSummary = document.getElementById("jsonSupportiveCareSummary");
    if (supportiveSummary) {
      const detailRows = [
        `<p><strong>${escapeHtml(risk.label)}</strong></p>`,
        risk.summary ? `<p>${escapeHtml(risk.summary)}</p>` : "",
        risk.subsequentDays ? `<p><strong>Subsequent days:</strong> ${escapeHtml(risk.subsequentDays)}</p>` : "",
        risk.breakthrough?.summary ? `<p><strong>Breakthrough symptoms:</strong> ${escapeHtml(risk.breakthrough.summary)}</p>` : "",
        risk.mappingBasis ? `<p class="subtle"><strong>Mapping basis:</strong> ${escapeHtml(risk.mappingBasis)}</p>` : "",
        risk.sourceUrl && risk.sourceUrl !== supportiveUrl
          ? `<p><a href="${escapeHtml(risk.sourceUrl)}" target="_blank" rel="noopener noreferrer">Open NCCP antiemetic source</a></p>`
          : "",
        `<p class="supportive-warning"><strong>Verification:</strong> ${escapeHtml(risk.warning || "Confirm the current NCCP regimen and local oncology-pharmacy policy.")}</p>`
      ];
      supportiveSummary.innerHTML = detailRows.join("");
      supportiveSummary.className = `supportive-care-summary ${risk.className}`;
    }

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

  function isImmunotherapyBlood(definition) {
    return definition?.ui_section === "immunotherapy_bloods";
  }

  function populateLabProfileControls() {
    if (!LocalLab) return;
    const settings = LocalLab.read();
    const map = { jsonLabAltUln: settings.altUln, jsonLabAstUln: settings.astUln, jsonLabBilirubinUln: settings.bilirubinUln };
    Object.entries(map).forEach(([id, value]) => { const element = document.getElementById(id); if (element) element.value = String(value); });
  }

  function saveLabProfile() {
    if (!LocalLab) return;
    LocalLab.write({
      altUln: document.getElementById("jsonLabAltUln")?.value,
      astUln: document.getElementById("jsonLabAstUln")?.value,
      bilirubinUln: document.getElementById("jsonLabBilirubinUln")?.value
    });
    refreshCompactInputStates();
    hideResult();
  }

  const BLOOD_FIELD_PRIORITIES = [
    { pattern: /^(anc|anc_x10e9_l|baseline_neutrophils_x10e9_l|neutrophils?(?:_x10e9_l)?)$/, priority: 10 },
    { pattern: /^(platelets?|platelets_x10e9_l|baseline_platelets(?:_x10e9_l)?)$/, priority: 20 },
    { pattern: /^(haemoglobin|haemoglobin_g_l|hemoglobin|hemoglobin_g_l|hb|hb_g_l)$/, priority: 30 },
    { pattern: /^(wbc|wbc_x10e9_l|white_cell_count|white_cell_count_x10e9_l)$/, priority: 40 }
  ];

  function bloodFieldPriority(definition) {
    const id = String(definition?.id || "").toLowerCase();
    const match = BLOOD_FIELD_PRIORITIES.find(item => item.pattern.test(id));
    return match?.priority ?? null;
  }

  function isBloodThreshold(definition) {
    return definition?.ui_section === "blood_thresholds" || bloodFieldPriority(definition) !== null;
  }

  function renderInputs(rawInputs = {}) {
    if (!activeProtocol) return;
    const definitions = Engine.getInputDefinitions(activeProtocol, activeProfileId, rawInputs);
    const contextDefinitions = definitions.filter(isTreatmentContext);
    const immunotherapyDefinitions = definitions.filter(isImmunotherapyBlood);
    const clinicalDefinitions = definitions.filter(definition => !isTreatmentContext(definition) && !isImmunotherapyBlood(definition));
    const bloodDefinitions = clinicalDefinitions
      .filter(isBloodThreshold)
      .sort((a, b) => (bloodFieldPriority(a) ?? 999) - (bloodFieldPriority(b) ?? 999));
    const additionalDefinitions = clinicalDefinitions.filter(definition => !isBloodThreshold(definition));

    document.getElementById("jsonBloodInputGrid").innerHTML = bloodDefinitions.map(definition => renderInput(definition, { compact: false, blood: true })).join("");
    document.getElementById("jsonImmunotherapyBloodGrid").innerHTML = immunotherapyDefinitions.map(definition => renderInput(definition, { compact: false, immunotherapy: true })).join("");
    document.getElementById("jsonInputGrid").innerHTML = additionalDefinitions.map(definition => renderInput(definition, { compact: true })).join("");
    document.getElementById("jsonTreatmentContextGrid").innerHTML = contextDefinitions.map(definition => renderInput(definition, { compact: true, context: true })).join("");

    document.getElementById("jsonNoBloodInputs").classList.toggle("hidden", bloodDefinitions.length > 0);
    document.getElementById("jsonInputGrid").classList.toggle("hidden", additionalDefinitions.length === 0);
    document.getElementById("jsonTreatmentContextSection").classList.toggle("hidden", contextDefinitions.length === 0);
    document.getElementById("jsonImmunotherapyBloodSection").classList.toggle("hidden", immunotherapyDefinitions.length === 0);
    document.getElementById("jsonImmunotherapyBloodCount").textContent = `${immunotherapyDefinitions.length} optional field${immunotherapyDefinitions.length === 1 ? "" : "s"}`;
    document.getElementById("jsonLabProfilePanel").classList.toggle("hidden", !definitions.some(definition => LocalLab?.adapterFor(definition)));
    populateLabProfileControls();
    document.getElementById("jsonBloodInputCount").textContent = `${bloodDefinitions.filter(definition => definition.visible !== false).length} prioritised field${bloodDefinitions.length === 1 ? "" : "s"}`;
    document.getElementById("jsonContextCount").textContent = `${contextDefinitions.filter(definition => definition.visible !== false).length} optional field${contextDefinitions.length === 1 ? "" : "s"}`;
    updateInputCount(additionalDefinitions);
    refreshCompactInputStates(definitions);
  }

  function updateInputCount(definitions) {
    const visible = definitions.filter(definition => definition.visible !== false);
    const parts = [`${visible.length} optional field${visible.length === 1 ? "" : "s"}`];
    parts.push("single-value assessment enabled");
    document.getElementById("jsonInputCount").textContent = parts.join(" · ");
  }

  function buildControl(definition) {
    const disabledAttribute = definition.visible === false ? " disabled" : "";
    const labAdapter = LocalLab?.adapterFor(definition);
    if (labAdapter) {
      const settings = LocalLab.read();
      return `<div class="lab-actual-inputs" data-lab-control-group="${escapeHtml(definition.id)}">${labAdapter.analytes.map(analyte => {
        const upper = settings[analyte.setting];
        return `<div><label for="jsonLab_${escapeHtml(definition.id)}_${escapeHtml(analyte.id)}">${escapeHtml(analyte.label)} <span class="subtle">(${escapeHtml(analyte.unit)})</span></label><input id="jsonLab_${escapeHtml(definition.id)}_${escapeHtml(analyte.id)}" data-lab-target="${escapeHtml(definition.id)}" data-lab-analyte="${escapeHtml(analyte.id)}" data-type="number" type="number" min="0" step="0.1" placeholder="Not assessed"${disabledAttribute}><span class="hint">Local ULN ${escapeHtml(upper)} ${escapeHtml(analyte.unit)}.</span></div>`;
      }).join("")}<div class="lab-calculation-preview" data-lab-preview="${escapeHtml(definition.id)}">Enter an actual result; ×ULN is calculated automatically.</div></div>`;
    }
    if (definition.type === "boolean") {
      return `
        <select id="jsonInput_${escapeHtml(definition.id)}" data-field="${escapeHtml(definition.id)}" data-type="boolean"${disabledAttribute}>
          <option value="">Not assessed</option>
          <option value="false">No</option>
          <option value="true">Yes</option>
        </select>`;
    }
    if (definition.type === "select") {
      return `
        <select id="jsonInput_${escapeHtml(definition.id)}" data-field="${escapeHtml(definition.id)}" data-type="select"${disabledAttribute}>
          <option value="">Not assessed</option>
          ${(definition.options || []).map(option => `<option value="${escapeHtml(option.value)}">${escapeHtml(root.SACTCheckCTCAE?.optionLabel(definition, option) || option.label)}</option>`).join("")}
        </select>`;
    }
    if (definition.type === "text") {
      return `<input id="jsonInput_${escapeHtml(definition.id)}" data-field="${escapeHtml(definition.id)}" data-type="text" type="text" placeholder="Not assessed"${disabledAttribute}>`;
    }
    const minimum = definition.min !== undefined ? ` min="${escapeHtml(definition.min)}"` : "";
    const maximum = definition.max !== undefined ? ` max="${escapeHtml(definition.max)}"` : "";
    return `<input id="jsonInput_${escapeHtml(definition.id)}" data-field="${escapeHtml(definition.id)}" data-type="number" type="number" placeholder="Not assessed"${minimum}${maximum} step="${escapeHtml(definition.step ?? "any")}"${disabledAttribute}>`;
  }

  function renderCtcaeGuide(definition) {
    const guide = root.SACTCheckCTCAE?.guide(definition);
    if (!guide) return "";
    const grades = guide.grades.map(item => `
      <li><strong>Grade ${escapeHtml(item.grade)}</strong><span>${escapeHtml(item.description)}</span></li>`).join("");
    return `
      <details class="ctcae-guide" data-ctcae-guide="${escapeHtml(definition.id)}" open>
        <summary>${escapeHtml(guide.version)} grading and how to assess</summary>
        <div class="ctcae-guide-body">
          <p><strong>How to assess:</strong> ${escapeHtml(guide.guidance)}</p>
          <ol class="ctcae-grade-list">${grades}</ol>
          <p class="subtle">Use the named CTCAE adverse-event term. <a href="${escapeHtml(guide.sourceUrl)}" target="_blank" rel="noopener noreferrer">Open the CTCAE v5.0 source</a>.</p>
        </div>
      </details>`;
  }

  function renderInput(definition, options = {}) {
    const wrapperClass = definition.visible === false ? "hidden" : "";
    const labAdapter = LocalLab?.adapterFor(definition);
    const control = buildControl(definition);
    const displayLabel = labAdapter ? `${labAdapter.title} · automatic ×ULN` : definition.label;
    const unit = !labAdapter && definition.unit ? ` <span class="subtle">(${escapeHtml(definition.unit)})</span>` : "";
    const labelFor = labAdapter ? "" : ` for="jsonInput_${escapeHtml(definition.id)}"`;
    const hints = [];
    if (definition.help) hints.push(escapeHtml(definition.help));
    if (labAdapter) hints.push("Enter the actual laboratory result; the configured local ULN is applied automatically to the encoded protocol rule.");
    if (definition.id === "tsh_miu_l" && LocalLab) hints.push(escapeHtml(LocalLab.referenceText("tsh")));
    if (definition.id === "free_t4_pmol_l" && LocalLab) hints.push(escapeHtml(LocalLab.referenceText("free_t4")));
    if (definition.assessment_guidance && !root.SACTCheckCTCAE?.guide(definition)) hints.push(escapeHtml(definition.assessment_guidance));
    hints.push("Optional. Leaving this blank will not block assessment and will not be treated as normal.");
    const ctcaeGuide = renderCtcaeGuide(definition);

    if (options.compact) {
      return `
        <details class="compact-assessment-input ${wrapperClass}" data-input-wrapper="${escapeHtml(definition.id)}">
          <summary><span>${escapeHtml(displayLabel)}${unit}</span><span class="compact-input-state" data-input-state>Not assessed</span></summary>
          <div class="compact-input-body">
            ${labAdapter ? "" : `<label class="sr-only" for="jsonInput_${escapeHtml(definition.id)}">${escapeHtml(definition.label)}</label>`}
            ${control}
            <span class="hint" data-input-hint>${hints.join(" ")}</span>
            ${ctcaeGuide}
          </div>
        </details>`;
    }

    return `
      <div class="blood-input-card ${wrapperClass}" data-input-wrapper="${escapeHtml(definition.id)}">
        <label${labelFor}>${escapeHtml(displayLabel)}${unit}</label>
        ${control}
        <span class="hint" data-input-hint>${hints.join(" ")}</span>
        ${ctcaeGuide}
      </div>`;
  }

  function updateCompactInputState(control, definition) {
    const wrapper = control?.closest(".compact-assessment-input");
    const state = wrapper?.querySelector("[data-input-state]");
    if (!wrapper || !state) return;
    const target = control.dataset.labTarget;
    if (target && LocalLab) {
      const calculation = calculateLabTarget(target);
      state.textContent = calculation?.decisionDisplay || "Not assessed";
      wrapper.classList.toggle("assessed", Boolean(calculation));
      return;
    }
    let label = "Not assessed";
    if (control.value !== "") {
      if (control.tagName === "SELECT") label = control.options[control.selectedIndex]?.text || control.value;
      else label = `${control.value}${definition?.unit ? ` ${definition.unit}` : ""}`;
    }
    state.textContent = label;
    wrapper.classList.toggle("assessed", control.value !== "");
  }

  function refreshCompactInputStates(definitions) {
    const byId = new Map((definitions || Engine.getInputDefinitions(activeProtocol, activeProfileId, collectRawInputs(true))).map(definition => [definition.id, definition]));
    document.querySelectorAll("#jsonBloodInputGrid [data-field], #jsonBloodInputGrid [data-lab-target], #jsonImmunotherapyBloodGrid [data-field], #jsonTreatmentContextGrid [data-field], #jsonInputGrid [data-field], #jsonInputGrid [data-lab-target]").forEach(control => {
      updateCompactInputState(control, byId.get(control.dataset.field || control.dataset.labTarget));
    });
    refreshLabPreviews();
  }

  function updateConditionalInputs() {
    if (!activeProtocol) return;
    const rawInputs = collectRawInputs(true);
    const definitions = Engine.getInputDefinitions(activeProtocol, activeProfileId, rawInputs);

    definitions.forEach(definition => {
      const wrapper = document.querySelector(`[data-input-wrapper="${cssEscape(definition.id)}"]`);
      const controls = [...document.querySelectorAll(`[data-field="${cssEscape(definition.id)}"], [data-lab-target="${cssEscape(definition.id)}"]`)];
      if (!wrapper || !controls.length) return;

      const visible = definition.visible !== false;
      wrapper.classList.toggle("hidden", !visible);
      controls.forEach(control => {
        control.disabled = !visible;
        control.required = false;
        if (!visible && control.value !== "") control.value = "";
      });

      const hint = wrapper.querySelector("[data-input-hint]");
      if (hint) {
        const parts = [];
        if (definition.help) parts.push(definition.help);
        if (LocalLab?.adapterFor(definition)) parts.push("Enter the actual laboratory result; the configured local ULN is applied automatically to the encoded protocol rule.");
        if (definition.id === "tsh_miu_l" && LocalLab) parts.push(LocalLab.referenceText("tsh"));
        if (definition.id === "free_t4_pmol_l" && LocalLab) parts.push(LocalLab.referenceText("free_t4"));
        if (definition.assessment_guidance && !root.SACTCheckCTCAE?.guide(definition)) parts.push(definition.assessment_guidance);
        parts.push("Optional. Leaving this blank will not block assessment and will not be treated as normal.");
        hint.textContent = parts.join(" ");
      }
      controls.forEach(control => updateCompactInputState(control, definition));
    });

    const clinicalDefinitions = definitions.filter(definition => !isTreatmentContext(definition) && !isImmunotherapyBlood(definition));
    updateInputCount(clinicalDefinitions.filter(definition => !isBloodThreshold(definition)));
    refreshLabPreviews();
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
      document.querySelectorAll("#jsonBloodInputGrid [data-field], #jsonImmunotherapyBloodGrid [data-field], #jsonTreatmentContextGrid [data-field], #jsonInputGrid [data-field]").forEach(element => {
        const definition = byId.get(element.dataset.field);
        if (!definition || definition.visible === false) return;
        const value = fallbackDemoValue(definition);
        if (value !== undefined && value !== null) element.value = String(value);
      });
      document.querySelectorAll("[data-lab-target]").forEach(element => {
        const targetDefinition = byId.get(element.dataset.labTarget);
        if (!targetDefinition || targetDefinition.visible === false || !LocalLab) return;
        const settings = LocalLab.read();
        const adapter = LocalLab.adapterFor(targetDefinition);
        const analyte = adapter?.analytes.find(item => item.id === element.dataset.labAnalyte);
        if (analyte) element.value = String(settings[analyte.setting]);
      });
      updateConditionalInputs();
    }
    hideResult();
  }

  function collectRawInputs(includeDisabled = false) {
    const inputs = {};
    latestLabCalculations = {};
    document.querySelectorAll("#jsonBloodInputGrid [data-field], #jsonImmunotherapyBloodGrid [data-field], #jsonTreatmentContextGrid [data-field], #jsonInputGrid [data-field]").forEach(element => {
      if (!includeDisabled && element.disabled) return;
      inputs[element.dataset.field] = element.value;
    });
    const targets = [...new Set([...document.querySelectorAll("[data-lab-target]")].filter(element => includeDisabled || !element.disabled).map(element => element.dataset.labTarget))];
    targets.forEach(target => {
      const calculation = calculateLabTarget(target);
      if (calculation) {
        inputs[target] = String(calculation.ratio);
        latestLabCalculations[target] = calculation;
      }
    });
    return inputs;
  }

  function calculateLabTarget(target) {
    if (!LocalLab) return null;
    const actualValues = {};
    document.querySelectorAll(`[data-lab-target="${cssEscape(target)}"]`).forEach(element => {
      actualValues[element.dataset.labAnalyte] = element.value;
    });
    return LocalLab.calculate(target, actualValues);
  }

  function refreshLabPreviews() {
    document.querySelectorAll("[data-lab-preview]").forEach(preview => {
      const calculation = calculateLabTarget(preview.dataset.labPreview);
      preview.textContent = calculation?.display || "Enter an actual result; ×ULN is calculated automatically.";
      preview.classList.toggle("assessed", Boolean(calculation));
    });
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
    let summary = Engine.documentationSummary(result, latestAssessmentId);
    const labLines = Object.values(latestLabCalculations).map(calculation => `- ${calculation.display} → decision value ${calculation.decisionDisplay}`);
    if (labLines.length) summary += `\n\nAutomatic local-laboratory calculations (${LocalLab?.read().profileName || "local profile"}):\n${labLines.join("\n")}`;
    document.getElementById("jsonSummary").value = summary;
    container.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderErrors(result) {
    const blockingMessages = [
      ...result.missing.map(item => `Missing: ${item.label}`),
      ...result.invalid.map(item => `Invalid: ${item.label} — ${item.reason}`),
      ...result.errors.map(item => `Rule error ${item.ruleId}: ${item.message}`)
    ];
    const unassessed = result.unassessed || [];
    const blocks = [];
    if (blockingMessages.length) {
      blocks.push(`<div class="error-list">${blockingMessages.map(escapeHtml).join("<br>")}</div>`);
    }
    if (unassessed.length) {
      blocks.push(`
        <details class="coverage-gap-details">
          <summary>${unassessed.length} domain${unassessed.length === 1 ? "" : "s"} not assessed</summary>
          <div class="details-body"><p class="subtle">These values were left blank and have not been assumed normal.</p><div class="coverage-gap-list">${unassessed.map(item => `<span>${escapeHtml(item.label)}</span>`).join("")}</div></div>
        </details>`);
    }
    document.getElementById("jsonErrors").innerHTML = blocks.join("");
  }

  function renderFindings(result) {
    const target = document.getElementById("jsonFindings");
    if (!result.findings.length) {
      target.innerHTML = '<div class="finding consult"><h3>No assessment finding</h3><p>Enter any relevant clinical value. Blank fields do not block an independent rule and are not assumed normal.</p></div>';
      return;
    }

    target.innerHTML = result.findings.map(finding => {
      const className = findingClass(finding.actionType);
      const detail = Engine.actionDetail(finding.action);
      const actionLabel = finding.domainAssessment
        ? "Assessed domain only — encoded restrictive threshold not triggered"
        : finding.contextRequired
          ? "Additional linked context required"
          : (Engine.actionLabels[finding.actionType] || humanise(finding.actionType));
      return `
        <div class="finding ${className}">
          <h3>${escapeHtml(finding.displayTitle || finding.ruleId)}</h3>
          <p><strong>${escapeHtml(actionLabel)}</strong></p>
          ${renderThresholdComparison(finding, result)}
          <p>${escapeHtml(finding.explanation)}</p>
          ${detail ? `<p><strong>Encoded action detail:</strong> ${escapeHtml(detail)}</p>` : ""}
          <div class="source">${escapeHtml(finding.sourceText)}</div>
        </div>`;
    }).join("");
  }

  function renderThresholdComparison(finding, result) {
    const conditions = finding.conditions?.length ? finding.conditions : [finding.condition];
    const comparisons = conditions.flatMap(condition => comparisonRows(condition, result.inputs, result.definitions));
    const uniqueComparisons = comparisons.filter((item, index, array) =>
      array.findIndex(other => other.label === item.label && other.actual === item.actual && other.symbol === item.symbol && other.cutoff === item.cutoff) === index
    );
    if (!uniqueComparisons.length) return "";
    return `<div class="threshold-comparison" role="group" aria-label="Encoded threshold comparison">
      ${uniqueComparisons.map(item => `
        <div class="threshold-comparison-row">
          <div><span class="threshold-label">${escapeHtml(item.label)}</span><strong class="patient-value">${escapeHtml(item.actual)}</strong></div>
          <div class="comparison-symbol">${escapeHtml(item.symbol)}</div>
          <div><span class="threshold-label">Protocol cutoff</span><strong class="cutoff-value">${escapeHtml(item.cutoff)}</strong></div>
        </div>`).join("")}
    </div>`;
  }

  function comparisonRows(condition, inputs, definitions) {
    if (!condition || typeof condition !== "object") return [];
    const definitionMap = new Map((definitions || []).map(definition => [definition.id, definition]));
    const leaves = [];
    collectConditionLeaves(condition, leaves);
    return leaves
      .filter(leaf => leaf.field && inputs?.[leaf.field] !== undefined && inputs?.[leaf.field] !== null && inputs?.[leaf.field] !== "")
      .map(leaf => {
        const definition = definitionMap.get(leaf.field) || {};
        const labCalculation = latestLabCalculations[leaf.field];
        const unit = definition.unit ? ` ${definition.unit}` : "";
        return {
          label: labCalculation ? `${definition.label || humanise(leaf.field)} · calculated` : (definition.label || humanise(leaf.field)),
          actual: labCalculation ? `${labCalculation.display} → ${labCalculation.decisionDisplay}` : `${formatComparisonValue(inputs[leaf.field])}${unit}`,
          symbol: operatorSymbol(leaf.operator),
          cutoff: `${formatCutoff(leaf.value, leaf.operator)}${unit}`
        };
      });
  }

  function collectConditionLeaves(node, output) {
    if (!node) return output;
    if (Array.isArray(node)) {
      node.forEach(item => collectConditionLeaves(item, output));
      return output;
    }
    if (node.field) output.push(node);
    ["all", "any", "none"].forEach(key => {
      if (node[key]) collectConditionLeaves(node[key], output);
    });
    if (node.not) collectConditionLeaves(node.not, output);
    return output;
  }

  function operatorSymbol(operator) {
    const symbols = {
      lt: "<", "<": "<", lte: "≤", "<=": "≤",
      gt: ">", ">": ">", gte: "≥", ">=": "≥",
      eq: "=", equals: "=", "==": "=", "=": "=",
      neq: "≠", not_equals: "≠", "!=": "≠", "<>": "≠",
      between: "within", between_inclusive: "within", between_exclusive: "within",
      outside: "outside", in: "in", one_of: "in", not_in: "not in"
    };
    return symbols[String(operator || "==").toLowerCase()] || String(operator || "=");
  }

  function formatCutoff(value, operator) {
    if (Array.isArray(value)) {
      const joiner = ["between", "between_inclusive", "between_exclusive"].includes(String(operator).toLowerCase()) ? "–" : ", ";
      return value.map(formatComparisonValue).join(joiner);
    }
    return formatComparisonValue(value);
  }

  function formatComparisonValue(value) {
    if (value === true) return "Yes";
    if (value === false) return "No";
    return String(value);
  }

  function findingClass(actionType) {
    if (["permanently_discontinue", "contraindicated", "discontinue", "cease"].includes(actionType)) return "critical";
    if (["omit", "withhold", "withhold_then_reduce", "delay", "delay_then_dose_reduce"].includes(actionType)) return "hold";
    if (["consultant_review", "partial_context_required"].includes(actionType)) return "consult";
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
    version: "0.37.2",
    open,
    ensureScreen
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureScreen);
  } else {
    ensureScreen();
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
