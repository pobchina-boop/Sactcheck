/**
 * SACTCheck generic JSON assessment interface.
 * Builds a protocol-driven form and delegates all clinical logic to the
 * assessment and rule engines.
 */
(function (root) {
  "use strict";

  const Engine = root.SACTCheckAssessmentEngine;
  const LocalLab = root.SACTCheckLocalLab;
  const AssessmentOutput = root.SACTCheckAssessmentOutput;
  const AssessmentPdf = root.SACTCheckAssessmentPdf;
  if (!Engine) throw new Error("SACTCheckAssessmentEngine must load before generic-assessment-ui.js.");
  if (!AssessmentOutput) throw new Error("SACTCheckAssessmentOutput must load before generic-assessment-ui.js.");
  if (!AssessmentPdf) throw new Error("SACTCheckAssessmentPdf must load before generic-assessment-ui.js.");

  let activeProtocol = null;
  let activeProfileId = null;
  let latestResult = null;
  let latestAssessmentId = "";
  let latestLabCalculations = {};
  let activeTumourGroup = "all";

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  const ECOG_LEVELS = Object.freeze({
    0: "Fully active; no restriction in usual pre-illness activity.",
    1: "Ambulatory; limited only in strenuous activity and able to do light or sedentary work.",
    2: "Ambulatory and independent in self-care; unable to work and out of bed or chair for more than half of waking hours.",
    3: "Capable of limited self-care; in bed or a chair for more than half of waking hours.",
    4: "Completely disabled; unable to perform self-care and fully confined to bed or a chair.",
    5: "Death; not an active treatment-assessment state."
  });

  function isEcogDefinition(definition) {
    const id = String(definition?.id || "").toLowerCase();
    const label = String(definition?.label || "").toLowerCase();
    return /(^|_)ecog($|_)/.test(id) || /\becog\b/.test(label) || /\bperformance status\b/.test(label);
  }

  function isExplicitNonLaboratoryCriterion(definition) {
    if (!definition) return false;
    if (isEcogDefinition(definition)) return true;
    const text = definitionSearchText(definition);
    return /\b(?:pregnan(?:t|cy)|breastfeed(?:ing)?|hypersensitiv(?:e|ity)|allerg(?:y|ic)|dpd|brivudine|consent|contraception|fertility)\b/i.test(text);
  }

  function ecogOptionLabel(option) {
    const value = Number(option?.value);
    if (!Number.isInteger(value) || !(value in ECOG_LEVELS)) return String(option?.label ?? option?.value ?? "");
    const short = {
      0: "Fully active",
      1: "Ambulatory; strenuous activity restricted",
      2: "Self-care independent; unable to work",
      3: "Limited self-care; bed/chair >50%",
      4: "Completely disabled; bed/chair bound",
      5: "Death"
    }[value];
    return `${value} — ${short}`;
  }

  function renderEcogGuide(definition) {
    if (!isEcogDefinition(definition)) return "";
    return `
      <details class="ecog-guide" open>
        <summary>ECOG performance status guide</summary>
        <div class="ctcae-guide-body">
          <p><strong>How to assess:</strong> Select the clinician-assessed functional status. ECOG performance status is not a CTCAE adverse-event grade.</p>
          <ol class="ctcae-grade-list">${Object.entries(ECOG_LEVELS).map(([level, description]) => `
            <li><strong>ECOG ${escapeHtml(level)}</strong><span>${escapeHtml(description)}</span></li>`).join("")}</ol>
          <p class="subtle">Source: ECOG-ACRIN Performance Status Scale. ECOG 5 is shown for completeness and is not an active SACT assessment state.</p>
        </div>
      </details>`;
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
          <a class="btn secondary official-pdf-link hidden" id="jsonOfficialPdf" rel="external" referrerpolicy="no-referrer"><span aria-hidden="true">📄</span> Official NCCP PDF</a>
          <button class="btn secondary hidden" type="button" id="jsonDoseScheduleButton"><span aria-hidden="true">📅</span> Dose &amp; Schedule</button>
          <button class="btn secondary hidden" type="button" id="jsonImmuneSafetyButton"><span aria-hidden="true">◉</span> Immune safety</button>
          <button class="btn secondary hidden" type="button" id="jsonScenarioInterpreterButton"><span aria-hidden="true">✦</span> Clinical scenario interpreter</button>
          <button class="btn secondary hidden" type="button" id="jsonRegimenInfoButton"><span aria-hidden="true">◈</span> Regimen info</button>
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

      <section id="jsonImmuneSafetyPanel" class="immune-safety-panel hidden" aria-live="polite"></section>

      <section id="jsonDoseSchedulePanel" class="dose-schedule-panel hidden" aria-live="polite"></section>

      <section id="jsonScenarioInterpreterPanel" class="scenario-interpreter-panel hidden" aria-live="polite"></section>

      <form id="jsonAssessmentForm" novalidate>
        <section class="blood-threshold-section laboratory-organ-section">
          <div class="section-heading"><div><h2>Bloods and organ function</h2><p class="subtle">Enter any available result. Blank fields remain unassessed and the same values drive treatment criteria and protocol dose modifications.</p></div><span class="step" id="jsonBloodInputCount">—</span></div>
          <p class="subtle" id="jsonNoBloodInputs">This regimen has no encoded laboratory or organ-function input.</p>

          <div class="laboratory-domains-grid" id="jsonLaboratoryDomainsGrid">
          <div class="laboratory-domain hidden" id="jsonHaematologyDomain">
            <div class="laboratory-domain-heading"><h3>Haematology</h3><span id="jsonHaematologyCount">—</span></div>
            <div id="jsonHaematologyInputGrid" class="grid blood-input-grid"></div>
          </div>

          <div class="laboratory-domain hidden" id="jsonRenalDomain">
            <div class="laboratory-domain-heading"><h3>Renal</h3><span id="jsonRenalCount">—</span></div>
            <div id="jsonRenalInputGrid" class="grid blood-input-grid"></div>
          </div>

          <div class="laboratory-domain hidden" id="jsonHepaticDomain">
            <div class="laboratory-domain-heading"><h3>Hepatic</h3><span id="jsonHepaticCount">—</span></div>
            <div id="jsonHepaticInputGrid" class="grid blood-input-grid"></div>
          </div>

          <div class="laboratory-domain hidden" id="jsonOtherLaboratoryDomain">
            <div class="laboratory-domain-heading"><h3>Other protocol bloods</h3><span id="jsonOtherLaboratoryCount">—</span></div>
            <div id="jsonOtherLaboratoryInputGrid" class="grid blood-input-grid"></div>
          </div>

          <div class="laboratory-domain immunotherapy-laboratory-domain hidden" id="jsonImmunotherapyBloodSection">
            <div class="laboratory-domain-heading"><div><h3>Immunotherapy endocrine bloods</h3><p class="subtle">Optional screening or symptom-triggered inputs only.</p></div><span id="jsonImmunotherapyBloodCount">—</span></div>
            <div id="jsonImmunotherapyBloodGrid" class="grid blood-input-grid"></div>
          </div>

          </div>

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

        <section id="jsonToxicitySection">
          <div class="section-heading"><div><h2>Clinical toxicities</h2><p class="subtle">CTCAE and regimen-specific clinical toxicity grades are kept separate from laboratory results.</p></div><span class="step" id="jsonToxicityCount">—</span></div>
          <div id="jsonToxicityInputGrid" class="compact-input-list"></div>
        </section>

        <section id="jsonOtherCriteriaSection">
          <div class="section-heading"><h2>Other treatment criteria</h2><span class="step" id="jsonInputCount">—</span></div>
          <p class="subtle">Eligibility, hypersensitivity, pregnancy, infection and other non-laboratory criteria. Omitted fields remain explicitly unassessed.</p>
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
        <div id="jsonStatusBox" class="status warn result-status-banner">
          <h2 id="jsonStatusTitle"></h2>
          <p id="jsonStatusAction"></p>
        </div>

        <div class="assessment-summary-strip">
          <strong id="jsonProfileMetric">—</strong>
          <span id="jsonCoverageMetric">—</span>
          <span class="visually-hidden">Applicable rules: <strong id="jsonApplicableMetric">—</strong></span>
          <span class="visually-hidden">Rules evaluated: <strong id="jsonEvaluatedMetric">—</strong></span>
          <span class="visually-hidden">Completeness: <strong id="jsonCompleteMetric">—</strong></span>
        </div>

        <div class="decision-support-disclaimer compact"><strong>Decision support — not treatment clearance.</strong> <span id="jsonScreenDisclaimer"></span></div>
        <div id="jsonErrors"></div>
        <div id="jsonDoseModificationPrompt" class="dose-modification-prompt hidden" aria-live="polite"></div>

        <div class="result-block priority-findings-block">
          <div class="section-heading"><div><h2>Key protocol comparison</h2><p class="subtle">Entered value, applicable encoded criterion and result.</p></div><span class="step" id="jsonPriorityCount">—</span></div>
          <div id="jsonPriorityFindings"></div>
        </div>

        <div class="result-action-bar result-actions">
          <button type="button" class="btn" id="jsonGeneratePdf">Generate PDF</button>
          <button type="button" class="btn secondary" id="jsonCopyOnePage">Copy concise summary</button>
          <a class="btn secondary official-pdf-link hidden" id="jsonResultOfficialPdf" rel="external" referrerpolicy="no-referrer"><span aria-hidden="true">📄</span> Open NCCP protocol</a>
          <span class="pdf-estimate" id="jsonPdfPageEstimate">A4 PDF</span>
        </div>

        <details class="result-disclosure pdf-documentation-details" id="jsonOnePageSection">
          <summary>Add final clinician decision to the PDF</summary>
          <div class="details-body">
            <div class="output-documentation-grid">
              <div>
                <label for="jsonClinicianDecision">Final clinician decision</label>
                <select id="jsonClinicianDecision">
                  <option value="">Not documented</option>
                  <option value="proceed">Proceed</option>
                  <option value="hold">Hold or defer</option>
                  <option value="modify">Dose modify</option>
                  <option value="discuss">Discuss with consultant/pharmacy</option>
                  <option value="other">Other</option>
                </select>
                <span class="hint">Recorded separately from the calculated protocol-criteria result.</span>
              </div>
              <div>
                <label for="jsonClinicianNote">Decision rationale or override</label>
                <textarea id="jsonClinicianNote" rows="2" maxlength="400" placeholder="Optional concise rationale; do not enter identifiable patient information."></textarea>
              </div>
            </div>
            <details class="pdf-preview-disclosure"><summary>Preview concise PDF content</summary><div class="details-body"><div id="jsonPrintSummary" class="assessment-output-preview"></div></div></details>
          </div>
        </details>

        <details class="result-disclosure" id="jsonWhyResult">
          <summary>Why this result? View detailed encoded findings</summary>
          <div class="details-body"><div id="jsonFindings"></div></div>
        </details>

        <details class="result-disclosure">
          <summary>Detailed copyable assessment summary</summary>
          <div class="details-body">
            <textarea id="jsonSummary" class="summary-box" readonly></textarea>
            <div class="toolbar result-actions" style="margin-top:10px">
              <button type="button" class="btn" id="jsonCopy">Copy detailed summary</button>
              <button type="button" class="btn secondary" id="jsonDownload">Download detailed text summary</button>
            </div>
          </div>
        </details>

        <p class="footer-note">Machine-readable protocol comparison. Encoded protocols remain pending formal consultant and oncology-pharmacy validation.</p>
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

    document.getElementById("jsonDoseScheduleButton")?.addEventListener("click", () => {
      root.SACTCheckProtocolDoseSchedule?.open?.(activeProtocol);
    });

    document.getElementById("jsonImmuneSafetyButton")?.addEventListener("click", () => {
      root.SACTCheckImmunotherapySafety?.open?.(activeProtocol);
    });

    document.getElementById("jsonScenarioInterpreterButton")?.addEventListener("click", () => {
      root.SACTCheckScenarioInterpreter?.open?.(activeProtocol);
    });

    document.getElementById("jsonRegimenInfoButton")?.addEventListener("click", () => {
      root.SACTCheckRegimenKnowledgeBase?.open?.(activeProtocol);
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

    document.querySelectorAll(INPUT_GRID_SELECTOR).forEach(grid => {
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
    document.getElementById("jsonGeneratePdf").addEventListener("click", generatePdfSummary);
    document.getElementById("jsonCopyOnePage").addEventListener("click", copyOnePageSummary);
    document.getElementById("jsonClinicianDecision").addEventListener("change", renderOnePageSummary);
    document.getElementById("jsonClinicianNote").addEventListener("input", renderOnePageSummary);
    document.getElementById("jsonScreenDisclaimer").textContent = "Final treatment suitability remains the responsibility of the treating oncology clinician after complete assessment and review of the current NCCP protocol.";
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

  function open(protocol, context = {}) {
    ensureScreen();
    protocol = root.SACTCheckToxicityAttribution?.decorate?.(protocol) || protocol;
    activeProtocol = protocol;
    activeTumourGroup = root.SACTCheckProtocolContext?.normaliseGroup?.(context.tumourGroup || "all") || context.tumourGroup || "all";
    const validation = Engine.validateProtocol(protocol);
    if (!validation.valid) {
      throw new Error(`Protocol cannot be assessed: ${validation.errors.join(" ")}`);
    }

    const profiles = Engine.getProfiles(protocol);
    activeProfileId = profiles[0]?.id || "default";
    latestResult = null;
    resetOutputDocumentation();

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
    const primaryTumour = typeof metadata.tumour_group === "string" ? metadata.tumour_group.trim() : "";
    const listedTumours = asArray(metadata.tumour_groups).map(value => String(value).trim()).filter(Boolean);
    const displayedTumours = primaryTumour && listedTumours.length && !listedTumours.includes(primaryTumour)
      ? [primaryTumour]
      : (listedTumours.length ? listedTumours : (primaryTumour ? [primaryTumour] : []));
    const contextualTumour = activeTumourGroup !== "all" && displayedTumours.includes(activeTumourGroup)
      ? `${activeTumourGroup}${displayedTumours.length > 1 ? " (shared protocol)" : ""}`
      : (displayedTumours.join(" · ") || "Uncategorised");
    document.getElementById("jsonProtocolTumour").textContent = contextualTumour;
    document.getElementById("jsonProtocolStatus").textContent = humanise(protocol.status || "not specified");
    const deterministicRules = asArray(protocol.rule_engine?.rules).length;
    const iraeReferenceRules = asArray(protocol.pembrolizumab_irae_rules?.rules).length;
    document.getElementById("jsonProtocolRuleCount").textContent = iraeReferenceRules
      ? `${deterministicRules} deterministic + ${iraeReferenceRules} irAE reference`
      : String(deterministicRules);
    document.getElementById("jsonProtocolValidation").textContent = validationComplete ? "Validated" : "Pending formal validation";
    document.getElementById("jsonProtocolIndication").textContent = root.SACTCheckProtocolContext?.descriptionForTissue?.(
      protocol, activeTumourGroup, { scope: "assessment" }
    ) || metadata.indication || indicationSummary(protocol);

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

    root.SACTCheckProtocolDoseSchedule?.prepare?.(protocol);
    root.SACTCheckRegimenKnowledgeBase?.prepare?.(protocol);

    const officialPdf = document.getElementById("jsonOfficialPdf");
    const resultOfficialPdf = document.getElementById("jsonResultOfficialPdf");
    if (metadata.source_url) {
      officialPdf.href = metadata.source_url;
      officialPdf.classList.remove("hidden");
      if (resultOfficialPdf) { resultOfficialPdf.href = metadata.source_url; resultOfficialPdf.classList.remove("hidden"); }
    } else {
      officialPdf.removeAttribute("href");
      officialPdf.classList.add("hidden");
      if (resultOfficialPdf) { resultOfficialPdf.removeAttribute("href"); resultOfficialPdf.classList.add("hidden"); }
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

  const INPUT_GRID_SELECTOR = [
    "#jsonHaematologyInputGrid",
    "#jsonRenalInputGrid",
    "#jsonHepaticInputGrid",
    "#jsonOtherLaboratoryInputGrid",
    "#jsonImmunotherapyBloodGrid",
    "#jsonToxicityInputGrid",
    "#jsonTreatmentContextGrid",
    "#jsonInputGrid"
  ].join(", ");

  const LABORATORY_DOMAIN_LABELS = Object.freeze({
    haematology: "Haematology",
    renal: "Renal",
    hepatic: "Hepatic",
    other: "Other bloods",
    immunotherapy: "Immunotherapy"
  });

  function inputControlSelector(controlSelector) {
    return INPUT_GRID_SELECTOR.split(", ").map(selector => `${selector} ${controlSelector}`).join(", ");
  }

  function bloodFieldPriority(definition) {
    const id = String(definition?.id || "").toLowerCase();
    const match = BLOOD_FIELD_PRIORITIES.find(item => item.pattern.test(id));
    return match?.priority ?? null;
  }

  function definitionSearchText(definition) {
    return `${definition?.id || ""} ${definition?.label || ""} ${definition?.unit || ""}`.toLowerCase();
  }

  function laboratoryDomain(definition) {
    if (!definition || isTreatmentContext(definition) || isExplicitNonLaboratoryCriterion(definition)) return null;
    if (isImmunotherapyBlood(definition)) return "immunotherapy";
    const text = definitionSearchText(definition);
    if (bloodFieldPriority(definition) !== null || /\b(?:anc|neutrophils?|platelets?|haemoglobin|hemoglobin|wbc|lymphocytes?|monocytes?)\b|white[ _-]?cell/i.test(text)) return "haematology";
    if (/\b(?:crcl|egfr|gfr|creatinine|renal|kidney|dialysis|haemodialysis)\b|creatinine clearance/i.test(text)) return "renal";
    if (LocalLab?.adapterFor(definition) || /\b(?:bilirubin|alt|ast|hepatic|liver|alp)\b|transamin|child[ -]?pugh|alkaline phosphatase/i.test(text)) return "hepatic";
    if (/\b(?:sodium|potassium|magnesium|calcium|phosphate|albumin|glucose|ketones?|cortisol|tsh|acth|ldh|troponin|amylase|lipase)\b|free t4|uric acid/i.test(text)) return "other";
    return null;
  }

  function isBloodThreshold(definition) {
    return laboratoryDomain(definition) !== null;
  }

  function isCtcaeToxicity(definition) {
    if (!definition || isEcogDefinition(definition) || laboratoryDomain(definition) !== null) return false;
    if (root.SACTCheckCTCAE?.guide(definition)) return true;
    const text = definitionSearchText(definition);
    return Boolean(definition.ctcae_version || definition.ctcae_category || definition.assessment_guidance && /grade|activities of daily living|toxicit/i.test(definition.assessment_guidance) || /(?:toxicity|neuropathy|diarrhoea|diarrhea|mucositis|stomatitis|rash|hand[ -]?foot|pneumonitis|colitis|hepatitis|nephritis|arthralgia|myalgia|fatigue|nausea|vomiting).*grade|grade.*(?:toxicity|neuropathy|diarrhoea|diarrhea|mucositis|stomatitis|rash|hand[ -]?foot)/i.test(text));
  }

  function laboratorySort(a, b) {
    const priority = (bloodFieldPriority(a) ?? 999) - (bloodFieldPriority(b) ?? 999);
    if (priority) return priority;
    return String(a.label || a.id).localeCompare(String(b.label || b.id));
  }

  function applyPreferredIndication() {
    if (!activeProtocol || activeTumourGroup === "all") return;
    const preferred = root.SACTCheckProtocolContext?.preferredIndicationId?.(activeProtocol, activeTumourGroup);
    const select = document.getElementById("jsonInput_indication_id");
    if (preferred && select && [...select.options].some(option => option.value === preferred)) {
      select.value = preferred;
    }
  }

  function setLaboratoryDomain(domain, definitions) {
    const config = {
      haematology: ["jsonHaematologyDomain", "jsonHaematologyInputGrid", "jsonHaematologyCount"],
      renal: ["jsonRenalDomain", "jsonRenalInputGrid", "jsonRenalCount"],
      hepatic: ["jsonHepaticDomain", "jsonHepaticInputGrid", "jsonHepaticCount"],
      other: ["jsonOtherLaboratoryDomain", "jsonOtherLaboratoryInputGrid", "jsonOtherLaboratoryCount"],
      immunotherapy: ["jsonImmunotherapyBloodSection", "jsonImmunotherapyBloodGrid", "jsonImmunotherapyBloodCount"]
    }[domain];
    if (!config) return;
    const [sectionId, gridId, countId] = config;
    const visible = definitions.filter(definition => definition.visible !== false);
    document.getElementById(gridId).innerHTML = definitions.map(definition => renderInput(definition, { compact: false, blood: true, domain, domainLabel: LABORATORY_DOMAIN_LABELS[domain], immunotherapy: domain === "immunotherapy" })).join("");
    document.getElementById(sectionId).classList.toggle("hidden", visible.length === 0);
    document.getElementById(countId).textContent = `${visible.length} field${visible.length === 1 ? "" : "s"}`;
  }

  function renderInputs(rawInputs = {}) {
    if (!activeProtocol) return;
    const definitions = Engine.getInputDefinitions(activeProtocol, activeProfileId, rawInputs);
    const contextDefinitions = definitions.filter(isTreatmentContext);
    const clinicalDefinitions = definitions.filter(definition => !isTreatmentContext(definition));
    const laboratoryDefinitions = clinicalDefinitions.filter(definition => laboratoryDomain(definition) !== null);
    const toxicityDefinitions = clinicalDefinitions.filter(isCtcaeToxicity);
    const additionalDefinitions = clinicalDefinitions.filter(definition => laboratoryDomain(definition) === null && !isCtcaeToxicity(definition));

    const grouped = {
      haematology: laboratoryDefinitions.filter(definition => laboratoryDomain(definition) === "haematology").sort(laboratorySort),
      renal: laboratoryDefinitions.filter(definition => laboratoryDomain(definition) === "renal").sort(laboratorySort),
      hepatic: laboratoryDefinitions.filter(definition => laboratoryDomain(definition) === "hepatic").sort(laboratorySort),
      other: laboratoryDefinitions.filter(definition => laboratoryDomain(definition) === "other").sort(laboratorySort),
      immunotherapy: laboratoryDefinitions.filter(definition => laboratoryDomain(definition) === "immunotherapy").sort(laboratorySort)
    };

    Object.entries(grouped).forEach(([domain, items]) => setLaboratoryDomain(domain, items));
    document.getElementById("jsonToxicityInputGrid").innerHTML = toxicityDefinitions.map(definition => renderInput(definition, { compact: true, toxicity: true })).join("");
    document.getElementById("jsonInputGrid").innerHTML = additionalDefinitions.map(definition => renderInput(definition, { compact: true })).join("");
    document.getElementById("jsonTreatmentContextGrid").innerHTML = contextDefinitions.map(definition => renderInput(definition, { compact: true, context: true })).join("");
    applyPreferredIndication();

    const visibleLabs = laboratoryDefinitions.filter(definition => definition.visible !== false);
    const visibleToxicities = toxicityDefinitions.filter(definition => definition.visible !== false);
    const visibleAdditional = additionalDefinitions.filter(definition => definition.visible !== false);
    document.getElementById("jsonNoBloodInputs").classList.toggle("hidden", visibleLabs.length > 0);
    document.getElementById("jsonToxicitySection").classList.toggle("hidden", visibleToxicities.length === 0);
    document.getElementById("jsonOtherCriteriaSection").classList.toggle("hidden", visibleAdditional.length === 0);
    document.getElementById("jsonTreatmentContextSection").classList.toggle("hidden", contextDefinitions.filter(definition => definition.visible !== false).length === 0);
    document.getElementById("jsonLabProfilePanel").classList.toggle("hidden", !definitions.some(definition => LocalLab?.adapterFor(definition)));
    populateLabProfileControls();
    document.getElementById("jsonBloodInputCount").textContent = `${visibleLabs.length} relevant field${visibleLabs.length === 1 ? "" : "s"}`;
    document.getElementById("jsonToxicityCount").textContent = `${visibleToxicities.length} optional field${visibleToxicities.length === 1 ? "" : "s"}`;
    document.getElementById("jsonContextCount").textContent = `${contextDefinitions.filter(definition => definition.visible !== false).length} optional field${contextDefinitions.length === 1 ? "" : "s"}`;
    updateInputCount(additionalDefinitions);
    refreshCompactInputStates(definitions);
    root.SACTCheckImmunotherapySafety?.prepare?.(activeProtocol, definitions, collectRawInputs(true));
    root.SACTCheckScenarioInterpreter?.prepare?.(activeProtocol, definitions, { apply: applyScenarioValues });
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
        return `<div class="lab-value-pair"><label for="jsonLab_${escapeHtml(definition.id)}_${escapeHtml(analyte.id)}">${escapeHtml(analyte.label)}</label><div class="lab-inline-control"><input id="jsonLab_${escapeHtml(definition.id)}_${escapeHtml(analyte.id)}" data-lab-target="${escapeHtml(definition.id)}" data-lab-analyte="${escapeHtml(analyte.id)}" data-type="number" type="number" min="0" step="0.1" placeholder="Enter value"${disabledAttribute}><span class="lab-inline-unit">${escapeHtml(analyte.unit)}</span></div><span class="hint">ULN ${escapeHtml(upper)} ${escapeHtml(analyte.unit)}</span></div>`;
      }).join("")}<div class="lab-calculation-preview hidden" data-lab-preview="${escapeHtml(definition.id)}" aria-live="polite"></div></div>`;
    }
    if (definition.type === "boolean") {
      return `
        <select id="jsonInput_${escapeHtml(definition.id)}" data-field="${escapeHtml(definition.id)}" data-type="boolean"${disabledAttribute}>
          <option value="">Select…</option>
          <option value="false">No</option>
          <option value="true">Yes</option>
        </select>`;
    }
    if (definition.type === "select") {
      return `
        <select id="jsonInput_${escapeHtml(definition.id)}" data-field="${escapeHtml(definition.id)}" data-type="select"${disabledAttribute}>
          <option value="">Select…</option>
          ${(definition.options || []).map(option => `<option value="${escapeHtml(option.value)}">${escapeHtml(isEcogDefinition(definition) ? ecogOptionLabel(option) : (root.SACTCheckCTCAE?.optionLabel(definition, option) || option.label))}</option>`).join("")}
        </select>`;
    }
    if (definition.type === "text") {
      return `<input id="jsonInput_${escapeHtml(definition.id)}" data-field="${escapeHtml(definition.id)}" data-type="text" type="text" placeholder="Enter value"${disabledAttribute}>`;
    }
    const minimum = definition.min !== undefined ? ` min="${escapeHtml(definition.min)}"` : "";
    const maximum = definition.max !== undefined ? ` max="${escapeHtml(definition.max)}"` : "";
    return `<input id="jsonInput_${escapeHtml(definition.id)}" data-field="${escapeHtml(definition.id)}" data-type="number" type="number" placeholder="Enter value"${minimum}${maximum} step="${escapeHtml(definition.step ?? "any")}"${disabledAttribute}>`;
  }

  function renderGradeRows(grades) {
    return (grades || []).map(item => `
      <li><strong>Grade ${escapeHtml(item.grade)}</strong><span>${escapeHtml(item.description)}</span></li>`).join("");
  }

  function renderCtcaeGuide(definition, providedGuide, options = {}) {
    const guide = providedGuide || root.SACTCheckCTCAE?.guide(definition);
    if (!guide) return "";
    const openAttribute = options.defaultOpen ? " open" : "";
    const related = (guide.related || []).map(item => `
      <section class="ctcae-related-term">
        <h4>${escapeHtml(item.version)} · ${escapeHtml(item.term)}</h4>
        ${item.guidance ? `<p><strong>How to assess:</strong> ${escapeHtml(item.guidance)}</p>` : ""}
        <ol class="ctcae-grade-list">${renderGradeRows(item.grades)}</ol>
      </section>`).join("");
    const comparison = guide.comparison ? `
      <details class="ctcae-version-comparison">
        <summary>Show ${escapeHtml(guide.comparison.version)}</summary>
        <div class="ctcae-version-comparison-body">
          <p><strong>${escapeHtml(guide.comparison.term)}</strong></p>
          <ol class="ctcae-grade-list">${renderGradeRows(guide.comparison.grades)}</ol>
          <p class="subtle"><a href="${escapeHtml(guide.comparison.sourceUrl)}" target="_blank" rel="noopener noreferrer">Open the CTCAE v5.0 source</a>.</p>
        </div>
      </details>` : "";
    return `
      <details class="ctcae-guide" data-ctcae-guide="${escapeHtml(definition.id)}"${openAttribute}>
        <summary>${options.compactSummary ? "CTCAE guide" : `${escapeHtml(guide.version)} grading — ${escapeHtml(guide.term)}`}</summary>
        <div class="ctcae-guide-body">
          <p><strong>How to assess:</strong> ${escapeHtml(guide.guidance)}</p>
          ${guide.note ? `<p class="ctcae-version-note"><strong>Version note:</strong> ${escapeHtml(guide.note)}</p>` : ""}
          <ol class="ctcae-grade-list">${renderGradeRows(guide.grades)}</ol>
          ${related}
          ${comparison}
          <p class="subtle">Use the exact named CTCAE adverse-event term. <a href="${escapeHtml(guide.sourceUrl)}" target="_blank" rel="noopener noreferrer">Open the ${escapeHtml(guide.sourceLabel)} source</a>.</p>
        </div>
      </details>`;
  }

  function normaliseUnitText(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[⁰]/g, "0").replace(/[¹]/g, "1").replace(/[²]/g, "2").replace(/[³]/g, "3")
      .replace(/[⁴]/g, "4").replace(/[⁵]/g, "5").replace(/[⁶]/g, "6").replace(/[⁷]/g, "7")
      .replace(/[⁸]/g, "8").replace(/[⁹]/g, "9")
      .replace(/\^/g, "")
      .replace(/\s+/g, "")
      .replace(/[()]/g, "");
  }

  function displayUnit(definition, displayLabel, labAdapter) {
    if (labAdapter || !definition?.unit) return "";
    const labelToken = normaliseUnitText(displayLabel);
    const unitToken = normaliseUnitText(definition.unit);
    return unitToken && labelToken.includes(unitToken) ? "" : ` <span class="subtle">(${escapeHtml(definition.unit)})</span>`;
  }

  function renderInput(definition, options = {}) {
    const wrapperClass = definition.visible === false ? "hidden" : "";
    const labAdapter = LocalLab?.adapterFor(definition);
    const control = buildControl(definition);
    const displayLabel = labAdapter ? `${labAdapter.title} · automatic ×ULN` : definition.label;
    const unit = displayUnit(definition, displayLabel, labAdapter);
    const labelFor = labAdapter ? "" : ` for="jsonInput_${escapeHtml(definition.id)}"`;
    const hints = [];
    if (definition.help && !options.blood) hints.push(escapeHtml(definition.help));
    if (definition.id === "tsh_miu_l" && LocalLab) hints.push(escapeHtml(LocalLab.referenceText("tsh")));
    if (definition.id === "free_t4_pmol_l" && LocalLab) hints.push(escapeHtml(LocalLab.referenceText("free_t4")));
    if (isEcogDefinition(definition)) hints.push("Select the clinician-assessed ECOG functional status. This is not a CTCAE grade.");
    if (definition.assessment_guidance && !options.blood && !isEcogDefinition(definition) && !root.SACTCheckCTCAE?.guide(definition)) hints.push(escapeHtml(definition.assessment_guidance));
    if (!options.blood) hints.push("Blank fields remain unassessed.");
    const ctcaeDefinitionGuide = isEcogDefinition(definition) ? null : root.SACTCheckCTCAE?.guide(definition);
    const ctcaeGuide = renderCtcaeGuide(definition, ctcaeDefinitionGuide, { defaultOpen: Boolean(options.toxicity), compactSummary: Boolean(options.blood) });
    const ecogGuide = renderEcogGuide(definition);
    const ctcaeCalculated = ctcaeDefinitionGuide?.calculable
      ? `<div class="ctcae-calculated-grade hidden" data-ctcae-calculated="${escapeHtml(definition.id)}" aria-live="polite"></div>`
      : "";

    if (options.compact) {
      return `
        <details class="compact-assessment-input ${wrapperClass}" data-input-wrapper="${escapeHtml(definition.id)}">
          <summary><span>${escapeHtml(displayLabel)}${unit}</span><span class="compact-input-state hidden" data-input-state></span></summary>
          <div class="compact-input-body">
            ${labAdapter ? "" : `<label class="sr-only" for="jsonInput_${escapeHtml(definition.id)}">${escapeHtml(definition.label)}</label>`}
            ${control}
            <span class="hint" data-input-hint>${hints.join(" ")}</span>
            ${ctcaeCalculated}
            ${ctcaeGuide}
            ${ecogGuide}
          </div>
        </details>`;
    }

    return `
      <div class="blood-input-card laboratory-input-card ${wrapperClass}" data-input-wrapper="${escapeHtml(definition.id)}" data-laboratory-domain="${escapeHtml(options.domain || "")}">
        ${options.domainLabel ? `<span class="laboratory-domain-chip">${escapeHtml(options.domainLabel)}</span>` : ""}
        <label${labelFor}>${escapeHtml(displayLabel)}${unit}</label>
        ${control}
        ${hints.length ? `<span class="hint" data-input-hint>${hints.join(" ")}</span>` : `<span class="hint hidden" data-input-hint></span>`}
        ${ctcaeCalculated}
        ${ctcaeGuide}
        ${ecogGuide}
      </div>`;
  }

  function updateCtcaeCalculatedGrade(control, definition) {
    const inputWrapper = control?.closest("[data-input-wrapper]");
    const preview = inputWrapper?.querySelector(`[data-ctcae-calculated="${cssEscape(definition?.id || "")}"]`);
    if (!preview || !definition) return;
    const result = root.SACTCheckCTCAE?.gradeForValue(definition, control.value);
    if (!result) {
      preview.textContent = "";
      preview.classList.add("hidden");
      preview.classList.remove("assessed", "grade-3", "grade-4");
      return;
    }
    preview.textContent = `${result.label}. ${result.description}`;
    preview.classList.remove("hidden");
    preview.classList.add("assessed");
    preview.classList.toggle("grade-3", result.grade === 3);
    preview.classList.toggle("grade-4", result.grade === 4);
  }

  function updateCompactInputState(control, definition) {
    updateCtcaeCalculatedGrade(control, definition);
    const wrapper = control?.closest(".compact-assessment-input");
    const state = wrapper?.querySelector("[data-input-state]");
    if (!wrapper || !state) return;
    const target = control.dataset.labTarget;
    if (target && LocalLab) {
      const calculation = calculateLabTarget(target);
      state.textContent = calculation?.decisionDisplay || "";
      state.classList.toggle("hidden", !calculation);
      wrapper.classList.toggle("assessed", Boolean(calculation));
      return;
    }
    let label = "";
    if (control.value !== "") {
      if (control.tagName === "SELECT") label = control.options[control.selectedIndex]?.text || control.value;
      else label = `${control.value}${definition?.unit ? ` ${definition.unit}` : ""}`;
    }
    state.textContent = label;
    state.classList.toggle("hidden", !label);
    wrapper.classList.toggle("assessed", control.value !== "");
  }

  function refreshCompactInputStates(definitions) {
    const byId = new Map((definitions || Engine.getInputDefinitions(activeProtocol, activeProfileId, collectRawInputs(true))).map(definition => [definition.id, definition]));
    document.querySelectorAll(inputControlSelector("[data-field], [data-lab-target]")).forEach(control => {
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
        const isLab = laboratoryDomain(definition) !== null;
        if (definition.help && !isLab) parts.push(definition.help);
        if (definition.id === "tsh_miu_l" && LocalLab) parts.push(LocalLab.referenceText("tsh"));
        if (definition.id === "free_t4_pmol_l" && LocalLab) parts.push(LocalLab.referenceText("free_t4"));
        if (isEcogDefinition(definition)) parts.push("Select the clinician-assessed ECOG functional status. This is not a CTCAE grade.");
        if (definition.assessment_guidance && !isLab && !isEcogDefinition(definition) && !root.SACTCheckCTCAE?.guide(definition)) parts.push(definition.assessment_guidance);
        if (!isLab) parts.push("Blank fields remain unassessed.");
        hint.textContent = parts.join(" ");
        hint.classList.toggle("hidden", parts.length === 0);
      }
      controls.forEach(control => updateCompactInputState(control, definition));
    });

    const contextDefinitions = definitions.filter(isTreatmentContext);
    const clinicalDefinitions = definitions.filter(definition => !isTreatmentContext(definition));
    const laboratoryDefinitions = clinicalDefinitions.filter(definition => laboratoryDomain(definition) !== null);
    const toxicityDefinitions = clinicalDefinitions.filter(isCtcaeToxicity);
    const additionalDefinitions = clinicalDefinitions.filter(definition => laboratoryDomain(definition) === null && !isCtcaeToxicity(definition));
    const groupMap = {
      haematology: ["jsonHaematologyDomain", "jsonHaematologyCount"],
      renal: ["jsonRenalDomain", "jsonRenalCount"],
      hepatic: ["jsonHepaticDomain", "jsonHepaticCount"],
      other: ["jsonOtherLaboratoryDomain", "jsonOtherLaboratoryCount"],
      immunotherapy: ["jsonImmunotherapyBloodSection", "jsonImmunotherapyBloodCount"]
    };
    Object.entries(groupMap).forEach(([domain, ids]) => {
      const count = laboratoryDefinitions.filter(definition => laboratoryDomain(definition) === domain && definition.visible !== false).length;
      document.getElementById(ids[0])?.classList.toggle("hidden", count === 0);
      const label = document.getElementById(ids[1]);
      if (label) label.textContent = `${count} field${count === 1 ? "" : "s"}`;
    });
    const visibleLabs = laboratoryDefinitions.filter(definition => definition.visible !== false).length;
    const visibleToxicities = toxicityDefinitions.filter(definition => definition.visible !== false).length;
    const visibleAdditional = additionalDefinitions.filter(definition => definition.visible !== false).length;
    document.getElementById("jsonNoBloodInputs")?.classList.toggle("hidden", visibleLabs > 0);
    document.getElementById("jsonBloodInputCount").textContent = `${visibleLabs} relevant field${visibleLabs === 1 ? "" : "s"}`;
    document.getElementById("jsonToxicitySection")?.classList.toggle("hidden", visibleToxicities === 0);
    document.getElementById("jsonToxicityCount").textContent = `${visibleToxicities} optional field${visibleToxicities === 1 ? "" : "s"}`;
    document.getElementById("jsonOtherCriteriaSection")?.classList.toggle("hidden", visibleAdditional === 0);
    document.getElementById("jsonTreatmentContextSection")?.classList.toggle("hidden", contextDefinitions.filter(definition => definition.visible !== false).length === 0);
    updateInputCount(additionalDefinitions);
    refreshLabPreviews();
    root.SACTCheckImmunotherapySafety?.updateInputs?.(activeProtocol, definitions, rawInputs);
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
      document.querySelectorAll(inputControlSelector("[data-field]")).forEach(element => {
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

  function applyScenarioValues(items = [], options = {}) {
    if (!activeProtocol || !Array.isArray(items) || !items.length) return;
    items.forEach(item => {
      const selector = item.labAnalyte
        ? `[data-lab-target="${cssEscape(item.fieldId)}"][data-lab-analyte="${cssEscape(item.labAnalyte)}"]`
        : `[data-field="${cssEscape(item.fieldId)}"]`;
      const control = document.querySelector(selector);
      if (!control || control.disabled) return;
      control.value = String(item.value ?? "");
      control.dispatchEvent(new Event("input", { bubbles: true }));
      control.dispatchEvent(new Event("change", { bubbles: true }));
    });
    updateConditionalInputs();
    refreshCompactInputStates();
    hideResult();
    if (options.assess) {
      window.setTimeout(() => runAssessment(), 0);
    } else if (typeof root.showToast === "function") {
      root.showToast("Confirmed scenario values applied");
    }
  }

  function collectRawInputs(includeDisabled = false) {
    const inputs = {};
    latestLabCalculations = {};
    document.querySelectorAll(inputControlSelector("[data-field]")).forEach(element => {
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
      preview.textContent = calculation?.display || "";
      preview.classList.toggle("hidden", !calculation);
      preview.classList.toggle("assessed", Boolean(calculation));
    });
  }

  function resultPresentation(result) {
    const action = String(result?.actionType || "");
    if (result?.invalid?.length || result?.errors?.length || action === "incomplete") {
      return { title: "Assessment incomplete", detail: result.recommendation };
    }
    if (["dose_reduce", "dose_reduce_one_level", "dose_reduce_two_levels", "delay_then_dose_reduce", "withhold_then_reduce"].includes(action)) {
      return { title: "Dose modification indicated", detail: "One or more values entered meet the protocol criteria for dose modification." };
    }
    if (["consultant_review", "partial_context_required"].includes(action)) {
      return { title: "Clinical review required", detail: result.recommendation };
    }
    if (["proceed", "proceed_with_caution"].includes(action)) {
      return { title: action === "proceed" ? "Treatment criteria met" : "No treatment criteria breached", detail: action === "proceed" ? "No value entered falls outside the protocol treatment criteria." : "No value entered falls outside the protocol criteria. Unassessed fields remain unknown." };
    }
    return { title: "Treatment criteria not met", detail: "One or more values entered fall outside the protocol treatment criteria." };
  }

  function renderPriorityFindings(result) {
    const target = document.getElementById("jsonPriorityFindings");
    const count = document.getElementById("jsonPriorityCount");
    if (!target) return;
    const restrictive = (result.findings || []).filter(finding => !finding.domainAssessment && !["proceed", "proceed_with_caution"].includes(String(finding.actionType || "")));
    const selected = restrictive.length ? restrictive.slice(0, 3) : (result.findings || []).filter(finding => finding.domainAssessment || finding.actionType === "proceed").slice(0, 3);
    if (count) count.textContent = `${selected.length} key finding${selected.length === 1 ? "" : "s"}`;
    if (!selected.length) {
      target.innerHTML = '<p class="subtle">Enter a clinical value to generate a protocol comparison.</p>';
      return;
    }
    target.innerHTML = selected.map(finding => {
      const label = finding.domainAssessment || finding.actionType === "proceed" ? "Criterion assessed" : "Clinical review pathway";
      return `<div class="priority-finding ${findingClass(finding.actionType)}"><div class="priority-finding-head"><strong>${escapeHtml(finding.displayTitle || finding.ruleId)}</strong><span>${escapeHtml(label)}</span></div>${renderThresholdComparison(finding, result)}<p>${escapeHtml(finding.explanation || "")}</p><small>${escapeHtml(finding.sourceText || "")}</small></div>`;
    }).join("");
  }

  function runAssessment() {
    if (!activeProtocol) return;
    latestAssessmentId = document.getElementById("jsonAssessmentId").value.trim();
    const rawInputs = collectRawInputs();
    latestResult = Engine.assess(activeProtocol, rawInputs, { profileId: activeProfileId });
    root.SACTCheckProtocolDoseSchedule?.updateAssessment?.(latestResult);
    root.SACTCheckImmunotherapySafety?.updateAssessment?.(latestResult, rawInputs);
    renderResult(latestResult);
  }

  function renderResult(result) {
    const container = document.getElementById("jsonResult");
    container.classList.remove("hidden");

    const statusBox = document.getElementById("jsonStatusBox");
    statusBox.className = `status ${result.statusClass}`;
    const presentation = resultPresentation(result);
    result.displayStatus = presentation.title;
    result.displayRecommendation = presentation.detail;
    document.getElementById("jsonStatusTitle").textContent = presentation.title;
    document.getElementById("jsonStatusAction").textContent = presentation.detail;
    document.getElementById("jsonProfileMetric").textContent = result.context.indicationLabel || result.profile.label;
    document.getElementById("jsonApplicableMetric").textContent = String(result.applicableRuleCount);
    document.getElementById("jsonEvaluatedMetric").textContent = String(result.assessedRuleCount);
    document.getElementById("jsonCompleteMetric").textContent = !result.complete
      ? "Incomplete"
      : result.coverageComplete === false
        ? `Core complete · ${result.unassessed?.length || 0} optional gap${(result.unassessed?.length || 0) === 1 ? "" : "s"}`
        : "Complete";
    const unassessedCount = result.unassessed?.length || 0;
    document.getElementById("jsonCoverageMetric").textContent = `${result.assessedRuleCount} of ${result.applicableRuleCount} applicable rules assessed · ${unassessedCount} domain${unassessedCount === 1 ? "" : "s"} unassessed`;

    renderErrors(result);
    renderPriorityFindings(result);
    renderFindings(result);
    let summary = Engine.documentationSummary(result, latestAssessmentId);
    const labLines = Object.values(latestLabCalculations).map(calculation => `- ${calculation.display} → decision value ${calculation.decisionDisplay}`);
    if (labLines.length) summary += `\n\nAutomatic local-laboratory calculations (${LocalLab?.read().profileName || "local profile"}):\n${labLines.join("\n")}`;
    document.getElementById("jsonSummary").value = summary;
    renderOnePageSummary();
    container.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function currentOutputModel() {
    if (!latestResult || !activeProtocol) return null;
    return AssessmentOutput.buildModel({
      result: latestResult,
      protocol: activeProtocol,
      assessmentId: latestAssessmentId,
      tumourGroup: activeTumourGroup,
      labCalculations: latestLabCalculations,
      clinicianDecision: document.getElementById("jsonClinicianDecision")?.value || "",
      clinicianNote: document.getElementById("jsonClinicianNote")?.value || "",
      appVersion: "0.56.0"
    });
  }

  function renderOnePageSummary() {
    const target = document.getElementById("jsonPrintSummary");
    const model = currentOutputModel();
    if (!target || !model) return;
    target.innerHTML = AssessmentOutput.renderHtml(model);
    const estimate = AssessmentPdf.estimatePageCount(model);
    const estimateTarget = document.getElementById("jsonPdfPageEstimate");
    if (estimateTarget) estimateTarget.textContent = `${estimate} page${estimate === 1 ? "" : "s"} estimated`;
  }

  function resetOutputDocumentation() {
    const decision = document.getElementById("jsonClinicianDecision");
    const note = document.getElementById("jsonClinicianNote");
    if (decision) decision.value = "";
    if (note) note.value = "";
    const preview = document.getElementById("jsonPrintSummary");
    if (preview) preview.innerHTML = "";
  }

  async function copyOnePageSummary() {
    const model = currentOutputModel();
    if (!model) return;
    const text = AssessmentOutput.toText(model);
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    if (typeof root.showToast === "function") root.showToast("Concise summary copied");
  }

  function generatePdfSummary() {
    const model = currentOutputModel();
    if (!model) return;
    try {
      const generated = AssessmentPdf.download(model, latestAssessmentId || activeProtocol?.protocol_id || "assessment");
      if (typeof root.showToast === "function") {
        root.showToast(`PDF generated (${generated.pageCount} page${generated.pageCount === 1 ? "" : "s"})`);
      }
    } catch (error) {
      console.error("Could not generate the SACTCheck PDF", error);
      if (typeof root.showToast === "function") root.showToast("PDF generation failed");
      else root.alert?.("The PDF could not be generated. Please retry after refreshing SACTCheck.");
    }
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
      const labels = unassessed.map(item => item.label);
      const preview = labels.slice(0, 6).join(", ");
      const more = labels.length > 6 ? ` + ${labels.length - 6} more` : "";
      blocks.push(`<div class="coverage-gap-strip"><strong>Partial assessment:</strong> ${escapeHtml(preview)}${escapeHtml(more)} not assessed and not assumed normal.${labels.length > 6 ? `<details><summary>View all unassessed domains</summary><div class="coverage-gap-list">${unassessed.map(item => `<span>${escapeHtml(item.label)}</span>`).join("")}</div></details>` : ""}</div>`);
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
    root.SACTCheckProtocolDoseSchedule?.updateAssessment?.(null);
    root.SACTCheckImmunotherapySafety?.updateAssessment?.(null, collectRawInputs(true));
    resetOutputDocumentation();
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

  root.SACTCheckAssessmentFieldClassification = Object.freeze({
    version: "0.56.0",
    laboratoryDomain,
    isEcogDefinition,
    isExplicitNonLaboratoryCriterion,
    ecogOptionLabel,
    ecogLevels: ECOG_LEVELS
  });

  root.SACTCheckGenericAssessment = Object.freeze({
    version: "0.48.0",
    open,
    ensureScreen
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureScreen);
  } else {
    ensureScreen();
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
