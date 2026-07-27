# SACTCheck v0.48.2 — CTCAE haematology education update

## Purpose

This release replaces generic CTCAE severity anchors for haematological adverse events with exact named-event grading tables and value-based educational grading. It uses CTCAE v6.0 as the default educational reference for haematology while preserving explicit CTCAE v5.0 metadata and showing a controlled v5/v6 comparison where criteria changed.

## Haematology grading added

- Neutrophil count decreased / ANC.
- Thrombocytopenia / platelet count decreased.
- Anaemia / haemoglobin decreased.
- White blood cell count decreased.
- Lymphopenia.
- Fever.
- Febrile neutropenia.
- Composite NCCP wording that combines Grade 4 neutropenia and fever.

## Educational behaviour

- Displays the complete grading table for the exact named CTCAE term.
- Calculates an educational grade from entered ANC, platelet, haemoglobin, WBC and temperature values where the numeric criteria are sufficient.
- Shows the patient-specific calculated grade directly below the input.
- Keeps fever and febrile neutropenia separate from neutrophil-count grading.
- Adds linked educational tables where an NCCP rule combines neutropenia and fever.
- Links to the official NCI CTCAE source matching the displayed version.

## Controlled CTCAE version handling

- CTCAE v6.0 is used as the default haematology education layer.
- Fields explicitly encoded with CTCAE v5.0 continue to display and calculate against v5.0.
- A v5.0 comparison is shown for ANC, platelets and lymphopenia because v6.0 materially changed those grading structures.
- The interface warns that an educational v6.0 grade must not silently redefine an NCCP action written against an earlier CTCAE version.
- Non-haematological CTCAE descriptors remain on the existing controlled v5.0 implementation pending a separate, source-by-source migration review.

## Clinical-engine impact

- No protocol JSON files changed.
- No NCCP threshold, treatment action, dose-modification rule or source link changed.
- The calculated CTCAE grade is educational and explanatory only.
- Transfusion, life-threatening consequences and other clinical qualifiers can increase the final grade beyond a value-only calculation and must still be assessed by the clinician.
