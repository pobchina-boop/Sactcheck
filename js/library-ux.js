/** SACTCheck v0.69.1 library usability + sustainability navigation layer. */
(function (root) {
  "use strict";

  const FAVOURITES_KEY = "sactcheck:favourites:v1";
  const RECENTS_KEY = "sactcheck:recent-protocols:v1";
  const MAX_RECENTS = 5;
  const SUSTAINABILITY_RELEASE = "0.69.1";

  function read(key, fallback = []) {
    try {
      const value = JSON.parse(root.localStorage?.getItem(key) || "null");
      return Array.isArray(value) ? value : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function write(key, value) {
    try { root.localStorage?.setItem(key, JSON.stringify(value)); } catch (_) {}
  }

  function protocolId(card) {
    return card?.dataset?.jsonProtocolId || "";
  }

  function cardTitle(card) {
    return card?.querySelector("h2")?.textContent?.trim() || "Protocol";
  }

  function allCards() {
    return [...document.querySelectorAll("#regimenGrid .regimen-card[data-json-protocol-id]")];
  }

  function findCard(id) {
    return allCards().find(card => protocolId(card) === id) || null;
  }

  function openProtocol(id) {
    const card = findCard(id);
    const launch = card?.querySelector(".json-assessment-launch, .regimen-launch");
    if (!launch || launch.disabled) return;
    rememberRecent(card);
    launch.click();
  }

  function rememberRecent(card) {
    const id = protocolId(card);
    if (!id) return;
    const recent = read(RECENTS_KEY).filter(item => item?.id && item.id !== id);
    recent.unshift({ id, title: cardTitle(card), tumour: card.dataset.tumour || "", domain: card.dataset.libraryDomain || "solid" });
    write(RECENTS_KEY, recent.slice(0, MAX_RECENTS));
    renderQuickAccess();
  }

  function toggleFavourite(card) {
    const id = protocolId(card);
    if (!id) return;
    const favourites = read(FAVOURITES_KEY);
    const next = favourites.includes(id) ? favourites.filter(item => item !== id) : [...favourites, id];
    write(FAVOURITES_KEY, next);
    syncFavouriteButtons();
    renderQuickAccess();
  }

  function syncFavouriteButtons() {
    const favourites = new Set(read(FAVOURITES_KEY));
    allCards().forEach(card => {
      const button = card.querySelector(".card-favourite-button");
      if (!button) return;
      const active = favourites.has(protocolId(card));
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
      button.setAttribute("aria-label", `${active ? "Remove" : "Add"} ${cardTitle(card)} ${active ? "from" : "to"} favourites`);
      button.title = active ? "Remove from favourites" : "Add to favourites";
      button.textContent = active ? "★" : "☆";
    });
  }

  function sustainabilityUrl(card) {
    const params = new URLSearchParams();
    if (card) {
      const values = {
        regimen: cardTitle(card),
        protocol: protocolId(card),
        tumour: card.dataset.tumour || "",
        domain: card.dataset.libraryDomain || "solid",
        route: card.dataset.routeClassification || "",
        category: card.dataset.section || ""
      };
      Object.entries(values).forEach(([key, value]) => { if (value) params.set(key, value); });
    }
    const query = params.toString();
    return `sustainability.html${query ? `?${query}` : ""}`;
  }

  function ensureSustainabilityStyles() {
    if (document.getElementById("sactcheckSustainabilityNavStyles")) return;
    const style = document.createElement("style");
    style.id = "sactcheckSustainabilityNavStyles";
    style.textContent = `
      .sustainability-module-button{border-color:#8bb8ad!important;color:#175b50!important;background:#f2faf7!important}
      .sustainability-module-button:hover{background:#e5f4ef!important}
      .sustainability-card-button{border-color:#a9c9c1!important;color:#175b50!important;background:#f7fbfa!important}
      .sustainability-card-button:hover{background:#eaf6f2!important}
      .sustainability-card-button .sustainability-nav-icon{margin-right:5px}
      @media(max-width:700px){.sustainability-card-button{flex:1 1 100%!important}}
    `;
    document.head.appendChild(style);
  }

  function ensureSustainabilityModuleLaunch() {
    if (document.querySelector("[data-open-sustainability-module]")) return;
    const actions = document.querySelector("#studyHero .mission-hero-actions, #studyHero .study-hero-actions");
    if (!actions) return;
    const link = document.createElement("a");
    link.className = "btn secondary sustainability-module-button";
    link.href = sustainabilityUrl(null);
    link.dataset.openSustainabilityModule = "true";
    link.innerHTML = '<span aria-hidden="true">🌍</span><span>Sustainability</span>';
    link.setAttribute("aria-label", "Open SACTCheck sustainability module");
    actions.appendChild(link);
  }

  function decorateSustainabilityButtons() {
    allCards().forEach(card => {
      const actions = card.querySelector(".card-actions");
      if (!actions || actions.querySelector(".sustainability-card-button")) return;
      const link = document.createElement("a");
      link.className = "btn secondary sustainability-card-button";
      link.href = sustainabilityUrl(card);
      link.innerHTML = '<span class="sustainability-nav-icon" aria-hidden="true">🌍</span><span>Sustainability</span>';
      link.setAttribute("aria-label", `Open sustainability profile for ${cardTitle(card)}`);
      actions.appendChild(link);
    });
  }

  function applySustainabilityReleaseLabel() {
    document.title = "SACTCheck v0.69.0 — Sustainability Module";
    const releaseMeta = document.querySelector('meta[name="sactcheck-release"]');
    if (releaseMeta) releaseMeta.setAttribute("content", SUSTAINABILITY_RELEASE);
    document.querySelectorAll(".header-version").forEach(node => { node.textContent = `v${SUSTAINABILITY_RELEASE}`; });
    const releaseSummary = document.querySelector(".release-summary > summary");
    if (releaseSummary) releaseSummary.textContent = `v${SUSTAINABILITY_RELEASE} · What changed?`;
    const releaseBody = document.querySelector(".release-summary .details-body");
    if (releaseBody) {
      const strong = releaseBody.querySelector("strong");
      const paragraph = releaseBody.querySelector("p");
      if (strong) strong.textContent = "Sustainability module";
      if (paragraph) paragraph.textContent = "Adds an evidence-linked sustainability workspace covering clinical value, treatment delivery, travel, medicines waste, deprescribing and supportive care. It does not assign unsupported carbon scores or alter NCCP treatment criteria.";
    }
  }

  function decorateCards() {
    allCards().forEach(card => {
      if (!card.querySelector(".card-favourite-button")) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "card-favourite-button";
        button.addEventListener("click", event => {
          event.stopPropagation();
          toggleFavourite(card);
        });
        card.prepend(button);
      }
      if (card.dataset.recentTracking !== "true") {
        card.dataset.recentTracking = "true";
        card.querySelector(".json-assessment-launch, .regimen-launch")?.addEventListener("click", () => rememberRecent(card));
      }
    });
    syncFavouriteButtons();
    decorateSustainabilityButtons();
  }

  function quickButton(item, type) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `quick-protocol-chip ${type}`;
    button.innerHTML = `<span>${type === "favourite" ? "★" : "↻"}</span><strong></strong>`;
    button.querySelector("strong").textContent = item.title;
    button.title = item.title;
    button.addEventListener("click", () => openProtocol(item.id));
    return button;
  }

  function currentDomain() {
    return document.body?.dataset?.libraryDomain === "haem" ? "haem" : "solid";
  }

  function cardMatchesDomain(card, domain = currentDomain()) {
    return Boolean(card) && (card.dataset.libraryDomain === "haem" ? "haem" : "solid") === domain;
  }

  function renderQuickAccess() {
    const panel = document.getElementById("quickAccessPanel");
    if (!panel) return;
    const domain = currentDomain();
    const favourites = read(FAVOURITES_KEY).map(id => {
      const card = findCard(id);
      return cardMatchesDomain(card, domain) ? { id, title: cardTitle(card) } : null;
    }).filter(Boolean);
    const recents = read(RECENTS_KEY).filter(item => cardMatchesDomain(findCard(item.id), domain)).slice(0, MAX_RECENTS);
    panel.replaceChildren();

    const groups = [
      { title: "Favourites", items: favourites, type: "favourite", empty: "Use ☆ on a regimen card to pin it here." },
      { title: "Recent", items: recents, type: "recent", empty: "Recently opened protocols will appear here." }
    ];
    groups.forEach(group => {
      const section = document.createElement("div");
      section.className = "quick-access-group";
      const heading = document.createElement("span");
      heading.className = "quick-access-label";
      heading.textContent = group.title;
      section.appendChild(heading);
      if (group.items.length) group.items.forEach(item => section.appendChild(quickButton(item, group.type)));
      else {
        const empty = document.createElement("small");
        empty.textContent = group.empty;
        section.appendChild(empty);
      }
      panel.appendChild(section);
    });
  }

  function configureDeveloperTools() {
    const tools = document.getElementById("developerTools");
    if (!tools) return;
    tools.hidden = !new URLSearchParams(root.location?.search || "").has("debug");
  }

  function configurePrototypeNotice() {
    const notice = document.getElementById("prototypeNotice");
    const dismiss = document.getElementById("dismissPrototypeNotice");
    if (!notice || !dismiss) return;
    try {
      if (root.sessionStorage?.getItem("sactcheck:notice-acknowledged") === "yes") notice.classList.add("compact");
    } catch (_) {}
    dismiss.addEventListener("click", () => {
      notice.classList.toggle("compact", true);
      try { root.sessionStorage?.setItem("sactcheck:notice-acknowledged", "yes"); } catch (_) {}
    });
  }

  function configureSearchShortcuts() {
    const search = document.getElementById("regimenSearch");
    document.addEventListener("keydown", event => {
      if (event.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")) {
        event.preventDefault();
        search?.focus();
      }
    });
    document.getElementById("clearLibraryFilters")?.addEventListener("click", () => {
      if (search) search.value = "";
      ["tumourFilter", "treatmentFilter", "statusFilter"].forEach(id => {
        const select = document.getElementById(id);
        if (select) select.value = "all";
      });
      root.filterRegimens?.();
      root.SACTCheckTissueUI?.select?.("all");
      search?.focus();
    });
  }

  function refresh() {
    ensureSustainabilityStyles();
    ensureSustainabilityModuleLaunch();
    applySustainabilityReleaseLabel();
    decorateCards();
    renderQuickAccess();
    configureDeveloperTools();
  }

  root.SACTCheckLibraryUX = Object.freeze({ version: SUSTAINABILITY_RELEASE, refresh, openProtocol, sustainabilityUrl });
  root.addEventListener?.("sactcheck:protocols-loaded", refresh);
  root.addEventListener?.("sactcheck:library-domain-changed", renderQuickAccess);
  document.addEventListener("sactcheck:regimen-card-metadata-rendered", refresh);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      configurePrototypeNotice();
      configureSearchShortcuts();
      refresh();
    });
  } else {
    configurePrototypeNotice();
    configureSearchShortcuts();
    refresh();
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
