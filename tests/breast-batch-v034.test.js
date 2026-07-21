const assert=require("assert");const fs=require("fs");const path=require("path");
const root=path.join(__dirname,"..");const index=JSON.parse(fs.readFileSync(path.join(root,"protocols/index.json"),"utf8"));
assert.ok(index.protocol_count>=68);
const codes=["00258", "00260", "00265", "00278", "00316", "00432", "00433", "00485", "00619", "00745"];
for(const code of codes){const entries=index.protocols.filter(e=>e.id.startsWith(`nccp-${code}-`));assert.equal(entries.length,1,`${code} must appear exactly once`);const p=JSON.parse(fs.readFileSync(path.join(root,entries[0].path),"utf8"));assert.equal(p.metadata.nccp_regimen_code,code);assert.ok(p.metadata.source_url.startsWith("https://healthservice.hse.ie/documents/"));assert.equal(p.required_inputs.length,0);}
assert.equal(new Set(index.protocols.map(e=>e.id)).size,index.protocol_count);assert.equal(new Set(index.protocols.map(e=>e.path)).size,index.protocol_count);
console.log("v0.35.0 breast batch tests passed");
