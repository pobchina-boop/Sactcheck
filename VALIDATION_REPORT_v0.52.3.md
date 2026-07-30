# SACTCheck v0.52.3 validation report

## Defect identified

The v0.52.2 laboratory classifier used the unbounded text fragment `anc` to identify absolute-neutrophil-count fields. This also matched the letters inside `pregnancy` and `performance`, causing pregnancy and ECOG performance status to be placed in the Haematology laboratory subsection.

ECOG values were also passed through the generic CTCAE option-label helper, causing functional-performance values to display adverse-event severity descriptions.

## Correction

- Laboratory terms now use bounded identifiers and words.
- ECOG and reproductive criteria have explicit non-laboratory guards.
- ECOG has a dedicated functional-status guide.
- CTCAE guidance explicitly returns no grading guide for ECOG.
- ECOG remains under Other treatment criteria.

## Automated validation

- 381 published protocol entries validated and generated.
- 6,132 input definitions scanned.
- 739 ECOG/performance-status, pregnancy or breastfeeding fields confirmed outside laboratory groups.
- ANC, platelet, renal and hepatic positive controls remained correctly classified.
- ECOG options confirmed free of CTCAE generic severity text.
- ECOG levels 0–5 confirmed present in the explanatory guide.
- Full historical regression test suite passed.
- Security scan passed.
- Protocol publishing passed.
- GitHub Pages build passed.
- Deployable-site validation passed.

## Integrity

All clinical protocol JSON files are byte-for-byte unchanged from v0.52.2. No clinical thresholds, rule conditions, assessment recommendations or dose-modification calculations changed.
