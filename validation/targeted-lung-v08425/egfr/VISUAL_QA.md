# EGFR final PDF visual QA — v0.84.25

Pass. Checked 2026-10-29: all 16 PDFs and 30 pages across afatinib (00221) and dacomitinib (00565). Every page was rendered with Poppler and visually inspected through contact sheets, with full-size inspection of anatomy guides, journey maps and milestones. Final PDF SHA-256 records are in `visual-qa.json`.

- Anatomy guides: all six connector lines visibly reach their own numbered organ markers. Markers now render above the lines, leaving their numbers clear. Both pages of each final guide were rechecked after the layering correction.
- Treatment journeys: rationale and Ask / act paragraphs are visible and readable on page 3. Both monitoring tables are retained by design for completeness.
- All documents: no clipping, unintended text overlap or wrong-regimen inherited prose identified. Source versions and dates, daily continuous treatment, medicine-specific food/missed-dose instructions, monthly afatinib blood monitoring versus locally agreed regular dacomitinib monitoring, emergency advice and separate supportive-care drafts are consistent.

No remaining blocking visual defects. This is document QA, not independent clinical, pharmacy or patient/PPI approval; those review flags remain false.
