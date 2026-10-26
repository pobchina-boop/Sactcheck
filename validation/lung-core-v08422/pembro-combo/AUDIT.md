# v0.84.22 pembrolizumab combination source audit

Checked 26 October 2026. Scope: new full suite **00579** and retrospective full-template upgrade **00569**. This is a software/content source reconciliation, not independent consultant, oncology-pharmacy or patient/PPI validation. Clinical-use authorisation remains false.

## Current sources and retrieval limits

| Regimen | Fresh official source | Version / pages | Review date | Proposal rules |
|---|---|---|---|---:|
| 00569 | HSE 569_V5_Pembrolizumab_PEMEtrexed_and_CISplatin.pdf | 5 / 11 | 19 December 2027 | 89 |
| 00579 | HSE 579_V5a_pembrolizumab_carboplatin_paclitaxel.pdf | 5a / 10 | 24 May 2029 | 71 |

The official PDFs were retrieved through the web PDF text service. Direct binary retrieval returned HTTP 403. Saved extraction snapshots and critical-table extracts are in `research/`; `source_text_snapshot_sha256` hashes the saved text snapshot, **not** a PDF binary. No PDF hash is asserted. Screenshot requests were made for critical tables, but this worker received text placeholders rather than image pixels, so no visual PDF verification is claimed here. Parent release PDF/browser verification remains necessary.

NCIS Medical Oncology antiemetics **V8, 10 February 2025**, was freshly checked. Its dedicated carboplatin AUC≥4 row differs from the general high-risk row: carboplatin does not routinely include olanzapine; cisplatin HEC does. All overlapping steroid indications require one reconciled prescription.

## Material repairs

- Both old protocols used ECOG >2 rather than the source eligibility range 0–1. This now prompts review above 1.
- Both now distinguish four-cycle triplet induction from the actual maintenance drugs. **00569 retains pemetrexed and pembrolizumab; 00579 retains pembrolizumab alone.** The schedule renderer receives `treatment_phases[].active_drugs` and complete administration data.
- Immune hepatitis/nephritis require attribution before a definitive permanent-discontinuation output. Abnormal numbers with missing/suspected cause produce hold/review. Baseline impairment does not masquerade as immune toxicity. Creatinine is explicitly a **laboratory ULN multiple**, never a baseline ratio, despite retaining the old storage key for portability.
- Infusion-reaction culprit is explicit: a severe chemotherapy reaction does not automatically permanently discontinue pembrolizumab. An unknown culprit produces immediate hold/clinical assessment.
- Source immune pathways now cover recurrence, severe skin/SJS/TEN, endocrine events, type 1 diabetes, myocarditis/encephalitis/Guillain–Barré events, and the 12-week recovery/steroid condition. The 00569-specific adrenal/hypophysitis row is not blindly copied into 00579.
- 00569 now has explicit cisplatin renal, hearing and baseline-neuropathy pathways; pemetrexed renal/hepatic and supplement pathways; treatment-related chemotherapy diarrhoea, mucositis, neurotoxicity, hepatotoxicity and repeated-reduction review. Baseline neuropathy is separate from treatment-emergent toxicity.
- 00579 old paclitaxel bilirubin >3 contraindication was incorrect. Table 2 allows a 50%-of-original specialist pathway at bilirubin 2.01–5 with AST/ALT <10, and contraindicates AST/ALT ≥10 or bilirubin >5. Current reductions are not re-escalated by a hepatic ceiling.
- 00579 now captures chemotherapy count bands, renal method/freshness, next-cycle/persistent neuropathy, mucositis occurrence history, and maintenance residual-toxicity review.

## Exact source boundaries and residual judgment

| Domain | 00569 | 00579 |
|---|---|---|
| ANC | 1–<1.5 review if well; 0.5–<1 delay; <0.5 delay/reduce 25%; FN delay/reduce 25% | 1–<1.5 and 0.5–1 rows overlap at **1.0**: hold/review; <0.5/FN delay, consider 25% reduction |
| Platelets | 75–<100 review; 50–<75 delay; <50 delay/reduce 25%, or 50% with bleeding | 75–<100 and 50–75 overlap at **75**: hold/review; <50 delay, consider 25% reduction |
| Platinum renal | Cisplatin ≥60 full, 45–59 75%; **>59–<60 is a gap**; <45 excludes/consider alternative, never automatic carboplatin substitution | CrCl <60 myelosuppression risk; >20–≤30 extreme caution; **≤20 do not administer**; 20 overlap resolved to restrictive source row |
| Pemetrexed | CrCl <45 not recommended; bilirubin >1.5 or AST/ALT >3 without / >5 with liver metastases: not recommended, clinical decision | Not part of regimen |
| Taxane hepatic | Not part of regimen | AST/ALT <10 + bilirubin 1.26–2 → 75% original; 2.01–5 → 50% original; fractional gaps **1.25–1.26 / 2–2.01 require review** |
| Immune hepatic | AST/ALT >3–5 or bilirubin >1.5–3 hold; >5 or >3 respectively stop when immune attribution confirmed | Same Table 3 thresholds, independently checked |
| Immune renal | Grade 2 and creatinine >1.5–≤3 ULN hold; grade ≥3 and >3 ULN stop with confirmed cause/grade | Same; source baseline renal impairment advice is more permissive than 00569 and is kept distinct |
| Chemotherapy liver | Treatment-related bilirubin >3 or AST/ALT >5 hold; >10 or >20 stop; attribution required | No invented blanket numerical treatment-related chemotherapy rule |
| Neurotoxicity | Grade 2 hold, then pemetrexed 100% / cisplatin 50%; ≥3 or recurrent: stop active chemotherapy | Source prints grade ≤2 at next cycle; interpret symptomatic **1–2**, not grade 0. Review 25% then persistent 50% reduction; ≥3 omit paclitaxel |
| Mucositis | Grade ≥3 hold; after baseline recovery pemetrexed 50%, cisplatin 100% if active | Grade 2: first no reduction, second 25%, third 50%, fourth omit; grade 3–4 first 50%, second omit; hold until ≤1 |

No final numerical patient-specific dose is calculated. Dose history, source ambiguity, interacting toxicities, and maintenance phase require consultant/pharmacy reconciliation. For 00569 grade ≥3 toxicity after two reductions, Table 4 says consider discontinuation while introductory prose is firmer; retain explicit review rather than an invented universal restart.

## Service authoring

`authoring.json` matches the v0.84.21 authoring contract and contains both full suites: three mechanism cards; eight-region body map; safety, consent, logistics, symptom chapters and questions; four passport groups; date-free induction/maintenance chronology and monitoring; phase-specific support; clinician rationale and evidence cards. The 00569 code, protocol ID, filenames and `/patient/00569/` route remain stable for existing QR links. Both selector records explicitly exclude the breast selector and identify the lung context.

Patient evidence is qualitative with `metrics: []`. Clinician evidence is source-scoped:

- **KEYNOTE-189**, five-year primary publication (Garassino et al., JCO 2023): untreated metastatic non-squamous NSCLC without EGFR/ALK alterations; pembrolizumab vs placebo with pemetrexed and investigator-selected cisplatin/carboplatin. OS HR 0.60 (0.50–0.72), 5-year OS 19.4% vs 11.3%; PFS HR 0.50 (0.42–0.60), 5-year PFS 7.5% vs 0.6%. These are pooled-platinum estimates, not cisplatin-specific.
- **KEYNOTE-407**, five-year primary publication (Novello et al., JCO 2023): untreated metastatic squamous NSCLC; pembrolizumab vs placebo with carboplatin and paclitaxel/nab-paclitaxel. OS HR 0.71 (0.59–0.85), 5-year OS 18.4% vs 9.7%; PFS HR 0.62 (0.52–0.74), 5-year PFS 10.8% vs 3.5%. These are pooled-taxane estimates, not a separately randomised paclitaxel-200 estimate.

The current primary-source search located these mature five-year analyses; it does not claim that they are newly published in 2026. Trial pembrolizumab capped at 35 cycles, while these NCCP protocols continue until progression/unacceptable toxicity: the trial cap is not imposed as a universal NCCP stop.

## Validation and integration

`node validation/lung-core-v08422/pembro-combo/source-cases.cjs`: **354/354 passed**, using the actual assessment engine and dose-schedule renderer. Cases cover exact boundaries, fractional gaps, omitted/false/invalid inputs, source-specific organ rules, immune attribution, infusion culprit, phase scope, dose-history review, unique IDs, qualitative patient evidence, support phases and governance.

After copying the final proposals, run the same command with `--integrated`. No shared live files were edited by this worker. The parent must perform complete suite build, existing regression, PDF page/download/QR checks, browser interaction checks and release packaging. Old tests that assumed immune permanent-stop from an unattributed isolated laboratory value need an explicit `confirmed_immune` input, or should expect the new unresolved-attribution hold instead.
