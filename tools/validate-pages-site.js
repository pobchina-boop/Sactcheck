#!/usr/bin/env node
"use strict";
const fs=require("fs"),path=require("path"),crypto=require("crypto");
const root=path.resolve(__dirname,".."),site=path.join(root,"_site");
const pkg=JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8"));
const registry=require(path.join(root,"js","patient-asset-registry-v0810.js"));
const codes=registry.codes;
const protectedManifest=JSON.parse(fs.readFileSync(path.join(root,"data","protected-patient-assets-v0810.json"),"utf8"));
const forbiddenTopLevel=[".git",".github","tests","tools","node_modules","package.json","SECURITY.md"];
const required=[
  "index.html","sustainability.html","manifest.webmanifest","js","css","protocols/index.json","404.html",
  "js/sactcheck-release.js","js/runtime-performance-v0810.js","js/patient-asset-registry-v0810.js",
  "js/patient-support-v0750.js","js/regimen-workflow-engine-v0750.js","js/ui-stability-v0810.js","js/antiemetic-print-v0810.js",
  "data/app-release.json","data/protected-patient-assets-v0810.json",
  "assets/patient/anatomy-hcc-v0762.png","assets/patient/toxicity-icons.svg","assets/patient/hcc-bodymap-v0763.css","assets/patient/hcc-connectors-v0763.js"
];
for(const code of codes){
  for(const f of ["index.html","guide.html","guide.pdf","passport.pdf"]) required.push(`patient/${code}/${f}`);
  for(const f of ["index.html","guide.html","guide.pdf","passport.pdf"]) required.push(`docs/patient/${code}/${f}`);
}
required.push("patient/00831/contact-card.pdf","docs/patient/00831/contact-card.pdf");
required.push("patient/00568/sactcard.html","patient/00568/sactcard.pdf","docs/patient/00568/sactcard.html","docs/patient/00568/sactcard.pdf");
const problems=[];
const sha=p=>crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
if(!fs.existsSync(site)) problems.push("_site directory does not exist");
for(const item of required) if(!fs.existsSync(path.join(site,item))) problems.push(`missing required public item: ${item}`);

if(fs.existsSync(path.join(site,"data/app-release.json"))){
  const app=JSON.parse(fs.readFileSync(path.join(site,"data/app-release.json"),"utf8"));
  if(!app.version||app.release!==app.version||app.version!==pkg.version){
    problems.push(`public app release schema/version is inconsistent (package=${pkg.version}, app.version=${app.version||"missing"}, app.release=${app.release||"missing"})`);
  }
  if(app.display_version&&app.display_version!==`v${pkg.version}`){
    problems.push(`public display_version does not match package version (${app.display_version} vs v${pkg.version})`);
  }
}
const supportPath=path.join(site,"js","patient-support-v0750.js");
if(fs.existsSync(supportPath)){
  const support=fs.readFileSync(supportPath,"utf8");
  if(!support.includes("root.SACTCheckPatientAssets")) problems.push("patient support does not use canonical patient asset registry");
  const guard=support.indexOf("registry?.hasDedicated?.(protocol)"),blank=support.indexOf('root.open?.("about:blank"');
  if(guard<0||blank<0||guard>blank) problems.push("dedicated patient guides are not protected ahead of legacy dynamic rendering");
}
const workflowPath=path.join(site,"js","regimen-workflow-engine-v0750.js");
if(fs.existsSync(workflowPath)){
  const workflow=fs.readFileSync(workflowPath,"utf8");
  if(workflow.includes("DEDICATED_PATIENT_PIPELINES")) problems.push("workflow retains a second patient-route registry");
  if(!workflow.includes("WORKFLOW_DATA_RELEASE=\"0.78.0\"")) problems.push("workflow data contract is not explicitly separated from app release");
}
const indexPath=path.join(site,"index.html");
if(fs.existsSync(indexPath)){
  const html=fs.readFileSync(indexPath,"utf8");
  const ordered=["runtime-performance-v0810.js","patient-asset-registry-v0810.js","patient-support-v0750.js","regimen-workflow-engine-v0750.js","sactcheck-interface-v0750.js","ui-stability-v0810.js","antiemetic-print-v0810.js","protocol-loader.js"];
  let last=-1;for(const token of ordered){const pos=html.indexOf(token);if(pos<0)problems.push(`bootstrap missing ${token}`);else if(pos<last)problems.push(`bootstrap order invalid at ${token}`);last=Math.max(last,pos);}
}
for(const code of codes){
  const canonical=path.join(site,"patient",code);
  const compat=path.join(site,"docs","patient",code);
  const htmlPath=path.join(canonical,"index.html");
  if(fs.existsSync(htmlPath)){
    const html=fs.readFileSync(htmlPath,"utf8");
    if(!html.includes(`https://sactcheck.com/patient/${code}/`)) problems.push(`patient/${code} does not identify canonical public destination`);
    if(!html.includes("anatomy-hcc-v0762.png")||!html.includes("hcc-visual-stage")) problems.push(`patient/${code} lost protected anatomy format`);
  }
  const compatIndex=path.join(compat,"index.html");
  if(fs.existsSync(compatIndex)&&!fs.readFileSync(compatIndex,"utf8").includes(`https://sactcheck.com/patient/${code}/`)) problems.push(`docs/patient/${code} does not redirect to canonical portal`);
  for(const file of ["guide.pdf","passport.pdf",...(code==="00568"?["sactcard.pdf"]:[])]){
    const a=path.join(canonical,file),b=path.join(compat,file);
    if(fs.existsSync(a)&&fs.existsSync(b)&&sha(a)!==sha(b)) problems.push(`compatibility ${file} drift for ${code}`);
    const fixture=protectedManifest.assets?.[code]?.[file];
    if(fs.existsSync(a)&&fixture&&sha(a)!==fixture.sha256) problems.push(`protected canonical ${code}/${file} changed without fixture update`);
  }
}
const p568=path.join(site,"patient","00568","guide.pdf");
if(fs.existsSync(p568)&&fs.statSync(p568).size<800000) problems.push("00568 guide appears downgraded from approved rich anatomy asset");
const nf=path.join(site,"404.html");if(fs.existsSync(nf)){const h=fs.readFileSync(nf,"utf8");for(const code of codes)if(!h.includes(code))problems.push(`404 compatibility map missing ${code}`);}
for(const item of forbiddenTopLevel) if(fs.existsSync(path.join(site,item))) problems.push(`forbidden development item exposed: ${item}`);
function walk(directory){if(!fs.existsSync(directory))return;for(const entry of fs.readdirSync(directory,{withFileTypes:true})){const absolute=path.join(directory,entry.name),relative=path.relative(site,absolute).replaceAll(path.sep,"/");if(entry.isDirectory())walk(absolute);else if(/\.(?:pem|p12|pfx|key)$/i.test(entry.name)||/^\.env/i.test(entry.name))problems.push(`credential-like file in public artefact: ${relative}`);}}
walk(site);
if(problems.length){console.error("Deployable-site validation failed:");for(const p of problems)console.error(`- ${p}`);process.exit(1);}
console.log(`Deployable-site validation passed: v${pkg.version} canonical architecture, ${codes.length} protected patient portals, compatibility redirects and route/PDF integrity.`);
