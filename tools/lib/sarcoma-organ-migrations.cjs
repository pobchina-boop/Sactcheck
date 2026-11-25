'use strict';
const assert = require('node:assert/strict');
const records = {
  '00462': {
    validator: '../../tests/helpers/sarcoma-inputs-v08462.cjs',
    maturity: 'source_reconciled_pending_independent_review',
    status: 'locally_integrated_v08462_review_source_ambiguities_and_human_approval_pending',
    required: ['PLD_RENAL','KS_PLD_BILI_20_50','KS_PLD_BILI_51_86']
  },
  '00680': {
    validator: '../../tests/helpers/sarcoma-inputs-v08463.cjs',
    maturity: 'source_text_reviewed_pending_clinical_pharmacy_validation',
    status: 'current_extracted_text_reviewed_source_conflicts_retained_pending_clinical_pharmacy_approval',
    required: ['IFOS_RENAL_CONFLICT','IFOS_RENAL_REVIEW','IFOS_HEPATIC_SEVERE','IFOS_HEPATIC_REVIEW']
  }
};
module.exports = function migration(protocol) {
  const record = records[protocol.metadata?.nccp_regimen_code];
  if (!record) return null;
  assert(require(record.validator).validate(protocol));
  for (const id of record.required) {
    const rule = protocol.rule_engine.rules.find(r => (r.id || r.rule_id) === id);
    assert(rule?.source?.url && rule.source.page, id+' needs its source table');
  }
  return record;
};
