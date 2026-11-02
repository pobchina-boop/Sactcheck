# NCCP 00713 / 00714 retrospective audit — v0.84.27

Source checked 29 October 2026. Complete canonical proposals and full authoring are ready for root integration. No canonical/shared files were edited. Independent consultant, oncology pharmacy, clinical use and PPI approvals remain outstanding; software checks do not constitute clinical validation.

## Material corrections

1. Previous numeric liver/creatinine rules emitted permanent nivolumab/ipilimumab discontinuation before establishing immune causality, despite narrative caveats. Both source NCCP tables require alternative aetiologies to be excluded. New optional `nivo_immune_hepatitis_assessed` and `nivo_immune_nephritis_assessed` booleans gate numeric immune actions. Unknown, absent, empty, null or false attribution with abnormal results produces prompt consultant assessment instead. This is not clearance to treat. All independent chemotherapy renal restrictions and independently assessed immune events remain active. Existing named immune creatinine grades already assert a clinician-assessed immune event and retain their actions.
2. Current EMA Opdivo SmPC adds an explicit myocarditis–myositis–myasthenia gravis overlap pathway. This is a separately labelled supplemental source, not silently attributed to NCCP v4: at least two overlapping conditions; use the highest individual CTCAE v4 grade; grade 2 withholds both immune medicines; grade 3/4 permanently stops both. Suspected myocarditis/myotoxicity prompts urgent specialist assessment and clinician-directed management. The source grade table does not itself diagnose each event. Existing myocarditis grade and worsening-despite-steroids rules remain intact.
3. Complete clinical knowledge and patient authoring now carry causality assessment and urgent cardiac/muscular warning information. Explicit product source references added. Source metadata, hashes and retrospective release updated; numeric/boolean scalar types preserved.

## Fresh source review and retained distinctions

Official NCCP PDFs freshly downloaded using ordinary curl: 00713 v4 (14 pages) and 00714 v4 (13 pages). PDF SHA256s match the previous audit exactly; there is no NCCP version change. Current EMA Opdivo consolidated PDF downloaded and inspected; current supportive-care web source remains NCIS Medical Oncology v8 (10 February 2025). Full URLs, binary/text hashes, page references and retrieval limits are in sources.json.

Visual inspection: 00713 pp10–11 (premedication, immune liver/renal actions and exclusion of other aetiologies); 00714 pp6–8 (count thresholds, organ function, chemotherapy adverse-event table, support); Opdivo p13 (overlap table, CTCAE v4 and worst individual-event footnote). The remaining regimen and product sections were reviewed by extracted text. SmPC pp17 and19 support aetiology and myotoxicity management.

Preserved treatment schedule: one 42-day induction cycle with two chemotherapy administrations on Days 1 and 22; nivolumab 360 mg on Days 1/22 and ipilimumab 1 mg/kg on Day 1. Cycle 2 onward uses immune medicines only, up to 24 months absent progression/unacceptable toxicity. Source trial descriptions of “two chemotherapy cycles” refer to two 3-week doses, not two 42-day induction cycles. Surveillance continues at least five months after the last immune dose.

Preserved component-specific boundaries:

- Immune liver pathway after attribution: AST/ALT >3–5 ×ULN withhold; >5 permanently stop; bilirubin >1.5–3 withhold; >3 stop. Numeric creatinine >1.5–6 ×ULN withhold, >6 stop. Baseline ratio >1.5 supports hold, never infers grade 4. Ambiguous legacy baseline-or-ULN ratio remains review-only.
- Pemetrexed CrCl <45 mL/min and dialysis not recommended; severe hepatic impairment requires source-specific assessment, without an invented laboratory threshold.
- Cisplatin ≥60 mL/min full source dose; 50–59 75%; 40–49 50%; <40 not recommended. Decimal gaps between printed bands and broad legacy bands require review. Dialysis option does not override pemetrexed restriction.
- Carboplatin GFR ≤20 do not administer; >20–30 extreme caution. AUC 5 or 6 remains a consultant choice. Calvert exact continuous input stays separate from threshold-based renal assessment; retain GFR cap125, renal result recency and isotope-reference triggers.
- Counts remain source-specific: ANC <0.5 reduction after recovery, 0.5–<1 hold, 1–<1.5 review; platelets <50 reduction after recovery, 50–<75 hold, 75–<100 review. Bleeding changes the <50 restart pathway. No automatic multiplication of reductions.
- These chemotherapy actions do not apply during immune-only maintenance, while unexplained abnormal maintenance bloods still require review.

Support remains split by active medicines: induction carboplatin AUC≥4 dedicated antiemetic row versus cisplatin HEC row; immune maintenance Day1 low and Day22 minimal. No copied chemotherapy support into immune-only maintenance. Folic acid tail after the last pemetrexed dose retained; no automatic repeat B12 or rash dexamethasone in maintenance. Reconcile dexamethasone prophylaxis prescriptions rather than stacking doses.

NCCP histology wording is broader since May 2025, but pemetrexed histology suitability remains an explicit review. Whole-trial CheckMate 9LA outcomes do not establish pemetrexed suitability for every histology or superiority of one platinum backbone. Fresh primary PubMed abstract confirms the final six-year analysis: 719 randomized adults, minimum follow-up68.6 months, overall survival HR0.74 (95% CI0.63–0.87), six-year16% versus10%; nonsquamous subgroup17% versus12%. Existing population, comparator and limitation text retained. Patient evidence metrics remain empty. PMC full-text opening encountered a challenge; fresh abstract verification is not represented as fresh full-text retrieval.

## Validation and integration

- 00713: 71 explicit input definitions, 79 rules.
- 00714: 70 explicit input definitions, 81 rules.
- `node validation/lung-nivolumab-v08427/nivo-retro/source-cases.cjs`: **476/476 passed**.
- Includes the prior 402 regression cases with explicit immune attribution added only to numeric immune-action fixtures; all old thresholds retained. New unknown/false/empty/null attribution cases span induction and maintenance, preserve independent adverse findings, test overlap severity, execute actual assessment and dose-modification models, and validate complete scalar/day-group authoring.
- `--integrated` uses manifest canonical paths after root integration; not claimed run before integration.
- Proposal metadata conservatively leaves software_tests_completed false for root to mark after integrated validation. All clinical approval flags remain false.

Integration files: proposed/integration-manifest.json maps both canonical proposals; authoring.json is complete for both regimens, including protocol_metadata. No shared builder changes required. Root must carry the new content through consent, patient guides/portal, scripts and PDFs, then perform integrated and visual checks before packaging.
