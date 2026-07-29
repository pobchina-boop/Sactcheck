/** SACTCheck v0.48.0 library usability layer. */
(function (root) {
  "use strict";

  const FAVOURITES_KEY = "sactcheck:favourites:v1";
  const RECENTS_KEY = "sactcheck:recent-protocols:v1";
  const MAX_RECENTS = 5;

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
    decorateCards();
    renderQuickAccess();
    configureDeveloperTools();
  }

  root.SACTCheckLibraryUX = Object.freeze({ version: "0.48.0", refresh, openProtocol });
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
