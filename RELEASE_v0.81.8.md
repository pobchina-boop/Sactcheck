# SACTCheck v0.81.8 — bounded reliability repair

Base: v0.81.7, commit d59d047bd014f176ea55c6347e39e99974bd53b5.
This ZIP is a drop-in update, not a standalone full repository.

## Install

1. Extract the ZIP.
2. Copy the contents of `SACTCheck_v0.81.8_DROP_IN` into the existing repository root (where package.json lives), merging folders and replacing matching files. Do not replace whole directories or delete unrelated files.
3. Use the supplied GitHub summary and description; commit and push as usual.
4. Confirm the new Pages workflow succeeds, then check the live version and patient outputs below.

## Fixed

- The latest hydration test no longer rejects every version after 0.81.7. A regression runs that behaviour gate against the current and next patch versions.
- Repeated card decoration no longer rewrites already-owned action buttons. Card observation responds to relevant additions; full-document decoration runs once per hydration batch. Branding and workflow text updates avoid rewriting identical content.
- Twelve shared-template guide PDFs were regenerated with explicit section boundaries and connector endpoints measured from rendered print geometry. Medicines and schedule are visible above the anatomy in the reviewed FOLFOX-6 and TCHP outputs.
- Editing remnants were removed from the 00831 urgent-advice paragraph while retaining its clinical instructions.

## Preserved

All protocol JSON and assessment engine files; original anatomy artwork; approved 00568 guide, passport and sactcard PDFs; restored v0.81.7 action controls and degraded-state visibility fallback. No service worker added. No remote commit or deployment performed.

## Still outstanding

- Root-resolver QR migration: printed QRs intentionally remain on their currently working /patient/<code>/ destinations in this bounded repair.
- Dedicated treatment cards for the other 12 regimens.
- Further patient-guide typography/page-two spacing refinement and broader clinical content review.
- Physical paper scanning/duplex-printer checks and post-push live validation.
- The browser regression is supplied and was run locally; it requires Playwright/Chromium and is not added to the existing GitHub Pages workflow in this repair.

## Post-push acceptance

- GitHub Pages deployment succeeds for the new commit; public data/app-release.json reports 0.81.8.
- On desktop and phone, search 00568: complete controls appear on first load and refresh.
- Open Patient Guide and Clinic Workflow; enter ANC 0.8 alone and confirm a partial, non-cleared assessment with missing domains unassessed.
- Open 00209 and 00722 guides: medicines/schedule remain visible above the rich anatomy.
- Open 00831 guide: urgent advice has no editing labels.
- Scan a printed guide; confirm the correct public portal opens.
