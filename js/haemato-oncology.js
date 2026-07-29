/** SACTCheck v0.50.3 — Haematology portal controller. */
(() => {
  "use strict";
  const STORAGE_KEY = "sactcheck.library-domain.v0500";
  const $ = id => document.getElementById(id);

  function updateCopy(domain) {
    const haem = domain === "haem";
    const heading = $("libraryHeading");
    const subheading = $("librarySubheading");
    const searchLabel = document.querySelector('label[for="regimenSearch"]');
    const search = $("regimenSearch");
    if (heading) heading.textContent = haem ? "Haematology SACT library" : "Solid Tumour SACT library";
    if (subheading) subheading.textContent = haem
      ? "Browse the plasma cell library and open a structured assessment linked to the official NCCP source."
      : "Find the current NCCP regimen, confirm the tissue specific indication and open a structured day ward assessment.";
    if (searchLabel) searchLabel.textContent = haem ? "Search the haematology library" : "Search the complete solid tumour library";
    if (search) search.placeholder = haem ? "Regimen, drug, NCCP number or myeloma indication" : "Regimen, drug, trade name, NCCP number or indication";
  }

  function configureTumourOptions(domain) {
    const tumour = $("tumourFilter");
    if (!tumour) return;
    [...tumour.options].forEach(option => {
      if (option.value !== "Haematology") return;
      const show = domain === "haem";
      option.hidden = !show;
      option.disabled = !show;
    });
  }

  function resetFiltersForDomain(domain) {
    const tumour = $("tumourFilter");
    const treatment = $("treatmentFilter");
    const search = $("regimenSearch");
    if (tumour) tumour.value = domain === "haem" ? "Haematology" : "all";
    if (treatment) treatment.value = "all";
    if (search) search.value = "";
  }

  function setDomain(next, { reset = true } = {}) {
    const domain = next === "haem" ? "haem" : "solid";
    document.body.dataset.libraryDomain = domain;
    if (domain !== "haem") document.body.dataset.haemRoute = "all";
    document.querySelectorAll("[data-library-domain-choice]").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.libraryDomainChoice === domain));
    });
    document.querySelectorAll("[data-haem-route-choice]").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.haemRouteChoice === (document.body.dataset.haemRoute || "all")));
    });
    updateCopy(domain);
    configureTumourOptions(domain);
    if (reset) resetFiltersForDomain(domain);
    try { localStorage.setItem(STORAGE_KEY, domain); } catch (_) {}
    window.filterRegimens?.();
    window.dispatchEvent(new CustomEvent("sactcheck:library-domain-changed", { detail: { domain } }));
  }

  function setRoute(route) {
    const allowed = new Set(["all", "oral_only", "mixed_oral_parenteral", "parenteral_only"]);
    document.body.dataset.haemRoute = allowed.has(route) ? route : "all";
    document.querySelectorAll("[data-haem-route-choice]").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.haemRouteChoice === document.body.dataset.haemRoute));
    });
    window.filterRegimens?.();
  }

  function initialise() {
    document.querySelectorAll("[data-library-domain-choice]").forEach(button => {
      button.addEventListener("click", () => setDomain(button.dataset.libraryDomainChoice));
    });
    document.querySelectorAll("[data-haem-route-choice]").forEach(button => {
      button.addEventListener("click", () => setRoute(button.dataset.haemRouteChoice));
    });
    let saved = "solid";
    try { saved = localStorage.getItem(STORAGE_KEY) === "haem" ? "haem" : "solid"; } catch (_) {}
    setDomain(saved, { reset: false });
  }

  window.addEventListener("sactcheck:protocols-loaded", () => window.filterRegimens?.());
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialise);
  else initialise();
  window.SACTCheckHaematoOncology = Object.freeze({ version: "0.50.3", setDomain, setRoute });
})();
