from pathlib import Path
D=Path(__file__).resolve().parent
s=(D.parents[2]/'validation/lung-next-v08423/atezo/source-cases.cjs').read_text().replace('research/baseline-00689-v08422.json','baseline-protocol.json').replace('2026-10-26','2026-10-29').replace('A.evidence.endpoints.length,2','A.evidence.endpoints.length,3')
s=s.replace("assert.equal(d.renal_input.mode,'exact_continuous');assert.equal(d.renal_input.exact_value_required,true);","assert.equal(d.renal_input.mode,k==='gfr_ml_min'?'exact_continuous':'source_threshold_numeric');assert.equal(d.renal_input.exact_value_required,k==='gfr_ml_min');")
s=s.replace("r.source.url===P.metadata.source_url&&r.source.checked_date", "[P.metadata.source_url,'https://www.ema.europa.eu/en/documents/product-information/tecentriq-epar-product-information_en.pdf'].includes(r.source.url)&&r.source.checked_date")
extra='''
for(const [field,id,type] of [['myocarditis_suspected','ICI_MYOCARDITIS_SUSPECTED','withhold'],['pericardial_disorder_suspected','ICI_PERICARDIAL_SUSPECTED','withhold'],['myositis_steroid_taper_failed_12_weeks','ICI_MYOSITIS_STEROID_TAPER_FAILURE','permanently_discontinue']]){
 test(field+' true',{[field]:true},[id]);test(field+' false',{[field]:false},[],[id]);test(field+' absent',{},[],[id]);
 for(const phase of ['induction','maintenance'])check(field+' '+phase+' component-only dose action',()=>{let r=E.assess(P,{treatment_phase:phase,[field]:true});let m=D.buildModificationModel(P,r);assert.deepEqual(m.rows.map(x=>x.componentId),['atezolizumab']);assert.equal(m.rows[0].actionType,type);});
 check(field+' has explicit supplemental source',()=>{let rule=P.rule_engine.rules.find(r=>r.id===id);assert.match(rule.source.url,/ema.europa.eu/);assert.equal(rule.source.checked_date,'2026-10-29');});
}
check('confirmed myocarditis permanent stop outranks suspicion hold',()=>{let r=E.assess(P,{myocarditis_suspected:true,myocarditis_grade:2});let m=D.buildModificationModel(P,r);assert.equal(m.rows.find(x=>x.componentId==='atezolizumab').actionType,'permanently_discontinue');});
check('confirmed pericardial permanent stop outranks suspicion hold',()=>{let r=E.assess(P,{pericardial_disorder_suspected:true,pericardial_disorder_grade:2});assert.equal(D.buildModificationModel(P,r).rows.find(x=>x.componentId==='atezolizumab').actionType,'permanently_discontinue');});
test('steroid alone does not diagnose myositis taper failure',{systemic_steroids_mg_pred:20,weeks_since_immune_event:13},[],['ICI_MYOSITIS_STEROID_TAPER_FAILURE']);
check('concurrent cardiac hold and severe cytotoxic restriction stay separate',()=>{let r=E.assess(P,{treatment_phase:'induction',myocarditis_suspected:true,gfr_ml_min:20});let rows=D.buildModificationModel(P,r).rows;assert.equal(rows.find(x=>x.componentId==='atezolizumab').actionType,'withhold');assert(rows.find(x=>x.componentId==='carboplatin'));});
check('long-term result states absence of control and rollover selection',()=>{const e=A.evidence.endpoints[2];assert.match(e.result_text,/12%/);assert.match(e.interpretation,/No long-term control-arm/);assert.match(e.analysis_status,/Eighteen of 26/);assert.deepEqual(A.patient.evidence.metrics,[]);});
check('patient alert and consent retain overlap and urgent recognition',()=>{assert.match(A.patient.urgent_extra,/drooping eyelids/);assert.match(A.patient.consent_support,/heart, muscle and nerve/);assert(A.patient.urgent_source_ids.includes('smpc'));});
'''
s=s.replace('const result={',extra+'\nconst result={');(D/'source-cases.cjs').write_text(s)
