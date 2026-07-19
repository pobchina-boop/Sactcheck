## v0.26.0 — Ten-protocol breast, lung and gynaecology expansion

- Added live JSON assessments for NCCP 00250 TC, 00252 AC, 00512 weekly paclitaxel/trastuzumab and 00858 pembrolizumab with weekly carboplatin/paclitaxel followed by AC.
- Added live JSON assessments for NCCP 00271 carboplatin/etoposide, 00280 cisplatin/etoposide, 00593 atezolizumab maintenance and 00655 durvalumab maintenance.
- Added live JSON assessments for NCCP 00303 carboplatin/paclitaxel and 00766 bevacizumab/carboplatin/paclitaxel.
- Added official NCCP source links and batch integration tests.
- Protocol index now contains 23 entries.
- All new encodings remain pending formal consultant and oncology-pharmacy validation.

## v0.25.0 — Gastrointestinal five-protocol batch

- Added Capecitabine Monotherapy (NCCP 00216 v8) as a live JSON assessment with Official NCCP PDF access.
- Added 5-Fluorouracil and Folinic Acid, 14-day (NCCP 00660 v2b).
- Added FOLFOXIRI (NCCP 00555 v6b).
- Added Regorafenib Monotherapy (NCCP 00244 v5).
- Added Trifluridine/Tipiracil (Lonsurf®) (NCCP 00382 v3).
- Added dedicated batch regression tests and protocol-index checks.
- Updated the protocol index to 13 live protocols and refreshed the generic launcher cache version.
- Corrected the protocol-index build utility so embedded standalone library files are not re-indexed.
- All automated tests pass; formal consultant and oncology-pharmacy validation remains pending.

## v0.24.2
- Promoted NCCP 00515 Version 7 Modified FOLFIRINOX to the live generic JSON assessment engine.
- Connected the existing Modified FOLFIRINOX catalogue card to JSON assessment and the official NCCP PDF.
- Kept standard FOLFIRINOX NCCP 00329 as a separate live protocol.
- Added regression tests for both distinct FOLFIRINOX regimens.

## v0.24.1 — FOLFIRI/FOLFIRINOX catalogue integration hotfix

- Connected the existing FOLFIRI catalogue card to the live JSON assessment.
- Added a distinct NCCP 00329 Version 9 FOLFIRINOX catalogue card and connected it to the live JSON assessment.
- Added the automatic “JSON assessment live” status and Official NCCP PDF control to both cards through the generic protocol loader.
- Retained the separate legacy Modified FOLFIRINOX NCCP 00515 card.

## v0.24.0
- Added live NCCP 00227 Version 9 FOLFIRI assessment with 33 encoded rules and direct access to the official NCCP PDF.
- Added haematology recovery/nadir, renal, hepatic, DPD, diarrhoea, stomatitis, UGT1A1 and irinotecan cholinergic-syndrome pathways.
- Added dedicated FOLFIRI regression tests.
- No regimen-specific JavaScript or HTML was added; the protocol runs through the generic JSON launcher and assessment engine.

## v0.23.0
- Added live NCCP 00329 Version 9 FOLFIRINOX assessment with 42 encoded rules and official PDF access.
- Added FOLFIRINOX regression tests.

# SACTCheck v0.22

## XELOX / CAPOX live JSON integration

- Promoted NCCP 00321 Version 9 Capecitabine and Oxaliplatin Therapy (XELOX / CAPOX) to the live generic JSON assessment pathway.
- Reused the existing XELOX catalogue card through the protocol-agnostic launcher.
- Added 32 encoded rules covering exclusions, DPD status, haematology, renal function, hepatotoxicity, diarrhoea, stomatitis, hand-foot syndrome, neuropathy and laryngopharyngeal dysaesthesia.
- Added direct access to the official NCCP PDF from the protocol card.
- Added dedicated XELOX / CAPOX regression tests.
- Updated the application version and protocol-loader cache key to v0.22.

# SACTCheck v0.21

- Promoted NCCP 00209 Version 10a Modified FOLFOX-6 to the live generic JSON assessment pathway.
- Preserved the existing catalogue card while replacing its legacy launch action with the protocol-agnostic launcher.
- Added a prominent **Official NCCP PDF** action to JSON-backed protocol cards using `metadata.source_url`.
- Added live FOLFOX regression tests while retaining legacy-versus-JSON shadow comparison tests.
- Updated application version and protocol-loader cache key to v0.21.

# v0.20.0

- Replaced protocol-specific catalogue launch wiring with a single protocol-agnostic launcher.
- Both generated cards and migrated legacy cards now launch assessments by `data-protocol-id`.
- Published JSON protocols automatically receive the same assessment workflow, badges and launch behaviour.
- Shadow-validation entries remain excluded from normal catalogue launch.
- Added regression tests preventing paclitaxel- or olaparib-specific branches from reappearing in the loader.

# v0.19

- Promoted olaparib (NCCP 00588 v5b) to a first-class live JSON protocol in the main catalogue.
- Live JSON protocols without legacy cards now receive the same live status and launch wording as migrated legacy cards.
- Added regression coverage for olaparib main-app integration.
- Added the main-app integration test to the default test suite.

# v0.18.0 — Main catalogue JSON integration

- Weekly paclitaxel now launches the generic JSON assessment directly from its normal catalogue card.
- Removed the separate weekly paclitaxel shadow-assessment launcher from the live page.
- Added reusable `live_json` migration support so an existing catalogue card can be bound to a JSON protocol without creating a duplicate card.
- Existing catalogue metadata, search and tumour filtering are preserved.
- The catalogue badge now identifies the live JSON assessment pathway.
- Olaparib remains available through the same generic JSON assessment interface.
- Added main-app integration regression tests.

# v0.17.1

- Enabled partial, single-value JSON assessments across the generic assessment screen.
- Removed native browser required-field blocking from protocol-generated clinical inputs.
- Missing operands are now reported as unassessed rule-coverage gaps rather than assumed normal.
- Restrictive findings (hold, withhold, reduce, discontinue or contraindication) remain visible even when unrelated domains are incomplete.
- A normal single-domain result never produces an overall regimen clearance.
- Added independent weekly-paclitaxel hold rules for ANC <0.5 ×10⁹/L and platelets <70 ×10⁹/L so dose/duration fields refine rather than block the immediate safety action.
- Olaparib now supports ANC-, platelet-, renal-, febrile-neutropenia-, hepatic- and interaction-domain assessment without exhaustive form completion.

# Changelog

## v0.17 — Conditional Inputs and Weekly Paclitaxel JSON — 18 July 2026

- Added `visible_when` and `required_when` to the schema 2.x input contract.
- Changed the generic engine so only core and currently applicable conditional fields block completion.
- Optional missing fields are never inferred as normal; they are reported as explicit rule-coverage gaps.
- Updated the generated form to show, hide and mark conditional fields dynamically.
- Updated olaparib so febrile-neutropenia grade, haematological occurrence number and haemodialysis are requested only when their trigger applies.
- Added machine-readable NCCP 00226 Version 9 weekly paclitaxel with 19 inputs and 27 deterministic rules.
- Added a JSON shadow-assessment button to the existing weekly paclitaxel card while preserving the legacy assessment.
- Added calculated mg/m² output for percentage and fixed dose-change actions.
- Added 7 conditional-input tests and 24 weekly-paclitaxel threshold/boundary tests.
- Preserved all existing protocol publishing, generic-engine and FOLFOX shadow tests.

### Clinical boundary

The weekly paclitaxel encoding is an automated prototype pending consultant and oncology-pharmacy source review. The legacy assessment remains available and no clinical-use authorisation is implied.

## v0.16 — One-file Protocol Publishing — 17 July 2026

- Added the formal SACTCheck protocol contract at `protocols/protocol-schema.json`.
- Added `js/protocol-validator.js` for browser and Node structural/semantic validation.
- Added explicit `input_definitions` to all three encoded protocols, including labels, units, control types, options, ranges and demonstration values.
- Added explicit assessment profiles and profile-specific input overrides.
- Updated the assessment engine to prefer protocol-defined input metadata while retaining backward-compatible inference.
- Updated demonstration-value loading so new protocols supply their own safe preview values; no regimen-specific JavaScript defaults are required.
- Added a browser **Preview protocol JSON** screen with validation errors, warnings, generated assessment preview and session-only catalogue loading.
- Added `tools/build-protocol-index.js` to scan the protocol folders, validate each published JSON and regenerate `protocols/index.json`.
- Added a GitHub Actions workflow that validates protocol changes, runs all tests and commits the rebuilt catalogue.
- Added a schema 2.x authoring template under `protocols/_template/`.
- Added automated tests for undefined fields, duplicate rule IDs, unsupported operators, malformed select controls and complete generated demo forms.
- Preserved the FOLFOX legacy-versus-JSON shadow-validation pathway.

### Publication boundary

Browser imports are local previews only. A protocol becomes available to all users after its reviewed JSON file is committed to the repository and the automated validation workflow succeeds.

## v0.15 — Modified FOLFOX-6 JSON Shadow Validation — 17 July 2026

- Added machine-readable NCCP 00209 Version 10a Modified FOLFOX-6 protocol JSON.
- Encoded 32 deterministic rules covering exclusions, DPD status, haematology, renal and hepatic impairment, neuropathy, laryngo-pharyngeal dysaesthesia, pulmonary symptoms, diarrhoea, stomatitis and PPE review.
- Added a DOM-independent FOLFOX shadow-comparison core.
- Added a browser validation screen linked from the existing Modified FOLFOX-6 card.
- Added 17 predefined comparisons using identical inputs for the existing hard-coded FOLFOX engine and the new JSON rule set.
- Kept the legacy FOLFOX assessment as the active pathway.

## v0.14 — Generic JSON Assessment Engine — 17 July 2026

- Added a standalone deterministic rule engine.
- Added a protocol-level assessment engine with required-input validation.
- Added a reusable JSON-generated assessment interface.
- Added explainable findings and copyable/downloadable documentation.
- Retained all existing regimen-specific assessment screens as migration fallbacks.
