'use strict';
// Scoped Enhertu presentation and patient review. Other regimen bytes are unchanged.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const content = require('../data/enhertu-patient-review-v08462.json');
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const applies = d => d.code === '00776';

function enhance(d, html) {
  if (!applies(d) || typeof html !== 'string') return html;
  const enhanced = html
    .replaceAll('087 12345678', '________________')
    .replaceAll('087 87654321', '________________')
    .replaceAll(' (EXAMPLE)', '')
    .replaceAll('Insert numbers here', 'Team to complete: ____________________')
    .replaceAll('EXAMPLE ONLY — team must replace both numbers before patient use.', 'Your team must complete and check both contact numbers before patient use.')
    .replaceAll('EXAMPLE NUMBERS ONLY — your team must replace these before patient use.', 'Your team must complete and check both contact numbers before patient use.')
    .replaceAll('<small>EXAMPLE NUMBERS — replace before patient use.</small>', '')
    .replaceAll('Unwell or fever? Call oncology now.', 'New cough, breathlessness or fever? Call oncology now.')
    .replaceAll('Phase: __________ Cycle plan: team to confirm', 'Last dose: ____________________')
    .replaceAll('Document revised 4 November 2026', 'Document revised 23 November 2026')
    .replaceAll('trastuzumab_deruxtecan', 'Enhertu (trastuzumab deruxtecan)')
    // The dedicated NCIS Enhertu row lists scheduled subsequent-day metoclopramide.
    // Complete its days/duration explicitly; do not label every support course rescue.
    .replaceAll('total steroid exposure and the rescue-medicine duration.', 'total steroid exposure and prescribed support-medicine durations.')
    .replaceAll('Individual changes / rescue duration:', 'Individual changes / exact support-medicine days and duration:')
    .replace(/SACTCheck v0\.84\.(21|30|31|32)\b/g, 'SACTCheck v0.84.62')
    // These generated footers report the product's authored suite release.
    // Historical stylesheet filenames and source-provenance versions stay intact.
    .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, footer => footer.replace(/\bv0\.84\.21\b/g, 'v0.84.62'))
    .replaceAll('data-hcc-pin="heart" style="left:56%;top:32%"', 'data-hcc-pin="heart" style="left:56%;top:26%"')
    .replaceAll('x2="52.16" y2="32"', 'x2="52.16" y2="26"')
    .replaceAll('href="./#side-effects"', 'href="./#overview-2"')
    // This is browser navigation, not an extra treatment instruction in the book.
    .replaceAll('<a href="logistics.html">Taking tablets / attending treatment</a>', '<a href="logistics.html" class="no-print">Your infusion visit</a>');
  // The shared map is 146 mm high. Use its three explicit equal-height slots:
  // the PDF renderer does not resolve the inherited calc(146mm / var(...)).
  // Its static connector starts are already at each slot's midpoint.
  const style = '<style id="enhertu-print-keep-v08462">@media print{.consent-sheet .consent-risk-module[data-consent-module="general-counselling"]{break-inside:avoid!important;page-break-inside:avoid!important}.journey-print.journey-compact .journey-checks{break-before:page!important;page-break-before:always!important;break-inside:avoid!important;page-break-inside:avoid!important}.journey-print .journey-checks>h3{break-after:avoid!important;page-break-after:avoid!important}.pt-effects .hcc-bodymap[data-regimen-map="00776"] .hcc-organ-card{height:48.666667mm!important}}</style>';
  const clean = enhanced.replace(/<style id="enhertu-print-keep-v08462">[\s\S]*?<\/style>/g, '');
  const needsKeep = clean.includes('data-consent-module="general-counselling"') || clean.includes('data-regimen-map="00776"') || /\bclass=["'][^"']*\bjourney-print\b/.test(clean);
  return needsKeep ? clean.replace('</head>', style + '</head>') : clean;
}

function cards(items) {
  return '<div class="ribo-grid">' + items.map(x => '<article class="ribo-card"><div><h3>' + esc(x.title) + '</h3><p>' + esc(x.text).replaceAll('call112/999','call 112 / 999') + '</p></div></article>').join('') + '</div>';
}

function sections() {
  const support = content.support_explanations.map(m => '<article class="ribo-card"><div><h3>' + esc(m.name) + '</h3><p>' + esc(m.role) + '</p><p><strong>When:</strong> ' + esc(m.schedule) + '</p><p>' + esc(m.precautions) + '</p></div></article>').join('');
  return '<section class="ribo-review enhertu-review" id="enhertu-safety" data-enhertu-review="2026-11-23">'
    + '<h2>Warning signs: know when to call</h2><p>These priority warnings sit alongside the full anatomical map. You do not need to decide whether treatment caused a symptom before contacting the team.</p>'
    + '<div class="ribo-urgent">' + cards(content.red_flags) + '</div>'
    + '<div class="ribo-alert"><h3>Carry the official Enhertu lung-safety alert card</h3><p>Show it to every healthcare professional you see, including outside your usual hospital. Keep it with your SACTCheck treatment card.</p><a href="' + esc(content.official_alert_card) + '" target="_blank" rel="noopener noreferrer">Open the official Irish Enhertu patient alert card (HPRA PDF)</a></div>'
    + '<h2 id="enhertu-common-effects">Common effects and practical support</h2>' + cards(content.common_effects)
    + '<h2 id="enhertu-support">Why these support medicines are used</h2><p>Enhertu has high emetogenic risk: nausea and vomiting can be significant, so prevention is planned before treatment and for the following days. This risk category does not predict your personal chance of symptoms after prevention. The national Enhertu schedule uses medicines that act through different pathways.</p>'
    + '<p>These explanations follow the written support plan. Your issued prescription confirms the actual medicines, doses, days and any personal changes. Scheduled prevention and rescue treatment have different jobs.</p><div class="ribo-grid">' + support + '</div>'
    + '<p><a href="support-treatment.html">Read the supportive-care plan</a> · <a href="support-treatment.pdf" download>Download the plan for prescriber review</a></p>'
    + '<h2>Medicines and the plan at home</h2><p>Bring your full medicine list, including over-the-counter treatments, supplements and contraception. Ask the oncology pharmacist before adding or stopping anything. Discuss fertility, pregnancy precautions and breastfeeding before treatment. Keep symptom notes and bring your passport to review; urgent symptoms need a call immediately.</p>'
    + '<p class="ribo-source">Clinical safety sources reviewed 23 November 2026: NCCP 00776 v3b; EMA Enhertu product information, sections 4.2–4.8 and patient leaflet; NCCP NCIS antiemetic medicines v8, Table 1; HPRA patient alert card. Clinical, pharmacy and patient/PPI review remains separate from this source review.</p></section>';
}

function passport(d) {
  const table = '<table class="ribo-record"><thead><tr><th scope="col">Symptom</th><th scope="col">None</th><th scope="col">Mild</th><th scope="col">Moderate</th><th scope="col">Severe</th><th scope="col">Date / effect on daily life</th><th scope="col">Clinician grade</th></tr></thead><tbody>' + content.symptoms.map(s => '<tr><th scope="row">' + esc(s) + '</th><td>□</td><td>□</td><td>□</td><td>□</td><td></td><td></td></tr>').join('') + '</tbody></table>';
  const warning = '<strong>Do not wait for a diary or appointment:</strong> new cough, breathlessness or fever needs immediate oncology advice. Report unusual bleeding, ongoing vomiting or poor fluid intake. Severe breathing difficulty, severe chest pain or collapse: 112 / 999.';
  const intro = '<section class="ribo-passport-intro"><p class="ribo-brand">SACTCheck · PATIENT PASSPORT</p><h1>Enhertu (trastuzumab deruxtecan)</h1><h2>Your symptoms, cycle by cycle</h2><p>Use one sheet for each prescribed 21-day cycle and bring it to review. Print extra copies as needed. Four blank sheets do not define a four-cycle course.</p><p>' + esc(d.schedule_summary) + '</p><div class="ribo-plan">Name: _____________________ Hospital number: _____________________<br>Hospital / oncology team: __________________________________________<br>Prescribed dose / date: _____________________________________________<br>Daytime contact: __________________ Out-of-hours: __________________<br>Backup contact route: _____________________________________________</div><h2>How to record symptoms</h2><p>Tick the worst level since the previous review, add dates and explain what the symptom stopped you doing. <strong>Mild:</strong> noticeable but usual activities remain possible. <strong>Moderate:</strong> affects activities or sleep; contact your team. <strong>Severe:</strong> substantially limits daily activities, self-care or intake; seek urgent advice.</p><p>These patient ratings are not formal Common Terminology Criteria for Adverse Events (CTCAE) grades. The clinician confirms the problem and its event-specific grade, then records the decision. Red flags override every rating box.</p><div class="ribo-alert">' + warning + '</div><p>Keep your official Enhertu alert card too. Store completed sheets securely. This printed passport does not send your information to SACTCheck.</p><img class="ribo-passport-qr" src="qr.png" alt="QR code for the Enhertu regimen patient portal"><p>https://sactcheck.com/patient/00776/</p></section>';
  const sheets = Array.from({length:4}, (_,i) => '<section class="ribo-cycle"><p class="ribo-brand">SACTCheck · Enhertu (trastuzumab deruxtecan)</p><h2>Cycle record</h2><div class="ribo-plan">Cycle number: ______ Infusion date: ______ Review date: ______<br>Prescribed dose: __________ Delays / dose changes: ___________________<br>Support medicines / changes: _______________________________________</div><p class="ribo-key">Record your worst symptoms. Moderate symptoms: contact the team. Severe symptoms: urgent advice. Do not wait to record a red flag.</p>' + table + '<h3>Tests and treatment review</h3><table class="ribo-checks"><thead><tr><th>Check</th><th>Due / completed</th><th>Reviewed by / result / action</th></tr></thead><tbody><tr><th>Blood count, kidneys and liver</th><td></td><td></td></tr><tr><th>Heart scan: baseline / 12-week plan / extra review</th><td></td><td></td></tr><tr><th>Breathing symptoms / other planned checks</th><td></td><td></td></tr></tbody></table><div class="ribo-plan">New medicines / questions / hospital attendances: ______________________<br>Clinician assessment, grade(s), treatment decision and reason: ___________<br>_________________________________________________________________<br>Reviewed by: ______________________ Next review: ____________________</div><p class="ribo-alert">' + warning + '</p><footer>Reusable sheet ' + (i+1) + ' · NCCP 00776 · Do not change treatment yourself.</footer></section>').join('');
  return '<!doctype html><html lang="en-IE"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Enhertu patient passport · SACTCheck</title><link rel="stylesheet" href="../../assets/patient/ribociclib-review-v08461.css"></head><body class="ribo-passport" data-enhertu-passport="2026-11-23"><nav class="ribo-downloads no-print"><a href="passport.pdf" download>Download patient passport PDF</a><a href="./">Patient portal</a></nav><main>' + intro + sheets + '</main></body></html>';
}

function transform(file, html) {
  const normalized = String(file).replaceAll('\\','/');
  if (/(?:^|\/)docs\/patient\//.test(normalized)) return html;
  const match = normalized.match(/(?:^|\/)patient\/00776\/([^/]+\.html)$/);
  if (!match) return html;
  const d = JSON.parse(fs.readFileSync(path.join(root,'data/patient-knowledge/00776.json')));
  // Complete-pathway generation applies the shared consent block after its
  // publication callback. Canonicalise it here first so the scoped print rule
  // sees the same final counselling block on a clean build and on later passes.
  if (match[1] === 'consent-form.html') html = require('./consent-core-v08455.cjs').transform(html,d,'patient/00776/consent-form.html');
  html = enhance(d, html);
  if (match[1] === 'passport.html') return passport(d);
  if (!['index.html','knowledge.html'].includes(match[1])) return html;
  if (html.includes('data-enhertu-review="2026-11-23"')) return html;
  const nav = '<nav class="ribo-downloads no-print" aria-label="Enhertu patient documents"><a href="passport.pdf" download>Download cycle-by-cycle passport</a><a href="#enhertu-safety">Warning signs and support medicines</a><a href="' + esc(content.official_alert_card) + '" target="_blank" rel="noopener noreferrer">Official Enhertu alert card</a></nav>';
  html = html.replace('</h1>','</h1>'+nav).replace('</main>',sections()+'</main>');
  const css = '<link rel="stylesheet" href="../../assets/patient/ribociclib-review-v08461.css">';
  // The authored review precedes the shared visual-standard styles. Preserve
  // that cascade whether this hook runs before or after shared publication.
  const emptyMarker = '<!--scv43:stylesheet:start--><!--scv43:stylesheet:end-->';
  if (!html.includes(css) && html.includes(emptyMarker)) return html.replace(emptyMarker,emptyMarker+css);
  const anchor = html.includes('<!--scv43:stylesheet:start-->') ? '<!--scv43:stylesheet:start-->' : '</head>';
  return html.includes(css) ? html : html.replace(anchor,css+anchor);
}

module.exports = {applies, enhance, transform, sections, passport};
