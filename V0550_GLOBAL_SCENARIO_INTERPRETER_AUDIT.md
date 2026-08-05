# SACTCheck v0.55.0 Global Scenario Interpreter Audit

- Protocol records examined: **376**
- Scenarios tested: **7**
- Passed: **7**
- Failed: **0**
- External network calls: **0**
- Clinical assessments generated before regimen selection: **0**

| Scenario | Leading protocol | Result |
|---|---|---|
| lonsurf_bevacizumab_split | 00382 Lonsurf | Pass |
| pembro_pemetrexed_carbo | 00568 Pembrolizumab, Pemetrexed and Carboplatin AUC5 Therapy | Pass |
| carboplatin_pld | 00624 Carboplatin + pegylated liposomal doxorubicin | Pass |
| myeloma_dara_bortezomib | 00609 Dara-SC + BorDex | Pass |
| exact_nccp_code | 00382 Lonsurf | Pass |
| ambiguous_weekly_paclitaxel | 00260 AC → weekly paclitaxel | Pass |
| identifier_warning | 00382 Lonsurf | Pass |

## Safety boundary

The global interpreter performs local catalogue matching only. It requires exact regimen selection before handing the original de-identified scenario to the existing in-regimen interpreter. The deterministic protocol engine remains the sole source of any later protocol assessment.
