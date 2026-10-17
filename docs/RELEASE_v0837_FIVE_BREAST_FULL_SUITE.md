# SACTCheck v0.83.7 — five breast suites and longitudinal maps

Base: pushed v0.83.6, commit `2c0f2a5965bc20be682eeb7309cecd52e1eac427`. Prepared 17 October 2026.

| NCCP | Regimen | Source version | Why this pathway |
| --- | --- | --- | --- |
| 00722 | TCHP | 2 | HER2-positive neoadjuvant treatment, surgery and postoperative handover |
| 00857 | Pembrolizumab + carboplatin/weekly paclitaxel → AC | 3 | Triple-negative perioperative pathway with two chemotherapy phases and postoperative pembrolizumab |
| 00619 | Adjuvant abemaciclib + endocrine therapy | 4a | High-risk HR-positive/HER2-negative early disease, two years of CDK4/6 treatment and longer endocrine care |
| 00726 | Pertuzumab + trastuzumab maintenance | 3a | HER2-positive metastatic maintenance with ongoing cardiac and response monitoring |
| 00525 | Metastatic ribociclib + endocrine therapy | 6 | HR-positive/HER2-negative advanced disease with early ECG/blood checks and ongoing response review |

## What is included

All five have revised clinical decision rules, source-linked clinician knowledge/evidence, complete patient references, date-free cycle graphs, eight symptom locations, practical oral or venous-access guidance, consent discussion/generation, supportive-care review and source-supported sustainability metadata. Each includes seven PDFs: two-page guide, one-page consent aid, five-page passport, contact card, logistics guide, supportive-care guide and three-page longitudinal map. Compatibility routes carry identical PDFs.

The five-drug pembrolizumab passport uses phase-specific recording pages. The four recording pages are reusable templates, not a claim that treatment has only four cycles. The chemotherapy phases, surgery and postoperative pembrolizumab remain distinct.

Breast library filters combine treatment setting and receptor context, with a shortcut to the five complete suites. Maintenance remains a phase within its disease setting. The HR-positive/HER2-positive filter also includes HER2-positive regimens that do not restrict hormone-receptor status. General chemotherapy is not assigned a fabricated receptor eligibility. The remaining catalogue entries are navigation classifications, not newly audited clinical pathways.

The shared longitudinal definitions power patient portals, references, standalone print maps and clinician knowledge. Lanes explain systemic therapy, surgery, radiotherapy, bloods, cardiac checks, imaging and bone health where appropriate. Relative stages require no patient dates. The content distinguishes conditional tests, response assessment and surveillance, and shows treatment overlap only where appropriate to the individual plan. It does not claim an appointment has been ordered, booked or completed.

Card duration metadata now distinguishes the six-cycle TCHP course, the multiphase pembrolizumab pathway, continuous abemaciclib for up to two years, and ongoing metastatic therapy. Abemaciclib review blocks do not imply a tablet holiday; ribociclib retains its three-weeks-on/one-week-off schedule with a separate endocrine plan.

The knowledge base is updated for every regimen. Existing interaction, administration and other shared services remain connected. Clinical validation remains pending; sustainability travel and environmental totals remain unquantified.

## Audit findings and declared clinical questions

- **00722:** corrected blood-count boundaries, added explicit review for source equality/decimal gaps and missing recovery/strategy information, separated baseline and on-treatment cardiac criteria, and addressed neuropathy and antibody reloading. Source wording about delaying all medicines versus continuing trastuzumab in some hepatic circumstances remains a review question.
- **00857:** preserved the exact NCCP phase/day schedules, repaired phase/component gating, added organ-specific immune toxicity rules and postoperative exclusions, and made renal/hepatic gaps explicit. Immune toxicity entered on a weekly paclitaxel-only visit prompts senior review. The source's legacy CTCAE terminology is identified; educational CTCAE v5 descriptors do not replace source-specific grading.
- **00619:** rebuilt baseline/ongoing cytopenia, diarrhoea-duration, growth-factor recovery, liver injury, VTE, lung toxicity and hepatic-frequency rules. Adjuvant high-risk eligibility and treatment timing are explicit; Oncotype is not a replacement criterion.
- **00525:** covered the missing QTcF 480–500 ms interval, stopped numeric restart doses during active interruption, and corrected liver, lung and tablet-strength handling. NCCP v6 and the current UK manufacturer SmPC differ on first metastatic QT prolongation restart dosing; the source difference is shown and restart needs review. NCCP indication/eligibility wording and the ILD table also require reconciliation.
- **00726:** kept metastatic maintenance separate from adjuvant continuation after TCHP, used its own LVEF thresholds, and addressed heart failure, infusion reactions and reloading after a treatment gap. Reduced-frequency cardiac surveillance is a selected guideline option for specialist agreement, not an automatic override of NCCP monitoring.

NCCP PDFs were reviewed through official web-extracted text and page/table references; direct binary requests were blocked. Original file identity and complete visual table verification therefore remain limitations. Trial evidence is tied to the studied population and whole strategy where applicable, including CLEOPATRA induction plus maintenance rather than a maintenance-only benefit claim.

See `../validation/breast-v0837/VALIDATION.md`, `AUDIT_RESULTS.html` and `source-map.json` for observed checks and source details. Independent consultant, oncology-pharmacy and patient/PPI review remain pending. Passing software tests is not clinical authorisation or a measured clinical accuracy percentage.

## Apply and review

Merge the drop-in contents over the stated v0.83.6 base, preserve newer local edits if present, and run `npm run test:ci` before committing and pushing. All generated patient resources are included. No commit, push or deployment was performed by this task.

The registry now contains 36 protected patient pipelines: three breast suites upgraded and two added. All 31 other previously protected packages retain their base hashes.

For a first review, use **00857** to see the full perioperative sequence and **00619** for longitudinal oral treatment and bone-health context. The future operational scheduling and genomic-score work is saved in `BREAST_LONGITUDINAL_AND_GENOMIC_ROADMAP.md`; Oncotype triage is not activated.
