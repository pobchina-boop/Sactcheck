# Olaparib suite: clinical source reconciliation for implementation

Prepared: 24 November 2026. Scope: NCCP **00588 v5b** and **00746 v2**, the patient portal and the existing eight-tool clinical/printable suite. Videos are outside this upgrade. This is an engineering source checklist, not a replacement prescribing protocol or a record of clinical approval.

## 1. Primary source register and provenance

| ID | Source and URL | Version/date and locator |
|---|---|---|
| N588 | [NCCP Olaparib (Tablet) Monotherapy, 00588](https://www.hse.ie/eng/services/list/5/cancer/profinfo/chemoprotocols/gynaecology/588-olaparib-tablet-monotherapy.pdf) | v5b; original publication 26 November 2020; v5b amendment 1 May 2025; review due 21 December 2026; 7 printed pages. v5b changed reimbursement status of h/i. |
| N746 | [NCCP Olaparib (Tablet) and Bevacizumab Therapy, 00746](https://assets.hse.ie/media/documents/746_V2_Olaparib_bevacizumab_therapy.pdf) | v2, amended 9 December 2024; original publication 1 September 2023; review due 9 December 2029; 11 printed pages. |
| CAT | [HSE live oral SACT regimen register](https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/oral-anti-cancer-medicines-sact-regimens/) | Checked 24 November 2026; confirms listed 00588 a–i indication scope. The current migrated 00588 download endpoints encountered 404/500 errors; the official hse.ie PDF was retrievable through its indexed PDF text. Do not infer a newer version from a changed URL. |
| EMA-L | [EMA Lynparza product information](https://www.ema.europa.eu/en/documents/product-information/lynparza-epar-product-information_en.pdf) and [EPAR version page](https://www.ema.europa.eu/en/medicines/human/EPAR/lynparza) | EPAR labels product information last updated 19 February 2026. Cite SmPC sections 4.1, 4.2, 4.4–4.8 and package leaflet sections 2–4; these are more stable locators than PDF page numbers. |
| EMA-B | [EMA Avastin product information](https://www.ema.europa.eu/en/documents/product-information/avastin-epar-product-information_en.pdf) | Bevacizumab safety/administration reconciliation: sections 4.2–4.6. Use the actual selected product's SmPC for dispensing/preparation. |

NCCP supplies the Irish regimen scope and operational rules. SmPC supplies current labelled warnings and details where NCCP explicitly refers to it. A broader EMA licence is **not** evidence of HSE reimbursement or inclusion in these two regimens. Source differences below must be displayed, not silently resolved by a dose calculator. Record the selected indication, source versions and review date in each generated output.

**Retained original verification added 24 November 2026:** the repository contains the previously retained NCCP 00588 v5b PDF at `validation/prostate-v08457/clinical/sources/00588.pdf` (7 pages; 1,152,036 bytes; SHA-256 `de66f9a3d6d802aee6d32261407a7048d2eae2441a730005e1380bda6807d489`). The original retention review manifest, `validation/prostate-v08457/clinical/new-sources.json`, records source checking on **16 November 2026**. Its printed page 5 was independently re-read against the rules on 24 November. This is a retained historical download, not a new successful HSE binary retrieval. The freshly retrieved EMA Lynparza PDF is also available at `/workspace/scratch/bcd695be21b5/olaparib-upgrade/source-pdfs/lynparza-ema.pdf` (1,808,342 bytes; SHA-256 `04cb6a8e4fff66099a345e60858378068000de050b0e7fedaddb3d5347849598`). No downloaded-original hash is asserted for NCCP 00746.

The reported review date is the source's planned review date, not a guarantee of ongoing currency. This reconciliation records the versions actually retrieved. The organ-impairment, toxicity-ladder and combination counselling differences are handled as explicit review states rather than blocking implementation of the well-defined rules.

## 2. 00588: choose the indication before generating the plan

Sources: N588 pp1–3. The suffix must persist into the decision output, knowledge base, consent, patient guide, support plan and passport/card.

| Code | Exact route within this Irish regimen | Biomarker and principal boundary | Duration |
|---|---|---|---|
| 00588a / b / c | First-line maintenance: advanced FIGO III–IV high-grade epithelial ovarian / fallopian-tube / primary-peritoneal cancer, respectively | BRCA1/2 germline and/or somatic; complete or partial response to first-line platinum | Until radiological progression/unacceptable toxicity; up to 2 years if no radiological disease at that point. Disease present at 2 years permits clinician consideration of continuation if benefit remains. |
| 00588d / e / f | Platinum-sensitive relapsed maintenance: high-grade serous epithelial ovarian / fallopian-tube / primary-peritoneal cancer | BRCA germline and/or somatic; complete or partial response to platinum | Until progression/unacceptable toxicity; do not impose a 2-year stop. |
| 00588g | Monotherapy for metastatic castration-resistant prostate cancer after progression on prior treatment including a new hormonal agent | BRCA1/2 germline and/or somatic; this is not an all-comer or first-line abiraterone combination pathway | Until progression/unacceptable toxicity. Continue LHRH medical castration if not surgically castrated. |
| 00588h | Adjuvant treatment of high-risk, HER2-negative early breast cancer after neoadjuvant or adjuvant chemotherapy; alone or with endocrine therapy | Germline BRCA1/2 is required; tumour-only/somatic status does not satisfy this entry | Up to 1 year, or recurrence/unacceptable toxicity, whichever occurs first. |
| 00588i | First-line maintenance of metastatic pancreatic adenocarcinoma | Germline BRCA1/2; no progression after at least 16 weeks of platinum within first-line chemotherapy | Until progression/unacceptable toxicity; stable disease is not automatically excluded by a requirement for CR/PR. |

### Additional indication-specific eligibility

- **First-line ovarian group (N588 p2):** high-grade serous or high-grade endometrioid histology, FIGO III–IV, at least 4 first-line platinum cycles, radiological CR/PR, ECOG 0–1. Last platinum ordinarily within 8 weeks of olaparib initiation; source permits 12 weeks where debulking surgery is required. If BRCA is identified after chemotherapy plus bevacizumab has begun, source permits stopping bevacizumab and beginning olaparib 4–8 weeks after last chemotherapy. Keep this as a clinician-selected route, not an automatic switch.
- **Relapsed ovarian group (N588 p3):** ECOG 0–2, at least two platinum courses, previous platinum regimen completed in preceding 8 weeks; response to penultimate platinum lasted **more than 6 months** and latest regimen induced CR/PR. Pretreatment CA-125 must be within ULN, or, if elevated, repeat after 7 days with increase **less than 15%**. Life expectancy at least 16 weeks. Preserve strict >6-month and <15% boundaries.
- **Prostate (N588 pp1–3):** metastatic, castration-resistant, prior new hormonal agent and subsequent progression, validated BRCA result, ECOG 0–2. Do not conflate the continuation of androgen deprivation with adding abiraterone/prednisolone.
- **Pancreatic (N588 pp1,3):** metastatic adenocarcinoma, germline result, first-line platinum for ≥16 weeks without progression, ECOG 0–2. Neither nonmetastatic pancreatic cancer nor a somatic-only result satisfies this pathway.
- **All 00588 routes (N588 pp2,4):** adequate organ function; exclude prior PARP-inhibitor therapy and olaparib/excipient hypersensitivity. Pregnancy and breastfeeding restrictions apply where relevant. A Consultant Medical Oncologist initiates the plan. Retreatment is not implicitly allowed.

For molecular inputs, retain the validated report and whether the result is germline/tumour-derived. EMA-L §4.2 specifies deleterious or suspected deleterious mutations for the relevant BRCA-selected routes; a variant of uncertain significance must not silently become a positive eligible result.

### Breast high-risk logic: four distinct branches

Source: N588 p3. Do not collapse these into one positive-node threshold.

| Prior chemotherapy and subtype | NCCP high-risk condition |
|---|---|
| TNBC, neoadjuvant | Residual invasive cancer in breast or resected nodes; no pathological complete response |
| TNBC, adjuvant | Axillary node-positive **or** node-negative with pathological primary tumour ≥2 cm |
| HR-positive / HER2-negative, neoadjuvant | No pathological complete response **and** CPS+EG ≥3 |
| HR-positive / HER2-negative, adjuvant | At least 4 pathologically confirmed positive nodes |

ECOG 0–2. Source says initiation **ideally within 12 weeks** of completing the last surgery, chemotherapy or radiotherapy: render an advisory/timing review, not an invented absolute reimbursement exclusion. Endocrine therapy can continue when clinically appropriate; its drug/dose remains the separate prescribed plan (N588 pp1–3; EMA-L §4.2).

### Scope exclusions for implementation

Do not add metastatic breast cancer, BRCA-unselected relapsed ovarian disease, olaparib plus abiraterone/prednisone, or olaparib plus durvalumab/endometrial treatment under 00588 merely because they appear in EMA-L §4.1. This upgrade covers the verified NCCP codes above and 00746 below.

## 3. Shared olaparib dosing and administration

Sources: N588 pp2,5–6; N746 dose tables; EMA-L §4.2 and leaflet §3.

| Context | Dose per administration, twice daily | Total daily amount | Tablet composition per administration |
|---|---:|---:|---|
| Standard tablets | 300 mg | 600 mg | 2 × 150 mg |
| Adverse-reaction dose level −1 | 250 mg | 500 mg | 1 × 150 mg + 1 × 100 mg |
| Adverse-reaction dose level −2 | 200 mg | 400 mg | 2 × 100 mg |
| Unavoidable strong CYP3A inhibitor, after interaction review | 100 mg | 200 mg | 1 × 100 mg |
| Unavoidable moderate CYP3A inhibitor, after interaction review | 150 mg | 300 mg | 1 × 150 mg |

- Tablets are continuous oral treatment, morning and evening, with or without food. Swallow whole; do not divide, crush, chew or dissolve. These are **tablet** doses, not capsule substitution instructions.
- Missed dose: next normal dose at its scheduled time; no double/catch-up dose. Do not invent a vomiting redose rule from the missed-dose rule; use a locally reviewed instruction if added.
- Adverse effects can require an interruption and/or a reduction; all modifications require consultant discussion under NCCP. Preserve current dose and reason for reduction. Recovery of counts does not reset a previously reduced dose to 300 mg.
- The documented toxicity ladder stops at 200 mg twice daily. The 150/100 mg interaction doses are **not additional toxicity ladder steps**.
- The sources do not give a validated arithmetic formula for simultaneous renal impairment, CYP3A inhibition and prior toxicity reduction. Show the interacting factors and require a recorded prescriber/pharmacist decision; do not multiply percentages or silently choose the lowest number.

## 4. Baseline and follow-up checks

Sources: N588 p4; N746 pp4–5; EMA-L §4.4.

| Item | 00588 monotherapy | 00746 combination |
|---|---|---|
| Biomarker | Validated BRCA result; germline vs somatic requirement follows chosen indication | Validated HRD-positive status (BRCA1/2 mutation and/or genomic instability) |
| Blood/organ tests | FBC, renal and liver profile at baseline | Same, plus bevacizumab-specific checks below |
| Routine blood/organ schedule | Every **4 weeks** for first 12 months, then as clinically indicated | Every **3 weeks** for first 12 months, then as clinically indicated |
| Pregnancy | Baseline test where relevant; consider repeat as indicated. SmPC uses women of childbearing potential, broader than simply premenopausal | Same, with both agents' reproductive restrictions |
| Haematological readiness | Prior anticancer-treatment toxicity recovered to ≤CTCAE grade 1 for Hb/platelets/neutrophils before starting (SmPC) | Same olaparib requirement |
| Disease surveillance | According to consultant treatment plan; source does not prescribe one universal scan interval | According to consultant plan |

The repeat-cycle ANC/platelet table must not replace baseline recovery requirements or the assessment of anaemia. Capture Hb/anaemia severity and transfusion dependence as well as ANC and platelets. Record CrCl in mL/min and method/source; do not relabel eGFR in mL/min/1.73m² as CrCl without a validated calculation. Unknown or stale values remain unassessed, with the missing information named.

## 5. Olaparib dose-decision rules and unresolved edges

### Haematology

Sources: N588 p5 Table 2; N746 p6 Table 2; EMA-L §4.4.

| Findings | Source-directed interpretation |
|---|---|
| ANC ≥1 ×10⁹/L **and** platelets ≥100 ×10⁹/L | Blood-count table permits 100% of the **previous dose**, subject to other checks |
| ANC <1 **or** platelets <100 | Delay until recovery, then reduced dose level; fourth occurrence: cease olaparib |
| Febrile neutropenia | Delay until recovery and reduce; fourth occurrence: cease. For grade 4 FN, consider a two-level reduction on restart |
| Severe haematological toxicity or transfusion dependence | Interrupt and investigate, regardless of a reassuring ANC/platelet pair |
| Counts still clinically abnormal after 4 weeks of interruption | Marrow and/or cytogenetic investigation recommended; do not keep issuing routine dose-restart outputs |
| Suspected MDS/AML | Haematology referral and investigation |
| Confirmed MDS/AML | Discontinue olaparib |

**Do not manufacture a third reduction:** the NCCP fourth-occurrence cessation instruction coexists with only two defined reduction steps. If another reduction is requested after 200 mg twice daily, or a two-step reduction would exceed the ladder, retain the interruption and escalate the restart decision. Capture the relevant recurrence count explicitly; the source does not define an automatically aggregated counter spanning unrelated toxicities.

### Renal and hepatic source reconciliation

Sources: N588 p5 Table 3; N746 p7 Table 3; EMA-L §4.2.

| Input | NCCP text | Current SmPC text | Implementation decision |
|---|---|---|---|
| CrCl >50 | No adjustment | Mild 51–80: no adjustment | No renal reduction by this rule alone |
| CrCl 31–50 | Within 30–50 band: 200 mg twice daily | 31–50: 200 mg twice daily | Concordant 200 mg twice daily, subject to other factors |
| CrCl exactly 30 | Within NCCP 30–50 band: 200 mg twice daily | ≤30: not recommended; exceptional use only if benefit outweighs risk with careful monitoring | **Source-boundary conflict: clinician/pharmacist review. No unqualified automatic dose/proceed result** |
| CrCl <30 or haemodialysis | Consider 50% of original dose (Giraud-derived recommendation) | Severe impairment/ESRD not recommended because safety/PK unstudied; exceptional severe-renal use needs individual benefit–risk and close monitoring | Display both; do not convert “consider” into routine 150 mg twice daily |
| Child–Pugh A/B | No adjustment | No adjustment | No hepatic reduction by this rule alone |
| Child–Pugh C | Consider 50% original dose | Not recommended; safety/PK unstudied | Display conflict/manual review; no automatic 50% prescription |

NCCP does not supply an AST/ALT/bilirubin numeric olaparib interruption table. Do not borrow immunotherapy thresholds or invent multiples-of-ULN dosing rules. Separate chronic hepatic impairment from suspected acute DILI. If DILI is suspected, interrupt; for severe DILI, consider discontinuation as clinically appropriate (EMA-L §4.4).

### Interactions

Sources: N588 pp5–6; EMA-L §§4.2,4.5.

- Avoid strong/moderate CYP3A inhibitors if an alternative exists. If unavoidable, use the source-specific interaction reductions above after review. Relevant examples include clarithromycin/itraconazole (strong), fluconazole/diltiazem (moderate). NCCP also lists aprepitant as moderate: the support-prescribing module must not add it without an interaction decision.
- Avoid strong/moderate CYP3A inducers because reduced olaparib exposure can compromise effect; examples include rifampicin, carbamazepine, phenytoin and St John’s wort. Do not invent compensatory olaparib escalation.
- Avoid grapefruit juice. Review prescribed, over-the-counter and herbal products; the displayed examples are not a complete interaction database.
- Olaparib also affects transporters/substrates. A medication review is needed for narrow therapeutic-index drugs, relevant statins, anticoagulants and other interacting agents. A reassuring CYP3A dropdown alone cannot certify the full medication list.

## 6. Support, patient understanding and consent content

Sources: N588 p6; N746 supportive-care pages; EMA-L §§4.4–4.8 and leaflet §§2–4.

### Mechanism and purpose

Explain that olaparib blocks PARP-associated DNA repair; selected cancers with BRCA/HRD defects are more vulnerable when repair capacity is further reduced. Then give the **selected pathway's** purpose: adjuvant breast treatment aims to reduce recurrence risk; ovarian/pancreatic maintenance aims to extend disease control after chemotherapy; prostate treatment aims to control progressed mCRPC. Avoid a single generic promise or transplanting outcome numbers between settings. Explain why blood tests, dose pauses and contact instructions support safe treatment.

Explain germline and tumour-only results in plain language; a tumour finding does not by itself establish an inherited change. Provide the locally appropriate genetics/counselling route (EMA-L §4.2), with no invented family-specific risk prediction.

### Side effects and urgent routes

- Olaparib-specific common/very common material risks: anaemia, reduced white cells/infection risk, fatigue/weakness, nausea/vomiting, diarrhoea, appetite/taste changes, indigestion, headache/dizziness; thrombocytopenia/bleeding, mouth soreness, rash, transaminase or creatinine increases also require discussion as appropriate.
- Serious risks needing explicit consent and safety-card prominence: severe cytopenias, MDS/AML, pneumonitis, VTE/PE, hepatotoxicity/DILI and serious allergy. Use an agent-labelled olaparib section and, for 00746, a separate bevacizumab section.
- New/worsening dyspnoea, cough, fever or abnormal chest imaging: olaparib interruption and prompt assessment for pneumonitis; confirmed pneumonitis requires discontinuation. Patient material should direct urgent contact rather than ask patients to diagnose the cause.
- New painful/swollen limb, chest pain or sudden breathlessness: urgent clot assessment. VTE warning is especially relevant to mCRPC; do not apply the abiraterone-combination trial incidence to 00588g monotherapy.
- Fever/infection symptoms, unusual bruising/bleeding, marked pallor/fatigue/dyspnoea, jaundice/dark urine/right-sided abdominal pain, inability to retain fluids or severe diarrhoea: clear urgent team contact route. Any numeric fever threshold must come from the approved local acute-oncology instruction, not an invented threshold in these PDFs.
- Avoid describing MDS/AML uniformly as “less than 1%.” EMA-L §4.8 contains setting-dependent long-follow-up risks (including higher risk after multiple platinum lines). If numbers are included, preserve regimen, population, comparator and follow-up; pooled frequency labels are not lifetime individual-risk estimates.

### Support prescriptions and daily use

N588 labels emetic potential moderate-to-high and asks to **consider** antiemetics and a PPI under local policy. EMA-L §4.8 says routine antiemetic prophylaxis is not required. Preserve this nuance: offer a locally selected nausea plan and rescue instructions; do not generate a mandatory universal multidrug prophylaxis prescription. Do not add routine G-CSF, antibiotics, anticoagulation or steroids without a separate indicated/local plan. For breast hormone-dependent disease, incorporate the existing endocrine plan; for prostate, preserve the ongoing castration plan. Include adherence, swallowing, interaction review, storage/product leaflet access, fatigue and driving advice.

### Reproductive safety

EMA-L §§4.4,4.6: no pregnancy during treatment; two reliable complementary contraception methods before/during and for **6 months after** olaparib, with non-hormonal considerations particularly in hormone-dependent cancer. Men: condom with pregnant/childbearing-potential partner during and for **3 months after**; partner contraception and no sperm donation for that interval. Olaparib breastfeeding prohibition: during and **1 month after**. Bevacizumab adds a **6-month** post-treatment breastfeeding restriction and 6-month contraception interval; in 00746 derive advice from both last-dose dates, not the shorter olaparib-only interval (EMA-B §4.6).

## 7. 00746 combination-specific checklist

### Scope and eligibility

Source: N746 pp1–3. **00746a/b/c** covers first-line maintenance of adult FIGO III–IV high-grade epithelial ovarian/fallopian-tube/primary-peritoneal cancer after CR/PR to platinum chemotherapy **with bevacizumab**, with validated HRD positivity: **BRCA1/2 mutation and/or genomic instability**. A BRCA-wild-type but genomic-instability-positive case can satisfy the molecular criterion. HRD unknown is not a positive result.

The detailed eligibility is high-grade serous/endometrioid histology, or other epithelial non-mucinous ovarian histology with a germline BRCA mutation; **6–9 platinum-taxane cycles**; bevacizumab with the last **3 platinum cycles**, or at least **2 bevacizumab cycles** with interval debulking surgery; NED/CR/PR; ECOG 0–1; adequate marrow/organ function. Do not silently admit stable disease, a recurrent-maintenance course, prior platinum without bevacizumab, or prior PARP treatment.

Exclusions include prior PARP inhibitor, pregnancy, major surgery within four weeks, hypersensitivity to components and relevant CHO-cell/recombinant-antibody hypersensitivity. The NCCP breastfeeding exclusion uses the olaparib one-month interval; **the combination needs the longer bevacizumab rule in section 6 above**. Cautions include uncontrolled hypertension, proteinuria/renal disease, bleeding/coagulation problems, significant cardiovascular disease, prior pelvic radiation, prior MDS/AML, anthracycline/chest-wall radiation exposure, significant VTE history, arterial thromboembolism within six months, and conditions/procedures raising fistula or perforation risk. These need individual review; do not transform every caution into an absolute contraindication (N746 pp3–4).

### Two drugs, two clocks and two types of checks

| Component | Schedule | Endpoint and implementation |
|---|---|---|
| Olaparib tablets | 300 mg orally twice daily, continuous, with reviewed reductions as above | Radiological progression/unacceptable toxicity; up to 2 years if NED. Continuing beyond 2 years with residual disease is an individual benefit decision. |
| Bevacizumab | 15 mg/kg IV day 1 every 21 days; NCCP dilution 100 mL sodium chloride 0.9% | Progression/unacceptable toxicity or maximum **15 months total**, including the earlier chemotherapy-combination period. Do not restart the clock at maintenance initiation. |

Source: N746 pp1–2. Bevacizumab first infusion 90 minutes; second 60 if first tolerated; subsequent 30 if preceding infusion tolerated. Shortening is conditional; no IV bolus. Use the selected bevacizumab product's preparation instructions. A 21-day review cycle does **not** create tablet rest days. Store separate start/last-dose dates and prior bevacizumab exposure. Reaching the bevacizumab endpoint does not automatically stop olaparib.

At baseline add urine dipstick, BP and cardiac history/examination; consider ECHO for previous anthracycline or chest-wall irradiation; INR if indicated. Repeat urine protein and BP before each cycle, and BP after treatment; regular FBC/renal/liver profile is **q3 weeks for 12 months**. For warfarin, INR weekly until stable then before each cycle. Do not claim q4-week monotherapy monitoring covers this regimen (N746 pp4–5).

### Bevacizumab proteinuria: distinct input types and exact thresholds

Source: N746 p7 Table 4. These are component-specific rules; they do not determine the olaparib dose.

| Finding | NCCP action |
|---|---|
| Dipstick negative/1+, or laboratory urine protein <1 g/L | Scheduled bevacizumab dose by this rule |
| Dipstick 2+/3+, or laboratory urine protein ≥1 g/L | Source permits scheduled dose; arrange 24-hour total protein collection **within 3 days before the next administration** and use the quantitative pathway |
| Dipstick 4+ at baseline or during therapy | Withhold bevacizumab; collect 24-hour urine |
| Total protein ≤2 g/24 h | Proceed by this rule |
| Total protein >2 through 4 g/24 h | Hold; repeat 24-hour collection every 2 weeks; resume when ≤2 g/24 h |
| Total protein >4 g/24 h | Discontinue bevacizumab |
| Grade 4 proteinuria/nephrotic syndrome | Discontinue bevacizumab (N746 p8; EMA-B §4.4) |

Do not convert a spot concentration in g/L or a dipstick grade into g/24 h. A concerning dipstick cannot override a known quantitative hold/stop result. The NCCP operational boundary above includes **exactly 2.0** in the proceed band and **exactly 4.0** in the hold band. EMA-B §4.8 describes many clinical trials holding at ≥2 g/24 h; that descriptive trial practice must not silently replace the explicit NCCP table without a documented clinical policy decision.

### Bevacizumab hypertension and other safety pathways

Source: N746 p8 Table 5 and EMA-B §4.4.

| Finding | Drug-specific action |
|---|---|
| Uncontrolled or symptomatic hypertension on treatment day | Withhold bevacizumab; start/adjust antihypertensive management |
| Grade 2–3 hypertension | Treat and consider interruption until controlled |
| Grade 4 or persistent grade 3 hypertension | Discontinue bevacizumab |
| TE fistula or any grade 4 fistula | Discontinue bevacizumab |
| Other fistula, including non-TE grade 1–3 | Type-specific clinical review; SmPC says consider discontinuation for internal non-GI fistula and notes limited continuation evidence for other fistulae. Do not label every fistula an automatic permanent stop. |
| GI perforation | Discontinue bevacizumab |
| Grade ≥3 haemorrhage | Discontinue bevacizumab |
| Intracranial bleeding | SmPC requires bevacizumab discontinuation; do not suppress this pathway merely because a generic bleeding-grade field is below 3 |
| Grade 4 thromboembolic event | Discontinue bevacizumab |
| Diagnosed arterial thromboembolic event, including TIA/MI/stroke | SmPC separately requires permanent bevacizumab discontinuation; do not restrict all thrombosis logic to grade 4 |
| Other VTE ≤grade 3 | Clinical treatment and close monitoring; not an automatic permanent stop solely from this grade |
| Confirmed PRES | Discontinue bevacizumab; manage symptoms/BP; diagnosis requires assessment/imaging |
| Major surgery <28 days, unhealed wound, wound complication, or planned elective surgery | Withhold/not initiate bevacizumab according to surgical context; elapsed 28 days does not waive the fully-healed requirement |
| Necrotising fasciitis | Discontinue bevacizumab and urgent treatment |
| Infusion hypersensitivity reaction | Stop infusion and manage the reaction; subsequent plan determined clinically |

NCCP defines uncontrolled hypertension for initiation as **sustained BP >150/100 mmHg while receiving antihypertensive medication**. Preserve the sustained reading, symptoms and treatment context; the notation does not define an explicit machine-readable AND/OR rule for systolic/diastolic components. Avoid inventing a universal single-reading threshold. SmPC separately requires adequate pretreatment control and permanent discontinuation for medically significant hypertension not controlled by medication, hypertensive crisis or encephalopathy. New neurological symptoms require urgent assessment rather than a software diagnosis of PRES.

**No bevacizumab dose-reduction ladder:** use temporary suspension or permanent discontinuation, as indicated (N746 p6). The NCCP renal/hepatic table says no adjustment is expected, including dialysis; EMA-B §4.2 notes these populations have not been adequately studied. “No adjustment expected” is not evidence of established safety in severe impairment.

### Combination consent/support additions

Explain bevacizumab's VEGF/angiogenesis mechanism separately from olaparib's PARP mechanism. Agent-specific material risks include hypertension, urine protein/kidney injury, bleeding, arterial/venous clots, impaired wound healing, perforation/fistula, infusion reactions, PRES, impaired fertility and relevant cardiovascular risks. Connect urine/BP/healing checks to those risks. Routine bevacizumab premedication is not usually needed unless there is previous hypersensitivity; minimal emetic potential does not justify an automatic steroid/antihistamine/antiemetic bundle (N746 pp9–10; EMA-B §§4.4,4.6,4.8).

Keep daily tablets and infusion visits clear in patient material. A component-specific warning must not become a permanent-stop instruction for the whole regimen. For example, severe cytopenia means **interrupt and investigate olaparib**, whereas confirmed MDS/AML means **discontinue olaparib**; neither source statement by itself establishes an automatic permanent discontinuation of both drugs.

## 8. Engineering acceptance cases

These are fictional input/output specifications for meaningful tests. They are not patient prescriptions. “Passes this rule” must never render as overall treatment clearance if another required item is absent or adverse.

| ID | Input/change | Expected behaviour |
|---|---|---|
| S01 | Select 00588g | All outputs name BRCA-mutated mCRPC after a new hormonal agent; ongoing LHRH if not surgically castrated; no fixed 1-/2-year duration and no automatic abiraterone/prednisolone. |
| S02 | Select 00588h | One-year adjuvant plan. Switching to g/i/d removes the one-year cap across portal, consent, support and PDF. |
| S03 | Breast or pancreatic case: somatic-only BRCA result | Does not satisfy germline criterion; needs documented germline result. Same result can satisfy prostate/ovarian molecular-type criterion if other conditions are met. |
| S04 | Adjuvant TNBC, node-negative, tumour 1.9 vs 2.0 cm | 1.9 does not meet this high-risk route; 2.0 does. No invented node requirement at 2.0. |
| S05 | HR+/HER2− neoadjuvant: residual disease, CPS+EG 2 vs 3 | 2 does not meet this route; 3 does. Pathological complete response must not pass even with a score entry. |
| S06 | HR+/HER2− adjuvant: 3 vs 4 positive nodes | 3 does not meet route; 4 does. Do not reuse TNBC node logic. |
| S07 | Pancreatic first-line platinum 15 vs 16 weeks, nonprogressive disease | 15 fails duration criterion; 16 passes that criterion. Stable disease is not rejected merely for lacking CR/PR. |
| S08 | First-line ovarian at 24 months, NED vs persistent radiological disease | NED triggers planned completion review; persistent disease permits recorded consultant benefit review. Relapsed ovarian at 24 months has no automatic 2-year stop. |
| S09 | Relapsed ovarian: prior response exactly 6 months; CA-125 rise exactly 15% at 7 days | Neither meets the strict >6-month / <15% criteria respectively. |
| D01 | Previous olaparib 250 mg BID; ANC 1.0, platelets 100 | Count table supports previous 250 mg BID, not escalation to 300. Other checks still apply. |
| D02 | ANC 0.99 with platelets 160, or ANC 2 with platelets 99 | Either abnormality triggers delay; not AND logic. Output gives value, threshold, recovery/reduction pathway and source. |
| D03 | Fourth occurrence of relevant count toxicity/FN | Cease instruction surfaced; cannot return routine restart dose. |
| D04 | Grade 4 FN at starting dose | Hold during acute event; after recovery, two-level reduction can be considered with clinician decision. Do not immediately issue a 200 mg restart order. |
| D05 | Recurrent toxicity already at 200 mg BID | No invented 150 mg toxicity step; review required. |
| D06 | CrCl 51, 50, 31, 30, 29 mL/min | Respectively: no renal reduction; 200; 200; explicit source-boundary conflict; severe-renal review. No normal/proceed result at 30/29. |
| D07 | Child–Pugh C or haemodialysis | Show NCCP/SmPC divergence; no automatic half-dose prescription. |
| D08 | Strong vs moderate unavoidable CYP3A inhibitor | 100 vs 150 mg BID after review; distinct from toxicity ladder. Aprepitant added to support plan triggers interaction review. |
| D09 | Rifampicin or St John’s wort | Avoid/review interaction; no compensatory olaparib escalation. |
| D10 | Severe anaemia/transfusion dependence, ANC 2/platelets150 | Haematological hold/investigation still appears. Normal ANC/platelets cannot conceal severe anaemia. |
| D11 | Counts remain clinically abnormal 4 weeks after interruption | Investigation/haematology path; no blind restart. Confirmed MDS/AML yields discontinue. |
| D12 | New respiratory symptoms; confirmed pneumonitis | Suspected event: interrupt and investigate. Confirmed event: discontinue. Not a routine GI-toxicity dose reduction. |
| D13 | Suspected DILI with no Child–Pugh C label | Interrupt/investigate route still appears; chronic hepatic-class calculation must not suppress acute warning. |
| U01 | Missing CrCl, ANC or platelets; clear one abnormal flag | Missing fields remain “not assessed.” The known flag remains visible; blank values do not become zero or normal. |
| U02 | Patient regimen-only portal with no personal data entered | Usable regimen education and generic downloads; no fictional personal risk calculation or invented individual dose. |
| U03 | Print decision with a flagged threshold | PDF retains input value/unit, threshold, interpretation, unassessed items, selected code, actual source version and review date. It must not drop warnings present on screen. |
| U04 | Change indication/dose after generating any one tool | All subsequent outputs reflect new state; no stale breast duration, old tablet counts or single-agent monitoring cadence in combination PDFs. |
| B01 | 00746, BRCA wild type, validated genomic-instability-positive, high-grade serous, all prior-therapy criteria met | Molecular criterion can pass. HRD unknown/negative, prior PARP, or no prior bevacizumab must not receive an unqualified pathway match. |
| B02 | 00746: 15 total months of bevacizumab but 10 months of olaparib | Bevacizumab endpoint appears without inventing an olaparib endpoint; earlier chemotherapy-phase bevacizumab counts. |
| B03 | 00746 entered after 00588 | Monitoring changes to q3 weeks; olaparib stays continuous; no invented 7-day tablet break. |
| B04 | 24-hour protein 2.0, 2.1, 4.0, 4.1 g/24 h | NCCP table yields proceed-by-this-rule, hold, hold, discontinue bevacizumab respectively. Other risk checks remain active. |
| B05 | Dipstick 3+ vs 4+; only a spot protein of 2 g/L available | 3+ follows scheduled-dose/quantification pathway; 4+ hold/quantify. Spot 2 g/L is not read as 2 g/24 h. |
| B06 | Symptomatic hypertension despite numeric BP below a configured numeric warning | Symptom-dependent hold/review remains visible. A single reassuring reading does not override sustained uncontrolled hypertension. |
| B07 | New diagnosed arterial event, no grade-4 VTE flag | SmPC arterial-event bevacizumab discontinuation appears. Do not require a grade-4 VTE checkbox. |
| B08 | Postoperative day 35 with wound not healed | Bevacizumab remains held/not started; passing the date interval alone is insufficient. |
| B09 | Suspected MDS/AML, neither confirmed nor excluded | Olaparib investigation/hold pathway, not automatic permanent stop of both drugs. Confirmed MDS/AML changes olaparib action to discontinue. |
| B10 | Olaparib last dose 2 months ago, bevacizumab last dose 2 months ago | Combination breastfeeding advice still reflects bevacizumab's ≥6-month interval; no one-month clearance from olaparib alone. |
| B11 | Olaparib reduced after reviewed toxicity, bevacizumab protein hold active | All outputs preserve the separate dose and hold states; no automatic bevacizumab reduction and no patient instruction to self-restart. |
| B12 | Non-TE grade 2 internal fistula vs TE fistula; separately, intracranial bleeding | Other internal fistula gives explicit consideration/review, TE fistula gives discontinue; intracranial bleeding follows its SmPC stop pathway independently of generic bleed grade. |

## 9. Release content checks

- Keep one reviewed content source for the portal and eight tools, with indication-specific overrides; no disconnected duplicated dosing tables.
- A source archive should retain the actual reconciled protocol/SmPC versions and a change log. New source discovery should queue a human-reviewed content change, not automatically rewrite clinical rules.
- Ensure the consent identifies treatment purpose, agent-specific material risks, alternatives/no-treatment discussion space, questions and clinician/patient confirmation fields without claiming the software proves informed consent.
- Where a numeric decision is supported, show the threshold and action; where sources leave discretion or conflict, show that explicitly. Do not invent additional gates merely to make the interface appear complete.
- Keep tests focused on the actual clinical branching and printable consistency above. Video generation remains parked.
