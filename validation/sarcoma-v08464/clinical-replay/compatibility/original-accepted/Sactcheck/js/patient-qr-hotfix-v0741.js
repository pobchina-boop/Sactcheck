/**
 * SACTCheck v0.74.1 - patient QR/link routing hotfix.
 *
 * Why:
 * v0.74.0 generated the regimen QR from window.location.href. When SACTCheck
 * was demonstrated from a local file or localhost, the QR therefore encoded a
 * file:// or local-machine URL that a patient's phone could not open.
 *
 * Rule:
 * patient-facing QR codes always encode the canonical public SACTCheck URL and
 * a regimen identifier only. No patient information is included.
 */
(function(root,factory){
  const api=factory(root||{});
  if(typeof module==="object"&&module.exports) module.exports=api;
  if(root?.document){
    root.SACTCheckPatientQrHotfix=api;
    if(root.document.readyState==="loading") root.document.addEventListener("DOMContentLoaded",api.install,{once:true});
    else api.install();
  }
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const RELEASE="0.74.1";
  const PUBLIC_BASE="https://sactcheck.com/";

  const text=v=>String(v??"").trim();

  function canonicalRegimenLink(protocolOrId){
    const id=encodeURIComponent(
      typeof protocolOrId==="string"
        ? text(protocolOrId)
        : text(protocolOrId?.protocol_id)
    );
    const base=new URL(PUBLIC_BASE);
    if(id) base.searchParams.set("patientSupport",decodeURIComponent(id));
    return base.href;
  }

  function canonicalQrUrl(protocolOrId){
    const link=canonicalRegimenLink(protocolOrId);
    return `https://api.qrserver.com/v1/create-qr-code/?size=210x210&margin=8&data=${encodeURIComponent(link)}`;
  }

  function patientLinkFromQrSrc(src){
    try{
      const u=new URL(src);
      const data=u.searchParams.get("data");
      return data?decodeURIComponent(data):"";
    }catch(_){ return ""; }
  }

  function makeQrClickable(img,protocol){
    if(!img) return;
    const link=canonicalRegimenLink(protocol);
    img.src=canonicalQrUrl(protocol);
    img.title="Open this regimen's patient-facing SACTCheck page";
    img.dataset.canonicalPatientQr="true";

    let anchor=img.closest("a[data-patient-regimen-qr-link]");
    if(!anchor){
      anchor=root.document.createElement("a");
      anchor.href=link;
      anchor.target="_blank";
      anchor.rel="noopener noreferrer";
      anchor.dataset.patientRegimenQrLink="true";
      anchor.setAttribute("aria-label","Open regimen-specific patient information");
      img.replaceWith(anchor);
      anchor.appendChild(img);
    }else{
      anchor.href=link;
    }
  }

  function patchVisiblePatientSupport(protocol){
    const shell=root.document.getElementById("patientSupportShell");
    if(!shell||shell.hidden) return;

    shell.querySelectorAll('img[alt="Regimen QR"]').forEach(img=>makeQrClickable(img,protocol));

    const copy=shell.querySelector("[data-copy-regimen-link]");
    if(copy&&!copy.dataset.canonicalQrOwned){
      const clone=copy.cloneNode(true);
      copy.replaceWith(clone);
      clone.dataset.canonicalQrOwned="true";
      clone.addEventListener("click",async()=>{
        const link=canonicalRegimenLink(protocol);
        try{
          await root.navigator?.clipboard?.writeText?.(link);
          root.showToast?.("Public regimen link copied");
        }catch(_){
          root.prompt?.("Copy this public regimen link:",link);
        }
      });
    }

    const card=shell.querySelector(".patient-print-card");
    if(card&&!card.querySelector(".patient-public-link-note")){
      const note=root.document.createElement("p");
      note.className="patient-public-link-note";
      note.innerHTML='<strong>QR destination:</strong> public regimen page on sactcheck.com · no patient details encoded.';
      card.querySelector("div")?.appendChild(note);
    }
  }

  function patchPrintableWindow(viewer,protocol){
    if(!viewer||viewer.closed) return viewer;
    try{
      const doc=viewer.document;
      const link=canonicalRegimenLink(protocol);
      const qr=canonicalQrUrl(protocol);

      doc.querySelectorAll(".url").forEach(el=>{ el.textContent=link; });
      doc.querySelectorAll('img[alt="Regimen QR"]').forEach(img=>{
        img.src=qr;
        img.title="Open regimen-specific patient information";
        if(!img.closest("a")){
          const a=doc.createElement("a");
          a.href=link;
          a.target="_blank";
          a.rel="noopener noreferrer";
          img.replaceWith(a);
          a.appendChild(img);
        }
      });

      const qrBox=doc.querySelector(".qr");
      if(qrBox&&!qrBox.querySelector(".canonical-note")){
        const note=doc.createElement("div");
        note.className="canonical-note";
        note.style.cssText="grid-column:1/-1;font-size:8px;color:#58717c;margin-top:4px";
        note.textContent="QR opens the public SACTCheck page for this regimen only. It contains no patient identifier or symptom data.";
        qrBox.appendChild(note);
      }
    }catch(_){}
    return viewer;
  }

  function wrapPatientApi(){
    const original=root.SACTCheckPatientContent;
    if(!original||original.__qrHotfix0741) return original;

    const wrapped=Object.create(original);

    wrapped.regimenLink=canonicalRegimenLink;
    wrapped.qrUrl=canonicalQrUrl;

    wrapped.open=async function(protocol,options={}){
      const result=await original.open(protocol,options);
      patchVisiblePatientSupport(protocol);
      root.setTimeout?.(()=>patchVisiblePatientSupport(protocol),0);
      return result;
    };
    wrapped.openPatientSupport=wrapped.open;

    wrapped.openPrintablePassport=function(protocol,riskContent){
      const viewer=original.openPrintablePassport(protocol,riskContent);
      patchPrintableWindow(viewer,protocol);
      root.setTimeout?.(()=>patchPrintableWindow(viewer,protocol),0);
      return viewer;
    };

    wrapped.generateConsentPdf=async function(protocol){
      return wrapped.open(protocol,{tab:"overview"});
    };

    Object.defineProperty(wrapped,"release",{value:RELEASE,enumerable:true});
    Object.defineProperty(wrapped,"version",{value:RELEASE,enumerable:true});
    Object.defineProperty(wrapped,"__qrHotfix0741",{value:true,enumerable:false});

    root.SACTCheckPatientContent=wrapped;
    root.SACTCheckRegimenConsentBuilder=wrapped;
    return wrapped;
  }

  function reassertVersion(){
    const header=root.document?.querySelector?.(".header-version");
    if(header) header.textContent=`v${RELEASE}`;
    const meta=root.document?.querySelector?.('meta[name="sactcheck-release"]');
    if(meta) meta.setAttribute("content",RELEASE);
    if(root.document) root.document.documentElement.dataset.sactcheckQrRelease=RELEASE;
  }

  function install(){
    wrapPatientApi();
    reassertVersion();

    const rerun=()=>{
      wrapPatientApi();
      reassertVersion();
    };
    root.addEventListener?.("sactcheck:protocols-loaded",()=>root.setTimeout?.(rerun,0));
    root.document?.addEventListener?.("sactcheck:regimen-card-metadata-rendered",()=>root.setTimeout?.(rerun,0));

    // If a patient-support panel is already open when this hotfix loads, patch
    // its QR using the regimen id already encoded in the old QR where possible.
    const shell=root.document?.getElementById?.("patientSupportShell");
    const oldImg=shell?.querySelector?.('img[alt="Regimen QR"]');
    if(oldImg){
      const prior=patientLinkFromQrSrc(oldImg.src);
      try{
        const id=new URL(prior).searchParams.get("patientSupport");
        if(id) patchVisiblePatientSupport({protocol_id:id});
      }catch(_){}
    }
  }

  return Object.freeze({
    release:RELEASE,
    publicBase:PUBLIC_BASE,
    canonicalRegimenLink,
    canonicalQrUrl,
    patientLinkFromQrSrc,
    install
  });
});
