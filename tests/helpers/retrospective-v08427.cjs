const fs=require('fs'),path=require('path');
exports.expectedHash=(file,original)=>{
 const m=JSON.parse(fs.readFileSync(path.join(__dirname,'../../validation/lung-nivolumab-v08427/retrospective-hashes.json'),'utf8'));
 const change=m.files[file];if(!change)return require('./retrospective-v08428.cjs').expectedHash(file,original);
 const code=file.match(/^(?:patient|docs\/patient|data\/patient-knowledge)\/(\d{5})(?:\/|\.json$)/)?.[1];
 if(!m.scope.retrospective_codes.includes(code))throw Error('Unapproved v0.84.27 migration '+file);
 if(change.before!==original)throw Error('Unexpected v0.84.27 original hash '+file);
 return require('./retrospective-v08428.cjs').expectedHash(file,change.after);
};
