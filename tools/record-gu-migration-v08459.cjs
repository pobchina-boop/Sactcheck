'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),m=require('../tests/helpers/retrospective-v08459.cjs');
const names=cp.execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{cwd:m.ROOT,maxBuffer:16*1024*1024}).toString().split('\0').filter(Boolean),files={};
for(const f of new Set(names)){
 if(f==='validation/gu-v08459/asset-migrations.json')continue;
 const bytes=fs.readFileSync(path.join(m.ROOT,f)),after=m.sha(bytes),before=m.beforeHash(f);
 if(after===before)continue;if(!m.approvedPath(f))throw Error('Unapproved change '+f);
 files[f]={before,before_bytes:m.baselineFiles().get(f)?.bytes??null,after,after_bytes:bytes.length};
}
const record={schema_version:1,release:'0.84.59',base_release:'0.84.58',base_commit:m.BASE_COMMIT,baseline_manifest_sha256:m.baselineManifestSha256,previous_migration_sha256:m.previousMigrationSha256,status:'recorded',routes:m.ROUTES,clinical_routes:m.CLINICAL_ROUTES,files};m.createMigration(record);fs.writeFileSync(m.RECORD,JSON.stringify(record,null,2)+'\n');console.log('Recorded '+Object.keys(files).length+' explicit transitions.');
