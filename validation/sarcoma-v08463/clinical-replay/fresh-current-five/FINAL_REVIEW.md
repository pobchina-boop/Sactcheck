# Final external candidate replay: five retrospective suites

**All 100 unchanged calibrated scenarios pass against the corrected external v0.84.63 candidates.** Exactly five protocols are covered. Application replay is still pending; no application or git files were changed by this review.

| Evidence stage | Passed | Failed | Meaning |
|---|---:|---:|---|
|Original immutable candidate run|87|13|Includes two lexical matcher errors|
|Same candidates after two documented lexical fixture corrections|89|11|Patient inputs and clinical expectations unchanged|
|Source-adjudicated corrected candidates, same calibrated inputs and assertions|100|0|Six appended review rules resolve eleven failing scenarios|

Final per-protocol counts are 00420 **20/20**, 00463 **24/24**, 00100 **20/20**, 00596 **16/16**, and 00680 **20/20**. There are 100 distinct full inputs, with zero exact overlap against 667 prior report inputs. Prior tests, correction replays and provenance verification are not counted as new scenarios.

The source owner supplied three corrected candidates. Independent structural comparison confirmed that **all existing fields and rules are identical**, with only six additional `consultant_review` rules. Every added rule blocks numerical dose calculation and exposes a component review action. The 00420 and 00463 candidates and all four runtime modules remain unchanged.

- **00100:** three known-negative context cues now preserve diagnosis, surgical recovery and the original postoperative treatment-plan review across phases. The treatment-plan message expressly permits continuing mifamurtide after chemotherapy has finished.
- **00596:** a planned treatment or requested restart with a missing/unlisted administration day requires calendar reconciliation. The message preserves delay-aware numbering, support for doses already given and the existing Day29 count-recovery meaning. It does not infer an extra dose or reset the calendar.
- **00680:** a known-negative indication cue persists across phases. A separate generic grade3/4 cue requests a named-event review. **That generic threshold is an explicitly accepted local conservative review policy pending clinician approval; it is not an NCCP grade-specific dose, hold or permanent-stop algorithm.**

`corrected-candidate-replay/candidate-replay-summary.json` pins every before/after hash. Its `core/results.json` and `delegated/results.json` retain complete outcomes. `candidate-correction-adjudication.json` records source versus policy classifications. `correction-provenance/` preserves the source owner's exact transition manifests.

Original results, fixtures and failure reports remain untouched. `README.md` is the initial checkpoint report, deliberately retained with its initial open findings. The two maximum-course matcher corrections are in `fixture-correction-ledger.json`; no patient input or clinical rule was changed to hide a failure.

## Portable verification

With Node.js, choose a directory that does not already exist:

```bash
node verify-corrected-replay.cjs --output-dir /tmp/sarcoma-corrected-replay-new
```

The verifier checks the five pinned corrected candidate hashes, replays both audit runners with their unchanged frozen runtime and assertions, and requires exact equality to the recorded 100 successful case observations. The original 87/13 and calibrated 89/11 evidence can separately be reproduced using `verify-frozen-replay.cjs`. Neither replay needs an application checkout, browser, network or installed packages.

The complete retained source texts, source-specific ambiguity notes and accepted product/CNS limitations remain part of the evidence. Original PDF bytes, visual source tables, UI/portal/consent rendering and whole-suite behaviour were not verified here. This is software evidence from synthetic scenarios, with **clinical approval false and pharmacy approval false**. The release owner must replay the integrated application before describing these candidates as the shipped application result.
