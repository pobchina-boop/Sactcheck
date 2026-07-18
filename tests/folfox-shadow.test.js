const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const marker = 'root.FolfoxEngine=api;';
const markerIndex = html.indexOf(marker);
assert.ok(markerIndex >= 0, 'Could not locate embedded FolfoxEngine.');
const scriptStart = html.lastIndexOf('<script>', markerIndex) + '<script>'.length;
const scriptEnd = html.indexOf('</script>', markerIndex);
const legacyCode = html.slice(scriptStart, scriptEnd);

const context = { console };
context.self = context;
context.globalThis = context;
vm.createContext(context);
vm.runInContext(legacyCode, context);
assert.ok(context.FolfoxEngine, 'Legacy FolfoxEngine did not load.');

const Core = require('../js/folfox-shadow-core.js');
const protocol = JSON.parse(fs.readFileSync(
  path.join(root, 'protocols/gastrointestinal/00209-modified-folfox6.json'),
  'utf8'
));

const results = Core.runAll(protocol, context.FolfoxEngine);
assert.equal(results.length, Core.SCENARIOS.length);

results.forEach(result => {
  assert.equal(
    result.comparison.match,
    true,
    `${result.scenario.scenarioId} differed:\n${result.comparison.differences.join('\n')}`
  );
  console.log(`✓ ${result.scenario.scenarioId}: legacy and JSON outputs match`);
});

console.log(`\n${results.length} FOLFOX shadow-comparison tests passed.`);
