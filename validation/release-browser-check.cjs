'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {chromium}=require(process.env.SACT_PLAYWRIGHT_MODULE);
const root=process.cwd(),site=path.join(root,'_site'),output=process.env.SACT_EVIDENCE;
const routes=['00588','00588/prostate','00588/ovarian_first_line','00588/ovarian_relapsed','00588/pancreatic','00746','00947'];
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
      await context.close();
    }
    fs.writeFileSync(path.join(output,'portal-checks.json'),JSON.stringify(rows,null,2));
    console.log(rows.length+' portal, download and knowledge journeys passed');
  }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
