const fs=require('fs'),path=require('path');
exports.expectedHash=(file,original)=>{
 const m=JSON.parse(fs.readFileSync(path.join(__dirname,'../../validation/lung-cytotoxic-v08429/retrospective-hashes.json'),'utf8'));
 const change=m.files[file];if(!change)return require('./retrospective-v08430.cjs').expectedHash(file,original);
 const code=file.match(/^(?:patient|docs\/patient|data\/patient-knowledge|data\/patient-knowledge-contexts)\/(\d{5})(?:\/|\.json$)/)?.[1];
 if(!m.codes.includes(code))throw Error('Unapproved v29 migration '+file);
 if(change.before!==original)throw Error('Unexpected v29 original hash '+file);
 return require('./retrospective-v08430.cjs').expectedHash(file,change.after);
};
