'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.SACT_PLAYWRIGHT_MODULE);
const root = process.cwd();
const site = path.join(root, '_site');
const codes = ['00620', '00716', '00769', '00771', '00772', '00303', '00306', '00308', '00624', '00819'];
const workflow = require(path.join(root, 'data/regimen-workflow-v0750.json'));
async function checkDownload(page, button, expectedFile, expectedName) {
  const [download] = await Promise.all([page.waitForEvent('download'), button.click()]);
  assert.equal(download.suggestedFilename(), expectedName);
  const delivered = fs.readFileSync(await download.path());
  assert.equal(delivered.subarray(0,5).toString(), '%PDF-');
  assert(delivered.equals(fs.readFileSync(expectedFile)), expectedFile);
}
async function run() {
  const server = await require(path.join(root, 'tools/local-site-server.cjs')).serve(site);
  const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH});
  try {
    for (const width of [390, 1440]) {
      const context = await browser.newContext({viewport:{width, height:1000}, reducedMotion:'reduce'});
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(server.url);
      assert.equal(await page.locator('meta[name="sactcheck-release"]').getAttribute('content'), '0.84.66');
      for (const code of codes) {
        await page.locator('#regimenSearch').fill(code);
        const opener = page.locator('[data-json-protocol-id^="nccp-' + code + '-"] [data-open-regimen-workflow]').first();
        const dir = path.join(site, 'patient', code);
        await opener.click();
        await checkDownload(page, page.locator('[data-workflow-consent]'), path.join(dir,'consent-form.pdf'), 'SACTCheck-consent-' + code + '.pdf');
        await opener.click();
        for (const phase of workflow.supportive_phase_selectors[code].phases) {
          const selector = page.locator('#workflowSupportPhase');
          await selector.selectOption(phase.id);
          await page.waitForFunction(id => document.querySelector('#workflowSupportPhase option[selected]')?.value === id, phase.id);
          const filename = 'antiemetic-' + phase.id + '.pdf';
          await checkDownload(page, page.locator('[data-workflow-support]'), path.join(dir, filename), 'SACTCheck-' + code + '-' + filename);
        }
        await page.locator('#regimenWorkflowOverlay .workflow-close').click();
        const portal = await context.newPage();
        const response = await portal.goto(server.url + '/patient/' + code + '/');
        assert.equal(response.status(), 200);
        assert.equal(await portal.locator('link[rel=canonical]').getAttribute('href'), 'https://sactcheck.com/patient/' + code + '/');
        await portal.close();
        console.log('Passed portal, consent and all prescription downloads', width, code);
      }
      assert.deepEqual(errors, []);
      await context.close();
    }
  } finally {
    await browser.close();
    await server.close();
  }
}
run().catch(error => {console.error(error); process.exitCode=1;});
