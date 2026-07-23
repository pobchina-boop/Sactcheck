/** SACTCheck tumour-site visual navigation and card theming. */
(function (root) {
  "use strict";

  const ICONS = {
    all: '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="20" cy="20" r="9"/><circle cx="44" cy="20" r="9"/><circle cx="20" cy="44" r="9"/><circle cx="44" cy="44" r="9"/></svg>',
    gi: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M27 8v10c0 5 4 8 9 8h3c7 0 12 5 12 12v4c0 8-6 14-14 14H22C13 56 8 50 8 42V31c0-6 4-10 10-10h5"/><path d="M17 31h26M17 39h26M20 47h20M25 31v16M35 31v16M43 31v11"/></svg>',
    lung: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M29 9v20c-4-7-9-13-13-12-5 2-8 12-8 22 0 10 5 16 13 16 6 0 8-6 8-13V29"/><path d="M35 9v20c4-7 9-13 13-12 5 2 8 12 8 22 0 10-5 16-13 16-6 0-8-6-8-13V29"/><path d="M32 9v27M32 22l-8 7M32 22l8 7"/></svg>',
    breast: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 8c-8 0-14 5-14 12 0 9 11 16 26 36"/><path d="M32 8c8 0 14 5 14 12 0 12-19 24-28 36"/><path d="M22 25l20 31M42 25L22 56"/></svg>',
    gynae: '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="24" r="15"/><path d="M32 39v18M23 48h18"/></svg>',
    gu: '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="25" cy="38" r="15"/><path d="M36 27L54 9M41 9h13v13"/></svg>',
    neuro: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M30 10c-7-5-16 0-15 8-8 1-10 12-4 16-4 8 3 17 11 15 2 7 12 8 16 2 8 3 15-5 12-12 7-5 4-16-4-17 1-9-9-15-16-12z"/><path d="M31 12v40M20 20c7 1 7 8 2 11 7 1 8 8 4 13M43 18c-7 2-7 9-2 12-7 2-7 9-3 13"/></svg>',
    sarcoma: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M18 12c4-4 9-3 11 1l10 26c2 4-1 9-6 9h-2c-4 0-7-2-8-6L13 22c-2-4 1-9 5-10z"/><path d="M45 11c5 0 8 5 6 9l-6 12M47 41l4 10M42 48l10-4"/></svg>',
    haem: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 7S13 29 13 42a19 19 0 0 0 38 0C51 29 32 7 32 7z"/><circle cx="25" cy="39" r="4"/><circle cx="38" cy="35" r="3"/><circle cx="36" cy="47" r="5"/></svg>',
    skin: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M8 20c10-7 17 7 27 0s17 7 21 0v30H8V20z"/><path d="M8 31c10-7 17 7 27 0s17 7 21 0M8 42c10-7 17 7 27 0s17 7 21 0"/><circle cx="40" cy="16" r="5"/></svg>',
    headneck: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M40 8c-13 0-21 9-21 21 0 8 4 14 10 18v9h20V42c5-4 8-10 8-17C57 15 50 8 40 8z"/><path d="M28 29h8l3-6M38 35c4 2 8 1 10-2M29 47h20"/></svg>'
  };

  const TISSUES = [
    { id: "all", label: "All SACT", short: "All", color: "#176B9B", values: [], icon: "all", description: "Search the complete NCCP protocol catalogue." },
    { id: "breast", label: "Breast", short: "Breast", color: "#D86A8A", values: ["Breast"], icon: "breast", description: "Breast systemic therapy, endocrine, HER2 and supportive pathways." },
    { id: "gi", label: "Gastrointestinal", short: "GI", color: "#8B5E3C", values: ["Gastrointestinal"], icon: "gi", description: "Colorectal, upper GI, pancreatic and hepatobiliary regimens." },
    { id: "lung", label: "Lung", short: "Lung", color: "#2F8C8C", values: ["Lung"], icon: "lung", description: "NSCLC, SCLC, immunotherapy and maintenance regimens." },
    { id: "gynae", label: "Gynaecology", short: "Gynae", color: "#7C5CC4", values: ["Gynaecology"], icon: "gynae", description: "Ovarian, endometrial, cervical and maintenance therapy." },
    { id: "gu", label: "Genitourinary / Men’s", short: "GU", color: "#3E6FB6", values: ["Genitourinary"], icon: "gu", description: "Prostate, testicular, urothelial and renal cancer regimens." },
    { id: "neuro", label: "Neuro-oncology", short: "Neuro", color: "#4B5FA8", values: ["Neuro-oncology", "Neurology"], icon: "neuro", description: "Brain and central nervous system cancer protocols." },
    { id: "sarcoma", label: "Sarcoma", short: "Sarcoma", color: "#C9783B", values: ["Sarcoma"], icon: "sarcoma", description: "Bone and soft-tissue sarcoma protocols." },
    { id: "haem", label: "Haematology", short: "Haem", color: "#B64545", values: ["Haematology", "Lymphoma", "Myeloma", "Leukaemia"], icon: "haem", description: "Lymphoma, myeloma and haematological malignancy protocols." },
    { id: "skin", label: "Skin / Melanoma", short: "Skin", color: "#5B4B6A", values: ["Skin/Melanoma", "Skin", "Melanoma"], icon: "skin", description: "Melanoma and other cutaneous cancer protocols." },
    { id: "headneck", label: "Head & Neck", short: "H&N", color: "#C49A3A", values: ["Head and Neck", "Head & Neck"], icon: "headneck", description: "Head-and-neck systemic therapy and chemoradiation protocols." }
  ];

  const SECTION_LABELS = {
    chemotherapy_combination_sact: "Chemotherapy & combination SACT",
    targeted_her2_therapy: "Targeted / HER2",
    immunotherapy: "Immunotherapy",
    endocrine_hormonal_therapy: "Endocrine therapy",
    bone_modifying_therapy: "Bone-modifying therapy",
    supportive_other: "Other / supportive"
  };

  function escapeHtml(value) {
    return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }

  function icon(tissue) {
    return `<span class="tissue-icon" style="--tissue-color:${escapeHtml(tissue.color)}">${ICONS[tissue.icon] || ICONS.all}</span>`;
  }

  function matchingCards(tissue) {
    const cards = [...document.querySelectorAll("#regimenGrid .regimen-card")];
    if (tissue.id === "all") return cards;
    return cards.filter(card => {
      const groups = String(card.dataset.tumour || "").split(",").map(value => value.trim());
      return tissue.values.some(value => groups.includes(value));
    });
  }

  function countSections(cards) {
    return cards.reduce((output, card) => {
      const section = card.dataset.section || "supportive_other";
      output[section] = (output[section] || 0) + 1;
      return output;
    }, {});
  }

  function renderTiles() {
    const grid = document.getElementById("tissueTypeGrid");
    if (!grid) return;
    grid.innerHTML = TISSUES.map(tissue => {
      const count = matchingCards(tissue).length;
      return `<button class="tissue-tile${tissue.id === "all" ? " active" : ""}" type="button" data-tissue-id="${escapeHtml(tissue.id)}" style="--tissue-color:${escapeHtml(tissue.color)}" aria-pressed="${tissue.id === "all"}">
        ${icon(tissue)}
        <span class="tissue-tile-copy"><strong>${escapeHtml(tissue.short)}</strong><small>${count} regimen${count === 1 ? "" : "s"}</small></span>
      </button>`;
    }).join("");
    grid.querySelectorAll("[data-tissue-id]").forEach(button => button.addEventListener("click", () => select(button.dataset.tissueId)));
  }

  function renderLanding(tissue) {
    const panel = document.getElementById("tissueLandingPanel");
    if (!panel) return;
    const cards = matchingCards(tissue);
    const sections = countSections(cards);
    const sectionButtons = Object.entries(SECTION_LABELS).map(([id, label]) => {
      const count = sections[id] || 0;
      if (!count) return "";
      return `<button class="tissue-section-chip" type="button" data-treatment-section="${escapeHtml(id)}"><strong>${escapeHtml(label)}</strong><span>${count}</span></button>`;
    }).join("");
    panel.style.setProperty("--tissue-color", tissue.color);
    panel.innerHTML = `<div class="tissue-landing-icon">${icon(tissue)}</div>
      <div class="tissue-landing-copy"><span class="tissue-eyebrow">Tumour-site page</span><h3>${escapeHtml(tissue.label)}</h3><p>${escapeHtml(tissue.description)}</p>
      <div class="tissue-section-links">${sectionButtons || '<span class="subtle">No encoded protocols in this section yet.</span>'}</div></div>`;
    panel.querySelectorAll("[data-treatment-section]").forEach(button => button.addEventListener("click", () => {
      const treatment = document.getElementById("treatmentFilter");
      if (treatment) {
        treatment.value = button.dataset.treatmentSection;
        treatment.dispatchEvent(new Event("change", { bubbles: true }));
        document.getElementById("regimenGrid")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }));
  }

  function select(id) {
    const tissue = TISSUES.find(item => item.id === id) || TISSUES[0];
    document.querySelectorAll(".tissue-tile").forEach(button => {
      const active = button.dataset.tissueId === tissue.id;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const selectElement = document.getElementById("tumourFilter");
    if (selectElement) {
      const value = tissue.id === "all" ? "all" : tissue.values[0];
      ensureFilterOption(selectElement, value, tissue.label);
      selectElement.value = value;
      selectElement.dispatchEvent(new Event("change", { bubbles: true }));
    }
    const treatment = document.getElementById("treatmentFilter");
    if (treatment && treatment.value !== "all") {
      treatment.value = "all";
      treatment.dispatchEvent(new Event("change", { bubbles: true }));
    }
    renderLanding(tissue);
  }

  function ensureFilterOption(selectElement, value, label) {
    if ([...selectElement.options].some(option => option.value === value)) return;
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    selectElement.appendChild(option);
  }

  function populateFilter() {
    const selectElement = document.getElementById("tumourFilter");
    if (!selectElement) return;
    TISSUES.slice(1).forEach(tissue => ensureFilterOption(selectElement, tissue.values[0], tissue.label));
  }

  function tissueForGroups(groups = []) {
    return TISSUES.slice(1).find(tissue => tissue.values.some(value => groups.includes(value))) || TISSUES[0];
  }

  function decorateCards() {
    document.querySelectorAll("#regimenGrid .regimen-card").forEach(card => {
      const groups = String(card.dataset.tumour || "").split(",").map(value => value.trim()).filter(Boolean);
      const tissue = tissueForGroups(groups);
      card.style.setProperty("--tissue-color", tissue.color);
      card.classList.add("tissue-themed-card");
      const existing = card.querySelector(":scope > .card-tissue-badge");
      if (existing) existing.remove();
      const badge = document.createElement("span");
      badge.className = "card-tissue-badge";
      badge.title = tissue.label;
      badge.innerHTML = `${icon(tissue)}<span>${escapeHtml(tissue.short)}</span>`;
      card.prepend(badge);
    });
  }

  function refresh() {
    populateFilter();
    decorateCards();
    renderTiles();
    const activeId = document.querySelector(".tissue-tile.active")?.dataset.tissueId || "all";
    renderLanding(TISSUES.find(item => item.id === activeId) || TISSUES[0]);
  }

  root.SACTCheckTissueUI = Object.freeze({ version: "0.37.2", tissues: TISSUES, refresh, select });
  root.addEventListener?.("sactcheck:protocols-loaded", refresh);
  root.addEventListener?.("sactcheck:local-protocol-added", refresh);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", refresh);
  else refresh();
})(typeof globalThis !== "undefined" ? globalThis : this);
