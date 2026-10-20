# SACTCheck v0.84.12 — five complete Phesgo suites

Apply over **v0.84.11**, commit `d64b3d4a1fc608d02128a1bf02bb5aef7f8ae28e`.

Extract the ZIP and copy its contents into the repository root, preserving folders and replacing matching files. Use `GITHUB_COMMIT_v0.84.12.txt` for the commit message, then commit and push. No deletions are required. This is an update with complete replacement files, not a standalone website or a patch that needs applying. The assistant has not committed, pushed or deployed it.

| NCCP | Full suite |
|---|---|
| 00785 | Phesgo metastatic maintenance |
| 00796 | Phesgo + docetaxel |
| 00797 | Phesgo + weekly paclitaxel |
| 00789 | Neoadjuvant TCHP with Phesgo |
| 00790 | Neoadjuvant TRAIN-2 with Phesgo |

Each card now connects source-reconciled treatment assessment, clinician knowledge and evidence, consent generator and printable aid, phase-specific supportive care, patient reference, date-free cycle graphics, body maps, practical injection/access guidance, longitudinal monitoring, printable guides, passports, cards and QR links. Early and metastatic pathways have separate indication/filter entries. Existing v0.84.11 branding is preserved.

The audit corrected copied TRAIN-2/docetaxel rules, incorrect indication IDs, unrelated paclitaxel indications and a 28-day schedule, duplicate Phesgo administrations, and setting-specific cardiac and dose-gap handling. Source ambiguities produce explicit review outputs. See `AUDIT_v0.84.12.md` for the detailed crosswalk and remaining decisions.

Longitudinal maps explain baseline and ongoing bloods, echoes and imaging, and how surgery, radiotherapy and endocrine/bone-health care fit around treatment. They require no dates to be entered by patients. They do not create bookings, reminders, alerts or a completed-test record.

Validation evidence is in `validation/phesgo-v08412/validation-summary.json`: 249 new source-derived engine cases; full-suite and previous-release regression checks; 45 PDFs / 80 pages; 20 QR decodes; 2,153 previously authored patient assets preserved; static build, site integrity and security checks. Print layouts were visually reviewed. The browser confirmed the maintenance body map and TRAIN-2 support selector, but the clinician catalogue timed out before a manual assessment-form walkthrough could be completed.

All five remain pending independent oncology/pharmacy approval and patient/PPI review. Passing software tests is not clinical authorisation.

For your first review, search **00790**. Check the Day 1/Day 8 distinction, three support-phase options, baseline/12-week echo milestones, and the chemotherapy → surgery/pathology → postoperative treatment map. Then inspect **00785** to confirm the simpler maintenance body map and absence of routine chemotherapy antiemetic orders. A deployed smoke test is still required after your push.
