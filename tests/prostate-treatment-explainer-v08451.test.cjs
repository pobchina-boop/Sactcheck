'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const R=path.resolve(__dirname,'..');
const K=require('../js/regimen-knowledge-base.js');
const topic=JSON.parse(fs.readFileSync(path.join(R,'data/prostate-treatment-explainer-v08451.json')));
const payload={prostate_treatment_explainer:topic};
const protocol=code=>({metadata:{nccp_regimen_code:code}});
for(const c of ['00103','00577','00233','00574','00693']) {
 const html=K.prostatePathwayMarkup(protocol(c),payload);
 assert(html.includes('id="prostate-pathway-title"'));
 assert.equal((html.match(/<details>/g)||[]).length,7);
 assert(html.includes('does not select a regimen'));
 assert(html.includes('not the same setting as nmCRPC'));
}
for(const c of ['00295','00294','00073','00623','99999'])assert.equal(K.prostatePathwayMarkup(protocol(c),payload),'');
assert.equal(K.prostatePathwayMarkup(protocol('00103'),{}),'');
const text=JSON.stringify(topic);
for(const x of ['10 mg daily','5 mg twice daily','5 mg daily','≤10 months','0.62 (95% CI 0.51–0.76)','0.68 (95% CI 0.57–0.80)','81% versus 73%','0.60 (95% CI 0.44–0.80)','not interchangeable','conventional-imaging','July 2026'])assert(text.includes(x),x);
const ids=new Set(topic.sources.map(s=>s.id));
assert.equal(ids.size,topic.sources.length);
for(const s of topic.sections){for(const id of s.source_ids)assert(ids.has(id),id);for(const r of s.rows)assert.equal(r.length,s.columns.length);}
for(const s of topic.sources)assert.equal(new URL(s.url).protocol,'https:');
const hostile=structuredClone(payload);hostile.prostate_treatment_explainer.title='<script>bad()</script>';
const safe=K.prostatePathwayMarkup(protocol('00103'),hostile);assert(!safe.includes('<script>'));assert(safe.includes('&lt;script&gt;'));
console.log('Prostate treatment explainer: scope, source mapping, clinical distinctions, evidence values and escaped rendering passed.');

// Exercise the actual render listener without treating this DOM double as browser evidence.
const vm=require('node:vm');let click;
const details=Array.from({length:7},()=>({open:false}));
const button={textContent:'Expand all topics',addEventListener(type,fn){assert.equal(type,'click');click=fn;},closest(selector){assert.equal(selector,'.prostate-pathway');return {querySelectorAll(selector){assert.equal(selector,'details');return details;}};}};
const target={innerHTML:'',querySelector(selector){return selector==='[data-prostate-expand]'&&this.innerHTML.includes('data-prostate-expand')?button:null;}};
const cl={add(){},remove(){},toggle(){}};
const overlay={classList:cl,querySelector:s=>s==='[data-regimen-info-content]'?target:null};
const context={console,fetch:async url=>({ok:fs.existsSync(path.join(R,url)),json:async()=>JSON.parse(fs.readFileSync(path.join(R,url)))}),document:{readyState:'loading',addEventListener(){},getElementById:()=>overlay,body:{classList:cl}}};
vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(R,'js/regimen-knowledge-base.js'),'utf8'),context);
(async()=>{const api=context.SACTCheckRegimenKnowledgeBase;await api.load();assert(api.open(protocol('00103')));await new Promise(r=>setImmediate(r));assert(click);click({target:button});assert(details.every(d=>d.open));assert.equal(button.textContent,'Collapse all topics');click({target:button});assert(details.every(d=>!d.open));assert.equal(button.textContent,'Expand all topics');console.log('Prostate disclosure expand/collapse handler passed in a DOM double.');})().catch(e=>{console.error(e);process.exitCode=1;});
