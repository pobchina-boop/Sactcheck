# v0.84.64 installed clinical replay acceptance

The installed five protocols reproduce every one of the 1,490 accepted engine/dose observations. The exact original → clinical fixes → product/CNS → 40 grading definitions → integration metadata chain is authenticated, with true original application bytes used for author provenance assertions.

| Check | Result |
| --- | --- |
| Original author snapshot | 1,283/1,283 |
| Current unchanged author scripts | 1,269 pass / 16 fail / 1,285 rows |
| Current unchanged independent scripts | 225/225 |
| Separate current acceptance contract | 32/32 (23 historical inputs, 9 new controls) |
| Direct sarcoma legacy library | 25 protocols / 1,312 inputs / 1,499 rules / 1,013 assessed rule-linked fields |

The 16 raw historical failures remain failed: 13 old broad-neurological-as-CNS rule expectations and three incomplete finite-fixture coverage assertions. Two added coverage failure rows explain 1,285 versus the original 1,283. These are not new patient scenarios or an all-pass author result.

All 872 original-to-product/CNS observation deltas and ten dynamically generated demo-input transitions remain archived. Forty accepted grading definitions preserve exact clinical/dose traces. The unchanged historical traces actually trigger 496/523 rules; nine branches per ifosfamide suite remain unobserved there. IVADo's old coverage accumulator also misses two rules already seen before an assertion abort. Retained product347/CNS123 prior-stage evidence is not rerun or counted as new.

`final-integrated-acceptance.json` is the current record. The older ADJUDICATION.md pending-review sentence is historical; the separate hash-pinned independent ACCEPTANCE.json records its accepted status. No raw expectation or report is overwritten.

Run `node tools/check-sarcoma-clinical-v08464.cjs` and `node tools/check-sarcoma-independent-v08464.cjs` from the repository. Set SACTCHECK_V64_REPLAY_OUTPUT to a new, empty directory to retain fresh reports and logs. The runners refuse to overwrite an existing nonempty evidence directory. Current Node24.22.1 was tested; Node20 execution is unverified. Only temporary paths, top-level run times, exact authenticated protocol fingerprints and Node-owned diagnostic frames are normalized; clinical outputs and authored script lines stay exact.

Browser/full historical CI, current PDF binaries/source-table pixels, deployment, device checks and independent oncology/pharmacy approval remain outside this software acceptance. No clinical prescribing approval is implied.
