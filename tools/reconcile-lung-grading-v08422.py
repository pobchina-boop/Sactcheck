"""Keep source grading explicit; never relabel a generic CTCAE5 aid as a CTCAE4 table."""
from pathlib import Path
import json
R=Path(__file__).resolve().parents[1]
codes=json.loads((R/'data/lung-core-v08422-source-index.json').read_text())['codes']
immune={'pneumonitis_grade','diarrhoea_colitis_grade','rash_grade','infusion_reaction_grade','adrenal_insufficiency_grade','hypophysitis_grade'}
for c in codes:
 f=next((R/'protocols').glob('*/'+c+'-*.json'));p=json.loads(f.read_text());m=p['metadata']
 for key,d in p['input_definitions'].items():
  # New source context stays blank in demo unless an explicit example was authored.
  if 'demo_value' not in d:d['demo_value']=''
  if not (d.get('type')=='select' and key.endswith('_grade')):continue
  version='4.03' if c in ['00576','00655'] else '4.0' if c in ['00455','00558','00713','00714'] or c in ['00569','00579'] and key in immune else None
  if version:d['ctcae_version']=version
  else:d.pop('ctcae_version',None)
  d.pop('ctcae_source_url',None)
  label=f'NCCP CTCAE v{version} named-event assessment' if version else 'NCCP named-event assessment; grading edition not specified'
  note=(f'This NCCP dose table names CTCAE v{version}, but is not a complete grading table. Confirm the exact event-specific definition in that edition; no CTCAE5/6 conversion is applied.' if version else 'This NCCP dose table is not a complete grading table and does not specify a grading edition. Confirm the named event and grading definition under verified local policy.')
  d.update(grading_source_label=label,grading_source_url=m['source_url'],source_grading_note=note,assessment_guidance='Record the clinician-assessed grade of the named event using the source-specific definition. Assess alternative causes and recovery separately; a generic grade does not diagnose immune toxicity.')
  for option in d.get('options',[]):
   if isinstance(option,dict):option['description']=f'Documented grade {option["value"]} of this named event. Confirm its event-specific grading definition; the dose-action table alone does not define the grade.'
 for key,d in p['input_definitions'].items():
  if c in ['00318','00579','00713'] and d.get('type')=='number' and ('gfr' in key or 'crcl' in key):
   d['renal_input']=dict(mode='exact_continuous',exact_value_required=True,source_url=m['source_url'],reason='Carboplatin Calvert dosing requires a continuous verified GFR, not a categorical renal band. Confirm the source-approved measurement and capping policy.')
  elif d.get('type')=='number' and ('gfr' in key or 'crcl' in key) and not d.get('renal_input'):
   d['renal_input']=dict(mode='source_threshold_numeric',exact_value_required=False,source_url=m['source_url'],reason='The source uses numeric renal thresholds for individual medicines; preserve the exact boundary and named-drug action without substituting a generic renal band.')
 f.write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
print('Reconciled named-event grading for ten lung assessments; no silent edition conversion.')
