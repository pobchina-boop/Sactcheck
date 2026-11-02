# Nivolumab monotherapy source audit — v0.84.27

Checked 29 October 2026. Complete proposed 00483/00484 records, lung-focused suite authoring, shared nivolumab consent profile and executable source cases are supplied. No clinical authorisation is implied: consultant, oncology pharmacy and clinical-use flags remain false.

## Provenance and source editions

Fresh official HSE PDF bytes were downloaded with curl, extracted with pdftotext, hashed separately and visually inspected at pages 3, 7 and 8 in both documents. Current NCCP versions remain **13a**, 12 pages, reviewed through 6 November 2027. Version history: v13 (11 February 2026) introduced SC dosing; v13a (23 March 2026) amended table titles. The repository already claimed v13a but omitted clinically important source content. These are fresh source hashes, not retained previous-release hashes. `sources.json` records hashes and page mapping; original bytes, text and inspection images are in `research/`.

Current EMA Opdivo product information (downloaded separately; EPAR update 19 August 2026) was checked for monotherapy, route, organ impairment, infusion reactions, SJS/TEN and myotoxicity. Its pages 12–13 were visually inspected: monotherapy Grade 3 colitis must not inherit the combination permanent-stop rule. The current SmPC additionally describes myocarditis–myositis–myasthenia overlap; Grade 2 holds and Grade 3/4 stops, using the worst involved event grade.

Fresh official web searches confirmed the HSE lung/GU/head-neck listings, EMA product page, NCCP NCIS medical oncology antiemetics v8 (10 February 2025) and the primary five-year CheckMate 017/057 report. NCIS defaults do not create a routine cytotoxic antiemetic prescription for minimal-risk monotherapy.

## Indications and legacy preservation

Each source has **eight exact indications**, with original source codes retained independently of saved UI values. 00483 letters: a advanced melanoma, b RCC, c cHL, d HNSCC, e NSCLC, f adjuvant melanoma, g adjuvant GEJ, h adjuvant MIUC. 00484 letters: a advanced melanoma, b RCC, c adjuvant melanoma, d cHL, e HNSCC, f NSCLC, g GEJ, h MIUC.

Legacy `00483a`/`00484a` previously meant GEJ although source a means melanoma. No automatic reassignment occurs. New UI IDs use `00483-source-a` etc.; every old value remains a selectable **unresolved legacy review** context. The broad GU aliases are not counted as source indications or asserted to mean approved advanced urothelial use. Metadata preserves original descriptions. Cards and lung selector reference only unambiguous IDs. All legacy input field names are retained.

ECOG 0–2 applies only to advanced melanoma/RCC; all other source settings require 0–1. Disease-specific eligibility is explicit and must be confirmed; an unassessed confirmation triggers review rather than eligibility clearance. Non-lung source contexts remain represented. The new patient/clinical outcome suite is explicitly post-platinum NSCLC only.

## Dose, duration and monitoring

- 00483: 240 mg IV over 30 minutes **or** 600 mg SC over 3–5 minutes every 14 days.
- 00484: 480 mg IV over 60 minutes **or** 1200 mg SC over 3–5 minutes every 28 days. Adjuvant GEJ IV may use 30 minutes.
- cHL is **IV only**. SC is a distinct formulation; not interchangeable mg-for-mg. Rotate thigh/abdomen sites; do not split the dose.
- Advanced disease continues until progression/unacceptable toxicity; no imported two-year cap. Adjuvant melanoma/MIUC maximum 12 months. GEJ first 16 weeks q14 or q28, then q28 from week 17, maximum total 12 months.
- q28→q14 first dose four weeks after last q28 dose; q14→q28 first dose two weeks after last q14 dose.
- FBC, renal/liver profile and glucose before every cycle. Thyroid **once a month**, cortisol when indicated. NSCLC progression assessment before cycle **8** q14 or **4** q28. Immune monitoring continues at least **five months after the final dose**.

## Action thresholds and limitations

NCCP expressly uses **CTCAE v4.0**. Grade selectors display source action bands and require a clinician-confirmed diagnosis/full grade; these descriptions are not purported complete CTCAE definitions.

| Immune event | Withhold | Permanently stop |
|---|---|---|
| Pneumonitis | Grade 2 | Grade 3/4 |
| Diarrhoea/colitis monotherapy | Grade 2/3 | Grade 4 |
| Hepatitis | Grade 2 | Grade 3/4 |
| Nephritis/creatinine toxicity | Grade 2/3 | Grade 4 |
| Rash | Grade 3 | Grade 4 or confirmed SJS/TEN |
| Myocarditis | Grade 2 | Grade 3/4 |
| Symptomatic thyroid/hypophysitis | Grade 2/3 | Grade 4 |
| Adrenal insufficiency | Grade 2 | Grade 3/4 |
| Diabetes | Grade 3 | Grade 4 |
| Other immune events | First Grade 3 | Grade 4, recurrent Grade 3, persistent Grade 2/3 despite modification or inability to taper immune-event steroids to 10 mg/day |

No nivolumab escalation/reduction is recommended. Recovery is event-specific (including radiographic improvement for pneumonitis, return to baseline for hepatitis/nephritis and required corticosteroid management). Steroid taper at least one month on improvement; no resume while immunosuppressive treatment continues. An isolated current steroid dose >10 mg/day is a caution/restart hold, **not** automatically equivalent to failed taper and permanent stop. No unsupported generic 12-week restart limit was imported.

Controlled asymptomatic hormone replacement can permit continuation after review; it never cancels an independently entered serious grade/other-organ action. Severe/life-threatening infusion reactions stop permanently; lesser reactions require treatment/monitoring and local premedication decisions. Suspected SJS/TEN/myocarditis prompts interruption and urgent work-up; permanent-stop diagnosis is kept separate.

Legacy numeric liver/renal labs are retained for review, without claiming immune attribution. Creatinine `baseline_or_uln` is intrinsically ambiguous: the number alone cannot establish an immune grade or permanent-stop action. Confirmed source-grade inputs drive the organ-specific pathways. Endocrine lab values use local range, timing, symptoms and steroid context; unsupported universal numeric cortisol/thyroid cutoffs were removed. Independent adverse entries remain visible even when values conflict.

NCCP Table 4 states no renal adjustment, none expected in dialysis, no mild/moderate hepatic adjustment and none expected in severe hepatic impairment. EMA states severe renal/hepatic data are limited (and severe hepatic caution). Proposals retain that difference as consultant/pharmacy review and do not calculate an invented reduction.

## Evidence and authoring

CheckMate 017/057 pooled 854 previously platinum-treated squamous/non-squamous NSCLC patients, ECOG ≤1: nivolumab 3 mg/kg IV q2 weeks versus docetaxel 75 mg/m² q3 weeks. Five-year OS 13.4% vs 2.6%, HR 0.68 (95% CI 0.59–0.78); PFS 8.0% vs 0%. Minimum follow-up 64.2/64.5 months; database locks 8/16 May 2019. Fixed-dose and SC schedules are not separate randomised efficacy comparisons; 23 patients switched to q4 weeks after protocol amendment. No extrapolation to non-lung indications, first-line/perioperative/SCLC settings or individual prognosis. Patient metrics remain empty; numbers are clinician-only with limitations.

Authoring includes knowledge, rationale, consent support, urgent actions, practical support, anatomy, passport prompts, reference chronology, full treatment journey and minimal-risk supportive-care mapping. Shared consent proposal retains the existing immune module, adds medicine-specific serious/late/reproductive and administration warnings, and supplies no invented frequency percentages.

## Verification and integration

`node validation/lung-nivolumab-v08427/nivo-mono/source-cases.cjs` passes **443/443** checks: strict protocol validator with no warnings, all immune-grade boundaries, all eight eligibility/ECOG contexts, missing/false/true contexts, saved alias collisions, dose formulations, source day intervals, course duration, raw-lab attribution controls, combined hold/stop handling through the real dose renderer, full authored source graph and scalar/day coverage.

Proposed counts: **00483 98 rules / 65 optional inputs; 00484 97 rules / 65 optional inputs**. `--integrated` switches to canonical protocol paths; root must run after integration. Default and integrated modes accept null/empty-string demonstration blanks. No canonical/shared files were changed here. Root still owns shared UI integration, PDF generation/inspection, whole-suite regression and release packaging. Software verification is not independent clinical validation.

### Resumed integration check

The generator had reread the already integrated canonical proposal and overwritten its local baseline, duplicating current source IDs as legacy choices. Restored the original 00483/00484 records from frozen GitHub commit a3f8a2744c5753413f230004118056ce8b20baf9; the generator now reads that retained baseline without replacing it. All original saved aliases remain unresolved, while current source-qualified IDs remain unique. Rebuilt proposals pass441/441 checks. Added the full phase-renderer shape and explicit monotherapy headings, and supplied consent-profile-updates.json in the integration contract format.

Source-qualified indications now include canonical tissue group names for catalogue filtering. Added explicit tissue-group checks for HNSCC and lung; current proposed result443/443.
