# SACTCheck v0.62.2 Release Notes

## Publication Build 1.0 source reconciliation

This release applies the findings of the first formal publication audit to the active development line while leaving the frozen v0.62.1 Publication Build 1.0 unchanged for research reproducibility.

### Clinical rule reconciliation

* Added explicit NCCP source references to ten rules that were clinically concordant but lacked rule level source objects.
* Corrected clinically material count thresholds and dose actions identified during source review.
* Removed generic haematological toxicity rules from endocrine regimens where they were not supported by the NCCP source.
* Replaced generic hepatic review prompts with source specific dose or treatment actions where NCCP guidance was explicit.
* Added treatment day specific gemcitabine logic for NCCP 00749.
* Added exact weekly paclitaxel haematological bands and duration dependent severe neutropenia handling for NCCP 00815.
* Added full intermediate CMF count bands so 75 percent dose recommendations are distinguished from treatment delay.

### Verification

* Added a dedicated Publication Build 1.0 reconciliation regression suite.
* Clarified twenty two historical software testing metadata exceptions. Eight had clear regimen specific behavioural test coverage and were corrected as stale metadata. Fourteen remain appropriately incomplete pending dedicated regimen specific behaviour testing.
* Added a new v0.62.2 protocol integrity register.
* Updated historical release tests so intentional later protocol corrections do not invalidate earlier release specific integrity assertions.
* Full continuous validation passes, including security checks, protocol build, cumulative automated tests, deployable site build and deployable site validation.

### Research boundary

The v0.62.1 Publication Build 1.0 remains the definitive first paper snapshot. This v0.62.2 release records the post audit corrective development response and should be described chronologically after the frozen snapshot rather than substituted into the original quantitative publication dataset.
