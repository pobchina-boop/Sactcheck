'use strict';
// Extend the approved pack without replacing its anatomical renderer or geometry.
const previous = require('./patient-pack-v08462.cjs');
const baseCodes = new Set(['00420', '00463', '00100', '00596', '00680']);
function context(d) {
  if (d.context_id && d.patient_context && d.context_id !== d.patient_context) return null;
  return d.context_id || d.patient_context || '';
}
function applies(d) {
  if (d.suite_release !== '0.84.63') return false;
  const kind = context(d);
  return baseCodes.has(d.code) && kind === '';
}
function continuous(d, html) {
  if (!applies(d)) return previous.continuous(d, html);
  if (d.schedule_kind !== 'reference-course') return html;
  const unit = d.patient_summary?.card_record_unit;
  const expected = d.code === '00463' ? 'treatment visit' : d.code === '00100' ? 'infusion' : null;
  if (!expected || unit !== expected || d.patient_summary.card_cycle_count !== null) {
    throw Error('Reference-course record contract is incomplete: ' + d.code);
  }
  const label = unit === 'infusion' ? 'Infusion' : 'Treatment visit';
  const plural = unit === 'infusion' ? 'infusions' : 'treatment visits';
  const weeks = d.code === '00463' ? 29 : 36;
  html = html.replaceAll(String(d.cycle_days) + '-day cycle', weeks + '-week reference course')
    .replaceAll('explore the cycle', 'explore the reference course')
    .replaceAll('Baseline and cycle-specific checks', 'Baseline and scheduled checks')
    .replaceAll('personal cycle', 'personal treatment course')
    .replaceAll('Day of cycle', 'Day of reference course')
    .replaceAll('Read the whole cycle as text', 'Read the reference course as text')
    .replaceAll('prescribed doses, cycles, treatment changes and appointments', 'prescribed doses, treatment dates, reviews and changes')
    .replaceAll('My cycle record', 'My ' + unit + ' record')
    .replaceAll('<th>Cycle</th>', '<th>' + label + '</th>')
    .replaceAll('Cycle plan: team to confirm', label + ' plan: team to confirm')
    .replaceAll('Cycle number:', label + ' number:')
    .replaceAll('One cycle per page', 'One ' + unit + ' per page')
    .replaceAll('one cycle, one page', 'one ' + unit + ', one page')
    .replaceAll('One page per cycle.', 'One page per ' + unit + '.')
    .replaceAll('These pages are reusable recording sheets; the prescribed course length is stated above.', 'These are reusable treatment records; their number does not define the course length.')
    .replaceAll('The four pages are reusable recording sheets, not a prescribed four-cycle course.', 'These are reusable treatment records; their number does not define the course length.')
    .replaceAll('copy this sheet for another cycle of the same phase.', 'copy this sheet for another ' + unit + '.')
    .replaceAll('Record my cycles or reviews, symptoms and questions.', 'Record my ' + plural + ', symptoms and questions.')
    .replaceAll('The team confirms completed cycles on the paper card.', 'The team confirms completed ' + plural + ' on the paper card.')
    .replace('The team dates and initials each recorded treatment unit when complete. A cycle is complete after its final planned dose; a weekly-treatment stamp records that weekly dose. Delays, omitted doses or a changed plan need a note or a replacement card. A stamp does not approve the next treatment.', 'The team dates and initials each completed ' + unit + '. Record actual dates, omitted doses and changes to the agreed course. Delays or a changed plan need a note or a replacement card. A recorded ' + unit + ' does not approve the next treatment.');
  return html;
}
function enhance(d, html) {
  if (!applies(d)) return html;
  if(d.administration_route==='intravesical')html=html.replaceAll('Call oncology','Call your treatment team').replaceAll('call oncology','call your treatment team').replaceAll('Oncology daytime','Treatment team daytime');
  return continuous(d,html).replace(/SACTCheck v0\.84\.\d+/g, 'SACTCheck v0.84.63')
    .replace(/Document revised \d+ November 2026/g, 'Document revised 18 November 2026')
    .replace('Open your CUH contact / treatment card', 'Open your treatment / contact card');
}
function referenceSummary(d, html) {
  if (!applies(d) || !['00463', '00100'].includes(d.code) || d.schedule_kind !== 'reference-course') return html;
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const summary = d.patient_summary;
  if (summary.phases.length !== summary.cycle_blocks.length || !summary.phases.every((p, i) => p.title === summary.cycle_blocks[i].label && p.text === summary.cycle_blocks[i].text)) {
    throw Error('Reference stages must be exact duplicates before consolidation: ' + d.code);
  }
  const duplicate = '<ol class="pt-phases">' + summary.phases.map(p => '<li><b>' + esc(p.title) + '</b><span>' + esc(p.text) + '</span></li>').join('') + '</ol>';
  const retained = '<div class="pt-cycle">' + summary.cycle_blocks.map(p => '<div><b>' + esc(p.label) + '</b><span>' + esc(p.text) + '</span></div>').join('') + '</div>';
  if (html.split(duplicate).length !== 2 || !html.includes(retained)) throw Error('Exact complete reference-stage markup missing: ' + d.code);
  html = html.replace(duplicate, '');
  const basis = summary.monitoring[0].basis;
  if (!basis || !summary.monitoring.every(row => row.basis === basis)) throw Error('Mixed monitoring bases cannot be consolidated: ' + d.code);
  const table = html.match(/<table class="pt-tests">[\s\S]*?<\/table>/g);
  if (!table || table.length !== 1) throw Error('Expected one summary monitoring table: ' + d.code);
  const repeated = '<small>' + esc(basis) + '</small>';
  if (table[0].split(repeated).length - 1 !== summary.monitoring.length) throw Error('Monitoring basis count differs: ' + d.code);
  html = html.replace(table[0], table[0].split(repeated).join('') + '<p class="pt-small pt-monitoring-basis"><b>Source basis for all listed checks: </b>' + esc(basis) + '</p>');
  // Only the long MAP summary needs a wider text area and timing column.
  // Type sizes, all unique words, anatomy and wallet geometry are unchanged.
  if (d.code === '00463') html = html.replace('</head>', '<style id="map-reference-summary-v08463">@media print{@page map-reference-summary{size:A4;margin:8mm}.pt-first{page:map-reference-summary}.pt-first .pt-tests th:first-child{width:18%!important}.pt-first .pt-tests th:nth-child(2){width:24%!important}.pt-first .pt-tests th,.pt-first .pt-tests td{padding:.5mm 1mm!important}.pt-first .pt-cycle>div{padding:.5mm 1mm!important}.pt-first h2{margin:1mm 0 .5mm!important}.pt-first p{margin:.5mm 0!important}.pt-first .pt-urgent{padding:1mm!important}.pt-first .scv-schedule-graphic{margin:.5mm 0!important}.pt-first ul{margin:.5mm 0!important}.pt-first li{margin:.2mm 0!important}.pt-first footer{margin-top:1mm!important;padding-top:.5mm!important}}</style></head>');
  return html;
}
function render(d) {
  if (!applies(d)) return previous.render(d);
  return Object.fromEntries(Object.entries(previous.render(d)).map(([key, html]) => {
    html = enhance(d, html);
    if (key === 'print') html = referenceSummary(d, html);
    if (key === 'print' && ['00596', '00680'].includes(d.code)) {
      // These regimens' phase paragraphs contain distinct clinical instructions:
      // retain every one. Only the identical monitoring source basis is repeated.
      const basis = d.patient_summary.monitoring[0].basis;
      if (basis !== 'National regimen, relevant product information and individual specialist plan' || !d.patient_summary.monitoring.every(row => row.basis === basis)) throw Error('Unexpected ifosfamide summary source basis: ' + d.code);
      const table = html.match(/<table class="pt-tests">[\s\S]*?<\/table>/g);
      const repeated = '<small>' + basis + '</small>';
      if (!table || table.length !== 1 || table[0].split(repeated).length - 1 !== d.patient_summary.monitoring.length) throw Error('Expected complete ifosfamide monitoring table: ' + d.code);
      html = html.replace(table[0], table[0].split(repeated).join('') + '<p class="pt-small pt-monitoring-basis"><b>Source basis for all listed checks: </b>' + basis + '</p>');
      html = html.replace('</head>', '<style id="ifos-reference-summary-v08463">@media print{@page ifos-reference-summary{size:A4;margin:8mm}.pt-first{page:ifos-reference-summary}.pt-first .pt-tests th:first-child{width:18%!important}.pt-first .pt-tests th:nth-child(2){width:24%!important}.pt-first .pt-tests th,.pt-first .pt-tests td{padding:.5mm 1mm!important}.pt-first .pt-cycle>div{padding:.5mm 1mm!important}.pt-first h2{margin:1mm 0 .5mm!important}.pt-first p{margin:.5mm 0!important}.pt-first .pt-urgent{padding:1mm!important}.pt-first .scv-schedule-graphic{margin:.5mm 0!important}.pt-first ul{margin:.5mm 0!important}.pt-first li{margin:.2mm 0!important}.pt-first footer{margin-top:1mm!important;padding-top:.5mm!important}}</style></head>');
    }
    // Keep wording, font sizes and the approved map/card dimensions unchanged.
    // Tighter print-only spacing prevents long regimen-specific callouts being clipped.
    if (applies(d)) {
      html = html.replace(/(<svg[^>]*class="hcc-static-connectors"[^>]*>)([\s\S]*?)(<\/svg>)/g,(_,open,lines,close)=>open+lines.replace(/y2="([0-9.]+)"/g,(_,y)=>'y2="'+(Number(y)*146/160).toFixed(4)+'"')+close);
      html = html.replace('</head>', '<style id="sarcoma-pack-spacing-v08463">@media print{.pt-effects .hcc-visual-stage,.pt-effects .hcc-static-connectors{height:160mm}.pt-effects .hcc-organ-card{height:calc(160mm / var(--bodymap-rows,4));padding:.5mm!important}.pt-effects .hcc-organ-head{padding:.5px 2px!important}.pt-effects .hcc-drug-label{margin:0!important}.pt-effects .hcc-organ-card p{margin:.2mm 0!important;line-height:1.1!important}.pt-effects>p{margin:1mm 0}.pt-effects .pt-urgent{margin:1mm 0;padding:1.3mm}.pt-effects>footer{margin-top:1mm;padding-top:1mm}.pt-wallet-back .pt-record-qr{margin:.5mm 0}.pt-wallet-back>p{margin:.5mm 0}.pt-wallet-front header{margin-bottom:1mm!important}.pt-wallet-back h3{margin-bottom:.5mm!important}.pt-wallet-back>p{margin:.25mm 0!important}.pt-wallet-back .pt-record-qr{margin:0!important}}</style></head>');
    }
    if (d.code === '00100') html = html.replace('</head>', '<style id="mifamurtide-callout-spacing-v08463">@media print{.pt-effects .hcc-organ-card[data-hcc-target="kidneys"]{height:44mm!important}.pt-effects .hcc-organ-card[data-hcc-target="lungs"]{height:36mm!important}}</style></head>');
    if (d.code === '00463') html = html.replace('</head>', '<style id="map-wallet-spacing-v08463">@media print{.pt-wallet-front{padding:1.75mm 2.5mm!important}.pt-wallet-front header{margin:-1.75mm -2.5mm .5mm!important;padding:1mm 2.5mm!important}.pt-wallet-front .pt-card-urgent{padding:.5mm!important;margin:.5mm 0!important}.pt-wallet-back{padding:2mm 2.5mm!important}}</style></head>');
    if (['00596', '00680'].includes(d.code)) html = html.replace('</head>', '<style id="ifos-wallet-spacing-v08463">@media print{.pt-wallet-front{padding:1.75mm 2.5mm!important}.pt-wallet-front header{margin:-1.75mm -2.5mm .5mm!important;padding:1mm 2.5mm!important}.pt-wallet-front .pt-card-urgent{padding:.5mm!important;margin:.5mm 0!important}.pt-wallet-back{padding:2mm 2.5mm!important}}</style></head>');
    if (d.code === '00596' && key === 'print') html = html.replace('</head>', '<style id="ie-reference-rows-v08463">@media print{.pt-first .pt-cycle{display:block!important}.pt-first .pt-cycle>div{display:block!important;width:auto!important;border-right:0!important;border-bottom:1px solid #bfd2cd;padding:.3mm 1mm!important}.pt-first .pt-cycle>div:last-child{border-bottom:0}.pt-first .pt-cycle b,.pt-first .pt-cycle span{display:inline!important}.pt-first .pt-cycle b{margin-right:1mm}}</style></head>');
    return [key, html];
  }));
}
function wiki(d, html) {
  if (!applies(d)) return previous.wiki(d, html);
  // These real release deliverables are authored before the source freeze.
  // Their later publication must not add links and invalidate the PDF inputs.
  if (!html.includes('data-sarcoma-downloads="v08463"')) {
    if (!html.includes('</h1>')) throw Error('Missing knowledge title: ' + d.code);
    html = html.replace('</h1>', '</h1><nav class="scv-document-downloads no-print" data-sarcoma-downloads="v08463" aria-label="Printable treatment information"><div class="scv-document-intro"><strong>Print or keep a copy</strong><span>Use alongside your personal treatment plan.</span></div><div class="scv-document-options"><a href="handbook.pdf" download>Complete treatment handbook · PDF</a><a href="knowledge.pdf" download>Full treatment reference · PDF</a></div></nav>');
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
