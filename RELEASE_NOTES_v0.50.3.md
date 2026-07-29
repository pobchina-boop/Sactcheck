# SACTCheck v0.50.3 — Regimen Card Clarity

## Summary

This release improves regimen recognition and clinical form readability without changing treatment thresholds or decision logic.

## Changes

- Replaces the homepage split count `361 + 15` with the single total `376`.
- Shows the component medicines on cards for structured multi-agent regimens and recognised regimen acronyms, including CyBorD, RVD, PVD, FOLFOX, FOLFIRI, FOLFIRINOX, XELOX/CAPOX, TCHP and related combinations.
- Standardises all 15 Haematology cycle chips to the Solid Tumour format, for example `q21d`, `q28d`, `q35d` and `q42d`.
- Adds the causative medicine in parentheses to CTCAE/toxicity input labels when the existing source-linked rule encoding consistently identifies one component.
- Applies toxicity attribution across the complete Solid Tumour and Haematology library.
- Leaves multi-agent or ambiguous toxicity fields unattributed rather than overstating causality.

## Clinical boundary

The attribution layer is display-only. It does not alter rule conditions, thresholds, actions, source references, dose modifications or treatment recommendations.

All Haematology encodings remain pending independent Consultant Haematologist and haematology-pharmacy validation and are not authorised to clear treatment.
