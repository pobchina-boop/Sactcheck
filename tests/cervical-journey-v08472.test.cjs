'use strict';

const assert = require('node:assert/strict');
const { context_regimen_profiles: profiles } = require('../data/regimen-knowledge-cervical-v08472.json');
const journeys = require('../js/treatment-journey-v0837.js');
const authoredJourneys = require('../data/breast-treatment-journeys-v0837.json');
const tracker = require('../data/nccp-change-tracker/source-register-v0620.json');
const routes = require('../tools/lib/cervical-patient-routes-v08472.json');

assert.deepEqual(profiles.map(profile => profile.journey_key.replace(':', '/')).sort(), [...routes].sort());
for (const profile of profiles) {
  const [code, context] = profile.journey_key.split(':');
  const patient = require(`../data/patient-knowledge-contexts/${code}/${context}.json`);
  const journey = journeys.definitions[profile.journey_key];
  assert.deepEqual(journey, authoredJourneys[profile.journey_key]);
  assert.equal(journey.title, patient.title);
  const html = journeys.renderForCode(profile.journey_key, 'clinician');
  assert(html.includes(journey.title));
  assert.match(html, /cervical/i);
  for (const lane of journey.lanes) {
    assert.equal(lane.cells.length, journey.stages.length);
    assert(lane.source_ids.every(id => journey.sources.some(source => source.id === id)));
  }
  assert.deepEqual(journey.milestones.map(row => [row.why, row.action]),
    patient.monitoring_schedule.rows.map(row => row.cells));
  const record = tracker.records.find(row => row.nccp_regimen_code === code);
  assert.equal(record.nccp_version, String(patient.protocol_version));
  assert.equal(record.source_url, patient.sources.find(source => source.id === 'nccp').url);
}
console.log('Verified six cervical clinician journeys, patient monitoring schedules, sources and tracker versions.');
