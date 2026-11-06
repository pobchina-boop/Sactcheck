# Lomustine00805 source audit for v0.84.39

**484/484 production-engine, source-boundary and schedule checks pass.** All57 rules have a positive executed witness. Retained baseline has209 failing expectations in the new484-check suite; this is not a distinct-defect count.

Fresh NCCP00805v2(18July2024) remains current on the catalogue. The linked manufacturer SmPC has since been revised to16January2026; its safety recommendations are explicitly attributed and unresolved differences are visible.

## LOM805-01: Unsupported DLCO stop threshold

Before: Original assessment automatically withheld atDLCO<60%, without support in NCCP00805.

After: Remove the invented cutoff. Current SmPC FVC/DLCO<70% is a pulmonary-risk review flag; new respiratory symptoms still prompt urgent safety review.

Source: NCCP pp2–3; SmPC p3.

## LOM805-02: Platelet gap incomplete

Before: Original80–99 inclusive warning missed values99.1–99.999 and did not distinguish recovery from a documented delay.

After: Cover80–<100 fully as an explicit source gap; prior delay continues to require recovery to≥100. RetainANC<1/<80 delay and≥1/≥100 minimum source row.

Source: NCCP p2 Table1.

## LOM805-03: Severe hepatic impairment unassessed

Before: No hepatic impairment field or rule existed.

After: Add mild/moderate no-adjustment-expected and severe not-recommended pathways without fabricated ALT/bilirubin thresholds.

Source: NCCP p2 Table2.

## LOM805-04: Not-recommended vs formal contraindication conflated

Before: The prior numeric renal rule labelledCrCl<30/dialysis as contraindicated.

After: Preserve NCCP not-recommended wording with an administration hold; separately encode the product formal severe-renal-impairment contraindication. Review30–50 original-dose75% against dose history rather than automatically multiplying the current dose.

Source: NCCP p2 Table2; SmPC p2.

## LOM805-05: Missing minimum interval and exposure limits

Before: No executable repeat-interval, course cap, dose-intensity or cumulative exposure check.

After: Structured single-doseDay1q42 schedule;280mg cap; proposed>130mg/m², repeat<42days and projected>1000mg/m² restrictions. Existing≥1000mg/m² prevents further courses. Missing exposure is not zero.

Source: NCCP p1; SmPC pp1–3.

## LOM805-06: Delayed nadirs not assessed

Before: Only current ANC/platelets were encoded.

After: Add priorWBC/platelet nadirs with source-labelled review; distinguishANCfromWBC, retain prior reductions, flag current SmPC repeat-doseWBC≥4 requirement. No automatic percentage from discordant/overlapping table rows.

Source: SmPC p2.

## LOM805-07: Product nadir-table overlap

Before: Current SmPC70% platelet row starts at24,000/mm³, overlapping50% row below25,000.

After: Explicit24–<25×10⁹/L overlap warning; all nadir percentages require consultant/pharmacy reconciliation.

Source: SmPC p2 nadir table.

## LOM805-08: Nonhaematological reduction/restoration history missing

Before: A single active Grade≥3 rule included reduction and possible later restoration without verifying recovery, recurrence, dose history or42days.

After: Separate active hold, history, baseline recovery, clinical relevance, already-applied reduction and42-day nonrecurrence review; no calculated50% or full-dose restoration.

Source: NCCP p3 Table3.

## LOM805-09: Missing product contraindications

Before: No direct flags for other nitrosourea allergy/nonresponse, severe marrow depression, product-specific wheat allergy or live vaccines.

After: Add source-labelled exclusions, including careful distinction of wheat allergy from coeliac disease and supplier-specific product excipients.

Source: SmPC p2 section4.3.

## LOM805-10: Monitoring lacked source separation

Before: No explicit weeklyCBC≥6weeks or PFT source difference.

After: NCCP baseline/regularFBCrenalLFT retained; current SmPC weeklyCBC for at least six weeks and baseline/frequentPFTs explicit. NCCP PFTs remain described as conditional high-risk testing; individualMRI plan retained.

Source: NCCP p2; SmPC pp2–3.

## LOM805-11: Contraception advice outdated relative to supplied product reference

Before: NCCP says6months for both men/women; January2026 common SmPC says7women/4men.

After: Both positions clearly identified for pharmacy/product confirmation; do not silently shorten existing advice or claim a common universal duration.

Source: NCCP p3; SmPC p4.

## LOM805-12: Alkylator history, interactions and overdose guards missing

Before: No explicit prior-alkylator/marrow-reserve, antiseizure interaction or extra-dose pathways.

After: Add consultant review for prior alkylation, compromised reserve and interacting medicines; urgent assessment for potential extra dosing, emphasising delayed toxicity.

Source: NCCP p1; SmPC pp1,3,6.

## Evidence and limitations

Candidate protocol SHA-256:`ed68dce742d2b33537926319f9a11d3675283a5a0e1c895fe8ecfb4afe3f012b`.

Independent clinical/pharmacy review pending; no clinical-use approval.
Staged-only candidate; main checkout not changed by this task. Full-suite patient/PDF/browser/release integration is separate.
Cumulative proposed total is an explicitly verified clinician-entered value, not an automated addition. The derived difference rejects non-increasing totals and cannot be forged by supplying a delta. Verify actual exposure and proposed dose with pharmacy.
All numerical dose modification calculations blocked due to source denominators, recovery/history and product differences; reference percentages remain visible with attribution.
Manufacturer common SmPC is the primary product document linked by NCCP; confirm the actual imported/unlicensed product and local pharmacy instructions.

- nccp00805: https://healthservice.hse.ie/documents/6871/805_V2_Lomustine_130mg_Therapy.pdf — SHA-256`b4b932f8f6193a3f6141d7d067f3a08b1a8c1590eb66d2a98ff0fe716c4f0808`.
- lomustine-medac-smPC: https://www.medac.eu/fileadmin/user_upload/medac-eu/SPCs/common_SPCs/Lomustine_medac-spc-common.pdf — SHA-256`d117b45306bd9ebe4a886356babf7eb879846f82ef5fe4146f66081c40e35d96`.
- catalogue: https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/neuro-oncology-sact-regimens/ — SHA-256`0627d899e951215da8ed220bcdb15cd14f9c4f0fcfb0da5560217ebf81f66d12`.

Final UI correction hides the internal calculated difference; the source thresholds and recomputation tests are unchanged. See ../derived-input-ui-correction.json.
