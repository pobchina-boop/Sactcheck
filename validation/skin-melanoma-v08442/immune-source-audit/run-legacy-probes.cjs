'use strict';
// Read-only checkout replay. Redirect only proposal JSON reads and report writes.
const fs=require('node:fs'),path=require('node:path');
const R=process.env.SACT_TEST_ROOT||'/workspace/scratch/bca730129437/Sactcheck';
const M=JSON.parse(fs.readFileSync(path.join(__dirname,'candidate-manifest.json'))),read=fs.readFileSync,write=fs.writeFileSync;
const mode=process.argv[2]||'v40',file=mode==='v40'?'validation/skin-melanoma-v08440/retrospective-source-audit/source-cases.cjs':'validation/colorectal-v08435/nivo-fruq-source-audit/source-cases.cjs';
fs.mkdirSync(path.join(__dirname,'legacy-results'),{recursive:true});
fs.readFileSync=function(p,...args){const key=typeof p==='string'?path.resolve(p):'';for(const x of Object.values(M))if(key===path.join(R,x.path))return read(x.candidate_path,...args);return read(p,...args);};
fs.writeFileSync=function(p,...args){if(typeof p==='string'&&path.resolve(p).startsWith(R+'/'))return write(path.join(__dirname,'legacy-results',mode+'-'+path.basename(p)),...args);return write(p,...args);};
if(mode==='v35-corrected'){const change=JSON.parse(read(path.join(__dirname,'v35-correction.json'))),filename=path.join(R,file),code=read(filename,'utf8');if(code.split(change.old).length!==2)throw Error('Expected exactly one historical assertion');const Module=require('node:module'),m=new Module(filename,module);m.filename=filename;m.paths=module.paths;m._compile(code.replace(change.old,change.new),filename);}else require(path.join(R,file));
