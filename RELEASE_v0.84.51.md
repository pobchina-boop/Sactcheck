# SACTCheck 0.84.51 — prostate 5+5 and ADT/ARPI/radiotherapy explainer

Manual review package. This release adds five complete prostate services to the delivered v0.84.50 package. The final ZIP is cumulative over Git v0.84.49 (`15c524e0a843b8d869cc6bc6e3ecc6a26f18f2a6`), so it also contains the previously delivered final head-and-neck batch. It may be applied over v49 or the exact delivered v50. No commit, push or deployment has been performed by this task.

## Five new services

| NCCP | Treatment setting | Source version |
|---|---|---:|
|00103|Abiraterone + prednisolone for metastatic castration-resistant prostate cancer|9|
|00577|Abiraterone + prednisolone for newly diagnosed high-risk metastatic hormone-sensitive prostate cancer|3|
|00233|Enzalutamide for NCCP-listed metastatic or high-risk nonmetastatic castration-resistant prostate cancer|7|
|00574|Apalutamide for high-risk nonmetastatic castration-resistant or metastatic hormone-sensitive prostate cancer|5|
|00693|Darolutamide for high-risk nonmetastatic castration-resistant prostate cancer|2|

These are complete services for five existing protocol families, not five extra protocol files. The catalogue remains at 377 protocols; the patient registry has 228 codes and 255 bundle routes, with 264 authored routes in total. Haematology remains hidden. The previous release completed head-and-neck authoring across 30 families and 31 contexts; that does not constitute independent clinical approval.

Each new service includes clinical assessment rules, clinical workflow and supportive care, clinician knowledge, agent-specific consent, monitoring, patient knowledge, a three-page anatomical pack, a treatment card, passport, companion PDFs and a full handbook. Oral treatment is continuous: a 28-day review display does not prescribe a rest week, six cycles or a fixed treatment duration.

## Requested prostate explainer

All five clinician knowledge-base entries include the same source-linked educational module, with seven expandable sections:

1. ADT mechanisms, agonist/antagonist differences and why androgen suppression continues in castration-resistant disease.
2. Treatment by clinical setting, including localised disease, biochemical recurrence, mHSPC, nmCRPC and mCRPC.
3. Why suitable patients receive intensification upfront, how abiraterone differs from receptor inhibitors, and how comorbidity, interactions and prior treatment influence selection.
4. Definitive, salvage, low-volume metastatic-prostate, palliative and selected metastasis-directed radiotherapy; high-risk and high-volume definitions remain distinct.
5. Nine pivotal trial summaries with populations, comparators, endpoints, effect estimates and limitations. Trial percentages are not individual survival forecasts or head-to-head drug comparisons.
6. Exact mapping to these five NCCP services, distinguishing evidence, EMA authorisation and Irish protocol/reimbursement scope.
7. Bone, cardiovascular/metabolic, sexual, fatigue and exercise support from the start of ADT.

The module has 17 source references. It is educational and does not automatically select treatment or broaden an encoded indication. The review copy is `validation/prostate-v08451/review/prostate-treatment-explainer.html`.

## Clinical corrections and source distinctions

- Replaced inherited generic prostate indication codes with the actual indication codes in the retrieved NCCP documents.
- Removed mCRPC baseline laboratory thresholds that had incorrectly been applied to the separate mHSPC abiraterone entry. The mCRPC initiation criteria remain phase-specific; high-risk mHSPC uses its own risk definition.
- Preserved different prednisolone schedules: 10 mg/day in 00103 versus 5 mg/day in 00577. Continued ADT and safe steroid interruption advice appear across clinical and patient content.
- Updated apalutamide to the currently retrieved NCCP v5, including severe hepatic impairment and serious skin/lung toxicity guidance. Retained the old protocol ID migration.
- Kept darolutamide 00693 restricted to nmCRPC. Broader metastatic darolutamide evidence/licensing in the explainer does not become eligibility for this service.
- Preserved previous permanent stops, toxicity/restart history, interaction checks and partial assessment. No missing input is silently treated as a normal result.
- Explicitly flagged differences between NCCP and EMA guidance: abiraterone Child-Pugh B dosing, enzalutamide severe hepatic eligibility versus the dose table, and darolutamide CrCl/eGFR terminology and dialysis uncertainty.
- The numeric potassium safeguards in 00577 explicitly cite supplemental NCCP 00103 abiraterone guidance. They are not mislabelled as numeric thresholds printed in 00577. Independent review of that cross-indication application is required; 00577 itself states withholding for grade ≥3 toxicity.

## Retrospective batch and verification

Repeated source checks for 00294/head_neck, 00242, 00295, 00615 and 00893. All five freshly retrieved NCCP source hashes match v50, all 263 clinical cases pass, and 193 retained patient/compatibility files remain byte-for-byte unchanged.

The five prostate encodings contain 114 rules, with 184 passing source-boundary and state/history scenarios. The PDF pipeline checks page geometry, complete source-text retention, chapter structure, mirrors and QR decoding. The final exact test results, handbook lengths, local HTTP checks and limitations are recorded in `validation/prostate-v08451/validation-summary.json`.

The immutable v50 asset record and delivered manifest are preserved. The separate v51 migration verifies the delivered v50 overlay on Git49 and explicitly accounts for every changed protected file. No fictitious v50 Git commit is used.

## Outstanding limits

- Chromium was attempted and blocked before page load by the environment's `socket() Operation not permitted` failure. Browser interactions, mobile device behaviour, physical printing and phone-camera QR usability are not claimed as tested.
- Node 24.22.1 was used locally; the configured Node 20 CI environment still needs its run after upload.
- This package has not been deployed. Live version, cache refresh and new public QR destinations require checking after deployment. Local HTTP tests do not establish live availability.
- Independent oncology, oncology-pharmacy and patient/PPI review remains pending. Example telephone numbers must be replaced before patient use. Automated tests are not clinical authorisation.
- Previous release source limitations remain documented, including the 00893 source typo/review date and the 00517 NCCP/NCIS version discrepancy.

## Suggested commit

Summary: `v0.84.51: add five prostate suites and ADT/ARPI/radiotherapy explainer`

Description: Add complete abiraterone mCRPC/mHSPC, enzalutamide, apalutamide and darolutamide services across assessment, workflow, knowledge, consent and patient documents. Explain ADT, treatment intensification and radiotherapy with setting-specific trial evidence; reconcile NCCP source boundaries and provide continuous-treatment packs, QR cards and full handbooks. Repeat five head-and-neck audits and retain exact provenance and validation evidence. This cumulative package also includes the previously delivered v0.84.50 final head-and-neck update.
