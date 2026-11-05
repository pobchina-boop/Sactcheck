# Colorectal catalogue and current-source review — v0.84.36

Reviewed 5 November 2026. This evidence folder is read-only with respect to application, protocol and patient content. It reconciles the public catalogue and refreshes source provenance; it does not claim a new full clinical audit of all 41 contexts.

## Finding

The current official NCCP gastro-intestinal page contains **41 regimen codes with explicit colorectal indications**, and these exactly match the project's 41 candidate colorectal contexts. The oral medicines page contributes seven of those same codes and no additional explicit colorectal code. Independently scanning all 377 encoded protocol indication texts yields the same 41. No omitted public-catalogue colorectal regimen code or non-colorectal misclassification was identified by this reconciliation.

The GI page uses two different structures: expandable sections and legacy heading sections. The parser retains both. There are 94 extracted regimen sections overall, and the parser accounts for every five-digit regimen code on the GI, oral and tumour-agnostic pages; code 00382 (Lonsurf) is in the trailing legacy section and would be missed by an expander-only query. The source HTML, extracted sections and reconciliation output are retained so this result can be reproduced. The oral list also contains 00390 idelalisib/ofatumumab without a PDF link; its explicit CLL indications exclude it from CRC, and the parser retains the entry instead of dropping unlinked codes.

The national NCCP page explicitly says its public regimen list is incomplete. Consequently, this result supports completion of **the 41 currently identified, publicly listed colorectal regimen contexts**, not a claim that every possible colorectal treatment, local pathway, trial or funded/off-label option is represented.

## Current sources and prior clinical audits

Thirty-nine primary NCCP PDFs were freshly downloaded once each from their metadata URLs, with public HTTPS redirects followed, inherited proxy settings, TLS verification retained and HTTP 200 recorded. Every one is byte-identical to its retained v0.84.32–v0.84.35 audit PDF. The source version read from each new PDF also matches the protocol's recorded NCCP version. No changed primary source was identified that would trigger a source-change investigation in these 39 documents.

The other two sources, 00216 and 00692, were freshly retrieved by their separate v0.84.36 clinical audit owners. The matrix references those retained PDFs without issuing duplicate requests. Their audit folders hold the new source-to-rule findings and current software checks. Catalogue freshness alone never establishes completion of those full audits or their associated suite outputs.

All 39 direct retrievals have full URLs, effective redirected URLs, request timestamps, byte counts, page counts, versions and SHA-256 hashes in `sources.json`. `41-context-source-audit-matrix.json` links each of the 41 contexts to its source and attributable prior audit. The Markdown matrix is the readable index. Saved historical scenario counts are explicitly historical and are not a new v0.84.36 test run, a count of distinct defects or an exhaustive clinical validation claim.

Provenance qualifications:

- 00551, 00890 and 00900 lack `metadata.source_pdf_sha256` in the input snapshot. Their new bytes match the separate v0.84.35 source manifests and retained PDFs exactly. This metadata omission does not mean no source audit exists.
- 00455 and 00558 retain the shared generic `source_checked_date` of 29 October. Their explicit v0.84.35 colorectal source audit and current fresh binary evidence are dated 5 November. The matrix records both rather than incorrectly labelling the CRC work stale or silently overwriting another context's history.
- 00215 has two current official URLs: the protocol uses `/documents/6940/00215_Bevacizumab_15.pdf`, whereas the GI page links `/documents/6555/00215_Bevacizumab_15_knZhA52.pdf`. Both retrieve the same v7 bytes and SHA `b3513f22656e693a78b1434179916a480bef73698b155bfa363b98d48b40d5fc`. The second download is necessary alias verification, not a duplicate unrecorded refresh. See `catalogue-link-discrepancies.json`.
- The old `data/colorectal-suite-progress-v0832.json` still declares release 0.84.33 and contains historical full-suite flags. Its retained snapshot is reported separately. These flags are not used to negate later v34/v35 source audits or to infer current complete service delivery.

## Inclusion and exclusion boundaries

A context is counted once per NCCP regimen code with an explicit colorectal indication, even if the source also covers other tumour groups. This includes capecitabine, bevacizumab, cetuximab, pembrolizumab and the shared 00551 nivolumab/ipilimumab source. Separate indication, stage, line, biomarker and combination requirements remain necessary within each context.

In particular, shared bevacizumab 00212/00214/00215 sources specify colorectal use with fluoropyrimidine-based chemotherapy. Their service presence must not imply a complete bevacizumab-only colorectal prescription; the actual partner regimen requires its own assessment. Similarly, first-line 00900 and previously treated 00551 retain different colorectal eligibility. A single shared drug does not justify merging these contexts.

The catalogue also includes non-colorectal GI treatment, which is correctly outside these 41: anal regimens 00451/00594/00727; pancreatic regimens such as 00523/00505/00329/00515; oesophageal chemoradiation 00509; and gastric, gastro-oesophageal, hepatobiliary and neuroendocrine regimens. Drug overlap (for example 5-FU, capecitabine or oxaliplatin) does not convert their indication into colorectal treatment. Nivolumab monotherapy 00483/00484 is not independently counted from its oesophageal GI catalogue indication; the applicable CRC maintenance phase is part of the colorectal combination suite and must retain its source-specific schedule restrictions.

The current tumour-agnostic page separately lists adult entrectinib 00702 and adult larotrectinib 00758 for eligible NTRK-fusion solid tumours, plus paediatric larotrectinib 00760. A qualifying colorectal tumour may overlap a tumour-agnostic indication; that is an inference from the stated solid-tumour scope, not a new CRC-specific NCCP listing. These shared molecular contexts require separate cross-tumour inventory and service checks and are **not** claimed completed by this 41-context colorectal count. The relevant official page, indications and links are retained in `tumour-agnostic-listing-extracted.json`.

## Clinical limits retained

Unchanged source bytes retain all prior source ambiguities and consultant/pharmacy decisions. Examples include FOLFIRI recovery-window conflicts, 5-FU exact hepatic boundaries, regimen-specific renal exclusions versus dose tables, the 00330 weekly cetuximab restart-dose inconsistency, regorafenib printed blood-pressure/food wording, and 00551 maintenance-schedule differences. The existing source-to-rule audits remain the reference; no ambiguity was resolved by a generic shared rule in this catalogue review.

Independent consultant and oncology-pharmacy review, clinical-use authorisation, full interaction assessment, patient/PPI review, cross-tumour consistency and live deployment/device verification are separate requirements. This folder establishes neither those approvals nor whole-suite visual/PDF quality. The release integrator owns the complete service-consistency and regression results.

## Reproduction

Run from the repository root with Python 3, PyMuPDF and lxml available:

```sh
python3 validation/colorectal-v08436/catalogue-source-review/reconcile-catalogues.py
python3 validation/colorectal-v08436/catalogue-source-review/refresh-sources.py
python3 validation/colorectal-v08436/catalogue-source-review/build-matrix.py
python3 validation/colorectal-v08436/catalogue-source-review/verify-evidence.py
```

The catalogue script parses retained HTML; it fetches only missing page files. The PDF refresh script reuses successfully recorded PDFs by default. `--refresh` deliberately requests a new set and must be used only when a fresh retrieval is intended; historical retained provenance should be preserved before doing so. The verification command performs no network requests and checks exact file hashes, counts, versions, catalogue coverage and prior-PDF equality. These scripts do not modify clinical/application files.

Primary public pages:

- https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/gastro-intestinal-sact-regimens/
- https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/oral-anti-cancer-medicines-sact-regimens/
- https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/tumou-agnostic-therapy-sact-regimens/
- https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/national-sact-regimens/
