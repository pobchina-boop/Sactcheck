# Recurrent temozolomide 00342: source audit for v0.84.38

Fresh NCCP v4 (23 July 2025) and EMA Temodal PDFs retrieved on 5 November 2026. The current NCCP catalogue links to the retained v4 document. No version update was needed.

Production-engine validation: **513/513 checks passed**, with positive executed witnesses for all **50 rules**. The old assessment has 241 failing expectations on the new 513-check suite; this is not a distinct-defect count.

## Principal findings

### TMZ342-01: Missing pre-dose hold thresholds

Before: Original assessment reduced only at ANC<1.0 or platelets<50, leaving the current ANC1.0–<1.5 and platelet50–<100 range without a relevant restriction.

After: Current pre-dose thresholds ANC<1.5 and platelets<100 now withhold, explicitly attributed to EMA SmPC p7; independent NCCP nadir reductions retained.

Source: EMA p7; NCCP p2 Table2.

### TMZ342-02: Current counts and prior nadirs conflated

Before: The original low-count rules immediately reduced one level without timing or previous-cycle context.

After: Separate current pre-dose fields and prior-cycle nadirs; recovery does not erase a nadir-triggered next-cycle reduction.

Source: NCCP p2 Table2; EMA p7.

### TMZ342-03: No episode, recovery or prior-dose safeguards

Before: A one-level reduction could be shown with no previous dose or recovery context and no protection from repeating it.

After: Document prior100/150/200, recovery and episode action; review absent context; fresh reduction at100 has a stop pathway; an already-applied episode is not reduced twice.

Source: NCCP p2 Tables1–2.

### TMZ342-04: Starting-dose and escalation inputs did not drive a decision

Before: Previously treated/naive status and dose level were recorded as context only.

After: Starting-dose reference separates naive200 from previously treated150; cycle2 increase is a guarded consultant decision; known conflicting nadirs suppress its criterion. No automatic numerical increase.

Source: NCCP p1.

### TMZ342-05: Recurrent duration ambiguity not surfaced

Before: Table1 lists cycles2–6 although treatment paragraph continues until progression or unacceptable toxicity.

After: An explicit source conflict preserves open-ended recurrent schedule and flags beyond-cycle6 review; no automatic six-cycle cap.

Source: NCCP p1 vs p2 Table1.

### TMZ342-06: Hepatic exclusion missing

Before: Original Child-Pugh A/B andC shared permissive caution output; significant hepatic dysfunction exclusion was not assessed.

After: Significant dysfunction exclusion and Child-PughC conflict review added; A/B remains separate; no invented ALT/bilirubin cutoff.

Source: NCCP p1 exclusion vs p3 Table3; EMA pp5–6.

### TMZ342-07: Dacarbazine allergy and severe myelosuppression missing

Before: Generic component hypersensitivity did not explicitly represent dacarbazine; no severe-myelosuppression exclusion flag.

After: Separate source-backed exclusions added.

Source: NCCP p1; EMA p6.

### TMZ342-08: HBV positive screening pathway missing

Before: Missing-screen and active-reactivation rules existed, but a positive serology before treatment did not trigger liver-specialist review.

After: Positive-serology review added alongside existing screening/reactivation gates.

Source: NCCP pp2–3; EMA p6.

### TMZ342-09: Important SmPC monitoring supplements absent

Before: Original assessment did not explain day22 CBC or post-cycle LFT requirements.

After: Source-labelled Day22±48h CBC, weekly until recovery and after-each-cycle LFTs added; baseline glucose/HBV and day1 FBC/renal/LFT retained; no fixed MRI timing invented.

Source: NCCP p2; EMA pp6–7.

### TMZ342-10: Recovery inequality ambiguity

Before: EMA minimum pre-dose criteria are inclusive, while weekly recovery monitoring uses strict greater-than values.

After: At exact1.5/100 after a previous reduction-triggering episode, review gate prevents automatic restart interpretation.

Source: EMA p7, visually checked original PDF.

### TMZ342-11: PJP and interaction risk absent

Before: Recurrent monotherapy lacked explicit PJP/steroid and interaction-review pathways.

After: Risk-based PJP review distinct from mandatory42-day concurrent-RT prophylaxis; valproate and marrow-suppressive drug review added. Acute-infection hold gates are clearly marked clinical safety interpretations.

Source: EMA pp6–8.

### TMZ342-12: Incorrect CTCAE grade4 nausea/vomiting choices

Before: Original v5 input options offered grade4 nausea and vomiting with fabricated generic grade4 descriptions.

After: Both inputs now stop at grade3; severe symptoms prompt review but do not incorrectly trigger the generic non-haematological discontinuation table, which excludes nausea/vomiting.

Source: NCCP p2 exclusion; existing CTCAE v5 standard and EMA p7.

### TMZ342-13: Male contraception sources differ

Before: NCCP says six months after last dose; current EMA says at least three.

After: Both source positions documented; Irish six-month advice retained for team confirmation.

Source: NCCP p3 vs EMA pp7,9.

## Source documents

- nccp00342: https://healthservice.hse.ie/documents/6961/342_V4_Temozolomide_Recurrent_Therapy_.pdf — SHA-256 `bed834040bb3a5b718fcba13091a635268b125d11bbb48d0ac621208864c775e`.
- ema-temodal: https://www.ema.europa.eu/en/documents/product-information/temodal-epar-product-information_en.pdf — SHA-256 `49a0026b6a071cadce495f46786dcd162d4d72e1fe7389385292e63aabdf9d0d`.
- catalogue: https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/neuro-oncology-sact-regimens/ — SHA-256 `0627d899e951215da8ed220bcdb15cd14f9c4f0fcfb0da5560217ebf81f66d12`.

## Scope and limitations

All numerical restart/escalation output remains blocked pending consultant/pharmacy confirmation. The actual schedule panel is present: oral Days1–5, q28, then23 days without temozolomide. The protocol and indication remain adult recurrent/progressive GradeIII/IV glioma. Independent clinical and pharmacy approval, full patient integration and browser/PDF checks are separate. No deployment occurred.

Final protocol SHA-256: `378a4898a6c22d185f8b9b1c2bf0b4091911f1d953d6d61d2ab35005657c09d4`.
