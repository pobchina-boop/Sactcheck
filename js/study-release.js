/** SACTCheck study presentation + v0.75.0 interface bootstrap. */
(function (root) {
  "use strict";
  const VERSION = "0.48.4";
  const HIDE_KEY = "sactcheck:hide-study-welcome:v1";
  let lastFocused = null;

  function modal() { return document.getElementById("studyWelcomeModal"); }
  function focusable(panel) {
    return [...panel.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')]
      .filter(item => !item.disabled && item.offsetParent !== null);
  }
  function openWelcome() {
    const box = modal();
    if (!box) return;
    lastFocused = document.activeElement;
    box.hidden = false;
    document.body.classList.add("study-modal-open");
    box.querySelector(".study-modal-close")?.focus();
  }
  function closeWelcome() {
    const box = modal();
    if (!box) return;
    const neverAgain = document.getElementById("studyWelcomeNeverAgain")?.checked;
    if (neverAgain) {
      try { root.localStorage?.setItem(HIDE_KEY, "yes"); } catch (_) {}
    }
    box.hidden = true;
    document.body.classList.remove("study-modal-open");
    lastFocused?.focus?.();
  }
  function focusSearch() {
    closeWelcome();
    root.location.hash = "#libraryScreen";
    const search = document.getElementById("regimenSearch");
    search?.scrollIntoView({ behavior: "smooth", block: "center" });
    root.setTimeout(() => search?.focus(), 160);
  }
  function shouldAutoOpen() {
    try { return root.localStorage?.getItem(HIDE_KEY) !== "yes"; } catch (_) { return true; }
  }
  function bind() {
    const mobileNote = document.getElementById("mobileOpenNote");
    if (mobileNote) mobileNote.hidden = /^(https?:)$/.test(root.location?.protocol || "");
    document.querySelectorAll("[data-open-study-info]").forEach(button => button.addEventListener("click", openWelcome));
    document.querySelectorAll("[data-close-study-info]").forEach(button => button.addEventListener("click", closeWelcome));
    document.querySelectorAll("[data-focus-regimen-search]").forEach(button => button.addEventListener("click", focusSearch));
    const box = modal();
    box?.addEventListener("click", event => {
      if (event.target?.classList?.contains("study-modal-backdrop")) closeWelcome();
    });
    document.addEventListener("keydown", event => {
      if (box?.hidden !== false) return;
      if (event.key === "Escape") { event.preventDefault(); closeWelcome(); return; }
      if (event.key !== "Tab") return;
      const panel = box.querySelector(".study-modal-panel");
      const items = panel ? focusable(panel) : [];
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    if (shouldAutoOpen()) root.setTimeout(openWelcome, 280);
  }

  root.SACTCheckStudyRelease = Object.freeze({ version: VERSION, openWelcome, closeWelcome, focusSearch });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();
})(typeof globalThis !== "undefined" ? globalThis : this);

/* v0.75.0
   Patient-facing A4 treatment guide + supportive-care reconciliation.
   Loads the v0.75 patient content, interface and workflow layers together so
   local supportive-medicine completeness and drug-content isolation remain aligned. */
(function(root){
  "use strict";
  const RELEASE="0.75.0";

  function loadCss(){
    root.document.querySelectorAll('link[data-sactcheck-interface-v0740],link[data-sactcheck-interface-v0750]').forEach(x=>x.remove());
    const link=root.document.createElement("link");
    link.rel="stylesheet";
    link.href=`css/sactcheck-interface-v0750.css?v=${RELEASE}`;
    link.dataset.sactcheckInterfaceV0750="true";
    root.document.head.appendChild(link);
  }

  function resetGlobal(name,expected){
    const api=root[name];
    if(api?.release===expected) return;
    try{ delete root[name]; }catch(_){ root[name]=undefined; }
  }

  function loadScript(src,attr,value){
    return new Promise((resolve,reject)=>{
      root.document.querySelectorAll(`script[${attr}]`).forEach(x=>x.remove());
      const script=root.document.createElement("script");
      script.src=src;
      script.defer=true;
      script.async=false;
      script.setAttribute(attr,value||"true");
      script.addEventListener("load",()=>resolve(script),{once:true});
      script.addEventListener("error",()=>reject(new Error(`Could not load ${src}`)),{once:true});
      root.document.head.appendChild(script);
    });
  }

  async function boot(){
    loadCss();
    resetGlobal("SACTCheckPatientContent",RELEASE);
    resetGlobal("SACTCheckRegimenConsentBuilder",RELEASE);
    resetGlobal("SACTCheckRegimenWorkflow",RELEASE);
    resetGlobal("SACTCheckSupportiveCarePdf",RELEASE);
    resetGlobal("SACTCheckInterface",RELEASE);

    await Promise.all([
      loadScript(`js/patient-support-v0750.js?v=${RELEASE}`,"data-patient-support-v0750",RELEASE),
      loadScript(`js/regimen-workflow-engine-v0750.js?v=${RELEASE}`,"data-regimen-workflow-engine-v0750",RELEASE)
    ]);

    await loadScript(
      `js/sactcheck-interface-v0750.js?v=${RELEASE}`,
      "data-sactcheck-interface-v0750",
      RELEASE
    );
  }

  if(root.document.readyState==="loading"){
    root.document.addEventListener("DOMContentLoaded",()=>boot().catch(console.error),{once:true});
  }else{
    boot().catch(console.error);
  }
})(typeof globalThis!=="undefined"?globalThis:this);
