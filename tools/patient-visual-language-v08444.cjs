'use strict';

/**
 * SACTCheck investigation and molecular visual language.
 * Labels and timing are authored input. No clinical test, appointment, interval,
 * dose or prediction is introduced by this renderer.
 */
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const CSS_FILE = 'assets/patient/patient-visual-language-v08444.css';
const ASSET_DIR = 'assets/patient/visual-language-v08444';
const escape = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const plain = value => String(value == null ? '' : value).replace(/<[^>]*>/g, ' ').replace(/&(?:amp|nbsp|#160);/g, ' ').replace(/\s+/g, ' ').trim();
function authored(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(label + ' must be authored text');
  return value;
}

const ICONS = Object.freeze({
  ecg: {
    label: 'Electrocardiogram',
    paths: '<rect x="4" y="9" width="56" height="40" rx="7"/><path d="M9 30h10l4-10 6 23 7-32 5 19h14M24 56h16m-8-7v7"/>'
  },
  mri: {
    label: 'Magnetic resonance imaging',
    paths: '<path d="M9 49V25a17 17 0 0 1 34 0v24"/><ellipse cx="26" cy="28" rx="10" ry="13"/><path d="M19 39h29v9H18m-1 0-5 9m31-9 5 9M9 49h9"/><path d="M47 7v11a7 7 0 0 0 14 0V7h-5v11a2 2 0 0 1-4 0V7Z"/><path d="M47 12h5m4 0h5"/>'
  },
  ct: {
    label: 'Computed tomography',
    paths: '<circle cx="35" cy="26" r="21"/><circle cx="35" cy="26" r="12"/><path d="M14 27H5v8h34v9H5m5 0-4 12m28-12 6 12M40 7l8 3-4 7M25 45l-8-3 4-7"/><path d="M35 14v3m0 18v3m-12-12h3m18 0h3"/>'
  },
  pet: {
    label: 'Positron emission tomography',
    paths: '<path d="M14 11h8v35h-8zM42 11h8v35h-8zM22 8h20m-20 41h20"/><circle cx="32" cy="18" r="4"/><path d="M32 22v18m-7-11 7-5 7 5m-7 7-5 7m5-7 5 7M7 56h50"/><circle cx="29" cy="29" r="1.4" fill="currentColor"/><circle cx="35" cy="33" r="1.4" fill="currentColor"/><path d="M3 18h5m48 0h5M3 30h5m48 0h5"/>'
  },
  ultrasound: {
    label: 'Ultrasound',
    paths: '<path d="M26 8c-10-3-19 2-19 10 0 7 10 7 14 11"/><path d="m28 9 12 7-10 17-12-7Z"/><path d="m22 29 11 6-4 7-11-6Z"/><path d="M35 34c8 2 13 7 16 14M32 40c5 2 8 5 10 9M8 54h48M15 59h33"/>'
  },
  echo: {
    label: 'Echocardiogram',
    paths: '<path d="M28 46 10 29C-2 15 14 4 26 17 38 4 54 15 42 29Z"/><path d="m45 34 11 6-7 13-11-6Z"/><path d="M41 36c-8-1-13-5-16-11m12 15c-8-1-13-5-16-11M52 52l5 7"/>'
  },
  muga: {
    label: 'Multigated acquisition heart scan',
    paths: '<rect x="6" y="6" width="52" height="45" rx="8"/><path d="M32 42 19 30c-10-10 2-19 13-8 11-11 23-2 13 8Z"/><path d="M15 14h3m7 0h3m7 0h3m7 0h3M23 58h18m-9-7v7"/>'
  },
  dexa: {
    label: 'Bone density scan',
    paths: '<path d="M14 15c-8-9-15 3-7 8l27 27c5 9 17 1 8-7 9 0 10-12 0-12L20 9c-6-7-13 0-6 6Z"/><path d="M38 5h20v12H38zM45 17v7m7-7v7M5 58h54"/>'
  },
  mammogram: {
    label: 'Mammogram',
    paths: '<path d="M41 5h15v53H41M41 16H20v7h21M41 33H14v6h27M14 39c-4 4-3 9 2 11M26 23c-7 0-11 3-12 10M35 58h26"/>'
  },
  blood: {
    label: 'Blood tests',
    paths: '<path d="M9 7h14v7H9zM11 14v35a5 5 0 0 0 10 0V14M11 34h10M30 7h14v7H30zM32 14v21M42 14v14"/><path d="M47 27c-3 6-9 12-9 18a9 9 0 0 0 18 0c0-6-6-12-9-18Z"/><path d="M43 46c0 3 2 4 4 4"/>'
  },
  urine: {
    label: 'Urine test',
    paths: '<path d="M13 20h38l-4 35H17Z"/><rect x="11" y="13" width="42" height="7" rx="2"/><path d="M20 43h24M32 25c-2 4-6 6-6 10a6 6 0 0 0 12 0c0-4-4-6-6-10Z"/>'
  },
  vitals: {
    label: 'Blood pressure and physical checks',
    paths: '<rect x="24" y="8" width="35" height="40" rx="6"/><path d="M30 28h6l3-9 5 17 4-8h5M29 42h5m4 0h5M24 31H13c-5 0-7 4-7 9 0 9 10 13 18 13"/><path d="M4 18h12v15H4Z"/>'
  },
  imaging: {
    label: 'Imaging and scans',
    paths: '<rect x="7" y="6" width="50" height="47" rx="6"/><path d="M16 15h8m16 0h8M16 44h8m16 0h8M20 20c-4 7-4 13 0 20m24-20c4 7 4 13 0 20"/><path d="M32 17v27m-6-20h12m-12 7h12m-12 7h12M24 59h16"/>'
  },
  review: {
    label: 'Clinical review',
    paths: '<path d="M19 8h29v49H10V8h9M19 5h20v8H19Z"/><path d="m18 24 3 3 6-7m6 4h8m-23 13 3 3 6-7m6 4h8M18 48h23"/>'
  },
  infusion: {
    label: 'Infusion',
    paths: '<path d="M30 4v7M19 11h22v27a11 11 0 0 1-22 0ZM19 21h22M30 49v8h15V42"/><path d="M30 26c-2 4-5 6-5 9a5 5 0 0 0 10 0c0-3-3-5-5-9Z"/>'
  },
  medicine: {
    label: 'Medicines',
    paths: '<path d="m17 15 6-6a12 12 0 0 1 17 17l-6 6ZM17 15 7 25a12 12 0 0 0 17 17l10-10M17 15l17 17"/><circle cx="45" cy="45" r="12"/><path d="m37 53 16-16"/>'
  },
  radiation: {
    label: 'Radiation assessment or precautions',
    paths: '<path d="M32 5 10 13v18c0 13 12 23 22 28 10-5 22-15 22-28V13Z"/><circle cx="32" cy="30" r="4"/><path d="m29 23-7-10m13 10 7-10M25 33l-12 4m26-4 12 4M32 38v14"/>'
  },
  calendar: {
    label: 'Appointment or treatment date',
    paths: '<rect x="7" y="12" width="50" height="45" rx="7"/><path d="M19 5v14m26-14v14M7 26h50M17 36h5m8 0h5m8 0h5M17 46h5m8 0h5"/>'
  }
});

const KIND_ALIASES = Object.freeze({
  'blood-test':'blood', 'blood-tests':'blood', laboratory:'blood', labs:'blood',
  electrocardiogram:'ecg', echocardiogram:'echo', echocardiography:'echo',
  'bone-density':'dexa', dxa:'dexa', 'bone-density-scan':'dexa',
  'mri-scan':'mri', 'ct-scan':'ct', 'pet-scan':'pet', scan:'imaging', scans:'imaging',
  treatment:'infusion', tablets:'medicine', medicines:'medicine', appointment:'calendar',
  'blood-pressure':'vitals', 'urine-test':'urine', 'clinical-review':'review'
});
function canonicalKind(kind) {
  const key = String(kind || '').toLowerCase().trim();
  return Object.hasOwn(ICONS, key) ? key : KIND_ALIASES[key] || 'review';
}
function icon(kind, label = '') {
  const key = canonicalKind(kind), item = ICONS[key];
  const accessible = label ? 'role="img" aria-label="' + escape(label) + '"' : 'aria-hidden="true"';
  return '<svg class="sc44-icon" data-sc44-icon="' + key + '" viewBox="0 0 64 64" fill="none" stroke="#087780" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" ' + accessible + '>' + item.paths.replaceAll('fill="currentColor"','fill="#087780"') + '</svg>';
}

/** Classify only types named by the supplied label; never choose a test. */
function investigationKinds(value, options = {}) {
  const label = plain(value), kinds = [];
  const add = (kind, expression) => { if (expression.test(label)) kinds.push(kind); };
  add('ecg', /\b(?:ECG|EKG|electrocardiogra\w*)\b/i);
  add('mri', /\b(?:MRI|magnetic resonance)\b/i);
  add('ct', /\b(?:CT|computed tomography)\b/i);
  add('pet', /\b(?:PET|positron emission)\b/i);
  add('echo', /\b(?:ECHO|echocardiogra\w*)\b/i);
  add('muga', /\b(?:MUGA|multigated acquisition)\b/i);
  add('dexa', /\b(?:DEXA|DXA|bone[ -]density)\b/i);
  add('mammogram', /\b(?:mammogra\w*)\b/i);
  add('ultrasound', /\b(?:ultrasound|sonogra\w*)\b/i);
  if (/\b(?:blood pressure|vital signs|pulse|weight)\b/i.test(label)) kinds.push('vitals');
  else if (/\b(?:blood(?:s| tests?| count)?|FBC|CBC|haemoglobin|hemoglobin|platelets?|neutrophils?|electrolytes?|potassium|liver function|renal function|creatinine|glucose|cholesterol|triglycerides?|LDH|lactate dehydrogenase|chromogranin|CEA|PSA|CA[ -]?(?:125|19[ -]?9|15[ -]?3)|AFP)\b/i.test(label)) kinds.push('blood');
  add('urine', /\b(?:urine|urinalysis)\b/i);
  if (!kinds.length && /\b(?:imaging|scans?|X[ -]?ray|radiolog\w*)\b/i.test(label)) kinds.push('imaging');
  if (!kinds.length && /\b(?:infusion|injection|treatment day)\b/i.test(label)) kinds.push('infusion');
  if (!kinds.length && /\b(?:tablets?|medicines?|prescription)\b/i.test(label)) kinds.push('medicine');
  if (!kinds.length && /\b(?:radiation|radioactiv\w*)\b/i.test(label)) kinds.push('radiation');
  if (!kinds.length && /\b(?:review|assessment|appointment|clinic)\b/i.test(label)) kinds.push('review');
  return [...new Set(kinds)];
}
function iconsForLabel(label, options = {}) {
  const supplied = Array.isArray(options.kinds) ? options.kinds : investigationKinds(label, options);
  const kinds = [...new Set(supplied.map(canonicalKind))];
  if (!kinds.length) return '';
  return '<span class="sc44-icon-group" aria-hidden="true">' + kinds.map(k => icon(k)).join('') + '</span>';
}

/**
 * Neutral parent structures, not a depiction of the contents/ionisation of an
 * infusion bag. The (2S) alpha centre is shown by the solid C-alpha -> N wedge;
 * the implicit H points away. Original coordinates; checked chemical graph.
 * ChEBI:18019 and ChEBI:16467 are the structural reference records.
 */
const MOLECULES = Object.freeze({
  lysine: {
    name:'L-lysine', formula:'C6H14N2O2', charge:0, stereochemistry:'2S',
    smiles:'NCCCC[C@H](N)C(=O)O', inchiKey:'KDXKERNSBIXSRK-YFKPBYRVSA-N',
    source:'https://www.ebi.ac.uk/chebi/CHEBI:18019', sourceModified:'2026-09-21',
    pubchem:'https://pubchem.ncbi.nlm.nih.gov/compound/5962',
    atoms:[['N',2],['C',2],['C',2],['C',2],['C',2],['C',1],['N',2],['C',0],['O',0],['O',1]],
    bonds:[[0,1,1],[1,2,1],[2,3,1],[3,4,1],[4,5,1],[5,6,1],[5,7,1],[7,8,2],[7,9,1]],
    alpha:5, alphaPriority:[6,7,4], width:360,
    lines:'<path d="M48 76 75 94 115 72 155 94 195 72 235 94 275 72 306 90"/><path d="M272 72V42m6 30V42"/>',
    wedge:'<path d="m235 94-6 34h12Z" fill="#087e80" stroke="none"/>',
    labels:[{x:43,y:80,label:'H2N',anchor:'end'},{x:235,y:149,label:'NH2'},{x:275,y:33,label:'O'},{x:322,y:105,label:'OH'}],
    chiralityCoordinates:{center:[235,94],priority1:[235,139],priority2:[275,72],priority3:[195,72],lowest:'implicit H away'}
  },
  arginine: {
    name:'L-arginine', formula:'C6H14N4O2', charge:0, stereochemistry:'2S',
    smiles:'N=C(N)NCCC[C@H](N)C(=O)O', inchiKey:'ODKSFYDXXFIFQN-BYPYZUCNSA-N',
    source:'https://www.ebi.ac.uk/chebi/CHEBI:16467', sourceModified:'2025-09-29',
    pubchem:'https://pubchem.ncbi.nlm.nih.gov/compound/6322',
    atoms:[['N',1],['C',0],['N',2],['N',1],['C',2],['C',2],['C',2],['C',1],['N',2],['C',0],['O',0],['O',1]],
    bonds:[[0,1,2],[1,2,1],[1,3,1],[3,4,1],[4,5,1],[5,6,1],[6,7,1],[7,8,1],[7,9,1],[9,10,2],[9,11,1]],
    alpha:7, alphaPriority:[8,9,6], width:420,
    lines:'<path d="M74 70 44 88M74 70 103 87m26 0 28-15 40 22 40-22 40 22 40-22 30 18"/><path d="M71 70V41m6 29V41M314 72V42m6 30V42"/>',
    wedge:'<path d="m277 94-6 34h12Z" fill="#087e80" stroke="none"/>',
    labels:[{x:74,y:33,label:'NH'},{x:43,y:105,label:'H2N',anchor:'end'},{x:116,y:104,label:'NH'},{x:277,y:149,label:'NH2'},{x:317,y:33,label:'O'},{x:363,y:105,label:'OH'}],
    chiralityCoordinates:{center:[277,94],priority1:[277,139],priority2:[317,72],priority3:[237,72],lowest:'implicit H away'}
  }
});
function chemicalLabel(item) {
  const label = item.label.replace(/(\d+)/g, '<tspan baseline-shift="sub" font-size="13">$1</tspan>');
  return '<text x="' + item.x + '" y="' + item.y + '" text-anchor="' + (item.anchor || 'middle') + '" fill="#173e49" font-family="Arial,Helvetica,sans-serif" font-size="22" font-weight="600">' + label + '</text>';
}
function renderMoleculeSvg(key, options = {}) {
  const molecule = MOLECULES[key];
  if (!molecule) throw new RangeError('Unknown checked amino-acid structure');
  const description = molecule.name + ', ' + molecule.formula.replace(/(\d+)/g, ' $1 ') + ', neutral parent structure, S configuration at the alpha carbon.';
  return '<svg xmlns="http://www.w3.org/2000/svg" class="sc44-molecule-svg" data-sc44-molecule="' + key + '" data-stereochemistry="2S" viewBox="0 0 ' + molecule.width + ' 166" role="img" aria-label="' + escape(description) + '"><title>' + escape(molecule.name) + '</title><desc>' + escape(description) + '</desc><g fill="none" stroke="#087e80" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">' + molecule.lines + molecule.wedge + '</g>' + molecule.labels.map(chemicalLabel).join('') + '</svg>';
}
function renderAminoAcids(options = {}) {
  return '<div class="sc44-amino-acids" data-sc44-amino-acids="1"><div class="sc44-molecules">' + ['lysine','arginine'].map(key => '<figure class="sc44-molecule">' + renderMoleculeSvg(key) + '<figcaption>' + escape(MOLECULES[key].name) + '</figcaption></figure>').join('') + '</div></div>';
}

function renderInvestigation(item, options = {}) {
  if (!item || typeof item !== 'object') throw new TypeError('Investigation must be an authored record');
  const label = authored(item.label, 'investigation.label');
  const timing = authored(item.timing || item.time, 'investigation.timing');
  const kinds = item.kind ? [canonicalKind(item.kind)] : investigationKinds(label);
  const scope = item.scope || '';
  if (scope && !['routine','conditional'].includes(scope)) throw new TypeError('Investigation scope must be routine or conditional');
  return '<article class="sc44-investigation' + (scope === 'conditional' ? ' sc44-conditional' : '') + '"' + (Array.isArray(item.source_ids) ? ' data-source-ids="' + escape(item.source_ids.join(' ')) + '"' : '') + '><div class="sc44-investigation-symbol">' + (kinds.length ? iconsForLabel(label,{kinds}) : icon('review')) + '</div><div class="sc44-investigation-content"><h3>' + escape(label) + '</h3>' + (scope === 'conditional' ? '<span class="sc44-scope">If part of your plan</span>' : '') + '<div class="sc44-investigation-time"><span>When</span><strong>' + escape(timing) + '</strong></div>' + (item.purpose ? '<p>' + escape(item.purpose) + '</p>' : '') + (item.detail ? '<p class="sc44-investigation-detail">' + escape(item.detail) + '</p>' : '') + '</div></article>';
}
function renderMonitoringDetails(items, options = {}) {
  if (!Array.isArray(items) || !items.length) return '';
  const unique = [], seen = new Set();
  for (const item of items) {
    const signature = JSON.stringify([item.label,item.timing||item.time,item.purpose||'',item.detail||'',item.scope||'']);
    if (!seen.has(signature)) { seen.add(signature); unique.push(item); }
  }
  const title = options.title || 'Tests in your plan';
  return '<section class="sc44-monitoring-details" data-sc44-monitoring-details="1"' + (options.id ? ' id="' + escape(options.id) + '"' : '') + '><header class="sc44-section-heading">' + icon('blood') + '<h2>' + escape(title) + '</h2></header><div class="sc44-investigation-grid">' + unique.map(item => renderInvestigation(item,options)).join('') + '</div></section>';
}

/** A sequence of authored stages, not a proportional duration chart. */
function renderMonitoringTimeline(items, options = {}) {
  if (!Array.isArray(items) || !items.length) return '';
  const title = options.title || 'Tests and reviews along your treatment';
  return '<section class="sc44-monitoring-timeline" data-sc44-monitoring-timeline="1"><header class="sc44-section-heading">' + icon('calendar') + '<h2>' + escape(title) + '</h2></header>' + (options.caption ? '<p class="sc44-sequence-caption">' + escape(options.caption) + '</p>' : '') + '<ol class="sc44-event-sequence">' + items.map((item,index) => '<li><span class="sc44-event-marker">' + (index+1) + '</span><div>' + renderInvestigation(item,options) + '</div></li>').join('') + '</ol></section>';
}

/** Optional alternative to the existing monitoring table, using the same cells. */
function renderMonitoringSchedule(schedule, options = {}) {
  if (!schedule || !Array.isArray(schedule.columns) || !schedule.columns.length || !Array.isArray(schedule.rows)) return '';
  if (schedule.rows.some(row => !Array.isArray(row.cells) || row.cells.length !== schedule.columns.length)) throw new TypeError('Monitoring cells must match the authored columns');
  const title = authored(schedule.title, 'monitoring.title');
  return '<section class="sc44-monitoring-schedule" data-sc44-monitoring-schedule="1"' + (options.id ? ' id="' + escape(options.id) + '"' : '') + '><header class="sc44-section-heading">' + icon('calendar') + '<h2>' + escape(title) + '</h2></header>' + (schedule.note ? '<p class="sc44-sequence-caption">' + escape(schedule.note) + '</p>' : '') + '<ol class="sc44-monitoring-stages">' + schedule.columns.map((column,index) => '<li class="sc44-monitoring-stage"><header><span>' + String(index+1).padStart(2,'0') + '</span><h3>' + escape(authored(column,'monitoring.column')) + '</h3></header><dl>' + schedule.rows.map(row => '<div><dt>' + iconsForLabel(row.label) + '<strong>' + escape(authored(row.label,'monitoring.row.label')) + '</strong></dt><dd>' + escape(String(row.cells[index] == null ? '' : row.cells[index])) + '</dd></div>').join('') + '</dl></li>').join('') + '</ol></section>';
}

function addClass(raw, name) {
  const m = raw.match(/\bclass=(['"])([\s\S]*?)\1/i);
  if (m) return m[2].split(/\s+/).includes(name) ? raw : raw.replace(m[0], 'class=' + m[1] + m[2] + ' ' + name + m[1]);
  return raw.replace(/>$/, ' class="' + name + '">');
}
function hasClass(raw, name) {
  const m = raw.match(/\bclass=(['"])([\s\S]*?)\1/i);
  return !!m && m[2].split(/\s+/).includes(name);
}
// Only replace groups emitted by iconsForLabel: their content consists solely
// of our marked SVGs. Authored spans, other SVGs and molecular drawings are not
// candidates. Reclassification is necessary when a later editorial pass has
// expanded a label such as BP to blood pressure (BP).
function rewriteOwnedIconGroups(content, symbols = '') {
  let found = false;
  const revised = content.replace(/<span\b[^>]*\bclass=(['"])[^'"]*\bsc44-icon-group\b[^'"]*\1[^>]*>([\s\S]*?)<\/span>/gi, (whole, quote, body) => {
    const remainder = body.replace(/<svg\b[^>]*\bdata-sc44-icon=(['"])[^'"]+\1[^>]*>[\s\S]*?<\/svg>/gi, '');
    if (remainder === body || remainder.trim()) return whole;
    const replacement = found ? '' : symbols;
    found = true;
    return replacement;
  });
  return {content:revised, found};
}
function decorateHeader(match, opening, content, closing, options = {}) {
  const authored = rewriteOwnedIconGroups(content);
  const label = plain(authored.content), symbols = iconsForLabel(label, options);
  if (authored.found) return opening + rewriteOwnedIconGroups(content, symbols).content + closing;
  return symbols ? addClass(opening,'sc44-visual-label') + symbols + '<span>' + content + '</span>' + closing : match;
}

const DETAILS_START = '<!-- sc44-monitoring-details:start -->';
const DETAILS_END = '<!-- sc44-monitoring-details:end -->';
function normalizedClinicalText(value) {
  return plain(value).toLowerCase().replace(/&[^;]+;/g,' ').replace(/[\s\u2010-\u2015-]+/g,' ').replace(/[.,;:()]/g,'').trim();
}
function addMonitoringDetails(html, options = {}) {
  const profile = options.profile || options.data;
  // A purely visual pass without the authoritative profile must retain a
  // previously rendered monitoring panel, not erase its authored content.
  if (!profile) return String(html);
  let output = String(html).replace(/<!-- sc44-monitoring-details:start -->[\s\S]*?<!-- sc44-monitoring-details:end -->/g,'');
  const kind = options.documentKind || '';
  const isGuide = /^(?:guide|pack|card|sactcard|consent|support)$/.test(kind) || /\/(?:guide|sactcard|consent|support[^/]*)\.html$/.test(options.file||'') || /<title>[^<]*(?:three[ -]page|patient guide|treatment guide|treatment pack|wallet|SACT card)/i.test(output);
  if (isGuide || !Array.isArray(profile?.monitoring_test_details) || !profile.monitoring_test_details.length) return output;
  const pattern = /(<section\b[^>]*\bid=(['"])monitoring-schedule\2[^>]*>)([\s\S]*?)(<\/section>)/i;
  const match = output.match(pattern);
  const current = normalizedClinicalText(match ? match[3] : '');
  const items = profile.monitoring_test_details.filter(item => {
    // Omit only an entirely represented record; never discard a distinct
    // purpose, conditional qualifier, interval or safety detail.
    const facts = [item.label,item.timing||item.time,item.purpose,item.detail].filter(Boolean).map(normalizedClinicalText);
    if (item.scope === 'conditional') facts.push('if part of your plan');
    return !current || !facts.every(fact => current.includes(fact));
  });
  if (!items.length) return output;
  const block = DETAILS_START + renderMonitoringDetails(items,{title:options.monitoringTitle||'Tests in your plan',id:'named-monitoring-tests'}) + DETAILS_END;
  if (match) return output.replace(pattern,(all,open,quote,body,close)=>open+body+block+close);
  // Only a recognised patient page gets a fallback section; selector pages and
  // standalone fragments must not acquire a treatment plan accidentally.
  if (/<main\b[^>]*\bid=(['"])main\1/i.test(output) && /<\/main>/i.test(output)) return output.replace(/<\/main>/i,block+'</main>');
  return output;
}

/**
 * Idempotent markup-only upgrade. Replaces icons or surrounds existing labels;
 * does not summarise, discard or alter authored clinical text.
 */
function upgradeVisualLanguage(html, options = {}) {
  let output = addMonitoringDetails(html, options);
  // The dedicated class is an agent ID; do not replace other DNA diagrams.
  output = output.replace(/(<article\b[^>]*class=(['"])[^'"]*\bamino-acids\b[^'"]*\2[^>]*>)([\s\S]*?)(<\/article>)/gi, (all,open,quote,body,close) => {
    if (body.includes('data-sc44-amino-acids=')) return all;
    const revised = body.replace(/<svg\b[^>]*class=(['"])[^'"]*\bpk-diagram\b[^'"]*\1[^>]*>[\s\S]*?<\/svg>/i, renderAminoAcids());
    return open + revised + close;
  });
  // The step title supplies the investigation type. Body text cannot cause a
  // blood-test step to acquire an unrelated scanner symbol.
  output = output.replace(/(<article\b[^>]*class=(['"])[^'"]*\baccess-step\b[^'"]*\2[^>]*>)([\s\S]*?)(<\/article>)/gi, (all,open,quote,body,close) => {
    const heading = body.match(/<h[2-5]\b[^>]*>([\s\S]*?)<\/h[2-5]>/i);
    if (!heading) return all;
    const kinds = investigationKinds(heading[1]);
    const symbols = iconsForLabel(heading[1],{kinds});
    const refreshed = rewriteOwnedIconGroups(body, symbols);
    if (refreshed.found) return open + refreshed.content + close;
    if (!kinds.length) return all;
    const revised = body.replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/i, symbols);
    return open + revised + close;
  });
  // An authored table retains all of its cells, sources and schedule qualifiers.
  output = output.replace(/(<section\b[^>]*\bid=(['"])(monitoring-schedule|treatment-journey)\2[^>]*>)([\s\S]*?)(<\/section>)/gi, (all,open,quote,sectionId,body,close) => {
    body = body.replace(/(<th\b[^>]*\bscope=(['"])row\2[^>]*>)([\s\S]*?)(<\/th>)/gi, (whole,a,q,b,c) => decorateHeader(whole,a,b,c));
    body = body.replace(/(<td\b[^>]*>)([\s\S]*?)(<\/td>)/gi, (whole,a,b,c) => {
      const authored = rewriteOwnedIconGroups(b);
      const kinds = investigationKinds(authored.content).filter(k => ['ecg','mri','ct','pet','echo','muga','dexa','mammogram','ultrasound'].includes(k));
      if (authored.found) return a + rewriteOwnedIconGroups(b, iconsForLabel(authored.content,{kinds})).content + c;
      return kinds.length ? addClass(a,'sc44-scan-cell') + iconsForLabel(b,{kinds}) + b + c : whole;
    });
    return addClass(open,'sc44-monitoring-enhanced') + body + close;
  });
  output = output.replace(/(<details\b[^>]*class=(['"])[^'"]*\bjourney-milestone\b[^'"]*\2[^>]*>)([\s\S]*?)(<\/details>)/gi, (all,open,quote,body,close) => {
    const revised = body.replace(/(<summary\b[^>]*>)([\s\S]*?)(<\/summary>)/i, (whole,a,b,c) => {
      const authored = rewriteOwnedIconGroups(b);
      const heading = authored.content.replace(/<small\b[\s\S]*?<\/small>/gi,'').replace(/<span\b[^>]*class=(['"])[^'"]*\bjourney-number\b[^'"]*\1[^>]*>[\s\S]*?<\/span>/i,'');
      const symbols = iconsForLabel(heading);
      if (authored.found) return a + rewriteOwnedIconGroups(b, symbols).content + c;
      return symbols ? addClass(a,'sc44-milestone-summary') + b.replace(/(<span\b[^>]*class=(['"])[^'"]*\bjourney-number\b[^'"]*\2[^>]*>[\s\S]*?<\/span>)/i,'$1'+symbols) + c : whole;
    });
    return open + revised + close;
  });
  // Generic investigation cards elsewhere can gain a symbol without replacing
  // their text or accidentally changing medication, anatomy or consent content.
  output = output.replace(/(<article\b[^>]*class=(['"])[^'"]*\b(?:pk-card|journey-card|test-card|monitor-card)\b[^'"]*\2[^>]*>)([\s\S]*?)(<\/article>)/gi, (all,open,quote,body,close) => {
    if (/\bamino-acids\b/.test(open)) return all;
    const revised = body.replace(/(<h[2-5]\b[^>]*>)([\s\S]*?)(<\/h[2-5]>)/i, (whole,a,b,c) => decorateHeader(whole,a,b,c));
    return open + revised + close;
  });
  if (/<\/head>/i.test(output) && !output.includes(CSS_FILE)) {
    const route = typeof options.route === 'string' && /^\d{5}(?:\/[a-z0-9_]+)?$/.test(options.route) ? options.route : '';
    const cssHref = options.cssHref || (route ? '../'.repeat(route.split('/').length+1) + CSS_FILE : '/' + CSS_FILE);
    output = output.replace(/<\/head>/i, '<link rel="stylesheet" href="' + escape(cssHref) + '" data-sc44-visual-language="1"></head>');
  }
  return output;
}

function validateMolecularGraph(key) {
  const m = MOLECULES[key];
  if (!m) throw new RangeError('Unknown molecule');
  const counts = {C:0,H:0,N:0,O:0};
  const valences = m.atoms.map(() => 0);
  for (const [a,b,order] of m.bonds) { valences[a] += order; valences[b] += order; }
  for (let i=0; i<m.atoms.length; i++) {
    const [element,hydrogens] = m.atoms[i];
    counts[element]++; counts.H += hydrogens;
    const expected = {C:4,N:3,O:2}[element];
    if (valences[i]+hydrogens !== expected) throw new Error(m.name + ': incorrect atom valence at ' + i);
  }
  const formula = ['C','H','N','O'].map(element => element + (counts[element] === 1 ? '' : counts[element])).join('');
  if (formula !== m.formula) throw new Error(m.name + ': molecular formula mismatch');
  const p = m.chiralityCoordinates;
  // Positive screen-coordinate signed area means clockwise on screen. The
  // mathematical y-axis reverses it; with H away the drawn order must be CCW.
  const [a,b,c] = [p.priority1,p.priority2,p.priority3];
  const screenArea = a[0]*(b[1]-c[1]) + b[0]*(c[1]-a[1]) + c[0]*(a[1]-b[1]);
  if (!(screenArea < 0)) throw new Error(m.name + ': alpha-centre wedge would not show S');
  return {name:m.name,formula,charge:m.charge,stereochemistry:m.stereochemistry,source:m.source,graphValence:true,drawnChirality:true};
}

module.exports = {CSS_FILE,ASSET_DIR,ICONS,MOLECULES,escape,canonicalKind,icon,investigationKinds,iconsForLabel,renderMoleculeSvg,renderAminoAcids,renderInvestigation,renderMonitoringDetails,renderMonitoringTimeline,renderMonitoringSchedule,addMonitoringDetails,upgradeVisualLanguage,validateMolecularGraph};

if (require.main === module) {
  if (process.argv[2] === '--write-assets') {
    const destination = path.join(ROOT,ASSET_DIR);
    fs.mkdirSync(destination,{recursive:true});
    for (const key of Object.keys(MOLECULES)) {
      validateMolecularGraph(key);
      fs.writeFileSync(path.join(destination,'l-'+key+'.svg'),renderMoleculeSvg(key)+'\n');
    }
    for (const key of Object.keys(ICONS)) fs.writeFileSync(path.join(destination,key+'.svg'),icon(key,ICONS[key].label).replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" ')+'\n');
    console.log('Wrote checked SVG assets to '+ASSET_DIR);
  } else throw new Error('Use --write-assets to regenerate the shared SVG files');
}
