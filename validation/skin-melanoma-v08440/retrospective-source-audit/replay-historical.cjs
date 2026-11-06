'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const R=__dirname,repo=process.env.SACTCHECK_REPO||path.resolve(R,'../../..'),stage=process.env.SACTCHECK_PROTOCOL_ROOT||repo;
const scripts=[['pembro-v08435','validation/colorectal-v08435/pembro-source-audit/source-cases.cjs',[]],['mono-v08427','validation/lung-nivolumab-v08427/nivo-mono/source-cases.cjs',['--integrated']],['combo-v08435','validation/colorectal-v08435/nivo-fruq-source-audit/source-cases.cjs',[]]];
const modes=['baseline','candidate','updated-symptom-contract'];let summary=[];
for(const [name,rel,args] of scripts)for(const mode of modes){if(mode==='updated-symptom-contract'&&name!=='mono-v08427')continue;
 const scriptPath=path.join(repo,rel),dest=path.join(R,'historical-replay',name,mode);fs.mkdirSync(dest,{recursive:true});let code=fs.readFileSync(scriptPath,'utf8');
 const historicalSha256=crypto.createHash('sha256').update(code).digest('hex');
 if(mode==='updated-symptom-contract'){
 const needle="test(f+' '+g,{[f]:g},g>=stop?";if(!code.includes(needle))throw Error('Historical test pattern changed');
 code=code.replace(needle,"test(f+' '+g,{[f]:g,...(['hypothyroidism_grade','hyperthyroidism_grade','hypophysitis_grade'].includes(f)?{endocrine_symptoms:true}:{})},g>=stop?");
 }
 const safeFs={...fs,readFileSync(file,...a){let target=String(file);if(target.startsWith(path.join(repo,'protocols/shared')+path.sep)){const candidate=mode==='baseline'?path.join(R,'protocol-before',path.basename(target)):path.join(stage,path.relative(repo,target));if(fs.existsSync(candidate))target=candidate;}return fs.readFileSync(target,...a);},writeFileSync(file,b,...a){return fs.writeFileSync(path.join(dest,path.basename(String(file))),b,...a);}};
 let logs=[],proc={argv:['node',scriptPath,...args],exitCode:0};
 try{new Function('__dirname','require','console','process','Buffer',code)(path.dirname(scriptPath),function(x){if(['node:fs','fs'].includes(x))return safeFs;return require(x);},{log(...x){logs.push(x.join(' '));},error(...x){logs.push(x.join(' '));}},proc,Buffer);}catch(e){logs.push(e.stack);proc.exitCode=1;}
 fs.writeFileSync(path.join(dest,'run.log'),logs.join('\n')+'\n');const resultFile=fs.readdirSync(dest).find(x=>x.endsWith('.json'));const report=resultFile?JSON.parse(fs.readFileSync(path.join(dest,resultFile))):null;let subset=report?.cases?.filter(x=>x.protocol==='00551');summary.push({name,mode,historical_script:rel,historical_sha256:historicalSha256,script_change:mode==='updated-symptom-contract'?'Three thyroid/pituitary grade scenarios explicitly set symptoms=true; unchanged expected grades/actions. Missing/asymptomatic cases covered independently in new v08440 source cases.':null,exit_code:proc.exitCode,total:report?.total,passed:report?.passed,failed:report?.failed,subset_00551:subset?.length?{total:subset.length,passed:subset.filter(x=>x.passed).length,failed:subset.filter(x=>!x.passed).length}:undefined,results:path.relative(R,dest)});
}
fs.writeFileSync(path.join(R,'historical-replay-summary.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary,null,2));
