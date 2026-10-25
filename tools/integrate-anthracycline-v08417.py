from pathlib import Path
import json,re,qrcode
R=Path(__file__).resolve().parents[1];V='0.84.17'
def read(p):return json.loads((R/p).read_text())
def save(p,d):(R/p).write_text(json.dumps(d,indent=2,ensure_ascii=False)+'\n')
idx=read('data/anthracycline-v08417-source-index.json');codes=idx['codes'];reg=R/'js/patient-asset-registry-v0810.js';s=reg.read_text()
for c in codes:
 d=read(f'data/patient-knowledge/{c}.json');entry=json.dumps(dict(title=d['title'],guide=True,passport=True,sactCard=True,knowledge=True,consentDraft=True,supportiveCare=True,phaseSupport=True,longitudinal=True),ensure_ascii=False)
 pat=r"    '"+c+r"':\{[^\n]*\},?"
 if re.search(pat,s):s=re.sub(pat,"    '"+c+"':"+entry+",",s)
 else:s=s.replace("    '00790':","    '"+c+"':"+entry+",\n    '00790':")
 if c in idx['new_codes']:
  f=R/'patient'/c;f.mkdir(exist_ok=True,parents=True);qrcode.make('https://sactcheck.com/patient/'+c+'/').save(f/'qr.png')
s=s.replace("const RELEASE='0.84.16'","const RELEASE='0.84.17'").replace("const CONTENT_RELEASE='0.84.16'","const CONTENT_RELEASE='0.84.17'")
reg.write_text(s)
p=R/'js/regimen-knowledge-base.js';s=p.read_text();s=s.replace('"data/regimen-knowledge-base-v08416-addendum.json"]','"data/regimen-knowledge-base-v08416-addendum.json", "data/regimen-knowledge-base-v08417-addendum.json"]');p.write_text(s)
p=R/'tools/build-complete-pathways.cjs';s=p.read_text();s=s if "codes=['00262'" in s else s.replace("codes=['00217'","codes=['00262','00263','00265','00269','00423','00217'")
# Version/print styling scoped by authored release; preserve existing outputs byte-for-byte.
s=s.replace("'0.84.15','0.84.16'].includes", "'0.84.15','0.84.16','0.84.17'].includes")
s=s.replace("if(authoredRelease==='0.84.16'&&", "if(['0.84.16','0.84.17'].includes(authoredRelease)&&")
# HER2-specific checklist does not apply to every anthracycline suite.
s=s.replace("if(['0.83.9','0.84.12','0.84.14','0.84.15','0.84.16','0.84.17'].includes(d.suite_release))consent", "if(['0.83.9','0.84.12','0.84.14','0.84.15','0.84.16'].includes(d.suite_release))consent")
anchor=' if(!d.longitudinal_mapping)write(`patient/${code}/consent-form.html`'
# Use location immediately before consent output; exact source verified below if not found.
custom=" if(d.suite_release==='0.84.17')consent=consent.replace(/<section class=\"generic-grid\">[\\s\\S]*?<\\/section>/,`<section class=\"generic-grid\">${ticks(['Purpose, expected benefit and alternatives explained','Indication, medicines, sequence and duration confirmed','Required blood tests and cardiac monitoring discussed',...(d.agents.some(a=>a.id==='fluorouracil')?['DPD result and severe fluoropyrimidine risks reviewed']:[]),'Support medicines and phase changes explained','Fertility, contraception and breastfeeding discussed where relevant','Common, serious and lasting drug-specific risks discussed below','Urgent symptoms and local contact details confirmed'])}</section>`).replace('1. Generic SACT risks / discussion points','1. Treatment discussion');\n"
if custom not in s:
 if anchor not in s:raise ValueError('Consent output marker not found')
 s=s.replace(anchor,custom+anchor)
p.write_text(s)
for f in ['tools/build-phase-support-v0838.cjs','tools/build-breast-supportive-care-v0837.cjs']:
 p=R/f;s=p.read_text().replace("'0.84.15','0.84.16'].includes", "'0.84.15','0.84.16','0.84.17'].includes");p.write_text(s)
risk=read('data/emetogenic-risk-map.json')
for c in codes:
 p=next((R/'protocols/breast').glob(c+'-*'));d=json.loads(p.read_text());sup=d.setdefault('supportive_care',{});sup['phase_specific_plan']=f'patient/{c}/supportive-care.html';sup.pop('display_status',None)
 if c in idx['new_codes']:
  level='moderate' if c=='00423' else 'high';sup.update(emetogenic_risk=level,mapping_basis='Doxorubicin50/docetaxel combination: moderate; reconcile docetaxel steroid course.' if c=='00423' else 'Anthracycline/cyclophosphamide combination: high; NCCP dedicated AC antiemetic row.',phase_profiles={'combination':dict(level=level,script_id='nccp-parenteral-'+level)})
  risk['protocols'][c]=dict(level=level,script_id='nccp-parenteral-'+level,mapping_basis=sup['mapping_basis'])
 if c in ['00265','00269']:
  d['input_definitions']['ast_uln_multiple']['derived_actual_field']='ast_u_l'
  d['input_definitions']['ast_u_l']['ui_derived_from']='ast_uln_multiple'
 if c=='00423':
  d['input_definitions']['bilirubin_uln_multiple']['derived_actual_field']='bilirubin_umol_l'
  d['input_definitions']['bilirubin_umol_l']['ui_derived_from']='bilirubin_uln_multiple'
 if c in idx['new_codes']:
  d['input_definitions']['anc_x10e9_l']['label']='ANC (×10⁹/L)'
  d['input_definitions']['platelets_x10e9_l']['label']='Platelets (×10⁹/L)'
 # Supply synthetic demonstration values without pre-filling live assessments.
 positive={'indication_eligible'}
 nums={'anc_x10e9_l':3,'platelets_x10e9_l':200,'hb_g_dl':12,'ecog':0,'bilirubin_umol_l':10,'ast_uln_multiple':1,'alt_uln_multiple':1,'alp_uln_multiple':1,'bilirubin_uln_multiple':1,'crcl_ml_min':80,'lvef_percent':60,'ast_u_l':25,'docetaxel_current_mg_m2':75}
 for f,definition in d['input_definitions'].items():
  if 'demo_value' in definition:continue
  if definition['type']=='boolean':definition['demo_value']=f in positive
  elif definition['type']=='select':definition['demo_value']=definition['options'][0]['value']
  elif f in nums:definition['demo_value']=nums[f]
  elif f.endswith('_grade'):definition['demo_value']=0
  else:raise ValueError('Missing explicit demo '+c+'/'+f)
  if f.endswith('_grade'):definition.update(grading_source_label='NCCP named toxicity assessment',grading_source_url=d['metadata']['source_url'],assessment_guidance='Confirm the named adverse event and clinician-assessed grade; the regimen lists action thresholds, not a complete grading manual.')
 if c in idx['new_codes']:d['input_definitions']['crcl_ml_min']['renal_input']=dict(mode='source_threshold_numeric',exact_value_required=False,source_url=d['metadata']['source_url'],reason='Source renal bands use creatinine clearance in mL/min, not indexed eGFR.')
 save(str(p.relative_to(R)),d)
risk['content_update_release']=V;save('data/emetogenic-risk-map.json',risk)
for f in ['index.html','404.html','about.html','js/sactcheck-release.js']:
 p=R/f;s=p.read_text().replace('0.84.16','0.84.17')
 if f=='404.html':
  for c in idx['new_codes']:
   if c not in s:s=s.replace('(00217|','('+c+'|00217|')
 p.write_text(s)
d=read('data/app-release.json')
for k in ['release','content_release','version','knowledge_content_release']:d[k]=V
d.update(display_version='v'+V,release_date='2026-10-23',summary='Five new EC/FEC/AT suites and five AC/taxane retrospective upgrades: source-correct assessments, clinician evidence, patient rationale and longitudinal checks. Feasibility build; independent clinical review pending.')
save('data/app-release.json',d)
for f in ['package.json','package-lock.json']:
 if not (R/f).exists():continue
 d=read(f);d['version']=V
 if 'packages'in d and ''in d['packages']:d['packages']['']['version']=V
 save(f,d)
print('Integrated routes, consent wording, phase support, catalogue metadata and release version.')
