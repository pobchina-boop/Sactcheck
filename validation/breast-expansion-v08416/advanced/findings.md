# Advanced HER2 audit — v0.84.16

Three candidate protocols are under `proposed/`; original snapshots are under `baseline/`. Live protocol files were not edited by this audit. The audit is source/software reconciliation, with independent oncology/pharmacy approval still pending.

The material corrections are concentrated in NCCP 00217: a wrong platelet threshold (100 rather than 75), missing grade-2 interruption and recurrence actions, liver-grade proxies in place of precise ULN thresholds, absent DPD/brivudine exclusions, unsupported QTc 450 ms and LVEF 50% cutoffs, and missing component-specific toxicity-delay/pulmonary/liver rules. Numeric CrCl remains distinct from indexed eGFR. Ambiguous hepatic context is sent for review, with no automatic dose.

For 00204 and 00507, initiation LVEF now uses the current reading even when a second baseline field was not entered. An old baseline no longer automatically holds ongoing treatment. Missing/invalid phase or assessment stage remains unresolved. Current infusion reactions receive active management, and the distinct source cardiac and ANC thresholds remain distinct. The pre-existing hepatic/neuropathy source ambiguities are retained explicitly.

`content-source-matrix.json` contains indication, treatment sequence, food, administration, monitoring and supportive-care facts with page attribution. The current EMA Tyverb SmPC adds a specific ECG/QT review 1–2 weeks after initiation to baseline testing. This should be shown around cycle-1 Days 8–15. It also advises avoiding drugs that increase gastric pH; the NCCP two-hour spacing instruction should not reassure that a PPI interaction is resolved.

`source-provenance.json` records the downloaded primary-source PDF and extracted-text hashes. Original source PDFs are working evidence, not necessarily release assets. Read the current source again if maintaining this content later.

Run `node validation/breast-expansion-v08416/advanced/source-cases.cjs proposed` for the candidates, or `integrated` after the reviewed candidate changes are merged. There are 130 targeted scenarios; all candidates passed. The baseline pass rate is a regression comparison rather than an estimate of clinical accuracy.

Outstanding source uncertainties: NCCP 00204 hepatic table overlap; NCCP 00507 exactly-90 platelet overlap and neuropathy >grade-2 versus broad ≥grade-3 stop row; NCCP 00217 cross-indication Child-Pugh-C lapatinib table and source diarrhoea grading. These remain visible review decisions.
