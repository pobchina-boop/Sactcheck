# v0.84.35 retrospective clinical-source audit

Five previously completed colorectal treatment suites were re-audited against freshly downloaded official NCCP PDFs on 5 November 2026: 00732, 00585, 00733, 00447 and 00448. This is a source/implementation audit, not independent clinical authorisation. No source version changed in this group. Exact URLs, retrieval status, publication/review dates, page counts and SHA-256 hashes are in `sources.json`; the PDFs and extracted page text are retained alongside it. Source table images from 00733 page 4 and 00447 page 4 were inspected to confirm their different renal policies.

## Material findings and corrections

| Area | Finding and implemented response |
|---|---|
| Antibody skin-toxicity restart, all five | Source recurrence rows could produce a dose without checking the previous dose. Numeric restart now requires documented dose history, recovery and a source-compatible interruption. A lower previous dose does not silently escalate to the source row. Missing history gives review without a replacement dose. |
| Maximum skin interruption | Unrecovered cetuximab toxicity at two weeks and panitumumab toxicity after two withheld doses now reach the source stop pathway. Recurrence four still stops the antibody. |
| Intolerable panitumumab skin toxicity | Current EMA product information section 4.4 includes intolerable toxicity. Both panitumumab combinations now have a hold/review pathway even when the entered grade is below 3. |
| 00585 current diarrhoea | Grade 2 or worse previously held irinotecan without consistently holding the rest of FOLFIRI. The combination now stays withheld within the source recovery window; grade 1 still prevents irinotecan until diarrhoea resolves completely. |
| Recovery context | Missing or late diarrhoea/recovery timing now leads to review in the affected pathways. The four-week FOLFOX and two-week FOLFIRI windows remain separate. |
| 00733 respiratory symptoms | The investigation hold now includes oxaliplatin as well as cetuximab. The source specifically requires stopping oxaliplatin until interstitial lung disease/fibrosis is excluded. |
| Distinct oxaliplatin renal policies | 00733 permits specialist consideration of 50% of original dose below CrCl 30 or on dialysis, with dialysis timing instructions. 00447 explicitly contraindicates below CrCl 30 and provides no dialysis exemption. The latter could previously bypass its contraindication when dialysis was entered; that bypass is removed. No shared renal percentage was introduced. |
| Fluoropyrimidine safety | All four chemotherapy combinations now surface the renal/uracil DPD-phenotyping caveat, contraindicate concurrent brivudin/sorivudin-type DPD inhibitors, and request medication review for warfarin, phenytoin or other DPD-affecting drugs. No washout interval or dose percentage is inferred. |
| Irinotecan safety | Both FOLFIRI protocols now request review for Gilbert syndrome and CYP3A-related interactions. The source gives no universal reduction for Gilbert syndrome. Same-day prochlorperazine avoidance and grapefruit advice are included in the review explanation. |
| Folinic acid | When bolus 5-FU is held, omitted or stopped in the audited source pathways, folinic acid follows the source footnote. |
| Cetuximab baseline context | Added explicit marrow/organ eligibility confirmations and alpha-gal/red-meat/tick risk review without inventing numerical organ cutoffs. |
| Grading attribution | Removed unsupported claims that every NCCP toxicity table uses CTCAE v5. Source-specific legacy diarrhoea rows remain intact. CTCAE v5 orientation is identified separately; panitumumab skin grading retains its explicit current EMA attribution. |

## Preserved uncertainty and manual review

- The 5-FU liver table uses strict values around bilirubin 85 micromol/L and AST 180 U/L. Equality remains an explicit source gap requiring review. Ambiguous moderate/severe hepatic reduction language does not become an automatic calculated dose.
- The FOLFIRI neutrophil instructions contain a two-week versus four-week timing discrepancy. That discrepancy remains visible; it is not silently harmonised with the platelet or non-haematological pathway.
- General organ-function eligibility wording can conflict with later component dose advice, particularly 00447/00448. Eligibility remains a consultant decision.
- NCCP cetuximab administration text permits observation/vital-sign relaxation after two tolerated doses, whereas current EMA Erbitux information specifies close observation during each infusion and for at least one hour afterwards. The content owner was given this discrepancy; no automatic observation removal is encoded.
- Reproductive advice, infusion supervision, supportive medicines, monitoring frequency and local service contacts are manual care-plan domains. The criterion matrix distinguishes them from automated decisions. Current medication databases and clinician/pharmacy judgement remain necessary.

## Executed checks

| Check | Result |
|---|---:|
| Same new actual-engine cases against retained pre-audit protocols | 754 passed, 235 failed / 989 |
| New actual-engine cases after correction | 989 passed, 0 failed / 989 |
| Retained panitumumab clinical cases | 186 passed |
| Retained cetuximab clinical cases | 534 passed |
| Retained v0.84.21 source/schedule cases | 127 passed |
| Protocol publishing/definition validation | 382 passed |

The 989 cases include recurrence/dose/history permutations and blank/null input checks; this is not a count of distinct clinical defects. Valid-input cases now also assert that the engine reports no invalid inputs. Current results retain triggered rule IDs, component actions and dose text. The same test set is run against `protocol-before` for the before/after comparison. Clinical legacy fixtures now supply the newly required prior-dose context. Their expected source actions were preserved except the one 00447 dialysis expectation, which now asserts the actual NCCP severe-renal contraindication and still rejects a copied 50% dose.

`criterion-matrix.json` records every current rule, its source page, input condition, component action and any new-case trigger evidence, plus manual source-to-content domains. `audit-summary.json` records current and baseline protocol hashes. `build-report.py` can refresh those hashes after release-only metadata changes. `reconcile.py` is the retained initial one-time transformation and must not be rerun against the integrated release: subsequent scoped clinical corrections are already present in the final protocols.

Patient/knowledge/support findings were handed to the retrospective asset owner. Full-suite HTML/PDF/browser/QR evidence is recorded by the release integration task. Independent oncology/pharmacy and patient/PPI review remains outstanding; deployment and real-device checks are outside this folder's claims.
