/* Explicit source-version compatibility; never infer a new version from a code. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.SACTCheckProtocolIds=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const migrations=Object.freeze({'nccp-00266-v4':'nccp-00266-v5','nccp-00264-v3b':'nccp-00264-v4','nccp-00249-v3':'nccp-00249-v4','nccp-00248-v4':'nccp-00248-v5','nccp-00247-v4':'nccp-00247-v5','nccp-00375-v6':'nccp-00375-v6a','nccp-00811-v2':'nccp-00811-v3','nccp-00817-v2':'nccp-00817-v3','nccp-00374-v4':'nccp-00374-v4a','nccp-00554-v2':'nccp-00554-v3','nccp-00897-v3':'nccp-00897-v4','nccp-00894-v1':'nccp-00894-v1a','nccp-00945-v1':'nccp-00945-v2','nccp-00282-v5':'nccp-00282-v6','nccp-00450-v4c':'nccp-00450-v5','nccp-00583-v3b':'nccp-00583-v4','nccp-00846-v3a':'nccp-00846-v3b','nccp-00518-v2':'nccp-00518-v3','nccp-00546-v3':'nccp-00546-v4','nccp-00574-v4':'nccp-00574-v5','nccp-00589-v4':'nccp-00589-v5','nccp-00591-v3':'nccp-00591-v4','nccp-00455-v15b':'nccp-00455-v16','nccp-00558-v12b':'nccp-00558-v13','nccp-00207-v5':'nccp-00207-v6','nccp-00419-v4':'nccp-00419-v6'});
  const normaliseCode=value=>/^\d{1,5}$/.test(String(value||''))?String(value).padStart(5,'0'):'';
  const codeInId=id=>/^nccp-(\d{5})-v[\w.]+$/.exec(String(id||''))?.[1]||'';
  const canonicalId=id=>migrations[String(id)]||String(id||'');
  function valid(reference){const id=typeof reference==='string'?reference:reference?.protocol_id;const code=normaliseCode(reference?.metadata?.nccp_regimen_code||reference?.nccp_regimen_code);return id&&(!code||code===codeInId(id))?String(id):'';}
  function matches(a,b){const x=valid(a),y=valid(b);return Boolean(x&&y&&codeInId(x)&&codeInId(x)===codeInId(y)&&canonicalId(x)===canonicalId(y));}
  function resolve(reference,loaded){const id=valid(reference);if(!id)return null;const candidates=Array.from(loaded||[]).map(x=>x.protocol||x).filter(x=>valid(x)&&x.protocol_id===canonicalId(id));return candidates.length===1&&matches(reference,candidates[0])?candidates[0]:null;}
  function compatibleKeys(reference){const id=valid(reference);if(!id)return [];const current=canonicalId(id);return [current,...Object.keys(migrations).filter(x=>migrations[x]===current)];}
  return Object.freeze({migrations,canonicalId,normaliseCode,codeInId,matches,resolve,compatibleKeys});
});
