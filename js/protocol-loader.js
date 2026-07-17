/**
 * Loads the repository protocol index, validates each JSON protocol and adds
 * protocol-driven assessment cards to the existing SACTCheck regimen library.
 */
(() => {
  "use strict";

  const INDEX_PATH = "protocols/index.json";
  const protocolsById = new Map();

  async function fetchJson(path) {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load ${path}. HTTP ${response.status}`);
    return response.json();
  }

  function asArray(value) {
    if (value === undefined || value === null) return [];
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

  function shorten(value, maximumLength = 240) {
    const text = String(value ?? "").trim();
    return text.length <= maximumLength ? text : `${text.slice(0, maximumLength - 1).trim()}…`;
  }

  function getProtocolTitle(protocol) {
    return protocol?.metadata?.short_title || protocol?.metadata?.title || protocol?.file_name || "Unnamed protocol";
  }

  function getProtocolCode(protocol) {
    return protocol?.metadata?.nccp_regimen_code || protocol?.protocol_id || "No NCCP code";
  }

  function getTumourGroups(entry, protocol) {
    const metadata = protocol.metadata || {};
    const groups = asArray(metadata.tumour_groups || entry.tumour_group || metadata.tumour_group || "Uncategorised")
      .flatMap(group => String(group).split(","))
      .map(group => group.trim())
      .filter(Boolean);
    return [...new Set(groups)];
  }

  function getIndication(protocol) {
    return protocol?.metadata?.indication ||
      asArray(protocol.indications).map(item => item?.description).filter(Boolean).join(" ") ||
      "Machine-readable NCCP regimen encoded for the SACTCheck protocol library.";
  }

  function protocolValidation(protocol) {
    const engine = window.SACTCheckAssessmentEngine;
    if (!engine) return { valid: false, errors: ["Assessment engine not loaded."], warnings: [] };
    return engine.validateProtocol(protocol);
  }

  function createProtocolLibrary(protocols) {
    document.getElementById("json-protocol-library")?.remove();
    const grid = document.getElementById("regimenGrid");
    if (!grid) throw new Error("Could not find the existing regimen library grid.");

    grid.querySelectorAll(".json-regimen-card").forEach(card => card.remove());

    protocols.forEach(({ entry = {}, protocol = {} }) => {
      const metadata = protocol.metadata || {};
      const title = getProtocolTitle(protocol);
      const code = getProtocolCode(protocol);
      const version = metadata.nccp_version || "";
      const tumourGroups = getTumourGroups(entry, protocol);
      const tumourDisplay = tumourGroups.join(" · ");
      const indication = getIndication(protocol);
      const totalRules = asArray(protocol.rule_engine?.rules).length + asArray(protocol.pembrolizumab_irae_rules?.rules).length;
      const validation = protocolValidation(protocol);
      const assessmentReady = validation.valid && Boolean(window.SACTCheckGenericAssessment);
      const protocolId = protocol.protocol_id || entry.id || code;
      const searchableText = [title, code, version, tumourDisplay, indication, entry.path].join(" ");

      protocolsById.set(protocolId, protocol);

      const card = document.createElement("article");
      card.className = `card regimen-card json-regimen-card ${assessmentReady ? "active-regimen" : "planned"}`;
      card.dataset.name = searchableText;
      card.dataset.tumour = tumourGroups.join(",");
      card.dataset.status = assessmentReady ? "active" : "planned";
      card.dataset.jsonProtocolId = protocolId;

      card.innerHTML = `
        <span class="category-chip">${escapeHtml(tumourDisplay)}</span>
        <h2>${escapeHtml(title)}</h2>
        <p><strong>NCCP ${escapeHtml(code)}${version ? ` · Version ${escapeHtml(version)}` : ""}</strong></p>
        <p>${escapeHtml(shorten(indication))}</p>
        <div class="validation-row">
          <span class="badge catalog">Encoded JSON</span>
          <span class="badge ${assessmentReady ? "review" : "pending"}">
            ${assessmentReady ? "Generic assessment available" : "Engine validation required"}
          </span>
          <span class="badge pending">Clinical validation pending</span>
        </div>
        <details>
          <summary>View encoded protocol summary</summary>
          <div class="details-body">
            <p><strong>Repository file:</strong> ${escapeHtml(entry.path || protocol.file_name || "Path not specified")}</p>
            <p><strong>Encoding status:</strong> ${escapeHtml(protocol.status || "Not specified")}</p>
            <p><strong>Rules encoded:</strong> ${totalRules}</p>
            ${validation.warnings.length ? `<p><strong>Engine warnings:</strong> ${escapeHtml(validation.warnings.join(" "))}</p>` : ""}
            ${validation.errors.length ? `<p><strong>Engine errors:</strong> ${escapeHtml(validation.errors.join(" "))}</p>` : ""}
          </div>
        </details>
        <div class="card-actions">
          <button class="btn json-assessment-launch" type="button" ${assessmentReady ? "" : "disabled"}>
            ${assessmentReady ? "Open JSON assessment" : "Assessment unavailable"}
          </button>
        </div>`;

      const button = card.querySelector(".json-assessment-launch");
      if (assessmentReady) {
        button.addEventListener("click", () => {
          try {
            window.SACTCheckGenericAssessment.open(protocol);
          } catch (error) {
            showLoadError(error);
          }
        });
      }

      grid.appendChild(card);
    });

    if (typeof window.filterRegimens === "function") {
      window.filterRegimens();
    } else {
      const count = document.getElementById("catalogCount");
      if (count) {
        const total = grid.querySelectorAll(".regimen-card").length;
        count.textContent = `${total} regimen${total === 1 ? "" : "s"} shown`;
      }
    }
  }

  function showLoadError(error) {
    console.error("Protocol loader failed:", error);
    const existing = document.getElementById("protocolLoaderWarning");
    if (existing) existing.remove();

    const warning = document.createElement("div");
    warning.id = "protocolLoaderWarning";
    warning.style.cssText = "margin:16px;padding:12px;border:1px solid #f1aeb5;border-radius:8px;background:#f8d7da;color:#58151c;font-family:Arial,Helvetica,sans-serif;";
    warning.textContent = `Protocol loader failed: ${error.message}`;
    document.body.prepend(warning);
  }

  async function loadProtocols() {
    try {
      const index = await fetchJson(INDEX_PATH);
      if (!Array.isArray(index.protocols)) throw new Error("protocols/index.json does not contain a protocols array.");

      const enabledEntries = index.protocols.filter(item => item && item.enabled !== false);
      const protocols = await Promise.all(enabledEntries.map(async entry => {
        if (!entry.path) throw new Error(`Protocol ${entry.id || "without an ID"} has no file path.`);
        const protocol = await fetchJson(entry.path);
        return { entry, protocol };
      }));

      window.SACTCHECK_PROTOCOLS = protocols;
      window.SACTCHECK_PROTOCOLS_BY_ID = protocolsById;
      createProtocolLibrary(protocols);
      console.info(`SACTCheck loaded ${protocols.length} JSON protocol${protocols.length === 1 ? "" : "s"}.`);
    } catch (error) {
      showLoadError(error);
    }
  }

  window.SACTCheckProtocolLoader = Object.freeze({
    loadProtocols,
    getProtocolById(id) {
      return protocolsById.get(id) || null;
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadProtocols);
  } else {
    loadProtocols();
  }
})();
