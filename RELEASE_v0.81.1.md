# SACTCheck v0.81.1 - patient-guide print fidelity and deployment hotfix

This corrective release intentionally avoids changing deterministic NCCP assessment rules.

## Fixed
- Updates the historical v0.57 regression to test canonical patient routing in the v0.81 central patient-asset registry rather than the retired route string in patient-support-v0750.js.
- Embeds connector lines directly in all 13 dedicated anatomy panels so browser/print/PDF output no longer depends on JavaScript timing.
- Restores medicine-specific toxicity summaries to page 2 of every distilled patient guide, above the shared/general treatment-effects and urgent-call sections.
- Rebalances page 2 to remove the large blank region and give clear spacing between the urgent-call and consent-support sections.
- Rebuilds all 13 guides as two-page A4 PDFs from the deterministic static HTML.
- Adds higher-resolution QR assets pointing only to https://sactcheck.com/patient/<code>/.
- Keeps /docs/patient/ as compatibility only.
- Makes the v0.81 architecture gate patch-version tolerant while retaining the same architectural invariants.
