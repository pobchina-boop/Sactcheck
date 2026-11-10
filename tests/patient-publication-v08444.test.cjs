'use strict';

// Exercise the complete publication wrapper, including the visual pass. The
// source HTML below is a fixture; no published patient page is written here.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const publication = require('../tools/patient-publication-v08444.cjs');

const ROOT = path.resolve(__dirname, '..');
const STYLE43 = 'assets/patient/patient-visual-standard-v08443.css';
const STYLE44 = 'assets/patient/patient-visual-language-v08444.css';
const CORE = ['index.html', 'guide.html', 'knowledge.html', 'knowledge-print.html'];
const RAW_SCRIPT = '<script type="application/json">{"term":"PRRT","dose":12,"url":"https://example.test/PRRT"}</script>';

function sourceHtml(route = '00642', note = '') {
  const prefix = '../'.repeat(route.split('/').length + 1);
  return '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<title>PRRT fixture</title>' +
    '<link rel="stylesheet" href="' + prefix + 'assets/patient/patient-pack-v08431.css">' +
    // This intentionally stale link must be replaced after the v43 stylesheet.
    '<link rel="stylesheet" href="' + prefix + STYLE44 + '?old=1">' +
    '<style>.fixture:after{content:"PRRT"}</style></head><body>' +
    '<main id="main"><header><h1>Treatment information</h1></header>' +
    '<p>PRRT may involve an MRI and ECG. PRRT is written again.</p>' +
    '<p>' + note + '</p>' +
    '<section id="monitoring-schedule"><h2>Monitoring</h2><p>Your team confirms the dates.</p></section>' +
    '<a href="https://example.test/PRRT?test=ALT">Exact source link</a>' +
    '<a href="' + prefix + 'data/app-release.json">Release information</a>' +
    '<img src="' + prefix + 'assets/branding/sactcheck-mark.svg" alt="SACTCheck">' +
    '</main>' + RAW_SCRIPT +
    '<script src="' + prefix + 'js/sactcheck-release.js"></script></body></html>';
}

function stylesheetPaths(html, file) {
  return [...html.matchAll(/<link\b[^>]*\bhref=["']([^"']+patient-visual-(?:standard-v08443|language-v08444)\.css)["'][^>]*>/g)]
    .map(match => ({href:match[1], resolved:path.posix.normalize(path.posix.join(path.posix.dirname(file), match[1]))}));
}

function assertStyles(html, file) {
  const styles = stylesheetPaths(html, file);
  assert.deepEqual(styles.map(item => item.resolved), [STYLE43, STYLE44], file + ': shared style order and root-relative resolution');
  assert.equal((html.match(/data-sc44-visual-language=/g) || []).length, 1, file + ': one v44 stylesheet');
  assert(!html.includes('?old=1'), file + ': stale stylesheet removed');
}

function writeFixture(root, file, text) {
  const full = path.join(root, file);
  fs.mkdirSync(path.dirname(full), {recursive:true});
  fs.writeFileSync(full, text);
}

function temporaryRoot(t, options = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sactcheck-publication-v44-'));
  const route = options.route || '00642';
  const profile = route.includes('/') ? 'data/patient-knowledge-contexts/' + route + '.json' : 'data/patient-knowledge/' + route + '.json';
  t.after(() => fs.rmSync(root, {recursive:true, force:true}));
  writeFixture(root, 'package.json', JSON.stringify({version:'0.84.44'}));
  // The presentation layer now has a version separate from the content batch.
  // Preserve the original synthetic v44 rendering contract explicitly.
  writeFixture(root, 'data/patient-presentation-v08431.json', JSON.stringify({default_visual_release:'0.84.44'}));
  // This synthetic wrapper fixture has no historical companion clauses. Supply
  // its explicit empty review; production still requires the frozen real plan.
  const audit = JSON.stringify({fixture:true, clauses:[]});
  writeFixture(root, 'validation/fixture-retention-audit.json', audit);
  writeFixture(root, 'tools/patient-editorial-v08444.cjs', fs.readFileSync(path.join(ROOT, 'tools/patient-editorial-v08444.cjs'), 'utf8'));
  writeFixture(root, 'tools/patient-editorial-replacements-v08444.json', fs.readFileSync(path.join(ROOT, 'tools/patient-editorial-replacements-v08444.json'), 'utf8'));
  const terms = require('../tools/patient-editorial-v08444.cjs').TERMS;
  const hash = value => crypto.createHash('sha256').update(value).digest('hex');
  writeFixture(root, 'data/patient-canonical-retention-v08445.json', JSON.stringify({
    historical_audit:'validation/fixture-retention-audit.json', historical_audit_sha256:hash(audit),
    normalization:{terms_sha256:hash(JSON.stringify(terms))}, rows:[]
  }));
  writeFixture(root, 'validation/patient-design-v08443/scope.json', JSON.stringify({routes:[route]}));
  fs.mkdirSync(path.join(root, 'data/patient-knowledge'), {recursive:true});
  writeFixture(root, profile, fs.readFileSync(path.join(ROOT, profile), 'utf8'));
  writeFixture(root, 'data/patient-document-sections-v08443.json', fs.readFileSync(path.join(ROOT, 'data/patient-document-sections-v08443.json'), 'utf8'));
  // The overview now depends on the authored guide, wallet and shared renderer.
  // Keep the publication assertions independent using synthetic reference HTML.
  writeFixture(root, 'tools/patient-visual-standard-v08443.cjs', fs.readFileSync(path.join(ROOT, 'tools/patient-visual-standard-v08443.cjs'), 'utf8'));
  writeFixture(root, 'patient/' + route + '/sactcard.html', fs.readFileSync(path.join(ROOT, 'patient/' + route + '/sactcard.html'), 'utf8'));
  for (const name of CORE) if (name !== options.omit) writeFixture(root, 'patient/' + route + '/' + name,
    name === 'guide.html' ? fs.readFileSync(path.join(ROOT, 'patient/' + route + '/guide.html'), 'utf8') : sourceHtml(route));
  return root;
}

function runQuietly(options) {
  const log = console.log;
  try { console.log = () => {}; return publication.run(options); }
  finally { console.log = log; }
}

test('v44 complete wrapper is idempotent and keeps v43 then v44 styles for base and context documents', () => {
  for (const route of ['00642', '00320/neuroendocrine']) for (const name of CORE) {
    const file = 'patient/' + route + '/' + name;
    const once = publication.decorateGenerated(file, sourceHtml(route), ROOT);
    assertStyles(once, file);
    assert.equal(publication.decorateGenerated(file, once, ROOT), once, file + ': entire wrapper remains idempotent');
    if (name === 'guide.html') assert(!once.includes('data-sc44-monitoring-details='), 'Three-page guides do not acquire the detailed test panel');
  }
});

test('v44 full docs mirrors resolve assets correctly from both base and context paths', () => {
  for (const route of ['00642', '00320/neuroendocrine']) {
    const canonical = 'patient/' + route + '/knowledge.html';
    const mirror = 'docs/' + canonical;
    const canonicalBytes = publication.decorateGenerated(canonical, sourceHtml(route), ROOT);
    for (const input of [canonicalBytes, sourceHtml(route, 'Independent mirror wording stays present.')]) {
      const once = publication.decorateGenerated(mirror, input, ROOT);
      assertStyles(once, mirror);
      assert.equal(publication.decorateGenerated(mirror, once, ROOT), once, mirror + ': entire mirror pass remains idempotent');
      for (const asset of ['assets/patient/patient-pack-v08431.css', 'assets/branding/sactcheck-mark.svg', 'data/app-release.json', 'js/sactcheck-release.js']) {
        const relative = path.posix.relative(path.posix.dirname(mirror), asset);
        assert(once.includes('="' + relative + '"'), mirror + ': ' + asset + ' uses the mirror depth');
      }
      if (input.includes('Independent mirror wording')) assert(once.includes('Independent mirror wording stays present.'));
      assert(once.includes(RAW_SCRIPT), mirror + ': embedded clinical JSON remains byte-exact');
      assert(once.includes('href="https://example.test/PRRT?test=ALT"'), mirror + ': exact external URL retained');
    }
  }
});

test('v44 final first-use expansion includes inserted investigations without changing raw blocks or links', () => {
  const file = 'patient/00642/knowledge.html';
  const once = publication.decorateGenerated(file, sourceHtml(), ROOT);
  const panel = once.match(/<!-- sc44-monitoring-details:start -->([\s\S]*?)<!-- sc44-monitoring-details:end -->/)?.[1];
  assert(panel, 'Authored PRRT investigations are inserted');
  assert.equal((once.match(/data-sc44-monitoring-details=/g) || []).length, 1, 'Only one detailed investigation panel');
  for (const term of ['alanine aminotransferase (ALT)', 'aspartate aminotransferase (AST)', 'international normalised ratio (blood-clotting test) (INR)', 'multigated acquisition (heart pumping) scan (MUGA)']) {
    assert(panel.includes(term), 'Newly inserted panel expands ' + term);
  }
  assert(once.includes('peptide receptor radionuclide therapy (PRRT)'));
  assert(once.includes('magnetic resonance imaging (MRI)'));
  assert(once.includes('electrocardiogram (ECG)'));
  assert(once.includes('If part of your plan'), 'Conditional tests retain their qualification');
  assert(once.includes(RAW_SCRIPT), 'Raw clinical JSON remains byte-exact');
  assert(once.includes('<style>.fixture:after{content:"PRRT"}</style>'), 'Styles are not prose-rewritten');
  assert(once.includes('<title>PRRT fixture</title>'), 'Head text is retained');
  assert(once.includes('href="https://example.test/PRRT?test=ALT"'), 'External source URL is byte-exact');
  assert.equal(publication.decorateGenerated(file, once, ROOT), once);
});

test('v44 wrapper preserves refresh redirects with quoted, unquoted and spaced attributes', () => {
  for (const attribute of ['http-equiv="refresh"', "http-equiv='refresh'", 'http-equiv = "refresh"', 'http-equiv=refresh', 'HTTP-EQUIV = " REFRESH "']) {
    const html = '<!doctype html><html><head><meta ' + attribute + ' content="0;url=../../../patient/00642/"><title>Redirect</title></head><body>Redirecting…</body></html>';
    for (const file of ['patient/00642/index.html', 'docs/patient/00642/index.html']) {
      assert.equal(publication.decorateGenerated(file, html, ROOT), html, attribute + ': redirects are byte-exact');
    }
  }
});

test('v44 run derives an identical docs mirror from canonical output and keeps redirects byte-exact', t => {
  const root = temporaryRoot(t);
  const mirror = 'docs/patient/00642/knowledge.html';
  const redirectFile = 'docs/patient/00642/guide.html';
  const redirect = '<!doctype html><html><head><meta http-equiv = refresh content="0;url=../../../patient/00642/guide.html"></head><body>Continue</body></html>';
  writeFixture(root, mirror, sourceHtml());
  writeFixture(root, redirectFile, redirect);
  const result = runQuietly({root, write:true});
  assert(result.changed_files.includes(mirror), 'Full mirror receives the complete canonical publication');
  assert.deepEqual(result.retained_redirects, [redirectFile]);
  const canonical = fs.readFileSync(path.join(root, 'patient/00642/knowledge.html'), 'utf8');
  const mirrored = fs.readFileSync(path.join(root, mirror), 'utf8');
  assertStyles(canonical, 'patient/00642/knowledge.html');
  assertStyles(mirrored, mirror);
  assert.notEqual(mirrored, canonical, 'Mirror paths are not replaced with canonical byte-for-byte paths');
  assert.equal(fs.readFileSync(path.join(root, redirectFile), 'utf8'), redirect);
  assert.equal(runQuietly({root}).changed_files.length, 0, 'Repeated full publication run has no remaining changes');
});

test('v44 publication synchronizes inherited anatomy and subsequent source updates into full mirrors only', t => {
  for (const route of ['00642', '00320/neuroendocrine']) {
    const root = temporaryRoot(t, {route});
    // Start from an already published canonical route. The only permitted
    // publication mutations in this scenario are stale docs HTML mirrors.
    runQuietly({root, write:true});
    const canonical = 'patient/' + route + '/knowledge.html';
    const mirror = 'docs/' + canonical;
    const redirectFile = 'docs/patient/' + route + '/guide.html';
    const redirect = '<!doctype html><meta HTTP-EQUIV = " REFRESH " content="0;url=../../../../patient/' + route + '/guide.html"><p>Continue</p>';
    writeFixture(root, mirror, sourceHtml(route, 'An older reference without the anatomy section.'));
    writeFixture(root, redirectFile, redirect);
    const prefix = '../'.repeat(route.split('/').length + 1);
    const anatomy = '<section id="anatomical-effects"><h2>Detailed effects</h2><img src="' + prefix + 'assets/patient/anatomy-hcc-v0762.png" alt="Detailed anatomical map"><p>Retained detailed anatomy explanation.</p></section>';
    const navigation = '<nav><a href="guide.pdf?download=1#page=2">Guide</a><a href="./#side-effects">Treatment portal</a><a href="../index.html">Parent route</a><a href="#anatomical-effects">This page</a></nav>';
    for (const note of ['Current canonical source details.', 'Updated canonical source details after regeneration.']) {
      const updated = publication.decorateGenerated(canonical, sourceHtml(route, note).replace('</main>', anatomy + navigation + '</main>'), root);
      writeFixture(root, canonical, updated);
      const plan = runQuietly({root, mirrorsOnly:true});
      assert.deepEqual(plan.changed_files, [mirror], route + ': only the stale full mirror changes');
      assert.equal(plan.full_mirrors[0].canonical, canonical);
      runQuietly({root, write:true, mirrorsOnly:true});
      const mirrored = fs.readFileSync(path.join(root, mirror), 'utf8');
      assert.equal(fs.readFileSync(path.join(root, canonical), 'utf8'), updated, 'Canonical clinical HTML is not rewritten');
      assert.equal(fs.readFileSync(path.join(root, redirectFile), 'utf8'), redirect, 'Compatibility redirect remains byte-exact');
      assert(!mirrored.includes('An older reference without the anatomy section.'));
      assert(mirrored.includes(note), 'Current source wording propagates on every regeneration');
      assert(mirrored.includes('Retained detailed anatomy explanation.'), 'Inherited missing anatomy is restored');
      assert(mirrored.includes('id="anatomical-effects"'));
      assertStyles(mirrored, mirror);
      for (const target of ['assets/patient/anatomy-hcc-v0762.png', 'patient/' + route + '/guide.pdf?download=1#page=2', 'patient/' + route + '/#side-effects', path.posix.normalize('patient/' + route + '/../index.html')]) {
        const targetPath = target.split(/[?#]/)[0];
        const relative = path.posix.relative(path.posix.dirname(mirror), targetPath) + (targetPath.endsWith('/') ? '/' : '') + (target.match(/[?#].*$/)?.[0] || '');
        assert(mirrored.includes('="' + relative + '"'), 'Mirror resolves the original target: ' + target);
      }
      assert(mirrored.includes('href="#anatomical-effects"'), 'In-page anatomy anchor stays local');
      assert(mirrored.includes(RAW_SCRIPT), 'Clinical JSON remains byte-exact');
      assert.equal(runQuietly({root}).changed_files.length, 0, 'A second whole publication pass is byte-idempotent');
    }
  }
});

test('v44 mirror relocation preserves raw blocks and absolute URLs while rebasing exact local URL attributes', () => {
  const canonical = 'patient/00320/neuroendocrine/knowledge.html';
  const mirror = 'docs/' + canonical;
  const raw = '<script type="application/json">{"html":"<a href=\"../unchanged.html\">raw</a>","route":"../exact"}</script>' +
    '<style>.example:after{content:"<img src=\'../raw.png\'>"}</style>';
  const input = '<!doctype html><html><head>' + raw + '</head><body>' +
    '<!-- <img src="../comment.png"> -->' +
    '<img src=../../../assets/patient/anatomy-hcc-v0762.png><a HREF = \'guide.pdf?x=1&amp;y=2#page=2\'>Guide</a>' +
    '<object data="../../../assets/patient/visual-language-v08444/l-lysine.svg"></object>' +
    '<a href="https://example.test/a?q=1&amp;x=2">Source</a><a href="//example.test/a">Source</a><a href="/patient/00642/">Root</a>' +
    '<a href="?print=1">Query</a><svg><use xlink:href="#symbol"></use></svg></body></html>';
  const output = publication.mirrorFromCanonical(input, canonical, mirror);
  assert(output.includes(raw), 'Raw clinical JSON and style bodies are unchanged');
  assert(output.includes('<!-- <img src="../comment.png"> -->'));
  assert(output.includes('src=../../../../assets/patient/anatomy-hcc-v0762.png'));
  assert(output.includes("HREF = '../../../../patient/00320/neuroendocrine/guide.pdf?x=1&amp;y=2#page=2'"));
  assert(output.includes('data="../../../../assets/patient/visual-language-v08444/l-lysine.svg"'));
  for (const url of ['https://example.test/a?q=1&amp;x=2', '//example.test/a', '/patient/00642/', '?print=1']) assert(output.includes('href="' + url + '"'));
  assert(output.includes('xlink:href="#symbol"'));
});

test('v44 mirror-only publication rejects pending canonical changes before writing any page', t => {
  const root = temporaryRoot(t);
  const canonical = 'patient/00642/knowledge.html';
  const mirror = 'docs/' + canonical;
  const old = sourceHtml('00642', 'Old compatibility copy.');
  writeFixture(root, mirror, old);
  const before = fs.readFileSync(path.join(root, canonical), 'utf8');
  assert.throws(() => runQuietly({root, write:true, mirrorsOnly:true}), /Mirror-only publication requires already published canonical documents/);
  assert.equal(fs.readFileSync(path.join(root, canonical), 'utf8'), before);
  assert.equal(fs.readFileSync(path.join(root, mirror), 'utf8'), old);
});

test('v44 run reports every missing core document, including a published route omitted by dynamic discovery', t => {
  for (const name of CORE) {
    const root = temporaryRoot(t, {omit:name});
    // No explicit routes: a missing guide/reference must still be found via the
    // pinned published inventory rather than silently shrinking the route set.
    assert.throws(() => runQuietly({root}), error => {
      assert.equal(error.message, 'Missing published patient document: patient/00642/' + name);
      return true;
    });
  }
});
