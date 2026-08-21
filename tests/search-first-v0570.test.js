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

assert.ok(ui.includes("ENGINE_FIRST_RELEASE = '0.69.2'"), 'Engine-first UI release marker must be present.');
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
console.log('v0.69.2 engine-first homepage tests passed: assessment search is primary, supporting tools remain handy, experimental scenario UI is hidden and search behaviour is preserved.');
