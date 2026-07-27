const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = relativePath => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
const search = require('../js/regimen-search.js');

const folfox = 'Modified FOLFOX-6 oxaliplatin fluorouracil folinic acid NCCP 00209 colorectal cancer';
assert(search.matchesText(folfox, 'folfox'), 'FOLFOX acronym must match');
assert(search.matchesText(folfox, 'FOLFOX-6'), 'Hyphenated FOLFOX-6 must match');
assert(search.matchesText(folfox, 'mFOLFOX6'), 'Compact mFOLFOX6 spelling must match');
assert(search.matchesText(folfox, '5 fu'), 'Spaced 5 FU must resolve to fluorouracil');
assert(search.matchesText(folfox, '5-FU'), 'Hyphenated 5-FU must resolve to fluorouracil');
assert(search.matchesText(folfox, '5FU'), 'Compact 5FU must resolve to fluorouracil');
assert(search.matchesText(folfox, 'leucovorin'), 'Leucovorin must resolve to folinic acid');
assert(search.matchesText(folfox, '00209'), 'NCCP number must match');
assert(search.matchesText('XELOX capecitabine oxaliplatin', 'CAPOX'), 'CAPOX must resolve to XELOX');
assert(search.matchesText('Pegylated liposomal doxorubicin Caelyx', 'PLD'), 'PLD must resolve to the full drug name');
assert(!search.matchesText(folfox, 'pembrolizumab'), 'Unrelated drug must not match');

const index = read('index.html');
const css = read('css/ux-v0471.css');
assert(index.includes('js/regimen-search.js?v=0.48.3'), 'Search normalisation module is not loaded');
assert(index.includes('id="searchResultSummary"'), 'Live search result summary is missing');
assert(index.includes('searchApi.rankCards(cards,q)'), 'Library filter does not use ranked normalised search');
assert(index.includes('event.key==="Enter"'), 'Enter-to-jump search behaviour is missing');
assert(index.includes('filterRegimens({jump:true})'), 'Enter key does not jump to the first match');
assert(index.includes('const okT=Boolean(q)||tumour==="all"'), 'Global search must not be trapped by the current tumour tile');
assert(css.includes('#libraryScreen.search-active #quickAccessPanel'), 'Search mode must bring results up by hiding quick access');
assert(css.includes('#libraryScreen.search-active #tissueExplorer'), 'Search mode must bring results up by hiding tumour navigation');
assert(css.includes('.search-focus-pulse'), 'First-result focus feedback is missing');

console.log('v0.48.0 regimen search tests passed: FOLFOX, 5-FU/5FU, leucovorin, CAPOX/XELOX, PLD and NCCP number aliases resolve.');
