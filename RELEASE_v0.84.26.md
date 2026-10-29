# SACTCheck v0.84.26

This is the second sequential overlay: apply delivered v0.84.25 first, then this release. It is not a standalone repository.

## Five new complete suites

- 00219 erlotinib
- 00220 gefitinib
- 00544 atezolizumab 1200 mg every 21 days
- 00592 atezolizumab 840 mg every 14 days
- 00593 atezolizumab 1680 mg every 28 days

## Five retrospective updates

- 00455 pembrolizumab 200 mg
- 00558 pembrolizumab 400 mg
- 00576 durvalumab 10 mg/kg every 14 days
- 00655 durvalumab 1500 mg every 28 days
- 00689 atezolizumab / carboplatin / etoposide

All ten receive source-based clinical-tool review, clinician evidence, consent, patient education, monitoring maps, phase-specific support and matching downloadable documents. Trials retain their actual populations, analyses and limitations; patient materials avoid individual survival predictions.

Erlotinib and gefitinib remain continuous oral treatments without invented cycle lengths. Atezolizumab intervals, source indications, adjuvant duration and the formulation option documented specifically in 00544 remain distinct. Legacy aliases require an explicit current indication. Shared immunotherapy patient routes guard their lung-only scope.

Pembrolizumab lab-only abnormalities do not automatically establish immune toxicity. Durvalumab alternative-cause liver logic preserves independent severe-event stops. Atezolizumab cardiac suspicion and myositis taper-failure safeguards retain source attribution. EGFR mutation criteria display outside the renal laboratory section.

## Verification

Source and release evidence is under validation/lung-next-v08426/. The release includes 83 PDFs, with matching compatibility copies and 40 decoded QR checks. Final CI and clean sequential-overlay results are recorded alongside the audits. All 4,591 patient files outside the selected scope retain their v25 hashes.

Coverage: 139 canonical authored patient records plus five separate lung contexts = 144 context suites. This is an authored-content count, not a claim of completed lung or all-indication coverage.

Independent consultant, oncology-pharmacy and patient/PPI review remains pending; clinical_use_authorised is false. This remains a feasibility evaluation build. No commit, push or deployment performed.

Final validation: 2,152/2,152 integrated source cases; 83 PDFs /153 visually reviewed pages; 40 QR checks; full 240-command CI passes after clean v24 → v25 → v26 application, including the final indication-display regression.
