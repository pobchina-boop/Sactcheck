/**
 * SACTCheck phase-aware regimen display titles.
 *
 * The authoritative NCCP title remains in protocol metadata and the official
 * PDF. This helper changes only the clinician-facing card and assessment title
 * so that the phase being assessed is visible first.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SACTCheckRegimenDisplayTitle = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "0.52.5";
  const PHASE_FIRST_TITLES = Object.freeze({
    "00260": "Weekly paclitaxel (post AC)",
    "00278": "Paclitaxel q14d (post dose-dense AC)",
    "00316": "Paclitaxel q14d + trastuzumab (post dose-dense AC)",
    "00432": "Weekly paclitaxel + trastuzumab (post AC)",
    "00433": "Weekly paclitaxel + trastuzumab (post dose-dense AC)",
    "00485": "Weekly paclitaxel (post dose-dense AC)",
    "00745": "Weekly paclitaxel + trastuzumab q21d (post dose-dense AC)",
    "00348": "Dose-dense AC (post carboplatin + weekly paclitaxel)",
    "00734": "Dose-dense AC (post weekly carboplatin + paclitaxel)"
  });

  function codeFor(protocol) {
    return String(protocol?.metadata?.nccp_regimen_code || protocol?.protocol_id || "")
      .replace(/^NCCP[-_ ]?/i, "")
      .match(/\d{5}/)?.[0] || "";
  }

  function fallback(protocol) {
    return String(protocol?.metadata?.short_title || protocol?.metadata?.title || protocol?.file_name || "Unnamed protocol");
  }

  function forProtocol(protocol) {
    return PHASE_FIRST_TITLES[codeFor(protocol)] || fallback(protocol);
  }

  return Object.freeze({
    version: VERSION,
    forProtocol,
    codeFor,
    phaseFirstTitles: PHASE_FIRST_TITLES
  });
});
