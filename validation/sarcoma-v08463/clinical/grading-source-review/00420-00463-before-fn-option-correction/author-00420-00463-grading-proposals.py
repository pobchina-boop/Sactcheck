#!/usr/bin/env python3
"""Prepare exact field replacements externally. Never changes accepted protocols."""
import copy,hashlib,json,pathlib
OUT=pathlib.Path(__file__).resolve().parent
HOME=OUT.parent
ACCEPTED=HOME/'sarcoma-v63-context-calendar-correction-20261118/final-candidates'
NCI='https://dctd.cancer.gov/research/ctep-trials/for-sites/adverse-events/ctcae-v5-5x7.pdf'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
ordinary={
 '00420':{
  'current_mucositis_grade':('Current mucositis grade','mucositis','Assess current mucosal symptoms, pain, ulceration and intake. Confirm the anatomical site: the displayed orientation describes oral mucositis; other sites require their exact event criteria. Record prior worst severity separately.'),
  'prior_mucositis_grade':('Worst previous mucositis grade','mucositis','Record the worst documented previous episode, its site, grading system and recovery. Current improvement must not erase that history. The displayed orientation describes oral mucositis; confirm the exact event for other sites.'),
  'current_neuropathy_grade':('Current peripheral neuropathy grade','neuropathy','Document current sensory and motor findings, gait, dexterity and effects on daily activities. Name the exact peripheral event; paraesthesia alone and central neurological toxicity are not interchangeable with peripheral neuropathy. Preserve any previous cisplatin omission separately.')},
 '00463':{
  'doxo_current_mucositis_grade':('Current doxorubicin-related mucositis grade','mucositis','Assess current mucosal site, pain, ulceration and intake, and document attribution. The displayed orientation describes oral mucositis; other sites require their exact event criteria. Keep current status separate from worst prior severity and episode count.'),
  'doxo_previous_mucositis_grade':('Worst previous doxorubicin-related mucositis grade','mucositis','Record worst prior severity and attribution even after recovery. Document repeated episodes and resolution separately. The displayed orientation describes oral mucositis; confirm the event and grading system for other sites.'),
  'cis_current_neuropathy_grade':('Current cisplatin-related peripheral neuropathy grade','neuropathy','Document current sensory and motor findings and their functional effects using the exact peripheral event. Current improvement does not remove an established previous cisplatin stop; retain the prior-event field.'),
  'cis_previous_neuropathy_grade':('Worst previous cisplatin-related peripheral neuropathy grade','neuropathy','Record the worst documented previous peripheral event, exact grading system and functional effects. Do not replace this history with the current recovered grade. Distinguish sensory or motor neuropathy from isolated paraesthesia and central events.'),
  'post_mtx_mucositis_grade':('Current mucositis after methotrexate: grade','mucositis','Assess the current post-methotrexate event and mucosal site. The displayed orientation describes oral mucositis; other sites require their exact event criteria. Record duration and the separately confirmed source Day 29 context; calendar week 29 alone does not establish that context.'),
  'post_mtx_diarrhoea_grade':('Current diarrhoea after methotrexate: grade','diarrhoea','Assess stools above the patient\'s baseline, ostomy output, continence, hydration and functional impact. Keep diarrhoea distinct from mucositis. Record event duration and the separately confirmed source Day 29 context; calendar week 29 alone does not establish it.')}
}
protocols=[]
for code in ['00420','00463']:
 src=next(ACCEPTED.glob(code+'-*.json'));p=json.loads(src.read_text());url=p['metadata']['source_url'];changes={};before={}
 for field,(label,category,text) in ordinary[code].items():
  d=copy.deepcopy(p['input_definitions'][field]);before[field]=copy.deepcopy(d)
  citation='NCCP '+code+' v4, page '+('3 Table 3' if code=='00420' else '8 Table 6')
  d.update(label=label,ctcae_category=category,ctcae_version='5.0',ctcae_source_url=NCI,assessment_guidance=text+' '+citation+' does not identify a CTCAE edition. This panel is CTCAE v5.0 educational orientation, not proof that the source bands use v5.0; confirm the documented grading basis before applying the regimen rule.')
  changes[field]=d
 if code=='00463':
  for field in ['cis_hearing_grade','prior_fn_grade']:
   d=copy.deepcopy(p['input_definitions'][field]);before[field]=copy.deepcopy(d)
   for key in ['ctcae_version','ctcae_category','ctcae_source_url']:d.pop(key,None)
   if field=='cis_hearing_grade':
    d.update(label='Current hearing impairment grade from audiology',grading_source_label='NCCP 00463 v4 Table 6 hearing criterion',grading_source_url=url+'#page=8',source_grading_note='The NCCP table does not define its hearing grades or name a grading edition. Do not treat generic CTCAE severity anchors or the 2 kHz boundary as a hearing-grade definition. Audiology must identify the applicable grading system and patient context.',assessment_guidance='Use the current audiology report to record a documented grade and the lowest affected frequency separately. Table 6 links a grade of at least 2 with hearing loss reaching 2 kHz or lower. This is a combined treatment-action criterion, not a grading scale. Preserve any previous cisplatin discontinuation even if the current assessment improves.')
    descriptions=['No current hearing impairment recorded; a previous cisplatin discontinuation remains separate.']+['Documented audiology grade '+str(g)+'; confirm the named grading system and record the lowest affected frequency separately.' for g in [1,2,3,4]]
   else:
    d.update(label='Grade documented for the previous febrile-neutropenia episode',grading_source_label='NCCP 00463 v4 Table 4 prior febrile-neutropenia bands',grading_source_url=url+'#page=7',source_grading_note='The NCCP table names grade 3 and grade 4 action bands but does not define their criteria or identify a CTCAE edition. Do not equate the episode grade with an ANC-only neutropenia grade or apply v5/v6 haematology bands automatically. Values 1 and2 are not defined by this source table.',assessment_guidance='Review the previous episode record, including contemporaneous neutrophils, temperature, clinical severity and the grading system used. Table 4 distinguishes grade 4 from consideration for grade 3, and later recurrence despite G-CSF. Current febrile neutropenia or suspected sepsis belongs in the separate urgent current-event field; current normal counts do not erase prior history.')
    descriptions=['No previous febrile-neutropenia episode recorded; this is not a severity grade for an active episode.','No grade 1 febrile-neutropenia criterion is supplied in Table 4; verify the historical classification rather than using a generic mild-toxicity description.','No grade 2 febrile-neutropenia criterion is supplied in Table 4; verify the historical classification rather than using a generic moderate-toxicity description.','Previous episode documented as grade 3; confirm its recorded criteria and source grading system.','Previous episode documented as grade 4; confirm its recorded criteria and source grading system.']
   for option,description in zip(d['options'],descriptions):option['description']=description
   changes[field]=d
 payload={'date':'2026-11-18','scope':'Exact input_definitions replacements only; not applied','code':code,'accepted_path':str(src),'accepted_sha256':sha(src),'rule_engine_sha256':hashlib.sha256(json.dumps(p['rule_engine'],sort_keys=True).encode()).hexdigest(),'source':{'url':url,'version':'4','page_tables':['page 3 Table 3']if code=='00420'else['page 7 Table 4','page 8 Table 6'],'retained_full_text_path':str(HOME/'sarcoma-batch4-sources-20261118'/f'{code}-web.txt'),'retained_full_text_sha256':sha(HOME/'sarcoma-batch4-sources-20261118'/f'{code}-web.txt'),'grading_edition_named':False,'live_primary_text_reopened':'2026-11-18','pdf_binary_verified':False,'table_pixels_inspected':False},'original_fields':before,'replace_input_definitions':changes,'preserve_all_other_json':True,'clinical_approval':False,'pharmacy_approval':False}
 (OUT/f'{code}-input-definition-replacements.json').write_text(json.dumps(payload,indent=2)+'\n');protocols.append({'code':code,'fields':list(changes),'accepted_sha256':sha(src)})
print(json.dumps(protocols,indent=2))
