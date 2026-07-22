# SACTCheck v0.36.11 — Breast Gold-Standard Remediation Batch 8

## Remediated protocols
- NCCP 00794 Sacituzumab govitecan
- NCCP 00414 Palbociclib
- NCCP 00525 Ribociclib (metastatic)
- NCCP 00619 Abemaciclib (adjuvant)
- NCCP 00892 Ribociclib (adjuvant)

## Platform changes
- Added protocol-specific renal-band selectors where renal decisions are categorical.
- Replaced bare CTCAE grade labels with toxicity-specific definitions and assessment guidance.
- Added treatment-class, route, cytotoxicity and treatment-context metadata.
- Added regimen-appropriate supportive-care and antiemetic scripts through the central supportive-care assets.
- Corrected the previously corrupted NCCP 00892 file and restored it as a breast-specific adjuvant ribociclib protocol.

All encodings remain prototypes pending consultant and oncology-pharmacy validation.
