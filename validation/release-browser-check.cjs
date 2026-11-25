'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {chromium}=require(process.env.SACT_PLAYWRIGHT_MODULE);
const root=process.cwd(),site=path.join(root,'_site'),output=process.env.SACT_EVIDENCE;
const routes=['00588','00588/prostate','00588/ovarian_first_line','00588/ovarian_relapsed','00588/pancreatic','00746',...require(path.join(root,'validation/sarcoma-batch-1/patient-assets.json')).routes,...require(path.join(root,'validation/sarcoma-integration/remaining-patient-files.json')).routes,'00947','00862','00929'];
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
  const server=await require(path.join(root,'tools/local-site-server.cjs')).serve(site);
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined});
  try {
    fs.mkdirSync(output,{recursive:true}); const rows=[];
    for (const width of [390,1440]) {
      const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block',acceptDownloads:true});
      for (const route of routes) {
        const page=await context.newPage(),errors=[];
        page.on('pageerror',e=>errors.push(e.message));
        page.on('response',r=>{if(r.url().startsWith(server.url)&&r.status()>=400)errors.push(r.status()+' '+r.url());});
        const href='/patient/'+route+'/';
        const response=await page.goto(server.url+href+'index.html');
        assert(response.ok(),route);
        const h=page.locator('h1').first();await h.waitFor();const heading=(await h.innerText()).trim();assert(heading);
        const metrics=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));
        assert(metrics.document<=metrics.viewport+1,JSON.stringify({route,width,metrics}));
        const link=page.locator('a[href="guide.pdf"][download]').first();
        const [download]=await Promise.all([page.waitForEvent('download'),link.click()]);
        const file=await download.path();
        assert.equal(digest(fs.readFileSync(file)),digest(fs.readFileSync(path.join(site,href.slice(1),'guide.pdf'))));
        if(['00588/prostate','00746','00205/sarcoma','00947'].includes(route)) {
          await page.screenshot({path:path.join(output,route.replaceAll('/','-')+'-'+width+'.png')});
        }
        await page.locator('a[href^="knowledge.html"]').first().click();
        await page.waitForURL('**/knowledge.html*');
        assert(await page.locator('main,article').first().isVisible(),route+' patient knowledge');
        const disclosure=page.locator('details:not([open]) > summary:visible').first();
        if(await disclosure.count()) {const item=await disclosure.elementHandle();await item.click();assert(await item.evaluate(el=>el.parentElement.open),route+' disclosure opens');}
        assert.deepEqual(errors,[],route);rows.push({route,width,heading,metrics,guide:download.suggestedFilename()});
        await page.close();
      }
      for (const [code, indications] of [['00228',['00228b','00228a']],['00205',['00205c','00205a']]]) {
        const clinic=await context.newPage();
        const filename=fs.readdirSync(path.join(root,'protocols/breast')).find(x=>x.startsWith(code+'-'));
        const record=require(path.join(root,'protocols/breast',filename));
        await clinic.goto(server.url+'/');
        await clinic.locator('#regimenSearch').fill(code);
        await clinic.locator('[data-json-protocol-id="'+record.protocol_id+'"]').first().waitFor();
        await clinic.evaluate(id=>window.SACTCheckProtocolLoader.launchProtocol(id),record.protocol_id);
        for (const indication of indications) {
          const selector=clinic.locator('#jsonInput_indication_id');
          await selector.waitFor({state:'attached'});
          await selector.evaluate(e=>{for(let p=e.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});
          await selector.selectOption(indication);
          assert.equal(await selector.inputValue(),indication);
          const selected=record.assessment_by_indication[indication] || record;
          await clinic.waitForFunction(n=>document.getElementById('jsonProtocolRuleCount')?.textContent===String(n),selected.rule_engine.rules.length,{timeout:6000});
          const ruleCount=await clinic.locator('#jsonProtocolRuleCount').textContent();
          assert.equal(Number(ruleCount),selected.rule_engine.rules.length);
          await clinic.getByRole('button',{name:'Run assessment engine',exact:true}).click();
          await clinic.locator('#jsonResult').waitFor({state:'attached'});
          assert.equal(await selector.inputValue(),indication);
          if(indication==='00205a'){
            async function fillField(name,value){
              const field=clinic.locator('#jsonInput_'+name);
              await field.evaluate(e=>{for(let p=e.parentElement;p;p=p.parentElement) if(p.tagName==='DETAILS')p.open=true;});
              await field.fill(value);
            }
            await fillField('bilirubin_umol_l','51');
            await fillField('current_pld_mg_m2','40');
            await fillField('original_pld_mg_m2','40');
            await clinic.getByRole('button',{name:'Run assessment engine',exact:true}).click();
            const preview=clinic.locator('#jsonPrintSummary');
            await preview.waitFor({state:'attached'});
            assert.match(await preview.textContent(),/20 mg.m²/);
            await fillField('original_pld_mg_m2','');
            await clinic.getByRole('button',{name:'Run assessment engine',exact:true}).click();
            assert.match(await preview.textContent(),/Confirm the original/i);
            assert(!/25 mg.m²/.test(await preview.textContent()));
          }
          rows.push({code,indication,width,ruleCount});
        }
        await clinic.close();
      }
      for (const [code,id] of [['00588','nccp-00588-v5b'],['00746','nccp-00746-v2']]) {
        const clinic=await context.newPage();
        await clinic.goto(server.url+'/');
        await clinic.locator('#regimenSearch').fill(code);
        await clinic.locator('[data-json-protocol-id="'+id+'"]').first().waitFor();
        await clinic.evaluate(id=>window.SACTCheckProtocolLoader.launchProtocol(id),id);
        const field=clinic.locator('#jsonInput_anc_x10e9_l');
        await field.waitFor({state:'attached'});
        const el=await field.elementHandle();
        await el.evaluate(e=>{let n=e.closest('details');while(n){n.open=true;n=n.parentElement.closest('details');}});
        await field.fill('0.8');
        await clinic.getByRole('button',{name:'Run assessment engine',exact:true}).click();
        const result=clinic.locator('#jsonResult');
        await result.waitFor({state:'visible'});
        const resultText=await result.innerText();
        assert(/delay|withhold|hold/i.test(resultText),code+' expected neutropenia action');
        assert(/neutrophil|ANC/i.test(resultText),code+' expected source trigger');
        await clinic.screenshot({path:path.join(output,code+'-clinic-'+width+'.png')});
        rows.push({code,width,low_neutrophil_action:resultText.slice(0,200)});
        await clinic.close();
      }
      await context.close();
    }
    fs.writeFileSync(path.join(output,'portal-checks.json'),JSON.stringify(rows,null,2));
    console.log(rows.length+' portal, download and knowledge journeys passed');
  }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
