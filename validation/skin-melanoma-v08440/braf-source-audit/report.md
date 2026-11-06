# BRAF/MEK source audit — v0.84.40

Baseline: `bffd2cda167d7943ce6431ff32d5a1525509f618` (v0.84.39). Both current official PDFs retained; candidate clinical approval remains **false**.

## Source versions

| Code | Current source | Version date | SHA-256 |
|---|---|---|---|
| 00415 | v5, 9 pages | 2026-08-25 | `b04cae8e0d9c6fa0a6bdf01cf67179f4da0b2a4943ca581c7036973d70a13720` |
| 00563 | v4, 11 pages | 2026-09-14 | `8e4d16d8baeae000830d14f6088ef631f98a227928fa6a60eab4929c491fcb2a` |

00415 v5 is an August 2026 administrative/support-reference amendment; its footer clinical-review date remains November 2021. 00563 v4 was clinically reviewed September 2026. Existing protocol IDs remain stable deliberately; actual source versions are in metadata.

## Findings and implementation

### SOURCE_VERSIONS

Metadata claimed historical v4/v3 with old versioned links. Fresh catalogue-linked PDF bytes prove 00415 v5 (9 pages), 00563 v4 (11 pages). Version dates and retained SHA-256 recorded. Protocol IDs intentionally preserved for route compatibility.

### ECOG2_GAP

Only ECOG≥3 produced review, leaving ECOG2 outside source eligibility unflagged. ECOG>1 prompts consultant review; both sources specify0–1.

### BASELINE_EXCLUSIONS

Molecular and pregnancy flags existed but source-specific prior therapy, ocular/pulmonary/cardiovascular/GI exclusions absent. Separate source exclusions encoded, distinguishing00415 advanced prior treatment failure from00563 any prior BRAF/MEK treatment.

### LVEF_THRESHOLD

Universal LVEF≤50% whole-regimen hold; no baseline, institutionalLLN, decline or recovery. Actual LVEF, baseline andLLN derive absolute percentage-point changes. Source-specific >10-point AND belowLLN threshold, grade/symptoms, recovery and permanent-stop history retained;00563 baseline<50 warning kept separate.

### CK_WRONG_HOLD

Both JSONs held whole regimen atCK≥5ULN. Unsupported00415 CK cutoff removed.00563 asymptomaticCK>5–10maintains binimetinib with hydration;>10or>5with muscle symptoms/renal impairment holds binimetinib with encorafenib link. Missing symptoms flagged.

### QT_HISTORY

Both JSONs had blanketQT>500hold;00563 omitted pretreatmentdelta and recurrences. Unsupported00415numericQT rule removed.00563usesQTcF>500plusdelta≤60hold versus>60permanentstop,>1recurrence stop, recovery≤500and historical peak retained.

### PYREXIA_RECOVERY

Temperature≥38hold only, without both-component clarity or restart history. Both medicines held; recurrent first symptoms,≥24hour symptom-free prerequisite, recurrence/severe complication reduction review.

### ORGAN_FUNCTION

No source-specific renal/hepatic dosing pathway. 00415qualitative impairment categories preserved without invented CrCl.00563v4CrCl30boundary, severe/dialysis hepatic qualifier, ChildPughA300mg reference, B/Cnotrecommended, binimetinibmoderate/severe30mg reference added with no automatic compounded numeric doses.

### COMPONENT_ACTIONS

Generic whole-regimen eye/lung/CK actions erased component differences. 00415uveitis targets dabrafenib; cardiac/RVO/RPED/ILDtargets trametinib.00563binimetinib holds carry encorafenib300mg review; encorafenib hold interrupts both; either permanentstop stopsboth.

### TOXICITY_HISTORY

Generic Grade≥3hold and Grade≥3hypersensitivity permanentstop lacked source-specific recoveries and consultant alternatives. Source-specific rash, ocular, pulmonary, other-event, recovery, recurrence and elapsed-time pathways. Prior severe events cannot be cleared by current Grade0.00415CTCAEv4 specified.

### LIVER_TIMING_AND_GAP

No specific hepatic toxicity table. AST/ALT>3–≤5maintain initially, binihold2weeks/encohold4weeks.>5ANDbili>2 and>20boundaries, recurrent/nonrecovering stop pathways; gap without bili>2explicitreview.

### SOURCE_CONFLICTS

No uncertainties visible. 00415skin60-day vsmonthly;00563secondreduction225gtypo, once-daily prose vsbiniBIDtable, Grade2ILDrestart vsconfirmedILDstop, liverG3gap all explicitly retained. No invented dose or autoILDrestart.

### SUPPORT_CLASSIFICATION

Regimen assigned oral_minimal_low despite dabrafenib moderate-to-high source classification. oral_moderate_high /nccp-oral-moderate-high; bothcomponentclasses and exact currentNCCPp6 retained. Root must updatecentralriskmap/sidecars/support scripts consistently.

### ADMINISTRATION_AND_MONITORING

Treatment had only summary without dose components or detailed administration/monitoring. Continuous oral schedules, missed-dose/vomiting instructions,00563new swallowing options andstrengthrestriction, mandatorytests/aftertreatmentsurveillance, individualresponseimaging; no invented fixedcyclecount/markers.

## Verification

Current: **753/753 assertions passed**, covering 56 +107 rules through the real assessment engine and dose renderer. Structural validation has no errors or warnings. No test produced a quantified numeric modification dose.

Before: 318/590 comparable core expectations passed; 272 failed as expected against the new source criteria. Candidate totals include an additional163 executed-rule-witness assertions. Blank/invalid inputs and metadata checks are included; these are not753 independent clinical thresholds.

The separate threshold/history cases test exact temperature38°C,24-hour recovery, LVEF>10-point/LLN relations, QTcF500/60 boundaries and recurrence, CK5/10, AST/ALT3/5/20 plus bilirubin2, two/four/six-week holds, historical permanent-stop retention, source gaps and component coupling. Every rule has at least one executed positive witness.

## Remaining source uncertainties

- 00415 — Tests p2 specifies every 60 days; complications p6 specifies monthly. Preserve both with local-team reconciliation rather than silently choose a universal interval.
- 00415 — Table 5 says RPED Table 5 below; the actual RPED table is Table 6 on p6. Audit references Table 6.
- 00415 — Version 5 was amended 25 August 2026 for emetogenic links/review schedule; footer clinical review remains 11 November 2021. Do not present amendment date as a fresh full clinical review.
- 00563 — Table 2 prints 225g once daily; this is unsafe to operationalise. Do not silently change to 225 mg or retain the prior v3 200 mg. Pharmacy/source confirmation is required before a second reduction.
- 00563 — Opening treatment prose says both medicines once daily, but the actual treatment table and 12-hour instruction specify binimetinib 45 mg twice daily. Use the explicit table and retain this discrepancy.
- 00563 — Table 3 permits Grade 2 recovery/reduced restart after up to 4 weeks; p10 says permanently discontinue confirmed treatment-related ILD. Maintain hold and require documented clinical/pharmacy reconciliation before restart.
- 00563 — The printed Grade 3 liver row requires AST/ALT >5 AND bilirubin >2 ×ULN. Values >5–≤20 with bilirubin ≤2 have no exact row; flag review rather than invent a dose or imply clearance.

## Integration and limits

The root must update the central emetogenic map and00415support sidecars to oral moderate-to-high; patient/knowledge/consent content should use `handoff.json`. This bounded source audit does not replace whole-release browser, anatomical/PDF/QR checks or independent clinical/pharmacy approval. No commit, push or deployment was performed.
