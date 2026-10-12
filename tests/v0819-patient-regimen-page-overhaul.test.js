'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const portal=read('patient/00568/index.html');
const manifest=JSON.parse(read('data/protected-patient-assets-v0810.json'));
for(const marker of [
  'Built around the current NCCP regimen',
  'One regimen, explained in context',
  'Three medicines. Different jobs.',
  'What to expect — without pretending every cycle follows a clock',
  'A picture of side effects',
  'Do not wait for the next appointment',
  'One page for each cycle',
  'KEYNOTE-189',
  'Official NCCP 00568 v5',
  'passport.html','passport.pdf','sactcard.html','sactcard.pdf','guide.pdf'
]) assert.ok(portal.includes(marker),`00568 patient reference page missing: ${marker}`);
for(const marker of [
  'data-hcc-pin="heart" style="left:52.5%;top:28.3%"',
  'data-hcc-pin="liver" style="left:43%;top:33%"',
  'data-hcc-pin="kidneys" style="left:39.5%;top:38.6%"',
  'data-hcc-pin="bowel" style="left:50%;top:44.5%"',
  'data-hcc-pin="vessels" style="left:61.5%;top:61.5%"'
]) assert.ok(portal.includes(marker),`00568 anatomy anchor missing: ${marker}`);
assert.ok(!portal.includes('knowledge.html'),'canonical patient route should no longer require a second knowledge-page navigation step');
assert.ok(!portal.includes('id="pk-start"')&&!portal.includes('id="pk-phase"')&&!portal.includes('data-day='),'date/day configurator must stay retired from the canonical patient page');
const p=path.join(root,'patient/00568/index.html');
const hash=crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
assert.equal(manifest.assets['00568']['index.html'].sha256,hash,'00568 protected index hash must match patient-page overhaul');
assert.equal(manifest.assets['00568']['index.html'].bytes,fs.statSync(p).size,'00568 protected index byte count must match patient-page overhaul');
console.log('00568 canonical patient page is a single scrollable NCCP-linked treatment reference with protected anatomy and no date configurator.');
