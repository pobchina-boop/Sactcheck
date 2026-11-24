'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const astra = '51bded8c59210c052873b577af444f07579fd44f';
const sarcoma = '51bded8c59210c052873b577af444f07579fd44f';
const filename = 'validation/olaparib-source-20261124/release-files.json';
const ownFile = 'tests/helpers/live-release-v08464.cjs';
const pin = 'fb3d26a8911ffe39b95bf088a4512c2105cfa769390b43810232ae9f27a4b49f';
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const blob = b => crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
const git = args => execFileSync('git', args, {cwd: root, maxBuffer: 128*1024*1024});
const raw = fs.readFileSync(path.join(root, filename));
assert.equal(sha(raw), pin, 'Verified olaparib source refresh');
const record = JSON.parse(raw);
assert.equal(record.base, sarcoma);
assert.equal(sha(fs.readFileSync(__filename,'utf8').replace(/^const pin = '[^']+';/m,"const pin = 'PENDING';")),record.helper_sha256);
const changed = new Map();
const diff = git(['diff','--no-renames','--raw','--no-abbrev','-z',astra,sarcoma]).toString().split('\0');
for(let i=0;i<diff.length-1;i+=2){
  const parts=diff[i].split(' ');
  changed.set(diff[i+1],{before:parts[2],after:parts[3]});
}
const empty='0'.repeat(40), cache = new Map();
function fromGit(id){
  if(!id || id===empty)return {sha256:null, bytes:null};
  if(!cache.has(id)){
    const b=git(['cat-file','blob',id]);
    cache.set(id,{sha256:sha(b),bytes:b.length});
  }
  return cache.get(id);
}
function entries(file){
  const steps=[];
  if(changed.has(file))steps.push(changed.get(file));
  if(record.files[file])steps.push(record.files[file]);
  return steps;
}
function expected(file,digest,size){
  const steps=entries(file);
  if(!steps.length)return {sha256:digest,bytes:size};
  const ids=[steps[0].before,...steps.map(step=>step.after)];
  const known=ids.map(fromGit).find(r=>r.sha256===digest && (size===undefined||r.bytes===size));
  assert(known,file+' unknown origin for current release');
  return fromGit(ids.at(-1));
}
function isCurrent(file,digest,size){
  const steps=entries(file);
  if(!steps.length)return false;
  const final=fromGit(steps.at(-1).after);
  return final.sha256===digest && (size===undefined || final.bytes===size);
}
function verifyFile(file){
  const steps=entries(file);
  if(!steps.length)return;
  const next=steps.at(-1).after;
  if(next===empty){assert(!fs.existsSync(path.join(root,file)),file+' was removed');return;}
  assert.equal(blob(fs.readFileSync(path.join(root,file))),next,file+' reviewed release bytes');
}
function owns(file){
  if(file===filename||file===ownFile)return true;
  if(!changed.has(file)&&!Object.hasOwn(record.files,file))return false;
  verifyFile(file);
  return true;
}
function addition(file){return file===filename||file===ownFile||entries(file)[0]?.before===empty;}
function astraBytes(file){
  const archived = git(['show',astra+':'+file]);
  if(entries(file).length) verifyFile(file);
  else assert(fs.readFileSync(path.join(root,file)).equals(archived), file+' byte-identical to its AstraZeneca checkpoint');
  return archived;
}
function astraJson(file){return JSON.parse(astraBytes(file));}
function approvedJson(file){
  verifyFile(file);
  return JSON.parse(fs.readFileSync(path.join(root,file)));
}
module.exports={isCurrent,expected,owns,addition,verifyFile,astraBytes,astraJson,approvedJson,record};
