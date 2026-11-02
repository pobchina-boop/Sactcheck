from pathlib import Path
import json,copy
B=Path(__file__).parent;f=B/'authoring.json';a=json.loads(f.read_text());x=a['regimens']['00849'];bb=json.loads((B/'backbones.json').read_text())
x['patient']['sources']=[s for s in x['patient']['sources'] if s['id']!='companion']+[dict(id='companion_'+k,title='NCCP '+k+' v'+v[4]+' · '+v[0]+' / '+v[1],url=v[5])for k,v in bb.items()]
# Base is never a patient bundle, but preserve source-ID resolvability for clinical overview fields.
x['patient']['sources'].append(dict(id='companion',title='NCCP 00849 · overview of all five companion regimens',url=x['patient']['sources'][0]['url']))
for slug,z in x['patient_contexts'].items():
 k=slug.split('_')[1]
 for plan in z['support_plans']:
  plan['source_checked']='2026-10-29';plan['source_url']=bb[k][5]
  for med in plan['medicines']:
   if k in ['00310','00281'] and 'pemetrexed' in med.get('note','').lower():med['note']='Reference course only: reconcile the aprepitant interaction and any other steroids into one clear prescription.'
   med['timing']=med['timing'].replace('Day1','Day 1').replace('Days2','Days 2')
 z['patient']['consent_support']+=' Discuss severe or fatal immune inflammation and chemotherapy effects, including lasting hormone replacement, organ injury and effects on surgery timing.'
x['support_plans']=[];profiles={} 
for slug,z in x['patient_contexts'].items():
 for s in z['support_plans']:
  p=copy.deepcopy(s);p['id']=slug if s['id']=='day1'else slug+'_day8';p['label']=z['patient']['title']+' · '+s['label'];x['support_plans'].append(p);profiles[p['id']]=z['risk']['phase_profiles'][s['id']]
 x['clinical']['rationale']['sources'] += [dict(label='NCCP '+slug.split('_')[1]+' companion regimen',url=z['patient']['sources'][1]['url'])]
x['risk']['phase_profiles']=profiles;x['risk']['mapping_basis']='Five mutually exclusive neoadjuvant backbones; each Day 1 has its platinum-specific high-risk plan. Gemcitabine backbones additionally have a separate low-risk Day 8 plan. Select backbone and day; do not combine plans.'
x['clinical']['support_summary']=[z['patient']['title']+': '+z['clinical']['support_summary'][0]for z in x['patient_contexts'].values()]
x['clinical']['key_points'] += [x['risk']['mapping_basis']]
f.write_text(json.dumps(a,ensure_ascii=False,indent=2)+'\n')
# Preserve explicit old renal fields, but one verified CrCl entry must still assess pemetrexed.
pf=next((B/'proposed').glob('00849-*.json'));p=json.loads(pf.read_text());r=next(r for r in p['rule_engine']['rules']if r['id']=='00318_PEMETREXED_CRCL_LT45');r['when']['all'][1]['any'].append(dict(field='crcl_ml_min',operator='<',value=45));p['input_definitions']['pemetrexed_crcl_ml_min']['label']='Pemetrexed-specific verified CrCl, if separately entered (low values in either CrCl field remain restrictive)';pf.write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
