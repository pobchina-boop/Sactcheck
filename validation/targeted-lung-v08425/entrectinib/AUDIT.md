# Entrectinib 00702 source audit for v0.84.25

Checked 29 October 2026 against committed v0.84.24. This bounded audit supplies a proposed protocol, full adult patient/clinician suite, medicine-specific consent profile and source cases. Independent Consultant, oncology-pharmacy and patient/PPI approval remains pending; clinical use is not authorised.

The baseline had 14 inputs and 12 predominantly generic targeted-therapy rules. The final proposal has **57 optional, initially blank inputs and 56 source-specific rules**, all attributed to entrectinib and linked to source pages. Both existing organ-function rule IDs are retained: `OF590_00702_ENT_RENAL_SEV` and `OF590_00702_ENT_HEP_SEV`. Every legacy input is preserved.

## Sources and scope

- Fresh NCCP 00702 **v 2**, eight pages; version history dates v 2 to 1 October 2024 and notes the additional NTRK indication and reimbursement updates. Source review date is 15 April 2029. The healthservice URL returned HTTP 403; the identical named v 2 document was retrieved from the official HSE assets mirror. Pages 3–5 were rendered and visually inspected, including exact inequalities and continuation across page breaks. PDF and extracted-text SHA 256 are in `sources.json`.
- Current EMA Rozlytrek product information downloaded; the EMA product page displays update **27 March 2025**. Sections 4.1–4.7 and 5.2 checked against NCCP. No later update date is invented.
- NCI CTCAE 4.03 official reference downloaded to clarify the **CTCAE v 4.0** grading explicitly specified by NCCP Table 2. These are not generic CTCAE 5 fields.
- Primary ROS 1 integrated analysis: Fan et al., *Clinical Lung Cancer*2024, DOI 10.1016/j.cllc.2023.12.001. Data cutoff 2 August 2021;172 ROS 1-TKI-naive adults; BICR ORR 67% and median PFS 16.8 months. No randomised comparator.
- Separate NTRK adult integrated analysis: Demetri et al., *Clinical Cancer Research*2022, DOI 10.1158/1078-0432.CCR-21-3597. Cutoff 31 August 2020;121 adults across 14 tumour types; ORR 61.2%. This pooled result is not a lung-specific result.
- Separate NTRK NSCLC update: Cho et al., *Lung Cancer*2024, DOI 10.1016/j.lungcan.2023.107442. Cutoff 2 August 2022;51 patients; ORR 62.7%. This is NTRK lung disease, not ROS 1 and not a comparator arm.

The source includes **00702a ROS 1-positive advanced NSCLC before any ROS 1 inhibitor** and **00702b adult NTRK fusion-positive solid tumours without previous NTRK inhibitor, with no satisfactory options**. NTRK resistance and disease-setting requirements remain explicit. The current EMA paediatric indication does not expand the adult 600 mg suite into a paediatric service.

## Substantive clinical corrections

1. **QT:** NCCP holds at **481–500 ms inclusive**, previously missed below 500. **>500 ms** uses cause-dependent restart after recovery to baseline; serious arrhythmia/torsade/polymorphic VT is a separate permanent-stop criterion. EMA baseline **>450 ms** avoidance is a separate pretreatment field; it is not substituted for the on-treatment threshold.
2. **CHF:** grade 2/3 hold to grade≤1, then reduced dose. Grade 4 holds with reduced restart versus discontinuation as a clinical choice; no automatic permanent-stop decision.
3. **Cognition:** grade 2 requires explicit intolerability; grade 3 holds then reduces; grade 4 urgent review/discontinuation as clinically appropriate. A grade 2 result without tolerability is a review, not assumed acceptable.
4. **Uric acid:** symptomatic or grade 4 hyperuricaemia holds with urate-lowering management. CTCAE 4 has **no grade 2** hyperuricaemia, so it is excluded from the new selector. Grade 3 means physiologic consequences and raises explicit urgent symptom review rather than being treated as an asymptomatic normal result.
5. **Liver:** grade 3/4 recovery and four-week time windows, grade 4 recurrence and strict paired ALT/AST **>3×ULN** plus bilirubin **>2×ULN** are separate. Permanent stop from paired labs requires **confirmed absence of cholestasis/haemolysis**; absent attribution produces hold/review, not an invented diagnosis. Current numeric and graded adverse evidence cannot erase one another. Numeric ALT/AST>5 triggers interruption and grading review, not an automatic calculation of a restart dose.
6. **Haematology:** grade 3/4 anaemia/neutropenia hold until grade≤2/baseline; same/reduced restart is clinician directed.
7. **Other toxicity:** grade 3/4 holds to grade≤1/baseline; within-four-week recovery allows same/reduced restart; unresolved events require consideration of stopping, while recurrent grade 4 permanently stops. Grade≥2 neuropathy is a separate NCCP caution.
8. **Removed imported certainty:** the prior generic grade 2 pneumonitis permanent-stop rule is replaced by hold/investigation and source-specific review. CK>5×ULN remains reviewable through its legacy field, but no entrectinib dose rule is invented from another TKI.
9. **Organ function:** severe renal impairment is unstudied, requiring review. NCCP and current SmPC do **not specify a numeric CrCl boundary**, so no invented numeric renal threshold is added. Severe hepatic impairment has no recommended starting adjustment but requires close monitoring; active hepatotoxicity rules still apply.
10. **Interactions:** avoid strong/moderate CYP 3 A inhibitors. Unavoidable adult co-administration is limited to 14 days with separate 100 mg/200 mg daily interaction doses and subsequent washout/reinstatement review. Those values are **not** the toxicity ladder and are never multiplied together. Strong/moderate CYP 3 A/P-gp inducers, QT agents, narrow-index substrates, grapefruit and Seville oranges require distinct attention.
11. **Dose/schedule:**600 mg daily; toxicity levels 400 mg,200 mg; intolerance of 200 mg means permanent stop. Continuous daily treatment has no invented 28-day chemotherapy cycle. A temporary 100 mg interaction dose does not imply toxicity-floor failure.

## Source ambiguities retained

- NCCP eligibility prints **age>18**, whereas its broad indication is adult and primary trials enrolled≥18. Exactly 18 produces source/access review; paediatric dosing is not generated.
- NCCP lists “patients with CNS involvement” under ROS 1 eligibility, although the broad indication and EMA licence do not require brain metastases. ROS 1 without CNS involvement produces current-MAP/source-interpretation review, not an invented absolute exclusion.
- NCCP v 2 says capsules should not be opened/dissolved; the current EMA SmPC allows professionally prepared capsule suspension/enteral use. Whole capsules remain the standard suite. Swallowing difficulty requires pharmacy instructions; suspension vomiting advice differs from whole capsules.
- NCCP/SmPC Table 2 CHF and cognitive descriptions are not identical to generic CTCAE 4 terms: the source groups CHF grades 2/3 and describes grade 4 with rest/minimal-activity symptoms; generic CTCAE 4 cognitive disturbance has no grade 4, whereas NCCP/SmPC provides an urgent-intervention grade 4 pathway. Assessment guidance makes this distinction explicit and calls for specialist grading review.

## Full service content

Authoring includes patient reference and portal copy, medicine-specific anatomy, consent aid/discussion content, guide, reusable passport and card content, relative chronology and longitudinal monitoring, practical logistics, supportive plan, clinician KB and indication-specific evidence. Patient trial metrics remain empty; clinician outcomes retain population, cutoff and single-arm limitations.

Monitoring distinguishes baseline tests from **ECG/electrolytes after one month and periodic later checks**. LVEF is risk/symptom based; no universal three-month schedule is copied. Regular FBC/renal/liver/urate and cognition/vision/bone/heart reviews are explicit. No patient date entry is needed. The minimal-to-low oral emetic plan contains no copied parenteral antiemetic prescriptions, routine G-CSF, steroids or antimicrobial prophylaxis.

Contraception counselling: women during treatment and≥5 weeks after; men with partners of childbearing potential during and≥3 months after; barrier supplementation with systemic hormonal contraception; no breastfeeding during treatment. Driving restrictions for dizziness, cognitive/visual symptoms or syncope are included.

## Verification

`node validation/targeted-lung-v08425/entrectinib/source-cases.cjs` passes **241/241** meaningful cases using the real assessment engine, strict validator and dose/schedule renderer. Strict validation has **zero errors and warnings**. Cases cover blanks/nulls, negative controls, indication/prior-treatment gates, QT/paired-LFT boundaries, recovery/recurrence choices, adverse alias preservation, no stacked doses, separate interaction 100 mg dosing, source grading, all legacy fields, continuous schedule and all authoring/consent references. `node validation/targeted-lung-v08425/entrectinib/source-cases.cjs --integrated` also passes **241/241** against the final canonical integration. Software checks are not independent clinical approval.
