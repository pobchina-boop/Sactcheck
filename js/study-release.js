/** SACTCheck study presentation + v0.74.0 interface bootstrap. */
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

/* v0.74.0
   One coordinated bootstrap replaces the accumulated patient/consent loaders.
   The clinical workflow remains v0.72 internally; patient support and the
   interface shell are v0.74.0.  No treatment-rule files are changed. */
(function(root){
  "use strict";
  const RELEASE="0.74.0";

  function loadCss(){
    if(root.document.querySelector('link[data-sactcheck-interface-v0740]')) return;
    const link=root.document.createElement("link");
    link.rel="stylesheet";
    link.href=`css/sactcheck-interface-v0740.css?v=${RELEASE}`;
    link.dataset.sactcheckInterfaceV0740="true";
    root.document.head.appendChild(link);
  }

  function loadScript(src,attr,value){
    return new Promise((resolve,reject)=>{
      const selector=`script[${attr}]`;
      const old=root.document.querySelector(selector);
      old?.remove?.();
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

    // Evict the retired v0.71/v0.73 consent runtime if it survived in an open tab.
    if(root.SACTCheckRegimenConsentBuilder?.release && root.SACTCheckRegimenConsentBuilder.release!==RELEASE){
      try{ delete root.SACTCheckRegimenConsentBuilder; }catch(_){ root.SACTCheckRegimenConsentBuilder=undefined; }
      try{ delete root.SACTCheckPatientContent; }catch(_){ root.SACTCheckPatientContent=undefined; }
    }

    const patient = loadScript(
      `js/patient-support-v0740.js?v=${RELEASE}`,
      "data-patient-support-v0740",
      RELEASE
    );

    const workflow = root.SACTCheckRegimenWorkflow?.release==="0.72.0"
      ? Promise.resolve()
      : loadScript(
          `js/regimen-workflow-engine-v0720.js?v=0.72.0&shell=${RELEASE}`,
          "data-regimen-workflow-engine",
          "0.72.0"
        );

    await Promise.all([patient,workflow]);

    await loadScript(
      `js/sactcheck-interface-v0740.js?v=${RELEASE}`,
      "data-sactcheck-interface-v0740",
      RELEASE
    );
  }

  if(root.document.readyState==="loading"){
    root.document.addEventListener("DOMContentLoaded",()=>boot().catch(console.error),{once:true});
  }else{
    boot().catch(console.error);
  }
})(typeof globalThis!=="undefined"?globalThis:this);
