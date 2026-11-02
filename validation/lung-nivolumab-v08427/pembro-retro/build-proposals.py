from pathlib import Path
import json,copy,hashlib
B=Path(__file__).resolve().parent;R=B.parents[2];DATE='2026-10-29';V='0.84.27'
def read(p):return json.loads(p.read_text())
def save(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
base=R/'validation/lung-core-v08422/pembro-combo';A=read(base/'authoring.json');A['regimens']['00568']=read(base/'research/00568-authoring-template.json');A.update(release=V,checked=DATE)
ref=read(next((R/'protocols/lung').glob('00569-*.json')));ref_rules={r.get('id',r.get('rule_id')):r for r in ref['rule_engine']['rules']}
sources={'checked':DATE,'regimens':{},'supplemental':[{'id':'smPC','url':'https://www.ema.europa.eu/en/documents/product-information/keytruda-epar-product-information_en.pdf','sections':['4.2','4.4'],'retrieval':'Fresh official search index; direct open rate limited (429). Search confirms exclude other causes in immune hepatitis/nephritis. IV manufacturer SmPC also searched; direct HTML exceeds tool limit.'},{'id':'keynote189','url':'https://ascopubs.org/doi/10.1200/JCO.22.01989','population':'Pooled cisplatin/carboplatin first-line metastatic nonsquamous NSCLC; five-year 2023 update'},{'id':'keynote407','url':'https://ascopubs.org/doi/10.1200/JCO.22.01990','population':'Pooled paclitaxel/nab-paclitaxel first-line metastatic squamous NSCLC; five-year 2023 update'}]}
for code in ['00568','00569','00579']:
 f=next((R/'protocols/lung').glob(code+'-*.json'));p=read(f);m=p['metadata'];url=m['source_url'];rules=p['rule_engine']['rules']
 if code=='00568':
  for k in ['immune_hepatitis_attribution','immune_nephritis_attribution','infusion_reaction_culprit','pembrolizumab_severe_renal_impairment','pembrolizumab_moderate_severe_hepatic_impairment']:p['input_definitions'][k]=copy.deepcopy(ref['input_definitions'][k])
  for r in rules:
   rid=r.get('id',r.get('rule_id'))
   if rid in ['ICI_HEPATITIS_WITHHOLD','ICI_HEPATITIS_STOP','ICI_BILI_WITHHOLD','ICI_BILI_STOP','ICI_RENAL_G2','ICI_RENAL_G3','ICI_LIVER_METS_BASELINE_G2_STOP']:
    field='immune_nephritis_attribution' if rid.startswith('ICI_RENAL') else 'immune_hepatitis_attribution'
    r['when']={'all':[{'field':field,'operator':'==','value':'confirmed_immune'},r['when']]}
  for r in rules:
   if r.get('id',r.get('rule_id'))=='ICI_INFUSION_G3':r['when']=copy.deepcopy(ref_rules['ICI_INFUSION_G3']['when'])
  for rid in ['LIVER_ATTRIBUTION_UNRESOLVED','NEPHRITIS_ATTRIBUTION_UNRESOLVED','INFUSION_REACTION_UNRESOLVED','PEMBROLIZUMAB_SEVERE_RENAL_IMPAIRMENT','PEMBROLIZUMAB_MODERATE_SEVERE_HEPATIC_IMPAIRMENT']:
   r=json.loads(json.dumps(ref_rules[rid]).replace('00569','00568'));r['source'].update(document='NCCP 00568 v5',url=url,page='5–6',checked_date=DATE);rules.append(r)
 # Relative baseline liver-metastasis pathway must not disappear when absolute ULN fields are absent.
 msg='Baseline grade 2 liver-metastasis context with AST/ALT rise ≥50% for ≥7 days requires prompt hepatitis attribution review. Withhold pembrolizumab while the cause is clarified; relative change alone does not diagnose immune hepatitis or establish permanent discontinuation.'
 rules.append({'id':'LIVER_RELATIVE_ATTRIBUTION_UNRESOLVED','priority':10,'when':{'all':[{'any':[{'field':'immune_hepatitis_attribution','operator':'missing'},{'field':'immune_hepatitis_attribution','operator':'==','value':'suspected_immune'}]},{'field':'immune_liver_metastasis_baseline_g2','operator':'==','value':True},{'field':'ast_alt_increase_percent','operator':'>=','value':50},{'field':'ast_alt_elevation_days','operator':'>=','value':7}]},'action':{'type':'withhold','components':['pembrolizumab'],'message':msg,'recommendation':msg},'explanation':msg,'source':{'document':'NCCP '+code+' v'+m['nccp_version']+'; Keytruda SmPC 4.4 attribution supplement','url':url,'page':'5–6' if code=='00568' else '4–5','checked_date':DATE}})
 for k,x in p['input_definitions'].items():x['required']=False;x['demo_value']=''
 p['required_inputs']=[]
 m.update(sactcheck_encoding_version=V,source_checked_date=DATE,source_reconciliation_date=DATE,source_retrieval_method='Fresh official web PDF text and critical-table screenshots; direct byte download HTTP 403. Existing byte/text hashes describe retained earlier snapshots, not a fresh download.')
 m['encoding_maturity'].update(audit_release=V,audit_date=DATE,reconciled_release=V,reconciled_date=DATE)
 for obj in [m['validation'],m['encoding_maturity'],p['clinical_governance']]:
  for key in ['consultant_reviewed','oncology_pharmacy_reviewed','clinical_use_authorised']:obj[key]=False
 save(B/'proposed'/f.name,p)
 x=A['regimens'][code];d=x['patient'];d.update(content_version=V,suite_release=V,source_checked=DATE);d['evidence']['metrics']=[]
 x['evidence']['checked']=DATE
 d['sources'].append({'id':code,'title':'NCCP '+code+' v'+m['nccp_version'],'url':url}) if not any(s['id']==code for s in d['sources']) else None
 x['clinical'].setdefault('key_points',[]).append('Confirm immune attribution before a permanent pembrolizumab liver/renal toxicity decision. Baseline organ impairment and chemotherapy toxicity have separate pathways; omitted causes remain unassessed.')
 x['journey'].setdefault('clinical_notes',[]).append('At each phase review, distinguish chemotherapy organ impairment from suspected immune injury. Changes relative to abnormal liver-metastasis baseline require assessment even when absolute ULN values are unavailable.')
 for plan in x['support_plans']:
  phase=next((ph for ph in p['treatment_phases'] if ph['phase_id']==plan['id']),None)
  if phase:plan['active_drugs']=phase['active_drugs']
 x['protocol_metadata']={'source_checked_date':DATE,'source_schedule_interval_label':'Every 21 days','source_page_count':m['source_document_pages'],'source_retrieval_method':m['source_retrieval_method']}
 x['card_contexts']=[{'id':code+'a','indication_id':code+'a','intent':'Metastatic disease control','duration_type':'until_progression_or_unacceptable_toxicity','duration_text':d['schedule_summary'],'cycle_length_days':21,'description':d['indication_text']}]
 sources['regimens'][code]={'file':f.name,'url':url,'version':m['nccp_version'],'retrieved':DATE,'retrieval_method':m['source_retrieval_method'],'pdf_sha256':None,'text_sha256':None,'pages_reviewed':['1–2 indication, schedule and eligibility','3–7 monitoring and dose tables','supportive care and version history'],'source_version_change':False,'rules':len(rules),'inputs':len(p['input_definitions'])}
 # Retain prior source bytes with explicit original provenance, where available.
 old=base/'research'/f'{code}.pdf'
 if old.exists():sources['regimens'][code]['retained_pdf_sha256']=hashlib.sha256(old.read_bytes()).hexdigest()
save(B/'authoring.json',A);save(B/'sources.json',sources)
s=(base/'source-cases.cjs').read_text().replace('validation/lung-core-v08422/pembro-combo/proposed/','validation/lung-nivolumab-v08427/pembro-retro/proposed/').replace("'2026-10-26'","'2026-10-29'")
extra=r'''
for(const c of ['00568','00569','00579']) {
 for (const attribution of [undefined,'','suspected_immune','other_or_baseline','confirmed_immune']) {
  const input={immune_liver_metastasis_baseline_g2:true,ast_alt_increase_percent:50,ast_alt_elevation_days:7};if(attribution!==undefined)input.immune_hepatitis_attribution=attribution;
  const confirmed=attribution==='confirmed_immune',unknown=!attribution||attribution==='suspected_immune';
  test(c,'relative liver missing absolute labs '+attribution,input,confirmed?['ICI_LIVER_METS_BASELINE_G2_STOP']:unknown?['LIVER_RELATIVE_ATTRIBUTION_UNRESOLVED']:[],confirmed?['LIVER_RELATIVE_ATTRIBUTION_UNRESOLVED']:['ICI_LIVER_METS_BASELINE_G2_STOP']);
 }
 for(const [percent,days] of [[49.99,7],[50,6.99],[50,7]])test(c,'relative boundary '+percent+'/'+days,{immune_liver_metastasis_baseline_g2:true,ast_alt_increase_percent:percent,ast_alt_elevation_days:days},percent>=50&&days>=7?['LIVER_RELATIVE_ATTRIBUTION_UNRESOLVED']:[],percent<50||days<7?['LIVER_RELATIVE_ATTRIBUTION_UNRESOLVED']:[]);
 check(c+' complete authored patient scalar types and days',()=>{const a=A.regimens[c],d=a.patient;assert.equal(d.schema_version,1);assert.equal(d.cycle_days,21);assert.deepEqual(d.evidence.metrics,[]);const days=d.day_groups.flatMap(g=>Array.from({length:g.end-g.start+1},(_,i)=>g.start+i));assert.deepEqual(days,Array.from({length:21},(_,i)=>i+1));for(const k of ['patient','clinical','evidence','journey','selector','support_plans','route','risk','protocol_metadata','card_contexts'])assert(a[k]);});
 check(c+' all inputs optional blank demonstrations',()=>{for(const d of Object.values(P[c].input_definitions)){assert.notEqual(d.required,true);assert([null,'',undefined].includes(d.demo_value));}});
 check(c+' real dose model retains induction and maintenance',()=>{const m=D.buildModel(P[c]);assert.equal(m.phases.length,2);assert.equal(P[c].treatment_phases[0].planned_cycles,4);});
}
for(const [field,hold,stop,low,high,attr] of [['alt_ast_uln_multiple','ICI_HEPATITIS_WITHHOLD','ICI_HEPATITIS_STOP',3,5,'immune_hepatitis_attribution'],['bilirubin_uln_multiple','ICI_BILI_WITHHOLD','ICI_BILI_STOP',1.5,3,'immune_hepatitis_attribution'],['creatinine_ratio_baseline_or_uln','ICI_RENAL_G2','ICI_RENAL_G3',1.5,3,'immune_nephritis_attribution']]) {
 for(const v of [low,low+.01,high,high+.01])for(const cause of [undefined,'suspected_immune','other_or_baseline','confirmed_immune']) {
 const input={[field]:v};if(cause)input[attr]=cause;
 test('00568',field+' '+v+' '+cause,input,cause==='confirmed_immune'&&v>low?[v>high?stop:hold]:[],cause!=='confirmed_immune'||v<=low?[hold,stop]:[v>high?hold:stop]);
 }
}
'''
s=s.replace('const result={mode:',extra+'\nconst result={mode:');(B/'source-cases.cjs').write_text(s)
