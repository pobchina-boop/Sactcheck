'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {TERMS}=require('../tools/patient-editorial-v08444.cjs');
const {normalizePatientText,visibleBodyText,assertVisibleTextIncludes}=require('./helpers/patient-visible-text-v08444.cjs');

test('approved acronym explanations preserve the complete visible clinical sentence',()=>{
 const html='<html><head><title>Unused</title></head><body><p>Keep <strong>electrocardiogram (ECG)</strong> and heart checks.\nNew breath<span>less</span>ness &amp; swollen ankles need prompt assessment.</p></body></html>';
 assertVisibleTextIncludes(html,'Keep ECG and heart checks. New breathlessness & swollen ankles need prompt assessment.');
 assertVisibleTextIncludes('<p>Temperature &#x2265; 37.5&deg;C<br>or &#8804; 36°C: call now.</p>','Temperature ≥ 37.5°C or ≤ 36°C: call now.');
 for(const [acronym,full] of TERMS)assert.equal(normalizePatientText(`${full} (${acronym})`),acronym,acronym);
});

test('changed clinical words, numbers and action instructions still fail',()=>{
 const sentence='Temperature 37.5°C or higher needs urgent contact.';
 assert.throws(()=>assertVisibleTextIncludes('<p>Temperature 38.5°C or higher needs urgent contact.</p>',sentence));
 assert.throws(()=>assertVisibleTextIncludes('<p>Temperature 37.5°C or higher needs routine contact.</p>',sentence));
 assert.throws(()=>assertVisibleTextIncludes('<p>Keep electrocardiogram (ECG) checks. Severe chest pain can wait.</p>','Keep ECG checks. Severe chest pain is an emergency.'));
 assert.throws(()=>assertVisibleTextIncludes('<p>Result &amp;lt; 5.</p>','Result < 5.'),'a visibly broken inequality must not pass through double entity decoding');
});

test('arbitrary parentheses and incorrect acronym explanations are never discarded',()=>{
 assert.throws(()=>assertVisibleTextIncludes('<p>Call now.</p>','Call now (even with a normal temperature).'));
 assert.throws(()=>assertVisibleTextIncludes('<p>Call (only if the symptom is severe) now.</p>','Call now.'));
 assert.throws(()=>assertVisibleTextIncludes('<p>Keep the heart ultrasound (ECG) appointment.</p>','Keep the ECG appointment.'));
 assert.equal(normalizePatientText('CK (including after a dose change)'),'CK (including after a dose change)');
 assertVisibleTextIncludes('<p>Keep creatine kinase (CK) checks (including after a dose change).</p>','Keep CK checks (including after a dose change).');
});

test('hidden text, script data, metadata and attributes cannot substitute for patient-visible words',()=>{
 const expected='Severe chest pain is an emergency.';
 const html=`<html><head><title>${expected}</title><style>.hint::after{content:'${expected}'}</style></head><body><p data-copy="${expected}">Keep appointments.</p><script type="application/json">{"text":"${expected}"}</script><template><p>${expected}</p></template><div hidden>${expected}</div><span aria-hidden="true">${expected}</span><p style="display: none">${expected}</p></body></html>`;
 assert.throws(()=>assertVisibleTextIncludes(html,expected));
 assert.equal(visibleBodyText(html),'Keep appointments.');
});
