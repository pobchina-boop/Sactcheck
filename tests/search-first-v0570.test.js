const assert=require('assert');
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'css','search-first-v0570.css'),'utf8');
const ui=fs.readFileSync(path.join(root,'js','search-first-v0570.js'),'utf8');
const engineFirstCss=fs.readFileSync(path.join(root,'css','homepage-engine-first-v0692.css'),'utf8');
const search=require(path.join(root,'js','regimen-search.js'));

assert.ok(html.includes('SACTCheck v0.57.0 — Search-First Library'), 'Historical search-first label should remain for regression traceability.');
assert.ok(html.includes('SACTCheck v0.58.0 — Ten-Regimen Knowledge Base'));
assert.ok(html.includes('id="libraryCatalogueSection"'));
assert.ok(html.includes('id="clinicalScenarioLauncher"'));
assert.ok(html.includes('scenario-collapsed'));
assert.ok(html.includes('setTimeout(()=>filterRegimens(),175)'));
assert.ok(css.includes('.search-first-catalogue'));
assert.ok(!ui.includes("insertBefore(catalogue,hero)"), 'Catalogue must never be moved ahead of the mission hero.');
assert.ok(ui.includes("library.insertBefore(hero,library.firstElementChild)"));
assert.strictEqual(search.performanceVersion,'0.57.0');

assert.ok(ui.includes("ENGINE_FIRST_RELEASE = '0.70.0'"), 'Engine-first UI release marker must be present.');
assert.ok(ui.includes("document.body.classList.add('engine-first-homepage')"), 'Homepage must activate the engine-first presentation layer.');
assert.ok(ui.includes("moveSearchIntoEngine()"), 'The real regimen search must be promoted into the primary hero workflow.');
assert.ok(ui.includes("createSupportTools()"), 'NCCP tracking, validation, evidence and sustainability must remain accessible as supporting tools.');
assert.ok(ui.includes("launcher.hidden=true"), 'The experimental clinical scenario launcher must be hidden from mainstream navigation.');
assert.ok(ui.includes("new URLSearchParams(window.location.search).get('experimental')==='1'"), 'Experimental scenario access must remain available for internal testing.');
assert.ok(engineFirstCss.includes('.engine-first-entry'), 'Engine-first search presentation styles must be present.');
assert.ok(engineFirstCss.includes('.engine-support-grid'), 'Supporting tool-card layout must be present.');
assert.ok(engineFirstCss.includes('#clinicalScenarioLauncher'), 'Scenario hiding must be presentation-scoped rather than deleting the underlying feature.');
assert.ok(engineFirstCss.includes('@media(max-width:720px)'), 'Engine-first homepage must include responsive behaviour.');

const exact={dataset:{name:'bevacizumab avastin'},querySelector(){return {textContent:'Bevacizumab'}},textContent:'Bevacizumab NCCP 00593 ovarian'};
assert.ok(search.rankCards([exact],'bevacizumab').length===1);
assert.ok(search.rankCards([exact],'bevicizumab').length===1,'Conditional fuzzy matching should retain common close spelling matches.');

const reconciliation=fs.readFileSync(path.join(root,'js','source-reconciliation-v0700.js'),'utf8');
const kbAddendum=JSON.parse(fs.readFileSync(path.join(root,'data','regimen-knowledge-base-v0700-addendum.json'),'utf8'));
const sustainabilityModule=fs.readFileSync(path.join(root,'js','sustainability-module.js'),'utf8');
const sustainabilityAddendum=JSON.parse(fs.readFileSync(path.join(root,'data','sustainability-regimen-metadata-v0700-addendum.json'),'utf8'));
const trackerWorkflow=fs.readFileSync(path.join(root,'.github','workflows','nccp-change-tracker.yml'),'utf8');

assert.ok(ui.includes('ensureV0700Reconciliation()'), 'v0.70.0 source reconciliation must be loaded by the engine-first runtime.');
assert.ok(ui.includes('source-reconciliation-v0700.js'), 'v0.70.0 source reconciliation script path is missing.');
for(const sentinel of ['CAB_COUNTS_COMBINED','DAY15_AFTER_FULL_INTERMEDIATE','BEV_PROTEIN_2_3','BEV_HTN_UNCONTROLLED_NUMERIC']){
  assert.ok(reconciliation.includes(sentinel), `v0.70.0 reconciliation sentinel ${sentinel} is missing.`);
}
assert.strictEqual(kbAddendum.release,'0.70.0');
assert.strictEqual(kbAddendum.regimen_profiles.length,3,'v0.70.0 must add exactly three detailed regimen profiles.');
assert.strictEqual(kbAddendum.evidence_records.length,6,'v0.70.0 must add six principal evidence records.');
for(const acronym of ['TROPIC','PROSELICA','CARD','MPACT','TRIBE','TRIBE2']){
  assert.ok(kbAddendum.evidence_records.some(record=>record.trial_acronym===acronym),`${acronym} evidence record missing.`);
}
assert.ok(sustainabilityModule.includes('data/sustainability-regimen-metadata-v0691.json'),'Base v0.69.1 sustainability metadata must remain the canonical base.');
assert.ok(sustainabilityModule.includes('data/sustainability-regimen-metadata-v0700-addendum.json'),'v0.70.0 sustainability addendum is not loaded.');
assert.ok(sustainabilityModule.includes('version:"0.69.1"'),'Historical sustainability module version must remain stable.');
assert.strictEqual(sustainabilityAddendum.evidence_boundary.no_unvalidated_carbon_estimates,true);
assert.strictEqual(sustainabilityAddendum.evidence_boundary.no_environmental_traffic_light,true);
assert.ok(Object.keys(sustainabilityAddendum.profiles||{}).length>=3);
assert.ok(trackerWorkflow.includes('if ! gh pr create'),'Tracker must gracefully handle blocked automatic PR creation.');
assert.ok(trackerWorkflow.includes('PR creation is blocked by repository settings'),'Tracker fallback warning is missing.');

require('./source-reconciliation-v0700.test.js');

console.log('v0.70.0 engine-first cumulative overlay tests passed: homepage hierarchy preserved, source reconciliation/evidence/sustainability addenda present, tracker fallback retained and search behaviour preserved.');
