# SACTCheck v0.38.0 — Complete prostate treatment library

## Release purpose

This release completes the current NCCP prostate regimen deck as fully encoded clinical decision-support prototypes. It adds protocol-specific schedules, eligibility/exclusion logic, monitoring, dose-modification pathways, CTCAE guidance, renal categories, supportive-care mappings, official NCCP PDF access and common/trade-name search aliases. No prostate card in this release is a placeholder.

## Prostate library coverage

The prostate section now contains 26 distinct current NCCP regimen protocols:

### Androgen biosynthesis / receptor pathway therapy

- NCCP 00103 — Abiraterone and prednisolone (mCRPC)
- NCCP 00577 — Abiraterone and prednisolone (mHSPC)
- NCCP 00574 — Apalutamide
- NCCP 00482 — Bicalutamide
- NCCP 00693 — Darolutamide
- NCCP 00233 — Enzalutamide
- NCCP 00830 — Relugolix

### Androgen-deprivation injections

- NCCP 00481 — Degarelix
- NCCP 00477 — Goserelin 10.8 mg every 12 weeks
- NCCP 00478 — Goserelin 3.6 mg every 28 days
- NCCP 00492 — Leuprorelin 11.25 mg every 12 weeks
- NCCP 00479 — Leuprorelin 22.5 mg every 12 weeks
- NCCP 00494 — Leuprorelin 3.75 mg every 28 days
- NCCP 00493 — Leuprorelin 30 mg every 24 weeks
- NCCP 00491 — Leuprorelin 45 mg every 24 weeks
- NCCP 00490 — Leuprorelin 7.5 mg every 28 days
- NCCP 00480 — Triptorelin 11.25 mg every 12 weeks
- NCCP 00488 — Triptorelin long-acting preparation every 24 weeks
- NCCP 00489 — Triptorelin 3 mg every 28 days

### Cytotoxic chemotherapy

- NCCP 00101 — Cabazitaxel and prednisolone
- NCCP 00546 — Docetaxel 75 mg/m² and prednisolone
- NCCP 00313 — Docetaxel 50 mg/m² every 14 days with prednisolone
- NCCP 00203 — Docetaxel 75 mg/m² every 21 days, including the prostate indications 00203b and 00203c

### Precision / specialist therapy

- NCCP 00848 — Niraparib/abiraterone (Akeega) and prednisolone
- NCCP 00588 — Olaparib tablet monotherapy, including prostate indication 00588g
- NCCP 00257 — Radium-223

## Encoding standards applied

Every newly added prostate protocol includes:

- an official HSE/NCCP PDF link and source metadata;
- treatment indication and context;
- administration schedule and dose information;
- treatment-class and catalogue-section metadata;
- encoded eligibility, exclusions and monitoring;
- independently actionable decision rules;
- single-entry partial assessment without unrelated mandatory fields;
- CTCAE Grade 0–4 explanations and practical grading guidance where grade-based rules apply;
- protocol-specific renal category selectors where renal guidance is tiered;
- supportive-care and antiemetic registry mapping;
- searchable common/trade-name aliases while retaining the official generic NCCP title.

## Additional corrections

- Upgraded NCCP 00203 as a shared Breast/Genitourinary protocol rather than creating a duplicate card.
- Retained NCCP 00588 as one shared multi-tumour protocol and made all its controls non-blocking for single-entry assessment.
- Added explicit descriptions to the olaparib febrile-neutropenia grading selector.
- Corrected the relugolix strong-inducer pathway so its temporary dose escalation is not mislabeled as a dose reduction.
- Linked oral minimal/low prostate regimens to the oral SACT supportive-care guidance rather than parenteral prescription sheets.
- Rebuilt the central emetogenic/supportive-care map and protocol index.

## Catalogue and search

- Total distinct regimen protocols: **145**
- Fully encoded prostate protocols: **26**
- Added searchable aliases including Zytiga, Erleada, Casodex, Jevtana, Nubeqa, Firmagon, Xtandi, Zoladex, Prostap, Eligard, Xofigo, Orgovyx, Decapeptyl, Akeega and Lynparza.
- The official NCCP generic regimen name remains the primary card title.

## Automated verification

- 150 protocol publishing/validation checks passed.
- Complete historical regression suite passed.
- All 145 active regimens passed the single-entry audit across 1,849 visible rule-linked inputs.
- The prostate-specific suite confirmed all 26 current NCCP prostate codes and tested 180 independently actionable prostate inputs one at a time.
- No duplicate protocol IDs or NCCP codes were introduced.
- All active protocols retain official NCCP PDF links.

## Clinical boundary

These are fully encoded software prototypes, not placeholders. “Fully encoded” means the source has been translated into structured treatment, assessment and decision-support data and has passed automated technical tests. It does not mean that formal consultant, oncology-pharmacy or hospital governance sign-off has already occurred. The official NCCP regimen and normal clinical/pharmacy checks remain authoritative during shadow validation.
