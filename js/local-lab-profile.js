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
    lftProfile: "female",
    alpUln: null,
    altUln: 34,
    astUln: 42,
    bilirubinUln: 20,
    creatinineUln: 90,
    tshLower: 0.38,
    tshUpper: 5.33,
    freeT4Lower: 8,
    freeT4Upper: 18
  });

  const LFT_KEYS = ["altUln", "astUln", "bilirubinUln"];
  const LFT_PRESETS = Object.freeze({
    female: Object.freeze({ altUln: 34, astUln: 42, bilirubinUln: 20 }),
    male: Object.freeze({ altUln: 40, astUln: 40, bilirubinUln: 20 })
  });
  const PROFILE_LABELS = Object.freeze({female: "Supplied female/local LFT limits", male: "Provisional male LFT limits — not verified for CUH", custom: "Custom laboratory LFT limits"});

  const BILIRUBIN_FIELDS = new Set([
    "bilirubin_ratio_uln", "bilirubin_uln_multiple", "bilirubin_uln"
  ]);
  const ALT_FIELDS = new Set(["alt_uln_multiple"]);
  const AST_FIELDS = new Set(["ast_uln_multiple", "ast_uln"]);
  const COMBINED_TRANSAMINASE_FIELDS = new Set([
    "alt_ast_uln_multiple", "alt_ast_ratio_uln", "ast_alt_uln",
    "ast_alt_uln_multiple", "transaminases_uln_multiple", "alt_ratio_uln"
  ]);
  const POSITIVE_SETTING_KEYS = new Set([
    "altUln", "astUln", "bilirubinUln", "creatinineUln",
    "tshLower", "tshUpper", "freeT4Lower", "freeT4Upper"
  ]);

  let memorySettings = { ...DEFAULTS };

  function finitePositive(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : fallback;
  }

  function normalise(candidate = {}) {
    const lftProfile = Object.prototype.hasOwnProperty.call(PROFILE_LABELS, candidate.lftProfile) ? candidate.lftProfile : "custom";
    const customLft = Object.fromEntries(LFT_KEYS.map(key => [key, finitePositive(candidate.customLft?.[key], finitePositive(candidate[key], DEFAULTS[key]))]));
    return {
      lftProfile,
      customLft,
      alpUln: finitePositive(candidate.alpUln, null),
      profileName: String(candidate.profileName || DEFAULTS.profileName),
      altUln: finitePositive(candidate.altUln, DEFAULTS.altUln),
      astUln: finitePositive(candidate.astUln, DEFAULTS.astUln),
      bilirubinUln: finitePositive(candidate.bilirubinUln, DEFAULTS.bilirubinUln),
      creatinineUln: finitePositive(candidate.creatinineUln, DEFAULTS.creatinineUln),
      tshLower: finitePositive(candidate.tshLower, DEFAULTS.tshLower),
      tshUpper: finitePositive(candidate.tshUpper, DEFAULTS.tshUpper),
      freeT4Lower: finitePositive(candidate.freeT4Lower, DEFAULTS.freeT4Lower),
      freeT4Upper: finitePositive(candidate.freeT4Upper, DEFAULTS.freeT4Upper)
    };
  }

  function validatePatch(patch = {}) {
    const invalid = [];
    for (const key of POSITIVE_SETTING_KEYS) {
      if (!Object.prototype.hasOwnProperty.call(patch, key)) continue;
      const value = Number(patch[key]);
      if (!Number.isFinite(value) || value <= 0) invalid.push(key);
    }
    if (Object.prototype.hasOwnProperty.call(patch, "alpUln") && patch.alpUln !== "" && patch.alpUln !== null && (!Number.isFinite(Number(patch.alpUln)) || Number(patch.alpUln) <= 0)) invalid.push("alpUln");
    return { valid: invalid.length === 0, invalid };
  }

  function read() {
    try {
      const stored = root?.localStorage?.getItem(STORAGE_KEY);
      if (stored) memorySettings = normalise(JSON.parse(stored));
    } catch (error) {
      // Local storage is optional (for example some file previews block it).
    }
    return { ...memorySettings };
  }

  function write(patch = {}) {
    const current = read();
    const next = { ...current };
    if (Object.prototype.hasOwnProperty.call(patch, "profileName") && String(patch.profileName || "").trim()) {
      next.profileName = String(patch.profileName).trim();
    }
    for (const key of POSITIVE_SETTING_KEYS) {
      if (!Object.prototype.hasOwnProperty.call(patch, key)) continue;
      const value = Number(patch[key]);
      // Safety behaviour: an empty/invalid edited denominator must never silently
      // reset to a default and then be used in a clinical calculation.
      if (Number.isFinite(value) && value > 0) next[key] = value;
    }
    if (Object.prototype.hasOwnProperty.call(patch, "alpUln") && validatePatch({alpUln: patch.alpUln}).valid) next.alpUln = finitePositive(patch.alpUln, null);
    if (LFT_KEYS.some(key => next[key] !== current[key])) {
      next.lftProfile = "custom";
      next.customLft = Object.fromEntries(LFT_KEYS.map(key => [key, next[key]]));
    }
    memorySettings = normalise(next);
    try {
      root?.localStorage?.setItem(STORAGE_KEY, JSON.stringify(memorySettings));
    } catch (error) {
      // Continue with in-memory settings when persistence is unavailable.
    }
    return { ...memorySettings };
  }

  function selectProfile(id) {
    if (!Object.prototype.hasOwnProperty.call(PROFILE_LABELS, id)) throw new Error("Unknown laboratory profile");
    const current = normalise(read());
    const customLft = current.lftProfile === "custom" ? Object.fromEntries(LFT_KEYS.map(key => [key, current[key]])) : current.customLft;
    memorySettings = normalise({...current, ...(id === "custom" ? customLft : LFT_PRESETS[id]), customLft, lftProfile:id});
    try { root?.localStorage?.setItem(STORAGE_KEY, JSON.stringify(memorySettings)); } catch (error) {}
    return read();
  }

  function reset() {
    memorySettings = { ...DEFAULTS };
    try { root?.localStorage?.removeItem(STORAGE_KEY); } catch (error) {}
    return { ...memorySettings };
  }

  function fieldIdentity(definitionOrId) {
    const definition = typeof definitionOrId === "object" && definitionOrId ? definitionOrId : null;
    const id = String(typeof definitionOrId === "string" ? definitionOrId : definition?.id || "").trim();
    const label = String(definition?.label || "").toLowerCase();
    return { definition, id, label };
  }

  function bilirubinAlias(id) {
    return BILIRUBIN_FIELDS.has(id) || /(?:^|_)bilirubin_(?:ratio_)?uln(?:_multiple)?$/.test(id);
  }

  function combinedTransaminaseAlias(id, label = "") {
    if (COMBINED_TRANSAMINASE_FIELDS.has(id)) return true;
    if (/(?:^|_)(?:alt_ast|ast_alt)(?:_ratio)?_uln(?:_multiple)?$/.test(id)) return true;
    if (/(?:^|_)transaminases?_uln(?:_multiple)?$/.test(id)) return true;
    // Some older encoded fields are named ALT-only even though the source-facing
    // label explicitly says ALT/AST. When the full definition is available, honour
    // the label and calculate the higher entered transaminase rather than ALT alone.
    return /(?:alt.*ast|ast.*alt)/.test(label) && /(?:alt|ast)/.test(id) && /uln/.test(id);
  }

  function altAlias(id) {
    return ALT_FIELDS.has(id) || /(?:^|_)alt_(?:ratio_)?uln(?:_multiple)?$/.test(id);
  }

  function astAlias(id) {
    return AST_FIELDS.has(id) || /(?:^|_)ast_(?:ratio_)?uln(?:_multiple)?$/.test(id);
  }

  function adapterFor(definitionOrId) {
    const { definition, id, label } = fieldIdentity(definitionOrId);
    if (!id || (definition?.type && definition.type !== "number")) return null;

    // Opt-in only: do not reinterpret other protocols' baseline-ratio fields.
    if (definition?.actual_result_adapter === "creatinine_uln") {
      return { target: id, title: "Creatinine result", decisionUnit: "×ULN",
        exactRatio: true,
        referenceNote: "NCCP 00568 uses laboratory ULN, not the patient's baseline. Default 90 µmol/L is the supplied CUH female ULN; check the lab report and edit the local profile if different.",
        analytes: [{ id: "creatinine", label: "Creatinine", unit: "µmol/L", setting: "creatinineUln" }] };
    }

    if (/^(?:alk_phos|alp)_uln(?:_multiple)?$/.test(id)) {
      return {target:id, title:"ALP result", decisionUnit:"×ULN", analytes:[{id:"alp",label:"ALP",unit:"U/L",setting:"alpUln"}], referenceNote:"Enter the ALP ULN from the laboratory report in the local laboratory profile. No default is assumed."};
    }
    if (bilirubinAlias(id)) {
      return {
        target: id,
        title: "Bilirubin result",
        analytes: [{ id: "bilirubin", label: "Bilirubin", unit: "µmol/L", setting: "bilirubinUln" }],
        decisionUnit: "×ULN"
      };
    }

    if (combinedTransaminaseAlias(id, label)) {
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

    if (altAlias(id)) {
      return {
        target: id,
        title: "ALT result",
        analytes: [{ id: "alt", label: "ALT", unit: "U/L", setting: "altUln" }],
        decisionUnit: "×ULN"
      };
    }

    if (astAlias(id)) {
      return {
        target: id,
        title: "AST result",
        analytes: [{ id: "ast", label: "AST", unit: "U/L", setting: "astUln" }],
        decisionUnit: "×ULN"
      };
    }

    return null;
  }

  function calculate(targetOrDefinition, actualValues = {}, settings = read()) {
    const adapter = adapterFor(targetOrDefinition);
    if (!adapter) return null;
    const invalid = adapter.analytes.find(analyte => {
      const raw = actualValues[analyte.id];
      return raw !== undefined && raw !== null && String(raw).trim() !== "" && (!Number.isFinite(Number(raw)) || Number(raw) < 0 || !Number.isFinite(Number(settings[analyte.setting])) || Number(settings[analyte.setting]) <= 0);
    });
    if (invalid) return {target:adapter.target, ratio:NaN, parts:[], invalid:true, display:`${invalid.label}: enter a non-negative result and a positive laboratory ULN before assessment.`, decisionDisplay:"Invalid laboratory result/reference"};
    const parts = adapter.analytes.map(analyte => {
      const raw = actualValues[analyte.id];
      if (raw === undefined || raw === null || String(raw).trim() === "") return null;
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
    const missingAnalytes = adapter.analytes.filter(analyte => !parts.some(part => part.id === analyte.id)).map(analyte => analyte.id);
    const calculationText = parts.map(part =>
      `${part.label} ${format(part.actual)} ${part.unit} ÷ ULN ${format(part.upper)} ${part.unit} = ${format(part.ratio, 2)} ×ULN`
    ).join(" · ");
    const missingText = adapter.highest && missingAnalytes.length
      ? ` · ${missingAnalytes.map(id => id.toUpperCase()).join(" / ")} not entered (not assumed normal)`
      : "";
    const decisionText = adapter.highest
      ? ` · highest entered transaminase = ${format(ratio, 2)} ×ULN`
      : "";

    return {
      target: adapter.target,
      ratio,
      profileLabel: PROFILE_LABELS[settings.lftProfile] || PROFILE_LABELS.custom,
      parts,
      highestPart,
      missingAnalytes,
      display: `${calculationText}${missingText}${decisionText}`,
      decisionDisplay: adapter.highest
        ? `${format(ratio, 2)} ×ULN (highest entered transaminase)`
        : `${format(ratio, 2)} ×ULN`
    };
  }

  function format(value, digits = null) {
    const number = Number(value);
    if (!Number.isFinite(number)) return String(value ?? "");
    if (digits !== null) return number.toFixed(digits).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
    return String(number);
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
    version: "0.82.2",
    selectProfile,
    profileLabels: PROFILE_LABELS,
    defaults: DEFAULTS,
    read,
    write,
    reset,
    validatePatch,
    adapterFor,
    calculate,
    referenceText
  });
});
