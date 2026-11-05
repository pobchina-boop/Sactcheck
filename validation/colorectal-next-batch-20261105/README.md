# Colorectal batch preparation — 5 November 2026

**The clinical release is blocked by official-source access. No new context or repeat clinical audit is complete or counted.** The fetched baseline is `2e5de4a6dd9e2fcbefa18623ff21db7b9eaec40b`, v0.84.33, including the published readability/browser fixes. The initial checkout was clean. Independent preparation is preserved on `dev/colorectal-source-preflight-20261105`; main, clinical rules, patient content, PDFs and completion flags remain unchanged. The planned next patch is **v0.84.34**, held rather than written into active release metadata. See [release plan](release-plan.json).

## Exact source blocker

All ten regimen PDF requests, the official colorectal catalogue and the NCCP supportive-care PDF failed through the inherited HTTPS proxy with **CONNECT 403 Forbidden**. No current official PDF was downloaded. [Final access recheck](sources/final-access-recheck.json) still fails before finalization. These are proxy refusals before reaching NCCP, not an NCCP-origin 403 or confirmation that a document is absent.

[Timestamped requests and exact URLs](sources/access-attempts.json) and [active versus saved network configuration](sources/environment-status.json) retain the evidence. The running environment has an enforced restricted policy with no custom allowed hosts. A saved draft includes `healthservice.hse.ie`, `api.github.com` and `sactcheck.com`, but is not active; the catalogue also requires `www.hse.ie`. Available configuration tools save a draft for review and do not activate it on the running instance. No proxy/TLS bypass or alternate cached-PDF substitution was used.

Consequently, **current source versions, publication/review dates, PDF hashes and page/table findings cannot be supplied as verified**. The matrix retains existing encoded provenance with explicit unverified status. Fresh official retrieval and source review are required before any clinical rule change. The Actions API and canonical site are also blocked; GitHub's public web interface remains accessible.

## Reconciled scope and counts

The read-only [inventory](inventory.json), [backlog review](backlog-review.md) and [ten-context consistency matrix](consistency-matrix.md) join the actual indexed indications, current progress flags, patient audiences and existing files. [Full machine-readable matrix](consistency-matrix.json).

- Current encoded indications independently identify **41 candidate colorectal codes**; this matches the register, but is not a fresh national-catalogue reconciliation.
- The register still declares **31 completed software packages / 10 outstanding**. Nothing was incremented.
- Ten declared-complete routes lack required reference and handbook PDFs: **00207, 00225, 00328, 00330, 00331, 00447, 00585, 00692, 00732, 00733**. Only 21 declared-complete routes possess all required filenames. This is a file-presence result, **not a new clinically validated completion count**.

| Context | Current encoded context / outstanding work | This batch |
| --- | --- | --- |
| 00212 | CRC indication 00212a exists; existing patient service is breast + paclitaxel. Create a separate CRC context and preserve breast/other indications. | Source-blocked |
| 00214 | CRC indication 00214a exists with fluoropyrimidine-based chemotherapy; existing patient service is lung-specific. | Source-blocked |
| 00215 | CRC indication 00215d exists with fluoropyrimidine-based chemotherapy; breast root and separate lung context already exist. Do not infer CRC monotherapy from an old short title. | Source-blocked |
| 00244 | Existing CRC and GIST indications; dedicated patient bundle is absent. | Source-blocked |
| 00382 | CRC suite and retrospective work already exist from v0.84.24; reference/complete handbook and current presentation upgrade remain outstanding. | Existing-context upgrade; source-blocked |
| 00207 | Previous colorectal/source-schedule reviews exist. | New repeat audit blocked |
| 00225 | Previous colorectal/GI service reviews exist. | New repeat audit blocked |
| 00328 | Previous colorectal/GI reviews and component-hold finding exist. | New repeat audit blocked |
| 00330 | Previous colorectal/GI reviews and recovery/dose-attribution questions exist. | New repeat audit blocked |
| 00331 | Previous colorectal/GI reviews and recovery-attribution questions exist. | New repeat audit blocked |

The [read-only scanner](../../tools/colorectal-batch-readiness.cjs) and [eight readiness regressions](../../tests/colorectal-batch-readiness.test.cjs) make the reconciliation reproducible:

```bash
node tools/colorectal-batch-readiness.cjs --source-status blocked
node tests/colorectal-batch-readiness.test.cjs
```

An explicit `--report NEW_DIRECTORY --pdf-python /workspace/.sactcheck-tools/venv/bin/python` records a new report and geometry scan, refusing existing report files. The scanner cannot assert current-source verification or count file existence as clinical completion.

All five proposed completion contexts remain eligible under the current full-output requirement. Lonsurf is an upgrade of existing CRC work, not a never-developed regimen. If it were accepted as complete under the former narrower definition, 00455 is the next register candidate with an encoded CRC indication and lung-specific root services; no substitution is justified by calling its missing handbook complete.

## Fresh engine triage, with no clinical correction claimed

[1,200 fresh implementation observations](engine/results.json), [reproduction script](engine/engine-probe.cjs) and [detailed review](engine/REVIEW.md) exercise all ten current engines, actual units/ULN adapters, missing/invalid inputs, encoded numeric boundaries, assessment types, recurrence and prior-dose history. There were no engine crashes/evaluator errors. These are observations of existing behavior, **not 1,200 source-validated passing clinical cases**; isolated fields do not establish full decision coverage.

- **00328:** grade 2 diarrhoea at one week still holds only irinotecan in component rows; neither 5-FU component is held there. The separate two-week stopping rule covers the full FOLFIRI group. Retained v7 p5 Table 5 versus the current p3 attribution remains a source question. No correction was made without fresh evidence.
- **00330/00331:** current grade 1/2 still holds irinotecan; grade 0 reaches restart/review. Reconcile the added full-resolution restriction with the retained p3 Table 3 recovery wording and supplementary sources before relaxing anything.
- **00330:** the existing specialist-review guard still refuses a numeric cetuximab restart calculation from conflicting 400/300 mg/m² table values against weekly 250 mg/m² maintenance.
- **00214/00215:** creatinine multiple-of-ULN is manually entered without the automatic absolute-result adapter used for other fields. **00244:** rule-level source URLs are absent despite the protocol-level URL. Both are recorded for source/UI reconciliation.

Current-source boundary/component tests and full clinician/patient propagation remain unperformed. No new treatment recommendation or dose threshold is inferred from these traces.

## Rendering, presentation and new checks

[Font diagnosis](fonts/README.md) resolves the demonstrated renderer drift for four unchanged-document examples using explicit, hash-pinned per-document fonts, a shared `FontConfiguration`, the existing legacy print stylesheet and preserved SVG connector strokes. Four qualified profiles reproduce every word box at **0.0 pt difference**, with **7/7 raster pages identical**. Four deliberately wrong-font controls and three safety guards pass. New/mixed-font references still require individual qualification before replacement; no clinical PDF was replaced.

The actual rendered examples include the existing 00212 **breast** guide and 00214 **lung** three-page pack, not new CRC outputs. Detailed anatomy, numbered anchors, connectors, wallet panels, cutting instructions, QR and explicitly marked example contacts remain visible. [Anatomy comparison](fonts/00214-guide-DejaVu-pinned-p2.png), [wallet page](fonts/00214-guide-DejaVu-pinned-p3.png), [font-file/renderer manifest](fonts/renderer-manifest.json).

Fresh [browser review](browser/REVIEW.md) and [results](browser/results.json) cover actual Clinic workflow → assessment → blank-input results for all ten codes at **390×900 and 1440×900**, plus existing patient, consent, reference and support surfaces. Twenty clinician journeys, 100 HTML states and 66 unique linked PDF downloads were exercised. The ten expected missing states belong to absent 00244 patient surfaces; their absence is a gap. Download success and rendering do not establish clinical validity.

Representative screenshots were actually rendered and viewed:

| Exact observation | Screenshot |
| --- | --- |
| 00212 mobile: existing breast scope and faint legacy NCCP/version metadata | [PNG](browser/00212-patient-mobile-breast-context.png) |
| 00214 desktop: existing lung-specific reference and retained personal-plan readability | [PNG](browser/00214-knowledge-desktop-lung-context.png) |
| 00328 mobile: current assessment and readable input groups | [PNG](browser/00328-assessment-mobile.png) |
| 00382 desktop: existing explicit CRC monotherapy scope | [PNG](browser/00382-patient-desktop-existing-colorectal.png) |

The browser review records a pre-existing 00212 legacy metadata contrast failure and the wording of empty-input results separately from clinical assessment validity. These remain baseline findings; the batch does not silently change them or treat incomplete-input results as treatment clearance.

**Fresh software preservation CI passed:** literal `npm run test:ci`, exit 0, 532.876 seconds; its current definition expands to 269 command definitions. All 20 UI cases and 798 existing clinical regression cases were freshly rerun. The eight new readiness cases also pass, with zero skipped cases. All 977 critical inputs and 10,550 tracked files remained unchanged during validation; all 7,303 newly built public files match source. [Summary](ci/summary.json), [CI evidence](ci/README.md), [full log](ci/repository-ci-log.txt). Runtime: Node 24.22.1, npm 11.9.0 and Python 3.12.14. Node 20, configured in CI, was unavailable locally.

These are fresh software preservation results, not validation of new clinical content. Current-source clinical boundary validation remains unavailable. [Fresh document preservation checks](documents/README.md) pass for **87 PDFs / 199 pages**, including eight nested lung-context PDFs, with identical mirrors, unchanged baseline bytes and in-bounds text. **338 images** are unchanged. **28 actual QR decodes** (ten PNGs and 18 guide/card PDF rasters) match recorded same-code destinations and existing local targets. Live responses remain blocked.

Measured wallet geometry remains heterogeneous: 00214 uses the approved **85.6 × 54 mm** panels; seven legacy routes use **110 × 65 mm** and 00382 uses **110 × 55 mm**. Eight available root guides remain two pages, and 00244 has no patient bundle. Preserving those files does not make them compliant with the new CRC presentation requirements. These measurements and packaging differences supplement the static ten-context matrix; they must be addressed when source-verified CRC outputs are authored.

All preservation checks concern existing source/assets. They cannot validate new CRC content that has not been authored from current official sources. Real iOS/Android/Safari installation, camera scanning, physical printing/card cutting, formal screen-reader/PDF-UA behavior and live QR destinations remain unverified.

## Recovery and continuation

Before tracked changes, a unique dated recovery package was created outside the checkout:

`/workspace/sactcheck-recovery/20261105T142136.568427Z-next-colorectal-batch`

It contains the exact initial source archive, full Git bundle/refs, empty initial patches/untracked inventory, manifest, verified checksums and safe restore instructions. The archive's **10,550 files** match the baseline; the Git bundle verifies and all **18 checksum entries** pass. It preserves the initial published readability fixes. This package remains on the **same cloud storage**. Separately protected offline storage has **not** been created, and no earlier backup was overwritten.

AGENTS.md now records the ten-context consistency requirement, approved three-page/anatomical/wallet structure, per-document renderer qualification, recovery practice and the full cross-platform consistency audit across **every tumour group** required before overall MVP completion. The present inventory and browser sample do not complete that global audit.

Once official-source access works, re-fetch main, re-evaluate the planned patch version, retrieve/hash current PDFs and record dates/page-table evidence, resolve the three outstanding component/recovery questions, author source-derived boundary tests, implement each CRC-specific service without overwriting other indications, qualify every changed PDF, and run the complete current CI/browser/PDF/QR/visual gates. Only then commit/push the release to main and verify exact-SHA Actions/Pages plus canonical deployed assets. This source-blocked development branch is not a production release.

Copyable GitHub summary and description: [GITHUB_COMMIT.md](GITHUB_COMMIT.md).
