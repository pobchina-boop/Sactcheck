/**
 * SACTCheck primary clinical validation workspace.
 * Local reviewer records are deliberately separated from published protocol JSON.
 */
(function (root) {
  "use strict";

  const RELEASE = "0.66.0";
  const REGISTER_URL = "data/clinical-validation-register-v0630.json";
  const STORAGE_KEY = "sactcheck_primary_clinical_validation_v1";

  const DOMAIN_DEFINITIONS = Object.freeze([
    { id: "source", label: "Source identity and version", prompt: "Confirm the NCCP code, title, current version, official source and source scope." },
    { id: "indication", label: "Indication and treatment context", prompt: "Confirm the tissue context, treatment line, intent and indication wording relevant to this review." },
    { id: "regimen", label: "Regimen components, dose and schedule", prompt: "Confirm drugs, routes, doses, cycle length, treatment days and continuation or maintenance phases." },
    { id: "eligibility", label: "Eligibility and exclusions", prompt: "Confirm baseline requirements, contraindications and protocol exclusions." },
    { id: "haematology", label: "Haematology and recovery rules", prompt: "Confirm blood thresholds, delay criteria, recovery requirements and subsequent dose actions." },
    { id: "renal", label: "Renal assessment", prompt: "Confirm CrCl or eGFR method, renal bands, dialysis guidance and component specific actions." },
    { id: "hepatic", label: "Hepatic assessment", prompt: "Confirm bilirubin, AST, ALT, hepatic impairment categories and component specific actions." },
    { id: "other_safety", label: "Other safety and toxicity rules", prompt: "Confirm treatment specific toxicity pathways such as neuropathy, diarrhoea, mucositis, immune toxicity, blood pressure, proteinuria or cardiac criteria." },
    { id: "monitoring", label: "Monitoring and supportive care", prompt: "Confirm required investigations, premedication, hydration, prophylaxis and supportive care instructions." },
    { id: "administration", label: "Administration and sequencing", prompt: "Confirm route, infusion duration, treatment sequence, observation and administration instructions." },
    { id: "engine", label: "SACTCheck input and rule behaviour", prompt: "Confirm that source criteria are represented, single value partial assessment works and omitted domains remain unassessed." },
    { id: "output", label: "Output clarity and traceability", prompt: "Confirm that the result states the entered value, encoded criterion, action and source context clearly." },
    { id: "knowledge", label: "Knowledge base and evidence", prompt: "If a knowledge profile exists, confirm treatment context, evidence relationships, important limitations and source links. Otherwise mark not applicable." }
  ]);

  const DOMAIN_STATUS = Object.freeze([
    { value: "pending", label: "Not reviewed" },
    { value: "confirmed", label: "Confirmed against source" },
    { value: "not_applicable", label: "Not applicable to this regimen" },
    { value: "correction_required", label: "Correction required" },
    { value: "pharmacy_review", label: "Oncology pharmacy review required" },
    { value: "consultant_review", label: "Consultant review required" }
  ]);

  const OVERALL_LABELS = Object.freeze({
    not_started: "Not started",
    in_review: "In review",
    correction_required: "Correction required",
    pharmacy_review_required: "Oncology pharmacy review required",
    consultant_review_required: "Consultant review required",
    primary_review_complete: "Primary clinical review complete"
  });

  let register = null;
  let log = null;
  let activeTissue = "all";
  let activeStatus = "all";
  let activeSearch = "";
  let activeKey = null;

  function $(id) { return document.getElementById(id); }
  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
  function today() { return new Date().toISOString().slice(0, 10); }
  function timestamp() { return new Date().toISOString(); }
  function asArray(value) { return Array.isArray(value) ? value : value == null ? [] : [value]; }
  function contextKey(protocolId, tissue) { return `${protocolId}::${tissue}`; }
  function safeFilePart(value) { return String(value || "validation").replace(/[^A-Za-z0-9._]+/g, "_").replace(/^_+|_+$/g, ""); }

  function createEmptyLog() {
    return {
      schema_version: "1.0",
      sactcheck_version: RELEASE,
      created_at: timestamp(),
      updated_at: timestamp(),
      reviewer: { name: "", role: "Clinical product owner" },
      records: {}
    };
  }

  function loadStoredLog() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (parsed && parsed.schema_version === "1.0" && parsed.records && typeof parsed.records === "object") return parsed;
    } catch (_) {}
    return createEmptyLog();
  }

  function saveLog() {
    if (!log) return;
    log.updated_at = timestamp();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
    renderSummary();
    renderTissues();
    renderQueue();
  }

  function getProtocol(protocolId) {
    return register?.protocols?.find(item => item.protocol_id === protocolId) || null;
  }

  function getRecord(protocol, tissue, create = false) {
    const key = contextKey(protocol.protocol_id, tissue);
    let record = log.records[key];
    if (!record && create) {
      record = {
        key,
        protocol_id: protocol.protocol_id,
        tissue,
        nccp_code: protocol.nccp_code,
        title: protocol.title,
        source_version_reviewed: protocol.nccp_version,
        source_url_reviewed: protocol.source_url,
        started_date: today(),
        reviewed_date: "",
        reviewer_name: log.reviewer?.name || "",
        reviewer_role: log.reviewer?.role || "Clinical product owner",
        overall_note: "",
        domain_reviews: {},
        issues: [],
        updated_at: timestamp()
      };
      for (const domain of DOMAIN_DEFINITIONS) {
        record.domain_reviews[domain.id] = { status: "pending", note: "", reviewed_date: "" };
      }
      if (!protocol.knowledge_base_profile) {
        record.domain_reviews.knowledge = { status: "not_applicable", note: "No detailed knowledge base profile is currently mapped to this protocol.", reviewed_date: today() };
      }
      log.records[key] = record;
    }
    return record || null;
  }

  function domainStatus(record, domainId) {
    return record?.domain_reviews?.[domainId]?.status || "pending";
  }

  function openIssues(record) {
    return asArray(record?.issues).filter(issue => issue.status !== "resolved");
  }

  function deriveOverall(record) {
    if (!record) return "not_started";
    const statuses = DOMAIN_DEFINITIONS.map(domain => domainStatus(record, domain.id));
    if (openIssues(record).some(issue => issue.severity === "high" || issue.severity === "critical")) return "correction_required";
    if (statuses.includes("correction_required") || openIssues(record).length) return "correction_required";
    if (statuses.includes("consultant_review")) return "consultant_review_required";
    if (statuses.includes("pharmacy_review")) return "pharmacy_review_required";
    if (statuses.every(status => status === "confirmed" || status === "not_applicable")) return "primary_review_complete";
    if (statuses.some(status => status !== "pending")) return "in_review";
    return "not_started";
  }

  function progressForRecord(record) {
    if (!record) return 0;
    const resolved = DOMAIN_DEFINITIONS.filter(domain => ["confirmed", "not_applicable"].includes(domainStatus(record, domain.id))).length;
    return Math.round((resolved / DOMAIN_DEFINITIONS.length) * 100);
  }

  function allContexts() {
    if (!register) return [];
    const contexts = [];
    for (const protocol of register.protocols) {
      for (const tissue of protocol.tumour_groups) contexts.push({ protocol, tissue, key: contextKey(protocol.protocol_id, tissue) });
    }
    return contexts;
  }

  function contextMatches(context) {
    const record = getRecord(context.protocol, context.tissue, false);
    const overall = deriveOverall(record);
    if (activeTissue !== "all" && context.tissue !== activeTissue) return false;
    if (activeStatus !== "all" && overall !== activeStatus) return false;
    if (activeSearch) {
      const haystack = `${context.protocol.nccp_code} ${context.protocol.title} ${context.protocol.indication} ${context.tissue}`.toLowerCase();
      if (!haystack.includes(activeSearch.toLowerCase())) return false;
    }
    return true;
  }

  function statusClass(status) {
    return {
      not_started: "neutral",
      in_review: "review",
      correction_required: "danger",
      pharmacy_review_required: "pharmacy",
      consultant_review_required: "consultant",
      primary_review_complete: "complete"
    }[status] || "neutral";
  }

  function renderSummary() {
    const container = $("clinicalValidationSummary");
    if (!container || !register || !log) return;
    const contexts = allContexts();
    const counts = { complete: 0, review: 0, correction: 0, pharmacy: 0, consultant: 0, notStarted: 0 };
    for (const context of contexts) {
      const status = deriveOverall(getRecord(context.protocol, context.tissue, false));
      if (status === "primary_review_complete") counts.complete += 1;
      else if (status === "correction_required") counts.correction += 1;
      else if (status === "pharmacy_review_required") counts.pharmacy += 1;
      else if (status === "consultant_review_required") counts.consultant += 1;
      else if (status === "in_review") counts.review += 1;
      else counts.notStarted += 1;
    }
    const percent = contexts.length ? Math.round((counts.complete / contexts.length) * 100) : 0;
    container.innerHTML = `
      <article class="validation-summary-card"><span>Protocol records</span><strong>${register.protocol_count}</strong><small>${register.tissue_context_count} tissue review contexts</small></article>
      <article class="validation-summary-card complete"><span>Primary review complete</span><strong>${counts.complete}</strong><small>${percent}% of tissue contexts</small></article>
      <article class="validation-summary-card review"><span>In review</span><strong>${counts.review}</strong><small>Partially reviewed</small></article>
      <article class="validation-summary-card danger"><span>Corrections required</span><strong>${counts.correction}</strong><small>Open review issues</small></article>
      <article class="validation-summary-card pharmacy"><span>Pharmacy review</span><strong>${counts.pharmacy}</strong><small>Specialist review required</small></article>
      <article class="validation-summary-card consultant"><span>Consultant review</span><strong>${counts.consultant}</strong><small>Escalation required</small></article>`;
  }

  function tissueStats(tissue) {
    const contexts = allContexts().filter(context => context.tissue === tissue);
    let complete = 0, issues = 0, specialist = 0, inReview = 0;
    for (const context of contexts) {
      const status = deriveOverall(getRecord(context.protocol, tissue, false));
      if (status === "primary_review_complete") complete += 1;
      if (status === "correction_required") issues += 1;
      if (["pharmacy_review_required", "consultant_review_required"].includes(status)) specialist += 1;
      if (status === "in_review") inReview += 1;
    }
    return { total: contexts.length, complete, issues, specialist, inReview, percent: contexts.length ? Math.round(complete / contexts.length * 100) : 0 };
  }

  function renderTissues() {
    const container = $("clinicalValidationTissues");
    if (!container || !register) return;
    const tissues = Object.keys(register.tissue_counts).sort((a, b) => a.localeCompare(b));
    container.innerHTML = tissues.map(tissue => {
      const stats = tissueStats(tissue);
      const selected = activeTissue === tissue ? " selected" : "";
      return `<button type="button" class="validation-tissue-card${selected}" data-validation-tissue="${escapeHtml(tissue)}">
        <div class="validation-tissue-heading"><strong>${escapeHtml(tissue)}</strong><span>${stats.complete} of ${stats.total}</span></div>
        <div class="validation-progress" aria-label="${stats.percent}% complete"><span style="width:${stats.percent}%"></span></div>
        <small>${stats.percent}% primary review complete${stats.issues ? ` · ${stats.issues} correction${stats.issues === 1 ? "" : "s"}` : ""}${stats.specialist ? ` · ${stats.specialist} specialist review` : ""}</small>
      </button>`;
    }).join("");
    container.querySelectorAll("[data-validation-tissue]").forEach(button => button.addEventListener("click", () => {
      activeTissue = button.dataset.validationTissue;
      $("clinicalValidationTissueFilter").value = activeTissue;
      renderTissues();
      renderQueue();
      $("clinicalValidationQueue")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }));
  }

  function renderQueue() {
    const container = $("clinicalValidationQueue");
    const count = $("clinicalValidationQueueCount");
    if (!container || !register) return;
    const contexts = allContexts().filter(contextMatches);
    if (count) count.textContent = `${contexts.length} review context${contexts.length === 1 ? "" : "s"}`;
    if (!contexts.length) {
      container.innerHTML = `<div class="validation-empty"><strong>No matching review contexts</strong><span>Adjust the tissue, status or search filters.</span></div>`;
      return;
    }
    container.innerHTML = contexts.map(context => {
      const record = getRecord(context.protocol, context.tissue, false);
      const status = deriveOverall(record);
      const progress = progressForRecord(record);
      const issueCount = openIssues(record).length;
      const hints = Object.entries(context.protocol.domain_hints || {}).filter(([, value]) => value).map(([key]) => key.replaceAll("_", " ")).slice(0, 5);
      return `<article class="validation-queue-card ${statusClass(status)}" data-validation-key="${escapeHtml(context.key)}">
        <div class="validation-queue-main">
          <div class="validation-queue-title"><span class="validation-code">NCCP ${escapeHtml(context.protocol.nccp_code || "Source code pending")}${context.protocol.nccp_version ? ` · Version ${escapeHtml(context.protocol.nccp_version)}` : ""}</span><h3>${escapeHtml(context.protocol.title)}</h3><p>${escapeHtml(context.tissue)}${context.protocol.indication ? ` · ${escapeHtml(context.protocol.indication)}` : ""}</p></div>
          <div class="validation-queue-status"><span class="validation-status ${statusClass(status)}">${escapeHtml(OVERALL_LABELS[status])}</span><strong>${progress}%</strong><small>${issueCount ? `${issueCount} open issue${issueCount === 1 ? "" : "s"}` : `${context.protocol.rule_count} encoded rules`}</small></div>
        </div>
        <div class="validation-progress"><span style="width:${progress}%"></span></div>
        <div class="validation-hints">${hints.map(hint => `<span>${escapeHtml(hint)}</span>`).join("")}${context.protocol.knowledge_base_profile ? "<span>knowledge profile</span>" : ""}</div>
        <div class="validation-queue-actions"><button class="btn" type="button" data-open-validation-record="${escapeHtml(context.key)}">Review this context</button>${context.protocol.source_url ? `<a class="btn secondary" href="${escapeHtml(context.protocol.source_url)}" target="_blank" rel="noopener noreferrer">Open NCCP source</a>` : ""}</div>
      </article>`;
    }).join("");
    container.querySelectorAll("[data-open-validation-record]").forEach(button => button.addEventListener("click", () => openRecord(button.dataset.openValidationRecord)));
  }

  function domainStatusOptions(current) {
    return DOMAIN_STATUS.map(option => `<option value="${option.value}"${option.value === current ? " selected" : ""}>${escapeHtml(option.label)}</option>`).join("");
  }

  function suggestedApplicability(protocol, domainId) {
    if (domainId === "knowledge") return protocol.knowledge_base_profile ? "A detailed knowledge profile is mapped." : "No detailed knowledge profile is mapped. Not applicable is appropriate unless a new profile is being reviewed.";
    const map = {
      haematology: "haematology",
      renal: "renal",
      hepatic: "hepatic",
      other_safety: "toxicity",
      monitoring: "supportive_care",
      administration: "administration"
    };
    const hintKey = map[domainId];
    if (!hintKey) return "Review against the complete current NCCP source.";
    return protocol.domain_hints?.[hintKey]
      ? "The current encoding contains content in this domain. Confirm it against the source."
      : "No strong encoded signal was detected for this domain. Confirm whether the NCCP source has no prescriptive requirement before marking not applicable.";
  }

  function openRecord(key) {
    const [protocolId, ...tissueParts] = String(key).split("::");
    const tissue = tissueParts.join("::");
    const protocol = getProtocol(protocolId);
    if (!protocol || !tissue) return;
    const record = getRecord(protocol, tissue, true);
    activeKey = key;
    saveLog();
    renderRecord(protocol, tissue, record);
    $("clinicalValidationReviewPanel").classList.remove("hidden");
    $("clinicalValidationReviewPanel").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderRecord(protocol, tissue, record) {
    const panel = $("clinicalValidationReviewPanel");
    if (!panel) return;
    const overall = deriveOverall(record);
    const progress = progressForRecord(record);
    const issues = asArray(record.issues);
    panel.innerHTML = `
      <div class="validation-review-header">
        <div><span class="study-kicker">Primary clinical review</span><h2>${escapeHtml(protocol.title)}</h2><p><strong>NCCP ${escapeHtml(protocol.nccp_code || "Source code pending")}${protocol.nccp_version ? ` · Version ${escapeHtml(protocol.nccp_version)}` : ""}</strong> · ${escapeHtml(tissue)}</p></div>
        <div class="validation-review-summary"><span class="validation-status ${statusClass(overall)}">${escapeHtml(OVERALL_LABELS[overall])}</span><strong>${progress}%</strong><small>${DOMAIN_DEFINITIONS.length} review domains</small></div>
      </div>
      <div class="validation-review-source">
        <div><span>Indication</span><strong>${escapeHtml(protocol.indication || "Confirm in the current NCCP source")}</strong></div>
        <div><span>Encoded content</span><strong>${protocol.input_count} inputs · ${protocol.rule_count} rules${protocol.knowledge_base_profile ? " · knowledge profile mapped" : ""}</strong></div>
        <div><span>Primary reviewer</span><strong>${escapeHtml(record.reviewer_name || log.reviewer?.name || "Not recorded")}</strong></div>
        <div><span>Source reviewed</span><strong>${escapeHtml(record.source_version_reviewed ? `Version ${record.source_version_reviewed}` : "Not recorded")}</strong></div>
      </div>
      <div class="validation-review-actions">
        ${protocol.source_url ? `<a class="btn" href="${escapeHtml(protocol.source_url)}" target="_blank" rel="noopener noreferrer">Open current NCCP source</a>` : `<span class="validation-source-warning">Official NCCP source link required before review can be completed.</span>`}
        <button class="btn secondary" type="button" id="validationOpenAssessment">Open SACTCheck assessment</button>
        <button class="btn secondary" type="button" id="validationCopySummary">Copy review summary</button>
        <button class="btn ghost" type="button" id="validationCloseRecord">Close review</button>
      </div>
      <div class="validation-boundary"><strong>Review standard:</strong> compare the complete current NCCP source with the encoded SACTCheck inputs, rules and outputs. Focused interface content is not a substitute for reviewing the source PDF.</div>
      <div class="validation-domain-list">
        ${DOMAIN_DEFINITIONS.map((domain, index) => {
          const review = record.domain_reviews?.[domain.id] || { status: "pending", note: "" };
          return `<article class="validation-domain" data-domain="${domain.id}">
            <div class="validation-domain-number">${index + 1}</div>
            <div class="validation-domain-body"><h3>${escapeHtml(domain.label)}</h3><p>${escapeHtml(domain.prompt)}</p><small>${escapeHtml(suggestedApplicability(protocol, domain.id))}</small>
              <label>Status<select data-domain-status="${domain.id}">${domainStatusOptions(review.status)}</select></label>
              <label>Review note<textarea rows="2" maxlength="700" data-domain-note="${domain.id}" placeholder="Record the source comparison, exact threshold or reason for not applicable. Do not enter patient information.">${escapeHtml(review.note || "")}</textarea></label>
            </div>
          </article>`;
        }).join("")}
      </div>
      <section class="validation-issues-panel">
        <div class="section-heading"><div><h2>Issues and corrections</h2><p class="subtle">Log every discrepancy separately so it can be implemented, tested and closed.</p></div><button class="btn secondary" type="button" id="validationAddIssue">Add issue</button></div>
        <div id="validationIssueList">${renderIssues(issues)}</div>
      </section>
      <section class="validation-overall-note">
        <label for="validationOverallNote">Overall review note<textarea id="validationOverallNote" rows="3" maxlength="1200" placeholder="Summarise the protocol review, unresolved questions and next action. Do not enter patient information.">${escapeHtml(record.overall_note || "")}</textarea></label>
        <div class="validation-completion-note"><strong>Completion rule:</strong> primary review is complete only when every domain is confirmed or explicitly not applicable and there are no open issues or specialist review requests.</div>
      </section>`;

    panel.querySelectorAll("[data-domain-status]").forEach(select => select.addEventListener("change", () => {
      const domainId = select.dataset.domainStatus;
      record.domain_reviews[domainId] = record.domain_reviews[domainId] || {};
      record.domain_reviews[domainId].status = select.value;
      record.domain_reviews[domainId].reviewed_date = select.value === "pending" ? "" : today();
      record.updated_at = timestamp();
      updateRecordCompletion(record);
      saveLog();
      renderRecord(protocol, tissue, record);
    }));
    panel.querySelectorAll("[data-domain-note]").forEach(textarea => textarea.addEventListener("change", () => {
      const domainId = textarea.dataset.domainNote;
      record.domain_reviews[domainId] = record.domain_reviews[domainId] || { status: "pending" };
      record.domain_reviews[domainId].note = textarea.value.trim();
      record.updated_at = timestamp();
      saveLog();
    }));
    $("validationOverallNote")?.addEventListener("change", event => {
      record.overall_note = event.target.value.trim();
      record.updated_at = timestamp();
      saveLog();
    });
    $("validationCloseRecord")?.addEventListener("click", () => {
      activeKey = null;
      panel.classList.add("hidden");
      panel.innerHTML = "";
    });
    $("validationAddIssue")?.addEventListener("click", () => addIssue(protocol, tissue, record));
    panel.querySelectorAll("[data-resolve-issue]").forEach(button => button.addEventListener("click", () => {
      const issue = record.issues.find(item => item.id === button.dataset.resolveIssue);
      if (issue) {
        issue.status = "resolved";
        issue.resolved_date = today();
        issue.resolution_note = window.prompt("Resolution note", issue.resolution_note || "") || issue.resolution_note || "";
        updateRecordCompletion(record);
        saveLog();
        renderRecord(protocol, tissue, record);
      }
    }));
    $("validationCopySummary")?.addEventListener("click", () => copyRecordSummary(protocol, tissue, record));
    $("validationOpenAssessment")?.addEventListener("click", () => openAssessment(protocol, tissue));
  }

  function renderIssues(issues) {
    if (!issues.length) return `<div class="validation-empty compact"><strong>No issues logged</strong><span>Add a discrepancy when the SACTCheck encoding does not match the reviewed source.</span></div>`;
    return issues.map(issue => `<article class="validation-issue ${escapeHtml(issue.severity)} ${issue.status === "resolved" ? "resolved" : ""}">
      <div><span>${escapeHtml(issue.severity.toUpperCase())} · ${escapeHtml(issue.domain.replaceAll("_", " "))}</span><h3>${escapeHtml(issue.title)}</h3><p>${escapeHtml(issue.note || "")}</p><small>${issue.status === "resolved" ? `Resolved ${escapeHtml(issue.resolved_date || "")}${issue.resolution_note ? ` · ${escapeHtml(issue.resolution_note)}` : ""}` : `Open · logged ${escapeHtml(issue.created_date || "")}`}</small></div>
      ${issue.status === "resolved" ? "" : `<button class="btn secondary" type="button" data-resolve-issue="${escapeHtml(issue.id)}">Resolve issue</button>`}
    </article>`).join("");
  }

  function addIssue(protocol, tissue, record) {
    const title = window.prompt("Short issue title");
    if (!title) return;
    const domain = window.prompt(`Domain: ${DOMAIN_DEFINITIONS.map(item => item.id).join(", ")}`, "engine") || "engine";
    const severity = (window.prompt("Severity: low, medium, high or critical", "medium") || "medium").toLowerCase();
    const note = window.prompt("Describe the source discrepancy and required action. Do not enter patient information.", "") || "";
    record.issues.push({
      id: `issue_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      domain: DOMAIN_DEFINITIONS.some(item => item.id === domain) ? domain : "engine",
      severity: ["low", "medium", "high", "critical"].includes(severity) ? severity : "medium",
      status: "open",
      title: title.trim(),
      note: note.trim(),
      created_date: today(),
      resolved_date: "",
      resolution_note: ""
    });
    if (record.domain_reviews[domain]) record.domain_reviews[domain].status = "correction_required";
    updateRecordCompletion(record);
    saveLog();
    renderRecord(protocol, tissue, record);
  }

  function updateRecordCompletion(record) {
    const overall = deriveOverall(record);
    record.review_status = overall;
    record.reviewer_name = log.reviewer?.name || record.reviewer_name || "";
    record.reviewer_role = log.reviewer?.role || record.reviewer_role || "Clinical product owner";
    record.updated_at = timestamp();
    if (overall === "primary_review_complete") {
      record.reviewed_date = record.reviewed_date || today();
    } else {
      record.reviewed_date = "";
    }
  }

  async function openAssessment(protocol, tissue) {
    try {
      const response = await fetch(protocol.path, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const protocolJson = await response.json();
      root.SACTCheckGenericAssessment?.open?.(protocolJson, { tumourGroup: tissue });
    } catch (error) {
      alert(`Could not open the SACTCheck assessment: ${error.message}`);
    }
  }

  function recordSummary(protocol, tissue, record) {
    const lines = [
      "SACTCheck primary clinical review",
      `Regimen: ${protocol.title}`,
      `NCCP: ${protocol.nccp_code}${protocol.nccp_version ? ` Version ${protocol.nccp_version}` : ""}`,
      `Tissue context: ${tissue}`,
      `Reviewer: ${record.reviewer_name || log.reviewer?.name || "Not recorded"}`,
      `Review status: ${OVERALL_LABELS[deriveOverall(record)]}`,
      `Source: ${protocol.source_url || "Official source link required"}`,
      "",
      "Domain review"
    ];
    for (const domain of DOMAIN_DEFINITIONS) {
      const review = record.domain_reviews?.[domain.id] || { status: "pending", note: "" };
      const label = DOMAIN_STATUS.find(item => item.value === review.status)?.label || review.status;
      lines.push(`${domain.label}: ${label}${review.note ? ` | ${review.note}` : ""}`);
    }
    if (record.issues?.length) {
      lines.push("", "Issues");
      for (const issue of record.issues) lines.push(`${issue.status.toUpperCase()} | ${issue.severity.toUpperCase()} | ${issue.title} | ${issue.note || ""}`);
    }
    if (record.overall_note) lines.push("", `Overall note: ${record.overall_note}`);
    lines.push("", "Boundary: This is a primary clinical review record. Independent consultant oncology and oncology pharmacy validation remain separate governance steps.");
    return lines.join("\n");
  }

  async function copyRecordSummary(protocol, tissue, record) {
    const text = recordSummary(protocol, tissue, record);
    try { await navigator.clipboard.writeText(text); }
    catch (_) {
      const area = document.createElement("textarea");
      area.value = text; document.body.appendChild(area); area.select(); document.execCommand("copy"); area.remove();
    }
    root.showToast?.("Validation summary copied");
  }

  function downloadBlob(name, content, type) {
    const blob = new Blob([content], { type });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = name;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  }

  function exportJson() {
    const packageData = {
      ...log,
      export_metadata: {
        exported_at: timestamp(),
        register_release: register?.release || RELEASE,
        protocol_count: register?.protocol_count || 0,
        tissue_context_count: register?.tissue_context_count || 0
      }
    };
    downloadBlob(`SACTCheck_primary_validation_log_${today()}.json`, JSON.stringify(packageData, null, 2) + "\n", "application/json;charset=utf-8");
  }

  function csvCell(value) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }
  function exportCsv() {
    const rows = [["context_key", "nccp_code", "version", "title", "tissue", "review_status", "progress_percent", "reviewer", "reviewed_date", "open_issues", "overall_note"]];
    for (const context of allContexts()) {
      const record = getRecord(context.protocol, context.tissue, false);
      rows.push([
        context.key, context.protocol.nccp_code, context.protocol.nccp_version, context.protocol.title, context.tissue,
        OVERALL_LABELS[deriveOverall(record)], progressForRecord(record), record?.reviewer_name || "", record?.reviewed_date || "", openIssues(record).length, record?.overall_note || ""
      ]);
    }
    const csv = rows.map(row => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
    downloadBlob(`SACTCheck_primary_validation_summary_${today()}.csv`, csv, "text/csv;charset=utf-8");
  }

  function exportCurrentTissueCsv() {
    const tissue = activeTissue === "all" ? "all_tissues" : activeTissue;
    const contexts = allContexts().filter(context => activeTissue === "all" || context.tissue === activeTissue);
    const rows = [["context_key", "nccp_code", "version", "title", "tissue", "review_status", "progress_percent", "open_issues"]];
    for (const context of contexts) {
      const record = getRecord(context.protocol, context.tissue, false);
      rows.push([context.key, context.protocol.nccp_code, context.protocol.nccp_version, context.protocol.title, context.tissue, OVERALL_LABELS[deriveOverall(record)], progressForRecord(record), openIssues(record).length]);
    }
    downloadBlob(`SACTCheck_${safeFilePart(tissue)}_validation_${today()}.csv`, rows.map(row => row.map(csvCell).join(",")).join("\r\n") + "\r\n", "text/csv;charset=utf-8");
  }

  function importJson(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ""));
        if (parsed.schema_version !== "1.0" || !parsed.records || typeof parsed.records !== "object") throw new Error("Unsupported validation log format");
        const mode = confirm("Replace the local validation log with this file? Select Cancel to merge imported records with the current log.") ? "replace" : "merge";
        if (mode === "replace") {
          log = { ...createEmptyLog(), ...parsed, records: parsed.records };
        } else {
          log = {
            ...log,
            reviewer: parsed.reviewer?.name ? parsed.reviewer : log.reviewer,
            records: { ...log.records, ...parsed.records },
            updated_at: timestamp()
          };
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
        populateReviewer();
        renderAll();
        alert("Validation log imported successfully.");
      } catch (error) {
        alert(`Could not import validation log: ${error.message}`);
      }
    };
    reader.readAsText(file);
  }

  function populateFilters() {
    const tissueSelect = $("clinicalValidationTissueFilter");
    if (!tissueSelect || !register) return;
    tissueSelect.innerHTML = `<option value="all">All tissues</option>${Object.keys(register.tissue_counts).sort((a, b) => a.localeCompare(b)).map(tissue => `<option value="${escapeHtml(tissue)}">${escapeHtml(tissue)} (${register.tissue_counts[tissue]})</option>`).join("")}`;
    tissueSelect.value = activeTissue;
  }

  function populateReviewer() {
    if (!log) return;
    $("clinicalValidationReviewerName").value = log.reviewer?.name || "";
    $("clinicalValidationReviewerRole").value = log.reviewer?.role || "Clinical product owner";
    const stamp = $("clinicalValidationSaveState");
    if (stamp) stamp.textContent = log.updated_at ? `Local log updated ${new Date(log.updated_at).toLocaleString()}` : "Local log ready";
  }

  function bindEvents() {
    document.querySelectorAll("[data-open-clinical-validation]").forEach(button => button.addEventListener("click", open));
    $("clinicalValidationBack")?.addEventListener("click", () => showScreen("libraryScreen"));
    $("clinicalValidationTissueFilter")?.addEventListener("change", event => { activeTissue = event.target.value; renderTissues(); renderQueue(); });
    $("clinicalValidationStatusFilter")?.addEventListener("change", event => { activeStatus = event.target.value; renderQueue(); });
    $("clinicalValidationSearch")?.addEventListener("input", event => { activeSearch = event.target.value.trim(); renderQueue(); });
    $("clinicalValidationReviewerName")?.addEventListener("change", event => { log.reviewer.name = event.target.value.trim(); saveLog(); populateReviewer(); });
    $("clinicalValidationReviewerRole")?.addEventListener("change", event => { log.reviewer.role = event.target.value.trim() || "Clinical product owner"; saveLog(); populateReviewer(); });
    $("clinicalValidationExportJson")?.addEventListener("click", exportJson);
    $("clinicalValidationExportCsv")?.addEventListener("click", exportCsv);
    $("clinicalValidationExportTissue")?.addEventListener("click", exportCurrentTissueCsv);
    $("clinicalValidationImport")?.addEventListener("click", () => $("clinicalValidationImportFile")?.click());
    $("clinicalValidationImportFile")?.addEventListener("change", event => { const file = event.target.files?.[0]; if (file) importJson(file); event.target.value = ""; });
    $("clinicalValidationReset")?.addEventListener("click", () => {
      if (!confirm("Delete the local primary validation log from this device? Export a copy first if you need to retain it.")) return;
      log = createEmptyLog();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
      activeKey = null;
      $("clinicalValidationReviewPanel")?.classList.add("hidden");
      renderAll();
    });
  }

  function showScreen(id) {
    if (typeof root.showScreen === "function") return root.showScreen(id);
    document.querySelectorAll(".screen").forEach(screen => screen.classList.remove("active"));
    $(id)?.classList.add("active");
    window.scrollTo(0, 0);
  }

  function renderAll() {
    populateFilters();
    populateReviewer();
    renderSummary();
    renderTissues();
    renderQueue();
  }

  async function loadRegister() {
    if (register) return register;
    const response = await fetch(REGISTER_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load clinical validation register: HTTP ${response.status}`);
    register = await response.json();
    return register;
  }

  async function open() {
    try {
      await loadRegister();
      showScreen("clinicalValidationScreen");
      renderAll();
      history.replaceState(null, "", "#clinicalValidationScreen");
    } catch (error) {
      alert(error.message);
    }
  }

  async function init() {
    log = loadStoredLog();
    bindEvents();
    try {
      await loadRegister();
      renderAll();
    } catch (error) {
      const queue = $("clinicalValidationQueue");
      if (queue) queue.innerHTML = `<div class="validation-empty"><strong>Validation register could not be loaded</strong><span>${escapeHtml(error.message)}</span></div>`;
    }
  }

  root.SACTCheckClinicalValidation = Object.freeze({
    version: RELEASE,
    open,
    domainDefinitions: DOMAIN_DEFINITIONS,
    overallLabels: OVERALL_LABELS
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})(typeof globalThis !== "undefined" ? globalThis : this);
