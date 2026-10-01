#!/usr/bin/env node
"use strict";
const fs=require("fs"),path=require("path");
const root=path.resolve(__dirname,".."),site=path.join(root,"_site");
const forbiddenTopLevel=[".git",".github","tests","tools","node_modules","package.json","SECURITY.md"];
const codes=["00209","00222","00317","00318","00382","00568","00569","00619","00713","00714","00722","00831","00857"];
const required=["index.html","sustainability.html","manifest.webmanifest","js","css","protocols/index.json","404.html","assets/patient/anatomy-hcc-v0762.png","assets/patient/toxicity-icons.svg","assets/patient/hcc-bodymap-v0763.css","assets/patient/hcc-connectors-v0763.js"];
for(const code of codes){for(const base of ["patient","docs/patient"]){required.push(`${base}/${code}/index.html`,`${base}/${code}/guide.html`,`${base}/${code}/guide.pdf`,`${base}/${code}/passport.pdf`);}}
required.push("patient/00831/contact-card.pdf","docs/patient/00831/contact-card.pdf");
const problems=[];if(!fs.existsSync(site))problems.push("_site directory does not exist");for(const item of required)if(!fs.existsSync(path.join(site,item)))problems.push(`missing required public item: ${item}`);
const support=path.join(site,"js","patient-support-v0750.js");if(fs.existsSync(support)){const content=fs.readFileSync(support,"utf8");for(const code of codes){if(!content.includes(`"${code}"`))problems.push(`patient QR route ${code} missing from patient-support-v0750.js`);}}else problems.push("missing patient QR routing module: js/patient-support-v0750.js");
for(const code of codes){for(const base of ["patient","docs/patient"]){const page=path.join(site,base,code,"index.html");if(fs.existsSync(page)){const html=fs.readFileSync(page,"utf8");if(!html.includes(`https://sactcheck.com/patient/${code}/`))problems.push(`${base}/${code} does not identify its canonical public destination`);if(!html.includes("anatomy-hcc-v0762.png"))problems.push(`${base}/${code} lost approved anatomy visual`);}}}
for(const item of forbiddenTopLevel)if(fs.existsSync(path.join(site,item)))problems.push(`forbidden development item exposed: ${item}`);
function walk(directory){if(!fs.existsSync(directory))return;for(const entry of fs.readdirSync(directory,{withFileTypes:true})){const absolute=path.join(directory,entry.name),relative=path.relative(site,absolute).replaceAll(path.sep,"/");if(entry.isDirectory())walk(absolute);else if(/\.(?:pem|p12|pfx|key)$/i.test(entry.name)||/^\.env/i.test(entry.name))problems.push(`credential-like file in public artefact: ${relative}`);}}
walk(site);if(problems.length){console.error("Deployable-site validation failed:");for(const p of problems)console.error(`- ${p}`);process.exit(1);}console.log(`Deployable-site validation passed for ${codes.length} canonical patient portals and compatibility copies.`);
