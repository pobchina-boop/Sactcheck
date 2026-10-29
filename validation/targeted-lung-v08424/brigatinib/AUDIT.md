# Brigatinib 00562 source audit · v0.84.24

Checked 29 October 2026 against the fresh official HSE lung listing, the linked NCCP PDF, current EMA Alunbrig product information and primary trial follow-up. This is software source reconciliation, not independent clinical validation. Consultant, oncology pharmacy, patient/PPI and formal clinical-use approval remain outstanding.

## Deliverables and validation

- `proposed/00562-brigatinib-therapy.json`: 67 rules and 63 optional inputs. All 14 legacy field names retained. Stable `protocol_id=nccp-00562-v3`; displayed/source version explicitly updated to **NCCP v4**.
- `authoring.json`: complete targeted patient, clinical, evidence, journey, selector, oral support, route/risk and provenance content. Continuous oral schedule has `cycle_days=null` and a separate initial lead-in. Patient evidence has no quantitative outcome metrics.
- `proposed/brigatinib-consent-profile.json`: previously absent brigatinib agent coverage for the consent generator; source-linked material risks without borrowed frequency percentages.
- `source-cases.cjs`: **233/233 passed**, using the actual assessment engine, strict validator and dose-schedule/modification renderer. Every one of the 67 rule IDs is triggered by at least one explicit case. Boundary, negative, blank, conflicting-input, indication, phase, recurrence and concurrent-limitation cases included. `--integrated` targets the actual canonical protocol after root integration.
- `sources.json`: retrieved versions, source pages, conflicts, PDF/text hashes and primary evidence. The original PDFs and extracted text are retained in `research/`.
- Visual review completed for NCCP pages 3–5, SmPC pages 4–6 and NCCP oral antiemetic guidance pages 8 and 13. This verified the printed AND, inequality signs, recurrence and recovery clauses.

Run `node validation/targeted-lung-v08424/brigatinib/source-cases.cjs`, then append `--integrated` after integration. Root owns all canonical edits, shared renderers, PDF generation and suite-wide validation. No canonical files were edited by this task.

## Source version change

The current HSE listing links `https://healthservice.hse.ie/documents/6895/562_Brigatinib.pdf`, which redirects to the HSE assets host. The old `_v3_brigatinib.pdf` URL is no longer the current listing link. The fresh PDF is **version 4, 18 August 2026**, not the v3 still returned in some search-index entries. Its history says the v4 change concerns the review schedule and antiemetic links; the footer's clinical last-review date remains **22 October 2021**. From 18 August 2026 it is reviewed as required. Metadata retains these distinct dates and does not portray the administrative v4 amendment as a new clinical review.

## Clinically substantive corrections

| Area | Reconciled behavior |
|---|---|
| Indications | Separate 00562a (after crizotinib) and 00562b (no previous ALK inhibitor), with validated ALK-positive advanced NSCLC. Other prior ALK treatment or a discordant selection prompts review. No adjuvant indication is inferred. |
| Standard schedule | Usual 90 mg daily for seven days, then 180 mg daily. No 21-/28-day chemotherapy cycle or fixed treatment cap. |
| Restart | A break **≥14 days for a non-adverse-reaction reason** uses a seven-day 90 mg re-lead-in before the previously tolerated dose. Adverse-reaction interruptions use their own toxicity pathway. Missing reason, tolerated 60 mg, organ impairment and interactions prevent numerical restart calculation. |
| Dose ladders | First-seven-day ladder: 90 → 60 mg → discontinue. After-lead-in ladder: 180 → 120 → 90 → 60 mg. Inability to tolerate 60 mg permanently stops treatment. Separate ladders remain visible; the engine does not assume one applies to every phase. |
| Pulmonary toxicity | Grade 1/2 is held to baseline. First grade 1 restarts at the same level; first grade 2 at the next lower level. Events in the first seven days must **not** be escalated to 180 mg. Grade 3/4 or recurrence permanently stops. This corrects the old automatic grade-2 permanent stop. Suspected pneumonitis independently holds for investigation. |
| Haematology | NCCP Table 2 prints **ANC 0.5–1 AND platelets 25–50**: hold to baseline, same dose first event; recurrence lower level or stop. **ANC <0.5 AND platelets <25**: hold to baseline, lower level; recurrence lower level or stop. Inclusive printed intermediate endpoints are tested. Isolated/mixed abnormal counts trigger explicit review; the software does not rewrite AND as OR or invent an exact restart. |
| Renal function | NCCP **CrCl <30 mL/min**: reference initial 60 mg daily for seven days then 90 mg daily; **≥30** no source renal adjustment. Legacy bands remain compatible; discordant numeric/band findings are retained and flagged. **Dialysis is a separate review**, correcting the old automatic severe-renal schedule. Current SmPC uses eGFR, which is identified rather than silently substituted for CrCl. |
| Baseline hepatic impairment | Child–Pugh A/B does not select a routine reduction; C gives reference initial 60 mg daily for seven days then 120 mg daily. This is separate from treatment-related liver injury. |
| Hypertension | Grade ≥3 holds until grade ≤1, specifically **SBP <140 AND DBP <90**. First grade 3 may resume same dose; recurrent grade 3 or first grade 4 requires Consultant choice of lower dose or stop. Recurrent grade 4 permanently stops. Numeric **SBP ≥160 or DBP ≥100** prompts full grade/context review rather than diagnosing the entire CTCAE grade from a number alone. |
| QT caution | NCCP cautions at **QTcF >450 ms in males or >470 ms in females**. The old generic **≥500 ms automatic hold** is removed because the source does not supply that brigatinib algorithm. Unknown sex-specific category retains caution when the lower source threshold is exceeded. |
| Bradycardia | Symptomatic events hold to asymptomatic status **or resting HR ≥60**. An addressed contributing medicine permits same-dose restart for non-life-threatening events; absent/unaddressed contribution requires lower level. First life-threatening events with an addressed contributor may resume lower with frequent monitoring. No contributor, or recurrent life-threatening bradycardia, permanently stops. Missing contribution never invents a restart. |
| CPK | The hold row requires **CPK >5 × ULN AND grade ≥2 muscle pain/weakness**, correcting the old lab-only trigger. Recover to **≤2.5 × ULN or baseline**; same dose first event, lower level on recurrence. Missing/mild symptoms retain clinical review, not an assumed grade. |
| Pancreatic enzymes | Either lipase or amylase **>2 × ULN** holds; first grade 3 may resume same dose after **≤1.5 × ULN or baseline**, recurrence lower. **>5 × ULN** requires recovery to **≤1.5 × ULN**, then lower level; baseline alone is not the grade-4 recovery alternative. Exactly 2 and exactly 5 are tested. |
| Liver injury | ALT/AST **>5 × ULN with bilirubin ≤2 × ULN**: hold until baseline or ≤3 × ULN, then lower. ALT/AST **>3 with bilirubin >2**: hold and assess causes. Permanent stop requires confirmed absence of cholestasis/haemolysis and clinician treatment attribution. Missing bilirubin/attribution does not become a definitive permanent stop. Marked transaminases with missing bilirubin retain a conservative hold pending assessment. |
| Glucose | **Fasting glucose >13.9 mmol/L** prompts treatment optimisation and control assessment. Inadequate control despite optimal treatment independently holds until controlled; lower-dose restart versus permanent stop remains a Consultant choice. A high isolated glucose value is not itself assumed refractory. |
| Vision / other toxicity | Grade 2/3 visual disturbance holds to grade 1 or baseline, then lower; grade 4 stops. Other grade 3 toxicity holds to baseline, same dose first event; recurrent grade 3 or recurrent grade 4 requires lower versus stop choice. First other grade 4 holds then lower. Old diarrhoea/rash field identifiers now use this source-specific pathway, without fabricated CTCAE5 labels. |
| Interactions | Strong CYP3A inhibitors should be avoided; if unavoidable the source gives 180→90 or 90→60 mg examples. Current SmPC adds strong/moderate inducer and narrow-index substrate management. All remain visible pharmacy/Consultant decisions, not a universal percentage calculator. |

All non-stop dose actions deliberately carry `dose_calculation='specialist_review'`: the renderer retains the source text and drug-specific hold/review but cannot produce an apparently ready dose when phase, recovery, previous reductions or concurrent limitations have not been adjudicated. This is especially important when severe renal, hepatic or interacting-drug restrictions coexist. Permanent-stop and contraindication results remain visible and most restrictive.

## Explicit source issues and conservative interpretations

1. **Moderate CYP3A inhibitors:** NCCP v4 says avoid strong and moderate inhibitors. Current SmPC permits no routine dose change with moderate inhibitors and close monitoring. The tool displays the disagreement and requests oncology pharmacy/Consultant resolution. Neither source is silently overwritten.
2. **Renal measure:** NCCP uses CrCl; SmPC uses eGFR at the same numerical boundary. Method matters, so the numeric field is labelled for the NCCP measure with a source-specific note. Dialysis and combined impairment lack an explicit combined-dose algorithm.
3. **Haematological AND:** Preserved exactly after visual review. Unmatched low counts trigger context review; this is explicitly a safety review outside a matched printed dose row, not a newly invented NCCP dose.
4. **Incomplete marked LFT pattern:** A hold pending complete assessment is conservative workflow handling. Permanent discontinuation is not inferred from isolated transaminases or absent cause information.
5. **QT classification:** The source uses male/female caution categories. Its threshold is a review signal, not an automatic brigatinib withholding algorithm.
6. **Restart below the usual lead-in dose:** The source's 90 mg re-lead-in wording is not resolved automatically for a previously tolerated 60 mg dose or concurrent organ/interaction restrictions.
7. **Grading:** NCCP Table 4 explicitly cites NCI CTCAE v4. Numeric laboratory rows and their exact recovery criteria are retained. General grade prompts ask for event-specific clinician grading and do not claim that patient symptom labels establish a formal grade.

## Full-service content and support

The patient content includes targeted mechanism, body-map effects, lead-in and continuous treatment, no self-escalation/restart, missed/vomited-dose handling, food and grapefruit advice, interactions, symptom reporting, reproductive advice, sun protection, contacts, and reusable review sheets. The material remains patient-language information and consent support, not clinical authorisation.

Monitoring is regimen-specific: baseline ALK, FBC, renal/liver profile, pulmonary function, ECG/BP, fasting glucose, CPK and amylase/lipase; pulmonary clinical review at **days 8 and 15**, then monthly or as indicated; ECG/BP every two weeks initially then monthly; liver profile every two weeks for the first three months then as indicated; FBC, renal, fasting glucose, CPK and pancreatic enzymes monthly. The source's “first cycle” wording does not create an artificial chemotherapy cycle. No routine immune thyroid/cortisol or trastuzumab cardiac schedule is copied.

Brigatinib is minimal-to-low **oral** emetogenic risk. NCCP oral guidance V6 Table 5 says antiemetics **as required**. NCIS V8 was reviewed and identified as parenteral standardisation; no routine ondansetron/steroid/aprepitant regimen was copied. The support plan has no default medicine prescription; prescriber/pharmacy choose an appropriate rescue medicine, dose and duration with interaction review. No routine G-CSF or antimicrobial course is invented.

## Evidence boundaries

- **ALTA-1L final randomised analysis (00562b):** 275 ALK-inhibitor-naïve patients; brigatinib versus crizotinib. Last patient last contact **29 January 2021**, brigatinib follow-up 40.4 months. BIRC median PFS **24.0 versus 11.1 months**, HR **0.48 (95% CI 0.35–0.66)**. Median OS not reached in either arm; HR **0.81 (0.53–1.22)** does not establish a statistically conclusive OS advantage. The post-hoc brain-metastasis OS signal is not presented as established benefit.
- **ALTA final analysis (00562a):** 222 crizotinib-refractory patients in a phase 2 comparison of two brigatinib dose arms. Last patient final visit **27 February 2020**. IRC median PFS **16.7 months for 180 mg after lead-in versus 9.9 months for 90 mg**, not the investigator-assessed 15.6/9.2 values. It is not a head-to-head comparison against another current ALK inhibitor.
- **2025 post-discontinuation follow-up:** Current search also identified the retrospective chart review of 48 selected patients after frontline brigatinib, database lock **18 October 2023**. It is included as a source-qualified subsequent-treatment note. It excludes people continuing brigatinib and does not replace full-population randomised PFS/OS or demonstrate sequencing superiority.
- No cross-trial ranking, adjuvant efficacy, individual survival forecast, expanded NCCP indication or automatic reimbursement conclusion is inferred. Quantitative outcomes are confined to clinician evidence.

## Integration and remaining review

Root must integrate the proposed JSON and new brigatinib consent profile, build patient/clinician outputs and verify the targeted renderers display the correct scope/release (the older targeted template contains breast-only wording unless the root-owned release adapter fixes it). Root should then run `--integrated`, cross-suite regressions, clinical UI interactions and PDF/QR/layout checks. The historical OF590 renal/hepatic IDs are preserved but now use audited v4 source references; the historical v0.59.0 metadata remains labelled as superseded provenance.

Independent Consultant, oncology pharmacy and patient/PPI review remain required, especially the preserved source conflicts, haematological conjunction, renal-method choice, conservative incomplete-LFT hold and restart combinations. Software tests do not confer clinical approval.
