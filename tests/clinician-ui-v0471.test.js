const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = relativePath => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
const json = relativePath => JSON.parse(read(relativePath));

const index = read('index.html');
const loader = read('js/protocol-loader.js');
const tissueUi = read('js/tissue-ui.js');
const libraryUx = read('js/library-ux.js');
const cardMetadata = read('js/regimen-card-metadata.js');
const assessmentUi = read('js/generic-assessment-ui.js');
const uxCss = read('css/ux-v0471.css');
const protocolIndex = json('protocols/index.json');
const rows = Array.isArray(protocolIndex) ? protocolIndex : protocolIndex.protocols;
const enabled = rows.filter(row => row.enabled !== false);

assert.strictEqual(enabled.length, 366, 'The clinician catalogue must expose all 366 canonical protocols');
assert(index.includes('v0.49.0 · What changed?'), 'Compact release summary is missing');
assert(index.includes('Search the complete regimen library'), 'Primary regimen search is missing');
assert(read('js/haemato-oncology.js').includes('Search the haemato-oncology library'), 'Haemato-oncology search mode is missing');
assert(index.includes('id="quickAccessPanel"'), 'Favourite/recent quick access panel is missing');
assert(index.includes('id="developerTools" hidden'), 'Developer controls must be hidden during normal clinical use');
assert(index.includes('id="catalogEmptyState"'), 'Empty search result state is missing');
assert(/css\/ux-v0471\.css\?v=0\.48\.\d+/.test(index), 'Usability stylesheet is not loaded');
assert(/js\/library-ux\.js\?v=0\.48\.\d+/.test(index), 'Library usability module is not loaded');
assert(index.includes('canonical NCCP regimen'), 'Visible catalogue count must use canonical protocol terminology');

assert(loader.includes('legacyTargetCounts'), 'Duplicate legacy-card reconciliation is missing');
assert(loader.includes('.regimen-card:not([data-json-protocol-id])'), 'Non-canonical placeholder cards must be removed');
assert(loader.includes('enableCardLaunch(card)'), 'Whole-card protocol launch is missing');
assert(loader.includes('Official NCCP source · Validation pending'), 'Combined source/validation badge is missing');
assert(!loader.includes('<span class="badge engine-status">Engine · JSON</span>'), 'Engine implementation details must not dominate clinical cards');

assert(libraryUx.includes('sactcheck:favourites:v1'), 'Favourite protocol persistence is missing');
assert(libraryUx.includes('sactcheck:recent-protocols:v1'), 'Recent protocol persistence is missing');
assert(libraryUx.includes('new URLSearchParams(root.location?.search || "").has("debug")'), 'Developer mode must require an explicit debug query');
assert(libraryUx.includes('dismissPrototypeNotice'), 'Prototype banner minimisation is missing');

assert(tissueUi.includes('Haematology — limited coverage'), 'Incomplete haemato-oncology coverage must be labelled clearly');
assert(tissueUi.includes('· limited'), 'Limited tissue tile state is missing');

assert(cardMetadata.includes('PHASED_SCHEDULE_LABELS'), 'Explicit phased schedule metadata is missing');
assert(cardMetadata.includes('AC q21d → paclitaxel q7d'), 'AC-to-paclitaxel phase schedule is not represented');
assert(cardMetadata.includes('Phased regimen'), 'Phased regimen duration badge is missing');

assert(assessmentUi.includes('Key protocol comparison'), 'Priority value-versus-criterion result block is missing');
assert(assessmentUi.includes('Encoded treatment criteria not met'), 'Non-directive restrictive outcome wording is missing');
assert(assessmentUi.includes('No encoded criteria breached in assessed domains'), 'Non-directive reassuring outcome wording is missing');
assert(assessmentUi.includes('Why this result? View detailed encoded findings'), 'Detailed result logic must use progressive disclosure');
assert(assessmentUi.includes('coverage-gap-strip'), 'Compact unassessed-domain disclosure is missing');
assert(assessmentUi.includes('Decision support — not treatment clearance.'), 'Compact on-screen safety wording is missing');
assert(!assessmentUi.includes('window.print()'), 'Assessment output must retain direct PDF generation');

assert(uxCss.includes('.tissue-tile.active'), 'Active tissue navigation styling is missing');
assert(uxCss.includes('.regimen-card:focus-visible'), 'Keyboard focus styling is missing');
assert(uxCss.includes('.quick-access-panel'), 'Quick-access styling is missing');
assert(uxCss.includes('.priority-findings'), 'Priority assessment findings styling is missing');

console.log(`v0.48.0 clinician UI tests passed: ${enabled.length} canonical protocols, streamlined cards and prioritised assessment output.`);
