'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{parseTree}=require('../tools/check-historical-git.cjs');
const entry=(size,name='old.pdf')=>'100644 blob '+'a'.repeat(40)+' '+size+'\t'+name+'\0';
test('missing historical blobs are distinguished from valid sizes',()=>{
 assert.deepEqual(parseTree(Buffer.from(entry('123'))),{entries:1,missing:0});
 assert.deepEqual(parseTree(Buffer.from(entry('123')+entry('BAD','missing.pdf'))),{entries:2,missing:1});
});
test('unrecognised or empty output cannot report availability',()=>{
 assert.throws(()=>parseTree(Buffer.alloc(0)));assert.throws(()=>parseTree(Buffer.from('unexpected\0')));
});
