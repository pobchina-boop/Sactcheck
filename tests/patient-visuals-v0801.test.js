const fs=require("fs"),path=require("path"),assert=require("assert");
const root=path.resolve(__dirname,"..");
const expected={
  "00209":["organ-bodymap","BOWEL + 46-HOUR INFUSION","HOME PUMP"],
  "00568":["organ-bodymap","LUNGS + AIRWAYS"],
  "00857":["organ-bodymap","BREAST + LYMPH NODES"],
  "00722":["organ-bodymap","BREAST + HER2 TARGET"],
  "00382":["organ-bodymap","BOWEL + ORAL TREATMENT"],
  "00619":["organ-bodymap","BREAST + ONGOING TABLETS"]
};
for(const [code,needles] of Object.entries(expected)){
  const html=fs.readFileSync(path.join(root,"docs/patient",code,"index.html"),"utf8");
  for(const needle of needles)assert(html.includes(needle),`${code} missing ${needle}`);
  assert(html.includes("pipeline-v0800.css?v=0.80.1"),`${code} missing visual cache key`);
}
const support=fs.readFileSync(path.join(root,"js/patient-support-v0750.js"),"utf8");
const css=fs.readFileSync(path.join(root,"css/sactcheck-interface-v0750.css"),"utf8");
for(const code of Object.keys(expected))assert(support.includes(`"${code}":{`),`in-app visual missing ${code}`);
assert(support.includes('if(regimenMap) return regimenMap;'),"specific maps must resolve before generic fallback");
assert(support.includes('return `https://sactcheck.com/docs/patient/${code}/`;'),"QR and copied links must target the published dedicated portal path");
assert(!support.includes('https://sactcheck.com/patient/${code}/'),"stale /patient/ QR destination must not return");
assert(support.includes('return `https://api.qrserver.com/v1/create-qr-code/?size=210x210&margin=8&data=${encodeURIComponent(link)}`;'),"QR image must encode the resolved regimen link");
assert(css.includes(".patient-regimen-map")&&css.includes(".prm-anatomy"),"in-app map styling missing");
assert(fs.readFileSync(path.join(root,"js/sactcheck-release.js"),"utf8").includes('RELEASE="0.80.1"'));
console.log("v0.80.1 patient-specific anatomy checks passed");
