/**
 * SACTCheck local laboratory profile.
 * Converts entered absolute laboratory results into the protocol's internally
 * encoded multiples-of-ULN fields. The protocol rules remain source-faithful;
 * clinicians no longer calculate xULN manually.
 */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SACTCheckLocalLab = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  const STORAGE_KEY = "sactcheck.localLabProfile.v1";
  const DEFAULTS = Object.freeze({
    profileName: "CUH",
    altUln: 34,
    astUln: 42,
    bilirubinUln: 20,
    tshLower: 0.38,
    tshUpper: 5.33,
    freeT4Lower: 8,
    freeT4Upper: 18
  });

  const BILIRUBIN_FIELDS = new Set([
    "bilirubin_ratio_uln", "bilirubin_uln_multiple", "bilirubin_uln"
  ]);
  const ALT_FIELDS = new Set(["alt_uln_multiple"]);
  const AST_FIELDS = new Set(["ast_uln_multiple", "ast_uln"]);
  const COMBINED_TRANSAMINASE_FIELDS = new Set([
    "alt_ast_uln_multiple", "alt_ast_ratio_uln", "ast_alt_uln",
    "transaminases_uln_multiple", "alt_ratio_uln"
  ]);

  let memorySettings = { ...DEFAULTS };

  function finitePositive(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : fallback;
  }

  function normalise(candidate = {}) {
    return {
      profileName: String(candidate.profileName || DEFAULTS.profileName),
      altUln: finitePositive(candidate.altUln, DEFAULTS.altUln),
      astUln: finitePositive(candidate.astUln, DEFAULTS.astUln),
      bilirubinUln: finitePositive(candidate.bilirubinUln, DEFAULTS.bilirubinUln),
      tshLower: finitePositive(candidate.tshLower, DEFAULTS.tshLower),
      tshUpper: finitePositive(candidate.tshUpper, DEFAULTS.tshUpper),
      freeT4Lower: finitePositive(candidate.freeT4Lower, DEFAULTS.freeT4Lower),
      freeT4Upper: finitePositive(candidate.freeT4Upper, DEFAULTS.freeT4Upper)
    };
  }

  function read() {
    try {
      const stored = root?.localStorage?.getItem(STORAGE_KEY);
      if (stored) memorySettings = normalise({ ...DEFAULTS, ...JSON.parse(stored) });
    } catch (error) {
      // Local storage is optional (for example some file previews block it).
    }
    return { ...memorySettings };
  }

  function write(patch = {}) {
    memorySettings = normalise({ ...read(), ...patch });
    try {
      root?.localStorage?.setItem(STORAGE_KEY, JSON.stringify(memorySettings));
    } catch (error) {
      // Continue with in-memory settings when persistence is unavailable.
    }
    return { ...memorySettings };
  }

  function reset() {
    memorySettings = { ...DEFAULTS };
    try { root?.localStorage?.removeItem(STORAGE_KEY); } catch (error) {}
    return { ...memorySettings };
  }

  function adapterFor(definitionOrId) {
    const id = typeof definitionOrId === "string" ? definitionOrId : definitionOrId?.id;
    if (!id) return null;
    if (BILIRUBIN_FIELDS.has(id)) {
      return {
        target: id,
        title: "Bilirubin result",
        analytes: [{ id: "bilirubin", label: "Bilirubin", unit: "µmol/L", setting: "bilirubinUln" }],
        decisionUnit: "×ULN"
      };
    }
    if (ALT_FIELDS.has(id)) {
      return {
        target: id,
        title: "ALT result",
        analytes: [{ id: "alt", label: "ALT", unit: "U/L", setting: "altUln" }],
        decisionUnit: "×ULN"
      };
    }
    if (AST_FIELDS.has(id)) {
      return {
        target: id,
        title: "AST result",
        analytes: [{ id: "ast", label: "AST", unit: "U/L", setting: "astUln" }],
        decisionUnit: "×ULN"
      };
    }
    if (COMBINED_TRANSAMINASE_FIELDS.has(id)) {
      return {
        target: id,
        title: "ALT / AST results",
        analytes: [
          { id: "alt", label: "ALT", unit: "U/L", setting: "altUln" },
          { id: "ast", label: "AST", unit: "U/L", setting: "astUln" }
        ],
        decisionUnit: "×ULN",
        highest: true
      };
    }
    return null;
  }

  function calculate(targetOrDefinition, actualValues = {}, settings = read()) {
    const adapter = adapterFor(targetOrDefinition);
    if (!adapter) return null;
    const parts = adapter.analytes.map(analyte => {
      const raw = actualValues[analyte.id];
      if (raw === undefined || raw === null || raw === "") return null;
      const actual = Number(raw);
      const upper = Number(settings[analyte.setting]);
      if (!Number.isFinite(actual) || actual < 0 || !Number.isFinite(upper) || upper <= 0) return null;
      return {
        id: analyte.id,
        label: analyte.label,
        unit: analyte.unit,
        actual,
        upper,
        ratio: actual / upper
      };
    }).filter(Boolean);
    if (!parts.length) return null;
    const ratio = adapter.highest ? Math.max(...parts.map(part => part.ratio)) : parts[0].ratio;
    const highestPart = parts.find(part => Math.abs(part.ratio - ratio) < 1e-12) || parts[0];
    return {
      target: adapter.target,
      ratio: Number(ratio.toFixed(4)),
      parts,
      highestPart,
      display: `${parts.map(part => `${part.label} ${format(part.actual)} ${part.unit} (${format(part.ratio, 2)} ×ULN)`).join(" · ")}`,
      decisionDisplay: `${format(ratio, 2)} ×ULN`
    };
  }

  function format(value, digits = null) {
    const number = Number(value);
    if (!Number.isFinite(number)) return String(value ?? "");
    if (digits !== null) return number.toFixed(digits).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
    return Number.isInteger(number) ? String(number) : String(Number(number.toFixed(3)));
  }

  function referenceText(analyteId, settings = read()) {
    const map = {
      alt: `Local ALT ULN ${format(settings.altUln)} U/L`,
      ast: `Local AST ULN ${format(settings.astUln)} U/L`,
      bilirubin: `Local bilirubin ULN ${format(settings.bilirubinUln)} µmol/L`,
      tsh: `Local TSH range ${format(settings.tshLower)}–${format(settings.tshUpper)} mIU/L`,
      free_t4: `Local free T4 range ${format(settings.freeT4Lower)}–${format(settings.freeT4Upper)} pmol/L`
    };
    return map[analyteId] || "";
  }

  return Object.freeze({
    version: "0.37.2",
    defaults: DEFAULTS,
    read,
    write,
    reset,
    adapterFor,
    calculate,
    referenceText
  });
});
