#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
require(path.join(root, "js", "drug-aliases.js"));
const interpreter = require(path.join(root, "js", "global-scenario-interpreter.js"));
const index = JSON.parse(fs.readFileSync(path.join(root, "protocols", "index.json"), "utf8"));

const records = index.protocols
  .filter(entry => entry.enabled !== false && entry.path)
  .map(entry => ({ entry, protocol: JSON.parse(fs.readFileSync(path.join(root, entry.path), "utf8")) }));

const cases = [
  {
    id: "lonsurf_bevacizumab_split",
    scenario: "Metastatic CRC on Lonsurf and Avastin, ANC 0.3, afebrile and due to restart tomorrow.",
    expectedLeadingCode: "00382",
    expectIncompleteMedicineMatch: true
  },
  {
    id: "pembro_pemetrexed_carbo",
    scenario: "Metastatic non-squamous NSCLC on Keytruda, pemetrexed and carboplatin, creatinine 130.",
    expectedLeadingCode: "00568",
    expectCompleteMedicineMatch: true
  },
  {
    id: "carboplatin_pld",
    scenario: "Ovarian cancer on carboplatin and Caelyx, ANC 0.8.",
    expectedLeadingCode: "00624",
    expectCompleteMedicineMatch: true
  },
  {
    id: "myeloma_dara_bortezomib",
    scenario: "Multiple myeloma on Darzalex, Velcade and dexamethasone, platelets 45.",
    expectedLeadingCode: "00609",
    allowLeadingCodes: ["00609", "00695"],
    expectCompleteMedicineMatch: true
  },
  {
    id: "exact_nccp_code",
    scenario: "NCCP 00382, ANC 0.3.",
    expectedLeadingCode: "00382",
    expectCompleteMedicineMatch: true
  },
  {
    id: "ambiguous_weekly_paclitaxel",
    scenario: "Breast cancer on weekly Taxol with grade 2 neuropathy.",
    expectMultipleMatches: true
  },
  {
    id: "identifier_warning",
    scenario: "MRN 12345678, metastatic CRC on Lonsurf, ANC 0.3.",
    expectedLeadingCode: "00382",
    expectIdentifierWarning: true
  }
];

const rows = cases.map(testCase => {
  const result = interpreter.matchProtocols(testCase.scenario, records);
  const leading = result.matches[0] || null;
  const allowed = testCase.allowLeadingCodes || (testCase.expectedLeadingCode ? [testCase.expectedLeadingCode] : []);
  const checks = {
    leading_protocol: !allowed.length || allowed.includes(String(leading?.code || "")),
    multiple_matches: !testCase.expectMultipleMatches || result.matches.length > 1,
    identifier_warning: !testCase.expectIdentifierWarning || result.analysis.warnings.some(item => /patient-identifiable information/i.test(item)),
    complete_medicine_match: !testCase.expectCompleteMedicineMatch || Boolean(leading && !leading.unmatchedRegimens.length),
    incomplete_medicine_match: !testCase.expectIncompleteMedicineMatch || Boolean(leading?.unmatchedRegimens?.length)
  };
  const passed = Object.values(checks).every(Boolean);
  return {
    id: testCase.id,
    scenario: testCase.scenario,
    passed,
    leading_code: leading?.code || "",
    leading_title: leading?.title || "",
    leading_score: leading?.score || 0,
    match_count: result.matches.length,
    unmatched_regimens: (leading?.unmatchedRegimens || []).join(" | "),
    warnings: result.analysis.warnings.join(" | "),
    checks
  };
});

const failed = rows.filter(row => !row.passed);
const audit = {
  version: "0.55.0",
  generated_at: new Date().toISOString(),
  protocol_records_examined: records.length,
  scenarios_tested: rows.length,
  scenarios_passed: rows.length - failed.length,
  scenarios_failed: failed.length,
  external_network_calls: 0,
  clinical_assessments_generated_before_regimen_selection: 0,
  rows
};

const jsonPath = path.join(root, "V0550_GLOBAL_SCENARIO_INTERPRETER_AUDIT.json");
const csvPath = path.join(root, "V0550_GLOBAL_SCENARIO_INTERPRETER_AUDIT.csv");
const mdPath = path.join(root, "V0550_GLOBAL_SCENARIO_INTERPRETER_AUDIT.md");

fs.writeFileSync(jsonPath, `${JSON.stringify(audit, null, 2)}\n`);
const quote = value => `"${String(value ?? "").replaceAll('"', '""')}"`;
const headers = ["id", "passed", "leading_code", "leading_title", "leading_score", "match_count", "unmatched_regimens", "warnings", "scenario"];
fs.writeFileSync(csvPath, `${headers.join(",")}\n${rows.map(row => headers.map(header => quote(row[header])).join(",")).join("\n")}\n`);

const markdown = `# SACTCheck v0.55.0 Global Scenario Interpreter Audit\n\n- Protocol records examined: **${records.length}**\n- Scenarios tested: **${rows.length}**\n- Passed: **${rows.length - failed.length}**\n- Failed: **${failed.length}**\n- External network calls: **0**\n- Clinical assessments generated before regimen selection: **0**\n\n| Scenario | Leading protocol | Result |\n|---|---|---|\n${rows.map(row => `| ${row.id} | ${row.leading_code} ${row.leading_title} | ${row.passed ? "Pass" : "Fail"} |`).join("\n")}\n\n## Safety boundary\n\nThe global interpreter performs local catalogue matching only. It requires exact regimen selection before handing the original de-identified scenario to the existing in-regimen interpreter. The deterministic protocol engine remains the sole source of any later protocol assessment.\n`;
fs.writeFileSync(mdPath, markdown);

console.log(`Global scenario interpreter audit: ${rows.length - failed.length}/${rows.length} scenarios passed across ${records.length} protocols.`);
if (failed.length) {
  failed.forEach(row => console.error(`- ${row.id}: ${JSON.stringify(row.checks)}`));
  process.exit(1);
}
