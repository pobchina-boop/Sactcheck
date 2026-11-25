'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname,'../..');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const raw = fs.readFileSync(path.join(root,'validation/sarcoma-integration/remaining-patient-files.json'));
assert.equal(sha(raw),'5db880ac7954167218df00b444d36e2491f898b3702b1c27d8f0f33c01767ae7');
const record = JSON.parse(raw);
const NEW_ROUTES = record.routes;
function approvedPath(file) {
  if (!Object.hasOwn(record.files,file)) return false;
  assert(NEW_ROUTES.some(route=>['patient/','docs/patient/'].some(p=>path.dirname(file)===p+route)));
  const current=fs.readFileSync(path.join(root,file));
  assert.equal(current.length,record.files[file].after_bytes,file);
  assert.equal(sha(current),record.files[file].after,file);
  return true;
}
function verify(){ for(const file of Object.keys(record.files)) assert(approvedPath(file)); }
const expectedHash = (file,previous) => record.files[file]?.after ?? previous;
const expectedBytes = (file,previous) => record.files[file]?.after_bytes ?? previous;
module.exports = {record,NEW_ROUTES,approvedPath,expectedHash,expectedBytes,verify};
