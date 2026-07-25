# SACTCheck v0.41.0 validation report

## Release scope

- Release: v0.41.0 — Complete Sarcoma Library
- Full catalogue: 270 distinct protocol records
- Sarcoma catalogue: 25 active protocols
- Sarcoma placeholders/drafts: 0
- Sarcoma input definitions: 472
- Sarcoma decision rules: 391
- Independently tested rule-linked Sarcoma inputs: 327

## Automated controls completed

- All protocol JSON files parse and pass the protocol validator.
- All active protocols have direct official NCCP PDF links.
- Sarcoma inventory matches the 25-code official catalogue snapshot.
- No duplicate protocol IDs or NCCP codes were identified.
- Every Sarcoma protocol is marked as an encoded prototype and supports partial assessment.
- No Sarcoma input is configured as a blocking required field.
- CTCAE grade controls include Grade 0–4 options, toxicity descriptors and practical assessment guidance.
- Tiered renal inputs use protocol-specific categorical selectors.
- ALT, AST and bilirubin ratio fields use the central actual-result/ULN adapter.
- Every Sarcoma protocol has a central supportive-care mapping.
- Phase-dependent regimens use phase profiles rather than a misleading single antiemetic sheet.
- Ifosfamide protocols include Mesna/hydration and uro-neurological safety fields.
- MAP includes urine pH, delayed-clearance and folinic-acid-rescue safety inputs.
- NCCP 00500 was updated to current Version 3 and its current official source URL.
- Common trade-name aliases were tested for representative Sarcoma medicines.
- The complete historical regression suite passed in the working release.

## Post-package verification

The finished archive was extracted into a clean directory. The complete automated suite passed again from the extracted copy, and ZIP integrity testing returned no errors.

## Interpretation

The validation above is software and encoding verification. It demonstrates that the published data are structurally valid and that the engine behaves consistently with the encoded rules. It is not a substitute for independent line-by-line clinical and oncology-pharmacy source review or local governance approval.
