# SACTCheck Protocol JSON Authoring Guide

## Publication principle

One regimen is represented by one reviewed JSON file under `protocols/<tumour-site>/`. Do not add regimen-specific HTML or JavaScript.

Use `protocols/_template/protocol-template.json` as the starting point. The formal machine-readable contract is `protocols/protocol-schema.json`.

A protocol is not considered **gold standard** until its identity, treatment classification, decision rules, supportive care, CTCAE guidance, renal inputs, source links and regression coverage have all been reviewed.

## Required sections

### Identity and governance

- `schema_version`: use `2.0.0` for the current backward-compatible schema 2.x contract.
- `protocol_id`: stable and unique, for example `nccp-00226-v9`.
- `status`: draft, shadow-validation or approved status text.
- `metadata`: NCCP code, version, title, tumour group, indication, source URL and review date.
- `metadata.validation`: source, software, consultant, pharmacy and clinical-authorisation flags.
- `metadata.treatment_context`: identify adjuvant, neoadjuvant, metastatic, maintenance, component/continuation or another applicable context.
- `metadata.treatment_classes`: assign all applicable treatment classes.
- `metadata.catalogue_section`: assign one primary catalogue section.
- `metadata.cytotoxic`: set explicitly to `true` or `false`.

### Catalogue classification

Use one primary catalogue section:

- `chemotherapy_combination_sact`
- `targeted_her2_therapy`
- `immunotherapy`
- `endocrine_hormonal_therapy`
- `bone_modifying_therapy`
- `supportive_other`

Pure endocrine medicines such as tamoxifen, anastrozole, letrozole, exemestane and fulvestrant must use `endocrine_hormonal_therapy` and must not appear in the chemotherapy-only view.

Combination regimens should retain all relevant treatment classes but must have one primary catalogue section. A regimen should never be duplicated solely to display it in multiple sections.

The canonical uniqueness key is:

> NCCP number + protocol version + indication + treatment context + schedule

Before publication, confirm that the new file does not duplicate an existing `protocol_id`, NCCP code or clinically equivalent regimen card.

### Input definitions

Every field used by a rule or assessment profile must have an entry in `input_definitions`.

Supported types:

- `number`
- `boolean`
- `select`
- `text`

Each input should provide:

- a clinician-readable `label`;
- `type`;
- `unit` where relevant;
- `required` status for fields that are always mandatory;
- optional `visible_when` and `required_when` conditions for context-dependent fields;
- numeric `min`, `max` and `step` where appropriate;
- `options` for select controls;
- a non-identifiable `demo_value` that permits interface testing;
- optional `help` text.

### Conditional inputs

Use conditional inputs when a follow-on value is relevant only after a trigger. For example:

```json
{
  "febrile_neutropenia_grade": {
    "label": "Febrile neutropenia grade",
    "type": "number",
    "required": false,
    "visible_when": {
      "field": "febrile_neutropenia",
      "operator": "==",
      "value": true
    },
    "required_when": {
      "field": "febrile_neutropenia",
      "operator": "==",
      "value": true
    },
    "demo_value": 0
  }
}
```

Core or conditionally required missing values make the assessment incomplete. Optional missing values do not block it, but the affected rule domain must be listed as not assessed. Never encode a proceed rule that assumes a blank optional field means normal.

## Supportive care and antiemetic mapping

Every active regimen must reference the central supportive-care registry. Do not duplicate free-text antiemetic prescriptions across individual protocol files.

The mapping must identify, as applicable:

- NCCP emetogenic-risk category;
- acute antiemetic approach;
- delayed antiemetic approach;
- breakthrough/rescue advice;
- steroid schedule;
- regimen-specific premedication;
- growth-factor guidance;
- diarrhoea, mucositis or other supportive medicines;
- patient counselling and monitoring;
- treatment-phase differences.

For combination therapy, classify according to the most emetogenic active component unless the official source specifies otherwise. For multi-day or phase-based treatment, encode day- or phase-specific risk rather than applying one static script to the entire regimen.

Use the following central profiles where appropriate:

- `high`
- `moderate`
- `low`
- `minimal`
- `oral_moderate_high`
- `oral_minimal_low`
- `phase_dependent`
- `variable`

A `variable` mapping must explain why the emetogenic risk cannot be determined without the companion regimen or treatment phase. It must not display a misleading fixed prescription.

Local supportive-care prescription sheets must be labelled with their publication date and validation status. A local sheet is an implementation aid, not a substitute for the current national NCCP source or local oncology-pharmacy approval.

## CTCAE-based inputs

A bare Grade 1–4 selector is not acceptable.

Every CTCAE-driven assessment must identify:

- the specific CTCAE adverse-event term;
- the CTCAE version used;
- the actual grade definitions relevant to the protocol;
- practical guidance explaining how to assess the grade;
- functional consequences where relevant, including instrumental or self-care activities of daily living;
- the linked continue, hold, reduce, restart or discontinue action;
- the protocol and CTCAE source references.

Use the central CTCAE descriptor registry rather than duplicating definitions in each regimen.

Broad fields such as `other_nonhaematological_toxicity_grade` may be retained only when the source protocol itself uses a broad rule. The interface must then warn the user to identify and grade the named toxicity using its specific CTCAE term. A generic severity description must never be presented as the definitive grade definition for every toxicity.

Laboratory toxicities should use the relevant numerical CTCAE thresholds where available. Symptom-based toxicities should show their clinical and functional criteria next to the control.

When a protocol uses modified wording, persistence, recurrence or treatment-relatedness criteria, preserve those protocol-specific modifiers rather than replacing them with a generic CTCAE rule.

## Renal inputs

Use protocol-specific tiered renal selectors whenever the source uses categorical CrCl/eGFR cut-offs.

Each renal-band option should contain:

- a clinician-facing range label, for example `30–49 mL/min`;
- a machine-readable `decision_value` used by the rules engine;
- an explicit dialysis option where the protocol addresses dialysis;
- help text explaining the associated management consequence where useful.

Do not request an exact CrCl merely to convert it silently into a tier already stated by the source protocol.

Retain exact numerical renal input only where the clinical calculation genuinely requires a continuous value, such as Calvert-based carboplatin dosing. Do not replace carboplatin dose-calculation inputs with broad renal categories.

Where a protocol specifies the renal-estimation method, encode and display that method. Do not imply that Cockcroft–Gault and eGFR are interchangeable when the source distinguishes them.

## Assessment profiles

Use `assessment_profiles` when a regimen has distinct phases, days, components or schedules. Each profile defines:

- `id` and clinician-readable `label`;
- `required_inputs`;
- contextual phase/day/component data;
- optional `input_overrides` for phase-specific ranges, options or demo values;
- phase-specific supportive-care mapping where applicable.

### Rules

Each deterministic rule requires:

- unique `rule_id`;
- a condition using `field`, `operator` and `value`, or nested `all`, `any`, `none` or `not` groups;
- an `action` object with a supported action type;
- exact `source` page/table reference;
- a clear explanation or action message.

Supported operators include:

```text
==  !=  >  >=  <  <=
between  between_inclusive  outside
in  not_in  exists  missing  contains
```

Supported action types include:

```text
permanently_discontinue
contraindicated
discontinue
cease
omit
withhold_then_reduce
withhold
delay_then_dose_reduce
delay
consultant_review
dose_reduce_two_levels
dose_reduce_one_level
dose_reduce
proceed_with_caution
proceed
```

The rule engine uses the protocol action-priority list and returns the most restrictive triggered action while preserving all triggered findings.

## Sources and manual verification

Every active protocol must include a working link to the official NCCP regimen PDF or official source page. Page, table or section references should be included for every encoded threshold or management rule.

The official protocol must remain available from the regimen page for manual verification alongside the generated assessment.

Do not treat a protocol as clinically authorised solely because it passes schema or regression tests.

## Required tests before publication

At minimum, add or update tests that confirm:

- valid JSON and schema compliance;
- unique `protocol_id` and NCCP code;
- no normalized-title duplicate;
- correct tumour site, treatment context and catalogue section;
- pure endocrine therapy is excluded from the chemotherapy-only view;
- a valid supportive-care mapping is present;
- phase-dependent supportive care does not show a static prescription;
- every CTCAE-based input resolves to a specific descriptor and practical grading guidance;
- no bare grade selector is presented;
- tiered renal rules use a band selector;
- exact CrCl remains available where a continuous calculation is required;
- official source/PDF links are present;
- threshold tests cover values immediately below, at and immediately above each cut-off;
- restart, reduction and permanent-discontinuation pathways behave as encoded.

## Preview before publication

1. Run SACTCheck through Live Server.
2. Select **Preview protocol JSON**.
3. Choose the candidate JSON file.
4. Correct every validation error.
5. Review all warnings.
6. Open the generated assessment.
7. Load demonstration values and confirm the form is complete.
8. Manually test values at, immediately below and immediately above each threshold.
9. Confirm the supportive-care panel displays the correct risk and treatment phase.
10. Confirm every CTCAE selector shows its grade definitions and assessment guidance.
11. Confirm categorical renal guidance appears as protocol-specific bands.
12. Confirm the regimen appears in the correct catalogue section and is not duplicated.

The preview remains in the local browser session and is removed on refresh.

## Publish for all users

1. Place the reviewed file under the correct `protocols/<tumour-site>/` folder.
2. Commit and push the reviewed JSON and any associated central-registry/test changes.
3. The GitHub workflow runs `tools/build-protocol-index.js`.
4. The workflow validates every published protocol and runs all regression tests.
5. If successful, it commits the regenerated `protocols/index.json`.
6. If validation fails, publication is blocked and the workflow report identifies the file, field or rule.

## Clinical review remains mandatory

Schema validation checks structure and internal consistency. Automated tests can identify missing metadata, inconsistent mappings and rule-engine regressions. They cannot confirm that thresholds, doses, contraindications, toxicity pathways, antiemetic scripts or source interpretation are clinically correct.

Consultant, oncology-pharmacy and local governance review remain mandatory before clinical deployment or reliance on SACTCheck for patient-care decisions.
