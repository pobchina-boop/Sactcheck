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

  const VERSION = "0.56.0";
  const DATA_URL = "data/regimen-knowledge-base-v0560.json";
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

  function drugMarkup(profile) {
    return `<article class="regimen-drug-card">
      <div class="regimen-drug-head"><h4>${escapeHtml(profile.name)}</h4><span>${escapeHtml(profile.drug_type || "Drug component")}</span></div>
      ${profile.drug_class ? `<p><strong>Class:</strong> ${escapeHtml(profile.drug_class)}</p>` : ""}
      ${profile.mechanism ? `<p><strong>Mechanism:</strong> ${escapeHtml(profile.mechanism)}</p>` : ""}
      <p class="regimen-review-state">${escapeHtml(profile.review_status || "Clinical review pending")}</p>
    </article>`;
  }

  function evidenceMarkup(record) {
    const link = record.publication_url ? `<a class="btn secondary" href="${escapeHtml(record.publication_url)}" target="_blank" rel="noopener noreferrer">Open publication</a>` : "";
    return `<article class="regimen-evidence-card">
      <div class="regimen-evidence-head">
        <div><span class="regimen-evidence-acronym">${escapeHtml(record.trial_acronym || "Supporting evidence")}</span><h4>${escapeHtml(record.publication_title || "Publication")}</h4></div>
        <span>${escapeHtml([record.journal, record.year].filter(Boolean).join(" · "))}</span>
      </div>
      <dl class="regimen-evidence-grid">
        ${record.evidence_context ? `<div><dt>Clinical context</dt><dd>${escapeHtml(record.evidence_context)}</dd></div>` : ""}
        ${record.study_design ? `<div><dt>Study design</dt><dd>${escapeHtml(record.study_design)}</dd></div>` : ""}
        ${record.relevance_summary ? `<div><dt>Relevance</dt><dd>${escapeHtml(record.relevance_summary)}</dd></div>` : ""}
        ${record.limitations ? `<div><dt>Limitations</dt><dd>${escapeHtml(record.limitations)}</dd></div>` : ""}
        ${record.match_type ? `<div><dt>Evidence mapping</dt><dd>${escapeHtml(record.match_type)}</dd></div>` : ""}
      </dl>
      <div class="regimen-evidence-actions">${link}<span class="regimen-review-state">${escapeHtml(record.review_status || "Clinical review pending")}</span></div>
    </article>`;
  }

  function render(protocol, payload) {
    const overlay = ensurePanel();
    const target = overlay?.querySelector("[data-regimen-info-content]");
    if (!target || !protocol) return;
    const metadata = protocol.metadata || {};
    const components = componentNames(protocol);
    const profiles = profilesForProtocol(protocol, payload);
    const evidence = evidenceForProtocol(protocol, payload);
    const official = metadata.source_url ? `<a class="btn" href="${escapeHtml(metadata.source_url)}" target="_blank" rel="noopener noreferrer">Open official NCCP protocol</a>` : "";
    const missingComponents = components.filter(component => !profileForComponent(component, payload?.drug_profiles || []));

    target.innerHTML = `
      <section class="regimen-information-hero">
        <span class="regimen-information-code">NCCP ${escapeHtml(protocolCode(protocol))}${protocolVersion(protocol) ? ` · v${escapeHtml(protocolVersion(protocol))}` : ""}</span>
        <h3>${escapeHtml(protocolTitle(protocol))}</h3>
        <p>${escapeHtml(metadata.indication || "Review the official NCCP protocol for the complete authorised indication and treatment context.")}</p>
        <div class="regimen-information-actions">${official}</div>
      </section>

      <section class="regimen-information-section">
        <div class="regimen-information-section-head"><div><span>01</span><h3>Regimen components</h3></div><p>Educational summaries do not alter the encoded protocol assessment.</p></div>
        ${components.length ? `<div class="regimen-component-tags">${components.map(item => `<span>${escapeHtml(item)}</span>`).join("")}</div>` : '<p class="regimen-info-empty">No structured component list is available for this regimen.</p>'}
        ${profiles.length ? `<div class="regimen-drug-grid">${profiles.map(drugMarkup).join("")}</div>` : '<p class="regimen-info-empty">Drug class and mechanism summaries have not yet been mapped for this regimen.</p>'}
        ${missingComponents.length ? `<p class="regimen-info-note"><strong>Not yet mapped:</strong> ${escapeHtml(missingComponents.join(" · "))}</p>` : ""}
      </section>

      <section class="regimen-information-section">
        <div class="regimen-information-section-head"><div><span>02</span><h3>Evidence supporting this regimen and indication</h3></div><p>Primary publications provide context. The current NCCP protocol remains the operational source.</p></div>
        ${evidence.length ? `<div class="regimen-evidence-list">${evidence.map(evidenceMarkup).join("")}</div>` : '<div class="regimen-info-empty"><strong>No reviewed evidence mapping is available yet.</strong><p>The official NCCP protocol remains available above. Evidence records are being added in a clinically reviewed pilot.</p></div>'}
      </section>

      <aside class="regimen-information-boundary">
        <strong>Decision support and educational boundary</strong>
        <p>This page explains drug classes, mechanisms and selected supporting publications. It does not determine eligibility, diagnose toxicity, prescribe treatment or change the deterministic SACTCheck result. AI-assisted draft summaries require consultant and oncology-pharmacy review.</p>
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
    get activeProtocol() { return activeProtocol; }
  });
});
