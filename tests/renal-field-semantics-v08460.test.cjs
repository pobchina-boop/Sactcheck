'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {isRenalMeasurement}=require('./helpers/renal-field-semantics-v08460.cjs'),S=require('./helpers/sarcoma-inputs-v08460.cjs'),R=path.resolve(__dirname,'..');
for(const [field,definition,expected]of [
 ['creatinine_percent_of_gfr_baseline',{label:'Creatinine as percentage of value at measured GFR',unit:'%'},false],
 ['creatinine_ratio_to_isotope_baseline',{label:'Creatinine ratio at measured GFR',unit:'ratio'},false],
 ['creatinine_sample_age_hours',{label:'Age of creatinine used for GFR',unit:'hours'},false],
 ['crcl_ml_min',{label:'Creatinine clearance',unit:'mL/min'},true],
 ['gfr_ml_min',{label:'Measured GFR',unit:'mL/min'},true],
 ['renal_band',{label:'Creatinine clearance band'},true],
 ['creatinine',{label:'Serum creatinine',unit:'µmol/L'},false]
])assert.equal(isRenalMeasurement(field,definition),expected,field);
const files=fs.readdirSync(path.join(R,'protocols/genitourinary')),transplant=JSON.parse(fs.readFileSync(path.join(R,'protocols/genitourinary',files.find(f=>f.startsWith('00453-')))));
const field='creatinine_percent_of_gfr_baseline',d=transplant.input_definitions[field];assert.equal(d.unit,'%');assert.equal(d.type,'number');assert.equal(isRenalMeasurement(field,d),false);
const actualGfr=transplant.input_definitions.gfr_ml_min;assert(actualGfr);assert.equal(isRenalMeasurement('gfr_ml_min',actualGfr),true);
for(const c of S.codes){const file=fs.readdirSync(path.join(R,'protocols/sarcoma')).find(f=>f.startsWith(c+'-'));const p=JSON.parse(fs.readFileSync(path.join(R,'protocols/sarcoma',file)));assert(S.numericRenal(p,'crcl_ml_min',p.input_definitions.crcl_ml_min));assert.equal(S.numericRenal(p,'bilirubin_umol_l',p.input_definitions.bilirubin_umol_l),false);assert.equal(isRenalMeasurement('crcl_ml_min',p.input_definitions.crcl_ml_min),true);}
console.log('Renal field semantics passed: percentage/ratio/sample age excluded; measured CrCl/GFR retained; actual unchanged00453 and five pinned sarcoma numeric contracts verified.');
