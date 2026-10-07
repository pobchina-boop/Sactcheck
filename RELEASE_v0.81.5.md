# SACTCheck v0.81.5 — Antiemetic script UI cleanup

This release is deliberately limited to the regimen-card antiemetic presentation.

## Changes
- removes the duplicate expandable antiemetic content box from regimen cards
- retains one emetogenic-risk control only
- restyles that single control using the larger bordered Rx-script design
- clicking the single control continues to open the existing printable regimen-derived antiemetic PDF
- suppresses CUH/local-source provenance wording from the printed supportive-care script presentation
- does not alter medicine names, doses, antiemetic risk classification, NCCP links, dose thresholds or assessment rules

## Patient content
Patient-guide/passport/SACTCard content remains at v0.81.4; this patch does not modify those assets.
