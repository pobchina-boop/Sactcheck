# Vismodegib 00236 source audit — v0.84.40

Baseline: `bffd2cda167d7943ce6431ff32d5a1525509f618` (v0.84.39). Checked 6 November 2026.

The staged protocol passes **293/293 checks** with positive executed witnesses for **45/45 rules**. The previous protocol passes 166/248 of the same clinical/source expectations and fails 82; these are failed expectations, not 82 distinct defects. Independent clinical and pharmacy approval remains false.

Protocol: 10 → 42 optional inputs; 7 → 45 rules.
Before SHA-256: `cace6b4f2d5d7d9c486ff81b4e0b8f48b52e6aa4a15c821226e4ab08b4680f50`
After SHA-256: `2365e462d7959014766b2189336ed9f05de47cc9c00863de56eb48e04fe606af`

## Current sources

- [nccp00236v3](https://healthservice.hse.ie/documents/6725/236_v3_Vismodegib.pdf): 4 pages; SHA-256 `3612dd57e919d4b5b117ef70ed9cd1ac3d56e9a199f9eba071f5c8bbaa1dd0c5`.
- [ema-erivedge](https://www.ema.europa.eu/en/documents/product-information/erivedge-epar-product-information_en.pdf): 36 pages; SHA-256 `7c5947771fc6ba6c7e20988015625540b8e7a6e41e1e343dfb62d42b9baa912f`.

Raw PDFs and extracted text are retained. Initial 403 attempts were resolved using an ordinary browser User-Agent with standard TLS and redirects. Source table/page images were inspected.

## Findings

### V40-VIS-01 — Indication and age scope

Before: The original metastatic indication omitted the adult and symptomatic qualifiers and the card exposed only one context.

Now: Both NCCP indications are explicit; age below 18 and ECOG 3-4 trigger review/withholding appropriate to their source. Invalid ECOG values do not trigger a valid clinical decision.

Source: NCCP p1; EMA p3.

### V40-VIS-02 — Unsupported generic grade rules

Before: The old generic Grade 3 non-haematological and hypersensitivity-grade paths imposed a hold/permanent stop not specified by this regimen.

Now: Remove the generic grade algorithms. Actual hypersensitivity remains a contraindication, unacceptable toxicity requires review, and confirmed vismodegib-associated SCAR has its own never-restart rule.

Source: NCCP pp1-2; EMA pp3,5.

### V40-VIS-03 — Pregnancy pathway precision

Before: A single generic PPP boolean did not distinguish all-patient registration from WCBP formal contraindication, testing and prescribing conditions.

Now: Separate reproductive contexts; initial prescribing/dispensing by day 7 counting the test day as day 1, monthly tests while treated, and WCBP supplies no longer than 28 days. Unknown/missing facts remain unassessed.

Source: NCCP pp2-3; EMA pp3-5.

### V40-VIS-04 — Post-treatment precautions

Before: The encoded assessment did not expose sex-specific contraception and donation durations.

Now: WCBP contraception, breastfeeding avoidance and blood donation restrictions continue 24 months after the final dose; male condom and semen donation precautions continue 2 months. Record the actual final-dose date.

Source: EMA pp4-5,7.

### V40-VIS-05 — Organ function evidence scope

Before: Current NCCP organ-function advice and its evidence uncertainty were not represented in the assessment.

Now: No recommended renal/hepatic reduction; distinguish CrCl 30-79 from below 30 and dialysis, where NCCP says no adjustment is expected and the EMA severe-renal evidence is limited. Hepatic impairment is separate from new suspected liver injury.

Source: NCCP p2 Table1; EMA p3.

### V40-VIS-06 — Interruption and restart

Before: No source-specific interruption/restart context or reduction guard was provided.

Now: No recommended reduced dose. Four weeks is the longest interruption described in the cited trials, not a mandatory stop after day 28 or automatic restart permission. Consultant review, tolerability and SCAR history govern restart assessment.

Source: NCCP pp1-2; EMA p5.

### V40-VIS-07 — Interaction and formulation checks

Before: St John's wort, strong CYP inducers, statin/transport interactions and specific hereditary excipient disorders were not represented.

Now: Contraindicate St John's wort; review strong inducers and transport substrates; distinguish rare hereditary excipient disorders from nonspecific lactose intolerance.

Source: EMA pp3,5-6.

### V40-VIS-08 — Muscle symptoms and source gaps

Before: No explicit route distinguished muscle/CK concerns from an unsupported numerical dose algorithm.

Now: Review symptoms, CK concerns, medicines and renal function when indicated. Neither reviewed source supplies a routine CK timetable, numerical CK hold/restart boundary or a specific rhabdomyolysis dose algorithm.

Source: EMA pp8-9; NCCP pp2-3.

### V40-VIS-09 — Schedule, monitoring and missed doses

Before: The assessment lacked structured continuous-treatment, mandatory-test and oral-administration metadata.

Now: 150 mg once daily continuously; four-week review is not a break. Baseline and four-weekly FBC/renal/liver tests; PPP tests separately. Skip missed doses. Ask the team before replacing a vomited dose because these sources provide no replacement algorithm.

Source: NCCP pp1-2; EMA pp5,32-33.

### V40-VIS-10 — Dose rendering

Before: The existing dose renderer could display quantified zero for source contraindications/stops.

Now: All vismodegib rule actions explicitly block numerical dose output; assessment still communicates hold/stop/review severity. No invented reduction or automatic restart quantity is emitted.

Source: Source absence of reduction algorithm; actual assessment-engine and dose-viewer probes.

## Verification and limits

The cases call the actual assessment engine, modification-dose viewer and validator. Coverage includes missing inputs, invalid values, age/ECOG, reproductive-context applicability, day 7 and supply day 28 boundaries, monthly testing phases, CrCl 30/79 boundaries, hepatic uncertainty, interruption day 28, restart history and SCAR precedence. Every rule carries a PDF hash, page and source section.

Safety holds for suspected pregnancy, SCAR or liver injury are explicitly labelled clinician safety interpretations rather than invented source dose thresholds. Review pathways do not calculate a replacement or lower dose.

Runtime: v24.22.1. Run `SACT_TEST_ROOT=<checkout> node source-cases.cjs`. The intentionally failing `--before` run is retained separately.

Full service integration, browser journeys, patient visual/PDF/QR verification and release-wide regression remain with the parent integration task. This audit does not claim publication or independent clinical approval.
