"use strict";

const assert = require("assert");
const Metadata = require("../js/regimen-course-metadata.js");

const fixedAdjuvant = {
  protocol_id: "nccp-test-1",
  metadata: {
    title: "Example adjuvant therapy",
    indication: "Adjuvant treatment after complete resection. Treatment is given for 6 cycles."
  },
  indications: [
    { indication_id: "adjuvant", description: "Adjuvant treatment for 6 cycles." }
  ],
  treatment_phases: [
    { phase_id: "main", cycle_length_days: 21, cycles: [1, 2, 3, 4, 5, 6] }
  ]
};

let summary = Metadata.summarise(fixedAdjuvant);
assert.strictEqual(summary.intent, "Adjuvant");
assert.strictEqual(summary.duration, "6 cycles");
assert.strictEqual(summary.interval, "q21d");
assert.strictEqual(summary.complete, true);
assert.deepStrictEqual(summary.tokens, ["Adjuvant", "6 cycles", "q21d"]);

const palliativeContinuous = {
  protocol_id: "nccp-test-2",
  metadata: {
    title: "Example palliative therapy",
    indication: "Palliative treatment until disease progression or unacceptable toxicity."
  },
  treatment_phases: [
    { phase_id: "main", cycle_length_days: 14 }
  ]
};
summary = Metadata.summarise(palliativeContinuous);
assert.strictEqual(summary.intent, "Palliative");
assert.strictEqual(summary.duration, "Until progression/toxicity");
assert.strictEqual(summary.interval, "q14d");

const metastaticNotAutomaticallyPalliative = {
  protocol_id: "nccp-test-3",
  metadata: {
    title: "Treatment for metastatic disease",
    indication: "First-line treatment of metastatic cancer."
  },
  treatment_phases: [{ cycle_length_days: 28 }]
};
summary = Metadata.summarise(metastaticNotAutomaticallyPalliative);
assert.strictEqual(summary.intent, "Advanced disease");
assert.notStrictEqual(summary.intent, "Palliative");
assert.strictEqual(summary.duration, null);
assert.strictEqual(summary.complete, false);
assert.ok(summary.unresolved.includes("duration"));

const multipleIndications = {
  protocol_id: "nccp-test-4",
  metadata: { title: "Multi-context treatment", indication: "Adjuvant and advanced indications." },
  indications: [
    { indication_id: "neo", description: "Neoadjuvant treatment for 3 cycles." },
    { indication_id: "adv", description: "Palliative treatment until progression." }
  ],
  treatment_phases: [{ cycle_length_days: 21 }]
};
summary = Metadata.summarise(multipleIndications);
assert.strictEqual(summary.intent, "Neoadjuvant / Palliative");
assert.strictEqual(summary.duration, "Indication-dependent");
assert.strictEqual(summary.interval, "q21d");


const partiallySpecifiedMultiIndication = {
  protocol_id: "nccp-test-4b",
  metadata: { title: "Multi-indication 21-day therapy" },
  indications: [
    { indication_id: "advanced", description: "Treatment of advanced disease." },
    { indication_id: "neo", description: "Neoadjuvant treatment for 3 cycles." }
  ],
  treatment_phases: [{ cycle_length_days: 21 }]
};
summary = Metadata.summarise(partiallySpecifiedMultiIndication);
assert.strictEqual(summary.duration, "Indication-dependent");
assert.notStrictEqual(summary.duration, "3 cycles");
assert.strictEqual(summary.complete, false);

const phasedInductionMaintenance = {
  protocol_id: "nccp-test-4c",
  metadata: {
    title: "Combined induction and maintenance",
    indication: "Advanced disease with four induction cycles followed by maintenance."
  },
  treatment_phases: [
    { phase_id: "induction", cycle_length_days: 21, cycles: [1, 2, 3, 4] },
    { phase_id: "maintenance", cycle_length_days: 21, cycles: [] }
  ]
};
summary = Metadata.summarise(phasedInductionMaintenance);
assert.strictEqual(summary.duration, "4 induction cycles → maintenance");
assert.strictEqual(summary.interval, "q21d");


const mixedWithUnclassifiedIndication = {
  protocol_id: "nccp-test-4d",
  metadata: { title: "Mesothelioma and NSCLC, including selected neoadjuvant use" },
  indications: [
    { indication_id: "meso", description: "Chemotherapy-naive unresectable malignant pleural mesothelioma." },
    { indication_id: "advanced", description: "First-line treatment of metastatic non-small cell lung cancer." },
    { indication_id: "neo", description: "Neoadjuvant treatment for 3 cycles." }
  ],
  treatment_phases: [{ cycle_length_days: 21 }]
};
summary = Metadata.summarise(mixedWithUnclassifiedIndication);
assert.strictEqual(summary.intent, "Multiple indications");
assert.strictEqual(summary.duration, "Indication-dependent");
assert.strictEqual(summary.complete, false);

const canonicalReviewed = {
  protocol_id: "nccp-test-5",
  metadata: {
    title: "Canonical example",
    regimen_card: {
      schema_version: "1.0.0",
      contexts: [{
        id: "default",
        intent: "maintenance",
        cycle_length_days: 42,
        duration_type: "maximum_cycles",
        maximum_cycles: 18,
        duration_text: "Up to 18 cycles"
      }],
      provenance: { reviewed: true }
    }
  },
  treatment_phases: [{ cycle_length_days: 21 }]
};
summary = Metadata.summarise(canonicalReviewed);
assert.strictEqual(summary.intent, "Maintenance");
assert.strictEqual(summary.duration, "Up to 18 cycles");
assert.strictEqual(summary.interval, "q42d");

const serialised = Metadata.serialisableRegimenCard(fixedAdjuvant);
assert.strictEqual(serialised.schema_version, Metadata.version);
assert.strictEqual(serialised.display.intent, "Adjuvant");
assert.strictEqual(serialised.display.duration, "6 cycles");
assert.strictEqual(serialised.display.cycle_interval, "q21d");
assert.strictEqual(serialised.provenance.reviewed, false);

assert.strictEqual(Metadata.formatInterval(7), "q7d");
assert.strictEqual(Metadata.formatInterval(21), "q21d");
assert.strictEqual(Metadata.formatInterval(null), null);
assert.strictEqual(Metadata.durationFromText("maximum of 35 cycles").label, "Up to 35 cycles");
assert.strictEqual(Metadata.durationFromText("for 15 months").label, "15 months");
assert.strictEqual(Metadata.durationFromText("four induction cycles followed by maintenance").label, "4 induction cycles → maintenance");

console.log("Regimen-card metadata tests passed.");
