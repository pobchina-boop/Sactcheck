'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
async function serve(directory){const root=path.resolve(directory);const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.pdf':'application/pdf','.png':'image/png','.svg':'image/svg+xml'};
 const server=http.createServer((req,res)=>{let p;try{p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!p.startsWith(root+path.sep)&&p!==root)throw Error();if(fs.statSync(p).isDirectory())p=path.join(p,'index.html');const data=fs.readFileSync(p);res.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');res.end(data);}catch{res.statusCode=404;res.end('Not found');}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return {url:`http://127.0.0.1:${server.address().port}`,close:()=>new Promise(resolve=>server.close(resolve))};}
module.exports={serve};
