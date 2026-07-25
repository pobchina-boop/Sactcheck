# SACTCheck v0.45.1 — Tissue-specific shared-regimen indication hotfix

## Problem corrected

Shared NCCP regimens could appear in more than one tumour-site library while retaining the indication text from the protocol's primary tumour group. This could display unrelated wording, such as a cervical-cancer indication on a Skin/Melanoma card.

## Changes

- Added a central tissue-context resolver for shared protocols.
- Regimen-card indication text now updates when the tumour-site filter changes.
- Opening a shared regimen carries the active tumour-site context into the assessment screen.
- The relevant indication is preselected in the assessment form.
- Shared-protocol indication options are prefixed with their tumour group.
- Added explicit `tumour_groups` metadata to 134 indications across 37 multi-tumour protocol files.
- When a linked tumour group has no encoded indication description, SACTCheck now shows a verification warning rather than another tissue's indication.
- Search remains protocol-wide and continues to index all encoded indications.

## Confirmed examples

- NCCP 00535 avelumab: urothelial maintenance in Genitourinary; Merkel-cell carcinoma in Skin/Melanoma.
- NCCP 00812 cemiplimab: cervical cancer in Gynaecology; cutaneous squamous-cell carcinoma in Skin/Melanoma.
- NCCP 00551 nivolumab/ipilimumab: colorectal cancer in Gastrointestinal; renal-cell carcinoma in Genitourinary; melanoma in Skin/Melanoma.

## Validation

- 134 shared-protocol indications contextualised.
- 3 pre-existing source/index tumour-group mismatches identified and safely suppressed from unrelated tissue displays.
- Complete repository regression suite passed.
- Indexed protocol count remains 338; no duplicate protocol cards were added.

## Clinical status

This is a display/context-selection safety hotfix. It does not constitute independent clinical validation of the encoded protocol rules. Continue to verify against the current official NCCP protocol and local policy.
