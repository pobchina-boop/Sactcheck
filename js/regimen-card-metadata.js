/**
 * SACTCheck regimen-card metadata renderer.
 *
 * Loads the published protocol catalogue, derives structured treatment intent,
 * course duration and cycle interval, and adds a compact metadata strip to each
 * matching regimen card. Missing or ambiguous fields are omitted rather than
 * guessed.
 */
(function (root) {
  "use strict";

  const Metadata = root.SACTCheckRegimenCourseMetadata;
  if (!Metadata) {
    console.error("SACTCheckRegimenCourseMetadata must load before regimen-card-metadata.js.");
    return;
  }

  const VERSION = "1.0.0";
  const DEFAULT_INDEX_URL = "protocols/index.json";
  const DEFAULT_SIDECAR_URL = "data/regimen-card-metadata.json";
  const state = {
    index: null,
    protocols: new Map(),
    loading: null,
    renderQueued: false,
    observer: null
  };

  function config() {
    return {
      indexUrl: DEFAULT_INDEX_URL,
      sidecarUrl: DEFAULT_SIDECAR_URL,
      cardSelector: "#regimenGrid .regimen-card",
      ...root.SACTCheckRegimenCardMetadataConfig
    };
  }

  function codeFromProtocol(protocol) {
    return Metadata.cleanText(protocol?.metadata?.nccp_regimen_code || protocol?.nccp_regimen_code);
  }

  function normalisePath(path) {
    const value = Metadata.cleanText(path);
    if (!value) return null;
    return value.replace(/^\.\//, "");
  }

  async function fetchJson(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load ${url} (${response.status}).`);
    return response.json();
  }

  async function loadLibrary() {
    if (state.loading) return state.loading;
    state.loading = (async () => {
      const settings = config();

      // Preferred path: one compact, build-generated sidecar avoids refetching
      // every protocol JSON already used by the catalogue loader.
      if (settings.sidecarUrl) {
        try {
          const sidecar = await fetchJson(settings.sidecarUrl);
          if (sidecar?.schema_version === Metadata.version && Array.isArray(sidecar.protocols)) {
            state.index = sidecar;
            sidecar.protocols.forEach(item => {
              const protocol = {
                protocol_id: item.id,
                metadata: {
                  nccp_regimen_code: item.nccp_code,
                  regimen_card: item.regimen_card
                }
              };
              state.protocols.set(item.id || item.path, { entry: item, protocol, path: item.path });
            });
            return state.protocols;
          }
        } catch (error) {
          // Compatibility fallback for repositories where the sidecar has not
          // yet been generated. The full protocol catalogue remains usable.
          console.info("SACTCheck regimen metadata sidecar unavailable; loading protocol JSON files.");
        }
      }

      const index = await fetchJson(settings.indexUrl);
      state.index = index;
      const entries = Metadata.asArray(index?.protocols).filter(entry => entry?.enabled !== false && entry?.path);
      const results = await Promise.allSettled(entries.map(async entry => {
        const path = normalisePath(entry.path);
        const protocol = await fetchJson(path);
        state.protocols.set(protocol.protocol_id || entry.id || path, { entry, protocol, path });
      }));

      const failures = results.filter(result => result.status === "rejected");
      if (failures.length) {
        console.warn(`SACTCheck regimen metadata: ${failures.length} protocol file(s) could not be loaded.`, failures);
      }
      return state.protocols;
    })().catch(error => {
      state.loading = null;
      throw error;
    });
    return state.loading;
  }

  function cardByLegacyId(entry) {
    if (!entry?.legacy_card_id) return null;
    const launch = document.getElementById(entry.legacy_card_id);
    return launch?.closest?.(".regimen-card") || null;
  }

  function findCard(entry, protocol) {
    const id = Metadata.cleanText(protocol?.protocol_id || entry?.id);
    if (id) {
      const direct = [...document.querySelectorAll("[data-protocol-id], [data-json-protocol-id]")]
        .find(element => element.dataset.protocolId === id || element.dataset.jsonProtocolId === id);
      if (direct) return direct.closest?.(".regimen-card") || direct;
    }

    const legacy = cardByLegacyId(entry);
    if (legacy) return legacy;

    const code = codeFromProtocol(protocol);
    if (!code) return null;
    const cards = [...document.querySelectorAll(config().cardSelector)];
    return cards.find(card => {
      const dataset = String(card.dataset?.name || "");
      const text = String(card.textContent || "");
      return dataset.split(/\s+/).includes(code) || new RegExp(`\\bNCCP\\s+${code}\\b`, "i").test(text);
    }) || null;
  }

  function contextTooltip(summary) {
    const lines = summary.contexts.map(context => {
      const pieces = [
        context.intent_label,
        context.duration?.label,
        Metadata.formatInterval(context.cycle_length_days)
      ].filter(Boolean);
      return pieces.length ? pieces.join(" · ") : null;
    }).filter(Boolean);
    return [...new Set(lines)].join("\n");
  }

  function chip(label, type) {
    const element = document.createElement("span");
    element.className = `regimen-course-chip ${type}`;
    element.dataset.courseField = type;
    element.textContent = label;
    return element;
  }

  function renderCard(card, protocol) {
    if (!card || !protocol) return false;
    const summary = Metadata.summarise(protocol);
    const existing = card.querySelector(':scope > [data-sactcheck-course-meta="true"]');

    if (!summary.tokens.length) {
      existing?.remove();
      return false;
    }

    const row = existing || document.createElement("div");
    row.className = "regimen-course-row";
    row.dataset.sactcheckCourseMeta = "true";
    row.dataset.metadataComplete = String(summary.complete);
    row.setAttribute("aria-label", "Treatment course: " + summary.tokens.join(", "));
    const tooltip = contextTooltip(summary);
    if (tooltip) row.title = tooltip;
    row.replaceChildren();

    if (summary.intent) row.appendChild(chip(summary.intent, "intent"));
    if (summary.duration) row.appendChild(chip(summary.duration, "duration"));
    if (summary.interval) row.appendChild(chip(summary.interval, "interval"));

    if (!existing) {
      const anchor = card.querySelector(":scope > .validation-row, :scope > .card-actions");
      if (anchor) card.insertBefore(row, anchor);
      else card.appendChild(row);
    }

    const searchable = summary.tokens.join(" ").toLowerCase();
    if (searchable && !String(card.dataset.name || "").toLowerCase().includes(searchable)) {
      card.dataset.name = `${card.dataset.name || ""} ${searchable}`.trim();
    }
    card.dataset.courseMetadata = summary.complete ? "complete" : "partial";
    return true;
  }

  function renderAll() {
    let rendered = 0;
    state.protocols.forEach(({ entry, protocol }) => {
      const card = findCard(entry, protocol);
      if (renderCard(card, protocol)) rendered += 1;
    });
    document.dispatchEvent(new CustomEvent("sactcheck:regimen-card-metadata-rendered", {
      detail: { rendered, available: state.protocols.size, version: VERSION }
    }));
    return rendered;
  }

  function queueRender() {
    if (state.renderQueued) return;
    state.renderQueued = true;
    queueMicrotask(() => {
      state.renderQueued = false;
      renderAll();
    });
  }

  function observeCards() {
    if (state.observer || !document.body) return;
    state.observer = new MutationObserver(mutations => {
      const relevant = mutations.some(mutation => [...mutation.addedNodes].some(node =>
        node.nodeType === 1 && (node.matches?.(".regimen-card") || node.querySelector?.(".regimen-card"))
      ));
      if (relevant) queueRender();
    });
    state.observer.observe(document.body, { childList: true, subtree: true });
  }

  async function initialise() {
    observeCards();
    try {
      await loadLibrary();
      renderAll();
    } catch (error) {
      console.error("SACTCheck regimen-card metadata failed to initialise.", error);
    }
  }

  root.SACTCheckRegimenCardMetadata = Object.freeze({
    version: VERSION,
    initialise,
    loadLibrary,
    renderAll,
    renderCard,
    summarise: Metadata.summarise
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialise, { once: true });
  else initialise();
})(typeof globalThis !== "undefined" ? globalThis : this);
