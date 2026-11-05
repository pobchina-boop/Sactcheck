# SACTCheck v0.84.33

Five new colorectal full suites: FOLFOXIRI (00555), bevacizumab/FOLFOXIRI (00783), rectal FOLFIRINOX followed by capecitabine/radiotherapy (00691), aflibercept/FOLFIRI (00238), and bevacizumab/5-FU/folinic acid (00791).

Five retrospective clinical audits: FOLFOX4 (00210), irinotecan every 21 days (00213), bevacizumab/mFOLFOX6 (00446), bevacizumab/FOLFIRI (00449), and panitumumab/FOLFIRI (00448).

The full service suite covers the assessment engine, component-specific dose actions, clinical knowledge and trial evidence, consent support, supportive-care prescriptions, treatment/monitoring maps, patient portals, detailed anatomical three-page companions, front/back wallet cards with regimen-specific OncoWiki QR codes, passports and complete printable handbooks. Only the ten scoped patient routes are regenerated; earlier patient packs remain protected by exact baseline-to-release hashes.

Clinical corrections include:

- Current FOLFOXIRI source v7, with distinct baseline and treatment-day blood counts, updated renal/hepatic pathways and occurrence-specific dose modifications.
- Separate rectal FOLFIRINOX induction and capecitabine/radiotherapy assessments, schedules, toxicity rules and supportive medicines. The six wallet stamps mean induction cycles; the five chemoradiation weeks have a separate record.
- Source-specific aflibercept recurrence rules instead of borrowed standard FOLFIRI tables. Percentage ranges and uncertain dose histories remain explicit review decisions.
- Replacement of obsolete 00791 fluorouracil organ-function rules, exact bevacizumab proteinuria/BP boundaries, source-specific GI grading and documented unlicensed-regimen consent context.
- Current-dose and recovery safeguards in the retrospective regimens; distinct initial hepatic dosing, bevacizumab stopping criteria and FOLFOX4 respiratory holds.
- Protection against the historical v0.70.0 runtime overlay overwriting newly audited 00783 clinical rules or knowledge content.
- Full grading help beside controls, correct 48-hour versus 46-hour pumps, and source-specific monitoring including weekly irinotecan blood counts and post-panitumumab electrolytes.
- One visible bilirubin result supplies both the absolute result and ULN ratio in 00783, 00691, 00238, 00449 and 00448; each drug's source thresholds remain separate.

Evidence cards distinguish metastatic, maintenance and complete perioperative strategies. No comparative survival benefit is assigned to isolated 00791 maintenance. VELOUR retains its published 95.34% OS confidence interval rather than silently labeling it 95%.

Validation passed all 266 regression/build commands, 798 source-based cases, 111 patient PDFs, 40 QR checks and 1,878 preserved reference-text blocks. Results are recorded in `validation/colorectal-v08433/FINAL-results.json`, with browser and clean-application checks alongside them. Independent clinical, oncology-pharmacy and patient/PPI review remains pending; this software release does not authorise routine clinical use.

Working colorectal coverage is 31/41 candidate contexts, with 10 remaining. This inventory includes shared-regimen colorectal contexts and is not a claim of an exhaustive national treatment catalogue.

## Apply the update

1. Start from committed v0.84.32, base commit `7963400d502f0407d3fa3a733d774db2d3f07ef6`.
2. Extract `SACTCheck-v0.84.33-update.zip`.
3. Copy the extracted contents into the repository root, retain directory paths and replace matching files. Do not upload the ZIP itself as the website update. No deletions are required.
4. Review changes and run `npm run test:ci` when using a local checkout.
5. Commit and push using the text below. This package does not itself commit, push or deploy.

## GitHub commit summary

```text
v0.84.33: add colorectal triplet/rectal suites and five clinical retrospectives
```

## GitHub commit description

```text
Add full service suites for FOLFOXIRI (00555), bevacizumab/FOLFOXIRI (00783), rectal FOLFIRINOX followed by capecitabine/RT (00691), aflibercept/FOLFIRI (00238), and bevacizumab/5-FU/folinic acid (00791).

Audit and update FOLFOX4, irinotecan q21d, bevacizumab/mFOLFOX6, bevacizumab/FOLFIRI and panitumumab/FOLFIRI. Reconcile current NCCP thresholds, organ function, recurrent toxicity, current-dose history, recovery windows and component-specific holds/stops. Update FOLFOXIRI to source v7 and preserve source ambiguities as explicit consultant-review decisions.

Separate rectal induction and chemoradiation rules, schedules and supportive medicines. Protect audited 00783 rules and evidence from the legacy runtime overlay. Restore detailed grading help, remove duplicate bilirubin entry and retain source-specific GI definitions and confidence levels.

Connect clinical assessment, knowledge/evidence, consent, supportive care, treatment/testing maps and patient tools. Preserve rich anatomical anchoring in ten three-page summaries; include regimen-specific QR wallet cards, a separate rectal phase record, passports and complete offline handbooks with the actual supportive-care sheets.

Validation: 266 regression/build commands, 798 source-based cases, 111 PDFs and 40 QR checks passed. Working colorectal coverage: 31/41 candidate contexts, 10 remaining. Source audits, browser checks and preservation evidence are included. Independent clinical, oncology-pharmacy and patient/PPI review remains pending.
```
