'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const m=require('../tests/helpers/retrospective-v08462.cjs');
const args=['-C',m.ROOT];
const git=(more)=>cp.execFileSync('git',[...args,...more],{maxBuffer:16*1024*1024}).toString().split('\0').filter(Boolean);
const paths=[...new Set([...git(['diff','--name-only','-z',m.BASE_COMMIT,'--']),...git(['ls-files','--others','--exclude-standard','-z'])])].sort();
const files={};
for(const f of paths){
 if(f==='validation/durvalumab-v08462/asset-migrations.json'||f==='tests/helpers/retrospective-v08462.cjs')continue;
 if(!m.approvedPath(f))throw Error('Unapproved change: '+f);
 const content=fs.readFileSync(path.join(m.ROOT,f));
 const base=m.before(f);const after=m.sha(content);if(after===base.before)continue;
 files[f]={...base,after,after_bytes:content.length};
}
const raw=Buffer.from(JSON.stringify({schema_version:1,release:'0.84.62',base_release:'0.84.61',base_commit:m.BASE_COMMIT,base_tree:m.BASE_TREE,new_routes:m.NEW_ROUTES,files},null,2)+'\n');
if(process.argv.includes('--write'))fs.writeFileSync(m.RECORD,raw);
else if(!fs.existsSync(m.RECORD)||!fs.readFileSync(m.RECORD).equals(raw))throw Error('Current outputs differ from reviewed record; use --write only after inspection.');
console.log(m.sha(raw)+'  '+Object.keys(files).length+' source-authenticated changes');
