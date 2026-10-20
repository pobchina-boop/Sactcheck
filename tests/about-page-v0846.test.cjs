'use strict';
// Navigation integrity: the homepage must reach the standalone page, and all
// its destinations must resolve in both the repository and the Pages artefact.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..', process.argv[2] || '.');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('about.html');
const home = read('index.html');
const release = JSON.parse(read('data/app-release.json')).release;
const entry = home.match(/<a\b[^>]*class="[^"]*homepage-about-link[^"]*"[^>]*>/)?.[0];
assert(entry && /href="about\.html"/.test(entry), 'Homepage must link directly to the About page');
assert(!entry.includes('data-open-study-info'), 'About must not open the study dialog');
assert(home.includes('data-open-study-info>Study information'), 'Study information stays independently accessible');
assert.equal((html.match(/<h1\b/g) || []).length, 1);
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
assert.equal(new Set(ids).size, ids.length, 'About page IDs must be unique');
assert(html.includes(`<meta name="sactcheck-release" content="${release}">`), 'About release follows the app');
let checked = 0;
for (const [, value] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
  const url = new URL(value.replaceAll('&amp;', '&'), 'https://sactcheck.com/about.html');
  if (url.origin !== 'https://sactcheck.com') continue;
  const target = decodeURIComponent(url.pathname).replace(/^\//, '');
  assert(fs.existsSync(path.join(root, target)), `Missing About destination: ${target}`);
  if (url.hash) {
    const id = decodeURIComponent(url.hash.slice(1));
    assert(read(target).includes(`id="${id}"`), `Missing section: ${value}`);
  }
  checked++;
}
console.log(`About page navigation passed: ${checked} local links/assets, anchors, entry point and release (${path.basename(root)}).`);
