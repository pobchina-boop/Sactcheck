/**
 * SACTCheck Protocol Validator v0.17
 * Browser + Node compatible structural and semantic validation for protocol JSON.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SACTCheckProtocolValidator = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const SUPPORTED_INPUT_TYPES = Object.freeze(["number", "boolean", "select", "text"]);
  const SUPPORTED_OPERATORS = Object.freeze([
    "==", "===", "!=", "!==", ">", ">=", "<", "<=",
    "between", "between_inclusive", "outside", "in", "not_in",
    "exists", "missing", "contains"
  ]);
  const SUPPORTED_ACTION_TYPES = Object.freeze([
    "permanently_discontinue", "contraindicated", "discontinue", "cease", "omit",
    "withhold_then_reduce", "withhold", "delay_then_dose_reduce", "delay",
    "consultant_review", "dose_reduce_two_levels", "dose_reduce_one_level",
    "dose_reduce", "proceed_with_caution", "proceed"
  ]);

  function asArray(value) {
    if (value === undefined || value === null) return [];
    return Array.isArray(value) ? value : [value];
  }

  function isObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function humanise(value) {
    return String(value || "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, character => character.toUpperCase());
  }

  function versionMajor(value) {
    const match = String(value || "").match(/^(\d+)/);
    return match ? Number(match[1]) : 0;
  }

  function normaliseInputDefinitions(protocol) {
    const raw = protocol?.input_definitions || protocol?.assessment?.inputs || {};
    const definitions = new Map();
    const duplicates = [];

    if (Array.isArray(raw)) {
      raw.forEach(item => {
        if (!isObject(item) || !item.id) return;
        if (definitions.has(item.id)) duplicates.push(item.id);
        definitions.set(item.id, { ...item });
      });
    } else if (isObject(raw)) {
      Object.entries(raw).forEach(([id, item]) => {
        if (!isObject(item)) return;
        if (definitions.has(id)) duplicates.push(id);
        definitions.set(id, { id, ...item });
      });
    }

    return { definitions, duplicates };
  }

  function conditionFromRule(rule) {
    if (!rule || typeof rule !== "object") return null;
    if (rule.when) return rule.when;
    if (rule.condition) return rule.condition;
    const condition = {};
    ["all", "any", "none", "not", "field", "operator", "value", "expected", "threshold"].forEach(key => {
      if (rule[key] !== undefined) condition[key] = rule[key];
    });
    return Object.keys(condition).length ? condition : null;
  }

  function walkCondition(node, visitor, path = "condition") {
    if (node === undefined || node === null) return;
    if (Array.isArray(node)) {
      node.forEach((item, index) => walkCondition(item, visitor, `${path}[${index}]`));
      return;
    }
    if (!isObject(node)) {
      visitor({ type: "invalid", node, path });
      return;
    }

    if (node.all !== undefined) walkCondition(node.all, visitor, `${path}.all`);
    if (node.any !== undefined) walkCondition(node.any, visitor, `${path}.any`);
    if (node.none !== undefined) walkCondition(node.none, visitor, `${path}.none`);
    if (node.not !== undefined) walkCondition(node.not, visitor, `${path}.not`);

    if (node.field !== undefined || node.input !== undefined || node.path !== undefined) {
      visitor({
        type: "leaf",
        field: node.field || node.input || node.path,
        operator: node.operator || node.op || "==",
        value: node.value !== undefined ? node.value : node.expected !== undefined ? node.expected : node.threshold,
        node,
        path
      });
    }
  }

  function collectConditionFields(node) {
    const fields = [];
    walkCondition(node, entry => {
      if (entry.type === "leaf" && entry.field) fields.push(entry.field);
    });
    return [...new Set(fields)];
  }

  function allRuleCollections(protocol) {
    const collections = [
      ["rule_engine.rules", protocol?.rule_engine?.rules],
      ["decision_rules", protocol?.decision_rules]
    ];
    return collections.flatMap(([name, rules]) => asArray(rules).map((rule, index) => ({
      collection: name,
      index,
      rule
    })));
  }

  function requiredInputReferences(protocol) {
    const references = [];
    asArray(protocol?.required_inputs).forEach(id => references.push({ id, location: "required_inputs" }));
    const grouped = protocol?.required_inputs_by_phase;
    if (isObject(grouped)) {
      Object.entries(grouped).forEach(([profile, ids]) => {
        asArray(ids).forEach(id => references.push({ id, location: `required_inputs_by_phase.${profile}` }));
      });
    }
    asArray(protocol?.assessment_profiles).forEach((profile, index) => {
      asArray(profile?.required_inputs).forEach(id => references.push({
        id,
        location: `assessment_profiles[${index}].required_inputs`
      }));
    });
    return references;
  }

  function addIssue(target, code, message, path, extra = {}) {
    target.push({ code, message, path: path || null, ...extra });
  }

  function validate(protocol, options = {}) {
    const strict = options.strict !== false;
    const errors = [];
    const warnings = [];

    if (!isObject(protocol)) {
      addIssue(errors, "PROTOCOL_NOT_OBJECT", "Protocol must be a JSON object.", "$" );
      return result(protocol, errors, warnings, new Map(), []);
    }

    if (!protocol.schema_version || typeof protocol.schema_version !== "string") {
      addIssue(errors, "SCHEMA_VERSION_REQUIRED", "schema_version is required and must be a string.", "schema_version");
    }
    if (!protocol.protocol_id || typeof protocol.protocol_id !== "string") {
      addIssue(errors, "PROTOCOL_ID_REQUIRED", "protocol_id is required and must be a stable string.", "protocol_id");
    }
    if (!protocol.status || typeof protocol.status !== "string") {
      addIssue(errors, "STATUS_REQUIRED", "status is required.", "status");
    }

    const metadata = protocol.metadata;
    if (!isObject(metadata)) {
      addIssue(errors, "METADATA_REQUIRED", "metadata is required.", "metadata");
    } else {
      const requiredMetadata = ["nccp_regimen_code", "nccp_version", "title"];
      requiredMetadata.forEach(key => {
        if (!metadata[key]) addIssue(errors, "METADATA_FIELD_REQUIRED", `metadata.${key} is required.`, `metadata.${key}`);
      });
      if (!metadata.tumour_group && !asArray(metadata.tumour_groups).length) {
        addIssue(errors, "TUMOUR_GROUP_REQUIRED", "A tumour group is required in metadata.tumour_group or metadata.tumour_groups.", "metadata");
      }
      if (!metadata.source_url) {
        addIssue(warnings, "SOURCE_URL_MISSING", "metadata.source_url is not present.", "metadata.source_url");
      }
      if (!metadata.review_date) {
        addIssue(warnings, "REVIEW_DATE_MISSING", "metadata.review_date is not present.", "metadata.review_date");
      }
    }

    const { definitions, duplicates } = normaliseInputDefinitions(protocol);
    duplicates.forEach(id => addIssue(errors, "DUPLICATE_INPUT_ID", `Input definition '${id}' is duplicated.`, "input_definitions", { inputId: id }));

    if (!definitions.size) {
      const major = versionMajor(protocol.schema_version);
      const target = strict && major >= 2 ? errors : warnings;
      addIssue(target, "INPUT_DEFINITIONS_MISSING", "Explicit input_definitions are required for plug-in protocol publishing.", "input_definitions");
    }

    definitions.forEach((definition, id) => {
      const base = `input_definitions.${id}`;
      if (!definition.label || typeof definition.label !== "string") {
        addIssue(errors, "INPUT_LABEL_REQUIRED", `Input '${id}' requires a label.`, `${base}.label`, { inputId: id });
      }
      if (!SUPPORTED_INPUT_TYPES.includes(definition.type)) {
        addIssue(errors, "INPUT_TYPE_UNSUPPORTED", `Input '${id}' has unsupported type '${definition.type}'.`, `${base}.type`, { inputId: id });
      }
      if (definition.type === "select") {
        if (!Array.isArray(definition.options) || !definition.options.length) {
          addIssue(errors, "SELECT_OPTIONS_REQUIRED", `Select input '${id}' requires a non-empty options array.`, `${base}.options`, { inputId: id });
        } else {
          const optionValues = new Set();
          definition.options.forEach((option, index) => {
            if (!isObject(option) || option.value === undefined || option.label === undefined) {
              addIssue(errors, "SELECT_OPTION_INVALID", `Select input '${id}' has an invalid option at index ${index}.`, `${base}.options[${index}]`, { inputId: id });
              return;
            }
            const key = JSON.stringify(option.value);
            if (optionValues.has(key)) {
              addIssue(errors, "SELECT_OPTION_DUPLICATE", `Select input '${id}' has duplicate option value '${option.value}'.`, `${base}.options[${index}]`, { inputId: id });
            }
            optionValues.add(key);
          });
        }
      }
      if (definition.type === "number") {
        if (definition.min !== undefined && typeof definition.min !== "number") {
          addIssue(errors, "INPUT_MIN_INVALID", `Input '${id}' min must be numeric.`, `${base}.min`, { inputId: id });
        }
        if (definition.max !== undefined && typeof definition.max !== "number") {
          addIssue(errors, "INPUT_MAX_INVALID", `Input '${id}' max must be numeric.`, `${base}.max`, { inputId: id });
        }
        if (typeof definition.min === "number" && typeof definition.max === "number" && definition.min > definition.max) {
          addIssue(errors, "INPUT_RANGE_INVALID", `Input '${id}' min cannot exceed max.`, base, { inputId: id });
        }
      }
      if (definition.required !== undefined && typeof definition.required !== "boolean") {
        addIssue(errors, "INPUT_REQUIRED_INVALID", `Input '${id}' required must be boolean.`, `${base}.required`, { inputId: id });
      }

      ["visible_when", "required_when"].forEach(property => {
        const condition = definition[property];
        if (condition === undefined) return;
        if (!isObject(condition)) {
          addIssue(errors, "INPUT_CONDITION_INVALID", `Input '${id}' ${property} must be a condition object.`, `${base}.${property}`, { inputId: id });
          return;
        }
        walkCondition(condition, entry => {
          if (entry.type === "invalid" || !entry.field) {
            addIssue(errors, "INPUT_CONDITION_INVALID", `Input '${id}' ${property} contains an invalid condition.`, `${base}.${property}.${entry.path}`, { inputId: id });
            return;
          }
          if (!SUPPORTED_OPERATORS.includes(entry.operator)) {
            addIssue(errors, "INPUT_CONDITION_OPERATOR_UNSUPPORTED", `Input '${id}' ${property} uses unsupported operator '${entry.operator}'.`, `${base}.${property}.${entry.path}`, { inputId: id });
          }
          if (entry.field === id) {
            addIssue(errors, "INPUT_CONDITION_SELF_REFERENCE", `Input '${id}' ${property} cannot depend on itself.`, `${base}.${property}`, { inputId: id });
          }
          if (definitions.size && !definitions.has(entry.field) && !String(entry.field).startsWith("context.")) {
            addIssue(errors, "INPUT_CONDITION_FIELD_UNDEFINED", `Input '${id}' ${property} refers to undefined input '${entry.field}'.`, `${base}.${property}.${entry.path}`, { inputId: id, dependencyId: entry.field });
          }
        });
      });

      if (definition.demo_value === undefined) {
        addIssue(warnings, "DEMO_VALUE_MISSING", `Input '${id}' has no demo_value for protocol preview.`, `${base}.demo_value`, { inputId: id });
      }
    });

    requiredInputReferences(protocol).forEach(reference => {
      if (typeof reference.id !== "string" || !reference.id) {
        addIssue(errors, "REQUIRED_INPUT_INVALID", "Required input references must be non-empty strings.", reference.location);
      } else if (definitions.size && !definitions.has(reference.id)) {
        addIssue(errors, "REQUIRED_INPUT_UNDEFINED", `Required input '${reference.id}' has no input definition.`, reference.location, { inputId: reference.id });
      }
    });

    const seenRuleIds = new Set();
    const conditionFields = new Set();
    const ruleRecords = allRuleCollections(protocol);
    if (!ruleRecords.length) {
      addIssue(errors, "RULES_REQUIRED", "At least one decision-rule collection is required.", "rule_engine.rules");
    }

    ruleRecords.forEach(record => {
      const rule = record.rule;
      const path = `${record.collection}[${record.index}]`;
      if (!isObject(rule)) {
        addIssue(errors, "RULE_INVALID", "Each rule must be an object.", path);
        return;
      }
      const ruleId = rule.rule_id || rule.id;
      if (!ruleId) {
        addIssue(errors, "RULE_ID_REQUIRED", "Each rule requires rule_id or id.", `${path}.rule_id`);
      } else if (seenRuleIds.has(ruleId)) {
        addIssue(errors, "DUPLICATE_RULE_ID", `Rule ID '${ruleId}' is duplicated.`, `${path}.rule_id`, { ruleId });
      } else {
        seenRuleIds.add(ruleId);
      }

      const condition = conditionFromRule(rule);
      const fallbackRule = rule.when_no_other_rule_matches === true ||
        Object.keys(rule).some(key => key.startsWith("when_no_other_") && rule[key] === true);
      if (!condition && !fallbackRule) {
        addIssue(errors, "RULE_CONDITION_REQUIRED", `Rule '${ruleId || record.index}' has no condition.`, path, { ruleId });
      } else if (condition) {
        walkCondition(condition, entry => {
          if (entry.type === "invalid") {
            addIssue(errors, "CONDITION_INVALID", `Rule '${ruleId || record.index}' contains an invalid condition.`, `${path}.${entry.path}`, { ruleId });
            return;
          }
          if (!entry.field) {
            addIssue(errors, "CONDITION_FIELD_REQUIRED", `Rule '${ruleId || record.index}' contains a condition without a field.`, `${path}.${entry.path}`, { ruleId });
            return;
          }
          conditionFields.add(entry.field);
          if (!SUPPORTED_OPERATORS.includes(entry.operator)) {
            addIssue(errors, "OPERATOR_UNSUPPORTED", `Rule '${ruleId || record.index}' uses unsupported operator '${entry.operator}'.`, `${path}.${entry.path}.operator`, { ruleId });
          }
          if (definitions.size && !definitions.has(entry.field) && !String(entry.field).startsWith("context.")) {
            addIssue(errors, "RULE_FIELD_UNDEFINED", `Rule '${ruleId || record.index}' refers to undefined input '${entry.field}'.`, `${path}.${entry.path}.field`, { ruleId, inputId: entry.field });
          }
        });
      }

      const action = rule.action || rule.outcome || rule.recommendation;
      if (!isObject(action)) {
        addIssue(errors, "RULE_ACTION_REQUIRED", `Rule '${ruleId || record.index}' requires an action object.`, `${path}.action`, { ruleId });
      } else if (!SUPPORTED_ACTION_TYPES.includes(action.type)) {
        addIssue(errors, "ACTION_TYPE_UNSUPPORTED", `Rule '${ruleId || record.index}' uses unsupported action type '${action.type}'.`, `${path}.action.type`, { ruleId });
      }

      if (!rule.source) {
        addIssue(warnings, "RULE_SOURCE_MISSING", `Rule '${ruleId || record.index}' has no source reference.`, `${path}.source`, { ruleId });
      }
      if (!rule.explanation && !rule.description && !rule.message && !rule.action?.message) {
        addIssue(warnings, "RULE_EXPLANATION_MISSING", `Rule '${ruleId || record.index}' has no explanation.`, path, { ruleId });
      }
    });

    if (!isObject(protocol.output_templates)) {
      addIssue(warnings, "OUTPUT_TEMPLATES_MISSING", "output_templates are recommended for consistent summaries.", "output_templates");
    }

    return result(protocol, errors, warnings, definitions, [...conditionFields]);
  }

  function result(protocol, errors, warnings, definitions, conditionFields) {
    const rules = allRuleCollections(protocol);
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      summary: {
        protocolId: protocol?.protocol_id || null,
        title: protocol?.metadata?.short_title || protocol?.metadata?.title || null,
        inputCount: definitions.size,
        ruleCount: rules.length,
        referencedInputCount: conditionFields.length,
        errorCount: errors.length,
        warningCount: warnings.length
      }
    };
  }

  function buildIndexEntry(protocol, relativePath) {
    const metadata = protocol?.metadata || {};
    const groups = asArray(metadata.tumour_groups || metadata.tumour_group).filter(Boolean);
    const migration = metadata.migration || {};
    const entry = {
      id: protocol.protocol_id,
      tumour_group: groups.length === 1 ? groups[0] : groups,
      path: String(relativePath).replace(/\\/g, "/"),
      enabled: metadata.catalog?.enabled !== false
    };
    if (migration.mode) entry.mode = migration.mode;
    if (migration.legacy_card_id) entry.legacy_card_id = migration.legacy_card_id;
    return entry;
  }

  function formatIssues(validation) {
    return [
      ...validation.errors.map(item => `ERROR ${item.code}: ${item.message}${item.path ? ` [${item.path}]` : ""}`),
      ...validation.warnings.map(item => `WARNING ${item.code}: ${item.message}${item.path ? ` [${item.path}]` : ""}`)
    ];
  }

  return Object.freeze({
    version: "0.17.0",
    SUPPORTED_INPUT_TYPES,
    SUPPORTED_OPERATORS,
    SUPPORTED_ACTION_TYPES,
    normaliseInputDefinitions,
    conditionFromRule,
    collectConditionFields,
    validate,
    buildIndexEntry,
    formatIssues,
    humanise
  });
});
