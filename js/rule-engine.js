/**
 * SACTCheck Rule Engine
 * Pure deterministic evaluation of machine-readable protocol rules.
 *
 * The engine deliberately has no DOM dependencies. It can therefore be
 * tested independently and reused by future interfaces.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SACTCheckRuleEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const DEFAULT_PRIORITY = Object.freeze({
    permanently_discontinue: 100,
    contraindicated: 98,
    discontinue: 96,
    cease: 96,
    omit: 90,
    withhold_then_reduce: 86,
    withhold: 84,
    delay_then_dose_reduce: 82,
    delay: 80,
    consultant_review: 65,
    dose_reduce_two_levels: 60,
    dose_reduce_one_level: 58,
    dose_reduce: 56,
    proceed_with_caution: 45,
    proceed: 10
  });

  function asArray(value) {
    if (value === undefined || value === null) return [];
    return Array.isArray(value) ? value : [value];
  }

  function isObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function hasValue(value) {
    return value !== undefined && value !== null && value !== "";
  }

  function toNumber(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  function normaliseScalar(value) {
    const numeric = toNumber(value);
    return numeric === null ? value : numeric;
  }

  function compare(actual, operator, expected) {
    const op = String(operator || "==").toLowerCase();
    const a = normaliseScalar(actual);
    const e = normaliseScalar(expected);

    switch (op) {
      case "==":
      case "=":
      case "eq":
      case "equals":
        return a === e;
      case "!=":
      case "<>":
      case "neq":
      case "not_equals":
        return a !== e;
      case ">":
      case "gt":
        return a > e;
      case ">=":
      case "gte":
        return a >= e;
      case "<":
      case "lt":
        return a < e;
      case "<=":
      case "lte":
        return a <= e;
      case "between_inclusive":
      case "between": {
        const values = asArray(expected).map(normaliseScalar);
        return values.length >= 2 && a >= values[0] && a <= values[1];
      }
      case "between_exclusive": {
        const values = asArray(expected).map(normaliseScalar);
        return values.length >= 2 && a > values[0] && a < values[1];
      }
      case "in":
      case "one_of":
        return asArray(expected).some(item => normaliseScalar(item) === a);
      case "not_in":
        return !asArray(expected).some(item => normaliseScalar(item) === a);
      case "outside": {
        const values = asArray(expected).map(normaliseScalar);
        return values.length >= 2 && (a < values[0] || a > values[1]);
      }
      case "contains":
        if (Array.isArray(actual)) return actual.some(item => normaliseScalar(item) === e);
        return typeof actual === "string" && actual.includes(String(expected));
      case "exists":
        return hasValue(actual);
      case "not_exists":
      case "missing":
        return !hasValue(actual);
      default:
        throw new Error(`Unsupported rule operator: ${operator}`);
    }
  }

  /**
   * Tri-state condition evaluation.
   * state is true, false, or unknown. Unknown means a value needed to
   * determine the rule was not supplied.
   */
  function evaluateCondition(node, inputs) {
    if (!node) return { state: true, missingFields: [] };

    if (Array.isArray(node)) {
      return evaluateCondition({ all: node }, inputs);
    }

    if (!isObject(node)) {
      throw new Error("A rule condition must be an object or array.");
    }

    if (node.all) {
      const results = asArray(node.all).map(item => evaluateCondition(item, inputs));
      if (results.some(result => result.state === false)) {
        return { state: false, missingFields: [] };
      }
      const missingFields = unique(results.flatMap(result => result.missingFields));
      return missingFields.length
        ? { state: "unknown", missingFields }
        : { state: true, missingFields: [] };
    }

    if (node.any) {
      const results = asArray(node.any).map(item => evaluateCondition(item, inputs));
      if (results.some(result => result.state === true)) {
        return { state: true, missingFields: [] };
      }
      const missingFields = unique(results.flatMap(result => result.missingFields));
      return missingFields.length
        ? { state: "unknown", missingFields }
        : { state: false, missingFields: [] };
    }

    if (node.none) {
      const results = asArray(node.none).map(item => evaluateCondition(item, inputs));
      if (results.some(result => result.state === true)) {
        return { state: false, missingFields: [] };
      }
      const missingFields = unique(results.flatMap(result => result.missingFields));
      return missingFields.length
        ? { state: "unknown", missingFields }
        : { state: true, missingFields: [] };
    }

    if (node.not) {
      const result = evaluateCondition(node.not, inputs);
      if (result.state === "unknown") return result;
      return { state: !result.state, missingFields: [] };
    }

    const field = node.field;
    if (!field) throw new Error("A leaf rule condition is missing its field name.");

    const actual = inputs[field];
    if (!hasValue(actual)) {
      return { state: "unknown", missingFields: [field] };
    }

    return {
      state: compare(actual, node.operator, node.value),
      missingFields: []
    };
  }

  function collectConditionFields(node, output = []) {
    if (!node) return output;
    if (Array.isArray(node)) {
      node.forEach(item => collectConditionFields(item, output));
      return unique(output);
    }
    if (!isObject(node)) return unique(output);
    if (node.field) output.push(node.field);
    if (node.all) collectConditionFields(node.all, output);
    if (node.any) collectConditionFields(node.any, output);
    if (node.none) collectConditionFields(node.none, output);
    if (node.not) collectConditionFields(node.not, output);
    return unique(output);
  }

  function conditionFromRule(rule) {
    if (rule.when) return rule.when;
    if (rule.all) return { all: rule.all };
    if (rule.any) return { any: rule.any };
    if (rule.none) return { none: rule.none };
    if (rule.not) return { not: rule.not };
    if (rule.field) return { field: rule.field, operator: rule.operator, value: rule.value };
    return null;
  }

  function constraintMatches(actual, constraint, allowUnknown) {
    if (constraint === undefined || constraint === null) return true;
    if (!hasValue(actual)) return Boolean(allowUnknown);

    if (!isObject(constraint)) {
      return normaliseScalar(actual) === normaliseScalar(constraint);
    }

    if (constraint.in) {
      return asArray(constraint.in).some(item => normaliseScalar(item) === normaliseScalar(actual));
    }
    if (constraint.min !== undefined && normaliseScalar(actual) < normaliseScalar(constraint.min)) return false;
    if (constraint.max !== undefined && normaliseScalar(actual) > normaliseScalar(constraint.max)) return false;
    if (constraint[">="] !== undefined && normaliseScalar(actual) < normaliseScalar(constraint[">="])) return false;
    if (constraint[">"] !== undefined && normaliseScalar(actual) <= normaliseScalar(constraint[">"])) return false;
    if (constraint["<="] !== undefined && normaliseScalar(actual) > normaliseScalar(constraint["<="])) return false;
    if (constraint["<"] !== undefined && normaliseScalar(actual) >= normaliseScalar(constraint["<"])) return false;
    return true;
  }

  function scopeMatches(rule, context = {}, options = {}) {
    const scope = rule.applies_to;
    if (!scope) return true;
    const allowUnknown = Boolean(options.allowUnknown);

    if (scope.phase !== undefined && !constraintMatches(context.phase, scope.phase, allowUnknown)) return false;
    if (scope.cycle !== undefined && !constraintMatches(context.cycle, scope.cycle, allowUnknown)) return false;
    if (scope.day !== undefined && !constraintMatches(context.day, scope.day, allowUnknown)) return false;
    if (scope.schedule !== undefined && !constraintMatches(context.schedule, scope.schedule, allowUnknown)) return false;
    return true;
  }

  function evaluateScope(rule, context = {}) {
    const scope = rule.applies_to;
    if (!scope) return { state: true, missingContext: [] };
    const missingContext = [];
    for (const key of ["phase", "cycle", "day", "schedule"]) {
      if (scope[key] === undefined) continue;
      const actual = context[key];
      if (!hasValue(actual)) {
        missingContext.push(key);
        continue;
      }
      if (!constraintMatches(actual, scope[key], false)) {
        return { state: false, missingContext: [] };
      }
    }
    return missingContext.length
      ? { state: "unknown", missingContext }
      : { state: true, missingContext: [] };
  }

  function componentsMatch(rule, context = {}) {
    const active = asArray(context.activeComponents).map(value => String(value).toLowerCase());
    if (!active.length) return true;

    const components = asArray(rule.action && rule.action.components)
      .map(value => String(value).toLowerCase());

    if (!components.length) return true;
    return components.every(component => active.includes(component));
  }

  function isPotentiallyApplicable(rule, context = {}) {
    return scopeMatches(rule, context, { allowUnknown: true }) && componentsMatch(rule, context);
  }

  function isApplicable(rule, context = {}) {
    return scopeMatches(rule, context, { allowUnknown: false }) && componentsMatch(rule, context);
  }

  function unique(values) {
    return [...new Set(values.filter(Boolean))];
  }

  function getActionType(rule) {
    return String(rule && rule.action && rule.action.type || "consultant_review")
      .trim()
      .toLowerCase();
  }

  function getActionPriority(protocol, type) {
    const configured = asArray(protocol && protocol.rule_engine && protocol.rule_engine.actions_ranked_most_to_least_restrictive);
    const exactIndex = configured.indexOf(type);
    if (exactIndex >= 0) return 1000 - exactIndex * 10;

    const aliases = {
      delay_then_dose_reduce: "delay",
      withhold_then_reduce: "withhold",
      cease: "discontinue",
      dose_reduce_two_levels: "dose_reduce",
      dose_reduce_one_level: "dose_reduce",
      dose_reduce: configured.includes("dose_reduce_one_level") ? "dose_reduce_one_level" : "dose_reduce"
    };
    const aliasIndex = configured.indexOf(aliases[type]);
    if (aliasIndex >= 0) return 995 - aliasIndex * 10;

    return DEFAULT_PRIORITY[type] || DEFAULT_PRIORITY.consultant_review;
  }

  function getRuleExplanation(rule, protocol) {
    const action = rule.action || {};
    const type = getActionType(rule);
    const template = protocol && protocol.output_templates && protocol.output_templates[type];
    return action.message || action.recommendation || action.note || rule.explanation || template || humanise(type);
  }

  function humanise(value) {
    return String(value || "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, character => character.toUpperCase());
  }

  function sourceText(source) {
    if (!source) return "Source not encoded";
    const pages = source.pages || (source.page !== undefined ? [source.page] : []);
    const parts = [];
    if (pages.length) parts.push(`page${pages.length > 1 ? "s" : ""} ${pages.join(", ")}`);
    if (source.table !== undefined) parts.push(`Table ${source.table}`);
    return parts.length ? parts.join(" · ") : "Source encoded in protocol";
  }

  function createFinding(rule, protocol) {
    const type = getActionType(rule);
    return {
      ruleId: rule.rule_id || rule.id || "unnamed_rule",
      actionType: type,
      action: rule.action || {},
      priority: getActionPriority(protocol, type),
      explanation: getRuleExplanation(rule, protocol),
      source: rule.source || null,
      sourceText: sourceText(rule.source),
      conditionFields: collectConditionFields(conditionFromRule(rule)),
      condition: conditionFromRule(rule)
    };
  }

  function isFallbackRule(rule) {
    return Object.keys(rule || {}).some(key => /^when_no_other_.*_rule_matches$/.test(key) && rule[key] === true);
  }

  function evaluateFallbackRule(rule, matched, skipped, protocol) {
    if (rule.when_no_other_ac_haematology_rule_matches) {
      const hasMatchedSibling = matched.some(item => /^AC_COUNTS_/.test(item.ruleId));
      const hasUnknownSibling = skipped.some(item => /^AC_COUNTS_/.test(item.ruleId));
      if (!hasMatchedSibling && !hasUnknownSibling) return createFinding(rule, protocol);
      return null;
    }
    return null;
  }

  function evaluate(protocol, inputs, context = {}) {
    const allRules = asArray(protocol && protocol.rule_engine && protocol.rule_engine.rules);
    const regularRules = allRules.filter(rule => !isFallbackRule(rule));
    const fallbackRules = allRules.filter(isFallbackRule);
    const matched = [];
    const notMatched = [];
    const skipped = [];
    const errors = [];

    regularRules.forEach(rule => {
      if (!componentsMatch(rule, context)) return;
      const scopeResult = evaluateScope(rule, context);
      if (scopeResult.state === false) return;
      const condition = conditionFromRule(rule);
      if (scopeResult.state === "unknown") {
        skipped.push({
          ...createFinding(rule, protocol),
          missingFields: [],
          missingContext: scopeResult.missingContext,
          conditionFields: collectConditionFields(condition),
          condition
        });
        return;
      }
      try {
        const result = evaluateCondition(condition, inputs);
        if (result.state === true) {
          matched.push(createFinding(rule, protocol));
        } else if (result.state === false) {
          notMatched.push(createFinding(rule, protocol));
        } else if (result.state === "unknown") {
          skipped.push({
            ...createFinding(rule, protocol),
            missingFields: result.missingFields,
            missingContext: [],
            conditionFields: collectConditionFields(condition),
            condition
          });
        }
      } catch (error) {
        errors.push({
          ruleId: rule.rule_id || rule.id || "unnamed_rule",
          message: error.message
        });
      }
    });

    fallbackRules.forEach(rule => {
      if (!isApplicable(rule, context)) return;
      const finding = evaluateFallbackRule(rule, matched, skipped, protocol);
      if (finding) matched.push(finding);
    });

    matched.sort((a, b) => b.priority - a.priority);
    const overallAction = matched.length ? matched[0].actionType : "consultant_review";

    return {
      overallAction,
      findings: matched,
      notMatchedRules: notMatched,
      skippedRules: skipped,
      errors,
      complete: skipped.length === 0 && errors.length === 0,
      applicableRuleCount: regularRules.filter(rule => componentsMatch(rule, context) && evaluateScope(rule, context).state !== false).length +
        fallbackRules.filter(rule => isPotentiallyApplicable(rule, context)).length
    };
  }

  return Object.freeze({
    version: "0.17.0",
    compare,
    evaluateCondition,
    collectConditionFields,
    conditionFromRule,
    scopeMatches,
    evaluateScope,
    componentsMatch,
    isPotentiallyApplicable,
    isApplicable,
    getActionPriority,
    getRuleExplanation,
    sourceText,
    evaluate
  });
});
