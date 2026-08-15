/**
 * SACTCheck regimen information and evidence base.
 *
 * Educational, source-linked content only. This module does not alter the
 * deterministic protocol assessment, dose actions or treatment status.
 */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SACTCheckRegimenKnowledgeBase = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  const VERSION = "0.65.0";
  const DATA_URL = "data/regimen-knowledge-base-v0650.json";
  let data = null;
  let loadingPromise = null;
  let activeProtocol = null;

  function asArray(value) {
    if (value === undefined || value === null || value === "") return [];
    return Array.isArray(value) ? value : [value];
  }

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
      .replace(/[®™]/g, "")
      .replace(/[–—]/g, "-")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function load() {
    if (data) return Promise.resolve(data);
    if (loadingPromise) return loadingPromise;
    if (typeof fetch !== "function") return Promise.reject(new Error("Knowledge base loading is unavailable."));
    loadingPromise = fetch(DATA_URL, { cache: "no-store" })
      .then(response => {
        if (!response.ok) throw new Error(`Could not load regimen information (${response.status}).`);
        return response.json();
      })
      .then(payload => {
        data = payload;
        return data;
      })
      .finally(() => { loadingPromise = null; });
    return loadingPromise;
  }

  function protocolTitle(protocol) {
    return root.SACTCheckRegimenDisplayTitle?.forProtocol?.(protocol) ||
      protocol?.metadata?.short_title || protocol?.metadata?.title || protocol?.protocol_id || "Regimen";
  }

  function protocolCode(protocol) {
    return protocol?.metadata?.nccp_regimen_code || protocol?.protocol_id || "";
  }

  function protocolVersion(protocol) {
    return protocol?.metadata?.nccp_version || "";
  }

  function componentNames(protocol) {
    const fromShared = root.SACTCheckRegimenComponents?.forProtocol?.(protocol) || [];
    if (fromShared.length) return fromShared;
    return asArray(protocol?.metadata?.drugs).map(String).filter(Boolean);
  }

  function profileForComponent(component, profiles = []) {
    const value = normalise(component);
    if (!value) return null;
    return profiles.find(profile => asArray(profile.aliases).some(alias => {
      const candidate = normalise(alias);
      return candidate && (value === candidate || value.includes(candidate) || candidate.includes(value));
    })) || null;
  }

  function profilesForProtocol(protocol, payload = data) {
    const profiles = payload?.drug_profiles || [];
    const matched = [];
    componentNames(protocol).forEach(component => {
      const profile = profileForComponent(component, profiles);
      if (profile && !matched.some(item => item.id === profile.id)) matched.push(profile);
    });
    return matched;
  }

  function evidenceForProtocol(protocol, payload = data) {
    const id = String(protocol?.protocol_id || "");
    const code = String(protocolCode(protocol)).replace(/^0+/, "");
    return (payload?.evidence_records || []).filter(record => {
      if (String(record.protocol_id || "") === id) return true;
      const recordCode = String(record.nccp_regimen_code || "").replace(/^0+/, "");
      return recordCode && code && recordCode === code;
    });
  }

  function regimenProfileForProtocol(protocol, payload = data) {
    const id = String(protocol?.protocol_id || "");
    return (payload?.regimen_profiles || []).find(item => String(item.protocol_id || "") === id) || null;
  }

  function ensurePanel() {
    if (typeof document === "undefined") return null;
    let overlay = document.getElementById("regimenInformationOverlay");
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.id = "regimenInformationOverlay";
    overlay.className = "regimen-information-overlay hidden";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "regimenInformationTitle");
    overlay.innerHTML = `
      <div class="regimen-information-shell">
        <div class="regimen-information-toolbar">
          <div><span class="regimen-information-eyebrow">Regimen information and evidence</span><h2 id="regimenInformationTitle">Regimen information</h2></div>
          <button type="button" class="btn secondary" data-regimen-info-close>Close</button>
        </div>
        <div class="regimen-information-content" data-regimen-info-content aria-live="polite"><p>Loading regimen information…</p></div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener("click", event => {
      if (event.target === overlay || event.target.closest("[data-regimen-info-close]")) close();
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !overlay.classList.contains("hidden")) close();
    });
    return overlay;
  }

  function reviewMarkup(status, reviewedDate, sourceCheckedDate) {
    const parts = [
      status,
      reviewedDate ? `Last reviewed ${reviewedDate}` : "",
      sourceCheckedDate ? `Sources checked ${sourceCheckedDate}` : ""
    ].filter(Boolean);
    return parts.length ? `<span class="regimen-review-state">${escapeHtml(parts.join(" · "))}</span>` : "";
  }

  function drugMarkup(profile) {
    const source = profile.source_url ? `<a class="regimen-source-link" href="${escapeHtml(profile.source_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(profile.source_label || "Open medicine source")}</a>` : "";
    return `<article class="regimen-drug-card">
      <div class="regimen-drug-head"><h4>${escapeHtml(profile.name)}</h4><span>${escapeHtml(profile.drug_type || "Drug component")}</span></div>
      ${profile.drug_class ? `<p><strong>Class:</strong> ${escapeHtml(profile.drug_class)}</p>` : ""}
      ${profile.mechanism ? `<p><strong>Mechanism:</strong> ${escapeHtml(profile.mechanism)}</p>` : ""}
      <div class="regimen-card-foot">${source}${reviewMarkup(profile.review_status, profile.last_reviewed)}</div>
    </article>`;
  }

  function publicationLink(item, label) {
    if (!item?.url) return "";
    return `<a class="btn secondary" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label || item.label || "Open publication")}</a>`;
  }

  function evidenceMarkup(record) {
    const primary = publicationLink({ url: record.publication_url }, "Open primary publication");
    const doi = record.doi_url ? `<a class="btn secondary" href="${escapeHtml(record.doi_url)}" target="_blank" rel="noopener noreferrer">Open DOI</a>` : "";
    const followUps = asArray(record.supporting_publications);
    return `<article class="regimen-evidence-card">
      <div class="regimen-evidence-head">
        <div><span class="regimen-evidence-acronym">${escapeHtml(record.trial_acronym || "Supporting evidence")}</span>${record.evidence_relationship ? `<span class="regimen-evidence-relationship">${escapeHtml(record.evidence_relationship)}</span>` : ""}<h4>${escapeHtml(record.publication_title || "Publication")}</h4></div>
        <span>${escapeHtml([record.journal, record.year].filter(Boolean).join(" · "))}</span>
      </div>
      <dl class="regimen-evidence-grid">
        ${record.evidence_context ? `<div><dt>Clinical context</dt><dd>${escapeHtml(record.evidence_context)}</dd></div>` : ""}
        ${record.study_design ? `<div><dt>Study design</dt><dd>${escapeHtml(record.study_design)}</dd></div>` : ""}
        ${record.trial_population ? `<div><dt>Population</dt><dd>${escapeHtml(record.trial_population)}</dd></div>` : ""}
        ${record.intervention ? `<div><dt>Intervention</dt><dd>${escapeHtml(record.intervention)}</dd></div>` : ""}
        ${record.comparator ? `<div><dt>Comparator</dt><dd>${escapeHtml(record.comparator)}</dd></div>` : ""}
        ${record.primary_endpoint ? `<div><dt>Primary endpoint</dt><dd>${escapeHtml(record.primary_endpoint)}</dd></div>` : ""}
        ${record.relevance_summary ? `<div><dt>Relevance</dt><dd>${escapeHtml(record.relevance_summary)}</dd></div>` : ""}
        ${record.match_type ? `<div><dt>Evidence mapping</dt><dd>${escapeHtml(record.match_type)}</dd></div>` : ""}
      </dl>
      ${asArray(record.key_findings).length ? `<div class="regimen-key-findings"><h5>Key findings</h5><ul>${asArray(record.key_findings).map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>` : ""}
      ${record.limitations ? `<div class="regimen-evidence-limitation"><strong>Important limitations</strong><p>${escapeHtml(record.limitations)}</p></div>` : ""}
      <div class="regimen-evidence-actions">${primary}${doi}${reviewMarkup(record.review_status, record.last_reviewed, record.source_checked_date)}</div>
      ${followUps.length ? `<div class="regimen-follow-up-publications"><h5>Additional trial publications</h5>${followUps.map(item => `<div><div><strong>${escapeHtml(item.label || "Follow-up")}</strong><span>${escapeHtml([item.journal, item.year].filter(Boolean).join(" · "))}</span><p>${escapeHtml(item.title || "")}</p></div><div class="regimen-follow-up-actions">${publicationLink(item, "Open PubMed")}${item.doi_url ? `<a class="btn secondary" href="${escapeHtml(item.doi_url)}" target="_blank" rel="noopener noreferrer">Open DOI</a>` : ""}</div></div>`).join("")}</div>` : ""}
    </article>`;
  }

  function sectionHeadMarkup(number, title, description) {
    return `<div class="regimen-information-section-head"><div><span>${escapeHtml(number)}</span><h3>${escapeHtml(title)}</h3></div><p>${escapeHtml(description || "")}</p></div>`;
  }

  function listCardMarkup(title, items, tone) {
    const values = asArray(items).filter(Boolean);
    if (!values.length) return "";
    return `<article class="regimen-module-card${tone ? ` ${escapeHtml(tone)}` : ""}"><h4>${escapeHtml(title)}</h4><ul>${values.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article>`;
  }

  function textCardMarkup(title, text, tone) {
    if (!text) return "";
    return `<article class="regimen-module-card${tone ? ` ${escapeHtml(tone)}` : ""}"><h4>${escapeHtml(title)}</h4><p>${escapeHtml(text)}</p></article>`;
  }

  function overviewMarkup(profile, number) {
    if (!profile) return "";
    return `<section class="regimen-information-section regimen-overview-section">
      ${sectionHeadMarkup(number, "Regimen at a glance", "Concise context for the exact protocol opened.")}
      <div class="regimen-overview-grid">
        <article><h4>Role</h4><p>${escapeHtml(profile.regimen_role || "")}</p></article>
        <article><h4>Treatment setting</h4><p>${escapeHtml(profile.treatment_setting || "")}</p></article>
        <article class="wide"><h4>Overview</h4><p>${escapeHtml(profile.clinical_summary || "")}</p></article>
        <article class="wide"><h4>How the components work together</h4><p>${escapeHtml(profile.component_rationale || "")}</p></article>
        <article class="wide"><h4>Schedule context</h4><p>${escapeHtml(profile.schedule_context || "")}</p></article>
      </div>
      ${asArray(profile.key_points).length ? `<div class="regimen-key-point-tags">${asArray(profile.key_points).map(item => `<span>${escapeHtml(item)}</span>`).join("")}</div>` : ""}
      <div class="regimen-overview-review">${reviewMarkup(profile.review_status, profile.last_reviewed, profile.source_checked_date)}</div>
    </section>`;
  }

  function patientSelectionMarkup(profile, number) {
    const module = profile?.patient_selection;
    if (!module) return "";
    return `<section class="regimen-information-section regimen-module-section">
      ${sectionHeadMarkup(number, "Treatment intent and patient selection", "Orientation for the encoded indication; not an independent eligibility decision.")}
      <div class="regimen-module-grid">
        ${textCardMarkup("Treatment intent", module.treatment_intent, "regimen-module-primary")}
        ${listCardMarkup("Disease and biomarker context", module.disease_and_biomarker_context)}
        ${listCardMarkup("Eligibility orientation", module.eligibility_orientation)}
        ${listCardMarkup("Important cautions", module.important_cautions, "regimen-module-caution")}
      </div>
    </section>`;
  }

  function supportiveCareMarkup(profile, number) {
    const module = profile?.supportive_care;
    if (!module) return "";
    return `<section class="regimen-information-section regimen-module-section">
      ${sectionHeadMarkup(number, "Supportive care", "Protocol-linked prevention, counselling and symptom-support considerations.")}
      <div class="regimen-module-grid">
        ${textCardMarkup("Emetogenic risk", module.emetogenic_risk, "regimen-module-primary")}
        ${listCardMarkup("Premedication and prophylaxis", module.premedication_and_prophylaxis)}
        ${listCardMarkup("Patient education", module.patient_education)}
        ${listCardMarkup("Special support", module.special_support)}
      </div>
    </section>`;
  }

  function monitoringMarkup(profile, number) {
    const module = profile?.monitoring_and_toxicity;
    if (!module) return "";
    return `<section class="regimen-information-section regimen-module-section">
      ${sectionHeadMarkup(number, "Monitoring and toxicity", "What should be actively reviewed around treatment; exact actions remain protocol-driven.")}
      <div class="regimen-module-grid">
        ${listCardMarkup("Baseline", module.baseline)}
        ${listCardMarkup("Before each cycle", module.before_each_cycle)}
        ${listCardMarkup("Priority toxicities", module.priority_toxicities, "regimen-module-primary")}
        ${listCardMarkup("Urgent review signals", module.urgent_review_signals, "regimen-module-alert")}
      </div>
    </section>`;
  }

  function administrationMarkup(profile, number) {
    const module = profile?.administration;
    if (!module) return "";
    return `<section class="regimen-information-section regimen-module-section">
      ${sectionHeadMarkup(number, "Administration and practical workflow", "High-level delivery context; use the official protocol and local policies for execution.")}
      <div class="regimen-module-grid">
        ${textCardMarkup("Cycle and sequence", module.cycle_and_sequence, "regimen-module-primary")}
        ${listCardMarkup("Route and duration", module.route_and_duration)}
        ${listCardMarkup("Practical workflow", module.practical_workflow)}
        ${listCardMarkup("Observation and access", module.observation_and_access)}
      </div>
    </section>`;
  }

  function evidenceAuditMarkup(profile, number) {
    const audit = profile?.evidence_audit;
    if (!audit) return "";
    return `<section class="regimen-information-section regimen-evidence-audit-section">
      ${sectionHeadMarkup(number, "Evidence completeness audit", "A structured indication-by-indication check; not a systematic review.")}
      <div class="regimen-evidence-audit-status"><strong>${escapeHtml(audit.status || "Audited")}</strong><span>Sources checked ${escapeHtml(profile.source_checked_date || "")}</span></div>
      <div class="regimen-module-grid">
        ${listCardMarkup("Encoded indications reviewed", audit.indications_reviewed, "regimen-module-primary")}
        ${textCardMarkup("Coverage summary", audit.coverage_summary)}
        ${textCardMarkup("Later, add-on and sequencing search", audit.later_or_add_on_search)}
        ${listCardMarkup("Remaining limitations or uncertainties", audit.remaining_uncertainties, "regimen-module-caution")}
      </div>
    </section>`;
  }

  function render(protocol, payload) {
    const overlay = ensurePanel();
    const target = overlay?.querySelector("[data-regimen-info-content]");
    if (!target || !protocol) return;
    const metadata = protocol.metadata || {};
    const components = componentNames(protocol);
    const profiles = profilesForProtocol(protocol, payload);
    const evidence = evidenceForProtocol(protocol, payload);
    const regimenProfile = regimenProfileForProtocol(protocol, payload);
    const official = metadata.source_url ? `<a class="btn" href="${escapeHtml(metadata.source_url)}" target="_blank" rel="noopener noreferrer">Open official NCCP protocol</a>` : "";
    const missingComponents = components.filter(component => !profileForComponent(component, payload?.drug_profiles || []));
    let sectionIndex = 1;
    const nextSection = () => String(sectionIndex++).padStart(2, "0");

    const overview = regimenProfile ? overviewMarkup(regimenProfile, nextSection()) : "";
    const patientSelection = regimenProfile?.patient_selection ? patientSelectionMarkup(regimenProfile, nextSection()) : "";
    const supportiveCare = regimenProfile?.supportive_care ? supportiveCareMarkup(regimenProfile, nextSection()) : "";
    const monitoring = regimenProfile?.monitoring_and_toxicity ? monitoringMarkup(regimenProfile, nextSection()) : "";
    const administration = regimenProfile?.administration ? administrationMarkup(regimenProfile, nextSection()) : "";
    const evidenceAudit = regimenProfile?.evidence_audit ? evidenceAuditMarkup(regimenProfile, nextSection()) : "";
    const componentSectionNumber = nextSection();
    const evidenceSectionNumber = nextSection();

    target.innerHTML = `
      <section class="regimen-information-hero">
        <span class="regimen-information-code">NCCP ${escapeHtml(protocolCode(protocol))}${protocolVersion(protocol) ? ` · v${escapeHtml(protocolVersion(protocol))}` : ""}</span>
        <h3>${escapeHtml(protocolTitle(protocol))}</h3>
        <p>${escapeHtml(metadata.indication || "Review the official NCCP protocol for the complete authorised indication and treatment context.")}</p>
        <div class="regimen-information-actions">${official}</div>
      </section>

      ${overview}
      ${patientSelection}
      ${supportiveCare}
      ${monitoring}
      ${administration}
      ${evidenceAudit}

      <section class="regimen-information-section">
        ${sectionHeadMarkup(componentSectionNumber, "Regimen components", "Drug class and mechanism summaries are educational and do not alter the encoded assessment.")}
        ${components.length ? `<div class="regimen-component-tags">${components.map(item => `<span>${escapeHtml(item)}</span>`).join("")}</div>` : '<p class="regimen-info-empty">No structured component list is available for this regimen.</p>'}
        ${profiles.length ? `<div class="regimen-drug-grid">${profiles.map(drugMarkup).join("")}</div>` : '<p class="regimen-info-empty">Drug class and mechanism summaries have not yet been mapped for this regimen.</p>'}
        ${missingComponents.length ? `<p class="regimen-info-note"><strong>Not yet mapped:</strong> ${escapeHtml(missingComponents.join(" · "))}</p>` : ""}
      </section>

      <section class="regimen-information-section">
        ${sectionHeadMarkup(evidenceSectionNumber, "Evidence supporting this regimen and indication", "Primary publications provide context. The current NCCP protocol remains the operational source.")}
        ${evidence.length ? `<div class="regimen-evidence-list">${evidence.map(evidenceMarkup).join("")}</div>` : '<div class="regimen-info-empty"><strong>No evidence mapping is available yet.</strong><p>The official NCCP protocol remains available above. Evidence records are being added in controlled batches.</p></div>'}
      </section>

      <aside class="regimen-information-boundary">
        <strong>Decision support and educational boundary</strong>
        <p>This page provides source-linked context on treatment intent, patient selection, supportive care, monitoring, administration, drug mechanisms and selected publications. It does not independently determine eligibility, diagnose toxicity, prescribe treatment or alter the deterministic SACTCheck result. The current NCCP protocol and local clinical governance remain authoritative.</p>
      </aside>`;
  }

  function resolveProtocol(protocolOrId) {
    if (protocolOrId && typeof protocolOrId === "object") return protocolOrId;
    return root.SACTCheckProtocolLoader?.getProtocolById?.(protocolOrId) ||
      (root.SACTCheckProtocolLoader?.getLoadedProtocols?.() || []).map(item => item.protocol || item).find(item => String(item?.protocol_id) === String(protocolOrId)) || null;
  }

  function open(protocolOrId) {
    const protocol = resolveProtocol(protocolOrId);
    if (!protocol) return false;
    activeProtocol = protocol;
    const overlay = ensurePanel();
    overlay?.classList.remove("hidden");
    document?.body?.classList.add("regimen-information-open");
    const target = overlay?.querySelector("[data-regimen-info-content]");
    if (target) target.innerHTML = "<p>Loading regimen information…</p>";
    load().then(payload => render(protocol, payload)).catch(error => {
      if (target) target.innerHTML = `<div class="regimen-info-empty"><strong>Regimen information could not be loaded.</strong><p>${escapeHtml(error?.message || "Reload the page and try again.")}</p></div>`;
    });
    overlay?.querySelector("[data-regimen-info-close]")?.focus?.();
    return true;
  }

  function close() {
    const overlay = ensurePanel();
    overlay?.classList.add("hidden");
    document?.body?.classList.remove("regimen-information-open");
  }

  function prepare(protocol) {
    activeProtocol = protocol || null;
    const button = typeof document !== "undefined" ? document.getElementById("jsonRegimenInfoButton") : null;
    button?.classList.toggle("hidden", !activeProtocol);
    return Boolean(activeProtocol);
  }

  function bindCardLinks() {
    if (typeof document === "undefined" || document.documentElement.dataset.regimenInfoBound === "true") return;
    document.documentElement.dataset.regimenInfoBound = "true";
    document.addEventListener("click", event => {
      const button = event.target.closest("[data-regimen-info-protocol]");
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      open(button.dataset.regimenInfoProtocol);
    });
  }

  function init() {
    bindCardLinks();
    load().catch(() => {});
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  }

  return Object.freeze({
    version: VERSION,
    load,
    open,
    close,
    prepare,
    profilesForProtocol,
    evidenceForProtocol,
    regimenProfileForProtocol,
    get activeProtocol() { return activeProtocol; }
  });
});
