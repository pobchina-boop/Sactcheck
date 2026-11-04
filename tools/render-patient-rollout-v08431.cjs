const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..');
const scope=require('../validation/patient-rollout-v08431/scope.json');
for(const code of scope.codes){
 const d=JSON.parse(fs.readFileSync(path.join(root,'data/patient-knowledge',code+'.json')));
 const rendered=require('./patient-pack-v08431.cjs').render(d);
 for(const [name,key] of [['index','portal'],['guide','print'],['sactcard','card']]){
  fs.writeFileSync(path.join(root,'patient',code,name+'.html'),rendered[key]);
 }
}
