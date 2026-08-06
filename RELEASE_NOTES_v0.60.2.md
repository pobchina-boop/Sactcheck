# SACTCheck v0.60.2 — Landing Hero Position Fix

**Release date:** 6 August 2026  
**Type:** Cumulative interface correction release

## Purpose

v0.60.2 corrects the v0.60.1 homepage ordering defect that caused the persistent mission hero and related introductory content to appear after the regimen catalogue. The mission-led design is retained, but the working page now follows the intended product flow.

## Changes

### Corrected homepage hierarchy

- Places the persistent **Clearer regimen assessment at the point of care** hero at the top of the library screen.
- Prevents the search-first controller from moving the entire regimen catalogue ahead of the mission hero.
- Keeps the Solid Tumour/Haematology selector and relevant domain introduction immediately below the hero.

### Search remains the primary engine entry

- Places the **SACTCheck Engine** and regimen search above the clinical scenario interpreter.
- Keeps the interpreter collapsed and labelled as early development.
- Preserves the **Launch SACTCheck Engine** action, which scrolls to and focuses the regimen search field.

### Reduced page duplication

- Removes the unintended full promotional/mission block from the end of the regimen catalogue.
- Retains the fuller product rationale and feasibility explanation as optional, collapsed content within the welcome modal.
- Keeps the welcome modal as the first-visit introduction and the permanent homepage hero as the shorter persistent explanation.

## Clinical and technical boundary

- No protocol JSON files were modified.
- No thresholds, dose actions, organ-function rules, assessment-engine behaviour or knowledge-base records were changed.
- The fifteen-regimen knowledge base and library-wide organ-function reconciliation remain intact.
- Independent consultant oncology and oncology-pharmacy validation remain pending.
- The current official NCCP protocol and local clinical governance remain authoritative.
