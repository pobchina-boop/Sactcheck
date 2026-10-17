'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),root=path.resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'data/breast-treatment-journeys-v0837.json')));
const runtime=fs.readFileSync(path.join(root,'tools/treatment-journey-runtime.cjs.txt'),'utf8').replace('/* DEFINITIONS */',JSON.stringify(data,null,2));
const file=path.join(root,'js/treatment-journey-v0837.js');
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(file,'utf8'),runtime,'Rebuild shared treatment journeys');else fs.writeFileSync(file,runtime);
console.log('Five shared breast journeys '+(process.argv.includes('--check')?'verified':'built'));

const navigation=JSON.parse(fs.readFileSync(path.join(root,'data/breast-library-contexts-v0837.json')));
const navRuntime=fs.readFileSync(path.join(root,'tools/breast-library-runtime.cjs.txt'),'utf8').replace('/* DEFINITIONS */',JSON.stringify(navigation.regimens,null,2));
const navFile=path.join(root,'js/breast-library-v0837.js');
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(navFile,'utf8'),navRuntime,'Rebuild breast library contexts');else fs.writeFileSync(navFile,navRuntime);
