const assert=require('assert');const fs=require('fs');const path=require('path');const root=path.join(__dirname,'..');
const index=JSON.parse(fs.readFileSync(path.join(root,'protocols/index.json'),'utf8'));
assert.equal(index.protocol_count,88);
const codes=['00254','00381','00378','00377','00262','00376','00371','00720','00749','00815','00203','00202','00423','00205','00263','00228','00743','00322','00361','00269'];
for(const code of codes){const entries=index.protocols.filter(e=>e.id.startsWith(`nccp-${code}-`));assert.equal(entries.length,1,`${code} must appear exactly once`);const p=JSON.parse(fs.readFileSync(path.join(root,entries[0].path),'utf8'));assert.equal(p.metadata.nccp_regimen_code,code);assert.ok(p.metadata.source_url.startsWith('https://healthservice.hse.ie/documents/'));assert.equal(p.required_inputs.length,0);}
assert.equal(new Set(index.protocols.map(e=>e.id)).size,index.protocol_count);assert.equal(new Set(index.protocols.map(e=>e.path)).size,index.protocol_count);
console.log('v0.35.0 breast batch tests passed');
