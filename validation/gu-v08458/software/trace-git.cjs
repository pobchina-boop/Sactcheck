const cp=require('node:child_process'),fs=require('node:fs');
const original=cp.execFileSync;
cp.execFileSync=function(command,args,options){const start=Date.now();if(command==='git')fs.writeSync(2,JSON.stringify({event:'git-start',args})+'\n');try {return original.call(this,command,args,{...options,timeout:30000});}finally{if(command==='git')fs.writeSync(2,JSON.stringify({event:'git-end',ms:Date.now()-start,args})+'\n');}};
