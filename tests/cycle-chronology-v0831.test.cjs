'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const chronology=require('../tools/cycle-chronology.cjs');
assert.equal(read('assets/patient/cycle-chronology-v0831.css'),chronology.stylesheet);
assert(chronology.stylesheet.includes(chronology.referenceStyles),'Use the accepted 00568 colours, type, bands and chart geometry.');
for(const code of ['00209','00321','00226']){
 const d=JSON.parse(read(`data/patient-knowledge/${code}.json`)),chart=chronology.render(d);
 assert.equal((chart.match(/class="wiki-cycle-day"/g)||[]).length,d.cycle_days);
 for(const file of ['index.html','knowledge.html']){
  const html=read(`patient/${code}/${file}`);
  assert(html.includes(chart),`${code}/${file} must use the same complete graph`);
  assert.doesNotMatch(html,/<input|<select|id="pk-start"|class="pk-controls"|Select a day to explore/);
  assert(html.includes('id="cycle"'));
 }
 assert.doesNotMatch(chart,/pembrolizumab|pemetrexed|carboplatin|immune-related effects/i);
 if(code==='00209')assert.match(chart,/data-cycle-track="pump"[\s\S]*?grid-column:2 \/ 5/);
 if(code==='00321')assert.match(chart,/data-cycle-track="rest"[\s\S]*?grid-column:16 \/ 23/);
 if(code==='00226'){
  assert.match(chart,/Paclitaxel Day 22 · if prescribed/);
  assert.match(chart,/Some patients are prescribed Days 1, 8 and 15/);
  assert.doesNotMatch(chart,/hidden|data-phase-ids/);
 }
}
console.log('Reference-style Day 1–X graphs: all three portals and knowledge pages display immediately, with no date or schedule controls.');
