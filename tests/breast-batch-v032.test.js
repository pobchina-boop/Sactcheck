const fs=require('fs');const path=require('path');const assert=require('assert');
const root=path.join(__dirname,'..');
const codes=["00348", "00734", "00790", "00789", "00731", "00860", "00861", "00775", "00350", "00892"];
const idx=JSON.parse(fs.readFileSync(path.join(root,'protocols','index.json'),'utf8'));
const rows=Array.isArray(idx)?idx:idx.protocols;
for(const code of codes){const row=rows.find(x=>String(x.id).includes(code));assert(row,`Missing ${code} from index`);const p=JSON.parse(fs.readFileSync(path.join(root,row.path),'utf8'));assert.strictEqual(p.metadata.nccp_regimen_code,code);assert(p.metadata.source_url.startsWith('https://healthservice.hse.ie/documents/'));assert(Array.isArray(p.metadata.treatment_setting));}
assert.strictEqual(new Set(rows.map(x=>x.id)).size,rows.length,'Duplicate active IDs');assert.strictEqual(new Set(rows.map(x=>x.path)).size,rows.length,'Duplicate active paths');
console.log('v0.32 breast batch tests passed');
