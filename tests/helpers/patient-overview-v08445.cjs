'use strict';
// Independent public-contract checks for the approved three-part entry page.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
function validate(html,route){
 assert.match(html,/data-patient-overview="0\.84\.45"/);
 const folder=path.join(root,'patient',route),guide=fs.readFileSync(path.join(folder,'guide.html'),'utf8'),wiki=fs.readFileSync(path.join(folder,'knowledge.html'),'utf8');
 const guideHash=crypto.createHash('sha256').update(guide).digest('hex');
 assert(html.includes('data-overview-source="'+guideHash+'"'),route+' overview follows exact current guide');
 assert.deepEqual([...html.matchAll(/<section class="po45-panel" id="([^"]+)"/g)].map(x=>x[1]),['overview-1','overview-2','overview-3']);
 const cards=[...html.matchAll(/<article class="po45-destination" id="([^"]+)"/g)].map(x=>x[1]);
 assert.deepEqual(cards,['my-treatment','my-tests','between-treatments','my-passport','my-resources']);
 assert(html.indexOf('id="overview-3"')<html.indexOf('id="more-information"'));
 assert(!/data-patient-panel|class="pt-tabs"/.test(html),'Retired competing navigation is absent');
 for(const f of ['guide.pdf','handbook.pdf','passport.html','knowledge.html','sactcard.html'])assert(html.includes('href="'+f+'"'),route+' reaches '+f);
 assert(/href="guide.pdf" download/.test(html)&&/href="handbook.pdf" download/.test(html));
 assert(/href="#(?:urgent|overview-2)"[^>]*>I feel unwell \/ urgent help/.test(html));
 const urgent=html.includes('href="#urgent"')?'urgent':'overview-2';assert(html.includes('id="'+urgent+'"'));
 assert(!/undefined|\[object Object\]/.test(html));
 const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(x=>x[1]);assert.equal(new Set(ids).size,ids.length,route+' duplicate DOM IDs');
 for(const match of html.matchAll(/href="(knowledge\.html(?:#[^"]+)?)"/g))if(match[1].includes('#'))assert(wiki.includes('id="'+match[1].split('#')[1]+'"'),route+' topic destination '+match[1]);
 assert(/Full-body anatomical illustration|patient-bodymap-card/.test(html),route+' rich body map retained');
 const imagePaths=[...guide.matchAll(/<img\b[^>]*src="([^"]+)"[^>]*alt="[^"]*(?:anatomical|anatomy|body)[^"]*"/gi)].map(x=>x[1]);
 for(const src of imagePaths)assert(html.includes('src="'+src+'"'),route+' exact guide illustration');
 return {guide,wiki};
}
module.exports={validate};
