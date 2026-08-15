(function (root) {
  "use strict";

  const REGISTER_URL = "data/nccp-change-tracker/source-register-v0620.json";
  const FEED_URL = "data/nccp-change-tracker/change-feed.json";
  let sourceRegister = null;
  let changeFeed = null;
  let registerPromise = null;
  let feedPromise = null;
  let loadPromise = null;
  let activeChangeFilter = "all";

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function humanise(value) {
    return String(value || "")
      .replaceAll("_", " ")
      .replace(/\b\w/g, match => match.toUpperCase());
  }

  async function fetchJson(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load ${url}: HTTP ${response.status}`);
    return response.json();
  }

  async function loadRegister() {
    if (sourceRegister) return sourceRegister;
    if (!registerPromise) {
      registerPromise = fetchJson(REGISTER_URL).then(register => {
        sourceRegister = register;
        return register;
      }).catch(error => {
        registerPromise = null;
        throw error;
      });
    }
    return registerPromise;
  }

  async function loadFeed() {
    if (changeFeed) return changeFeed;
    if (!feedPromise) {
      feedPromise = fetchJson(FEED_URL).then(feed => {
        changeFeed = feed;
        return feed;
      }).catch(error => {
        feedPromise = null;
        throw error;
      });
    }
    return feedPromise;
  }

  async function load() {
    if (loadPromise) return loadPromise;
    loadPromise = Promise.all([loadRegister(), loadFeed()])
      .then(([register, feed]) => ({ register, feed }))
      .catch(error => {
        loadPromise = null;
        throw error;
      });
    return loadPromise;
  }

  function showScreen(id) {
    if (typeof root.showScreen === "function") {
      root.showScreen(id);
    } else {
      document.querySelectorAll(".screen").forEach(screen => screen.classList.remove("active"));
      document.getElementById(id)?.classList.add("active");
      window.scrollTo(0, 0);
    }
  }

  function summaryCard(label, value, tone, note) {
    return `<article class="tracker-summary-card ${escapeHtml(tone || "")}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(note || "")}</small></article>`;
  }

  function renderSummary() {
    const target = document.getElementById("nccpTrackerSummary");
    if (!target || !changeFeed) return;
    const summary = changeFeed.summary || {};
    const scanComplete = Boolean(changeFeed.scan?.remote_comparison_completed);
    target.innerHTML = [
      summaryCard("Registered protocols", summary.tracked_protocols || 0, "blue", "Each protocol is linked to an official NCCP source and its encoded version."),
      summaryCard("Changes requiring review", summary.changes_requiring_review || 0, summary.changes_requiring_review ? "red" : "green", summary.changes_requiring_review ? "Detected changes remain visible until clinical review is completed." : "No detected change is awaiting review."),
      summaryCard(scanComplete ? "Current after source check" : "Initial source check pending", scanComplete ? (summary.current_after_remote_check || 0) : (summary.awaiting_initial_remote_capture || 0), scanComplete ? "green" : "amber", scanComplete ? "The registered source matched the completed comparison." : "The first source comparison will establish the current review baseline."),
      summaryCard("Official source link required", summary.source_resolution_required || 0, summary.source_resolution_required ? "amber" : "green", summary.source_resolution_required ? "An official NCCP source link must be confirmed." : "Every registered protocol has an official NCCP source link.")
    ].join("");
  }

  function renderScanStatus() {
    const target = document.getElementById("nccpTrackerScanStatus");
    if (!target || !changeFeed) return;
    const scan = changeFeed.scan || {};
    const complete = Boolean(scan.remote_comparison_completed);
    const tone = complete ? (scan.status === "completed" ? "current" : "warning") : "pending";
    const lastChecked = scan.last_completed_at ? new Date(scan.last_completed_at).toLocaleString() : "Not yet completed";
    target.className = `tracker-scan-status ${tone}`;
    target.innerHTML = `
      <div class="tracker-status-icon" aria-hidden="true">${complete ? "✓" : "⌁"}</div>
      <div><span>${escapeHtml(scan.status_label || "Baseline ready")}</span><strong>${escapeHtml(scan.message || "Source surveillance is ready.")}</strong><small>Last completed source check: ${escapeHtml(lastChecked)}</small></div>
      <div class="tracker-safety-lock"><span aria-hidden="true">▣</span><strong>Human review gate active</strong><small>No detected change can rewrite a clinical rule automatically.</small></div>`;
  }

  function renderFeatures() {
    const target = document.getElementById("nccpTrackerFeatureGrid");
    if (!target || !changeFeed) return;
    target.innerHTML = (changeFeed.features || []).map((feature, index) => `
      <article class="tracker-feature-card">
        <span class="tracker-feature-number">${String(index + 1).padStart(2, "0")}</span>
        <h3>${escapeHtml(feature.title)}</h3>
        <div><strong>Function</strong><p>${escapeHtml(feature.function)}</p></div>
        <div><strong>Strength</strong><p>${escapeHtml(feature.strength)}</p></div>
      </article>`).join("");
  }

  function changeTone(change) {
    const level = change?.severity?.level || "review";
    return ["high", "medium", "low"].includes(level) ? level : "review";
  }

  function sourceVersion(record) {
    if (!record) return "Not available";
    return record.nccp_version ? `Version ${record.nccp_version}` : "Version not stated";
  }

  function renderChangeCard(change) {
    const tone = changeTone(change);
    const previous = change.previous || {};
    const current = change.current || {};
    const beforeExcerpt = change.before_excerpt || "No earlier extracted passage is available.";
    const afterExcerpt = change.after_excerpt || "No current extracted passage is available.";
    return `
      <article class="tracker-change-card ${tone}" data-change-type="${escapeHtml(change.change_type)}" data-change-priority="${escapeHtml(tone)}">
        <div class="tracker-change-head">
          <div><span class="tracker-change-type">${escapeHtml(change.change_type_label || humanise(change.change_type))}</span><h3>${escapeHtml(change.nccp_regimen_code)} · ${escapeHtml(change.title)}</h3><p>${escapeHtml(change.tumour_group || "")}</p></div>
          <div class="tracker-change-priority"><strong>${escapeHtml(change.severity?.label || "Review required")}</strong><span>${escapeHtml(humanise(change.review_status || "awaiting_clinical_review"))}</span></div>
        </div>
        <p class="tracker-change-reason">${escapeHtml(change.severity?.reason || "Clinical review is required.")}</p>
        <div class="tracker-source-pair">
          <div><span>Previous source</span><strong>${escapeHtml(sourceVersion(previous))}</strong><small>${escapeHtml(previous.source_url || "Not available")}</small></div>
          <div><span>Current source</span><strong>${escapeHtml(sourceVersion(current))}</strong><small>${escapeHtml(current.source_url || "Not available")}</small></div>
        </div>
        <details class="tracker-diff-details"><summary>View previous and current passages</summary><div class="tracker-diff-grid"><div><span>Previous</span><pre>${escapeHtml(beforeExcerpt)}</pre></div><div><span>Current</span><pre>${escapeHtml(afterExcerpt)}</pre></div></div></details>
        <div class="tracker-review-gate"><strong>Required next step</strong><span>Review the current NCCP source, classify the significance, update encoded content only after approval, then run regression testing.</span></div>
      </article>`;
  }

  function renderChanges() {
    const target = document.getElementById("nccpTrackerChanges");
    const empty = document.getElementById("nccpTrackerEmptyChanges");
    if (!target || !empty || !changeFeed) return;
    const allChanges = changeFeed.changes || [];
    const changes = allChanges.filter(change => {
      if (activeChangeFilter === "all") return true;
      if (["high", "medium", "low", "review"].includes(activeChangeFilter)) return changeTone(change) === activeChangeFilter;
      return change.change_type === activeChangeFilter;
    });
    target.innerHTML = changes.map(renderChangeCard).join("");
    const firstScanPending = !changeFeed.scan?.remote_comparison_completed;
    empty.hidden = changes.length > 0;
    empty.innerHTML = firstScanPending
      ? `<div class="tracker-empty-icon" aria-hidden="true">⌁</div><h3>Initial source comparison pending</h3><p>The NCCP protocol register is complete. Once the first source comparison is completed, SACTCheck can show which protocols remain current and which require review.</p>`
      : `<div class="tracker-empty-icon" aria-hidden="true">✓</div><h3>No matching protocol change requires review</h3><p>No change in the selected category is awaiting review.</p>`;
  }

  function statusForRecord(record) {
    if (!record) return { label: "Not registered", tone: "warning", note: "This protocol does not have a tracker record." };
    if (record.remote_capture_status === "captured") return { label: "Source checked", tone: "current", note: `Last checked ${record.last_remote_check ? new Date(record.last_remote_check).toLocaleDateString() : "date not available"}.` };
    if (record.remote_capture_status === "scan_failed") return { label: "Source check unsuccessful", tone: "warning", note: "Open the official NCCP PDF and verify the source directly." };
    if (record.source_status === "source_url_missing") return { label: "Official source link required", tone: "warning", note: "An official NCCP source link must be confirmed." };
    return { label: "Baseline registered", tone: "pending", note: "The initial source comparison has not yet been completed." };
  }

  function renderSourceRegister() {
    const target = document.getElementById("nccpTrackerSourceList");
    const count = document.getElementById("nccpTrackerSourceCount");
    const input = document.getElementById("nccpTrackerSourceSearch");
    if (!target || !sourceRegister) return;
    const query = String(input?.value || "").trim().toLowerCase();
    const records = (sourceRegister.records || []).filter(record => {
      if (!query) return true;
      return [record.nccp_regimen_code, record.title, record.short_title, record.tumour_group, record.indication]
        .some(value => String(value || "").toLowerCase().includes(query));
    });
    if (count) count.textContent = `${records.length} of ${sourceRegister.records.length} registered protocols`;
    target.innerHTML = records.slice(0, 80).map(record => {
      const status = statusForRecord(record);
      return `
        <article class="tracker-source-row">
          <div class="tracker-source-code"><strong>${escapeHtml(record.nccp_regimen_code)}</strong><span>${escapeHtml(record.nccp_version ? `v${record.nccp_version}` : "version pending")}</span></div>
          <div class="tracker-source-copy"><strong>${escapeHtml(record.title)}</strong><span>${escapeHtml(Array.isArray(record.tumour_group) ? record.tumour_group.join(" · ") : record.tumour_group)}</span><small>${escapeHtml(record.indication || "Indication recorded in protocol source")}</small></div>
          <div class="tracker-source-state ${escapeHtml(status.tone)}"><strong>${escapeHtml(status.label)}</strong><span>${escapeHtml(status.note)}</span></div>
          <a class="btn secondary tracker-source-link" href="${escapeHtml(record.source_url)}" target="_blank" rel="noopener noreferrer">Open NCCP PDF</a>
        </article>`;
    }).join("");
    if (records.length > 80) target.insertAdjacentHTML("beforeend", `<p class="tracker-source-limit">Showing the first 80 matches. Refine the search to locate a specific regimen.</p>`);
  }

  function updateHeaderBadge() {
    const badge = document.getElementById("nccpUpdateCountBadge");
    if (!badge || !changeFeed) return;
    const count = changeFeed.summary?.changes_requiring_review || 0;
    badge.textContent = String(count);
    badge.hidden = count === 0;
  }

  async function open(options = {}) {
    showScreen("nccpChangeTrackerScreen");
    const loading = document.getElementById("nccpTrackerLoading");
    const content = document.getElementById("nccpTrackerContent");
    if (loading) loading.hidden = false;
    if (content) content.hidden = true;
    try {
      await load();
      renderSummary();
      renderScanStatus();
      renderFeatures();
      renderChanges();
      if (options.sourceQuery) {
        const input = document.getElementById("nccpTrackerSourceSearch");
        if (input) input.value = options.sourceQuery;
      }
      renderSourceRegister();
      updateHeaderBadge();
      if (loading) loading.hidden = true;
      if (content) content.hidden = false;
      history.replaceState(null, "", "#nccpChangeTrackerScreen");
    } catch (error) {
      if (loading) loading.innerHTML = `<strong>Tracker data could not be loaded.</strong><span>${escapeHtml(error.message)}</span>`;
    }
  }

  function findProtocolRecord(protocol) {
    if (!sourceRegister || !protocol) return null;
    const metadata = protocol.metadata || {};
    const code = String(metadata.nccp_regimen_code || "").padStart(5, "0");
    const version = String(metadata.nccp_version || "").toLowerCase();
    const title = String(metadata.title || metadata.short_title || "").toLowerCase();
    const candidates = (sourceRegister.records || []).filter(record => record.nccp_regimen_code === code);
    if (candidates.length === 1) return candidates[0];
    return candidates.find(record => String(record.nccp_version || "").toLowerCase() === version && String(record.title || "").toLowerCase() === title)
      || candidates.find(record => String(record.nccp_version || "").toLowerCase() === version)
      || candidates[0]
      || null;
  }

  async function renderProtocolStatus(protocol) {
    const target = document.getElementById("jsonProtocolTrackerStatus");
    const button = document.getElementById("jsonProtocolTrackerButton");
    if (!target) return;
    target.textContent = "Loading protocol source status";
    target.className = "source-currency-inline pending";
    try {
      await loadRegister();
      const record = findProtocolRecord(protocol);
      const status = statusForRecord(record);
      target.textContent = status.label;
      target.className = `source-currency-inline ${status.tone}`;
      target.title = status.note;
      if (button) {
        button.hidden = false;
        button.onclick = () => open({ sourceQuery: record?.nccp_regimen_code || protocol.metadata?.nccp_regimen_code || "" });
      }
    } catch (_) {
      target.textContent = "Source status unavailable";
      target.className = "source-currency-inline warning";
    }
  }

  function bind() {
    document.querySelectorAll("[data-open-nccp-tracker]").forEach(button => {
      button.addEventListener("click", event => {
        event.preventDefault();
        open();
      });
    });
    document.getElementById("nccpTrackerBack")?.addEventListener("click", event => {
      event.preventDefault();
      showScreen("libraryScreen");
      history.replaceState(null, "", "#libraryScreen");
    });
    document.querySelectorAll("[data-tracker-filter]").forEach(button => {
      button.addEventListener("click", () => {
        activeChangeFilter = button.dataset.trackerFilter || "all";
        document.querySelectorAll("[data-tracker-filter]").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
        renderChanges();
      });
    });
    document.getElementById("nccpTrackerSourceSearch")?.addEventListener("input", renderSourceRegister);
    loadFeed().then(updateHeaderBadge).catch(() => {});
    if (root.location?.hash === "#nccpChangeTrackerScreen") setTimeout(() => open(), 0);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();

  root.SACTCheckNccpChangeTracker = {
    version: "0.62.1",
    appVersion: document.querySelector('meta[name="sactcheck-release"]')?.content || "0.68.0",
    open,
    load,
    loadFeed,
    loadRegister,
    renderProtocolStatus,
    findProtocolRecord,
    statusForRecord
  };
})(typeof window !== "undefined" ? window : globalThis);
