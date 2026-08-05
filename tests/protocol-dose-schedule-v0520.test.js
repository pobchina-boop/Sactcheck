const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const genericUi = fs.readFileSync(path.join(root, 'js/generic-assessment-ui.js'), 'utf8');
const doseSource = fs.readFileSync(path.join(root, 'js/protocol-dose-schedule.js'), 'utf8');
const doseCss = fs.readFileSync(path.join(root, 'css/protocol-dose-schedule.css'), 'utf8');

assert(pkg.version.localeCompare('0.56.1', undefined, { numeric: true }) >= 0);
assert(html.includes('<title>SACTCheck v0.56.1 — Five-Regimen Knowledge Base Pilot</title>'));
assert(html.includes('<span class="header-version">v0.56.1</span>'));
assert(html.includes('css/protocol-dose-schedule.css?v=0.55.0'));
assert(html.includes('js/protocol-dose-schedule.js?v=0.55.0'));
assert(html.indexOf('js/protocol-dose-schedule.js?v=0.55.0') < html.indexOf('js/generic-assessment-ui.js?v=0.56.1'));
assert(genericUi.includes('id="jsonDoseScheduleButton"'));
assert(genericUi.includes('id="jsonDoseSchedulePanel"'));
assert(genericUi.includes('SACTCheckProtocolDoseSchedule?.prepare'));
assert(genericUi.includes('SACTCheckProtocolDoseSchedule?.open'));
assert(doseCss.includes('.dose-schedule-panel'));

const context = { console, globalThis: {} };
context.globalThis = context;
vm.createContext(context);
vm.runInContext(doseSource, context);
assert(context.SACTCheckProtocolDoseSchedule);
assert.strictEqual(context.SACTCheckProtocolDoseSchedule.version, '0.55.0');
assert(!/<input[^>]+type=["']number/i.test(doseSource));
assert(!/oncoassist/i.test(doseSource));

console.log('v0.52.0 Dose & Schedule integration baseline retained under the v0.55.0 integrated engine.');
