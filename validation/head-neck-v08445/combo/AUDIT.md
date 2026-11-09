# v0.84.45 combination source audit

This is a software/source reconciliation proposal for NCCP 00705 v2d and 00706 v3. Independent Consultant and oncology-pharmacy approval remain outstanding. No Git commit, push, PR or deployment was performed by this audit worker.

## Sources

The current official head-and-neck catalogue was opened on 7 November 2026 and its regimen links followed. Both PDFs were downloaded from those exact URLs with ordinary HTTPS, following official redirects to assets.hse.ie. `sources.json` retains URLs, resolved URLs, byte counts and SHA-256 values. PDFs and layout-preserving extracted text are included. Page 5 of 00706 was visually inspected to verify the merged treatment-action cells, including the liver-metastasis exception. Page 4 of 00705 is also rendered for review.

| Source | Pages | SHA-256 |
|---|---:|---|
| 00705 v2d | 10 | e79b612d5051bf43393796ed9315ae5d362cbfa2c8afe7573f2d73e8314a4efd |
| 00706 v3 | 9 | 3a17b3278bb4847de0aeadec4f18b86ab0009cb41434362057395da14b0cce28 |

Initial urllib requests returned 403. Ordinary requests with a browser User-Agent and `Accept: application/pdf` succeeded; hashes are of the actual downloaded binaries.

## Findings

| Existing issue | Source location | Candidate behavior |
|---|---|---|
| Invented maximum 24 months | Both, p1 | Up to six combination cycles, then pembrolizumab every 21 days until progression or unacceptable toxicity. |
| Missing component schedule | Both, p1 | Four daily 22-hour fluorouracil infusions or two 48-hour infusions retained as alternatives. Pembrolizumab 200 mg over 30 minutes; carboplatin AUC5 over 30 minutes; cisplatin 100 mg/m² over two hours with hydration. |
| Immune and cytotoxic actions affected the entire regimen | Tables 2, 4, 5 | Pembrolizumab findings affect pembrolizumab. Cytotoxic findings affect the named components only during combination treatment. Unknown phase requires review. |
| Generic cisplatin renal bands incorrectly permitted reduction at CrCl 40–49 | 00706 p4, Table 3 | CrCl 50 to below 60: source recommendation is 75% of original dose, reconciled against prior reductions. Below 50 or dialysis: cisplatin not recommended; consider carboplatin. |
| Exact platelet 75 silently cleared; bilirubin 85 and AST 180 unassigned | Both p4, Tables 2–3 | Explicit review for the source overlap and gaps; no invented definitive dose. |
| Baseline severe cytopenia could trigger a treatment-induced reduction | Both p2 and p4 | Baseline or unknown timing requires review before applying the treatment-induced reduction pathway. |
| Immune hepatitis/nephritis lacked biochemical and attribution separation | Both pp5–7 | Bare laboratory elevation prompts attribution review. Explicit non-immune attribution conflicting with an immune grade prompts review. Immune actions remain pembrolizumab-only. |
| Recurrence, recovery and treatment history were incomplete | Both pp5–7 | Recurrent pneumonitis/colitis and prior permanent-stop history survive current recovery. Twelve-week recovery and steroid-taper limits are separate inputs. |
| Endocrine toxicities were conflated | Both Table 4 | Distinguishes adrenal insufficiency, hypophysitis, diabetes, hyperthyroidism and hypothyroidism; preserves the controlled-endocrinopathy exception. |
| FN history and component reduction limits absent | Both Tables 1–2 | First/second episodes require reduction/support review; third stops platinum only. A new required reduction is distinguished from historic reductions. |
| Fluorouracil diarrhoea, hand-foot and creatinine pathways incomplete | Both p6, Table 5 | Grade 2 hand-foot holds without an invented reduction; grade 3–4 reduces after recovery. Cisplatin creatinine toxicity includes switching platinum. |
| Unqualified twelve-week stop could stop the wrong component | Both Tables 2, 5 | Explicitly distinguishes both-cytotoxic haematological/creatinine toxicity from fluorouracil-only toxicity; missing scope requires review. |
| Carboplatin renal safeguards absent | 00705 p5 | Includes creatinine within 48 hours for estimated GFR, reassessment above 110% of isotope-baseline creatinine, ≤20 exclusion, >20–30 extreme caution and <60 myelosuppression warning. |
| Generic CTCAE v5 attributed to every source grade | Both Tables 4–5 | Immune Table 4 explicitly uses v4. Cytotoxic Table 5 is not assigned an invented edition. |
| Sparse eligibility, monitoring and supportive care | Both pp1–3, 6–7 | Adds indication/PD-L1/DPD/exclusions, baseline virology, each-cycle bloods/glucose, TFT every 3–6 weeks, individual disease-monitoring plan and component emetic risk. |

## Deliberate interpretation boundaries

- The printed ANC 0.5–0.99 row is encoded as 0.5 ≤ ANC <1.0 to avoid false clearance between the displayed decimal values. Cisplatin's 50–59 row is encoded as 50 ≤ CrCl <60. These are explicit continuous-interval software interpretations, not source revisions.
- Platelets exactly 75 fall in overlapping source rows. Bilirubin exactly 85 and AST exactly 180 are absent from the strict source inequalities. Review is required.
- Source prose says discontinue after two reductions while Table 1 includes level −2 and stops at −3. The proposal surfaces this discrepancy after two prior reductions. A further required reduction cannot silently produce a third reduced dose.
- All candidate changes use `dose_calculation: specialist_review`. Reference dose levels remain visible, but an incomplete or conflicting history cannot generate an automatic numeric restart. Source numerical advice remains in the explanation. Immediate holds and stops remain actionable.
- Grade-only immune hepatitis/nephritis does not silently establish a permanent-stop decision without the stated laboratory criteria. Withholding and review remain available.
- Restart remains a Consultant decision, with prior stop/recurrence, recovery, time and steroid context checked. No arbitrary scan interval, tumour-marker schedule, mandatory post-course test or 24-month cap was introduced.

## Validation and integration

Run `node validation/head-neck-v08445/combo/source-cases.cjs` for candidates; add `--before` for retained v0.84.44 comparison or `--integrated` to read actual protocol files after integration. Expected clinical cases are handwritten from the sources, not generated from implemented predicates.

Final candidate results: **910 checks passed**, including 310 null/empty-input checks. All 87 candidate rules for 00705 and 86 rules for 00706 are exercised. Cases cover boundaries, histories, component/phase separation, attribution, recovery, invalid inputs, raw AST conversion, phase-scoped dose output, source hashes and governance. The retained baseline has 708 checks: 398 pass and 310 fail. Baseline totals differ because its input definitions are fewer; this is not a count of 310 distinct clinical defects.

`integration-notes.json` lists the handoff. Root must retain its active-phase dose-model scoping and raw-AST adapter, integrate the candidate JSONs, regenerate dependent assets and run `--integrated` plus release validation. Patient-authoring content is owned by the separate patient worker. Browser journeys, patient-PDF visual inspection and full-release regression are not claimed by this clinical audit.
