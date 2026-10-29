const fs=require('fs'),path=require('path');
exports.expectedHash=(file,original)=>{
 const m=JSON.parse(fs.readFileSync(path.join(__dirname,'../../validation/lung-next-v08426/retrospective-hashes.json'),'utf8'));
 const change=m.files[file];if(!change)return original;
 const code=file.match(/^(?:patient|docs\/patient|data\/patient-knowledge)\/(\d{5})(?:\/|\.json$)/)?.[1];
 if(!m.scope.retrospective_codes.includes(code))throw Error('Unapproved v0.84.26 migration '+file);
 if(change.before!==original)throw Error('Unexpected v0.84.26 original hash '+file);
 return change.after;
};
