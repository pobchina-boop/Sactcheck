'use strict';
const fs=require('fs'),path=require('path');
const read=f=>JSON.parse(fs.readFileSync(path.join(__dirname,'../../validation/colorectal-v08432',f),'utf8'));
exports.expectedHash=(file,original)=>{
 const m=read('retrospective-hashes.json'),change=m.files[file];if(!change)return require('./retrospective-v08433.cjs').expectedHash(file,original);
 const match=file.match(/^(?:patient|docs\/patient|data\/patient-knowledge|data\/patient-knowledge-contexts)\/(\d{5})(?:\/|\.json$)/);
 if(file.startsWith('protocols/')){if(file!=='protocols/index.json'&&!m.clinical_codes.includes(path.basename(file).slice(0,5)))throw Error('Unapproved v32 clinical migration '+file);}
 else if(!match||!m.codes.includes(match[1]))throw Error('Unapproved v32 patient migration '+file);
 if(change.before!==original)throw Error('Unexpected v32 original hash '+file);return require('./retrospective-v08433.cjs').expectedHash(file,change.after);
};
exports.expectedBuilderHash=(file,original)=>{const x=read('shared-builder-revisions.json')[file];if(!x)return require('./retrospective-v08433.cjs').expectedBuilderHash(file,original);if(x.before!==original)throw Error('Unexpected v32 original builder '+file);return require('./retrospective-v08433.cjs').expectedBuilderHash(file,x.after);};
