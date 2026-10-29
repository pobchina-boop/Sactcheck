'use strict';
// Explicit build context. The default build retains the original patient bundles.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const context=process.env.SACT_SUITE_CONTEXT||'';
if(context && context!=='lung')throw new Error('Unsupported patient suite context: '+context);
const codes=(process.env.SACT_SUITE_CODES||'').split(',').filter(Boolean);
if(context&&!codes.length)throw new Error('A context build requires an explicit SACT_SUITE_CODES scope');
function profilePath(code){return context?`data/patient-knowledge-contexts/${code}/${context}.json`:`data/patient-knowledge/${code}.json`;}
function profile(code){return JSON.parse(fs.readFileSync(path.join(root,profilePath(code)),'utf8'));}
function readPath(p){const m=p.match(/^data\/patient-knowledge\/(\d{5})\.json$/);return m&&context?profilePath(m[1]):p;}
function output(file,html){
 const relative=path.isAbsolute(file)?path.relative(root,file):file;
 const patient=relative.match(/^patient\/(\d{5})\/(.+)$/);
 if(patient&&['0.84.25','0.84.26'].includes(profile(patient[1]).suite_release)){
  html=html.replace('</head>','<link rel="stylesheet" href="../../assets/patient/lung-suite-v08425.css"></head>');
  html=html.replace('<body class="','<body class="suite-v08425 ').replace('<body>','<body class="suite-v08425">');
  if(['00823','00702','00221','00565','00340','00219','00220'].includes(patient[1]))html=html.replace('class="suite-v08425 ','class="suite-v08425 new-targeted-v08425 ');
  if(patient[1]==='00226'&&patient[2]==='sactcard.html')html=html.replace('<div class="suite-stamps">','<p>Recording boxes — not a fixed treatment course.</p><div class="suite-stamps">');
 }
 if(!context)return {file,html};
 const match=relative.match(/^(patient|docs\/patient)\/(\d{5})\/(.+)$/);
 if(!match)return {file,html};
 const [,base,code,tail]=match;
 if(!codes.includes(code))throw new Error('Context output escaped selected codes: '+relative);
 const destination=`${base}/${code}/${context}/${tail}`;
 // One additional route segment changes only local root-relative references.
 html=html.replace(/(\b(?:href|src|content)=["'][^"']*?)(\.\.\/)+/g,(all)=>all.replace('../','../../'));
 html=html.replace(new RegExp(`patient/${code}/(?!${context}/)`,'g'),`patient/${code}/${context}/`);
 return {file:path.isAbsolute(file)?path.join(root,destination):destination,html};
}
function phases(defaultData){
 if(!context)return defaultData;
 const d=JSON.parse(fs.readFileSync(path.join(root,'data/phase-support-contexts-v08425.json'),'utf8'));
 return {...defaultData,regimens:Object.fromEntries(codes.map(c=>[c,d.regimens[c][context]]))};
}
if(context){
 const journey=require('../js/treatment-journey-v0837.js');
 for(const code of codes){
  const scoped=journey.definitions[`${code}:${context}`];
  if(!scoped)throw new Error('Missing journey context: '+code+':'+context);
  journey.definitions[code]=scoped;
 }
}
module.exports={context,codes,profilePath,profile,readPath,output,phases};
