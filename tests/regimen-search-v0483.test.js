const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = relativePath => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
const search = require('../js/regimen-search.js');

assert.strictEqual(search.version, '0.48.3');

const folfox = 'Modified FOLFOX-6 oxaliplatin fluorouracil folinic acid NCCP 00209 colorectal cancer q14d';
assert(search.matchesText(folfox, 'FOLFOX'));
assert(search.matchesText(folfox, 'mFOLFOX6'));
assert(search.matchesText(folfox, '5-FU'));
assert(search.matchesText(folfox, 'leucovorin'));
assert(search.matchesText(folfox, 'NCCP 209'));
assert(search.matchesText('FOLFOXIRI 00555 irinotecan oxaliplatin fluorouracil', 'NCCP 555'));
assert(search.scoreText('5-FU + Folinic Acid NCCP 00320', '5-FU').score > search.scoreText('FLOT fluorouracil folinic acid oxaliplatin docetaxel', '5-FU').score, 'Literal 5-FU title should outrank an acronym expanded to include fluorouracil');
assert(search.scoreText(folfox, 'folfux').fuzzy, 'Conservative typo tolerance should recover FOLFUX');

const keynote = 'Pembrolizumab carboplatin paclitaxel Keytruda Taxol NCCP 00857 breast cancer';
assert(search.matchesText(keynote, 'pembro carbo taxol'));
assert(search.matchesText(keynote, 'Keytruda'));

const ac = 'AC Doxorubicin Cyclophosphamide NCCP 00252 breast cancer';
assert(search.matchesText(ac, 'AC'));
assert(!search.matchesText('Paclitaxel monotherapy metastatic breast cancer', 'AC'), 'Short acronym AC must not match arbitrary text');

const exact = search.scoreText('FOLFIRI irinotecan fluorouracil folinic acid NCCP 00227', 'FOLFIRI');
const content = search.scoreText('A comparison paragraph mentioning FOLFIRI', 'FOLFIRI');
assert(exact.score > content.score, 'Exact regimen title should rank above a general content mention');

const index = read('index.html');
const css = read('css/search-v0483.css');
const ui = read('js/regimen-search-ui.js');
assert(index.includes('css/search-v0483.css?v=0.48.3'));
assert(index.includes('js/regimen-search.js?v=0.48.3'));
assert(index.includes('js/regimen-search-ui.js?v=0.48.3'));
assert(index.includes('id="searchSuggestions"'));
assert(index.includes('searchApi.rankCards(cards,q)'));
assert(index.includes('Best matches are shown first'));
assert(index.includes('event.key==="Escape"'));
assert(css.includes('.search-suggestion-button'));
assert(css.includes('.search-best-match'));
assert(ui.includes('Ranked by title, drug aliases, NCCP number and indication'));

console.log('v0.48.3 ranked search tests passed: aliases, NCCP normalisation, typo tolerance, ranking and result suggestions verified.');
