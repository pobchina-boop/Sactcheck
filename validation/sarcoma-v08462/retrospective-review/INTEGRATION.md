# v0.84.62 retrospective evidence integration

Parent confirmed v0.84.61 persisted, delivered and frozen before authorising this evidence installation. Copy this complete directory to `validation/sarcoma-v08462/retrospective-review/`. Preserve all original files, including the source/runtime/protocol snapshot and original failed result. Do not change a clinical protocol to address the deferred cue as part of this handoff.

From the copied directory run:

```sh
node run-audits.cjs --current /absolute/path/to/Sactcheck --output current-replay-results.json
node verify-adjudicated-result.cjs current-replay-results.json
```

The first command deliberately exits1 if the same81/82 outcome persists. Capture this status and run the classification gate as a separate command; do not discard the first failure report or label the clinical cases82/82. The second command asserts the full result: exactly five suites and82 unique cases;81 actual passes; exactly the original00719-13 cardiac-cue mismatch; the original frozen expectations; incomplete assessment and no numerical dose; and the explicit source-adjudicated conservative-workflow classification with clinical/pharmacy approvalfalse. Any other failure or changed status fails the classification gate and requires fresh review. If the deferred cue is fixed in a later authorised release, preserve these originals and perform an explicit new adjudication rather than weakening this gate.

Release wording: **Five retrospective suites;82 fresh cases:81passed,1adjudicated conservative cardiac-review cue deferred. No demonstrated missed NCCP-mandated dose action in that mismatch.** Classification-gate success is a provenance/adjudication check, not an additional clinical case or82 clinical passes.

The portable script loads the selected application's actual clinical JSON and runtime on replay, recording their hashes. The snapshot remains reproducible without that application. Do not overwrite an existing result file; choose a new output filename if a justified rerun is needed. Retain/report source-table visual limitations and absent clinical/pharmacy approval. Original checksums describe the prepared artifact; after adding installation replay evidence, create a separately named checksum manifest for the installed directory rather than silently replacing the original manifest.
