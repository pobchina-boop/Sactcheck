# v0.84.3 supportive-care phase selector fix

## Defect and correction

The card Rx action called the generic PDF exporter for phase-dependent regimens without a dedicated selector. Its guard displayed “Select or confirm the active treatment phase/day” but offered no control. The clinic workflow also disabled export without offering that choice.

NCCP 00348 and 00734 now open the workflow at a labelled phase/visit select. No calendar dates are requested. Selection starts empty, switching replaces the script, and export identifies the regimen, phase and active medicines. Late responses cannot replace another regimen or reopen a closed panel. Existing dedicated AC and AC/taxane selectors remain the preferred route.

## Source reconciliation: 19 October 2026

- [NCCP 00348 v8a](https://healthservice.hse.ie/documents/6812/348_Carboplatin_AUC_6_and_weekly_Paclitaxel_80mgm2.pdf): schedule on PDF page 1; supportive care on PDF pages 6–7. Three choices: carboplatin AUC 6/paclitaxel day 1; paclitaxel alone days 8/15; dose-dense AC day 1.
- [NCCP 00734 v3](https://healthservice.hse.ie/documents/6605/734_CARBOplatin_AUC2weekly__Paclitaxel_TNBC_v3.pdf): schedule and supportive-care sections. Two choices: weekly carboplatin AUC 2/paclitaxel; dose-dense AC. There is no paclitaxel-alone option in this encoded regimen.
- [NCCP NCIS antiemetic medicines, medical oncology v8 (2025)](https://healthservice.hse.ie/documents/7180/Supportive_Care_Antiemetics_for_inclusion_NCIS_Medical_Oncology.pdf), table 1: existing national high-carboplatin, high-AC, moderate and low schedules are reused. Phase scripts omit the legacy local proforma, which otherwise replaces the national schedule in the PDF. Routine delayed dexamethasone is absent from the AC schedule. Premedication reconciliation and dose-dense AC growth-factor checks are retained.

Mappings are bound to exact protocol IDs and source versions. The exporter does not infer a phase from an assessment-profile alias or classify a carboplatin phase from later AC components. Other regimens without verified phase scripts display the NCCP source route and remain blocked from automatic prescribing output.

## Verification

- 96 targeted checks: national plan selection, active-agent isolation, day-specific branches, invalid/cleared selections, card click → select change → export handlers, cross-regimen reset, late responses, close while loading, PDF phase identity and filenames, current release and existing dedicated AC routes.
- `npm run test:ci`: passed, including release/cache consistency, clinical regression suites, security checks, site build and deployment validation of 72 patient portals.
- A clean export of remote main (v0.84.0) plus the cumulative complete-file overlay also passed `npm run test:ci`. All 1,934 existing canonical and compatibility patient files matched the preceding release/base byte-for-byte.
- Five generated phase PDFs rendered and visually inspected; all fit on one page with phase/visit and active medicines visible. Temporary QA PDFs are not distributed as patient prescriptions.
- Browser interaction is represented by the production handlers executed in a DOM test harness. A real browser session was unavailable in this environment; this is not a claim of live-site or consultant/pharmacy validation.

## Separate legacy clinical-audit finding

The pre-existing assessment profiles in 00348 and 00734 include an unrelated adjuvant-pembrolizumab option. Their supportive-care metadata also contains copied pembrolizumab entries. Neither regimen contains pembrolizumab. This fix does not use those profiles or expose that option in the new antiemetic selector. The complete clinical-decision-rule/assessment audit of these two legacy cards remains outstanding; this release must not be described as validating their assessment rules. No chemotherapy dosing or assessment rules are changed here.
