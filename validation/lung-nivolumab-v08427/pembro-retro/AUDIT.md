# Pembrolizumab combination retrospective audit — v0.84.27

Checked 29 October 2026. Proposals only; independent consultant and oncology-pharmacy review remain outstanding. No clinical-use approval is asserted.

## Sources and retrieval

Fresh official NCCP web PDFs confirm 00568 v5, 00569 v5 and 00579 v5a. No version change was found. Reviewed indication/schedule, eligibility, monitoring, dose tables, supportive care and version histories. Direct downloads returned HTTP 403; fresh byte hashes are therefore null in sources.json. Existing canonical snapshot hashes describe retained earlier material, not newly downloaded bytes. Web PDF screenshots resolved for critical tables. The retained 00568 v5 page 5 was additionally rendered locally and visually inspected; its hash is explicitly labelled retained. EMA direct product-information access returned 429; fresh official search-index passages verify exclusion of alternative liver/renal causes, alongside the NCCP adverse-event narrative. Direct IV manufacturer SmPC HTML exceeded the retrieval limit. These retrieval limitations must not be represented as fresh full-PDF downloads.

## Clinical changes

00568 previously applied pembrolizumab permanent liver/renal discontinuation to laboratory numbers without an attribution field. Added compatible optional attribution selectors and retained all original rule IDs. Confirmed immune attribution now gates seven liver/renal rules. Missing or suspected attribution produces withholding pending prompt assessment, not a diagnosis or permanent stop. Baseline/established other causes do not activate immune stops, while independent pemetrexed/carboplatin restrictions remain active.

Across all three regimens, baseline grade 2 liver-metastasis context with AST/ALT rise at least 50% lasting at least seven days now has an unresolved-attribution withholding branch even when absolute ULN values are absent. Confirmed immune hepatitis retains the existing permanent-stop branch. Below either boundary the new relative branch does not fire.

00568 also now distinguishes the culprit of a severe infusion reaction: unknown culprit holds the whole regimen for immediate assessment, whereas confirmed pembrolizumab grade 3/4 reaction retains permanent pembrolizumab discontinuation. Added source Table 2 suitability review for severe renal and moderate/severe hepatic impairment; these are not immune-toxicity diagnoses or dose reductions.

Did not import the newer 00569 grade-2 adrenal/hypophysitis table wording into 00568 as though it were identical NCCP wording: 00568 explicitly lists symptomatic hypophysitis. The existing symptomatic pathway remains. NCCP source differences remain visible.

## Thresholds retained

Immune liver: AST/ALT >3 to 5 or bilirubin >1.5 to 3 times ULN withhold; >5 or >3 respectively permanently discontinue only in the confirmed immune pathway. Nephritis creatinine >1.5 to 3 times laboratory ULN withhold; >3 stop for confirmed immune nephritis. Legacy creatinine field name retained, but its label/guidance specifies ULN, not baseline.

Pemetrexed CrCl 45 mL/min boundary, independent hepatic suitability and chemotherapy injury rules retained. Cisplatin 45–59 / ≥60 source bands retain consultant handling for fractional gaps. Carboplatin ≤20 prohibition, >20 to ≤30 extreme caution, <60 myelosuppression risk retained. Paclitaxel bilirubin source gaps (1.25–1.26 and 2–2.01), AST 10 boundary, original-dose ceilings and no automatic re-escalation retained. No cross-drug dose multiplication introduced. Existing 00569/00579 source regression cases were retained unchanged apart from source-checked date/path.

## Full service authoring

Complete patient, clinical, evidence, journey, selector, support, route, risk, metadata and indication card contexts supplied. Patient scalar types and all 21 cycle days verified. All authoring source IDs resolve. Induction is at most four 21-day cycles; 00568/00569 retain pembrolizumab plus pemetrexed maintenance and folate/B12/rash support. 00579 retains pembrolizumab-only maintenance with chemotherapy premedications removed. Active drug lists are explicit in each support plan. Thyroid checks every 3–6 weeks remain distinct from each-cycle FBC, renal/liver and glucose; imaging remains the consultant plan. No patient date entry.

KEYNOTE-189 five-year evidence remains a pooled cisplatin/carboplatin estimate, not a platinum-specific treatment effect. KEYNOTE-407 pools paclitaxel/nab-paclitaxel; no isolated paclitaxel estimate claimed. A newer China-specific report found in search was not substituted for the general randomized population. Trial 35-cycle pembrolizumab limit is not turned into a universal NCCP stop. Patient evidence has no numeric prognosis metrics; quantitative endpoints remain clinician-facing with applicability limits.

## Validation and migration

444/444 proposed tests pass using the real assessment engine and dose renderer. Covers retained 00569/00579 cases, 00568 liver/renal attribution boundaries, relative-rise missing-context branches, infusion attribution, baseline organ review, phase models, blank optional inputs, patient numeric schema and support active-drug lists. Run source-cases.cjs --integrated after root copies proposals; integrated status is not claimed before integration.

00568: 82 rules / 59 inputs. 00569: 90 rules / 64 inputs. 00579: 72 rules / 54 inputs. All original IDs retained; every input optional with blank demonstration. Old 00568 fixtures expecting a permanent immune stop from labs alone must now explicitly set confirmed_immune; unknown causes should expect holding pending assessment. Old severe-infusion fixtures must identify pembrolizumab if testing its permanent stop.

Remaining review: independent clinical and pharmacy validation, especially source conflicts and treatment attribution; root-run complete service build, PDF/QR checks, browser interaction testing and wider regression. Software source tests are not clinical approval.
