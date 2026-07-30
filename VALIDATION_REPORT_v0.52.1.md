# SACTCheck v0.52.1 validation report

## Corrective finding

Clinical interface review of v0.52.0 identified that generic assessment rules were being repeated as dose-modification cards and that protocols without structured dosing data displayed placeholder rows. This was visually cluttered and could imply that incomplete information represented a full dosing schedule.

## Corrective controls

- Generic rule-engine content is no longer read by the Dose & Schedule module.
- Placeholder dose and route text is no longer rendered.
- A complete schedule requires explicit component dose and treatment-day data.
- Partial single-component schedule data are suppressed for recognisable multi-agent regimen titles.
- A dose-level table requires explicit `dose_levels` data and displayable dose values.
- Protocols failing these gates do not display the button.

## Automated results

- Total protocols: 376
- Useful Dose & Schedule views: 82
- Complete schedule views: 77
- Genuine dose-level tables: 23
- Generic assessment rules repeated: 0
- Placeholder rows displayed: 0
- Patient-specific calculators: 0
- ONCOassist links: 0

The v0.52.1 feature-specific test verifies FOLFOX dose levels, partial combination suppression, oral olaparib dose-level formatting and hiding of the incomplete mitomycin/5-FU/radiotherapy schedule.

The complete `npm run test:ci` pipeline passed, including repository security checks, protocol index generation, all historical regression tests, Pages build and deployable-site validation.

## Clinical-content integrity

All protocol JSON files are byte-for-byte unchanged from v0.52.0. No clinical decision logic, thresholds or outputs were modified.

Independent Consultant Oncology and oncology-pharmacy validation remains required.
