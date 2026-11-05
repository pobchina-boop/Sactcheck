from pathlib import Path
import json,hashlib
R=Path(__file__).resolve().parents[3];B=Path(__file__).resolve().parent
url='https://medicines.ie/medicines/campto-20-mg-ml-concentrate-for-solution-for-infusion~A0000945/document/spc/025730/file?download=1'
records=json.loads((B/'sources.json').read_text());records=[x for x in records if x.get('code') in ['00328','00330','00331']]
records.append(dict(code='CAMPTO-supplement',url=url,listing_url='https://medicines.ie/medicines/campto-20-mg-ml-concentrate-for-solution-for-infusion~A0000945/spc',retrieved='2026-11-05',version='10/2024; CF24_0 (PDF p26); listing last updated25/09/2026 is not document revision',pages=26,sha256=hashlib.sha256((B/'campto-current.pdf').read_bytes()).hexdigest(),retrieval='Current manufacturer listing download link, curlHTTPS200'))
(B/'sources.json').write_text(json.dumps(records,indent=2)+'\n')
matrix=[]
for c in ['00328','00330','00331']:
 file=next((R/'protocols/gastrointestinal').glob(c+'*.json'));p=json.loads(file.read_text());rules=p['rule_engine']['rules']
 for rule in rules:
  def fix(s):
   if s.get('url') in ['https://backend-prod.medicines.ie/uploads/files/670e966b379ee.pdf','https://assets.hpra.ie/products/Human/22106/Licence_PA0822-212-001_09012025155108.pdf']:
    s.update(document='CAMPTO current medicines.ie SmPC, revision10/2024 CF24_0, retrieved05Nov2026',url=url,page=4 if rule['rule_id'] in ['BOWEL_EXCLUSION','MARROW_EXCLUSION'] else 3 if rule['rule_id'] in ['FEBRILE_NEUTROPENIA_REVIEW','OTHER_SEVERE_TOXICITY_REDUCTION_REVIEW'] else 2,checked_date='2026-11-05')
  fix(rule['source'])
  for s in rule.get('related_sources',[]):fix(s)
 # explicit supplement interactions; full interaction database still a manual requirement.
 for key,label in [('st_johns_wort','Concurrent St John’s Wort'),('live_attenuated_vaccine','Concurrent live attenuated vaccine')]:
  p['input_definitions'][key]={'label':label,'type':'boolean','required':False,'input_role':'decision','demo_value':False}
  id='IRINOTECAN_'+key.upper()
  if not any(r['rule_id']==id for r in rules):rules.append({'rule_id':id,'when':{'field':key,'operator':'==','value':True},'action':{'type':'contraindicated','components':['irinotecan'],'recommendation':'This combination is contraindicated in CAMPTO SmPC section4.3. Obtain oncology/pharmacy review before treatment.'},'explanation':'CAMPTO SmPC explicitly contraindicates this concurrent exposure. This is not a complete interaction checker.','source':{'document':'CAMPTO current medicines.ie SmPC revision10/2024','page':4,'section':'4.3','url':url,'checked_date':'2026-11-05'}})
 file.write_text(json.dumps(p,indent=2,ensure_ascii=False)+'\n')
 groups=[
 ('Indication, validatedRAS, ECOG and marrow/organ suitability','p1–2',['RAS_EXCLUSION','ECOG_ELIGIBILITY','ELIGIBILITY_','INDICATION_PRIOR_'], 'Encoded triggers plus consultant confirmation of actual metastatic setting/line. No surrogate laboratory cutoffs for qualitative adequacy.'),
 ('Exclusions and cautions','p1–2, 00328p8; CAMPTO4.3',['HYPERSENSITIVITY','PREGNANCY_LACTATION','BOWEL_EXCLUSION','MARROW_EXCLUSION','BILI_CI','SEVERE_RENAL_EXCLUSION','BASELINE_','UGT_REVIEW','GILBERT_','IRINOTECAN_'],'Pregnancy risk is not inferred from age/sex; actual medicine interaction reconciliation remains mandatory.'),
 ('Current count holds, nadir recovery and discontinuation','00328p4 table2;00330p3/00331p2 table1',['ANC_','PLATELETS_','COUNT','PLT_','FEBRILE_','LATE_COUNT_'],'Both current counts required before restart; severe nadir dominates overlapping moderate row; no dose escalation from previous lower dose.'),
 ('Organ dose decisions and units','00328p4 table3;00330/331p3 table2',['RENAL_','BILI_','FU_HEPATIC_'],'00328 absoluteAST U/L and bilirubinµmol/L distinct from irinotecanbilirubin×ULN. 00330/331renal50–66% range is manual, not averaged. SmPC says renal evidence absent, NCCP specialist range retained with review.'),
 ('Infusion reactions, lung, eyes and electrolytes','00328p5,7;00330/331p4 table4;ErbituxSmPC',['INFUSION_','FIRST_','ILD','RESPIRATORY','EYE','ELECTROLYTES','ANAPHYLAXIS_'],'Immediate event management remains clinician-led; no invented numeric magnesium hold cutoff.'),
 ('Skin recurrence, interruption, recovery, prior dose','00328p5table4;00330/331p4table4',['SKIN_'],'Maximum2week interruption; grade3persistentat2weeks fails recovery; fourthsevereeventstops. Exactrecurrencehistoryandactualpreviousmaintenance dose required.'),
 ('Diarrhoea and stomatitis component actions','00328p3,5table5;00330/331p3table3;CAMPTO4.2',['DIARRHOEA_','MUCOSITIS_','OTHER_'],'00328grade2holdsallFOLFIRI,grade1stillholdsirinotecan;00330/331grade3holdsBOTH. 00330weeklycetuximab400/300tableconflict unresolved:manual. Fullirinotecanrecovery required despiteNCCP≤2table.'),
 ('DPD/fluoropyrimidine specific pathways','00328p2–3,8',['DPD_','FU_CARDIAC'],'00328 only: complete/partial/unknown, renaluracilinterpretation, suspectedcardiac toxicity. Normaltestdoesnotguaranteesafety.')]
 for title,pages,prefixes,note in groups:
  matched=[r['rule_id'] for r in rules if any(r['rule_id'].startswith(z) for z in prefixes)]
  if not matched:continue
  matrix.append(dict(code=c,criterion=title,source_pages=pages,status='encoded_with_declared_manual_decisions',rule_ids=matched,qualification=note))
 for title,pages,where,note in [
 ('Administration dose,sequence,infusionrate,observations','p1','treatment_phases','Weekly400loading/250maintenance versusfortnightly500; irinotecan180q14;00328FU400bolus+2400/46hr andfolinic400. Sourceallows200folinicclinicianchoice. Anaphylaxisfacilities,5mg/mininitial10subsequent andfirst2observations clinicalworkflow; noautomatedinfusionpumpcontrol.'),
 ('Baseline/regular/posttreatmenttests','00328p2–3;00330p2;00331p2','monitoring','FBCrenalLFT;00328beforeeachcycle,weeklyFBCdelay;monthlyelectrolytesMgCa2monthsaftercetux;ECGifcompromised00328andwarfarinINRasindicated. No inventedimaginginterval.'),
 ('Premedication and antiemetics','00328p6;00330p4–5;00331p4–5','supportive_care and parent patient/support integration','Antihistamine+corticosteroid allcetuxinfusions,onehourbefore;atropine250mcgSCirinotecanunlesscontraindicationglaucoma/asthmacaution. Combinationmoderateemeticvsantibodyonlylow. Prescribedmedicinescheckedbyteam.'),
 ('Delayeddiarrhoearescue and emergencytriage','00328p6–8;00330p5;00331p5–6','supportive_care and parent patient/support integration','Writtenloperamide4mgthen2mgevery2h,12hafterlastliquidstool,max48h;hydration,urgentfever/infection/dehydration,hospitalisationclinicalassessment. Notautonomousselftreatmentauthorization.'),
 ('Druginteraction reconciliation','NCCPdruginteractions;CAMPTO4.3/4.5','manual pharmacist review plus explicit contraindicationflags','ConsultcurrentSmPC/database,reviewCYP3A4/UGT1A1inhibitors/inducers,vaccines,StJohnsWort,warfarin;engine notcomprehensiveinteractionchecker.'),
 ('Folinic dependency and reduction levels','00328p3table1','dose_levels and dose renderer','00328only:folinicdelayed/omittedwithbolusFU;relativecurrentcomponentlevels;thirdreductiondiscontinue. Clinicalprescriptionreviewrequired.'),
 ('Diseaseassessment,intent,consent,patientpreference','NCCPindications/diseasemonitoring','manual consultant decision and parent full-suite integration','Benefit/progression/fitness/consentcannotbeinferredfrompassingrules. Noautomatedtreatmentauthorisation.')]:
  if title.startswith('Folinic') and c!='00328':continue
  matrix.append(dict(code=c,criterion=title,source_pages=pages,status='manual_workflow_or_other_suite_surface',location=where,qualification=note))
 matrix += [dict(code=c,criterion=r['rule_id'],status='rule_trace',source=r['source'],condition=r['when'],action=r['action']) for r in rules]
(B/'source-to-rule-matrix.json').write_text(json.dumps(matrix,indent=2,ensure_ascii=False)+'\n')
print('Matrix',len(matrix),'rows; provenance and supplement rules saved')
