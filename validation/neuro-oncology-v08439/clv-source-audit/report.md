# CLV00806 source and decision audit — v0.84.39

Current candidate: **478/478 source-contract cases passed**, all **82 rules** exercised. The unchanged before snapshot fails 190 of the same cases; this is not a count of unique clinical defects.

This is software/source reconciliation, with independent clinical and oncology-pharmacy review still pending. It is not prescribing authorisation or a deployment claim.

## Verified sources

- NCCP00806v2: reviewed18July2024; published15May2023;5pages. SHA256 `7975bce836e9b070cdc7f92aa64f9bd20339cec8c0c9b18e415116d9afc896d4`.
- Current manufacturer lomustine commonSmPC: revision16January2026. SHA256 `d117b45306bd9ebe4a886356babf7eb879846f82ef5fe4146f66081c40e35d96`.
- Current HPRA Accord cisplatinSmPC:10July2026. SHA256 `c416ae431ae2d7f4ed5c0b02c13c08a0f6fd872b6509196d2447d7dda7be27b4`.
- HPRA-linked vincristineSmPC:404; retrieval evidence retained. No current product-specific rule asserted.

## Findings

### CLV01 — Fractional platelet gap and false source certainty
Before: Platelet80–99 held as if stated by source;99.5 was missed.
After: 80 to<100 consistently triggers source-gap review; a documented prior hold separately requires recovery to≥100.
Source: NCCPp3Table1

### CLV02 — Current counts did not preserve delay/nadir/dose history
Before: An isolated low count described an80% restart without requiring prior-dose recovery reconciliation.
After: Both recovery counts, prior delay, number of delays, dose changes and nadir are distinguished.80% original becomes new full dose; no repeated percentage multiplication or re-escalation.
Source: NCCPp3Table1;lomustineSmPC4.2

### CLV03 — Separate renal bands could disagree and conceal decimals
Before: Two manually selected component renal bands; no decimal gap or missing-dialysis safeguards.
After: One exact CrCl plus explicit dialysis;39.999/40,49/49.001/50,59/59.001/60 and30/50 boundaries tested. Not-recommended wording remains distinct from formal severe-renal exclusion.
Source: NCCPp3Table2

### CLV04 — Severe hepatic limitation missing
Before: Only vincristine bilirubin captured.
After: Lomustine severe hepatic not-recommended pathway, clinician-assigned severity, mild/moderate table context and unresolved vincristine bilirubin fraction.
Source: NCCPp3Table2

### CLV05 — Neurotoxicity provenance and history incomplete
Before: Source labelled CTCAE5 despite no edition; no prior Grade2 recovery or Grade3/4 omission history.
After: Named source grading, explicit recovery and previous reduction/omission. Grade2 withhold, Grade3/4 omit. Product cisplatin neurological review stays component-specific.
Source: NCCPp4Table3;cisplatinSmPC4.4

### CLV06 — Eligibility and schedule not structured
Before: No exact post-RT timing, cycle limit or three-component dose viewer.
After: Adult medulloblastoma/PNET classification, age>40 exclusion, first cycle4–6weeks after craniospinalRT; eight42-day cycles with Day1CLV and Day8/15vincristine,2mg cap retained.
Source: NCCPpp1–2

### CLV07 — Delayed cumulative lomustine safety missing
Before: No six-week redose guard, weekly-count plan, lifetime exposure, prior-nadir or pulmonary risk threshold.
After: Single-dose supply check,≥42-day interval, weeklycounts≥6weeks, lifetime1000mg/m² maximum including proposed dose, FVC/DLCO<70% risk review and product-specific contraindications.
Source: LomustineSmPC4.2–4.5

### CLV08 — Supportive care and administration gaps
Before: Hydration only.
After: Day1 vsDay8/15 emetic burden, aprepitant/azole review, local antifungal plan, constipation prevention/urgent bowel symptoms, IV-only minibag safeguards, hearing and renal/electrolyte concerns.
Source: NCCPpp1,2,4;cisplatinSmPC4.4

### CLV09 — Current product conflict not represented
Before: No product reconciliation.
After: NCCP1h cisplatin/localhydration vs currentAccord6–8h and different hydration/diuresis; reduced renal bands vs product pre-existing renal contraindication; component-specific repeat counts and creatinine equality ambiguity explicitly blocked from automatic dose.
Source: NCCPpp1,3;cisplatinSmPC4.2–4.4

### CLV10 — Supplementary-source uncertainty needed retention
Before: No visible conflicts for WBC vsANC or product nadir overlap.
After: Manufacturer WBC/prior-dose table differs from NCCP ANC/original-dose table; platelet nadir24–<25 overlap and unverified current vincristine SmPC retained as limitations.
Source: NCCPpp3–4;lomustineSmPC4.2;retrieval404

## Validation and boundaries

Before SHA256: `dfd5bf3a1ef9a961d3f2d3938fd1a2549ae2ede107f1f1e844ec3c8903505df2`
After SHA256: `c6f93c3ed0890996b8331d69223c4168cdb1a0fce318f10a13a342efde7e01a7`
Rules: 22→82; inputs: 16→62.

Tests exercise below/equal/above thresholds; fractional platelet and renal boundaries; normal current values with toxic prior nadir; count recovery AND conditions; previous reductions/omissions; incomplete history; source-graded UI; correct component precedence; exact CrCl/dialysis; timing and eight cycles; missing/invalid inputs; and the real dose renderer. Test expectations are independently transcribed from the retained sources.

Where sources do not supply a complete recovery algorithm, product agreement or exact fractional boundary, the implementation requires specialist review. General urgent-symptom hold/review guards are labelled safety assessment rather than invented numeric NCCP criteria. No automatic final reduced dose is calculated for unresolved combined reductions, product contraindication differences or previous-dose/cap history.

## Remaining limits

- The HPRA-linked current vincristine product PDF returned404 in ordinary verified retrieval; no replacement product rule is claimed. NCCP vincristine table is fully retained and ambiguities explicit.
- Manufacturer common lomustine SmPC is supplemental and must be reconciled with the exact locally supplied unlicensed product.
- Independent consultant, oncology-pharmacy and patient/PPI review not performed.
- Browser, patient/PDF/QR, full-release regression and deployment checks are parent-integration work, not established by these source cases.
- No commits, pushes, deployments or worktrees created.
