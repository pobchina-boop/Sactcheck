# SACTCheck v0.48.1 — protocol-loading stability and project information

## Purpose

This release stabilises the public feasibility-study website after custom-domain deployment and gives first-time users a clearer explanation of what SACTCheck is, why it is being developed and what the hypothetical-scenario evaluation is intended to measure.

## Protocol-loading changes

- Limits simultaneous protocol JSON requests to eight concurrent downloads rather than requesting the complete 361-protocol library at once.
- Retries transient network and hosting responses, including HTTP 503, using bounded exponential backoff.
- Adds cache-busting only to retry requests.
- Allows the successfully loaded library to remain usable if an individual protocol file is temporarily unavailable.
- Replaces the large technical red banner with a compact amber partial-availability notice and a retry action.
- Retains a clear fatal error state only when the library cannot load at all.
- Exposes a read-only protocol-load status object for testing and future monitoring.

## Opening-page changes

- Adds a dedicated “What SACTCheck is, and why it is being developed” section.
- Explains the tool’s function, the practical day-ward problem it aims to address and the purpose of the feasibility evaluation.
- Adds a concise four-step assessment workflow.
- Hides the iPhone file-preview warning when the application is already open through a normal HTTP or HTTPS web address.

## Clinical-content impact

- No protocol JSON files changed.
- No clinical thresholds, assessment rules, treatment recommendations or NCCP source links changed.
- The release affects loading resilience and explanatory presentation only.
