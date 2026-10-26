'use strict';
// Execute the real shared builders with authored input substituted and ALL writes
// redirected into this audit-owned directory. Never mutates shared/live files.
const fs=require('fs'),path=require('path'),Module=require('module');
const root=path.resolve(__dirname,'../../..'),out=path.join(__dirname,'render-check'),author=JSON.parse(fs.readFileSync(path.join(__dirname,'authoring.json')));
const map=p=>{const rel=path.relative(root,String(p));if(rel.startsWith('..'))throw new Error('Unexpected write outside source root: '+p);return path.join(out,rel)};
const proxy={...fs,readFileSync(p,...args){const m=String(p).match(/data\/patient-knowledge\/(00576|00655)\.json$/);if(m)return JSON.stringify(author.regimens[m[1]].patient);return fs.readFileSync(p,...args)},writeFileSync(p,data,...args){const f=map(p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,data,...args)},mkdirSync(p,...args){return fs.mkdirSync(map(p),...args)}};
process.env.SACT_SUITE_CODES='00576,00655';
for(const name of ['build-patient-knowledge.cjs','build-complete-pathways.cjs']){const filename=path.join(root,'tools',name),m=new Module(filename,module);m.filename=filename;m.paths=Module._nodeModulePaths(path.dirname(filename));const req=m.require.bind(m);m.require=id=>id==='fs'||id==='node:fs'?proxy:req(id);m._compile(fs.readFileSync(filename,'utf8'),filename);}
for(const c of ['00576','00655'])for(const f of ['knowledge.html','index.html','guide.html','passport.html','consent-form.html','sactcard.html','treatment-journey.html']){const p=path.join(out,'patient',c,f);if(!fs.existsSync(p))throw new Error('Missing '+p);const text=fs.readFileSync(p,'utf8');if(/undefined/.test(text))throw new Error('Undefined rendered content in '+p);if(f==='knowledge.html'){if(/type="date"/.test(text))throw new Error('Unexpected patient date control');const ids=[...text.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);if(new Set(ids).size!==ids.length)throw new Error('Duplicate document anchors in '+p);}}
console.log('Durvalumab real-builder contract check passed; all writes bounded to render-check/.');
