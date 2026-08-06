# SACTCheck v0.60.3 — Hero Position Fix and SUNLIGHT Evidence

## Summary

This cumulative release preserves the v0.60.2 correction that places the persistent mission hero above the SACTCheck Engine and enriches the Lonsurf knowledge page with the phase 3 SUNLIGHT trial.

## SUNLIGHT evidence addition

The Lonsurf knowledge page now presents both:

- **RECOURSE**, supporting trifluridine/tipiracil monotherapy in refractory metastatic colorectal cancer; and
- **SUNLIGHT**, supporting trifluridine/tipiracil plus bevacizumab compared with trifluridine/tipiracil alone.

The SUNLIGHT record includes the study design, population, intervention, comparator, primary endpoint, publication links, median overall survival and median progression-free survival.

## Protocol boundary

The current encoded NCCP 00382 protocol remains trifluridine/tipiracil monotherapy. SUNLIGHT is therefore labelled as contextual combination evidence. This release does not create a combined trifluridine/tipiracil–bevacizumab protocol or infer dose, monitoring or treatment-clearance rules from the trial publication.

## Interface

The corrected landing sequence remains:

1. mission-led welcome modal;
2. compact persistent hero at the top of the library;
3. SACTCheck Engine search and filters;
4. collapsed early-development Clinical Scenario Interpreter;
5. regimen catalogue.

The unintended mission panel at the end of the catalogue remains removed.

## Clinical logic and protocol integrity

- No deterministic assessment rule changed.
- No organ-function rule changed.
- No protocol threshold or dose action changed.
- All 382 protocol JSON files remain byte-for-byte unchanged from v0.60.2.

## Governance

Knowledge content remains draft pending independent consultant oncology and oncology-pharmacy review. Current NCCP protocols, complete clinical assessment, local policy and independent clinical judgement remain authoritative.
