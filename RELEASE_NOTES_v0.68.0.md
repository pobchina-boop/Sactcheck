# SACTCheck v0.68.0 Release Notes

Release date: 15 August 2026

## Release purpose

This release packages the deepest whole system audit and remediation performed on SACTCheck to date.

The release focuses on source fidelity, rule integrity, transparent encoding maturity, input semantics, evidence structure, security, privacy and governance. It does not claim independent clinical validation.

## Major clinical source reconciliation

Eleven high priority breast protocols were rebuilt or materially reconciled against their current mapped NCCP sources: 00202, 00815, 00423, 00377, 00378, 00381, 00262, 00263, 00269, 00743 and 00749.

The changes include corrected blood count boundaries, DPD pathways where applicable, renal and hepatic pathways, cardiac context where applicable, toxicity actions, recurrent dose level logic and source appropriate renal band selectors.

## System wide controls

• All 376 active protocols now expose encoding maturity.

• All 6438 inputs now expose an input role.

• All 6272 executable rules now contain a source object and explanation.

• Zero unreachable select rule values remain.

• Zero same component exact condition action conflicts remain.

• All active protocols now have a canonical protocol identifier in metadata while legacy protocol identifiers remain supported.

• Public assessment wording now uses Encoded rule coverage rather than an unqualified Complete label.

## Context mapping

Direct source confirmation corrected an audit false positive for NCCP 00212. Lung is not listed in the current 00212 source and was removed from the mapping.

NCCP 00215 is confirmed as a shared Gynaecology, Gastrointestinal, Breast and Lung protocol. Breast remains included and the current official source address is registered.

## Knowledge base

The active knowledge base remains at thirty regimen profiles and sixty six principal evidence records.

All current evidence records now use controlled evidence relationship labels, canonical evidence identifiers and complete structured trial fields.

Only the current knowledge data file is included in the public static site build.

## Security and privacy

Search status rendering no longer interpolates user query text into HTML.

Validation export now requires an explicit confirmation that the record contains no patient identifiers.

## Validation boundary

No active protocol is marked as clinically authorised. The 289 legacy encoded records that have not completed full source fidelity reconciliation remain clearly identified as pending review.

A residual class screening queue is included for future source review. Screening signals do not change clinical logic automatically.
