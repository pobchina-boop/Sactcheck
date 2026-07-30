const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const source = fs.readFileSync(path.join(root, 'js/protocol-dose-schedule.js'), 'utf8');
const Dose = require(path.join(root, 'js/protocol-dose-schedule.js'));
const Engine = require(path.join(root, 'js/assessment-engine.js'));

assert.strictEqual(pkg.version, '0.52.5');
assert.strictEqual(Dose.version, '0.52.5');
assert(html.includes('SACTCheck v0.52.5 — Dose Action Navigation'));
assert(html.includes('js/protocol-dose-schedule.js?v=0.52.5'));
assert(source.includes('const hasAssessmentDoseAction = Boolean(activeModificationModel?.rows?.length);'));
assert(source.includes('Review dose action'));
assert(source.includes('A structured regimen schedule is not yet available in SACTCheck for this protocol.'));

function classList(initial = []) {
  const values = new Set(initial);
  return {
    add: (...items) => items.forEach(item => values.add(item)),
    remove: (...items) => items.forEach(item => values.delete(item)),
    contains: item => values.has(item),
    toggle: (item, force) => {
      if (force === true) values.add(item);
      else if (force === false) values.delete(item);
      else if (values.has(item)) values.delete(item);
      else values.add(item);
      return values.has(item);
    }
  };
}

const panel = {
  classList: classList(['hidden']),
  innerHTML: '',
  scrollIntoViewCalled: false,
  scrollIntoView() { this.scrollIntoViewCalled = true; }
};
const headerButton = { classList: classList(['hidden']) };
const prompt = { classList: classList(['hidden']), innerHTML: '' };
const elements = {
  jsonDoseSchedulePanel: panel,
  jsonDoseScheduleButton: headerButton,
  jsonDoseModificationPrompt: prompt
};

global.document = {
  getElementById(id) { return elements[id] || null; }
};

const protocol = require(path.join(root, 'protocols/head-neck/00705-pembrolizumab-carboplatin-auc-5-and-5-fluorouracil.json'));
assert.strictEqual(Dose.hasData(protocol), false, 'Test protocol must reproduce the no-structured-schedule state.');

Dose.prepare(protocol);
const result = Engine.assess(protocol, { ast_u_l: 500 }, {});
const modification = Dose.updateAssessment(result);
assert.strictEqual(modification.rows.length, 1);
assert.strictEqual(modification.rows[0].component, 'Fluorouracil');
assert(prompt.innerHTML.includes('Review dose action'));

Dose.open(protocol);
assert.strictEqual(panel.classList.contains('hidden'), false, 'Action-only panel should open even without a structured schedule.');
assert.strictEqual(panel.scrollIntoViewCalled, true);
assert(panel.innerHTML.includes('Applicable protocol dose action'));
assert(panel.innerHTML.includes('Fluorouracil'));
assert(panel.innerHTML.includes('Do not administer'));
assert(panel.innerHTML.includes('A structured regimen schedule is not yet available'));
assert.strictEqual(headerButton.classList.contains('hidden'), true, 'Header schedule button should remain hidden without actual schedule data.');

delete global.document;
console.log('v0.52.5 dose-action prompt navigation tests passed.');
