const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');const maps=require('../assets/patient/regimen-visuals-v0802.js');
const support=require('../js/patient-support-v0750.js');
for(const code of ['00209','00568','00857','00722','00382','00619','00831']){
 const protocol={metadata:{nccp_regimen_code:code}};
 assert(support.scheduleRows(protocol).length>0,code+' schedule absent');
 assert.equal(support.regimenLink(protocol),'https://sactcheck.com/docs/patient/'+code+'/');
 const html=maps.render(code);assert(html.includes('anatomy-hcc-v0762.png'));assert(!html.includes('undefined'));
 assert.equal((html.match(/data-hcc-target=/g)||[]).length,maps.profiles[code].cards.length);
 for(const file of ['index.html','guide.html','guide.pdf','passport.pdf'])assert(fs.statSync(path.join(root,'docs/patient',code,file)).size>1000);
 for(const file of ['guide.pdf','passport.pdf'])assert(fs.readFileSync(path.join(root,'docs/patient',code,file)).subarray(0,5).equals(Buffer.from('%PDF-')));
}
assert.equal(maps.render('unknown'),'');console.log('Seven patient pipelines: routing, schedule fallback, shared anatomy and export artifacts passed.');
