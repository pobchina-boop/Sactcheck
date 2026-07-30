# SACTCheck v0.52.0 validation report

## Release

Protocol Dose & Schedule

## Baseline

SACTCheck v0.51.0 Solid Tumour Reconciliation

## Structural checks

- Package version updated to 0.52.0
- New module loads before the generic assessment interface
- Dose & Schedule control is embedded inside the opened regimen engine
- The panel is hidden when structured schedule metadata are absent
- Official source links use the existing reliable same-tab navigation pattern
- No patient-specific numeric input is created by the dosing workspace
- No ONCOassist link is included

## Coverage checks

- Total indexed protocols: 376
- Protocols with structured schedule data: 328
- Protocols awaiting structured schedule metadata: 48
- Protocols with treatment-phase arrays: 65
- Protocols with structured treatment objects: 264
- Protocols with selectable dose-level groups: 30
- Protocols with encoded modification pathways: 365

## Representative regimen checks

### Modified FOLFOX-6

- q14d cycle detected
- Oxaliplatin, folinic acid, bolus 5-FU and infusional 5-FU displayed
- Four component dose-level groups detected
- Component-linked modification pathways detected

### Weekly paclitaxel

- q28d cycle detected
- Days 1, 8, 15 and 22 detected
- Starting, level −1 and level −2 protocol doses detected

### CyBorD 21 day

- q21d cycle detected
- Bortezomib, cyclophosphamide and dexamethasone displayed
- Bortezomib Days 1, 4, 8 and 11 detected

## Clinical-content integrity

All protocol JSON files were compared against v0.51.0 by SHA-256.

- Changed protocol JSON files: 0
- Added protocol JSON files: 0
- Removed protocol JSON files: 0

No treatment threshold, encoded action or decision rule was modified.

## Automated validation

The following completed successfully:

- Repository security scan
- Protocol index generation
- Regimen-card metadata generation
- Protocol-schema validation
- Full historical regression suite
- v0.52.0 feature-specific tests
- GitHub Pages production build
- Deployable-site security and integrity validation

The v0.52.0 feature test confirmed:

- 328 protocols with schedule availability
- 30 protocols with selectable dose-level groups
- 365 protocols with encoded modification pathways
- No patient-specific numeric dose inputs
- No external calculator link

## Remaining work

- Structure schedule metadata for the remaining 48 protocols
- Independently verify displayed dose and schedule metadata against the current official NCCP PDFs
- Expand explicit component dose-level tables where source data are available
- Conduct clinician usability review on desktop and iPhone
- Link the feature to the formal SACTCheck validation workbook and reviewer process

## Conclusion

The first Protocol Dose & Schedule iteration is technically integrated and regression-safe. It remains a source-linked informational and navigation feature pending independent clinical and pharmacy validation. It is not a patient-specific dose calculator or prescribing system.
