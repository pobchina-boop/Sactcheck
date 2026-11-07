/* Source-preservation and interaction checks against completed patient routes.
 * Requires a permitted Playwright/Chromium environment. No local server is started.
 *   SACTCHECK_BASE_URL=http://localhost:4173/ node tests/supportive-script-tabs.e2e.cjs
 * --check-only validates the required source fixtures without launching Chromium.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const base=process.env.SACTCHECK_BASE_URL;
const route=code=>`patient/${code}/supportive-care.html`;
const url=code=>new URL(route(code),base.endsWith('/')?base:base+'/').href;
const cases=[
  {code:'00642',phases:['treatment'],specialist:true},
  {code:'00348',phases:['carbo-day1','taxane-weekly','ac']},
  {code:'00253',phases:['treatment'],standalone:true,empty:true}
];
for(const sample of cases){
  const html=fs.readFileSync(path.join(root,route(sample.code)),'utf8');
  assert.ok(html.includes('phase-support-v0838.js?v='+require('../package.json').version),`${sample.code}: current shared script is present`);
  if(sample.standalone)assert.ok(html.includes('data-support-single-phase="true"'));
  else for(const phase of sample.phases)assert.ok(html.includes(`data-support-phase="${phase}"`),`${sample.code}: authored ${phase} is present`);
}

async function verify(){
  assert.ok(base&&/^https?:\/\//.test(base),'Set SACTCHECK_BASE_URL to a verified HTTP preview of this checkout');
  const {chromium}=require('playwright');
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium'});
  const observations=[];
  try{
    for(const sample of cases){
      const page=await browser.newPage({viewport:{width:1280,height:900}});
      const failures=[];
      page.on('pageerror',error=>failures.push(error.message));
      await page.goto(url(sample.code),{waitUntil:'domcontentloaded'});
      const guidance=page.getByRole('tab',{name:'Guidance',exact:true});
      const script=page.getByRole('tab',{name:'Generate script',exact:true});
      await guidance.waitFor();
      assert.equal(await guidance.getAttribute('aria-selected'),'true','Guidance is the initial view');
      assert.equal(await script.getAttribute('aria-selected'),'false');
      assert.equal(await page.locator('#support-script-panel').isVisible(),false);
      if(!sample.standalone){
        assert.equal(await page.locator('#support-phase').inputValue(),'','A stale saved phase is not adopted');
        assert.equal(await page.locator('[data-support-phase]:not([hidden])').count(),0);
        await script.click();
        assert.equal(await page.locator('.support-generated-script').count(),0,'No prescription appears before a phase is selected');
        await guidance.click();
      }else{
        assert.equal(await page.locator('#support-phase').isVisible(),false,'A continuous single plan does not ask for a fake treatment phase');
        assert.equal(await page.locator('[data-support-phase]:not([hidden])').count(),1);
      }
      for(const phase of sample.phases){
        if(!sample.standalone)await page.locator('#support-phase').selectOption(phase);
        const source=await page.locator(`[data-support-phase="${phase}"]`).evaluate(node=>{
          const copy=node.cloneNode(true);
          copy.querySelectorAll('[id]').forEach(item=>item.removeAttribute('id'));
          copy.querySelectorAll('.no-print').forEach(item=>item.remove());
          return {html:copy.innerHTML,cells:[...copy.querySelectorAll('th,td')].map(cell=>cell.textContent),text:copy.textContent};
        });
        await script.click();
        assert.equal(await script.getAttribute('aria-selected'),'true');
        assert.equal(await page.locator('#support-guidance-panel').isVisible(),false);
        const copied=await page.locator('.support-script-authored').evaluate(node=>({html:node.innerHTML,cells:[...node.querySelectorAll('th,td')].map(cell=>cell.textContent),text:node.textContent}));
        assert.deepEqual(copied,source,`${sample.code}/${phase}: all authored clinical HTML, cells and source links are retained`);
        assert.equal(await page.locator('#support-script-panel [data-support-phase]').count(),0,'Script copies cannot be toggled back into other phase views');
        const duplicateIds=await page.evaluate(()=>{
          const ids=[...document.querySelectorAll('[id]')].map(node=>node.id);
          return ids.filter((id,index)=>ids.indexOf(id)!==index);
        });
        assert.deepEqual(duplicateIds,[],'The generated view creates no duplicate DOM IDs');
        if(sample.specialist){
          assert.equal(await page.locator('.support-generated-script').getAttribute('data-support-script-incomplete'),'true','PRRT remains an incomplete specialist prescription template');
          assert.ok((await page.locator('.support-script-gap').innerText()).includes('Prescription details still required'));
          assert.equal(await page.getByRole('button',{name:'Print / save script template',exact:true}).count(),1);
        }
        if(sample.empty){
          assert.equal(await page.locator('.support-generated-script').getAttribute('data-support-script-kind'),'individual-support-plan');
          assert.ok((await page.locator('.support-script-gap').innerText()).includes('No medicine orders are populated'));
          assert.equal(await page.getByRole('button',{name:'Print / save support plan',exact:true}).count(),1);
          assert.ok(source.text.includes('No routine prophylactic antiemetic'));
        }
        await script.focus();
        await page.keyboard.press('Home');
        assert.equal(await guidance.getAttribute('aria-selected'),'true','Home selects guidance');
        await page.keyboard.press('End');
        assert.equal(await script.getAttribute('aria-selected'),'true','End selects the script');
        await page.keyboard.press('ArrowLeft');
        assert.equal(await guidance.getAttribute('aria-selected'),'true','Arrow navigation switches tabs');
        await page.keyboard.press('ArrowRight');
        assert.equal(await script.getAttribute('aria-selected'),'true');
        await page.emulateMedia({media:'print'});
        assert.equal(await page.locator('.support-script-authored').isVisible(),true,'The selected script stays visible in print');
        assert.equal(await page.locator('#support-guidance-panel').isVisible(),false,'Guidance and every original phase stay out of script print');
        const extraMainChildren=await page.locator('main').evaluate(main=>[...main.children].filter(node=>!node.classList.contains('support-script-panel')&&getComputedStyle(node).display!=='none').map(node=>node.tagName));
        assert.deepEqual(extraMainChildren,[],'No duplicate header, source phase, picker or common notice prints beside the script');
        await page.emulateMedia({media:'screen'});
        await page.setViewportSize({width:390,height:844});
        const mobileOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
        assert.equal(mobileOverflow,false,`${sample.code}/${phase}: the source table scrolls within the page on a phone`);
        await page.setViewportSize({width:1280,height:900});
        observations.push({code:sample.code,phase,sourcePreserved:true,printIsolated:true});
      }
      assert.deepEqual(failures,[],`${sample.code}: no runtime errors`);
      await page.close();
    }
    console.log(JSON.stringify({passed:true,observations},null,2));
  }finally{await browser.close();}
}
if(process.argv.includes('--check-only'))console.log('PASS: actual route sources, expected phases, standalone marker and current script links. Browser assertions have not run.');
else verify().catch(error=>{console.error(error);process.exitCode=1;});
