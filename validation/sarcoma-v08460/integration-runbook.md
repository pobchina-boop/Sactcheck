# Sarcoma v0.84.60 integration and acceptance

Base: v0.84.59, commit `c01f1a2b236afced0c3ebfdb6b6ff864e58e7d4c`, tree `9334b681add517c77a4797bf0b9ff441f4a112bb`. The pinned baseline contains all 20,819 current tracked files and derives from the frozen pre-edit manifest. The new migration records explicit changes; it does not replace or refresh any historical migration hashes.

Scope: new suites 00500, 00391, 00392, 00501 and 00511; retrospective audits 00453, 00602, 00807, 00894 and 00945. Retrospective patient documents are unchanged. Expected cumulative counts are 377 protocol records, 272 registered codes, 302 bundle routes and 310 visual routes.

## Generation order

1. Finish source reconciliation, independent adverse-case replay and patient authorship before generating their consumers. The independent review must cross treatment stage, count recovery, current toxicity and planned cycle day; an author-only case pass is not a freeze. Synchronise exact protocol IDs/versions and source status in the validation register. Only then run `npm run protocols:build`.
2. Generate only the scoped HTML routes with `SACT_SUITE_CODES=00500,00391,00392,00501,00511` for each of `node tools/build-complete-pathways.cjs`, `node tools/build-patient-knowledge.cjs` and `node tools/build-phase-support-v0838.cjs`. The complete-pathways list explicitly includes these five codes. Use the scoped presentation/publication passes and the dedicated v60 PDF tools; do not regenerate unrelated historical PDF packs.
3. Use the document agent's v60 builders and independent verifiers. Preserve the approved three-page summary, eight anatomy targets, wallet/contact card, QR, full handbook and all canonical/download mirrors. Consent verification must cover generic chemotherapy risks and every authored agent-specific risk.

## Bounded software checks

Use a fresh evidence directory for each attempt. These are run from the repository root after generated files are complete:

```bash
python3 tools/run-bounded-check.py --seconds 120 --output validation/sarcoma-v08460/logs/scoped-suite-final -- npm run test:sarcoma-v08460
python3 tools/run-bounded-check.py --seconds 60 --output validation/sarcoma-v08460/logs/previous-suite-final -- npm run test:gu-v08459
python3 tools/run-bounded-check.py --seconds 30 --output validation/sarcoma-v08460/logs/version-final -- node tests/version-consistency-v0671.test.js
python3 tools/run-bounded-check.py --seconds 60 --output validation/sarcoma-v08460/logs/security-final -- npm run security:check
python3 tools/run-bounded-check.py --seconds 120 --output validation/sarcoma-v08460/logs/pages-final -- npm run build:pages
python3 tools/run-bounded-check.py --seconds 60 --output validation/sarcoma-v08460/logs/site-final -- npm run security:site
```

The scoped suite runs current source cases, an unchanged independent 112-case replay, the five fresh retrospective audits, and release/workflow/knowledge/consent/patient integration checks. A passing automated result does not mark independent clinical or pharmacy approval.

The current environment preflight has already completed and reported **5,507 missing historical entries** at commit `c19bef57ca5ae49816ad851f2b551b76af32fa5d`. Its retained output and status are `../sarcoma60-evidence/history-preflight-01/stdout.log` and `status.json`. Full historical CI is blocked. Do not repeat the same preflight in this unchanged environment.

The platform/general regression also stops at missing historical object `a4575d67a985c97a1dfa545813a8c1a25b2ed5a2:package.json`. Its retained evidence is `logs/platform-semantic-regression-02/`. The standalone current renal semantic check and sarcoma catalogue compatibility check pass, but they do not waive that historical dependency. Keep `GIT_NO_LAZY_FETCH=1` and `GIT_TERMINAL_PROMPT=0` for any later general regression.

In a restored full checkout, before attempting the complete historical gate, run:

```bash
python3 tools/run-bounded-check.py --seconds 60 --output validation/sarcoma-v08460/logs/history-availability-final -- npm run test:history-preflight
```

This availability check disables lazy fetching and has a per-process deadline. If it reports missing historical objects, retain the failed output and mark full historical CI blocked. Do not repeatedly launch `test:ci`, download historical blobs lazily, or weaken historical assertions. In a full checkout where the preflight passes, run `npm run test:ci` with a bounded runner and fresh logs. The original historical regression commands remain in that pipeline, followed by the v60 suite and current-baseline preservation tests.

The system Chromium launch has already failed under socket restrictions. Do not repeat it in the unchanged environment. Record browser acceptance as blocked; static HTML/PDF checks are separate evidence.

The independent acceptance wrapper `node tools/check-sarcoma-independent-v08460.cjs` runs the original review script in a temporary directory against the current checkout and compares every non-timestamp result plus protocol/tool hashes to the retained report. It does not overwrite the original timestamped evidence. Directly running the copied review script with no arguments intentionally reproduces its frozen failures; use the wrapper for release acceptance. This v60 review must not be counted as a second new audit if reused for a later batch.

## Freeze, migration and packaging

Finish all source results, document reports, scope status, release notes and in-repository logs before recording final hashes:

```bash
node tools/record-sarcoma-migration-v08460.cjs
python3 tools/run-bounded-check.py --seconds 60 --output ../sarcoma-v08460-preservation-final -- npm run test:sarcoma-preservation-v08460
```

The final preservation log must be outside the repository: recording an in-repository log while verifying the hashes of every file would create a self-changing input. Include that external result in the evidence package. If an application or evidence file changes after recording, inspect the change, record a new explicit migration and rerun preservation with a new external log directory.

The migration checker rejects changes outside the five new suites and the named integration paths, protects all prior evidence, verifies both byte lengths and SHA-256 hashes, and checks all untracked additions are recorded. The v59 migration is pinned at SHA-256 `408a5504a612dcfa60ec3c36e93de60d60caa9b79096f7bde00b3fca9f8bfb8c`. Negative tests reject wrong prior hashes, modified historical evidence and edits to unchanged retrospective patient PDFs.

Produce repository-relative update archives with files directly at the archive root and separate evidence/instruction archives. Do not add an `UPDATE/` wrapper. A later batch requires a new frozen baseline and a new release-specific migration; do not mutate this batch's completed evidence snapshots. No commit, push or deployment is implied by these checks or packaging.
