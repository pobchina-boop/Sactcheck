# Local validation — v0.81.8

Validation applies to the isolated v0.81.7-based repair checkout and built _site. It does not claim v0.81.8 has been pushed or deployed.

| Check | Result |
|---|---|
| npm run test:ci, complete sequence | PASS |
| release:gate including forward-version test | PASS |
| repository security check | PASS |
| protocols build and committed-generated-file drift gate | PASS |
| complete npm test chain | PASS |
| Pages build and security:site | PASS |
| Browser: 1440px desktop and 390px mobile, cold and warm | PASS |
| Complete action controls, guide PDF and clinic workflow | PASS |
| Ten repeated decoration calls plus settled 1-second idle observation | 0 card child-list mutations at both widths |
| ANC 0.8 alone in 00568 via browser | Partial assessment; treatment criteria not met; 18 domains unassessed |
| All 13 guides exactly two PDF pages | PASS |
| All 13 guide QR codes decoded from rendered PDFs | PASS |
| Canonical/compatibility guide bytes identical | PASS |
| Section-boundary check across 12 regenerated guides | PASS; anatomy starts 6 CSS px below medicines/schedule |
| Visual review of repaired 00209, 00722 and 00831 outputs | PASS for targeted overlap/copy repair |
| 00568 guide/passport/card, artwork, protocols and clinical engine | Unchanged from base commit |
| ZIP CRC/content integrity | PASS, checked after packaging |

The earlier baseline observed 54 mutations in one second on the 00568 card. The post-fix measurement includes a settling interval and ten explicit repeat-decorations, so it demonstrates idempotence and quiet settled behaviour; it is not a controlled performance benchmark or a claim about every device's load time.

Environment: Node 24.19.0 and headless Chromium 153. GitHub Pages specifies Node 20. Same repository test/build commands were run locally; the CI runtime itself must be confirmed after push.

Evidence files are included under validation/. To reproduce browser checks, install Playwright/Chromium in your development environment and run npm run test:ui-reliability. CHROMIUM_PATH optionally selects an installed Chromium executable; SACT_PLAYWRIGHT_MODULE optionally selects an existing Playwright module. SACT_SITE_DIR may point to _site to test the production build.

The test locates the actual 00568 ANC field jsonInput_anc_x10e9_l, correcting the selector limitation in the preceding audit. No clinical threshold was edited.
