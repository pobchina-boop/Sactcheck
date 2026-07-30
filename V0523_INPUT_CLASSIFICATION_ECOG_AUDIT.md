# SACTCheck v0.52.3 input classification and ECOG audit

- Indexed protocols: **376**
- Input definitions scanned: **6132**
- ECOG/performance-status fields protected from laboratory classification: **225**
- Pregnancy/breastfeeding fields protected from laboratory classification: **514**
- Total protected fields: **739**
- Clinical protocol JSON files changed from v0.52.2: **0**
- ECOG guide covers levels **0–5** and is explicitly separated from CTCAE adverse-event grading.

## Defect mechanism

The previous laboratory classifier searched for the unbounded text fragment `anc`. This matched valid ANC fields but also matched the same letters inside words such as `pregnancy` and `performance`, causing pregnancy and ECOG performance status to appear in the Haematology laboratory group. v0.52.3 replaces substring matching with bounded laboratory terms and explicit non-laboratory guards.

## Clinical boundary

This release changes field placement and explanatory wording only. It does not change any NCCP threshold, rule condition, treatment action or protocol dose-modification result.
