/**
 * SACTCheck direct PDF generator.
 *
 * Builds a standard downloadable A4 PDF from the concise assessment model.
 * Routine assessments normally fit on one page; extensive entered data flows
 * onto additional pages without opening the browser print dialog.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SACTCheckAssessmentPdf = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "0.47.2";
  const PAGE_WIDTH = 595.28;
  const PAGE_HEIGHT = 841.89;
  const MARGIN = 34;
  const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);
  const FOOTER_HEIGHT = 25;
  const BOTTOM_LIMIT = PAGE_HEIGHT - MARGIN - FOOTER_HEIGHT;

  const COLOURS = Object.freeze({
    ink: [0.09, 0.20, 0.27],
    muted: [0.34, 0.43, 0.48],
    line: [0.79, 0.84, 0.87],
    pale: [0.96, 0.98, 0.99],
    blue: [0.15, 0.31, 0.40],
    green: [0.16, 0.46, 0.29],
    greenPale: [0.92, 0.97, 0.94],
    amber: [0.70, 0.43, 0.06],
    amberPale: [1.00, 0.97, 0.90],
    red: [0.61, 0.13, 0.17],
    redPale: [0.99, 0.93, 0.94],
    purple: [0.35, 0.25, 0.54],
    purplePale: [0.95, 0.93, 0.98],
    white: [1, 1, 1]
  });

  function cleanText(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim();
  }

  function asciiText(value) {
    const replacements = new Map([
      ["×", "x"], ["≥", ">="], ["≤", "<="], ["→", "->"], ["↔", "<->"],
      ["–", "-"], ["—", "-"], ["−", "-"], ["·", " | "], ["•", "-"],
      ["µ", "u"], ["μ", "u"], ["²", "^2"], ["³", "^3"], ["⁹", "^9"],
      ["’", "'"], ["‘", "'"], ["“", '"'], ["”", '"'], ["…", "..."],
      ["é", "e"], ["É", "E"], ["á", "a"], ["í", "i"], ["ó", "o"], ["ú", "u"]
    ]);
    let text = cleanText(value);
    replacements.forEach((replacement, source) => { text = text.split(source).join(replacement); });
    return text.replace(/[^\x20-\x7E]/g, "?");
  }

  function pdfEscape(value) {
    return asciiText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  }

  function number(value) {
    return Number(value).toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
  }

  function rgb(colour, stroke = false) {
    const values = colour.map(number).join(" ");
    return `${values} ${stroke ? "RG" : "rg"}`;
  }

  function approximateCharFactor(character) {
    if (character === " ") return 0.28;
    if (/[ilI1\.,:;'|!]/.test(character)) return 0.26;
    if (/[mwMW@%&]/.test(character)) return 0.82;
    if (/[A-Z]/.test(character)) return 0.62;
    if (/[0-9]/.test(character)) return 0.54;
    if (/[-+<>=\/()]/.test(character)) return 0.42;
    return 0.49;
  }

  function textWidth(value, fontSize, bold = false) {
    const text = asciiText(value);
    const factor = [...text].reduce((sum, character) => sum + approximateCharFactor(character), 0);
    return factor * fontSize * (bold ? 1.04 : 1);
  }

  function wrapText(value, maxWidth, fontSize, bold = false) {
    const text = asciiText(value);
    if (!text) return [""];
    const paragraphs = text.split(/\n+/);
    const lines = [];
    paragraphs.forEach((paragraph, paragraphIndex) => {
      const words = paragraph.split(/\s+/).filter(Boolean);
      let line = "";
      words.forEach(word => {
        const candidate = line ? `${line} ${word}` : word;
        if (textWidth(candidate, fontSize, bold) <= maxWidth) {
          line = candidate;
          return;
        }
        if (line) lines.push(line);
        if (textWidth(word, fontSize, bold) <= maxWidth) {
          line = word;
          return;
        }
        let fragment = "";
        [...word].forEach(character => {
          if (textWidth(fragment + character, fontSize, bold) > maxWidth && fragment) {
            lines.push(fragment);
            fragment = character;
          } else {
            fragment += character;
          }
        });
        line = fragment;
      });
      if (line || !words.length) lines.push(line);
      if (paragraphIndex < paragraphs.length - 1) lines.push("");
    });
    return lines.length ? lines : [""];
  }

  function safeFilename(value) {
    const stem = asciiText(value || "assessment")
      .replace(/[^A-Za-z0-9._-]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 80) || "assessment";
    return `SACTCheck_${stem}.pdf`;
  }

  function textCommand(text, x, top, options = {}) {
    const size = options.size || 9;
    const font = options.bold ? "F2" : "F1";
    const colour = options.colour || COLOURS.ink;
    const baseline = PAGE_HEIGHT - top - size;
    return `BT /${font} ${number(size)} Tf ${rgb(colour)} 1 0 0 1 ${number(x)} ${number(baseline)} Tm (${pdfEscape(text)}) Tj ET\n`;
  }

  function lineCommand(x1, y1, x2, y2, colour = COLOURS.line, width = 0.6) {
    return `${number(width)} w ${rgb(colour, true)} ${number(x1)} ${number(PAGE_HEIGHT - y1)} m ${number(x2)} ${number(PAGE_HEIGHT - y2)} l S\n`;
  }

  function rectCommand(x, top, width, height, options = {}) {
    const commands = [];
    if (options.fill) commands.push(rgb(options.fill));
    if (options.stroke) commands.push(rgb(options.stroke, true));
    if (options.lineWidth) commands.push(`${number(options.lineWidth)} w`);
    const operator = options.fill && options.stroke ? "B" : options.fill ? "f" : "S";
    commands.push(`${number(x)} ${number(PAGE_HEIGHT - top - height)} ${number(width)} ${number(height)} re ${operator}`);
    return `${commands.join(" ")}\n`;
  }

  function drawWrapped(page, value, x, top, maxWidth, options = {}) {
    const size = options.size || 9;
    const lineHeight = options.lineHeight || size * 1.25;
    const lines = wrapText(value, maxWidth, size, Boolean(options.bold));
    lines.forEach((line, index) => {
      page.commands += textCommand(line, x, top + (index * lineHeight), options);
    });
    return lines.length * lineHeight;
  }

  function drawRight(page, value, right, top, options = {}) {
    const width = textWidth(value, options.size || 9, Boolean(options.bold));
    page.commands += textCommand(value, Math.max(MARGIN, right - width), top, options);
  }

  function createPage() {
    return { commands: "", y: MARGIN };
  }

  function outcomePalette(key) {
    if (key === "met") return { border: COLOURS.green, fill: COLOURS.greenPale };
    if (key === "partial") return { border: COLOURS.amber, fill: COLOURS.amberPale };
    return { border: COLOURS.red, fill: COLOURS.redPale };
  }

  function resultPalette(key) {
    if (key === "met") return { text: COLOURS.green, fill: COLOURS.greenPale };
    if (key === "critical" || key === "hold") return { text: COLOURS.red, fill: COLOURS.redPale };
    if (key === "modify") return { text: COLOURS.amber, fill: COLOURS.amberPale };
    if (key === "review") return { text: COLOURS.purple, fill: COLOURS.purplePale };
    return { text: COLOURS.muted, fill: [0.94, 0.95, 0.96] };
  }

  function drawMainHeader(page, model) {
    page.commands += textCommand("SACTCHECK TREATMENT ASSESSMENT", MARGIN, page.y, { size: 7, bold: true, colour: COLOURS.blue });
    page.y += 11;
    const titleLines = wrapText(model.protocolTitle, CONTENT_WIDTH * 0.68, 15, true);
    titleLines.slice(0, 2).forEach((line, index) => {
      page.commands += textCommand(line, MARGIN, page.y + (index * 17), { size: 15, bold: true });
    });
    drawRight(page, model.sourceLabel, PAGE_WIDTH - MARGIN, page.y, { size: 8.5, bold: true, colour: COLOURS.blue });
    drawRight(page, `SACTCheck v${model.appVersion}`, PAGE_WIDTH - MARGIN, page.y + 12, { size: 7.5, colour: COLOURS.muted });
    page.y += Math.max(36, titleLines.slice(0, 2).length * 17 + 5);
    page.commands += lineCommand(MARGIN, page.y, PAGE_WIDTH - MARGIN, page.y, COLOURS.blue, 1.4);
    page.y += 8;
  }

  function drawContinuationHeader(page, model, label) {
    page.commands += textCommand("SACTCHECK TREATMENT ASSESSMENT", MARGIN, page.y, { size: 7, bold: true, colour: COLOURS.blue });
    drawRight(page, model.sourceLabel, PAGE_WIDTH - MARGIN, page.y, { size: 7.5, bold: true, colour: COLOURS.blue });
    page.y += 11;
    page.commands += textCommand(`${model.protocolTitle} - ${label}`, MARGIN, page.y, { size: 11, bold: true });
    page.y += 17;
    page.commands += lineCommand(MARGIN, page.y, PAGE_WIDTH - MARGIN, page.y, COLOURS.blue, 1);
    page.y += 8;
  }

  function drawMetaGrid(page, model) {
    const items = [
      ["Tumour group", model.tumourGroup],
      ["Indication", model.indication],
      ["Course", model.course],
      ["Treatment context", model.treatmentContext],
      ["Assessment ID", model.assessmentId],
      ["Assessment time", model.assessedAt]
    ];
    const columns = 3;
    const gap = 7;
    const cellWidth = (CONTENT_WIDTH - (gap * (columns - 1))) / columns;
    const rowHeight = 36;
    items.forEach((item, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = MARGIN + (column * (cellWidth + gap));
      const top = page.y + (row * (rowHeight + gap));
      page.commands += rectCommand(x, top, cellWidth, rowHeight, { fill: COLOURS.pale, stroke: COLOURS.line, lineWidth: 0.5 });
      page.commands += textCommand(item[0].toUpperCase(), x + 6, top + 5, { size: 5.8, bold: true, colour: COLOURS.muted });
      const lines = wrapText(item[1], cellWidth - 12, 7.4, true).slice(0, 3);
      lines.forEach((line, lineIndex) => {
        page.commands += textCommand(line, x + 6, top + 14 + (lineIndex * 8.3), { size: 7.4, bold: true });
      });
    });
    page.y += (rowHeight * 2) + gap + 9;
  }

  function drawOutcome(page, model) {
    const palette = outcomePalette(model.outcome.key);
    const titleLines = wrapText(model.outcome.title, CONTENT_WIDTH - 28, 10.5, true);
    const detailLines = wrapText(model.outcome.detail, CONTENT_WIDTH - 28, 7.8, false);
    const height = 14 + (titleLines.length * 12.5) + (detailLines.length * 9.5) + 8;
    page.commands += rectCommand(MARGIN, page.y, CONTENT_WIDTH, height, { fill: palette.fill, stroke: palette.border, lineWidth: 0.8 });
    page.commands += rectCommand(MARGIN, page.y, 5, height, { fill: palette.border });
    page.commands += textCommand("ENCODED CRITERIA RESULT", MARGIN + 12, page.y + 6, { size: 5.8, bold: true, colour: COLOURS.muted });
    let cursor = page.y + 15;
    titleLines.forEach(line => {
      page.commands += textCommand(line, MARGIN + 12, cursor, { size: 10.5, bold: true });
      cursor += 12.5;
    });
    detailLines.forEach(line => {
      page.commands += textCommand(line, MARGIN + 12, cursor, { size: 7.8 });
      cursor += 9.5;
    });
    page.y += height + 10;
  }

  function drawSectionHeading(page, title, rightText = "") {
    page.commands += textCommand(title.toUpperCase(), MARGIN, page.y, { size: 7.4, bold: true, colour: COLOURS.blue });
    if (rightText) drawRight(page, rightText, PAGE_WIDTH - MARGIN, page.y, { size: 6.8, colour: COLOURS.muted });
    page.y += 12;
  }

  const TABLE_COLUMNS = [112, 104, 146, CONTENT_WIDTH - 112 - 104 - 146];

  function drawTableHeader(page) {
    const labels = ["DOMAIN", "ENTERED VALUE", "ENCODED CRITERION", "RESULT"];
    let x = MARGIN;
    labels.forEach((label, index) => {
      page.commands += rectCommand(x, page.y, TABLE_COLUMNS[index], 18, { fill: [0.91, 0.94, 0.96], stroke: COLOURS.line, lineWidth: 0.45 });
      page.commands += textCommand(label, x + 4, page.y + 5.5, { size: 5.7, bold: true, colour: COLOURS.blue });
      x += TABLE_COLUMNS[index];
    });
    page.y += 18;
  }

  function tableRowHeight(row) {
    const values = [row.label, row.actual, row.criterion, row.outcome];
    const sizes = [7.0, 6.8, 6.7, 6.6];
    const lineCounts = values.map((value, index) => wrapText(value, TABLE_COLUMNS[index] - 8, sizes[index], index === 0).length);
    return Math.max(20, (Math.max(...lineCounts) * 8.4) + 8);
  }

  function drawTableRow(page, row) {
    const rowHeight = tableRowHeight(row);
    const values = [row.label, row.actual, row.criterion, row.outcome];
    const sizes = [7.0, 6.8, 6.7, 6.6];
    let x = MARGIN;
    values.forEach((value, index) => {
      const palette = index === 3 ? resultPalette(row.outcomeKey) : null;
      page.commands += rectCommand(x, page.y, TABLE_COLUMNS[index], rowHeight, {
        fill: palette?.fill || (index === 0 ? COLOURS.pale : COLOURS.white),
        stroke: COLOURS.line,
        lineWidth: 0.4
      });
      const lines = wrapText(value, TABLE_COLUMNS[index] - 8, sizes[index], index === 0);
      lines.forEach((line, lineIndex) => {
        page.commands += textCommand(line, x + 4, page.y + 5 + (lineIndex * 8.4), {
          size: sizes[index],
          bold: index === 0 || index === 3,
          colour: palette?.text || COLOURS.ink
        });
      });
      x += TABLE_COLUMNS[index];
    });
    page.y += rowHeight;
  }

  function dualSummaryMetrics(model) {
    const gap = 8;
    const firstWidth = CONTENT_WIDTH * 0.57;
    const secondWidth = CONTENT_WIDTH - firstWidth - gap;
    const unassessedLines = wrapText(model.unassessed, firstWidth - 14, 7.4, false);
    const decisionLines = wrapText(model.clinicianDecision, secondWidth - 14, 8.0, true);
    const noteLines = wrapText(model.clinicianNote, secondWidth - 14, 6.9, false);
    const height = Math.max(
      36 + (unassessedLines.length * 8.7),
      37 + (decisionLines.length * 9.4) + (noteLines.length * 8.1)
    );
    return { gap, firstWidth, secondWidth, unassessedLines, decisionLines, noteLines, height };
  }

  function drawDualSummary(page, model) {
    const { gap, firstWidth, secondWidth, unassessedLines, decisionLines, noteLines, height } = dualSummaryMetrics(model);
    page.commands += rectCommand(MARGIN, page.y, firstWidth, height, { fill: COLOURS.pale, stroke: COLOURS.line, lineWidth: 0.5 });
    page.commands += rectCommand(MARGIN + firstWidth + gap, page.y, secondWidth, height, { fill: COLOURS.pale, stroke: COLOURS.line, lineWidth: 0.5 });
    page.commands += textCommand("UNASSESSED DOMAINS", MARGIN + 7, page.y + 6, { size: 6, bold: true, colour: COLOURS.blue });
    unassessedLines.forEach((line, index) => page.commands += textCommand(line, MARGIN + 7, page.y + 17 + (index * 8.7), { size: 7.4 }));
    page.commands += textCommand("Blank domains were not assumed normal.", MARGIN + 7, page.y + height - 12, { size: 6.2, colour: COLOURS.muted });
    const secondX = MARGIN + firstWidth + gap + 7;
    page.commands += textCommand("CLINICIAN DECISION", secondX, page.y + 6, { size: 6, bold: true, colour: COLOURS.blue });
    let cursor = page.y + 17;
    decisionLines.forEach(line => {
      page.commands += textCommand(line, secondX, cursor, { size: 8.0, bold: true });
      cursor += 9.4;
    });
    noteLines.forEach(line => {
      page.commands += textCommand(line, secondX, cursor, { size: 6.9, colour: COLOURS.muted });
      cursor += 8.1;
    });
    page.y += height + 9;
  }

  function drawDisclaimer(page, model) {
    const title = "CLINICAL DECISION SUPPORT - NOT TREATMENT CLEARANCE";
    const lines = wrapText(model.disclaimer, CONTENT_WIDTH - 16, 6.8, false);
    const height = 26 + (lines.length * 8.1);
    page.commands += rectCommand(MARGIN, page.y, CONTENT_WIDTH, height, { fill: COLOURS.redPale, stroke: COLOURS.red, lineWidth: 0.6 });
    page.commands += textCommand(title, MARGIN + 8, page.y + 7, { size: 6.2, bold: true, colour: COLOURS.red });
    lines.forEach((line, index) => page.commands += textCommand(line, MARGIN + 8, page.y + 17 + (index * 8.1), { size: 6.8 }));
    page.y += height + 5;
  }

  function ensureSpace(state, height, continuationLabel) {
    if (state.page.y + height <= BOTTOM_LIMIT) return false;
    state.pages.push(createPage());
    state.page = state.pages[state.pages.length - 1];
    drawContinuationHeader(state.page, state.model, continuationLabel || "Assessment summary continued");
    return true;
  }

  function layout(model) {
    const state = { model, pages: [createPage()], page: null };
    state.page = state.pages[0];
    drawMainHeader(state.page, model);
    drawMetaGrid(state.page, model);
    drawOutcome(state.page, model);
    drawSectionHeading(state.page, "Entered values and encoded criteria", model.assessmentProfile);
    drawTableHeader(state.page);

    const rows = Array.isArray(model.allRows) && model.allRows.length ? model.allRows : (model.rows || []);
    if (!rows.length) {
      const empty = { label: "No entered value", actual: "-", criterion: "No printable criterion row generated", outcome: "Not assessed", outcomeKey: "recorded" };
      drawTableRow(state.page, empty);
    } else {
      rows.forEach(row => {
        const rowHeight = tableRowHeight(row);
        const newPage = ensureSpace(state, rowHeight + 6, "Entered values and encoded criteria continued");
        if (newPage) drawTableHeader(state.page);
        drawTableRow(state.page, row);
      });
    }

    state.page.y += 9;
    const summaryEstimate = dualSummaryMetrics(model).height + 9;
    ensureSpace(state, summaryEstimate, "Assessment documentation");
    drawDualSummary(state.page, model);

    const disclaimerLines = wrapText(model.disclaimer, CONTENT_WIDTH - 16, 6.8, false).length;
    const disclaimerHeight = 31 + (disclaimerLines * 8.1);
    ensureSpace(state, disclaimerHeight, "Clinical safety statement");
    drawDisclaimer(state.page, model);

    state.pages.forEach((page, index) => {
      const footerY = PAGE_HEIGHT - MARGIN - 15;
      page.commands += lineCommand(MARGIN, footerY - 5, PAGE_WIDTH - MARGIN, footerY - 5, COLOURS.line, 0.45);
      page.commands += textCommand("Clinical decision support - verify against the current NCCP protocol.", MARGIN, footerY, { size: 5.8, colour: COLOURS.muted });
      drawRight(page, `Page ${index + 1} of ${state.pages.length}`, PAGE_WIDTH - MARGIN, footerY, { size: 5.8, bold: true, colour: COLOURS.muted });
    });

    return state.pages;
  }

  function buildPdf(pages, model) {
    const objects = [];
    const pageObjectIds = [];
    const contentObjectIds = [];
    let nextId = 5;
    pages.forEach(() => {
      pageObjectIds.push(nextId++);
      contentObjectIds.push(nextId++);
    });
    const infoId = nextId;

    objects[1] = `<< /Type /Catalog /Pages 2 0 R >>`;
    objects[2] = `<< /Type /Pages /Count ${pages.length} /Kids [${pageObjectIds.map(id => `${id} 0 R`).join(" ")}] >>`;
    objects[3] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`;
    objects[4] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`;

    pages.forEach((page, index) => {
      const pageId = pageObjectIds[index];
      const contentId = contentObjectIds[index];
      const stream = page.commands;
      objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${number(PAGE_WIDTH)} ${number(PAGE_HEIGHT)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`;
      objects[contentId] = `<< /Length ${stream.length} >>\nstream\n${stream}endstream`;
    });

    const title = pdfEscape(`SACTCheck - ${model.protocolTitle}`);
    objects[infoId] = `<< /Title (${title}) /Subject (Clinical decision-support assessment summary) /Creator (SACTCheck v${pdfEscape(model.appVersion)}) /Producer (SACTCheck direct PDF generator v${VERSION}) >>`;

    let pdf = "%PDF-1.4\n%SACTCheck\n";
    const offsets = [0];
    for (let id = 1; id <= infoId; id += 1) {
      offsets[id] = pdf.length;
      pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
    }
    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${infoId + 1}\n0000000000 65535 f \n`;
    for (let id = 1; id <= infoId; id += 1) {
      pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${infoId + 1} /Root 1 0 R /Info ${infoId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

    const bytes = new Uint8Array(pdf.length);
    for (let index = 0; index < pdf.length; index += 1) bytes[index] = pdf.charCodeAt(index) & 0xff;
    return bytes;
  }

  function buildPdfBytes(model) {
    if (!model || typeof model !== "object") throw new TypeError("A SACTCheck assessment-output model is required.");
    return buildPdf(layout(model), model);
  }

  function estimatePageCount(model) {
    if (!model || typeof model !== "object") return 0;
    return layout(model).length;
  }

  function download(model, filenameStem) {
    const bytes = buildPdfBytes(model);
    const filename = safeFilename(filenameStem || model.assessmentId || model.protocolCode || "assessment");
    if (typeof Blob === "undefined" || typeof document === "undefined" || typeof URL === "undefined") {
      return { bytes, filename, pageCount: estimatePageCount(model) };
    }
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    root.setTimeout?.(() => URL.revokeObjectURL(url), 1500);
    return { bytes, filename, pageCount: estimatePageCount(model) };
  }

  return Object.freeze({
    version: VERSION,
    buildPdfBytes,
    estimatePageCount,
    download,
    safeFilename,
    asciiText,
    wrapText
  });
});
