
## v0.38.1 — GU catalogue display and alias hotfix

- Context-aware tissue badges and active-site-first multi-tissue labels.
- Corrected prednisolone display casing.
- Prevented indication text from creating false trade-name aliases.
- Added regression coverage for shared GU regimens and alias precision.

# SACTCheck v0.38.0 — Complete prostate treatment library

- Completes the current NCCP prostate deck with 26 fully encoded regimen protocols and no prostate placeholders.
- Adds 24 Genitourinary protocol JSON files and upgrades the existing shared NCCP 00203 and 00588 protocols for prostate use.
- Covers ADT injections, androgen-pathway agents, docetaxel/cabazitaxel chemotherapy, Akeega, olaparib and radium-223.
- Adds official NCCP PDF links, treatment schedules, eligibility/exclusions, monitoring, dose modifications, CTCAE guidance, renal bands and supportive-care mappings.
- Adds prostate trade-name aliases while retaining official generic NCCP titles.
- Preserves single-value partial assessment and audits 180 independently actionable prostate inputs.
- Rebuilds the catalogue to 145 distinct regimen protocols and updates the central supportive-care map.
- Passes the complete historical regression suite and prostate-specific release tests.

# SACTCheck v0.37.2 — Tissue UI and automatic local ULN calculations

- Adds a stable icon and colour system for tumour-site navigation, landing banners and regimen-card accents.
- Adds Breast, GI, Lung, Gynaecology, Genitourinary/Men’s, Neuro-oncology, Sarcoma, Haematology, Skin/Melanoma and Head & Neck UI identities.
- Replaces manual ALT/AST/bilirubin ×ULN entry with actual laboratory result entry and automatic calculation from a central CUH profile.
- Uses ALT 34 U/L, AST 42 U/L and bilirubin 20 µmol/L as editable CUH defaults.
- Applies automatic actual-result conversion to 94 existing protocol input definitions.
- Adds optional immunotherapy-only TSH, free T4, cortisol, sample time, ACTH, glucose and ketone inputs.
- Keeps all new immunotherapy blood fields optional and preserves single-value partial assessment.
- Adds focused v0.37.2 tests and passes the complete historical regression suite.

# SACTCheck v0.37.1 — Single-entry assessment and alias support

- Enforces meaningful one-value partial assessments across the active protocol library.
- Adds explicit normal-domain findings rather than generic insufficient-data output.
- Identifies linked fields/context only when genuinely required by a rule.
- Corrects ANC-only assessment behaviour for NCCP 00624 carboplatin + PLD.
- Adds central searchable common/trade-name aliases while retaining official NCCP names.
- Adds full-library single-entry and alias regression tests.

# SACTCheck v0.37.0 - Platform standardisation

- Standardises the complete 121-regimen catalogue rather than adding a new regimen batch.
- Separates pure endocrine/hormonal medicines from chemotherapy while retaining global search and tumour-site filtering.
- Adds explicit catalogue sections and treatment-class metadata to every active regimen.
- Maps every regimen to the central NCCP V6 emetogenic/supportive-care registry, including phase-dependent and oral SACT pathways.
- Reconciles stale per-protocol supportive links and clearly labels the included 2021 CUH sheets as pending local pharmacy reconciliation.
- Upgrades 415 CTCAE-based controls with beside-control Grade 0-4 explanations and practical assessment guidance.
- Corrects non-haematological toxicity classification and adds specialised diarrhoea/colitis, mucositis/diarrhoea, acneiform, allergic/anaphylaxis, myocarditis, myositis and neurological guidance.
- Converts 32 categorical renal-rule inputs to protocol-specific range selectors while retaining 27 exact carboplatin/Calvert inputs.
- Adds treatment-category filtering, section headings, supportive-care summaries and national-source links.
- Confirms no duplicate protocol IDs, NCCP codes or normalised titles and no active regimen placeholders.
- Adds the v0.37.0 platform-standardisation regression suite.

All clinical encodings and local supportive-care documents remain pending consultant, oncology-pharmacy and governance validation.

## v0.36.6

- Encoded five breast placeholder regimens.
- Applied reusable low-emetogenic traffic-light and CUH supportive-script mapping.
- Added regression coverage for the remediation batch.

# SACTCheck v0.36.4 — Platform-wide CTCAE grade descriptors

- Adds a central reusable CTCAE v5.0 educational descriptor library.
- Enhances every grade-based select input across all previously encoded regimens.
- Adds concise toxicity-specific one-line descriptions for neuropathy, diarrhoea/colitis, mucositis, pneumonitis, rash, infusion/hypersensitivity reactions, hypertension, proteinuria, haemorrhage, infection, PPE, cardiac, neurological and hepatic toxicity.
- Uses a standard Grade 0–5 severity descriptor when no toxicity-specific mapping is available.
- Preserves all existing protocol rules, values and decision logic; this release changes display and education only.
- Applies automatically to future protocols that use grade-based inputs.
- Adds a visible reminder that descriptors are concise educational aids and the full CTCAE criterion should be checked when clinically important.

# Version 0.36.3 — Breast Rule Remediation Batch 3

Converted five additional breast catalogue placeholders into protocol-specific encoded prototypes:

- NCCP 00204 pertuzumab, trastuzumab and docetaxel
- NCCP 00206 trastuzumab emtansine (metastatic)
- NCCP 00414 palbociclib
- NCCP 00525 ribociclib (metastatic)
- NCCP 00794 sacituzumab govitecan

Priority was given to NCCP exclusions, hard stops, ANC/platelet criteria, cardiac and organ-function restrictions, dose interruption/reduction pathways and regimen-specific severe toxicities. Sacituzumab includes day-specific ANC thresholds and occurrence-based G-CSF/dose-reduction logic. All remain pending consultant and oncology-pharmacy validation.

## Version 0.34.0 — Batch 6 early breast expansion

- Expands the active catalogue from 58 to 68 unique NCCP protocols.
- Adds ten non-duplicate early breast regimens: 00258, 00260, 00265, 00278, 00316, 00432, 00433, 00485, 00619 and 00745.
- Preserves single-value and partial assessment without mandatory cycle or phase entry.
- Uses conservative phase-dependent outputs where anthracycline and paclitaxel thresholds differ.
- Retains explicit patient-result versus protocol-cutoff comparison, official NCCP PDF validation and the pending emetogenic-risk/supportive-care framework.
- All new encodings remain prototypes pending formal clinical and pharmacy validation.

## Version 0.33.1 — explicit threshold comparison hotfix

- Displays the entered patient value beside the exact encoded protocol cutoff for triggered generic JSON rules.
- Shows the triggering operator and inherited units in a prominent comparison panel.
- Preserves the rule condition in deterministic engine findings for transparent rendering and documentation.
- Adds dedicated regression testing while retaining the 58-protocol catalogue and v0.33 rapid-assessment workflow.

# SACTCheck change log

## Version 0.33.0 — rapid assessment interface and emetogenic-risk framework

- Moves ANC, platelets, haemoglobin and WBC-type inputs to the top of the JSON assessment screen.
- Removes browser-level mandatory-entry restrictions from protocol and treatment-context controls.
- Retains safe partial assessment: omitted domains are unassessed and are never assumed normal.
- Replaces large optional input blocks with compact clickable rows showing “Not assessed” until a value is entered.
- Adds a regimen-level emetogenic traffic-light framework to catalogue cards and protocol assessments.
- Adds a central mapping file covering every active protocol. All entries remain grey/pending until the user-supplied antiemetic proforma is mapped; no risk category has been inferred.
- Retains all 58 unique active protocols and previous PDF, duplicate and TCHP regression safeguards.

# Version 0.32.0

## Batch 5 — early breast cancer expansion and PDF integrity
- Added 10 non-duplicate NCCP breast protocols: 00348, 00350, 00731, 00734, 00775, 00789, 00790, 00860, 00861 and 00892.
- Added breast treatment-setting metadata for neoadjuvant and adjuvant catalogue grouping.
- Restored the official NCCP PDF link for regimen 00857.
- Added a release-blocking regression test requiring every active protocol to provide an official HSE NCCP document URL.
- Catalogue increased from 48 to 58 active protocols.

# Version 0.31.0

## Batch 4 — GI biologics, immunotherapy combinations and pancreas
- Added 10 non-duplicate NCCP protocols: 00238, 00256, 00446, 00447, 00448, 00449, 00704, 00843, 00844 and 00926.
- Added an inactive central ECOG context placeholder; ECOG remains non-blocking for partial assessments.
- Catalogue increased from 38 to 48 protocols.
- Added duplicate-ID/path regression checks for the expanded catalogue.

# Version 0.30.1 — duplicate-control and TCHP partial-assessment correction

- Audited the complete v0.30 catalogue and established a canonical 38-protocol inventory.
- Removed the stale nested `protocols/protocols/` copy containing legacy duplicate JSON files.
- Confirmed there are no duplicate active protocol IDs or active catalogue paths.
- Documented intentionally similar but clinically distinct NCCP regimens so future batches do not remove or recreate them incorrectly.
- Corrected NCCP 00722 TCHP so cycle number and assessment-stage fields no longer block single-value partial assessments.
- Added a TCHP regression test for ANC-only and platelet-only assessment.

# v0.30.0 — Batch 2 lung expansion

- Added NCCP 00689 v4 atezolizumab + carboplatin + etoposide, with induction-only cytotoxic rules and atezolizumab maintenance logic.
- Added NCCP 00304 v8 carboplatin AUC6 + paclitaxel 200 mg/m².
- Added NCCP 00310 v7 gemcitabine + carboplatin AUC5.
- Added NCCP 00281 v7 gemcitabine + cisplatin 75 mg/m².
- Added NCCP 00317 v7 pemetrexed + cisplatin.
- Added Batch 2 regression tests, source register, and updated app/cache version labels.

# SACTCheck Changelog

## v0.29.0 — Batch 3 gynaecology expansion — 19 July 2026

- Added five live schema-2 JSON assessments: NCCP 00215 bevacizumab 15 mg/kg component/continuation, 00306 gemcitabine + carboplatin AUC4, 00624 carboplatin + pegylated liposomal doxorubicin, 00799 bevacizumab + paclitaxel + cisplatin for cervical cancer, and 00862 niraparib tablets monotherapy.
- Replaced the originally proposed unsupported bevacizumab/carboplatin/PLD triple with the current official NCCP 00624 carboplatin/PLD doublet.
- Migrated the existing legacy NCCP 00624 catalogue card to the generic JSON assessment, preventing a duplicate card while retaining the old screen as fallback code.
- Added indication, treatment-day, cycle, current-dose and conditional-toxicity controls appropriate to each regimen.
- Added official HSE/NCCP PDF access and source-page explanations for all five protocols.
- Preserved source-specific safety logic: bevacizumab 00215 has clinical-review monitoring rather than invented cycle-by-cycle ANC/platelet holds; day-1/day-8 gemcitabine rules remain distinct; niraparib uses event-specific interruption and dose-level pathways.
- Rebuilt the catalogue to 33 JSON protocols.
- Added v0.29 regression coverage; all 20 automated test scripts pass.
- All new encodings remain pending formal consultant and oncology-pharmacy validation.

## v0.28.0 — Batch 4 protocol expansion — 19 July 2026

- Added five live schema-2 JSON assessments: NCCP 00722 TCHP, 00726 pertuzumab/trastuzumab maintenance, 00831 atezolizumab/bevacizumab for HCC, 00897 durvalumab/gemcitabine/cisplatin for biliary tract cancer, and 00558 pembrolizumab 400 mg monotherapy.
- Added official HSE/NCCP PDF access, visible indication/treatment context, component-specific actions and source-page explanations for all five protocols.
- Preserved the single-agent ICI safety model: pembrolizumab monotherapy has no invented numerical ANC or platelet hold threshold.
- Added phase-specific handling to NCCP 00897 so chemotherapy count/renal fields are hidden during durvalumab-only maintenance while immune-toxicity rules remain active.
- Added explicit TCHP dose-reduction and G-CSF febrile-neutropenia pathways, cardiac, renal, hepatic, neuropathy and stomatitis rules.
- Rebuilt the catalogue to 28 JSON protocols and retained the one-card durvalumab integration after automatic index generation.
- Added v0.28 batch regression tests; all 19 automated test scripts pass.
- All new encodings remain pending formal consultant and oncology-pharmacy validation.

## v0.27.2 — Duplicate durvalumab card hotfix — 19 July 2026

- Merged the older hard-coded **Durvalumab maintenance** catalogue card with the current NCCP 00655 JSON **Durvalumab monotherapy** protocol.
- The library now displays one durvalumab card and launches the current JSON assessment.
- The legacy durvalumab screen remains in the codebase only as a fallback.
- Added a regression test preventing duplicate NCCP 00655 cards.

## v0.27.1 — Duplicate carboplatin–etoposide card hotfix — 19 July 2026

- Merged the legacy NCCP 00271 catalogue card with the live JSON protocol card.
- The library now shows one Carboplatin + Etoposide card, using the current v7 JSON assessment.
- Preserved the legacy assessment screen in the codebase as a fallback, but removed the duplicate public entry point.
- Updated integrated legacy cards from protocol JSON metadata so titles, versions, indications and tumour groups do not remain stale.
- Added regression coverage for the one-card rule.

## v0.27.0 — ICI safety, treatment context and catalogue correction — 19 July 2026

- Removed inherited cytotoxic ANC and platelet hold rules from single-agent durvalumab and atezolizumab.
- Updated atezolizumab to current NCCP 00593 version 10a and encoded current immune-toxicity pathways.
- Added a reusable `single_agent_ici` authoring profile and explicit FBC clinical-review handling without false NCCP count thresholds.
- Added ICI-specific endocrine, pulmonary, gastrointestinal, hepatic, renal, cutaneous, cardiac, neurological, muscular and infusion-reaction inputs.
- Added prominent protocol and treatment context controls, including indication and etoposide schedule.
- Added the official olaparib NCCP PDF link.
- Standardised catalogue engine, clinical-validation and source-status badges.
- Corrected displayed application and cache versions to v0.27.0.
- Added focused safety and interface regression tests.

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

## v0.35.0 — Batch 7 breast completion expansion
- Adds 20 non-duplicate breast regimens spanning remaining early/endocrine and locally advanced/metastatic treatment.
- Expands the active catalogue from 68 to 88 protocols.
- Retains blood-first partial assessment, explicit threshold comparison, official NCCP PDF tiles, duplicate safeguards, and the pending emetogenic/supportive-care PDF framework.
- New encodings remain prototypes pending consultant and oncology-pharmacy validation against the official NCCP documents.

## v0.36.0 — Complete NCCP breast protocol library

- Reconciled the active catalogue against the current NCCP neoadjuvant/adjuvant and locally advanced/metastatic breast libraries.
- Added 33 non-duplicate breast regimen cards, increasing the active catalogue from 88 to 121 protocols.
- Added full NCCP PDF access for every new card.
- Marked newly added cards as catalogue placeholders pending protocol-specific rule encoding and consultant/oncology-pharmacy feedback.
- Preserved existing validated live assessment rules and prevented duplicate NCCP IDs or paths.
- Expanded the pending emetogenic-risk map to all active protocols.

## 0.36.1 — Breast clinical-rule remediation batch 1

Converted five breast catalogue placeholders into source-checked encoded prototypes:
- NCCP 00232 intravenous vinorelbine
- NCCP 00259 oral vinorelbine
- NCCP 00251 carboplatin AUC 4–6 every 28 days
- NCCP 00230 nab-paclitaxel every 21 days
- NCCP 00738 bevacizumab plus weekly paclitaxel

Prioritises exact NCCP exclusions, baseline-versus-on-treatment context, ANC and platelet thresholds, renal/hepatic hard stops, dose delays/reductions, febrile neutropenia and key regimen-specific toxicity rules. All remain pending consultant and oncology-pharmacy validation before clinical authorisation.

## 0.36.2 — Breast clinical-rule remediation batch 2

Converted five additional breast catalogue placeholders into clinically encoded prototypes:

- NCCP 00261 carboplatin AUC 4–6 monotherapy, 21 day
- NCCP 00430 gemcitabine and carboplatin AUC2, 21 day
- NCCP 00507 pertuzumab, trastuzumab and weekly paclitaxel
- NCCP 00526 pertuzumab, trastuzumab and vinorelbine
- NCCP 00621 paclitaxel 80 mg/m² days 1, 8 and 15, 28 day

Prioritises source-specific exclusions, hard treatment stops, ANC and platelet thresholds, renal/hepatic restrictions, cardiac safety, hypersensitivity, neuropathy, febrile neutropenia and dose modification pathways. All remain encoded prototypes pending consultant and oncology-pharmacy validation.
