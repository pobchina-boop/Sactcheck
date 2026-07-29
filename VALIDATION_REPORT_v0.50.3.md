# SACTCheck v0.50.3 Validation Report

## Release scope

- Catalogue protocols: 376
- Regimen cards with visible multi-agent component rows: 226
- Protocols with at least one conservative toxicity attribution: 83
- CTCAE/toxicity fields attributed to one source-linked component: 305
- Haematology protocols with standard qXd cycle metadata: 15 of 15

## Safety checks

- All 376 indexed clinical protocol JSON files remain byte-for-byte unchanged from v0.50.2.
- Attribution is derived only from existing `action.components` values in encoded rules.
- A component is displayed only when one consistent non-generic medicine is identified for that toxicity field.
- Ambiguous and multi-agent fields remain unattributed.
- No rule condition, threshold, action, dose modification, source reference or treatment recommendation was changed.

## Automated validation

- JavaScript syntax checks passed.
- Repository security check passed.
- Protocol index and card metadata build passed.
- Full historical regression suite passed.
- v0.50.3 focused tests passed.
- GitHub Pages build passed.
- Deployable-site validation passed.

## Clinical governance

Haematology encodings and supportive-care mappings remain pending independent Consultant Haematologist and haematology-pharmacy validation. SACTCheck remains decision support and is not authorised to clear treatment.
