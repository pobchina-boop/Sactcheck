# Fresh baseline browser review

This review exercised the actual locally built site from baseline **`2e5de4a6dd9e2fcbefa18623ff21db7b9eaec40b`**, release **0.84.33**, for the ten requested codes. It is a new execution for this batch's preservation review. It does **not** establish a current NCCP clinical-source audit, complete any new colorectal context, or validate a new release.

The source-blocked batch left application code, clinical rules, patient content and stored PDFs unchanged. The root rebuilt `_site` and passed site validation before these journeys ran.

## Executed checks

- **20/20 clinician journeys**: at 390×900 and 1440×900, selected the Gastrointestinal filter, searched the exact NCCP code, opened **Clinic workflow**, selected its visible assessment action, verified the selected code/context and rendered the result with initially blank user-entered fields.
- **100 HTML states** across patient portal, knowledge, discussion draft, one-page consent aid and supportive care: **90 responses were HTTP 200**. The five absent 00244 patient routes produced **10 HTTP 404 observations** across the two widths. Those missing routes remain completion gaps, not passing patient journeys.
- **66 distinct locally linked PDF downloads** returned HTTP 200 and `%PDF-` file signatures. This checks delivery, not clinical text, page layout, fonts, wallet dimensions or QR decoding; see the separate document/font reviews for those checks.
- **Zero** JavaScript page errors, failed local requests, failed journey assertions, broken rendered images or page-wide horizontal overflow in the observed existing states.
- All nine existing patient portals rendered the retained `anatomy-hcc-v0762.png` detailed anatomical illustration at both widths. No artwork or explanatory content was replaced.

Full observations, selected headings, visible context excerpts, input counts, missing-input result text, anatomy inventory and download routes are in [results.json](results.json). The reproducible review harness is [current-journeys.cjs](current-journeys.cjs). It follows the visible Clinic workflow controls; the legacy direct assessment button is intentionally hidden by the current interface.

## Context and completion findings

| Code | Existing patient presentation observed | Remaining context/output issue |
| --- | --- | --- |
| 00212 | Bevacizumab every 14 days, explicitly **breast treatment with paclitaxel** | This root patient service does not constitute a colorectal patient context. Preserve it while adding the separately verified colorectal context. |
| 00214 | Bevacizumab 7.5, explicitly **lung/first-line non-squamous NSCLC** | Its existing full handbook/reference are lung-specific, not evidence of colorectal completion. |
| 00215 | Bevacizumab every 21 days, explicitly **breast treatment** | Preserve this service and the separately existing lung context; a colorectal completion must not overwrite them. |
| 00244 | Assessment launches; five requested root patient surfaces absent | Patient, consent, reference, support and printable outputs remain outstanding. |
| 00382 | Existing **colorectal Lonsurf monotherapy** portal, explicitly excludes gastric and bevacizumab-combination contexts | Already has colorectal content; it is not a never-developed regimen. Its missing complete handbook/reference PDF and approved pack requirements remain completion work. |
| 00207 | Existing weekly cetuximab patient service | Repeat audit and complete offline-output upgrades remain pending current source review. |
| 00225 | Existing panitumumab patient service | Repeat audit and complete offline-output upgrades remain pending current source review. |
| 00328 | Existing weekly cetuximab + FOLFIRI service | Repeat component-specific decision audit and complete offline-output upgrades remain pending. |
| 00330 | Existing weekly cetuximab + irinotecan service | Repeat recovery/source-attribution audit and complete offline-output upgrades remain pending. |
| 00331 | Existing fortnightly cetuximab + irinotecan service | Repeat recovery/source-attribution audit and complete offline-output upgrades remain pending. |

The current site's legacy and newer patient presentations differ. Presentation standardisation must preserve regimen-specific clinical detail, anatomical anchoring, all phases, full consent/support material and the approved three-page pack. Presence of a working root URL is not evidence that the correct tumour-specific context or the complete offline handbook exists.

## Screenshots actually opened

These four original Chromium PNGs were opened using the image-view tool. Their hashes and viewport details are recorded in [results.json](results.json). The automated observations above cover more states than this manual visual inspection; no claim is made that all 120 rendered clinician/HTML states were manually inspected.

| Screenshot | Exact observation |
| --- | --- |
| [00328 mobile assessment](00328-assessment-mobile.png) | Scrolled view of the selected regimen and first blood-input area: preserved readable input cards and units. This frame is not evidence of the correctness of any threshold. |
| [00212 mobile patient portal](00212-patient-mobile-breast-context.png) | The actual title and treatment explanation explicitly identify breast/paclitaxel content. The protocol/version metadata is faint against the hero background. |
| [00214 desktop knowledge](00214-knowledge-desktop-lung-context.png) | The actual heading/context identifies lung/NSCLC content. The approved high-contrast personal-plan callout and topic disclosure remain visible. |
| [00382 desktop patient portal](00382-patient-desktop-existing-colorectal.png) | The existing colorectal monotherapy scope, tablet-week schedule and patient reference entry are visible. |

## Unresolved baseline findings

**Objective contrast defect:** the 00212 portal's `.wiki-hero .wiki-kicker` metadata uses `rgb(8,111,117)` at **12px** on its dark gradient. Same-row background samples from the rendered screenshot give **1.418–2.037:1**, below the **4.5:1** normal-text target. [DOM measurements](contrast-dom.json), [pixel/contrast calculation](contrast-finding.json), and [reproducible DOM probe](contrast-probe.cjs). A scoped light metadata colour on this hero is a concrete presentation correction for the cross-platform consistency work; it was not silently applied during this source-blocked clinical batch. The previously corrected pale personal-plan callout is a separate element.

**Missing-input wording observation:** blank user-entered assessments for 00212, 00214, 00215 and 00382 display **“No treatment criteria breached”**, alongside **“No value entered falls outside the protocol criteria. Unassessed fields remain unknown”** and **“Encoded rule coverage incomplete.”** Coverage reports respectively 39, 47, 44 and 28 unassessed domains in these observed default states. Other default selections can still evaluate some context rules. The presence of a rendered result is not treatment clearance. Whether the headline adequately communicates the incomplete assessment remains a clinical/usability review question; these browser checks do not establish source-correct eligibility or clinical safety.

## Checks not established here

Current official NCCP content, clinical boundary correctness, component hold/reduction/restart decisions, full PDF text/layout/QR validation and any deployed response are outside this browser preservation result. Current official sources and the canonical site remain blocked by the environment's proxy. No new clinical batch is marked complete.

Real iPhone/Safari, Android installation, camera scanning, physical printing/cutting, screen-reader behaviour, other browser engines and complete 200–400% zoom coverage were not performed. Current-source clinical review, independent clinical/pharmacy review and patient/PPI review remain required.
