'use strict';
// This is an integration/content inventory, not a new source-based clinical rule audit.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const R=path.resolve(__dirname,'../../..'),read=p=>fs.readFileSync(path.join(R,p),'utf8'),json=p=>JSON.parse(read(p));
global.fetch=async url=>({ok:fs.existsSync(path.join(R,url)),json:async()=>json(url)});
global.SACTCheckProtocolContext={activeTumourGroup:()=> 'lung'};
const Registry=require(path.join(R,'js/patient-asset-registry-v0810.js'));
const Engine=require(path.join(R,'js/assessment-engine.js'));
const Dose=require(path.join(R,'js/protocol-dose-schedule.js'));
const Journey=require(path.join(R,'js/treatment-journey-v0837.js'));
const KB=require(path.join(R,'js/regimen-knowledge-base.js'));
const Evidence=require(path.join(R,'js/treatment-evidence-v08413.js'));
const existing=json('validation/lung-cytotoxic-v08429/lung-coverage.json').rows.filter(x=>x.authored_suite);
const index=json('protocols/index.json').protocols,risk=json('data/emetogenic-risk-map.json');
const required=['index.html','guide.html','guide.pdf','knowledge.html','consent.html','consent-form.html','consent-form.pdf','passport.html','passport.pdf','sactcard.html','sactcard.pdf','logistics.html','logistics.pdf','supportive-care.html','supportive-care.pdf','treatment-journey.html','treatment-journey.pdf','qr.png'];
const sourceRefs=(obj,found=[])=>{if(!obj||typeof obj!=='object')return found;for(const [k,v]of Object.entries(obj)){if(k.endsWith('source_ids')&&Array.isArray(v))found.push(...v);else if(typeof v==='object')sourceRefs(v,found);}return found;};
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
(async()=>{
 await KB.load();const rows=[];
 for(const row of existing){
  const c=row.code,p=json(index.find(e=>e.path.includes('/'+c+'-')).path),issues=[];
  const check=(ok,message)=>{if(!ok)issues.push(message);};
  const empty=Engine.assess(p,{});check(!empty.complete&&!['proceed','proceed_with_caution'].includes(empty.actionType),'Empty assessment implies safe/proceed');
  check(new Set(p.rule_engine.rules.map(x=>x.rule_id||x.id)).size===p.rule_engine.rules.length,'Duplicate rule identifiers');
  check(Dose.buildModel(p).phases.length>0,'Dose schedule absent');
  for(const key of ['consultant_reviewed','oncology_pharmacy_reviewed','clinical_use_authorised'])check(p.metadata.validation?.[key]===false,'Review status not explicitly false: '+key);
  check(p.metadata.validation?.rule_level_source_reconciliation_status?.includes('source_reconciled'),'No source reconciliation status');
  check(Boolean(risk.protocols[c]),'No supportive risk mapping');
  const profile=KB.regimenProfileForProtocol(p);check(Boolean(profile),'No runtime KB profile');
  if(profile){check(Boolean(profile.treatment_rationale?.summary),'KB rationale missing');check(Boolean(profile.evidence_at_a_glance?.sources?.length),'KB evidence sources missing');check(!/undefined|\[object Object\]/.test(Evidence.render(profile)),'KB renders invalid values');}
  const routes=row.lung_context?[c+'/lung']:Registry.bundleRoutes(c);
  check(routes.length>0,'No complete patient routes');const patient=[];
  for(const route of routes){
   const d=json(route.includes('/')?`data/patient-knowledge-contexts/${route}.json`:`data/patient-knowledge/${route}.json`);
   const missing=required.filter(f=>!fs.existsSync(path.join(R,'patient',route,f)));
   check(!missing.length,route+' missing assets: '+missing.join(','));
   check(Boolean(d.anatomy?.length),route+' anatomy absent');check(Boolean(d.monitoring_schedule?.rows?.length),route+' monitoring timeline absent');
   check(Boolean(d.chronology_notes?.length),route+' chronology absent');check(Boolean(d.urgent_extra),route+' urgent advice absent');
   check(d.evidence?.metrics?.length===0,route+' numeric patient efficacy metrics present or unclassified');
   check(Boolean(Journey.definitions[route.replace('/',':')]),route+' journey absent');
   const declared=new Set(d.sources.map(s=>s.id)),unresolved=[...new Set(sourceRefs(d))].filter(id=>!declared.has(id));
   const duplicateSourceIds=[...declared].filter(id=>d.sources.filter(s=>s.id===id).length>1);
   check(!duplicateSourceIds.length,route+' duplicate patient source IDs: '+duplicateSourceIds.join(','));
   check(!unresolved.length,route+' unresolved patient source IDs: '+unresolved.join(','));
   const journey=Journey.definitions[route.replace('/',':')];
   const journeyUnresolved=journey?[...new Set(sourceRefs(journey))].filter(id=>!journey.sources?.some(s=>s.id===id)):[];
   check(!journeyUnresolved.length,route+' unresolved journey source IDs: '+journeyUnresolved.join(','));
   const knowledge=read('patient/'+route+'/knowledge.html'),links=[...knowledge.matchAll(/href="#(source-[^"]+)"/g)].map(m=>m[1]),anchors=[...knowledge.matchAll(/id="(source-[^"]+)"/g)].map(m=>m[1]);
   const brokenSourceAnchors=[...new Set(links)].filter(id=>!anchors.includes(id));
   check(!brokenSourceAnchors.length,route+' broken knowledge source anchors: '+brokenSourceAnchors.join(','));
   const pdfs=required.filter(x=>x.endsWith('.pdf')&&fs.existsSync(path.join(R,'patient',route,x))),mismatches=pdfs.filter(f=>!fs.existsSync(path.join(R,'docs/patient',route,f))||hash(fs.readFileSync(path.join(R,'patient',route,f)))!==hash(fs.readFileSync(path.join(R,'docs/patient',route,f))));
   check(!mismatches.length,route+' download mismatches: '+mismatches.join(','));
   const html=read('patient/'+route+'/index.html');check(!/\[object Object\]|>undefined</.test(html),route+' invalid generated HTML');
   patient.push({route,content_release:d.suite_release,template_version:d.patient_summary?.template_version||'historical_template',assets_checked:required.length,pdf_pairs_checked:pdfs.length,missing_assets:missing,pdf_mismatches:mismatches,unresolved_source_ids:unresolved,duplicate_source_ids:duplicateSourceIds,unresolved_journey_source_ids:journeyUnresolved,broken_knowledge_source_anchors:brokenSourceAnchors});
  }
  rows.push({code:c,rule_count:p.rule_engine.rules.length,empty_action:empty.actionType,lung_kb_title:profile?.treatment_setting,patient,issues});
 }
 const out={release:'0.84.30',basis:'Existing 53 authored lung suites at committed v0.84.29; read-only structural and source-reference audit, not fresh rule-by-rule clinical revalidation',checked_date:'2026-11-02',suite_count:rows.length,complete_routes:rows.reduce((n,r)=>n+r.patient.length,0),issue_count:rows.reduce((n,r)=>n+r.issues.length,0),rows};
 fs.writeFileSync(path.join(__dirname,process.argv.includes('--after')?'structural-results-after.json':'structural-results.json'),JSON.stringify(out,null,2)+'\n');
 console.log(JSON.stringify({suite_count:out.suite_count,complete_routes:out.complete_routes,issue_count:out.issue_count,issues:rows.filter(x=>x.issues.length).map(({code,issues})=>({code,issues}))},null,2));
})();
