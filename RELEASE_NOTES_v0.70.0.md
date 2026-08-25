# SACTCheck v0.70.0 — Consolidated Source Reconciliation & Knowledge Expansion

## Release purpose
v0.70.0 is a cumulative, pre-validation release built on the proven v0.69.2 engine-first homepage. It consolidates the pending three-regimen source audit, knowledge/evidence expansion, conservative sustainability metadata and NCCP Change Tracker workflow fallback without reintroducing the failed migration-script approach.

## Release architecture
The v0.69.2 application already uses a separation between the cumulative public/module release and older internal/core package provenance. v0.70.0 preserves that architecture rather than rewriting historical version markers solely to make them numerically match.

The three clinical corrections are implemented in `js/source-reconciliation-v0700.js`, an explicit runtime reconciliation layer applied to the loaded protocol objects. This deliberately leaves the historical canonical JSON files byte-for-byte untouched for regression traceability while replacing the identified rule defects in the active clinician-facing assessment.

This is transparent, reversible and testable. It is not a claim of independent clinical validation.

## NCCP 00101 Version 8 — Cabazitaxel + prednisolone
Official source:
https://healthservice.hse.ie/documents/6536/108_cabazitaxel_and_prednisoLONE.pdf

v0.70.0:
- preserves the literal treatment-day count row as ANC <1.5 AND platelets <100;
- does not create an unsupported platelet <100-alone hold;
- treats baseline ANC <1.5 as an exclusion;
- surfaces isolated treatment-day ANC <1.5 as a source-sensitive senior-review state rather than silently declaring it acceptable or inventing a standalone hold;
- adds severe nausea/vomiting, recurrent nausea/vomiting after reduction, grade >=3 renal failure and CYP3A interaction pathways;
- retains formal consultant oncology and oncology-pharmacy validation as pending.

## NCCP 00256 Version 7 — nab-Paclitaxel + gemcitabine
Official source:
https://healthservice.hse.ie/documents/6360/256_v7_nab-PACLitaxel_and_Gemcitabine.pdf

v0.70.0:
- scopes Day 1 count rules to Day 1;
- fixes the Day 8 intermediate platelet band (50 to <75);
- preserves Day 8 withhold thresholds;
- adds the Day 15 branches linked to the actual Day 8 action;
- keeps NCCP-permitted Day 15 dose/G-CSF alternatives as explicit clinician choices rather than automatically selecting one.

## NCCP 00783 Version 2a — Bevacizumab + FOLFOXIRI
Official source:
https://healthservice.hse.ie/documents/6660/783_v2a_Bev_5_FOLFOXIRI_therapy.pdf

v0.70.0:
- separates baseline count exclusions from ongoing Day 1 treatment thresholds;
- adds occurrence-specific ANC, platelet and platelet-nadir subsequent-dose pathways;
- represents the bevacizumab proteinuria pathway component-specifically:
  - negative/1+ or <1 g/L: no proteinuria hold;
  - 2+/3+ or >=1 g/L: administer and quantify 24-hour protein before the next dose;
  - 4+: withhold and quantify;
  - <=2 g/24 h: may proceed;
  - >2 to 4 g/24 h: hold and recheck;
  - >4 g/24 h: discontinue;
- adds uncontrolled/symptomatic hypertension, grade 2–3 review and grade 4/persisting grade 3 discontinuation pathways;
- adds grade 4 fistula/tracheoesophageal fistula, grade 4 thromboembolic event, grade >=3 haemorrhage and GI perforation discontinuation pathways;
- updates the active regimen supportive-care classification to the source-stated overall high emetogenic risk.

## Knowledge and evidence expansion
Adds three detailed regimen profiles and six principal evidence records:
- Cabazitaxel: TROPIC, PROSELICA, CARD.
- nab-Paclitaxel + gemcitabine: MPACT, with mature follow-up linked.
- FOLFOXIRI + bevacizumab: TRIBE, mature TRIBE follow-up, and TRIBE2.

The addendum is educational context only. It does not alter deterministic treatment rules and is labelled pending consultant oncology and oncology-pharmacy review.

## Sustainability
Adds source-constrained route, administration-frequency, encounter and ambulatory-pump metadata for the same three regimens.

No carbon estimates, environmental ranking or environmental traffic-light score is generated. Where the source does not establish a nationally standardised delivery/attendance model, the field remains evidence-required.

## NCCP Change Tracker
The scheduled source scan already completes successfully and can push a review branch. Repository settings currently block GitHub Actions from opening the pull request automatically.

v0.70.0 changes this final step to a graceful fallback:
- the successful scan and pushed review branch remain successful;
- blocked automated PR creation records a warning and the review-branch name;
- the workflow does not become red solely because the repository setting blocks automated PR creation.

## Homepage and security
- Preserves the v0.69.2 engine-first homepage hierarchy.
- Preserves search, fuzzy-match and progressive-disclosure behaviour.
- Preserves the earlier text-safe regimen-search injection remediation.
- Clinical Scenario Interpreter remains hidden from mainstream navigation with internal experimental access retained.

## Validation status
- Baseline v0.69.2 complete `npm.cmd test` suite: PASSED immediately before this drop-in was prepared.
- v0.70.0 overlay: JavaScript syntax, JSON parsing, YAML parsing, addendum counts and reconciliation idempotency checked during packaging.
- The complete post-drop-in `npm.cmd test` suite MUST be run locally before commit/push.
- Independent consultant oncology and oncology-pharmacy validation remains pending.
- Current NCCP source documents remain authoritative.
