'use strict';
// Content completeness and artifact integrity are separate from clinical approval.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const standard = JSON.parse(fs.readFileSync(path.join(root,'data/patient-video-standard.json')));
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
function validate(manifest, options = {}) {
  const errors = [], pending = [];
  const base = options.base || process.cwd();
  const expected = standard.required_sections.map(s => s.id);
  const sections = manifest.sections || [];
  if (manifest.standard_id !== standard.standard_id) errors.push('Wrong video standard.');
  if (JSON.stringify(sections.map(s => s.id)) !== JSON.stringify(expected)) errors.push('All ten sections are required in the recorded order; sections1–7 must never be omitted or reordered.');
  const sourceIds = new Set((manifest.sources || []).map(s => s.id));
  for (const [i,s] of sections.entries()) {
    if (s.position !== i+1 || !s.authored || !(s.word_count > 0) || !s.scene_ids?.length) errors.push('Incomplete section: '+s.id);
    if (!s.source_ids?.length || s.source_ids.some(id => !sourceIds.has(id))) errors.push('Missing source mapping: '+s.id);
    if (!s.narrated) pending.push('Narration: '+s.id);
  }
  if (!/Patrick.*Engaging and Warm/.test(manifest.narrator || '')) errors.push('The approved Irish narrator must be retained.');
  for (const key of ['script','transcript']) {
    if (!manifest[key+'_path'] || !manifest[key+'_sha256']) { errors.push('Missing '+key+' identity.'); continue; }
    const file = path.resolve(base,manifest[key+'_path']);
    if (!fs.existsSync(file) || sha(fs.readFileSync(file)) !== manifest[key+'_sha256']) errors.push('Missing or changed '+key+' bytes.');
  }
  const support = manifest.support_script || {};
  const supportPath = support.path || support.local_path;
  if (!supportPath || !support.sha256 || !support.source_row || !support.medicines?.length) errors.push('Freeze and identify the actual generated supportive-care script.');
  else {
    const file = path.resolve(base,supportPath);
    if (!fs.existsSync(file) || sha(fs.readFileSync(file)) !== support.sha256) errors.push('Support script changed since narration was reconciled.');
  }
  if (!manifest.finished_video) pending.push('Finished voiced MP4');
  for (const kind of ['video','captions','narration']) {
    const item = manifest.artifacts?.[kind];
    if (!item?.path || !item?.sha256) {
      pending.push('Verified '+kind+' artifact');
      if (manifest.finished_video) errors.push('A finished film must identify its '+kind+' file.');
    } else {
      const file = path.resolve(base,item.path);
      if (!fs.existsSync(file) || sha(fs.readFileSync(file)) !== item.sha256) errors.push('Missing or changed '+kind+' artifact.');
    }
  }
  for (const key of ['audio','pronunciation','captions','final_playback']) {
    if (!/^passed\b/i.test(manifest.review?.[key] || '')) pending.push(key+' check');
  }
  // A draft can pass structural checks while remaining explicitly unpublishable.
  const releaseReady = errors.length === 0 && pending.length === 0;
  return {standard_id:standard.standard_id,sections_checked:sections.length,content_structure_passed:errors.length===0,release_ready:releaseReady,errors,pending,mode:options.draft?'draft':'release',passed:errors.length===0&&(options.draft||releaseReady)};
}
module.exports = {validate};
if (require.main === module) {
  const args = process.argv.slice(2), draft = args.includes('--draft');
  const filename = args.find(x => !x.startsWith('--'));
  if (!filename) throw Error('Usage: node tools/validate-patient-video-standard.cjs MANIFEST.json [--draft]');
  const file = path.resolve(filename);
  const result = validate(JSON.parse(fs.readFileSync(file)),{draft,base:path.dirname(file)});
  console.log(JSON.stringify(result,null,2));
  if (!result.passed) process.exitCode = 1;
}
