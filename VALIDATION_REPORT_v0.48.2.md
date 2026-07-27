# SACTCheck v0.48.2 validation report

## Release scope

SACTCheck v0.48.2 adds a controlled CTCAE haematology education layer. It replaces generic CTCAE severity anchors for the core SACT haematological terms with exact named-event criteria, value-based educational grading and explicit CTCAE version provenance.

## Baseline

- Baseline repository: SACTCheck v0.48.1 stability release.
- Canonical indexed regimens: 361.
- Protocol JSON files compared with baseline: 382.
- Protocol JSON files changed: 0.
- NCCP clinical rules changed: 0.

## Educational coverage

Across the current protocol library, the release identifies 910 applicable haematology/fever education panels:

- Neutrophil count decreased: 289.
- Thrombocytopenia: 290.
- Febrile neutropenia: 224.
- Anaemia: 89.
- Fever: 9.
- Composite neutropenia-with-fever fields: 9.

Value-based educational grade previews are available for 677 current inputs, covering ANC, platelets, haemoglobin and temperature. The library also supports white-blood-cell grading when a suitable WBC input is present.

## CTCAE criteria tested

- CTCAE v6.0 ANC Grade 3 and Grade 4 boundaries.
- CTCAE v5.0 ANC Grade 4 comparison.
- CTCAE v6.0 and v5.0 platelet Grade 3/4 boundaries.
- Haemoglobin conversion and grading in g/L and g/dL.
- White-blood-cell grading.
- Fever Grades 0–2 and the duration requirement above 40°C.
- Febrile-neutropenia temperature/ANC definition.
- CTCAE v6.0 lymphopenia structure.
- Explicit CTCAE v5.0 metadata preservation.
- Composite NCCP wording linking neutropenia, fever and febrile neutropenia.
- Dynamic version-specific official NCI source links.

## Safety controls

- The education layer does not alter the deterministic NCCP assessment result.
- An explicit v5.0 field remains v5.0 and is not silently migrated.
- Material v5.0/v6.0 changes are shown for ANC, platelets and lymphopenia.
- Platelet and haemoglobin previews state that transfusion or life-threatening consequences may increase the final grade.
- Temperature above 40°C remains indeterminate until duration is supplied.
- Missing local LLN prevents false precision where Grade 1 depends on LLN.
- Febrile neutropenia remains a distinct named CTCAE term rather than being inferred from generic neutropenia severity.

## Automated validation

The complete protected-repository CI command passed with exit status 0:

```text
npm run test:ci
```

This included:

- repository secret/security scan;
- protocol index and metadata build;
- 366 protocol publishing tests;
- complete historical regression suite;
- v0.48.2 CTCAE haematology regression tests;
- allowlisted GitHub Pages production build;
- deployable-site security validation.

## Drop-in verification

The packaged drop-in was applied to a fresh, unmodified v0.48.1 repository copy. The complete `npm run test:ci` workflow then passed with exit status 0, confirming that the distributed update behaves identically to the development tree.

## Clinical validation status

The criteria are transcribed from the official NCI CTCAE v6.0 and v5.0 resources and are suitable for controlled educational display. Independent oncology/pharmacy review remains recommended before designating the feature externally validated. The app must continue to distinguish educational CTCAE grading from the applicable NCCP treatment rule and the final clinician decision.
