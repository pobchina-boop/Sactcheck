'use strict';
// Environment check only. Passing this is not a SACTCheck browser-test pass.
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.SACT_PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  let browser;
  const server = http.createServer((request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.end('<title>Browser preflight</title><p>Local browser connection works</p>');
  });
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH || undefined,
      timeout: 15000
    });
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${server.address().port}`, { timeout: 10000 });
    assert.equal(await page.locator('p').textContent(), 'Local browser connection works');
    console.log(`Browser environment available: Chromium ${browser.version()}; Node ${process.version}`);
  } finally {
    if (browser) await browser.close();
    server.closeAllConnections();
    if (server.listening) await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
