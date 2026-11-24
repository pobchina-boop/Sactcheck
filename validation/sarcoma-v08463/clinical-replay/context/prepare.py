#!/usr/bin/env python3
"""Append bounded review cues to immutable external accepted clinical candidates."""
import copy, hashlib, json, pathlib, shutil
HERE=pathlib.Path(__file__).resolve().parent
ROOT=HERE.parent
BASE=ROOT/'sarcoma-v63-v64-integration-handoff-20261118/0.84.63/40-final-candidate'
PIN={'00100':'a4f39bcd8e813e6c41bc8896498404ff87b3638016d89673819721233a1394e5','00596':'b95b461d1b6e2d927d6247fa2ed102ed851e3f6922a371886093277cf7a1203c','00680':'5516dce1e33cea1deafb5f6bce95fba13cc012a61d8ccb87747daa77035a785e'}
def sha(b):return hashlib.sha256(b).hexdigest()
def frozen(path,b):
 path.parent.mkdir(parents=True,exist_ok=True)
 if path.exists():assert path.read_bytes()==b, 'Refusing to overwrite '+str(path)
 else:path.write_bytes(b)
def out(path,obj):frozen(path,(json.dumps(obj,ensure_ascii=False,indent=2)+'\n').encode())
def q(field,operator,value=None):
 d={'field':field,'operator':operator}
 if value is not None:d['value']=value
 return d
def rule(code,id,condition,message,page,section,classification):
 url={'00100':'https://healthservice.hse.ie/documents/6722/100_Mifamurtide.pdf','00596':'https://healthservice.hse.ie/documents/6747/596_v2_Ifosfamide_Etoposide_IE_Therapy.pdf','00680':'https://healthservice.hse.ie/documents/6767/680_v2_Ifosfamide_highdose.pdf'}[code]
 components=['mifamurtide']if code=='00100'else['etoposide','ifosfamide']if code=='00596'else['ifosfamide']
 return {'rule_id':id,'when':condition,'action':{'type':'consultant_review','components':components,'message':message,'block_numeric_dose':True,'dose_calculation':'specialist_review','show_in_dose_actions':True},'explanation':message,'source':{'document':'NCCP '+code+' v'+('6'if code=='00100'else'2'),'url':url,'page':page,'section':section,'checked_date':'2026-11-18','evidence_kind':'current_primary_extracted_text','interpretation_note':classification}}
rules={
 '00100':[
 rule('00100','MIF_KNOWN_DISEASE_CONTEXT_REVIEW',q('high_grade_osteosarcoma','==',False),'The recorded high-grade resectable osteosarcoma criterion is not confirmed. Reconcile the diagnosis and source indication before further mifamurtide, including during treatment or restart; prior treatment does not establish an unsupported indication.',1,'Indication; eligibility','Known-negative disease-context safeguard across assessment phases; no new age criterion, numeric dose or permanent-stop rule.'),
 rule('00100','MIF_KNOWN_SURGICAL_RECOVERY_REVIEW',q('recovered_from_surgery','==',False),'Recovery from surgery is recorded as insufficient. Review current surgical recovery and fitness with the specialist before further mifamurtide or restart. This requires individual assessment, not an automatic recovery interval or permanent discontinuation.',1,'Treatment after resection and recovery from surgery','Known-negative recovery-context safeguard; source provides no universal numerical surgical-recovery threshold.'),
 rule('00100','MIF_KNOWN_POSTOPERATIVE_PLAN_REVIEW',q('postoperative_multiagent_plan_confirmed','==',False),'The postoperative multi-agent chemotherapy plan is recorded as unconfirmed. Reconcile the original postoperative treatment plan before further mifamurtide. Mifamurtide can continue after chemotherapy has finished: completed chemotherapy alone is not a reason to stop it or require additional chemotherapy.',1,'Indication/treatment; page 2 Table 1 monitoring footnote','Known-negative treatment-context review; does not require chemotherapy to remain concurrent throughout all 36 weeks and does not alter age-at-diagnosis or baseline eligibility logic.')],
 '00596':[
 rule('00596','IE_ADMINISTRATION_DAY_REVIEW',{'all':[{'any':[q('assessment_phase','==','treatment'),q('restart_requested','==',True)]},{'any':[q('cycle_day','missing'),q('cycle_day','not_in',[1,2,3,4,5])]}]},'Confirm the actual administration day against source Days 1–5. The entered cycle day may include a treatment delay; reconcile the authorised calendar and treatment-day numbering before further ifosfamide or etoposide. Do not infer an extra dose, automatic calendar reset or reduction; continue required support for doses already given.',1,'Treatment and administration table','Calendar reconciliation safeguard, not an automatic additional cytotoxic day or a dose reduction. Retains the existing calendar-day meaning used for Day 29 count recovery.')],
 '00680':[
 rule('00680','KNOWN_INDICATION_CONTEXT_REVIEW',q('indication_criteria_confirmed','==',False),'The selected source indication criteria are recorded as unconfirmed. Reconcile the diagnosis and treatment context with the specialist before further high-dose ifosfamide or restart. The source lists recurrent/primary refractory Ewing sarcoma and relapsed osteosarcoma; do not infer another indication from prior treatment.',1,'Indications; page 2 eligibility','Known-negative indication-context safeguard across assessment phases; no new eligibility cutoff, numeric dose or permanent-stop rule.'),
 rule('00680','OTHER_NONHAEM_EVENT_REVIEW',q('other_nonhaem_toxicity_grade','>=',3),'Grade 3–4 other non-haematological toxicity is recorded. Identify the named adverse event, whether it is current or historical, its recovery and its clinical significance before further treatment. Apply the appropriate event-specific source guidance and consultant review; this generic grade does not define an automatic hold, percentage reduction or permanent stop.',1,'Treatment until unacceptable toxicity; page 3 consultant discussion of modifications','Local conservative review policy pending clinician approval. NCCP does not provide a universal grade 3–4 other-toxicity algorithm; the numerical threshold selects a clarification prompt only, preserving source-specific mucositis, neurotoxicity, organ and product rules.')]
}
rows=[]
for code in PIN:
 p=next(BASE.glob(code+'*'));b=p.read_bytes();assert sha(b)==PIN[code]
 original=json.loads(b);candidate=copy.deepcopy(original);start=len(candidate['rule_engine']['rules']);candidate['rule_engine']['rules'].extend(rules[code])
 reverted=copy.deepcopy(candidate);del reverted['rule_engine']['rules'][start:];assert reverted==original
 frozen(HERE/'before'/p.name,b);out(HERE/'candidate'/p.name,candidate)
 after=(HERE/'candidate'/p.name).read_bytes();transitions=[{'operation':'add','path':'/rule_engine/rules/'+str(start+i),'before_absent':True,'after':r}for i,r in enumerate(rules[code])]
 out(HERE/'transitions'/(code+'.json'),transitions)
 rows.append({'code':code,'protocol_id_before':original['protocol_id'],'protocol_id_after':candidate['protocol_id'],'source':str(p),'before':'before/'+p.name,'before_sha256':sha(b),'candidate':'candidate/'+p.name,'candidate_sha256':sha(after),'transition_path':'transitions/'+code+'.json','old_rule_count':start,'new_rule_count':len(candidate['rule_engine']['rules']),'existing_json_preserved_except_list_append':True})
for code in PIN:
 p=ROOT/'sarcoma-batch4-sources-20261118'/(code+'-web.txt');frozen(HERE/'sources'/p.name,p.read_bytes())
for p in (ROOT/'sarcoma-batch5-retrospective-prep-20261118/snapshot/js').glob('*'):
 if p.is_file():frozen(HERE/'runtime/js'/p.name,p.read_bytes())
out(HERE/'transition-manifest.json',{'date':'2026-11-18','status':'external_candidate_pending_independent_replay','scope':'Three accepted v63 candidates; six appended nonnumeric review rules. No application changes.','original_accepted_candidates_unchanged':True,'clinical_approval':False,'pharmacy_approval':False,'original_pdf_binary_verified':False,'visual_table_verification':False,'source_retrieval_note':'Previously retained complete current NCCP extracted texts; 00596/00680 live URLs re-opened successfully. 00100 re-open returned an accessibility error; retained same-day full NCCP capture and successful current EMA Mepact product-information retrieval support the adjudication. No repeated blocked request.','policy_adjudication':'00680 OTHER_NONHAEM_EVENT_REVIEW is an explicit local conservative review policy, not an NCCP grade-specific dosing algorithm.','protocols':rows})
print(json.dumps(rows,indent=2))
