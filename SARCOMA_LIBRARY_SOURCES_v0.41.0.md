# SACTCheck v0.41.0 — Sarcoma source inventory

Official catalogue used: NCCP Sarcoma SACT Regimens, checked 25 July 2026.

| NCCP | Version | Regimen |
|---|---:|---|
| 00100 | 6 | Mifamurtide Therapy |
| 00205 | 8 | Pegylated Liposomal DOXOrubicin 50 mg/m² — 28 day |
| 00228 | 8 | eriBULin Monotherapy |
| 00244 | 5 | Regorafenib Monotherapy |
| 00325 | 6 | SUNitinib 50 mg Therapy — 42 day |
| 00335 | 4 | Imatinib Therapy — GIST |
| 00374 | 4 | Trabectedin Monotherapy |
| 00391 | 5 | DOXOrubicin 60 mg/m² and Ifosfamide Therapy |
| 00392 | 5 | DOXOrubicin 75 mg/m² and Ifosfamide Therapy |
| 00420 | 4 | DOXOrubicin 25 mg/m²/day and CISplatin 100 mg/m² Therapy — 21 day |
| 00445 | 3 | PAZOPanib Monotherapy |
| 00462 | 4 | Pegylated Liposomal DOXOrubicin 20 mg/m² — 21 day |
| 00463 | 4 | MAP Therapy — Methotrexate, DOXOrubicin and CISplatin |
| 00500 | 3 | DOXOrubicin 75 mg/m² Monotherapy |
| 00501 | 4 | Gemcitabine and DOCEtaxel Therapy — 21 day |
| 00504 | 2 | Irinotecan and Temozolomide Therapy — 21 day |
| 00511 | 2 | Dacarbazine 1.2 g/m² Therapy — 21 day |
| 00554 | 2 | VinBLAStine and Methotrexate Therapy |
| 00596 | 2 | Ifosfamide and Etoposide (IE) Therapy |
| 00675 | 2 | IE–VAC Therapy — Two Weekly Intervals |
| 00680 | 2 | High Dose Ifosfamide Therapy — 21 day |
| 00719 | 2 | SUNitinib 50 mg Therapy — 21 day |
| 00747 | 2 | IE–VAC Therapy — Three Weekly Intervals |
| 00754 | 3 | Ifosfamide, vinCRIStine, DOXOrubicin and DACTINomycin (IVADo) Therapy |
| 00757 | 2 | vinCRIStine, Irinotecan and Temozolomide (VIT) Therapy |

Each protocol JSON contains its direct official NCCP PDF URL and version metadata. The source links are checked automatically by `tests/official-pdf-links.test.js`, while the exact inventory and selected source-specific rules are protected by `tests/sarcoma-complete-library-v0410.test.js`.
