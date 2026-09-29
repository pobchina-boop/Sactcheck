const fs=require("fs"),path=require("path"),assert=require("assert");
const root=path.resolve(__dirname,"..");
const wf=fs.readFileSync(path.join(root,"js/regimen-workflow-engine-v0750.js"),"utf8");
const codes=["00209","00568","00857","00722","00382","00619","00831"];
for(const code of codes){assert(wf.includes(`"${code}":"docs/patient/${code}/"`),`missing workflow route ${code}`);const p=path.join(root,"docs/patient",code,"index.html");assert(fs.existsSync(p),`missing pipeline ${code}`);const h=fs.readFileSync(p,"utf8");assert(/PATIENT PORTAL/i.test(h),`missing patient portal label ${code}`);assert(/passport/i.test(h),`missing passport ${code}`);assert(/When to call|when to call/i.test(h),`missing escalation ${code}`);assert(/NCCP/i.test(h),`missing source identity ${code}`);}
assert(wf.includes("openPatientPipeline(protocol)"));
assert(fs.readFileSync(path.join(root,"js/sactcheck-release.js"),"utf8").includes('RELEASE="0.80.0"'));

const index=fs.readFileSync(path.join(root,"index.html"),"utf8");
assert(index.includes('css/sactcheck-interface-v0750.css?app=0.80.0'),"workflow interface CSS is not loaded by index");
assert(index.includes('js/patient-support-v0750.js?app=0.80.0'),"patient support module is not loaded by index");
assert(index.includes('js/regimen-workflow-engine-v0750.js?app=0.80.0'),"workflow engine is not loaded by index");
const lonsurf=fs.readFileSync(path.join(root,"docs/patient/00382/index.html"),"utf8");
assert(lonsurf.includes('version 4'),"Lonsurf patient page must track current NCCP 00382 v4");
assert(lonsurf.includes('trifluridine_and_tipiracil_Lonsurf_therapy_382.pdf'),"Lonsurf official source route missing");
const abema=fs.readFileSync(path.join(root,"docs/patient/00619/index.html"),"utf8");
assert(abema.includes('version 4a'),"abemaciclib patient page must track current NCCP 00619 v4a");
assert(abema.includes('619_Abemaciclib.pdf'),"abemaciclib official source route missing");
const tchp=fs.readFileSync(path.join(root,"docs/patient/00722/index.html"),"utf8");
assert(tchp.includes('722_v2_TCHP.pdf'),"TCHP official source route missing");
const tnbc=fs.readFileSync(path.join(root,"docs/patient/00857/index.html"),"utf8");
assert(tnbc.includes('857_v3_Pembro_Carbo_5_Pacli_80_AC60_600.pdf'),"00857 official source route missing");

console.log("v0.80.0 patient pipeline routing/content checks passed");
