'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require(process.env.SACT_PLAYWRIGHT_MODULE || 'playwright');

async function openSection(page, id) {
  const disclosure = page.locator(`#${id} > details.oncowiki-details`);
  assert.equal(await disclosure.count(), 1, `${id}: progressive disclosure is present`);
  assert.equal(await disclosure.getAttribute('open'), null, `${id}: initially collapsed`);
  await disclosure.locator(':scope > summary').click();
  assert.equal(await disclosure.getAttribute('open'), '', `${id}: opens on activation`);
}

async function assertNoOverflow(page, label) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${label}: page-wide overflow`);
}

async function referenceJourney(page, url) {
  const response = await page.goto(`${url}/patient/00568/`);
  assert.equal(response.status(), 200);
  await page.getByRole('link', { name: 'Open the full OncoWiki: your treatment, explained', exact: true }).click();
  await page.waitForURL('**/patient/00568/knowledge.html');

  // v0.83.1 deliberately replaced this route's personal calendar with a complete
  // reference chronology. Assert that design rather than restoring retired controls.
  assert.equal(await page.locator('#pk-start, #pk-phase, #pk-clear, [data-day]').count(), 0);
  const contents = page.locator('main > details.pk-section').filter({ has: page.locator('.pk-contents') });
  assert.equal(await contents.count(), 1, 'reference topic navigation is present');
  assert.equal(await contents.getAttribute('open'), null, 'topic navigation initially collapsed');
  await contents.locator(':scope > summary').click();
  assert.equal(await contents.getAttribute('open'), '', 'topic navigation opens');
  await page.getByRole('link', { name: 'Your 21-day timeline', exact: true }).click();
  await page.waitForURL('**/patient/00568/knowledge.html#cycle');
  const chart = page.locator('#wikiCycleChronology');
  assert(await chart.isVisible());
  assert.equal(await chart.getAttribute('data-cycle-days'), '21');
  assert.deepEqual(await chart.locator('.wiki-cycle-day').allTextContents(), Array.from({ length: 21 }, (_, day) => String(day + 1)));
  assert.match(await chart.innerText(), /There are no guaranteed “safe days”\./);
  assert.match(await chart.innerText(), /After induction, carboplatin stops\. Pembrolizumab and pemetrexed may continue every 21 days/);

  await openSection(page, 'phases');
  const phases = page.locator('#phases .pk-card');
  assert.equal(await phases.count(), 2);
  const maintenance = phases.nth(1);
  assert.equal(await maintenance.locator('h3').innerText(), 'Maintenance · after induction');
  assert.equal(await maintenance.locator('p').innerText(), 'Carboplatin stops. Pembrolizumab and pemetrexed may continue every 21 days while appropriate. Duration and changes are agreed with your oncology team.');

  // The audited v0.84.21 evidence replaced the historical 19.4% card. Preserve
  // strict evidence-disclosure coverage using its exact current statement/source.
  await openSection(page, 'evidence');
  const evidence = page.locator('#evidence');
  assert.equal(await evidence.locator('h2').innerText(), 'Why this treatment is offered');
  assert.equal(await evidence.locator(':scope > details > p').first().innerText(), 'Adding pembrolizumab to chemotherapy helped people in the study live longer and delayed cancer progression. Your benefit depends on your cancer and health.');
  assert.equal(await evidence.getByText('19.4%', { exact: true }).count(), 0, 'retired unqualified metric is not reintroduced');
  await evidence.locator('a[href="#source-trial-v08421"]').click();
  await page.waitForURL('**/patient/00568/knowledge.html#source-trial-v08421');
  const source = page.locator('#source-trial-v08421 a');
  assert(await source.isVisible());
  assert.equal(await source.getAttribute('href'), 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10082311/');
  assert.match(await source.innerText(), /KEYNOTE-189/);
  await assertNoOverflow(page, '00568 reference');
}

async function calendarJourney(page, url) {
  // This published route still supports the educational calendar. Keep the
  // original date, phase-filter, selected-day and clear assertions exercised here.
  const response = await page.goto(`${url}/patient/00310/knowledge.html`);
  assert.equal(response.status(), 200);
  assert.equal(await page.locator('#cycle h2').innerText(), 'Your 21-day cycle.');
  const date = page.locator('#pk-start');
  const activeMedicines = page.locator('#pk-active-medicines');
  assert(await date.isVisible());
  assert.equal(await date.inputValue(), '');
  assert.equal(await activeMedicines.innerText(), 'Gemcitabine + Carboplatin');
  assert.equal(await page.locator('[data-day]').count(), 21);
  assert.equal(await page.locator('[data-day][aria-pressed="true"]').count(), 1);
  assert.equal(await page.locator('[data-day="1"]').getAttribute('aria-pressed'), 'true');

  await date.fill('2026-10-12');
  await date.dispatchEvent('change');
  assert.equal(await page.locator('#pk-next').innerText(), 'Next planned Day 1: 2 Nov. Your team must confirm treatment can proceed.');
  await page.locator('[data-day="21"]').click();
  assert.equal(await page.locator('[data-day="21"]').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('[data-day="1"]').getAttribute('aria-pressed'), 'false');
  assert.equal(await page.locator('[data-day][aria-pressed="true"]').count(), 1);
  assert.equal(await page.locator('#pk-day-number').textContent(), 'Day 21 · 1 Nov');

  await page.locator('#pk-phase').selectOption('review');
  assert.equal(await activeMedicines.innerText(), '', 'review phase has no scheduled chemotherapy medicines');
  await page.locator('#pk-phase').selectOption('chemotherapy');
  assert.equal(await activeMedicines.innerText(), 'Gemcitabine + Carboplatin', 'returning to treatment restores both active medicines');

  await page.locator('#pk-clear').click();
  assert.equal(await date.inputValue(), '');
  assert.equal(await page.locator('#pk-next').innerText(), 'The next cycle starts 21 days after this one, if your team confirms it.');
  assert.equal(await page.locator('#pk-day-number').textContent(), 'Day 21');
  assert.equal(await page.locator('[data-day="21"] small').innerText(), '');
  await assertNoOverflow(page, '00310 calendar');
}

(async () => {
  const root = path.resolve(__dirname, '..');
  const server = await require('../tools/local-site-server.cjs').serve(process.env.SACT_SITE_DIR || root);
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await referenceJourney(page, server.url);
      await calendarJourney(page, server.url);
      assert.deepEqual(errors, [], `${width}px: JavaScript page errors`);
      await page.close();
    }
    console.log('Desktop/mobile patient reference and calendar journeys passed (4 page/viewport journeys).');
  } finally {
    if (browser) await browser.close();
    await server.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
