const assert = require("assert");
const fs = require("fs");
const path = require("path");
const Validator = require("../js/protocol-validator.js");
const Engine = require("../js/assessment-engine.js");

const ROOT = path.join(__dirname, "..");
const INDEX = JSON.parse(fs.readFileSync(path.join(ROOT, "protocols/index.json"), "utf8"));

function read(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8"));
}

assert.equal(INDEX.schema_version, "2.0.0");
assert.ok(Array.isArray(INDEX.protocols));
assert.ok(INDEX.protocols.length >= 3);

for (const entry of INDEX.protocols) {
  const protocol = read(entry.path);
  const validation = Validator.validate(protocol, { strict: true });
  assert.equal(
    validation.valid,
    true,
    `${entry.path} should validate:\n${Validator.formatIssues(validation).join("\n")}`
  );
  assert.ok(validation.summary.inputCount > 0, `${entry.path} should define inputs`);
  assert.ok(validation.summary.ruleCount > 0, `${entry.path} should define rules`);
  assert.equal(entry.id, protocol.protocol_id);

  for (const profile of Engine.getProfiles(protocol)) {
    const definitions = Engine.getInputDefinitions(protocol, profile.id);
    assert.ok(definitions.length > 0, `${entry.path}/${profile.id} should generate a form`);
    definitions.forEach(definition => {
      assert.notEqual(definition.demo_value, undefined, `${entry.path}: ${definition.id} needs demo_value`);
    });
    const demoInputs = Object.fromEntries(definitions.map(definition => [definition.id, definition.demo_value]));
    const result = Engine.assess(protocol, demoInputs, { profileId: profile.id });
    assert.equal(result.complete, true, `${entry.path}/${profile.id} demo assessment should be complete`);
  }
  console.log(`✓ ${entry.path}: validates and generates complete assessment forms`);
}

const template = read("protocols/_template/protocol-template.json");
const templateValidation = Validator.validate(template, { strict: true });
assert.equal(templateValidation.valid, true, Validator.formatIssues(templateValidation).join("\n"));
console.log("✓ protocol authoring template validates");

const duplicateRule = JSON.parse(JSON.stringify(template));
duplicateRule.rule_engine.rules.push(JSON.parse(JSON.stringify(duplicateRule.rule_engine.rules[0])));
let result = Validator.validate(duplicateRule, { strict: true });
assert.equal(result.valid, false);
assert.ok(result.errors.some(error => error.code === "DUPLICATE_RULE_ID"));
console.log("✓ duplicate rule IDs are blocked");

const missingInput = JSON.parse(JSON.stringify(template));
const missingInputRule = missingInput.rule_engine.rules.find(rule => rule.rule_id === "COUNTS_HOLD");
missingInputRule.any[0].field = "undefined_field";
result = Validator.validate(missingInput, { strict: true });
assert.equal(result.valid, false);
assert.ok(result.errors.some(error => error.code === "RULE_FIELD_UNDEFINED"));
console.log("✓ rules referring to undefined inputs are blocked");

const badOperator = JSON.parse(JSON.stringify(template));
const badOperatorRule = badOperator.rule_engine.rules.find(rule => rule.rule_id === "COUNTS_HOLD");
badOperatorRule.any[0].operator = "approximately";
result = Validator.validate(badOperator, { strict: true });
assert.equal(result.valid, false);
assert.ok(result.errors.some(error => error.code === "OPERATOR_UNSUPPORTED"));
console.log("✓ unsupported operators are blocked");

const badSelect = JSON.parse(JSON.stringify(template));
badSelect.input_definitions.example_select = {
  label: "Example select",
  type: "select",
  required: true,
  options: [],
  demo_value: ""
};
result = Validator.validate(badSelect, { strict: true });
assert.equal(result.valid, false);
assert.ok(result.errors.some(error => error.code === "SELECT_OPTIONS_REQUIRED"));
console.log("✓ malformed select inputs are blocked");

console.log(`\n${INDEX.protocols.length + 5} protocol publishing tests passed.`);
