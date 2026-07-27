/** SACTCheck v0.48.3 ranked regimen-search presentation. */
(function (root) {
  "use strict";

  function cardTitle(card) {
    return card?.querySelector?.("h2")?.textContent?.trim() || "Protocol";
  }

  function cardCode(card) {
    const direct = card?.querySelector?.(".regimen-code")?.textContent?.trim();
    if (direct) return direct;
    return (card?.textContent || "").match(/NCCP\s*\d+(?:\s*·\s*Version\s*[^\n]+)?/i)?.[0]?.trim() || "";
  }

  function cardTissue(card) {
    return String(card?.dataset?.tumour || "").split(",").filter(Boolean).slice(0, 2).join(" · ");
  }

  function focusCard(card) {
    if (!card) return;
    card.scrollIntoView({ behavior: "smooth", block: "start" });
    try { card.focus({ preventScroll: true }); } catch (_) { card.focus?.(); }
    card.classList.add("search-focus-pulse");
    setTimeout(() => card?.classList.remove("search-focus-pulse"), 1000);
  }

  function suggestionButton(result, index, closest = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "search-suggestion-button";
    button.setAttribute("role", "option");
    button.dataset.suggestionIndex = String(index);
    const card = result.card;
    const title = document.createElement("strong");
    title.textContent = cardTitle(card);
    const meta = document.createElement("span");
    meta.textContent = [cardCode(card), cardTissue(card)].filter(Boolean).join(" · ");
    const reason = document.createElement("small");
    reason.textContent = closest ? "Closest title" : result.reason;
    button.append(title, meta, reason);
    button.addEventListener("click", () => focusCard(card));
    return button;
  }

  function update(query, results, allCards) {
    const panel = document.getElementById("searchSuggestions");
    if (!panel) return;
    const value = String(query || "").trim();
    panel.replaceChildren();
    panel.classList.toggle("hidden", !value);
    if (!value) return;

    const api = root.SACTCheckRegimenSearch;
    const ranked = Array.isArray(results) ? results : [];
    const content = ranked.length ? ranked.slice(0, 6) : (api?.closestTitles?.(allCards || [], value, 4) || []);
    const heading = document.createElement("div");
    heading.className = "search-suggestions-heading";
    heading.innerHTML = ranked.length
      ? `<strong>Best matches</strong><span>Ranked by title, drug aliases, NCCP number and indication</span>`
      : `<strong>No direct match</strong><span>Closest regimen titles</span>`;
    panel.appendChild(heading);

    if (!content.length) {
      const empty = document.createElement("p");
      empty.className = "search-suggestions-empty";
      empty.textContent = "Try a generic drug, brand name, acronym, indication or NCCP number.";
      panel.appendChild(empty);
      return;
    }

    const list = document.createElement("div");
    list.className = "search-suggestions-list";
    content.forEach((result, index) => list.appendChild(suggestionButton(result, index, !ranked.length)));
    panel.appendChild(list);
  }

  root.SACTCheckSearchUI = Object.freeze({ version: "0.48.3", update, focusCard });
})(typeof globalThis !== "undefined" ? globalThis : this);
