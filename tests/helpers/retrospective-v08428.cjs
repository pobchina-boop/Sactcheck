const fs=require('fs'),path=require('path');
exports.expectedHash=(file,original)=>{
 const m=JSON.parse(fs.readFileSync(path.join(__dirname,'../../validation/lung-backbones-v08428/retrospective-hashes.json'),'utf8'));
 const change=m.files[file];if(!change)return original;
 const code=file.match(/^(?:patient|docs\/patient|data\/patient-knowledge|data\/patient-knowledge-contexts)\/(\d{5})(?:\/|\.json$)/)?.[1];
 if(!m.codes.includes(code))throw Error('Unapproved v28 patient migration '+file);
 if(change.before!==original)throw Error('Unexpected v28 original hash '+file);
 return change.after;
};
