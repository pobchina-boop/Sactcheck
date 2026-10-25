import pathlib
H=pathlib.Path(__file__).resolve().parent;R=H.parents[2]
s=(R/'validation/endocrine-v0842/ai-source-cases.cjs').read_text()
s=s.replace("const repo=process.env.SACT_REPO||path.resolve(__dirname,'../..');", "const repo=process.env.SACT_REPO||path.resolve(__dirname,'../../..');\nconst arg=process.argv.indexOf('--mode');const mode=arg>=0?process.argv[arg+1]:'proposed';assert(['baseline','proposed','integrated'].includes(mode),'Use --mode baseline|proposed|integrated');\nconst protocolDir=mode==='baseline'?path.join(__dirname,'../baseline'):mode==='proposed'?path.join(__dirname,'proposed'):path.join(repo,'protocols/breast');")
s=s.replace("path.join(repo,'protocols/breast',fs.readdirSync(path.join(repo,'protocols/breast')).find(f=>f.startsWith(c+'-')))","path.join(protocolDir,fs.readdirSync(protocolDir).find(f=>f.startsWith(c+'-')))")
s=s.replace("assert.equal(r.source.checked_date,'2026-10-18');", "assert.equal(r.source.checked_date,mode==='baseline'?'2026-10-18':'2026-10-25');")
s=s.replace("assert.equal(p.metadata.sactcheck_encoding_version,'0.84.2');assert(!p.metadata.source_pdf_sha256);", "assert.equal(p.metadata.sactcheck_encoding_version,mode==='baseline'?'0.84.2':'0.84.20');if(mode==='baseline')assert(!p.metadata.source_pdf_sha256);else assert.match(p.metadata.source_pdf_sha256,/^[a-f0-9]{64}$/);")
new=r'''
// Clinical expectations are invariant across modes. Baseline failures expose
// observed missing safeguards against the same source-derived oracle.
for(const schedule of ['standard_daily','hepatic_every_other_day','other_reduced','other_or_unknown']){
 for(const hepatic of ['A','B','C'])run('00371',`Current schedule ${schedule}, Child–Pugh ${hepatic}`,{child_pugh_class:hepatic,letrozole_current_schedule:schedule},(r,m)=>{
  const needsReview=hepatic==='C'&&['other_reduced','other_or_unknown'].includes(schedule);
  if(needsReview){has(r,'consultant_review');sourceRule(r,'HEPATIC_CURRENT_SCHEDULE');noNumeric(m);}
  else if(hepatic==='C'){has(r,'dose_reduce');assert(m.rows.some(x=>x.quantified&&x.protocolDose==='2.5 mg every other day'));}
  else{noRestriction(r);noNumeric(m);}
 },'NCCP00371 physical p2 50% original average dose; no inferred escalation of an existing custom prescription');
 run('00371',`Current schedule ${schedule} alone remains partial`,{letrozole_current_schedule:schedule},(r,m)=>{assert(!clinical(r).some(f=>f.ruleId.endsWith('_HEPATIC_CURRENT_SCHEDULE')));noRestriction(r);noNumeric(m);},'Current prescription is context; no hepatic class is inferred');
}
for(const indication of ['00371a','00371d','00371e']){
 for(const value of ['negative','positive','unknown'])run('00371',`${indication} with HER2 ${value}`,{indication_code:indication,her2_status:value},(r,m)=>{
  if(indication==='00371d'&&value!=='negative'){has(r,'consultant_review');sourceRule(r,'NEOADJ_HER2');assert(/SmPC/.test(text(r)));}
  else noRestriction(r);noNumeric(m);
 },'HPRA00371 §4.1 neoadjuvant label scope; not a universal monotherapy HER2 exclusion');
 for(const field of ['chemotherapy_unsuitable','immediate_surgery_not_indicated'])for(const value of [false,true])run('00371',`${indication} with ${field} ${value}`,{indication_code:indication,[field]:value},(r,m)=>{
  if(indication==='00371d'&&!value){has(r,'consultant_review');sourceRule(r,field==='chemotherapy_unsuitable'?'NEOADJ_CHEMOTHERAPY':'NEOADJ_SURGERY');}
  else noRestriction(r);noNumeric(m);
 },'HPRA00371 §4.1 known neoadjuvant treatment-selection conflict requires review');
}
for(const input of [{her2_status:'positive'},{chemotherapy_unsuitable:false},{immediate_surgery_not_indicated:false}])run('00371','Neoadjuvant context without indication is not inferred '+JSON.stringify(input),input,(r,m)=>{noRestriction(r);noNumeric(m);},'Partial entry must not invent treatment setting');
run('00371','Known neoadjuvant criteria met do not clear whole patient',{indication_code:'00371d',her2_status:'negative',chemotherapy_unsuitable:true,immediate_surgery_not_indicated:true},(r,m)=>{noRestriction(r);noNumeric(m);assert.notEqual(r.actionType,'proceed');},'Other independent eligibility domains remain unassessed');
for(const input of [{her2_status:'positive'},{chemotherapy_unsuitable:false},{immediate_surgery_not_indicated:false},{letrozole_current_schedule:'other_reduced'}])run('00371','Competing new review blocks hepatic-C numeric dose '+JSON.stringify(input),{indication_code:'00371d',child_pugh_class:'C',...input},(r,m)=>{has(r,'consultant_review');noNumeric(m);},'Review takes precedence over automatic frequency output');
'''
s=s.replace("structural('Three protocols",new+"\nstructural('Three protocols")
s=s.replace("checked_at:new Date().toISOString(),repo,total:","checked_at:new Date().toISOString(),repo,mode,baseline_note:mode==='baseline'?'Frozen baseline judged against the same source-derived clinical oracle; observed failures identify missing safeguards.':undefined,total:")
s=s.replace("path.join(__dirname,'ai-source-cases-results.json')","path.join(__dirname,`source-cases-${mode}.json`)")
s=s.replace('AI source audit: ${results.length-failed}', 'AI source audit (${mode}): ${results.length-failed}')
s=s.replace("check(r,m);result.actual=r.actionType;","result.actual=r.actionType;").replace("result.pass=true;}catch(e)","check(r,m);result.pass=true;}catch(e)")
(H/'source-cases.cjs').write_text(s)
