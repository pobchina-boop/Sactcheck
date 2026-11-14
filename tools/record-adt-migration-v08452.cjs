'use strict';
// Deliberate, explicit release-record generation. It never approves an out-of-scope file.
const fs=require('node:fs'),path=require('node:path'),m=require('../tests/helpers/retrospective-v08452.cjs');
const current=new Set(m.SHARED_PATHS.filter(f=>fs.existsSync(path.join(m.ROOT,f))));
function walk(d){for(const e of fs.readdirSync(path.join(m.ROOT,d),{withFileTypes:true})){const f=d+'/'+e.name;if(e.isDirectory())walk(f);else{if(!e.isFile())throw Error('Nonregular file '+f);current.add(f);}}}for(const d of m.PROTECTED_DOMAINS)walk(d);
const files={};for(const f of [...current].sort()){const b=fs.readFileSync(path.join(m.ROOT,f)),base=m.baselineFiles().get(f),after=m.sha(b);if(base && (base.sha256 ? after===base.sha256 : m.blobHash(b)===base.blob))continue;const before=m.beforeHash(f);if(before!==after){if(!m.approvedPath(f))throw Error('Unapproved change '+f);files[f]={before,before_bytes:m.baselineFiles().get(f)?.bytes??null,after,after_bytes:b.length};}}
const record={schema_version:1,release:'0.84.52',base_release:'0.84.51',base_commit:m.BASE_COMMIT,previous_migration_sha256:m.previousMigrationSha256,status:'recorded',routes:m.ROUTES,clinical_routes:m.CLINICAL_ROUTES,files};m.createMigration(record);fs.writeFileSync(m.RECORD,JSON.stringify(record,null,2)+'\n');console.log(JSON.stringify(m.verifyCurrent(record)));
