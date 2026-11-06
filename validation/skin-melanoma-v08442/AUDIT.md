# SACTCheck v0.84.42 — skin and melanoma completion review

Prepared against v0.84.41, remote main `cd94a2043d59da86ffec3dbb63ac49df6399e112`, checked 6 November 2026. This is a manual review package. No commit, push, merge or deployment was performed.

**Publication hold:** the required local Chromium browser suite could not launch because its local socket was denied (EPERM). The request for execution outside that restriction was automatically rejected. Browser inspection through the available preview succeeded for representative patient pages and a synthetic clinician QT-boundary assessment, but is not a substitute for the complete automated mobile/desktop suite. The command namespace could not reach the preview endpoint for a separate HTTP byte comparison (connection refused); static build validation and observed browser journeys are recorded separately. Run `CHROMIUM_PATH=/usr/bin/chromium npm run test:patient-browser` in the configured environment and resolve failures before publication. Real iPhone/Safari and Android/Chrome installation, camera scanning and physical printing remain unverified. Independent clinical, oncology-pharmacy and patient/PPI approval remains pending.

## Scope

| New authored context | Source reviewed | Important distinction |
|---|---|---|
|00102 vemurafenib|NCCP v6|Continuous twice-daily monotherapy; QT history, recurrence and the exact 60 ms source gap|
|00105 ipilimumab|NCCP v7|Four doses/16-week course window; no automatic nivolumab maintenance; low emetogenic risk|
|00237 dabrafenib|NCCP v6 plus current EMA|Monotherapy; preserve the current EMA fever hold at 38°C and document the NCCP 38.5°C difference|
|00373 cobimetinib/vemurafenib|NCCP v3 plus current EMA|Cobimetinib days 1–21, vemurafenib days 1–28; component-specific holds, recovery and cessation|
|00464 dacarbazine|NCCP v3 plus current HPRA|850 mg/m² every 21 days, maximum six cycles; exact CrCl 45 ambiguity requires review|
|00535 avelumab, Merkel-cell context|NCCP v7, updated from v6b|Previously chemotherapy-treated metastatic MCC; 800 mg every 14 days; first-four-infusion premedication|
|00551 nivolumab 3/ipilimumab 1, melanoma context|NCCP v7a|Explicit unlicensed Irish melanoma posology/governance; induction and maintenance differ; colorectal route retained|

Repeat source review: 00431, 00415, 00563, 00812 and 00236 (six patient routes including 00415 adjuvant). Fresh official PDFs matched their retained source hashes; no additional retrospective protocol correction was justified. The existing 00551 adrenal exception required a correction: absence of symptoms alone does not prove stable replacement therapy. All other 82 pre-existing rules remain unchanged; new melanoma/context checks are separately identified.

The skin catalogue now has authored services for 16 entries and 22 treatment-context routes across releases 40–42. That count does not mean every shared indication is covered, that all 22 routes were re-authored here, or that independent approval has been granted. `skin-coverage.json` lists the exact routes.

## Clinical and evidence findings

- Replace unsupported shared BRAF thresholds with regimen-specific eligibility, renal/hepatic actions, dose history, recurrence, QT, LVEF, liver injury, CPK, haemorrhage, rash and recovery pathways. Preserve ambiguity and consultant choices; no definitive prescription is inferred from overlapping source rows.
- Preserve permanent-stop history after apparent recovery and distinguish cobimetinib, vemurafenib and whole-regimen actions.
- Reconcile ipilimumab low emetogenicity, combination low versus nivolumab-only minimal risk, and phase-specific supportive drafts.
- Keep current NCCP source identity, version, URL, retrieved bytes and SHA-256. Component SmPC supplements and differences are explicit. Detailed page/table mappings, baseline/candidate outputs and executable boundary cases are in the three source-audit folders.
- Keep trial population, comparator, dose and endpoint limitations visible. CheckMate 511 primarily compares toxicity; it does not establish efficacy noninferiority. CheckMate 066 used dacarbazine 1000 mg/m², not this NCCP 850 mg/m² schedule. Clinician evidence rendering now uses supported endpoint identifiers; all results and limitations are asserted as visible output.
- The supplied NCCN melanoma patient reference informs education and questions; it does not replace Irish prescribing criteria or supply Merkel-cell indications.

## Patient and print preservation

Seven complete services include clinical knowledge, consent discussion aid, monitoring and supportive plans, portal, three-page guide, anatomical toxicity map, treatment passport, wallet card, complete offline handbook and QR routes. Original detailed anatomical artwork is byte-identical. Nine-label print panels were widened and their geometry corrected while retaining all explanatory text. Guide page 1 covers schedule/testing; page 2 anchors toxicities to anatomy; page 3 contains front/back wallet panels, cutting/folding instructions, installation guidance and resources. Wallet panels remain 85.6 × 54 mm. All example phone numbers are visibly marked for replacement before patient use.

Oral ongoing treatments use review records; four-dose induction and six-cycle dacarbazine use bounded cycle stamps. A stamp does not authorise another dose. QR codes contain no patient identifiers or cycle data and open the exact context's OncoWiki. Full handbooks retain all seven sections and phase sheets, with written source addresses and paper-oriented instructions.

The 00551 colorectal patient documents are byte-identical to v41; only its context chooser changes. All six retrospective patient routes are unchanged. Haematology remains hidden and all 15 clinical JSON files are preserved.

## Verification and limits

- New executable checks: BRAF 384/384, immune 483/483, dacarbazine 295/295 and additional retrospective 42/42: **1,204/1,204**.
- Existing five-regimen retrospective source checks: **1,617/1,617**. Previous v41 source checks: **196/196**. Existing colorectal nivolumab/fruquintinib: **599/599**, with the single source-backed adrenal replacement fixture explicitly corrected.
- PDF audit: **132 PDFs, 924 pages, 52 QR checks, zero findings**, including seven new and six retained retrospective routes. Checks cover required text, bounds, geometry, one-page consent, three-page guides, wallet dimensions, mirror equality, complete handbook sections, print folios, QR PNGs and rasterised PDF QRs. Visual inspection is separate evidence, not inferred from these numbers.
- The complete `npm run test:ci` passed with exit code 0 in a fresh baseline clone with the update applied. `checks.json` records final command outcomes and limitations. Full logs are retained under `checks/`. Runtime: Node 24.22.1; repository CI specifies Node 20. No npm dependency installation was required.
- New canonical routes are not deployed by this package. Decoding the correct destination does not prove a new route is live. After manual publication, verify exact commit Actions/Pages status, canonical release, pages/PDF bytes and QR destinations.
- The baseline recovery bundle is in the same cloud workspace. It is not an independently protected/offline backup or a tested disaster-recovery service.

## Remaining programme

The inventory has 362 visible catalogue entries, 199 registered roots and 163 entries without a registered dedicated root. Shared contexts and legacy asset completeness add further work; root counts are not service-quality completion percentages. Finishing all solid-tumour services by Sunday 8 November is not supported by this inventory.

Next: approve one full reference suite and the necessary oral, infusion, induction/maintenance, perioperative and radiotherapy variants, then use a complete clinical/content/visual/print consistency matrix for controlled rollout. Vaccination information is a recorded future feature awaiting Paul's material and current NIAC/HSE/oncology reconciliation; no new vaccination advice is introduced here.
