/**
 * Central emetogenic-risk and supportive-care resolver.
 * Source mappings are based on NCCP SACT antiemetic guidance V6 (2025).
 * Local prescription sheets remain subject to local oncology-pharmacy approval.
 */
(function (root) {
  "use strict";

  const DEFAULT_RECORD = Object.freeze({
    level: "pending",
    label: "Supportive-care mapping requires review",
    className: "emetogenic-pending",
    scriptId: null,
    scriptLabel: null,
    scriptStatus: "unmapped",
    proformaUrl: null,
    summary: "No verified supportive-care mapping is available for this treatment context.",
    subsequentDays: null,
    breakthrough: null,
    mappingBasis: null,
    validationStatus: "pending"
  });

  const VALID_LEVELS = new Set([
    "high", "moderate", "low", "minimal", "oral_moderate_high",
    "oral_minimal_low", "phase_dependent", "variable", "pending"
  ]);

  let mapping = { source: {}, levels: {}, scripts: {}, protocols: {}, breakthrough: {} };

  async function load(path = "data/emetogenic-risk-map.json") {
    try {
      const response = await fetch(path, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      mapping = await response.json();
    } catch (error) {
      console.warn("Emetogenic-risk mapping could not be loaded; review state retained.", error);
    }
    return mapping;
  }

  function codeFor(protocol) {
    return String(protocol?.metadata?.nccp_regimen_code || protocol?.protocol_id || "");
  }

  function normaliseLevel(value) {
    const level = String(value || "pending").toLowerCase();
    return VALID_LEVELS.has(level) ? level : "pending";
  }

  function phaseKey(profileId) {
    const id = String(profileId || "").toLowerCase();
    if (!id || id === "default") return null;
    if (/adjuvant.*pembro|adjuvant.*immun|maintenance.*immun/.test(id)) return "adjuvant_immunotherapy_phase";
    if (/cycle[s]?_?5|5_to_8|anthracycline|cyclophosphamide|\bac\b/.test(id)) return "anthracycline_cyclophosphamide_phase";
    if (/cycle[s]?_?1|1_to_4|taxane|weekly|paclitaxel|carboplatin/.test(id)) return "taxane_or_weekly_phase";
    return null;
  }

  function resolvePhase(record, supportive, profileId) {
    const profiles = supportive.phase_profiles || record.phase_profiles || {};
    const key = phaseKey(profileId);
    if (key && profiles[key]) return { ...profiles[key], phaseKey: key, phaseResolved: true };
    return { phaseKey: key, phaseResolved: false, phaseProfiles: profiles };
  }

  function scriptRecord(scriptId) {
    return scriptId ? (mapping.scripts?.[scriptId] || {}) : {};
  }

  function get(protocol, options = {}) {
    if (!protocol) return { ...DEFAULT_RECORD };
    const metadata = protocol.metadata || {};
    const supportive = protocol.supportive_care || {};
    const record = mapping.protocols?.[codeFor(protocol)] || {};
    const baseLevel = normaliseLevel(supportive.emetogenic_risk || metadata.emetogenic_risk || record.level);
    const phase = baseLevel === "phase_dependent" ? resolvePhase(record, supportive, options.profileId) : {};
    const level = phase.phaseResolved ? normaliseLevel(phase.level) : baseLevel;
    const levelDefinition = mapping.levels?.[level] || mapping.levels?.[baseLevel] || {};
    const scriptId = phase.phaseResolved
      ? phase.script_id
      : supportive.script_id || metadata.supportive_script_id || record.script_id || levelDefinition.default_script_id || null;
    const script = scriptRecord(scriptId);
    const baseUrl = supportive.supportive_medications_pdf_url || metadata.antiemetic_proforma_url || script.url || null;
    const anchor = metadata.antiemetic_proforma_anchor || null;
    const unresolvedPhase = baseLevel === "phase_dependent" && !phase.phaseResolved;
    const phaseProfiles = phase.phaseProfiles || supportive.phase_profiles || record.phase_profiles || {};

    let summary = script.summary || DEFAULT_RECORD.summary;
    if (unresolvedPhase) {
      const phaseText = Object.entries(phaseProfiles).map(([key, item]) => {
        const label = mapping.levels?.[normaliseLevel(item.level)]?.label || item.level;
        return `${key.replace(/_/g, " ")}: ${label}`;
      }).join("; ");
      summary = `Emetogenic risk changes by treatment phase. Select the active assessment phase where available. ${phaseText}`;
    } else if (baseLevel === "variable") {
      summary = supportive.mapping_basis || record.mapping_basis || "Use the antiemetic category of the most emetogenic active component.";
    }

    return {
      level,
      baseLevel,
      label: unresolvedPhase
        ? (mapping.levels?.phase_dependent?.label || "Phase-dependent emetogenic risk")
        : (levelDefinition.label || DEFAULT_RECORD.label),
      className: `emetogenic-${unresolvedPhase ? "phase-dependent" : level.replace(/_/g, "-")}`,
      scriptId,
      scriptStatus: script.status || (baseUrl ? "available" : "unmapped"),
      scriptLabel: supportive.supportive_medications_label || script.label || null,
      proformaUrl: baseUrl ? `${baseUrl}${anchor ? `#${anchor}` : ""}` : null,
      proformaAnchor: anchor,
      summary,
      subsequentDays: script.subsequent_days || null,
      breakthrough: mapping.breakthrough || null,
      mappingBasis: supportive.mapping_basis || record.mapping_basis || null,
      mappingConfidence: supportive.mapping_confidence || record.mapping_confidence || null,
      validationStatus: supportive.validation_status || script.status || "pending",
      sourceUrl: supportive.mapping_source_url || script.source_url || mapping.source?.url || null,
      phaseResolved: Boolean(phase.phaseResolved),
      phaseKey: phase.phaseKey || null,
      phaseProfiles,
      warning: unresolvedPhase
        ? "The current assessment profile does not identify a unique treatment phase. Confirm the active drugs/day before prescribing supportive medicines."
        : baseLevel === "variable"
          ? "The companion component is not fixed; apply the highest emetogenic risk of the drugs actually being administered."
          : "Supportive medication selection, dose and duration require reconciliation with the current NCCP regimen and local pharmacy policy."
    };
  }

  function badge(protocol, options = {}) {
    const risk = get(protocol, options);
    const tag = risk.proformaUrl ? "a" : "span";
    const href = risk.proformaUrl ? ` href="${risk.proformaUrl}" target="_blank" rel="noopener noreferrer"` : "";
    const title = ` title="${String(risk.warning || risk.mappingBasis || "Supportive-care mapping").replace(/"/g, "&quot;")}"`;
    return `<${tag} class="badge emetogenic-badge ${risk.className}"${href}${title}><span class="emetogenic-dot" aria-hidden="true"></span>${risk.label}</${tag}>`;
  }

  root.SACTCheckEmetogenicRisk = Object.freeze({
    version: "0.37.0",
    load,
    get,
    badge,
    phaseKey
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
