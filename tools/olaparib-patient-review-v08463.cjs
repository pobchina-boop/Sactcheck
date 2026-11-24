'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const pack = require('./patient-pack-v08463.cjs');
const ROUTES = Object.freeze(['00588','00588/prostate','00588/ovarian_first_line','00588/ovarian_relapsed','00588/pancreatic','00746']);
function profile(route) {
  if (!ROUTES.includes(route)) throw Error('Unreviewed olaparib route: '+route);
  const source = route.includes('/') ? 'data/patient-knowledge-contexts/'+route+'.json' : 'data/patient-knowledge/'+route+'.json';
  return JSON.parse(fs.readFileSync(path.join(root,source),'utf8'));
}
function transform(file,html) {
  const normalized = String(file).replaceAll('\\','/');
  if (/(?:^|\/)docs\/patient\//.test(normalized)) return html;
  const match = normalized.match(/(?:^|\/)patient\/(\d{5}(?:\/[a-z0-9_]+)?)\/([^/]+\.html)$/);
  if (!match || !ROUTES.includes(match[1]) || match[2] === 'scope.html') return html;
  const d = profile(match[1]);
  if (!pack.applies(d)) return html;
  if (match[2] === 'consent-form.html') html = require('./consent-core-v08455.cjs').transform(html,d,'patient/'+match[1]+'/consent-form.html');
  html = pack.enhance(d,html);
  // URL identity is established after context rebasing. A canonical address
  // and a QR never contain a patient identifier or silently change indication.
  const canonical = 'https://sactcheck.com/patient/'+match[1]+'/'+(match[2] === 'index.html' ? '' : match[2]);
  // The publication pass reinstalls its stylesheet block. Put URL identity
  // before that block so first generation and subsequent refreshes agree.
  html = html.replace(/<link\b[^>]*rel="canonical"[^>]*>/g,'');
  const canonicalTag = '<link rel="canonical" href="'+canonical+'">';
  const stylesheetMarker = '<!--scv43:stylesheet:start-->';
  if (html.includes(stylesheetMarker)) html = html.replace(stylesheetMarker,canonicalTag+stylesheetMarker);
  else html = html.replace('</head>',canonicalTag+'</head>');
  return html;
}
module.exports = {ROUTES, profile, transform, enhance:pack.enhance};
