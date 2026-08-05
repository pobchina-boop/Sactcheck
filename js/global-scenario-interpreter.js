/**
 * SACTCheck global clinical scenario interpreter.
 *
 * This module is a regimen-agnostic entry point only. It performs local,
 * deterministic catalogue matching and does not produce a clinical assessment.
 * The clinician must select an exact protocol before the existing constrained
 * in-regimen interpreter can extract confirmable structured values.
 */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SACTCheckGlobalScenarioInterpreter = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  const VERSION = "0.56.0";
  const MAX_MATCHES = 12;
  let latestMatches = [];
  let latestWarnings = [];

  const STOP_WORDS = new Set([
    "a", "an", "and", "are", "as", "at", "be", "but", "by", "cycle", "day",
    "for", "from", "has", "have", "i", "in", "is", "it", "my", "of", "on",
    "patient", "the", "their", "this", "to", "was", "what", "with", "should",
    "do", "due", "today", "tomorrow", "currently", "now", "metastatic"
  ]);

  const DISEASE_GROUPS = Object.freeze([
    { id: "colorectal", label: "Colorectal cancer", phrases: ["metastatic crc", "crc", "colorectal cancer", "colon cancer", "rectal cancer", "colorectal"], targets: ["colorectal", "colon", "rectal"] },
    { id: "breast", label: "Breast cancer", phrases: ["breast cancer", "breast"], targets: ["breast"] },
    { id: "lung", label: "Lung cancer", phrases: ["nsclc", "sclc", "lung cancer", "lung"], targets: ["lung", "nsclc", "sclc", "mesothelioma"] },
    { id: "ovarian", label: "Ovarian cancer", phrases: ["ovarian cancer", "ovary", "ovarian"], targets: ["ovarian", "fallopian", "peritoneal", "gynaecology"] },
    { id: "prostate", label: "Prostate cancer", phrases: ["prostate cancer", "prostate"], targets: ["prostate"] },
    { id: "urothelial", label: "Urothelial cancer", phrases: ["bladder cancer", "urothelial", "bladder"], targets: ["urothelial", "bladder", "genitourinary"] },
    { id: "renal", label: "Renal cancer", phrases: ["renal cell cancer", "renal cell carcinoma", "rcc", "kidney cancer"], targets: ["renal cell", "kidney", "genitourinary"] },
    { id: "melanoma", label: "Melanoma", phrases: ["melanoma"], targets: ["melanoma", "skin"] },
    { id: "head_neck", label: "Head and neck cancer", phrases: ["head and neck cancer", "head neck cancer", "hnscc"], targets: ["head and neck", "hnscc"] },
    { id: "sarcoma", label: "Sarcoma", phrases: ["sarcoma", "gist"], targets: ["sarcoma", "gist"] },
    { id: "neuro", label: "Neuro oncology", phrases: ["glioblastoma", "glioma", "brain tumour", "brain tumor"], targets: ["glioblastoma", "glioma", "neuro-oncology", "brain"] },
    { id: "myeloma", label: "Multiple myeloma", phrases: ["multiple myeloma", "myeloma", "plasma cell"], targets: ["myeloma", "plasma cell", "haematology"] },
    { id: "upper_gi", label: "Upper gastrointestinal cancer", phrases: ["gastric cancer", "oesophageal cancer", "esophageal cancer", "gastroesophageal", "upper gi"], targets: ["gastric", "oesophageal", "esophageal", "gastroesophageal"] },
    { id: "pancreas", label: "Pancreatic cancer", phrases: ["pancreatic cancer", "pancreas"], targets: ["pancreatic", "pancreas"] },
    { id: "hepatobiliary", label: "Hepatobiliary cancer", phrases: ["cholangiocarcinoma", "biliary cancer", "hepatocellular", "hcc"], targets: ["cholangiocarcinoma", "biliary", "hepatocellular", "liver"] }
  ]);

  const REGIMEN_GROUPS = Object.freeze([
    { id: "lonsurf", label: "Lonsurf", phrases: ["lonsurf", "trifluridine tipiracil", "trifluridine/tipiracil"], targets: ["lonsurf", "trifluridine", "tipiracil"] },
    { id: "bevacizumab", label: "Bevacizumab", phrases: ["avastin", "bevacizumab"], targets: ["avastin", "bevacizumab"] },
    { id: "carboplatin", label: "Carboplatin", phrases: ["carboplatin", "carbo"], targets: ["carboplatin", "paraplatin"] },
    { id: "cisplatin", label: "Cisplatin", phrases: ["cisplatin"], targets: ["cisplatin", "platinol"] },
    { id: "pemetrexed", label: "Pemetrexed", phrases: ["pemetrexed", "alimta"], targets: ["pemetrexed", "alimta"] },
    { id: "pld", label: "Pegylated liposomal doxorubicin", phrases: ["caelyx", "pld", "pegylated liposomal doxorubicin"], targets: ["caelyx", "pegylated liposomal doxorubicin", "pld"] },
    { id: "capecitabine", label: "Capecitabine", phrases: ["capecitabine", "xeloda"], targets: ["capecitabine", "xeloda"] },
    { id: "gemcitabine", label: "Gemcitabine", phrases: ["gemcitabine", "gemzar"], targets: ["gemcitabine", "gemzar"] },
    { id: "oxaliplatin", label: "Oxaliplatin", phrases: ["oxaliplatin", "eloxatin"], targets: ["oxaliplatin", "eloxatin"] },
    { id: "irinotecan", label: "Irinotecan", phrases: ["irinotecan", "campto"], targets: ["irinotecan", "campto"] },
    { id: "etoposide", label: "Etoposide", phrases: ["etoposide", "vepesid"], targets: ["etoposide", "vepesid"] },
    { id: "folfox", label: "FOLFOX", phrases: ["mfolfox6", "modified folfox 6", "modified folfox-6", "folfox6", "folfox"], targets: ["folfox", "fluorouracil", "oxaliplatin", "folinic"] },
    { id: "folfiri", label: "FOLFIRI", phrases: ["folfiri"], targets: ["folfiri", "irinotecan", "fluorouracil", "folinic"] },
    { id: "folfirinox", label: "FOLFIRINOX", phrases: ["modified folfirinox", "mfolfirinox", "folfirinox"], targets: ["folfirinox", "irinotecan", "oxaliplatin", "fluorouracil"] },
    { id: "capox", label: "CAPOX/XELOX", phrases: ["capox", "xelox"], targets: ["capox", "xelox", "capecitabine", "oxaliplatin"] },
    { id: "paclitaxel", label: "Paclitaxel", phrases: ["taxol", "paclitaxel"], targets: ["taxol", "paclitaxel"] },
    { id: "docetaxel", label: "Docetaxel", phrases: ["taxotere", "docetaxel"], targets: ["taxotere", "docetaxel"] },
    { id: "pembrolizumab", label: "Pembrolizumab", phrases: ["keytruda", "pembrolizumab", "pembro"], targets: ["keytruda", "pembrolizumab"] },
    { id: "nivolumab", label: "Nivolumab", phrases: ["opdivo", "nivolumab", "nivo"], targets: ["opdivo", "nivolumab"] },
    { id: "atezolizumab", label: "Atezolizumab", phrases: ["tecentriq", "atezolizumab", "atezo"], targets: ["tecentriq", "atezolizumab"] },
    { id: "durvalumab", label: "Durvalumab", phrases: ["imfinzi", "durvalumab"], targets: ["imfinzi", "durvalumab"] },
    { id: "trastuzumab", label: "Trastuzumab", phrases: ["herceptin", "trastuzumab"], targets: ["herceptin", "trastuzumab"] },
    { id: "tchp", label: "TCHP", phrases: ["tchp"], targets: ["tchp", "docetaxel", "carboplatin", "trastuzumab", "pertuzumab"] },
    { id: "ac", label: "AC", phrases: ["adriamycin cyclophosphamide", "doxorubicin cyclophosphamide", " ac regimen "], targets: ["doxorubicin", "cyclophosphamide"] },
    { id: "carboplatin_etoposide", label: "Carboplatin and etoposide", phrases: ["carbo etop", "carboplatin etoposide"], targets: ["carboplatin", "etoposide"] },
    { id: "gemcitabine_cisplatin", label: "Gemcitabine and cisplatin", phrases: ["gem cis", "gemcitabine cisplatin"], targets: ["gemcitabine", "cisplatin"] },
    { id: "abemaciclib", label: "Abemaciclib", phrases: ["verzenios", "abemaciclib"], targets: ["verzenios", "abemaciclib"] },
    { id: "olaparib", label: "Olaparib", phrases: ["lynparza", "olaparib"], targets: ["lynparza", "olaparib"] },
    { id: "lenalidomide", label: "Lenalidomide", phrases: ["revlimid", "lenalidomide"], targets: ["revlimid", "lenalidomide"] },
    { id: "daratumumab", label: "Daratumumab", phrases: ["darzalex", "daratumumab"], targets: ["darzalex", "daratumumab"] },
    { id: "bortezomib", label: "Bortezomib", phrases: ["velcade", "bortezomib"], targets: ["velcade", "bortezomib"] }
  ]);

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

  function normalise(value) {
    return ` ${String(value || "")
      .toLowerCase()
      .replace(/[®™]/g, "")
      .replace(/[×]/g, "x")
      .replace(/[–—]/g, "-")
      .replace(/[^a-z0-9+./-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()} `;
  }

  function includesPhrase(text, phrase) {
    const needle = normalise(phrase).trim();
    return needle && text.includes(` ${needle} `) || (needle.length > 4 && text.includes(needle));
  }

  function levenshtein(a, b) {
    const left = String(a || "");
    const right = String(b || "");
    const rows = Array.from({ length: left.length + 1 }, (_, index) => [index]);
    for (let column = 0; column <= right.length; column += 1) rows[0][column] = column;
    for (let row = 1; row <= left.length; row += 1) {
      for (let column = 1; column <= right.length; column += 1) {
        const cost = left[row - 1] === right[column - 1] ? 0 : 1;
        rows[row][column] = Math.min(rows[row - 1][column] + 1, rows[row][column - 1] + 1, rows[row - 1][column - 1] + cost);
      }
    }
    return rows[left.length][right.length];
  }

  function detectGroups(text, groups) {
    const words = normalise(text).trim().split(/\s+/).filter(Boolean);
    const detected = [];
    groups.forEach(group => {
      const exact = group.phrases.find(phrase => includesPhrase(text, phrase));
      if (exact) {
        detected.push({ ...group, matchedPhrase: exact, fuzzy: false });
        return;
      }
      const fuzzyCandidate = group.phrases
        .filter(phrase => /^[a-z]+$/i.test(phrase) && phrase.length >= 7)
        .flatMap(phrase => words.map(word => ({ phrase, word, distance: levenshtein(word, normalise(phrase).trim()) })))
        .filter(item => item.word.length >= 7 && item.distance <= (item.phrase.length >= 11 ? 2 : 1))
        .sort((a, b) => a.distance - b.distance)[0];
      if (fuzzyCandidate) detected.push({ ...group, matchedPhrase: fuzzyCandidate.phrase, observedPhrase: fuzzyCandidate.word, fuzzy: true });
    });
    return detected;
  }

  function detectIdentifiers(text) {
    const warnings = [];
    if (/\b(?:mrn|medical record|hospital number|dob|date of birth|pps|email|phone|mobile|address)\b/i.test(text) || /\b\d{7,}\b/.test(text)) {
      warnings.push("Possible patient-identifiable information detected. Remove names, record numbers, dates of birth and contact details before continuing.");
    }
    return warnings;
  }

  function protocolTitle(protocol) {
    return root.SACTCheckRegimenDisplayTitle?.forProtocol?.(protocol) || protocol?.metadata?.short_title || protocol?.metadata?.title || protocol?.protocol_id || "Protocol";
  }

  function protocolCode(protocol) {
    return protocol?.metadata?.nccp_regimen_code || protocol?.protocol_id || "";
  }

  function protocolTumours(protocol) {
    const metadata = protocol?.metadata || {};
    return [...new Set([
      ...asArray(metadata.tumour_groups),
      ...asArray(metadata.tumour_group)
    ].flatMap(value => String(value || "").split(",")).map(value => value.trim()).filter(Boolean))];
  }

  function protocolAliases(protocol) {
    return [
      ...asArray(protocol?.metadata?.common_trade_names),
      ...asArray(root.SACTCheckDrugAliases?.forProtocol?.(protocol))
    ].filter(Boolean);
  }

  function protocolSearchText(record) {
    const protocol = record?.protocol || record || {};
    const metadata = protocol.metadata || {};
    const components = asArray(protocol.regimen_components).flatMap(item => [item?.name, item?.drug]);
    const treatment = [
      ...asArray(protocol?.treatment?.drugs),
      protocol?.treatment?.drug,
      ...asArray(protocol?.treatment_phases).flatMap(phase => asArray(phase?.administration).map(item => item?.drug))
    ];
    return normalise([
      protocol.protocol_id,
      metadata.nccp_regimen_code,
      metadata.title,
      metadata.short_title,
      metadata.indication,
      metadata.treatment_context,
      ...asArray(metadata.drugs),
      ...protocolTumours(protocol),
      ...protocolAliases(protocol),
      ...components,
      ...treatment,
      record?.entry?.path
    ].filter(Boolean).join(" "));
  }

  function scenarioTokens(text) {
    return [...new Set(normalise(text).trim().split(/\s+/).filter(token =>
      token.length >= 4 &&
      !STOP_WORDS.has(token) &&
      !/^\d/.test(token) &&
      !["afebrile", "platelets", "neutrophils", "creatinine", "bilirubin", "grade", "anc", "ecog"].includes(token)
    ))];
  }

  function analyseScenario(textValue) {
    const text = normalise(textValue);
    const diseases = detectGroups(text, DISEASE_GROUPS);
    const regimens = detectGroups(text, REGIMEN_GROUPS);
    const codes = [...text.matchAll(/\bnccp\s*0*(\d{3,5})\b/gi)].map(match => match[1]);
    const preview = root.SACTCheckScenarioInterpreter?.preview?.(textValue) || { values: [], warnings: [] };
    const corrections = [...diseases, ...regimens]
      .filter(item => item.fuzzy)
      .map(item => `Interpreted “${item.observedPhrase}” as ${item.label}.`);
    return {
      text,
      diseases,
      regimens,
      codes: [...new Set(codes)],
      tokens: scenarioTokens(textValue),
      candidateValues: preview.values || [],
      corrections,
      warnings: [...new Set([...detectIdentifiers(textValue), ...(preview.warnings || [])])]
    };
  }

  function matchProtocols(textValue, records = []) {
    const analysis = analyseScenario(textValue);
    const results = [];

    for (const record of records || []) {
      const protocol = record?.protocol || record;
      if (!protocol) continue;
      const haystack = protocolSearchText(record);
      const reasons = [];
      let score = 0;

      const code = String(protocolCode(protocol));
      if (analysis.codes.some(item => code.replace(/^0+/, "").includes(item.replace(/^0+/, "")))) {
        score += 120;
        reasons.push(`NCCP ${code}`);
      }

      let regimenMatches = 0;
      const matchedRegimenIds = [];
      analysis.regimens.forEach(group => {
        if (group.targets.some(target => includesPhrase(haystack, target))) {
          regimenMatches += 1;
          matchedRegimenIds.push(group.id);
          score += group.targets.length > 2 ? 32 : 28;
          reasons.push(group.label);
        }
      });

      let diseaseMatches = 0;
      analysis.diseases.forEach(group => {
        if (group.targets.some(target => includesPhrase(haystack, target))) {
          diseaseMatches += 1;
          score += 18;
          reasons.push(group.label);
        }
      });

      const tokenHits = analysis.tokens.filter(token => haystack.includes(token));
      score += Math.min(tokenHits.length * 2, 18);
      if (!regimenMatches && tokenHits.length >= 2) score += 5;

      if (analysis.regimens.length && !regimenMatches) score -= 10;
      if (analysis.diseases.length && !diseaseMatches) score -= 8;
      if (score <= 0) continue;

      const confidence = score >= 70 || analysis.codes.length ? "Strong match" : score >= 32 ? "Likely match" : "Possible match";
      results.push({
        protocolId: protocol.protocol_id || record?.entry?.id || code,
        protocol,
        record,
        score,
        confidence,
        reasons: [...new Set(reasons)].slice(0, 4),
        title: protocolTitle(protocol),
        code,
        version: protocol?.metadata?.nccp_version || "",
        indication: protocol?.metadata?.indication || "",
        tumourGroups: protocolTumours(protocol),
        aliases: protocolAliases(protocol),
        unmatchedRegimens: analysis.regimens.filter(group => !matchedRegimenIds.includes(group.id)).map(group => group.label)
      });
    }

    results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
    const filtered = results.filter(item => item.score >= (analysis.regimens.length ? 18 : 12));
    const limit = analysis.regimens.length && !analysis.diseases.length ? MAX_MATCHES : 6;
    return { analysis, matches: filtered.slice(0, limit) };
  }

  function panel() {
    return typeof document !== "undefined" ? document.getElementById("globalScenarioInterpreter") : null;
  }

  function loadedRecords() {
    return root.SACTCheckProtocolLoader?.getLoadedProtocols?.() || root.SACTCHECK_PROTOCOLS || [];
  }

  function setStatus(message, type = "") {
    const status = panel()?.querySelector("[data-global-scenario-status]");
    if (!status) return;
    status.textContent = message;
    status.className = `global-scenario-status${type ? ` ${type}` : ""}`;
  }

  function contextMarkup(analysis) {
    const chips = [
      ...analysis.diseases.map(item => `<span>${escapeHtml(item.label)}</span>`),
      ...analysis.regimens.map(item => `<span>${escapeHtml(item.label)}</span>`)
    ];
    const detected = chips.length ? `<div class="global-scenario-context"><strong>Detected context</strong><div>${chips.join("")}</div></div>` : "";
    const corrections = analysis.corrections?.length
      ? `<div class="global-scenario-corrections">${analysis.corrections.map(item => `<p>${escapeHtml(item)}</p>`).join("")}</div>`
      : "";
    const candidates = analysis.candidateValues?.length
      ? `<div class="global-scenario-candidate-values"><strong>Candidate clinical information — not assessed yet</strong><div>${analysis.candidateValues.map(item => `<span><b>${escapeHtml(item.label)}</b>${escapeHtml(item.displayValue)}</span>`).join("")}</div><p>Potentially important clinical information was entered. Select the exact regimen to review its encoded protocol pathway.</p></div>`
      : "";
    return `${corrections}${detected}${candidates}`;
  }

  function groupedMatchMarkup(result, ambiguous) {
    const medicationOnly = result.analysis.regimens.length > 0 && result.analysis.diseases.length === 0;
    if (!medicationOnly) return `<div class="global-scenario-match-list">${result.matches.map((match, index) => matchMarkup(match, index, ambiguous)).join("")}</div>`;
    const groups = new Map();
    result.matches.forEach((match, index) => {
      const label = match.tumourGroups[0] || "Other protocols";
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push({ match, index });
    });
    return `<div class="global-scenario-grouped-matches">${[...groups.entries()].map(([label, items]) => `<section><h3>${escapeHtml(label)}</h3><div class="global-scenario-match-list">${items.map(item => matchMarkup(item.match, item.index, true)).join("")}</div></section>`).join("")}</div>`;
  }

  function matchMarkup(match, index, ambiguous) {
    const reasons = match.reasons.length ? match.reasons.join(" · ") : "Catalogue text match";
    const tumour = match.tumourGroups.join(" · ") || "Tumour group not specified";
    const unmatched = match.unmatchedRegimens?.length ? `<p class="global-scenario-unmatched"><strong>Not matched in this protocol:</strong> ${escapeHtml(match.unmatchedRegimens.join(" · "))}</p>` : "";
    return `<article class="global-scenario-match" data-global-match-index="${index}">
      <div class="global-scenario-match-head">
        <div><span class="global-scenario-confidence">${escapeHtml(match.confidence)}</span><h3>${escapeHtml(match.title)}</h3></div>
        <span class="global-scenario-code">NCCP ${escapeHtml(match.code)}${match.version ? ` · v${escapeHtml(match.version)}` : ""}</span>
      </div>
      <p class="global-scenario-tumour">${escapeHtml(tumour)}</p>
      <p>${escapeHtml(match.indication || "Review the official protocol indication before continuing.")}</p>
      <p class="global-scenario-reasons"><strong>Matched:</strong> ${escapeHtml(reasons)}</p>
      ${unmatched}
      <button class="btn${ambiguous ? " secondary" : ""}" type="button" data-global-select-protocol="${escapeHtml(match.protocolId)}">Select this regimen and continue</button>
    </article>`;
  }

  function renderResult(result) {
    const target = panel()?.querySelector("[data-global-scenario-results]");
    if (!target) return;
    latestMatches = result.matches;
    latestWarnings = result.analysis.warnings.slice();

    const warningHtml = latestWarnings.length
      ? `<div class="scenario-warnings">${latestWarnings.map(item => `<p>${escapeHtml(item)}</p>`).join("")}</div>`
      : "";
    const context = contextMarkup(result.analysis);

    if (!result.matches.length) {
      target.innerHTML = `${warningHtml}${context}<div class="global-scenario-empty"><strong>No reliable regimen match was identified.</strong><p>Add the tumour type, combination medicines or NCCP number, or select the exact protocol manually. Candidate clinical values remain unassessed.</p><button type="button" class="btn secondary" data-global-manual-search>Search the regimen library</button></div>`;
      setStatus("Exact regimen selection is required before assessment.", "warn");
      return;
    }

    const noCompleteMedicineMatch = result.analysis.regimens.length > 1 && !result.matches.some(match => !match.unmatchedRegimens?.length);
    const ambiguous = noCompleteMedicineMatch || (result.matches.length > 1 && (result.matches[0].score - result.matches[1].score) < 8);
    const heading = noCompleteMedicineMatch
      ? "No single protocol matched every medicine mentioned. Select the exact regimen or choose it manually."
      : ambiguous
        ? "Several possible protocols were identified. Select the exact regimen."
        : "Select and confirm the exact regimen before structured extraction.";
    target.innerHTML = `${warningHtml}${context}<div class="global-scenario-result-head"><strong>${escapeHtml(heading)}</strong><p>No protocol assessment is produced at this stage.</p></div>${groupedMatchMarkup(result, ambiguous)}<button type="button" class="btn ghost" data-global-manual-search>Choose a different regimen from the library</button>`;
    const statusMessage = result.analysis.regimens.length && !result.analysis.diseases.length
      ? `${result.matches.length} possible protocols across multiple disease groups. Add the tumour type or select the exact regimen.`
      : `${result.matches.length} possible protocol match${result.matches.length === 1 ? "" : "es"}.`;
    setStatus(statusMessage, ambiguous || result.matches.length > 1 ? "warn" : "good");
  }

  function findMatches() {
    const target = panel();
    const text = target?.querySelector("#globalScenarioText")?.value || "";
    if (!text.trim()) {
      latestMatches = [];
      const results = target?.querySelector("[data-global-scenario-results]");
      if (results) results.innerHTML = '<p class="subtle">Enter a de-identified clinical scenario first.</p>';
      setStatus("Enter a scenario to search the protocol catalogue.", "warn");
      return { analysis: analyseScenario(""), matches: [] };
    }
    const records = loadedRecords();
    if (!records.length) {
      setStatus("The regimen catalogue is still loading. Try again when loading is complete.", "warn");
      return { analysis: analyseScenario(text), matches: [] };
    }
    const result = matchProtocols(text, records);
    renderResult(result);
    return result;
  }

  function scenarioText() {
    return panel()?.querySelector("#globalScenarioText")?.value || "";
  }

  function selectProtocol(protocolId) {
    const match = latestMatches.find(item => String(item.protocolId) === String(protocolId));
    const protocol = match?.protocol || root.SACTCheckProtocolLoader?.getProtocolById?.(protocolId);
    if (!protocol) {
      setStatus("The selected protocol is not available. Reload the catalogue and select it again.", "warn");
      return false;
    }
    const currentIdentifierWarnings = detectIdentifiers(scenarioText());
    if (currentIdentifierWarnings.length) {
      latestWarnings = currentIdentifierWarnings;
      setStatus("Remove possible patient identifiers before opening the regimen.", "warn");
      panel()?.querySelector("#globalScenarioText")?.focus();
      return false;
    }

    try {
      root.SACTCheckProtocolLoader?.launchProtocol?.(protocolId);
      root.SACTCheckScenarioInterpreter?.open?.(protocol, {
        draftText: scenarioText(),
        autoParse: true,
        source: "global"
      });
      return true;
    } catch (error) {
      setStatus(error?.message || "The selected protocol could not be opened.", "warn");
      return false;
    }
  }

  function manualSearch() {
    const analysis = analyseScenario(scenarioText());
    const search = document.getElementById("regimenSearch");
    const bestTerm = analysis.regimens[0]?.label || analysis.diseases[0]?.label || "";
    if (search && bestTerm) {
      search.value = bestTerm;
      search.dispatchEvent(new Event("input", { bubbles: true }));
    }
    root.showScreen?.("libraryScreen");
    search?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    search?.focus?.();
  }

  function clear() {
    const target = panel();
    const textarea = target?.querySelector("#globalScenarioText");
    if (textarea) textarea.value = "";
    latestMatches = [];
    latestWarnings = [];
    const results = target?.querySelector("[data-global-scenario-results]");
    if (results) results.innerHTML = '<p class="subtle">No scenario interpreted yet.</p>';
    setStatus(loadedRecords().length ? "Catalogue ready." : "Loading regimen catalogue…");
  }

  function focus() {
    const target = panel();
    target?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    target?.querySelector("#globalScenarioText")?.focus?.();
  }

  function bind() {
    const target = panel();
    if (!target || target.dataset.globalScenarioBound === "true") return;
    target.dataset.globalScenarioBound = "true";
    target.addEventListener("click", event => {
      if (event.target.closest("[data-global-scenario-find]")) { findMatches(); return; }
      if (event.target.closest("[data-global-scenario-clear]")) { clear(); return; }
      const select = event.target.closest("[data-global-select-protocol]");
      if (select) { selectProtocol(select.dataset.globalSelectProtocol); return; }
      if (event.target.closest("[data-global-manual-search]")) manualSearch();
    });
    const textarea = target.querySelector("#globalScenarioText");
    textarea?.addEventListener("keydown", event => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") findMatches();
    });
    textarea?.addEventListener("input", () => {
      if (!latestMatches.length) return;
      latestMatches = [];
      latestWarnings = [];
      const results = target.querySelector("[data-global-scenario-results]");
      if (results) results.innerHTML = '<p class="subtle">Scenario changed. Find matching regimen again before continuing.</p>';
      setStatus("Scenario changed. Run protocol matching again.", "warn");
    });
    document.querySelectorAll("[data-open-global-scenario]").forEach(button => button.addEventListener("click", focus));
  }

  function updateCatalogueStatus() {
    const status = root.SACTCHECK_PROTOCOL_LOAD_STATUS;
    if (status?.loaded) setStatus(`${status.loaded} protocols available for matching.`, "good");
    else setStatus("Loading regimen catalogue…");
  }

  function init() {
    bind();
    updateCatalogueStatus();
    root.addEventListener?.("sactcheck:protocols-loaded", updateCatalogueStatus);
    root.addEventListener?.("sactcheck:local-protocol-added", updateCatalogueStatus);
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  }

  return Object.freeze({
    version: VERSION,
    analyseScenario,
    levenshtein,
    matchProtocols,
    findMatches,
    selectProtocol,
    focus,
    clear
  });
});
