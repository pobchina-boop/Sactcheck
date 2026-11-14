# SACTCheck v0.84.52

This manual review update adds complete patient and clinician services for five existing ADT regimens and corrects maintenance explanations in the lung pitch example. Apply it over v0.84.51, commit de45ef0e92b3bbccd113243a8e5a2e561a6a0760. It adds no new NCCP protocol identifiers.

## Five services

| NCCP code | Treatment | Authored schedule |
|---|---|---|
| 00830 | Relugolix | 360 mg loading dose, then 120 mg daily; source-specific restart and interaction handling |
| 00481 | Degarelix | 240 mg loading dose as two injections; 80 mg at 28 days and every 28 days |
| 00477 | Goserelin 10.8 mg | Subcutaneous implant every 12 weeks (84 days) |
| 00479 | Leuprorelin 22.5 mg | Subcutaneous injection every 12 weeks in this NCCP regimen |
| 00480 | Triptorelin 11.25 mg | Every 12 weeks; source-specific route and formulation instructions |

Each includes source-linked assessment rules, clinician knowledge, workflow support, consent discussion materials, monitoring, portal, three-page pack, 19-page full handbook, passport, wallet card and regimen-specific QR links. The shared prostate explainer is available for all ten prostate services.

The audit corrected the relugolix classification and erroneous requirement for another form of castration, the degarelix scheduling discrepancy, and inherited depot interval metadata. Distinct agonist flare precautions, spinal disease exclusions versus cautions, product handling and missed-dose instructions remain separate. Hormone-suppression trial endpoints are not presented as survival benefits.

## Five repeat audits and lung pitch review

The five v0.84.51 prostate services (00103, 00577, 00233, 00574, 00693) passed 184 source cases. Their current source PDFs match the retained previous versions. Their patient files remain byte-identical.

For 00568 pembrolizumab + pemetrexed + carboplatin AUC5, 11 maintenance-rule explanations were corrected to refer to the active pemetrexed component. All 82 rule conditions, thresholds, action types, component lists and source mappings remain unchanged. Two regression suites passed 571 cases in total, including 156 specifically labelled 00568 cases. The three-page pack, full handbook, ten consent risk statements, eight anatomical callouts, phase support sheets and rendered PDF QR destinations were checked. The patient documents are retained unchanged.

The clinician workflow opens dedicated supportive-care guidance; choose induction or maintenance there. This release does not add an inline workflow phase selector for 00568.

## Review status

All stages of the current `npm run test:ci` script passed locally, with execution resumed from failed checks after repairs. The build, repository and built-site security checks passed. Local HTTP responses for 95 resources matched the checkout and built site byte-for-byte. Fifty new service PDFs passed the affected document checks; the presentation check found zero pending changes across 269 routes.

See validation/adt-v08452/software/release-checks.json for results and retained logs, and validation/adt-v08452/pdf/ for document verification. New ADT source cases: 121/121. Historical audit reports retain their original bytes; this run's reports are stored separately. Independent clinical, oncology-pharmacy and patient/PPI approval remains pending.

Chromium could not start because the environment denied its socket operation. Desktop/mobile browser behavior and physical iPhone/Android scans therefore remain unverified. The downloaded review package is not evidence of a live deployment. Node 24.22.1 was used; the CI Node 20 runtime was unavailable.

Example contact numbers remain visibly marked EXAMPLE. Replace them with verified local contacts before patient use. Existing lung document footers identify their own earlier content revision; the application release is v0.84.52.

## Follow-up identified

Existing 00488 triptorelin 22.5 mg metadata shows q28d while its filename describes q24weeks. This separate formulation needs current-source reconciliation before use; it was not changed or marked audited in this five-service batch. See clinical/follow-up.json in the validation folder.

## Apply and review

1. Confirm your checkout contains committed v0.84.51. Keep a backup of local changes.
2. Extract the ZIP and copy its repository files into that checkout, retaining directories and accepting replacements. No deletion is required.
3. Review the diff and run the checks in package.json. Complete the outstanding browser and clinical review on an appropriate local environment.
4. Commit the reviewed change using the text below. Publishing remains a separate manual action. After deployment, check the actual release and the 00568 patient reference on the pitch laptop.

## Commit summary

v0.84.52: add five ADT suites and audit the lung pitch pathway

## Commit description

Add complete services for relugolix, degarelix, goserelin 10.8 mg, leuprorelin 22.5 mg and triptorelin 11.25 mg, with source-specific assessment rules, knowledge, monitoring, consent support and patient documents. Extend the prostate explainer to these five ADT services.

Repeat the five prostate audits and review NCCP 00568 for the pitch. Correct 11 maintenance explanations to name pemetrexed while preserving clinical thresholds, rule conditions and component actions. Retain existing lung patient assets and record their PDF, consent, anatomy and QR checks.

Include source and boundary-test evidence, exact v0.84.51 migration hashes and staged/published PDF checks. Record the blocked Chromium checks and pending independent clinical, pharmacy and PPI review. No deployment is included.
