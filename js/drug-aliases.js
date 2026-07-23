/**
 * SACTCheck common/trade-name alias registry.
 *
 * The official NCCP generic regimen title remains authoritative. These aliases
 * improve catalogue recognition and search only; they do not identify the
 * dispensed manufacturer or replace product-level pharmacy verification.
 */
(function (root) {
  "use strict";

  const ENTRIES = Object.freeze([
    { terms: ["pegylated liposomal doxorubicin", "pld 50"], aliases: ["Caelyx", "PLD"], suppress: ["doxorubicin"] },
    { terms: ["trastuzumab deruxtecan"], aliases: ["Enhertu"], suppress: ["trastuzumab"] },
    { terms: ["trastuzumab emtansine", "t-dm1"], aliases: ["Kadcyla", "T-DM1"], suppress: ["trastuzumab"] },
    { terms: ["sacituzumab govitecan"], aliases: ["Trodelvy"] },
    { terms: ["pertuzumab/trastuzumab (phesgo", "phesgo"], aliases: ["Phesgo"], suppress: ["pertuzumab", "trastuzumab"] },
    { terms: ["nab-paclitaxel", "nab paclitaxel"], aliases: ["Abraxane"], suppress: ["paclitaxel"] },
    { terms: ["palbociclib"], aliases: ["Ibrance"] },
    { terms: ["ribociclib"], aliases: ["Kisqali"] },
    { terms: ["abemaciclib"], aliases: ["Verzenios"] },
    { terms: ["neratinib"], aliases: ["Nerlynx"] },
    { terms: ["tucatinib"], aliases: ["Tukysa"] },
    { terms: ["lapatinib"], aliases: ["Tyverb"] },
    { terms: ["talazoparib"], aliases: ["Talzenna"] },
    { terms: ["olaparib"], aliases: ["Lynparza"] },
    { terms: ["niraparib"], aliases: ["Zejula"] },
    { terms: ["regorafenib"], aliases: ["Stivarga"] },
    { terms: ["trifluridine_tipiracil", "trifluridine tipiracil", "lonsurf"], aliases: ["Lonsurf"] },
    { terms: ["aflibercept"], aliases: ["Zaltrap"] },
    { terms: ["bevacizumab"], aliases: ["Avastin"] },
    { terms: ["pembrolizumab"], aliases: ["Keytruda"] },
    { terms: ["nivolumab"], aliases: ["Opdivo"] },
    { terms: ["atezolizumab"], aliases: ["Tecentriq"] },
    { terms: ["durvalumab"], aliases: ["Imfinzi"] },
    { terms: ["tremelimumab"], aliases: ["Imjudo"] },
    { terms: ["panitumumab"], aliases: ["Vectibix"] },
    { terms: ["pertuzumab"], aliases: ["Perjeta"] },
    { terms: ["trastuzumab"], aliases: ["Herceptin"] },
    { terms: ["zoledronic acid"], aliases: ["Zometa"] },
    { terms: ["anastrozole"], aliases: ["Arimidex"] },
    { terms: ["letrozole"], aliases: ["Femara"] },
    { terms: ["exemestane"], aliases: ["Aromasin"] },
    { terms: ["fulvestrant"], aliases: ["Faslodex"] },
    { terms: ["tamoxifen"], aliases: ["Nolvadex"] },
    { terms: ["everolimus"], aliases: ["Afinitor"] },
    { terms: ["capecitabine"], aliases: ["Xeloda"] },
    { terms: ["docetaxel"], aliases: ["Taxotere"] },
    { terms: ["paclitaxel"], aliases: ["Taxol"] },
    { terms: ["vinorelbine"], aliases: ["Navelbine"] },
    { terms: ["eribulin"], aliases: ["Halaven"] },
    { terms: ["pemetrexed"], aliases: ["Alimta"] },
    { terms: ["gemcitabine"], aliases: ["Gemzar"] },
    { terms: ["irinotecan"], aliases: ["Campto"] },
    { terms: ["oxaliplatin"], aliases: ["Eloxatin"] },
    { terms: ["etoposide"], aliases: ["Vepesid"] },
    { terms: ["doxorubicin"], aliases: ["Adriamycin"] }
  ]);

  function asArray(value) {
    if (value === undefined || value === null) return [];
    return Array.isArray(value) ? value : [value];
  }

  function protocolText(protocol) {
    const metadata = protocol?.metadata || {};
    const values = [
      metadata.title,
      metadata.short_title,
      metadata.indication,
      protocol?.file_name,
      ...asArray(protocol?.indications).map(item => item?.description),
      ...asArray(protocol?.treatment_phases).flatMap(phase =>
        asArray(phase?.administration).map(item => item?.drug)
      ),
      protocol?.treatment?.drug
    ];
    return values.filter(Boolean).join(" ").toLowerCase();
  }

  function unique(values) {
    return [...new Set(values.filter(Boolean))];
  }

  function forProtocol(protocol) {
    const text = protocolText(protocol);
    const matched = ENTRIES.filter(entry => entry.terms.some(term => text.includes(term)));
    const suppressedTerms = unique(matched.flatMap(entry => entry.suppress || []));
    const aliases = [];
    matched.forEach(entry => {
      const isSuppressed = entry.terms.some(term => suppressedTerms.includes(term)) &&
        !entry.suppress?.length;
      if (!isSuppressed) aliases.push(...entry.aliases);
    });
    return unique(aliases);
  }

  function searchText(protocol) {
    return forProtocol(protocol).join(" ");
  }

  root.SACTCheckDrugAliases = Object.freeze({
    version: "0.37.2",
    entries: ENTRIES,
    forProtocol,
    searchText
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
