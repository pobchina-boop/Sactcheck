/**
 * Modified FOLFOX-6 JSON shadow-validation core.
 *
 * Runs the existing FolfoxEngine and the machine-readable NCCP 00209 rule set
 * from the same canonical scenario, then compares normalised outcomes.
 * No DOM dependencies; suitable for automated Node tests and browser UI.
 */
(function (root, factory) {
  const api = factory(
    root.SACTCheckAssessmentEngine || (typeof require === "function" ? require("./assessment-engine.js") : null)
  );
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SACTCheckFolfoxShadowCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (AssessmentEngine) {
  "use strict";

  if (!AssessmentEngine) throw new Error("SACTCheckAssessmentEngine is required for FOLFOX shadow validation.");

  const STATUS = Object.freeze({
    PROCEED: "PROCEED",
    MODIFIED: "MODIFIED",
    HOLD: "HOLD",
    DISCONTINUE: "DISCONTINUE",
    CONSULT: "CONSULT",
    INCOMPLETE: "INCOMPLETE"
  });

  const DOSES = Object.freeze({
    oxaliplatin: Object.freeze({ "0": 85, "-1": 65, "-2": 50 }),
    bolus5fu: Object.freeze({ "0": 400, "-1": 320, "-2": 260 }),
    infusion5fu: Object.freeze({ "0": 2400, "-1": 1900, "-2": 1500 })
  });

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function baseScenario() {
    return {
      assessmentId: "FOLFOX-SHADOW-001",
      assessmentType: "routine",
      indication: "Metastatic colorectal cancer",
      cycle: 1,
      delayWeeks: 0,
      currentOxLevel: "0",
      currentBolusLevel: "0",
      currentInfusionLevel: "0",
      hypersensitivity: false,
      pregnancy: false,
      breastfeeding: false,
      baselineFunctionalNeuropathy: false,
      dpdStatus: "normal",
      anc: 2,
      platelets: 200,
      lowestAnc: 2,
      lowestPlatelets: 200,
      crcl: 90,
      haemodialysis: false,
      hepaticCategory: "none",
      liverReviewed: true,
      renalReviewed: true,
      neuropathyGrade: 0,
      neuropathyPattern: "first",
      laryngopharyngeal: false,
      respiratorySymptoms: false,
      diarrhoeaCurrent: 0,
      diarrhoeaHighest: 0,
      diarrhoeaWeeks: 0,
      stomatitisCurrent: 0,
      stomatitisHighest: 0,
      stomatitisWeeks: 0,
      significantPpe: false
    };
  }

  const SCENARIOS = Object.freeze([
    { id: "normal", label: "Normal counts and no toxicity", patch: {} },
    { id: "anc_hold", label: "ANC 1.2 ×10⁹/L — hold", patch: { anc: 1.2, lowestAnc: 1.2 } },
    { id: "platelets_hold", label: "Platelets 60 ×10⁹/L — hold", patch: { platelets: 60, lowestPlatelets: 60 } },
    { id: "counts_four_weeks", label: "Counts low after four weeks — discontinue", patch: { assessmentType: "repeat", delayWeeks: 4, anc: 1.2, platelets: 100, lowestAnc: 1.2, lowestPlatelets: 60 } },
    { id: "anc_nadir_07", label: "Recovered after ANC nadir 0.7 — reduce oxaliplatin", patch: { assessmentType: "repeat", delayWeeks: 1, anc: 1.8, platelets: 140, lowestAnc: 0.7, lowestPlatelets: 100 } },
    { id: "anc_nadir_03", label: "Recovered after ANC nadir 0.3 — omit bolus and reduce oxaliplatin/infusion", patch: { assessmentType: "repeat", delayWeeks: 1, anc: 1.8, platelets: 140, lowestAnc: 0.3, lowestPlatelets: 100 } },
    { id: "platelet_nadir_5", label: "Recovered after platelet nadir 5 — reduce oxaliplatin two levels", patch: { assessmentType: "repeat", delayWeeks: 1, anc: 1.8, platelets: 140, lowestAnc: 1.5, lowestPlatelets: 5 } },
    { id: "crcl_25", label: "CrCl 25 mL/min — consider 50% oxaliplatin", patch: { crcl: 25 } },
    { id: "neuropathy_grade2", label: "Grade 2 neuropathy — reduce oxaliplatin", patch: { neuropathyGrade: 2 } },
    { id: "neuropathy_grade3_persistent", label: "Persistent grade 3 neuropathy — discontinue oxaliplatin", patch: { neuropathyGrade: 3, neuropathyPattern: "persistent" } },
    { id: "diarrhoea_hold", label: "Current grade 2 diarrhoea — hold regimen", patch: { diarrhoeaCurrent: 2, diarrhoeaHighest: 2, diarrhoeaWeeks: 0 } },
    { id: "diarrhoea_recovered_grade4", label: "Recovered grade 4 diarrhoea — reduce all cytotoxic components", patch: { diarrhoeaCurrent: 1, diarrhoeaHighest: 4, diarrhoeaWeeks: 1 } },
    { id: "stomatitis_persistent", label: "Grade 2 stomatitis persisting two weeks — discontinue", patch: { stomatitisCurrent: 2, stomatitisHighest: 2, stomatitisWeeks: 2 } },
    { id: "dpd_complete", label: "Complete DPD deficiency — contraindicated", patch: { dpdStatus: "complete" } },
    { id: "laryngopharyngeal", label: "Laryngo-pharyngeal dysaesthesia — six-hour infusion", patch: { laryngopharyngeal: true } },
    { id: "respiratory", label: "Unexplained respiratory symptoms — withhold oxaliplatin", patch: { respiratorySymptoms: true } },
    { id: "severe_hepatic", label: "Severe hepatic impairment — Consultant review / no 5-FU", patch: { hepaticCategory: "severe" } }
  ]);

  function scenarioById(id) {
    const definition = SCENARIOS.find(item => item.id === id) || SCENARIOS[0];
    return { ...baseScenario(), ...clone(definition.patch), scenarioId: definition.id, scenarioLabel: definition.label };
  }

  function toLegacyInput(input) {
    return {
      assessmentId: input.assessmentId,
      assessmentType: input.assessmentType,
      indication: input.indication,
      cycle: input.cycle,
      delayWeeks: input.delayWeeks,
      currentOxLevel: input.currentOxLevel,
      currentBolusLevel: input.currentBolusLevel,
      currentInfusionLevel: input.currentInfusionLevel,
      hypersensitivity: input.hypersensitivity,
      pregnancy: input.pregnancy,
      breastfeeding: input.breastfeeding,
      baselineFunctionalNeuropathy: input.baselineFunctionalNeuropathy,
      dpdStatus: input.dpdStatus,
      anc: input.anc,
      platelets: input.platelets,
      lowestAnc: input.lowestAnc,
      lowestPlatelets: input.lowestPlatelets,
      crcl: input.crcl,
      haemodialysis: input.haemodialysis,
      hepaticCategory: input.hepaticCategory,
      liverReviewed: input.liverReviewed,
      renalReviewed: input.renalReviewed,
      neuropathyGrade: input.neuropathyGrade,
      neuropathyPattern: input.neuropathyPattern,
      laryngopharyngeal: input.laryngopharyngeal,
      respiratorySymptoms: input.respiratorySymptoms,
      diarrhoeaCurrent: input.diarrhoeaCurrent,
      diarrhoeaHighest: input.diarrhoeaHighest,
      diarrhoeaWeeks: input.diarrhoeaWeeks,
      stomatitisCurrent: input.stomatitisCurrent,
      stomatitisHighest: input.stomatitisHighest,
      stomatitisWeeks: input.stomatitisWeeks,
      significantPpe: input.significantPpe
    };
  }

  function toJsonInput(input) {
    const repeat = input.assessmentType === "repeat" || Number(input.delayWeeks) > 0;
    return {
      assessment_type: input.assessmentType,
      cycle_number: input.cycle,
      delay_weeks: input.delayWeeks,
      current_oxaliplatin_level: input.currentOxLevel,
      current_bolus_5fu_level: input.currentBolusLevel,
      current_infusional_5fu_level: input.currentInfusionLevel,
      hypersensitivity: input.hypersensitivity,
      pregnancy: input.pregnancy,
      breastfeeding: input.breastfeeding,
      baseline_functional_neuropathy: input.baselineFunctionalNeuropathy,
      dpd_status: input.dpdStatus,
      anc_x10e9_l: input.anc,
      platelets_x10e9_l: input.platelets,
      lowest_anc_delayed_weeks_x10e9_l: repeat ? input.lowestAnc : input.anc,
      lowest_platelets_delayed_weeks_x10e9_l: repeat ? input.lowestPlatelets : input.platelets,
      crcl_ml_min: input.crcl,
      haemodialysis: input.haemodialysis,
      hepatic_impairment_category: input.hepaticCategory,
      neuropathy_grade: input.neuropathyGrade,
      neuropathy_pattern: input.neuropathyPattern,
      laryngopharyngeal_dysaesthesia: input.laryngopharyngeal,
      unexplained_respiratory_symptoms: input.respiratorySymptoms,
      diarrhoea_current_grade: input.diarrhoeaCurrent,
      diarrhoea_highest_grade: input.diarrhoeaHighest,
      diarrhoea_duration_weeks: input.diarrhoeaWeeks,
      stomatitis_current_grade: input.stomatitisCurrent,
      stomatitis_highest_grade: input.stomatitisHighest,
      stomatitis_duration_weeks: input.stomatitisWeeks,
      significant_ppe: input.significantPpe
    };
  }

  function reduceLevel(level, steps) {
    if (String(level) === "omitted") return "omitted";
    const numeric = Number(level);
    if (!Number.isFinite(numeric)) return null;
    const next = numeric - Number(steps || 0);
    return next <= -3 ? "discontinue" : String(next);
  }

  function doseText(component, level) {
    if (level === "omitted") return "Omitted";
    if (level === "discontinue") return "Discontinue";
    const value = DOSES[component]?.[String(level)];
    return value === undefined ? "Not generated" : `${value} mg/m²`;
  }

  function normaliseLegacyStatus(status) {
    const value = String(status || "");
    if (value.includes("criteria met")) return STATUS.PROCEED;
    if (value.includes("Proceed with protocol modification")) return STATUS.MODIFIED;
    if (value.includes("Delay / hold")) return STATUS.HOLD;
    if (value.includes("Discontinue")) return STATUS.DISCONTINUE;
    if (value.includes("Consultant")) return STATUS.CONSULT;
    return STATUS.INCOMPLETE;
  }

  function normaliseLegacy(result) {
    return {
      status: normaliseLegacyStatus(result.status),
      complete: Boolean(result.complete),
      components: {
        oxaliplatin: {
          suggestedDose: result.components?.oxaliplatin?.suggestedDose || "Not generated",
          infusionHours: result.components?.oxaliplatin?.infusionHours ?? null
        },
        folinicAcid: { suggestedDose: result.components?.folinicAcid?.suggestedDose || "Not generated" },
        bolus5fu: { suggestedDose: result.components?.bolus5fu?.suggestedDose || "Not generated" },
        infusion5fu: { suggestedDose: result.components?.infusion5fu?.suggestedDose || "Not generated" }
      },
      triggered: (result.findings || []).filter(item => item.severity !== "info").map(item => item.title)
    };
  }

  function aggregateJson(result, canonicalInput) {
    const recommendation = {
      wholeDiscontinue: false,
      holdWhole: false,
      anyHold: false,
      anyConsult: false,
      oxReduce: 0,
      bolusReduce: 0,
      infusionReduce: 0,
      omitBolus: false,
      omitFolinic: false,
      oxDiscontinue: false,
      fuDiscontinue: false,
      oxPercent: null,
      oxInfusionHours: null,
      oxHold: false,
      modified: false
    };

    (result.findings || []).forEach(finding => {
      const action = finding.action || {};
      const type = finding.actionType;
      if (type === "contraindicated" || type === "discontinue" || action.whole_regimen === "discontinue") {
        recommendation.wholeDiscontinue = true;
      }
      if (type === "withhold") recommendation.anyHold = true;
      if (action.whole_regimen === "hold") recommendation.holdWhole = true;
      if (type === "consultant_review") recommendation.anyConsult = true;
      if (["dose_reduce", "dose_reduce_one_level", "dose_reduce_two_levels", "omit", "proceed_with_caution"].includes(type)) {
        recommendation.modified = true;
      }

      const changes = action.component_changes || {};
      Object.entries(changes).forEach(([component, change]) => {
        if (!change || typeof change !== "object") return;
        const reduction = Math.max(0, -Number(change.dose_level_change || 0));
        if (component === "oxaliplatin") {
          recommendation.oxReduce = Math.max(recommendation.oxReduce, reduction);
          if (change.discontinue) recommendation.oxDiscontinue = true;
          if (change.hold) { recommendation.oxHold = true; recommendation.anyHold = true; }
          if (change.dose_percent_of_original !== undefined) {
            const fraction = Number(change.dose_percent_of_original) / 100;
            recommendation.oxPercent = recommendation.oxPercent === null ? fraction : Math.min(recommendation.oxPercent, fraction);
          }
          if (change.infusion_hours !== undefined) recommendation.oxInfusionHours = Number(change.infusion_hours);
        }
        if (component === "bolus_5fu") {
          recommendation.bolusReduce = Math.max(recommendation.bolusReduce, reduction);
          if (change.omit) recommendation.omitBolus = true;
          if (change.discontinue) recommendation.fuDiscontinue = true;
        }
        if (component === "infusional_5fu") {
          recommendation.infusionReduce = Math.max(recommendation.infusionReduce, reduction);
          if (change.discontinue) recommendation.fuDiscontinue = true;
        }
        if (component === "folinic_acid" && change.omit) recommendation.omitFolinic = true;
      });
    });

    let oxLevel = recommendation.oxDiscontinue ? "discontinue" : reduceLevel(canonicalInput.currentOxLevel, recommendation.oxReduce);
    let bolusLevel = recommendation.fuDiscontinue
      ? "discontinue"
      : recommendation.omitBolus ? "omitted" : reduceLevel(canonicalInput.currentBolusLevel, recommendation.bolusReduce);
    let infusionLevel = recommendation.fuDiscontinue
      ? "discontinue"
      : reduceLevel(canonicalInput.currentInfusionLevel, recommendation.infusionReduce);

    if (oxLevel === "discontinue") recommendation.oxDiscontinue = true;
    if (bolusLevel === "discontinue" || infusionLevel === "discontinue") recommendation.fuDiscontinue = true;

    let oxDoseValue = oxLevel === "discontinue" ? null : DOSES.oxaliplatin[String(oxLevel)];
    if (recommendation.oxPercent !== null) {
      const percentDose = 85 * recommendation.oxPercent;
      oxDoseValue = oxDoseValue === undefined || oxDoseValue === null ? percentDose : Math.min(oxDoseValue, percentDose);
    }

    let components;
    if (recommendation.wholeDiscontinue) {
      components = {
        oxaliplatin: { suggestedDose: "Discontinue", infusionHours: null },
        folinicAcid: { suggestedDose: "Discontinue" },
        bolus5fu: { suggestedDose: "Discontinue" },
        infusion5fu: { suggestedDose: "Discontinue" }
      };
    } else if (recommendation.holdWhole) {
      components = {
        oxaliplatin: { suggestedDose: "Hold", infusionHours: null },
        folinicAcid: { suggestedDose: "Hold" },
        bolus5fu: { suggestedDose: "Hold" },
        infusion5fu: { suggestedDose: "Hold" }
      };
    } else {
      components = {
        oxaliplatin: {
          suggestedDose: recommendation.oxHold
            ? "Hold pending pulmonary assessment"
            : recommendation.oxDiscontinue
              ? "Discontinue"
              : oxDoseValue === undefined
                ? "Not generated"
                : `${Number.isInteger(oxDoseValue) ? oxDoseValue : oxDoseValue.toFixed(1)} mg/m²`,
          infusionHours: recommendation.oxInfusionHours
        },
        folinicAcid: {
          suggestedDose: (recommendation.fuDiscontinue || recommendation.omitBolus || recommendation.omitFolinic || bolusLevel === "omitted" || bolusLevel === "discontinue")
            ? "Omit"
            : "400 mg/m²"
        },
        bolus5fu: { suggestedDose: doseText("bolus5fu", bolusLevel) },
        infusion5fu: { suggestedDose: doseText("infusion5fu", infusionLevel) }
      };
    }

    let status = STATUS.PROCEED;
    if (!result.complete) status = STATUS.INCOMPLETE;
    else if (recommendation.wholeDiscontinue) status = STATUS.DISCONTINUE;
    else if (recommendation.holdWhole || recommendation.anyHold) status = STATUS.HOLD;
    else if (recommendation.anyConsult) status = STATUS.CONSULT;
    else if (
      recommendation.modified || recommendation.oxReduce || recommendation.bolusReduce || recommendation.infusionReduce ||
      recommendation.omitBolus || recommendation.oxDiscontinue || recommendation.fuDiscontinue ||
      recommendation.oxPercent !== null || recommendation.oxInfusionHours !== null
    ) status = STATUS.MODIFIED;

    return {
      status,
      complete: Boolean(result.complete),
      components,
      triggered: (result.findings || []).filter(item => item.actionType !== "proceed").map(item => item.ruleId),
      rawResult: result
    };
  }

  function componentSignature(components) {
    return {
      oxaliplatin: `${components.oxaliplatin.suggestedDose}|${components.oxaliplatin.infusionHours ?? ""}`,
      folinicAcid: components.folinicAcid.suggestedDose,
      bolus5fu: components.bolus5fu.suggestedDose,
      infusion5fu: components.infusion5fu.suggestedDose
    };
  }

  function compareNormalised(legacy, json) {
    const legacyComponents = componentSignature(legacy.components);
    const jsonComponents = componentSignature(json.components);
    const differences = [];
    if (legacy.status !== json.status) differences.push(`Overall: legacy ${legacy.status}; JSON ${json.status}`);
    Object.keys(legacyComponents).forEach(component => {
      if (legacyComponents[component] !== jsonComponents[component]) {
        differences.push(`${component}: legacy ${legacyComponents[component]}; JSON ${jsonComponents[component]}`);
      }
    });
    return { match: differences.length === 0, differences, legacyComponents, jsonComponents };
  }

  function runScenario(protocol, legacyEngine, scenario) {
    if (!legacyEngine || typeof legacyEngine.assess !== "function") throw new Error("The legacy FolfoxEngine is unavailable.");
    if (!protocol) throw new Error("The FOLFOX JSON protocol is unavailable.");
    const canonical = typeof scenario === "string" ? scenarioById(scenario) : { ...baseScenario(), ...clone(scenario || {}) };
    const legacyRaw = legacyEngine.assess(toLegacyInput(canonical));
    const jsonRaw = AssessmentEngine.assess(protocol, toJsonInput(canonical));
    const legacy = normaliseLegacy(legacyRaw);
    const json = aggregateJson(jsonRaw, canonical);
    const comparison = compareNormalised(legacy, json);
    return { scenario: canonical, legacy, json, comparison, legacyRaw, jsonRaw };
  }

  function runAll(protocol, legacyEngine) {
    return SCENARIOS.map(definition => runScenario(protocol, legacyEngine, definition.id));
  }

  return Object.freeze({
    version: "0.1.0",
    STATUS,
    SCENARIOS,
    baseScenario,
    scenarioById,
    toLegacyInput,
    toJsonInput,
    normaliseLegacy,
    aggregateJson,
    compareNormalised,
    runScenario,
    runAll
  });
});
