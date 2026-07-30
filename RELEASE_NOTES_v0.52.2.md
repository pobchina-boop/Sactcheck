# SACTCheck v0.52.2 — Integrated Laboratory & Dose Modification

## Purpose

Connects the regimen assessment and Protocol Dose & Schedule workspaces so the same entered laboratory and toxicity values can identify a source-linked protocol dose action without requiring duplicate data entry.

## Assessment interface changes

- Replaces the narrow Blood thresholds block with a consolidated **Bloods and organ function** section near the top of the opened regimen engine.
- Groups regimen-relevant fields as Haematology, Renal, Hepatic, Other protocol bloods and, where applicable, Immunotherapy endocrine bloods.
- Keeps actual-result plus automatic ULN handling for bilirubin, ALT and AST.
- Moves CTCAE and other clinical toxicity inputs into a separate **Clinical toxicities** section.
- Moves pregnancy, hypersensitivity, DPD status and other non-laboratory criteria into **Other treatment criteria**.
- Displays only fields encoded for the selected regimen; omitted values remain explicitly unassessed.

## Integrated protocol dose-modification engine

- Reuses the values already entered in the assessment instead of requesting them again.
- Supports protocol percentage bands, fixed dose levels, explicit replacement doses, absolute reductions, hold/delay, omit, discontinue and contraindication outcomes.
- Resolves the governing action separately for each regimen component unless the encoded NCCP rule applies to the whole regimen.
- Keeps all simultaneously triggered actions visible while clearly identifying the most restrictive governing action.
- Converts a protocol percentage or fixed dose level into the resulting protocol dose in mg/m², mg/kg, mg or AUC when the standard protocol dose is structured.
- Shows a clear **Protocol dose modification applies** prompt and links it to the embedded Dose & Schedule panel.
- Does not silently alter a prescription or imply that a missing laboratory value permits standard dosing.

## Verified examples

- AC: an encoded 75% haematological band converts doxorubicin 60 mg/m² to 45 mg/m² and cyclophosphamide 600 mg/m² to 450 mg/m².
- AC: a renal band below 10 mL/min converts cyclophosphamide to 300 mg/m².
- AC: a simultaneous bilirubin exclusion governs doxorubicin as omit while retaining the haematological reduction as a visible secondary trigger; cyclophosphamide remains resolved independently.
- Modified FOLFOX-6: grade 2 neuropathy resolves oxaliplatin to dose level -1, 65 mg/m².
- Blank values produce no dose action and do not imply standard-dose suitability.

## Safety boundary

This release performs protocol-level dose derivation only. It does not calculate BSA, creatinine clearance, carboplatin dose from the Calvert formula, weight-based final dose, dose banding, vial rounding or a patient-specific final dose in milligrams. It contains no ONCOassist link.

All 381 clinical protocol JSON files remain byte-for-byte unchanged from v0.52.1. The new dose output is derived from the existing encoded assessment findings and explicit schedule/dose-level metadata. Independent Consultant Oncology and oncology-pharmacy source validation remains required before clinical authorisation.
