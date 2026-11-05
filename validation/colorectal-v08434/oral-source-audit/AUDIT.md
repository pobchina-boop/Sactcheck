# Oral clinical decision audit — v0.84.34

Audit comparison began at 2e5de4a6dd9e2fcbefa18623ff21db7b9eaec40b. Packaging later fast-forwarded to c19bef57ca5ae49816ad851f2b551b76af32fa5d; neither audited oral protocol changed between those commits. Before-snapshots retain the original comparison.

Audited NCCP 00244 v5 and 00382 v4 against freshly retrieved HSE PDFs and current EMA supplements. The retained PDFs and their SHA256 hashes are recorded in sources.json; rendered dose tables were inspected. This is a source reconciliation and software audit, not independent clinical approval.

## Material changes

- Regorafenib: exclusions and scope, current-dose floor and tablet steps, HFSR occurrence/recovery and minimum interruption, recurrence-independent hepatic hold, Gilbert exception, grade4 hypertension stop, cause-specific interruption duration, other-toxicity exceptions, SmPC safety flags and interaction review. Explicit dosing days repair the previously incomplete schedule model.
- Lonsurf: rare hereditary sugar-disorder exclusion, no re-escalation, previous-dose/reduction ceilings, standard versus severe-renal floors, recovery confirmation, conflicting renal/timing inputs, pharmacy verification and unequal AM/PM tablet safeguard. Existing source-specific count and toxicity rules are retained.

## Source differences kept visible

- Regorafenib NCCPp1 contains conflicting food directions. Current EMA4.2 confirms administration after a light meal with less than30%fat.
- Regorafenib NCCPTable4 prints >200mmHg in one diastolic-rise criterion. This is recorded as unresolved; no guessed replacement is encoded. DBP100 also overlaps current-grade and recovery descriptions, so the isolated number cannot authorise restart.
- ChildPughB: NCCP expects no adjustment; EMA gives no dose recommendation because data are limited. Consultantreview explicitly identifies both statements.
- HFSR and generic other-toxicity grades do not inherit invented CTCAEv5 metadata. The hypertension table explicitly cites4.03.

## Validation

563/563 current source scenario and structural checks passed, including210 explicit blank/null checks. All111 encoded rules have a positive scenario; count thresholds,ULN boundaries, grade/recurrence/recovery, dose floors, timing, missing/discordant inputs and component-attributed no-arithmetic dose decisions are exercised. This is not exhaustive state-space coverage.

514/514 retained v0.84.24 integrated scenarios also passed. GI batch, LFT adapter audit and constrained/global scenario interpreter regressions passed. Historical source-reconciliation, platform-standardisation, GI-library and sarcoma-library gates now recognise the exact audited v34 records while retaining unrelated assertions. Broad release/browser/PDF/patient integration remains the release owner's responsibility.

Run: `node validation/colorectal-v08434/oral-source-audit/source-cases.cjs`

## Manual boundaries

Exact BSA tablet tables remain pharmacy-verified rather than an unvalidated tablet calculator. Clinical indication/age, treatment benefit, dose authorisation, full interaction review, test attendance and contextual safety decisions remain explicit clinician responsibilities. No source ambiguity is presented as a validated numerical dose.

## Criteria ledger

|Code|Source page/table|Criterion|Implementation / status|
|---|---|---|---|
|00244|1|Adult CRC or GIST indication and required prior treatment|encoded: PRIOR_THERAPY_REVIEW, SCOPE_REVIEW Clinician confirms indication and previous therapies; no histology/line is inferred. Adult age is verified manually; no automatic age eligibility calculation.|
|00244|1|ECOG 0–1 and adequate organ reserve|encoded: ECOG_REVIEW, ORGAN_RESERVE_REVIEW No invented numerical marrow or renal eligibility cutoff.|
|00244|1|Regimen exclusions, including cardiac history and severe hepatic impairment|encoded: EXCLUDE_HYPERSENSITIVITY, EXCLUDE_PREGNANCY, EXCLUDE_BREASTFEEDING, EXCLUDE_UNSTABLE_OR_RECENT_ANGINA, EXCLUDE_RECENT_MYOCARDIAL_INFARCTION, EXCLUDE_CARDIAC_FAILURE, CHILD_PUGH_C NCCP says recent MI without a numeric interval; input explains EMA trial exclusion within six months as supplementary context, not an inferred absolute NCCP cutoff.|
|00244|2|Caution for hypersensitivity to another drug in the same class|encoded: SAME_CLASS_CAUTION |
|00244|1–2|Consultant initiation, response review and duration|manual_review:  Clinical authority, shared treatment decision and response assessment cannot be inferred from laboratory values.|
|00244|1|Reference oral schedule, 40 mg steps and 80–160 mg daily limits|encoded: DOSE_OUTSIDE_RANGE, DOSE_TABLET_STEP, DOSE_FLOOR, DOSE_HISTORY_REQUIRED Schedule renderer now has explicit dosing-day array and component attribution; actual prescription may start lower. No automatic current dose from reference160.|
|00244|1; EMA4.2 pp2,5|Conflicting NCCP food instructions resolved by current EMA administration instructions|supplement_resolves_conflict: SAFETY_ORAL_SCHEDULE_UNCERTAIN NCCP same paragraph also says with or without food; both retained in source discrepancy log. Swallow whole, same-day missed dose only, no doubling or replacement after vomiting.|
|00244|2|Baseline investigations and conditional cardiac/pancreatic tests|content_and_manual_review:  Retained in protocol supportive notes and patient monitoring plan; attendance/results review must be confirmed clinically.|
|00244|2|Regular investigations, early liver/BP frequency and warfarin monitoring|content_and_manual_review: SAFETY_WARFARIN_OR_BLEEDING_RISK Event-specific liver weekly monitoring is separate. No universal disease-scan interval is invented.|
|00244|3 Table1|Renal impairment and haemodialysis recommendations|encoded: DIALYSIS_REVIEW No arbitrary eGFR cutoff or automatic numeric reduction.|
|00244|3 Table1; EMA4.2 p4|Child-Pugh A/B recommendations and unresolved NCCP–EMA difference for B|unresolved_source_difference: CHILD_PUGH_AB Explicit consultant review; do not convert either statement into automatic clearance or a fabricated dose.|
|00244|3 Table2|Grade 1 HFSR: support without automatic reduction|encoded: HFSR_G1 |
|00244|3 Table2|First grade 2 HFSR: reduction history and response to the initial reduction|encoded: HFSR_CONTEXT, HFSR_G2_FIRST, HFSR_REDUCTION_CONTEXT, HFSR_G2_PERSIST |
|00244|3 Table2|Persistent, second or third grade 2 HFSR: interruption, recovery and reduction|encoded: HFSR_G2_PERSIST, HFSR_RESTART_NOT_RECOVERED |
|00244|3 Table2|Fourth grade 2 HFSR: permanent discontinuation|encoded: HFSR_G2_FOURTH |
|00244|3 Table2|First or second grade 3 HFSR: at least seven days of interruption and recovery|encoded: HFSR_G3_HOLD, HFSR_G3, HFSR_MINIMUM_BREAK, HFSR_RESTART_NOT_RECOVERED Missing occurrence does not cancel current grade3 hold. Minimum7day flag is explicitly tied to qualifying HFSR episode.|
|00244|3 Table2|Third grade 3 HFSR: permanent discontinuation|encoded: HFSR_G3_THIRD |
|00244|3 Table2|HFSR re-escalation requires a discretionary clinical decision|encoded_review: REESCALATION_REVIEW, RESTART_REVIEW Clinical restart approval, source recovery and actual dose needed; never auto-re-escalate.|
|00244|4 Table3|ALT/AST ≤5 × ULN: domain-specific advice and monitoring|encoded: LIVER_LOW_GRADE Does not cancel other holds or authorise the complete regimen.|
|00244|4 Table3|First ALT/AST >5 to ≤20 × ULN: hold, recovery and conditional restart|encoded: LIVER_G3_HOLD, LIVER_G3_FIRST, LIVER_RESTART_RECOVERY, LIVER_RESTART_RISK The current hold is independent of missing recurrence; benefit/risk remains consultant judgement.|
|00244|4 Table3|Recurrent ALT/AST >5 × ULN or any >20 × ULN: permanent stop|encoded: LIVER_G3_RECUR, LIVER_G4 |
|00244|4 Table3|Combined transaminase/bilirubin elevation and the confirmed Gilbert exception|encoded: LIVER_HY, LIVER_HY_GILBERT_UNKNOWN, LIVER_GILBERT Unknown Gilbert status holds pending clarification; confirmedGilbert uses transaminase rows and never cancels>20/recurrent stop. Real lab adapter tests higher ALT/AST using each ownULN.|
|00244|5 Table4|Grade 1 hypertension: monitoring|encoded: HTN_G1 |
|00244|5 Table4|Asymptomatic grade 2 hypertension and the unresolved printed BP criterion|encoded_with_source_ambiguity: HTN_G2_ASYMPTOMATIC, HTN_REDUCTION Printed diastolic rise >200mmHg is unresolved; clinician-confirmed grade is used, not a silently corrected >20 threshold.|
|00244|5 Table4|Symptomatic grade 2 or grade 3 hypertension: hold, recovery and dose review|encoded: HTN_G2_SYMPTOMATIC, HTN_G3, HTN_RESTART_SYMPTOMS, HTN_REDUCTION |
|00244|5 Table4|Numerical severe-BP boundary and its overlap with recovery wording|encoded_with_source_ambiguity: HTN_BP_SEVERE DBP100 overlaps recovery≤100; numberalone never authorisesrestart. Conservative hold/review is explicitly labelled, not a definitive clinical grade diagnosis.|
|00244|5 Table4|Grade 4 hypertension or hypertensive crisis: discontinuation|encoded: HTN_G4 |
|00244|5 Table4 footnotes|Hypertension interruption duration, dose floor and re-escalation conditions|encoded: HTN_PROLONGED_DELAY, HTN_MAX_REDUCTIONS, REESCALATION_REVIEW Delay attributed tohypertension explicitly. Historical reductions after re-escalation cannot bythemselves falselyprove current dosefloor.|
|00244|5 Table5|Other grade 3–4 toxicities: interruption and source-specific recovery|encoded: OTHER_G3_4, OTHER_GRADE_CONTEXT No standalone grade2 permanentstop; grade4 discretionary discontinuation remains consultantdecision.|
|00244|5 Table5 footnotes|Other-toxicity four-week non-recovery and recurrence after re-escalation|encoded: OTHER_FOUR_WEEK_STOP, OTHER_RESTART_G2, OTHER_RECURRENCE_REESCALATION |
|00244|5 Table5 exclusions|Table 5 exclusions and separate toxicity pathways|encoded: OTHER_GRADE_CONTEXT Explicit classification input; neither unknownexception nor generic grade alonecalculatesdose.|
|00244|6|Regorafenib emetogenic risk, usual premedication and HFSR support|content_and_manual_review:  Prescribed breakthroughplan andlocal skin/footcare; no chemotherapy-style antiemetic regimen borrowed.|
|00244|6; EMA4.4 pp5–7|Explicit current SmPC safety pathways|explicit_SmPC_supplement: SAFETY_WORSENING_INFECTION, SAFETY_SEVERE_BLEEDING, SAFETY_GI_PERFORATION_OR_FISTULA, SAFETY_CARDIAC_ISCHAEMIA_OR_INFARCTION, SAFETY_CARDIAC_EVENT_NONRESOLUTION, SAFETY_PRES_CONFIRMED, SAFETY_HYPERAMMONAEMIC_ENCEPHALOPATHY, SAFETY_UNEXPLAINED_MENTAL_STATUS_CHANGE, SAFETY_TMA_CONFIRMED, SAFETY_MAJOR_SURGERY_OR_UNHEALED_WOUND, SAFETY_SIGNIFICANT_METABOLIC_ABNORMALITY, SAFETY_ANEURYSM_OR_DISSECTION_RISK Temporaryholds for urgentreview distinguish SmPC considerpermanentdiscontinuation fromdefinite permanentstops. Symptoms do notimplyconfirmed diagnoses.|
|00244|6; EMA4.5 pp7–8|Explicit current SmPC interaction review|explicit_SmPC_supplement: SAFETY_STRONG_CYP3A4_OR_UGT1A9_INTERACTION, SAFETY_SUBSTRATE_INTERACTION, SAFETY_WARFARIN_OR_BLEEDING_RISK Pharmacy review remains necessary for the full medicationlist; flags are not a comprehensive interaction database.|
|00244|EMA4.4–4.6 pp6–9|Additional clinical precautions and reproductive counselling|manual_review:  Relevantclinicalhistory, investigations and contraception discussion recorded by treatingteam; no fabricated universal test/date ordose.|
|00382|1|Adult colorectal monotherapy indication and previous treatment|encoded: PRIOR_THERAPY_REVIEW, SCOPE_SEPARATE_REGIMEN Gastric/SUNLIGHT-bevacizumab contexts remain separate; adultage andspecificprevious agents verifiedclinically.|
|00382|2|Lonsurf performance status, organ function and exclusions|encoded: ECOG_SCOPE, EXCLUSION_HYPERSENSITIVITY, PREG_LACT |
|00382|1|Starting oral schedule, per-dose cap and reference dosing|encoded: ORAL_PLAN_REVIEW, TABLET_PLAN_UNVERIFIED SourceBSA table mustbeverified bypharmacy; noarithmeticrounding calculator orautomaticpatient-specificdose.|
|00382|1 Tables1;3 Table4;4 Table6|BSA tablet tables and unequal morning/evening doses at 50 mg daily|manual_table_verification: SPECIAL_50MG_DAILY_PLAN, TABLET_PLAN_UNVERIFIED SourcePDFtables retained. 50mg/day means20mgAM+30mgPM. ExactBSA tablet lookup is deliberately notautomated; verifytable/applicable doselevel ratherthan borrowing standard35mg bands for renal/reduceddoses.|
|00382|1|Administration after meals and missed/held-dose instructions|encoded: ORAL_PLAN_REVIEW Vomiteddose no-replacement is supportedbycurrentEMA patientinstructions. Patient followspharmacycalendar.|
|00382|2|Consultant initiation and dose-modification authority|manual_review:  Noengineoutput authorisesprescription; benefit,response andpatientpriorities reviewedbyteam.|
|00382|2|Baseline and before-cycle investigations|content_and_manual_review:  No universalDay15bloodtest orscaninterval invented; extraCBC asclinically indicated.|
|00382|2|Standard dose reductions, dose floor and prohibition of re-escalation|encoded: NO_REESCALATION, MAX_REDUCTIONS, DOSE_HISTORY_REQUIRED, STANDARD_DOSE_FLOOR Severerenal20→15pathway isdistinct; noadditive simultaneous toxicityreductions.|
|00382|2 Table2|During-cycle ANC and platelet interruption thresholds|encoded: ANC_INTERRUPT, PLT_INTERRUPT |
|00382|2 Table2|New-cycle count minima and conflicting assessment timing|encoded: ANC_NEXT_CYCLE, PLT_NEXT_CYCLE, ANC_CONTEXT_REVIEW, PLT_CONTEXT_REVIEW, ASSESSMENT_CONTEXT_CONFLICT Restartandnewcycle separatedfromduringdosing; discordant timingreview cannotcancelmore restrictivecountfinding.|
|00382|3 Table3|Febrile neutropenia, recovery and reduction from the previous dose|encoded: FEBRILE_NEUTROPENIA, RESTART_RECOVERY_UNCONFIRMED |
|00382|3 Table3|Previous severe nadir causing more than seven days of cycle delay|encoded: SEVERE_NADIR_REVIEW, SEVERE_NADIR_DELAY_REDUCE Nadirhistorynotinferredfromcurrentcounts; delaycauseconfirmed byclinicalinput.|
|00382|4 Table5; EMA4.2 p6|Source-specific renal boundaries, including the EMA lower limit|encoded: RENAL_15_29, RENAL_LT15, RENAL_CONTEXT_CONFLICT EMA lower15boundary prevents extrapolating NCCP<30row; exactclearancevslegacyband discrepancies explicitlyreviewed.|
|00382|4 Table6; EMA4.2 p5|Severe-renal minimum dose and intolerance of that minimum|encoded: SEVERE_RENAL_REDUCTION_LIMIT, SEVERE_RENAL_MINIMUM_STOP, MINIMUM_DOSE_REVIEW |
|00382|4 Table5; EMA4.2 p6|Baseline moderate/severe hepatic impairment|encoded: HEPATIC_MOD_SEV Mildhepatic noadjustment; currentabnormalresult requiresbaselineclassificationandcause review, not anautomatic dose.|
|00382|4 Table7|Non-haematological toxicity and controlled grade 3 GI exceptions|encoded: NONHAEM_GRADE_REVIEW, NONHAEM_QUALIFYING_REDUCE, SEVERE_TOX_REDUCE, RESTART_RECOVERY_UNCONFIRMED Unknown GIcontrol neverassumed; grade4retainsurgenthold. Previousstandardorrenalminimum respected.|
|00382|5|Lonsurf nausea risk, hydration, symptom support and driving advice|content_and_manual_review:  Patientandpharmacyindividual supportplan. Nofixedparenteralantiemeticscheduleautomaticallyapplied.|
|00382|5|Specified rare hereditary sugar disorders|encoded: EXCLUSION_SUGAR_DISORDER Not equatedwithordinary nonspecificlactose symptoms.|
|00382|5|Contraception and hormonal-method counselling|content_and_manual_review:  CurrentNCCP andEMA reproductivecounselling, not anautomated pregnancytestorstopdate calculator.|
|00382|6; EMA4.4 pp7–8|Enhanced blood-count monitoring with renal impairment|encoded: RENAL_ENHANCED_MONITORING Noinventedfixedfrequency beyondsource.|
|00382|6; EMA4.4 pp7–8|Infection and unresolved severe toxicity before initiation|explicit_SmPC_supplement: ACTIVE_INFECTION, UNRESOLVED_PRIOR_TOXICITY Infectiondoesnot itselfprovetheneutropeniadose-reductioncriterion.|
|00382|6; EMA4.5 p8|Thymidine-kinase substrate and transporter interaction review|explicit_SmPC_supplement: INTERACTION_REVIEW Checkfullmedicationlistwithpharmacy; noautomaticnumericdosefrominteractionflag.|
