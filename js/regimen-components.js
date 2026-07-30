/**
 * Regimen component presentation helpers.
 *
 * Components are taken from structured protocol schedules first. A small
 * acronym registry is used only where the regimen name itself is the accepted
 * component shorthand. This module changes card presentation only.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SACTCheckRegimenComponents = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "0.51.0";
  const DISPLAY_NAMES = Object.freeze({"bolus_5fu": "Fluorouracil bolus", "infusional_5fu": "Fluorouracil infusion", "fluorouracil_infusion": "Fluorouracil infusion", "5fu": "Fluorouracil", "5_fu": "Fluorouracil", "folinic_acid": "Folinic acid", "leucovorin": "Folinic acid", "nab-paclitaxel": "Nab-paclitaxel", "pegylated_liposomal_doxorubicin": "Pegylated liposomal doxorubicin", "trastuzumab_emtansine": "Trastuzumab emtansine", "trastuzumab_deruxtecan": "Trastuzumab deruxtecan", "daratumumab_sc": "Daratumumab SC", "bortezomib_sc": "Bortezomib", "cyclophosphamide_po": "Cyclophosphamide", "all_cytotoxic_components": "All cytotoxic components", "all_components": "All components"});
  const KNOWN_COMPONENTS = Object.freeze(["pertuzumab/trastuzumab (Phesgo®)", "pegylated liposomal doxorubicin", "pertuzumab/trastuzumab (Phesgo)", "pertuzumab and trastuzumab", "trastuzumab deruxtecan", "trifluridine_tipiracil", "chemotherapy backbone", "fluorouracil_infusion", "sacituzumab govitecan", "trastuzumab emtansine", "combination regimen", "enfortumab vedotin", "fluorouracil_bolus", "niraparib tablets", "cyclophosphamide", "Cyclophosphamide", "zoledronic acid", "infusional_5fu", "nab-paclitaxel", "Dexamethasone", "pembrolizumab", "whole_regimen", "atezolizumab", "capecitabine", "fluorouracil", "folinic_acid", "Lenalidomide", "methotrexate", "Pomalidomide", "Prednisolone", "procarbazine", "temozolomide", "temsirolimus", "tremelimumab", "abemaciclib", "aflibercept", "bevacizumab", "carboplatin", "dacarbazine", "Daratumumab", "doxorubicin", "erdafitinib", "gemcitabine", "oxaliplatin", "palbociclib", "panitumumab", "regorafenib", "talazoparib", "trabectedin", "trastuzumab", "vinblastine", "vincristine", "vinorelbine", "Bortezomib", "durvalumab", "ifosfamide", "ipilimumab", "irinotecan", "lenvatinib", "paclitaxel", "pemetrexed", "pertuzumab", "ribociclib", "vandetanib", "vismodegib", "bleomycin", "bolus_5fu", "cetuximab", "cisplatin", "docetaxel", "etoposide", "lapatinib", "lomustine", "Melphalan", "neratinib", "niraparib", "nivolumab", "pazopanib", "tamoxifen", "topotecan", "tucatinib", "eribulin", "imatinib", "olaparib", "lonsurf", "BCG"]);
  const ACRONYMS = Object.freeze([
    { pattern: /\bCyBorD\b/i, components: ["Cyclophosphamide", "Bortezomib", "Dexamethasone"] },
    { pattern: /\bRVD(?:-Lite)?\b/i, components: ["Bortezomib", "Lenalidomide", "Dexamethasone"] },
    { pattern: /\bPVD\b/i, components: ["Pomalidomide", "Bortezomib", "Dexamethasone"] },
    { pattern: /\bFOLFIRINOX\b/i, components: ["Oxaliplatin", "Irinotecan", "Folinic acid", "Fluorouracil"] },
    { pattern: /\bFOLFOXIRI\b/i, components: ["Oxaliplatin", "Irinotecan", "Folinic acid", "Fluorouracil"] },
    { pattern: /\b(?:modified\s+)?FOLFOX(?:-?4|-?6)?\b/i, components: ["Oxaliplatin", "Folinic acid", "Fluorouracil"] },
    { pattern: /\bFOLFIRI\b/i, components: ["Irinotecan", "Folinic acid", "Fluorouracil"] },
    { pattern: /\b(?:XELOX|CAPOX)\b/i, components: ["Capecitabine", "Oxaliplatin"] },
    { pattern: /\bTCHP\b/i, components: ["Docetaxel", "Carboplatin", "Trastuzumab", "Pertuzumab"] },
    { pattern: /\bTCH\b/i, components: ["Docetaxel", "Carboplatin", "Trastuzumab"] },
    { pattern: /\bAC-?T\b/i, components: ["Doxorubicin", "Cyclophosphamide", "Paclitaxel"] },
    { pattern: /\bFEC\d*\b/i, components: ["Fluorouracil", "Epirubicin", "Cyclophosphamide"] },
    { pattern: /\bCMF\b/i, components: ["Cyclophosphamide", "Methotrexate", "Fluorouracil"] },
    { pattern: /\bBEP\b/i, components: ["Bleomycin", "Etoposide", "Cisplatin"] },
    { pattern: /\bABVD\b/i, components: ["Doxorubicin", "Bleomycin", "Vinblastine", "Dacarbazine"] },
    { pattern: /\bR-?CHOP\b/i, components: ["Rituximab", "Cyclophosphamide", "Doxorubicin", "Vincristine", "Prednisolone"] }
  ]);

  function asArray(value) {
    if (Array.isArray(value)) return value;
    if (value === undefined || value === null || value === "") return [];
    return [value];
  }

  function clean(value) {
    return String(value ?? "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  }

  function displayName(value) {
    const raw = String(value ?? "").trim();
    if (!raw) return "";
    const mapped = DISPLAY_NAMES[raw.toLowerCase()];
    if (mapped) return mapped;
    const text = clean(raw);
    return text.replace(/\b\w/g, letter => letter.toUpperCase())
      .replace(/\bSc\b/g, "SC").replace(/\bIv\b/g, "IV").replace(/\bPo\b/g, "PO")
      .replace(/\bMg\b/g, "mg").replace(/\bFu\b/g, "FU");
  }

  function unique(values) {
    const seen = new Set();
    return values.filter(value => {
      const key = clean(value).toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function structured(protocol) {
    const values = [];
    asArray(protocol?.treatment?.components).forEach(item => values.push(item?.drug || item?.name || item));
    asArray(protocol?.regimen_components).forEach(item => values.push(item?.drug || item?.name || item));
    asArray(protocol?.metadata?.drugs).forEach(item => values.push(item?.drug || item?.name || item));
    asArray(protocol?.treatment_phases).forEach(phase => {
      asArray(phase?.administration).forEach(item => values.push(item?.drug || item?.name));
    });
    return unique(values.filter(Boolean).map(displayName));
  }

  function acronym(protocol) {
    const text = [protocol?.metadata?.title, protocol?.metadata?.short_title].filter(Boolean).join(" ");
    const match = ACRONYMS.find(item => item.pattern.test(text));
    return match ? match.components.slice() : [];
  }

  function titleComponents(protocol) {
    const text = [protocol?.metadata?.title, protocol?.metadata?.short_title].filter(Boolean).join(" ").toLowerCase();
    if (!text) return [];
    const matched = [];
    KNOWN_COMPONENTS.forEach(component => {
      const raw = String(component);
      const variants = unique([raw, clean(raw), displayName(raw)]).map(item => item.toLowerCase());
      if (variants.some(variant => variant.length >= 4 && text.includes(variant))) matched.push(displayName(raw));
    });
    // Prefer the longer named medicine when a component is contained in it,
    // for example trastuzumab deruxtecan rather than trastuzumab.
    return unique(matched).filter(item => !matched.some(other => other !== item && other.toLowerCase().includes(item.toLowerCase())));
  }

  function forProtocol(protocol) {
    const fromSchedule = structured(protocol);
    const fromAcronym = acronym(protocol);
    if (fromSchedule.length >= 2) return fromSchedule;
    if (fromAcronym.length >= 2) return fromAcronym;
    const fromTitle = titleComponents(protocol);
    if (fromTitle.length >= 2) return fromTitle;
    return fromSchedule.length ? fromSchedule : fromTitle;
  }

  function cardComponents(protocol) {
    const values = forProtocol(protocol);
    return values.length >= 2 ? values : [];
  }

  return Object.freeze({ version: VERSION, displayName, forProtocol, cardComponents });
});
