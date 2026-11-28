'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const prior = require('./gynae-batch9-checkpoint.cjs');
const root = path.resolve(__dirname, '../..');
const base = '15749dced473f0e3defab8f744a855e0fec08772';
const filename = 'validation/ovarian-v08474/production-transition.json';
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const raw = fs.readFileSync(path.join(root,filename));
assert.equal(hash(raw),'c713ac847287ba6f701da424639cb8a546b144b79e51f300616cc1df05f0fcfc');
const record = JSON.parse(raw);
assert.equal(record.base,base);
const files = record.files;
const historic = (revision,file) => cp.execFileSync('git',['show',revision+':'+file],{cwd:root,maxBuffer:64*1024*1024});
assert(fs.readFileSync(require.resolve('./gynae-batch9-checkpoint.cjs')).equals(historic(base,'tests/helpers/live-release-v08464.cjs')));
function verifyFile(file) {
  const transition = files[file];
  if (!transition) return prior.verifyFile(file);
  const value = fs.readFileSync(path.join(root,file));
  assert.equal(value.length,transition.after_bytes,file);
  assert.equal(hash(value),transition.after,file);
}
function isCurrent(file,digest,size) {
  const entry=files[file];
  return entry ? digest===entry.after && (size===undefined || entry.after_bytes===size) : prior.isCurrent(file,digest,size);
}
function expected(file,digest,size) {
  const entry=files[file];
  if (!entry) return prior.expected(file,digest,size);
  if (!isCurrent(file,digest,size)) {
    const old=prior.expected(file,digest,size);
    assert.equal(old.sha256,entry.before,file+' predecessor');
    if(old.bytes!==undefined)assert.equal(old.bytes,entry.before_bytes,file+' predecessor size');
  }
  return {sha256:entry.after,bytes:entry.after_bytes};
}
function archive(file,revision) {
  verifyFile(file);
  assert.equal(hash(historic(base,file)),files[file].before,file+' published predecessor');
  return historic(revision,file);
}
const astraBytes = file => files[file] ? archive(file,'51bded8c59210c052873b577af444f07579fd44f') : prior.astraBytes(file);
function approvedJson(file) {
  if (!files[file]) return prior.approvedJson(file);
  const prev=prior.sarcomaInventory();
  // Replay the same archived stage exposed by the preceding sarcoma helper.
  const revision=prev.record.files[file] ? '68063d01357a61bf5ec9dffcb7e6ccdc0145d2a7' : 'eb2bf4aa5b0e7a2de3b50c386517b68d1e059d7d';
  return JSON.parse(archive(file,revision));
}
function owns(file) {
  if (file===filename || file==='tests/helpers/gynae-batch9-checkpoint.cjs') return true;
  if (!files[file]) return prior.owns(file);
  verifyFile(file); return true;
}
const addition = file => file===filename || file==='tests/helpers/gynae-batch9-checkpoint.cjs' || files[file]?.before===null || prior.addition(file);
function checkedInventory(inventory) {
  return {...inventory,helper:{...inventory.helper,approvedPath(file) {
    if (files[file] && inventory.record.files[file]) {verifyFile(file); return true;}
    return inventory.helper.approvedPath(file);
  }}};
}
const gynaecologyInventory = () => checkedInventory(prior.gynaecologyInventory());
const sarcomaInventory = () => checkedInventory(prior.sarcomaInventory());
const gynae65Inventory = () => checkedInventory(prior.gynae65Inventory());
const startupInventory = () => checkedInventory(prior.startupInventory());
const gynae66Inventory = () => checkedInventory(prior.gynae66Inventory());
const flot67Inventory = () => checkedInventory(prior.flot67Inventory());
const gistPanelInventory = () => checkedInventory(prior.gistPanelInventory());
const gynae68Inventory = () => checkedInventory(prior.gynae68Inventory());
const gynae69Inventory = () => checkedInventory(prior.gynae69Inventory());
const gynae70Inventory = () => checkedInventory(prior.gynae70Inventory());
const gynae71Inventory = () => checkedInventory(prior.gynae71Inventory());
const gynae72Inventory = () => checkedInventory(prior.gynae72Inventory());
const gynae73Inventory = () => checkedInventory(prior.gynae73Inventory());
const gynae74Inventory = () => ({version:74,record,helper:{approvedPath:file => !!files[file] && owns(file)}});
module.exports = {...prior,verifyFile,expected,isCurrent,astraBytes,astraJson:file=>JSON.parse(astraBytes(file)),approvedJson,addition,owns,gynaecologyInventory,sarcomaInventory,gynae65Inventory,startupInventory,gynae66Inventory,flot67Inventory,gistPanelInventory,gynae68Inventory,gynae69Inventory,gynae70Inventory,gynae71Inventory,gynae72Inventory,gynae73Inventory,gynae74Inventory};
