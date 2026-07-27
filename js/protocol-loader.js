/**
 * Loads the repository protocol index, validates each JSON protocol and adds
 * protocol-driven assessment cards to the existing SACTCheck regimen library.
 */
(() => {
  "use strict";

  const INDEX_PATH = "protocols/index.json";
  const LOAD_CONCURRENCY = 8;
  const FETCH_ATTEMPTS = 4;
  const RETRYABLE_HTTP_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
  const protocolsById = new Map();
  let loadedProtocolRecords = [];
  let failedProtocolEntries = [];
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

  function wait(milliseconds) {
    return new Promise(resolve => window.setTimeout(resolve, milliseconds));
  }

  function retryUrl(path, attempt) {
    if (!attempt) return path;
    const url = new URL(path, window.location.href);
    url.searchParams.set("sact_retry", `${Date.now()}-${attempt}`);
    return url.href;
  }

  async function fetchJson(path, { attempts = FETCH_ATTEMPTS } = {}) {
    let lastError = null;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        const response = await fetch(retryUrl(path, attempt), { cache: "no-store" });
        if (response.ok) return response.json();

        const error = new Error(`Could not load ${path}. HTTP ${response.status}`);
        error.status = response.status;
        error.path = path;
        lastError = error;
        const canRetry = RETRYABLE_HTTP_STATUS.has(response.status) && attempt < attempts - 1;
        if (!canRetry) throw error;
      } catch (error) {
        lastError = error;
        const status = Number(error?.status || 0);
        const networkFailure = !status;
        const canRetry = (networkFailure || RETRYABLE_HTTP_STATUS.has(status)) && attempt < attempts - 1;
        if (!canRetry) throw error;
      }
      const delay = 350 * (2 ** attempt) + Math.floor(Math.random() * 180);
      await wait(delay);
    }
    throw lastError || new Error(`Could not load ${path}.`);
  }

  async function mapWithConcurrency(items, worker, concurrency = LOAD_CONCURRENCY) {
    const results = new Array(items.length);
    let nextIndex = 0;
    async function runWorker() {
      while (nextIndex < items.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        try {
          results[currentIndex] = { status: "fulfilled", value: await worker(items[currentIndex], currentIndex) };
        } catch (reason) {
          results[currentIndex] = { status: "rejected", reason, item: items[currentIndex] };
        }
      }
    }
    const workerCount = Math.max(1, Math.min(concurrency, items.length || 1));
    await Promise.all(Array.from({ length: workerCount }, runWorker));
    return results;
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


  function normaliseDisplayText(value) {
    return String(value ?? "")
      .replaceAll("CARBOplatin", "Carboplatin")
      .replaceAll("PACLitaxel", "Paclitaxel")
      .replaceAll("CISplatin", "Cisplatin")
      .replaceAll("DOXOrubicin", "Doxorubicin")
      .replaceAll("PEMEtrexed", "Pemetrexed")
      .replaceAll("DOCEtaxel", "Docetaxel")
      .replaceAll("cycloPHOSphamide", "Cyclophosphamide")
      .replaceAll("SUNitinib", "Sunitinib")
      .replaceAll("vinCRIStine", "Vincristine")
      .replaceAll("epiRUBicin", "Epirubicin")
      .replaceAll("eriBULin", "Eribulin")
      .replaceAll("PAZOPanib", "Pazopanib")
      .replaceAll("DACTINomycin", "Dactinomycin")
      .replaceAll("VinBLAStine", "Vinblastine")
      .replaceAll("prednisoLONE", "Prednisolone")
      .replaceAll("predniSONE", "Prednisone");
  }

  function shorten(value, maximumLength = 240) {
    const text = String(value ?? "").trim();
    return text.length <= maximumLength ? text : `${text.slice(0, maximumLength - 1).trim()}…`;
  }

  function getProtocolTitle(protocol) {
    return normaliseDisplayText(protocol?.metadata?.short_title || protocol?.metadata?.title || protocol?.file_name || "Unnamed protocol");
  }

  function getProtocolCode(protocol) {
    return protocol?.metadata?.nccp_regimen_code || protocol?.protocol_id || "No NCCP code";
  }

  function getTumourGroups(entry, protocol) {
    const metadata = protocol.metadata || {};
    const primary = typeof metadata.tumour_group === "string" ? metadata.tumour_group.trim() : "";
    const plural = asArray(metadata.tumour_groups)
      .flatMap(group => String(group).split(","))
      .map(group => group.trim())
      .filter(Boolean);
    const indexed = asArray(entry?.tumour_group)
      .flatMap(group => String(group).split(","))
      .map(group => group.trim())
      .filter(Boolean);
    if (primary && plural.length && !plural.includes(primary)) return [primary];
    const groups = plural.length ? plural : (indexed.length ? indexed : (primary ? [primary] : ["Uncategorised"]));
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

  function getIndication(protocol, tumourGroup = null) {
    const contextual = window.SACTCheckProtocolContext?.descriptionForTissue(
      protocol,
      tumourGroup || window.SACTCheckProtocolContext?.activeTumourGroup?.() || "all",
      { scope: "card" }
    );
    return contextual || protocol?.metadata?.indication ||
      asArray(protocol.indications).map(item => item?.description).filter(Boolean).join(" ") ||
      "Machine-readable NCCP regimen encoded for the SACTCheck protocol library.";
  }

  function getSearchableIndication(protocol) {
    return [
      protocol?.metadata?.indication,
      ...asArray(protocol?.indications).map(item => item?.description)
    ].filter(Boolean).join(" ");
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

  function statusBadges({ clinicalValidated = false, sourceUrl = null, shadow = false, localPreview = false, ready = true }) {
    const badges = [];
    if (sourceUrl && clinicalValidated) {
      badges.push('<span class="badge protocol-status protocol-status-validated">Official NCCP source · Clinically validated</span>');
    } else if (sourceUrl) {
      badges.push('<span class="badge protocol-status protocol-status-pending">Official NCCP source · Validation pending</span>');
    } else {
      badges.push('<span class="badge protocol-status protocol-status-source-missing">Source link requires verification</span>');
    }
    if (!ready) badges.push('<span class="badge protocol-status protocol-status-source-missing">Assessment unavailable</span>');
    if (shadow) badges.push('<span class="badge development">Shadow validation</span>');
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
          ? '<span class="badge protocol-status protocol-status-source-missing">Catalogue only · source required</span>'
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
    const tumourGroup = window.SACTCheckProtocolContext?.activeTumourGroup?.() || "all";
    window.SACTCheckGenericAssessment.open(protocol, { tumourGroup });
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

  function enableCardLaunch(card) {
    if (!card || card.dataset.cardLaunchEnabled === "true") return;
    const launch = card.querySelector(".json-assessment-launch, .regimen-launch");
    if (!launch || launch.disabled) return;
    card.dataset.cardLaunchEnabled = "true";
    card.tabIndex = 0;
    card.setAttribute("role", "group");
    card.setAttribute("aria-label", `${card.querySelector("h2")?.textContent || "Regimen"}. Open protocol assessment.`);
    const activate = event => {
      if (event.target.closest("a, button, input, select, textarea, summary, details")) return;
      launch.click();
    };
    card.addEventListener("click", activate);
    card.addEventListener("keydown", event => {
      if ((event.key === "Enter" || event.key === " ") && !event.target.closest("a, button, input, select, textarea, summary")) {
        event.preventDefault();
        launch.click();
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
    card.dataset.name = [title, aliases.join(" "), code, version, tumourDisplay, getSearchableIndication(protocol), sectionLabel, classes, entry.path].join(" ");
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
    enableCardLaunch(card);

    return true;
  }

  function createProtocolLibrary(protocols) {
    document.getElementById("json-protocol-library")?.remove();
    const grid = document.getElementById("regimenGrid");
    if (!grid) throw new Error("Could not find the existing regimen library grid.");

    grid.querySelectorAll(".json-regimen-card").forEach(card => card.remove());

    const legacyTargetCounts = protocols.reduce((counts, record) => {
      const target = record?.entry?.legacy_card_id;
      if (target) counts.set(target, (counts.get(target) || 0) + 1);
      return counts;
    }, new Map());

    protocols.forEach(({ entry = {}, protocol = {} }) => {
      const metadata = protocol.metadata || {};
      const protocolId = getProtocolId(entry, protocol);
      protocolsById.set(protocolId, protocol);

      const migrationMode = entry.mode || metadata.migration?.mode || "catalogue";
      const publishedForAssessment = isPublishedForAssessment(entry, protocol);
      if (!publishedForAssessment) return;
      const legacyTargetIsUnique = entry.legacy_card_id && legacyTargetCounts.get(entry.legacy_card_id) === 1;
      if (legacyTargetIsUnique && integrateExistingCard(entry, protocol)) return;
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
      const searchableText = [title, aliases.join(" "), code, version, tumourDisplay, getSearchableIndication(protocol), sectionLabel, classes, entry.path].join(" ");

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
        <p class="regimen-code"><strong>NCCP ${escapeHtml(code)}${version ? ` · v${escapeHtml(version)}` : ""}</strong></p>
        <p class="regimen-description">${escapeHtml(shorten(indication, 190))}</p>
        <div class="validation-row">${statusBadges({
          clinicalValidated: isClinicallyValidated(protocol),
          sourceUrl: metadata.source_url,
          shadow: migrationMode === "shadow_validation",
          localPreview,
          ready: assessmentReady
        })}${emetogenicBadge(protocol)}</div>
        <details class="protocol-card-details">
          <summary>Protocol details</summary>
          <div class="details-body">
            ${aliases.length ? `<p><strong>Common / trade names:</strong> ${aliases.map(escapeHtml).join(" · ")}</p>` : ""}
            <p><strong>Tumour groups:</strong> ${escapeHtml(tumourDisplay)}</p>
            <p><strong>Rules encoded:</strong> ${totalRules}</p>
            <p><strong>Engine:</strong> JSON protocol assessment</p>
            ${validation.warnings.length ? `<p><strong>Validation warnings:</strong> ${validation.warnings.length}</p>` : ""}
            ${validation.errors.length ? `<p><strong>Validation errors:</strong> ${validation.errors.length}. Assessment publication is blocked.</p>` : ""}
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
      enableCardLaunch(card);

      grid.appendChild(card);
    });

    // The canonical JSON index is the source of truth. Remove legacy catalogue
    // placeholders that were not uniquely reconciled to a single protocol.
    grid.querySelectorAll(".regimen-card:not([data-json-protocol-id])").forEach(card => card.remove());
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

  function removeLoaderNotice() {
    document.getElementById("protocolLoaderWarning")?.remove();
  }

  function loaderNoticeTarget() {
    return document.querySelector("main") || document.body;
  }

  function showFatalLoadError(error) {
    console.error("Protocol loader failed:", error);
    removeLoaderNotice();
    const warning = document.createElement("div");
    warning.id = "protocolLoaderWarning";
    warning.className = "protocol-loader-notice protocol-loader-fatal";
    warning.setAttribute("role", "alert");
    warning.innerHTML = `<strong>The regimen library could not be loaded.</strong><span>Please check your connection and try again. No assessment data has been entered or transmitted.</span><button class="btn secondary protocol-loader-retry" type="button">Retry loading</button><details><summary>Technical details</summary><code>${escapeHtml(error?.message || String(error))}</code></details>`;
    warning.querySelector(".protocol-loader-retry")?.addEventListener("click", loadProtocols);
    loaderNoticeTarget().prepend(warning);
  }

  function showPartialLoadWarning(failures, loadedCount, totalCount) {
    removeLoaderNotice();
    if (!failures.length) return;
    const warning = document.createElement("div");
    warning.id = "protocolLoaderWarning";
    warning.className = "protocol-loader-notice protocol-loader-partial";
    warning.setAttribute("role", "status");
    const unavailable = failures.length;
    warning.innerHTML = `<div><strong>${unavailable} protocol file${unavailable === 1 ? " is" : "s are"} temporarily unavailable.</strong><span>${loadedCount} of ${totalCount} protocols loaded successfully. The available library remains usable; retry before assessing an unavailable regimen.</span></div><button class="btn secondary protocol-loader-retry" type="button">Retry unavailable file${unavailable === 1 ? "" : "s"}</button><details><summary>Technical details</summary><ul>${failures.map(item => `<li><code>${escapeHtml(item.entry?.path || item.entry?.id || "Unknown protocol")}</code> — ${escapeHtml(item.error?.message || String(item.error))}</li>`).join("")}</ul></details>`;
    warning.querySelector(".protocol-loader-retry")?.addEventListener("click", retryFailedProtocols);
    loaderNoticeTarget().prepend(warning);
  }

  function publishProtocolState(protocols, failures, totalCount) {
    loadedProtocolRecords = protocols;
    failedProtocolEntries = failures.map(item => item.entry);
    window.SACTCHECK_PROTOCOLS = loadedProtocolRecords;
    window.SACTCHECK_PROTOCOLS_BY_ID = protocolsById;
    window.SACTCHECK_PROTOCOL_LOAD_STATUS = Object.freeze({
      loaded: protocols.length,
      unavailable: failures.length,
      total: totalCount
    });
    createProtocolLibrary(loadedProtocolRecords);
    window.dispatchEvent(new CustomEvent("sactcheck:protocols-loaded", {
      detail: { protocols, failures, total: totalCount }
    }));
    showPartialLoadWarning(failures, protocols.length, totalCount);
  }

  async function loadProtocolEntries(entries) {
    const settled = await mapWithConcurrency(entries, async entry => {
      if (!entry.path) throw new Error(`Protocol ${entry.id || "without an ID"} has no file path.`);
      const protocol = await fetchJson(entry.path);
      return { entry, protocol };
    });
    return {
      protocols: settled.filter(result => result.status === "fulfilled").map(result => result.value),
      failures: settled.filter(result => result.status === "rejected").map(result => ({
        entry: result.item,
        error: result.reason
      }))
    };
  }

  async function retryFailedProtocols() {
    const entries = failedProtocolEntries.slice();
    if (!entries.length) return;
    const button = document.querySelector("#protocolLoaderWarning .protocol-loader-retry");
    if (button) {
      button.disabled = true;
      button.textContent = "Retrying…";
    }
    const result = await loadProtocolEntries(entries);
    const successfulIds = new Set(result.protocols.map(record => record.entry?.id || record.protocol?.protocol_id));
    const retained = loadedProtocolRecords.filter(record => !successfulIds.has(record.entry?.id || record.protocol?.protocol_id));
    const combined = [...retained, ...result.protocols];
    const total = combined.length + result.failures.length;
    publishProtocolState(combined, result.failures, total);
  }

  async function loadProtocols() {
    removeLoaderNotice();
    try {
      await window.SACTCheckEmetogenicRisk?.load();
      const index = await fetchJson(INDEX_PATH);
      if (!Array.isArray(index.protocols)) throw new Error("protocols/index.json does not contain a protocols array.");

      const enabledEntries = index.protocols.filter(item => item && item.enabled !== false);
      const result = await loadProtocolEntries(enabledEntries);
      if (!result.protocols.length) {
        const firstFailure = result.failures[0]?.error || new Error("No protocol files could be loaded.");
        throw firstFailure;
      }
      publishProtocolState(result.protocols, result.failures, enabledEntries.length);
      console.info(`SACTCheck loaded ${result.protocols.length} of ${enabledEntries.length} JSON protocols with concurrency limited to ${LOAD_CONCURRENCY}.`);
    } catch (error) {
      showFatalLoadError(error);
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
    version: "0.48.1",
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
