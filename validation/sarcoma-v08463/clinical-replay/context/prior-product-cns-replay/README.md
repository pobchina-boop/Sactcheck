# Compatibility replay of existing product and CNS suites

The **unchanged 347-case product suite passes 347/347**, with every input, assertion, UI-collected value and recorded clinical observation identical to the previously accepted report.

The **unchanged 123-case CNS semantic suite produces 121 passed / 2 failed**. All **118 clinical/UI checks** and **three unaffected structural checks** pass, with observations identical to the accepted report. The two failures are the historical `Bounded transition preserves other clinical rules` assertions for 00596 and 00680. Those older assertions permit only the original CNS transition and therefore reject the separately authorized later calendar/context review additions. They are preserved as raw failures, not rewritten or reported as 123 passes.

A separate structural comparison confirms that the corrected 00596 and 00680 candidates preserve every pre-existing JSON field and rule, adding only the one IE calendar review and two high-dose ifosfamide review rules named in the source-owner transition manifest. These are nonnumeric consultant-review actions. The generic grade3/4 toxicity review remains an explicit local conservative policy pending clinician approval, not an NCCP dosing algorithm.

The accepted 00391/00392 pair and the other three future ifosfamide candidates are unchanged. Mifamurtide 00100 is outside these product/CNS suites; its corrected candidate is independently covered by the fresh five-suite retrospective audit. These compatibility replays add **zero new retrospective scenarios** to that audit’s 100.

`product/current-results.json` and `semantic/semantic-candidate-results.json` are the first raw replay outputs. Original scripts, manifests, pre-CNS snapshots, accepted candidate snapshots and accepted reference reports are preserved. `input-manifest.json` pins all copied dependencies and actual runtime modules; no current application protocol is loaded.

To reproduce the outcomes and independently verify the exact two authorized structural deltas:

```bash
node verify-replay.cjs --output-dir /tmp/sarcoma-prior-compatibility-new
```

Choose a new directory. Successful verification means 347/347 product checks, 121/123 raw CNS checks and the explicit two-case structural classification were reproduced. It does not turn the old raw result into 123/123. The runner needs Node.js only, with no application checkout or network.

No application or git changes, browser/pixel verification, clinical approval or pharmacy approval are claimed. Actual UI functions are invoked in memory with synthetic controls, as in the original accepted suites. Source/PDF/product limitations remain unchanged.
