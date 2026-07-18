/**
 * SACTCheck Protocol Importer / Preview v0.16.2
 * Robust static-screen binding with visible module diagnostics.
 */
(function (root) {
  "use strict";

  let importedProtocol = null;
  let importedFileName = "";
  let latestValidation = null;

  function validator() {
    return root.SACTCheckProtocolValidator || null;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function showScreen(id) {
    if (typeof root.showScreen === "function") {
      root.showScreen(id);
      return;
    }
    document.querySelectorAll(".screen").forEach(screen => screen.classList.remove("active"));
    document.getElementById(id)?.classList.add("active");
    try { root.scrollTo({ top: 0, behavior: "smooth" }); }
    catch { root.scrollTo(0, 0); }
  }

  function moduleNotice(message) {
    const box = document.getElementById("importerModuleNotice");
    const text = document.getElementById("importerModuleNoticeText");
    if (text && message) text.textContent = message;
    if (box) box.classList.remove("hidden");
  }

  function clearModuleNotice() {
    document.getElementById("importerModuleNotice")?.classList.add("hidden");
  }

  function screenMarkup() {
    return `
      <div class="toolbar spread">
        <button class="btn secondary" type="button" id="importerBack">← Regimen library</button>
        <span class="badge review">Protocol publisher v0.16.2</span>
      </div>
      <section>
        <div class="section-heading"><div><h2>Validate and preview a protocol JSON file</h2><p class="subtle">This validates the file locally in this browser. It does not upload patient information or permanently publish a protocol.</p></div></div>
        <div class="grid two">
          <div><label for="protocolJsonFile">Protocol JSON file</label><input id="protocolJsonFile" type="file" accept="application/json,.json"><span class="hint">Use a reviewed SACTCheck schema 2.x protocol file.</span></div>
          <div><label>Publication model</label><p class="subtle">Preview here first. To publish for all users, place the validated JSON under <code>protocols/</code> and push it.</p></div>
        </div>
        <div id="importerModuleNotice" class="status warn hidden" style="margin-top:16px"><h2>Protocol preview module did not initialise</h2><p id="importerModuleNoticeText"></p></div>
      </section>
      <section id="importerResult" class="hidden">
        <div id="importerStatus" class="status warn"><h2 id="importerStatusTitle">Awaiting file</h2><p id="importerStatusText"></p></div>
        <div class="metrics"><div class="metric"><span>Protocol</span><strong id="importerProtocol">—</strong></div><div class="metric"><span>Inputs</span><strong id="importerInputs">—</strong></div><div class="metric"><span>Rules</span><strong id="importerRules">—</strong></div><div class="metric"><span>Validation</span><strong id="importerValidation">—</strong></div></div>
        <div class="result-block"><h2>Validation report</h2><div id="importerIssues"></div></div>
        <div class="toolbar"><button class="btn" type="button" id="importerOpenAssessment" disabled>Open generated assessment</button><button class="btn secondary" type="button" id="importerAddSession" disabled>Add to this browser session</button><button class="btn secondary" type="button" id="importerDownloadReport" disabled>Download validation report</button></div>
      </section>`;
  }

  function createScreenIfMissing() {
    let screen = document.getElementById("protocolImporterScreen");
    if (screen) return screen;
    const main = document.querySelector("main") || document.body;
    screen = document.createElement("div");
    screen.id = "protocolImporterScreen";
    screen.className = "screen";
    screen.innerHTML = screenMarkup();
    main.appendChild(screen);
    return screen;
  }

  function bindScreen() {
    const screen = createScreenIfMissing();
    if (screen.dataset.importerBound === "true") return screen;

    document.getElementById("importerBack")?.addEventListener("click", event => {
      event.preventDefault();
      showScreen("libraryScreen");
      history.replaceState(null, "", "#libraryScreen");
    });
    document.getElementById("protocolJsonFile")?.addEventListener("change", handleFile);
    document.getElementById("importerOpenAssessment")?.addEventListener("click", () => {
      if (!importedProtocol || !latestValidation?.valid) return;
      if (!root.SACTCheckGenericAssessment?.open) {
        moduleNotice("The generic assessment interface did not load. Confirm js/generic-assessment-ui.js is present, then refresh.");
        return;
      }
      root.SACTCheckGenericAssessment.open(importedProtocol);
    });
    document.getElementById("importerAddSession")?.addEventListener("click", addToSession);
    document.getElementById("importerDownloadReport")?.addEventListener("click", downloadReport);
    screen.dataset.importerBound = "true";
    return screen;
  }

  function bindButton() {
    const button = document.getElementById("openProtocolImporter");
    if (!button || button.dataset.importerBound === "true") return;
    const handler = event => {
      event.preventDefault();
      open();
    };
    button.addEventListener("click", handler);
    button.addEventListener("touchend", handler, { passive: false });
    button.dataset.importerBound = "true";
  }

  function ensureScreen() {
    const screen = bindScreen();
    if (validator()) clearModuleNotice();
    else moduleNotice("The preview screen opened, but js/protocol-validator.js did not load. Stop and restart Live Server, then refresh with Ctrl+F5.");
    return screen;
  }

  function open() {
    ensureScreen();
    showScreen("protocolImporterScreen");
    history.replaceState(null, "", "#protocolImporterScreen");
  }

  async function handleFile(event) {
    resetImport();
    const file = event.target.files?.[0];
    if (!file) return;
    importedFileName = file.name;
    const Validator = validator();
    if (!Validator) {
      moduleNotice("The JSON file cannot be validated because js/protocol-validator.js did not load. Refresh the page after confirming the file is present.");
      return;
    }

    try {
      const text = await file.text();
      importedProtocol = JSON.parse(text);
      latestValidation = Validator.validate(importedProtocol, { strict: true });
      renderValidation();
    } catch (error) {
      importedProtocol = null;
      latestValidation = {
        valid: false,
        errors: [{ code: "JSON_PARSE_ERROR", message: error.message, path: null }],
        warnings: [],
        summary: { inputCount: 0, ruleCount: 0, errorCount: 1, warningCount: 0 }
      };
      renderValidation();
    }
  }

  function resetImport() {
    importedProtocol = null;
    importedFileName = "";
    latestValidation = null;
    document.getElementById("importerResult")?.classList.add("hidden");
  }

  function renderValidation() {
    const validation = latestValidation;
    const protocol = importedProtocol || {};
    const result = document.getElementById("importerResult");
    if (!result) return;
    result.classList.remove("hidden");

    const status = document.getElementById("importerStatus");
    status.className = `status ${validation.valid ? "good" : "bad"}`;
    document.getElementById("importerStatusTitle").textContent = validation.valid ? "Protocol JSON is structurally valid" : "Publication blocked";
    document.getElementById("importerStatusText").textContent = validation.valid
      ? "The generic assessment can be generated. Clinical and pharmacy validation remain separate requirements."
      : "Correct every validation error before adding this protocol to the published library.";

    document.getElementById("importerProtocol").textContent = protocol?.metadata?.short_title || protocol?.metadata?.title || importedFileName || "Unknown";
    document.getElementById("importerInputs").textContent = String(validation.summary?.inputCount ?? 0);
    document.getElementById("importerRules").textContent = String(validation.summary?.ruleCount ?? 0);
    document.getElementById("importerValidation").textContent = `${validation.errors.length} error${validation.errors.length === 1 ? "" : "s"}, ${validation.warnings.length} warning${validation.warnings.length === 1 ? "" : "s"}`;

    const issueRows = [
      ...validation.errors.map(issue => issueMarkup(issue, "critical")),
      ...validation.warnings.map(issue => issueMarkup(issue, "consult"))
    ];
    document.getElementById("importerIssues").innerHTML = issueRows.length
      ? issueRows.join("")
      : '<div class="finding info"><h3>No structural issues detected</h3><p>The file satisfies the v0.16 protocol contract.</p></div>';

    document.getElementById("importerOpenAssessment").disabled = !validation.valid;
    document.getElementById("importerAddSession").disabled = !validation.valid;
    document.getElementById("importerDownloadReport").disabled = false;
  }

  function issueMarkup(issue, className) {
    return `<div class="finding ${className}"><h3>${escapeHtml(issue.code || "VALIDATION_ISSUE")}</h3><p>${escapeHtml(issue.message || String(issue))}</p>${issue.path ? `<div class="source">${escapeHtml(issue.path)}</div>` : ""}</div>`;
  }

  function addToSession() {
    if (!importedProtocol || !latestValidation?.valid) return;
    const loader = root.SACTCheckProtocolLoader;
    if (!loader?.addLocalProtocol) {
      moduleNotice("The protocol loader local-registration function is unavailable. Confirm js/protocol-loader.js is present, then refresh.");
      return;
    }
    loader.addLocalProtocol(importedProtocol, importedFileName || "Local JSON file");
    showScreen("libraryScreen");
    history.replaceState(null, "", "#libraryScreen");
    if (typeof root.showToast === "function") root.showToast("Protocol added for this browser session");
  }

  function downloadReport() {
    if (!latestValidation) return;
    const Validator = validator();
    const lines = [
      "SACTCheck protocol validation report",
      `File: ${importedFileName || "Not specified"}`,
      `Protocol: ${importedProtocol?.protocol_id || "Not parsed"}`,
      `Valid: ${latestValidation.valid ? "Yes" : "No"}`,
      `Inputs: ${latestValidation.summary?.inputCount ?? 0}`,
      `Rules: ${latestValidation.summary?.ruleCount ?? 0}`,
      "",
      ...(Validator?.formatIssues ? Validator.formatIssues(latestValidation) : [])
    ];
    if (!latestValidation.errors.length && !latestValidation.warnings.length) lines.push("No structural issues detected.");
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `${(importedProtocol?.protocol_id || "protocol").replace(/[^a-z0-9_-]/gi, "-")}-validation.txt`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  }

  root.SACTCheckProtocolImporter = Object.freeze({ version: "0.16.2", open, ensureScreen });

  function initialise() {
    ensureScreen();
    bindButton();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialise);
  else initialise();
})(typeof globalThis !== "undefined" ? globalThis : this);
