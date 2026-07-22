/**
 * Central emetogenic-risk resolver.
 * Risk levels remain pending until the user-supplied antiemetic proforma is
 * mapped. The UI must never infer a traffic-light category from regimen name.
 */
(function (root) {
  "use strict";

  const DEFAULT_RECORD = Object.freeze({
    level: "pending",
    label: "Awaiting proforma mapping",
    className: "emetogenic-pending",
    proformaUrl: null,
    proformaAnchor: null
  });
  let mapping = { source: {}, levels: {}, scripts: {}, protocols: {} };

  async function load(path = "data/emetogenic-risk-map.json") {
    try {
      const response = await fetch(path, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      mapping = await response.json();
    } catch (error) {
      console.warn("Emetogenic-risk mapping could not be loaded; pending state retained.", error);
    }
    return mapping;
  }

  function codeFor(protocol) {
    return String(protocol?.metadata?.nccp_regimen_code || protocol?.protocol_id || "");
  }

  function normaliseLevel(value) {
    const level = String(value || "pending").toLowerCase();
    return ["high", "moderate", "low"].includes(level) ? level : "pending";
  }

  function get(protocol) {
    const metadata = protocol?.metadata || {};
    const record = mapping.protocols?.[codeFor(protocol)] || {};
    const level = normaliseLevel(metadata.emetogenic_risk || record.level);
    const levelDefinition = mapping.levels?.[level] || {};
    const supportive = protocol?.supportive_care || {};
    const scriptId = supportive.script_id || metadata.supportive_script_id || record.script_id || levelDefinition.default_script_id || null;
    const script = scriptId ? (mapping.scripts?.[scriptId] || {}) : {};
    const baseUrl = supportive.supportive_medications_pdf_url || metadata.antiemetic_proforma_url || record.proforma_url || script.url || null;
    const anchor = metadata.antiemetic_proforma_anchor || record.proforma_anchor || null;
    return {
      level,
      label: levelDefinition.label || DEFAULT_RECORD.label,
      className: `emetogenic-${level}`,
      scriptId,
      scriptStatus: script.status || (baseUrl ? "available" : "unmapped"),
      scriptLabel: supportive.supportive_medications_label || script.label || null,
      proformaUrl: baseUrl ? `${baseUrl}${anchor ? `#${anchor}` : ""}` : null,
      proformaAnchor: anchor
    };
  }

  function badge(protocol, options = {}) {
    const risk = get(protocol);
    const tag = risk.proformaUrl ? "a" : "span";
    const href = risk.proformaUrl ? ` href="${risk.proformaUrl}" target="_blank" rel="noopener noreferrer"` : "";
    const title = risk.level === "pending" ? ' title="Awaiting the supplied antiemetic proforma; no category has been inferred."' : "";
    return `<${tag} class="badge emetogenic-badge ${risk.className}"${href}${title}><span class="emetogenic-dot" aria-hidden="true"></span>${risk.label}</${tag}>`;
  }

  root.SACTCheckEmetogenicRisk = Object.freeze({ version: "0.36.7", load, get, badge });
})(typeof globalThis !== "undefined" ? globalThis : this);
