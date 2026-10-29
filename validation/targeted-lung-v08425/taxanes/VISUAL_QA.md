# Taxane lung PDF visual review — v0.84.25

All **30 pages in 16 PDFs** were rendered with Poppler and inspected across eight contact sheets. Dense consent and supportive-care pages plus journey/benefit sections were also reviewed at full render resolution. The inspected PDF hashes and individual page coverage are in `visual-qa.json`.

**Layout and contextual checks passed:** no clipping, overlapping text, broken table cells or obscured footers observed. Docetaxel consistently identifies previously treated NSCLC, a 21-day cycle and the six-cycle maximum. Its four passport recording sheets explicitly permit extra copies and do not imply a four-cycle course. Weekly paclitaxel identifies relapsed/refractory SCLC; the four-of-four-week schedule, consultant-selected Day22 omission, off-label discussion and lack of a fixed course cap are retained. The journey explains the phaseII evidence's six-of-eight-week schedule and lack of an established comparative survival benefit. No breast efficacy or inappropriate routine echo schedule was found.

The paclitaxel treatment card now explicitly labels the six boxes: “Recording boxes — not a fixed treatment course.” The regenerated card was visually rechecked; the label is readable and no overlap or clipping was introduced.

Both guide first pages were rechecked after connector layering was corrected. All six docetaxel and five paclitaxel connectors are visible, terminate at their matching numbered markers and leave the symptom text and urgent-action panels readable. All 30 final pages were rendered again: these three changed pages were visually inspected at 2200px, and the other 27 pages were pixel-identical to the previously reviewed renders. `visual-qa.json` now records the final PDF hashes and render paths. **No unresolved visual QA observations remain.**

This is software/document QA, not independent clinical, pharmacy or PPI validation. Existing governance restrictions remain.
