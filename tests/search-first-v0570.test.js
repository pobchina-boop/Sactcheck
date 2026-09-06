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

assert.ok(ui.includes("ENGINE_FIRST_RELEASE = '0.70.1'"), 'The cumulative v0.70.1 engine-first layer must remain present beneath the v0.71.0 consent feature.');
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

assert.ok(ui.includes('ensureV0700Reconciliation()'), 'v0.70.0 source reconciliation must remain loaded.');
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

const hotfix=fs.readFileSync(path.join(root,'js','source-reconciliation-v0701.js'),'utf8');
assert.ok(ui.includes('ensureV0701Reconciliation()'),'v0.70.1 hotfix loader is missing.');
assert.ok(ui.includes('source-reconciliation-v0701.js'),'v0.70.1 source-fidelity script path is missing.');
for(const sentinel of [
  'LONSURF_NEXT_CYCLE_ANC','LONSURF_DELAY_REDUCE_ANC',
  'RIBO_HEP_G3','RIBO_HEP_DILI','RIBO_QT_GT500_ADJ_RECUR',
  'sourceCheckPending'
]){
  assert.ok(hotfix.includes(sentinel),`v0.70.1 hotfix sentinel ${sentinel} is missing.`);
}
assert.ok(hotfix.includes('trifluridine_and_tipiracil_Lonsurf_therapy_382.pdf'),'Current Lonsurf v4 source URL is missing.');
assert.ok(hotfix.includes('NCCP regimen catalogue'),'NCCP catalogue source fallback is missing.');
assert.ok(hotfix.includes('Source check pending — do not interpret this as zero updates.'),'Tracker pending-state safeguard is missing.');

// v0.71.0 consent builder is loaded through the already-included study-release module,
// avoiding a risky index.html rewrite.
const studyRelease=fs.readFileSync(path.join(root,'js','study-release.js'),'utf8');
const consentBuilder=fs.readFileSync(path.join(root,'js','regimen-consent-builder-v0710.js'),'utf8');
const consentCss=fs.readFileSync(path.join(root,'css','regimen-consent-builder-v0710.css'),'utf8');
const consentContent=JSON.parse(fs.readFileSync(path.join(root,'data','consent-content-v0710.json'),'utf8'));
assert.ok(studyRelease.includes('regimen-consent-builder-v0710.js?v=0.71.0'),'Consent-builder runtime loader is missing.');
assert.ok(studyRelease.includes('const VERSION = "0.48.4"'),'Historical study-release version must remain stable.');
assert.ok(consentBuilder.includes('const VERSION="0.71.0"'),'Consent-builder release marker missing.');
assert.ok(consentBuilder.includes('data-open-regimen-consent'),'Regimen-card consent button hook missing.');
assert.ok(consentBuilder.includes('Generic chemotherapy'),'Generic chemotherapy consent layer missing.');
assert.ok(consentBuilder.includes('Immunotherapy / immune-related risks'),'Immunotherapy consent layer missing.');
assert.ok(consentBuilder.includes('Agent-specific content requiring manual completion'),'Unmapped-agent safety gate missing.');
assert.ok(consentCss.includes('.consent-print-sheet'),'Printable consent presentation missing.');
assert.ok(consentCss.includes('@media print'),'Consent print/PDF layout missing.');
assert.strictEqual(consentContent.release,'0.71.0');
assert.strictEqual(consentContent.governance.no_autonomous_consent,true);
assert.ok(Object.keys(consentContent.agent_profiles||{}).length>=50);

require('./source-reconciliation-v0700.test.js');
require('./source-reconciliation-v0701.test.js');
require('./regimen-consent-builder-v0710.test.js');

console.log('v0.71.0 cumulative tests passed: v0.70.0/v0.70.1 clinical reconciliation preserved and regimen-specific consent builder added without modifying protocol JSON.');
