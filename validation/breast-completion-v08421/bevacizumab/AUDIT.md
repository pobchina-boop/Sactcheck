# NCCP 00212 / 00215 bevacizumab component reconciliation — v0.84.21

Checked 25 October 2026 against the official NCCP PDFs and current EMA Avastin product information. These are source proposals and service authoring, not independent clinical validation or permission to prescribe. All consultant/pharmacy/clinical-use approval flags remain false.

## Scope and source identity

| Component | Current source | Source-specific schedule | Source dates |
|---|---|---|---|
| 00212 | NCCP version 7, 8 pages | Bevacizumab 10 mg/kg IV Day 1 every 14 days | Last full review 20 August 2026 |
| 00215 | NCCP version 7, 9 pages | Bevacizumab 15 mg/kg IV Day 1 every 21 days | Version 7 administrative amendment 20 May 2026; footer retains last full review 28 April 2021 |

URLs and SHA-256 hashes are in `sources.json`. Internal protocol IDs and paths remain stable for compatibility. `metadata.nccp_version`, canonical source ID, source URL, source revision date and hash identify the current source; the historical 00212 internal ID is not a claim that the source remains version 6a.

Both protocols are shared bevacizumab **component** records. The new patient suites are explicitly for first-line HER2-negative metastatic breast cancer with paclitaxel. All partner SACT, including paclitaxel, requires separate assessment and support. Source-specific indications and limitations for colorectal, ovarian, lung and renal disease remain in the shared clinical records. Bevacizumab-only selection prompts confirmation of a permitted continuation indication and a consultant plan; it does not create unrestricted breast monotherapy.

## Material defects corrected in the proposals

1. **00212 had the wrong dose and interval in its executable treatment phase:** 15 mg/kg every 21 days had been copied into the 10 mg/kg every 14 days record. Corrected to 10 mg/kg Day 1 every 14 days, with explicit 90 → 60 → 30 minute tolerated-infusion sequence.
2. **00212 contained copied 00215 indications**, including lung and frontline ovarian maintenance indications that do not belong to 00212, alongside incorrect local gynaecology/renal codes. Replaced by source 00212a–d only: colorectal, platinum-resistant ovarian/fallopian/peritoneal, breast, renal. Renal uses interferon alfa-2a; ovarian uses paclitaxel, weekly topotecan or PLD.
3. **Both old engines discontinued every grade 3 hypertension event**, although the source stops *persisting* grade 3 or grade 4. Added a separate persistence input and distinct review/stop rules. Grade 3 with unknown/false persistence does not trigger discontinuation.
4. Completed proteinuria: spot concentration **g/L** is distinct from total **g/24 h**; 2+/3+ or ≥1 g/L needs a 24-hour collection within three days before the next dose; 4+ holds pending quantification. A current, relevant quantitative result applies the ≤2, >2–4 and >4 g/24 h pathways. Exactly 2 permits the proteinuria domain; exactly 4 holds; >4 stops. Grade 4 proteinuria and nephrotic syndrome override a lower current protein value.
5. Added **tracheoesophageal fistula at any grade**; any grade 4 fistula stops. Other internal fistulae require anatomical/clinical review rather than a fabricated universal numeric dose.
6. Preserved arterial-event permanent stopping separately from venous thromboembolism: grade 4 VTE stops, lower grades require close monitoring. Bleeding ≥grade 3, GI perforation, hypertensive crisis/encephalopathy, PRES, necrotising fasciitis and severe infusion reactions have separate pathways.
7. Surgery/wounds require both the postoperative interval and healing: at least 28 days after major surgery **and** a fully healed wound before initiation; wound complications hold until healed. Planned major/minor surgery inputs explicitly mean the withholding window (normally 28/7 days, or the consultant plan).
8. Added source eligibility and risk review, including adult/ECOG scope, correct breast HER2/line/partner context, platinum-resistant ovarian prior-line/prior-VEGF restrictions, lung histology/EGFR restrictions for 00215, recent significant haemoptysis, and relevant interaction cautions.
9. Added 00215 frontline ovarian cycle-1 omission and maximum-duration review without applying its 15-month/22-cycle limit to breast or lung. The shared clinical metadata explains ovarian cycle-2 start, chemotherapy phases, lung/platinum continuation, erlotinib differences and the distinct weekly versus Days 1–5 topotecan partners.
10. Removed conditional hard-required fields. A single actionable entered value remains assessed; omitted domains stay unassessed. No permissive proteinuria finding clears the entire regimen.

## Organ-function distinction that must survive integration

**00212 v7:** adequate organ function is the general eligibility requirement; the new table states no dose adjustment is expected for renal impairment, hepatic impairment or haemodialysis. The proposal gives clinical review text, not an automatic prescribed dose, and does not override proteinuria or other stop/hold rules.

**00215 v7:** the older clinical table states renal/hepatic impairment has not been studied. Initial eligibility remains ANC ≥1.2 ×10^9/L, platelets **>100** ×10^9/L, creatinine ≤1.5×ULN, bilirubin ≤26 µmol/L, and AST/ALP ≤5×ULN. The proposals flag values outside those *initial* criteria for consultant review. They do not manufacture a repeat-cycle hold/reduction table and do not import 00212's updated organ-function permission.

## Evidence attribution

The official EMA Table 10 E2100 summary is the source for the **00212 clinician-only** numeric endpoints. Its investigator primary analysis reports PFS 11.4 versus 5.8 months, HR 0.421 (95% CI 0.343–0.516), p<0.0001; the table's OS analysis reports 26.5 versus 24.8 months, HR 0.869 (95% CI 0.722–1.046), p=0.1374. The source's independent-review PFS and the original journal dataset use different estimates; they are not mixed here.

E2100 used bevacizumab **10 mg/kg every two weeks** plus weekly paclitaxel. It is **indirect schedule evidence for 00215**, so 00215 has no assigned direct q21d/paclitaxel numeric endpoint. The 7.5 mg/kg ICON7 ovarian reference in 00215 is a separate regimen and is not borrowed as evidence for 15 mg/kg breast treatment. Neither suite claims established OS improvement. Patient guides contain qualitative benefit/uncertainty only, with `metrics: []`.

The shared clinical indication list is not a claim that the breast evidence card validates every other tumour indication. No cross-tumour numerical efficacy estimate is assigned.

## Full-service authoring supplied

`authoring.json` uses the exact v0.84.20 `regimens[code]` shape: `patient`, `clinical`, `evidence`, `journey`, `selector`, `support_plans`, `route`, `risk`, `protocol_metadata`.

Each suite includes mechanism/risk teaching, six body-map prompts, relative cycle timelines, date-free treatment/check stages, baseline versus repeated monitoring, clear partner-treatment scheduling, qualitative consent/evidence content, logistics, teach-back/questions, minimal-emetic-risk bevacizumab support and separate paclitaxel-support reminders. There is no automatic bevacizumab steroid/NK1 routine. BP, proteinuria, blood counts, kidney/liver tests, risk-based ECHO and warfarin INR timing are covered; no trastuzumab-style fixed repeat-ECHO schedule is invented.

## Important uncertainties / clinician decisions retained

- NCCP's paired BP expressions >150/100 and >200/110 do not specify an OR/AND algorithm for isolated systolic/diastolic abnormalities. The rule requires clinician confirmation of uncontrolled/severe hypertension; no invented numerical Boolean interpretation is used.
- The NCCP adverse-event tables use grades but do not name the CTCAE edition. Existing CTCAE v5 interface descriptions remain orientation aids with an explicit source-version caveat, not evidence that NCCP mandated that edition.
- 00215 ovarian text combines cycle-2 bevacizumab initiation with a maximum 15 months (22 cycles). Confirm the local convention for counting the omitted first cycle; do not automatically extend the source maximum or promise a fixed number of bevacizumab administrations.
- When a 24-hour result resolves a previous screening dipstick, it must be current and relevant to that same episode. The software cannot infer temporal relevance from an isolated value.
- The recent haemoptysis, nephrotic-syndrome, infusion-reaction and six-month reproductive/breastfeeding details include explicit EMA supplementation; the proposal does not pretend they were all newly added to the 00215 NCCP text.
- No adverse-event dose reduction is automatically calculated. Decisions depend on the actual prescription, consultant review, companion regimen and complete clinical context.
- E2100's allowance for bevacizumab continuation after early chemotherapy discontinuation is a trial detail, not a new unrestricted NCCP breast monotherapy indication.

## Executable acceptance checks

Run from any working directory:

```sh
node validation/breast-completion-v08421/bevacizumab/source-cases.cjs
node validation/breast-completion-v08421/bevacizumab/source-cases.cjs --mode integrated
```

The proposal run passed **334/334 cases** (`proposed-results.json`), covering source boundaries and units, grade-3 persistence, source-specific organ thresholds, contraindications, independent partial inputs, missing/invalid values, ovarian scope limits, dose/interval identity, shared indication codes, optional inputs, source links, governance flags, date-free stages, body-map/support content and evidence attribution. These are software/source acceptance checks, not independent clinical sign-off. The root release process must run the integrated cases and broader regression/PDF/browser checks after integration.

## Files for integration

- `proposed/00212-bevacizumab-q14d.json` — 50 source-linked rules; stable internal ID.
- `proposed/00215-bevacizumab-15mgkg.json` — 60 source-linked rules; stable internal ID and shared path.
- `authoring.json` — two full service authoring entries.
- `sources.json` — exact official URLs, retrieval date and SHA-256 hashes.
- `source-cases.cjs`, `proposed-results.json` — reproducible checks.
- `build-proposals.py` — proposal construction record; writes only this bounded validation directory. Its local raw-PDF paths refer to the research downloads, not live application files.

No live protocols, shared service files, release files or git commits were changed by this research task.
