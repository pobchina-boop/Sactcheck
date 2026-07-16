(() => {
  "use strict";

  const INDEX_PATH = "protocols/index.json";

  async function fetchJson(path) {
    const response = await fetch(path, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Could not load ${path}. HTTP ${response.status}`);
    }

    return response.json();
  }

  function getProtocolTitle(protocol) {
    return (
      protocol?.metadata?.short_title ||
      protocol?.metadata?.title ||
      protocol?.file_name ||
      "Unnamed protocol"
    );
  }

  function getProtocolCode(protocol) {
    return (
      protocol?.metadata?.nccp_regimen_code ||
      protocol?.protocol_id ||
      "No NCCP code"
    );
  }

  function getTumourGroup(entry, protocol) {
    return (
      entry?.tumour_group ||
      protocol?.metadata?.tumour_group ||
      protocol?.metadata?.tumour_groups?.join(", ") ||
      "Uncategorised"
    );
  }

  function createProtocolLibrary(protocols) {
  // Remove the temporary separate JSON library panel.
  const temporaryPanel = document.getElementById(
    "json-protocol-library"
  );

  if (temporaryPanel) {
    temporaryPanel.remove();
  }

  // Find the existing SACTCheck regimen-card grid.
  const grid = document.getElementById("regimenGrid");

  if (!grid) {
    throw new Error(
      "Could not find the existing regimen library grid."
    );
  }

  // Remove previously generated JSON cards before rebuilding.
  grid
    .querySelectorAll(".json-regimen-card")
    .forEach(card => card.remove());

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function shorten(value, maximumLength = 240) {
    const text = String(value ?? "").trim();

    if (text.length <= maximumLength) {
      return text;
    }

    return `${text.slice(0, maximumLength - 1).trim()}…`;
  }

  protocols.forEach(({ entry = {}, protocol = {} }) => {
    const metadata = protocol.metadata || {};

    const title = getProtocolTitle(protocol);
    const code = getProtocolCode(protocol);
    const version = metadata.nccp_version || "";

    let tumourGroups = metadata.tumour_groups;

    if (!Array.isArray(tumourGroups)) {
      tumourGroups = [
        entry.tumour_group ||
        metadata.tumour_group ||
        "Uncategorised"
      ];
    }

    tumourGroups = tumourGroups
      .flatMap(group => String(group).split(","))
      .map(group => group.trim())
      .filter(Boolean);

    tumourGroups = [...new Set(tumourGroups)];

    const tumourDisplay = tumourGroups.join(" · ");
    const tumourFilterValue = tumourGroups.join(",");

    const indication =
      metadata.indication ||
      (
        Array.isArray(protocol.indications)
          ? protocol.indications
              .map(item => item?.description)
              .filter(Boolean)
              .join(" ")
          : ""
      ) ||
      "Machine-readable NCCP regimen encoded for the SACTCheck protocol library.";

    const generalRules =
      protocol.rule_engine?.rules?.length || 0;

    const immuneRules =
      protocol.pembrolizumab_irae_rules?.rules?.length || 0;

    const totalRules = generalRules + immuneRules;

    const validationStatus =
      protocol.status ||
      "Validation status not specified";

    const repositoryPath =
      entry.path ||
      protocol.file_name ||
      "Path not specified";

    const searchableText = [
      title,
      code,
      version,
      tumourDisplay,
      indication,
      repositoryPath
    ].join(" ");

    const card = document.createElement("article");

    // Mark as planned until its interactive assessment screen
    // is connected to the generic JSON rule engine.
    card.className =
      "card regimen-card planned json-regimen-card";

    card.dataset.name = searchableText;
    card.dataset.tumour = tumourFilterValue;
    card.dataset.status = "planned";
    card.dataset.jsonProtocolId =
      protocol.protocol_id ||
      entry.id ||
      code;

    card.innerHTML = `
      <span class="category-chip">
        ${escapeHtml(tumourDisplay)}
      </span>

      <h2>
        ${escapeHtml(title)}
      </h2>

      <p>
        <strong>
          NCCP ${escapeHtml(code)}
          ${
            version
              ? ` · Version ${escapeHtml(version)}`
              : ""
          }
        </strong>
      </p>

      <p>
        ${escapeHtml(shorten(indication))}
      </p>

      <div class="validation-row">
        <span class="badge catalog">
          Encoded JSON
        </span>

        <span class="badge pending">
          Assessment UI pending
        </span>
      </div>

      <details>
        <summary>
          View encoded protocol summary
        </summary>

        <div class="details-body">
          <p>
            <strong>Repository file:</strong>
            ${escapeHtml(repositoryPath)}
          </p>

          <p>
            <strong>Encoding status:</strong>
            ${escapeHtml(validationStatus)}
          </p>

          <p>
            <strong>Rules encoded:</strong>
            ${totalRules}
          </p>

          <p>
            <strong>Current capability:</strong>
            The protocol data loads successfully and is searchable.
            Its interactive clinical assessment screen has not yet
            been connected.
          </p>
        </div>
      </details>

      <div class="card-actions">
        <button
          class="btn"
          type="button"
          disabled
        >
          Assessment screen next
        </button>
      </div>
    `;

    grid.appendChild(card);
  });

  // Re-run the existing SACTCheck search/filter logic.
  if (typeof window.filterRegimens === "function") {
    window.filterRegimens();
  } else {
    const count = document.getElementById("catalogCount");

    if (count) {
      const total =
        grid.querySelectorAll(".regimen-card").length;

      count.textContent =
        `${total} regimen${total === 1 ? "" : "s"} shown`;
    }
  }
}
  function showLoadError(error) {
    console.error("Protocol loader failed:", error);

    const warning = document.createElement("div");
    warning.style.cssText = `
      margin: 16px;
      padding: 12px;
      border: 1px solid #f1aeb5;
      border-radius: 8px;
      background: #f8d7da;
      color: #58151c;
      font-family: Arial, Helvetica, sans-serif;
    `;

    warning.textContent = `Protocol loader failed: ${error.message}`;
    document.body.prepend(warning);
  }

  async function loadProtocols() {
    try {
      const index = await fetchJson(INDEX_PATH);

      if (!Array.isArray(index.protocols)) {
        throw new Error(
          "protocols/index.json does not contain a protocols array."
        );
      }

      const enabledEntries = index.protocols.filter(
        item => item && item.enabled !== false
      );

      const protocols = await Promise.all(
        enabledEntries.map(async entry => {
          if (!entry.path) {
            throw new Error(
              `Protocol ${entry.id || "without an ID"} has no file path.`
            );
          }

          const protocol = await fetchJson(entry.path);
          return { entry, protocol };
        })
      );

      window.SACTCHECK_PROTOCOLS = protocols;

      console.log("Loaded JSON protocols:", protocols);

      createProtocolLibrary(protocols);
    } catch (error) {
      showLoadError(error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadProtocols);
  } else {
    loadProtocols();
  }
})();