# Jemperli and Zejula oncology suite audit

**Engineering and protocol review, 24 November 2026. Clinical and pharmacy authorisation pending.**

The scope is the Irish NCCP dostarlimab, paclitaxel and carboplatin endometrial regimen (00929 v1) and niraparib tablet maintenance (00862 v2). Results apply to the review branch derived from production commit `0dd8f23fbdf18895fc1ca2aeb45e5cfa6ac380aa`, SACTCheck 0.84.63. The two drugs have distinct courses and monitoring requirements. The indication, route and treatment phase are explicit in the assessment, catalogue and patient outputs.

## Source reconciliation

| Suite | Irish source reviewed | Evidence and scope |
|---|---|---|
| Zejula | [NCCP 00862 v2](https://healthservice.hse.ie/documents/6437/862_V2_Niraparib_Tablets_Monotherapy.pdf), especially pp. 1–5 | First-line advanced and platinum-sensitive relapsed ovarian, fallopian tube or primary peritoneal cancer maintenance. The knowledge base distinguishes PRIMA and NOVA, progression-free survival and final PRIMA overall survival. |
| Jemperli with paclitaxel and carboplatin | [NCCP 00929 v1](https://healthservice.hse.ie/documents/8284/929_Dostarlimab_-_PACLi_CARBO_Regimen.pdf), particularly pp. 1–4 and the toxicity tables from p. 5 | dMMR/MSI-H primary advanced or recurrent endometrial cancer. The knowledge base identifies the RUBY evidence population. The Irish protocol determines the assessment scope. |

Both official PDFs are preserved in [sources](sources/). The tracker records the PDF SHA-256 separately from the protocol JSON SHA-256. The original digests start with `31b5ff56b0b0` for Zejula and `829bd09e8ac2` for Jemperli. Product information was cross-checked for selected discrepancies. [EMA Zejula](https://www.ema.europa.eu/en/documents/product-information/zejula-epar-product-information_en.pdf) · [EMA Jemperli](https://www.ema.europa.eu/en/documents/product-information/jemperli-epar-product-information_en.pdf)

## Clinical decision support

Each of the 78 implemented rules has a source-page reference, a triggering case with its expected action and affected medicines, and a control in which that finding must disappear. Additional cases exercise threshold equality, treatment history or maintenance-phase exclusion. All 192 checks passed, alongside the original 35 assessment checks. Coverage measures the encoded rules. Independent reviewers still need to assess clinical completeness and appropriateness.

| Service | Zejula | Jemperli combination and maintenance |
|---|---|---|
| Assessment and decision PDF | 31 rules, 72 source-linked checks. Includes indication-specific starting dose, cytopenia recurrence, nadir, recovery, elapsed interruption and bleeding or transfusion review. A conflicting historical checkbox cannot trigger the 28-day stop early when an explicit shorter interval is entered. | 47 rules, 120 checks. Separates first-dose eligibility from later cytopenias, renal and hepatic actions by drug, and immune toxicities by grade, recurrence and clinical context. Tested chemotherapy actions against the maintenance phase. The immune-event field cites the CTCAE edition specified in Table 3 and directs the clinician to the event-specific term. |
| Catalogue and treatment journey | Continuous daily tablets and separate first-line and relapse contexts. Coding a review cycle does not introduce a tablet break. | Six 21-day combination cycles. First maintenance infusion three weeks after cycle 6, then every six weeks. Corrected a catalogue summary that truncated the course at six cycles. The dose/schedule panel now displays both phases and exactly one active maintenance medicine. |
| Knowledge, evidence and monitoring | PRIMA and NOVA with distinct settings and endpoints. Blood-count and blood-pressure surveillance and the two starting-dose-dependent reduction pathways appear in clinician knowledge. Hepatic dysfunction prompts specialist review because the NCCP percentage and tablet product information do not give a uniform instruction for moderate and severe impairment. | RUBY, patient selection, administration and longitudinal monitoring. The regimen-specific review distinguishes chemotherapy toxicities from immune-mediated events. |
| Supportive care and interactions | Dedicated oral plan and printable sheet. Preserves the conditional first-two-week antiemetic advice and bleeding-risk medication review. | Separate combination and maintenance plans. The combination PDF retains the paclitaxel premedications. Phase selection controls the antiemetic and extravasation advice. The underlying protocol and shared risk register also declare the risk phase-dependent, so a fallback view cannot inherit the combination classification during maintenance. |
| Extravasation and consent | Oral therapy carries no IV extravasation instructions. The consent renderer recognises niraparib tablets and includes agent-specific risks. | Combination consent identifies all three medicines. Maintenance excludes paclitaxel and carboplatin from extravasation advice. Dostarlimab retains a local-guidance prompt where a specific classification could not be verified. |
| Patient portal and downloads | Patient reference, monitoring and chronology, six anatomical toxicity entries, consent, logistics, passport, oral support sheet, three-page guide, wallet card and seven-page handbook. | Reference, monitoring and chronology, eight anatomical toxicity entries, consent, logistics, passport, separate phase support sheets, three-page guide, wallet card and eight-page handbook. |
| Sustainability and tracker | Oral route and frequency are recorded. | Infusion route and changing frequency are recorded. |

For both regimens, the sustainability record leaves unmeasured travel and carbon values open. The tracker now links the source, encoded protocol and current rule count. A synthetic thrombocytopenia decision was taken through the assessment engine and PDF generation for both suites. The clinician knowledge and consent tests used their actual renderers with a simulated document. The tests also generated supportive-care PDFs from each selected phase.

## Printed and retrospective checks

- Verified all 21 patient PDFs and their 21 mirrored copies. Text was present on every page and within page bounds. Checked 196 local HTML resource references, all four source QR images and six QR-bearing rendered pages. Decoded destinations matched the regimen-specific portal or knowledge page. Physical printing and phone-camera tests remain open.
- Both consent forms are two pages. The source and print checks include the clinician/date area. [Print checksums and page counts](audit-results/print.json)
- Five retrospective comparators had their source versions and hashes checked against the original HSE PDFs. Their protocol JSON files matched the production baseline byte for byte. Ten trigger/control cases passed across osimertinib, durvalumab/gemcitabine/cisplatin, tremelimumab/durvalumab, olaparib and olaparib/bevacizumab. These are focused regression checks. [Comparator records](audit-results/comparators.json)
- The established olaparib tests also passed 306 source cases and 1,516 unchanged assessments across 376 other protocols. The established clinician workflow, catalogue fallback, six olaparib patient suites and authenticated transition also passed. The ribociclib suite passed 56 boundary and mixed-risk cases. Enhertu passed 108 cardiac and mixed-risk checks, 112 transition-file checks, catalogue and supportive-care preservation checks.

## Release acceptance

The scoped service tests, route registration, Pages build and built-site validation passed. The deployed-site validator checked the assembled site's canonical architecture, 281 protected portals, redirects and PDF route integrity locally. Full repository regression status is recorded in the handoff. No production deployment or independent consultant, oncology-pharmacy or patient/public-involvement sign-off was performed.

The clinician patient-support anatomical map now uses the six Zejula and eight Jemperli entries authored for the corresponding portals. During regression testing the same shared map was found to contain old copies for 00588 (olaparib) and 00776 (Enhertu). Those two entries were synchronised from their existing patient profiles. Their clinical rules and authored profile wording were preserved.

The printed knowledge reference now includes the same full-size anatomical page as the guide. All six niraparib and eight Jemperli anatomical instructions are required in the guide, handbook and downloadable knowledge reference.

The local browser preflight failed before opening a page because the environment refused Chromium's process socket. Desktop and mobile rendering, actual browser downloads, keyboard and screen-reader behaviour, physical print legibility, and camera acceptance remain open. The existing manual GitHub browser workflow now exercises these two patient portals at 390 and 1,440 px, including browser downloads and phase-specific PDFs. Run on the review branch for external evidence. [Manual validation](https://github.com/pobchina-boop/Sactcheck/actions/workflows/manual-validation.yml)

## Reproduce the focused checks

```sh
node tests/gynaecology-source-audit.test.cjs
node tests/gynaecology-00862-00929.test.cjs
node tests/gynaecology-services-audit.test.cjs
python validation/gynaecology-00862-00929/check-print.py
npm run test:route-registration
npm run build:pages
npm run security:site
npm run test:ci
```

The [case matrix](clinical-cases.json) gives the inputs, expected component action and NCCP page for each case.
