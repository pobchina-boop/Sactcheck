# SACTCheck v0.68.0 Validation Report

Validation date: 15 August 2026

## Scope

This report records technical validation of the v0.68.0 deep audit remediation release. It is not a substitute for formal clinical validation.

## Automated test status

• Complete cumulative application test suite: passed.

• Protocol publishing validation: passed for 381 publishing cases, comprising 376 active protocols and validation fixtures.

• Deep system remediation regression suite: passed.

• Platform standardisation regression suite: passed.

• Clinical validation workspace regression suite: passed for 376 protocols and 452 tissue review contexts.

• Knowledge base regression suites: passed.

• NCCP Change Tracker regression suites: passed.

## Static integrity status

• Active protocols: 376

• Structured inputs: 6438

• Executable rules: 6272

• Missing encoding maturity: 0

• Missing input roles: 0

• Missing rule source objects: 0

• Missing rule explanations: 0

• Missing canonical protocol identifiers: 0

• Unreachable select rules: 0

• Same component exact condition action conflicts: 0

• Component specific exact condition multi action groups retained: 35

## Source fidelity sentinels

Dedicated regression tests cover the eleven high priority source reconciliations and key boundary behaviours identified during the audit.

These tests verify representative ANC, platelet, LVEF, DPD, renal, hepatic, cycle day, recurrent dose level and toxicity behaviours.

## Known residual items

• 289 active records remain legacy encoded and pending full source fidelity review.

• 38 class screening signals remain for current source review.

• 306 regimen cards retain nonblocking metadata review items.

• The first complete live NCCP source comparison remains pending.

• Persistent reader facing closed change history remains a future Change Tracker enhancement.

• Legacy hidden clinical screens remain technical and accessibility debt.

## Clinical validation boundary

All active protocols remain marked as not clinically authorised. Independent consultant oncology and oncology pharmacy validation remains pending. The current official NCCP source remains authoritative for treatment decisions.
