'use strict';
// Replay the immutable colorectal audit and add explicit current-source scenarios.
// Historical assertions and its requirement to positively exercise every rule remain intact.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),Module=require('node:module');
const root=path.resolve(__dirname,'..'),file=path.join(root,'validation/colorectal-v08434/oral-source-audit/source-cases.cjs');
let source=fs.readFileSync(file,'utf8');
assert.equal(crypto.createHash('sha256').update(source).digest('hex'),'37b32339d2504800535c7e8b3ff412280bc25bf88e8d96b387a68e1556cc3a08');
require('./helpers/gist-inputs-v08461.cjs').validate(require('../protocols/gastrointestinal/00244-regorafenib.json'));
const cases=`
G('Prior permanent stop survives generic restart approval',{restart_requested:true,consultant_restart_approved:true,regorafenib_permanent_stop_history:true},'2–5',has('PRIOR_PERMANENT_STOP','permanently_discontinue'));
G('Third grade3 HFSR remains stopped after recovery',{hfsr_grade:0,hfsr_worst_grade_this_episode:3,hfsr_occurrence:3},3,has('HFSR_HISTORICAL_PERMANENT_STOP','permanently_discontinue'));
G('Second grade3 HFSR does not invent permanent stop',{hfsr_grade:0,hfsr_worst_grade_this_episode:3,hfsr_occurrence:2},3,absent('HFSR_HISTORICAL_PERMANENT_STOP'));
for(const peak of [20,20.001])G('Recovered previous liver peak '+peak,{alt_ast_ratio_uln:1,liver_prior_peak_transaminase_uln:peak},4,peak>20?has('LIVER_HISTORICAL_PERMANENT_STOP','permanently_discontinue'):absent('LIVER_HISTORICAL_PERMANENT_STOP'));
for(const failed of [true,false])G('Table5 late recovery with documented four-week failure '+failed,{other_toxicity_failed_recovery_by4weeks:failed,other_toxicity_grade:1,treatment_delay_days:35},5,failed?has('TABLE5_HISTORICAL_PERMANENT_STOP','permanently_discontinue'):absent('TABLE5_HISTORICAL_PERMANENT_STOP'));
for(const recovered of [false,true])G('Known grade3 HFSR recovery cannot be erased by other restart reason '+recovered,{restart_requested:true,restart_reason:'liver',hfsr_worst_grade_this_episode:3,hfsr_recovered_grade01:recovered},3,recovered?absent('KNOWN_HFSR_RECOVERY_REQUIRED'):has('KNOWN_HFSR_RECOVERY_REQUIRED','withhold'));
for(const [reason,id]of [['hfsr','HFSR'],['liver','LIVER'],['hypertension','HYPERTENSION'],['other_table5','OTHER_TABLE5']])G('Restart missing event-specific history '+reason,{restart_requested:true,restart_reason:reason,consultant_restart_approved:true},'3–5',has('RESTART_'+id+'_HISTORY_REQUIRED','withhold'));
for(const alt of [2.999,3])G('Liver recovery objective boundary '+alt,{restart_requested:true,restart_reason:'liver',alt_ast_ratio_uln:alt,liver_recovered_lt3_or_baseline:false,consultant_restart_approved:true},4,alt>=3?has('LIVER_RESTART_OBJECTIVE_NOT_RECOVERED','withhold'):absent('LIVER_RESTART_OBJECTIVE_NOT_RECOVERED'));
for(const grade of [1,2])G('Current HFSR grade overrides recovery checkbox '+grade,{restart_requested:true,restart_reason:'hfsr',hfsr_grade:grade,hfsr_recovered_grade01:true,consultant_restart_approved:true},3,grade>=2?has('HFSR_RESTART_CURRENT_GRADE','withhold'):absent('HFSR_RESTART_CURRENT_GRADE'));
for(const bp of [100,100.001])G('Restart current diastolic boundary '+bp,{restart_requested:true,restart_reason:'hypertension',diastolic_bp_mmhg:bp,hypertension_symptoms_resolved:true},5,bp>100?has('HYPERTENSION_RESTART_CURRENT_BP','withhold'):absent('HYPERTENSION_RESTART_CURRENT_BP'));
`;
const marker="for(const c of Object.keys(P))structure(c,'Each encoded rule";
assert.equal(source.split(marker).length,2);source=source.replace(marker,cases+'\n'+marker);
// Keep generated replay output out of immutable historical evidence.
const temporary=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'sactcheck-crc-replay-'));
const output="path.join(H,'source-case-results.json')";
assert.equal(source.split(output).length,2);
source=source.replace(output,JSON.stringify(path.join(temporary,'source-case-results.json')));
try{
 const replay=new Module(file,module);replay.filename=file;replay.paths=Module._nodeModulePaths(path.dirname(file));replay._compile(source,file);
 const report=JSON.parse(fs.readFileSync(path.join(temporary,'source-case-results.json')));
 assert.equal(report.failed,0);assert.equal(report.total,596);
 console.log('Immutable colorectal oral audit plus 19 current-source cases: 596/596; all current rules positively exercised.');
}finally{fs.rmSync(temporary,{recursive:true,force:true});}
