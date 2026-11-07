'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {applyEditorial,TERMS}=require('../tools/patient-editorial-v08444.cjs');

test('selectable hidden phases receive prose changes and independent first-use explanations',()=>{
 const head='<head><title>PRRT MRI</title><style>.panel::before{content:"MRI Irish leaflet"}</style></head>';
 const script='<script type="application/json">{"label":"MRI","source":"Irish leaflet"}</script>';
 const html=`<!doctype html><html>${head}<body><section data-support-phase="first" hidden data-original="MRI Irish leaflet"><h2>PRRT</h2><p>The long Irish leaflet describes MRI. MRI follows.</p></section><p id="visible">MRI and PRRT in the visible plan.</p><section data-support-phase="second" hidden><p>MRI and PRRT.</p></section><div hidden data-internal="true">MRI Irish leaflet</div>${script}</body></html>`;
 const result=applyEditorial(html);
 assert(result.includes(head),'head and style bytes preserved');
 assert(result.includes(script),'script data preserved');
 assert(result.includes('<section data-support-phase="first" hidden data-original="MRI Irish leaflet">'),'selector attributes preserved');
 assert(result.includes('<div hidden data-internal="true">MRI Irish leaflet</div>'),'unrelated hidden implementation content preserved');
 assert(result.includes('The long treatment information describes magnetic resonance imaging (MRI). MRI follows.'));
 assert(result.includes('<p id="visible">magnetic resonance imaging (MRI) and peptide receptor radionuclide therapy (PRRT) in the visible plan.</p>'));
 assert(result.includes('<section data-support-phase="second" hidden><p>magnetic resonance imaging (MRI) and peptide receptor radionuclide therapy (PRRT).</p>'));
 assert.equal(applyEditorial(result),result,'hidden and visible scopes are idempotent');
});

test('named diagnosis, access and blood-test abbreviations are explained without changing test values',()=>{
 const html='<body><h1>HCC</h1><p>BUN, HBsAg, anti-HBc and HbA1c at week 4. PICC, NSCLC, ES-SCLC, BP, MDT, TFT, ILD, OFS, CRT, DPD, G-CSF, SPF and CTCAE.</p></body>';
 const result=applyEditorial(html);
 for(const text of ['hepatocellular carcinoma (HCC)','blood urea nitrogen (BUN)','hepatitis B surface antigen (HBsAg)','antibody to hepatitis B core antigen (anti-HBc)','glycated haemoglobin (longer-term blood glucose) (HbA1c)','peripherally inserted central catheter (PICC)','extensive-stage small-cell lung cancer (ES-SCLC)','Common Terminology Criteria for Adverse Events (CTCAE)'])assert(result.includes(text),text);
 assert(result.includes('at week 4.'),'authored timing retained');
 assert.equal(applyEditorial(result),result);
});

test('AI uses authored endocrine context; ambiguous terms and molecular names remain unchanged',()=>{
 const html='<body><p>AI, HR, PPI, BRAF, MEK, EGFR, ALK, PD-1, PD-L1 and CTLA-4.</p></body>';
 assert(applyEditorial(html).includes('<p>AI, HR, PPI, BRAF, MEK, EGFR, ALK, PD-1, PD-L1 and CTLA-4.</p>'));
 const result=applyEditorial(html,{data:{title:'Letrozole treatment',agents:[]}});
 assert(result.includes('aromatase inhibitor (AI), HR, PPI, BRAF, MEK, EGFR, ALK, PD-1, PD-L1 and CTLA-4.'));
 assert.equal(applyEditorial(result,{data:{title:'Letrozole treatment',agents:[]}}),result);
});

test('every supported expansion remains stable on a second publication pass',()=>{
 for(const [term] of TERMS){
  const options={data:{service_kind:'endocrine'}};
  const result=applyEditorial(`<body><h2>${term}</h2><p>${term}</p></body>`,options);
  assert.equal(applyEditorial(result,options),result,term);
 }
 const stage=applyEditorial('<body><p>stage IV; IV infusion</p></body>');
 assert(stage.includes('stage IV; intravenous (IV) infusion'));
});
