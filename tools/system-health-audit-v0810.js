#!/usr/bin/env node
"use strict";
const fs=require("fs"),path=require("path"),crypto=require("crypto");
const root=path.resolve(__dirname,"..");
const read=rel=>fs.readFileSync(path.join(root,rel),"utf8");
const json=rel=>JSON.parse(read(rel));
const exists=rel=>fs.existsSync(path.join(root,rel));
const sha=rel=>crypto.createHash("sha256").update(fs.readFileSync(path.join(root,rel))).digest("hex");
function walk(dir){const out=[];if(!fs.existsSync(dir))return out;for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())out.push(...walk(p));else if(e.isFile())out.push(p);}return out;}
function bytesOf(dir){return walk(dir).reduce((s,p)=>s+fs.statSync(p).size,0);}

const report={release:"0.81.0",generated_at:new Date().toISOString(),critical:[],warnings:[],metrics:{}};
const pkg=json("package.json"),app=json("data/app-release.json");
report.metrics.release={package:pkg.version,app_version:app.version,app_release:app.release};
if(pkg.version!==app.version||app.release!==app.version)report.critical.push("Public release schema/version mismatch");

const index=json("protocols/index.json"),protocolEntries=(index.protocols||[]).filter(x=>x?.enabled!==false);
report.metrics.protocols={count:protocolEntries.length,json_bytes:protocolEntries.reduce((s,x)=>{const p=path.join(root,x.path||"");return s+(fs.existsSync(p)?fs.statSync(p).size:0);},0)};
if(protocolEntries.length<1)report.critical.push("No enabled protocols in protocol index");

if(exists("data/clinical-validation-register-v0630.json")){
  const v=json("data/clinical-validation-register-v0630.json"),rows=v.protocols||[];
  report.metrics.validation={protocols:rows.length,tissue_contexts:v.tissue_context_count||null,source_document_checked:rows.filter(x=>x.source_document_checked).length,software_tests_completed:rows.filter(x=>x.software_tests_completed).length,formal_consultant_reviewed:rows.filter(x=>x.formal_consultant_reviewed).length,formal_pharmacy_reviewed:rows.filter(x=>x.formal_pharmacy_reviewed).length};
  if(report.metrics.validation.formal_consultant_reviewed<rows.length)report.warnings.push("Formal consultant review remains incomplete; do not label the library clinically validated.");
  if(report.metrics.validation.formal_pharmacy_reviewed<rows.length)report.warnings.push("Formal oncology-pharmacy review remains incomplete; do not label the library clinically validated.");
}
if(exists("data/regimen-card-metadata.json")){
  const m=json("data/regimen-card-metadata.json"),rows=m.protocols||[];
  report.metrics.regimen_card_metadata={records:rows.length,complete:rows.filter(x=>x.complete).length,incomplete:rows.filter(x=>!x.complete).length};
}
if(exists("data/regimen-knowledge-base-v0680.json")){
  const k=json("data/regimen-knowledge-base-v0680.json");
  report.metrics.knowledge={release:k.release,drug_profiles:(k.drug_profiles||[]).length,regimen_profiles:(k.regimen_profiles||[]).length,evidence_records:(k.evidence_records||[]).length};
}
const html=read("index.html");
report.metrics.landing={bytes:Buffer.byteLength(html),script_tags:(html.match(/<script\b/gi)||[]).length,external_scripts:(html.match(/<script[^>]+\bsrc=/gi)||[]).length,inline_scripts:(html.match(/<script(?![^>]*\bsrc=)[^>]*>/gi)||[]).length,stylesheets:(html.match(/<link[^>]+rel=["']stylesheet/gi)||[]).length};
report.metrics.repository={js_files:walk(path.join(root,"js")).filter(p=>p.endsWith(".js")).length,test_files:walk(path.join(root,"tests")).filter(p=>p.endsWith(".js")).length,patient_bytes:bytesOf(path.join(root,"patient")),docs_patient_bytes:bytesOf(path.join(root,"docs","patient"))};

const registry=require(path.join(root,"js","patient-asset-registry-v0810.js"));
report.metrics.patient_registry={codes:registry.codes.length,content_release:registry.contentRelease};
const protectedManifest=json("data/protected-patient-assets-v0810.json");
for(const code of registry.codes){
  for(const file of ["index.html","guide.pdf","passport.pdf"]){
    const rel=`patient/${code}/${file}`;
    if(!exists(rel))report.critical.push(`Missing canonical patient asset ${rel}`);
    else if(protectedManifest.assets?.[code]?.[file]?.sha256!==sha(rel))report.critical.push(`Protected patient asset drift: ${rel}`);
  }
  for(const file of ["guide.pdf","passport.pdf"]){
    const a=`patient/${code}/${file}`,b=`docs/patient/${code}/${file}`;
    if(exists(a)&&exists(b)&&sha(a)!==sha(b))report.critical.push(`Compatibility PDF drift: ${code}/${file}`);
  }
}
const patientSrc=read("js/patient-support-v0750.js"),workflow=read("js/regimen-workflow-engine-v0750.js");
if(patientSrc.indexOf("registry?.hasDedicated?.(protocol)")<0||patientSrc.indexOf("registry?.hasDedicated?.(protocol)")>patientSrc.indexOf('root.open?.("about:blank"'))report.critical.push("Dedicated patient guide guard does not precede dynamic renderer");
if(workflow.includes("DEDICATED_PATIENT_PIPELINES"))report.critical.push("Workflow still owns a duplicate dedicated patient route table");
if(!html.includes("runtime-performance-v0810.js")||html.indexOf("runtime-performance-v0810.js")>html.indexOf("protocol-loader.js"))report.critical.push("Runtime cache supervisor does not load before protocol loader");
if(!html.includes("patient-asset-registry-v0810.js")||html.indexOf("patient-asset-registry-v0810.js")>html.indexOf("patient-support-v0750.js"))report.critical.push("Patient registry does not load before patient support");
const notFound=read("404.html");for(const code of registry.codes)if(!notFound.includes(code))report.critical.push(`404 compatibility routing missing ${code}`);

console.log(JSON.stringify(report,null,2));
if(process.argv.includes("--write"))fs.writeFileSync(path.join(root,"SYSTEM_HEALTH_v0.81.0.json"),JSON.stringify(report,null,2)+"\n");
if(report.critical.length)process.exit(1);
