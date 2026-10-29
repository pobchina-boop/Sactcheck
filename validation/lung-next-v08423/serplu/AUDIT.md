# NCCP 00908 source and full-suite proposal — v0.84.23

Checked 26 October 2026 against NCCP00908 **v1b**, published8August2025, amendment10September2026, review29January2027. Stable canonical ID **nccp-00908-v1a** is deliberately retained. The previous live content had23rules; this proposal has94rules and78optional inputs, including13explicitly attributed current EMA SmPC supplements. All independent clinical/pharmacy/clinical-use approvals remain false.

## Sources and inspection

- Current HSE lung catalogue links to `https://healthservice.hse.ie/documents/6856/908_NCCP_SACT_Regimen_Serplulimab.pdf`. Downloaded PDF/text and hashes retained under `research/`; the complete nine-page source was read. Tables1–2 (pages1–2), tables3–4 (page5) and immune table5/footnotes (pages6–7) were visually inspected in rendered PNGs.
- Current EMA Hetronifly SmPC, product-information listing updated8October2026, was downloaded successfully by the root agent. Sections4.2,4.4,4.8 and5.1 were read; treatment-modification pages4–5 were visually inspected. The original web retrieval returned429, but this limitation was resolved. The verified PDF SHA256 is recorded in supplemental-source metadata and `sources.json`.
- NCCP NCIS Medical Oncology antiemetic medicines **V8 (2025)**, Table1 page4 and multi-day note page5, verified from the official full PDF.
- ASTRUM-005 original primary paper (JAMA2022, PMID36166026; full publisher text) and long-term secondary analysis (JAMA Oncology2026, PMID42240984; publisher/author abstract) checked separately. The October2026 correction (PMID42821285) restores omitted eTable6 in Supplement3; it does not announce revised main-report OS estimates.
- Official HPRA etoposide IV SmPC and Vepesid oral SmPC checked for mechanism, handling, renal distinctions and risks. HSE chemotherapy safety page checked for urgent advice. EMA overview and current product information support serplulimab explanation and consent risks.

## Material clinical corrections

| Domain | Source fidelity and encoded handling |
|---|---|
| Source version and administration | v1b changes serplulimab infusion volume to100mL. Serplulimab4.5mg/kg is given first, carboplatinAUC5 Day1, etoposide100mg/m² IV Days1–3. Four induction cycles then serplulimab alone every21days until progression/unacceptable toxicity. No invented maintenance cap. |
| Separate oral option | Table2 uses etoposide100mg/m² IV Day1 and100mg/m² orally **twice daily** Days2–3, empty stomach. It is an alternative, not additional dosing or mg-for-mg interchange. Main timeline remains IV; patient/consent/logistics explicitly explain the alternative. |
| Eligibility | Adult first-line ES-SCLC, ECOG0–2, adequate function, baseline ANC≥1.5 and platelets≥100. Untreated CNS disease, symptomatic ILD, active significant infection and systemic immunosuppression are cautions. Prior PD-1/PD-L1 needs NCCP policy review. Hypersensitivity and pregnancy/breastfeeding exclusions preserved. |
| Counts | Baseline ANC threshold is distinct from on-cycle ANC≥1.0. ANC0.5–<1 or platelets75–<100 delays one week. ANC<0.5, neutropenic fever or platelets<50 delays with **consideration** of25% chemo reduction, not an automatic prescription. Platelets50–<75 are missing from the source table: defer and obtain consultant/pharmacy clarification, never interpolate a percentage. |
| Carboplatin kidneys | ≤20mL/min do not administer; >20–30 extreme caution; <60 increased myelosuppression risk; Calvert GFR cap125. Creatinine age≤48h for estimated dosing; isotope-based dose reuse only with creatinine≤110% reference. Estimation limitations are flagged, not automatically corrected. |
| Etoposide organs | Current NCCP10–50mL/min suggests75% original dose; >50 no renal adjustment. <10 is a source gap. Haemodialysis suggests considering75%; not dialysed. Bilirubin≥50µmol/L **or** reduced albumin suggests considering50%. No multiplying independent percentages or automatic re-escalation. Legacy ≥50 and <15 bands straddle current boundaries and prompt numeric clarification. Product SmPC15–50 versus NCCP10–50 discrepancy is explicit for pharmacy review. |
| Serplulimab baseline impairment | CrCl<30 insufficient-data review; bilirubin>1.5×ULN moderate/severe insufficient-data review. NCCP at exactly1.5 overlaps; current SmPC clarifies moderate as>1.5. No automatic immune diagnosis or serplulimab dose reduction from baseline impairment. |
| Immune lung/bowel | Grade2 lung hold; Grade3–4 or recurrentGrade2 stop. ColitisGrade2–3 hold; Grade4 or recurrentGrade3 stop. Restart requires event-specific recovery, not absence of another trigger. |
| Immune liver/renal | Liver thresholds preserve>3–5 AST/ALT and>1.5–3 bilirubin hold; >5/>3 stop, **only with confirmed immune attribution**. Unattributed abnormalities prompt review. Mixed baseline/ULN creatinine ratio cannot establish grade; confirmed event grade plus immune attribution governs nephritis hold/stop. |
| Endocrine | Source-specific symptoms, grade, hormone control and adrenal severity retained. Grade4 table rows conflict with hormone-controlled footnote exception: specialist adjudication is exposed. Grade3 adrenal insufficiency is a source stop row. Thyroid/diabetes laboratory values alone are not treatment clearance. |
| Other immune effects | Skin, pancreatic enzymes/pancreatitis, myocarditis, encephalitis, immune cytopenias, recurrentGrade3 and otherGrade4 pathways are explicit. Grade4 enzymes have a specific hold row versus a generalGrade4 stop footnote; this conflict is reported. Myocarditis retreatment safety is unclear. |
| Current SmPC supplements | Grade2 myasthenia holds, Grades3–4 stop; SJS/TEN stops without waiting for aGrade4 label; acute thyroiditis/poorly controlled type1diabetes hold. Any diagnosed myocarditis is withheld pending severity decision. Uveitis with systemic immune events and possible myasthenia require urgent specialist review. Trial-excluded conditions are evidence cautions, not invented NCCP contraindications. Each rule has a distinct EMA source URL. |
| Infusion reactions | Serplulimab culprit is required for its permanent-stop pathway; Grade1 close monitoring, Grade2 slow/interrupt and resume only when controlled, Grade3–4 stop permanently. Unidentified or chemotherapy culprit prompts appropriate clinical review without silently stopping serplulimab. |
| Duration and restart | No serplulimab escalation/reduction. NCCP allows tolerability holds up to12weeks; beyond that requires consultant review rather than a borrowed12-week permanent-stop or automatic restart rule. Recovery, hormone status, steroid completion and recurrence remain explicit. |

## Full service authoring

`authoring.json` uses the exact v0.84.22 00579 schema: patient, clinical, evidence, journey, selector, support_plans, route and risk. It includes8patient chapters, three medicine explanations, eight anatomy locations, phased passports, day-specific route guidance, consent discussion points, monitoring and practical logistics. Questions are `{q,a}`, chronology notes `{title,text}`, anatomy arrays and all source IDs resolve. No duplicate built-in urgent/support chapter IDs. Breast selector opt-in is false.

The patient evidence remains qualitative (`metrics:[]`). Clinician evidence separates2026OS (median15.8vs11.1months, HR0.60[0.49–0.73], four-year21.9%vs7.2%, cutoffMay2024) from original2022PFS (5.7vs4.3months, HR0.48[0.38–0.59], cutoffOctober2021). TrialECOG0–1 versus NCCP0–2 and IV-only trial dosing versus NCCP oral alternative are explicit. No head-to-head advantage over another immunotherapy is inferred. Trial treatment-attributed toxicity rates are not described as total severe-event rates.

Support uses the dedicated carboplatinAUC≥4 NCISV8 script `nccp-v8-carboplatin-v08420`, without routine olanzapine. It explicitly requires reconciliation for etoposide Days2–3 and two days after the final chemotherapy day (including Day5 review), rather than treating the Day1 prescription as a complete multi-day plan. Maintenance is minimal risk, with no routine chemotherapy antiemetic medicines. The cited etoposide IV product information advises against in-line filters; the serplulimab filter instruction must not be transferred to etoposide.

Current SmPC adds pancreatic enzyme checks at baseline and periodically/as clinically indicated; cycle FBC/renal/liver/glucose and thyroid every3–6weeks remain NCCP monitoring. Patient alert card and delayed immune effects are carried across all phases. Additional consent drug profile is in `proposed/serplulimab-consent-profile.json`, with qualitative serplulimab-specific risks and no borrowed frequencies.

## Verification and integration

- `node validation/lung-next-v08423/serplu/source-cases.cjs`: **345/345 passed**, all94rules covered by positive source cases; boundaries, negative, missing, context, severe independent input and maintenance-isolation cases included.
- Real strict protocol validator: **0errors,0warnings**.
- `--integrated` loads the final live canonical protocol after root integration. No live/shared file, commit, push or deployment was performed by this bounded work.
- Merge the proposed canonical JSON into the same live filename; retain canonical ID. Merge `authoring.json.regimens['00908']` into root v0.84.23 authoring. Merge the consent profile under `agent_profiles.serplulimab`.
- Root has added serplulimab to immune mechanism classification. Check dynamic consent classification as well as static guide generation.
- Route is `intravenous_with_explicit_oral_alternative`; root maps it to mixed oral/parenteral sustainability metadata. Support source_page is numeric pages7–8; NCIS references remain separately identified.
- Root will wire `bilirubin_uln_multiple.derived_actual_field='bilirubin_umol_l'` and `bilirubin_umol_l.ui_derived_from='bilirubin_uln_multiple'` using existing FEC machinery so one actual blood result supplies both pathways. Keys are preserved unchanged here.
- Render/PDF/QR/browser release checks remain root integration work. Independent clinical, oncology-pharmacy and patient/PPI review remain pending; software verification is not clinical authorisation.
