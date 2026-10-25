# NCCP 00545 adjuvant zoledronic acid — source audit

Checked 25 October 2026 against NCCP 00545 v3, version dated 1 April 2026, four pages, review due 1 April 2031. The canonical ID `nccp-00545-v3` is retained. Baseline is Git commit `6c1050b8a2ced301fe770fe67fd518b5a78566e5`. The audit and proposals are not independent oncology/pharmacy approval.

The NCCP PDF and the exact EMA Accord product information cited by NCCP were downloaded, read and hashed. URLs, dates and hashes are in `sources.json`; raw PDFs stay outside the release tree. EMA is supplementary safety evidence. Its licensed metastatic/TIH schedule does not replace this adjuvant schedule.

## Findings and implementation choices

| Area | Baseline gap | Proposed behaviour | Source |
| --- | --- | --- | --- |
| Schedule | Free-text dose value duplicated the `mg` unit; interval recorded only as 182 days | Structured 4 mg reference dose, six calendar months, up to five years; legacy day count explicitly approximate; no invented total-dose count | NCCP p1 |
| Indication/governance | No endocrine-depletion/context check or off-label workflow | Review non-adjuvant or unconfirmed depletion; explicit patient discussion, consent and local governance | NCCP pp1,4 |
| Renal dose | CrCl select hid fractions and treated >60 as ≥61 | Numeric Cockcroft–Gault CrCl; preserve 30–39/40–49/50–60 and >60; review 39–40 and 49–50 fractional gaps without rounding | NCCP p2; EMA §4.2 |
| Renal deterioration | Baseline/current creatinine existed as unused monitoring definitions and were absent from the actual form | Two direct values automatically supply difference and ratio; apply ≥44 rise when baseline <124 and ≥88 when baseline >124 | NCCP p2 |
| Baseline 124 | No boundary handling | Exactly 124 is explicitly unresolved; do not silently assign either printed category | NCCP p2 and EMA §4.2 both use strict inequalities |
| Restart | No prior-hold or recovery assessment | Above 110% baseline continues hold. At/below that level, review possible resumption at the prior dose; no automatic new renal starting dose | NCCP p2 |
| Electrolytes | Existing abnormality flags retained | Correct identified deficits and review tests/support. No invented serum-calcium cutoff or automatic albumin correction | NCCP pp1–3 |
| Hepatic | Missing source limitation | Review limited-data hepatic impairment without a numerical adjustment | NCCP p2 |
| Dental | A single ONJ flag obscured different situations | Separate suspected ONJ, unhealed lesions before a new course, planned invasive work and unresolved dental-risk assessment; no universal drug-holiday interval | NCCP p3; EMA §4.4 |
| Support | General support text did not drive assessment | Review dehydration, overload risk, hypercalcaemia exception, incomplete supplements, duplicate bisphosphonate and interactions | NCCP pp1–3; EMA §§4.4–4.5 |
| Symptoms | No related review pathways | Prompt assessment of severe mineral symptoms, new thigh/groin pain, persistent ear symptoms, ocular changes and serious systemic reactions | EMA §§4.4,4.8 |

The source’s “increase of” creatinine thresholds are interpreted monotonically as reaching **at least** the stated increase. Recovery after a rise is interpreted as current creatinine no more than 10% above baseline; return below baseline does not itself trigger a renal hold. Both interpretations are declared in rule provenance. Resumption remains a consultant decision and must use the verified pre-interruption dose. A generic clinical renal-deterioration flag can trigger withholding even when numerical criteria do not capture the concern.

Dental withholding for suspected ONJ and dehydration withholding are explicit clinical safety interpretations of the source warnings, rather than claims that NCCP provides a detailed graded algorithm. Other warnings generally route to review. No source-specific grade scale, empirical chemotherapy reduction ladder or routine echo schedule is invented.

## Automatic trend patch proposal

`assessment-engine.patch` is deliberately isolated. It adds opt-in `derived_value` metadata for a difference or ratio of two direct numeric fields. It cannot execute a formula string, chain derived fields, infer absent values as zero or accept an entered result in preference to calculation. Operand definitions and ranges are checked; a ratio requires a positive denominator. Normalising to 15 significant figures removes binary representation noise at boundaries such as 94.1 − 50.1 = 44; it does not round CrCl into a source dose band.

The proposal uses the already-supported `ui_derived_from` marker on the two derived fields. The generic form’s existing filter omits these controls; the clinician enters baseline and current creatinine only. The derived results remain available to the assessment, findings and copied documentation. Both direct values have `always_show` and are decision inputs. The patch also includes arithmetic operands as dependencies for opt-in definitions even when no separate rule names them.

No shared file is changed by this audit. `assessment-engine.proposed.js` is a snapshot used by the proposed-mode tests. Root must review and apply the patch to the production engine, then run integrated tests and the full suite.

## Verification

- Clinical/source cases: baseline **22/105** pass; proposed **105/105** pass. The 83 baseline failures include absent pathways and data/display expectations, not 83 distinct clinical errors.
- Arithmetic guards: **13/13** pass in proposed mode, covering operand discovery, decimal thresholds, negative changes, missing/invalid/out-of-range inputs, zero denominator, supplied-result overrides, unsupported operations, derived chains and preservation of non-opted-in fields.
- Blank assessment stays incomplete. A normal CrCl or recovered trend does not imply complete clearance. Unresolved review pathways do not produce a definitive numeric prescription.
- Independent approval flags stay false.

Run after integration:

```bash
node validation/breast-final-v08419/bone/source-cases.cjs integrated
node validation/breast-final-v08419/bone/derived-values.test.cjs integrated
```

## Evidence and patient content

`evidence.json` separates the EBCTCG class-level postmenopausal meta-analysis from ABCSG-12. The latter used three years of six-monthly treatment with ovarian suppression; final-analysis DFS/OS did not meet its predefined significance level. Do not present it as proof that this exact five-year schedule improves overall survival. Breast-cancer mortality and overall survival remain different endpoints, and pooled relative effects are not personalised predictions.

`service-facts.json` supplies source-linked schedule, support, blood-test timing, dental precautions, agent-specific body-map content and consent topics. It intentionally omits numerical efficacy from patient tools. Do not inherit a chemotherapy nadir graph, routine taxane steroids or generic hair-loss emphasis for this bone-modifying agent. Use calendar months in patient-facing timing and preserve the exception to routine supplementation when hypercalcaemia is present.
