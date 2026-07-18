/**
 * Loads the repository protocol index, validates each JSON protocol and adds
 * protocol-driven assessment cards to the existing SACTCheck regimen library.
 */
(() => {
  "use strict";

  const INDEX_PATH = "protocols/index.json";
  const protocolsById = new Map();
  let loadedProtocolRecords = [];

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
    const validator = window.SACTCheckProtocolValidator;
    if (validator?.validate) {
      const result = validator.validate(protocol, { strict: true });
      return {
        ...result,
        errors: result.errors.map(item => item.message || String(item)),
        warnings: result.warnings.map(item => item.message || String(item))
      };
    }
    const engine = window.SACTCheckAssessmentEngine;
    if (!engine) return { valid: false, errors: ["Assessment engine not loaded."], warnings: [] };
    return engine.validateProtocol(protocol);
  }


  function getProtocolId(entry, protocol) {
    return protocol?.protocol_id || entry?.id || getProtocolCode(protocol);
  }

  function isPublishedForAssessment(entry, protocol) {
    const mode = entry?.mode || protocol?.metadata?.migration?.mode || "catalogue";
    return mode !== "shadow_validation" && entry?.enabled !== false;
  }

  function launchProtocol(protocolId) {
    const protocol = protocolsById.get(protocolId);
    if (!protocol) throw new Error(`Protocol ${protocolId} is not loaded.`);
    if (!window.SACTCheckGenericAssessment?.open) {
      throw new Error("The generic JSON assessment interface is unavailable.");
    }
    window.SACTCheckGenericAssessment.open(protocol);
  }

  function bindProtocolLaunch(button, protocolId, assessmentReady) {
    button.dataset.protocolId = protocolId;
    button.dataset.protocolEngine = "json";
    button.disabled = !assessmentReady;
    if (!assessmentReady) return;
    button.addEventListener("click", () => {
      try {
        launchProtocol(button.dataset.protocolId);
      } catch (error) {
        showLoadError(error);
      }
    });
  }

  function integrateExistingCard(entry, protocol) {
    const legacyButtonId = entry.legacy_card_id;
    if (!legacyButtonId) return false;

    const launch = document.getElementById(legacyButtonId);
    const card = launch?.closest(".regimen-card");
    if (!launch || !card) return false;

    const validation = protocolValidation(protocol);
    const assessmentReady = validation.valid && Boolean(window.SACTCheckGenericAssessment);
    const protocolId = getProtocolId(entry, protocol);
    protocolsById.set(protocolId, protocol);

    // Replace the legacy navigation action with the protocol-driven JSON assessment.
    const replacement = document.createElement("button");
    replacement.id = legacyButtonId;
    replacement.type = "button";
    replacement.className = launch.className || "btn regimen-launch";
    replacement.textContent = assessmentReady ? "Open protocol assessment" : "Assessment unavailable";
    replacement.disabled = !assessmentReady;
    bindProtocolLaunch(replacement, protocolId, assessmentReady);
    launch.replaceWith(replacement);

    card.dataset.jsonProtocolId = protocolId;
    card.dataset.status = assessmentReady ? "active" : "planned";
    card.classList.toggle("active-regimen", assessmentReady);
    card.classList.toggle("planned", !assessmentReady);

    const validationRow = card.querySelector(".validation-row");
    if (validationRow) {
      validationRow.innerHTML = `
        <span class="badge ${assessmentReady ? "review" : "pending"}">
          ${assessmentReady ? "JSON assessment live" : "Engine validation required"}
        </span>
        <span class="badge pending">Clinical validation pending</span>`;
    }

    const ruleButton = card.querySelector(".rule-explorer-btn");
    if (ruleButton) {
      ruleButton.textContent = "Assessment explains triggered rules";
      ruleButton.disabled = true;
      ruleButton.removeAttribute("onclick");
      ruleButton.title = "Run an assessment to see the exact encoded rules evaluated and triggered.";
    }

    return true;
  }

  function createProtocolLibrary(protocols) {
    document.getElementById("json-protocol-library")?.remove();
    const grid = document.getElementById("regimenGrid");
    if (!grid) throw new Error("Could not find the existing regimen library grid.");

    grid.querySelectorAll(".json-regimen-card").forEach(card => card.remove());

    protocols.forEach(({ entry = {}, protocol = {} }) => {
      const metadata = protocol.metadata || {};
      const protocolId = getProtocolId(entry, protocol);
      protocolsById.set(protocolId, protocol);

      const migrationMode = entry.mode || metadata.migration?.mode || "catalogue";
      const publishedForAssessment = isPublishedForAssessment(entry, protocol);
      if (!publishedForAssessment) return;
      if (entry.legacy_card_id && integrateExistingCard(entry, protocol)) return;
      const title = getProtocolTitle(protocol);
      const code = getProtocolCode(protocol);
      const version = metadata.nccp_version || "";
      const tumourGroups = getTumourGroups(entry, protocol);
      const tumourDisplay = tumourGroups.join(" · ");
      const indication = getIndication(protocol);
      const totalRules = asArray(protocol.rule_engine?.rules).length + asArray(protocol.pembrolizumab_irae_rules?.rules).length;
      const validation = protocolValidation(protocol);
      const assessmentReady = validation.valid && Boolean(window.SACTCheckGenericAssessment);
      const localPreview = Boolean(entry.localPreview);
      const searchableText = [title, code, version, tumourDisplay, indication, entry.path].join(" ");

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
          <span class="badge catalog">${localPreview ? "Local JSON preview" : "Protocol JSON"}</span>
          <span class="badge ${assessmentReady ? "review" : "pending"}">
            ${assessmentReady ? "JSON assessment live" : "Engine validation required"}
          </span>
          <span class="badge pending">Clinical validation pending</span>
        </div>
        <details>
          <summary>View encoded protocol summary</summary>
          <div class="details-body">
            <p><strong>Repository file:</strong> ${escapeHtml(entry.path || protocol.file_name || "Path not specified")}</p>
            <p><strong>Encoding status:</strong> ${escapeHtml(protocol.status || "Not specified")}</p>
            <p><strong>Rules encoded:</strong> ${totalRules}</p>
            ${validation.warnings.length ? `<p><strong>Validation warnings:</strong> ${validation.warnings.length}. Use the JSON preview screen for details.</p>` : ""}
            ${validation.errors.length ? `<p><strong>Validation errors:</strong> ${validation.errors.length}. Publication is blocked.</p>` : ""}
          </div>
        </details>
        <div class="card-actions">
          <button class="btn json-assessment-launch" type="button" ${assessmentReady ? "" : "disabled"}>
            ${assessmentReady ? "Open protocol assessment" : "Assessment unavailable"}
          </button>
        </div>`;

      const button = card.querySelector(".json-assessment-launch");
      bindProtocolLaunch(button, protocolId, assessmentReady);

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

      loadedProtocolRecords = protocols;
      window.SACTCHECK_PROTOCOLS = loadedProtocolRecords;
      window.SACTCHECK_PROTOCOLS_BY_ID = protocolsById;
      createProtocolLibrary(loadedProtocolRecords);
      window.dispatchEvent(new CustomEvent("sactcheck:protocols-loaded", { detail: { protocols } }));
      console.info(`SACTCheck loaded ${protocols.length} JSON protocol${protocols.length === 1 ? "" : "s"}.`);
    } catch (error) {
      showLoadError(error);
    }
  }

  function addLocalProtocol(protocol, sourceName = "Local JSON file") {
    const validation = protocolValidation(protocol);
    if (!validation.valid) {
      throw new Error(`Protocol validation failed: ${validation.errors.join(" ")}`);
    }

    const id = protocol.protocol_id;
    const record = {
      entry: {
        id,
        path: sourceName,
        tumour_group: protocol?.metadata?.tumour_group || protocol?.metadata?.tumour_groups || "Local preview",
        enabled: true,
        localPreview: true,
        mode: protocol?.metadata?.migration?.mode
      },
      protocol
    };

    loadedProtocolRecords = loadedProtocolRecords.filter(item => (item.protocol?.protocol_id || item.entry?.id) !== id);
    loadedProtocolRecords.push(record);
    protocolsById.set(id, protocol);
    window.SACTCHECK_PROTOCOLS = loadedProtocolRecords;
    createProtocolLibrary(loadedProtocolRecords);
    window.dispatchEvent(new CustomEvent("sactcheck:local-protocol-added", { detail: { record, validation } }));
    return { record, validation };
  }

  window.SACTCheckProtocolLoader = Object.freeze({
    loadProtocols,
    addLocalProtocol,
    validateProtocol: protocolValidation,
    launchProtocol,
    getProtocolById(id) {
      return protocolsById.get(id) || null;
    },
    getLoadedProtocols() {
      return loadedProtocolRecords.slice();
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadProtocols);
  } else {
    loadProtocols();
  }
})();
