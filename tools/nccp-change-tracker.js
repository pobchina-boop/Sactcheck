#!/usr/bin/env node
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const DEFAULT_ROOT = path.resolve(__dirname, "..");
const TRACKER_DIR = path.join("data", "nccp-change-tracker");
const REGISTER_FILE = "source-register-v0620.json";
const STATE_FILE = "change-feed.json";
const REVIEW_FILE = "review-decisions.json";
const CONFIG_FILE = "catalogue-pages.json";
const REPORT_FILE = "latest-scan-report.md";
const SNAPSHOT_DIR = "snapshots";

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    if (fallback !== null) return fallback;
    throw error;
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function sha256Buffer(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function sha256String(value) {
  return sha256Buffer(Buffer.from(String(value || ""), "utf8"));
}

function normaliseSpace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normaliseVersion(value) {
  return normaliseSpace(value).replace(/^v/i, "").toLowerCase();
}

function normalisePdfText(value) {
  return String(value || "")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\s*page\s+\d+(?:\s+of\s+\d+)?\s*$/gim, "")
    .trim();
}

function extractVersion(value, url = "") {
  const text = String(value || "");
  const candidates = [
    /\bversion\s*(?:number)?\s*[:.]?\s*v?([0-9]+[a-z]?)\b/i,
    /\bv\s*([0-9]+[a-z]?)\b/i,
    /[_-]v([0-9]+[a-z]?)(?:[_\-.]|$)/i
  ];
  for (const regex of candidates) {
    const match = text.match(regex) || String(url || "").match(regex);
    if (match) return match[1];
  }
  return "";
}

function inferCodeFromHref(href) {
  const decoded = decodeURIComponent(String(href || ""));
  const matches = decoded.match(/(?:^|[\/_-])(\d{3,5})(?=[_\-.\/]|$)/g) || [];
  for (const raw of matches) {
    const code = raw.replace(/\D/g, "");
    if (code.length >= 3 && code.length <= 5) return code.padStart(5, "0");
  }
  return "";
}

function decodeHtml(value) {
  const entities = {
    "&amp;": "&",
    "&quot;": '"',
    "&#39;": "'",
    "&lt;": "<",
    "&gt;": ">",
    "&nbsp;": " "
  };
  return String(value || "")
    .replace(/&(amp|quot|#39|lt|gt|nbsp);/g, match => entities[match] || match)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function stripTags(value) {
  return normaliseSpace(decodeHtml(String(value || "").replace(/<[^>]*>/g, " ")));
}

function parsePdfLinks(html, pageUrl) {
  const links = [];
  const anchorRegex = /<a\b([^>]*?)href\s*=\s*(["'])(.*?)\2([^>]*)>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = anchorRegex.exec(String(html || "")))) {
    const href = decodeHtml(match[3]);
    if (!/\.pdf(?:$|[?#])/i.test(href)) continue;
    let absolute;
    try {
      absolute = new URL(href, pageUrl).toString();
    } catch (_) {
      continue;
    }
    const title = stripTags(match[5]) || path.basename(new URL(absolute).pathname);
    const nearby = stripTags(String(html || "").slice(Math.max(0, match.index - 500), match.index + match[0].length + 500));
    const codeMatch = nearby.match(/\b(\d{5})[a-z]?\b/i);
    links.push({
      url: absolute,
      title,
      code: codeMatch ? codeMatch[1] : inferCodeFromHref(absolute),
      catalogue_page_url: pageUrl
    });
  }
  return links;
}

function protocolFilesFromIndex(root) {
  const indexPath = path.join(root, "protocols", "index.json");
  const index = readJson(indexPath);
  if (!Array.isArray(index.protocols)) throw new Error("protocols/index.json does not contain a protocols array");
  return index.protocols.filter(item => item && item.enabled !== false && item.path);
}

function buildSourceRegister(root = DEFAULT_ROOT, checkedDate = new Date().toISOString().slice(0, 10)) {
  const records = [];
  for (const item of protocolFilesFromIndex(root)) {
    const absolutePath = path.join(root, item.path);
    const raw = fs.readFileSync(absolutePath);
    const protocol = JSON.parse(raw.toString("utf8"));
    const metadata = protocol.metadata || {};
    const code = String(metadata.nccp_regimen_code || "").padStart(5, "0");
    const sourceUrl = normaliseSpace(metadata.source_url);
    const sourceVersion = normaliseSpace(metadata.nccp_version);
    const sourceIdentity = `${code}|${normaliseVersion(sourceVersion)}|${sourceUrl}`;
    records.push({
      tracking_key: `${code}:${item.path}`,
      protocol_id: protocol.protocol_id || item.id || "",
      protocol_path: item.path,
      tumour_group: metadata.tumour_group || item.tumour_group || "Uncategorised",
      nccp_regimen_code: code,
      nccp_version: sourceVersion,
      title: metadata.title || metadata.short_title || protocol.protocol_id || item.id,
      short_title: metadata.short_title || metadata.title || "",
      indication: metadata.indication || "",
      source_url: sourceUrl,
      catalogue_page_url: metadata.catalogue_page_url || "",
      source_identity_sha256: sha256String(sourceIdentity),
      protocol_json_sha256: sha256Buffer(raw),
      sactcheck_encoding_version: metadata.sactcheck_encoding_version || "",
      source_status: sourceUrl ? "baseline_registered" : "source_url_missing",
      source_status_label: sourceUrl ? "Baseline registered" : "Source URL missing",
      remote_capture_status: sourceUrl ? "pending_first_remote_scan" : "not_available",
      pdf_sha256: null,
      extracted_text_sha256: null,
      text_snapshot_path: null,
      last_remote_check: null,
      baseline_registered_date: checkedDate,
      review_status: sourceUrl ? "awaiting_initial_remote_capture" : "source_resolution_required",
      clinical_rule_update_status: "no_automatic_change_permitted"
    });
  }
  records.sort((a, b) => a.nccp_regimen_code.localeCompare(b.nccp_regimen_code) || a.protocol_path.localeCompare(b.protocol_path));
  return {
    schema_version: "1.0.0",
    release: "0.62.0",
    generated_at: new Date().toISOString(),
    generated_from: "protocols/index.json and encoded protocol metadata",
    tracked_protocol_count: records.length,
    records
  };
}

function trackerFeatureExplanations() {
  return [
    {
      id: "new_protocol_detection",
      title: "New protocol detection",
      function: "Identifies an NCCP regimen that appears in a monitored catalogue but is not yet registered in SACTCheck.",
      strength: "Makes newly published treatment options visible to the maintenance team instead of relying on occasional manual catalogue review."
    },
    {
      id: "updated_protocol_detection",
      title: "Updated protocol detection",
      function: "Flags a registered regimen when its version, source address, PDF fingerprint or extracted text changes.",
      strength: "Provides a reproducible signal that an encoded regimen may need reconciliation against a newer source."
    },
    {
      id: "silent_replacement_detection",
      title: "Silent replacement detection",
      function: "Detects a changed PDF even when the visible version label and web address remain the same.",
      strength: "Reduces the risk that an unnoticed document replacement leaves SACTCheck linked to an outdated interpretation."
    },
    {
      id: "removed_protocol_detection",
      title: "Removed protocol detection",
      function: "Identifies a previously registered source that is no longer present in the successfully scanned NCCP catalogue pages.",
      strength: "Prompts review of whether a regimen has been retired, moved or temporarily unavailable before its status is changed in SACTCheck."
    },
    {
      id: "clinical_significance_triage",
      title: "Clinical significance triage",
      function: "Groups detected text changes into treatment criteria, safety workflow, information or formatting categories.",
      strength: "Helps reviewers prioritise possible dose, schedule, eligibility, laboratory and toxicity changes while retaining human confirmation."
    },
    {
      id: "source_comparison",
      title: "Previous and current source comparison",
      function: "Stores source fingerprints and text snapshots so changed passages can be shown together for review.",
      strength: "Creates a faster and more transparent review pathway than rereading two complete protocol documents without guidance."
    },
    {
      id: "human_review_gate",
      title: "Mandatory human review gate",
      function: "Prevents a detected source change from automatically rewriting any clinical rule or treatment action.",
      strength: "Keeps clinical interpretation, approval and release control with authorised reviewers."
    },
    {
      id: "history_and_provenance",
      title: "Change history and provenance",
      function: "Records the source identity, detection date, review state and SACTCheck release that incorporates an approved change.",
      strength: "Provides an auditable maintenance trail for governance, validation and future external review."
    }
  ];
}

function buildInitialFeed(register) {
  const withSource = register.records.filter(record => record.source_url).length;
  const missingSource = register.records.length - withSource;
  return {
    schema_version: "1.0.0",
    release: "0.62.0",
    generated_at: new Date().toISOString(),
    scan: {
      status: "baseline_ready",
      status_label: "Baseline ready",
      mode: "encoded_metadata_baseline",
      last_completed_at: null,
      message: "The local source register is ready. The first GitHub scan will capture remote PDF and extracted text fingerprints.",
      remote_comparison_completed: false
    },
    summary: {
      tracked_protocols: register.records.length,
      registered_source_urls: withSource,
      source_resolution_required: missingSource,
      changes_requiring_review: 0,
      high_priority_changes: 0,
      medium_priority_changes: 0,
      low_priority_changes: 0,
      current_after_remote_check: 0,
      awaiting_initial_remote_capture: withSource
    },
    changes: [],
    features: trackerFeatureExplanations(),
    safety_gate: {
      automatic_rule_updates: false,
      required_sequence: [
        "Detect the source change",
        "Preserve the previous and current source",
        "Review and classify the difference",
        "Update encoded content only after approval",
        "Run regression tests",
        "Publish a reviewed SACTCheck release"
      ]
    }
  };
}

function severityFromText(changeType, beforeText = "", afterText = "") {
  const combined = `${beforeText}\n${afterText}`.toLowerCase();
  const high = /\b(dose|mg\/m|mg\/kg|auc|schedule|cycle|eligib|indication|contraindicat|omit|discontinu|withhold|delay|reduce|reduction|anc|neutroph|platelet|bilirubin|ast|alt|creatinine|crcl|egfr|renal|hepatic|blood pressure|temperature|toxicity grade|ctcae)\b/;
  const medium = /\b(monitor|premedic|hydration|infusion|observation|supportive|antiemetic|g[- ]?csf|prophylaxis|administration|line flush|reaction management|counselling)\b/;
  const low = /\b(reference|bibliograph|evidence|trial|publication|background|contact|administrative)\b/;
  if (changeType === "removed_protocol") return { level: "high", label: "Potentially treatment changing", reason: "A registered protocol source is no longer present in the successfully scanned catalogue." };
  if (changeType === "new_protocol") return { level: "medium", label: "New source requiring review", reason: "A new NCCP source may require catalogue and knowledge base review." };
  if (high.test(combined)) return { level: "high", label: "Potentially treatment changing", reason: "The changed text contains treatment, eligibility, dose, laboratory or toxicity terms." };
  if (medium.test(combined)) return { level: "medium", label: "Safety or workflow change", reason: "The changed text contains monitoring, supportive care or administration terms." };
  if (low.test(combined)) return { level: "low", label: "Information change", reason: "The changed text appears related to evidence or administrative content." };
  return { level: "review", label: "Review required", reason: "Automated triage could not safely determine the clinical significance." };
}

function makeChangeId(changeType, key, fingerprint) {
  return `${changeType}:${sha256String(`${key}|${fingerprint}`).slice(0, 16)}`;
}

function compareSourceStates(baselineRecords, currentRecords, options = {}) {
  const baseline = new Map((baselineRecords || []).map(record => [record.tracking_key, record]));
  const current = new Map((currentRecords || []).map(record => [record.tracking_key, record]));
  const changes = [];
  const initialCaptures = [];
  const unchanged = [];

  for (const [key, currentRecord] of current.entries()) {
    const previous = baseline.get(key);
    if (!previous) {
      const severity = severityFromText("new_protocol", "", currentRecord.extracted_text || currentRecord.title || "");
      changes.push({
        change_id: makeChangeId("new_protocol", key, currentRecord.pdf_sha256 || currentRecord.source_url),
        change_type: "new_protocol",
        change_type_label: "New protocol",
        tracking_key: key,
        nccp_regimen_code: currentRecord.nccp_regimen_code,
        title: currentRecord.title,
        tumour_group: currentRecord.tumour_group,
        previous: null,
        current: currentRecord,
        severity,
        review_status: "awaiting_clinical_review"
      });
      continue;
    }

    const catalogueRemoval = previous.catalogue_presence === true && currentRecord.catalogue_presence === false;
    if (catalogueRemoval) {
      const severity = severityFromText("removed_protocol", previous.extracted_text || previous.title || "", "");
      changes.push({
        change_id: makeChangeId("removed_protocol", key, `${previous.source_url}|${currentRecord.last_remote_check || ""}`),
        change_type: "removed_protocol",
        change_type_label: "Removed or moved source candidate",
        tracking_key: key,
        nccp_regimen_code: previous.nccp_regimen_code,
        title: previous.title,
        tumour_group: previous.tumour_group,
        previous,
        current: currentRecord,
        severity,
        review_status: "awaiting_clinical_review"
      });
      continue;
    }

    const versionChanged = normaliseVersion(previous.nccp_version) !== normaliseVersion(currentRecord.nccp_version);
    const urlChanged = normaliseSpace(previous.source_url) !== normaliseSpace(currentRecord.source_url);
    const previousPdfHash = previous.pdf_sha256 || null;
    const currentPdfHash = currentRecord.pdf_sha256 || null;
    const previousTextHash = previous.extracted_text_sha256 || null;
    const currentTextHash = currentRecord.extracted_text_sha256 || null;
    const firstCapture = !previousPdfHash && Boolean(currentPdfHash);

    if (firstCapture && !versionChanged && !urlChanged) {
      initialCaptures.push({ previous, current: currentRecord });
      continue;
    }

    const contentChanged = Boolean(previousPdfHash && currentPdfHash && previousPdfHash !== currentPdfHash) ||
      Boolean(previousTextHash && currentTextHash && previousTextHash !== currentTextHash);

    if (versionChanged || urlChanged) {
      const severity = severityFromText("updated_protocol", previous.extracted_text || "", currentRecord.extracted_text || "");
      changes.push({
        change_id: makeChangeId("updated_protocol", key, `${currentRecord.source_url}|${currentRecord.nccp_version}|${currentPdfHash || ""}`),
        change_type: "updated_protocol",
        change_type_label: "Updated protocol",
        tracking_key: key,
        nccp_regimen_code: currentRecord.nccp_regimen_code,
        title: currentRecord.title,
        tumour_group: currentRecord.tumour_group,
        previous,
        current: currentRecord,
        severity,
        review_status: "awaiting_clinical_review"
      });
    } else if (contentChanged) {
      const formattingOnly = Boolean(previousPdfHash && currentPdfHash && previousPdfHash !== currentPdfHash && previousTextHash && currentTextHash && previousTextHash === currentTextHash);
      const severity = formattingOnly
        ? { level: "info", label: "Formatting or file change", reason: "The PDF fingerprint changed while the normalised extracted text fingerprint remained the same." }
        : severityFromText("silent_replacement", previous.extracted_text || "", currentRecord.extracted_text || "");
      changes.push({
        change_id: makeChangeId("silent_replacement", key, currentPdfHash || currentTextHash || ""),
        change_type: "silent_replacement",
        change_type_label: "Silent source replacement",
        tracking_key: key,
        nccp_regimen_code: currentRecord.nccp_regimen_code,
        title: currentRecord.title,
        tumour_group: currentRecord.tumour_group,
        previous,
        current: currentRecord,
        severity,
        review_status: "awaiting_clinical_review"
      });
    } else {
      unchanged.push({ previous, current: currentRecord });
    }
  }

  if (options.allowRemoved !== false) {
    for (const [key, previous] of baseline.entries()) {
      if (current.has(key)) continue;
      const severity = severityFromText("removed_protocol", previous.extracted_text || previous.title || "", "");
      changes.push({
        change_id: makeChangeId("removed_protocol", key, previous.pdf_sha256 || previous.source_url),
        change_type: "removed_protocol",
        change_type_label: "Removed or unavailable protocol",
        tracking_key: key,
        nccp_regimen_code: previous.nccp_regimen_code,
        title: previous.title,
        tumour_group: previous.tumour_group,
        previous,
        current: null,
        severity,
        review_status: "awaiting_clinical_review"
      });
    }
  }

  return { changes, initialCaptures, unchanged };
}

function commandExists(command) {
  const result = spawnSync(command, ["-v"], { encoding: "utf8" });
  return result.status === 0;
}

function extractPdfText(pdfBuffer) {
  if (!commandExists("pdftotext")) return { text: "", available: false, error: "pdftotext is not installed" };
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "sactcheck-nccp-"));
  const pdfPath = path.join(tempDir, "source.pdf");
  const textPath = path.join(tempDir, "source.txt");
  try {
    fs.writeFileSync(pdfPath, pdfBuffer);
    const result = spawnSync("pdftotext", ["-layout", pdfPath, textPath], { encoding: "utf8", timeout: 120000 });
    if (result.status !== 0) return { text: "", available: false, error: result.stderr || "pdftotext failed" };
    const text = normalisePdfText(fs.readFileSync(textPath, "utf8"));
    return { text, available: true, error: "" };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

async function fetchWithRetry(url, options = {}) {
  const attempts = options.attempts || 3;
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          "user-agent": "SACTCheck-NCCP-Change-Tracker/0.62.0",
          "accept": options.accept || "*/*"
        },
        redirect: "follow",
        signal: AbortSignal.timeout(options.timeout || 60000)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }
  }
  throw lastError;
}

async function scanCataloguePages(config) {
  const links = [];
  const pageResults = [];
  for (const page of config.catalogue_pages || []) {
    try {
      const response = await fetchWithRetry(page.url, { accept: "text/html" });
      const html = await response.text();
      const pageLinks = parsePdfLinks(html, page.url).map(link => ({ ...link, catalogue_label: page.label, tumour_group: page.tumour_group || "" }));
      links.push(...pageLinks);
      pageResults.push({ ...page, status: "success", pdf_link_count: pageLinks.length, checked_at: new Date().toISOString() });
    } catch (error) {
      pageResults.push({ ...page, status: "failed", error: String(error.message || error), checked_at: new Date().toISOString() });
    }
  }
  const unique = new Map();
  for (const link of links) unique.set(link.url, link);
  return { links: [...unique.values()], pageResults };
}

function bestCatalogueLink(record, links) {
  const exact = links.find(link => link.url === record.source_url);
  if (exact) return { ...exact, matched_from_catalogue: true };
  const code = String(record.nccp_regimen_code || "");
  const candidates = links.filter(link => link.code === code || inferCodeFromHref(link.url) === code);
  if (candidates.length === 1) return { ...candidates[0], matched_from_catalogue: true };
  if (candidates.length > 1) {
    const titleTokens = new Set(normaliseSpace(record.title).toLowerCase().split(/\W+/).filter(token => token.length > 3));
    candidates.sort((a, b) => {
      const score = candidate => normaliseSpace(candidate.title).toLowerCase().split(/\W+/).filter(token => titleTokens.has(token)).length;
      return score(b) - score(a);
    });
    return { ...candidates[0], matched_from_catalogue: true };
  }
  return record.source_url ? { url: record.source_url, title: record.title, code, catalogue_page_url: record.catalogue_page_url || "", matched_from_catalogue: false } : null;
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      results[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, limit) }, worker));
  return results;
}

function compactRecord(record) {
  if (!record) return null;
  const copy = { ...record };
  delete copy.extracted_text;
  return copy;
}

function excerptAroundDifference(beforeText, afterText, maxLength = 1200) {
  const beforeLines = String(beforeText || "").split("\n").filter(Boolean);
  const afterLines = String(afterText || "").split("\n").filter(Boolean);
  let index = 0;
  while (index < beforeLines.length && index < afterLines.length && beforeLines[index] === afterLines[index]) index += 1;
  const start = Math.max(0, index - 3);
  const before = beforeLines.slice(start, start + 10).join("\n").slice(0, maxLength);
  const after = afterLines.slice(start, start + 10).join("\n").slice(0, maxLength);
  return { before_excerpt: before, after_excerpt: after };
}

async function runLiveScan(root = DEFAULT_ROOT, options = {}) {
  const trackerRoot = path.join(root, TRACKER_DIR);
  const registerPath = path.join(trackerRoot, REGISTER_FILE);
  const configPath = path.join(trackerRoot, CONFIG_FILE);
  const reviewPath = path.join(trackerRoot, REVIEW_FILE);
  const register = readJson(registerPath);
  const config = readJson(configPath);
  const reviews = readJson(reviewPath, { schema_version: "1.0.0", decisions: {} });
  const catalogue = await scanCataloguePages(config);
  const allCataloguePagesSucceeded = catalogue.pageResults.every(page => page.status === "success");
  const scanTime = new Date().toISOString();

  const currentRecords = await mapWithConcurrency(register.records, options.concurrency || 4, async record => {
    const link = bestCatalogueLink(record, catalogue.links);
    if (!link || !link.url) return { ...record, scan_error: "No source URL or catalogue match", last_remote_check: scanTime };
    try {
      const response = await fetchWithRetry(link.url, { accept: "application/pdf,*/*", timeout: 120000 });
      const pdfBuffer = Buffer.from(await response.arrayBuffer());
      const extracted = extractPdfText(pdfBuffer);
      const detectedVersion = extractVersion(extracted.text, link.url) || record.nccp_version;
      const textHash = extracted.text ? sha256String(extracted.text) : null;
      const pdfHash = sha256Buffer(pdfBuffer);
      let snapshotPath = record.text_snapshot_path || null;
      if (extracted.text) {
        snapshotPath = path.posix.join(TRACKER_DIR, SNAPSHOT_DIR, `${record.nccp_regimen_code}-${textHash.slice(0, 16)}.txt`);
        if (options.write) {
          const absoluteSnapshot = path.join(root, snapshotPath);
          fs.mkdirSync(path.dirname(absoluteSnapshot), { recursive: true });
          if (!fs.existsSync(absoluteSnapshot)) fs.writeFileSync(absoluteSnapshot, `${extracted.text}\n`, "utf8");
        }
      }
      return {
        ...record,
        source_url: link.url,
        catalogue_page_url: link.catalogue_page_url || record.catalogue_page_url || "",
        catalogue_presence: Boolean(link.matched_from_catalogue),
        catalogue_presence_checked_at: scanTime,
        catalogue_match_url: link.matched_from_catalogue ? link.url : null,
        nccp_version: detectedVersion,
        pdf_sha256: pdfHash,
        extracted_text_sha256: textHash,
        text_snapshot_path: snapshotPath,
        remote_capture_status: "captured",
        source_status: "remote_source_captured",
        source_status_label: "Remote source captured",
        last_remote_check: scanTime,
        review_status: record.review_status === "awaiting_initial_remote_capture" ? "source_current_after_initial_capture" : record.review_status,
        extracted_text: extracted.text,
        extraction_available: extracted.available,
        extraction_error: extracted.error || ""
      };
    } catch (error) {
      return {
        ...record,
        catalogue_presence: Boolean(link.matched_from_catalogue),
        catalogue_presence_checked_at: scanTime,
        catalogue_match_url: link.matched_from_catalogue ? link.url : null,
        last_remote_check: scanTime,
        remote_capture_status: "scan_failed",
        source_status: "remote_scan_failed",
        source_status_label: "Remote scan failed",
        scan_error: String(error.message || error)
      };
    }
  });

  const matchedCatalogueUrls = new Set(currentRecords.map(record => record.catalogue_match_url).filter(Boolean));
  const unmatchedCatalogueLinks = catalogue.links.filter(link => !matchedCatalogueUrls.has(link.url));
  const discoveredRecords = await mapWithConcurrency(unmatchedCatalogueLinks, options.concurrency || 4, async link => {
    const code = link.code || inferCodeFromHref(link.url) || "unresolved";
    const base = {
      tracking_key: `catalogue:${sha256String(link.url).slice(0, 20)}`,
      protocol_id: "",
      protocol_path: "",
      tumour_group: link.tumour_group || link.catalogue_label || "Uncategorised",
      nccp_regimen_code: code,
      nccp_version: extractVersion("", link.url),
      title: link.title || "New NCCP source",
      short_title: link.title || "New NCCP source",
      indication: "",
      source_url: link.url,
      catalogue_page_url: link.catalogue_page_url || "",
      catalogue_presence: true,
      catalogue_presence_checked_at: scanTime,
      catalogue_match_url: link.url,
      source_status: "new_catalogue_source",
      source_status_label: "New catalogue source",
      remote_capture_status: "pending_capture",
      last_remote_check: scanTime,
      review_status: "awaiting_clinical_review",
      clinical_rule_update_status: "no_automatic_change_permitted"
    };
    try {
      const response = await fetchWithRetry(link.url, { accept: "application/pdf,*/*", timeout: 120000 });
      const pdfBuffer = Buffer.from(await response.arrayBuffer());
      const extracted = extractPdfText(pdfBuffer);
      const textHash = extracted.text ? sha256String(extracted.text) : null;
      let snapshotPath = null;
      if (extracted.text) {
        snapshotPath = path.posix.join(TRACKER_DIR, SNAPSHOT_DIR, `${code}-${textHash.slice(0, 16)}.txt`);
        if (options.write) {
          const absoluteSnapshot = path.join(root, snapshotPath);
          fs.mkdirSync(path.dirname(absoluteSnapshot), { recursive: true });
          if (!fs.existsSync(absoluteSnapshot)) fs.writeFileSync(absoluteSnapshot, `${extracted.text}\n`, "utf8");
        }
      }
      return {
        ...base,
        nccp_version: extractVersion(extracted.text, link.url) || base.nccp_version,
        pdf_sha256: sha256Buffer(pdfBuffer),
        extracted_text_sha256: textHash,
        text_snapshot_path: snapshotPath,
        remote_capture_status: "captured",
        extracted_text: extracted.text
      };
    } catch (error) {
      return { ...base, remote_capture_status: "scan_failed", scan_error: String(error.message || error) };
    }
  });

  for (const record of register.records) {
    if (record.text_snapshot_path) {
      const snapshotPath = path.join(root, record.text_snapshot_path);
      if (fs.existsSync(snapshotPath)) record.extracted_text = fs.readFileSync(snapshotPath, "utf8");
    }
  }

  const comparison = compareSourceStates(register.records, [...currentRecords, ...discoveredRecords], { allowRemoved: false });
  const changes = comparison.changes.map(change => {
    const excerpts = excerptAroundDifference(change.previous?.extracted_text || "", change.current?.extracted_text || "");
    const decision = reviews.decisions?.[change.change_id] || {};
    return {
      ...change,
      previous: compactRecord(change.previous),
      current: compactRecord(change.current),
      ...excerpts,
      review_status: decision.review_status || change.review_status,
      reviewer: decision.reviewer || "",
      reviewed_date: decision.reviewed_date || "",
      reviewer_note: decision.reviewer_note || "",
      sactcheck_release_applied: decision.sactcheck_release_applied || ""
    };
  });

  const updatedRecords = currentRecords.map(record => compactRecord(record));
  const summary = {
    tracked_protocols: updatedRecords.length,
    registered_source_urls: updatedRecords.filter(record => record.source_url).length,
    source_resolution_required: updatedRecords.filter(record => !record.source_url).length,
    changes_requiring_review: changes.filter(change => !["reviewed_no_action", "incorporated"].includes(change.review_status)).length,
    high_priority_changes: changes.filter(change => change.severity.level === "high").length,
    medium_priority_changes: changes.filter(change => change.severity.level === "medium").length,
    low_priority_changes: changes.filter(change => change.severity.level === "low").length,
    information_changes: changes.filter(change => change.severity.level === "info").length,
    review_required_changes: changes.filter(change => change.severity.level === "review").length,
    newly_discovered_catalogue_sources: discoveredRecords.length,
    current_after_remote_check: comparison.unchanged.length + comparison.initialCaptures.length,
    initial_captures_completed: comparison.initialCaptures.length,
    remote_scan_failures: updatedRecords.filter(record => record.remote_capture_status === "scan_failed").length,
    catalogue_pages_succeeded: catalogue.pageResults.filter(page => page.status === "success").length,
    catalogue_pages_failed: catalogue.pageResults.filter(page => page.status === "failed").length
  };

  const nextRegister = {
    ...register,
    generated_at: scanTime,
    generated_from: "live NCCP catalogue and source scan",
    tracked_protocol_count: updatedRecords.length,
    records: updatedRecords
  };
  const feed = {
    schema_version: "1.0.0",
    release: "0.62.0",
    generated_at: scanTime,
    scan: {
      status: summary.remote_scan_failures || summary.catalogue_pages_failed ? "completed_with_warnings" : "completed",
      status_label: summary.remote_scan_failures || summary.catalogue_pages_failed ? "Completed with warnings" : "Completed",
      mode: "live_remote_scan",
      last_completed_at: scanTime,
      message: changes.length ? "NCCP source changes require review." : "No source change requiring review was detected in the completed scan.",
      remote_comparison_completed: true,
      catalogue_pages: catalogue.pageResults
    },
    summary,
    changes,
    features: trackerFeatureExplanations(),
    safety_gate: buildInitialFeed(nextRegister).safety_gate
  };

  const report = renderMarkdownReport(feed);
  if (options.write) {
    writeJson(registerPath, nextRegister);
    writeJson(path.join(trackerRoot, STATE_FILE), feed);
    fs.writeFileSync(path.join(trackerRoot, REPORT_FILE), report, "utf8");
  }
  return { register: nextRegister, feed, report };
}

function renderMarkdownReport(feed) {
  const summary = feed.summary || {};
  const lines = [
    "# NCCP Change Tracker scan report",
    "",
    `Scan completed: ${feed.scan?.last_completed_at || "Not completed"}`,
    `Status: ${feed.scan?.status_label || feed.scan?.status || "Unknown"}`,
    "",
    "## Summary",
    "",
    `Tracked protocols: ${summary.tracked_protocols || 0}`,
    `Changes requiring review: ${summary.changes_requiring_review || 0}`,
    `High priority: ${summary.high_priority_changes || 0}`,
    `Medium priority: ${summary.medium_priority_changes || 0}`,
    `Low priority: ${summary.low_priority_changes || 0}`,
    `Remote scan failures: ${summary.remote_scan_failures || 0}`,
    "",
    "## Safety boundary",
    "",
    "A detected source change does not automatically modify any SACTCheck clinical rule. Clinical reconciliation, approval, testing and release are required.",
    ""
  ];
  if (!(feed.changes || []).length) {
    lines.push("## Changes", "", "No source change requiring review was detected.", "");
  } else {
    lines.push("## Changes", "");
    for (const change of feed.changes) {
      lines.push(
        `### ${change.nccp_regimen_code} ${change.title}`,
        "",
        `Type: ${change.change_type_label}`,
        `Priority: ${change.severity.label}`,
        `Review status: ${change.review_status}`,
        ""
      );
    }
  }
  return `${lines.join("\n")}\n`;
}

function defaultCatalogueConfig(root = DEFAULT_ROOT) {
  const existing = readJson(path.join(root, "data", "nccp-solid-tumour-catalogue-sources-v0510.json"), {});
  const solid = (existing.solid_tumour_catalogue_pages || []).map(page => ({ ...page, scope: "solid_tumour" }));
  const additional = [
    {
      label: "Plasma Cell Disorders",
      tumour_group: "Haemato Oncology",
      scope: "haematology",
      url: "https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/plasma-cell-disorders-sact-regimens/"
    }
  ];
  return {
    schema_version: "1.0.0",
    release: "0.62.0",
    national_catalogue_url: existing.national_catalogue_url || "https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/national-sact-regimens/",
    scope_note: existing.scope_note || "The published web catalogue is a surveillance source and is not assumed to contain every national regimen.",
    catalogue_pages: [...solid, ...additional]
  };
}

function buildBaselineFiles(root = DEFAULT_ROOT) {
  const trackerRoot = path.join(root, TRACKER_DIR);
  const register = buildSourceRegister(root);
  const feed = buildInitialFeed(register);
  const config = defaultCatalogueConfig(root);
  const reviewDecisions = {
    schema_version: "1.0.0",
    release: "0.62.0",
    instructions: "Add a decision only after authorised clinical review. This file never updates protocol rules automatically.",
    decisions: {}
  };
  writeJson(path.join(trackerRoot, REGISTER_FILE), register);
  writeJson(path.join(trackerRoot, STATE_FILE), feed);
  writeJson(path.join(trackerRoot, CONFIG_FILE), config);
  writeJson(path.join(trackerRoot, REVIEW_FILE), reviewDecisions);
  fs.writeFileSync(path.join(trackerRoot, REPORT_FILE), renderMarkdownReport(feed), "utf8");
  return { register, feed, config };
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "build-baseline";
  const rootArg = args.find(arg => arg.startsWith("--root="));
  const root = rootArg ? path.resolve(rootArg.slice("--root=".length)) : DEFAULT_ROOT;
  if (command === "build-baseline") {
    const result = buildBaselineFiles(root);
    console.log(`Built NCCP source register for ${result.register.tracked_protocol_count} protocols.`);
    return;
  }
  if (command === "scan") {
    const result = await runLiveScan(root, {
      write: args.includes("--write"),
      concurrency: Number((args.find(arg => arg.startsWith("--concurrency=")) || "").split("=")[1]) || 4
    });
    console.log(result.report);
    if (result.feed.summary.changes_requiring_review > 0) process.exitCode = 2;
    return;
  }
  throw new Error(`Unknown command: ${command}`);
}

if (require.main === module) {
  main().catch(error => {
    console.error(error.stack || error.message || error);
    process.exit(1);
  });
}

module.exports = {
  TRACKER_DIR,
  REGISTER_FILE,
  STATE_FILE,
  CONFIG_FILE,
  buildSourceRegister,
  buildInitialFeed,
  buildBaselineFiles,
  trackerFeatureExplanations,
  parsePdfLinks,
  compareSourceStates,
  severityFromText,
  excerptAroundDifference,
  normalisePdfText,
  extractVersion,
  inferCodeFromHref,
  renderMarkdownReport,
  runLiveScan
};
