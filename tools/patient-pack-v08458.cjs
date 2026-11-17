'use strict';
// Extend the approved pack without replacing its anatomical renderer or geometry.
const previous = require('./patient-pack-v08457.cjs');
const codes = new Set(['00282', '00622', '00628', '00450', '00759', '00333', '00337', '00338', '00583', '00846']);
const applies = d => codes.has(d.code) && (d.suite_release === '0.84.58' || d.retrospective_audit_v08458);
function continuous(d,html){
 if(!applies(d))return html;
 if(['continuous','reference-course'].includes(d.schedule_kind))html=html.replace(/28-day cycle/g,'28-day reference view').replace(/One cycle per page/g,'One review interval per page').replace(/Cycle number:/g,'Review number:');
 return html;
}
function enhance(d, html) {
  if (!applies(d)) return html;
  return continuous(d,html).replace(/SACTCheck v0\.84\.\d+/g, 'SACTCheck v0.84.58')
    .replace(/Document revised \d+ November 2026/g, 'Document revised 17 November 2026')
    .replace('Open your CUH contact / treatment card', 'Open your treatment / contact card');
}
function render(d) {
  return Object.fromEntries(Object.entries(previous.render(applies(d)?{...d,title:d.patient_summary.card_title,treatment_scope_notice:d.context_label}:d)).map(([key, html]) => {
    html = enhance(d, html);
    if (['00333','00338'].includes(d.code)) html=html.replace('</head>','<style id="gu58-mvac-monitoring-columns">@media print{.pt-first.pt-first .pt-tests th:first-child{width:12%!important}.pt-first.pt-first .pt-tests th:nth-child(2){width:20%!important}}</style></head>');
    // Keep wording, font sizes and the approved map/card dimensions unchanged.
    // Tighter print-only spacing prevents long regimen-specific callouts being clipped.
    if (applies(d)) {
      html = html.replace(/(<svg[^>]*class="hcc-static-connectors"[^>]*>)([\s\S]*?)(<\/svg>)/g,(_,open,lines,close)=>open+lines.replace(/y2="([0-9.]+)"/g,(_,y)=>'y2="'+(Number(y)*146/160).toFixed(4)+'"')+close);
      html = html.replace('</head>', '<style id="head-neck-pack-spacing-v08458">@media print{.pt-effects .hcc-visual-stage,.pt-effects .hcc-static-connectors{height:160mm}.pt-effects .hcc-organ-card{height:calc(160mm / var(--bodymap-rows,4));padding:.5mm!important}.pt-effects .hcc-organ-head{padding:.5px 2px!important}.pt-effects .hcc-drug-label{margin:0!important}.pt-effects .hcc-organ-card p{margin:.2mm 0!important;line-height:1.1!important}.pt-effects>p{margin:1mm 0}.pt-effects .pt-urgent{margin:1mm 0;padding:1.3mm}.pt-effects>footer{margin-top:1mm;padding-top:1mm}.pt-wallet-back .pt-record-qr{margin:.5mm 0}.pt-wallet-back>p{margin:.5mm 0}}</style></head>');
    }
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
module.exports = {...previous, render, wiki, applies, continuous};
