# SACTCheck GitHub security-hardening validation

## Baseline

SACTCheck v0.48.0 feasibility-study source build.

## Controls added

- Read-only pull-request validation workflow.
- Separate minimum-permission GitHub Pages deployment workflow.
- Legacy write-capable self-pushing workflow retired.
- Full protocol regeneration and clean-diff check before merge/deployment.
- Complete historical regression suite before deployment.
- Allowlisted `_site` production build.
- Repository secret/key filename and token-pattern checks.
- Public-site artefact validation.
- CodeQL JavaScript analysis workflow.
- Weekly Dependabot checks for GitHub Actions.
- Security policy, pull-request checklist and structured issue forms.
- Ruleset, Actions-permission, release-tag and security-feature setup guide.

## Results

- Repository security scan: passed.
- Protocol catalogue regeneration: passed.
- Complete historical regression suite: passed.
- Deployable Pages build: passed.
- Deployable-site safety validation: passed.
- Canonical protocol count: 361.
- Protocol JSON files compared with baseline: 382.
- Protocol JSON files changed: 0.
- Clinical decision rules changed: 0.

## Deployment boundary

The production Pages artefact is generated from an allowlist. It includes only runtime web assets, study documentation and protocol JSON files. It excludes Git metadata, GitHub workflows, tests, tools, package metadata and repository security documents.

## Manual GitHub settings still required

Repository rulesets, account 2FA, Actions restrictions, security-feature enablement, private vulnerability reporting and the `github-pages` environment branch restriction must be enabled in the GitHub interface by the repository owner. See `GITHUB_SECURITY_HARDENING_GUIDE.md`.
