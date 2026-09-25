"use strict";
const assert=require("assert");
const Patient=require("../js/patient-support-v0740.js");

assert.strictEqual(Patient.release,"0.74.0");
assert.strictEqual(Patient.normalise("Nab-paclitaxel (Abraxane) IV"),"nab paclitaxel");
const grades=Patient.patientGradeScale();
assert.deepStrictEqual(grades.map(x=>x.grade),["0","1","2","3","4"]);
assert.ok(/not/i.test("not a CTCAE assessment"));
assert.strictEqual(Patient.actionLevel({id:"myocarditis",label:"Myocarditis",tier:"serious"}),"urgent");
assert.strictEqual(Patient.actionLevel({id:"hypertension",label:"Hypertension",tier:"serious"}),"contact");

const protocol={
  protocol_id:"demo",
  metadata:{title:"Demo regimen",nccp_regimen_code:"99999"},
  treatment_phases:[{
    name:"Phase A",cycle_length_days:21,
    administration:[
      {day:1,drug:"Atezolizumab",route:"IV"},
      {day:1,drug:"Bevacizumab",route:"IV"},
      {day:8,drug:"Paclitaxel",route:"IV"}
    ]
  }]
};
const rows=Patient.scheduleRows(protocol);
assert.strictEqual(rows.length,1);
assert.strictEqual(rows[0].cycle,21);
assert.ok(Patient.scheduleSummary(protocol).includes("Day 8"));
assert.ok(Patient.componentsForProtocol(protocol).some(x=>/Atezolizumab/i.test(x)));

console.log("v0.74.0 patient-support helper tests passed.");
