'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'js', 'ctcae-descriptors.js'), 'utf8'), context);
const CTCAE = context.window.SACTCheckCTCAE;
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const p = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(p) : [p];
  });
}
function groups(metadata={}) {
  const result=[];
  if (typeof metadata.tumour_group === 'string') result.push(metadata.tumour_group);
  for (const value of metadata.tumour_groups || []) if (!result.includes(value)) result.push(value);
  return result;
}
let files=0, fields=0, options=0;
for (const file of walk(path.join(root, 'protocols')).filter(file => file.endsWith('.json'))) {
  if (['index.json','protocol-schema.json','package.json'].includes(path.basename(file))) continue;
  let protocol;
  try { protocol=JSON.parse(fs.readFileSync(file,'utf8')); } catch { continue; }
  if (!groups(protocol.metadata).includes('Lung')) continue;
  let changed=false;
  for (const [id, definition] of Object.entries(protocol.input_definitions || {})) {
    if (definition?.type !== 'select' || !definition.ctcae_version) continue;
    fields += 1;
    for (const option of definition.options || []) {
      const description = CTCAE.descriptor({ ...definition, id }, { ...option, description: undefined });
      if (description) {
        option.description = description;
        options += 1;
        changed=true;
      }
    }
  }
  if (changed) {
    fs.writeFileSync(file, JSON.stringify(protocol, null, 2) + '\n');
    files += 1;
  }
}
console.log(`Materialised toxicity-specific CTCAE descriptions in ${fields} Lung fields (${options} options across ${files} protocol files).`);
