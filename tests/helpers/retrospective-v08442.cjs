'use strict';
const fs=require('fs'),path=require('path'),R=path.resolve(__dirname,'../..'),SHA=/^[a-f0-9]{64}$/;
const BASE_COMMIT='cd94a2043d59da86ffec3dbb63ac49df6399e112';
const CODES=['00102','00105','00237','00373','00464','00535','00551'];
const PROTOCOLS=new Set(['protocols/index.json','protocols/skin/00102-vemurafenib-monotherapy.json','protocols/skin/00105-ipilimumab-monotherapy.json','protocols/skin/00237-dabrafenib-monotherapy.json','protocols/skin/00373-cobimetinib-and-vemurafenib-therapy.json','protocols/skin/00464-dacarbazine-therapy.json','protocols/genitourinary/00535-avelumab-monotherapy.json','protocols/shared/00551-nivolumab-3-mg-kg-with-ipilimumab-1-mg-kg-therapy.json']);
function safe(f){return typeof f==='string'&&!f.startsWith('/')&&!f.includes('\\')&&!f.includes('\0')&&!f.split('/').some(s=>!s||s==='.'||s==='..');}
function approvedPath(f){
 if(!safe(f))return false;if(PROTOCOLS.has(f))return true;
 if(/^data\/patient-knowledge\/(00102|00105|00237|00373|00464|00535)\.json$/.test(f))return true;
 if(/^data\/patient-knowledge-contexts\/(00535\/merkel_cell|00551\/melanoma)\.json$/.test(f))return true;
 const m=f.match(/^(?:patient|docs\/patient)\/(\d{5})\/(.+)$/);if(!m||!CODES.includes(m[1]))return false;
 if(m[1]==='00551')return /^melanoma\/[a-z0-9_-]+\.(html|pdf|png)$/.test(m[2])||m[2]==='scope.html';
 if(m[1]==='00535')return /^merkel_cell\/[a-z0-9_-]+\.(html|pdf|png)$/.test(m[2])||['scope.html','index.html'].includes(m[2]);
 return /^[a-z0-9_-]+\.(html|pdf|png)$/.test(m[2]);
}
let entries;
function expectedHash(f,h){if(!safe(f))throw Error('Unsafe v42 path');if(!entries){const d=JSON.parse(fs.readFileSync(path.join(R,'validation/skin-melanoma-v08442/retrospective-hashes.json')));if(d.release!=='0.84.42'||d.base_release!=='0.84.41'||d.base_commit!==BASE_COMMIT||JSON.stringify(d.codes)!==JSON.stringify(CODES))throw Error('Invalid v42 migration scope');for(const [p,v]of Object.entries(d.files))if(!approvedPath(p)||!(v.before===null||SHA.test(v.before))||!SHA.test(v.after)||v.before===v.after)throw Error('Invalid v42 migration '+p);entries=d.files;}const v=entries[f];if(!v)return h;if(h!==v.before&&h!==v.after)throw Error('Unexpected v42 baseline '+f);return v.after;}
function expectedBuilderHash(f,h){if(!safe(f)||!/^tools\/[a-zA-Z0-9_-]+\.(cjs|js|py)$/.test(f))throw Error('Unsafe v42 builder');const d=JSON.parse(fs.readFileSync(path.join(R,'validation/skin-melanoma-v08442/shared-builder-revisions.json'))),v=d[f];if(!v)return h;if(h!==v.before||!SHA.test(v.after))throw Error('Unexpected v42 builder baseline '+f);return v.after;}
module.exports={expectedHash,expectedBuilderHash,approvedPath,BASE_COMMIT,CODES};
