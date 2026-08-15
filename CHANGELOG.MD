## v0.65.0 — Three profile evidence audited knowledge expansion — 15 August 2026

1. Adds docetaxel plus prednisolone for metastatic castration resistant prostate cancer.
2. Adds pembrolizumab plus axitinib for first line advanced renal cell carcinoma.
3. Adds avelumab across the current metastatic Merkel cell carcinoma and urothelial carcinoma maintenance indications.
4. Expands the principal evidence library from 45 to 50 records and the medicine library from 28 to 30 profiles.
5. Adds mature follow up and contextual evidence checks to reduce the risk of missing later practice changing studies.
6. Corrects Avelumab source metadata so urothelial maintenance is identified as 00535b and the current NCCP PDF address is used.
7. Preserves all deterministic clinical rules, treatment thresholds, dose actions and organ function pathways.

# v0.64.0

* Added three evidence audited regimen knowledge profiles.
* Added CheckMate 648, CheckMate 067 and CheckMate 204 evidence mappings.
* Added mature EV 302, CheckMate 649 and CheckMate 067 follow up.
* Corrected NCCP 00844, 00945 and 00431 emetogenic classifications against NCCP SACT Antiemetic Guidance V6.
* Preserved all deterministic clinical assessment logic.

# v0.63.1

## National NCCP antiemetic guidance migration

1. Replaces active local antiemetic prescription sheet links with national NCCP guidance.
2. Routes Medical Oncology contexts to the national Medical Oncology guidance and Haemato Oncology contexts to the national Haemato Oncology guidance.
3. Preserves the existing emetogenic risk classification and traffic light presentation.
4. Removes active local antiemetic prescription PDFs from the application assets.
5. Changes only supportive care source metadata in protocol records and preserves the deterministic clinical core.
6. Adds focused regression testing and a source migration audit.

# v0.63.0

## Primary clinical validation workspace

1. Adds tissue by tissue primary clinical review across all enabled protocols.
2. Creates 451 tissue review contexts from 376 enabled protocol records so shared regimens can be reviewed separately by clinical context.
3. Adds thirteen structured review domains with explicit correction and specialist review states.
4. Adds discrepancy logging, resolution tracking, direct NCCP source access and live SACTCheck assessment access.
5. Adds local validation log persistence with JSON and CSV export and JSON import.
6. Keeps primary clinical review separate from formal consultant oncology and oncology pharmacy validation.
7. Preserves all 382 protocol JSON files unchanged.

# v0.62.1

1. Rewrites the NCCP Change Tracker interface for a clinician facing presentation.
2. Removes references to internal hosting, repository automation, source fingerprints and extracted text processing from the visible application.
3. Replaces technical status terms with source check, review state, clinical significance and reconciliation language.
4. Simplifies the visible pathway to Detect, Compare, Review and Reconcile.
5. Preserves the existing source surveillance engine, mandatory human review gate and all clinical protocol content unchanged.

# v0.62.0 — NCCP Change Tracker — 6 August 2026

1. Adds a canonical source register for all 376 enabled protocols.
2. Adds detection for new protocols, updated sources, silent PDF replacement and removed or moved source candidates.
3. Adds PDF and extracted text SHA 256 fingerprint capture through a weekly and manual GitHub workflow.
4. Adds treatment, safety workflow, information and formatting change triage.
5. Adds a dedicated What is New and What Has Changed dashboard with function and strength explanations for every core feature.
6. Adds previous and current source comparison, change history fields and per regimen source status.
7. Adds a mandatory human review gate and pull request based source update workflow.
8. Leaves all 382 protocol JSON assets and deterministic clinical rules unchanged.
9. Records that remote source capture remains pending until the first repository workflow run.

# v0.61.0 — Three-Regimen Expansion and Evidence-Completeness Audit — 6 August 2026

- Expands the structured knowledge base from 15 to 18 profiles.
- Adds XELOX/CAPOX, weekly paclitaxel and trastuzumab deruxtecan.
- Increases principal evidence mappings from 22 to 42 records.
- Adds visible evidence-relationship labels and a per-profile evidence-completeness audit.
- Audits all fifteen earlier profiles and closes material multi-indication and mature-follow-up gaps.
- Preserves RECOURSE and SUNLIGHT with distinct monotherapy and contextual-combination boundaries.
- Leaves all 382 protocol JSON files and all deterministic clinical logic unchanged.
- Independent consultant oncology and oncology-pharmacy review remains pending.

# v0.60.3 — Hero Position Fix and SUNLIGHT Evidence — 6 August 2026

- Preserves the corrected hero-first landing layout introduced in v0.60.2.
- Adds the phase 3 SUNLIGHT trial to the Lonsurf knowledge page as contextual evidence for trifluridine/tipiracil plus bevacizumab.
- Clearly states that the encoded NCCP 00382 protocol is monotherapy and does not generate a combined bevacizumab assessment pathway.
- Leaves all 382 protocol JSON files unchanged.

# v0.60.2 — Landing Hero Position Fix — 6 August 2026

- Moves the persistent mission hero from the catalogue end to the top of the library screen.
- Corrects the runtime layout controller so it no longer moves the regimen catalogue ahead of the hero.
- Keeps regimen search above the collapsed early-development clinical scenario interpreter.
- Moves detailed product/evaluation content into an optional section within the welcome modal, removing the duplicate promotional block after the regimen cards.
- Preserves all clinical logic, organ-function rules, knowledge-base content and 382 protocol JSON files unchanged.

# v0.60.1 — Mission-Led Landing Page — 6 August 2026

- Replaces the automatically presented quick-start-first screen with a product introduction explaining what SACTCheck is, why it exists and how its source-linked workflow supports clinicians.
- Adds a prominent **Launch SACTCheck Engine** call to action, visual Find–Assess–Explain–Verify pathway, mission statement, value cards and advantages section.
- Retains the three-step quick-start guide as optional secondary guidance.
- Preserves all v0.60.0 clinical rules, protocol files, organ-function reconciliation and fifteen-regimen knowledge base.

# v0.60.0 — Fifteen-Regimen Knowledge Base — 6 August 2026

- Expanded the detailed knowledge base from ten to fifteen regimen profiles.
- Added FOLFIRI, gynaecological carboplatin/paclitaxel, pembrolizumab/paclitaxel/carboplatin, sacituzumab govitecan and durvalumab/gemcitabine/cisplatin profiles.
- Added or enriched V303, GOG-158, KEYNOTE-407, ASCENT and TOPAZ-1 evidence records with populations, comparators, outcomes, limitations and publication links.
- Added treatment-intent, patient-selection, supportive-care, monitoring/toxicity and administration modules for all five regimens.
- Added a reusable sacituzumab-govitecan drug-mechanism profile.
- Preserved all v0.59.0 organ-function pathways and all 382 protocol JSON files byte-for-byte unchanged.
- Independent consultant oncology and oncology-pharmacy review remains pending.

# v0.59.0 — Library-Wide Organ-Function Reconciliation — 5 August 2026

- Completed the v0.58.1 organ-function remediation programme across all 74 records previously marked partially rule-encoded.
- Added structured component-specific renal/hepatic rules to 70 protocols and explicit no-prescriptive-adjustment resolutions to four protocols.
- Added 299 executable `OF590_` rules covering source-specific CrCl/GFR bands, dialysis, bilirubin, transaminases, Child–Pugh class and treatment-emergent organ toxicity pathways.
- Preserved optional single-value partial assessment and explicit unassessed-domain output.
- Added a 74-record source register, library-wide audit, SHA-256 integrity register and rule-trigger regression coverage.
- Verified 74 intentional protocol JSON changes with no protocol additions or removals.
- Updated application versioning, documentation and deployment artefacts while preserving the search-first interface and ten-regimen knowledge base.
- Independent consultant oncology and oncology-pharmacy validation remains pending.

# v0.56.1 — Five-Regimen Knowledge Base Pilot

- Added detailed regimen information pages for NCCP 00382, 00568, 00655, 00857 and 00624.
- Added regimen overview, treatment setting, component rationale, schedule context and key orientation points.
- Expanded principal evidence mappings with population, intervention, comparator, endpoint, selected findings, limitations, DOI links and follow-up publications.
- Added RECOURSE, KEYNOTE-189, PACIFIC, KEYNOTE-522 and CALYPSO detailed page content.
- Corrected root knowledge-base asset references and added focused structural regression coverage.
- Kept the current NCCP protocol as the operational treatment source.
- Preserved all clinical protocol JSON files and deterministic rules unchanged.

# v0.55.0 — Global clinical scenario interpreter

- Added a standalone Clinical scenario interpreter to the main library screen.
- Added local catalogue matching for disease, regimen, drug, trade-name, acronym and NCCP-number language.
- Added explicit ambiguity handling and unmatched-medicine warnings before protocol selection.
- Reused the v0.54.0 in-regimen confirmation workflow only after the clinician selects the exact protocol.
- Included every v0.54.0 feature in the cumulative package.
- Changed no clinical protocol JSON, threshold, recommendation or dose calculation.

# v0.54.0 — Constrained Scenario Interpreter

- Added local, clinician-confirmed extraction of structured regimen inputs from de-identified free text.
- Kept the deterministic protocol engine as the sole decision layer.
- Added privacy and regimen-context warnings.
- Refined the Immunotherapy toxicity map heading and organ-specific input navigation.
- Changed no clinical protocol JSON, threshold, recommendation or dose calculation.

## v0.53.0 — Immunotherapy Visual Safety — 31 July 2026

- Adds an original organ-system immune-toxicity map inside supported ICI regimen assessment engines.
- Links nine visual domains to existing symptoms, laboratory inputs and deterministic assessment findings.
- Adds transparent No data, Data entered, Review/withhold and Urgent/stop tile states.
- Adds direct NCCP, ESMO, SITC and agent-specific EMA source links.
- Adds repeatable audit and regression coverage for 49 ICI protocols.
- Makes no changes to clinical protocol JSON files, NCCP thresholds, assessment rules or dose calculations.

## v0.52.5 — Dose Action Navigation — 30 July 2026

- Fixes the assessment-result dose review control when the protocol has an encoded component dose action but no complete structured schedule.
- Opens an action-only embedded panel containing the governing component action, trigger, protocol dose outcome and source reference.
- Uses “Review dose action” when no complete schedule is available and retains “Review dose & schedule” when structured schedule data exist.
- Makes no changes to clinical protocol JSON files, thresholds or dose calculations.

## v0.52.4 — Compact Clinical Inputs & Phase Naming — 30 July 2026

- Removed blank-state “Not assessed” labels from input controls.
- Consolidated laboratory and organ-function fields into a responsive compact grid.
- Reduced CTCAE and repeated optionality clutter in laboratory cards.
- Added phase-first display titles for nine sequential breast regimens.
- Preserved all clinical protocol JSON and dose-modification logic unchanged.

## v0.52.3 — Input Classification & ECOG Guidance — 30 July 2026

- Corrected a substring-matching defect that could classify “Pregnant” and “ECOG performance status” as haematology because both contain the letters “anc”.
- Moves pregnancy, breastfeeding and ECOG performance status to Other treatment criteria.
- Adds dedicated ECOG 0–5 functional-status descriptions and removes incorrect CTCAE generic severity descriptions from ECOG options.
- Adds library-wide regression checks for non-laboratory field classification.
- Preserves all clinical protocol JSON files and the v0.52.2 integrated dose-modification engine unchanged.

## v0.52.2 — Integrated Laboratory & Dose Modification — 30 July 2026

- Consolidated regimen-relevant haematology, renal, hepatic and other laboratory inputs near the top of the assessment engine.
- Separated laboratory inputs from CTCAE/clinical toxicities and other treatment criteria.
- Linked entered assessment values to the embedded Protocol Dose & Schedule engine.
- Added component-specific resolution of percentage bands, fixed dose levels, explicit replacement doses, hold/delay, omit, discontinue and contraindication outcomes.
- Added transparent protocol-dose derivation while stopping short of BSA, weight-based or patient-specific final-dose calculation.
- Preserved all clinical protocol JSON files unchanged from v0.52.1.
- Passed the complete security, publishing, historical regression, Pages-build and deployable-site validation pipeline.

## v0.51.0 — Solid Tumour Reconciliation

- Reconciled all 361 indexed solid tumour protocols against the current published NCCP tumour-group catalogue structure.
- Removed forced launch requirements across the solid tumour library so any entered value can produce a partial assessment and omitted domains remain unassessed.
- Replaced 12 non-specific `current` source-version labels with explicit NCCP PDF versions and corrected two superseded PDF addresses.
- Added reproducible duplicate, path, source, version, metadata and single-value audit tooling.
- Removed the stale unindexed `protocols/protocols/` legacy copy from the release.
- No treatment thresholds, dose modification conditions or rule recommendations were intentionally changed.

# Changelog

## v0.50.3 — Regimen Card Clarity

- Replaced the split homepage protocol count with a single total of 376.
- Added visible regimen component rows for structured combinations and recognised acronyms.
- Standardised Haematology cycle chips to qXd card formatting.
- Added conservative source-linked causative-agent attribution to CTCAE/toxicity labels across the full library.
- No clinical decision logic changed.

## v0.50.2 — NCCP Protocol Link Reliability

- Changed JSON generated official NCCP protocol links from forced new tab behaviour to normal same tab navigation.
- Added no referrer handling for direct HSE PDF requests.
- Added regression coverage for all 15 Haematology source URLs and both card and assessment screen links.
- No clinical logic or protocol encoding changes.

## v0.50.1 — Clinical Copy Refinement

- Removed Haematology from Solid Tumour tumour site navigation.
- Corrected Solid Tumour counts and quick access so Haematology protocols remain within the dedicated Haematology portal.
- Removed the large patient information card from the opening study panel.
- Replaced technical generic result wording with shorter clinical language following consultant feedback.
- Updated prominent interface copy to avoid unnecessary hyphenated phrasing.
- Preserved all 376 protocol encodings and clinical rules unchanged.

## v0.48.0 — Feasibility Study Release

- Added the SACTCheck shield, protocol-document and check-mark visual identity.
- Added a branded product header, polished landing experience and first-use study onboarding.
- Added installable favicon, Apple home-screen and PWA icon assets.
- Added a quick-start guide, feasibility feedback template and tester invitation text.
- Reframed the distributed build for hypothetical, non-identifiable scenario evaluation.
- Recorded the explainer-video embed as the next study-release task.
- Preserved all protocol JSON files and clinical rules unchanged.

## v0.47.2 — Regimen search hotfix

- Fixed live library search and Enter-to-jump behaviour.
- Added normalised oncology aliases including 5-FU/5FU/fluorouracil, FOLFOX variants, leucovorin/folinic acid, CAPOX/XELOX and PLD.
- Brought matching cards into the immediate viewport and made search global across tumour sites.
- Added focused search regression tests; no clinical protocol rules changed.

## v0.47.1 — Clinician-Focused Usability Release

- Reconciled the visible library with all 361 enabled canonical protocols.
- Promoted search, added favourites/recent protocols and strengthened tumour navigation.
- Simplified regimen cards and added explicit phased schedule labels.
- Reorganised assessment output around patient-value versus encoded-criterion comparisons.
- Added non-directive result language, compact coverage disclosure and progressive detail.
- Preserved direct adaptive PDF generation and passed the complete regression suite.

## v0.47.0 — Complete Neuroendocrine and Adult Tumour-Agnostic Libraries
- Completed 3 Neuroendocrine and 2 adult tumour-agnostic regimen families.
- Added sunitinib 37.5 mg and adult larotrectinib; reconciled everolimus, lutetium-177 oxodotreotide and entrectinib.
- Added dedicated navigation, contextual indications and source-specific rule pathways.
- Expanded the indexed library to 361 protocols.

## v0.46.0 — Complete Head and Neck Library
- Added/reconciled all 30 current unique NCCP Head and Neck regimen codes.
- Added 21 new protocols and reconciled 9 existing/shared canonical protocols without duplicate cards.
- Added squamous-cell, nasopharyngeal, salivary-gland and thyroid assessment pathways.
- Expanded the indexed library to 359 protocols.

## v0.45.3 - Direct adaptive clinical PDF generation
- Replaced the browser print dialogue with a direct standard-PDF download.
- Routine assessments default to one A4 page; exhaustive input paginates automatically.
- Generated PDFs retain every entered printable value and repeat headings on continuation pages.
- Added page numbering, source-verification footers and local/offline PDF generation.
- Preserved clinician decision documentation, unassessed-domain disclosure and the permanent disclaimer.
- Added page-count estimation and direct-PDF regression tests.
- Verified one-page and multi-page PDFs by render inspection.

## v0.45.2 — One-page clinical output and safety-language update
- Added a dedicated one-page A4 assessment summary for printing or saving as PDF.
- Added non-directive encoded-criteria outcomes: criteria breached/requiring review, partial assessment, or no encoded criterion breached.
- Added a compact table of entered values, patient results, encoded criteria and result status, with clinically important triggered findings prioritised.
- Added explicit unassessed-domain disclosure; blank values remain unknown and are never assumed normal.
- Added separate clinician-decision and concise rationale/override documentation fields.
- Added a permanent decision-support disclaimer to the screen, one-page PDF and detailed text summary.
- Retained the detailed electronic assessment and text export for audit and validation use.
- Added A4 print styling, one-page output tests and visual PDF verification.

## v0.45.1 — Tissue-specific shared-regimen indication hotfix
- Added tissue-context resolution for regimens shared across multiple tumour libraries.
- Regimen-card indication text now follows the active tumour-site filter instead of the protocol's primary indication.
- Opening a shared regimen now carries the selected tissue into the assessment screen and preselects the relevant indication.
- Added explicit tumour-group metadata to 134 indications across 37 shared protocol files.
- Added safe fallback wording where a linked tissue indication has not yet been encoded, preventing unrelated indication text from being shown.
- Added contextual-indication regression tests; the complete repository suite passes.

## v0.45.0 — Complete Skin and Melanoma Library
- Added/reconciled all 16 current unique NCCP Skin/Melanoma regimen codes.
- Added 9 new protocols and reconciled 7 existing/shared canonical protocols without duplicate cards.
- Added melanoma, Merkel-cell, cutaneous squamous-cell and basal-cell assessment pathways.
- Expanded the complete indexed library to 338 protocols.
- Corrected q42-day pembrolizumab metadata and added advanced, adjuvant and phased-course card contexts.

## v0.44.0 — Complete Genitourinary Library
- Added/reconciled all 67 current unique NCCP GU regimen codes across bladder, germ-cell, prostate and renal cancer.
- Added 21 new protocols and reconciled 46 existing/shared canonical protocols without duplicate cards.
- Added intravesical, chemoradiation, immunotherapy, targeted-therapy and specialist germ-cell assessment pathways.
- Expanded the complete indexed library to 329 protocols.
- Populated GU regimen-card intent, cycle interval and treatment-duration metadata with explicit review flags where duration remains indication-dependent.

## v0.43.0 — Complete Gynaecology Library
- Added/reconciled all 48 current NCCP Gynaecology regimen documents as active encoded protocols.
- Added cervical, endometrial, ovarian, GTN and ovarian germ-cell pathways.
- Added immunotherapy, PARP inhibitor, bevacizumab, chemoradiation and specialist GTN assessment logic.
- Expanded the complete indexed library to 308 protocols.

## v0.42.0 — Complete Neuro-oncology Library
- Added 10 fully encoded current NCCP Neuro-oncology protocols.
- Added glioblastoma, glioma, medulloblastoma/PNET, PCV, CLV, lomustine, bevacizumab and temozolomide pathways.
- Added source-specific count, renal, hepatic, toxicity, proteinuria, radiotherapy-phase and PJP-prophylaxis logic.
- Expanded the complete indexed library to 280 protocols.
- Added 201 Neuro-oncology inputs and 245 source-specific rules, with 180 rule-linked fields individually tested for single-entry assessment.
- Passed the complete regression suite in the working release and after clean ZIP extraction.

# v0.41.1 — Regimen Title Normalisation Hotfix (25 July 2026)

- Normalised non-standard mixed-capitalisation in regimen display titles across the complete library.
- Preserved exact NCCP source titles separately for traceability.
- Added display-layer safeguards and regression testing to prevent recurrence.

# v0.41.0 — Complete Sarcoma Library (25 July 2026)

- Completed all 25 official NCCP Sarcoma regimen cards as active assessment protocols with no placeholders or drafts.
- Added 19 dedicated Sarcoma protocol files and reconciled 6 canonical shared protocols.
- Added source-specific ifosfamide/Mesna/hydration, MAP/high-dose methotrexate rescue, anthracycline cardiac, cisplatin renal, PLD, trabectedin and GIST targeted-therapy pathways.
- Added Sarcoma-wide single-entry, CTCAE, ULN, renal-band, supportive-care, source-link and alias regression coverage.
- Updated NCCP 00500 doxorubicin monotherapy to current Version 3.
- Rebuilt the complete catalogue to 270 distinct protocols.
- Passed the complete regression suite before packaging and after clean extraction.

# v0.40.0 — Complete Lung Library (24 July 2026)

- Completed all 59 official NCCP Lung regimen cards as active assessment protocols.
- Added 38 new Lung protocol files and reconciled 21 canonical existing/shared protocols.
- Added Lung-wide single-entry, CTCAE, ULN, renal-band, supportive-care and alias regression coverage.
- Corrected historical Lung tumour-site leakage from two breast-only HER2/paclitaxel regimens.
- Rebuilt the 248-protocol index and central supportive-care map.


# v0.39.0 — Complete Gastrointestinal Library (24 July 2026)

- Completed all 93 official NCCP GI regimen cards as active assessment protocols.
- Added 65 new GI protocol files and reconciled 28 canonical existing/shared protocols.
- Added GI-wide single-entry, CTCAE, ULN, renal-band, supportive-care and alias regression coverage.
- Rebuilt the 210-protocol index and central supportive-care map.


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
