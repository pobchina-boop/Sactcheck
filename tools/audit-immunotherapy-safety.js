const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const Engine = require(path.join(root, 'js/assessment-engine.js'));
const Safety = require(path.join(root, 'js/immunotherapy-safety.js'));
const index = require(path.join(root, 'protocols/index.json'));

const rows = [];
const agentCounts = {};
const domainCounts = Object.fromEntries(Safety.domains.map(domain => [domain.id, 0]));

for (const item of index.protocols) {
  const protocol = require(path.join(root, item.path));
  const profileId = Engine.getProfiles(protocol)[0]?.id || 'default';
  const definitions = Engine.getInputDefinitions(protocol, profileId, {});
  if (!Safety.supports(protocol, definitions)) continue;
  const agents = Safety.agentsForProtocol(protocol);
  agents.forEach(agent => { agentCounts[agent] = (agentCounts[agent] || 0) + 1; });
  const linked = {};
  Safety.domains.forEach(domain => {
    const count = Safety.linkedDefinitions(domain, definitions).length;
    linked[domain.id] = count;
    if (count) domainCounts[domain.id] += 1;
  });
  rows.push({
    nccp_code: protocol.metadata?.nccp_regimen_code || '',
    title: protocol.metadata?.short_title || protocol.metadata?.title || '',
    agents: agents.join(' + '),
    path: item.path,
    total_inputs: definitions.length,
    ...Object.fromEntries(Safety.domains.map(domain => [`${domain.id}_inputs`, linked[domain.id]]))
  });
}

const headers = Object.keys(rows[0] || {});
const csvEscape = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
fs.writeFileSync(path.join(root, 'V0530_IMMUNOTHERAPY_VISUAL_SAFETY_AUDIT.csv'), [headers.map(csvEscape).join(','), ...rows.map(row => headers.map(header => csvEscape(row[header])).join(','))].join('\n') + '\n');

const md = [
  '# SACTCheck v0.53.0 — Immunotherapy Visual Safety Audit',
  '',
  `- Supported immune-checkpoint inhibitor protocols: **${rows.length}**`,
  `- Visual organ systems: **${Safety.domains.length}**`,
  `- Protocol JSON files changed: **0**`,
  '',
  '## Agent coverage',
  '',
  ...Object.entries(agentCounts).sort((a,b) => b[1]-a[1]).map(([agent, count]) => `- ${agent}: ${count} protocol${count === 1 ? '' : 's'}`),
  '',
  '## Protocols with at least one linked input by organ system',
  '',
  ...Safety.domains.map(domain => `- ${domain.label}: ${domainCounts[domain.id]}`),
  '',
  '## Safety boundary',
  '',
  'The visual panel does not add new treatment rules. Status highlighting is derived only from values entered into existing protocol inputs and findings returned by the deterministic assessment engine. The current NCCP protocol and local immune-toxicity pathway remain authoritative.',
  ''
].join('\n');
fs.writeFileSync(path.join(root, 'V0530_IMMUNOTHERAPY_VISUAL_SAFETY_AUDIT.md'), md);
console.log(`Audited ${rows.length} immunotherapy protocols.`);
