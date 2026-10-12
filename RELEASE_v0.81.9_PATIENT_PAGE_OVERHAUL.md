# SACTCheck v0.81.9 refinement — 00568 canonical patient regimen page overhaul

## Purpose
Make the stable QR destination `https://sactcheck.com/patient/00568/` the complete patient treatment reference itself, rather than a landing page that asks the patient to navigate again to a separate knowledge page.

## Patient journey
**2-page guide → QR / direct link → one scrollable regimen-specific page.**

The page is intentionally designed to reduce navigation and cognitive load. It behaves more like a treatment-specific reference/encyclopaedia page than a collection of widgets.

## New canonical page structure
1. Treatment at a glance — indication, NCCP identity, 21-day structure and induction/maintenance.
2. Why the combination is used — visible link to KEYNOTE-189 evidence.
3. How each medicine works — pembrolizumab, pemetrexed and carboplatin visual mechanism cards.
4. What to expect — static treatment pathway and broad symptom patterns without a day/date configurator.
5. Side effects — protected anatomy map plus medicine-specific symptom lists.
6. Monitoring and supportive care — folic acid/B12, steroids/antiemetics, blood/organ-function monitoring.
7. Urgent contact pathway — CUH Acute Oncology / weekend / overnight / emergency route.
8. Treatment Passport, SACTCard and 2-page guide.
9. Patient questions.
10. Source traceability — NCCP first, then pivotal evidence and medicine-information sources.

## Preserved assets
- existing 2-page guide PDF
- existing Treatment Passport and PDF
- existing SACTCard and PDF
- approved 00568 anatomical anchor positions
- existing canonical QR route `/patient/00568/`

## Intentionally removed from the canonical page
- phase selector
- optional Day 1 date input
- clickable Day 1–21 calendar
- requirement to open a second “Patient knowledge” page

No deterministic NCCP assessment, dose, threshold or treatment-decision rule is changed by this refinement.
