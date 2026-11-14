'use strict';
const fs=require('node:fs'),path=require('node:path');
const R=path.resolve(__dirname,'..');
const topic=JSON.parse(fs.readFileSync(path.join(R,'data/prostate-treatment-explainer-v08451.json')));
const body=require('../js/regimen-knowledge-base.js').prostatePathwayMarkup({metadata:{nccp_regimen_code:'00103'}},{prostate_treatment_explainer:topic}).replaceAll('<details>','<details open>');
const css=fs.readFileSync(path.join(R,'css/regimen-knowledge-base.css'),'utf8');
const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SACTCheck prostate treatment explainer — review draft</title><style>'+css+'\nbody{margin:0;background:#f3f6f8;color:#152e40;font-family:Arial,sans-serif}main{max-width:1100px;margin:2rem auto;padding:1.5rem;background:#fff}h1{color:#12324a}.prostate-pathway p{max-width:90ch}.prostate-pathway [data-prostate-expand]{display:none}@page{size:A4;margin:15mm}@media print{body{background:white}main{margin:0;padding:0}.prostate-pathway details{break-before:auto}.prostate-pathway summary{break-after:avoid}}</style></head><body><main><p>SACTCheck · clinician knowledge base · review draft</p>'+body+'</main></body></html>';
const p=path.join(R,'validation/prostate-v08451/review/prostate-treatment-explainer.html');fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,html);console.log(p);
