# Atezolizumab monotherapy source audit · v0.84.26

Source check: 29 October2026. New full lung patient/clinical suites00544,00592,00593. Clinical canonical proposals retain urothelial indications. Independent consultant, oncology pharmacy and patient/PPI review remains pending. All clinical-use authorisation/review flags remain false. Software verification is not clinical validation.

## Source and version reconciliation

Official original PDFs freshly downloaded, text hashed separately, immune and renal/hepatic tables on pages4–7 rendered and visually inspected. Versions remain00544v14,00592v3,00593v10a. Their version histories were read.00544/00593 carry a now-past09September2026 review date; these are still the current HSE linked PDFs and are not silently recertified.00592v3 has review19February2029. Current EMA product information21July2026 reviewed separately. Sources and hashes are in sources.json.

The sources share six indications but their letters differ:00544/00592e is adjuvant and f is ES-SCLC maintenance;00593e is maintenance and f is adjuvant. a is post-chemotherapy NSCLC, b is post-platinum urothelial, c is cisplatin-ineligible PD-L1≥5% urothelial, d is first-line PD-L1-high EGFR/ALK-negative metastatic NSCLC.00592's legacy GU alias incorrectly said renal-cell cancer: corrected to urothelial and marked unresolved legacy alias. Generic aliases are retained as explicit review pathways, not new source indication letters. Current lung catalogue omits00592a but the PDF explicitly includes it; retained with discrepancy recorded.

All sources require ECOG0–1; former544/592 rule used>2 and missed ECOG2. New threshold>1. Adjuvant full criterion confirmation contains source stageII–IIIA AJCC7, predominant non-squamous histology, PD-L1≥50%, EGFR/ALK negative, prior platinum/no progression and both12-week intervals. First-line metastatic selection is not reused for post-platinum or adjuvant. ES-SCLC is continuation after induction, not de novo monotherapy; prior induction is not misclassified as disqualifying prior systemic treatment.

00592's symptomatic ILD and medical conditions requiring systemic immunosuppression>10mg prednisolone equivalent are cautions;00544/593 list exclusions. Actual source wording preserved in review actions. Inhaled/topical steroids excluded; a numeric steroid value alone does not establish this medical-condition criterion.

## Dose actions and safety

Expanded former13-rule544/592 and incomplete593 to named-component source rules. Stable renal impairment and immune nephritis use separate fields; isolated raised ALT/AST/bilirubin/creatinine requests attribution, never an immune diagnosis. Confirmed immune hepatitis holds at AST/ALT>3 through5×ULN or bilirubin>1.5 through3×ULN; stops above5 or3 respectively. Immune nephritis holds creatinine>1.5 through3×baseline/ULN, stops>3. Exact boundaries and missing/other attribution tested.

PneumonitisG2hold/G3–4stop; colitisG2–3hold/G4stop; rashG3hold/G4stop; suspectedSJS/TENhold/confirmedstop. HypophysitisG2–3hold/G4stop. Symptomatic thyroid/adrenal have specific restart criteria; diabetes fastingglucose>13.9mmol/L requires immune/type1 context and metabolic control on insulin for restart. Facial paresisG1–2holds until fully resolved; persistent orG3–4stops. Myasthenia/Guillain–Barré/meningoencephalitis any grade stops, myelitisG2–4stops. Pancreatic enzyme grade3–4 plus>2×ULN and immune attribution holds; pancreatitisG2–3holds;G4or recurrent pancreatitis stops. MyositisG2–3holds/G4or recurrentG3stops. PericardialG1holds with cardiac evaluation/≥2stops. SuspectedHLHstops regardless of grade. Other immuneG4/recurrentG3controlled-endocrine exception cannot override a separate serious organ event.

Supplemental current SmPC: suspected pericardial disorder withholds pending cardiology confirmation, confirmed Grade≥2 stops; suspected myocarditis withholds pending urgent cardiology work-up; confirmed≥G2stops. Myositis unable to taper corticosteroid≤10mg/day within12weeks stops. These supplement, not misquote, the NCCP table. General12-week restart prompts never issue restart clearance and explicitly exclude thyroid/diabetes/facial-paresis-specific decisions.

00544 renal≥30 versus<30 is complete;592/593print>30/<30 leaving exactly30 unassigned. Explicitreview at30, never invented dose. Severe renal/dialysis and severe hepatic impairment: NCCP expects no adjustment, EMA evidence limited/not studied; qualified specialist review rather than dose reduction. No routine atezolizumab dose reductions.

00544 alone explicitly offers1200mgIV or1875mgSC every21days. These are distinct formulations, not mg-for-mg substitution.00592is840mgIV every14days;00593is1680mgIV every28days. IVfirst60minutes then30if tolerated; SC7minutes with thigh instructions. Missed-dose interval resets to the actual regimen14/21/28days. Adjuvant maximum12months is separate from advanced/maintenance until progression or unacceptable toxicity; no shared fixed cycle count invented.

NCCP00592/593state CTCAEv4;00544says current NCI-CTCAE without an edition. Removed incorrect inheritedv5 claims; source-grade options state action bands and require named-event grading. Inputs stay optional; blank is unassessed, never normal/proceed. Legacy monitoring-only hormone, ACTH, ketone and nonimmune grade fields are retained without fabricated dose thresholds.

## Full service content and evidence

Patient tools, consent-support content, knowledge base, relative journeys, passport groups, monitoring, source-linked agent risks, support plans, clinician evidence and selectors authored for all3schedules. Patients see no numerical efficacy predictions. FBC/renal/liver/glucose before each cycle; thyroid every3–6weeks independent of cycle interval, cortisol/other hormones when indicated. No mandatory routine echocardiogram fabricated. Minimal emetic risk, no routine prophylaxis/premedication; individual symptom-relief prescriptions. Contraception5months, not copied pembrolizumab4months.

OAK final2021 OS uses full1225population (13.3vs9.8months, HR0.78), not primary850subset. IMpower110 updated2021 high-PD-L1 exploratory OS20.2vs14.7, HR0.76CI0.54–1.09 (CIcrosses1); not conflated with earlier positive primary analysis. IMpower0102025 finalDFS/second interimOS uses exploratory209patient PD-L1≥50% EGFR/ALK-negative subgroup, not229mixed subgroup or entireITT; DFSHR0.49 andOSHR0.44 explicitly qualified. IMpower133 describes induction-plus-maintenance strategy and does not claim isolated maintenance benefit. Alternate schedules/SC efficacy relies on exposure/formulation bridging, not separate pivotal trials. Non-lung indications retained in canonical decision data but lung patient materials do not borrow lung outcomes for urothelial cancer.

## Verification

| Code | Source version | Optional inputs | Rules |
|---|---|---:|---:|
| 00544 | 14 | 67 | 75 |
| 00592 | 3 | 67 | 76 |
| 00593 | 10a | 72 | 77 |

645/645 proposed checks pass using the real assessment engine, strict protocol validator, real dose schedule and modification renderer. Cases cover absent/negative/positive states, renal30gap, exact immune thresholds, organ grading, indication letters/eligibility, optional/legacy inputs, infusion routes, component-specific hold and permanent-stop precedence, source graph, patient metrics and authoring structure. Integrated mode is available with `node validation/lung-next-v08426/atezo-mono/source-cases.cjs --integrated`; root reruns after final integration. No canonical/shared edits, commits, pushes or deployment performed by this agent. Root must render the complete service artifacts and perform final interaction/PDF/regression checks.

Current NCIS medical-oncology antiemetic guidance v8 (10February2025) freshly checked via HSE guidance index. No cytotoxic low/moderate/high prescription is applied to minimal-risk atezolizumab; classification v6 and regimen supportive-care section support no routine prophylaxis.

Final canonical indication list contains exactly six source indications a–f for each regimen. Inherited generic lung/GU aliases remain only as compatible input choices, with explicit consultant-review rules and metadata.legacy_indication_aliases identifying candidate source indications. They are not source-labelled extra indications and cannot clear eligibility. Integrated empty-string demos are tested as the UI-normalized equivalent of proposed null; blanks still produce no proceed decision.
