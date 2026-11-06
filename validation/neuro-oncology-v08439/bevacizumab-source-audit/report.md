# NCCP 00813 source audit — v0.84.39

Source reconciled and software cases passed; independent clinical/pharmacy review pending.

The retained baseline has 23 rules; the candidate has 62 rules and 58 decision inputs. All existing rule IDs remain represented. No OF590 rules existed in this protocol.

**Validation:** 555/555 checks passed; schema has no errors or warnings. Every rule has a positive source-case witness. The baseline fails 283/493 comparable expectations; this is not a count of distinct clinical defects.

## Source evidence

- NCCP 00813 v2: published 2 May 2023; revised 24 July 2024; review due 24 July 2029. Fresh official PDF retrieved 5 November 2026. Page 4 was rendered and visually inspected.
- Current EMA Avastin product information was independently retrieved. Its product-wide safety instructions supplement the disease-specific NCCP regimen. No unsupported glioblastoma dose or indication was imported from EMA.
- Source URLs, redirects, retrieval timestamps, checksums and local files are in `source-index.json`.

## Findings

### B01 · Grade 3 hypertension persistence

Before: Every hypertension grade ≥3 triggered discontinuation despite prose requiring persisting grade 3.
After: Grade 2–3 triggers therapy/review; explicit persistence or grade 4 triggers discontinuation.
Source: NCCP p4 Table 3.

### B02 · Unsupported severe BP stop threshold

Before: The legacy >200/110 boolean produced discontinuation without this threshold appearing in NCCP 00813.
After: Urgent hold/review preserves safety; separate crisis, unresponsive medically significant hypertension, and source-defined initiation checks govern outcomes.
Source: NCCP p4 Table 3/footnote; EMA p6.

### B03 · Urine testing sequence

Before: A 2+/3+ dipstick could repeatedly permit proceeding without distinguishing the next dose after an abnormal screen.
After: Initial/routine screen, next dose after abnormal screen, and post-hold reassessment are distinct. Required quantification and the three-day collection window are explicit.
Source: NCCP p4 Table 2.

### B04 · Distinct urine units and quantitative boundaries

Before: No separate urine concentration input; screening and quantitative timing/validity were incomplete.
After: g/L screening is separate from g/24 h total. Tests cover 1 g/L, ≤2, >2–4, >4 g/24 h, invalid/absent collection confirmation and discordant results.
Source: NCCP p4 Table 2.

### B05 · Previous discontinuation persists after recovery

Before: No source-specific prior-stop history was available.
After: Prior stop reasons remain active despite normal BP, urine or grade values. No automatic restart or invented lower dose is supplied.
Source: NCCP p4 Tables 2–3; EMA pp5–7.

### B06 · Grade 4 proteinuria and nephrotic syndrome

Before: Quantitative >4 g/24 h alone did not cover the independent grade 4/nephrotic pathway.
After: Explicit clinician-confirmed source grade 4 proteinuria and nephrotic syndrome checks remain actionable independently of a lower numerical result.
Source: NCCP p4 Table 3; EMA p7.

### B07 · Tracheoesophageal fistula at any grade

Before: Only generic grade 4 fistula was assessed.
After: Any-grade tracheoesophageal fistula triggers permanent discontinuation; other internal fistulae require consideration of discontinuation.
Source: NCCP p4 Table 3; EMA p6.

### B08 · Surgery interval and healing

Before: One compound boolean did not expose the interval/healing conjunction.
After: <28 days, incomplete healing and wound complications independently withhold. ≥28 days without healing confirmation cannot clear treatment. Elective surgery timing remains individualised.
Source: NCCP p2; EMA p6.

### B09 · Bleeding site and current versus historical thrombosis

Before: Generic grades did not cover current intracranial bleeding or recent haemoptysis, and arterial history could be confused with a new event.
After: Intracranial bleeding, >2.5 mL red-blood haemoptysis, new arterial events, lower-grade VTE and source-specific major bleeding actions are separated.
Source: NCCP pp2,4; EMA p7.

### B10 · Eligibility and breastfeeding

Before: Recurrent glioblastoma context/organ adequacy were not assessed explicitly and breastfeeding was omitted.
After: Exact indication and clinical organ adequacy are reviewed without fabricated ANC/platelet thresholds; breastfeeding is an exclusion. Existing ECOG/imaging/ICH/stroke exclusions are retained.
Source: NCCP pp1–2.

### B11 · Infusion and suspected acute neurological events

Before: Confirmed PRES existed; acute infusion reaction and suspected neurological concern were absent.
After: Stop the active infusion and treat reactions; urgent hold/review for new neurological symptoms. Confirmed PRES stops therapy and restart safety remains unknown.
Source: EMA pp6,8; urgent clinical assessment interpretation.

### B12 · Monitoring and supportive-care specificity

Before: Required monitoring and conditional cardiac/INR considerations were not decision inputs.
After: FBC/renal/liver/urine checks, BP before and after treatment, conditional ECHO and warfarin INR timing are explicit. Minimal emetic risk and no routine premedication are preserved.
Source: NCCP pp2–3,5.

### B13 · Risk and interaction review

Before: Several cautions were not available to the decision tool.
After: Cardiovascular, renal/proteinuria, bleeding/clotting, pelvic RT/perforation, aneurysm, dental/IV bisphosphonate and interaction concerns are review pathways.
Source: NCCP p2; EMA pp7–9.

### B14 · No arbitrary dose reductions

Before: Standard schedule was prose-only and actions had no explicit numeric-modification guard.
After: Structured 5 mg/kg Day 1 every 14 days without fixed cycle count; every toxicity action blocks inferred numeric dose adjustment. Renal/hepatic guidance does not override eligibility or toxicity.
Source: NCCP pp1,3 Table 1.

### B15 · Source grading and provenance

Before: Generic grade selectors risked being interpreted as CTCAE v5 without source reconciliation; source pages were broad placeholders.
After: Clinician-confirmed source grading is explicitly labelled, with no automatic v3-to-v5 conversion. Every rule has a URL, page, section and retained PDF SHA.
Source: NCCP p4; EMA adverse-event sections.

### B16 · Fertility and ongoing precautions

Before: No dedicated advice-plan review was encoded.
After: Contraception/fertility discussion and breastfeeding restrictions are part of the review; women are advised contraception during and up to six months after, and no breastfeeding for at least six months after the last dose.
Source: EMA p10 section 4.6.

## Deliberate uncertainty

- NCCP initiation blood pressure >150/100 does not specify AND/OR between components. Numerical readings trigger review; clinician-confirmed uncontrolled status is assessed separately.
- NCCP uses recent intracranial haemorrhage without a numerical interval; no number of days is inferred.
- Grade 2–3 hypertension prompts antihypertensive therapy and consideration of interruption. Persisting grade 3 requires explicit clinical confirmation.
- Source event grading is not automatically converted from NCI-CTCAE v3 to CTCAE v5.
- Previous proteinuria >4 g/24 h or another source-directed discontinuation is not erased by a subsequent normal result.
- NCCP expects no renal/hepatic dose adjustment, while EMA notes these populations have not been studied. Eligibility, monitoring and toxicity assessment remain required.
- Concurrent discordant dipstick and quantitative results require confirmation of timing and collection validity; a current 4+ screening result is not silently overridden.

## Verification boundaries

The assessment engine and dose renderer were exercised. These checks establish implemented software behaviour against the recorded sources; independent clinical and oncology-pharmacy approval remains pending. Shared patient, consent, browser and PDF/QR integration is performed by the release owner. This audit did not commit, push or deploy.

## Reproduction

```bash
SACT_TEST_ROOT=<main-checkout> node validation/neuro-oncology-v08439/bevacizumab-source-audit/source-cases.cjs
```

The retained before snapshot, complete case results and criterion matrix allow review without relying on an aggregate pass count.
