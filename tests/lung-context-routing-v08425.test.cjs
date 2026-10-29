'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const R=require('../js/patient-asset-registry-v0810');
const assets={portal:'',knowledge:'knowledge.html',guide:'guide.pdf',passport:'passport.pdf','sact-card':'sactcard.pdf','consent-draft':'consent-form.html','supportive-care-selector':'supportive-care.html','supportive-care':'supportive-care.pdf',longitudinal:'treatment-journey.html'};
for(const code of ['00203','00226','00232','00259','00215']){
 const protocol={protocol_id:'nccp-'+code,metadata:{nccp_regimen_code:code}};
 for(const [asset,file] of Object.entries(assets)){
  assert.equal(R.relativePath(code,asset),`patient/${code}/scope.html?asset=${encodeURIComponent(asset)}`);
  assert.equal(R.relativePath(protocol,asset,'lung'),`patient/${code}/lung/${file}`);
  assert.equal(R.relativePath(protocol,asset,'breast'),`patient/${code}/${file}`);
  assert.match(R.relativePath(protocol,asset,'ovary'),/scope.html/);
 }
}
// The UI's tissue selection is consulted per call, never retained across patients.
global.SACTCheckProtocolContext={activeTumourGroup:()=> 'Lung'};
assert.equal(R.relativePath('00203','guide'),'patient/00203/lung/guide.pdf');
global.SACTCheckProtocolContext={activeTumourGroup:()=> 'Breast'};
assert.equal(R.relativePath('00203','guide'),'patient/00203/guide.pdf');
global.SACTCheckProtocolContext={activeTumourGroup:()=> 'all'};
assert.match(R.relativePath('00203','guide'),/scope.html/);
delete global.SACTCheckProtocolContext;
// Selector accepts only known asset names; query strings cannot inject URLs.
for(const value of ['guide','passport','https://example.invalid','../other','__proto__']){
 const links=['breast','lung'].map(context=>({dataset:{context},setAttribute(k,v){this[k]=v;}}));
 const script=fs.readFileSync(path.join(__dirname,'../assets/patient/context-selector-v08425.js'),'utf8');
 vm.runInNewContext(script,{URLSearchParams,window:{location:{search:'?asset='+encodeURIComponent(value)}},document:{querySelectorAll:()=>links}});
 assert.equal(links[0].href,'./'+(Object.hasOwn(assets,value)?assets[value]:''));
 assert.equal(links[1].href,'lung/'+(Object.hasOwn(assets,value)?assets[value]:''));
}
console.log('Lung/breast routes: all nine assets, unknown context, tissue switching and safe selector query handling passed.');
