'use strict';
// Prepare a reviewable draft, never a recorded approval. It must be reviewed
// against source, content, PDF and browser evidence before publication.
const fs=require('fs'),path=require('path'),cp=require('child_process');
const local=path.join(__dirname,'retrospective-v08450.cjs');
const m=require(fs.existsSync(local)?local:path.join(__dirname,'../tests/helpers/retrospective-v08450.cjs'));
const args=process.argv.slice(2);if(args.length!==2||args[0]!=='--output')throw Error('Use --output validation/head-neck-v08450/<review-draft>.json after final assets are built.');
const out=path.resolve(m.ROOT,args[1]);if(out===m.RECORD||!out.startsWith(path.join(m.ROOT,'validation/head-neck-v08450')+path.sep))throw Error('Draft output must stay in v50 evidence and cannot be the recorded approval file');
const git=a=>cp.execFileSync('git',a,{cwd:m.ROOT,maxBuffer:128*1024*1024});
const domains=[...m.PROTECTED_DOMAINS,...m.SHARED_PATHS];
const names=a=>git(a).toString().split('\0').filter(Boolean);
const changed=[...new Set([...names(['diff','--name-only','-z',m.BASE_COMMIT,'--',...domains]),...names(['ls-files','--others','--exclude-standard','-z','--',...domains])])].sort();
const unapproved=changed.filter(f=>!m.approvedPath(f));if(unapproved.length)throw Error('Review scope before drafting; unapproved paths:\n'+unapproved.join('\n'));
const files={},base=m.baselineFiles();
for(const f of changed){
 const location=path.join(m.ROOT,f),stat=fs.lstatSync(location);if(!stat.isFile()||stat.isSymbolicLink())throw Error('Nonregular/deleted asset '+f);
 const after=fs.readFileSync(location),old=base.get(f),before=old?m.readFrozen(f):null;
 if(old&&(m.blobHash(before)!==old.blob||before.length!==old.bytes))throw Error('Baseline identity mismatch '+f);
 files[f]={before:before===null?null:m.sha(before),before_git_blob_sha1:old?.blob??null,before_bytes:old?.bytes??null,after:m.sha(after),after_bytes:after.length};
}
const record={schema_version:1,release:'0.84.50',base_release:'0.84.49',base_commit:m.BASE_COMMIT,baseline_tree_sha:m.BASE_TREE,status:'candidate_requires_review',route_set_sha256:m.ROUTE_SET_SHA256,clinical_route_set_sha256:m.CLINICAL_ROUTE_SET_SHA256,codes:m.CODES,clinical_routes:m.CLINICAL_ROUTES,routes:m.ROUTES,scope:'Five newly authored head-and-neck services and five retrospective services; the HNSCC-specific shared-protocol context only. Unrelated routes and detailed anatomical artwork remain protected.',files};
// Structural check uses a temporary status and does not assert review occurred.
m.createMigration({...record,status:'recorded'});
fs.writeFileSync(out,JSON.stringify(record,null,2)+'\n');
console.log(JSON.stringify({status:record.status,files:changed.length,new_files:Object.values(files).filter(c=>c.before===null).length,output:path.relative(m.ROOT,out)}));
