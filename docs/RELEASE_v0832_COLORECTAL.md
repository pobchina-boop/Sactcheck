# SACTCheck v0.83.2 — colorectal full-suite batch

Base: v0.83.1, commit 4dee59eb689db8bb456e72c641869143154cb080.

| NCCP code | Regimen | Source version |
| --- | --- | --- |
| 00227 | FOLFIRI | 9 |
| 00449 | FOLFIRI + bevacizumab | 6a |
| 00446 | Modified FOLFOX-6 + bevacizumab | 7b |

The three packages connect clinical knowledge/evidence, supportive-care access, one-page consent aids, expanded patient knowledge, medicine mechanisms, regimen-specific body maps, the reference Day 1–14 graph, treatment passports and QR cards. Missing clinical inputs remain unassessed. Protocol assessment rules are unchanged.

Port/PICC and pump education covers preparation/insertion, recovery, connection, life at home, disconnection, ongoing line care and escalation. Six illustrated steps show immediately; optional details require no patient setup. A two-page printable guide is included for each new regimen and existing modified FOLFOX-6 (00209). Port needle removal and implanted-port removal are distinguished. Bevacizumab materials flag coordination of procedures and wound healing without inventing local booking arrangements.

Patient trial displays retain population and comparator limits: GERCOR sequencing for colorectal FOLFIRI; TRIBE's FOLFIRI + bevacizumab comparator arm (not a trial of adding bevacizumab); NO16966 pooled FOLFOX4/XELOX results (not an exact mFOLFOX6 estimate). The latter correctly labels median months rather than percentages and distinguishes PFS from the non-significant OS comparison. Source links were checked on 16 October 2026. NCCP defines the Irish regimen; eviQ explains supportive care and access devices.

The source-linked colorectal knowledge addendum loads before rendering the knowledge panel. Patient routes use the canonical registry, including compatibility paths and protected hashes. The reference 00568 assets and other protected patient content are preserved.

## Completion tracking

Colorectal is the selected first tissue library. Five software packages now use the expanded format: 00209, 00321, 00227, 00449 and 00446. The candidate inventory in `data/colorectal-suite-progress-v0832.json` derives from current encoded indication text and must be reconciled with the published NCCP catalogue and local pathways before declaring the tissue library complete.

## Breast reference material

Two consultant-supplied decks have been retained privately for future breast work. `docs/BREAST_PATIENT_REFERENCE_MATERIALS.md` records their use for treatment sequencing, visit logistics and CDK4/6 monitoring. Original slide decks are not published in this release. Centre-specific arrangements and clinical schedules require verification before adaptation.

## Verification

Full `npm run test:ci` release and deployable-site gates; six desktop/mobile clinic-to-patient journeys; 12 chart-style comparisons with 00568; six no-JavaScript patient pages; 15 new regimen PDFs with expected page counts; nine QR codes decoded from rendered PDFs; existing FOLFOX two-page port/pump PDF; visual review of maps, timelines, port/pump steps and printed outputs. Validation records accompany the ZIP.

Software checks are not clinical approval. Consultant, oncology-pharmacy, nursing and patient/PPI review remain pending. The retained clinical rule encodings keep their existing source-fidelity and governance status.
