const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const protocolRoot = path.join(root, 'protocols');
const patterns = {
  counts: /anc|neutrophil|platelet|ha?emoglobin|(^|_)wbc/i,
  renal: /creatinine|crcl|egfr|(^|_)gfr/i,
  hepatic: /bilirubin|(^|_)alt|(^|_)ast|alkaline|(^|_)alp/i,
  endocrine: /tsh|free_?t4|ft4|cortisol|acth|glucose|ketone/i,
  context: /ecog|performance_status|cycle_number|cycle_day|treatment_day|current_dose|dose_level/i,
  toxicity: /grade|toxicit|neuropath|rash|diarr|mucos|pneumon|colitis|hepatitis|nephritis/i
};

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(target);
    return entry.isFile() && entry.name.endsWith('.json') && entry.name !== 'index.json' ? [target] : [];
  });
}

const rows = walk(protocolRoot).sort().map(file => {
  const protocol = JSON.parse(fs.readFileSync(file, 'utf8'));
  const definitions = protocol.input_definitions || {};
  const counts = Object.fromEntries(Object.keys(patterns).map(key => [key, 0]));
  for (const [id, definition] of Object.entries(definitions)) {
    const text = `${id} ${definition.label || ''}`;
    for (const [key, pattern] of Object.entries(patterns)) if (pattern.test(text)) counts[key] += 1;
  }
  return {
    path: path.relative(root, file).replaceAll(path.sep, '/'),
    protocol_id: protocol.protocol_id || '',
    title: protocol.metadata?.title || '',
    ...counts,
    candidate_fields: Object.values(counts).reduce((a, b) => a + b, 0)
  };
});

const headers = Object.keys(rows[0]);
const csv = [headers.join(','), ...rows.map(row => headers.map(header => JSON.stringify(row[header] ?? '')).join(','))].join('\n') + '\n';
fs.writeFileSync(path.join(root, 'V0540_SCENARIO_INTERPRETER_AUDIT.csv'), csv);

const totals = Object.fromEntries(Object.keys(patterns).map(key => [key, rows.reduce((sum, row) => sum + row[key], 0)]));
const covered = rows.filter(row => row.candidate_fields > 0).length;
const markdown = `# v0.54.0 Scenario Interpreter Audit\n\n- Protocol JSON files audited: ${rows.length}\n- Protocols with at least one candidate extractable field: ${covered}\n- Candidate blood-count fields: ${totals.counts}\n- Candidate renal fields: ${totals.renal}\n- Candidate hepatic fields: ${totals.hepatic}\n- Candidate endocrine fields: ${totals.endocrine}\n- Candidate context/dose fields: ${totals.context}\n- Candidate named toxicity fields: ${totals.toxicity}\n\nThese are language-mapping opportunities, not independent clinical validation. Extraction remains limited to fields defined by the opened regimen and requires clinician confirmation.\n`;
fs.writeFileSync(path.join(root, 'V0540_SCENARIO_INTERPRETER_AUDIT.md'), markdown);
console.log(`v0.54.0 scenario audit complete: ${rows.length} protocols; ${covered} with candidate fields.`);
