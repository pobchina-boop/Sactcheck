# SACTCheck v0.65.0 validation report

Validation date: 15 August 2026

## Scope

This report covers the three profile knowledge base expansion and the source metadata correction identified during the Avelumab audit.

## Knowledge base checks

1. Release value is 0.65.0.
2. Knowledge base contains 24 structured regimen profiles.
3. Knowledge base contains 50 principal evidence records.
4. Knowledge base contains 30 medicine profiles.
5. Docetaxel plus prednisolone includes TAX 327 and updated survival.
6. Pembrolizumab plus axitinib includes KEYNOTE 426 and final 5 year follow up.
7. Avelumab includes JAVELIN Bladder 100, JAVELIN Merkel 200 Part A and contextual JAVELIN Merkel 200 Part B evidence.
8. First line Merkel cell evidence is explicitly prevented from being represented as an encoded NCCP 00535a prescribing pathway.

## NCCP source checks

NCCP 00546 Version 3 was checked against the current official source.

NCCP 00583 Version 3b was checked against the current official source.

NCCP 00535 Version 6b was checked against the current official source.

The Avelumab source confirms 00535a for metastatic Merkel cell carcinoma after prior chemotherapy and 00535b for urothelial carcinoma maintenance after platinum chemotherapy without progression.

## Protocol integrity comparison against v0.64.0

Protocol JSON assets in baseline: 382.

Protocol JSON assets in v0.65.0: 382.

Added protocol assets: 0.

Removed protocol assets: 0.

Changed protocol assets: 1.

Changed file:
protocols/genitourinary/00535-avelumab-monotherapy.json

Changed fields:

1. indications[0].code from 00535a to 00535b.
2. metadata.regimen_card.contexts[0].indication_id added as 00535b.
3. metadata.source_checked_date updated to 2026-08-15.
4. metadata.source_url updated to the current official NCCP PDF address.

No clinical input definition, deterministic rule, threshold, dose action, organ function pathway or treatment schedule changed.

## Automated validation

Complete npm test suite: passed.

Dedicated v0.65.0 knowledge base test: passed.

NCCP Change Tracker focused tests after source register reconciliation: passed.

Repository security check: passed, 1024 text files scanned.

Static site build: passed, 382 protocol JSON files copied.

Deployable site validation: passed.

## Governance

The new profiles remain draft knowledge content pending independent consultant oncology and oncology pharmacy review.

The current official NCCP source remains authoritative for treatment decisions.
