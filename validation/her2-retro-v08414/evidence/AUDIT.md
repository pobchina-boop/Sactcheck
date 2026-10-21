# HER2 retrospective evidence audit — 0.84.14

Checked 21 October 2026. Scope: clinician treatment-selection rationale and evidence cards for NCCP 00200, 00201, 00206, 00659 and 00726. `evidence-audit.json` supplies profiles in the existing `treatment-evidence-v08413.js` renderer schema. This evidence audit is not a complete clinical decision-engine validation or clinical sign-off.

## Required display boundaries

- **00200:** HERA is an early-breast adjuvant trial. Its results must be visibly labelled **early breast only**, because NCCP 00200 also includes metastatic treatment. Do not present its benefit as a metastatic estimate.
- **00201:** Weekly trastuzumab alone has directly matching historical single-arm evidence from Cobleigh. Preserve the absence of a comparator. The survival effect in Slamon’s chemotherapy-plus-trastuzumab trial is not a monotherapy effect; it is deliberately not imported here.
- **00206:** Keep EMILIA’s 2012 primary PFS and 2017 final descriptive OS analyses separate. Do not combine the earlier OS medians with the final OS hazard ratio.
- **00659:** KATHERINE’s 2025 publication reports **final iDFS and second interim OS**, not final OS. The population has residual invasive disease after neoadjuvant therapy; it is not all adjuvant HER2-positive disease.
- **00726:** CLEOPATRA randomised the complete docetaxel/antibody induction and antibody-continuation strategy. It did not separately randomise maintenance. Its numerical effects cannot be assigned to maintenance alone or assumed identical after paclitaxel/vinorelbine induction.

Keep numerical efficacy and comparative survival content in clinician knowledge only. Patient rationale can explain purpose, sequence, response and individual selection without importing these figures. Differences in trial medians are not predictions of an individual’s additional lifespan. Hazard ratios are not absolute percentage-point benefits. Cross-trial ranking is unsupported.

## Current evidence that changes wording

Avoid universal “preferred second-line” claims for metastatic T-DM1: [DESTINY-Breast03](https://www.nature.com/articles/s41591-024-03021-7) directly compared T-DXd with T-DM1. For high-risk residual early disease, [DESTINY-Breast05](https://pubmed.ncbi.nlm.nih.gov/41370739/) now provides a direct comparison favouring T-DXd for iDFS. [DESTINY-Breast09](https://pubmed.ncbi.nlm.nih.gov/41160818/) provides newer first-line comparative PFS evidence for T-DXd plus pertuzumab. These are concise alternative-selection context, not statements of Irish reimbursement, automatic replacement of an NCCP regimen, or reasons to switch a stable maintenance patient automatically. Current local access and the patient’s treatment history require separate verification.

## Source and implementation notes

Primary NCCP PDFs, original trial publications/PubMed abstracts and investigator-institution reproductions were used. Some publisher/PMC full-text pages were inaccessible; this audit does not claim every supplement was reviewed. The final EMILIA values were checked against primary publisher/PubMed indexed text; no secondary review supplied the numerical cards. Missing single-arm follow-up or fixed-time survival rates were left unspecified rather than invented. Source URLs and publication/analysis labels accompany each endpoint.

The existing 00201 indication metadata was found to retain a 00200 indication and three-weekly description despite the weekly protocol. The official source identifies **00201a** and weekly treatment. This has been reported to the parent implementation task; this evidence-only task did not edit application metadata.

Before integration, preserve applicability text above numerical cards and source-specific analysis labels. Verify each card renders using the clinician module, while patient bundles neither load nor expose evidence figures. Numerical differences are generated from the paired source values by the existing renderer; single-arm ORR uses `result_text` with no fictional control arm.
