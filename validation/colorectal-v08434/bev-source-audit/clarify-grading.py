from pathlib import Path
import json
R=Path(__file__).resolve().parents[3]
for code in ['00212','00214','00215','00207','00225']:
 p=next((R/'protocols').glob('*/'+code+'-*.json'));d=json.loads(p.read_text())
 for key,v in d['input_definitions'].items():
  if not key.endswith('_grade'):continue
  if code=='00225' and key=='acneiform_rash_grade':
   v['grading_source_label']='EMA Vectibix section 4.4 / CTCAE v5.0'
   v['source_grading_note']='Current EMA Vectibix section 4.4 explicitly identifies CTCAE v5.0 for grade 3 or higher dermatological reactions. Confirm the whole dermatological event, not acne alone.'
   v['grading_source_url']='https://www.ema.europa.eu/en/documents/product-information/vectibix-epar-product-information_en.pdf'
   continue
  if 'ctcae_version' in v:
   v['interface_grading_reference']={'edition':v.pop('ctcae_version'),'category':v.pop('ctcae_category',None),'url':v.pop('ctcae_source_url',None),'role':'Interface orientation only; not the edition attributed to the regimen action table.'}
  for o in v.get('options',[]):o.pop('ctcae_grade',None)
  note='The NCCP action table does not identify a grading edition. Confirm the documented clinical grade of the exact named event under verified local policy; interface descriptions do not establish the source grade.'
  if code in ['00212','00214','00215'] and key in ['thromboembolic_event_grade','haemorrhage_grade']:
   note+=' The EMA Avastin supplement explicitly refers to NCI-CTCAE v3 for venous thromboembolism and haemorrhage. Confirm the source and edition instead of silently converting grades.'
  if code=='00207' and key=='acneiform_rash_grade':note+=' EMA Erbitux section 4.4 names CTCAE without identifying an edition.'
  v['grading_source_label']='NCCP '+code+' named adverse-event table'
  v['grading_source_url']=d['metadata']['source_url'];v['source_grading_note']=note
  v['assessment_guidance']=note
 p.write_text(json.dumps(d,indent=2,ensure_ascii=False)+'\n')
