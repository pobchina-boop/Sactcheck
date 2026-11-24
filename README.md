# SACTCheck

SACTCheck connects source-linked oncology assessment, clinical knowledge, consent, supportive care and patient information. The visible service currently focuses on solid tumours. Haematology source, data and tests are retained while that service is hidden.

## Current integration review candidate: v0.84.64

Fifteen sarcoma suites from the 18 November review packages are integrated on the cumulative AstraZeneca review branch. The original source and approval limitations are recorded in the three sarcoma scope files.

## Olaparib review candidate: v0.84.63

This olaparib update reviews two existing NCCP protocols across six treatment settings: adjuvant breast, BRCA-selected prostate, first-line ovarian maintenance, relapsed ovarian maintenance, pancreatic maintenance, and olaparib with bevacizumab. Breast and prostate retain their existing route origins; the other four patient routes are newly authored. Treatment duration, eligibility, monitoring and individual-drug actions remain specific to the selected setting.

The scope covers clinical assessment and its handover, clinician knowledge, supportive-care plans, agent-specific consent, patient portals, anatomical symptom explanations, reusable records, wallet cards, three-page guides and full handbooks. Videos are unchanged. Source reconciliation, exact migrations and review evidence are under `validation/olaparib-v08463/`; run `npm run test:olaparib` for the scoped software gate.

The authoring base is the unmerged Enhertu review commit `159532b7cd04238588804a504fff5427ce24a057`, which includes production main `f3b923b247b5663b2bd90b2ffb352fccc5a347ea`. The cumulative manual package preserves those pending Enhertu changes. This is a review candidate, not a deployed release or completed independent clinical/pharmacy approval. The final handoff records actual source-retrieval, software, PDF, browser and device limitations separately.

Manual ZIP members are repository-relative at the archive root. Preparing or applying the files does not commit, push or deploy the site.

## Historical manual update: v0.84.61

This review update follows the saved v0.84.60 working state, authenticated by its complete manifest and migration chain anchored to actual v0.84.59 Git commit `c01f1a2b236afced0c3ebfdb6b6ff864e58e7d4c`. It adds four GIST service routes: 00335, 00325/gist, 00719/gist and 00244/gist, while preserving the existing 00244 colorectal patient service. The planned fifth item, pazopanib 00445, remains blocked by its unavailable current source. A fresh retrospective audit covers the preceding five suites: 00500, 00391, 00392, 00501 and 00511.

The scope includes clinical decision rules, supportive workflows, generic and agent-specific consent information, clinical knowledge and patient companions. Current scope, source evidence, test results and explicit file migrations are in `validation/sarcoma-v08461/`. Automated checks and source reconciliation support review; independent clinical and oncology-pharmacy acceptance remain pending. Browser checks and the full historical Git gate have separately recorded environment blocks.

Manual update archives contain repository-relative files directly at the archive root. Extract or copy their contents into the Sactcheck repository root; there is no enclosing `UPDATE/` directory. Evidence and installation instructions are packaged separately. Preparing the files does not commit, push or deploy the site.

## Historical manual update: v0.84.44

This cumulative package replaces the unpublished v0.84.43 update and installs directly over v0.84.42 at commit `67aaa3579794278074478b3f6cce4e57c803e4db`.

The update applies a consistent clinical workflow and shared SACTCheck patient design across 228 authored treatment routes representing 199 regimen codes. It consolidates the full handbooks, keeps the concise patient packs separate, adds labelled investigation and molecular graphics, explains abbreviations at first use, and independently revises patient material with suitable openly accessible supporting sources. Clinical decision rules remain at their existing v0.84.42 release.

- Installation: `INSTALL_v0.84.44.md`
- Release details: `RELEASE_v0.84.44.md`
- Proposed commit text: `COMMIT_MESSAGE_v08444.txt`
- Current design and generation rules: `PATIENT_DESIGN_STANDARD.md`
- Exact scope, source provenance and verification: `validation/patient-design-v08444/`

The ZIP contains the complete source and generated patient PDFs. Preparing the package does not commit, push or deploy the site. Historical release notes and audit reports remain in the repository as labelled evidence of those earlier versions.

## Development and publication

Run `npm run test:ci` for the repository's software gates. Run `npm run patient:ui` after intentional patient HTML generation and `npm run patient:design:check` to detect presentation drift. Keep full Git history: preservation tests authenticate historical baseline objects as well as current file hashes.

Use the current staged PDF builders and independent verifiers described in `PATIENT_DESIGN_STANDARD.md`. Review clinical content, anatomy, wallet and QR dimensions, pagination and canonical/download mirrors before publishing generated assets. Read the release report for the exact tested runtime and any browser or device limits.

## Clinical governance

SACTCheck supports clinical decisions and is not an autonomous prescribing system. Protocol-level dose derivation does not calculate a patient-specific final prescription. Automated software and document checks are separate from independent clinical, oncology-pharmacy and patient review. Verify treatment decisions against the current official NCCP regimen, local policy, the authorised prescribing system and clinical judgement.
