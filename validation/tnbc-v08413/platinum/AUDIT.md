# NCCP 00348 and 00734 audit — 20 October 2026

Scope: compare the pre-update JSON in `sactcheck-v08412/protocols/breast` with the official HSE documents. This is a source/content audit, not independent oncology/pharmacy approval. No app files edited. Boundary expectations are independent source-derived cases, not an execution result.

## Sources and provenance

- 00348 v8a: https://healthservice.hse.ie/documents/6812/348_Carboplatin_AUC_6_and_weekly_Paclitaxel_80mgm2.pdf . Official document version amendment 7 January 2026. Physically **8 pages**, although its footer erroneously repeats “Page 1 of 9”. Page references below use physical PDF pages (one-based).
- 00734 v3: https://healthservice.hse.ie/documents/6605/734_CARBOplatin_AUC2weekly__Paclitaxel_TNBC_v3.pdf . Nine physical pages.
- Both documents were successfully read through web PDF extraction on 20 October 2026. Direct local download returned HTTP403; therefore no original local PDF/hash is claimed. `source-extracts.json` preserves the retrieved source text and URLs. Screenshot calls returned image reference placeholders without inspectable image data; the ambiguous 00348 haem table should receive visual human verification.

## Material findings requiring repair

Both JSONs are contaminated by the pembrolizumab template. Remove pembrolizumab hypersensitivity, immune-only exclusions/cautions, adjuvant-pembrolizumab phase/profile/global rule, pembrolizumab emetogenic entry, TFT/glucose/cortisol monitoring and unrelated staging eligibility. Source eligibility is TNBC neoadjuvant treatment, ECOG0–2 and adequate organ function. Do not restrict to ECOG0–1 or import KEYNOTE stage patterns as NCCP criteria.

The Calvert `target_auc` is incorrectly5 in both files: set6 for00348 and2 for00734. The administration doses themselves already use6/2. Align treatment-phase IDs with rule/profile IDs; phase-free renal/hepatic/toxicity rules must not act on drugs absent from the active phase. Missing phase must prevent definitive component dosing without blocking a partial assessment.

The copied AC haematology table is wrong in both files: remove ANC>=1.5/platelets>90 proceed and ANC1.0–1.49+platelets70–90→75%. The actual ddAC rule is detailed below. Source page maps currently contain impossible pages10–12 and pembrolizumab irAE references; replace them.

## Schedules and longitudinal content

**00348 physical pp1–2:** paclitaxel80mg/m² IV days1,8,15 plus carboplatinAUC6 day1, q21days for4cycles; then doxorubicin60mg/m² plus cyclophosphamide600mg/m² day1 q14days for4cycles. Paclitaxel precedes carboplatin. Dose levels: paclitaxel80→65→50mg/m²; carboplatinAUC6→5→4 (p4). G-CSF required for every ddAC cycle; no automatic primary G-CSF requirement is asserted for every taxane/platinum dose.

**00734 pp1–2:** both paclitaxel80mg/m² and carboplatinAUC2 on days1,8,15 q21days for4cycles; same ddAC phase for4cycles with mandatory G-CSF. First phase contains12 weekly combination administrations (not carboplatin only once every3weeks). No routine immunotherapy continuation follows either regimen.

**Monitoring00348p3:** baseline FBC/liver/kidney, isotopeGFR preferred or estimatedGFR/CrCl; audiology if indicated; MUGA/echo if age>65 or clinically indicated, with LVEF>50% to administer doxorubicin. Regular FBC/liver/kidney **weekly during treatment**, neuropathy assessment as indicated, audiology/cardiac imaging if indicated. Exclusion LVEF<50% versus administration requirement>50% leaves exact50 requiring review. Source does not explicitly mandate a universal baseline ECG for00348 (may be included only as separately attributed guideline/local care).

**Monitoring00734pp3–4:** baseline FBC/liver/kidney, ECG, GFR/CrCl, audiometry if indicated, MUGA/echo if indicated. Regular weekly FBC/liver/kidney, neuropathy and cardiac imaging as indicated. Source baseline eligibility says ANC>1.5 and “platelets75” (no operator); exclusions say baseline ANC<1.5. ExactANC1.5/platelet baseline interpretation needs review, not invented source precision.

Neither regimen specifies fixed CT every3months, routine serial tumour markers, universal q3month echo, DEXA, or mandatory hormonal treatment. Disease imaging follows the consultant treatment plan. Timeline should show baseline assessment→12-week taxane/platinum phase→8-week ddAC phase→surgery/pathology→conditional radiotherapy/next treatment. No scheduled calendar dates need user input. Imaging around phase transition/surgery should be labelled plan-dependent, with responsible team confirmation. Radiotherapy is a subsequent local-treatment step here, not routine concurrent delivery with cytotoxic phases.

## Haematology — source-specific differences

**00348 p4 Table2:** explicitly titled cycles2–4, with Day1 rows. Full doses at ANC>=1 and platelets>=90. The subsequent row literally uses ANC<1 and/or platelets “<70–90”: delay, paclitaxel delay/consider subsequent reduction. The precise platelet-band wording is ambiguous: values below90 must not receive an unqualified proceed result; surface the source ambiguity. Further row ANC<0.5 for>=7days and/or platelets<70 calls for delay/reduction after recovery. Febrile neutropenia and severe platelet nadirs/bleeding result in carboplatin step reductions; source includes first→AUC5 and second→AUC4, and delay>1week first/second occurrences. Maximum delay3weeks. Retain a review instruction for complex recurrent/reduction rows unless their column alignment has been visually confirmed.

There is **no explicit00348 Day8/15 count threshold table** in this source. Remove the copied rule ANC<0.5 or platelets<50→omitpaclitaxel. Continue weekly monitoring and source/local review rather than falsely attributing those thresholds to00348. Baselinecycle1 also is not covered by the table labelled cycles2–4.

**00734 p4 Table1, all weekly pretreatment checks, both drugs:** ANC>=1: full dose domain;0.5–<1:delay; <0.5:delay and consider25% reduction subsequently. FN or prior myelosuppression delay:delay and consider25% reduction. Recovery>2weeks or third myelosuppression delay:delay and consider50% reduction or cease. Platelets>=100:full dose domain;75–<100:clinician discretion, may continue if clinically well;50–<75:delay;<50:delay and consider25% reduction. Do not turn platelet75 into automatic proceed, and do not omit only paclitaxel on days8/15.

**Both ddAC tables** (00348p5Table3;00734p5Table2): ANC>1 and platelets>100→100%; ANC<1/platelets>100→delay1week or longer, then100% after recovery; ANC>1/platelets<100→delay then100% after recovery,75% after second delay. ExactANC1 and platelets100 are not specified. If both are low, do not proceed; explain delay/review without inventing a source dose combination. The75% instruction appears in the platelet-delay row; do not generalise it to every lowANC episode.

## Renal, hepatic and toxicity rules

00348p5Table4;00734pp5–6Table3:

- Carboplatin: GFR<=20 do not administer; >20–30 extreme caution; CrCl<60 increases myelosuppression risk. CalvertGFR cap125. Estimated-function creatinine should be within48hours; isotope dose may remain while creatinine<=110% measurement baseline, otherwise reconsiderGFR. Do not conflate GFR and CrCl without declaring the source of the input.
- Paclitaxel: ALT<10xULN plus bilirubin<=1.25→80mg/m²;1.26–2→60;2.01–5→40. ALT>=10 or bilirubin>5→not recommended. Source decimal gaps(1.25,1.26) and(2,2.01) need explicit handling/review; do not silently round to proceed. ALT is the stated source analyte. Renal impairment/dialysis needs no expected adjustment for paclitaxel.
- Cyclophosphamide: CrCl>=30→100%;10–29→75%(00348) or consider75%(00734);<10→not recommended, if unavoidable consider50%. 00734 explicitly includes dialysis with same not-recommended/consider50% wording;00348 table has no separate dialysis row. DecimalCrCl between29 and30 needs explicit band policy rather than silent precision. Mild/moderate hepatic impairment no expected adjustment; severe not recommended due reduced efficacy (missing in current encoding).
- Doxorubicin: bilirubin20–50µmol/L→50%; printed “>51–86”→25%;>86 orChildPughC→omit(00348) / not recommended(00734). Exact51 and(50,51] remain source gaps; do not silently report full dose.00348 renal: no modification recommended, clinical decision in severe impairment; dialysis consider75%.00734 uses>10 no adjustment,<10 no expected adjustment,dialysis consider75%; exact10 is omitted.
- All these rules must be restricted to the active component/phase. A normal isolated liver/renal result is a partial domain result, not whole-regimen clearance.

00348p6Table5 and00734p6Table4: neuropathy>=grade2 first→paclitaxel reduce10mg/m², persistent/second→further10mg/m²; othergrade2 non-haem toxicity→hold until<=grade1 then reduce10mg/m²;>=grade3 reaction→discontinue. Intolerable after2reductions or delay>2weeks→discontinue. Current `dose_reduction_count>2` misses intolerance after exactly2 reductions; add the intolerance context and preserve strict delay>14day boundary. Escalating grade3 must not yield only neuropathy reduction due to precedence.

## Supportive care

00348p6: carboplatin/paclitaxelDay1 high emetogenic risk; paclitaxelDay8/15 low; ddAC high.00734pp6–7: weeklycarboplatin moderate/paclitaxel low; ddAC high. Existingphase_profiles generally correct but detailedemetogenic_potential copied wrongly into00734 and includespembro. Preserve separate selectable scripts for phases/day group. Premedication firstpaclitaxel dose: dexamethasone8mgIV,chlorphenamine10mgIV,famotidine20mgIV30minutesbefore; day8onward dexamethasone not routine, may addforrisk/reaction; famotidine omission consultant-guided.00734p7 explicitly advises2–3L day1 fluids forcyclophosphamide; individual fluid restrictions still matter.

## Evidence rationale and limits

00348 cites CALGB 40603 (Sikov 2015, PMID 25092775; DOI 10.1200/JCO.2014.57.0572). This randomised phase II 2 × 2 factorial study evaluated adding carboplatin AUC 6 every three weeks and/or bevacizumab to weekly paclitaxel followed by ddAC in stage II–III TNBC. Breast-only pCR was the primary endpoint; breast/axillary pCR was secondary. The breast/axillary pCR comparison was 54% versus 41% (+13 percentage points), pooled across bevacizumab allocation. It is not a simple exclusive two-arm regimen comparison and is not a survival gain. Primary abstract search extraction directly confirmed those percentages; full publisher access returned 403 and PMC showed a challenge. Independently check numbers before publishing.

Primary long-term report: Shepherd 2022, PMID 35044810, DOI 10.1200/JCO.21.01506, https://pubmed.ncbi.nlm.nih.gov/35044810/ . At median follow-up of 7.9 years, no statistically demonstrated EFS/OS improvement from carboplatin was found. The study was not powered for these secondary outcomes. Association of pCR with survival is prognostic and must not be shown as randomised carboplatin benefit.

00734 cites the above plus Chen 2021, a single-centre retrospective conference abstract, DOI 10.1200/JCO.2021.39.15_suppl.e12629. No verified randomised survival gain for the exact weekly AUC 2 schedule should be supplied. Full abstract access was blocked (403); do not populate numerical results from secondary search snippets. State that schedule-specific comparative evidence is limited rather than transplant AUC 6 results without an applicability label.

Contextual primary support: BrighTNess 4.5-year report, Geyer 2022, PMID 35093516, DOI 10.1016/j.annonc.2022.01.009, https://pubmed.ncbi.nlm.nih.gov/35093516/ . The post hoc carboplatin-plus-paclitaxel versus paclitaxel EFS HR was 0.57 (95% CI 0.36–0.91); OS did not differ significantly. Secondary analyses were descriptive because a co-primary endpoint failed. This supports the platinum rationale, but is not exact weekly AUC 2 evidence, not a head-to-head comparison against pembrolizumab, and not a demonstrated OS gain. Do not use cross-trial ranking or transfer KEYNOTE-522 survival results to these non-immune regimens.
