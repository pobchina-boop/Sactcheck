# Phesgo retrospective source and software audit

Checked 21 October 2026. Scope: NCCP 00785 v3, 00796 v4, 00797 v4, 00789 v3 and 00790 v3. Stable protocol identifiers are retained; the legacy 00785 identifier ending in `v3a` does not change the displayed source version 3.

## Material findings

| Area | Finding and correction |
| --- | --- |
| Cardiac context | Historical baseline values could trigger initiation rules during ongoing treatment, while a low current value entered before initiation lacked the appropriate initiation finding. Stage-specific rules now distinguish these cases. Invalid stage values receive explicit review. Independent urgent cardiac actions retain priority. |
| Reactions | Grades 1–3 Phesgo reactions lacked reaction-specific actions. Current reaction inputs now lead to interruption/assessment and appropriate review; grade 4, bronchospasm and ARDS retain permanent-discontinuation actions. |
| Incomplete context | Early-regimen current LVEF, carboplatin estimate timing/method, invalid treatment phase/day and postoperative regimen selection now receive explicit clarification rather than an apparently completed assessment. |
| Companion drugs | TCHP bilirubin delay includes the source-specified companion HER2 delay. Weekly paclitaxel advice retains source qualifiers about subsequent reduction and G-CSF consideration, without inventing a restart dose. |
| Copied wording | Advanced allergy advice no longer names absent carboplatin; weekly-paclitaxel neuropathy advice no longer refers to TRAIN-2. Antibody-only continuation notes no longer imply chemotherapy follows. |
| Longitudinal map | In the two early-breast pathways, the cycle-5/12-week echo incorrectly sat under surgery. It is now in neoadjuvant treatment. Postoperative blood cells no longer copy the preceding taxane-day schedule. |
| Postoperative support | An unknown postoperative medicine must not inherit the minimal-risk antibody-only script. The transition now requires the selected regimen and explicitly distinguishes antibody-drug conjugates. |

The current NCCP printed gaps/overlaps in selected haematology and hepatic rows remain explicit consultant-review cases. No unsupported threshold or restart dose is invented. The neoadjuvant and metastatic cardiac thresholds remain distinct. Six-week reloading rules and source-specific observation times are retained.

## Evidence interpretation

- CLEOPATRA outcomes describe the full randomized induction-and-continuation strategy, not a measured maintenance-only survival gain.
- The weekly paclitaxel phase II study is single-arm and includes a mixed-line cohort; no comparator or relative benefit is fabricated.
- TRYPHAENA pCR is labelled with its breast-only definition; it is not converted into a survival claim.
- Original TRAIN-2 used nine cycles in the non-anthracycline arm; NCCP 00790 uses six. This limitation appears before the outcome cards.
- FeDeriCa is a pharmacokinetic formulation bridge, not proof of additional survival benefit from switching route.
- Newer trial alternatives are contextual and do not imply Irish access or automatically change a regimen.

## Verification

- 107 advanced-regimen plus 141 early-regimen cases run through the actual assessment engine: 248/248 passed after integration.
- Separate frozen baseline/proposal records preserve the source of each expectation. Baseline unmet cases include repeated pathways and newly added clarification/content expectations; they are not a count of distinct dosing errors or an estimate of overall clinical accuracy.
- Full release/CI checks include historical suites, source rules, version consistency, security, deployment build, public/compatibility routes and protected patient assets.
- All five clinician profiles use the actual knowledge-base loader and endpoint renderer. Phase selectors, reset behaviour, local links, date-free maps and the patient/clinician evidence boundary are exercised.
- 45 regenerated PDFs, 80 pages, 45 identical compatibility copies and 20 QR decodes passed. Print layouts were visually inspected.
- 2,356 patient/data files outside these five suites are preserved against the verified cumulative v0.84.14 baseline.

The final executable results, rendering checks and browser notes are in `validation/phesgo-retro-v08415/`.

## Source and installation provenance

Official NCCP PDFs and EMA product information were browsed. Some direct NCCP binary downloads returned 403; prior PDF hashes are retained only as historical provenance, not represented as newly downloaded source hashes. Primary trial records and limitations are listed in the evidence source register.

The observed remote commit `f44aee7` added new v0.84.14 files but left existing release/application files at v0.84.13. The verified v0.84.14 archive restored 183 replacements to create the logical baseline for this work. The cumulative ZIP includes those replacements. No remote repository changes were made by this task.

This is source reconciliation and software verification, not independent clinical/pharmacy approval, exhaustive multi-variable clinical validation, or a prescription. Patient/PPI review is also pending. The schedule remains educational content rather than an appointment-tracking service.
