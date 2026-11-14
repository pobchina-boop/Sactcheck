'use strict';
// Extend the approved pack without replacing its anatomical renderer or geometry.
const previous = require('./patient-pack-v08450.cjs');
const codes = new Set(['00103', '00577', '00233', '00574', '00693']);
const applies = d => codes.has(d.code) && (d.suite_release === '0.84.51' || d.retrospective_audit_v08451);
function continuous(d,html){
 if(!applies(d)||!['00103', '00577', '00233', '00574', '00693'].includes(d.code))return html;
 const replacements=[
 ['A typical 28-day cycle','Your 28-day review window'],['Your 28-day cycle.','Your continuous-treatment review window.'],
 ['My cycle record','My review record'],['<th>Cycle</th>','<th>Review</th>'],['Cycle plan: team to confirm','Continuous treatment: team reviews dose'],
 ['Latest treatment date:','Latest review date:'],['One cycle per page.','One review per page.'],['another cycle of the same phase','the next review'],
 ['Read the whole cycle as text','Read the whole review window as text'],['this cycle’s Day 1 date','this review period’s first date'],
 ['The next cycle starts 28 days after this one, if your team confirms it.','Treatment continues daily across review dates unless your team tells you to hold or stop. No automatic rest week is scheduled.'],
 ['Start with the overview, explore the cycle,','Start with the overview, explore the review calendar,'],
 ['The team dates and initials each recorded treatment unit when complete. A cycle is complete after its final planned dose; a weekly-treatment stamp records that weekly dose. Delays, omitted doses or a changed plan need a note or a replacement card. A stamp does not approve the next treatment. Keep any medicine-specific alert card too.','The team records each review and the current daily dose. Recording boxes do not imply a fixed course or a rest period. Record any held dose or changed plan. An entry does not authorise a restart; keep any medicine-specific alert card too.']];
 for(const [a,b]of replacements)html=html.replaceAll(a,b);
 return html;
}
function enhance(d, html) {
  if (!applies(d)) return html;
  return continuous(d,html).replace(/SACTCheck v0\.84\.\d+/g, 'SACTCheck v0.84.51')
    .replace(/Document revised \d+ November 2026/g, 'Document revised 14 November 2026')
    .replace('Open your CUH contact / treatment card', 'Open your treatment / contact card');
}
function render(d) {
  return Object.fromEntries(Object.entries(previous.render(applies(d)?{...d,title:({'00103':'Abiraterone + prednisolone','00577':'Abiraterone + prednisolone','00233':'Enzalutamide','00574':'Apalutamide','00693':'Darolutamide'}[d.code]),treatment_scope_notice:d.context_label}:d)).map(([key, html]) => {
    html = enhance(d, html);
    // Keep wording, font sizes and the approved map/card dimensions unchanged.
    // Tighter print-only spacing prevents long HNSCC callouts being clipped.
    if (applies(d)) {
      html = html.replace(/(<svg[^>]*class="hcc-static-connectors"[^>]*>)([\s\S]*?)(<\/svg>)/g,(_,open,lines,close)=>open+lines.replace(/y2="([0-9.]+)"/g,(_,y)=>'y2="'+(Number(y)*146/160).toFixed(4)+'"')+close);
      html = html.replace('</head>', '<style id="head-neck-pack-spacing-v08451">@media print{.pt-effects .hcc-visual-stage,.pt-effects .hcc-static-connectors{height:160mm}.pt-effects .hcc-organ-card{height:calc(160mm / var(--bodymap-rows,4));padding:.5mm!important}.pt-effects .hcc-organ-head{padding:.5px 2px!important}.pt-effects .hcc-drug-label{margin:0!important}.pt-effects .hcc-organ-card p{margin:.2mm 0!important;line-height:1.1!important}.pt-effects>p{margin:1mm 0}.pt-effects .pt-urgent{margin:1mm 0;padding:1.3mm}.pt-effects>footer{margin-top:1mm;padding-top:1mm}.pt-wallet-back .pt-record-qr{margin:.5mm 0}.pt-wallet-back>p{margin:.5mm 0}}</style></head>');
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
