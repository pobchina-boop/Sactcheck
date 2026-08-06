const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/regimen-knowledge-base-v0610.json'), 'utf8'));
const js = fs.readFileSync(path.join(ROOT, 'js/regimen-knowledge-base.js'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'css/regimen-knowledge-base.css'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

assert.strictEqual(data.release, '0.61.0');
assert.ok(pkg.version.localeCompare('0.61.0', undefined, { numeric: true }) >= 0);
assert.strictEqual(data.regimen_profiles.length, 18, 'Expected 18 complete regimen profiles');
assert(data.evidence_records.length >= 41, 'Expected at least 41 evidence mappings');
assert(js.includes('regimen-knowledge-base-v0610.json'));
assert(js.includes('Evidence completeness audit'));
assert(js.includes('record.evidence_relationship'));
assert(css.includes('.regimen-evidence-relationship'));
assert(css.includes('.regimen-evidence-audit-section'));

const profileIds = new Set(data.regimen_profiles.map(x => x.protocol_id));
['nccp-00321-v9','nccp-00226-v9','nccp-00776-v3b'].forEach(id => assert(profileIds.has(id), `Missing profile ${id}`));
for (const p of data.regimen_profiles) {
  assert(p.evidence_audit, `${p.protocol_id} missing evidence audit`);
  assert(p.evidence_audit.status, `${p.protocol_id} missing audit status`);
  assert(p.evidence_audit.coverage_summary, `${p.protocol_id} missing audit coverage summary`);
  assert(Array.isArray(p.evidence_audit.remaining_uncertainties), `${p.protocol_id} missing declared uncertainties`);
}
for (const e of data.evidence_records) {
  assert(e.evidence_relationship, `${e.protocol_id}/${e.trial_acronym} missing evidence relationship`);
  assert(e.publication_url && /^https:\/\//.test(e.publication_url), `${e.trial_acronym} missing publication URL`);
  assert(e.limitations, `${e.trial_acronym} missing limitations`);
}

function trial(pid, acronym) {
  return data.evidence_records.find(e => e.protocol_id === pid && e.trial_acronym === acronym);
}
function hasPmid(pid, pmid) {
  return data.evidence_records.some(e => e.protocol_id === pid && String(e.pmid) === String(pmid));
}
function hasSupportingPmid(pid, acronym, pmid) {
  const e = trial(pid, acronym);
  return !!e && (e.supporting_publications || []).some(x => String(x.pmid) === String(pmid));
}

// New profiles and indication-by-indication evidence coverage.
['21383294','18421053','22226517','29590544'].forEach(pmid => assert(hasPmid('nccp-00321-v9', pmid), `XELOX missing PMID ${pmid}`));
['18375893','16325893','16739353','27284445'].forEach(pmid => assert(hasPmid('nccp-00226-v9', pmid), `Weekly paclitaxel missing PMID ${pmid}`));
['35320644','35665782'].forEach(pmid => assert(hasPmid('nccp-00776-v3b', pmid), `T-DXd missing PMID ${pmid}`));
assert(trial('nccp-00226-v9','Sideris cohort').limitations.toLowerCase().includes('retrospective'));
assert(trial('nccp-00776-v3b','DESTINY-Breast03').key_findings.join(' ').includes('ILD'));

// Previously complete profiles: known material gaps remediated.
assert(hasSupportingPmid('nccp-00568-v5','KEYNOTE-189','36809080'));
assert(hasSupportingPmid('nccp-00655-v3a','PACIFIC','35108059'));
assert(hasSupportingPmid('nccp-00857-v3','KEYNOTE-522','35139274'));
assert(hasSupportingPmid('nccp-00857-v3','KEYNOTE-522','39282906'));
assert(hasPmid('nccp-00515-v7','21561347'));
assert(hasPmid('nccp-00722-v2','22153890'));
assert(hasSupportingPmid('nccp-00619-vcurrent','monarchE','38194616'));
assert(hasSupportingPmid('nccp-00831-v2a','IMbrave150','34902530'));
['14657227','18349393','29590544'].forEach(pmid => assert(hasPmid('nccp-00209-v10a',pmid), `mFOLFOX missing ${pmid}`));
['14657227','25287828','22969226'].forEach(pmid => assert(hasPmid('nccp-00227-v9',pmid), `FOLFIRI missing ${pmid}`));
['33078978','25732161'].forEach(pmid => assert(hasPmid('nccp-00303-v6',pmid), `Carbo/paclitaxel missing ${pmid}`));
assert(hasSupportingPmid('nccp-00579-v5a','KEYNOTE-407','36735893'));
assert(hasSupportingPmid('nccp-00897-v3','TOPAZ-1','38823398'));
assert(hasPmid('nccp-00382-v3','37133585'), 'SUNLIGHT must remain present');

// Clinical protocol JSON files must remain unchanged from the v0.60.3 baseline ZIP extraction.
const baselineRoot = path.resolve(ROOT, '..', '..', 'sactcheck_v0603_work', 'Sactcheck');
function walk(dir) {
  return fs.readdirSync(dir, {withFileTypes:true}).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}
if (fs.existsSync(path.join(baselineRoot,'protocols'))) {
  const currentFiles = walk(path.join(ROOT,'protocols')).filter(f=>f.endsWith('.json'));
  for (const current of currentFiles) {
    const rel = path.relative(ROOT,current);
    const baseline = path.join(baselineRoot,rel);
    if (!fs.existsSync(baseline)) continue;
    const hash = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
    assert.strictEqual(hash(current),hash(baseline),`Protocol JSON changed unexpectedly: ${rel}`);
  }
}

console.log(`v0.61.0 knowledge-base audit passed: ${data.regimen_profiles.length} profiles, ${data.evidence_records.length} evidence records.`);
