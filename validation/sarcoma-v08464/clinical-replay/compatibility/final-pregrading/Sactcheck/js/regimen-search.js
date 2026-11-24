/**
 * SACTCheck regimen-library search intelligence.
 *
 * Provides oncology-aware alias normalisation, ranked matching, NCCP-number
 * resolution and conservative typo tolerance without changing canonical
 * protocol titles or clinical content.
 */
(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SACTCheckRegimenSearch = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const ALIAS_RULES = Object.freeze([
    // Fluoropyrimidines and folates.
    { pattern: /\b5\s*(?:-|–|—)?\s*fu\b|\b5\s*(?:-|–|—)?\s*fluorouracil\b/g, replacement: "fluorouracil" },
    { pattern: /\bfolinic\s+acid\b|\bleucovorin\b|\bcalcium\s+folinate\b/g, replacement: "folinicacid" },
    { pattern: /\bxelox\b/g, replacement: "capox" },

    // Common regimen spelling variants.
    { pattern: /\bm\s*folfox\s*6\b|\bmodified\s+folfox\s*6\b/g, replacement: "modifiedfolfox6" },
    { pattern: /\bfolfox\s*4\b/g, replacement: "folfox4" },
    { pattern: /\bfolfox\s*6\b/g, replacement: "folfox6" },
    { pattern: /\bm\s*folfirinox\b|\bmodified\s+folfirinox\b/g, replacement: "modifiedfolfirinox" },
    { pattern: /\bt\s*d\s*m\s*1\b/g, replacement: "tdm1" },
    { pattern: /\bt\s*d\s*x\s*d\b/g, replacement: "tdxd" },
    { pattern: /\bnab\s+paclitaxel\b|\babraxane\b/g, replacement: "nabpaclitaxel" },
    { pattern: /\btaxol\b/g, replacement: "paclitaxel" },
    { pattern: /\bxeloda\b/g, replacement: "capecitabine" },
    { pattern: /\b(?:oral\s+sact|oral\s+anti\s*[- ]?cancer\s+medicines?|oral\s+anticancer\s+medicines?|oam|oacm)\b/g, replacement: "oralanticancermedicine" },
    { pattern: /\bpalbo\b|\bibrance\b/g, replacement: "palbociclib" },
    { pattern: /\bribo\b|\bkisqali\b/g, replacement: "ribociclib" },
    { pattern: /\babema\b|\bverzenios\b/g, replacement: "abemaciclib" },
    { pattern: /\bolap\b|\blynparza\b/g, replacement: "olaparib" },
    { pattern: /\bnira\b|\bzejula\b/g, replacement: "niraparib" },
    { pattern: /\bruca\b|\brubraca\b/g, replacement: "rucaparib" },
    { pattern: /\btagrisso\b/g, replacement: "osimertinib" },
    { pattern: /\blonsurf\b/g, replacement: "trifluridinetipiracil" },
    { pattern: /\bpld\b|\bcaelyx\b/g, replacement: "pegylatedliposomaldoxorubicin" },

    // Widely used clinician abbreviations.
    { pattern: /\bpembro\b|\bkeytruda\b/g, replacement: "pembrolizumab" },
    { pattern: /\bnivo\b|\bopdivo\b/g, replacement: "nivolumab" },
    { pattern: /\bipi\b|\byervoy\b/g, replacement: "ipilimumab" },
    { pattern: /\batezo\b|\btecentriq\b/g, replacement: "atezolizumab" },
    { pattern: /\bdurva\b|\bimfinzi\b/g, replacement: "durvalumab" },
    { pattern: /\bavelu\b/g, replacement: "avelumab" },
    { pattern: /\bcemi\b/g, replacement: "cemiplimab" },
    { pattern: /\bbev\b|\bbevac\b|\bavastin\b/g, replacement: "bevacizumab" },
    { pattern: /\btrast\b|\bherceptin\b/g, replacement: "trastuzumab" },
    { pattern: /\bpertuz\b/g, replacement: "pertuzumab" },
    { pattern: /\bcetux\b|\berbitux\b/g, replacement: "cetuximab" },
    { pattern: /\bpanitum\b/g, replacement: "panitumumab" },
    { pattern: /\bcarbo\b/g, replacement: "carboplatin" },
    { pattern: /\bcisplat\b/g, replacement: "cisplatin" },
    { pattern: /\bgem\b|\bgemzar\b/g, replacement: "gemcitabine" },
    { pattern: /\bdoce\b/g, replacement: "docetaxel" },
    { pattern: /\biri\b/g, replacement: "irinotecan" },

    // Common regimen acronyms. Canonical compact forms prevent short tokens
    // such as AC or TC matching arbitrary substrings.
    { pattern: /\btchp\b/g, replacement: "docetaxelcarboplatintrastuzumabpertuzumab" },
    { pattern: /\bthp\b/g, replacement: "taxanetrastuzumabpertuzumab" },
    { pattern: /\bac\b/g, replacement: "doxorubicincyclophosphamide" },
    { pattern: /\bec\b/g, replacement: "epirubicincyclophosphamide" },
    { pattern: /\bfec\b/g, replacement: "fluorouracilepirubicincyclophosphamide" },
    { pattern: /\bcmf\b/g, replacement: "cyclophosphamidemethotrexatefluorouracil" },
    { pattern: /\btc\b/g, replacement: "docetaxelcyclophosphamide" },
    { pattern: /\bbep\b/g, replacement: "bleomycinetoposidecisplatin" },
    { pattern: /\bep\b/g, replacement: "etoposidecisplatin" },
    { pattern: /\bflot\b/g, replacement: "fluorouracilfolinicacidoxaliplatindocetaxel" },

    // Class and schedule language.
    { pattern: /\banti\s*pd\s*1\b|\bpd\s*1\b/g, replacement: "pd1" },
    { pattern: /\banti\s*pd\s*l\s*1\b|\bpd\s*l\s*1\b/g, replacement: "pdl1" },
    { pattern: /\b3\s*weekly\b|\bevery\s*3\s*weeks?\b/g, replacement: "q21d" },
    { pattern: /\b2\s*weekly\b|\bevery\s*2\s*weeks?\b|\bfortnightly\b/g, replacement: "q14d" },
    { pattern: /\b6\s*weekly\b|\bevery\s*6\s*weeks?\b/g, replacement: "q42d" },
    { pattern: /\bq\s*(7|14|21|28|42)\s*d?\b/g, replacement: "q$1d" }
  ]);

  function stripDiacritics(value) {
    return String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  }

  function basicNormalise(value) {
    return stripDiacritics(value)
      .toLowerCase()
      .replace(/[’']/g, "")
      .replace(/[+&/_,.;:()[\]{}]/g, " ")
      .replace(/[‐‑‒–—−-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalise(value) {
    let text = basicNormalise(value);
    ALIAS_RULES.forEach(({ pattern, replacement }) => {
      text = text.replace(pattern, replacement);
    });
    return text.replace(/\s+/g, " ").trim();
  }

  function compact(value) {
    return normalise(value).replace(/\s+/g, "");
  }

  function queryTokens(query) {
    return normalise(query).split(" ").filter(Boolean);
  }

  function extractNccpCodes(value) {
    const text = stripDiacritics(value).toLowerCase();
    const codes = new Set();
    for (const match of text.matchAll(/\bnccp\s*0*(\d{2,6})\b/g)) codes.add(String(Number(match[1])));
    for (const match of text.matchAll(/\b0*(\d{5})\b/g)) codes.add(String(Number(match[1])));
    return [...codes];
  }

  function textFrom(card, selector) {
    return card?.querySelector?.(selector)?.textContent?.trim() || "";
  }

  const documentCache = typeof WeakMap !== "undefined" ? new WeakMap() : null;

  function buildDocument(cardOrText) {
    if (typeof cardOrText === "string") {
      const text = String(cardOrText || "");
      return {
        title: text,
        dataName: text,
        code: text,
        text,
        titleRawNorm: basicNormalise(text),
        dataRawNorm: basicNormalise(text),
        titleNorm: normalise(text),
        dataNorm: normalise(text),
        codeNorm: normalise(text),
        textNorm: normalise(text),
        allNorm: normalise(text),
        allCompact: compact(text),
        codes: extractNccpCodes(text)
      };
    }

    if (documentCache && cardOrText && typeof cardOrText === "object" && documentCache.has(cardOrText)) return documentCache.get(cardOrText);
    const dataName = cardOrText?.dataset?.name || "";
    const title = textFrom(cardOrText, "h2");
    const code = textFrom(cardOrText, ".regimen-code") || (cardOrText?.textContent || "").match(/NCCP\s*\d+/i)?.[0] || "";
    const text = cardOrText?.textContent || "";
    const combined = `${title} ${dataName} ${code} ${text}`;
    const document = {
      title, dataName, code, text,
      titleRawNorm: basicNormalise(title),
      dataRawNorm: basicNormalise(dataName),
      titleNorm: normalise(title),
      dataNorm: normalise(dataName),
      codeNorm: normalise(code),
      textNorm: normalise(text),
      allNorm: normalise(combined),
      allCompact: compact(combined),
      codes: extractNccpCodes(combined)
    };
    document.words = document.allNorm.split(" ").filter(Boolean);
    if (documentCache && cardOrText && typeof cardOrText === "object") documentCache.set(cardOrText, document);
    return document;
  }

  function buildHaystack(cardOrText) {
    return buildDocument(cardOrText).allNorm;
  }

  function levenshtein(a, b) {
    const left = String(a || "");
    const right = String(b || "");
    if (left === right) return 0;
    if (!left.length) return right.length;
    if (!right.length) return left.length;
    let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
    for (let i = 1; i <= left.length; i += 1) {
      const current = [i];
      for (let j = 1; j <= right.length; j += 1) {
        current[j] = Math.min(
          current[j - 1] + 1,
          previous[j] + 1,
          previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1)
        );
      }
      previous = current;
    }
    return previous[right.length];
  }

  function fuzzyTokenMatch(token, documentWords) {
    if (token.length < 5) return null;
    const maximum = token.length >= 6 ? 2 : 1;
    let best = null;
    for (const word of documentWords) {
      const candidates = [word];
      if (word.length > token.length + maximum) {
        for (let start = 0; start <= word.length - token.length; start += 1) {
          candidates.push(word.slice(start, start + token.length));
        }
      }
      for (const candidate of candidates) {
        if (Math.abs(candidate.length - token.length) > maximum) continue;
        const distance = levenshtein(token, candidate);
        if (distance <= maximum && (!best || distance < best.distance)) best = { word: candidate, distance };
        if (distance === 0) break;
      }
      if (best?.distance === 0) break;
    }
    return best;
  }

  function scoreDocument(document, query, options = {}) {
    const rawQuery = String(query || "").trim();
    if (!rawQuery) return { score: 1, reason: "All regimens", fuzzy: false };

    const qRawNorm = basicNormalise(rawQuery);
    const qRawCompact = qRawNorm.replace(/\s+/g, "");
    const qNorm = normalise(rawQuery);
    const qCompact = qNorm.replace(/\s+/g, "");
    const tokens = qNorm.split(" ").filter(Boolean);
    if (!tokens.length) return { score: 1, reason: "All regimens", fuzzy: false };

    const numericOnly = rawQuery.replace(/\D/g, "");
    const queryCode = /^(?:nccp\s*)?0*\d{2,6}$/i.test(rawQuery) && numericOnly ? String(Number(numericOnly)) : null;
    let score = 0;
    let reason = "Regimen content match";
    let fuzzy = false;

    if (queryCode && document.codes.includes(queryCode)) {
      return { score: 260, reason: `NCCP ${queryCode.padStart(5, "0")} match`, fuzzy: false };
    }

    const rawTitleCompact = document.titleRawNorm.replace(/\s+/g, "");
    const rawDataCompact = document.dataRawNorm.replace(/\s+/g, "");
    if (qRawCompact && rawTitleCompact === qRawCompact) {
      score += 250;
      reason = "Exact regimen title";
    } else if (qRawCompact && rawTitleCompact.startsWith(qRawCompact)) {
      score += 205;
      reason = "Regimen title starts with search";
    } else if (qRawCompact && rawTitleCompact.includes(qRawCompact)) {
      score += 175;
      reason = "Regimen title match";
    } else if (qRawCompact && rawDataCompact.includes(qRawCompact)) {
      score += 105;
      reason = "Drug or regimen alias match";
    }

    const titleCompact = document.titleNorm.replace(/\s+/g, "");
    const dataCompact = document.dataNorm.replace(/\s+/g, "");
    if (qCompact && titleCompact === qCompact) {
      score += 200;
      reason = "Exact regimen title";
    } else if (qCompact && titleCompact.startsWith(qCompact)) {
      score += 145;
      reason = "Regimen title starts with search";
    } else if (qCompact && titleCompact.includes(qCompact)) {
      score += 115;
      reason = "Regimen title match";
    } else if (qCompact && dataCompact.includes(qCompact)) {
      score += 90;
      reason = "Drug or regimen alias match";
    } else if (qCompact && document.allCompact.includes(qCompact)) {
      score += 55;
    }

    const words = document.words || document.allNorm.split(" ").filter(Boolean);
    for (const token of tokens) {
      if (document.titleNorm.split(" ").includes(token)) {
        score += 38;
        if (reason === "Regimen content match") reason = "Regimen title match";
        continue;
      }
      if (document.titleNorm.includes(token)) {
        score += 30;
        if (reason === "Regimen content match") reason = "Regimen title match";
        continue;
      }
      if (document.dataNorm.includes(token)) {
        score += 23;
        if (reason === "Regimen content match") reason = "Drug or regimen alias match";
        continue;
      }
      if (document.codeNorm.includes(token)) {
        score += 28;
        reason = "NCCP protocol match";
        continue;
      }
      if (document.textNorm.includes(token) || document.allCompact.includes(token.replace(/\s+/g, ""))) {
        score += 12;
        continue;
      }
      const approximate = options.allowFuzzy === false ? null : fuzzyTokenMatch(token, words);
      if (approximate) {
        score += Math.max(4, 10 - approximate.distance * 3);
        fuzzy = true;
        reason = `Close spelling match for “${token}”`;
        continue;
      }
      return { score: 0, reason: "No match", fuzzy: false };
    }

    if (tokens.length > 1) score += Math.min(24, tokens.length * 4);
    return { score, reason, fuzzy };
  }

  function scoreText(haystackValue, query) {
    return scoreDocument(buildDocument(haystackValue), query);
  }

  function scoreCard(card, query) {
    const result = scoreDocument(buildDocument(card), query);
    return { card, ...result };
  }

  function matchesText(haystackValue, query) {
    return !String(query || "").trim() || scoreText(haystackValue, query).score > 0;
  }

  function matchesCard(card, query) {
    return !String(query || "").trim() || scoreCard(card, query).score > 0;
  }

  function rankCards(cards, query) {
    const source = [...(cards || [])];
    const direct = source
      .map((card, originalIndex) => ({ card, ...scoreDocument(buildDocument(card), query, { allowFuzzy: false }), originalIndex }))
      .filter(result => result.score > 0);
    const ranked = direct.length ? direct : source
      .map((card, originalIndex) => ({ card, ...scoreDocument(buildDocument(card), query, { allowFuzzy: true }), originalIndex }))
      .filter(result => result.score > 0);
    return ranked.sort((a, b) => b.score - a.score || a.originalIndex - b.originalIndex || buildDocument(a.card).title.localeCompare(buildDocument(b.card).title));
  }

  function closestTitles(cards, query, limit = 4) {
    const q = compact(query);
    if (!q || q.length < 4) return [];
    return [...(cards || [])]
      .map(card => {
        const document = buildDocument(card);
        const title = document.title || "Protocol";
        const titleCompact = compact(title);
        const distance = levenshtein(q, titleCompact);
        const ratio = distance / Math.max(q.length, titleCompact.length, 1);
        return { card, title, distance, ratio, score: Math.max(0, Math.round((1 - ratio) * 100)), reason: "Closest regimen title" };
      })
      .filter(item => item.ratio <= 0.62)
      .sort((a, b) => a.ratio - b.ratio || a.title.localeCompare(b.title))
      .slice(0, Math.max(1, limit));
  }

  return Object.freeze({
    version: "0.48.4",
    performanceVersion: "0.57.0",
    basicNormalise,
    normalise,
    compact,
    queryTokens,
    extractNccpCodes,
    buildDocument,
    buildHaystack,
    levenshtein,
    scoreText,
    scoreCard,
    matchesText,
    matchesCard,
    rankCards,
    closestTitles
  });
});
