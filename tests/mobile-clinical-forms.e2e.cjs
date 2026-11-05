'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.SACT_PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const site = process.env.SACT_SITE_DIR || root;
const evidence = process.env.SACT_CLINICAL_EVIDENCE_DIR;

function luminance(rgb) {
  const channels = rgb.slice(0, 3).map(value => {
    const c = value / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
function contrast(a, b) {
  const first = luminance(a), second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

// Cover every generated risk-grid shape rather than assuming a three-agent aid.
const consentCodes = new Set(['00568']);
const shapes = new Set();
const printColumns = new Map();
for (const entry of fs.readdirSync(path.join(root, 'patient'), { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const file = path.join(root, 'patient', entry.name, 'consent-form.html');
  if (!fs.existsSync(file)) continue;
  const source = fs.readFileSync(file, 'utf8');
  const columns = source.match(/class="agent-grid"[^>]*repeat\((\d+),1fr\)/)?.[1];
  // Existing generated inline styles intentionally override the per-agent
  // attribute with three print columns. Preserve that actual printed layout.
  const existingOverride = source.match(/\.agent-grid\{grid-template-columns:repeat\((\d+),minmax\(0,1fr\)\)!important\}/)?.[1];
  printColumns.set(entry.name, Number(existingOverride || columns || 3));
  if (columns && !shapes.has(columns)) { shapes.add(columns); consentCodes.add(entry.name); }
}
assert(shapes.size > 0, 'At least one generated consent aid must be tested');

(async () => {
  if (evidence) fs.mkdirSync(evidence, { recursive: true });
  const server = await require('../tools/local-site-server.cjs').serve(site);
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
  const results = [];
  try {
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      for (const code of consentCodes) {
        await page.goto(`${server.url}/patient/${code}/consent-form.html`, { waitUntil: 'load' });
        const screen = await page.locator('.consent-sheet').evaluate(sheet => {
          const rect = element => { const r = element.getBoundingClientRect(); return { left: r.left, right: r.right, width: r.width }; };
          const parse = value => value.match(/[\d.]+/g).map(Number);
          return {
            documentWidth: document.documentElement.scrollWidth,
            text: sheet.textContent.replace(/\s+/g, ' ').trim(),
            ticks: [...sheet.querySelectorAll('.tick')].map(el => ({ rect: rect(el), fontSize: parseFloat(getComputedStyle(el).fontSize) })),
            agents: [...sheet.querySelectorAll('.agent')].map(el => ({ title: el.querySelector('h3').textContent, ...rect(el) })),
            captions: [...sheet.querySelectorAll('.footer,.footer b,.sign-line,.field')].map(el => ({ color: parse(getComputedStyle(el).color), fontSize: parseFloat(getComputedStyle(el).fontSize) })),
            signatures: sheet.querySelectorAll('.sign-line').length
          };
        });
        assert(screen.documentWidth <= width, `${code}/${width}: no document-wide horizontal scrolling`);
        assert(screen.ticks.length > 0 && screen.ticks.every(tick => tick.fontSize >= 16), `${code}/${width}: every risk and confirmation remains readable`);
        assert(screen.agents.every(agent => agent.left >= 0 && agent.right <= width + 1), `${code}/${width}: all medicine risk panels fit in the viewport`);
        assert(screen.signatures >= 4, `${code}: preserve all patient/clinician signature and date fields`);
        for (const caption of screen.captions) assert(contrast(caption.color, [255, 255, 255]) >= 4.5, `${code}/${width}: footer and signature contrast must meet 4.5:1`);
        assert(screen.captions.every(caption => caption.fontSize >= 13), `${code}/${width}: captions must be readable on screen`);

        await page.emulateMedia({ media: 'print' });
        const print = await page.locator('.consent-sheet').evaluate(sheet => ({
          width: sheet.getBoundingClientRect().width,
          text: sheet.textContent.replace(/\s+/g, ' ').trim(),
          signatures: sheet.querySelectorAll('.sign-line').length,
          gridColumns: getComputedStyle(sheet.querySelector('.agent-grid')).gridTemplateColumns.split(' ').length,
          agents: sheet.querySelectorAll('.agent').length,
          ticks: [...sheet.querySelectorAll('.tick')].map(el => parseFloat(getComputedStyle(el).fontSize)),
          captions: [...sheet.querySelectorAll('.footer,.footer b,.sign-line,.field')].map(el => getComputedStyle(el).color.match(/[\d.]+/g).map(Number))
        }));
        assert(Math.abs(print.width - 210 * 96 / 25.4) < 1, `${code}: original A4 print width is preserved`);
        assert.equal(print.text, screen.text, `${code}: screen reflow must preserve all print text`);
        assert.equal(print.signatures, screen.signatures, `${code}: print retains every signature field`);
        assert.equal(print.gridColumns, printColumns.get(code), `${code}: preserve original printed risk-column layout`);
        assert(print.ticks.every(size => size < 16), `${code}: screen typography must not change A4 print geometry`);
        for (const color of print.captions) assert(contrast(color, [255, 255, 255]) >= 4.5, `${code}: print footer/signatures must also meet 4.5:1`);
        await page.emulateMedia({ media: 'screen' });
        if (evidence && code === '00568') {
          await page.screenshot({ path: path.join(evidence, `consent-form-${width}.png`), fullPage: true });
          if (width === 1440) {
            await page.emulateMedia({ media: 'print' });
            await page.pdf({ path: path.join(evidence, 'consent-form.pdf'), preferCSSPageSize: true, printBackground: true });
            await page.emulateMedia({ media: 'screen' });
          }
        }
        results.push({ code, width, agents: screen.agents, signatures: screen.signatures, printWidth: print.width });
      }

      await page.goto(`${server.url}/patient/00568/supportive-care.html`, { waitUntil: 'load' });
      const picker = page.locator('#support-phase');
      await page.locator('link[href*="clinical-screen.css"]').waitFor({ state: 'attached' });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}: phase picker must fit before a choice`);
      for (const phase of ['induction', 'maintenance']) {
        await picker.selectOption(phase);
        assert.equal(await page.locator('[data-support-phase]:visible').count(), 1, 'Exactly one selected phase is visible');
        const section = page.locator(`[data-support-phase="${phase}"]`);
        const region = section.getByRole('region', { name: 'Supportive medicines: medicine, dose and timing' });
        assert.equal(await region.count(), 1, 'Each medicines table has a named scroll region');
        await region.focus();
        assert(await region.evaluate(el => el === document.activeElement), 'Table region supports keyboard focus');
        const screen = await region.evaluate(el => ({
          width: el.clientWidth, scrollWidth: el.scrollWidth,
          rows: [...el.querySelectorAll('tr')].map(row => row.textContent.replace(/\s+/g, ' ').trim()),
          columns: [...el.querySelectorAll('th')].map(cell => cell.textContent.trim()),
          focus: getComputedStyle(el).outlineStyle
        }));
        assert.deepEqual(screen.columns, ['Medicine', 'Dose / route', 'When'], 'Retain all three clinical columns');
        assert.equal(screen.focus, 'solid', 'A keyboard user must see the focused table');
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}/${phase}: table overflow is contained`);
        if (width === 390) {
          assert(screen.scrollWidth > screen.width, 'Mobile retains full-size clinical table in its own scroll region');
          for (let step = 0; step < 25; step++) await page.keyboard.press('ArrowRight');
          await page.waitForFunction(() => {
            const el = document.activeElement;
            return el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
          });
          assert(await region.evaluate(el => el.scrollLeft + el.clientWidth >= el.scrollWidth - 2), 'Keyboard reaches the final timing column');
          await region.evaluate(el => { el.scrollLeft = 0; });
        }
        await page.emulateMedia({ media: 'print' });
        assert.equal(await page.locator('[data-support-phase]:visible').count(), 1, 'Printing retains only the selected phase');
        assert.equal(await region.evaluate(el => getComputedStyle(el).overflowX), 'visible', 'Printed clinical columns cannot be clipped by scrolling');
        assert.equal(await region.evaluate(el => getComputedStyle(el).outlineStyle), 'none', 'Keyboard focus decoration must not appear on the printed script');
        assert.deepEqual(await region.locator('tr').allTextContents().then(rows => rows.map(row => row.replace(/\s+/g, ' ').trim())), screen.rows, 'Printing preserves every dose, timing and caution');
        await page.emulateMedia({ media: 'screen' });
        if (evidence && phase === 'induction') {
          await page.screenshot({ path: path.join(evidence, `supportive-care-${width}.png`), fullPage: true });
          if (width === 1440) {
            await page.emulateMedia({ media: 'print' });
            await page.pdf({ path: path.join(evidence, 'supportive-care.pdf'), preferCSSPageSize: true, printBackground: true });
            await page.emulateMedia({ media: 'screen' });
          }
        }
      }
      assert.deepEqual(errors, [], 'Clinical forms must not raise browser errors');
      await page.close();

      // Static phase scripts must retain the same safe reading layout when
      // JavaScript is unavailable, including their complete printable tables.
      const staticPage = await browser.newPage({ viewport: { width, height: 900 }, javaScriptEnabled: false });
      await staticPage.goto(`${server.url}/patient/00568/supportive-care.html`, { waitUntil: 'load' });
      assert(await staticPage.getByRole('heading', { name: 'Open one phase' }).isVisible(), 'No-JavaScript users can choose a direct phase script');
      for (const phase of ['induction', 'maintenance']) {
        await staticPage.goto(`${server.url}/patient/00568/support-${phase}.html`, { waitUntil: 'load' });
        assert.equal(await staticPage.locator('link[href*="clinical-screen.css"]').count(), 1, 'Static phase scripts link the shared responsive stylesheet');
        const region = staticPage.getByRole('region', { name: 'Supportive medicines: medicine, dose and timing' });
        assert.equal(await region.count(), 1, 'Static clinical tables retain their accessible scroll region without JavaScript');
        assert.deepEqual(await region.locator('th').allTextContents(), ['Medicine', 'Dose / route', 'When']);
        assert(await staticPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}/${phase}: no-JavaScript script must fit the viewport`);
        await staticPage.emulateMedia({ media: 'print' });
        assert.equal(await region.evaluate(el => getComputedStyle(el).overflowX), 'visible', 'No-JavaScript print retains every column');
        await staticPage.emulateMedia({ media: 'screen' });
      }
      await staticPage.close();
    }
    if (evidence) fs.writeFileSync(path.join(evidence, 'results.json'), JSON.stringify(results, null, 2) + '\n');
    console.log(`Clinical form checks passed: ${consentCodes.size} consent aids covering ${shapes.size} risk-grid shapes; both support phases; mobile/desktop; screen/print.`);
  } finally { await browser.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
