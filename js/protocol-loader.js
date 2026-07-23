/**
 * Loads the repository protocol index, validates each JSON protocol and adds
 * protocol-driven assessment cards to the existing SACTCheck regimen library.
 */
(() => {
  "use strict";

  const INDEX_PATH = "protocols/index.json";
  const protocolsById = new Map();
  let loadedProtocolRecords = [];
  const SECTION_ORDER = [
    "chemotherapy_combination_sact",
    "targeted_her2_therapy",
    "immunotherapy",
    "endocrine_hormonal_therapy",
    "bone_modifying_therapy",
    "supportive_other"
  ];
  const SECTION_LABELS = {
    chemotherapy_combination_sact: "Chemotherapy & combination SACT",
    targeted_her2_therapy: "Targeted & HER2 therapies",
    immunotherapy: "Immunotherapy",
    endocrine_hormonal_therapy: "Endocrine (hormonal) therapies",
    bone_modifying_therapy: "Bone-modifying therapies",
    supportive_other: "Other SACT / supportive therapy"
  };

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

  function getAliases(protocol) {
    return window.SACTCheckDrugAliases?.forProtocol(protocol) || [];
  }

  function aliasMarkup(protocol) {
    const aliases = getAliases(protocol);
    return aliases.length
      ? `<p class="regimen-aliases"><strong>Common / trade names:</strong> ${aliases.map(escapeHtml).join(" · ")}</p>`
      : "";
  }

  function getIndication(protocol) {
    return protocol?.metadata?.indication ||
      asArray(protocol.indications).map(item => item?.description).filter(Boolean).join(" ") ||
      "Machine-readable NCCP regimen encoded for the SACTCheck protocol library.";
  }

  function getCatalogueSection(protocol) {
    const value = protocol?.metadata?.catalogue_section || "supportive_other";
    return SECTION_ORDER.includes(value) ? value : "supportive_other";
  }

  function getCatalogueSectionLabel(protocol) {
    const section = getCatalogueSection(protocol);
    return protocol?.metadata?.catalogue_section_label || SECTION_LABELS[section];
  }

  function treatmentClassLabel(protocol) {
    const classes = asArray(protocol?.metadata?.treatment_class);
    if (!classes.length) return getCatalogueSectionLabel(protocol);
    return classes.slice(0, 2).map(value => String(value).replaceAll("_", " ").replace(/\b\w/g, character => character.toUpperCase())).join(" · ");
  }

  function applyTreatmentMetadata(card, protocol) {
    const section = getCatalogueSection(protocol);
    const sectionLabel = getCatalogueSectionLabel(protocol);
    card.dataset.section = section;
    card.dataset.sectionLabel = sectionLabel;
    card.querySelector(".treatment-chip")?.remove();
    const chip = document.createElement("span");
    chip.className = `treatment-chip treatment-chip-${section}`;
    chip.textContent = treatmentClassLabel(protocol);
    const category = card.querySelector(".category-chip");
    if (category) category.insertAdjacentElement("afterend", chip);
    else card.prepend(chip);
  }

  function groupCatalogueCards(grid) {
    grid.querySelectorAll(".catalogue-section-heading").forEach(item => item.remove());
    const cards = [...grid.querySelectorAll(".regimen-card")];
    cards.forEach(card => {
      if (!card.dataset.section) card.dataset.section = "supportive_other";
      if (!card.dataset.sectionLabel) card.dataset.sectionLabel = SECTION_LABELS[card.dataset.section] || SECTION_LABELS.supportive_other;
    });
    cards.sort((a, b) => {
      const sectionDifference = SECTION_ORDER.indexOf(a.dataset.section) - SECTION_ORDER.indexOf(b.dataset.section);
      if (sectionDifference) return sectionDifference;
      return String(a.dataset.name || a.querySelector("h2")?.textContent || "").localeCompare(String(b.dataset.name || b.querySelector("h2")?.textContent || ""));
    });
    cards.forEach(card => grid.appendChild(card));
    SECTION_ORDER.forEach(section => {
      const first = cards.find(card => card.dataset.section === section);
      if (!first) return;
      const heading = document.createElement("div");
      heading.className = "catalogue-section-heading";
      heading.dataset.sectionHeading = section;
      heading.innerHTML = `<h2>${escapeHtml(SECTION_LABELS[section])}</h2><p>Use search and tumour-site filters across the full catalogue.</p>`;
      grid.insertBefore(heading, first);
    });
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

  function isClinicallyValidated(protocol) {
    const validation = protocol?.metadata?.validation || {};
    return Boolean(validation.consultant_reviewed && validation.oncology_pharmacy_reviewed && validation.software_tests_completed && validation.clinical_use_authorised);
  }

  function statusBadges({ engine = "JSON", clinicalValidated = false, sourceUrl = null, shadow = false, localPreview = false, ready = true }) {
    const badges = [
      `<span class="badge ${engine === "JSON" ? "engine-json" : "engine-legacy"}">Engine · ${escapeHtml(engine)}</span>`,
      `<span class="badge ${clinicalValidated ? "clinical-validated" : "clinical-pending"}">Clinical · ${clinicalValidated ? "Validated" : "Pending validation"}</span>`,
      `<span class="badge ${sourceUrl ? "source-current" : "source-missing"}">Source · ${sourceUrl ? "Official NCCP" : "Not linked"}</span>`
    ];
    if (!ready) badges.push('<span class="badge source-missing">Engine validation required</span>');
    if (shadow) badges.push('<span class="badge development">Development · Shadow validation</span>');
    if (localPreview) badges.push('<span class="badge development">Local preview</span>');
    return badges.join("");
  }

  function emetogenicBadge(protocol) {
    return window.SACTCheckEmetogenicRisk?.badge(protocol) || '<span class="badge emetogenic-badge emetogenic-pending"><span class="emetogenic-dot" aria-hidden="true"></span>Supportive-care mapping requires review</span>';
  }

  function replaceRuleControl(card, jsonEngine) {
    const ruleButton = card.querySelector(".rule-explorer-btn, .card-actions button[onclick*='openRuleExplorer']");
    if (!ruleButton) return;
    if (jsonEngine) {
      const explainer = document.createElement("div");
      explainer.className = "assessment-explainer";
      explainer.textContent = "Triggered rules shown in assessment";
      ruleButton.replaceWith(explainer);
    } else {
      ruleButton.textContent = "Explore protocol rules";
    }
  }

  function normaliseRemainingLegacyCards(grid) {
    grid.querySelectorAll(".regimen-card:not([data-json-protocol-id])").forEach(card => {
      if (!card.dataset.section) card.dataset.section = "supportive_other";
      if (!card.dataset.sectionLabel) card.dataset.sectionLabel = SECTION_LABELS.supportive_other;
      const planned = card.dataset.status === "planned" || card.classList.contains("planned");
      const source = card.querySelector(".official-pdf-link, a[href*='healthservice.hse.ie/documents/']")?.href || null;
      const row = card.querySelector(".validation-row");
      if (row) {
        row.innerHTML = planned
          ? '<span class="badge engine-legacy">Engine · Catalogue only</span><span class="badge source-missing">Source · Required</span>'
          : `${statusBadges({ engine: "Legacy", clinicalValidated: false, sourceUrl: source })}${emetogenicBadge(null)}`;
      }
      const description = [...card.querySelectorAll(":scope > p")].find(p => !p.querySelector("strong"));
      description?.classList.add("regimen-description");
      replaceRuleControl(card, false);
    });
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

  function createOfficialPdfLink(protocol) {
    const sourceUrl = protocol?.metadata?.source_url;
    if (!sourceUrl) return null;
    const link = document.createElement("a");
    link.className = "btn secondary official-pdf-link";
    link.href = sourceUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", "Open the official NCCP protocol PDF in a new tab");
    link.innerHTML = '<span aria-hidden="true">📄</span> Official NCCP PDF';
    return link;
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

  function updateIntegratedCardMetadata(entry, protocol, card) {
    const metadata = protocol.metadata || {};
    const title = getProtocolTitle(protocol);
    const code = getProtocolCode(protocol);
    const version = metadata.nccp_version || "";
    const tumourGroups = getTumourGroups(entry, protocol);
    const tumourDisplay = tumourGroups.join(" · ");
    const indication = getIndication(protocol);
    const aliases = getAliases(protocol);

    const category = card.querySelector(".category-chip");
    if (category) category.textContent = tumourDisplay;

    const heading = card.querySelector("h2");
    if (heading) heading.textContent = title;

    card.querySelector(".regimen-aliases")?.remove();
    if (aliases.length && heading) {
      heading.insertAdjacentHTML("afterend", aliasMarkup(protocol));
    }

    const codeLine = [...card.querySelectorAll(":scope > p:not(.regimen-aliases)")].find(item => item.querySelector("strong"));
    if (codeLine) {
      codeLine.innerHTML = `<strong>NCCP ${escapeHtml(code)}${version ? ` · Version ${escapeHtml(version)}` : ""}</strong>`;
    }

    const description = [...card.querySelectorAll(":scope > p:not(.regimen-aliases)")].find(item => !item.querySelector("strong"));
    if (description) {
      description.textContent = shorten(indication);
      description.classList.add("regimen-description");
    }

    const sectionLabel = getCatalogueSectionLabel(protocol);
    const classes = asArray(metadata.treatment_class).join(" ");
    card.dataset.name = [title, aliases.join(" "), code, version, tumourDisplay, indication, sectionLabel, classes, entry.path].join(" ");
    card.dataset.tumour = tumourGroups.join(",");
    applyTreatmentMetadata(card, protocol);
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
    updateIntegratedCardMetadata(entry, protocol, card);

    // Replace the legacy navigation action with the protocol-driven JSON assessment.
    const replacement = document.createElement("button");
    replacement.id = legacyButtonId;
    replacement.type = "button";
    replacement.className = launch.className || "btn regimen-launch";
    replacement.textContent = assessmentReady ? "Open protocol assessment" : "Assessment unavailable";
    replacement.disabled = !assessmentReady;
    bindProtocolLaunch(replacement, protocolId, assessmentReady);
    launch.replaceWith(replacement);

    const actions = replacement.closest(".card-actions");
    actions?.querySelector(".official-pdf-link")?.remove();
    const officialPdfLink = createOfficialPdfLink(protocol);
    if (officialPdfLink) actions?.appendChild(officialPdfLink);

    card.dataset.jsonProtocolId = protocolId;
    card.dataset.status = assessmentReady ? "active" : "planned";
    card.classList.toggle("active-regimen", assessmentReady);
    card.classList.toggle("planned", !assessmentReady);

    const validationRow = card.querySelector(".validation-row");
    if (validationRow) {
      validationRow.innerHTML = `${statusBadges({
        engine: "JSON",
        clinicalValidated: isClinicallyValidated(protocol),
        sourceUrl: protocol?.metadata?.source_url,
        shadow: entry.mode === "shadow_validation",
        ready: assessmentReady
      })}${emetogenicBadge(protocol)}`;
    }

    replaceRuleControl(card, true);

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
      const aliases = getAliases(protocol);
      const totalRules = asArray(protocol.rule_engine?.rules).length + asArray(protocol.pembrolizumab_irae_rules?.rules).length;
      const validation = protocolValidation(protocol);
      const assessmentReady = validation.valid && Boolean(window.SACTCheckGenericAssessment);
      const localPreview = Boolean(entry.localPreview);
      const section = getCatalogueSection(protocol);
      const sectionLabel = getCatalogueSectionLabel(protocol);
      const classes = asArray(metadata.treatment_class).join(" ");
      const searchableText = [title, aliases.join(" "), code, version, tumourDisplay, indication, sectionLabel, classes, entry.path].join(" ");

      const card = document.createElement("article");
      card.className = `card regimen-card json-regimen-card ${assessmentReady ? "active-regimen" : "planned"}`;
      card.dataset.name = searchableText;
      card.dataset.tumour = tumourGroups.join(",");
      card.dataset.status = assessmentReady ? "active" : "planned";
      card.dataset.section = section;
      card.dataset.sectionLabel = sectionLabel;
      card.dataset.jsonProtocolId = protocolId;

      card.innerHTML = `
        <span class="category-chip">${escapeHtml(tumourDisplay)}</span>
        <span class="treatment-chip treatment-chip-${escapeHtml(section)}">${escapeHtml(treatmentClassLabel(protocol))}</span>
        <h2>${escapeHtml(title)}</h2>
        ${aliasMarkup(protocol)}
        <p><strong>NCCP ${escapeHtml(code)}${version ? ` · Version ${escapeHtml(version)}` : ""}</strong></p>
        <p class="regimen-description">${escapeHtml(shorten(indication))}</p>
        <div class="validation-row">${statusBadges({
          engine: "JSON",
          clinicalValidated: isClinicallyValidated(protocol),
          sourceUrl: metadata.source_url,
          shadow: migrationMode === "shadow_validation",
          localPreview,
          ready: assessmentReady
        })}${emetogenicBadge(protocol)}</div>
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
          ${metadata.source_url ? `<a class="btn secondary official-pdf-link" href="${escapeHtml(metadata.source_url)}" target="_blank" rel="noopener noreferrer" aria-label="Open the official NCCP protocol PDF in a new tab"><span aria-hidden="true">📄</span> Official NCCP PDF</a>` : ""}
        </div>`;

      const button = card.querySelector(".json-assessment-launch");
      bindProtocolLaunch(button, protocolId, assessmentReady);

      grid.appendChild(card);
    });

    normaliseRemainingLegacyCards(grid);
    groupCatalogueCards(grid);

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
      await window.SACTCheckEmetogenicRisk?.load();
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
    version: "0.37.2",
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
