# Lorlatinib 00570 — v0.84.24 source audit

Checked 29 October 2026 against committed v0.84.23. Scope: proposed canonical rules, authoring for the whole service suite and a missing lorlatinib consent-generator profile. No canonical files were edited by this audit. Independent Consultant, oncology-pharmacy and patient/PPI review remain pending; clinical use is not authorised.

## Source reconciliation and unresolved discrepancies

The freshly downloaded migrated HSE PDF is **NCCP 00570 v3**, approved 3 November 2021, with review date 3 November 2026. Its seven pages and version history were read. Page 1 lists only **00570a**: progression after alectinib or ceritinib as first ALK inhibitor, or crizotinib plus at least one other ALK inhibitor. The migrated oral-SACT catalogue also exposes this later-line indication.

An initial search/open of the legacy HSE URL exposed an indexed **v4**, including **00570b** for ALK-inhibitor-naive advanced NSCLC and a CDS date of 1 October 2022. However, fresh HTTP download returned an HSE 404 HTML document, and subsequent web open and screenshot failed with 404. Actual v4 bytes and its version-history amendment could not be verified. `sources.json` retains the failed response hash, not a fabricated PDF hash. Canonical version remains **3**, routing remains **nccp-00570-v3**, and only 00570a is active. A separate assessment context explains the current EMA first-line licence and always requires current NCCP/access verification. The patient scope also makes this discrepancy visible. An indexed indication, European licence and current Irish reimbursement are not treated as interchangeable.

The current EMA Lorviqua product information was freshly downloaded. The EMA page identifies its last update as 3 July 2026, revision 17; the PDF itself leaves section 10 without a printed revision date. The EU document is used rather than importing the different UK indication wording.

Two further material discrepancies are retained:

- **Hepatic impairment:** NCCP v3 says moderate/severe impairment is not recommended because information is unavailable. Current EMA 4.2 allows no adjustment for mild/moderate impairment and a 50 mg daily starting dose for severe Child-Pugh C impairment. The tool requires Consultant/pharmacy source reconciliation and supplies no automatic hepatic dose. An isolated ALT/AST result does not establish chronic hepatic impairment.
- **Moderate CYP3A4/5 inducers:** NCCP recommends avoiding them where possible. Current EMA 4.5 reports no clinically meaningful pharmacokinetic effect with modafinil. The specific medicine is reviewed rather than converting the older class warning into an automatic dose change.

Current EMA uses **absolute eGFR**, whereas NCCP uses **CrCl**, for the same 30 mL/min renal threshold. The input is explicitly NCCP CrCl; an indexed eGFR in mL/min/1.73 m² is not silently substituted.

## Clinically meaningful corrections

The baseline had 16 inputs and 15 rules with several generic ALK-inhibitor assumptions. The proposal has **52 optional inputs and 54 rules**, explicit lorlatinib components and rule-level source links.

- Severe cholesterol **10.35–12.92 mmol/L** or triglycerides **5.71–11.4 mmol/L**, inclusive, now triggers lipid treatment and continuation at the same lorlatinib dose. The old blanket grade 3 lipid hold was incorrect. Cholesterol **>12.92** or triglycerides **>11.4** requires withholding to mild/moderate recovery; same-dose rechallenge with maximal lipid therapy is described. Severe recurrence after a life-threatening episode despite maximal treatment requires one lower level. Values between printed rounded bands, e.g. 10.345 or 5.705, require review rather than interpolation. The legacy cholesterol grade remains compatible, and adverse numerical evidence survives a discordant grade.
- Grade **2–3 CNS effects** require a hold to ≤grade 1 and reduced restart; **grade 4 permanently stops**. Cognitive, mood, mental-status, speech and psychotic effects are included. Mild symptoms prompt assessment rather than an invented automatic reduction.
- Lipase/amylase **grade ≥3** holds to baseline then reduces. Abdominal symptoms require clinical assessment and are not converted to a laboratory grade.
- **Suspected** ILD prompts withholding and evaluation without diagnosing drug-related ILD. Confirmed **grade 1–2** holds to baseline with consideration of corticosteroids, then reduced restart. **Grade ≥3**, recurrence, or failure to recover after **six weeks of both hold and steroid treatment** permanently stops. The old grade ≥2 permanent-stop rule was replaced.
- All five PR/AV-block contexts are represented. Asymptomatic first-degree block continues with ECG/reversible-factor review. Symptomatic first-degree and either second-degree context withhold. Complete block requires cardiac observation/pacing assessment; full-dose restart if paced or one lower level without pacing only after symptoms resolve and **PR <200 ms** remains specialist advice. PR 199, 200 or 201 alone never authorises a restart.
- Grade 3 hypertension holds to ≤grade 1; recurrence reduces. Grade 4 holds with a Consultant choice of reduction or cessation; recurrence or failure of optimal medical control stops. Grade 3–4 hyperglycaemia holds to control then reduces; inability to control despite optimal therapy stops.
- Other grade ≥3 toxicity, including legacy diarrhoea and rash inputs, uses the source hold-to-≤grade-2/baseline pathway. Mild/moderate other toxicity retains the source choice of no change or reduction. Inability to tolerate 50 mg daily stops treatment.
- Strong CYP3A4/5 inducers remain contraindicated. Strong inhibitors require alternative-medicine review; the source 100→75 mg starting adjustment and 3–5 inhibitor half-life washout are stated without stacking reductions. Narrow-index substrate, grapefruit and named hereditary sugar-intolerance concerns are included.
- CrCl **<30** versus **≥30** is exact, with a source starting-dose reference of 75 mg and no dialysis dose invention. Conflicting numeric/legacy renal data retain the adverse finding and add reconciliation. All legacy fields remain present. ALT/AST, bilirubin, CK and QTc values are contextual review findings; borrowed stand-alone ALK thresholds are removed.

The source calls its grading NCI CTCAE but does **not** name an edition. Grade inputs now carry that qualification, source links, meaningful severity labels and assessment guidance. No CTCAE v5 source is silently assigned.

## Service content and evidence

The authoring record covers the patient portal/knowledge reference, consent discussion, practical guide, symptoms, monitoring, supportive care, relative journey and clinician knowledge base. A separate consent profile is ready for the root's consent-generator integration. The treatment is **continuous oral lorlatinib**, usual starting 100 mg daily, with reference dose levels 100→75→50 mg and cessation below tolerated 50 mg. No artificial 21/28-day cycle or planned rest week is introduced. The real dose renderer displays these reference levels, while unresolved dose changes have explicit specialist-review calculation guards.

Baseline monitoring includes ALK, FBC, kidney/liver tests, coagulation, lipids, ECG, BP, glucose and pancreatic enzymes. Lipids are at **2, 4 and 8 weeks** then clinically appropriate; FBC, kidney/liver tests, ECG and amylase/lipase monthly; BP after two weeks and at least monthly; glucose as indicated. LVEF monitoring is conditional on cardiac risk or symptoms. Scans follow the Consultant plan.

Patient instructions specify food flexibility, whole tablets, grapefruit avoidance, missed-dose handling with **at least four hours** before the next dose under the current EMA leaflet, and **no replacement dose after vomiting**. This precise boundary is attributed to EMA; the older NCCP wording is “within 4 hours.” Contraception intervals are at least **35 days for women** and **14 weeks for men** after treatment, with effective non-hormonal contraception/barrier counselling, possible male fertility effects and breastfeeding advice.

NCCP assigns oral minimal-to-low emetogenic risk and requires no routine premedications. NCIS antiemetic V8 was read and is principally a parenteral regimen resource; no IV-chemotherapy steroid or antiemetic course is copied into daily oral therapy. Individual lipid, BP/glucose and symptom treatment remains a prescriber/pharmacist plan.

Clinician evidence uses the **2026 seven-year CROWN update**, data cutoff 31 October 2025: 296 previously untreated patients, lorlatinib versus crizotinib; investigator-assessed seven-year PFS 55% versus 3%, HR 0.19 (95% CI 0.13–0.26). This is a post hoc analysis, without formal between-arm testing; overall survival analysis remains immature. It is neither seven-year OS nor a comparison against other modern ALK inhibitors. The selected 24-month event-free subgroup's conditional 79% figure is not used as a general benefit estimate.

The primary 2018 single-arm phase 2 results are separately labelled: one previous non-crizotinib ALK inhibitor, 9/28 responses (32.1%); two or more previous ALK inhibitors, 43/111 (38.7%). The pooled 47% response included crizotinib-only participants and is not assigned to NCCP 00570a. Patient evidence contains **no numeric outcome metrics**.

## Software verification and integration limits

`node validation/targeted-lung-v08424/lorlatinib/source-cases.cjs` passes **189/189** cases using the actual assessment engine, strict protocol validator and dose/schedule renderer. Strict validation has **zero errors and zero warnings**. Cases cover blanks, nulls, negative controls, exact boundaries, grade/recurrence distinctions, source conflicts, aliases, simultaneous restrictions, no fabricated immediate restart and continuous schedule rendering. `--integrated` is available for root to run after canonical integration.

Critical NCCP pages 3–4 and EMA pages 4–7 were rendered and visually inspected, including inequality signs, source ranges, AV-block restart conditions and the hepatic discrepancy. SHA256 hashes and original PDFs/text are retained under `research/` and `sources.json`.

These are source-based software checks, not clinical validation. Root must integrate canonical content, the missing consent profile and the service builders, then perform browser/PDF, whole-repository and integrated checks. Independent source/version clarification for first-line NCCP access and hepatic prescribing remains necessary before clinical authorisation.
