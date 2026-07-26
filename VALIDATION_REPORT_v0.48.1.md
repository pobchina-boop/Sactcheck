# SACTCheck v0.48.1 validation report

## Scope

Protocol-loading resilience and opening-page project information.

## Expected defect addressed

The v0.48.0 loader requested all enabled protocol JSON files simultaneously. On a mobile connection or newly configured GitHub Pages custom domain, a transient response affecting one file could reject the complete loading operation and display a prominent technical error even though the remainder of the application was available.

## Controls added

- Bounded concurrency: 8 protocol downloads.
- Four attempts for retryable network or HTTP responses.
- Retryable statuses: 408, 425, 429, 500, 502, 503 and 504.
- Partial-success rendering and targeted retry.
- Fatal error only when zero protocol files load.
- Compact, non-technical user-facing status message.

## Clinical-content comparison

No protocol JSON, encoded clinical rule or source link was intentionally modified in this release.

## Automated verification

- JavaScript syntax validation.
- v0.48.1 source-level regression test.
- Complete historical SACTCheck test suite.
- Production Pages build and deployable-site validation.

## Results

- Complete historical and release-specific test suite passed.
- Repository security scan passed.
- Protocol index and regimen metadata build completed.
- Deployable GitHub Pages site built successfully.
- Deployable-site security validation passed.
- 361 canonical protocols indexed.
- 367 protocol JSON artefacts copied into the production site.
- Protocol directory comparison against the v0.48.0 secure baseline: no differences.
