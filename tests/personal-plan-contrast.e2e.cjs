'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.SACT_PLAYWRIGHT_MODULE || 'playwright');

const root = path.resolve(__dirname, '..');
const codes = fs.readdirSync(path.join(root, 'patient'), { withFileTypes: true })
  .filter(entry => entry.isDirectory() && /^\d+$/.test(entry.name))
  .map(entry => entry.name)
  .filter(code => {
    const file = path.join(root, 'patient', code, 'knowledge.html');
    return fs.existsSync(file) && /class=["'][^"']*\bpt-personal-plan\b/.test(fs.readFileSync(file, 'utf8'));
  }).sort();
assert(codes.length > 0, 'No personal-plan reference pages found; a zero-page run is not validation');
const evidence = process.env.SACT_CONTRAST_EVIDENCE_DIR;

function luminance(rgb) {
  const channels = rgb.slice(0, 3).map(value => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrast(foreground, background) {
  const first = luminance(foreground), second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

(async () => {
  if (evidence) fs.mkdirSync(evidence, { recursive: true });
  const server = await require('../tools/local-site-server.cjs').serve(process.env.SACT_SITE_DIR || root);
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
  const rows = [], failures = [];
  try {
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      for (const code of codes) {
        await page.goto(`${server.url}/patient/${code}/knowledge.html`, { waitUntil: 'load' });
        const panel = page.locator('.pt-personal-plan');
        await panel.waitFor({ state: 'visible' });
        assert.match(await panel.innerText(), /Your personal plan:/, `${code}: personal-plan reminder missing`);
        for (const media of ['screen', 'print']) {
          await page.emulateMedia({ media });
          const colors = await panel.evaluate(element => {
            const parse = color => color.match(/[\d.]+/g).map(Number);
            const background = getComputedStyle(element).backgroundColor;
            return {
              background: parse(background),
              foregrounds: [element, ...element.querySelectorAll('*')].filter(node => node.textContent.trim()).map(node => ({
                tag: node.tagName,
                color: parse(getComputedStyle(node).color),
                opacity: Number(getComputedStyle(node).opacity)
              }))
            };
          });
          assert.equal(colors.background[3] ?? 1, 1, `${code}: contrast requires the actual opaque panel background`);
          for (const foreground of colors.foregrounds) {
            assert.equal(foreground.color[3] ?? 1, 1, `${code}: translucent foreground needs compositing`);
            assert.equal(foreground.opacity, 1, `${code}: text must not be faded or hidden`);
            const ratio = contrast(foreground.color, colors.background);
            const row = { code, width, media, tag: foreground.tag, foreground: foreground.color, background: colors.background, contrast: ratio };
            rows.push(row);
            if (ratio < 4.5) failures.push(row);
          }
        }
        await page.emulateMedia({ media: 'screen' });
        assert(await panel.isVisible(), `${code}: reminder must remain visible`);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${code}: page-wide overflow`);
        if (evidence && ['00555', '00660'].includes(code)) {
          await page.screenshot({ path: path.join(evidence, `${code}-${width}-knowledge.png`) });
        }
      }
      assert.deepEqual(errors, [], 'Personal-plan pages must not raise browser errors');
      await page.close();
    }
    if (evidence) fs.writeFileSync(path.join(evidence, 'contrast-results.json'), JSON.stringify({ rows, failures }, null, 2) + '\n');
    assert.deepEqual(failures, [], 'Every personal-plan text color must meet 4.5:1 on screen and in print');
    console.log(`Personal-plan contrast passed: ${codes.length} routes, two widths, screen/print, including descendant text.`);
  } finally {
    await browser.close();
    await server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
