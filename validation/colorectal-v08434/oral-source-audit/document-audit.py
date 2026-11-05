"""Generate the human-auditable criteria ledger from explicitly reviewed source clauses."""
import json,hashlib,re
from pathlib import Path
H=Path(__file__).resolve().parent;R=H.parents[2]
def write(name,x): (H/name).write_text(json.dumps(x,indent=2,ensure_ascii=False)+'\n')
P={c:json.loads(next((R/'protocols/gastrointestinal').glob(c+'-*')).read_text()) for c in ['00244','00382']}
sources=[]
for c in P:
 p=P[c];b=(H/(c+'.pdf')).read_bytes();assert b.startswith(b'%PDF')
 sources.append({'id':c,'kind':'NCCP','url':p['metadata']['source_url'],'retrieved':'2026-11-05','version':p['metadata']['nccp_version'],'document_date':'2025-03-25' if c=='00244' else '2026-07-01','document_date_basis':'v5 amendment date, p7; displayed review due 25/03/2030' if c=='00244' else 'last reviewed and v4 amendment date','file':c+'.pdf','sha256':hashlib.sha256(b).hexdigest(),'text_sha256':hashlib.sha256((H/(c+'.txt')).read_bytes()).hexdigest(),'pages':7 if c=='00244' else 6,'retrieval':'Official HTTPS PDF downloaded in this task with curl; retained bytes verified. Source tables viewed as rendered images.'})
for name in ['stivarga','lonsurf']:
 b=(H/(name+'-ema.pdf')).read_bytes();assert b.startswith(b'%PDF')
 sources.append({'id':name+'-ema','kind':'EMA SmPC','url':f'https://www.ema.europa.eu/en/documents/product-information/{name}-epar-product-information_en.pdf','retrieved':'2026-11-05','version':'Current downloaded consolidated EMA product information; not the older access date printed in NCCP references','file':name+'-ema.pdf','sha256':hashlib.sha256(b).hexdigest(),'text_sha256':hashlib.sha256((H/(name+'-ema.txt')).read_bytes()).hexdigest(),'pages':len(re.findall(r'--- PAGE \d+ ---',(H/(name+'-ema.txt')).read_text()))})
write('sources.json',sources)
rows=[]
def row(c,pg,criterion,ids='',status='encoded',detail=''):
 rows.append(dict(code=c,source_page=pg,criterion=criterion,status=status,rule_ids=ids.split() if ids else [],detail=detail))
G=lambda *a,**k:row('00244',*a,**k)
L=lambda *a,**k:row('00382',*a,**k)
G('1','Adult CRC after the specified available treatments or non-candidacy; GIST after imatinib/sunitinib progression or intolerance','PRIOR_THERAPY_REVIEW SCOPE_REVIEW',detail='Clinician confirms indication and previous therapies; no histology/line is inferred. Adult age is verified manually; no automatic age eligibility calculation.')
G('1','ECOG0–1 and adequate marrow, renal and liver reserve','ECOG_REVIEW ORGAN_RESERVE_REVIEW',detail='No invented numerical marrow or renal eligibility cutoff.')
G('1','Hypersensitivity, pregnancy/lactation, unstable/new angina, recent MI, cardiac failure, severe liver impairment exclusions','EXCLUDE_HYPERSENSITIVITY EXCLUDE_PREGNANCY EXCLUDE_BREASTFEEDING EXCLUDE_UNSTABLE_OR_RECENT_ANGINA EXCLUDE_RECENT_MYOCARDIAL_INFARCTION EXCLUDE_CARDIAC_FAILURE CHILD_PUGH_C',detail='NCCP says recent MI without a numeric interval; input explains EMA trial exclusion within six months as supplementary context, not an inferred absolute NCCP cutoff.')
G('2','Same-class drug hypersensitivity caution','SAME_CLASS_CAUTION')
G('1–2','Consultant initiates treatment; continuing benefit and acceptable toxicity determine duration',status='manual_review',detail='Clinical authority, shared treatment decision and response assessment cannot be inferred from laboratory values.')
G('1','160mg reference once daily, days1–21 of28; maximum160,40mg tablet steps, minimum80','DOSE_OUTSIDE_RANGE DOSE_TABLET_STEP DOSE_FLOOR DOSE_HISTORY_REQUIRED',detail='Schedule renderer now has explicit dosing-day array and component attribution; actual prescription may start lower. No automatic current dose from reference160.')
G('1; EMA4.2 pp2,5','Meal wording conflicts within NCCP: use current EMA after a light meal containing <30%fat','SAFETY_ORAL_SCHEDULE_UNCERTAIN',status='supplement_resolves_conflict',detail='NCCP same paragraph also says with or without food; both retained in source discrepancy log. Swallow whole, same-day missed dose only, no doubling or replacement after vomiting.')
G('2','Baseline FBC/renal/liver/TFT/BP; pancreatic enzymes if indicated; ECG/QT if at risk',status='content_and_manual_review',detail='Retained in protocol supportive notes and patient monitoring plan; attendance/results review must be confirmed clinically.')
G('2','Regular blood count/renal; liver every2weeks for2months then monthly; BP weekly6weeks then eachcycle; indicated TFT/pancreatic/cardiac checks; closeINR withwarfarin','SAFETY_WARFARIN_OR_BLEEDING_RISK',status='content_and_manual_review',detail='Event-specific liver weekly monitoring is separate. No universal disease-scan interval is invented.')
G('3 Table1','Renal impairment no adjustment; haemodialysis no adjustment expected','DIALYSIS_REVIEW',detail='No arbitrary eGFR cutoff or automatic numeric reduction.')
G('3 Table1; EMA4.2 p4','ChildPughA no adjustment; ChildPughB NCCP expects none but EMA provides no recommendation due limited data','CHILD_PUGH_AB',status='unresolved_source_difference',detail='Explicit consultant review; do not convert either statement into automatic clearance or a fabricated dose.')
G('3 Table2','HFSRgrade1: symptomatic support without automatic reduction','HFSR_G1')
G('3 Table2','First HFSRgrade2: one40mg reduction; failed response requires interruption; do not duplicate already-applied reduction','HFSR_CONTEXT HFSR_G2_FIRST HFSR_REDUCTION_CONTEXT HFSR_G2_PERSIST')
G('3 Table2','HFSRgrade2 no improvementwithin7days orsecond/third occurrence: interrupt tograde0–1 then40mg reduction','HFSR_G2_PERSIST HFSR_RESTART_NOT_RECOVERED')
G('3 Table2','Fourth HFSRgrade2: permanentstop','HFSR_G2_FOURTH')
G('3 Table2','HFSRgrade3 first/second occurrence: holdminimum7days andtograde0–1; reduce40mg','HFSR_G3_HOLD HFSR_G3 HFSR_MINIMUM_BREAK HFSR_RESTART_NOT_RECOVERED',detail='Missing occurrence does not cancel current grade3 hold. Minimum7day flag is explicitly tied to qualifying HFSR episode.')
G('3 Table2','Third HFSRgrade3: permanentstop','HFSR_G3_THIRD')
G('3 Table2','HFSR re-escalation is discretionary','REESCALATION_REVIEW RESTART_REVIEW',status='encoded_review',detail='Clinical restart approval, source recovery and actual dose needed; never auto-re-escalate.')
G('4 Table3','ALT/AST ≤5ULN: domain-specific continuation with weeklytests until<3ULN/baseline','LIVER_LOW_GRADE',detail='Does not cancel other holds or authorise the complete regimen.')
G('4 Table3','ALT/AST >5 to≤20ULN firstevent: interrupt; weeklytests to<3ULN/baseline; benefit/risk restart40mg lower andweeklytests≥4weeks','LIVER_G3_HOLD LIVER_G3_FIRST LIVER_RESTART_RECOVERY LIVER_RESTART_RISK',detail='The current hold is independent of missing recurrence; benefit/risk remains consultant judgement.')
G('4 Table3','Recurrent ALT/AST>5ULN or any>20ULN: permanentstop','LIVER_G3_RECUR LIVER_G4')
G('4 Table3','ALT/AST>3ULN and bilirubin>2ULN: permanentstop except confirmedGilbert pathway','LIVER_HY LIVER_HY_GILBERT_UNKNOWN LIVER_GILBERT',detail='Unknown Gilbert status holds pending clarification; confirmedGilbert uses transaminase rows and never cancels>20/recurrent stop. Real lab adapter tests higher ALT/AST using each ownULN.')
G('5 Table4','Grade1 BP: increase monitoring','HTN_G1')
G('5 Table4','Asymptomaticgrade2: treatBP; reduction ifDBPnotcontrolledwithnewtherapy','HTN_G2_ASYMPTOMATIC HTN_REDUCTION',status='encoded_with_source_ambiguity',detail='Printed diastolic rise >200mmHg is unresolved; clinician-confirmed grade is used, not a silently corrected >20 threshold.')
G('5 Table4','Symptomaticgrade2 orgrade3: hold until symptomsresolve andDBP≤100; grade3 restart40mg lower','HTN_G2_SYMPTOMATIC HTN_G3 HTN_RESTART_SYMPTOMS HTN_REDUCTION')
G('5 Table4','SBP≥160 orDBP≥100 numeric grade3 range','HTN_BP_SEVERE',status='encoded_with_source_ambiguity',detail='DBP100 overlaps recovery≤100; numberalone never authorisesrestart. Conservative hold/review is explicitly labelled, not a definitive clinical grade diagnosis.')
G('5 Table4','Grade4 hypertension/crisis: discontinue','HTN_G4')
G('5 Table4 footnotes','Hypertension delay>4weeks orrequiredreductionbelow80: stop; controlled≥onecycle before discretionaryre-escalation','HTN_PROLONGED_DELAY HTN_MAX_REDUCTIONS REESCALATION_REVIEW',detail='Delay attributed tohypertension explicitly. Historical reductions after re-escalation cannot bythemselves falselyprove current dosefloor.')
G('5 Table5','Other toxicity grade0–2 normally nochange; grade3/4holduntil<2 and40mg lower','OTHER_G3_4 OTHER_GRADE_CONTEXT',detail='No standalone grade2 permanentstop; grade4 discretionary discontinuation remains consultantdecision.')
G('5 Table5 footnotes','Priorqualifyinggrade3/4 withoutrecoveryafter4weeks stops; restartneeds<2; afterre-escalation grade≥3recurrence meanspermanentreduction','OTHER_FOUR_WEEK_STOP OTHER_RESTART_G2 OTHER_RECURRENCE_REESCALATION')
G('5 Table5 exclusions','Separate liver/HFSR/BP pathways; excludealopecia, non-refractoryNV/hypersensitivity andasymptomaticlabs','OTHER_GRADE_CONTEXT',detail='Explicit classification input; neither unknownexception nor generic grade alonecalculatesdose.')
G('6','Oralminimal-to-low emesis; usualpremedicationunnecessary; localHFSRsupport',status='content_and_manual_review',detail='Prescribed breakthroughplan andlocal skin/footcare; no chemotherapy-style antiemetic regimen borrowed.')
G('6; EMA4.4 pp5–7','Infection, bleeding, perforation/fistula, ischaemia, PRES, hyperammonaemia, TMA, surgery/wounds, metabolicabnormalities andaneurysmrisk','SAFETY_WORSENING_INFECTION SAFETY_SEVERE_BLEEDING SAFETY_GI_PERFORATION_OR_FISTULA SAFETY_CARDIAC_ISCHAEMIA_OR_INFARCTION SAFETY_CARDIAC_EVENT_NONRESOLUTION SAFETY_PRES_CONFIRMED SAFETY_HYPERAMMONAEMIC_ENCEPHALOPATHY SAFETY_UNEXPLAINED_MENTAL_STATUS_CHANGE SAFETY_TMA_CONFIRMED SAFETY_MAJOR_SURGERY_OR_UNHEALED_WOUND SAFETY_SIGNIFICANT_METABOLIC_ABNORMALITY SAFETY_ANEURYSM_OR_DISSECTION_RISK',status='explicit_SmPC_supplement',detail='Temporaryholds for urgentreview distinguish SmPC considerpermanentdiscontinuation fromdefinite permanentstops. Symptoms do notimplyconfirmed diagnoses.')
G('6; EMA4.5 pp7–8','CYP3A4/UGT1A9 inhibitors/inducers, substrate exposure, anticoagulants','SAFETY_STRONG_CYP3A4_OR_UGT1A9_INTERACTION SAFETY_SUBSTRATE_INTERACTION SAFETY_WARFARIN_OR_BLEEDING_RISK',status='explicit_SmPC_supplement',detail='Pharmacy review remains necessary for the full medicationlist; flags are not a comprehensive interaction database.')
G('EMA4.4–4.6 pp6–9','Cirrhosis-varicesscreening, ischaemicriskmonitoring, reproductivecounselling andfertility',status='manual_review',detail='Relevantclinicalhistory, investigations and contraception discussion recorded by treatingteam; no fabricated universal test/date ordose.')
L('1','Adult CRC monotherapy afterspecifiedavailabletreatments ornoncandidacy','PRIOR_THERAPY_REVIEW SCOPE_SEPARATE_REGIMEN',detail='Gastric/SUNLIGHT-bevacizumab contexts remain separate; adultage andspecificprevious agents verifiedclinically.')
L('2','ECOG0–1, adequate marrow/renal/hepatic; hypersensitivity andpregnancy/lactation exclusions','ECOG_SCOPE EXCLUSION_HYPERSENSITIVITY PREG_LACT')
L('1','35mg/m² per dose BID reference, max80mgperdose; days1–5/8–12 of28; untilprogression/intolerance','ORAL_PLAN_REVIEW TABLET_PLAN_UNVERIFIED',detail='SourceBSA table mustbeverified bypharmacy; noarithmeticrounding calculator orautomaticpatient-specificdose.')
L('1 Tables1;3 Table4;4 Table6','All BSA bands andtabletcounts, includingdifferentAM/PM at50mgtotaldaily','SPECIAL_50MG_DAILY_PLAN TABLET_PLAN_UNVERIFIED',status='manual_table_verification',detail='SourcePDFtables retained. 50mg/day means20mgAM+30mgPM. ExactBSA tablet lookup is deliberately notautomated; verifytable/applicable doselevel ratherthan borrowing standard35mg bands for renal/reduceddoses.')
L('1','Withinonehouraftermorning/eveningmeals; nomissed/helddosecatchup','ORAL_PLAN_REVIEW',detail='Vomiteddose no-replacement is supportedbycurrentEMA patientinstructions. Patient followspharmacycalendar.')
L('2','Consultant initiation andall dosemodifications',status='manual_review',detail='Noengineoutput authorisesprescription; benefit,response andpatientpriorities reviewedbyteam.')
L('2','Baselineandbeforeeachcycle FBC/renal/liver andurineprotein; diseasechecks individual',status='content_and_manual_review',detail='No universalDay15bloodtest orscaninterval invented; extraCBC asclinically indicated.')
L('2','Maximum3 standard reductions,20mg/m²BID minimum,nore-escalation','NO_REESCALATION MAX_REDUCTIONS DOSE_HISTORY_REQUIRED STANDARD_DOSE_FLOOR',detail='Severerenal20→15pathway isdistinct; noadditive simultaneous toxicityreductions.')
L('2 Table2','Duringdosing ANC<0.5 orplatelets<50 interrupts','ANC_INTERRUPT PLT_INTERRUPT')
L('2 Table2','Newcycle ANC≥1.5 andplatelets≥75 regardlessofpriorinterruption','ANC_NEXT_CYCLE PLT_NEXT_CYCLE ANC_CONTEXT_REVIEW PLT_CONTEXT_REVIEW ASSESSMENT_CONTEXT_CONFLICT',detail='Restartandnewcycle separatedfromduringdosing; discordant timingreview cannotcancelmore restrictivecountfinding.')
L('3 Table3','Febrileneutropenia: interrupttograde1/baseline,then5mg/m²lower fromprevious dose','FEBRILE_NEUTROPENIA RESTART_RECOVERY_UNCONFIRMED')
L('3 Table3','Prior ANC<0.5 orplatelets<25 resultingin>7daycycle delay:5mg/m²reduction','SEVERE_NADIR_REVIEW SEVERE_NADIR_DELAY_REDUCE',detail='Nadirhistorynotinferredfromcurrentcounts; delaycauseconfirmed byclinicalinput.')
L('4 Table5; EMA4.2 p6','CrCl≥30 noautomaticadjustment;15–<30 reducedstart20; <15/dialysisnotrecommended','RENAL_15_29 RENAL_LT15 RENAL_CONTEXT_CONFLICT',detail='EMA lower15boundary prevents extrapolating NCCP<30row; exactclearancevslegacyband discrepancies explicitlyreviewed.')
L('4 Table6; EMA4.2 p5','Severerenal onereduction20→15mg/m²BID; unabletotolerate15stop','SEVERE_RENAL_REDUCTION_LIMIT SEVERE_RENAL_MINIMUM_STOP MINIMUM_DOSE_REVIEW')
L('4 Table5; EMA4.2 p6','Moderate/severehepatic not recommended, baseline bilirubin>1.5ULN labeldefinition','HEPATIC_MOD_SEV',detail='Mildhepatic noadjustment; currentabnormalresult requiresbaselineclassificationandcause review, not anautomatic dose.')
L('4 Table7','Grade3/4nonhaematologicaltoxicity:interrupttograde1/baseline,then5mg/m²lower; grade3controlledNV/responsivediarrhoeaexception','NONHAEM_GRADE_REVIEW NONHAEM_QUALIFYING_REDUCE SEVERE_TOX_REDUCE RESTART_RECOVERY_UNCONFIRMED',detail='Unknown GIcontrol neverassumed; grade4retainsurgenthold. Previousstandardorrenalminimum respected.')
L('5','Oralmoderate-to-highemessupport; nausea/vomiting/diarrhoea hydration/electrolytes; drivingfatigue/dizziness',status='content_and_manual_review',detail='Patientandpharmacyindividual supportplan. Nofixedparenteralantiemeticscheduleautomaticallyapplied.')
L('5','Rarehereditary galactose/lactase/glucose-galactose disorders:donottake','EXCLUSION_SUGAR_DISORDER',detail='Not equatedwithordinary nonspecificlactose symptoms.')
L('5','Highlyeffectivecontraceptionduringand6monthsafter; additionalbarrierwithhormonalmethod',status='content_and_manual_review',detail='CurrentNCCP andEMA reproductivecounselling, not anautomated pregnancytestorstopdate calculator.')
L('6; EMA4.4 pp7–8','Morefrequent haematologicalmonitoring withmoderate/severerenalimpairment','RENAL_ENHANCED_MONITORING',detail='Noinventedfixedfrequency beyondsource.')
L('6; EMA4.4 pp7–8','Infectionandunresolvedseverepriornonhaematologicaltoxicity beforeinitiation','ACTIVE_INFECTION UNRESOLVED_PRIOR_TOXICITY',status='explicit_SmPC_supplement',detail='Infectiondoesnot itselfprovetheneutropeniadose-reductioncriterion.')
L('6; EMA4.5 p8','Thymidinekinasesubstrate/transportermedicineinteractions','INTERACTION_REVIEW',status='explicit_SmPC_supplement',detail='Checkfullmedicationlistwithpharmacy; noautomaticnumericdosefrominteractionflag.')
# Reader-facing labels retain the exact technical meaning with readable spacing.
labels = """Adult CRC or GIST indication and required prior treatment
ECOG 0–1 and adequate organ reserve
Regimen exclusions, including cardiac history and severe hepatic impairment
Caution for hypersensitivity to another drug in the same class
Consultant initiation, response review and duration
Reference oral schedule, 40 mg steps and 80–160 mg daily limits
Conflicting NCCP food instructions resolved by current EMA administration instructions
Baseline investigations and conditional cardiac/pancreatic tests
Regular investigations, early liver/BP frequency and warfarin monitoring
Renal impairment and haemodialysis recommendations
Child-Pugh A/B recommendations and unresolved NCCP–EMA difference for B
Grade 1 HFSR: support without automatic reduction
First grade 2 HFSR: reduction history and response to the initial reduction
Persistent, second or third grade 2 HFSR: interruption, recovery and reduction
Fourth grade 2 HFSR: permanent discontinuation
First or second grade 3 HFSR: at least seven days of interruption and recovery
Third grade 3 HFSR: permanent discontinuation
HFSR re-escalation requires a discretionary clinical decision
ALT/AST ≤5 × ULN: domain-specific advice and monitoring
First ALT/AST >5 to ≤20 × ULN: hold, recovery and conditional restart
Recurrent ALT/AST >5 × ULN or any >20 × ULN: permanent stop
Combined transaminase/bilirubin elevation and the confirmed Gilbert exception
Grade 1 hypertension: monitoring
Asymptomatic grade 2 hypertension and the unresolved printed BP criterion
Symptomatic grade 2 or grade 3 hypertension: hold, recovery and dose review
Numerical severe-BP boundary and its overlap with recovery wording
Grade 4 hypertension or hypertensive crisis: discontinuation
Hypertension interruption duration, dose floor and re-escalation conditions
Other grade 3–4 toxicities: interruption and source-specific recovery
Other-toxicity four-week non-recovery and recurrence after re-escalation
Table 5 exclusions and separate toxicity pathways
Regorafenib emetogenic risk, usual premedication and HFSR support
Explicit current SmPC safety pathways
Explicit current SmPC interaction review
Additional clinical precautions and reproductive counselling
Adult colorectal monotherapy indication and previous treatment
Lonsurf performance status, organ function and exclusions
Starting oral schedule, per-dose cap and reference dosing
BSA tablet tables and unequal morning/evening doses at 50 mg daily
Administration after meals and missed/held-dose instructions
Consultant initiation and dose-modification authority
Baseline and before-cycle investigations
Standard dose reductions, dose floor and prohibition of re-escalation
During-cycle ANC and platelet interruption thresholds
New-cycle count minima and conflicting assessment timing
Febrile neutropenia, recovery and reduction from the previous dose
Previous severe nadir causing more than seven days of cycle delay
Source-specific renal boundaries, including the EMA lower limit
Severe-renal minimum dose and intolerance of that minimum
Baseline moderate/severe hepatic impairment
Non-haematological toxicity and controlled grade 3 GI exceptions
Lonsurf nausea risk, hydration, symptom support and driving advice
Specified rare hereditary sugar disorders
Contraception and hormonal-method counselling
Enhanced blood-count monitoring with renal impairment
Infection and unresolved severe toxicity before initiation
Thymidine-kinase substrate and transporter interaction review""".splitlines()
assert len(labels) == len(rows)
for item, label in zip(rows, labels): item['criterion'] = label
for r in rows:
 ids={q['rule_id'] for q in P[r['code']]['rule_engine']['rules']};assert set(r['rule_ids'])<=ids,(r,set(r['rule_ids'])-ids)
write('criteria-matrix.json',{'release':'0.84.34','date':'2026-11-05','scope':'All operative NCCP sections in 00244v5/00382v4, with explicit selected current SmPC safety supplements. Descriptive adverse-event frequencies are not exhaustive automated decision logic.','criteria':rows,'limitations':['Manual clinical criteria and source-table tablet verification are explicit; encoded coverage does not mean clinical authorisation.','The scenarios exercise each current rule, threshold edges and important interactions, not every possible combination of patient states.','Independent oncology, pharmacy and patient review remains pending.']})
results=json.loads((H/'source-case-results.json').read_text());hit={c:set() for c in P}
for r in results['cases']:
 for f in r.get('actual',{}).get('findings',[]):hit[r['code']].add(f['id'])
write('audit-summary.json',{'release':'0.84.34','baseline_commit':'2e5de4a6dd9e2fcbefa18623ff21db7b9eaec40b','packaging_base_commit':'c19bef57ca5ae49816ad851f2b551b76af32fa5d','baseline_note':'Source audit before-snapshots compare against 2e5de4a6. The release owner subsequently fast-forwarded to c19bef57, which adds readiness documentation and does not change either audited oral protocol. The original comparison provenance is retained.','source_tests':{k:results[k] for k in ['total','passed','failed']},'blank_input_cases':sum(': blank ' in r['name'] for r in results['cases']),'criterion_rows':len(rows),'protocols':[{'code':c,'before_rules':len(json.loads((H/(c+'-before.json')).read_text())['rule_engine']['rules']),'after_rules':len(P[c]['rule_engine']['rules']),'positively_exercised_rules':len(hit[c]),'sha256':hashlib.sha256(next((R/'protocols/gastrointestinal').glob(c+'-*')).read_bytes()).hexdigest()} for c in P],'legacy_v08424_cases':514,'legacy_v08424_passed':514,'clinical_use_authorised':False,'required_external_reviews':['Independent oncology review','Oncology pharmacy review']})
lines=['# Oral clinical decision audit — v0.84.34','','Audit comparison began at 2e5de4a6dd9e2fcbefa18623ff21db7b9eaec40b. Packaging later fast-forwarded to c19bef57ca5ae49816ad851f2b551b76af32fa5d; neither audited oral protocol changed between those commits. Before-snapshots retain the original comparison.\n\nAudited NCCP 00244 v5 and 00382 v4 against freshly retrieved HSE PDFs and current EMA supplements. The retained PDFs and their SHA256 hashes are recorded in sources.json; rendered dose tables were inspected. This is a source reconciliation and software audit, not independent clinical approval.','','## Material changes','','- Regorafenib: exclusions and scope, current-dose floor and tablet steps, HFSR occurrence/recovery and minimum interruption, recurrence-independent hepatic hold, Gilbert exception, grade4 hypertension stop, cause-specific interruption duration, other-toxicity exceptions, SmPC safety flags and interaction review. Explicit dosing days repair the previously incomplete schedule model.','- Lonsurf: rare hereditary sugar-disorder exclusion, no re-escalation, previous-dose/reduction ceilings, standard versus severe-renal floors, recovery confirmation, conflicting renal/timing inputs, pharmacy verification and unequal AM/PM tablet safeguard. Existing source-specific count and toxicity rules are retained.','','## Source differences kept visible','','- Regorafenib NCCPp1 contains conflicting food directions. Current EMA4.2 confirms administration after a light meal with less than30%fat.','- Regorafenib NCCPTable4 prints >200mmHg in one diastolic-rise criterion. This is recorded as unresolved; no guessed replacement is encoded. DBP100 also overlaps current-grade and recovery descriptions, so the isolated number cannot authorise restart.','- ChildPughB: NCCP expects no adjustment; EMA gives no dose recommendation because data are limited. Consultantreview explicitly identifies both statements.','- HFSR and generic other-toxicity grades do not inherit invented CTCAEv5 metadata. The hypertension table explicitly cites4.03.','','## Validation','','563/563 current source scenario and structural checks passed, including210 explicit blank/null checks. All111 encoded rules have a positive scenario; count thresholds,ULN boundaries, grade/recurrence/recovery, dose floors, timing, missing/discordant inputs and component-attributed no-arithmetic dose decisions are exercised. This is not exhaustive state-space coverage.','','514/514 retained v0.84.24 integrated scenarios also passed. GI batch, LFT adapter audit and constrained/global scenario interpreter regressions passed. Historical source-reconciliation, platform-standardisation, GI-library and sarcoma-library gates now recognise the exact audited v34 records while retaining unrelated assertions. Broad release/browser/PDF/patient integration remains the release owner\'s responsibility.','','Run: `node validation/colorectal-v08434/oral-source-audit/source-cases.cjs`','','## Manual boundaries','','Exact BSA tablet tables remain pharmacy-verified rather than an unvalidated tablet calculator. Clinical indication/age, treatment benefit, dose authorisation, full interaction review, test attendance and contextual safety decisions remain explicit clinician responsibilities. No source ambiguity is presented as a validated numerical dose.','','## Criteria ledger','','|Code|Source page/table|Criterion|Implementation / status|','|---|---|---|---|']
for r in rows:lines.append('|'+r['code']+'|'+r['source_page']+'|'+r['criterion']+'|'+r['status']+': '+', '.join(r['rule_ids'])+' '+r['detail']+'|')
(H/'AUDIT.md').write_text('\n'.join(lines)+'\n')
print(len(rows),'criteria rows;',len(sources),'sources')
