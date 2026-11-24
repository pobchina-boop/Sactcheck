/** SACTCheck v0.48.4 oral anti-cancer medicine classification. */
(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SACTCheckOralMedicine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const FILTER_VALUE = "oral_anti_cancer_medicines";
  const LABEL = "Oral anti-cancer medicine";
  const SEARCH_TERMS = "oral anti-cancer medicine oral anticancer medicine oral SACT OAM OACM";

  // Medicines in the current adult solid-tumour catalogue that are ordinarily
  // administered orally. Route-sensitive medicines such as etoposide,
  // vinorelbine, cyclophosphamide and methotrexate are intentionally omitted;
  // those require explicit protocol wording or route metadata.
  const ORAL_ANTICANCER_DRUGS = Object.freeze([
    "abemaciclib", "abiraterone", "afatinib", "alectinib", "anastrozole",
    "apalutamide", "axitinib", "bicalutamide", "binimetinib", "brigatinib",
    "cabozantinib", "capecitabine", "ceritinib", "cobimetinib", "crizotinib",
    "dabrafenib", "dacomitinib", "darolutamide", "encorafenib", "entrectinib",
    "enzalutamide", "erdafitinib", "erlotinib", "everolimus", "exemestane",
    "fruquintinib", "gefitinib", "imatinib", "ivosidenib", "lapatinib",
    "larotrectinib", "lenvatinib", "letrozole", "lomustine", "lorlatinib",
    "neratinib", "nintedanib", "niraparib", "olaparib", "osimertinib",
    "palbociclib", "pazopanib", "pemigatinib", "procarbazine", "regorafenib",
    "relugolix", "ribociclib", "rucaparib", "sorafenib", "sunitinib",
    "talazoparib", "tamoxifen", "tegafur", "temozolomide", "tepotinib",
    "tipiracil", "tivozanib", "trametinib", "trifluridine", "tucatinib",
    "vandetanib", "vemurafenib", "vismodegib"
  ]);

  function asArray(value) {
    if (value === undefined || value === null || value === "") return [];
    return Array.isArray(value) ? value : [value];
  }

  function normalise(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[®™]/g, "")
      .replace(/[‐‑‒–—−/_,.;:()[\]{}+-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function routeValues(protocol) {
    const metadata = protocol?.metadata || {};
    const treatment = protocol?.treatment || {};
    return [
      ...asArray(metadata.administration_route),
      ...asArray(metadata.route),
      ...asArray(treatment.route),
      ...asArray(treatment.administration_route),
      ...asArray(treatment.starting_dose?.route),
      ...asArray(treatment.dose?.route),
      ...asArray(treatment.components).flatMap(component => asArray(component?.route || component?.administration_route))
    ].map(normalise).filter(Boolean);
  }

  function drugText(protocol) {
    const metadata = protocol?.metadata || {};
    const treatment = protocol?.treatment || {};
    return normalise([
      ...asArray(metadata.drugs),
      ...asArray(treatment.drugs),
      ...asArray(treatment.drug),
      ...asArray(treatment.components).flatMap(component => [component?.drug, component?.name]),
      metadata.title,
      metadata.short_title
    ].filter(Boolean).join(" "));
  }

  function hasNamedOralDrug(protocol) {
    const text = ` ${drugText(protocol)} `;
    return ORAL_ANTICANCER_DRUGS.some(drug => text.includes(` ${normalise(drug)} `));
  }

  function classify(protocol) {
    const metadata = protocol?.metadata || {};
    const treatment = protocol?.treatment || {};
    const classes = asArray(metadata.treatment_class).map(normalise);
    const title = normalise(`${metadata.title || ""} ${metadata.short_title || ""} ${treatment.formulation || ""}`);
    const routes = routeValues(protocol);
    const hasNonOralRoute = routes.some(route => /\b(iv|intravenous|subcutaneous|intramuscular|intravesical|infusion)\b/.test(route));
    const allKnownRoutesOral = routes.length > 0 && !hasNonOralRoute && routes.some(route => /\b(oral|po|p o)\b/.test(route));
    const oralClass = classes.some(value => value.includes("oral_targeted_therapy") || value === "oral_sact" || value === "oral_chemotherapy");
    const oralFormulation = /\b(oral|tablet|tablets|capsule|capsules)\b/.test(title);
    const namedOralDrug = hasNamedOralDrug(protocol);
    const hasOral = Boolean(oralClass || oralFormulation || namedOralDrug || allKnownRoutesOral);
    return Object.freeze({
      hasOral,
      filterValue: FILTER_VALUE,
      label: LABEL,
      searchTerms: hasOral ? SEARCH_TERMS : "",
      evidence: Object.freeze({ oralClass, oralFormulation, namedOralDrug, allKnownRoutesOral })
    });
  }

  return Object.freeze({
    version: "0.48.4",
    FILTER_VALUE,
    LABEL,
    SEARCH_TERMS,
    ORAL_ANTICANCER_DRUGS,
    classify
  });
});
