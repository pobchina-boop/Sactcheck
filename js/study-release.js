/** SACTCheck v0.48.0 feasibility-study presentation layer. */
(function (root) {
  "use strict";
  const VERSION = "0.48.0";
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
    root.setTimeout(() => search?.focus(), 250);
  }
  function shouldAutoOpen() {
    try { return root.localStorage?.getItem(HIDE_KEY) !== "yes"; } catch (_) { return true; }
  }
  function bind() {
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
