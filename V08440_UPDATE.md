# SACTCheck v0.84.40 — skin and melanoma batch

**Manual review package after v0.84.39. Not committed, pushed or published by this task.**

Baseline: `bffd2cda167d7943ce6431ff32d5a1525509f618`. Remote main was verified as v0.84.39. The local recovery checkout has a different historical HEAD; the package is compared with the verified v0.84.39 files, not with that old HEAD.

## New suites

| NCCP | Patient context |
|---|---|
| 00236 | Vismodegib for advanced basal cell carcinoma |
| 00415 | Dabrafenib/trametinib for advanced melanoma, plus a separate postoperative stage III adjuvant route |
| 00563 | Encorafenib/binimetinib for advanced BRAF-mutated melanoma |
| 00431 | Nivolumab 1 mg/kg + ipilimumab 3 mg/kg for advanced melanoma |
| 00812 | Cemiplimab for advanced cutaneous squamous cell carcinoma |

Five protocols produce six patient contexts. The shared HCC and cervical indications are preserved in clinical rules; this batch does not claim completed patient suites for those settings.

## Five retrospective audits

Pembrolizumab 200 mg (00455), pembrolizumab 400 mg (00558), nivolumab every 14 days (00483), nivolumab every 28 days (00484), and nivolumab 3 mg/kg + ipilimumab 1 mg/kg (00551). These update seven existing lung/colorectal patient routes. They do not count as completed melanoma services.

## Substantive findings carried through the suite

- Vismodegib: pregnancy-prevention, testing/supply and prolonged post-treatment restrictions; severe-skin stop pathway; continuous treatment distinguished from four-week review. No generic CK or grade-3 dose ladder invented.
- Dabrafenib/trametinib: current v5 source, fever and component-specific holds, cardiac/eye/history/recovery decisions, oral antiemetic category, separate advanced and 12-month adjuvant plans. Conflicting skin-review intervals remain explicitly flagged.
- Encorafenib/binimetinib: current v4 source; CK symptoms and numerical boundaries, LVEF/LLN changes, QTc change/recurrence, hepatic/renal and component-specific decisions. The central antiemetic lookup was corrected to match the current protocol and support plan.
- The encorafenib/binimetinib source contains a 225 g dose-unit typo and conflicting ILD restart/stop wording. These require consultant/pharmacy resolution; the tool does not turn them into an automatic definitive dose.
- Nivolumab/ipilimumab 00431: melanoma versus HCC hepatitis criteria, matching current and baseline AST/ALT, source CTCAE edition, induction/maintenance timing and delayed immune monitoring remain distinct.
- Cemiplimab: organ-specific hold/stop rules, endocrine exceptions, recurrent toxicity, rash duration and recovery/steroid time limits; cSCC and cervical eligibility remain separate.
- Retrospectives: symptomatic grade-2/3 endocrine holds, missing symptom context, additional immune suppression and restart confirmation; 00551 maintenance switching intervals and suspected severe-skin reactions.
- Browser QA found and fixed clinician evidence-panel schema failures, missing outcome rendering, and advanced-disease text carried into the adjuvant panel. Context-specific evidence now renders and has a regression check.
- Print/portal QA fixed missing chronology labels, oral review-versus-cycle labels, and the anatomy jump link. Detailed anatomical text and the established illustration were preserved.

## Patient references and output

The supplied NCCN Melanoma (2026), Basal Cell Skin Cancer (2026), and Squamous Cell Skin Cancer (2023) patient guides informed original explanations and passport fields: diagnosis/biomarkers, treatment goals, tests, skin/self-checks, symptoms, support, decisions and follow-up. Irish indication, schedule and treatment-modification decisions remain based on the current official NCCP documents. The supplied NCCN PDFs and artwork are not redistributed.

Each new context has the three-page companion, detailed anatomical map, front/back wallet sheet at 85.6 × 54 mm, automatic regimen/Oncowiki QR, consent aid, support sheets, monitoring journey, passport, web reference and complete offline handbook. Placeholder phone numbers are visibly labelled and must be replaced before patient use.

Four older retrospective lung guides retain their existing two-page guide and wallet layout; their extended references, handbooks, support and passport notes were updated. The three modern retrospective contexts retain their existing three-page companions. Thirty-five companion PDFs are preserved byte for byte.

## Verification

- Full `npm run test:ci`: passed. Exact log and exit status retained.
- 1,800 current-source assessment cases pass: 293 vismodegib, 753 BRAF/MEK, 571 new immune-regimen and 183 retrospective cases. Tests use the actual assessment engine, including boundaries, missing context and component actions. A baseline failure is not counted as a distinct clinical defect.
- New PDF checks: 61 PDFs, 446 pages, 24 decoded QR checks; zero findings. Retrospective checks: 33 changed PDFs, 31 QR checks, 35 retained companions; zero findings. Download copies match.
- 7,383 prior patient files checked against retained hashes, allowing only explicitly recorded migrations.
- Managed Chromium: 48 portal/reference/consent/support checks at 390 px and 1280 px CSS iframe widths, keyboard navigation, expanded content, loaded images, phase selection and overflow checks. Representative clinician CK and context-selection journeys exercised; guide downloaded and its bytes matched.
- Rendered PDF pages visually inspected, including anatomical maps, adjuvant schedule, wallet/cutting page and passport record. Geometry checks alone were not treated as visual approval.
- Direct Playwright CLI runs were blocked by Chromium socket EPERM and are not reported as passing. Final clinician browser retest used an ignored QA copy without the runtime cache supervisor to avoid intermediate same-release cached JSON; the release-cache unit checks pass separately.
- Real iPhone/Safari and Android installation, camera scanning and physical printing remain unverified. Local validation used Node 24.22.1; repository CI specifies Node 20.
- The wider catalogue metadata check still records 225 protocols with non-blocking review items; passing the release tests does not clear that separate review backlog.

## Coverage and release limits

The skin catalogue contains 16 entries. This batch authors skin suites for five entries (six patient contexts), leaving 11 skin entries requiring their skin-specific suite work. Shared lung/colorectal completion is not counted as skin completion. A full cross-tumour consistency audit remains outstanding.

Independent clinical, oncology-pharmacy and patient/PPI approvals remain false. This is a source-reconciled software review candidate, not clinical authorisation.

The canonical site was checked during this task: it still served v0.84.39; sampled new skin routes returned 404, as expected before publication. QR destinations are encoded and checked for the intended canonical paths, but they are not claimed live.

A dated source/history/checksum recovery snapshot was created before changes. It is on the same cloud filesystem and is not an independent protected offline backup.

Clean application to the exact verified v0.84.39 commit passed all baseline/output hash checks, the current skin source/full-suite cases, patient UI tests, production build and site security checks. No pre-existing source files were reset or discarded.

## Apply

Extract the ZIP and copy its contents into the existing v0.84.39 checkout, preserving the folder structure. Review replacements, commit with the supplied summary/description, then push using the existing manual workflow. Do not add the ZIP itself to the website repository. The ZIP contains only changed/new files and has no deletions.

The detailed per-context checklist is `validation/skin-melanoma-v08440/consistency-matrix.json`; source PDFs, versions, hashes, page/table references, cases, preservation hashes and verification reports are retained alongside it.
