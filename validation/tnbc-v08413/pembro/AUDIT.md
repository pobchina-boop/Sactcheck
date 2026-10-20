# NCCP 00858 / 00860 / 00861 source audit for v0.84.13

Checked 20 October 2026 against the linked official HSE PDFs. This is source reconciliation research, not consultant/pharmacy validation. No application files were edited. Direct binary downloads returned HTTP 403; the PDFs were read through web retrieval. Do not claim a PDF checksum or local PDF archive. `source-urls.json` holds the exact URLs; page numbers below are the printed PDF page numbers. Numerical cases in `source-cases.json` are independently authored source/boundary expectations for the implementing agent to map onto its final input names.

## Source identity

| Code | Official version | Published | Review | Pages | Web citation |
|---|---|---|---|---|---|
| 00858 | 3 | 04/06/2024 | 22/10/2030 | 12 | turn371view0 |
| 00860 | 2 | 14/06/2024 | 11/08/2030 | 12 | turn371view1 |
| 00861 | 2 | 14/06/2024 | 11/08/2030 | 12 | turn371view2 |

## Principal defects in the existing JSON

1. All three have the same legacy haematology rule set. **00858 and 00861 weekly carboplatin require the weekly independent ANC/platelet table**, not 00860's day-1 versus day-8/15 paclitaxel rules.
2. **00860 and 00861 contain 21-day AC phases; source specifies dose-dense 14-day AC.** Their AC thresholds are copied from the 21-day AC table, also wrong.
3. **00860/00861 currently list pembrolizumab 400 mg each phase-1/phase-2 cycle day 1.** Source specifies every six weeks: day 1 of cycles **1, 3, 5 and 8 only**.
4. **00860/00861 currently retain an adjuvant 400 mg every-21-days ×9 phase. Delete that incorrect schedule.** Source is 400 mg every 42 days ×5, beginning six weeks after C8D1, subject to surgery/treatment plan and stopping criteria.
5. **00861 currently contains carboplatin AUC 5 D1 in 500 mL.** Source is AUC **1.5 on D1/8/15**, 250 mL glucose 5% over 30 minutes. Its calculator target is also 5. 00858 schedule is correctly AUC1.5 but calculator incorrectly targets5.
6. **G-CSF for every dose-dense AC cycle** is mandatory in 00860/00861 source p1, absent from their supportive-care content. Do not make G-CSF universal in 00858's q21 AC solely by copying the ddAC cards.
7. Drug-specific organ and toxicity rules lack phase gating: paclitaxel/carboplatin rules can fire during AC or adjuvant pembrolizumab, and AC rules can fire during the taxane phase. Require explicit active-phase applicability. Missing phase must prompt conditional interpretation/phase review rather than silently select a phase; a single entered value must still yield a partial assessment.
8. Detailed pembrolizumab rules are in `pembrolizumab_irae_rules`, outside `rule_engine.rules`. Confirmed in `js/assessment-engine.js` lines 785–824: only the general active-irAE flag becomes a synthetic consultant-review finding; the 27 detailed reference rules are not translated into toxicity-specific executable hold/discontinue outcomes. Input definitions currently expose only `active_pembrolizumab_irae` and no granular pneumonitis/colitis/etc fields.
9. Exclusions copied identically: 00860/00861 are missing baseline ANC<1.5 and severe hepatic impairment; 00861 pre-existing renal impairment is a **caution**, not an exclusion. 00858 v3 does not list pre-existing renal impairment or progression on platinum as exclusions. All have age>18 although source says adults, so do not exclude age18 by an invented strict boundary.
10. 00860/00861 baseline hepatitis B/C screening is missing. Source requires HBsAg, HBcoreAb and hepatitis C screening. 00858 has HBV/HCV history as a caution but its p5 does not list routine virology screening; any added guideline-based screening must have a separate source.
11. Source p9 says inability to tolerate treatment **after two reductions** is a paclitaxel stopping criterion. Current `reduction_count >2` misses intolerance after two. Add intolerance explicitly; count2 alone is not necessarily an instruction to stop.
12. Supportive metadata inconsistently labels weekly carboplatin schedules high/day8 paclitaxel-only even where phase_profiles says moderate. Reconcile all views: 00858/861 weekly carboplatin+paclitaxel moderate; 00860 day1 carbo+paclitaxel high and days8/15 paclitaxel-only low; all AC high; adjuvant pembrolizumab minimal.

## Exact schedule map (pp1–3)

00858: C1–4 each21days: pembrolizumab200mg D1, paclitaxel80mg/m² and carboplatinAUC1.5 D1/8/15. C5–8 each21days: pembrolizumab200mg, doxorubicin60mg/m², cyclophosphamide600mg/m² D1. Postoperative pembrolizumab: 200mg q21 ×9 **or**400mg q42 ×5; alternative branches, not sequential courses.

00860: C1–4 each21days: carboplatinAUC5 D1; paclitaxel80mg/m² D1/8/15; pembrolizumab400mg D1 **C1 and C3 only**. C5–8 each14days: doxorubicin60mg/m²/cyclophosphamide600mg/m² D1; pembrolizumab400mg D1 **C5 and C8 only**. Postoperative pembrolizumab400mg q42 ×5; first dose six weeks after C8D1. Standard or pegylated G-CSF all ddAC cycles.

00861: same six-week pembrolizumab and ddAC/adjuvant sequence as00860. Difference: carboplatinAUC1.5 and paclitaxel80mg/m² both D1/8/15 during C1–4. Source **not** AUC5day1.

All: stop neoadjuvant treatment for progression preventing definitive surgery or unacceptable toxicity. If progression prevents surgery or unacceptable pembrolizumab toxicity occurs, do not automatically proceed to adjuvant pembrolizumab. Surgery is an explicit phase boundary; radiotherapy is separately decided rather than automatically simultaneous with chemotherapy. No fixed CT interval is specified by these PDFs.

## Haematology (p6)

### 00858 and 00861, weekly carboplatin/paclitaxel

ANC ×10⁹/L: ≥1.0 permits full dose for the entered domain; 0.5–<1 delay; <0.5 delay and consider25% reduction of **both agents** subsequently. Febrile neutropenia or prior myelosuppression delay: delay/recovery then consider25% reduction both. Recovery taking >2weeks or third myelosuppression delay: delay then consider50% reduction or cease.

Platelets ×10⁹/L: ≥100 permits full dose for entered domain; 75–<100 clinician discretion, continuation only if clinically well; 50–<75 delay; <50 delay and consider25% reduction **both agents** subsequently. These apply to pre-treatment weekly doses, not an automatic day8/15 omission of paclitaxel alone.

### 00860, carboplatin q21 + weekly paclitaxel

D1: ANC≥1 **and** platelets≥75 permits full dose; ANC<1 and/or platelets<75 delays both until recovery. D8/15: ANC<0.5 and/or platelets<50 omits scheduled paclitaxel. Severe preceding toxicity: febrile neutropenia, ANC<0.5 for≥7days, platelets<10 or10–50 with bleeding: reduce carboplatin one level. Haematological delay>1week: first occurrence one level; second occurrence one further level. The local `cycle.min=2` is not justified by Table1 alone; retain a **separate baseline exclusion** ANC<1.5 and make baseline-versus-subsequent context clear.

### 00858, q21 AC

Table2 pairs ANC≥1.5 with platelets>90 for100%; ANC1–1.49 with platelets70–90 for75%; ANC<1/platelets<70 delay. Source says G-CSF may be considered instead of reduction for neutrophil support. Mixed rows and continuous-value gaps (e.g.ANC1.495, or ANC1.2 with platelets150) must not become invented source dose percentages. Return review/partial threshold explanation for unlisted combinations. Single low ANC or low platelets must not be missed merely because the other value is absent.

### 00860 and00861, ddAC

Table2 full-dose row: ANC **>1.0** AND platelets **>100**. Low-count rows show ANC<1 with platelets>100 or ANC>1 with platelets<100: delay≥1week until both recover above thresholds. After a second delay:75%. **Exactly ANC1.0 or platelets100 is unassigned by the printed strict inequalities.** Do not silently broaden to≥; return a source-boundary review rather than automatic full-dose permission. Both low is not explicitly printed as a separate row, but must not pass; conservative delay/review can be labelled an implementation safety interpretation.

## Organ function (00858/861 pp6–7;00860 pp7–8)

- Carboplatin: GFR≤20mL/min do not administer; >20–≤30 extreme caution. CrCl<60 raises myelosuppression risk. Use Calvert with correct AUC; cap GFR125 for the formula. Estimated-GFR dosing uses creatinine within48h; isotope-based dose can remain if creatinine≤110% of isotope-time value, otherwise consider reassessment. Caution does not justify silently setting dose zero for the whole regimen.
- Paclitaxel: ALT<10×ULN plus bilirubin≤1.25×ULN→80mg/m²; bilirubin1.26–2→60;2.01–5→40. ALT≥10 **or**bilirubin>5 contraindicates. Printed gaps1.25–1.26 and2–2.01 must be acknowledged if fractional inputs are accepted; do not imply precise lower boundary the source does not state. Renal impairment/haemodialysis: no adjustment expected.
- Cyclophosphamide: CrCl≥30 no adjustment;10–29 consider75%;<10 or haemodialysis not recommended, if unavoidable consider50%. Severe hepatic impairment not recommended due to reduced efficacy (missing executable rule currently). CrCl29–30 fractional gap must be surfaced if not resolved through an explicitly documented clinical policy.
- Doxorubicin: CrCl>10 no adjustment; <10 no adjustment expected; haemodialysis consider75%. Exactly10 is not explicitly assigned; review rather than pretend source certainty. Bilirubin20–50µmol/L→50%; source prints **>51–86**→25%;>86 or Child-PughC not recommended. **50–51 inclusive gap is genuinely in the current PDFs**; do not rewrite as≥51 without an independent authoritative source and clear attribution.
- Pembrolizumab: source expects no renal dose adjustment, including haemodialysis; mild hepatic no adjustment, moderate/severe no adjustment expected. This is baseline organ impairment guidance, not permission to ignore immune hepatitis/nephritis. No pembrolizumab dose reduction; toxicity uses hold/discontinue.

## Pembrolizumab immune rules (pp8–9)

PneumonitisG2 hold; G3/4 or recurrentG2 permanently discontinue. ColitisG2/3 hold; G4/recurrentG3 permanent. NephritisG2 with creatinine>1.5–≤3×ULN hold; G≥3 withcreatinine>3 permanent. HepatitisAST/ALT>3–≤5×ULN or bilirubin>1.5–≤3 hold; AST/ALT>5 or bilirubin>3 with qualifyingG≥3 permanent. Preserve grade/diagnosis context; an abnormal liver value alone does not establish immune aetiology, but should trigger the applicable safety output.

Adrenal insufficiency/hypophysitisG2 hold until controlled with replacement. G3/4 adrenal insufficiency or symptomatic hypophysitis, severe type1 diabetes/hyperglycaemia (>13.9mmol/L) or ketoacidosis, hyperthyroidismG≥3: withhold; continuation after severe endocrinopathy is conditional on improvement≤G2, control and taper where needed. Hypothyroidism can be managed with replacement without interruption. Do not restore glucose/ketone UI clutter merely to represent these rules; preserve clinically relevant symptom/toxicity controls and clear safety guidance.

SkinG3/suspectedSJS/TEN hold;G4/confirmedSJS/TEN permanent. OtherG2/3 immune reactions hold;G4/recurrentG3 permanent. Myocarditis/encephalitis/Guillain-BarréG3/4 permanent. InfusionreactionG3/4 permanent. Failure to recover≤G1 within12weeks after last dose, or inability to taper steroids≤10mg prednisone-equivalent within12weeks→permanent discontinuation, subject to stated exceptions. Severe symptoms still require urgent clinical care; platform outcome is not an autonomous diagnosis.

## Monitoring and longitudinal content (p5)

Baseline all: FBC, renal/liver profile, glucose, thyroid tests, isotopeGFR preferred or GFR/CrCl estimate, ECG, audiology if indicated. Echo/MUGA:00858 ifage>65 **or clinically indicated**;00860/861 listage>65 atbaseline; all repeat when indicated. Source says LVEF>50 for doxorubicin while exclusion saysLVEF<50—at exactly50 return review rather than automatic clearance. 00860/861 addHBsAg/HBcoreAb/HCV screening.

DuringC1–4: FBC/renal/liver **weekly**, not merely each3- or6-weekcycle. Thereafter: before each cycle, including the separateadjuvant schedule. Glucose eachcycle; TSHq3–6weeks; cortisolwhenindicated. Paclitaxel neuropathy assessment beforeeachcycle perwording; any local pre-dose practice can be described separately. No automatic3-monthlyCT or fixedserialecho promise: source directs disease monitoring through individualconsultantplan. Baseline ECG is clearly required and should appear beforephase1. Baselinecardiacassessment beforeanthracycline should remain visible atphase-transition review.

## Support and patient material (pp9–10)

Keep distinct scripts for taxane/platinum, AC and adjuvant immunotherapy. 00860 also needs day1 high versus day8/15 low within the firstphase. WeeklyAUC1.5 cases remainmoderate on every carbo/pacday. Paclitaxelpremed firstdose: dexamethasone8mgIV, chlorphenamine10mgIV, famotidine20mgIV30minbefore. Fromday8, dexamethasone notroutine unless reaction/risk; H1continues, H2omission only underconsultantguidance and localpolicy. Regimen-source G-CSF statement does not specify exact day/product, so use separately sourced supportive-care guidance for those details. Patienttimeline should show immune effects can occur during or aftertreatment; phase-specific bodymap must remove inactive chemotherapy domains during adjuvantpembrolizumab without erasing persistent symptoms.

## Focused acceptance checks

- The same entered ANC1.2/platelets110 should lead to different AC interpretations in00858versus00860/861.
- Weeklycarbo D8 ANC0.7 delays **both agents** in00858/861; in00860 D8 it doesnot meettheprinted<0.5 omission threshold (otherdomainsunknown).
- Weeklycarbo platelets80 givesclinicaldiscretion, notautomaticfull-dose.
- Phase2 renal/liver results mustnot generatepaclitaxel/carboplatindoseactions. Postopphase mustnot generatecytotoxicdoseactions.
- Unknownphase mustnot defaulttotaxane, AC oradjuvant; missingcountsnevernormal; noglobal“cleared”fromsinglevalue.
- Exactboundaryvalues returnexplicitreviewwhere source leavesa gap.
- Separate baselineANC<1.5 exclusion for00860/861 fromsubsequentcountstable.
- Patientpage/export containsnosurvivalnumbers, HRs orcomparativetrialbenefitpanel.

## Retrieval references for parent verification

The three `008xx-retrieved-source.json` files archive official PDF text windows returned by web retrieval. These are parsed source snapshots, not downloaded binary PDFs; no PDF checksum is claimed.

Open official URLs directly before user-facing citation. Main refs: turn371view0/1/2 (identity/schedule), turn374view0/1/2 (eligibility,monitoring,haematology), turn378view0/1/2 (organ), turn386view0/1/2 (immune), turn389view0/1/2 (administration/support). No external secondary guideline was used to fill source gaps.
