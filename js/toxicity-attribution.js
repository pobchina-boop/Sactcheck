/**
 * Adds a causative treatment component to CTCAE/toxicity labels when the
 * existing source-linked rule encoding consistently names one component.
 *
 * This is a presentation layer only. It does not alter thresholds, actions,
 * rule conditions or clinical recommendations.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SACTCheckToxicityAttribution = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "0.51.0";
  const GENERIC_COMPONENTS = new Set([
    "all", "both", "regimen", "whole regimen", "both drugs", "all drugs",
    "all components", "all cytotoxic components", "all active components",
    "all regimen components", "all_components", "all_cytotoxic_components"
  ]);
  const TOXICITY_PATTERN = /(?:\bgrade\b|ctcae|toxicit|neuropath|reaction|pneumon|colitis|diarrh|stomat|mucosit|rash|dermat|hepatitis|nephritis|myocard|myositis|pancreatitis|endocrine|cutaneous|scar\b|erythrodysaesthesia|hand.?foot|ppe\b|constipation|ileus|infusion|hypersensitiv|anaphyl|fatigue|arthralgia|myalgia)/i;

  function asArray(value) {
    if (Array.isArray(value)) return value;
    if (value === undefined || value === null || value === "") return [];
    return [value];
  }

  function clean(value) {
    return String(value ?? "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  }

  function displayName(value) {
    const helper = typeof globalThis !== "undefined" ? globalThis.SACTCheckRegimenComponents : null;
    if (helper?.displayName) return helper.displayName(value);
    return clean(value).replace(/\b\w/g, letter => letter.toUpperCase());
  }

  function rules(protocol) {
    return [
      ...asArray(protocol?.rule_engine?.rules),
      ...asArray(protocol?.pembrolizumab_irae_rules?.rules)
    ].filter(rule => rule && typeof rule === "object");
  }

  function isToxicityDefinition(id, definition) {
    const text = [id, definition?.label, definition?.ctcae_term, definition?.assessment_guidance].filter(Boolean).join(" ");
    return TOXICITY_PATTERN.test(text);
  }

  function componentFor(protocol, fieldId, definition) {
    if (!isToxicityDefinition(fieldId, definition)) return null;
    const values = [];
    rules(protocol).forEach(rule => {
      if (String(rule.field || "") !== String(fieldId)) return;
      const action = rule.action && typeof rule.action === "object" ? rule.action : {};
      asArray(action.components).forEach(component => {
        const cleaned = clean(component).toLowerCase();
        if (cleaned && !GENERIC_COMPONENTS.has(cleaned)) values.push(cleaned);
      });
    });
    const unique = [...new Set(values)];
    // Only name a causative agent when the encoded pathway points to one
    // consistent component. Multi-agent fields remain deliberately unattributed.
    return unique.length === 1 ? displayName(unique[0]) : null;
  }

  function appendAttribution(label, component) {
    const text = String(label ?? "").trim();
    if (!text || !component) return text;
    if (text.toLowerCase().includes(component.toLowerCase())) return text;
    return `${text} (${component})`;
  }

  function clone(protocol) {
    if (typeof structuredClone === "function") return structuredClone(protocol);
    return JSON.parse(JSON.stringify(protocol));
  }

  function decorate(protocol) {
    if (!protocol || typeof protocol !== "object") return protocol;
    const output = clone(protocol);
    const definitions = output.input_definitions;
    if (!definitions || typeof definitions !== "object") return output;
    Object.entries(definitions).forEach(([id, definition]) => {
      if (!definition || typeof definition !== "object") return;
      const component = componentFor(output, id, definition);
      if (!component) return;
      definition.label = appendAttribution(definition.label, component);
      definition.display_attribution = {
        component,
        basis: "encoded rule action component",
        clinical_logic_changed: false
      };
    });
    return output;
  }

  function audit(protocol) {
    const records = [];
    const definitions = protocol?.input_definitions || {};
    Object.entries(definitions).forEach(([id, definition]) => {
      const component = componentFor(protocol, id, definition);
      if (component) records.push({ field: id, label: definition.label, component });
    });
    return records;
  }

  return Object.freeze({ version: VERSION, isToxicityDefinition, componentFor, appendAttribution, decorate, audit });
});
