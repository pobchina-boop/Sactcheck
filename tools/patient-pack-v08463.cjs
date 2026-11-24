'use strict';
// Olaparib extends the existing patient pack; every clinical statement comes
// from its indication-specific profile. Other regimen output is unchanged.
const previous = require('./patient-pack-v08461.cjs');
const applies = d => ['00588','00746'].includes(d.code) && d.suite_release === '0.84.63';
function continuous(d, html) {
  if (!applies(d) || typeof html !== 'string') return html;
  if (d.code === '00588') html = html
    .replaceAll('28-day cycle','28-day reference view')
    .replaceAll('Your null-day timeline','Your daily tablet schedule')
    .replaceAll('One cycle per page','One review interval per page')
    .replaceAll('One page per cycle.','One page per review interval.')
    .replaceAll('one cycle, one page','one review interval, one page')
    .replaceAll('Cycle number:','Review number:')
    .replaceAll('My cycle record','My review record')
    .replaceAll('<th>Cycle</th>','<th>Review</th>')
    .replaceAll('Cycle plan: team to confirm','Review plan: team to confirm')
    .replaceAll('Latest treatment date:','Latest review date:')
    .replaceAll('copy this sheet for another cycle of the same phase.','copy this sheet for another review interval.')
    .replaceAll('The team confirms completed cycles on the paper card.','The team confirms completed reviews on the paper card.')
    .replaceAll('The team dates and initials each recorded treatment unit when complete. A cycle is complete after its final planned dose; a weekly-treatment stamp records that weekly dose. Delays, omitted doses or a changed plan need a note or a replacement card. A stamp does not approve the next treatment.', 'The team dates and initials each completed review. Record agreed dose changes, missed doses or treatment pauses. A recorded review does not approve the next treatment.')
    .replaceAll('personal cycle record','personal treatment record')
    .replaceAll('Day of cycle','Day of reference window')
    .replaceAll('Read the whole cycle as text','Read the reference window as text')
    .replaceAll('Baseline and cycle-specific checks','Baseline and scheduled checks');
  return html;
}
function enhance(d, html) {
  if (!applies(d) || typeof html !== 'string') return html;
  html = continuous(d, html)
    .replaceAll('087 12345678','________________')
    .replaceAll('087 87654321','________________')
    .replaceAll(' (EXAMPLE)','')
    .replaceAll('Insert numbers here','Team to complete: ____________________')
    .replace(/EXAMPLE (?:ONLY|NUMBERS ONLY) — [^<]+/g,'Your team must complete and check both contact numbers before patient use.')
    .replaceAll('<small>EXAMPLE NUMBERS — replace before patient use.</small>','')
    .replaceAll('Open your CUH contact / treatment card','Open your treatment / contact card')
    .replace(/Document revised \d+ November 2026/g,'Document revised 24 November 2026')
    .replace(/SACTCheck v0\.84\.(?:21|30|31|32|57)\b/g,'SACTCheck v0.84.63');
  const warning = d.code === '00746'
    ? 'Fever, new breathlessness, bleeding or severe abdominal pain? Call oncology now.'
    : 'Fever, new breathlessness, unusual bleeding or marked weakness? Call oncology now.';
  html = html.replaceAll('Unwell or fever? Call oncology now.', warning);
  const css = '<style id="olaparib-pack-spacing-v08463">@media print{.pt-effects .hcc-organ-card{height:36.5mm!important;padding:.5mm!important}.pt-effects .hcc-organ-head{padding:.5px 2px!important}.pt-effects .hcc-organ-card p{margin:.2mm 0!important;line-height:1.12!important}.pt-effects>p{margin:1mm 0}.pt-effects .pt-urgent{margin:1mm 0;padding:1.3mm}.pt-effects>footer{margin-top:1mm;padding-top:1mm}.pt-card-urgent{font-size:6.7pt!important;line-height:1.12!important}.pt-wallet-front header{margin-bottom:.6mm!important}.pt-wallet-front p{margin:.5mm 0!important}.pt-wallet-back h3{margin-bottom:.5mm!important}.pt-wallet-back>p{margin:.3mm 0!important}.pt-wallet-back .pt-record-qr{margin:0!important}.journey-print.journey-compact .journey-checks{break-before:page!important;page-break-before:always!important}.journey-checks>h3{break-after:avoid!important}.consent-sheet .consent-risk-module[data-consent-module="general-counselling"]{break-inside:avoid!important}}</style>';
  html = html.replace(/<style id="olaparib-pack-spacing-v08463">[\s\S]*?<\/style>/g,'');
  return html.replace('</head>',css+'</head>');
}
function render(d) {
  // The summary table already prints each exact baseline instruction. Keep
  // unique preparation advice without printing the identical paragraph twice.
  const profile = applies(d) ? {...d,patient_summary:{...d.patient_summary,
    preparation:d.patient_summary.preparation.filter(text=>!d.patient_summary.monitoring.some(row=>row.when===text))}} : d;
  return Object.fromEntries(Object.entries(previous.render(profile)).map(([key,html])=>[key,enhance(d,html)]));
}
function wiki(d, html) {
  html = previous.wiki(d, html);
  if (!applies(d)) return html;
  if (!html.includes('data-olaparib-downloads="v08463"')) html = html.replace('</h1>','</h1><nav class="scv-document-downloads no-print" data-olaparib-downloads="v08463" aria-label="Printable treatment information"><div class="scv-document-intro"><strong>Keep your treatment information</strong><span>Choose the document that suits you.</span></div><div class="scv-document-options"><a href="handbook.pdf" download>Complete treatment handbook · PDF</a><a href="guide.pdf" download>Three-page treatment pack · PDF</a><a href="knowledge.pdf" download>Full treatment reference · PDF</a></div></nav>');
  if (!html.includes('id="anatomical-effects"')) {
    if (!d.anatomy?.length) throw Error('Missing olaparib anatomical map');
    const map = require('../js/patient-anatomy-v08431.js').render(d);
    const section = '<section class="pk-section" id="anatomical-effects"><div class="pk-eyebrow">Your medicines and symptoms</div><h2>Your anatomical side-effect map</h2>'+map+'</section>';
    if (!html.includes('<section class="pk-section" id="phases">')) throw Error('Missing olaparib anatomy insertion point');
    html = html.replace('<section class="pk-section" id="phases">',section+'<section class="pk-section" id="phases">')
      .replace('</head>','<link rel="stylesheet" href="../../assets/patient/hcc-bodymap-v08431.css"></head>');
  }
  return enhance(d,html);
}
module.exports = {...previous, applies, continuous, enhance, render, wiki};
