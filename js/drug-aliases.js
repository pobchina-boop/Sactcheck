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
    { terms: ["fluorouracil"], aliases: ["5-FU"] },
    { terms: ["methotrexate"], aliases: ["MTX"] },
    { terms: ["vandetanib"], aliases: ["Caprelsa"] },
    { terms: ["cobimetinib"], aliases: ["Cotellic"] },
    { terms: ["vemurafenib"], aliases: ["Zelboraf"] },
    { terms: ["dabrafenib"], aliases: ["Tafinlar"] },
    { terms: ["encorafenib"], aliases: ["Braftovi"] },
    { terms: ["binimetinib"], aliases: ["Mektovi"] },
    { terms: ["trametinib"], aliases: ["Mekinist"] },
    { terms: ["vismodegib"], aliases: ["Erivedge"] },
    { terms: ["avelumab"], aliases: ["Bavencio"] },
    { terms: ["bacillus calmette-guérin"], aliases: ["BCG"] },
    { terms: ["erdafitinib"], aliases: ["Balversa"] },
    { terms: ["enfortumab vedotin"], aliases: ["Padcev"] },
    { terms: ["axitinib"], aliases: ["Inlyta"] },
    { terms: ["cabozantinib"], aliases: ["Cabometyx"] },
    { terms: ["temsirolimus"], aliases: ["Torisel"] },
    { terms: ["tivozanib"], aliases: ["Fotivda"] },
    { terms: ["cemiplimab"], aliases: ["Libtayo"] },
    { terms: ["dostarlimab"], aliases: ["Jemperli"] },
    { terms: ["dactinomycin"], aliases: ["Cosmegen"] },
    { terms: ["rucaparib"], aliases: ["Rubraca"] },
    { terms: ["lomustine"], aliases: ["CCNU"] },
    { terms: ["procarbazine"], aliases: ["Matulane"] },
    { terms: ["dacarbazine"], aliases: ["DTIC"] },
    { terms: ["ifosfamide"], aliases: ["Mitoxana"] },
    { terms: ["imatinib"], aliases: ["Glivec"] },
    { terms: ["mifamurtide"], aliases: ["Mepact"] },
    { terms: ["pazopanib"], aliases: ["Votrient"] },
    { terms: ["pegylated liposomal doxorubicin"], aliases: ["Caelyx"] },
    { terms: ["sunitinib"], aliases: ["Sutent"] },
    { terms: ["trabectedin"], aliases: ["Yondelis"] },
    { terms: ["vinblastine"], aliases: ["Velbe"] },
    { terms: ["vincristine"], aliases: ["Oncovin"] },
    { terms: ["cyclophosphamide"], aliases: ["Endoxan"] },
    { terms: ["afatinib"], aliases: ["Giotrif"] },
    { terms: ["alectinib"], aliases: ["Alecensa"] },
    { terms: ["brigatinib"], aliases: ["Alunbrig"] },
    { terms: ["ceritinib"], aliases: ["Zykadia"] },
    { terms: ["crizotinib"], aliases: ["Xalkori"] },
    { terms: ["dacomitinib"], aliases: ["Vizimpro"] },
    { terms: ["entrectinib"], aliases: ["Rozlytrek"] },
    { terms: ["erlotinib"], aliases: ["Tarceva"] },
    { terms: ["gefitinib"], aliases: ["Iressa"] },
    { terms: ["lorlatinib"], aliases: ["Lorviqua"] },
    { terms: ["nintedanib"], aliases: ["Vargatef"] },
    { terms: ["osimertinib"], aliases: ["Tagrisso"] },
    { terms: ["tepotinib"], aliases: ["Tepmetko"] },
    { terms: ["serplulimab"], aliases: ["Hetronifly"] },
    { terms: ["niraparib/abiraterone", "niraparib and abiraterone", "akeega"], aliases: ["Akeega"], suppress: ["niraparib", "abiraterone"] },
    { terms: ["abiraterone"], aliases: ["Zytiga"] },
    { terms: ["apalutamide"], aliases: ["Erleada"] },
    { terms: ["bicalutamide"], aliases: ["Casodex"] },
    { terms: ["cabazitaxel"], aliases: ["Jevtana"] },
    { terms: ["darolutamide"], aliases: ["Nubeqa"] },
    { terms: ["degarelix"], aliases: ["Firmagon"] },
    { terms: ["enzalutamide"], aliases: ["Xtandi"] },
    { terms: ["goserelin"], aliases: ["Zoladex"] },
    { terms: ["leuprorelin"], aliases: ["Prostap", "Eligard"] },
    { terms: ["radium-223", "radium 223"], aliases: ["Xofigo"] },
    { terms: ["relugolix"], aliases: ["Orgovyx"] },
    { terms: ["triptorelin"], aliases: ["Decapeptyl"] },
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
    { terms: ["cetuximab"], aliases: ["Erbitux"] },
    { terms: ["ipilimumab"], aliases: ["Yervoy"] },
    { terms: ["fruquintinib"], aliases: ["Fruzaqla"] },
    { terms: ["ivosidenib"], aliases: ["Tibsovo"] },
    { terms: ["lenvatinib"], aliases: ["Lenvima"] },
    { terms: ["lutetium-177 oxodotreotide", "lutetium (177lu) oxodotreotide", "lutathera"], aliases: ["Lutathera"] },
    { terms: ["pemigatinib"], aliases: ["Pemazyre"] },
    { terms: ["sorafenib"], aliases: ["Nexavar"] },
    { terms: ["tegafur/gimeracil/oteracil", "s-1", "teysuno"], aliases: ["Teysuno"] },
    { terms: ["tislelizumab"], aliases: ["Tevimbra"] },
    { terms: ["carboplatin"], aliases: ["Paraplatin"] },
    { terms: ["cisplatin"], aliases: ["Platinol"] },
    { terms: ["epirubicin"], aliases: ["Pharmorubicin"] },
    { terms: ["temozolomide"], aliases: ["Temodal"] },
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
      protocol?.file_name,
      ...asArray(protocol?.treatment_phases).flatMap(phase =>
        asArray(phase?.administration).map(item => item?.drug)
      ),
      ...asArray(protocol?.treatment?.drugs),
      protocol?.treatment?.drug,
      ...asArray(protocol?.regimen_components).map(item => item?.drug || item?.name),
      ...asArray(metadata.drugs)
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
    version: "0.46.0",
    entries: ENTRIES,
    forProtocol,
    searchText
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
