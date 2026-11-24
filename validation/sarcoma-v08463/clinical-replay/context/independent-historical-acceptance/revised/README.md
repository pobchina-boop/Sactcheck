# Final independent historical acceptance

**Accepted narrowly: 20/20 declared-input contract checks and14/14 exact full-observation matches to the frozen historical ledger.** The unchanged source-owner clinical assertions pass. Independent checks confirm no numerical dose at any action level, no whole-patient clearance and no ifosfamide-specific hold passed to etoposide.

All14 historical patient inputs remain unchanged. Three high-dose ifosfamide control inputs explicitly remove an ignored, undeclared cycle_day key. All20 actual clinical observations are identical before and after that control correction. The three IE controls intentionally supply Day1 as well as product/laboratory/unit data: they reconcile both calendar and product context, not a single-variable product experiment. The preliminary review remains preserved in the parent folder and is superseded by this revision.

Source interpretation retains IE severe-neurological-event review/rechallenge versus the separate high-dose source grade3-or-higher discontinuation rule. Missing localisation and missing product/laboratory/unit holds remain conservative reconciliation policies. They are not new universal NCCP dose thresholds. Renal review and contradictory-band findings remain present even after supplied-product checks are satisfied.

Pinned source-owner contract:7615b2fe3a4a1fc816ca121fe1f02758bb1c3517cd32656efbbc5122b97659f9. Pinned source adjudication:84f24d5c0d1eaf726740ca4bdbbe3432d1f157d709afd44163356a3dc11ef0b4. Pinned ledger:16880765624b9ac924bab1744d97641c326ca511c2f5676f8a0aaf5169ae6c29. Exact candidate and runtime hashes are retained in input-manifest.json and independent-verification.json.

Historical raw639/650 author,191/197 independent and121/123 CNS-semantic outcomes remain preserved. Old finite coverage and old CNS-only structural assertions are not relabelled as passes. Combined current rule coverage remains separate source-owner evidence.

Reproduce with Node.js and a new output filename:

```bash
node adjudicated-prior-contract.cjs new-contract-result.json
node verify-independent-acceptance.cjs new-independent-verification.json
```

One verifier-only object-key-order comparison error was caught, preserved and corrected; verifier-fixture-correction.json documents it. It changed no clinical input, expectation or observation.

This is hash-bound software acceptance of the stated delta only. No application or git writes were made; application replay remains pending. Clinical approval and pharmacy approval are false. Extracted-text source captures do not establish original PDF binary or visual table verification.
