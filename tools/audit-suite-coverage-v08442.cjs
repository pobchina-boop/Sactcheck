'use strict';
// Inventory only. File presence does not establish clinical approval or source currency.
const fs=require('node:fs'),path=require('node:path');
const R=path.resolve(__dirname,'..');
const read=f=>JSON.parse(fs.readFileSync(path.join(R,f),'utf8'));
const registry=require('../js/patient-asset-registry-v0810.js');
const visibility=require('../js/library-scope-v08441.js');
const required=['index.html','guide.pdf','knowledge.html','knowledge.pdf','handbook.pdf','passport.pdf','sactcard.pdf','consent-form.html','consent-form.pdf','supportive-care.pdf','treatment-journey.pdf'];
const entries=read('protocols/index.json').protocols;
const rows=entries.map(e=>{
  const p=read(e.path),m=p.metadata||{},code=String(m.nccp_regimen_code||p.nccp_code||'');
  const routes=registry.hasDedicated(p)?registry.bundleRoutes(p):[];
  return {code,title:m.title||p.title,primary_group:m.tumour_group||e.tumour_group,groups:m.tumour_groups||[m.tumour_group||e.tumour_group],visible:visibility.isVisible(p),protocol_path:e.path,
    registered:registry.hasDedicated(p),source_version:m.nccp_version,source_checked_date:m.source_checked_date||null,clinical_audit_release:m.clinical_audit_release||m.validation?.audit_release||null,
    independent_clinical_approval:m.validation?.clinical_use_authorised===true,
    encoded_indication_count:Array.isArray(p.indications)?p.indications.length:null,
    routes:routes.map(route=>({route,missing_files:required.filter(file=>!fs.existsSync(path.join(R,'patient',route,file)))}))};
});
const visible=rows.filter(r=>r.visible),allRoutes=visible.flatMap(r=>r.routes);
const groups={};for(const r of visible){const g=groups[r.primary_group]??={catalogue_entries:0,registered:0,no_registered_route:0,entries_with_a_route_containing_all_checked_files:0};g.catalogue_entries++;g.registered+=Number(r.registered);g.no_registered_route+=Number(!r.registered);g.entries_with_a_route_containing_all_checked_files+=Number(r.routes.some(x=>x.missing_files.length===0));}
const report={release:read('package.json').version,checked:'2026-11-06',catalogue_entries:rows.length,visible_entries:visible.length,hidden_entries:rows.length-visible.length,registered_visible_entries:visible.filter(r=>r.registered).length,visible_entries_without_registered_route:visible.filter(r=>!r.registered).length,registered_routes:allRoutes.length,routes_with_all_checked_files:allRoutes.filter(r=>!r.missing_files.length).length,required_files:required,groups,limitations:[
  'Primary tumour groups are used for a non-overlapping inventory. Shared protocols also serve other groups; these counts are not per-tissue completion claims.',
  'A registered root or one complete route does not establish coverage of every encoded indication, disease stage, formulation, dose or treatment phase.',
  'File presence does not establish three-page formatting, correct anatomy, current sources, correct clinical thresholds, QR validity or independent approval.',
  'Legacy source dates and declared audit releases are recorded metadata; a fresh source audit is required to establish current clinical fidelity.'
],rows};
const output=process.argv[2]||'validation/skin-melanoma-v08442/site-coverage.json';
fs.mkdirSync(path.dirname(path.join(R,output)),{recursive:true});fs.writeFileSync(path.join(R,output),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(Object.fromEntries(Object.entries(report).filter(([k])=>!['rows','required_files'].includes(k))),null,2));
