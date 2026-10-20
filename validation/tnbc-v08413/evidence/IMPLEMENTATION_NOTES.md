# TNBC evidence audit: implementation notes

Checked 20 October 2026. Companion structured data: `evidence-audit.json`. No application files edited.

## Recommended evidence panel

For 00857/00858/00860/00861, show KEYNOTE-522 OS and EFS at one matching time point and analysis. Preferred latest display is the 2026 seven-year update, prominently labelled **ASCO 2026 conference abstract, descriptive final follow-up**. Keep the 2024 full NEJM OS report directly accessible. Do not call the 2026 abstract a full peer-reviewed report or a new formal OS test. The original statistical evidence and the maturity of the latest estimate are separate concepts.

The 2026 primary abstract was verified through an investigator institution's publication record because the journal's direct full page returned403. It contains the exact two-arm estimates and CIs. Primary URL: https://ascopubs.org/doi/10.1200/JCO.2026.44.16_suppl.507 . Accessible primary abstract record: https://snu.elsevierpure.com/en/publications/neoadjuvant-pembrolizumab-or-placebo-plus-chemotherapy-followed-b/ . Tool ref `turn377view1`.

Do not fabricate an OS median in this curative-intent trial. Do not turn a Kaplan–Meier percentage difference into a count of cured patients or guaranteed benefit for an individual. The seven-year absolute differences (7.9 percentage points OS;8.5 EFS) are arithmetic differences of the reported rounded arm estimates; no CI for the difference was supplied by the abstract.

For00348, the closest direct backbone evidence is CALGB40603. A pCR panel must label its breast-and-axilla definition, secondary-endpoint status and pooled factorial comparison. The long-term report did not demonstrate an EFS or OS improvement; include this visibly. BrighTNess supports the broader platinum strategy, but its carboplatin-only EFS comparison is post hoc/descriptive. These limitations belong beside any positive numerical result.

For00734, do not display CALGB or GeparSixto percentages as if observed with weeklyAUC2 carboplatin followed by ddAC. A more honest top panel states **Exact-schedule comparative survival estimate not established by the cited trials**, with contextual studies below. Both schedules remain source-linked NCCP regimens; protocol availability and direct comparative evidence are different claims.

## Clinician rationale drafts

### Pembrolizumab-containing pathways

Initial perioperative systemic treatment for previously untreated, high-risk, non-metastatic TNBC. The pivotal population had T1cN1–2 orT2–4N0–2 disease and ECOG0–1. Eligibility was not restricted by PD-L1 expression. Treatment is selected through tumour biology, clinical stage, fitness, organ function and suitability for immune checkpoint inhibition; grade alone does not identify trial eligibility. The neoadjuvant sequence allows tumour response and residual disease to inform subsequent multidisciplinary planning. KEYNOTE-522 compares entire perioperative strategies and does not isolate the benefit of the postoperative pembrolizumab phase.

00857/00858 reflect the studied carboplatin schedule choices with pembrolizumab200mgq3w and three-weekly anthracycline/cyclophosphamide. 00860/00861 use NCCP-supported six-weekly pembrolizumab and dose-denseAC scheduling; explicitly mark the difference from the randomised trial. No trial proves that one carboplatin timing is superior or that these schedule variants produce identical survival.

### Platinum chemotherapy without pembrolizumab

A neoadjuvant taxane/platinum-to-anthracycline pathway for TNBC when selected by the treating team. The omission of pembrolizumab requires a documented individual reason, such as suitability, toxicity history, patient preference or access; the software must not infer that reason. Compare the stronger applicability of CALGB40603 to00348 with the less direct evidence for00734's weeklyAUC2 schedule. Consider the additional blood-count toxicity and treatment delivery burden when explaining why platinum is used. Neither lack of a statistically significant CALGB survival result nor improved pCR should be rendered as proof of equivalence or survival gain.

## Patient-safe rationale drafts (no comparative figures)

### Pembrolizumab pathway

“Your team may recommend this treatment because the tests on your cancer show a triple-negative pattern and treatment before surgery is appropriate. Chemotherapy is given in two stages, using different medicines. Pembrolizumab is an immunotherapy medicine used alongside chemotherapy and may continue after surgery. Your team's choice also takes account of your general health and whether immunotherapy is suitable for you. The operation results help your team plan the next steps. Ask which of these reasons applies to your own treatment.”

### Chemotherapy-only pathway

“Your team may recommend this combination because the tests on your cancer show a triple-negative pattern and treatment before surgery is appropriate. Carboplatin and paclitaxel are given first, followed by a different combination calledAC. This version does not include immunotherapy. Your team will explain why this particular combination and timetable suits your circumstances. Surgery and the treatment response help guide the next steps.”

Retain all material risks, consent information, urgent symptoms and non-numerical intent discussion elsewhere. These drafts explain possible selection reasons, not a personalised conclusion.

## Numerical and source checks

- 2020pCR: first602 participants; never attach1174 as its denominator. 64.8−51.2=13.6pp.
- 2022EFS:84.5−76.8=7.7pp at36months; cutoff23March2021.
- 2024OS:86.6−81.7=4.9pp at60months; its Figure1B reports95%CI0.3–9.4pp. Non-proportional OS hazards are discussed in the full paper; do not auto-attach a proportional-hazards CI to its weighted averageHR0.66.
- 2024EFS:81.2−72.2=9.0pp at60months, descriptive update.
- 2026OS:85.1−77.2=7.9pp; EFS78.3−69.8=8.5pp, both84months and same cutoff14October2025.
- CALGBpCR:54−41=13pp. Denominators221/212 belong to the pooled response-analysis contrast;443 is the overall treated population, while carboplatin-only versus pure-control treated arms had113/108. Do not interchange these.
- No direct comparative survival numbers should be imported into patient fields, PDFs or consent summaries from this file.

Source extraction is independent of application implementation. Final clinician/pharmacy review is not completed by this research task.
