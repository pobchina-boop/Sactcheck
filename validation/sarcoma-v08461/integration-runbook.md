# GIST v0.84.61 integration

Baseline is the saved v0.84.60 working state, not a fabricated Git commit. The exact 21,288-file manifest is pinned at SHA-256 `755e5185a4dc5c1b1f6d57f9c9249c4721c456d0a4711b528d582298206f372a`; the prior migration is pinned at `9ae29ea9052303d9207a7b9e9ac687b5de9d43e744d51df28d5e568e60cd5c7e`. Reconstruction authenticates every file through actual Git anchor `c01f1a2b236afced0c3ebfdb6b6ff864e58e7d4c` and the preceding migration chain.

New routes: 00335, 00325/gist, 00719/gist and 00244/gist. Four suites are delivered from the planned five; 00445 remains source-blocked. The 00244 CRC base profile, KB source and patient/download files remain protected. Missing/RCC context must never silently choose a GIST patient service. Current totals are 377 protocols, 275 registered codes, 306 bundle routes and 314 visual routes.

## Clinical and routing acceptance

The original 310 author and 119 independent reports remain immutable. The current replay wrappers authenticate original snapshots and explicit JSON-path transitions before executing unchanged expectations against current application files. The source-checked grading fields are enumerated separately from integration-status metadata; clinical rules are not silently refreshed. The 52 new retrospective cases cover the preceding five v60 protocols and are distinct from a replay of the older 112 independent cases.

```bash
GIT_NO_LAZY_FETCH=1 GIT_TERMINAL_PROMPT=0 python3 tools/run-bounded-check.py --seconds 180 --output /tmp/sarcoma61-final-scoped -- npm run test:sarcoma-v08461
```

Use a fresh output directory for each materially justified attempt. Package.json is frozen before PDF generation because it is a recorded source input. Any later patient/source change requires deliberate affected-document regeneration and verification.

The browser preflight already failed under socket restrictions. Full historical CI and the general platform test fail on unavailable historical Git objects with lazy fetch disabled. Those assertions remain in the pipeline. Do not repeat these checks in this unchanged environment. On a complete capable runner, run `npm run test:history-preflight` first and only proceed to `npm run test:ci` when historical objects are available. Current source extracted text was verified; original current PDF bytes and source-table visual layouts remain unverified. Patient PDF visual inspection is separate evidence.

## Freeze and preservation

Wait for final clinical, patient and document checks. Complete release notes, source/QR/PDF reports and all in-repository logs before recording the migration. Then:

```bash
node tools/record-sarcoma-migration-v08461.cjs
GIT_NO_LAZY_FETCH=1 GIT_TERMINAL_PROMPT=0 python3 tools/run-bounded-check.py --seconds 120 --output ../sarcoma61-preservation-final -- npm run test:sarcoma-preservation-v08461
```

Final preservation logs must be outside the repository, or writing the log would change a file whose hash is being verified. The migration rejects historical evidence edits, CRC patient asset changes, unapproved routes and unrecorded additions. Do not overwrite the completed v60 evidence to make v61 pass.

Package application files at repository-relative archive roots without an UPDATE wrapper. Include separate audit/install/commit text and all ignored raw logs. Publish each completed batch's download links and commit text promptly, then continue the campaign. No automatic commit, push or deployment is authorised.
