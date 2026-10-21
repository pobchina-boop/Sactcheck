# SACTCheck v0.84.15

Five existing Phesgo full-service suites receive the retrospective rationale, evidence and source-audit treatment:

| NCCP | Suite | Setting |
| --- | --- | --- |
| 00785 | Phesgo maintenance | Advanced disease after chemotherapy |
| 00796 | Phesgo + docetaxel | Advanced disease |
| 00797 | Phesgo + weekly paclitaxel | Advanced disease; docetaxel alternative under the NCCP indication |
| 00789 | TCHP with Phesgo | Neoadjuvant |
| 00790 | TRAIN-2 with Phesgo | Neoadjuvant |

This is a retrospective upgrade of five existing suites, not five new authored cards. There remain 79 authored suites, with 16 reviewed for the newer rationale/evidence standard and 63 in that retrospective queue. These counts describe content coverage, not clinical approval.

## Changes

- Treatment-selection rationale now states the indication, line, relevant disease/health factors and alternatives in the clinician knowledge base. Patient references explain the reason for treatment in plain language.
- Nine clinician endpoint cards distinguish trial population, comparator, endpoint definition, analysis maturity and applicability. Numerical efficacy stays out of patient pages, consent aids and supportive scripts.
- The assessment rules distinguish initiation from ongoing cardiac measurements; clarify invalid or missing context; and respond to current Phesgo reactions. Source-specific renal, postoperative and companion-drug details are corrected.
- The two neoadjuvant maps place the first 12-week echo during chemotherapy, around cycle 5 if uninterrupted. Surgery does not reset cardiac monitoring. Postoperative blood tests and supportive care follow the selected medicine.
- Response imaging is shown as an MDT-selected assessment rather than automatically due alongside the week-12 echo. Metastatic response-review guidance remains distinct from early-breast surveillance.
- TRAIN-2 retains separate Day 1 carboplatin and Day 8 paclitaxel supportive scripts. The postoperative transition asks for the selected regimen; minimal emetic risk is not assumed for an unknown antibody-drug conjugate.
- Agent-specific body maps, injection/observation logistics, consent aids, guides, passports, treatment cards and date-free timelines are retained and regenerated.
- The cumulative package restores the v0.84.14 existing-file replacements absent from the observed GitHub tree, including the collapsed Patient platform menu.

## What to review

Search 00790: open Clinic workflow, the clinician knowledge base, the patient whole-treatment map and the supportive-care selector. Compare Day 1, Day 8 and postoperative transition.

Search 00785: review the antibody-only body map and consent aid, and the clinician explanation that CLEOPATRA does not isolate maintenance benefit.

Search 00789: confirm that the first routine echo appears during neoadjuvant treatment and later checks follow the selected postoperative medicine.

The milestone maps explain expected timing; they do not order tests, book appointments, track completion or send reminders. Independent oncology/pharmacy and patient/PPI review remains pending.
