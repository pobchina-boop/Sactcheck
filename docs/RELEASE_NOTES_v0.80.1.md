# SACTCheck v0.80.1 — patient visual grounding hotfix

## Changes
- Added regimen-specific anatomical visuals to the in-app patient guide for six dedicated portals: mFOLFOX6 (bowel plus 46-hour fluorouracil pump), pembrolizumab/pemetrexed/carboplatin (lungs), TNBC pembrolizumab regimen (breast and lymph nodes), TCHP (HER2-positive breast cancer), Lonsurf (bowel and oral treatment), and adjuvant abemaciclib/endocrine therapy (breast and ongoing tablets).
- Preserved the existing atezolizumab/bevacizumab HCC anatomy visual.
- Replaced the generic figure in the six matching standalone patient portals with regimen-focused anatomy illustrations.
- Routed QR codes and copied links for all seven dedicated portals to their published `docs/patient/<code>/` pages.
- Added cache-busting query labels for the patient-support CSS and updated app release labels to v0.80.1.
- Extended the pipeline regression check to require dedicated visual mappings before generic fallback.

## Clinical boundary
Illustrations are explanatory aids, not predictions of toxicity or substitutes for current NCCP guidance, formal consent, local emergency instructions, clinician/pharmacy review, or individual clinical judgement. Content remains a clinical-review prototype.
