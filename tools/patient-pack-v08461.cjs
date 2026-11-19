'use strict';
// Extend the approved pack without replacing its anatomical renderer or geometry.
const previous = require('./patient-pack-v08460.cjs');
const contexts = new Set(['00325', '00719', '00244']);
function context(d) {
  if (d.context_id && d.patient_context && d.context_id !== d.patient_context) return null;
  return d.context_id || d.patient_context || '';
}
function applies(d) {
  if (d.suite_release !== '0.84.61') return false;
  const kind = context(d);
  return (d.code === '00335' && kind === '') || (contexts.has(d.code) && kind === 'gist');
}
function continuous(d,html){
 if(!applies(d))return html;
 if(['continuous','reference-course'].includes(d.schedule_kind)) {
  html=html.replace(/28-day cycle/g,'28-day reference view').replace(/One cycle per page/g,'One review interval per page').replace(/Cycle number:/g,'Review number:').replace(/one cycle, one page/g,'one review interval, one page').replace(/copy this sheet for another cycle of the same phase\./g,'copy this sheet for another review interval.');
  html=html.replaceAll('explore the cycle','explore the reference window')
    .replaceAll('Baseline and cycle-specific checks','Baseline and scheduled checks')
    .replaceAll('personal cycle','personal treatment course')
    .replaceAll('Day of cycle','Day of reference window')
    .replaceAll('Read the whole cycle as text','Read the reference window as text')
    .replaceAll('prescribed doses, cycles, treatment changes and appointments','prescribed doses, treatment days, reviews, treatment changes and appointments')
    .replaceAll('Record my cycles or reviews, symptoms and questions.','Record my reviews, symptoms and questions.');
  if (d.patient_summary.card_record_unit === 'review') html=html
    .replaceAll('My cycle record','My review record')
    .replaceAll('<th>Cycle</th>','<th>Review</th>')
    .replaceAll('Cycle plan: team to confirm','Review plan: team to confirm')
    .replaceAll('Latest treatment date:','Latest review date:')
    .replaceAll('One page per cycle.','One page per review.')
    .replaceAll('The team confirms completed cycles on the paper card.','The team confirms completed reviews on the paper card.')
    .replace('The team dates and initials each recorded treatment unit when complete. A cycle is complete after its final planned dose; a weekly-treatment stamp records that weekly dose. Delays, omitted doses or a changed plan need a note or a replacement card. A stamp does not approve the next treatment.', 'The team dates and initials each completed review. Record any agreed medicine change, missed dose or treatment pause. Delays or a changed plan need a note or a replacement card. A recorded review does not approve the next treatment.');
 }
 return html;
}
function enhance(d, html) {
  if (!applies(d)) return html;
  if(d.administration_route==='intravesical')html=html.replaceAll('Call oncology','Call your treatment team').replaceAll('call oncology','call your treatment team').replaceAll('Oncology daytime','Treatment team daytime');
  return continuous(d,html).replace(/SACTCheck v0\.84\.\d+/g, 'SACTCheck v0.84.61')
    .replace(/Document revised \d+ November 2026/g, 'Document revised 18 November 2026')
    .replace('Open your CUH contact / treatment card', 'Open your treatment / contact card');
}
function render(d) {
  return Object.fromEntries(Object.entries(previous.render(d)).map(([key, html]) => {
    html = enhance(d, html);
    // Keep wording, font sizes and the approved map/card dimensions unchanged.
    // Tighter print-only spacing prevents long regimen-specific callouts being clipped.
    if (applies(d)) {
      html = html.replace(/(<svg[^>]*class="hcc-static-connectors"[^>]*>)([\s\S]*?)(<\/svg>)/g,(_,open,lines,close)=>open+lines.replace(/y2="([0-9.]+)"/g,(_,y)=>'y2="'+(Number(y)*146/160).toFixed(4)+'"')+close);
      html = html.replace('</head>', '<style id="sarcoma-pack-spacing-v08461">@media print{.pt-effects .hcc-visual-stage,.pt-effects .hcc-static-connectors{height:160mm}.pt-effects .hcc-organ-card{height:calc(160mm / var(--bodymap-rows,4));padding:.5mm!important}.pt-effects .hcc-organ-head{padding:.5px 2px!important}.pt-effects .hcc-drug-label{margin:0!important}.pt-effects .hcc-organ-card p{margin:.2mm 0!important;line-height:1.1!important}.pt-effects>p{margin:1mm 0}.pt-effects .pt-urgent{margin:1mm 0;padding:1.3mm}.pt-effects>footer{margin-top:1mm;padding-top:1mm}.pt-wallet-back .pt-record-qr{margin:.5mm 0}.pt-wallet-back>p{margin:.5mm 0}.pt-wallet-front header{margin-bottom:1mm!important}.pt-wallet-back h3{margin-bottom:.5mm!important}.pt-wallet-back>p{margin:.25mm 0!important}.pt-wallet-back .pt-record-qr{margin:0!important}}</style></head>');
    }
    return [key, html];
  }));
}
function wiki(d, html) {
  if (!applies(d)) return previous.wiki(d, html);
  // These real release deliverables are authored before the source freeze.
  // Their later publication must not add links and invalidate the PDF inputs.
  if (!html.includes('data-sarcoma-downloads="v08461"')) {
    if (!html.includes('</h1>')) throw Error('Missing knowledge title: ' + d.code);
    html = html.replace('</h1>', '</h1><nav class="scv-document-downloads no-print" data-sarcoma-downloads="v08461" aria-label="Printable treatment information"><div class="scv-document-intro"><strong>Print or keep a copy</strong><span>Use alongside your personal treatment plan.</span></div><div class="scv-document-options"><a href="handbook.pdf" download>Complete treatment handbook · PDF</a><a href="knowledge.pdf" download>Full treatment reference · PDF</a></div></nav>');
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
