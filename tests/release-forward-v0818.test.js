'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json')));
const next=pkg.version.split('.').map(Number);next[2]++;
for(const version of [pkg.version,next.join('.')]){
 const mockFs={...fs,readFileSync(file,encoding){let value=fs.readFileSync(file,encoding);if(typeof value!=='string')return value;const rel=path.relative(root,file).replaceAll(path.sep,'/');
 if(rel==='package.json'){const p=JSON.parse(value);p.version=version;return JSON.stringify(p);}
 if(rel==='data/app-release.json'){const a=JSON.parse(value);a.version=a.release=version;return JSON.stringify(a);}
 if(rel==='index.html')return value.replaceAll(`app=${pkg.version}`,`app=${version}`);return value;}};
 const source=fs.readFileSync(path.join(__dirname,'v0817-card-action-hydration.test.js'),'utf8');
 vm.runInNewContext(source,{require:n=>n==='fs'?mockFs:require(n),__dirname,console:{log(){}}});
}
assert.equal(JSON.parse(fs.readFileSync(path.join(root,'data/app-release.json'))).version,pkg.version);
console.log('Current and next-patch release both preserve v0.81.7 behavioural gate');
