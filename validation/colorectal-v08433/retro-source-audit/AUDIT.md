# v0.84.33 retrospective clinical source audit

Checked 4 November 2026 against the current official HSE GI catalogue and downloaded binary NCCP PDFs. Scope: 00210 FOLFOX4; 00213 irinotecan monotherapy every 21 days; 00446 bevacizumab/mFOLFOX6; 00449 bevacizumab/FOLFIRI; 00448 panitumumab/FOLFIRI. Source PDFs, extracted text and hashes are preserved here.

This is a source reconciliation and software audit. Consultant, oncology-pharmacy and clinical-use authorization flags remain false. It does not claim independent clinical validation.

## Sources

| Code | Current PDF version | Pages | SHA-256 |
|---|---|---:|---|
| 00210 | 9b | 7 | `7ae70ce10730b04b8cf3900473940163cd2044d479be1a0531ee1febc3ecd149` |
| 00213 | 7 | 5 | `a60784ed0207921b0f5b3bfb5f964084224f3107d76ed438231723a431a2e3b8` |
| 00446 | 7b | 10 | `a8e5aa1a541e6b2164e3177e90a133fe7a0d29478de6579b0ff0d54c217693af` |
| 00449 | 6a | 10 | `26bd65d7930afc118e1089823dc2221abe533cd21c347d6c8697baeca8f3f4ba` |
| 00448 | 5 | 10 | `447e182826e1af7c770b79255a1b37f81f33375e18fac683024ae8fe199d3c89` |

The stable 00448 protocol identifier remains unchanged for routes/backward compatibility; current source identity is v5. The shared coverage register correction is owned by the release integrator.

## Clinical findings and corrections

### RETRO-01 — 00210

Unexplained respiratory symptoms had no actionable oxaliplatin rule. Added oxaliplatin-only hold until interstitial disease/pulmonary fibrosis excluded; no inferred permanent discontinuation.

Source: 00210 p5 table4. Status: implemented.

### RETRO-02 — 00210

Breastfeeding was folded into a generic pregnancy/lactation review, despite explicit source exclusion. Added breastfeeding contraindication; retained original pregnancy rule ID and individualized pregnancy review.

Source: 00210 p2 exclusions. Status: implemented.

### RETRO-03 — 00213

Renal review quoted only the no-reduction/caution table and ignored the contradictory impaired-renal-function exclusion; severe_renal_impairment alone was not linked. Explicit source-conflict review now triggered by renal impairment, severe renal impairment or haemodialysis, without an invented percentage or clearance.

Source: 00213 p1 exclusions; p2 table2. Status: implemented.

### RETRO-04 — 00213

Exactly 1.5 × ULN bilirubin was assigned unilaterally to the lower printed band. Added boundary review: printed ≤1.5 and 1.5–3 overlap. Starting-dose table restricted to initial treatment; existing later-treatment review retained.

Source: 00213 p2 table2. Status: implemented.

### RETRO-05 — 00213

Highest diarrhoea grade input did not feed the source non-haematological grade ≥3 dose-reduction review. Prior grade3/4 diarrhoea now activates the 15–20% consultant choice after recovery; no midpoint or fixed dose is calculated.

Source: 00213 p3 table3. Status: implemented.

### RETRO-06 — 00446, 00449

Dose-level reductions were interpreted from standard level 0, ignoring actual prior component dose; 00449 had no current-level inputs. Mapped every level change to current component level; added 00449 dose-history inputs. Missing history produces current-level-required output; cumulative level −3 produces discontinue.

Source: 00446 p3 table1; p4 table2; p6 tables5–6; 00449 p3 table1; p4 table2; p6 table6. Status: implemented.

### RETRO-07 — 00446, 00449

Nadir/toxicity rules could select a restart dose with unknown delay duration; 00449 GI highest grades triggered without current recovery and haematological reduction checked only one count. Restart dose selection requires both counts where relevant, recovery grade and source-specific four-week (00446) or two-week (00449) window. Added missing-context and late-recovery review.

Source: 00446 p4 table2; p6 table6; 00449 p4 table2; p6 table6. Status: implemented.

### RETRO-08 — 00446, 00449

Source initial fluorouracil hepatic percentages could reset subsequent treatment to a fraction of the original dose, regardless of prior reductions. Restricted numeric initial hepatic fractions to baseline assessment. Subsequent or unknown phase requires consultant review of actual prior dose and current toxicity.

Source: 00446 p4 table3; 00449 p4 table3. Status: implemented.

### RETRO-09 — 00446, 00449

Only uncontrolled/symptomatic hypertension hold existed; grade4 or persisting grade3 permanent stop was absent. Added explicit clinically assessed grade4/persisting-grade3 bevacizumab discontinuation, tested with concurrent ordinary hypertension hold.

Source: 00446 p5 table5; 00449 p5 table5. Status: implemented.

### RETRO-10 — 00446, 00449

Arterial-event rule did not cover all source grade4 thromboembolic events, including life-threatening venous events. Added separate grade4 thromboembolism bevacizumab stop, without applying it to all lower-grade venous events.

Source: 00446 p5 table5; p7 venous-thromboembolism narrative; 00449 p5 table5; p7 venous-thromboembolism narrative. Status: implemented.

### RETRO-11 — 00448

Recovered counts after two weeks had no explicit source-window review. Febrile-neutropenia dose reduction could still print a numeric dose after late recovery. Added late-count-recovery review; applied two-week recovery gate and missing-recovery review to the febrile-neutropenia restart branch.

Source: 00448 p4 table2. Status: implemented.

### RETRO-12 — 00448

Unknown or late GI recovery suppressed numeric restart rules but did not explicitly explain the missing/late recovery decision. Added explicit diarrhoea and stomatitis recovery-context reviews. Retained the separate requirement for full resolution of irinotecan-related diarrhoea.

Source: 00448 p5 table4; p3 dose-modification recovery narrative. Status: implemented.

### RETRO-13 — 00448

Coverage register still recorded source 4b while current protocol metadata and retrieved source are version5. Current PDF v5/hash confirmed; stable protocol/canonical identifiers intentionally retained. Shared coverage correction handed to root owner.

Source: 00448 PDF header/footer pp1–10; current HSE GI catalogue. Status: handoff_shared_register.

## Preserved regimen-specific boundaries

- FOLFOX4 renal boundary exactly CrCl30 and fluorouracil bilirubin85 µmol/L/AST180 U/L gaps remain explicit review; absolute values are not silently treated as ULN multiples.
- Irinotecan monotherapy severe combined nadir criterion uses ANC<0.5 AND platelets<25; isolated low counts still independently withhold treatment. Reduction range is 15–20%, not an automatic 17.5% or borrowed FOLFIRI dose level.
- 00449 and 00448 ANC table permits restart within two weeks but says stop if still low after four weeks; source interval conflict is preserved, not rewritten to an invented universal two-week or four-week restart window.
- Bevacizumab 24h urine protein ≤2 allows treatment on that criterion; >2 through4 holds; >4 stops. Dipstick2+/3+ requests 24h collection before next dose, whereas4+ holds. No bevacizumab dose reduction is invented.
- 00448 baseline counts ANC ≥2/platelets ≥100 differ from subsequent-cycle ANC ≥1.5/platelets ≥75. Rash occurrence recovery remains100%/80%/60% original dose after one/two held doses; fourth occurrence or failed recovery stops.
- 5-FU folinic-acid linkage and different infusion schedules remain: FOLFOX4 has two 22 h infusions; modified FOLFOX6/FOLFIRI use a 46 h infusion.
- DPD complete deficiency excludes fluoropyrimidine treatment; partial deficiency needs individualized starting dose/titration. UGT1A1*28 homozygosity prompts irinotecan review where stated, without invented numeric reductions.

## Patient monitoring handoff

Patient data and generated assets are maintained by the separate patient-content owner; these source requirements were sent before regeneration.

- **00210** (p2–3 baseline/regular tests; p1 administration): FBC/renal/liver before each cycle; neuropathy evaluation every two cycles; baseline ECG only if compromised cardiac function; DPD before fluorouracil; avoid ice chips.
- **00213** (p2 regular tests; p3–4 adverse effects): Weekly FBC including between q21-day infusions; renal/liver before each cycle; early cholinergic symptoms distinct from delayed diarrhoea; no home chemotherapy pump.
- **00446** (p2–3 tests; p1 administration): FBC/renal/liver before each cycle; BP before each cycle and post-treatment; regular urine-protein checks; neuropathy every two cycles; warfarin INR weekly until stable, then each cycle; baseline ECG if compromised cardiac function; DPD before fluorouracil.
- **00449** (p2–3 tests): FBC/renal/liver before each cycle; BP before each cycle and post-treatment; regular urine-protein checks; warfarin INR weekly until stable, then each cycle; baseline ECG if compromised cardiac function; DPD before fluorouracil. No oxaliplatin neuropathy cadence imported.
- **00448** (p2–3 tests): FBC/renal/liver before each cycle; electrolyte checks including Mg/Ca; monthly electrolytes for two months after treatment; INR if taking warfarin as clinically indicated (not the bevacizumab weekly rule); baseline ECG if compromised cardiac function; DPD before fluorouracil.

Disease imaging and tumour-marker timing remain consultant/treatment-plan decisions where these PDFs give no fixed mandatory cadence; no uniform schedule was invented.

## Validation

Run from repository root:

```sh
node validation/colorectal-v08433/retro-source-audit/source-cases.cjs
```

Current implementation: **162/162 pass**. The same assertions against preserved pre-audit JSON show **75 failures** (70 clinical assertions plus five metadata-freshness checks); see `source-case-before-results.json`. These are case failures, not a count of independent clinical defects. The default command exits nonzero on any failure.

Cases cover source boundary values, isolated abnormal inputs, unknown recovery/delay/current doses, first versus later doses, recurrence from already reduced component levels, toxicity-specific component effects, bevacizumab stop-versus-hold precedence, proteinuria, panitumumab rash and baseline counts. Existing retained controls are tested alongside the corrections.

`protocol-before/` contains the five exact pre-edit files. `apply-corrections.py` reproduces the owned protocol corrections from these snapshots; it deliberately marks software validation incomplete until tests have run. No shared implementation files or patient JSON were edited by this audit. The release integrator runs wider regressions and updates legacy fixtures that incorrectly assumed missing recovery or a starting dose of level 0.

## Remaining limitations

- The source renal and bilirubin boundary conflicts above require an individual consultant/pharmacy decision.
- Unknown inputs remain unassessed; a criterion-specific proceed result is not complete treatment clearance.
- Initial hepatic fractions do not authorize subsequent dose re-escalation.
- Source page/table references identify the NCCP basis; explanatory conflict/recovery guards are explicitly conservative software handling, not invented NCCP dose recommendations.
