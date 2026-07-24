# SACTCheck v0.40.0 — Complete Lung Library

## Scope

- Completes the 59-card NCCP Lung SACT catalogue as active JSON assessment protocols.
- Adds 38 new Lung files and reconciles 21 existing/shared canonical protocols.
- Covers NSCLC, SCLC, chemoradiation, mesothelioma, immune checkpoint therapy, maintenance/later-line treatment and molecularly targeted agents.

## Platform standards

- No placeholders or draft Lung cards.
- Single-entry partial assessment for every independently actionable input.
- Missing values remain unassessed and never block a valid partial finding.
- Full CTCAE descriptions and assessment guidance beside toxicity grade selectors.
- Actual ALT, AST and bilirubin entry with automatic local ULN conversion.
- Protocol-specific CrCl/eGFR bands; exact CrCl/GFR retained for Calvert carboplatin dosing.
- Optional immunotherapy endocrine inputs only.
- Central antiemetic/supportive-care mapping, searchable generic/trade names and direct official NCCP PDFs.

## Integrity

- Corrects historical Lung metadata leakage from NCCP 00507 and 00797, which remain Breast-only.
- Rebuilds the canonical protocol index and supportive-care registry.
- Adds release-specific inventory, single-entry, CTCAE, renal, alias and tumour-site regression testing.

## Governance

This remains a decision-support prototype. The encoded clinical rules require independent consultant and oncology-pharmacy validation before formal institutional deployment.
