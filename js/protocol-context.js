/**
 * Resolves tissue-specific indication context for protocols shared across
 * multiple tumour libraries. The active tumour filter controls card wording
 * and the preferred indication in the assessment form.
 */
(function (root) {
  "use strict";

  const CANONICAL_GROUPS = [
    "Breast",
    "Gastrointestinal",
    "Gynaecology",
    "Lung",
    "Genitourinary",
    "Neuro-oncology",
    "Sarcoma",
    "Haematology",
    "Lymphoma",
    "Skin/Melanoma",
    "Head and Neck"
  ];

  const GROUP_ALIASES = new Map([
    ["breast", "Breast"],
    ["gastrointestinal", "Gastrointestinal"],
    ["gi", "Gastrointestinal"],
    ["gynaecology", "Gynaecology"],
    ["gynecology", "Gynaecology"],
    ["gynae", "Gynaecology"],
    ["lung", "Lung"],
    ["genitourinary", "Genitourinary"],
    ["gu", "Genitourinary"],
    ["neuro-oncology", "Neuro-oncology"],
    ["neurology", "Neuro-oncology"],
    ["sarcoma", "Sarcoma"],
    ["haematology", "Haematology"],
    ["hematology", "Haematology"],
    ["lymphoma", "Lymphoma"],
    ["skin/melanoma", "Skin/Melanoma"],
    ["skin", "Skin/Melanoma"],
    ["melanoma", "Skin/Melanoma"],
    ["head and neck", "Head and Neck"],
    ["head & neck", "Head and Neck"],
    ["headneck", "Head and Neck"]
  ]);

  function asArray(value) {
    if (value === undefined || value === null) return [];
    return Array.isArray(value) ? value : [value];
  }

  function clean(value) {
    return String(value ?? "").trim();
  }

  function normaliseGroup(value) {
    const text = clean(value);
    if (!text || text.toLowerCase() === "all") return "all";
    return GROUP_ALIASES.get(text.toLowerCase()) || text;
  }

  function unique(values) {
    return [...new Set(values.filter(Boolean))];
  }

  function protocolGroups(protocol) {
    const metadata = protocol?.metadata || {};
    const primary = typeof metadata.tumour_group === "string" ? normaliseGroup(metadata.tumour_group) : "";
    const plural = asArray(metadata.tumour_groups)
      .flatMap(group => clean(group).split(","))
      .map(normaliseGroup)
      .filter(group => group && group !== "all");
    const groups = plural.length ? plural : (primary ? [primary] : []);
    return unique(groups);
  }

  function explicitIndicationGroups(indication) {
    return unique([
      ...asArray(indication?.tumour_group),
      ...asArray(indication?.tumour_groups),
      ...asArray(indication?.tissue_group),
      ...asArray(indication?.tissue_groups)
    ].flatMap(group => clean(group).split(",")).map(normaliseGroup).filter(group => group && group !== "all"));
  }

  function suffixGroups(indication) {
    const id = clean(indication?.indication_id || indication?.id || indication?.code).toLowerCase();
    const found = [];
    if (/(^|[-_])(skin|melanoma)([-_]|$)/.test(id)) found.push("Skin/Melanoma");
    if (/(^|[-_])gu([-_]|$)/.test(id)) found.push("Genitourinary");
    if (/(^|[-_])(gyn|gynae)([-_]|$)/.test(id)) found.push("Gynaecology");
    if (/(^|[-_])lung([-_]|$)/.test(id)) found.push("Lung");
    if (/(^|[-_])gi([-_]|$)/.test(id)) found.push("Gastrointestinal");
    if (/(^|[-_])sarcoma([-_]|$)/.test(id)) found.push("Sarcoma");
    if (/(^|[-_])breast([-_]|$)/.test(id)) found.push("Breast");
    if (/(^|[-_])(hn|headneck)([-_]|$)/.test(id)) found.push("Head and Neck");
    return found;
  }

  function keywordGroups(indication) {
    const text = clean(indication?.description || indication?.indication || indication?.title).toLowerCase();
    const found = [];
    if (/\bbreast\b|her2-negative|her2-positive/.test(text)) found.push("Breast");
    if (/colorectal|colon cancer|rectal cancer|gastric|gastro[ -]?oesophageal|gastroesophageal|pancrea|hepatocellular|biliary|gastrointestinal neuroendocrine/.test(text)) found.push("Gastrointestinal");
    if (/ovarian|fallopian|peritoneal|cervical|endometrial|dysgerminoma/.test(text)) found.push("Gynaecology");
    if (/\bnsclc\b|\bsclc\b|lung cancer|small-cell lung|non-small-cell lung/.test(text)) found.push("Lung");
    if (/urothelial|bladder cancer|renal[ -]?cell|\brcc\b|prostate|testicular|extragonadal germ-cell/.test(text)) found.push("Genitourinary");
    if (/melanoma|merkel cell|cutaneous squamous|basal-cell|basal cell/.test(text)) found.push("Skin/Melanoma");
    if (/soft tissue sarcoma|liposarcoma|\bgist\b/.test(text)) found.push("Sarcoma");
    if (/head and neck|head-and-neck|\bhnscc\b/.test(text)) found.push("Head and Neck");
    if (/hodgkin|lymphoma|myeloma|leukaemia|leukemia/.test(text)) found.push("Haematology", "Lymphoma");
    return found;
  }

  function indicationGroups(indication, protocol) {
    const allowed = protocolGroups(protocol);
    const explicit = explicitIndicationGroups(indication);
    const inferred = explicit.length ? explicit : unique([...suffixGroups(indication), ...keywordGroups(indication)]);
    if (!allowed.length) return inferred;
    const withinProtocol = inferred.filter(group => allowed.includes(group));
    if (withinProtocol.length) return withinProtocol;
    return allowed.length === 1 ? allowed : [];
  }

  function allIndications(protocol) {
    return asArray(protocol?.indications).filter(item => item && clean(item.description));
  }

  function indicationsForTissue(protocol, tumourGroup) {
    const group = normaliseGroup(tumourGroup);
    const indications = allIndications(protocol);
    if (!group || group === "all") return indications;
    return indications.filter(indication => indicationGroups(indication, protocol).includes(group));
  }

  function metadataIndication(protocol) {
    return clean(protocol?.metadata?.indication);
  }

  function descriptionForTissue(protocol, tumourGroup, options = {}) {
    const scope = options.scope || "card";
    const group = normaliseGroup(tumourGroup);
    const groups = protocolGroups(protocol);
    const indications = allIndications(protocol);
    const shared = groups.length > 1;

    if (!group || group === "all") {
      if (shared) {
        const count = indications.length;
        return `Shared regimen with ${count || "multiple"} encoded indication${count === 1 ? "" : "s"} across ${groups.join(", ")}. Select a tumour site to display the relevant indication.`;
      }
      return metadataIndication(protocol) || indications[0]?.description || "Machine-readable NCCP regimen encoded for the SACTCheck protocol library.";
    }

    const relevant = indicationsForTissue(protocol, group);
    if (relevant.length === 1) return clean(relevant[0].description);
    if (relevant.length > 1) {
      if (scope === "assessment") return relevant.map(item => clean(item.description)).join(" ");
      const first = clean(relevant[0].description);
      const additional = relevant.length - 1;
      return `${first} ${additional} additional ${group} indication${additional === 1 ? " is" : "s are"} available; select the exact indication in the assessment.`;
    }

    if (!shared && metadataIndication(protocol)) return metadataIndication(protocol);
    if (groups.includes(group)) {
      return `A ${group} indication is linked to this shared regimen, but its tissue-specific description has not yet been encoded. Confirm the current official NCCP protocol.`;
    }
    return metadataIndication(protocol) || indications[0]?.description || "Machine-readable NCCP regimen encoded for the SACTCheck protocol library.";
  }

  function preferredIndicationId(protocol, tumourGroup) {
    const relevant = indicationsForTissue(protocol, tumourGroup);
    const first = relevant[0];
    return clean(first?.indication_id || first?.code || first?.id) || null;
  }

  function optionLabel(protocol, indication) {
    const groups = indicationGroups(indication, protocol);
    const prefix = protocolGroups(protocol).length > 1 && groups.length ? `[${groups.join(" / ")}] ` : "";
    return `${prefix}${clean(indication?.description)}`;
  }

  function activeTumourGroup() {
    return normaliseGroup(root.document?.getElementById("tumourFilter")?.value || "all");
  }

  root.SACTCheckProtocolContext = Object.freeze({
    version: "0.45.1",
    normaliseGroup,
    protocolGroups,
    indicationGroups,
    indicationsForTissue,
    descriptionForTissue,
    preferredIndicationId,
    optionLabel,
    activeTumourGroup
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
