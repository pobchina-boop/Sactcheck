# Gemcitabine breast source audit — v0.84.18

Reviewed 25 October 2026 against downloaded official PDFs. `sources.json` records current version, page count, URL and SHA256; research PDFs/text remain outside the distributable repository. Proposed JSONs are drafts for parent review, not production edits or clinical approval. `source-cases.cjs` provides 125 source-derived checks including the schedules.

## Highest-priority corrections

1. **00430 had the wrong treatment structure:** its nested indications and input options were copied from ovarian regimen00306, and its administration array specified carboplatin AUC4 only on Day1. Official00430 v6 p1 requires carboplatin AUC2 first, followed by gemcitabine1000mg/m², on BOTH Days1 and8 every21days. No ovarian indication should survive in cards, dose output or consent. Parent must rebuild schedule sidecars/index and check rendered dose tables; protocol replacement alone may not override cached metadata.
2. **00430 Day8 contradiction:** recommendation said80%, but rule ID/explanation said75%. Source p4 is80% of the actual Day1 dose of BOTH drugs. This is different from the original-dose basis in the Day1 recurrence table.
3. **00749 initial/day1/within-cycle distinction:** source p1 baseline ANC>1.5; p3 new-cycle ANC>1 and platelets>100; within-cycle cutoffs differ again. Exact boundaries are intentional. Missing phase must prompt review, not silently assume a day.
4. **Historical and acute febrile neutropenia:**00749 previously routed the undifferentiated FN field into a future-dose reduction. Proposed schema retains `febrile_neutropenia` for current urgent withholding and adds `previous_febrile_neutropenia` for historical future-cycle review.00430 has separate `current_febrile_neutropenia` and prior `haematologic_event`.
5. **00749 printed toxicity gap:** p4 was visually inspected: it literally says Grade>3 and Grade>4, not≥. Proposed grade3 prompts source clarification; grade4 is withheld with the source's discretionary50%-reduction-or-discontinuation choice after recovery. It does not silently make grade4 a mandatory discontinuation or make grade3 a fixed50% reduction.

## 00430 — source map

| Domain | Current source | Operational requirement |
|---|---|---|
| Indication/selection | pp1–2 | Locally recurrent metastatic TNBC, ECOG0–1; not a universal breast or ovarian doublet. Pregnancy, breastfeeding and relevant hypersensitivity excluded. Exceptional mild-carboplatin rechallenge needs controlled desensitisation/immunology oversight. |
| Schedule | p1 | Carboplatin AUC2 first, then gemcitabine1000mg/m²; each30min infusion on Days1 and8, q21days until progression/unacceptable toxicity. |
| Calvert | pp1–2 | AUC×(GFR+25), GFR capped125mL/min; measured GFR preferred. CG/Wright estimates need verified method. Obesity/low creatinine/muscle loss can invalidate estimates; do not automatically substitute weight/creatinine. |
| Tests | p3 | Baseline FBC/renal/liver, isotope-GFR preferred, audiology if indicated. Day1 FBC/renal/liver; Day8 FBC. Response review follows individual plan. |
| Day1 counts | p3 Table1 | Delay if ANC<1 or platelets<100. After qualifying event recovery toANC≥1/platelets≥100: episode1 both80% ORIGINAL dose; episode2 both60% ORIGINAL. Qualifying history: cytopenic day1 delay, FN, platelets<25, bleeding with thrombocytopenia. Later episodes unspecified. |
| Day8 counts | p4 Table2 | ANC≥1 AND platelets≥100: no table reduction. ANC0.75–0.99 OR platelets75–99: both80% Day1 dose. ANC<0.75 OR platelets<75: omit BOTH; never reinstate within same cycle. |
| Gemcitabine renal/hepatic | p4 Table3 | No renal adjustment needed≥30; none expected<30. HD6–12h after gemcitabine. Bilirubin≥27:80% original dose with escalation OR full dose with active monitoring. No automatically preferred option. |
| Carboplatin renal | p4 | <60mL/min increases marrow risk. >20–≤30 extreme caution; ≤20 do not administer. Estimated-GFR dosing needs creatinine within48h; isotope-derived dose reuse depends on creatinine≤110% baseline. |
| Non-haematological | p5 Table4 | Exclude nausea/vomiting. Grade≥3 first: withhold to≤1, then consultant may reduce gemcitabine OR carboplatin20% from initial. Second: another20% reduction allowed; arithmetic/selected component must be explicit. Third: discontinue treatment. |
| Lung/skin | pp5–6 | Grade≥2 pneumonitis: discontinue gemcitabine. Suspected drug-induced pneumonitis also requires discontinuation/investigation in complications text. SCAR: discontinue gemcitabine. |
| Support/consent | pp5,8 | Carboplatin moderate, gemcitabine low emetic risk; no routine regimen-specific premedication. AUC2 must not inherit AUC≥4 carboplatin escalation automatically. Off-label indication and local consent/governance explicitly required by p8 footnote. |

Deliberate unresolved boundaries: exactGFR20 is covered by the explicit prohibition despite overlapping caution wording; ANC0.995 and platelets99.5 are unassigned by printed Day8 ranges and must not be rounded. A third haematological episode has no source percentage. The second non-haematological20% reduction has ambiguous arithmetic; no compounded absolute dose is calculated.

## 00749 — source map

| Domain | Current source | Operational requirement |
|---|---|---|
| Indication/schedule | p1 | Advanced breast cancer after≥2 treatment lines. Gemcitabine800mg/m² Days1,8,15 q28; planned6–8cycles unless progression/toxicity. No carboplatin, no CMF DPD requirement. |
| Initial eligibility | p1 | ECOG0–2; ANC>1.5, platelets>100; creatinine≤1.5×ULN, transaminases≤3×ULN. These are initial criteria, separate from continuing-dose tables. |
| Exclusions/tests | p2 | Allergy, pregnancy, breastfeeding excluded. Baseline FBC/renal/liver. FBC before EACH treatment; renal/liver before each CYCLE. No routine regimen-specific echo programme. |
| Day1 | p3 | ANC>1 and platelets>100 before a new cycle. Exact1 and100 do not pass. |
| Day8/15 | p3 Table1 | ANC>1 AND platelets>100: no table reduction. ANC0.5–1 OR platelets50–100:75%. ANC<0.5 OR platelets<50: omit; restart only onceANC>0.5 AND platelets>50. At exact lower boundaries, a restart after an omission needs separate strict checks. |
| Subsequent cycles | p3 Table1 |75% ORIGINAL cycle-initiation dose after ANC<0.5 for>5days, ANC<0.1 for>3days, any previousFN, platelets<25 or cycle delay>1week due to any toxicity. Do not multiply automatically with within-cycle reduction. |
| Renal/liver | p3 Table2 | Same gemcitabine-only Giraud rows as00430: no mandatory renal reduction even<30, HD6–12h; bilirubin≥27 has80%-or-full-dose choices. No carboplatin prohibition is inherited. |
| Toxicity | p4 Table3 | Printed>3 and>4 symbols retained in audit; grade3 gap needs review; grade4 withhold to≤1 then discretionary50% reduction or stop. SCAR stop. Nausea/vomiting excluded from the first row. |
| Support | p4 | Low emetogenic risk, no routine specific premedication; distinguish scheduled prevention on each treatment day from rescue medicines. |

## Proposed fields and integration

00430 preserves `anc`, `platelets`, `treatment_day`, `gfr_ml_min`, `bilirubin_micromol_l`. The source-specific `haematologic_event` options replace unrelated ovarian-style nadir events. `prior_haematologic_episode` accepts1,2,`3plus`; `nonhaem_episode` same. The latter are occurrence counts, never CTCAE severity grades. `toxicity_excludes_nausea_vomiting` must be explicitly true before a source nonhaem percentage is discussed. Renal context: `renal_measure_type` measured/cg/wright/indexed_egfr/unknown, `creatinine_sample_age_hours`, `creatinine_percent_of_isotope_baseline`, `renal_estimate_unreliable`.

00749 retains existing phase options and laboratory keys. New `restarting_after_omission` preserves strict recovery conditions. `previous_febrile_neutropenia` is historical; old `febrile_neutropenia` is relabelled current. No source clinical approvals are set true. The proposals suppress automatic absolute-dose calculation when source alternatives, component choices or current-dose context remain unresolved.

`evidence-audit.json` contains primary-study data with explicit comparator, denominator and applicability.00749's17% response figure is3/18 response-evaluable patients in a22-patient single-arm study, with95%CI4–41%; no proven survival benefit is asserted.00430's NCCP-cited phaseIII trial evaluates the addition of iniparib to GC: the HRs do not estimate the benefit of GC itself. Keep numerical efficacy data in clinician knowledge, not patient prognosis panels.

## Verification boundaries

The125 tests cover source decisions, gaps, phase confusion, current/history separation, schedules and indication contamination. Baseline failures include newly tested domains, chosen safety handling and output wording; they are not a count of distinct clinical errors. Parent must run integrated tests, broad regression, actual rendered dose schedules, patient days, consent and support PDFs after applying the proposals. Independent oncology/pharmacy approval remains pending.
