# SACTCheck v0.84.9

Five breast treatment suites, built on v0.84.8 (base commit `ae5362147d5ea691c5c74f6987dd369cd3a6a184`). Prepared 20 October 2026.

| NCCP | Treatment | Patient-content scope |
| --- | --- | --- |
| 00414 | Palbociclib with the prescribed endocrine partner | HR-positive, HER2-negative advanced breast cancer |
| 00322 | Everolimus + exemestane | The NCCP postmenopausal advanced breast indication |
| 00776 | Trastuzumab deruxtecan (Enhertu) | NCCP HER2-positive / HER2-low advanced breast indications and their prior-treatment requirements |
| 00794 | Sacituzumab govitecan (Trodelvy) | NCCP later-line unresectable / metastatic triple-negative breast cancer |
| 00588 | Olaparib tablets | Breast adjuvant indication 00588h only; shared assessment indications remain available |

Each suite includes source-linked assessment corrections, clinician knowledge and evidence, consent discussion and one-page aid, supportive-care review/scripts, patient portal and knowledge, date-free treatment timeline, longitudinal monitoring map, practical logistics, visual guide, reusable passport, treatment card and QR.

Monitoring separates baseline, the first cycle/month, early treatment, ongoing treatment and completion/change. ECG, echo, imaging, tumour markers and bone assessments are included according to the treatment and setting. The maps explain expected timing; they do not book appointments or track completed tests. Olaparib separates surgery, chemotherapy, radiotherapy, endocrine overlap and subsequent surveillance. Sacituzumab has separate Day 1 and Day 8 supportive-care scripts. Continuous oral treatment is not presented as an invented chemotherapy cycle.

The clinician knowledge base now renders its authored longitudinal tables. Breast setting/receptor filters and the regimen reuse inventory include this batch. Shared olaparib patient-service links and QR open an indication choice; every breast document identifies its limited scope. The accepted homepage design is retained.

## Apply this update

1. Extract `SACTCheck_v0.84.9_UPDATE.zip`.
2. Copy its contents into the existing repository root, preserving folders and replacing matching files. Upload the extracted files, not the ZIP itself.
3. Commit and push using `GITHUB_COMMIT_v0.84.9.txt`.
4. Wait for the GitHub deployment to complete, then refresh the site and confirm v0.84.9.

This is an additive update for the stated v0.84.8 base; it is not a standalone copy of the entire website. No deletions are required. This package has not been committed, pushed or deployed by the assistant.

## Review after deployment

Search for Enhertu / 00776. Open Clinic Workflow and the Patient Platform, then the monitoring map, knowledge base, consent and supportive care. The map identifies baseline and 12-week echo/MUGA timing, approximately before cycles 5 and 9 only when treatment is uninterrupted. Check sacituzumab's separate Day 1/Day 8 scripts and olaparib's indication choice. Verify the Treatment assessment engine with the supplied synthetic source cases, rather than entering real patient identifiers.

## Verification

Detailed results are in `AUDIT_v0.84.9.md` and `validation/targeted-breast-v0849/`. The batch has 669 passing source-linked checks, five integrated clinician/patient suite checks, 41 PDFs across 76 pages, and 20 successful QR decodes. All 1,934 pre-existing patient files are byte-preserved. Public build/security checks are recorded in `release-validation.json`.

Visual PDF review and automated rendering/interaction checks were completed locally. A live browser review of the deployed v0.84.9 site follows upload. Independent consultant, oncology-pharmacy and patient/PPI review remains pending; software/source reconciliation is not clinical-use authorisation.
