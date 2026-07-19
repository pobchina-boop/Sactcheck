const fs = require('fs');
const assert = require('assert');

const index = JSON.parse(fs.readFileSync('protocols/index.json', 'utf8'));
const paclitaxel = index.protocols.find(item => item.id === 'nccp-00226-v9');
assert(paclitaxel, 'Weekly paclitaxel must be present in the protocol index.');
assert.strictEqual(paclitaxel.mode, 'live_json', 'Weekly paclitaxel must remain published through the JSON engine.');
assert.strictEqual(paclitaxel.legacy_card_id, 'openPaclitaxel', 'The existing catalogue card must be reusable by the generic launcher.');

const folfox = index.protocols.find(item => item.id === 'nccp-00209-v10a');
assert(folfox, 'Modified FOLFOX-6 must be present in the protocol index.');
assert.strictEqual(folfox.mode, 'live_json', 'Modified FOLFOX-6 must be promoted to the live JSON engine.');
assert.strictEqual(folfox.legacy_card_id, 'openFolfox', 'The existing FOLFOX catalogue card must be reusable by the generic launcher.');

const olaparib = index.protocols.find(item => item.id === 'nccp-00588-v5b');
assert(olaparib, 'Olaparib must be present in the protocol index.');
assert.strictEqual(olaparib.mode, 'live_json', 'Olaparib must remain published through the JSON engine.');
assert(!olaparib.legacy_card_id, 'Olaparib should use a protocol-generated catalogue card.');

const loader = fs.readFileSync('js/protocol-loader.js', 'utf8');
assert(loader.includes('function launchProtocol(protocolId)'), 'The loader must expose one protocol-agnostic launch path.');
assert(loader.includes('launchProtocol(button.dataset.protocolId)'), 'Buttons must launch by protocol ID rather than captured protocol-specific code.');
assert(loader.includes('bindProtocolLaunch'), 'Generated and migrated cards must share one launch-binding function.');
assert(loader.includes('isPublishedForAssessment'), 'Publication visibility must be decided generically from index metadata.');
assert(loader.includes('launchProtocol,'), 'The generic launcher must be available through SACTCheckProtocolLoader.');
assert(!loader.includes("protocolId === 'nccp-00226"), 'The loader must not contain a paclitaxel-specific launch branch.');
assert(!loader.includes("protocolId === 'nccp-00588"), 'The loader must not contain an olaparib-specific launch branch.');
assert(loader.includes('JSON assessment live'), 'Published cards must display the live assessment badge.');
assert(loader.includes('createOfficialPdfLink'), 'Protocol cards must support a prominent official PDF action.');
assert(loader.includes('Official NCCP PDF'), 'The official source control must be clearly labelled.');
assert(loader.includes('metadata.source_url'), 'Generated protocol cards must derive the PDF link from protocol metadata.');

const html = fs.readFileSync('index.html', 'utf8');
assert(!html.includes('js/paclitaxel-shadow-ui.js'), 'The obsolete paclitaxel shadow launcher must not load.');
assert(html.includes('id="openPaclitaxel"'), 'The weekly paclitaxel legacy catalogue target must remain available for generic replacement.');
assert(html.includes('js/protocol-loader.js?v=0.24'), 'The main app must load the v0.24 protocol expansion release without stale caching.');

console.log('Main-app protocol-agnostic launcher tests passed.');
