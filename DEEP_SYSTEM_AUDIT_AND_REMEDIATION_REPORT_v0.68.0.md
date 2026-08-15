# SACTCheck v0.68.0 Deep System Audit and Remediation Report

Audit date: 15 August 2026

Baseline: SACTCheck v0.67.1

## Purpose

This was the broadest SACTCheck audit performed to date. The review examined source fidelity, rule integrity, input semantics, organ function design, tissue mapping, source provenance, evidence structure, security, privacy, version consistency, validation boundaries, public build hygiene and residual technical debt.

The audit does not constitute independent clinical validation. It is a product owner and software quality review performed before formal NCCP supported validation.

## Headline result

• 376 active protocol records reviewed by the automated integrity layer.

• 6438 structured inputs and 6272 executable rules present across the active library.

• Zero active protocols lack encoding maturity metadata.

• Zero active inputs lack an input role.

• Zero active rules lack a source object or explanation.

• Zero unreachable select rule values remain.

• Zero exact condition action conflicts remain for overlapping drug components.

• Thirty five exact condition groups still return different actions for different drug components. These are retained because the component actions are intentionally distinct.

• Eleven high priority breast protocol records underwent direct source fidelity reconciliation.

• Thirty knowledge profiles and sixty six principal evidence records remain active.

• Thirty eight residual class screening signals remain. These are review prompts only and do not justify a clinical rule change without current source confirmation.

## High priority source fidelity remediation

The following NCCP records were rebuilt or materially reconciled in this release:

• NCCP 00202 Docetaxel 100

• NCCP 00815 Weekly paclitaxel plus trastuzumab

• NCCP 00423 Doxorubicin plus docetaxel

• NCCP 00377 CMF oral

• NCCP 00378 CMF intravenous 28 day

• NCCP 00381 CMF intravenous 21 day

• NCCP 00262 EC90

• NCCP 00263 EC75

• NCCP 00269 FEC50

• NCCP 00743 Eribulin

• NCCP 00749 Gemcitabine 800

The reconciliations include source appropriate blood count bands, DPD requirements where relevant, organ function pathways, cardiac context where relevant, toxicity actions, dose level logic and protocol specific renal selectors where the source uses discrete renal bands.

## Context mapping correction discovered during remediation

The original deep audit proposed adding Lung to NCCP 00212. A direct recheck of the current NCCP source showed that this was incorrect. NCCP 00212 lists Breast, Gastrointestinal, Genitourinary and Gynaecology, not Lung. The false positive was removed.

NCCP 00215 was separately confirmed as covering Gynaecology, Gastrointestinal, Breast and Lung. Breast is now retained in its tissue mapping and the current official source address is registered.

This correction is important because it shows that the audit itself is treated as a hypothesis generator. Primary source confirmation remains required before changing clinical context.

## Rule integrity controls

• Mixed condition syntax in the modified FOLFIRINOX hand foot syndrome rule was corrected.

• Ten stale cisplatin select conditions that could never be chosen were removed.

• Six same component exact condition conflicts were resolved by adding explicit baseline or treatment stage context.

• The remaining thirty five multi action condition groups are component specific and therefore do not represent same component contradictions.

• Tiered renal decisions added during source reconciliation now use protocol specific selectors rather than arbitrary continuous numeric entry.

## Governance and semantics

All active protocols now expose a controlled encoding maturity state.

Current maturity distribution:

• 289 legacy encoded records pending full source fidelity review

• 85 source reconciled rule encoding records

• 2 records using the earlier rule level source reconciled label

Visible assessment wording now describes Encoded rule coverage rather than using an unqualified Complete label.

All inputs are classified as decision, monitoring, context or documentation. This makes it clear whether an entered value drives a deterministic action or is present for clinical context.

All rules now contain an explicit source object and explanation. Legacy records that have not completed source fidelity review state that limitation rather than implying full reconciliation.

## Knowledge base audit

The current knowledge base contains thirty detailed regimen profiles and sixty six principal evidence records.

The active evidence taxonomy is restricted to controlled relationship labels. Every evidence record now contains a canonical evidence identifier and structured trial fields for population, intervention, comparator, primary endpoint and key findings.

Historical knowledge files are retained in development history but the public site build publishes only the current v0.68.0 knowledge data file.

## Security and privacy

Regimen search no longer places raw user query text into HTML. Search status text is constructed using text safe DOM methods.

The clinical validation workspace now gives a stronger instruction not to enter patient identifiers. Export requires an additional confirmation that the record contains no names, MRNs, dates of birth, addresses or other identifiable clinical information.

## Residual review queue

The largest remaining clinical content task is source by source validation of the 289 legacy encoded records that have not completed full source fidelity reconciliation.

The class screening queue contains 38 current signals:

• HER2 targeted: 5
• anthracycline: 4
• anti VEGF: 1
• cisplatin: 2
• fluoropyrimidine: 3
• immune checkpoint: 10
• pemetrexed: 1
• taxane: 12

These signals are not clinical defects by themselves. They indicate where a class expected domain is not obvious in the encoded input surface and should be checked against the current NCCP source.

## Residual product debt

• The first complete live source comparison for the NCCP Change Tracker remains pending because the audit environment did not complete the remote inspection. The clinician interface should continue to state that the source check is pending until a successful inspection occurs.

• The reader facing Change Tracker does not yet provide a permanent archive of every closed change with reviewer, rationale and applied release.

• Legacy hidden clinical screens remain in the production page and should eventually be removed so the generic protocol engine is the only production clinical runtime.

• 306 regimen cards retain nonblocking metadata review items.

• Source checked dates remain unconfirmed for 193 active records and NCCP review dates remain unconfirmed for 253 records. These values were deliberately not fabricated.

• Legacy hidden screens remain the main accessibility debt.

## Confidence statement

This release materially strengthens SACTCheck and closes the highest priority defects identified by the audit. The software integrity controls are substantially stronger than the baseline and the high priority reconciled protocols now have dedicated source fidelity regression tests.

It is not appropriate to state that all 376 protocols are clinically validated or fully source faithful. Formal confidence still requires systematic source review and independent consultant oncology and oncology pharmacy validation. The application continues to expose that boundary explicitly.
