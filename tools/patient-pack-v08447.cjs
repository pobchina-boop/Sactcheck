'use strict';
// Extend the approved pack without replacing its anatomical renderer or geometry.
const previous = require('./patient-pack-v08446.cjs');
const codes = new Set(["00207", "00314", "00385", "00387", "00417", "00418", "00552", "00696", "00705", "00706"]);
const applies = d => codes.has(d.code) && (d.suite_release === '0.84.47' || d.retrospective_audit_v08447);
function enhance(d, html) {
  if (!applies(d)) return html;
  return html.replace(/SACTCheck v0\.84\.\d+/g, 'SACTCheck v0.84.47')
    .replace(/Document revised \d+ November 2026/g, 'Document revised 10 November 2026')
    .replace('Open your CUH contact / treatment card', 'Open your treatment / contact card');
}
function render(d) {
  return Object.fromEntries(Object.entries(previous.render(d)).map(([key, html]) => {
    html = enhance(d, html);
    // Keep wording, font sizes and the approved map/card dimensions unchanged.
    // Tighter print-only spacing prevents long HNSCC callouts being clipped.
    if (applies(d) && d.patient_context === 'head_neck') html = html.replace('</head>', '<style id="head-neck-pack-spacing-v08447">@media print{.pt-effects .hcc-organ-card{padding:1.2mm}.pt-effects .hcc-drug-label{margin:2px 0 1px}.pt-effects .hcc-organ-card p{margin:.5mm 0!important}.pt-wallet-back .pt-record-qr{margin:.5mm 0}.pt-wallet-back>p{margin:.5mm 0}}</style></head>');
    if (applies(d) && ['00417','00418'].includes(d.code)) html = html.replace('</head>', '<style id="combination-pack-spacing-v08447">@media print{.pt-effects .hcc-organ-card{padding:1mm!important}.pt-effects .hcc-organ-head{padding:1px 3px!important}.pt-effects .hcc-drug-label{margin:1px 0!important}.pt-effects .hcc-organ-card p{margin:.3mm 0!important}.pt-effects .hcc-organ-card[data-hcc-target="skin"]{padding:.5mm!important}.pt-effects .hcc-organ-card[data-hcc-target="skin"] .hcc-organ-head{padding:.5px 3px!important}}</style></head>');
    if (applies(d) && ['00314','00696'].includes(d.code)) html = html.replace('</head>', '<style id="rolling-wallet-spacing-v08447">@media print{.pt-wallet-back .pt-record-qr{margin:.3mm 0}.pt-wallet-back>p{margin:.3mm 0}.pt-wallet-back>h3{margin-bottom:1mm}}</style></head>');
    return [key, html];
  }));
}
function wiki(d, html) {
  html = enhance(d, previous.wiki(d, html));
  if (!applies(d) || html.includes('id="anatomical-effects"')) return html;
  if (!d.anatomy?.length) throw Error('Missing regimen-specific anatomy: ' + d.code);
  const map = require('../js/patient-anatomy-v08431.js').render(d);
  const section = '<section class="pk-section" id="anatomical-effects"><div class="pk-eyebrow">Regimen-specific side effects</div><h2>Your anatomical side-effect map</h2>' + map + '</section>';
  if (!html.includes('<section class="pk-section" id="phases">')) throw Error('Missing anatomy insertion point');
  return html.replace('<section class="pk-section" id="phases">', section + '<section class="pk-section" id="phases">')
    .replace('</head>', '<link rel="stylesheet" href="../../assets/patient/hcc-bodymap-v08431.css"></head>');
}
module.exports = {...previous, render, wiki, applies};
