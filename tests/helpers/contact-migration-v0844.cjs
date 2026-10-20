const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..');
const edits=['contact-text-changes.json','contact-pdf-changes.json'].flatMap(n=>JSON.parse(fs.readFileSync(path.join(root,'validation/interface-v0844',n),'utf8')));
exports.expectedHash=(file,original)=>{const edit=edits.find(e=>e.path===file&&e.before===original);return edit?edit.after:original;};
