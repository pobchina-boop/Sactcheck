'use strict';
// Extend the approved pack without replacing its anatomical renderer or geometry.
const previous = require('./patient-pack-v08461.cjs');
const baseCodes = new Set(['00374', '00462', '00554']);
const contexts = new Map([['00228', 'liposarcoma'], ['00205', 'sarcoma']]);
function context(d) {
  if (d.context_id && d.patient_context && d.context_id !== d.patient_context) return null;
  return d.context_id || d.patient_context || '';
}
function applies(d) {
  if (d.suite_release !== '0.84.62') return false;
  const kind = context(d);
  return (baseCodes.has(d.code) && kind === '') || (contexts.has(d.code) && kind === contexts.get(d.code));
}
function continuous(d, html) {
  // Preserve prior continuous-treatment behaviour for the existing GIST suites.
  return previous.continuous(d, html);
}
function enhance(d, html) {
  if (!applies(d)) return html;
  if(d.administration_route==='intravesical')html=html.replaceAll('Call oncology','Call your treatment team').replaceAll('call oncology','call your treatment team').replaceAll('Oncology daytime','Treatment team daytime');
  return continuous(d,html).replace(/SACTCheck v0\.84\.\d+/g, 'SACTCheck v0.84.62')
    .replace(/Document revised \d+ November 2026/g, 'Document revised 18 November 2026')
    .replace('Open your CUH contact / treatment card', 'Open your treatment / contact card');
}
function render(d) {
  if (!applies(d)) return previous.render(d);
  return Object.fromEntries(Object.entries(previous.render(d)).map(([key, html]) => {
    html = enhance(d, html);
    // Keep wording, font sizes and the approved map/card dimensions unchanged.
    // Tighter print-only spacing prevents long regimen-specific callouts being clipped.
    if (applies(d)) {
      html = html.replace(/(<svg[^>]*class="hcc-static-connectors"[^>]*>)([\s\S]*?)(<\/svg>)/g,(_,open,lines,close)=>open+lines.replace(/y2="([0-9.]+)"/g,(_,y)=>'y2="'+(Number(y)*146/160).toFixed(4)+'"')+close);
      html = html.replace('</head>', '<style id="sarcoma-pack-spacing-v08462">@media print{.pt-effects .hcc-visual-stage,.pt-effects .hcc-static-connectors{height:160mm}.pt-effects .hcc-organ-card{height:calc(160mm / var(--bodymap-rows,4));padding:.5mm!important}.pt-effects .hcc-organ-head{padding:.5px 2px!important}.pt-effects .hcc-drug-label{margin:0!important}.pt-effects .hcc-organ-card p{margin:.2mm 0!important;line-height:1.1!important}.pt-effects>p{margin:1mm 0}.pt-effects .pt-urgent{margin:1mm 0;padding:1.3mm}.pt-effects>footer{margin-top:1mm;padding-top:1mm}.pt-wallet-back .pt-record-qr{margin:.5mm 0}.pt-wallet-back>p{margin:.5mm 0}.pt-wallet-front header{margin-bottom:1mm!important}.pt-wallet-back h3{margin-bottom:.5mm!important}.pt-wallet-back>p{margin:.25mm 0!important}.pt-wallet-back .pt-record-qr{margin:0!important}}</style></head>');
    }
    if (applies(d) && d.code === '00554') html = html.replace('</head>', '<style id="sarcoma-wallet-00554-v08462">@media print{.pt-wallet-front header{padding-top:1mm!important;padding-bottom:1mm!important}.pt-wallet-front p{margin:.3mm 0!important}.pt-wallet-front .pt-card-urgent{padding:.7mm!important;margin:.5mm 0!important}}</style></head>');
    return [key, html];
  }));
}
function wiki(d, html) {
  if (!applies(d)) return previous.wiki(d, html);
  // These real release deliverables are authored before the source freeze.
  // Their later publication must not add links and invalidate the PDF inputs.
  if (!html.includes('data-sarcoma-downloads="v08462"')) {
    if (!html.includes('</h1>')) throw Error('Missing knowledge title: ' + d.code);
    html = html.replace('</h1>', '</h1><nav class="scv-document-downloads no-print" data-sarcoma-downloads="v08462" aria-label="Printable treatment information"><div class="scv-document-intro"><strong>Print or keep a copy</strong><span>Use alongside your personal treatment plan.</span></div><div class="scv-document-options"><a href="handbook.pdf" download>Complete treatment handbook · PDF</a><a href="knowledge.pdf" download>Full treatment reference · PDF</a></div></nav>');
  }
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
