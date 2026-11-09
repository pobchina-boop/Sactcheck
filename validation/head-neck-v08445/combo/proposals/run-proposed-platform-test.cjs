'use strict';
const fs=require('fs'),path=require('path'),Module=require('module');
const root=path.resolve(__dirname,'../../../..');
const original=path.join(root,'tests/platform-standardisation-v0370.test.js');
const rawRead=fs.readFileSync.bind(fs);
const patch=JSON.parse(rawRead(path.join(__dirname,'grading-metadata-proposal.json'),'utf8'));
const useProposals=process.argv.includes('--metadata-proposals');
if(useProposals){
 fs.readFileSync=function(file,...args){
  const bytes=rawRead(file,...args);let entry;
  if(typeof file==='string')entry=Object.values(patch).find(p=>path.resolve(file)===path.join(root,p.file));
  if(!entry)return bytes;
  const d=JSON.parse(String(bytes));
  for(const [field,change]of Object.entries(entry.input_definitions)){for(const key of change.remove)delete d.input_definitions[field][key];Object.assign(d.input_definitions[field],change.set);}
  const text=JSON.stringify(d);return typeof bytes==='string'?text:Buffer.from(text);
 };
}
const m=new Module(original,module);m.filename=original;m.paths=Module._nodeModulePaths(path.dirname(original));
const originalRequire=m.require.bind(m);
m.require=function(id){return id==='./helpers/head-neck-grading-v08445.cjs'?require('./head-neck-grading-v08445.cjs'):originalRequire(id);};
try{m._compile(rawRead(path.join(__dirname,'platform-standardisation-v0370.test.js'),'utf8'),original);}finally{fs.readFileSync=rawRead;}
