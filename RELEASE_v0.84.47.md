# SACTCheck v0.84.47 — head and neck, five new suites plus five repeat audits

Manual update over v0.84.46, commit `a47e75b2765fdb10f5795152c0866f016aceb14e`.
No commit, push, merge or deployment was performed for this update. This is a
source-reconciled feasibility build, with independent clinical, pharmacy and
patient/PPI review still pending.

## Apply the update

Extract the ZIP and copy its repository files into your existing Sactcheck
checkout, replacing matching files. Keep the existing repository folder and
`.git` directory. Do not upload the ZIP itself as the website. The update is
based on v0.84.46; apply earlier updates first if your checkout is older.
Review the changes, commit with the summary/description below, then push using
your usual method. Successful GitHub Pages deployment is a separate step.

## Five new full services

| NCCP | Service | Important distinction |
|---|---|---|
| 00314 | Cisplatin + fluorouracil, every 28 days | Divided cisplatin on days 1–4; daily 22-hour fluorouracil; no invented fixed course |
| 00552 | Carboplatin AUC 5 + fluorouracil, every 28 days | Adjuvant nasopharyngeal pathway after chemoradiation; up to three cycles |
| 00417 | Cetuximab + cisplatin + fluorouracil | Up to six combination cycles; weekly cetuximab; separate continuation decision |
| 00418 | Cetuximab + carboplatin + fluorouracil | Its own renal, haematological and infusion instructions retained |
| 00696 | Paclitaxel days 1/8/15 + cetuximab days 1/15 | 28-day ongoing treatment; day 8 has a paclitaxel-only support plan |

These are five newly serviced existing catalogue protocols, not five new
protocol entries. The catalogue remains 377 protocols. There are now 244
authored patient routes. At least one dedicated head-and-neck service exists
for 15 of the 30 head-and-neck protocol families; 15 families still lack one.
This availability count does not establish independent approval or completion
of every possible indication. See `validation/head-neck-v08447/coverage.json`.

## Five retrospective audits

Weekly cisplatin/radiotherapy (00385), three-weekly cisplatin/radiotherapy
(00387), cetuximab/radiotherapy (00207), pembrolizumab/carboplatin/fluorouracil
(00705), and pembrolizumab/cisplatin/fluorouracil (00706) were checked again
against freshly retrieved NCCP documents. Applicable changes also reach the
00385 nasopharyngeal and 00207 root patient routes: 12 affected patient routes
in total. Earlier audit metadata remains historical evidence, with the new
audit recorded separately.

## Clinical findings and resulting behaviour

- The 00314 schedule now correctly divides cisplatin across days 1–4. Baseline
  eligibility, on-treatment thresholds and prior nadirs are distinct.
- Renal and liver actions remain regimen-specific. Printed overlaps, exact
  equality boundaries and fractional gaps request interpretation instead of
  selecting an unsupported dose. Numeric renal values and older selected
  bands are checked for contradictions.
- The platinum/fluorouracil cytopenia actions in 00417/00418 target those
  medicines; they do not automatically reduce cetuximab. Conditional reductions
  remain consultant decisions.
- Cetuximab skin-reaction recurrence, recovery, timing and prior permanent-stop
  history are retained. Conflicting intolerability/recovery inputs cannot
  generate an automatic restart dose. Suspected and confirmed interstitial
  lung disease remain different pathways.
- DPD status and renal effects on uracil-based phenotype interpretation are
  represented where the particular source supports them. They are not silently
  attributed to older documents that do not contain that advice.
- Pembrolizumab baseline immunosuppression and contradictory severe/controlled
  endocrine toxicity now have explicit source-based review/hold pathways.
- 00696 is correctly mapped to low emetogenic risk. Day-8 premedication is
  separated from the cetuximab combination visits. A steroid from another
  phase is not carried over automatically.
- The four-day cisplatin support prescription is deliberately left for an
  individual plan where the generic NCIS multi-day table is not an exact
  match. No unsupported duration or dose schedule has been filled in.
- The NCCP/EMA cetuximab observation discrepancy is recorded explicitly. The
  patient material does not promise shorter later visits. Maintenance is not
  misrouted to the separate radiotherapy-only cetuximab patient service.

The clinical migration binds all ten current protocol files to the exact
v0.84.46 baseline, source PDFs, extracted text and executed cases. There are
1,051 new checks (280 + 387 + 384). The retrospective cases identify 43 failing
scenarios in the old baseline across five finding groups; the current versions
pass. These checks are not a substitute for independent clinical approval.

## Complete patient and clinician outputs

Every affected service includes the clinical decision tool, clinician knowledge,
consent, monitoring, phase support, patient portal, OncoWiki, passport, distilled
three-page pack, wallet card and current-standard complete handbook. The first
three portal sections remain schedule/checks, detailed anatomical toxicity
anchoring, then card/contacts. The full handbook is separate and retains unique
clinical and practical content in a logical offline sequence.

The detailed anatomical artwork, readable type, front/back card dimensions,
cut/fold instructions and automatic regimen QR destinations are retained.
Spacing corrections were limited to four new packs; no whole-catalogue
redesign was made. Contacts remain clearly labelled examples for the team to
replace before patient use. Haematology stays hidden; its code is preserved.

PDF evidence covers 136 unique documents / 851 pages and 272 matching
canonical/download files. All 12 scoped handbooks passed the independent
verifier, including 60 preserved-page checks and 24 PDF QR checks. The 88
ancillary documents passed 2,794 exact source-unit checks and 12 PDF QR checks;
the pack checks include 48 PNG/PDF QR checks. Thirteen representative pages
were visually reviewed. This is not a claim that every page was visually read.

## Validation and limits

All CI stages passed. The full `npm run test:ci` run stopped at an older NET
version check; after adding v0.84.47 to six historical test-version lists and bounding
historical PDF reads to avoid the process-output limit, the affected stages
and every remaining stage passed. The successful prefix
was not repeated: application code/assets were unchanged. The logs retain
the initial exit code and the resumed stage results. Build, site-security,
63 internal HTTP checks and four handbook chronology/print checks also passed.

The final command results and logs are in
`validation/head-neck-v08447/regression-final.json`; per-route checks are in
`consistency-matrix.json`, and PDF/source evidence is retained alongside them.
The source and artifact migration protects unrelated routes and anatomical
assets against the exact published baseline.

Managed Chromium checks exercised the patient entry, anatomical detail,
OncoWiki disclosure, phase support, and platelet boundaries. A 340 CSS-pixel
view was inspected through desktop zoom. The separate automated browser suite
could not launch Chromium because its socket operation was denied by this
environment. That suite and real iPhone/Android installation, camera scanning
and physical printing are not reported as passed. The available local runtime
was Node 24.22.1; repository CI uses Node 20.

At verification, the canonical live site still reported v0.84.44. Sample
00696 and existing-in-repository 00387 patient URLs returned 404. The QR contents
are correct for their intended routes, but live availability requires the
corresponding successful Pages deployment. This package does not declare the
site live. A local recovery bundle was made before changes; no independently
protected offline backup was created in this task.

## GitHub commit summary

```text
v0.84.47: add five head-and-neck suites and audit five existing services
```

## GitHub commit description

```text
Add full suites for NCCP 00314, 00552, 00417, 00418 and 00696, including current-standard handbooks, three-page patient packs, detailed anatomical toxicity maps, wallet cards and regimen QR codes.

Repeat source audits for 00385, 00387, 00207, 00705 and 00706. Correct divided cisplatin scheduling, component-specific blood-count and organ-function actions, ambiguous boundaries, DPD interpretation, cetuximab restart/stop safeguards and pembrolizumab input conflicts. Separate day-8 paclitaxel support from combination visits.

Carry findings through clinician knowledge, consent, monitoring, support and 12 affected patient routes. Preserve haematology hiding and unrelated patient assets. Retain exact source, migration, PDF and regression evidence, with browser/device and live-deployment limitations explicitly recorded. Independent clinical/pharmacy/PPI approval remains pending.
```
