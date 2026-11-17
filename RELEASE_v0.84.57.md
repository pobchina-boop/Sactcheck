# SACTCheck v0.84.57 — five GU suites and repeat audit

Review package based on v0.84.56, commit `90ae67a0a3f565cb57f73072137c52c4851fec5b`.

**Full CI is incomplete.** The final remaining regression run lost its controllable session before returning an overall result. Focused v0.84.57 checks, the repeat audit, PDF/QR verification, the site build, site security and 42 local HTTP checks passed. Earlier CI failures were corrected and rerun with retained evidence, but the remaining run must not be described as a full CI pass. Review on a development branch and complete CI/browser checks before release approval.

## Scope

| NCCP code | New patient suite | Source |
|---|---|---|
| 00588 | Olaparib tablets, prostate monotherapy context | NCCP v5b; current Lynparza product information |
| 00104 | Axitinib monotherapy | NCCP v6; current Inlyta product information |
| 00518 | Cabozantinib monotherapy | NCCP v3; current Cabometyx product information |
| 00564 | Tivozanib monotherapy | NCCP v3; current Fotivda product information |
| 00326 | Temsirolimus monotherapy | NCCP v4; current Torisel product information |

These extend four existing protocol codes with full patient suites and add one indication context to an already registered shared protocol. No new protocol is added to the 377-protocol catalogue. Cabozantinib is reconciled to the current NCCP version and the previous protocol identifier remains an alias.

Each route includes the treatment assessment encoding, workflow, clinical knowledge, generic treatment-type and agent-specific consent content, patient portal, three-page guide, wallet card, companion documents and complete handbook. Olaparib prostate routing preserves the existing breast suite and does not route other indications to prostate material.

The assessment rules retain explicit consultant review where the NCCP wording is ambiguous, sources differ, a reduction history is unknown, or a safe numeric dose cannot be derived. This includes tivozanib recovery wording and Child–Pugh B scheduling, and renal/hepatic source discrepancies. This is not independent clinical approval.

## Repeat audit of v0.84.56

Codes 00101, 00257, 00313, 00546 and the 00203/prostate context were rechecked against freshly retrieved sources. All 169 previous source-rule cases pass. All 190 patient files match the committed baseline, including their mirrored files. Consent content and PDF QR destinations were rechecked.

One clinical knowledge-base sentence for cabazitaxel was corrected: isolated low platelets trigger consultant review with numeric dosing blocked; the sentence no longer describes this as an independent source-mandated platelet hold. The underlying assessment rule was already correct and was retained.

The v0.84.56 download was compared with Git: all 413 archive members matched the committed baseline. A source archive and full Git bundle were created before modification.

## Coverage and remaining work

The release has 251 registered protocol codes, 281 registered suite routes and 289 authored patient routes. Of the 362 non-haematology protocols, 111 still have no authored suite: gastrointestinal 41, gynaecology 31, genitourinary 16, sarcoma 19, shared 3 and tumour agnostic 1. That deficit alone is approximately 23 batches of five. Missing contexts within already covered shared protocols and final cross-platform validation are additional work. Haematology remains hidden and excluded from this count.

The previously identified 00493 source clarification remains unresolved and is not closed by this batch.

Older regimen-specific tests now repeat generation checks only for their own regimens. The full-catalogue knowledge and complete-suite generator checks remain in the CI gate, and a regression assertion protects their presence. Clinical assertions, source cases and preservation checks are retained. This reduces repeated validation work; it is not a claim about website loading speed.

## Review limitations

The attempted real Chromium check failed because this environment denied the required socket operation. No browser, mobile-device, physical print, phone-camera or deployment acceptance is claimed. PDF QR decoding validates the encoded destinations, not publication of the new routes. Those routes need checking after the user applies and deploys the release.

The audit matrix is in `validation/prostate-v08457/audit-summary.md`. Current source PDFs, source hashes, clinical cases, content-retention checks and PDF reports are under `validation/prostate-v08457/`. The final validation summary records the actual software-check outcomes. A software test pass is not clinical governance sign-off.

## Suggested commit

Title: `v0.84.57: add five GU suites and re-audit the previous prostate batch`

Description:

Add prostate olaparib and renal axitinib, cabozantinib, tivozanib and temsirolimus suites across assessment, workflow, knowledge, consent and patient documents. Reconcile the five encodings with current NCCP and EMA sources, preserve review gates for source ambiguities, and update cabozantinib to NCCP v3 with identifier compatibility.

Repeat the v0.84.56 five-regimen audit, preserve its patient assets, and correct the cabazitaxel knowledge-base platelet wording. Include scoped source cases, immutable baseline checks and PDF/QR verification. Full CI is incomplete after the remaining runtime session became unavailable; browser/device and deployment acceptance remain pending.
