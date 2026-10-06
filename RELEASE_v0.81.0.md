# SACTCheck v0.81.0 - Architecture Consolidation and Reliability Release

## Purpose

v0.81.0 is a stability/architecture release. It does not change deterministic NCCP treatment thresholds, dose rules or assessment decisions. It converts lessons from the v0.80.x regressions into explicit runtime ownership and release gates.

## Core changes

- Adds one canonical patient-asset registry for all 13 dedicated patient pipelines.
- Makes dedicated static patient guides and passports authoritative over legacy dynamic fallback rendering.
- Prevents a dedicated Patient Guide action from opening the old `about:blank` generic renderer.
- Routes dedicated Treatment Passport actions to the protected static passport PDFs.
- Demotes `/docs/patient/<code>/` HTML to compatibility redirects while preserving byte-identical PDF compatibility copies.
- Adds a protected SHA-256/size manifest for canonical patient assets.
- Retains the approved 00568 pembrolizumab/pemetrexed/carboplatin and 00831 atezolizumab/bevacizumab anatomy formats without regenerating those PDFs.
- Adds a release-scoped protocol/data cache, in-flight request de-duplication and protocol prewarming to reduce intermittent landing-page stalls and repeated network load.
- Replaces staged card-control visibility with atomic card action hydration.
- Makes the emetogenic traffic light the canonical entry point to the printable regimen-derived antiemetic/supportive-care PDF.
- Keeps workflow data schema version `0.78.0` independent from the public app release.
- Restores the stable `data/app-release.json` schema (`release == version`) that the deployment gate expects.
- Expands 404/compatibility routing to all 13 patient pipelines.
- Runs a release architecture gate at the start of the GitHub Pages workflow, before the long regression suite.
- Adds a repeatable whole-system structural health audit.

## Dedicated patient pipelines protected in this release

00209, 00222, 00317, 00318, 00382, 00568, 00569, 00619, 00713, 00714, 00722, 00831, 00857.

## Important version separation

- Public application release: **0.81.0**
- Protected patient-content asset release: **0.80.4**
- Workflow-data contract: **0.78.0**
- Knowledge module: **0.68.0**
- Clinical-validation module: **0.68.0**
- Change-tracker module: **0.62.1**

Keeping these concepts separate prevents a public app version bump from forcing unrelated data/content layers to impersonate the same version.

## Clinical boundary

This release changes routing, runtime orchestration, caching, presentation stability and release verification. It does not authorise clinical use and does not change deterministic clinical protocol JSON. Current NCCP sources, local policy, formal consent, prescribing/pharmacy review and independent clinical judgement remain authoritative.
