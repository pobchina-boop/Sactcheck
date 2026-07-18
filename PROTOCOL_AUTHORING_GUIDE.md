# SACTCheck Protocol JSON Authoring Guide

## Publication principle

One regimen is represented by one reviewed JSON file under `protocols/<tumour-site>/`. No regimen-specific HTML or JavaScript should be added.

Use `protocols/_template/protocol-template.json` as the starting point. The formal machine-readable contract is `protocols/protocol-schema.json`.

## Required sections

### Identity and governance

- `schema_version`: use `2.0.0` for the current backward-compatible schema 2.x contract.
- `protocol_id`: stable and unique, for example `nccp-00226-v9`.
- `status`: draft, shadow-validation or approved status text.
- `metadata`: NCCP code, version, title, tumour group, indication, source URL and review date.
- `metadata.validation`: source, software, consultant, pharmacy and clinical-authorisation flags.

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

Core or conditionally required missing values make the assessment incomplete. Optional missing values do not block it, but the affected rule domain is explicitly listed as not assessed. Never encode a proceed rule that assumes a blank optional field means normal.

### Assessment profiles

Use `assessment_profiles` when a regimen has distinct phases, days or schedules. Each profile defines:

- `id` and clinician-readable `label`;
- `required_inputs`;
- contextual phase/day/component data;
- optional `input_overrides` for phase-specific ranges, options or demo values.

### Rules

Each deterministic rule requires:

- unique `rule_id`;
- a condition using `field`, `operator` and `value`, or nested `all`, `any`, `none` or `not` groups;
- an `action` object with a supported action type;
- exact `source` page/table reference;
- a clear `explanation` or action message.

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

## Preview before publication

1. Run SACTCheck through Live Server.
2. Select **Preview protocol JSON**.
3. Choose the candidate JSON file.
4. Correct every validation error.
5. Review all warnings.
6. Open the generated assessment.
7. Load demonstration values and confirm the form is complete.
8. Manually test values at, immediately below and immediately above each threshold.

The preview remains in the local browser session and is removed on refresh.

## Publish for all users

1. Place the reviewed file under the correct `protocols/<tumour-site>/` folder.
2. Commit and push that one JSON file.
3. The GitHub workflow runs `tools/build-protocol-index.js`.
4. The workflow validates every published protocol and runs all regression tests.
5. If successful, it commits the regenerated `protocols/index.json`.
6. If validation fails, publication is blocked and the workflow report identifies the file, field or rule.

## Clinical review remains mandatory

Schema validation checks structure and internal consistency. It cannot confirm that thresholds, doses, contraindications, toxicity pathways or source interpretation are clinically correct. Clinical and oncology-pharmacy source review remains mandatory.
