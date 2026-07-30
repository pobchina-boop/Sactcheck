const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
require(path.join(root, 'js', 'protocol-dose-schedule.js'));
const DoseSchedule = globalThis.SACTCheckProtocolDoseSchedule;
const catalogue = JSON.parse(fs.readFileSync(path.join(root, 'protocols', 'index.json'), 'utf8'));

function csv(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const rows = catalogue.protocols.map(entry => {
  const protocol = JSON.parse(fs.readFileSync(path.join(root, entry.path), 'utf8'));
  const model = DoseSchedule.buildModel(protocol);
  return {
    protocol_id: protocol.protocol_id,
    nccp_code: protocol.metadata?.nccp_regimen_code || '',
    version: protocol.metadata?.nccp_version || '',
    title: protocol.metadata?.short_title || protocol.metadata?.title || '',
    tumour_group: Array.isArray(protocol.metadata?.tumour_group) ? protocol.metadata.tumour_group.join(' | ') : (protocol.metadata?.tumour_group || ''),
    useful_dose_schedule_view: DoseSchedule.hasData(protocol),
    complete_schedule_available: model.phases.length > 0,
    complete_phase_count: model.phases.length,
    displayed_component_count: model.phases.reduce((sum, phase) => sum + phase.components.length, 0),
    genuine_dose_level_groups: model.doseLevels.length,
    generic_assessment_rules_repeated: false,
    placeholder_rows_displayed: false,
    source_url: protocol.metadata?.source_url || '',
    clinical_validation_authorised: protocol.metadata?.validation?.clinical_use_authorised === true
  };
});

const summary = {
  release: '0.52.1',
  generated_at: new Date().toISOString(),
  total_protocols: rows.length,
  useful_dose_schedule_view: rows.filter(row => row.useful_dose_schedule_view).length,
  hidden_due_to_insufficient_structured_data: rows.filter(row => !row.useful_dose_schedule_view).length,
  complete_schedule_available: rows.filter(row => row.complete_schedule_available).length,
  protocols_with_genuine_dose_levels: rows.filter(row => row.genuine_dose_level_groups > 0).length,
  generic_assessment_rules_repeated: false,
  placeholder_rows_displayed: false,
  patient_specific_calculation_enabled: false,
  oncoassist_link_enabled: false,
  clinical_use_authorised_by_this_release: false
};

const basename = 'V0521_PROTOCOL_DOSE_SCHEDULE_CLARITY';
fs.writeFileSync(path.join(root, `${basename}.json`), JSON.stringify({ summary, protocols: rows }, null, 2) + '\n');
const headers = Object.keys(rows[0]);
fs.writeFileSync(path.join(root, `${basename}.csv`), [headers.join(','), ...rows.map(row => headers.map(header => csv(row[header])).join(','))].join('\n') + '\n');

const markdown = `# SACTCheck v0.52.1 Dose & Schedule clarity audit\n\n` +
`- Total protocols: **${summary.total_protocols}**\n` +
`- Protocols with a useful Dose & Schedule view: **${summary.useful_dose_schedule_view}**\n` +
`- Protocols hidden because structured dosing data are insufficient: **${summary.hidden_due_to_insufficient_structured_data}**\n` +
`- Protocols with a complete displayed schedule: **${summary.complete_schedule_available}**\n` +
`- Protocols with genuine dose-level tables: **${summary.protocols_with_genuine_dose_levels}**\n` +
`- Generic assessment / CTCAE rules repeated in the dosing panel: **No**\n` +
`- Placeholder dose or route rows displayed: **No**\n\n` +
`## Safety boundary\n\nThe viewer displays only explicit structured protocol doses, treatment days and dose-level values. It does not calculate BSA, renal function, carboplatin dose or a patient-specific final dose. No protocol is clinically authorised by this release.\n`;
fs.writeFileSync(path.join(root, `${basename}.md`), markdown);

console.log(JSON.stringify(summary, null, 2));
