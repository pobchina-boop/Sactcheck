'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const {chromium}=require(process.env.SACT_PLAYWRIGHT_MODULE||'playwright');
const cases={
 '00449':[
  ['ANC alone',{anc_x10e9_l:'1.49'},/Treatment criteria not met/,/FOLFIRI chemotherapy/],
  ['Protein at 2',{proteinuria_g_24h:'2'},/No treatment criteria breached/,/≤2 g\/24 h/],
  ['Protein at 2.1',{proteinuria_g_24h:'2.1'},/Treatment criteria not met/,/Hold bevacizumab/],
  ['Protein at 4',{proteinuria_g_24h:'4'},/Treatment criteria not met/,/Hold bevacizumab/],
  ['Protein over 4',{proteinuria_g_24h:'4.1'},/Treatment criteria not met/,/Discontinue bevacizumab/],
  ['Severe renal impairment',{renal_impairment_severity:'severe'},/Clinical review required/,/no irinotecan dose reduction/],
  ['ANC nadir',{anc_x10e9_l:'1.5',lowest_anc_during_delay_x10e9_l:'0.49'},/Dose modification indicated/,/two dose levels/],
  ['Automatic bilirubin ULN',{bilirubin_actual:'61'},/Treatment criteria not met/,/3\.05/]
 ],
 '00446':[
  ['CrCl below 30',{crcl_ml_min:'renal_0_29'},/Treatment criteria not met/,/contraindicated/],
  ['CrCl exact 30',{crcl_ml_min:'renal_exact_30'},/Clinical review required/,/Exactly 30 mL\/min/],
  ['Moderate hepatic impairment',{hepatic_impairment_category:'moderate'},/Clinical review required/,/one third/],
  ['AST over threshold',{ast_u_l:'181'},/Treatment criteria not met/,/180 U\/L/],
  ['AST exact threshold',{ast_u_l:'180'},/Clinical review required/,/does not assign/],
  ['Protein over 4',{proteinuria_g_24h:'4.1'},/Treatment criteria not met/,/Discontinue bevacizumab/],
  ['Mixed dose actions',{anc_x10e9_l:'1.5',platelets_x10e9_l:'75',lowest_anc_delayed_weeks_x10e9_l:'0.49'},/Dose modification indicated/,/omission of bolus/],
  ['Platelets alone',{platelets_x10e9_l:'74'},/Treatment criteria not met/,/mFOLFOX6 chemotherapy/],
  ['Platelets after four weeks',{platelets_x10e9_l:'74',delay_weeks:'4'},/Treatment criteria not met/,/after four/],
  ['Stomatitis',{stomatitis_current_grade:'2'},/Treatment criteria not met/,/grade 1 or less/]
 ],
 '00227':[
  ['Retained renal pathway',{crcl_ml_min:'renal_0_9',haemodialysis:'false'},/Dose modification indicated/,/50–66%/],
  ['Recovered diarrhoea',{diarrhoea_current_grade:'0',diarrhoea_highest_grade:'3',toxicity_delay_weeks:'0'},/Dose modification indicated/,/one dose level/],
  ['Active diarrhoea',{diarrhoea_current_grade:'2',diarrhoea_highest_grade:'3',toxicity_delay_weeks:'0'},/Treatment criteria not met/,/hold treatment/],
  ['Complete DPD',{dpd_status:'complete'},/Treatment criteria not met/,/contraindicates fluorouracil/]
 ]
};
(async()=>{
 const root=path.resolve(__dirname,'..'),dir=path.join(root,'validation/clinical-fixes-v0833'),server=await require('../tools/local-site-server.cjs').serve(root);
 fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});const report=[];
 try{for(const width of [1440,390])for(const [code,allCases] of Object.entries(cases)){
  if(process.env.SACT_AUDIT_WIDTH && width!==Number(process.env.SACT_AUDIT_WIDTH))continue;
  if(process.env.SACT_AUDIT_CODE && code!==process.env.SACT_AUDIT_CODE)continue;
  const context=await browser.newContext({viewport:{width,height:1000},acceptDownloads:true}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(server.url,{waitUntil:'networkidle'});await p.locator('#regimenSearch').fill(code);
  const card=p.locator(`article[data-json-protocol-id^="nccp-${code}-"]`);await card.waitFor({state:'visible',timeout:60000});
  await p.waitForFunction(c=>document.querySelector(`article[data-json-protocol-id^="nccp-${c}-"]`)?.dataset.sactCardReady==='true',code);
  const risk=await card.locator('.emetogenic-badge').innerText();assert.match(risk,/moderate/i);
  await card.getByRole('button',{name:'Open protocol assessment',exact:true}).click();await p.locator('#jsonAssessmentForm').waitFor({state:'visible'});
  const selected=width===1440?allCases:allCases.filter(([name])=>['ANC alone','Protein over 4','ANC nadir','CrCl below 30','Moderate hepatic impairment','Mixed dose actions','Retained renal pathway','Recovered diarrhoea'].includes(name));
  for(const [name,inputs,title,detail] of selected){
   if(process.env.SACT_AUDIT_CASE && !new RegExp(process.env.SACT_AUDIT_CASE).test(name))continue;
   await p.locator('#jsonReset').click();
   for(const [field,value] of Object.entries(inputs)){
    let control=field==='bilirubin_actual'?p.locator('[data-lab-target="bilirubin_ratio_uln"][data-lab-analyte="bilirubin"]'):p.locator(`[data-field="${field}"]`);
    // 00227's linked dialysis boolean is intentionally hidden. Selecting the
    // non-dialysis band must provide that context without a hidden UI input.
    if(field==='haemodialysis'&&!(await control.isVisible()))continue;
    assert.equal(await control.count(),1,`${code}/${name}: input ${field}`);
    const details=control.locator('xpath=ancestor::details');for(const el of await details.all())if(!(await el.getAttribute('open')))await el.locator('summary').first().click();
    if(await control.evaluate(el=>el.tagName==='SELECT'))await control.selectOption(value);else await control.fill(value);
   }
   await p.locator('#jsonAssessmentForm button[type="submit"]').click();await p.locator('#jsonResult').waitFor({state:'visible'});
   assert.match(await p.locator('#jsonStatusTitle').innerText(),title,`${code}/${name}`);
   const summary=await p.locator('#jsonSummary').inputValue(),output=await p.locator('#jsonResult').innerText();assert.match(summary,detail,`${code}/${name}: detail`);
   assert.match(output,/unassessed|not assessed/i);
   let dose='';if(await p.locator('#jsonReviewDoseModification').isVisible()){
    await p.locator('#jsonReviewDoseModification').click();dose=await p.locator('.dose-modification-table').innerText();
    if(['ANC nadir','Mixed dose actions','Recovered diarrhoea'].includes(name)){assert.match(dose,/Bolus 5-FU/);assert.match(dose,/Infusional 5-FU/);assert.match(dose,name==='ANC nadir'?/1500/:/1900/);}
    if(name==='ANC alone'||name==='Platelets alone'||name==='Platelets after four weeks')assert(!dose.includes('Bevacizumab'));
   }
   if(name==='CrCl below 30'){
    const entered=await p.locator('#jsonPriorityFindings .patient-value').allTextContents();assert(entered.includes('<30 mL/min'));assert(!entered.includes('15 mL/min'));assert(summary.includes('<30 mL/min'));assert(dose.includes('<30 mL/min'));
   }
   if(name==='Retained renal pathway'){assert(summary.includes('<10 mL/min'));assert(dose.includes('<10 mL/min'));}
   let pdf=null;
   if(width===1440&&['CrCl below 30','Protein over 4','Moderate hepatic impairment','ANC nadir','Automatic bilirubin ULN'].includes(name)){
    const downloaded=p.waitForEvent('download');await p.locator('#jsonGeneratePdf').click();const download=await downloaded;pdf=`${code}-${name.toLowerCase().replaceAll(' ','-')}.pdf`;await download.saveAs(path.join(dir,pdf));
    const text=cp.execFileSync('pdftotext',['-layout',path.join(dir,pdf),'-'],{encoding:'utf8'});assert(text.includes(code));if(name==='CrCl below 30'){assert(text.includes('<30 mL/min'));assert(!text.includes('mL/min mL/min'));}if(name==='Protein over 4')assert.match(text,/Discontinue/i);
   }
   if(['CrCl below 30','Mixed dose actions','ANC alone'].includes(name))await p.screenshot({path:path.join(dir,`${code}-${width}-${name.replaceAll(' ','-')}.png`),fullPage:true});
   const fits=await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);
   if(!fits){console.error(await p.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1&&getComputedStyle(e).display!=='none').slice(-20).map(e=>({tag:e.tagName,id:e.id,cls:e.className,right:e.getBoundingClientRect().right,text:e.textContent.slice(0,90)}))));await p.screenshot({path:path.join(dir,'overflow-debug.png'),fullPage:true});}
   assert(fits,`${code}/${name}: page overflow ${width}`);
   console.log(`${code} ${width}: ${name} passed`);
   report.push({code,width,case:name,inputs,antiemeticRisk:risk,status:await p.locator('#jsonStatusTitle').innerText(),summary,dose,pdf,pass:true});
  }
  assert.deepEqual(errors,[]);await context.close();
 }
 fs.writeFileSync(path.join(dir,'browser-cases.json'),JSON.stringify({release:'0.83.3',case_count:report.length,cases:report},null,2)+'\n');console.log(`v0.83.3: ${report.length} desktop/mobile clinical browser cases and generated PDFs passed.`);
 }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exit(1);});
