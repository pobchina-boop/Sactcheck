#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const protocolRoot = path.join(root, 'protocols');
const OUTPUT_JSON = path.join(root, 'V0581_ORGAN_FUNCTION_RULE_COVERAGE_AUDIT.json');
const OUTPUT_CSV = path.join(root, 'V0581_ORGAN_FUNCTION_RULE_COVERAGE_AUDIT.csv');
const OUTPUT_MD = path.join(root, 'V0581_ORGAN_FUNCTION_RULE_COVERAGE_AUDIT.md');

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return files(full);
    return entry.isFile() && entry.name.endsWith('.json') && entry.name !== 'index.json' ? [full] : [];
  });
}
function asArray(v){ return v == null ? [] : Array.isArray(v) ? v : [v]; }
function inputEntries(protocol){
  const raw=protocol.input_definitions || {};
  return Array.isArray(raw) ? raw.map(d=>[d.id,d]) : Object.entries(raw);
}
function conditionFields(node, out=[]){
  if (!node) return out;
  if (Array.isArray(node)){ node.forEach(x=>conditionFields(x,out)); return out; }
  if (typeof node !== 'object') return out;
  if (node.field) out.push(String(node.field));
  ['all','any','none','not'].forEach(k=>conditionFields(node[k],out));
  return out;
}
const renalPattern=/\b(?:renal|kidney|crcl|egfr|gfr|creatinine|dialysis|haemodialysis)\b/i;
const hepaticPattern=/\b(?:hepatic|liver|bilirubin|ast|alt|transaminase|child[ -]?pugh|alp)\b/i;
function text(v){ return JSON.stringify(v ?? '').replace(/["{}_\[\],:]/g,' '); }
function matches(pattern, value){ return pattern.test(String(value || '').replace(/[_-]+/g, ' ')); }
function domainCoverage(protocol, pattern){
  const inputs=inputEntries(protocol).filter(([id,d])=>matches(pattern, `${id} ${d?.label||''} ${d?.unit||''}`)).map(([id])=>id);
  const rules=asArray(protocol.rule_engine?.rules).filter(r=>conditionFields(r.when || r.condition || r).some(f=>matches(pattern, f))).map(r=>r.id || '(unnamed)');
  return {inputs,rules};
}

const records=files(protocolRoot).map(file=>{
  const protocol=JSON.parse(fs.readFileSync(file,'utf8'));
  const doseText=text(protocol.dose_modifications);
  const monitoringText=text(protocol.monitoring);
  const renal=domainCoverage(protocol,renalPattern);
  const hepatic=domainCoverage(protocol,hepaticPattern);
  const assertsRuleEncoding=/encoded|independently actionable|rule[ -]?level/i.test(doseText);
  const claimsRenal=assertsRuleEncoding && matches(renalPattern,doseText);
  const claimsHepatic=assertsRuleEncoding && matches(hepaticPattern,doseText);
  const monitorsRenal=matches(renalPattern,monitoringText);
  const monitorsHepatic=matches(hepaticPattern,monitoringText);
  const mismatches=[];
  if (claimsRenal && !renal.inputs.length) mismatches.push('renal_claim_without_input');
  if (claimsRenal && !renal.rules.length) mismatches.push('renal_claim_without_rule');
  if (claimsHepatic && !hepatic.inputs.length) mismatches.push('hepatic_claim_without_input');
  if (claimsHepatic && !hepatic.rules.length) mismatches.push('hepatic_claim_without_rule');
  return {
    code:String(protocol.metadata?.nccp_regimen_code||''),
    protocol_id:protocol.protocol_id,
    path:path.relative(root,file).replace(/\\/g,'/'),
    title:protocol.metadata?.title||'',
    encoding_maturity:protocol.metadata?.encoding_maturity?.level||'not_formally_audited',
    claims:{renal:claimsRenal,hepatic:claimsHepatic},
    monitoring_mentions:{renal:monitorsRenal,hepatic:monitorsHepatic},
    inputs:{renal:renal.inputs,hepatic:hepatic.inputs},
    rules:{renal:renal.rules,hepatic:hepatic.rules},
    mismatches
  };
}).sort((a,b)=>a.code.localeCompare(b.code));

const mismatched=records.filter(r=>r.mismatches.length);
const summary={
  release:'0.58.1',
  generated:'2026-08-05',
  protocols_scanned:records.length,
  protocols_with_rule_level_claim_mismatch:mismatched.length,
  mismatch_counts:mismatched.flatMap(r=>r.mismatches).reduce((o,k)=>(o[k]=(o[k]||0)+1,o),{}),
  note:'A mismatch means the protocol dose-modifications text claims renal/hepatic rule-level encoding while no corresponding structured input or decision rule was detected. Monitoring-only mentions are reported separately and are not treated as rule-level mismatches.'
};
fs.writeFileSync(OUTPUT_JSON,JSON.stringify({summary,records},null,2)+'\n');
const esc=v=>`"${String(v??'').replace(/"/g,'""')}"`;
const rows=[['code','protocol_id','path','title','encoding_maturity','claims_renal','renal_inputs','renal_rules','claims_hepatic','hepatic_inputs','hepatic_rules','mismatches']];
records.forEach(r=>rows.push([r.code,r.protocol_id,r.path,r.title,r.encoding_maturity,r.claims.renal,r.inputs.renal.join('|'),r.rules.renal.join('|'),r.claims.hepatic,r.inputs.hepatic.join('|'),r.rules.hepatic.join('|'),r.mismatches.join('|')]));
fs.writeFileSync(OUTPUT_CSV,rows.map(r=>r.map(esc).join(',')).join('\n')+'\n');
const lines=[
  '# v0.58.1 Organ-Function Rule-Coverage Audit','',
  `- Protocols scanned: **${summary.protocols_scanned}**`,
  `- Protocols with a rule-level claim mismatch: **${summary.protocols_with_rule_level_claim_mismatch}**`,'',
  summary.note,'',
  '## Rule-level claim mismatches',''
];
if (!mismatched.length) lines.push('No rule-level claim mismatches detected.');
else mismatched.forEach(r=>lines.push(`- **${r.code} — ${r.title}**: ${r.mismatches.join(', ')} (${r.path})`));
fs.writeFileSync(OUTPUT_MD,lines.join('\n')+'\n');
console.log(JSON.stringify(summary,null,2));
if (process.argv.includes('--fail-on-mismatch') && mismatched.length) process.exit(1);
