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
    current_dose_level: "Current dose level"
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
    proceed_with_caution: "Proceed with caution",
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

  function getProtocolTitle(protocol) {
    return protocol?.metadata?.short_title || protocol?.metadata?.title || protocol?.file_name || "Unnamed protocol";
  }

  function getProtocolCode(protocol) {
    return protocol?.metadata?.nccp_regimen_code || protocol?.protocol_id || "Not specified";
  }

  function getProfiles(protocol) {
    const grouped = protocol.required_inputs_by_phase;
    if (grouped && typeof grouped === "object" && !Array.isArray(grouped)) {
      return Object.entries(grouped).map(([id, requiredInputs]) => ({
        id,
        label: profileLabel(id),
        requiredInputs: asArray(requiredInputs),
        context: inferProfileContext(protocol, id)
      }));
    }

    return [{
      id: "default",
      label: "Standard assessment",
      requiredInputs: asArray(protocol.required_inputs),
      context: inferProfileContext(protocol, "default")
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

  function getInputDefinitions(protocol, profileId) {
    const profile = getSelectedProfile(protocol, profileId);
    const potentialRules = getPotentialRules(protocol, profile.context);
    const conditionFields = unique(potentialRules.flatMap(rule =>
      RuleEngine.collectConditionFields(RuleEngine.conditionFromRule(rule))
    ));
    const fields = unique([...profile.requiredInputs, ...conditionFields]);

    return fields.map(field => buildInputDefinition(protocol, field, profile.requiredInputs.includes(field), potentialRules, profile));
  }

  function buildInputDefinition(protocol, field, explicitlyRequired, potentialRules, profile) {
    const expectedValues = unique(potentialRules.flatMap(rule =>
      collectExpectedValues(RuleEngine.conditionFromRule(rule), field)
    ));

    const definition = {
      id: field,
      label: FIELD_LABELS[field] || humanise(field),
      required: true,
      explicitlyRequired,
      type: "number",
      step: "0.01",
      min: 0,
      options: []
    };

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
        value: item.indication_id,
        label: item.description
      }));
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
    definitions.forEach(definition => {
      const raw = rawInputs[definition.id];
      if (raw === undefined || raw === null || raw === "") {
        inputs[definition.id] = null;
      } else if (definition.type === "number") {
        inputs[definition.id] = Number(raw);
      } else if (definition.type === "boolean") {
        inputs[definition.id] = raw === true || raw === "true";
      } else {
        inputs[definition.id] = raw;
      }
    });
    return inputs;
  }

  function validateInputs(definitions, inputs) {
    const missing = [];
    const invalid = [];

    definitions.forEach(definition => {
      const value = inputs[definition.id];
      if (definition.required && (value === null || value === undefined || value === "")) {
        missing.push({ id: definition.id, label: definition.label });
        return;
      }
      if (definition.type === "number" && value !== null && !Number.isFinite(value)) {
        invalid.push({ id: definition.id, label: definition.label, reason: "must be a valid number" });
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

    return {
      ...profile.context,
      activeComponents,
      cycle: inputs.cycle_number,
      day: selectedDay,
      schedule: inputs.schedule_q3w_or_q6w,
      protocolId: protocol.protocol_id,
      protocolTitle: getProtocolTitle(protocol),
      assessedAt: new Date().toISOString()
    };
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
    const definitions = getInputDefinitions(protocol, profile.id);
    const inputs = coerceInputs(definitions, rawInputs || {});
    const validation = validateInputs(definitions, inputs);
    const context = buildContext(protocol, profile, inputs);

    if (validation.missing.length || validation.invalid.length) {
      return buildIncompleteResult(protocol, profile, context, inputs, definitions, validation);
    }

    const evaluated = RuleEngine.evaluate(protocol, inputs, context);
    const findings = [...evaluated.findings];

    if (inputs.active_pembrolizumab_irae === true) {
      findings.push(syntheticIraeFinding(protocol));
      findings.sort((a, b) => b.priority - a.priority);
    }

    const skippedFields = unique(evaluated.skippedRules.flatMap(rule => rule.missingFields));
    const complete = skippedFields.length === 0 && evaluated.errors.length === 0;
    let actionType = findings.length ? findings[0].actionType : "consultant_review";

    if (!complete) actionType = "incomplete";

    return {
      complete,
      actionType,
      status: actionType === "incomplete" ? "Assessment incomplete" : (ACTION_LABELS[actionType] || humanise(actionType)),
      statusClass: STATUS_CLASS[actionType] || "warn",
      recommendation: actionType === "incomplete"
        ? "Some applicable encoded rules could not be evaluated because information is missing."
        : buildRecommendation(protocol, actionType, findings),
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
      missing: skippedFields.map(field => ({ id: field, label: FIELD_LABELS[field] || humanise(field) })),
      invalid: [],
      findings,
      skippedRules: evaluated.skippedRules,
      errors: evaluated.errors,
      applicableRuleCount: evaluated.applicableRuleCount,
      assessedRuleCount: evaluated.applicableRuleCount - evaluated.skippedRules.length
    };
  }

  function buildIncompleteResult(protocol, profile, context, inputs, definitions, validation) {
    return {
      complete: false,
      actionType: "incomplete",
      status: "Assessment incomplete",
      statusClass: "warn",
      recommendation: "Complete all displayed fields before relying on the encoded rule assessment.",
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
      missing: validation.missing,
      invalid: validation.invalid,
      findings: [],
      skippedRules: [],
      errors: [],
      applicableRuleCount: 0,
      assessedRuleCount: 0
    };
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
      `Assessment time: ${result.context.assessedAt}`,
      "",
      `Overall encoded action: ${result.status}`,
      `Recommendation: ${result.recommendation}`,
      `Rule coverage: ${result.assessedRuleCount} of ${result.applicableRuleCount} applicable rules evaluated.`,
      "",
      "Entered values:"
    ];

    result.definitions.forEach(definition => {
      const value = result.inputs[definition.id];
      lines.push(`- ${definition.label}: ${formatValue(value)}`);
    });

    lines.push("", "Triggered rules:");
    if (result.findings.length) {
      result.findings.forEach(finding => {
        const detail = actionDetail(finding.action);
        lines.push(`- ${finding.ruleId}: ${finding.explanation}${detail ? ` ${detail}.` : ""} (${finding.sourceText})`);
      });
    } else {
      lines.push("- No encoded rule was triggered.");
    }

    if (result.missing.length || result.invalid.length || result.errors.length) {
      lines.push("", "Outstanding issues:");
      result.missing.forEach(item => lines.push(`- Missing: ${item.label}`));
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
    const errors = [];
    const warnings = [];
    if (!protocol || typeof protocol !== "object") errors.push("Protocol must be an object.");
    if (!protocol?.protocol_id) warnings.push("Protocol has no protocol_id.");
    if (!asArray(protocol?.rule_engine?.rules).length) errors.push("Protocol has no rule_engine.rules array.");
    if (!getProfiles(protocol).some(profile => profile.requiredInputs.length)) warnings.push("Protocol has no required-input declaration.");
    return { valid: errors.length === 0, errors, warnings };
  }

  return Object.freeze({
    version: "0.1.0",
    getProfiles,
    getInputDefinitions,
    getProtocolTitle,
    getProtocolCode,
    assess,
    documentationSummary,
    actionDetail,
    validateProtocol,
    actionLabels: ACTION_LABELS
  });
});
