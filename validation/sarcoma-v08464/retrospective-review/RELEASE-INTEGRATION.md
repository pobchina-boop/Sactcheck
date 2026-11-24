# v0.84.64 preceding-five retrospective integration

The 100 preserved scenarios now pass against the exact installed v0.84.63 protocol JSONs and current runtime. There are exactly five retrospective suites and 100 distinct full inputs: 00420 20/20, 00463 24/24, 00100 20/20, 00596 16/16 and 00680 20/20.

`current-application-replay/current-acceptance.json` is the current application replay result. The original external-stage documents and reports retain their original `application_replay_pending` flags because those historical artifacts are immutable. The generic `raw-candidate-replay-summary.json` likewise retains its runner's external-stage wording; the current acceptance report records the actual installed-path/hash verification and completed replay.

The original final checkpoint preserves 106 files (manifest SHA256 `cf547d061bdc5e4a75579114f3f3950a7a18151c410c225a24378479020d4596`): raw 87 pass /13 fail; 89 pass /11 fail after two lexical matcher corrections; then 100/100 on the source-corrected candidates. The patient inputs and calibrated clinical assertions remain unchanged. The original six appended clinical review rules are separate from later integration provenance and grading changes.

`integration-lineage/` contains the pinned v63 installed-protocol manifest, provenance transition and grading transition. The wrapper reconstructs each installed protocol from the corrected candidate plus these exact enumerated edits and requires deep equality. All five installed JSON hashes and four runtime hashes are checked before and after execution. The MAP previous-febrile-neutropenia value correction to 0, 3 and 4 is expressly retained; this retrospective set does not newly test the separate invalid-value boundary.

Both immutable case runners execute in disposable staging. They use exact copies of the current runtime, which is byte-identical to the retained runtime, and read the actual installed protocol files. Full result objects match the corrected-candidate results except for 237 exact missing-input label occurrences from the already reviewed grading definitions. No clinical action, input, assertion, dose row or finding is exempted from comparison.

Run from the repository root:

```text
node tools/check-sarcoma-retrospective-v08464.cjs
```

To retain a new replay outside the repository:

```text
node tools/check-sarcoma-retrospective-v08464.cjs --output-dir /tmp/sarcoma-v64-retrospective-new
```

The output directory must not exist. The wrapper checks immutable source/evidence hashes, uses bounded subprocesses, retains original failures and cleans temporary staging. No network, browser or installed npm packages are required. This wrapper owns only the preceding-five retrospective gate; it does not repeat the separate v64 32-case historical compatibility review.

Clinical approval and pharmacy approval remain false. The 00680 generic grade3/4 review is the separately accepted conservative local review policy, not an NCCP dose, hold or permanent-stop algorithm. Extracted-source/PDF limitations remain unchanged. This evidence is a clinical decision and dose-model replay of synthetic cases, not new patient/PDF/browser or whole-system acceptance.
