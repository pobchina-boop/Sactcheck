# Phesgo evidence review — v0.84.15

Checked 21 October 2026. Five clinician-only profiles are ready in `evidence-audit.json`. This is a source-study and renderer review, not clinical authorization or a validation of the entire treatment-assessment engine.

| Profile | Main evidence | Required interpretation |
| --- | --- | --- |
| 00785 maintenance | CLEOPATRA; FeDeriCa route bridge | The survival comparison covers induction plus continuation. It does not isolate maintenance benefit. |
| 00796 docetaxel | CLEOPATRA; FeDeriCa | Relevant chemotherapy backbone, but IV antibodies were studied in CLEOPATRA. |
| 00797 weekly paclitaxel | Single-arm phase II follow-up | Small cohort mixing first and second lines; no comparator or invented relative benefit. NCCP indication is narrower and explicitly unlicensed. |
| 00789 TCHP | TRYPHAENA | Breast-only ypT0/is pCR is identified correctly; no survival extrapolation or efficacy ranking of arms. |
| 00790 TRAIN-2 | Original TRAIN-2 pCR and secondary EFS reports | Official NCCP uses six cycles versus nine in the original non-anthracycline arm. This is visible before the outcome cards. Survival analysis was descriptive and underpowered. |

FeDeriCa is used to explain the subcutaneous pharmacokinetic bridge. It is not represented as a survival-equivalence or survival-superiority trial. Its primary 2021 analysis is not labelled as a current final survival analysis.

Newer primary publications inform contextual alternatives: DESTINY-Breast09 in first-line advanced disease, PATINA in HR-positive/HER2-positive maintenance, DESTINY-Breast11 before surgery and DESTINY-Breast05 for selected high-risk residual invasive disease. The profiles do not infer Irish reimbursement or recommend automatic switching. KATHERINE is retained as the established residual-disease evidence context. Newer trial benefit is not assigned to these five NCCP regimens.

The primary trial numbers are confined to `evidence_at_a_glance`. The profiles must be integrated only into the clinician knowledge workflow; they are not content for patient pages, consent documents or assessment decisions. Treatment rationale contains qualitative setting, line, fitness and alternative considerations.

## Sources and verification

Exact official PDFs were opened for NCCP 00785 v3, 00796 v4, 00797 v4, 00789 v3 and 00790 v3. `source-register.json` records the canonical primary URLs. PubMed page retrieval was incomplete for some records; the original trial abstracts were verified through the official Europe PMC bibliographic API using their exact PMID/DOI. TRAIN-2 secondary-analysis methods were checked in the full JAMA article. No trial results were sourced from informal summaries.

To regenerate profiles: `python validation/phesgo-retro-v08415/evidence/build-evidence.py`.

To check renderer compatibility: `node validation/phesgo-retro-v08415/evidence/renderer-check.cjs`. This executes the existing `js/treatment-evidence-v08413.js` renderer for all five profiles, checks supported endpoints and HTTPS sources, verifies the applicability warning appears before outcomes, and checks the important trial-specific limitations. Rendered HTML snippets and a machine-readable result are retained alongside this audit.

No application files or protocol rules were edited by this research task.
