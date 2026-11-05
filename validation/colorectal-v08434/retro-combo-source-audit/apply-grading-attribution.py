from pathlib import Path
import json,copy,hashlib
R=Path('/workspace/scratch/bca730129437/recovery-2026-11-05/restore-test');A=R/'validation/colorectal-v08434/retro-combo-source-audit'
urls={'00328':'https://healthservice.hse.ie/documents/6773/328_Cetuximab_7_days_plus_FOLFIRI_14_Days.pdf','00330':'https://healthservice.hse.ie/documents/6785/330_v6_Cetuximab_7days_irinotecan_14_day.pdf','00331':'https://healthservice.hse.ie/documents/6786/331_v7_Cetuximab_14days_irinotecan_14_day.pdf'}
report={}
for code,url in urls.items():
 p=next((R/'protocols').rglob(code+'*.json'));d=json.loads(p.read_text());before=copy.deepcopy(d['rule_engine']);changed=[]
 for key,x in d['input_definitions'].items():
  if 'ctcae_version' not in x:continue
  x['interface_grading_reference']={'edition':x.pop('ctcae_version'),'category':x.pop('ctcae_category'),'url':x.pop('ctcae_source_url'),'role':'Interface orientation only; not the edition attributed to the regimen action table.'}
  for o in x.get('options',[]):o.pop('ctcae_grade',None)
  note='The NCCP named adverse-event action table does not specify a grading edition and is not a complete grading table. Confirm the documented grade of the exact event under verified local policy; interface descriptions do not establish the source grade. No conversion between grading editions is assumed.'
  if 'rash' in key:note+=' EMA Erbitux section 4.4 names CTCAE without specifying its edition.'
  elif key!='infusion_reaction_grade':note+=' CAMPTO section 4.2 names NCI-CTC without specifying its edition.'
  x.update(grading_source_label=f'NCCP {code} named adverse-event action table',grading_source_url=url,source_grading_note=note,assessment_guidance=note);changed.append(key)
 assert before==d['rule_engine'];p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n');report[code]={'inputs':changed,'rules_unchanged':True,'source_url':url,'source_edition':'Unspecified'}
(A/'grading-attribution-review.json').write_text(json.dumps(report,indent=2)+'\n')
p=R/'data/regimen-knowledge-base-v08434-addendum.json';d=json.loads(p.read_text())
for x in d['regimen_profiles']:
 if x['protocol_id'].split('-')[1] in urls:x['treatment_rationale']['limitations'].append('NCCP adverse-event tables do not specify a grading edition. CAMPTO names NCI-CTC and Erbitux skin guidance names CTCAE without an edition. Interface v5 descriptions are orientation only; confirm source-compatible clinical grading and do not assume an edition conversion.')
p.write_text(json.dumps(d,indent=2,ensure_ascii=False)+'\n')
print(report)
