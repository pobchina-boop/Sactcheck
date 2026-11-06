# Lomustine / bevacizumab source audit — staged v0.84.39

This staged audit covers NCCP 00742 v3 and 00804 v2. The production checkout was not modified by this agent. Both remain pending independent clinical and oncology-pharmacy validation.

## Evidence and validation

- Fresh official NCCP PDFs and catalogue plus current EMA Avastin and manufacturer common lomustine SmPC were retrieved on 2026-11-05 with ordinary HTTPS and retained with hashes.
- Each protocol now has 62 inputs and 68 decision rules, compared with 26 inputs and 31 rules before.
- 826/826 source-boundary and assessment/dose-output checks passed; all 68 rules per protocol were exercised. The real checkout assessment engine, dose renderer and protocol validator were used.
- Historical probe: 346/682 checks passed, 336 failed. Different input counts explain different totals; failures are not unique defects.
- No automatic numeric restart or dose multiplication is emitted from incomplete dose history. The reference schedule and 160 mg cap remain available.

## Findings

### LB01: Grade 3 hypertension previously triggered discontinuation without establishing persistence.

Separate grade 2/3 review from persisting grade 3 or grade 4 discontinuation; preserve uncontrolled/symptomatic treatment-day hold and product-specific permanent-stop pathways.

Source: NCCP p4 Table4; EMA SmPC4.4 pp6-7.

### LB02: Platelet range 80-99 omitted fractional values above 99; prior hold recovery was not independently represented.

Use >=80 and <100 for the unallocated source band; existing count-related holds require both ANC>=1 and platelets>=100. No unsupported reduction percentage.

Source: NCCP p3 Table1.

### LB03: DLCO<60 was used as an automatic stopping threshold unsupported by these documents.

Replace with source-qualified FVC or DLCO<70% pulmonary-risk review. New symptoms still prompt assessment.

Source: 00742 p6; lomustine SmPC4.4 p3.

### LB04: Severe hepatic impairment, repeat interval, cumulative exposure and restart context were absent.

Add severe-hepatic not-recommended hold/review, minimum 42-day repeat interval, cumulative product limit 1000 mg/m2, and prior dose/nadir/count review.

Source: NCCP p3 Table2; lomustine SmPC4.2 pp1-2.

### LB05: Intracranial haemorrhage, recent stroke/MI and minimal-enhancement/gliomatosis exclusions were absent.

Add explicit regimen exclusions, retain individual relevance and distinguish baseline indication/eligibility review from clearance.

Source: NCCP pp1-2.

### LB06: Nephrotic syndrome and tracheoesophageal fistula were not independent stop pathways.

Separate nephrotic syndrome from dipstick4+ and quantified protein; any TE fistula stops even below grade4. Add other internal-fistula review.

Source: NCCP p4 Tables3-4; EMA SmPC4.4 pp5-7.

### LB07: Separate lomustine Day1 and bevacizumab-only administrations lacked executable context.

Guard lomustine administration rules on bevacizumab-only visits; delayed toxicity still requires consultant assessment. Preserve 5mg/kg Days1/15/29 versus 7.5mg/kg Days1/22 within 42-day cycles, up to6 cycles.

Source: NCCP p1.

### LB08: Lomustine renal reduction could produce false precision from a nominal schedule without knowing the original capped dose.

Show NCCP 75% of ORIGINAL dose at CrCl30-50 inclusive as consultant review, block automatic numeric multiplication and reconcile previous actual dose, cap and reductions. Below30 or haemodialysis is not recommended.

Source: NCCP p3 Table2.

### LB09: Surgery timing did not independently establish wound healing.

At least28 days after major surgery AND complete healing are required; missing healing remains unassessed. Preserve 00742-specific preoperative guidance; do not transplant it into00804.

Source: 00742 p5; EMA SmPC4.4 p6.

### LB10: Monitoring, drug interactions, support readiness and product-supply safety needed explicit review.

Add review flags and handoff for weekly CBC for at least6 weeks after lomustine, PFT planning, warfarin INR, BP/protein, single-course capsule supply, and separate antiemetic plans for oral lomustine versus bevacizumab-only visits.

Source: NCCP pp2-3,5; lomustine SmPC4.2-4.5 pp2-3.

### LB11: Current common lomustine SmPC conflicts or ambiguities cannot be resolved by copying a dose table.

Preserve NCCP ANC versus product WBC recovery difference, overlapping nadir platelet rows, PFT scheduling difference, and contraception6months versus women7/men4months. Require product-specific clinical/pharmacy reconciliation.

Source: NCCP p3 Table1/p5; lomustine common SmPC revision 2026-01-16 sections4.2/4.4/4.6.

### LB12: Consent could conflate treatment licensing and infusion method.

Document glioblastoma outside current EMA Avastin indications, NCCP unlicensed lomustine supply, and separate off-label rapid-infusion method.

Source: NCCP p1; EMA SmPC4.1.

## Source conflicts retained

- **Platelets80 to<100:** Source table does not allocate a dose. Specialist review unless an existing hold still requires recovery to 100.
- **Lomustine blood-count recovery:** NCCP ANC >=1 differs from common SmPC WBC >=4. These measures are not interchangeable; reconcile the product and clinical context before restart.
- **Lomustine nadir table overlap:** Current common SmPC 70% row includes platelets 24,000-74,999 but 50% row includes <25,000. No automated dose from that overlapping source table.
- **Lomustine contraception:** NCCP 6 months after treatment differs from current common SmPC 7 months for women/4 months for men. Confirm the actual products and combined regimen with pharmacy.
- **Pulmonary monitoring:** NCCP PFTs are conditional; current common SmPC recommends baseline and ongoing tests. Source-specific planning must remain explicit.
- **Renal dose basis and cap:** 75% of original lomustine dose requires the actual original capped dose and prior reduction history. No automatic multiplication of a nominal 90 mg/m 2 reference.

## Integration handoff

- **schedule:** 00742: bevacizumab5mg/kg D1/15/29;00804:7.5mg/kg D1/22. Both lomustine90mg/m2 max160mg D1 only, q42days up to6cycles. No daily lomustine. No RT schedule inferred.
- **support script required:** nccp-lomustine-bev-v08439: oral moderate-high lomustine Day1, minimal bevacizumab-only days; verify local medicines and pharmacy mapping.
- **monitoring:** Show baseline and ongoing bloods, BP and urine protein; product weekly CBC for at least6weeks after lomustine; delayed marrow nadir commonly4-6weeks; conditional renal/liver/PFT/echo/INR plans; no fabricated mandatory MRI frequency.
- **toxicity anatomy:** Preserve full approved detailed anatomy. Anchor marrow/infection/bleeding, lungs/delayed fibrosis, brain/headache/seizure/PRES, blood vessels/BP/clots/bleeding, kidneys/proteinuria, gut/perforation/fistula, wound healing, nausea and fertility. Do not replace with simplified body diagram.
- **three page pack:** Page1 schedule, phases and tests; page2 complete regimen-specific anatomical toxicity; page3 front/back wallet, six-cycle tracker, cutting/print instructions, automatic regimen QR, labelled placeholder contacts and webapp steps. Complete printable handbook must retain all content offline.
- **consent:** Discuss treatment intent, evidence limitations and EMA off-label glioblastoma context; lomustine unlicensed supply; rapid bevacizumab infusion is a separate governance issue.
- **contraception:** Do not use generic six-month wording for everyone without reconciliation: NCCP six months versus current lomustine common product women seven months/men four months; bevacizumab component/actual product must also be checked.
- **clv reference boundary:** The supplied glioma patient reference does not establish medulloblastoma/PNET disease education for00806 CLV. That third protocol needs separate disease-appropriate patient evidence.
- **research handoff:** All five current NCCP PDFs, texts, hashes and detailed requirements are retained under neuro-v39-research/source-requirements.json.00805/00813/00806 remain implementation tasks for other owners.

## Limits

- This is staged protocol implementation and source-boundary validation only; no production checkout files, shared support scripts, patient assets or release metadata were changed by this agent.
- No independent consultant, oncology-pharmacy or patient/PPI validation; clinical_use_authorised remains false.
- Full software release, browser/UI, PDFs, QR decoding and deployed-route checks remain for parent integration. The two JSONs reference a NEW support script that must be authored/registered before release.
- Current-source coverage does not prove that every clinical state is safely automated. Source uncertainty and clinically judged severity remain explicit.
- Conservative holds for suspected serious toxicity/infection are assessment safety pathways derived from warnings, not newly invented NCCP numeric dose tables.
- No numeric restart dose is fabricated. Reference schedule retains lomustine90mg/m2 cap160mg; renal75% recommendation requires the actual original capped dose/history.
- The before/after case counts differ because missing/blank checks enumerate current fields.336 failing historical checks are test assertions, not336 unique clinical defects.
- The source downloads reflect retrieval on 2026-11-05; later product/catalogue revisions require renewed verification.

## Re-run

```bash
SACT_TEST_ROOT=/path/to/checkout node validation/neuro-oncology-v08439/lomustine-bev-source-audit/source-cases.cjs
```

Without SACT_TEST_ROOT, the script uses the package root containing the integrated protocols and JS. build.py is an authoring helper and requires retained research via SACT_RESEARCH_ROOT; it is not a runtime/build dependency. report.json records exact protocol/source hashes and added/removed rule identifiers.

Final navigation metadata registration is documented in ../platform-support-registration.json; clinical rules and inputs unchanged.
