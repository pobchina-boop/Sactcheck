# SACTCheck v0.81.7 — regimen-card action hydration hotfix

This is a narrow UI reliability release on top of v0.81.6.

## What changed
- restores the complete regimen-card action row: Clinic workflow, protocol assessment, regimen information, patient guide and source actions
- updates card readiness to recognise the v0.81.5 single emetogenic Rx-script badge instead of waiting for the retired expandable antiemetic panel
- reduces the fallback hydration delay from 2.6 seconds to 0.9 seconds
- ensures a degraded optional capability can never leave the core action row permanently hidden

## What did not change
- v0.81.6 Treatment Passport content and PDFs
- v0.81.5 antiemetic PDF content/UI design
- patient portal assets
- deterministic NCCP dose, threshold or assessment logic
