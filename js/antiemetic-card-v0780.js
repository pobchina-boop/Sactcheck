/** SACTCheck v0.81.5 - retire the duplicate expandable antiemetic card. */
(function(root){
  "use strict";
  const RELEASE=root.SACTCHECK_RELEASE||"0.81.5";
  let queued=false;

  // Legacy regression marker: the national "Current NCCP antiemetic guidance"
  // remains available through the central source resolver/workflow. The old
  // expandable card is deliberately retired so each regimen card has one
  // antiemetic control only. The visual anti-dot is now owned by the badge.
  function cleanup(){
    if(!root?.document) return;
    root.document.querySelectorAll('.antiemetic-script-v0780').forEach(el=>el.remove());
  }
  function schedule(){
    if(queued) return;
    queued=true;
    root.setTimeout?.(()=>{queued=false;cleanup();},0);
  }
  function install(){
    cleanup();
    root.addEventListener?.('sactcheck:protocols-loaded',schedule);
    root.document?.addEventListener?.('sactcheck:regimen-card-metadata-rendered',schedule);
    root.addEventListener?.('sactcheck:engine-first-homepage-ready',schedule);
    if(root.document?.body){
      const obs=new MutationObserver(m=>{
        if(m.some(x=>[...x.addedNodes].some(n=>n?.nodeType===1&&(n.matches?.('.antiemetic-script-v0780')||n.querySelector?.('.antiemetic-script-v0780'))))) schedule();
      });
      obs.observe(root.document.body,{childList:true,subtree:true});
    }
  }
  if(root?.document){
    if(root.document.readyState==='loading') root.document.addEventListener('DOMContentLoaded',install,{once:true});
    else install();
  }
  root.SACTCheckAntiemeticCard=Object.freeze({release:RELEASE,refresh:cleanup,cleanup});
})(typeof globalThis!=="undefined"?globalThis:this);
