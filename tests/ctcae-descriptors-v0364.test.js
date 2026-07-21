const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'js', 'ctcae-descriptors.js'), 'utf8'), context);
const lib = context.window.SACTCheckCTCAE;
if (!lib) throw new Error('CTCAE descriptor library did not initialise');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const p = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(p) : [p];
  });
}

let gradeFields = 0;
let gradeOptions = 0;
for (const file of walk(path.join(root, 'protocols')).filter(f => f.endsWith('.json'))) {
  let protocol;
  try { protocol = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { continue; }
  for (const [id, def] of Object.entries(protocol.input_definitions || {})) {
    if (def?.type !== 'select' || !/grade/i.test(`${id} ${def.label || ''}`)) continue;
    gradeFields += 1;
    const definition = { ...def, id };
    for (const option of def.options || []) {
      if (!Number.isFinite(Number(option.value)) || Number(option.value) < 0 || Number(option.value) > 5) continue;
      gradeOptions += 1;
      const description = lib.descriptor(definition, option);
      const label = lib.optionLabel(definition, option);
      if (!description) throw new Error(`Missing descriptor for ${id} grade ${option.value} in ${file}`);
      if (!label.includes('—')) throw new Error(`Option label not enhanced for ${id} grade ${option.value}`);
    }
  }
}

if (gradeFields < 30) throw new Error(`Expected broad grade-field coverage; found ${gradeFields}`);
if (gradeOptions < 100) throw new Error(`Expected broad grade-option coverage; found ${gradeOptions}`);

for (const file of ['index.html', path.join('protocols', 'index.html')]) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const descriptorPosition = html.indexOf('ctcae-descriptors.js');
  const uiPosition = html.indexOf('generic-assessment-ui.js');
  if (descriptorPosition < 0 || uiPosition < 0 || descriptorPosition > uiPosition) {
    throw new Error(`${file} must load CTCAE descriptors before generic assessment UI`);
  }
}

console.log(`v0.36.4 CTCAE descriptor tests passed: ${gradeFields} fields and ${gradeOptions} graded options covered.`);
