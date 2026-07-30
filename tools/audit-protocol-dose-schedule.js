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
    schedule_available: DoseSchedule.hasData(protocol),
    structured_treatment_phases: Array.isArray(protocol.treatment_phases) && protocol.treatment_phases.length > 0,
    structured_treatment_object: Boolean(protocol.treatment && typeof protocol.treatment === 'object'),
    phase_count: model.phases.length,
    component_count: model.phases.reduce((sum, phase) => sum + phase.components.length, 0),
    selectable_dose_level_groups: model.doseLevels.length,
    modification_pathways: model.modificationRules.length,
    source_url: protocol.metadata?.source_url || '',
    clinical_validation_authorised: protocol.metadata?.validation?.clinical_use_authorised === true
  };
});

const summary = {
  release: '0.52.0',
  generated_at: new Date().toISOString(),
  total_protocols: rows.length,
  schedule_available: rows.filter(row => row.schedule_available).length,
  schedule_not_yet_structured: rows.filter(row => !row.schedule_available).length,
  structured_treatment_phases: rows.filter(row => row.structured_treatment_phases).length,
  structured_treatment_objects: rows.filter(row => row.structured_treatment_object).length,
  protocols_with_selectable_dose_levels: rows.filter(row => row.selectable_dose_level_groups > 0).length,
  protocols_with_modification_pathways: rows.filter(row => row.modification_pathways > 0).length,
  patient_specific_calculation_enabled: false,
  oncoassist_link_enabled: false,
  clinical_use_authorised_by_this_release: false
};

fs.writeFileSync(path.join(root, 'V0520_PROTOCOL_DOSE_SCHEDULE_COVERAGE.json'), JSON.stringify({ summary, protocols: rows }, null, 2) + '\n');
const headers = Object.keys(rows[0]);
fs.writeFileSync(path.join(root, 'V0520_PROTOCOL_DOSE_SCHEDULE_COVERAGE.csv'), [headers.join(','), ...rows.map(row => headers.map(header => csv(row[header])).join(','))].join('\n') + '\n');

const markdown = `# SACTCheck v0.52.0 Protocol Dose & Schedule coverage\n\n` +
`- Total protocols: **${summary.total_protocols}**\n` +
`- Protocols with structured schedule display: **${summary.schedule_available}**\n` +
`- Protocols awaiting structured schedule metadata: **${summary.schedule_not_yet_structured}**\n` +
`- Protocols with structured treatment phases: **${summary.structured_treatment_phases}**\n` +
`- Protocols with a structured treatment object: **${summary.structured_treatment_objects}**\n` +
`- Protocols with selectable dose level groups: **${summary.protocols_with_selectable_dose_levels}**\n` +
`- Protocols with encoded modification pathways: **${summary.protocols_with_modification_pathways}**\n\n` +
`## Safety boundary\n\nThe viewer displays existing protocol metadata and encoded modification pathways. It does not calculate BSA, renal function, carboplatin dose or a patient-specific final dose. No protocol is clinically authorised by this release.\n`;
fs.writeFileSync(path.join(root, 'V0520_PROTOCOL_DOSE_SCHEDULE_COVERAGE.md'), markdown);

console.log(JSON.stringify(summary, null, 2));
