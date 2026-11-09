'use strict';
// Explicit content/editorial migration following the preserved v43 release.
// Original clinical protocol rules, anatomy artwork, wallets and QR assets
// never enter this migration. Every admitted change still needs exact hashes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'../..');
const BASE_COMMIT='67aaa3579794278074478b3f6cce4e57c803e4db';
const BASE_TREE='ba65db9ba843ef3d191f7acd5af2b195f453e229';
const BASELINE_MANIFEST_SHA256='28613ca9d5ffb714046619242cf04319a19dfc7e30cdb8ef765d5194b1ac9b43';
const BASELINE_ARCHIVE_SHA256='827bd97fb72542feab0d2ebbbefa630876e9eddff7c547764c94bfce38f67e84';
const BASELINE=path.join(ROOT,'validation/patient-design-v08444/baseline-v08443-package-manifest.json');
const RECORD=path.join(ROOT,'validation/patient-design-v08444/asset-migrations.json');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const raw=fs.readFileSync(BASELINE);
if(sha(raw)!==BASELINE_MANIFEST_SHA256)throw Error('The pinned complete v43 package manifest changed');
const baseline=JSON.parse(raw);
if(baseline.release!=='0.84.43'||baseline.baseline_commit!==BASE_COMMIT||baseline.file_count!==14755)throw Error('Unexpected v44 baseline package');
const BASE_FILES=new Map(baseline.files.map(f=>[f.path,Object.freeze({...f})]));
const scope=JSON.parse(fs.readFileSync(path.join(ROOT,'validation/patient-design-v08443/scope.json'),'utf8'));
const ROUTES=Object.freeze([...scope.routes]);
const ROUTE_SET_SHA256='73a7a58b514aec07a6392406328f63a84b1ac0311c3c55c4f9607f8af1175657';
if(ROUTES.length!==228||sha(ROUTES.join('\n')+'\n')!==ROUTE_SET_SHA256)throw Error('Changed v44 treatment route scope');
const routeSet=new Set(ROUTES);
const FILE_NAMES=Object.freeze(['index.html','guide.html','guide.pdf','knowledge.html','knowledge-print.html','knowledge.pdf','handbook.pdf','passport.html','passport.pdf','treatment-journey.html','treatment-journey.pdf','logistics.html','logistics.pdf','supportive-care.html','supportive-care.pdf','supportive-care-overview.html','consent.html']);
const fileNames=new Set(FILE_NAMES);
const SHARED_PATHS=Object.freeze([
 'assets/patient/patient-handbook-v08444.css',
 'assets/patient/patient-distilled-print-v08444.css',
 'assets/patient/patient-visual-language-v08444.css',
 'assets/patient/patient-visual-standard-v08443.css',
 'data/patient-document-sections-v08444.json',
 'validation/patient-design-v08444/companion-content-retention.json.gz',
 'validation/patient-design-v08444/document-build-staged.json.gz',
 'validation/patient-design-v08444/document-build.json.gz',
 'validation/patient-design-v08444/evidence-storage.json',
 'js/patient-asset-registry-v0810.js',
 'tools/build-patient-documents-v08444.py',
 'tools/verify-patient-documents-v08444.py',
 'tools/patient-evidence-storage-v08444.py',
 'tools/render-patient-ancillary-v08444.py',
 'tools/verify-patient-ancillary-v08444.py',
 'tools/patient-editorial-v08444.cjs',
 'tools/patient-editorial-replacements-v08444.json',
 'tools/author-patient-editorial-v08444.py',
 'tools/patient-visual-language-v08444.cjs',
 'tools/patient-publication-v08444.cjs',
 'tools/patient-suite-context-v08425.cjs',
 'tools/build-patient-knowledge.cjs',
 'tools/build-complete-pathways.cjs',
 'tools/build-phase-support-v0838.cjs',
 'tools/refresh-patient-ui.cjs',
 'tools/neuroendocrine-passport-v08437.cjs',
 'tools/glioma-passport-v08438.cjs',
 'tools/patient-pack-v08437.cjs',
 'tools/patient-pack-v08440.cjs'
]);
const shared=new Set(SHARED_PATHS);
function safeRelative(f){return typeof f==='string'&&!f.startsWith('/')&&!f.includes('\\')&&!f.includes('\0')&&!f.split('/').some(x=>!x||x==='.'||x==='..');}
function approvedPath(f){
 if(!safeRelative(f))return false;
 if(shared.has(f))return true;
 if(/^assets\/patient\/[a-z0-9_-]+-v08444\.svg$/.test(f))return true;
 if(/^assets\/patient\/visual-language-v08444\/(?:[a-z0-9_-]+\.svg|provenance\.json)$/.test(f))return true;
 if(/^data\/patient-knowledge(?:-contexts)?\/(?:\d{5}\/)?[a-z0-9_]+\.json$/.test(f))return BASE_FILES.has(f);
 const m=f.match(/^(?:patient|docs\/patient)\/(\d{5}(?:\/[a-z0-9_]+)?)\/([^/]+)$/);
 return Boolean(m&&routeSet.has(m[1])&&(fileNames.has(m[2])||/^support-[a-z0-9_-]+\.(?:html|pdf)$/.test(m[2])));
}
function createMigration(record){
 if(!record||record.schema_version!==1||record.release!=='0.84.44'||record.base_release!=='0.84.43'||record.base_commit!==BASE_COMMIT||record.baseline_tree_sha!==BASE_TREE||record.baseline_manifest_sha256!==BASELINE_MANIFEST_SHA256||record.baseline_archive_sha256!==BASELINE_ARCHIVE_SHA256||record.route_set_sha256!==ROUTE_SET_SHA256||record.status!=='recorded'||JSON.stringify(record.routes)!==JSON.stringify(ROUTES)||!record.files||Array.isArray(record.files)||!Object.keys(record.files).length)throw Error('Invalid reviewed v44 content migration record');
 const changes=new Map();
 for(const [file,c]of Object.entries(record.files)){
  if(!approvedPath(file))throw Error('Unapproved v44 content migration path '+file);
  const old=BASE_FILES.get(file);
  if(!c||c.before!==(old?.sha256??null)||c.before_bytes!==(old?.bytes??null)||!/^[a-f0-9]{64}$/.test(c.after)||c.after===c.before||!Number.isSafeInteger(c.after_bytes)||c.after_bytes<=0)throw Error('Invalid v44 reviewed hash transition '+file);
  changes.set(file,Object.freeze({...c}));
 }
 return function migrate(file,original){
  if(!safeRelative(file))throw Error('Unsafe v44 migration lookup '+file);
  const c=changes.get(file);if(!c)return original;
  if(original!==c.before&&original!==c.after)throw Error('Unexpected v44 original hash '+file);
  return c.after;
 };
}
let record,migrate;
function load(){if(!migrate){record=JSON.parse(fs.readFileSync(RECORD,'utf8'));migrate=createMigration(record);}}
function expectedHash(file,original){load();return require('./retrospective-v08445.cjs').expectedHash(file,migrate(file,original));}
function expectedBytes(file,bytes,original){load();migrate(file,original);const next=require('./retrospective-v08445.cjs');const c=record.files[file];if(!c)return next.expectedBytes(file,bytes,original);if(bytes!==(original===c.before?c.before_bytes:c.after_bytes))throw Error('Unexpected v44 original byte count '+file);return next.expectedBytes(file,c.after_bytes,c.after);}
function expectedBuilderHash(file,original){if(!safeRelative(file)||!/^tools\/[a-zA-Z0-9_-]+\.(cjs|js|py)$/.test(file))throw Error('Unsafe v44 builder lookup '+file);return expectedHash(file,original);}
module.exports={ROOT,BASE_COMMIT,BASE_TREE,BASELINE,BASELINE_MANIFEST_SHA256,BASELINE_ARCHIVE_SHA256,BASE_FILES,RECORD,ROUTES,ROUTE_SET_SHA256,FILE_NAMES,SHARED_PATHS,approvedPath,safeRelative,createMigration,expectedHash,expectedBytes,expectedBuilderHash};
