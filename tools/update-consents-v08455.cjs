'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const core=require('./consent-core-v08455.cjs'),R=path.resolve(__dirname,'..'),check=process.argv.includes('--check');
const report={release:'0.84.55',routes:[],missing_profiles:[],changed:[]};
function walk(d){for(const e of fs.readdirSync(path.join(R,d),{withFileTypes:true})){const f=d+'/'+e.name;if(e.isDirectory())walk(f);else if(e.name==='consent-form.html'){
 const html=fs.readFileSync(path.join(R,f),'utf8');if(!/class="[^"]*(?:consent-sheet|endocrine-consent)/.test(html))continue;
 const route=path.posix.dirname(f).replace(/^patient\//,''),parts=route.split('/');
 const profile=parts.length===1?`data/patient-knowledge/${parts[0]}.json`:`data/patient-knowledge-contexts/${parts[0]}/${parts.slice(1).join('/')}.json`;
 if(!fs.existsSync(path.join(R,profile))){report.missing_profiles.push({route,profile});continue;}
 const data=JSON.parse(fs.readFileSync(path.join(R,profile))),next=core.transform(html,data,f);
 if(next!==html){report.changed.push(f);if(!check)fs.writeFileSync(path.join(R,f),next);}
 const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
 report.routes.push({route,profile,modules:core.classify(data),source_sha256:sha(next),agents:data.agents.map(a=>({id:a.id,name:a.name,modules:core.classifyAgent(a),risk_count:a.risks.length}))});
}}}
walk('patient');
if(report.missing_profiles.length)throw Error(JSON.stringify(report.missing_profiles));
if(check&&report.changed.length)throw Error('Consent core missing or stale: '+report.changed.join(', '));
if(!check)fs.writeFileSync(path.join(R,'validation/usability-consent-v08455/consent-inventory.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({routes:report.routes.length,changed:report.changed.length,check}));
