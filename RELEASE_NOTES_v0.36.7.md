# SACTCheck v0.36.7 — Technical consolidation

This release consolidates the v0.36.x platform before further protocol remediation.

## Changes

- Corrected application package version to 0.36.7.
- Added v0.36.5, v0.36.6 and v0.36.7 checks to the default regression suite.
- Upgraded the central emetogenic-risk registry into a supportive-script resolver.
- Added explicit high, moderate and low generic script records.
- Retained the moderate script as `document_not_supplied`; the application must not create or infer a local prescription sheet.
- Resolution order is protocol-specific override, explicit registry mapping, then category default.
- Unmapped protocols continue to display a grey pending state.
- Added placeholder-card and supportive-care-mapping metrics to the Protocol Health Dashboard.
- Added automated checks for local supportive PDF paths.
- Added a clean release ZIP builder that excludes `.git`, the duplicate `protocols/protocols` tree and historical packaging files.

## Clinical status

No treatment decision rules were changed in this release. Existing encoded protocols remain prototypes pending consultant and oncology-pharmacy validation.
