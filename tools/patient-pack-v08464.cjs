'use strict';
// Extend the approved pack without replacing its anatomical renderer or geometry.
const previous = require('./patient-pack-sarcoma-v08463.cjs');
const baseCodes = new Set(['00675', '00747', '00504', '00754', '00757']);
function context(d) {
  if (d.context_id && d.patient_context && d.context_id !== d.patient_context) return null;
  return d.context_id || d.patient_context || '';
}
function applies(d) {
  if (d.suite_release !== '0.84.64') return false;
  const kind = context(d);
  return baseCodes.has(d.code) && kind === '';
}
function continuous(d, html) { return previous.continuous(d, html); }
function enhance(d, html) {
  if (!applies(d)) return html;
  if(d.administration_route==='intravesical')html=html.replaceAll('Call oncology','Call your treatment team').replaceAll('call oncology','call your treatment team').replaceAll('Oncology daytime','Treatment team daytime');
  return continuous(d,html).replace(/SACTCheck v0\.84\.\d+/g, 'SACTCheck v0.84.64')
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
      html = html.replace('</head>', '<style id="sarcoma-pack-spacing-v08464">@media print{.pt-effects .hcc-visual-stage,.pt-effects .hcc-static-connectors{height:160mm}.pt-effects .hcc-organ-card{height:calc(160mm / var(--bodymap-rows,4));padding:.5mm!important}.pt-effects .hcc-organ-head{padding:.5px 2px!important}.pt-effects .hcc-drug-label{margin:0!important}.pt-effects .hcc-organ-card p{margin:.2mm 0!important;line-height:1.1!important}.pt-effects>p{margin:1mm 0}.pt-effects .pt-urgent{margin:1mm 0;padding:1.3mm}.pt-effects>footer{margin-top:1mm;padding-top:1mm}.pt-wallet-back .pt-record-qr{margin:.5mm 0}.pt-wallet-back>p{margin:.5mm 0}.pt-wallet-front header{margin-bottom:1mm!important}.pt-wallet-back h3{margin-bottom:.5mm!important}.pt-wallet-back>p{margin:.25mm 0!important}.pt-wallet-back .pt-record-qr{margin:0!important}}</style></head>');
    }
    // The three exact repeated phase headings remain visible in the matching
    // chart captions. Preserve source DOM and every phase paragraph; the PDF
    // verifier requires ordered caption/title equality before accepting this.
    if (key === 'print' && ['00675','00747','00754'].includes(d.code)) {
      let css = "@media print{@page sarcoma-summary{size:A4;margin:8mm}.pt-first{page:sarcoma-summary}.pt-first .pt-tests th:first-child{width:15%!important}.pt-first .pt-tests th:nth-child(2){width:35%!important}.pt-first .pt-tests th,.pt-first .pt-tests td{padding:.3mm 1mm!important}.pt-first .pt-cycle>div{padding:.5mm 1mm!important}.pt-first h2{margin:1mm 0 .5mm!important}.pt-first p{margin:.5mm 0!important}.pt-first .pt-urgent{padding:1mm!important}.pt-first .scv-schedule-graphic{margin:.5mm 0!important}.pt-first ul,.pt-first ol{margin:.5mm 0!important}.pt-first li{margin:.2mm 0!important}.pt-first footer{margin-top:1mm!important;padding-top:.5mm!important}.pt-first h1{margin:.5mm 0!important}.pt-first .scv-schedule-graphic{padding:.25mm 2mm!important}.pt-first .scv-mini-window+.scv-mini-window{margin-top:.25mm!important;padding-top:.25mm!important}.pt-first .scv-mini-rows{row-gap:.5mm!important}.pt-first .pt-phases li{padding:.25mm 1mm!important}.pt-first .pt-phases span{margin-top:.3mm!important}.pt-first .pt-cycle{display:block!important}.pt-first .pt-cycle>div{display:block!important;width:auto!important;border-right:0!important;border-bottom:1px solid #bfd2cd;padding:.3mm 1mm!important}.pt-first .pt-cycle>div:last-child{border-bottom:0}.pt-first .pt-cycle b,.pt-first .pt-cycle span{display:inline!important}.pt-first .pt-cycle b{margin-right:1mm}.pt-first .pt-tests small{margin-top:.25mm!important}}@media print{.pt-first .pt-phases li>b{display:none!important}}";
      if (['00675','00747'].includes(d.code)) css += "@media print{.pt-first .scv-mini-window:first-child .scv-mini-rows[data-columns=\"1\"]>.scv-mini-row{width:calc(50% - 1.5mm)!important}}";
      html = html.replace('</head>', '<style id="sarcoma-summary-v08464">' + css + '</style></head>');
    }
    if (key === 'print' && ['00504','00757'].includes(d.code)) html = html.replace('</head>', '<style id="sarcoma-anatomy-page-v08464">' + "@media print{@page sarcoma-anatomy-long-alert{size:A4;margin:8mm}.pt-effects{page:sarcoma-anatomy-long-alert}.pt-effects h1{margin:1mm 0!important}.pt-effects .pt-urgent{margin:.5mm 0!important;padding:.7mm!important}.pt-effects .pt-urgent p{margin:.4mm 0!important}.pt-effects>footer{margin-top:.3mm!important;padding-top:.3mm!important}}" + '</style></head>');
    if (['00675','00747'].includes(d.code)) html = html.replace('</head>', '<style id="alternating-wallet-v08464">' + "@media print{.pt-wallet-front{padding:1.75mm 2.5mm!important}.pt-wallet-front header{margin:-1.75mm -2.5mm .5mm!important;padding:1mm 2.5mm!important}.pt-wallet-front .pt-card-urgent{padding:.5mm!important;margin:.5mm 0!important}.pt-wallet-back{padding:2mm 2.5mm!important}}" + '</style></head>');
    return [key, html];
  }));
}
function wiki(d, html) {
  if (!applies(d)) return previous.wiki(d, html);
  // These real release deliverables are authored before the source freeze.
  // Their later publication must not add links and invalidate the PDF inputs.
  if (!html.includes('data-sarcoma-downloads="v08464"')) {
    if (!html.includes('</h1>')) throw Error('Missing knowledge title: ' + d.code);
    html = html.replace('</h1>', '</h1><nav class="scv-document-downloads no-print" data-sarcoma-downloads="v08464" aria-label="Printable treatment information"><div class="scv-document-intro"><strong>Print or keep a copy</strong><span>Use alongside your personal treatment plan.</span></div><div class="scv-document-options"><a href="handbook.pdf" download>Complete treatment handbook · PDF</a><a href="knowledge.pdf" download>Full treatment reference · PDF</a></div></nav>');
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
