#!/usr/bin/env node
'use strict';
// Records an explicitly scoped candidate against the immutable complete v43
// package. Separate content, source, visual, PDF and provenance tests verify it.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const m=require('../tests/helpers/retrospective-v08444.cjs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
if(process.argv.slice(2).join(' ')!=='--write')throw Error('Render, review and validate the candidate, then use --write.');
const candidates=new Set([...m.BASE_FILES.keys()].filter(m.approvedPath));
for(const p of m.SHARED_PATHS)candidates.add(p);
for(const route of m.ROUTES)for(const base of ['patient','docs/patient']){
 const dir=path.join(m.ROOT,base,route);if(!fs.existsSync(dir))continue;
 for(const name of fs.readdirSync(dir)){const file=path.posix.join(base,route,name);if(m.approvedPath(file))candidates.add(file);}
}
function collectAssets(directory){for(const entry of fs.readdirSync(path.join(m.ROOT,directory),{withFileTypes:true})){const f=directory+'/'+entry.name;if(entry.isDirectory())collectAssets(f);else if(m.approvedPath(f))candidates.add(f);}}
collectAssets('assets/patient');
const files={};
for(const file of [...candidates].sort()){
 const old=m.BASE_FILES.get(file),p=path.join(m.ROOT,file);
 if(!fs.existsSync(p)){if(old)throw Error('An existing patient asset was deleted: '+file);continue;}
 const bytes=fs.readFileSync(p),after=sha(bytes);if(after===old?.sha256)continue;
 files[file]={before:old?.sha256??null,before_bytes:old?.bytes??null,after,after_bytes:bytes.length};
}
const record={schema_version:1,release:'0.84.44',base_release:'0.84.43',base_commit:m.BASE_COMMIT,baseline_tree_sha:m.BASE_TREE,baseline_manifest_sha256:m.BASELINE_MANIFEST_SHA256,baseline_archive_sha256:m.BASELINE_ARCHIVE_SHA256,route_set_sha256:m.ROUTE_SET_SHA256,routes:m.ROUTES,status:'recorded',scope:'Patient editorial content, source replacement and document consolidation; clinician protocols, detailed anatomy artwork, wallet and QR assets remain protected.',files};
m.createMigration(record);fs.writeFileSync(m.RECORD,JSON.stringify(record,null,2)+'\n');
console.log(JSON.stringify({changed_files:Object.keys(files).length,added_files:Object.values(files).filter(v=>v.before===null).length,record:path.relative(m.ROOT,m.RECORD)},null,2));
