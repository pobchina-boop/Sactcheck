/**
 * SACTCheck Assessment Engine
 * Orchestrates protocol profiles, input validation, rule evaluation,
 * explainable output and copyable documentation.
 */
(function (root, factory) {
  const api = factory(root.SACTCheckRuleEngine || (typeof require === "function" ? require("./rule-engine.js") : null));
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SACTCheckAssessmentEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (RuleEngine) {
  "use strict";

  if (!RuleEngine) throw new Error("SACTCheckRuleEngine must load before SACTCheckAssessmentEngine.");

  const FIELD_LABELS = Object.freeze({
    indication_id: "Indication",
    cycle_number: "Cycle number",
    day_number: "Treatment day",
    schedule_q3w_or_q6w: "Pembrolizumab schedule",
    anc_x10e9_l: "ANC (×10⁹/L)",
    platelets_x10e9_l: "Platelets (×10⁹/L)",
    platelet_nadir_x10e9_l: "Platelet nadir (×10⁹/L)",
    anc_below_0_5_duration_days: "Duration ANC <0.5 (days)",
    febrile_neutropenia: "Febrile neutropenia",
    febrile_neutropenia_grade: "Febrile neutropenia grade",
    bleeding_tendency: "Bleeding tendency",
    haematological_delay_days: "Haematological delay (days)",
    haematological_delay_occurrence: "Haematological delay occurrence number",
    haematological_toxicity_occurrence_number: "Haematological toxicity occurrence number",
    gfr_ml_min: "GFR (mL/min)",
    crcl_ml_min: "Creatinine clearance (mL/min)",
    haemodialysis: "Haemodialysis",
    alt_ratio_uln: "ALT / highest transaminase (×ULN)",
    bilirubin_ratio_uln: "Bilirubin (×ULN)",
    bilirubin_umol_l: "Bilirubin (µmol/L)",
    child_pugh_class: "Child-Pugh class",
    lvef_percent: "LVEF (%)",
    neuropathy_grade: "Neuropathy grade",
    neuropathy_occurrence: "Neuropathy occurrence number",
    neuropathy_persistent_or_second_occurrence: "Persistent or second neuropathy occurrence",
    other_non_haematological_toxicity_grade: "Other non-haematological toxicity grade",
    paclitaxel_non_haematological_toxicity_grade: "Paclitaxel non-haematological toxicity grade",
    paclitaxel_delay_days: "Paclitaxel delay (days)",
    paclitaxel_dose_reduction_count: "Previous paclitaxel dose reductions",
    active_pembrolizumab_irae: "Active pembrolizumab immune-related adverse event",
    cyp3a_inhibitor_class: "CYP3A inhibitor class",
    current_dose_level: "Current dose level",
    tsh_miu_l: "TSH",
    free_t4_pmol_l: "Free T4",
    cortisol_nmol_l: "Cortisol",
    cortisol_sample_time: "Cortisol sample time",
    acth_result: "ACTH result",
    glucose_mmol_l: "Glucose",
    ketones_mmol_l: "Blood ketones"
  });

  const ACTION_LABELS = Object.freeze({
    permanently_discontinue: "Permanently discontinue",
    contraindicated: "Contraindicated / do not administer",
    discontinue: "Discontinue treatment",
    cease: "Cease treatment",
    omit: "Omit treatment component",
    withhold_then_reduce: "Withhold, then reduce",
    withhold: "Withhold treatment",
    delay_then_dose_reduce: "Delay, then reduce dose",
    delay: "Delay treatment",
    consultant_review: "Consultant review required",
    dose_reduce_two_levels: "Reduce by two dose levels",
    dose_reduce_one_level: "Reduce by one dose level",
    dose_reduce: "Dose reduction indicated",
    proceed_with_caution: "Assessed domain meets encoded criteria",
    partial_context_required: "Partial assessment — additional context required",
    proceed: "Encoded criteria met"
  });

  const STATUS_CLASS = Object.freeze({
    permanently_discontinue: "bad",
    contraindicated: "bad",
    discontinue: "bad",
    cease: "bad",
    omit: "warn",
    withhold_then_reduce: "warn",
    withhold: "warn",
    delay_then_dose_reduce: "warn",
    delay: "warn",
    consultant_review: "warn",
    dose_reduce_two_levels: "warn",
    dose_reduce_one_level: "warn",
    dose_reduce: "warn",
    proceed_with_caution: "warn",
    partial_context_required: "warn",
    proceed: "good",
    incomplete: "warn"
  });

  function asArray(value) {
    if (value === undefined || value === null) return [];
    return Array.isArray(value) ? value : [value];
  }

  function unique(values) {
    return [...new Set(values.filter(Boolean))];
  }

  function humanise(value) {
    return String(value || "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, character => character.toUpperCase());
  }

  function normaliseDisplayText(value) {
    return String(value ?? "")
      .replaceAll("prednisoLONE", "prednisolone")
      .replaceAll("predniSONE", "prednisone");
  }

  function getProtocolTitle(protocol) {
    return normaliseDisplayText(protocol?.metadata?.short_title || protocol?.metadata?.title || protocol?.file_name || "Unnamed protocol");
  }

  function getProtocolCode(protocol) {
    return protocol?.metadata?.nccp_regimen_code || protocol?.protocol_id || "Not specified";
  }

  function getProfiles(protocol) {
    const explicitProfiles = asArray(protocol.assessment_profiles);
    if (explicitProfiles.length) {
      return explicitProfiles.map(profile => ({
        id: profile.id,
        label: profile.label || profileLabel(profile.id),
        requiredInputs: asArray(profile.required_inputs),
        context: {
          ...inferProfileContext(protocol, profile.id),
          ...(profile.context || {})
        },
        inputOverrides: profile.input_overrides || {}
      }));
    }

    const grouped = protocol.required_inputs_by_phase;
    if (grouped && typeof grouped === "object" && !Array.isArray(grouped)) {
      return Object.entries(grouped).map(([id, requiredInputs]) => ({
        id,
        label: profileLabel(id),
        requiredInputs: asArray(requiredInputs),
        context: inferProfileContext(protocol, id),
        inputOverrides: protocol.profile_input_overrides?.[id] || {}
      }));
    }

    return [{
      id: "default",
      label: "Standard assessment",
      requiredInputs: asArray(protocol.required_inputs),
      context: inferProfileContext(protocol, "default"),
      inputOverrides: protocol.profile_input_overrides?.default || {}
    }];
  }

  function profileLabel(id) {
    const labels = {
      neoadjuvant_cycles_1_to_4_day_1: "Neoadjuvant cycles 1–4 · day 1",
      neoadjuvant_cycles_1_to_4_day_8_or_15: "Neoadjuvant cycles 1–4 · day 8 or 15",
      neoadjuvant_cycles_5_to_8_day_1: "Neoadjuvant cycles 5–8 · day 1",
      adjuvant_pembrolizumab: "Adjuvant pembrolizumab",
      default: "Standard assessment"
    };
    return labels[id] || humanise(id);
  }

  function inferProfileContext(protocol, profileId) {
    const phases = asArray(protocol.treatment_phases);
    let phase = phases.find(item => profileId.includes(item.phase_id));
    if (!phase) phase = phases.find(item => String(item.phase_id || "").startsWith(profileId));

    const profileDays = profileId.includes("day_8_or_15")
      ? [8, 15]
      : profileId.includes("day_1")
        ? [1]
        : [];

    const activeComponents = phase
      ? unique(asArray(phase.administration)
          .filter(item => {
            if (!profileDays.length) return true;
            const administrationDays = asArray(item.day).map(Number);
            return administrationDays.some(day => profileDays.includes(day));
          })
          .map(item => item.drug))
      : protocol.treatment?.drug ? [protocol.treatment.drug] : [];

    return {
      profileId,
      phase: phase?.phase_id || null,
      profileDays,
      day: profileDays.length === 1 ? profileDays[0] : null,
      activeComponents
    };
  }

  function getSelectedProfile(protocol, profileId) {
    const profiles = getProfiles(protocol);
    return profiles.find(profile => profile.id === profileId) || profiles[0];
  }

  function collectExpectedValues(node, field, output = []) {
    if (!node) return output;
    if (Array.isArray(node)) {
      node.forEach(item => collectExpectedValues(item, field, output));
      return output;
    }
    if (typeof node !== "object") return output;
    if (node.field === field && node.value !== undefined) {
      asArray(node.value).forEach(value => output.push(value));
    }
    if (node.all) collectExpectedValues(node.all, field, output);
    if (node.any) collectExpectedValues(node.any, field, output);
    if (node.not) collectExpectedValues(node.not, field, output);
    return output;
  }

  function getPotentialRules(protocol, context) {
    return asArray(protocol?.rule_engine?.rules).filter(rule => RuleEngine.isPotentiallyApplicable(rule, context));
  }

  function explicitInputDefinitions(protocol) {
    const raw = protocol.input_definitions || protocol.assessment?.inputs || {};
    const output = new Map();

    if (Array.isArray(raw)) {
      raw.forEach(item => {
        if (item && typeof item === "object" && item.id) output.set(item.id, { ...item });
      });
    } else if (raw && typeof raw === "object") {
      Object.entries(raw).forEach(([id, item]) => {
        if (item && typeof item === "object") output.set(id, { id, ...item });
      });
    }

    return output;
  }

  function isImmunotherapyProtocol(protocol) {
    const metadata = protocol?.metadata || {};
    const classes = asArray(metadata.treatment_class).map(value => String(value).toLowerCase());
    const section = String(metadata.catalogue_section || "").toLowerCase();
    const text = [metadata.title, metadata.short_title, protocol?.treatment?.drug, ...classes].filter(Boolean).join(" ").toLowerCase();
    return section === "immunotherapy" || classes.some(value => value.includes("immunotherapy") || value.includes("immune checkpoint")) ||
      /(pembrolizumab|nivolumab|atezolizumab|durvalumab|ipilimumab|tremelimumab|cemiplimab|avelumab)/.test(text);
  }

  function optionalImmunotherapyDefinitions(protocol) {
    if (!isImmunotherapyProtocol(protocol)) return [];
    return [
      { id: "tsh_miu_l", label: "TSH", type: "number", step: "0.01", min: 0, unit: "mIU/L", ui_section: "immunotherapy_bloods", always_show: true, required: false, help: "Optional immune-endocrine screening. CUH local reference range is applied in the interface.", demo_value: 1.2 },
      { id: "free_t4_pmol_l", label: "Free T4", type: "number", step: "0.1", min: 0, unit: "pmol/L", ui_section: "immunotherapy_bloods", always_show: true, required: false, help: "Optional immune-endocrine screening. Interpret with TSH and the clinical picture.", demo_value: 12 },
      { id: "cortisol_nmol_l", label: "Cortisol", type: "number", step: "1", min: 0, unit: "nmol/L", ui_section: "immunotherapy_bloods", always_show: true, required: false, help: "Optional and symptom-triggered. Interpretation depends on sampling time, steroid exposure and clinical context.", demo_value: 300 },
      { id: "cortisol_sample_time", label: "Cortisol sample time", type: "text", ui_section: "immunotherapy_bloods", always_show: true, required: false, help: "Optional. Record the collection time when cortisol is entered.", demo_value: "09:00" },
      { id: "acth_result", label: "ACTH result", type: "text", ui_section: "immunotherapy_bloods", always_show: true, required: false, help: "Optional and symptom-triggered. Enter the reported result with local units if available.", demo_value: "Reported if clinically indicated" },
      { id: "glucose_mmol_l", label: "Glucose", type: "number", step: "0.1", min: 0, unit: "mmol/L", ui_section: "immunotherapy_bloods", always_show: true, required: false, help: "Optional immune-mediated diabetes screening or symptom-triggered result.", demo_value: 5 },
      { id: "ketones_mmol_l", label: "Blood ketones", type: "number", step: "0.1", min: 0, unit: "mmol/L", ui_section: "immunotherapy_bloods", always_show: true, required: false, help: "Optional and symptom-triggered; assess urgently with hyperglycaemia or suspected ketoacidosis.", demo_value: 0.1 }
    ];
  }

  function getInputDefinitions(protocol, profileId, rawInputs = {}) {
    const profile = getSelectedProfile(protocol, profileId);
    const potentialRules = getPotentialRules(protocol, profile.context);
    const conditionFields = unique(potentialRules.flatMap(rule =>
      RuleEngine.collectConditionFields(RuleEngine.conditionFromRule(rule))
    ));
    const explicitDefinitions = explicitInputDefinitions(protocol);
    const explicitAlwaysVisibleFields = [...explicitDefinitions.values()]
      .filter(definition => definition.always_show === true || definition.ui_section === "treatment_context")
      .map(definition => definition.id);
    const indicationField = asArray(protocol.indications).length ? ["indication_id"] : [];
    const fields = unique([...profile.requiredInputs, ...conditionFields, ...explicitAlwaysVisibleFields, ...indicationField]);

    // Conditional visibility/requirement clauses may depend on fields that are
    // not themselves used by a decision rule. Include those dependencies in
    // the generated form so a protocol remains self-contained.
    let expanded = true;
    while (expanded) {
      expanded = false;
      fields.slice().forEach(field => {
        const definition = explicitDefinitions.get(field) || {};
        [definition.visible_when, definition.required_when].forEach(condition => {
          RuleEngine.collectConditionFields(condition).forEach(dependency => {
            if (!fields.includes(dependency)) {
              fields.push(dependency);
              expanded = true;
            }
          });
        });
      });
    }

    const baseDefinitions = fields.map(field => buildInputDefinition(
      protocol,
      field,
      profile.requiredInputs.includes(field),
      potentialRules,
      profile,
      explicitDefinitions.get(field)
    ));
    const immunotherapyDefaults = optionalImmunotherapyDefinitions(protocol);
    const immunotherapyById = new Map(immunotherapyDefaults.map(definition => [definition.id, definition]));
    const mergedBaseDefinitions = baseDefinitions.map(definition => {
      const optionalDefault = immunotherapyById.get(definition.id);
      if (!optionalDefault) return definition;
      return {
        ...definition,
        ...optionalDefault,
        id: definition.id,
        required: false,
        baseRequired: false,
        explicitlyRequired: false
      };
    });
    const existingIds = new Set(mergedBaseDefinitions.map(definition => definition.id));
    const optionalDefinitions = immunotherapyDefaults.filter(definition => !existingIds.has(definition.id));
    const allDefinitions = [...mergedBaseDefinitions, ...optionalDefinitions];
    const inputs = coerceInputs(allDefinitions, rawInputs || {});

    return allDefinitions.map(definition => applyDynamicInputState(definition, inputs));
  }

  function conditionState(condition, inputs) {
    if (!condition) return false;
    try {
      return RuleEngine.evaluateCondition(condition, inputs).state;
    } catch (error) {
      return "unknown";
    }
  }

  function applyDynamicInputState(definition, inputs) {
    const visibilityState = definition.visible_when
      ? conditionState(definition.visible_when, inputs)
      : true;
    const visible = visibilityState === true;
    const requiredState = definition.required_when
      ? conditionState(definition.required_when, inputs)
      : false;
    const conditionalRequired = requiredState === true;
    const required = visible && (definition.baseRequired || conditionalRequired);

    return {
      ...definition,
      visible,
      required,
      conditionalRequired,
      visibilityState,
      requiredState
    };
  }

  function buildInputDefinition(protocol, field, explicitlyRequired, potentialRules, profile, explicitDefinition) {
    const expectedValues = unique(potentialRules.flatMap(rule =>
      collectExpectedValues(RuleEngine.conditionFromRule(rule), field)
    ));

    const inferred = {
      id: field,
      label: FIELD_LABELS[field] || humanise(field),
      required: false,
      baseRequired: explicitlyRequired,
      explicitlyRequired,
      type: "number",
      step: "0.01",
      min: 0,
      options: []
    };

    const definition = {
      ...inferred,
      ...(explicitDefinition || {}),
      id: field,
      explicitlyRequired,
      baseRequired: explicitlyRequired || explicitDefinition?.required === true,
      required: explicitlyRequired || explicitDefinition?.required === true
    };

    if (explicitDefinition) {
      const override = profile?.inputOverrides?.[field] || {};
      const baseRequired = explicitlyRequired ||
        (override.required !== undefined ? override.required === true : explicitDefinition.required === true);
      return {
        ...definition,
        ...override,
        id: field,
        explicitlyRequired,
        baseRequired,
        required: baseRequired
      };
    }

    if (field === "day_number" && profile?.context?.profileDays?.length) {
      definition.type = "select";
      definition.options = profile.context.profileDays.map(value => ({ value: String(value), label: `Day ${value}` }));
      return definition;
    }

    if (field === "cycle_number" && profile?.context?.phase) {
      const phase = asArray(protocol.treatment_phases).find(item => item.phase_id === profile.context.phase);
      const cycles = asArray(phase?.cycles).map(Number).filter(Number.isFinite);
      if (cycles.length) {
        definition.min = Math.min(...cycles);
        definition.max = Math.max(...cycles);
        definition.step = "1";
      }
    }

    if (field === "indication_id") {
      definition.type = "select";
      definition.options = asArray(protocol.indications).map(item => ({
        value: item.indication_id || item.code,
        label: item.description
      }));
      definition.demo_value = definition.options[0]?.value ?? "";
      definition.ui_section = "treatment_context";
      definition.always_show = true;
      return definition;
    }

    if (field === "schedule_q3w_or_q6w") {
      definition.type = "select";
      definition.options = [
        { value: "q3w", label: "Every 3 weeks" },
        { value: "q6w", label: "Every 6 weeks" }
      ];
      return definition;
    }

    if (field === "current_dose_level") {
      definition.type = "select";
      definition.options = asArray(protocol.dose_levels).map(item => ({
        value: String(item.dose_level),
        label: `${humanise(item.dose_level)} · ${item.dose_mg_twice_daily} mg twice daily`
      }));
      return definition;
    }

    if (field === "child_pugh_class") {
      definition.type = "select";
      definition.options = ["A", "B", "C"].map(value => ({ value, label: value }));
      return definition;
    }

    if (field === "cyp3a_inhibitor_class") {
      definition.type = "select";
      definition.options = [
        { value: "none", label: "None" },
        { value: "moderate", label: "Moderate inhibitor" },
        { value: "strong", label: "Strong inhibitor" }
      ];
      return definition;
    }

    if (field === "active_pembrolizumab_irae" || expectedValues.some(value => typeof value === "boolean")) {
      definition.type = "boolean";
      return definition;
    }

    const stringValues = expectedValues.filter(value => typeof value === "string");
    if (stringValues.length) {
      definition.type = "select";
      definition.options = unique(stringValues).map(value => ({ value, label: humanise(value) }));
      return definition;
    }

    if (/grade|occurrence|cycle_number|day_number|delay_days|duration_days|reduction_count/.test(field)) {
      definition.step = "1";
    }

    if (/ratio_uln/.test(field)) definition.step = "0.01";
    if (/x10e9_l/.test(field)) definition.step = "0.01";
    return definition;
  }

  function coerceInputs(definitions, rawInputs) {
    const inputs = {};
    const derivedAssignments = [];

    definitions.forEach(definition => {
      const raw = rawInputs[definition.id];
      if (raw === undefined || raw === null || raw === "") {
        inputs[definition.id] = null;
        return;
      }

      if (definition.type === "number") {
        inputs[definition.id] = Number(raw);
        return;
      }
      if (definition.type === "boolean") {
        inputs[definition.id] = raw === true || raw === "true";
        return;
      }
      if (definition.type === "select") {
        const option = asArray(definition.options).find(item => String(item?.value) === String(raw));
        if (option) {
          inputs[definition.id] = Object.prototype.hasOwnProperty.call(option, "decision_value")
            ? option.decision_value
            : option.value;
          if (option.sets_fields && typeof option.sets_fields === "object") {
            derivedAssignments.push(option.sets_fields);
          }
          return;
        }
      }
      inputs[definition.id] = raw;
    });

    // A protocol-specific band may also select a linked pathway (for example,
    // dialysis). Apply those derived values only after all direct inputs have
    // been parsed so the selector is the single source of truth.
    derivedAssignments.forEach(assignments => {
      Object.entries(assignments).forEach(([field, value]) => {
        inputs[field] = value;
      });
    });

    return inputs;
  }

  function buildDisplayInputs(definitions, rawInputs, inputs) {
    const display = {};
    definitions.forEach(definition => {
      const raw = rawInputs?.[definition.id];
      if (definition.type === "select" && raw !== undefined && raw !== null && raw !== "") {
        const option = asArray(definition.options).find(item => String(item?.value) === String(raw));
        display[definition.id] = option?.label || String(raw);
        return;
      }
      display[definition.id] = formatValue(inputs?.[definition.id]);
    });
    return display;
  }

  function validateInputs(definitions, inputs) {
    // Partial-assessment policy: an omitted field is never treated as normal and
    // never blocks evaluation of independent rules. Only values actually entered
    // are validated here; missing rule operands are reported later as coverage gaps.
    const missing = [];
    const invalid = [];

    definitions.forEach(definition => {
      if (definition.visible === false) return;
      const value = inputs[definition.id];
      if (definition.type === "number" && value !== null) {
        if (!Number.isFinite(value)) {
          invalid.push({ id: definition.id, label: definition.label, reason: "must be a valid number" });
          return;
        }
        if (definition.min !== undefined && value < Number(definition.min)) {
          invalid.push({ id: definition.id, label: definition.label, reason: `must be at least ${definition.min}` });
        }
        if (definition.max !== undefined && value > Number(definition.max)) {
          invalid.push({ id: definition.id, label: definition.label, reason: `must be no greater than ${definition.max}` });
        }
      }
    });

    return { missing, invalid };
  }

  function buildContext(protocol, profile, inputs) {
    const selectedDay = inputs.day_number ?? profile.context.day;
    const selectedPhase = asArray(protocol.treatment_phases).find(item => item.phase_id === profile.context.phase);
    const activeComponents = selectedPhase
      ? unique(asArray(selectedPhase.administration)
          .filter(item => {
            if (selectedDay === null || selectedDay === undefined) return true;
            return asArray(item.day).map(Number).includes(Number(selectedDay));
          })
          .map(item => item.drug))
      : profile.context.activeComponents;

    const indicationId = inputs.indication_id || null;
    const selectedIndication = asArray(protocol.indications).find(item =>
      String(item.indication_id || item.code || "") === String(indicationId || "")
    );

    return {
      ...profile.context,
      activeComponents,
      cycle: inputs.cycle_number,
      day: selectedDay,
      schedule: inputs.schedule_q3w_or_q6w || inputs.etoposide_schedule,
      indicationId,
      indicationLabel: selectedIndication?.description || protocol?.metadata?.indication || null,
      protocolId: protocol.protocol_id,
      protocolTitle: getProtocolTitle(protocol),
      assessedAt: new Date().toISOString()
    };
  }

  function hasEnteredValue(value) {
    return value !== undefined && value !== null && value !== "";
  }

  function contextLabel(value) {
    const labels = {
      phase: "treatment phase",
      cycle: "cycle number",
      day: "treatment day",
      schedule: "treatment schedule"
    };
    return labels[value] || humanise(value);
  }

  function collectFieldLeaves(node, field, output = []) {
    if (!node) return output;
    if (Array.isArray(node)) {
      node.forEach(item => collectFieldLeaves(item, field, output));
      return output;
    }
    if (typeof node !== "object") return output;
    if (node.field === field) output.push(node);
    ["all", "any", "none"].forEach(key => {
      if (node[key]) collectFieldLeaves(node[key], field, output);
    });
    if (node.not) collectFieldLeaves(node.not, field, output);
    return output;
  }

  function projectConditionToField(node, field) {
    if (!node) return null;
    if (Array.isArray(node)) {
      const projected = node.map(item => projectConditionToField(item, field)).filter(Boolean);
      if (!projected.length) return null;
      return projected.length === 1 ? projected[0] : { all: projected };
    }
    if (typeof node !== "object") return null;
    if (node.field) return node.field === field ? node : null;
    for (const key of ["all", "any", "none"]) {
      if (!node[key]) continue;
      const projected = asArray(node[key]).map(item => projectConditionToField(item, field)).filter(Boolean);
      if (!projected.length) return null;
      return projected.length === 1 ? projected[0] : { [key]: projected };
    }
    if (node.not) {
      const projected = projectConditionToField(node.not, field);
      return projected ? { not: projected } : null;
    }
    return null;
  }

  function buildPartialDomainFindings(evaluated, definitions, inputs, displayInputs, triggeredFindings) {
    const byId = new Map(definitions.map(definition => [definition.id, definition]));
    const enteredFields = definitions
      .filter(definition => definition.visible !== false && hasEnteredValue(inputs[definition.id]))
      .map(definition => definition.id);
    const output = [];

    enteredFields.forEach(field => {
      const definition = byId.get(field) || { id: field, label: FIELD_LABELS[field] || humanise(field) };
      const triggered = triggeredFindings.filter(item => asArray(item.conditionFields).includes(field));
      if (triggered.length) return;

      const assessedFalse = asArray(evaluated.notMatchedRules).filter(item => asArray(item.conditionFields).includes(field));
      const relatedSkipped = asArray(evaluated.skippedRules).filter(item => asArray(item.conditionFields).includes(field));
      const relatedRules = [...assessedFalse, ...relatedSkipped];
      const fieldEvidence = relatedRules.map(rule => {
        const fieldCondition = projectConditionToField(rule.condition, field);
        return fieldCondition ? {
          rule,
          fieldCondition,
          state: RuleEngine.evaluateCondition(fieldCondition, inputs).state
        } : null;
      }).filter(Boolean);
      const pendingRestrictiveEvidence = fieldEvidence.filter(item =>
        item.rule.actionType !== "proceed" && item.state === true && relatedSkipped.includes(item.rule)
      );
      const clearFieldEvidence = fieldEvidence.filter(item =>
        (item.rule.actionType === "proceed" && item.state === true) ||
        (item.rule.actionType !== "proceed" && item.state === false)
      );
      const clearRules = unique([
        ...assessedFalse.map(item => item.ruleId),
        ...clearFieldEvidence.map(item => item.rule.ruleId)
      ]);
      const clearConditions = [
        ...assessedFalse.map(item => item.condition),
        ...clearFieldEvidence.map(item => item.fieldCondition)
      ].filter(Boolean);

      if (pendingRestrictiveEvidence.length) {
        const neededFields = unique(relatedSkipped.flatMap(item => item.missingFields || []))
          .filter(id => id !== field)
          .map(id => byId.get(id)?.label || FIELD_LABELS[id] || humanise(id));
        const neededContext = unique(relatedSkipped.flatMap(item => item.missingContext || [])).map(contextLabel);
        const needed = unique([...neededFields, ...neededContext]);
        output.push({
          ruleId: `PARTIAL_${String(field).toUpperCase()}_CONTEXT_REQUIRED`,
          displayTitle: `${definition.label}: possible threshold reached — context required`,
          actionType: "partial_context_required",
          action: { type: "partial_context_required", scope: "assessed domain only" },
          priority: 1,
          explanation: `${definition.label} ${displayInputs[field] || formatValue(inputs[field])} reaches an encoded threshold, but the final action also depends on ${needed.length ? needed.join(", ") : "additional protocol context"}. Do not treat this as clearance.`,
          source: pendingRestrictiveEvidence[0].rule.source || null,
          sourceText: unique(pendingRestrictiveEvidence.map(item => item.rule.sourceText)).join(" · ") || "Encoded protocol rules",
          conditionFields: [field],
          conditions: pendingRestrictiveEvidence.map(item => item.fieldCondition),
          contextRequired: true
        });
        return;
      }

      if (clearRules.length || clearConditions.length) {
        const evidenceWord = clearRules.length === 1 ? "rule" : "rules";
        output.push({
          ruleId: `PARTIAL_${String(field).toUpperCase()}_NO_RESTRICTION`,
          displayTitle: `${definition.label}: no restrictive threshold triggered`,
          actionType: "proceed_with_caution",
          action: { type: "proceed_with_caution", scope: "assessed domain only" },
          priority: 1,
          explanation: `${definition.label} ${displayInputs[field] || formatValue(inputs[field])} meets the encoded criterion or does not trigger the restrictive threshold in ${Math.max(1, clearRules.length)} assessed ${evidenceWord}. This is an assessed-domain result only and does not clear unassessed parts of the regimen.`,
          source: relatedRules[0]?.source || null,
          sourceText: unique(relatedRules.map(item => item.sourceText)).join(" · ") || "Encoded protocol rules",
          conditionFields: [field],
          conditions: clearConditions,
          domainAssessment: true,
          evaluatedRuleIds: clearRules
        });
        return;
      }

      if (relatedSkipped.length) {
        const missingFields = unique(relatedSkipped.flatMap(item => item.missingFields || []))
          .filter(id => id !== field)
          .map(id => byId.get(id)?.label || FIELD_LABELS[id] || humanise(id));
        const missingContext = unique(relatedSkipped.flatMap(item => item.missingContext || [])).map(contextLabel);
        const needed = unique([...missingFields, ...missingContext]);
        output.push({
          ruleId: `PARTIAL_${String(field).toUpperCase()}_CONTEXT_REQUIRED`,
          displayTitle: `${definition.label}: additional context required`,
          actionType: "partial_context_required",
          action: { type: "partial_context_required", scope: "assessed domain only" },
          priority: 1,
          explanation: `${definition.label} ${displayInputs[field] || formatValue(inputs[field])} was entered, but the relevant encoded pathway also requires ${needed.length ? needed.join(", ") : "additional protocol context"}. The value has been retained and has not been assumed normal or abnormal.`,
          source: relatedSkipped[0].source || null,
          sourceText: unique(relatedSkipped.map(item => RuleEngine.sourceText(item.source))).join(" · ") || "Encoded protocol rules",
          conditionFields: [field],
          conditions: relatedSkipped.map(item => item.condition).filter(Boolean),
          contextRequired: true
        });
        return;
      }

      output.push({
        ruleId: `PARTIAL_${String(field).toUpperCase()}_RECORDED`,
        displayTitle: `${definition.label}: value recorded`,
        actionType: "partial_context_required",
        action: { type: "partial_context_required", scope: "recorded context only" },
        priority: 1,
        explanation: `${definition.label} ${displayInputs[field] || formatValue(inputs[field])} was recorded. No standalone encoded action is attached to this field without another relevant clinical value or treatment context.`,
        source: null,
        sourceText: "No standalone rule encoded",
        conditionFields: [field],
        conditions: [],
        contextRequired: true
      });
    });

    return output;
  }

  function syntheticIraeFinding(protocol) {
    const source = protocol?.pembrolizumab_irae_rules?.source || { pages: [8, 9], table: 4 };
    return {
      ruleId: "ACTIVE_PEMBROLIZUMAB_IRAE_REQUIRES_DETAILED_REVIEW",
      actionType: "consultant_review",
      action: { type: "consultant_review", components: ["pembrolizumab"] },
      priority: RuleEngine.getActionPriority(protocol, "consultant_review"),
      explanation: "An active pembrolizumab immune-related adverse event was recorded. Use the toxicity-specific NCCP pathway and obtain senior clinical review before treatment.",
      source,
      sourceText: RuleEngine.sourceText(source),
      conditionFields: ["active_pembrolizumab_irae"]
    };
  }

  function assess(protocol, rawInputs, options = {}) {
    if (!protocol || typeof protocol !== "object") throw new Error("A protocol object is required.");
    const profile = getSelectedProfile(protocol, options.profileId);
    const definitions = getInputDefinitions(protocol, profile.id, rawInputs || {});
    const inputs = coerceInputs(definitions, rawInputs || {});
    const validation = validateInputs(definitions, inputs);
    const context = buildContext(protocol, profile, inputs);

    // Invalid entered data still blocks assessment. Missing data does not: the
    // rule engine evaluates every rule it can and reports the remainder as
    // unassessed coverage.
    if (validation.invalid.length) {
      return buildIncompleteResult(protocol, profile, context, inputs, definitions, validation, rawInputs || {});
    }

    const evaluated = RuleEngine.evaluate(protocol, inputs, context);
    const findings = evaluated.findings.map(finding => ({
      ...finding,
      action: resolveAction(finding.action, inputs)
    }));

    if (inputs.active_pembrolizumab_irae === true) {
      findings.push(syntheticIraeFinding(protocol));
      findings.sort((a, b) => b.priority - a.priority);
    }

    const skippedFields = unique(evaluated.skippedRules.flatMap(rule => rule.missingFields || []));
    const skippedContext = unique(evaluated.skippedRules.flatMap(rule => rule.missingContext || []));
    const definitionById = new Map(definitions.map(definition => [definition.id, definition]));
    const complete = evaluated.skippedRules.length === 0 && evaluated.errors.length === 0;
    const displayInputs = buildDisplayInputs(definitions, rawInputs || {}, inputs);
    const restrictiveFindings = findings.filter(finding => finding.actionType !== "proceed");
    const proceedFindings = findings.filter(finding => finding.actionType === "proceed");
    const partialDomainFindings = complete ? [] : buildPartialDomainFindings(evaluated, definitions, inputs, displayInputs, findings);
    const domainClearFindings = partialDomainFindings.filter(item => item.actionType === "proceed_with_caution");
    const contextRequiredFindings = partialDomainFindings.filter(item => item.actionType === "partial_context_required");
    const allFindings = [...findings, ...partialDomainFindings].sort((a, b) => (b.priority || 0) - (a.priority || 0));
    const hasEnteredClinicalValue = definitions.some(definition => definition.visible !== false && hasEnteredValue(inputs[definition.id]));

    let actionType;
    if (restrictiveFindings.length) {
      // A positive restrictive rule remains actionable even when unrelated
      // domains were not entered. This is the core single-value behaviour.
      actionType = restrictiveFindings[0].actionType;
    } else if (complete && proceedFindings.length) {
      actionType = "proceed";
    } else if (proceedFindings.length || domainClearFindings.length) {
      actionType = "proceed_with_caution";
    } else if (contextRequiredFindings.length || hasEnteredClinicalValue) {
      actionType = "partial_context_required";
    } else if (!complete) {
      actionType = "incomplete";
    } else {
      actionType = "consultant_review";
    }

    const recommendation = restrictiveFindings.length && !complete
      ? `${buildRecommendation(protocol, actionType, findings)} This is a partial assessment; review the listed unassessed domains before any final treatment decision.`
      : actionType === "incomplete"
        ? "No clinical value was supplied. Enter any relevant value to obtain an immediate partial assessment; missing fields are not assumed normal."
        : actionType === "partial_context_required"
          ? "The entered value has been assessed as far as the encoded pathway allows, but additional linked context is required to determine a treatment action. Unrelated fields remain optional."
          : actionType === "proceed_with_caution"
            ? "No restrictive rule was triggered in the assessed domain or domains. This is not an overall proceed decision because one or more clinical domains were not assessed."
            : buildRecommendation(protocol, actionType, findings);

    return {
      complete,
      coverageComplete: skippedFields.length === 0,
      partialAssessment: !complete,
      actionType,
      status: actionType === "incomplete" ? "No assessment value entered" : (ACTION_LABELS[actionType] || humanise(actionType)),
      statusClass: STATUS_CLASS[actionType] || "warn",
      recommendation,
      protocol: {
        id: protocol.protocol_id,
        title: getProtocolTitle(protocol),
        code: getProtocolCode(protocol),
        version: protocol?.metadata?.nccp_version,
        validationStatus: protocol.status
      },
      profile,
      context,
      definitions,
      inputs,
      displayInputs,
      missing: [],
      unassessed: [
        ...skippedFields.map(field => ({
          id: field,
          label: definitionById.get(field)?.label || FIELD_LABELS[field] || humanise(field)
        })),
        ...skippedContext.map(item => ({
          id: `context_${item}`,
          label: contextLabel(item)
        }))
      ].filter((item, index, array) => array.findIndex(other => other.id === item.id) === index),
      invalid: [],
      findings: allFindings,
      skippedRules: evaluated.skippedRules,
      notMatchedRules: evaluated.notMatchedRules,
      errors: evaluated.errors,
      applicableRuleCount: evaluated.applicableRuleCount,
      assessedRuleCount: Math.max(0, evaluated.applicableRuleCount - evaluated.skippedRules.length)
    };
  }

  function buildIncompleteResult(protocol, profile, context, inputs, definitions, validation, rawInputs = {}) {
    return {
      complete: false,
      coverageComplete: false,
      actionType: "incomplete",
      status: "Assessment incomplete",
      statusClass: "warn",
      recommendation: "Correct the invalid entered value or values highlighted below, then run the assessment again. Blank fields remain optional and are not treated as normal.",
      protocol: {
        id: protocol.protocol_id,
        title: getProtocolTitle(protocol),
        code: getProtocolCode(protocol),
        version: protocol?.metadata?.nccp_version,
        validationStatus: protocol.status
      },
      profile,
      context,
      definitions,
      inputs,
      displayInputs: buildDisplayInputs(definitions, rawInputs, inputs),
      missing: validation.missing,
      unassessed: [],
      invalid: validation.invalid,
      findings: [],
      skippedRules: [],
      errors: [],
      applicableRuleCount: 0,
      assessedRuleCount: 0
    };
  }


  function resolveAction(action, inputs) {
    const resolved = { ...(action || {}) };
    const basisField = resolved.dose_basis_field || resolved.dose_input_field;
    const basis = basisField ? Number(inputs[basisField]) : null;

    if (Number.isFinite(basis) && Number.isFinite(Number(resolved.dose_percent))) {
      resolved.calculated_dose_mg_m2 = basis * Number(resolved.dose_percent) / 100;
      resolved.calculated_from_field = basisField;
    }

    if (Number.isFinite(basis) && Number.isFinite(Number(resolved.dose_change_mg_m2))) {
      resolved.calculated_dose_mg_m2 = Math.max(0, basis + Number(resolved.dose_change_mg_m2));
      resolved.calculated_from_field = basisField;
    }

    return resolved;
  }

  function buildRecommendation(protocol, actionType, findings) {
    const top = findings.filter(finding => finding.actionType === actionType);
    const specific = unique(top.map(finding => finding.explanation));
    if (specific.length) return specific.join(" ");
    return protocol?.output_templates?.[actionType] || ACTION_LABELS[actionType] || humanise(actionType);
  }

  function actionDetail(action) {
    const parts = [];
    if (action.components?.length) parts.push(`Components: ${action.components.join(", ")}`);
    if (action.dose_percent !== undefined) parts.push(`Dose: ${action.dose_percent}%`);
    if (action.dose_percent_of_previous !== undefined) parts.push(`Dose: ${action.dose_percent_of_previous}% of previous`);
    if (action.dose_change_mg_m2 !== undefined) parts.push(`Dose change: ${action.dose_change_mg_m2} mg/m²`);
    if (action.calculated_dose_mg_m2 !== undefined) {
      const value = Number(action.calculated_dose_mg_m2);
      parts.push(`Calculated dose: ${Number.isInteger(value) ? value : value.toFixed(1)} mg/m²`);
    }
    if (action.dose_mg_m2 !== undefined) parts.push(`Dose: ${action.dose_mg_m2} mg/m²`);
    if (action.dose_level_change !== undefined) parts.push(`Dose-level change: ${action.dose_level_change}`);
    if (action.dose_mg_twice_daily !== undefined) parts.push(`Dose: ${action.dose_mg_twice_daily} mg twice daily`);
    if (action.total_daily_dose_mg !== undefined) parts.push(`Total daily dose: ${action.total_daily_dose_mg} mg`);
    if (action.dose?.value !== undefined) parts.push(`Dose: ${action.dose.value} ${action.dose.unit || ""}`.trim());
    if (action.until) parts.push(`Until: ${action.until}`);
    if (action.maximum_delay_weeks !== undefined) parts.push(`Maximum delay: ${action.maximum_delay_weeks} weeks`);
    if (action.scope) parts.push(`Scope: ${action.scope}`);
    return parts.join(" · ");
  }

  function documentationSummary(result, assessmentId) {
    const lines = [
      "SACTCheck JSON protocol assessment",
      "",
      `Assessment ID: ${assessmentId || "Not entered"}`,
      `Protocol: ${result.protocol.title}`,
      `NCCP code/version: ${result.protocol.code}${result.protocol.version ? ` / ${result.protocol.version}` : ""}`,
      `Assessment profile: ${result.profile.label}`,
      ...(result.context.indicationLabel ? [`Indication: ${result.context.indicationLabel}`] : []),
      `Assessment time: ${result.context.assessedAt}`,
      "",
      `Overall encoded action: ${result.status}`,
      `Recommendation: ${result.recommendation}`,
      `Rule coverage: ${result.assessedRuleCount} of ${result.applicableRuleCount} applicable rules evaluated.`,
      "",
      "Entered values:"
    ];

    result.definitions.forEach(definition => {
      if (definition.visible === false && (result.inputs[definition.id] === null || result.inputs[definition.id] === undefined)) return;
      const displayValue = result.displayInputs?.[definition.id] ?? formatValue(result.inputs[definition.id]);
      lines.push(`- ${definition.label}: ${displayValue}`);
    });

    lines.push("", "Triggered rules:");
    if (result.findings.length) {
      result.findings.forEach(finding => {
        const detail = actionDetail(finding.action);
        lines.push(`- ${finding.displayTitle || finding.ruleId}: ${finding.explanation}${detail ? ` ${detail}.` : ""} (${finding.sourceText})`);
      });
    } else {
      lines.push("- No assessment finding was generated.");
    }

    if (result.missing.length || result.unassessed?.length || result.invalid.length || result.errors.length) {
      lines.push("", "Outstanding issues:");
      result.missing.forEach(item => lines.push(`- Required but missing: ${item.label}`));
      asArray(result.unassessed).forEach(item => lines.push(`- Optional domain not assessed: ${item.label}`));
      result.invalid.forEach(item => lines.push(`- Invalid: ${item.label} (${item.reason})`));
      result.errors.forEach(item => lines.push(`- Rule error ${item.ruleId}: ${item.message}`));
    }

    lines.push(
      "",
      "Prototype decision support only. Confirm the current NCCP regimen, local policy, prescribing review and pharmacy verification. This output does not replace independent clinical judgement."
    );

    return lines.join("\n");
  }

  function formatValue(value) {
    if (value === true) return "Yes";
    if (value === false) return "No";
    if (value === null || value === undefined || value === "") return "Not entered";
    return String(value);
  }

  function validateProtocol(protocol) {
    const validator = typeof globalThis !== "undefined" ? globalThis.SACTCheckProtocolValidator : null;
    if (validator?.validate) {
      const detailed = validator.validate(protocol, { strict: true });
      return {
        ...detailed,
        errors: detailed.errors.map(item => item.message || String(item)),
        warnings: detailed.warnings.map(item => item.message || String(item)),
        detailedErrors: detailed.errors,
        detailedWarnings: detailed.warnings
      };
    }

    const errors = [];
    const warnings = [];
    if (!protocol || typeof protocol !== "object") errors.push("Protocol must be an object.");
    if (!protocol?.protocol_id) warnings.push("Protocol has no protocol_id.");
    if (!asArray(protocol?.rule_engine?.rules).length) errors.push("Protocol has no rule_engine.rules array.");
    if (!getProfiles(protocol).some(profile => profile.requiredInputs.length)) warnings.push("Protocol has no required-input declaration.");
    if (!explicitInputDefinitions(protocol).size) warnings.push("Protocol has no explicit input_definitions.");
    return { valid: errors.length === 0, errors, warnings };
  }

  return Object.freeze({
    version: "0.37.2",
    getProfiles,
    getInputDefinitions,
    explicitInputDefinitions,
    getProtocolTitle,
    getProtocolCode,
    assess,
    documentationSummary,
    actionDetail,
    validateProtocol,
    actionLabels: ACTION_LABELS
  });
});
