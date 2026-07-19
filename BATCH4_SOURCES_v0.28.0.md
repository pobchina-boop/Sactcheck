# SACTCheck v0.28.0 — Batch 4 source audit

All five files are encoded prototypes pending consultant and oncology-pharmacy validation. The official NCCP PDF remains the source of truth.

| NCCP code | Encoded protocol | Source version | Official PDF | Important encoded distinction |
|---|---|---:|---|---|
| 00722 | Docetaxel, carboplatin, trastuzumab and pertuzumab (TCHP) | 2 | https://healthservice.hse.ie/documents/6598/722_v2_TCHP.pdf | Separate dose-reduction and G-CSF pathways; component-specific cardiac, renal, hepatic, neuropathy and stomatitis actions. |
| 00726 | Pertuzumab and trastuzumab maintenance | 3a | https://healthservice.hse.ie/documents/6599/726_v3a_Pertuzumab_trastuzumab.pdf | No invented numerical cytotoxic count hold; cardiac and missed-dose/reloading pathways are explicit. |
| 00831 | Atezolizumab and bevacizumab for HCC | 2a | https://healthservice.hse.ie/documents/6432/831_v2a_Atezolizumab_Bevacizumab_Therapy.pdf | HCC baseline-adjusted hepatitis thresholds plus bevacizumab blood-pressure, proteinuria, bleeding and perforation pathways. |
| 00897 | Durvalumab, gemcitabine and cisplatin for biliary tract cancer | 3 | https://healthservice.hse.ie/documents/6652/897_v3_Durvalumab_Gem_Cis.pdf | Chemotherapy rules apply only in cycles 1–8; durvalumab-only maintenance retains ICI logic without chemotherapy count holds. The printed review date is 20 February 2026, so the source must be rechecked during formal clinical validation even though it remains listed in the current NCCP GI library. |
| 00558 | Pembrolizumab 400 mg monotherapy | 12b | https://healthservice.hse.ie/documents/6389/558_v12b_Pembrolizumab_400mg_monotherapy.pdf | Shared single-agent ICI model; routine FBC monitoring does not become an invented ANC/platelet treatment threshold. |

## Governance status

- Clinical status: encoded prototype pending validation.
- Publication mode: live JSON for technical testing and structured audit.
- Formal use requires source verification, consultant review, oncology-pharmacy review, boundary review, local governance and change control.
