# Antibody source audit for v0.84.14

Checked 21 October 2026 against baseline b96d392. Scope: 00200, 00201 and 00726. This is source reconciliation and software review, not independent oncology/pharmacy approval. No application file was edited by this audit.

## Sources and correct distinctions

- **00200 v8:** official NCCP PDF, last reviewed 21 July 2021, published 10 February 2014. Page 1 separates 00200a metastatic from 00200b early disease. Every-21-day IV dosing is 8 mg/kg initially then 6 mg/kg; continuation after a trastuzumab-containing regimen does not automatically require a new load. Early treatment duration is one year; metastatic use does not carry that fixed duration. Page 2 specifies ECOG 0–2, early-disease LVEF >55% with discretion at 50–55%, baseline blood/cardiac tests and 12-week cardiac surveillance (4–8 weeks with impairment). Pages 3–5 contain the combined LVEF hold, missed-dose, reaction and anthracycline cautions.
- **00201 v6:** official NCCP PDF, published 10 February 2014, version dated 10 April 2025, review due 10 April 2030. 00201a is metastatic breast cancer only; ECOG 0–3. Weekly IV loading/maintenance is 4/2 mg/kg. Baseline FBC/renal/liver and echo/MUGA, ongoing cardiac tests at 12 weeks as clinically indicated, earlier with impairment. No universal repeat-blood interval is specified. LVEF <50% AND decline ≥10 points requires holding; symptomatic heart failure discontinues. The late-dose boundary is one week overdue, not one week since the previous dose.
- **00726 v3a:** official NCCP PDF, published 13 April 2022, v3a dated 29 May 2024, review due 2 May 2029. Applies to responding metastatic/unresectable recurrent disease after HP with docetaxel, paclitaxel or vinorelbine; no automatic early-breast/adjuvant use. Maintenance 420 mg pertuzumab plus 6 mg/kg trastuzumab every 21 days; at a ≥6-week interval, reload both. Baseline LVEF ≥50%, ECOG 0–1; every-cycle blood count/renal/liver and 12-week echo/MUGA. LVEF <40%, or 40–45% with ≥10-point fall, requires holding both for ≥3 weeks. Stop for symptomatic failure; stop pertuzumab if trastuzumab stops. Persistent diarrhoea, reactions and cardiac risk require explicit review.

## Material defects confirmed locally

1. **00201 identifies the wrong regimen in structured metadata.** Its `indications` still says 00200a/every 21 days; reimbursement is 00785a and dates are copied from another product. Correct the code, interval and dates, not just the visible title. 00200 also needs separate a/b indication records.
2. **00200/00201 have no reaction action below grade 4.** Running the actual engine with grade 3 returns `proceed_with_caution` and no reaction finding. Add an explicit acute-reaction hold/review; grade 3 does not itself mandate permanent cessation. Less severe reactions need slowing/interruption, observation and resolved symptoms before restarting. NCCP 00200 page 5 and Roche Herceptin SmPC section 4.4 support this.
3. **00200 initiation LVEF rules act during explicitly ongoing treatment.** Historical baseline 49%, current 60%, fall 0 still produces the initiation withholding rule. Use the stage to distinguish initiation eligibility from current toxicity; retain useful single-value baseline assessments if stage is omitted. Do not treat an old baseline value as a new contraindication on its own.
4. **00726 has missing contextual guards.** Its exact maintenance indication is stated in prose but not testable in the engine; early disease or incomplete preceding chemotherapy currently produces no specific finding. Add optional setting/indication/chemotherapy-completion fields whose adverse explicit values trigger review. Missing values must stay unassessed, not block unrelated partial assessments. Progression should trigger review of the plan rather than silent continuation.
5. **00726 exposes uncontrolled hypertension but never evaluates it.** NCCP page 5 identifies this as an unstudied cardiac-risk group. Add review, not a fabricated absolute contraindication. Similarly, add an optional cardiac-result-overdue flag consistently with other HER2 cards.
6. **00726 misses prolonged, treatment-resistant diarrhoea below grade 3.** Its interruption rule currently needs grade ≥3. Source page 5 addresses severe OR prolonged symptoms without improvement. Add an explicit prolonged-diarrhoea context; consider interruption once support has failed, without automatically labelling all diarrhoea severe.

## Content changes

- Remove numerical efficacy panels and the trial-number question from these patient records. Keep patient rationale; clinician evidence must preserve exact setting and whole-strategy versus maintenance-only applicability.
- 00201's journey still contains the sentence `Early: completed year if applicable` and early-disease CT/annual surveillance/anthracycline follow-up language. Remove those inherited branches from this metastatic-only card. Its general treatment duration and metastatic imaging explanation are otherwise correct.
- 00726's current agent-specific anatomy content is appropriately restrained (heart, diarrhoea, infusion reaction). Preserve that; remove generic `cardiac/immune checks` and assumed premedicines from logistics. First maintenance is a continuation, not automatically another loading visit.
- Add an explicit 00726 monitoring grid: transition baseline review; bloods before each q21 visit; cardiac test by elapsed week 12 (illustrative C5 only if counting from initial HER2 therapy), then repeating. A maintenance transition never resets the echo clock.
- The existing distinction between NCCP's 12-week default and individualised longer surveillance is appropriate. ESC 2022 Figure 11 permits six-monthly TTE only after year one for asymptomatic low/moderate-risk metastatic patients with normal assessment. It is not a blanket six-month maintenance rule. This paper was retrievable by indexed primary text but its full publisher page failed to open. No new automated interval override is proposed.
- Roche's currently published Herceptin SmPC confirms ECG-inclusive baseline cardiac assessment and six-monthly cardiac follow-up to 24 months after stopping; early-disease anthracycline exposure adds longer follow-up. Attribute these additions to the SmPC, not to an NCCP table that lacks them.

## Verification boundaries

Official NCCP documents were reviewed through web PDF text extraction. No binary download/checksum or visual PDF inspection is claimed. Manufacturer SmPC is supplemental primary prescribing information; the EMA PDF returned HTTP 429, so Roche's emc publication was used and labelled. No fabricated numerical ANC/platelet holding threshold is introduced for antibody-only treatment.

See `source-audit.json` for exact URLs, proposed field/rule objects and acceptance scenarios. The accompanying executable checks use the actual assessment engine and must be rerun after integration. They are not clinical authorisation.

## Reproducible baseline checks

`node validation/her2-retro-v08414/antibody/acceptance-cases.cjs --baseline --output baseline-results.json`

This loads both the assessment engine and protocols from the audited commit, independently of concurrent working-tree edits. It runs 70 source-derived clinical-engine scenarios and 12 metadata/governance checks. **59/82 checks pass at baseline; 23 fail**: 15 engine scenarios reproduce the gaps above and eight metadata checks identify the incorrect or absent source identifiers and dates. The JSON output records each result. Failed missing metadata fields are completeness defects; they are not all separate clinical-rule defects.

After integration, run the same command without `--baseline` to evaluate the working tree. The scenarios exercise exact LVEF and missed-dose boundaries, explicit abnormal values, missing context, incomplete input, agent-specific adverse effects and the distinction between source reconciliation and clinical approval. They do not test the browser or certify the entire clinical pathway.
