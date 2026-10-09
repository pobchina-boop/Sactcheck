# SACTCheck v0.81.9 — 00568 reference-suite foundation

## Apply

This is a cumulative **drop-in update**, not a standalone repository. It includes the v0.81.8 repairs and can be merged into the checked v0.81.7 or delivered v0.81.8 repository.

Extract the ZIP. Copy the **contents** of `SACTCheck_v0.81.9_DROP_IN` into the repository root containing `package.json`. Merge folders and replace matching files. Do not delete entire existing folders. Review the changes, use the supplied GitHub summary/description, commit and push when ready.

The public main and live release metadata returned v0.81.7 during preparation on 8 October 2026. The build therefore starts from that known main commit (`d59d047bd014f176ea55c6347e39e99974bd53b5`) plus the delivered v0.81.8 repair package. No remote changes were made.

## New patient experience

Open `/patient/00568/` → **Open patient knowledge base**. The new page adds medicine-mechanism diagrams; induction and maintenance; a clickable 21-day timeline; optional calendar dates; supportive-care explanations; urgent guidance; questions and teach-back prompts. It links back to the approved anatomy, visual guide, passport and treatment card.

Nausea timing is illustrative. Infection and immune effects have no guaranteed safe interval. The diagram does not estimate incidence, predict nadir or certify blood-count recovery. Date entry and phase selection are local to the page and make no network requests. No dates or patient identifiers are encoded in QR codes.

## Clinician experience

Search 00568 → Clinic Workflow → **Generate draft consent support**. This now opens a distinct editable discussion draft with print/save-to-PDF. It is not an approved signed consent form. Clinical review and the approved local consent process remain necessary. Other regimens retain their previous behaviour; this release does not claim their consent generators have been rebuilt.

The existing clinician knowledge profile was tested and opens correctly. No dose, threshold or assessment rules changed. Approved 00568 guide/passport/card PDF bytes and anatomy markup are unchanged.

## Scope still to complete

- Paul’s clinical review and PPI refinement of this first knowledge profile.
- A reviewed, deterministic patient escalation tree; no automated reassurance or diagnosis is included.
- Any future constrained chatbot, only after its approved content and escalation boundaries are defined.
- Root-resolver QR migration; the current locally stored QR assets are retained.
- Replication to other regimens after the reference suite is approved.
- Full suite-wide integration into continuous browser CI: the new static contract/freshness test runs in release:gate; the supplied browser tests currently require a separate Playwright environment.

## Post-push acceptance

1. Confirm the Pages and CodeQL runs for this exact commit succeed.
2. Confirm `/data/app-release.json` reports 0.81.9 and refresh the app on desktop and mobile.
3. Search 00568; open assessment, knowledge, consent discussion draft and antiemetic output.
4. Open the patient portal, new knowledge section and Day 1–21 timeline. Test induction/maintenance and a date crossing a month boundary.
5. Check the approved guide, passport and treatment card still open; scan the existing printed QR on a phone.
6. Print a locally reviewed consent draft; confirm entered discussion text and tick marks appear. Longer entries may increase the page count.

Local validation is recorded separately in VALIDATION_v0.81.9.md. Live acceptance is outstanding.
