# SACTCheck v0.84.53

Five new prostate ADT formulation services and five repeat source audits, prepared as a manual update over verified v0.84.52 commit `18426a999fa2b1ad441b82ee5dfbea6fa4ee9ea5`. These are existing NCCP protocols gaining complete services, not five new NCCP protocol IDs. The protocol catalogue remains 377 protocols; there are 238 registered patient codes, 265 registered bundle routes and 274 authored patient routes.

| NCCP | New complete service | Source interval |
| --- | --- | --- |
| 00478 | Goserelin 3.6 mg, subcutaneous implant | 28 days |
| 00488 | Triptorelin 22.5 mg, intramuscular injection | 24 weeks / 168 days |
| 00489 | Triptorelin 3 mg, intramuscular injection | 28 days |
| 00490 | Leuprorelin 7.5 mg, subcutaneous injection | 28 days |
| 00491 | Leuprorelin 45 mg, subcutaneous injection | 24 weeks / 168 days |

Each service includes assessment rules, clinician knowledge and the shared prostate treatment explainer, consent, monitoring and support, patient portal, passport, three-page pack, anatomical toxicity material, wallet card, QR images and a complete 19–20-page handbook. Calendars show continuous hormone suppression between injection appointments without defining an arbitrary total course.

## Clinical findings

- Corrected the 00488 and 00491 card intervals from 28 days to the sources' 168 days. The NCCP catalogue heading for 00488 says 22.6 mg, while its linked protocol and the product SmPC specify 22.5 mg; the service follows the documents and records the discrepancy.
- The 3 mg and 22.5 mg triptorelin formulations are intramuscular. The 11.25 mg formulation's alternative route is not carried across. The 00489 NCCP reference points to another strength; this audit uses the matching 3 mg HPRA SmPC.
- Leuprorelin source schedules are expressed as exact NCCP days/weeks. Calendar months in product information are not silently treated as 28 days or 24 weeks. No unsupported numerical renal or hepatic dose thresholds were added.
- HPRA lists Eligard 7.5 mg as authorised but not marketed. Availability requires pharmacy confirmation; it is not described as withdrawn and does not trigger automatic substitution.
- Source-specific eligibility, flare/spinal-risk distinctions, preparation errors, severe skin reactions, urgent neurological symptoms, previous stop history and missing data are covered by the clinical regression cases.

## Five retrospective audits

| NCCP | Service | Result |
| --- | --- | --- |
| 00830 | Relugolix | Current sources unchanged; previous source cases pass; patient assets unchanged |
| 00481 | Degarelix | Current sources unchanged; previous source cases pass; patient assets unchanged |
| 00477 | Goserelin 10.8 mg | Corrected clinical monitoring wording to regular FBC, renal, liver, glucose and bone profile; existing patient wording already matched |
| 00479 | Leuprorelin 22.5 mg | Added prior orchiectomy contraindication, incorrect preparation hold, severe skin reaction stop and urgent headache/visual-symptom review; aligned consent, knowledge, support and patient documents |
| 00480 | Triptorelin 11.25 mg | Current sources unchanged; previous source cases pass; patient assets unchanged |

The affected patient document scope is six routes: the five new services plus 00479. Four retained patient services have exact v0.84.52 byte comparisons. The lung 00568 pitch suite is preserved.

## Evidence and limits

Current NCCP and product source retrievals, hashes, page citations, 178 new source cases and 121 repeat ADT cases are retained under `validation/adt-depots-v08453/`. The consistency matrix, staged and published PDF checks, rasterised QR checks, visual review, Git baseline provenance and final software results are stored there separately.

See `validation/adt-depots-v08453/software/release-checks.json` for the final check outcomes and logs. Chromium failed before page load because the environment denied its socket operation. Desktop/mobile interaction, physical phone installation, camera scanning and printing are therefore unverified. Node 24.22.1 was used; the CI-configured Node 20 was unavailable. Independent clinical, oncology-pharmacy and patient/PPI approval remain pending.

This ZIP does not commit, push or deploy. A recovery snapshot was created before editing on the same cloud filesystem; no independent offline backup was made. The five-plus-five audit is not a whole-platform clinical certification.

Before this manual release, the public site returned v0.84.52, the five new patient routes returned 404, and the five previous ADT routes plus lung 00568 returned 200. Their exact observed hashes are in `software/live-destinations-before-release.json`. New QR destinations need deployment before they become public.
