/**
 * SACTCheck regimen-library search normalisation.
 *
 * Keeps common oncology spellings and punctuation variants searchable without
 * changing the canonical protocol title or clinical content.
 */
(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SACTCheckRegimenSearch = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const PHRASE_ALIASES = Object.freeze([
    { pattern: /\b5\s*(?:-|–|—)?\s*fu\b|\b5\s*(?:-|–|—)?\s*fluorouracil\b/g, replacement: "fluorouracil" },
    { pattern: /\bfolinic\s+acid\b|\bleucovorin\b|\bcalcium\s+folinate\b/g, replacement: "folinicacid" },
    { pattern: /\bxelox\b/g, replacement: "capox" },
    { pattern: /\bm\s*folfox\s*6\b|\bmodified\s+folfox\s*6\b/g, replacement: "modifiedfolfox6" },
    { pattern: /\bfolfox\s*4\b/g, replacement: "folfox4" },
    { pattern: /\bfolfox\s*6\b/g, replacement: "folfox6" },
    { pattern: /\bpld\b/g, replacement: "pegylatedliposomaldoxorubicin" },
    { pattern: /\bt\s*dm\s*1\b/g, replacement: "tdm1" },
    { pattern: /\bnab\s+paclitaxel\b/g, replacement: "nabpaclitaxel" }
  ]);

  function stripDiacritics(value) {
    return String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  }

  function normalise(value) {
    let text = stripDiacritics(value)
      .toLowerCase()
      .replace(/[’']/g, "")
      .replace(/[+&/_,.;:()[\]{}]/g, " ")
      .replace(/[‐‑‒–—−-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    PHRASE_ALIASES.forEach(({ pattern, replacement }) => {
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

  function buildHaystack(cardOrText) {
    if (typeof cardOrText === "string") return cardOrText;
    if (!cardOrText) return "";
    const dataName = cardOrText.dataset?.name || "";
    const title = cardOrText.querySelector?.("h2")?.textContent || "";
    const visibleText = cardOrText.textContent || "";
    return `${dataName} ${title} ${visibleText}`;
  }

  function matchesText(haystackValue, query) {
    if (!String(query || "").trim()) return true;
    const haystack = normalise(haystackValue);
    const haystackCompact = haystack.replace(/\s+/g, "");
    const tokens = queryTokens(query);
    if (!tokens.length) return true;

    return tokens.every(token => {
      const compactToken = token.replace(/\s+/g, "");
      return haystack.includes(token) || haystackCompact.includes(compactToken);
    });
  }

  function matchesCard(card, query) {
    return matchesText(buildHaystack(card), query);
  }

  return Object.freeze({
    version: "0.48.0",
    normalise,
    compact,
    queryTokens,
    buildHaystack,
    matchesText,
    matchesCard
  });
});
