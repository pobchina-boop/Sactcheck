# SACTCheck v0.36.8 — Breast Gold-Standard Remediation Batch 5

This release replaces five breast catalogue placeholders with encoded decision-support prototypes:

- NCCP 00785 — Pertuzumab/trastuzumab (Phesgo®) maintenance
- NCCP 00796 — Phesgo® + docetaxel
- NCCP 00797 — Phesgo® + weekly paclitaxel
- NCCP 00798 — Phesgo® + vinorelbine
- NCCP 00605 — Talazoparib

## Clinical encoding

The Phesgo regimens now include reusable HER2 cardiac, hypersensitivity, missed-dose and organ-function pathways together with regimen-specific chemotherapy rules. Talazoparib includes haematological interruption/resumption thresholds, renal starting-dose pathways, non-haematological toxicity management, P-gp interaction handling, MDS/AML safeguards and key NCCP exclusions.

## Supportive-care integration

- Low/minimal emetogenic traffic-light mapping added for all five regimens.
- The local CUH docetaxel supportive-medication sheet is used as a regimen-specific override.
- Generic CUH low-emetogenic guidance is used for the remaining four regimens.
- The supplied CUH moderate-emetogenic PDF is now registered centrally for future mappings.

## Governance

All five remain marked as encoded prototypes pending consultant and oncology-pharmacy validation. No protocol is represented as authorised for independent clinical use.
