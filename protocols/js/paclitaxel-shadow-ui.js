/**
 * Adds a JSON shadow-assessment launch to the existing weekly paclitaxel card.
 * The legacy assessment remains the primary pathway during validation.
 */
(function (root) {
  "use strict";

  const PROTOCOL_ID = "nccp-00226-v9";

  function getProtocol() {
    return root.SACTCheckProtocolLoader?.getProtocolById(PROTOCOL_ID) ||
      root.SACTCHECK_PROTOCOLS?.find(item => item.protocol?.protocol_id === PROTOCOL_ID)?.protocol ||
      null;
  }

  function initialise() {
    const protocol = getProtocol();
    if (!protocol || document.getElementById("openPaclitaxelJsonShadow")) return;

    const legacyButton = document.getElementById("openPaclitaxel");
    const card = legacyButton?.closest(".regimen-card");
    const actions = card?.querySelector(".card-actions");
    if (!actions) return;

    const validationRow = card.querySelector(".validation-row");
    if (validationRow && !card.querySelector(".paclitaxel-json-shadow-badge")) {
      const badge = document.createElement("span");
      badge.className = "badge review paclitaxel-json-shadow-badge";
      badge.textContent = "JSON shadow validation";
      validationRow.appendChild(badge);
    }

    const button = document.createElement("button");
    button.id = "openPaclitaxelJsonShadow";
    button.type = "button";
    button.className = "btn secondary";
    button.textContent = "Open JSON shadow assessment";
    button.addEventListener("click", () => {
      try {
        root.SACTCheckGenericAssessment.open(protocol);
      } catch (error) {
        console.error("Weekly paclitaxel JSON shadow assessment failed to open", error);
        alert(`The weekly paclitaxel JSON assessment could not be opened: ${error.message}`);
      }
    });
    actions.appendChild(button);
  }

  root.addEventListener("sactcheck:protocols-loaded", initialise);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialise);
  else initialise();

  root.SACTCheckPaclitaxelShadowUI = Object.freeze({ initialise });
})(window);
