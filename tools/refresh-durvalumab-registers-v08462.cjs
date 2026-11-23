'use strict';
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const tracker = require('./nccp-change-tracker.js');

const root = path.resolve(__dirname, '..');
const scope = new Set(['00576', '00655', '00897', '00926', '00953']);
const release = '0.84.62';
const checked = '2026-11-23';
const sourceFile = 'data/nccp-change-tracker/source-register-v0620.json';
const reviewFile = 'data/clinical-validation-register-v0630.json';
const json = file => JSON.parse(fs.readFileSync(path.join(root, file)));
const write = (file, value) => fs.writeFileSync(path.join(root, file), JSON.stringify(value, null, 2) + '\n');

const index = json('protocols/index.json').protocols;
const reviewed = new Map(index.filter(e => scope.has(e.id.slice(5, 10))).map(e => {
  const p = json(e.path);
  return [p.metadata.nccp_regimen_code, p];
}));
assert.equal(reviewed.size, scope.size, 'Rebuild the five-regimen protocol index first');
const oldSource = json(sourceFile);
const oldRecords = new Map(oldSource.records.map(r => [r.tracking_key, r]));
const current = tracker.buildSourceRegister(root, checked);
const catalogue = {
  '00576': 'lung', '00655': 'lung', '00897': 'gastro-intestinal',
  '00926': 'gastro-intestinal', '00953': 'gynaecology'
};
oldSource.records = current.records.map(row => {
  const old = oldRecords.get(row.tracking_key);
  if (!scope.has(row.nccp_regimen_code)) {
    assert(old, 'Unreviewed new tracker entry ' + row.tracking_key);
    return old;
  }
  const m = reviewed.get(row.nccp_regimen_code).metadata;
  assert.match(m.source_pdf_sha256 || '', /^[a-f0-9]{64}$/);
  return {
    ...row,
    catalogue_page_url: 'https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/' + catalogue[row.nccp_regimen_code] + '-sact-regimens/',
    baseline_registered_date: old?.baseline_registered_date || checked,
    catalogue_presence: true,
    pdf_sha256: m.source_pdf_sha256,
    remote_capture_status: 'captured',
    last_remote_check: checked,
    source_status: 'remote_source_captured',
    source_status_label: 'Current NCCP document checked',
    review_status: 'source_checked_independent_review_pending',
    clinical_rule_update_status: 'no_automatic_change_permitted',
    source_reconciliation_note: 'Source reconciled for the durvalumab review. Independent clinical and pharmacy review pending.'
  };
});
oldSource.tracked_protocol_count = oldSource.records.length;
oldSource.content_update_release = release;
write(sourceFile, oldSource);

// Reuse the ordinary validation-register generator but preserve historical human review data.
const previous = json(reviewFile);
const oldReview = new Map(previous.protocols.map(row => [row.nccp_code, row]));
let generated;
const priorBytes = fs.readFileSync(path.join(root, reviewFile));
try {
  cp.execFileSync(process.execPath, ['tools/build-clinical-validation-register.js'], { cwd: root });
  generated = json(reviewFile);
} finally {
  fs.writeFileSync(path.join(root, reviewFile), priorBytes);
}
previous.protocols = generated.protocols.map(row => {
  const initial = oldReview.get(row.nccp_code);
  if (!scope.has(row.nccp_code)) {
    assert(initial, 'Unreviewed new validation entry ' + row.nccp_code);
    return initial;
  }
  return {
    ...initial, ...row,
    knowledge_base_profile: true,
    source_document_checked: true,
    software_tests_completed: true,
    formal_consultant_reviewed: false,
    formal_pharmacy_reviewed: false,
    rule_source_review_date: checked,
    source_sha256: reviewed.get(row.nccp_code).metadata.source_pdf_sha256,
    verification_scope: 'Technical verification. See the source-mapped protocol and scoped release tests. Independent review pending.'
  };
});
previous.protocol_count = previous.protocols.length;
previous.tissue_counts = generated.tissue_counts;
previous.tissue_context_count = generated.tissue_context_count;
previous.generated_date = checked;
previous.content_update_release = release;
write(reviewFile, previous);
console.log('Updated five durvalumab records while preserving all other review entries.');
