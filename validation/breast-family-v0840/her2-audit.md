# Four HER2 combination source audits for v0.84.0

Audited 17 October 2026. Source reconciliation and engineering scenarios only; independent consultant and oncology-pharmacy validation remain outstanding. No application files edited by this audit task.

## Evidence and verification method

The live NCCP early-breast and metastatic-breast catalogue HTML was downloaded on the audit date. All four current catalogue links exactly match the repository source URLs below. PDFs were downloaded with a browser user agent, extracted with `pdftotext -layout`, and ambiguous tables were visually inspected from rendered PDF pages. The visual step is essential: in 00258 and 00731, many greater-than signs are underlined to mean ≥, but text extraction loses the underline.

|Code|Current document|Version date; review date|Pages|SHA-256|
|---|---|---|---|---|
|00258|https://healthservice.hse.ie/documents/6362/258_v9_TCH.pdf|v9, 16 April 2025; 16 April 2030|9|400376fbf4424827f0e42d652e2b58a79fac05350032cd1d2c86773aad02cfd5|
|00731|https://healthservice.hse.ie/documents/6601/731_v2_TCHSCP.pdf|v2, 10 August 2023; 10 August 2028|12|1184200a1da3512126046e35fb439ca3158e3b5829e2a2c9cc7de5c9ff1ceb4d|
|00204|https://healthservice.hse.ie/documents/6545/204_v11_PertuzumabTrasDoc.pdf|v11, 7 November 2025; 10 November 2030|7|b58da2cc87a676876daa47421118ca508fd637191cf34ef0bf10978aecceb752|
|00507|https://healthservice.hse.ie/documents/6611/507_v6_Pertuzumab_Tras_PACLitaxel_2jBzcSC.pdf|v6, 14 May 2025; 14 May 2030|7|b3618b9ad8f42e8ce49dac8770baf13f810ef1d7be77263e5e349fe53bc91cdd|

Catalogue URLs:
- https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/breast-sact-regimens/
- https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/breast-sact-regimens-locally-advanced-metastatic/

Source PDF versions and hashes are recorded above. Extracted text was checked against rendered source tables where boundaries or formatting were ambiguous.

## Do not merge these clinically different families

- 00258 is **adjuvant TCH**, HER2-positive early disease; its NCCP document explicitly supports three-weekly IV, weekly IV and fixed-dose SC trastuzumab alternatives. It is not a pertuzumab regimen.
- 00731 is **neoadjuvant TCH(SC)P**: IV pertuzumab plus separate 600 mg SC trastuzumab plus IV docetaxel/carboplatin. It is not fixed-combination Phesgo. Correct indication code is **00731a**, not the copied 00722a currently in `indications` and selector options.
- 00204 is first-line **metastatic/locally recurrent unresectable** IV pertuzumab + IV trastuzumab + docetaxel. It permits ECOG 0–2 and has its own <50% cardiac hold criterion.
- 00507 is the first-line metastatic taxane alternative where **docetaxel is unsuitable, not tolerated or caused significant toxicity**. Paclitaxel is weekly within a 21-day antibody cycle, for up to eight cycles. ECOG 0–1. Its cardiac hold criterion is <40%, or 40–45% plus a ≥10-point fall. Do not copy 00204's cardiac threshold into it.

## 00258: TCH adjuvant

### Dose, phases and patient logistics (pp1–3)

- Indication 00258a: adjuvant HER2-positive early breast cancer; node-positive or high-risk node-negative. Six 21-day combination cycles, then trastuzumab to one year from first dose (normally 18 three-weekly doses including loading). This is a surgery-first pathway in this NCCP indication. Radiotherapy and endocrine treatment, if indicated, need separate MDT sequencing; there is no mandated radiotherapy timing in this PDF.
- Default three-weekly IV option: D1 trastuzumab 8 mg/kg first dose then 6 mg/kg; docetaxel 75 mg/m²; carboplatin AUC 6. Trastuzumab first, then docetaxel then carboplatin. IV trastuzumab 90 minutes first infusion, later 30 minutes if tolerated; docetaxel 60 minutes; carboplatin 30 minutes. C7–18 trastuzumab alone 6 mg/kg q21 days.
- Weekly IV alternative: trastuzumab 4 mg/kg D1 first cycle then 2 mg/kg weekly (D8/D15 and D1/D8/D15 subsequent cycles), with docetaxel/carboplatin D1 every 21 days. Text says weekly trastuzumab continues until three weeks after last chemotherapy, then 6 mg/kg q21 days. Do not treat all visits in this route as a three-weekly infusion or apply q21 reloading doses to weekly treatment.
- SC alternative: trastuzumab 600 mg q21 days, no loading dose, injected in alternating thighs over 2–5 minutes; C1–6 with IV chemotherapy, then C7–18 SC trastuzumab only. First injection observation 30 minutes, later 15 minutes. New site at least 2.5 cm from old; avoid red, bruised, tender or hard skin.
- IV trastuzumab observation is measured from infusion start: at least six hours first dose and two hours subsequent doses, subject to documented local policy. Not an extra six hours after a 90-minute infusion.
- Carboplatin dose uses AUC × (GFR +25); current PDF refers to NCCP 00261 for detailed calculation. Do not silently transplant an old creatinine floor from 00731 into this newer source. There is no take-home chemotherapy pump.

### Eligibility/exclusions and monitoring (pp3–5)

- HER2 validated assay; ECOG 0–2; node-positive/high-risk node-negative.
- Baseline LVEF **>55%** (visually confirmed strict >). Footnote says trials included ≥50%; use clinical judgment for the 50–55% range. That range is a review condition, not automatic eligible or absolute exclusion.
- Baseline ANC <1.5 excludes initiation. Relevant drug/excipient hypersensitivity, clinically significant cardiac disease, significant hepatic dysfunction contraindicating docetaxel, pregnancy/breastfeeding are exclusions. Prior mild carboplatin allergy can only be reconsidered through exceptional specialist desensitisation.
- Grade ≥2 sensory/motor neuropathy is a **caution**, not a blanket exclusion (different from 00731).
- Baseline FBC/renal/liver profile, measured GFR preferred or GFR/CrCl estimate, baseline cardiac assessment. PDF tests section says ECHO/MUGA “if clinically indicated” even while eligibility specifies LVEF; preserve this wording discrepancy and reconcile baseline routine echo with trastuzumab SmPC rather than attributing stronger wording to this tests list.
- Regular FBC/renal/liver tests; this source does not literally state “before each cycle” in that list, although day-1 count-based dosing and the carboplatin creatinine recency rule require cycle-associated assessment.
- ECHO/MUGA every 12 weeks during trastuzumab and at completion; 4–8-week checks if cardiac impairment. For a continuous q21 schedule: baseline before C1, approximately C5/C9/C13/C17. This is elapsed time, not a guarantee that cycle number remains aligned after delays.
- For estimated GFR dosing, serum creatinine within 48 hours of administration; for isotope GFR the dose can remain unchanged while creatinine is ≤110% of the measurement-time value. An increase requires reconsidering/re-estimating GFR.
- No fixed CT interval, tumour marker, ECG or DEXA schedule specified for TCH itself. Disease imaging follows individual treatment plan. DEXA belongs to a separately indicated endocrine/ovarian-suppression pathway, not the antibody schedule.

### Blood and febrile-neutropenia modifications (p5; visually verified)

Actions concern **docetaxel/carboplatin**, not automatic withholding/reduction of trastuzumab. Day-1 counts and prior-cycle FN guide dosing.

|Condition|Dose reduction strategy|G-CSF strategy|
|---|---|---|
|ANC ≥1.5 AND platelets ≥100|100% chemotherapy|100%|
|ANC 1–1.49 AND platelets ≥100|75% chemotherapy|100% with G-CSF|
|ANC <1.0 OR platelets <100|Delay until ANC ≥1.5 AND platelets ≥100, then 75%|Same recovery, then 100% with G-CSF|
|First FN, counts recovered ≥1.5/≥100|75% **previous-cycle** dose|100%|
|Second FN, counts recovered ≥1.5/≥100|50% **original-cycle** dose|75%|
|Third FN|Stop regimen or switch to G-CSF strategy|50%|

The 1.49–1.50 decimal interval is not explicitly tabulated; do not silently label 1.495 as normal. It can be flagged for rounding/source-boundary review. For single ANC 1.2, show an incomplete conditional pathway rather than waiting for a mandatory platelets or strategy input. Missing strategy must never imply 75% or G-CSF automatically.

### Renal and liver modifications (pp5–6)

- Carboplatin: GFR ≤20: do not administer. >20 to ≤30: extreme caution. CrCl <60 increases myelosuppression risk. Renal impairment itself does not require docetaxel/trastuzumab reduction; hepatic carboplatin reduction not required.
- Abnormal bilirubin: delay chemotherapy up to two weeks; if no recovery, off chemotherapy; trastuzumab may continue by review.
- Docetaxel liver matrix (normal bilirubin and appropriate clinical context): AST/ALT ≤1.5 plus ALP ≤5 → no adjustment; AST/ALT >1.5 to ≤2.5 plus ALP ≤2.5 → no adjustment; AST/ALT >2.5 to ≤5 plus ALP ≤2.5 → 75→60 mg/m²; AST/ALT >1.5 to ≤5 plus ALP >2.5 to ≤5 →75→60; AST/ALT >5 **and** ALP >5 →delay maximum two weeks and stop chemotherapy if no recovery.
- One high axis >5 with the other ≤5 is not mapped in this table: explicit consultant/pharmacy review, not automatic normal or invented rule.
- If docetaxel is delayed for hepatic toxicity, accompanying drugs at that time should also be delayed and restarted with it; the separate abnormal-bilirubin text permits trastuzumab continuation after review. Surface this nuance rather than confidently clearing trastuzumab in all hepatic cases.
- Once reduced for liver dysfunction, no repeated reduction for stable unchanged liver values; if recovered at next cycle, source allows re-escalation to prior dose level.

### Other toxicities, missed doses and support (pp6–8)

- Grade >2 neuropathy: docetaxel to60; if it persists at60, discontinue docetaxel.
- Grade ≥3 stomatitis: 75→60; recurrence at60→50; no further planned reduction. Trastuzumab can continue without reduction.
- LVEF fall ≥10 points AND current LVEF <50: withhold trastuzumab, repeat in about three weeks. No improvement/further decline needs consultant/cardiology decision.
- Symptomatic heart failure: **consider discontinuation and refer to cardiology**, clinical decision. Unlike 00731/00204/00507, source does not state unconditional “Discontinue.” Urgent hold/review is appropriate; do not encode an unconditional permanent-stop claim as direct NCCP text.
- Grade4 hypersensitivity: discontinue implicated treatment; emergency management.
- IV trastuzumab missed by ≤one week: usual maintenance ASAP; missed by >one week: clinician-directed reload 8 mg/kg q21 or4 mg/kg weekly. This is **lateness after due date**, not the six-week interval rule for pertuzumab combinations. SC missed dose remains600 mg ASAP, minimum three weeks between injections.
- Emetogenicity combination phase: carboplatin High, docetaxel Low, trastuzumab Minimal. Antibody-only phase is Minimal; remove cytotoxic antiemetic expectations when chemotherapy ends.
- Docetaxel dexamethasone8 mg PO twice daily for three days beginning day before treatment; at least three doses before treatment. If missed, consultant may select20 mg IV immediately before; do not have patient self-substitute. Steroid primarily prevents hypersensitivity/fluid retention and must be reconciled with antiemetic steroid to avoid duplicate prescriptions.
- Consider primary G-CSF with docetaxel; local risk/strategy choice; no routine G-CSF once trastuzumab alone.
- Trastuzumab premedication not normally needed; consider paracetamol/antihistamine after previous reaction.

### Current JSON deficiencies

Only four rules exist. Missing eligibility, renal, hepatic, cardiac, FN strategy, missed-dose and dose-level pathways. `whole_regimen` on count delay/reduction incorrectly conflates chemotherapy with antibody-only phase. Current `TCH_FULL_DOSE` uses platelets >100 instead of ≥100. Do not keep febrile-neutropenia input inert. Route alternatives and maintenance phase need explicit dose data; baseline/ongoing context optional and must not block single-value results.

## 00731: neoadjuvant TCH(SC)P

### Source content and differences from 00258

- Indication00731a, neoadjuvant adult HER2-positive locally advanced, inflammatory or high-risk early disease. ECOG0–1; pretreatment LVEF≥55%; adequate organ function. Baseline grade≥2 sensory/motor neuropathy is an exclusion, as are uncontrolled hypertension and baseline ANC<1.5. Other exclusions: drug/murine-protein/excipient hypersensitivity, clinically significant cardiac disease, resting dyspnoea from advanced disease/comorbidities, severe hepatic dysfunction, pregnancy/breastfeeding.
- Six q21 combination cycles: C1 IV pertuzumab840 mg over60 min, SC trastuzumab600 mg over2–5 min, docetaxel75 mg/m² over60 min, carboplatinAUC6 over30 min; subsequent pertuzumab420 mg over30 min if tolerated (30–60 at consultant discretion). Either antibody first, then docetaxel then carboplatin. Pertuzumab observation60 min first dose; 30–60 subsequent, potentially omitted after three consecutive tolerated treatments per source. SC trastuzumab observation30/15 min and alternating-thigh instructions as above.
- After surgery, source describes another12 q21 trastuzumab cycles to total one year, referring00200/00285. Do not promise all patients the same postoperative drug: pathology/MDT may select another contemporary regimen, which requires its own indication/source. In particular, the PDF does not prescribe automatic postoperative pertuzumab continuation for all.
- Baseline HER2, measured GFR preferred/estimated GFR, FBC/renal/liver, echo/MUGA. FBC/renal/liver **before each cycle**; cardiac every12 weeks and completion, more often4–8 weeks if impairment. q21 reference points C1 baseline and aboutC5 during chemotherapy, continuing to aboutC9/C13/C17 across postoperative antibody therapy, adjusted to actual elapsed time.
- No fixed CT/breast imaging frequency, ECG, tumour-marker or DEXA timetable in this PDF. Preoperative response assessment and postoperative planning are pathway events, with timing set by MDT.
- Detailed Calvert guidance here caps GFR used in formula at125 mL/min; measured GFR for estimates unreliable in obesity/low creatinine; adjusted weight may be considered if BMI≥25 and no isotope GFR; if serum creatinine<63 the source says62 µmol/L or steady preoperative creatinine may be considered. These are clinician verification notes, not safe default substitutions.

### Rules

- Haematological/FN rows, ≥ boundaries, renal thresholds and docetaxel liver matrix are as in00258 above (00731 pp5–7). Unlike text extraction, visual Table2/3 uses ≥1.5 and ≥100. No reduction for nadir counts. Antibodies may continue through reversible chemotherapy myelosuppression with careful monitoring; no antibody dose reduction. If trastuzumab is discontinued, pertuzumab is discontinued.
- Pertuzumab interval<6 weeks:420 mg ASAP then original schedule; interval≥6 weeks:reload840 mg over60 min then420 q21. Missed SC trastuzumab remains600 mg ASAP with minimum three-week interval; **never reload SC trastuzumab8 mg/kg**.
- Renal pertuzumab: no reduction mild/moderate, no specific recommendation severe (limited data). Hepatic: not studied/no specific recommendation. This older source is less definite than00204/00507; source date matters.
- LVEF<50 plus fall≥10 points: withhold both antibodies for≥3 weeks; resume only after consultant assessment if LVEF≥50 OR drop<10 points; persistent/further decline consider stop, cardiology. Symptomatic heart failure: discontinue. Grade4 hypersensitivity: discontinue. Source adds pertuzumab permanent stop for anaphylaxis, bronchospasm or ARDS, and severe docetaxel hypersensitivity should not be rechallenged.
- Neuropathy>2: docetaxel75→60; persisting at60 stop. Stomatitis≥3:75→60, persisting at60→50, no further reduction.
- Pertuzumab severe/prolonged diarrhoea: early fluids/electrolytes/loperamide, consider interruption if not improving and reinstate once controlled. Use optional symptomatic pathway rather than generic “chemotherapy diarrhoea.”
- Support: carboplatinHigh/docetaxelLow/antibodiesMinimal, docetaxel oral dex8 mgBD×3 days starting day before; minimum3 doses; consultant20 mgIV fallback. Consider primaryG-CSF. No obligatory antibody premed unless prior reaction.
- If on warfarin: baselineINR, every2 weeks first3 months, then monthly if stable (p10). This should be conditional; not populate all patients with INR monitoring. Regular neurological/hearing review is stated for carboplatin, especially risk/high-dose/previousplatinum; audiometry if concurrent ototoxic drug.
- Source internal tension: p8 says docetaxel should only be given ANC≥1.5, whereas detailed Table2 offers ANC1–1.49 alternatives. Retain Table2 as explicit consultant-selected dose/GCSF strategy, with baseline<1.5 exclusion; do not claim unqualified proceed for an isolated low ANC.

### Current JSON deficiencies

- Wrong indication00722a; vague pertuzumab dose string; lacks loading/maintenance values and phase lengths.
- Platelet hold at≤100 instead of<100; intermediate rows and FN recovery require>100/>1.5 instead of≥ values. Missing full normal domain and rounding-gap explanation.
- Baseline ANC<1.5 exclusion absent. ECOG, HER2 status, uncontrolledhypertension, restingdyspnoea inputs/rules absent. Activeinfection rule is general clinical-safety guidance rather than directly listed NCCP exclusion: identify provenance accurately.
- Missing six-week pertuzumab reloading, SC interval safety, trastuzumab-stopped dependency, conditionalwarfarin schedule and relevantdiarrhoea/respiratoryreaction pathways.
- High-grade neuropathy/stomatitis produce no rule when currentdose is omitted; add immediate review/hold/conditional guidance and keep dose optional. At50 mg/m², persistent high-grade toxicity needs review because source plans no further reduction.
- Existing hepatic unlisted-axis guards are useful. Add missing-partner review when a high single LFT is supplied and conditional details rather than missing all decisions.

## 00204: metastatic pertuzumab/trastuzumab/docetaxel

### Dose and longitudinal phases (pp1–3)

-00204a: adults HER2-positive metastatic or locally recurrent unresectable disease, without prior anti-HER2 therapy or chemotherapy for metastatic disease. Do not translate to “never previously received anti-HER2 in any setting.”
-Cycle1 pertuzumab840 mg IV60 min and trastuzumab8 mg/kg IV90 min (either first), followed docetaxel75 mg/m² IV60 min. C2 onward420 mg and6 mg/kg; antibody infusion30 min if tolerated, docetaxel60 min. Docetaxel may be escalated to100 mg/m² if first dose well tolerated.
-Source table says docetaxel minimum6 cycles; modification notes allow antibody-only continuation if docetaxel stops for toxicity or after6–8 cycles and no progression. Do not make six cycles a hard maximum or force it despite toxicity. Antibodies continue while responding until progression/unacceptabletoxicity.
-No fixed curative surgery/RT sequence; local/palliative radiotherapy and endocrine therapy require individual plans. No pump; IV access/port decisions follow access needs. This is notPhesgo and notSC injection.
-BaselineFBC/renal/liver and echo/MUGA; beforeeverycycleFBC/renal/liver; echoq12 weeks andcompletion, q4–8wk if signsimpairment. Retain elapsed-time echo timeline through antibodymaintenance.
-ECOG0–2, validatedHER2, baselineLVEF≥50. BaselineANC<1.0 is explicit exclusion; significanthepatic dysfunction, allergy, pregnancy/lactation anddyspnoeaatrest exclusions. Clinicallysignificantcardiac disease is **caution**, notabsoluteblanketexclusion. No ongoingcountmodification table inthisPDF: do not fabricate specific current-cycleplateletthreshold or assume baselineANC alone proves eligibility toredose.

### Modification rules and ambiguities

-No usualantibodydose reduction; hold/stoptoxicity. Stoppertuzumab iftrastuzumabstopped.
-BothIVantibodies: interval<6wk maintain420/6 ASAP; ≥6wk reload840/8, thenq21. Firstinfusionobservationsource sameasabove.
-No renaldoseadjustmentneeded for allthree; nohepaticadjustmentexpected forantibodies. Pertuzumabdialysisdoseadjustmentnotexpected.
-**HepaticTable3 (p4) is genuinely internallyambiguous, visuallyverified.** Row1: ALP>2.5–5 ANDAST/ALT>1.5–5 ANDnormalbilirubin →consider75%originaldocetaxeldose. Row2: ALP<6 AND/ORAST/ALT>5–10 AND/ORbilirubin≤1–1.5 →consider50%. Literalrow2 includes normalALP/bilirubin and overlapsrow1. Row3: ALP>6 ORAST/ALT>10 ORbilirubin>1.5 →notrecommended. ALPexactly6 isnotcovered. Textalsoalternates ASTand/orALT headerwith(ASTandALT) inlowerrows.
-Implementationrecommendation: definite severevalue →do notgive docetaxel pendingconsultant/pharmacy review; intermediateabnormalities →review withsourcecontextandpossible75%/50% pathways, **no autonomous percentage selection**. ALP6 explicitlyreview. Normalvaluesalone mustnottrigger50%reduction. Do not“repair”ALP<6 intoband5–6 withoutNCCPclarification.
-LVEFdrop≥10pointsANDcurrent<50: withholdboth, repeatwithin3wk; noimprovement/furtherdecline considerstop/cardiology. Do notreplacewith00507's40/45rule.
-Symptomatichfdiscontinue; grade4hypersensitivitydiscontinue.
-Neuropathy>2: docetaxelto60; persistingat60stop. Grade3skinreaction:consultantreview. Stomatitis≥3:75→60; thisPDFdoesnotprescribe60→50 unlikeTCH/TCHP.
-Support: overallLowemetogenicphase, antibodiesMinimal. Docetaxeldex8mgBD×3days, startingdaybefore/minimum3doses;20mgIVfallbackconsultantchoice. ConsiderprimaryGCSF. Stopdocetaxelassociatedpremeds/GCSFwhenonlyantibodiescontinue.

### Current JSON deficiencies

-LVEF/CHFoutputs twice insert“Phesgo®” despite separateIVagents.
-No dose/phase/scheduledata, missingHER2/ECOG/lineeligibility and missed-dose rules. No ongoingANC/plateletdecisionotherthanbaselineANCcontext; showunassessed/reviewratherthan reassuringclearance onisolatedlowplatelets.
-Onlyseverehepaticcutoffsareencoded; intermediate abnormalities currentlyyieldnousefuldecision. Addreviewwithdocumentedambiguity.
-Persistentneuropathyat60 cannotbeentered; addoptionaldoselevelandconditionalreactionmanagement. Do notinventstomatitis50mg/m²from00258.

## 00507: metastatic weekly paclitaxel plus IV antibodies

### Dose, phases, monitoring and eligibility

-00507a, first-linemetastaticHER2-positive/locallyrecurrentunresectable, specificallydocetaxelunsuitable/intolerant/significanttoxicity. ECOG0–1; baselineLVEF≥50; adequateorganfunction; baselineANC<1.5excluded.
-D1pertuzumab840mg→420mgq21 andIVtrastuzumab8mg/kg→6mg/kgq21; paclitaxel80mg/m²onD1/D8/D15ofeach21daycycle, up toeightcycles. No plannedweekoffbetweenD15andnextD1. Antibodiescontinuewhilebenefiting aftertaxanestopsfor toxicityor6–8cycles. Chemotherapyend isreview, notautomaticstopofalltherapy.
-AllIV; paclitaxel60min in nonPVC systemwith0.22μmfilter. Antibodytiming/observationsasabove. NoSC/Phesgo substitutionswithoutchangingregimen.
-BaselineFBC/renal/liver/echo; source saysFBC/renal/liverbeforeeachcycle, neuroassessmentasindicated. Weeklyinfusionbloodassessmentperlocaldeliverypolicy shouldnotbemislabeledasexplicitNCCPq7universalrequirement.
-Echoq12wkandcompletion,4–8wkifimpairment; atq21cyclecountsbaseline,C5,C9etc. Sincepaclitaxelweekly, thisisapproximatelybefore13thweeklyadministration whenuninterrupted. Specifyelapsed12weeksprimarily.
-No fixedCT/tumourmarker/ECG/DEXAschedule. Ifaddinginternationalmetastaticimagingguidance, citespecificguidelineandkeepresponseintervalindividualised.
-Otherexclusionsallergy,significantcardiacdisease,restingdyspnoea,severehepaticdysfunction,pregnancy/lactation. Allarecontextualandmustnotbeassumedabsentwhenmissing.

### Blood, liver and missed-dose rules (pp3–4)

-Table1paclitaxeldoselevels80→65→50mg/m².
-ANC≥1.0ANDplatelets≥90:100%; ANC0.5–0.99AND/ORplatelets70–90:delayandconsiderreduction; ANC<0.5for≥7daysAND/ORplatelets<70:delaythenreduceonedoselevelafterrecovery. Platelets90appearsinbothfirstandsecondrows: explicitboundaryreview, notsilentproceed. ANC0.995isalsoabetweenprinteddecimalrowsgap.
-ANC<0.5withunknownor<7-daydurationstillrequiresimmediatehold/review; do notwait7daysforsafetyoutput. Reductioncriterionneedsdurationorplatelet<70.
-FN:source saysconsideraddingGCSF; **no automatic65/50mg/m²FNreductionisgiven**. CurrentFN_REDUCE_TO_65/50inventsprecisedoseandshouldberemoved/replacedbyacutehold/review+sourceGCSFadvice.
-LiverALT<10ANDbilirubin≤1.25: noadjustment; ALT<10ANDbilirubin1.26–2:75%original; ALT<10ANDbilirubin2.01–5:50%original; ALT≥10ORbilirubin>5:contraindicated. Decimalgaps1.25<bilirubin<1.26and2<bilirubin<2.01notexplicitlymapped; flagreviewratherthansilentlyextendingbands. HighsingleALT/bilirubinmusttriggercontraindicationwithoutrequiringtheother.
-Norenaldoseadjustmentexpectedforpaclitaxel; noneforpertuzumab(includingdialysis); trastuzumabCrCl≥30none, <30/dialysisnoadjustmentexpected. Nohepaticantibodyadjustmentexpected.
-Antibodiesnotdosereduced; stoppertuzumabiftrastuzumabstopped. SixweekintervalreloadbothIVagents840mg/8mgkg,nextcycle21daysafterreload. <6wkpertuzumab420ASAP. Retainantibodyfirstloadobservationsifreloadneeded; do notresetpreviouslyreducedpaclitaxelautomaticallyto80merelybecause“sameasCycle1”scheduleisused.

### Nonhaematological rules and ambiguity (p5 visually verified)

-LVEF<40OR40–45withfall≥10:withholdboth,repeatwithin3wk. Resumeif>45OR40–45withfall<10,onlyafterreview. SymptomaticHFandgrade4hypersensitivity:discontinue.
-PaclitaxelTable4explicitlystates **grade>2neuropathy:decrease10mg/m²**; othergrade2nonhaematologicaltoxicity:holduntil≤1thenreduce10mg/m²; **“≥Grade3reaction”**:discontinue.
-Therearetwosourceambiguities: (a)10mgstepsconflictwithTable1's15mgsteps;(b)grade3neuropathyreductionoverlapsbroad≥grade3“reaction”stop,withreactiontypeundefined. Safestsource-faithfulengineeringistoholdandseekconsultant/pharmacyreviewforgrade>2neuropathywithbothinstructionsvisible, avoidingautomatedunqualifiedstopor10mgdose. Do notconvert“>2”intograde2asexistingJSONdoes. If“reaction”isimplementedashypersensitivity,itneedsclearlylabelledscope; donotapplytoevertypeofgrade3toxicitywithoutprovenance.
-Unabletotolerateaftertworeductionsorrequiringdelay>twoweeks:stopPaclitaxel. Exactly14daysdoesnotmeet>twoweeks;15does. Do notuseweeks_since_last_antibodydoseforthislimit.
-Sourceexpectsnonhaematologicalgrade2holdtoproduceoutputevenifcurrentgradeordose-reductioncountomitted; conditionaldetailscansaywhatadditionalcontextrefinesdose.
-CurrentJSONincorrectlyreducesneuropathygrade2, blanketsgrade≥3neuropathyasstop, selectsFNexactdose, silentlyresolvesplatelets90andliverdecimalgaps, lacks>14daydelayruleandonlyreviewaftertworeductionsdespiteexplicittolerabilitystopinstruction.

### Support (pp5–6)

-PaclitaxelLow,antibodiesMinimal. D1premed: dexamethasone8mgIV,chlorphenamine10mgIV,famotidine20mgIV30minbeforepaclitaxel. Day8andlaterdexamethasonenotroutine;H1/H2continue. Dexcanbeaddedifhighrisk/priorreactionatconsultantdirection;famotidinemaybeomittedifnopriorreactionbyconsultantpolicy, withuncertaintyriskandmonitoring.
-Onrechallengeafterreaction,sourceallowsconsultant-directedoralDex20mg12h+6hprior. Do notmakeallweeklyvisitsreceiveunnecessary3daydocetaxelsteroids.
-Antibodypremednotnormallyrequiredunlesspriorreaction; considerparacetamol/antihistamine. Consideranalgesiaforpaclitaxelmyalgia/arthralgia.
-NoautomaticprimaryGCSFrequirementinthissource; FNmaypromptGCSF. Avoidcarboplatinhighemeticlabeloraminimalmaintenancephasewithgenericchemoantiemetics.

## Implementation review rules common to all four

1. Keepallinputsoptional; singleabnormalvalueproducespartial/conditionalassessment. Missingcontextneverdefaultsnormal,before/aftercycle,nonpregnant,zerotoxicityorfullcurrentdose.
2. Separatechemotherapyfromantibodymaintenance. Testsandlabalertsfromchemotherapymustnotautomaticallywithholdantibodiesoncetaxane/carboplatinended; keepcardiacmonitoringactive.
3. Keepuncertainboundsandsourceconflictsvisiblewithsourcepage, measuredvalueandwhyreviewisneeded. Do notinflateautomatedclinicalaccuracyclaimsfromscenarioagreement.
4. PreserveHER2statusandrouteidentitythroughclinicKB,patientguide,consent,antiemeticgenerator,anatomyvisual,portlogistics,QRandPDF.
5. Longitudinalmapneedscleardays/weeksbaseline+ongoing+endoftherapywithoutpatientdateentry. “C5”isillustrativefor12weeksonanuninterruptedq21schedule; delaysrequirecalendar-basedteamrescheduling. Do notloseechoaftertransitiontosurgery/maintenance.
6. Agent-specificanatomy:taxaneperipheralneuropathy/nails,hairloss,cytopeniaswhileonchemotherapy;HER2heartfunctionandreactions;pertuzumabdiarrhoea;SCthighsitewhereapplicable. Donotpopulateallgenericorgansforantibody-onlymaintenance.

## Audit-scenario matrix (expected source-derived behaviour, not executed application tests)

Each must be converted to automated/manualinput-outputcasesintherootintegration. Normaldomainresultsarepartialandmustnotproduceglobalfit-for-treatmentclearance.

|Code|Inputs|Expected|
|---|---|---|
|00258|ongoing ANC1.5,platelets100|Fullchemotherapydosebloodrow;neverdelaysolelybecauseplatelets=100|
|00258|ANC0.99alone|Delaydocetaxel/carboplatin,antibodyconditional;nootherfieldsrequired|
|00258|platelets99alone|Delaychemotherapy|
|00258|ANC1.2,platelets100,dosereductionstrategy|75%chemotherapy|
|00258|ANC1.2,platelets100,GCSFstrategy|100%chemotherapywithconfirmedGCSFpath|
|00258|ANC1.2alone|Partialconditionaldose/GCSFreview;missingplatelets/strategyunassessed|
|00258|baselineANC1.2|Initiationexclusion,notongoing75%recommendation|
|00258|baselineLVEF55|Clinicaljudgmentband,notstrict>55met|
|00258|baselineLVEF56|Baselinecardiaceligibilitydomainmet|
|00258|GFR20|Nocarboplatin|
|00258|GFR20.1|Extremecaution|
|00258|GFR30|Extremecaution|
|00258|GFR30.1|NolowGFRhardstop;stillCalvertverification|
|00258|AST/ALT2.5,ALP2.5,normalbilirubin|Noliveradjustment|
|00258|AST/ALT2.51,ALP2.5|Docetaxel75→60|
|00258|AST/ALT1.5,ALP5|Noliveradjustment|
|00258|AST/ALT1.51,ALP2.51|Docetaxel75→60|
|00258|AST/ALT5.1,ALP5.1|Delaymax2wk,ifnorecoverystopchemotherapy|
|00258|AST/ALT5.1,ALP1|Unlistedcombinationreview|
|00258|LVEF49,drop10|Holdtrastuzumab;repeat3wk|
|00258|LVEF50,drop10|Not<50holdrow;clinicalreviewifotherconcern|
|00258|symptomaticHFtrue|Urgenthold/cardiology;sourceconsidersdiscontinuation|
|00258|neuropathy3,currentdocetaxel60|Discontinuedocetaxel|
|00258|stomatitis3,currentdocetaxel60|Reduceto50|
|00258|IVq21trastuzumab8dayslate|Clinician-directedreload8mg/kg|
|00258|SCtrastuzumabmisseddose|600mgASAP,min21daysbetweeninjections|
|00731|indicationselector|00731a;no00722a|
|00731|ongoingANC1.5,platelets100|Fullbloodrow;noequal100hold|
|00731|FN2,ANC1.5,platelets100,dosereduction|50%originalchemotherapydose|
|00731|baselineLVEF55|Meets≥55domain|
|00731|baselineLVEF54.9|Beloweligibility;review/withholdinitiation|
|00731|baseline neuropathy2|Exclusion,unlike00258caution|
|00731|uncontrolledhypertensiontrue|Baselineexclusion|
|00731|pertuzumabinterval6wk|Reload840IV;trastuzumabstill600SC|
|00731|trastuzumabSCinterval20days|DonotgiveSCdosebefore21days|
|00731|neuropathy3withoutcurrentdose|Immediateconditionalmanagement/review;notnoresult|
|00731|LVEF49,drop10|Holdbothfor≥3wk|
|00731|warfarinfalseormissing|NounconditionalINRappointments|
|00204|baselineANC0.99|Sourcebaselineexclusion|
|00204|baselineANC1.0|Notbelowbaselineexclusion;otherdomainsunassessed|
|00204|baselineECOG2|Within0–2eligibilitydomain|
|00204|LVEF47,drop11|Holdboth;mustnotusethe40/45rule|
|00204|LVEF49,drop9|Doesnotmeetcombinedholdcriterion;notglobalclearance|
|00204|ALP1,AST/ALT1,bilirubin1|Never50%justbecauseALP<6|
|00204|ALP3,AST/ALT2,bilirubin1|Sourceambiguityreview;possible75%rowoverlaps50%row|
|00204|ALP6|Boundaryreview|
|00204|ALP6.01alone|Docetaxelnotrecommended;nootherLFTrequired|
|00204|AST/ALT10.01alone|Docetaxelnotrecommended|
|00204|bilirubin1.51alone|Docetaxelnotrecommended|
|00204|neuropathy3,currentdose60|Stopdocetaxel|
|00204|stomatitis3,currentdose60|Review;nopublished60→50rowhere|
|00204|6weeksantibodyinterval|840/8reloadIV;notPhesgo|
|00507|baselineANC1.2|Initiationexclusion|
|00507|ongoingANC1,platelets91|Fullbloodrowdomain|
|00507|platelets90|Overlapreview,nounqualifiedfull-doseproceed|
|00507|platelets89|Delayandconsiderreduction|
|00507|platelets69,currentdose80|Delaythenonedoselevel65afterrecovery|
|00507|ANC0.4alone|Immediatehold/review;durationunknown|
|00507|ANC0.4,duration7,currentdose65|Delaythenonedoselevel50afterrecovery|
|00507|FNtrue,currentdose80|Urgenthold/review+considerGCSF;nounsupportedautomatic65|
|00507|ALT9,bilirubin1.25|Nohepaticreduction|
|00507|ALT9,bilirubin1.255|Decimalgapreview|
|00507|ALT9,bilirubin1.26|75%originaldose|
|00507|ALT9,bilirubin2|75%originaldose|
|00507|ALT9,bilirubin2.005|Decimalgapreview|
|00507|ALT9,bilirubin2.01|50%originaldose|
|00507|ALT10alone|Paclitaxelcontraindicated|
|00507|bilirubin5.01alone|Paclitaxelcontraindicated|
|00507|LVEF39alone|Holdantibodies|
|00507|LVEF40,drop10|Holdantibodies|
|00507|LVEF45,drop10|Holdantibodies|
|00507|LVEF46,drop10|Not00507cardiacholdrow;do notborrow00204|
|00507|neuropathy2|Noinventedautomatic10mgdecrement;clinicalreviewifneeded|
|00507|neuropathy3|Sourceconflicthold/reviewwithspecificneuropathyandbroadreactionrows|
|00507|othernonhaemgrade2,currentgrade2|Holduntil≤1;reviewdoseconflict10mgvs15mgsteps|
|00507|treatmentdelay14days|Doesnotmeet>14daystopcriterion|
|00507|treatmentdelay15days|StopPaclitaxelpersource,clinicianreview|
|00507|unabletotolerateafter2reductions|StopPaclitaxelpersource|

