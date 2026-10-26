# SACTCheck v0.51.0 Solid Tumour Reconciliation

**Reconciliation date:** 2026-07-29  
**Indexed catalogue:** 377 protocols (362 Solid Tumour and 15 Haematology)  
**Automated structural result:** PASS

## Scope and boundary

This release reconciles the current SACTCheck solid tumour repository against the current published NCCP tumour-group catalogue structure, source links and stored source metadata. The NCCP states that the list on its website is not comprehensive, so this report does not claim that every possible national regimen is published online. It also does not replace protocol-by-protocol consultant and oncology-pharmacy validation of the encoded clinical rules.

## Catalogue counts

There are **362 unique Solid Tumour protocol files**. Five shared protocols are intentionally cross-listed across more than one tumour site, so tumour-site coverage counts are placements and may total more than 362.

### Unique protocol files by primary storage group

| Primary storage group | Unique protocols |
|---|---:|
| Breast | 80 |
| Cross-listed/shared | 5 |
| Gastrointestinal | 85 |
| Genitourinary | 48 |
| Gynaecology | 35 |
| Head and Neck | 21 |
| Lung | 48 |
| Neuro-oncology | 10 |
| Neuroendocrine | 1 |
| Sarcoma | 19 |
| Skin/Melanoma | 9 |
| Tumour Agnostic Therapy | 1 |

### Tumour-site coverage

| Tumour site | Protocol placements |
|---|---:|
| Breast | 84 |
| Gastrointestinal | 93 |
| Genitourinary | 67 |
| Gynaecology | 48 |
| Head and Neck | 30 |
| Lung | 59 |
| Lymphoma | 2 |
| Neuro-oncology | 10 |
| Neuroendocrine | 3 |
| Sarcoma | 25 |
| Skin/Melanoma | 16 |
| Tumour Agnostic Therapy | 2 |

## Automated checks

| Check | Result |
|---|---:|
| Duplicate protocol IDs | 0 |
| Duplicate NCCP codes | 0 |
| Duplicate indexed paths | 0 |
| Duplicate official source URLs | 0 |
| Orphaned protocol JSON files | 0 |
| Non-HSE source URLs | 0 |
| Unspecified source versions | 0 |
| Protocols with forced launch inputs | 0 |
| Statically required input fields | 0 |
| Protocols without partial-assessment flag | 0 |
| Protocols missing v0.51.0 reconciliation metadata | 0 |

## Explicit source-version resolutions

Twelve protocols previously labelled only as `current` now carry the explicit version shown in the current official NCCP PDF. Stable internal IDs were retained to avoid breaking existing bookmarks.

| NCCP code | Version | Published | Review / last reviewed |
|---|---:|---:|---:|
| 00200 | 8 | 2014-02-10 | 2021-07-21 |
| 00206 | 5 | 2015-10-01 | 2021-07-28 |
| 00217 | 7 | 2015-01-11 | 2031-04-21 |
| 00232 | 5 | — | 2030-11-11 |
| 00250 | 9 | 2015-04-29 | 2026-04-01 |
| 00252 | 7 | 2015-04-29 | 2021-05-12 |
| 00253 | 6 | 2014-11-01 | 2030-12-19 |
| 00254 | 5 | — | 2030-12-19 |
| 00259 | 6 | — | review as required from 2026-05-20 |
| 00260 | 7 | — | — |
| 00262 | 8 | 2015-04-29 | 2021-05-12 |
| 00263 | 7 | 2015-04-29 | 2021-05-12 |
| 00265 | 7 | — | — |
| 00269 | 8 | — | — |
| 00278 | 7 | — | — |
| 00322 | 4 | 2016-05-03 | 2030-06-13 |
| 00361 | 4 | 2016-11-11 | 2031-01-20 |
| 00371 | 4 | 2016-11-11 | 2031-02-23 |
| 00376 | 4 | 2016-11-11 | 2031-01-20 |
| 00377 | 6 | — | — |
| 00378 | 6 | — | — |
| 00381 | 6 | — | — |
| 00423 | 5 | 2017-07-07 | 2021-06-23 |
| 00430 | 6 | 2017-07-07 | 2031-04-01 |
| 00432 | 5 | — | — |
| 00605 | 2 | 2021-05-01 | 2028-09-06 |
| 00619 | 4a | 2024-05-31 | 2030-08-11 |
| 00688 | 2a | 2022-01-20 | 2027-12-16 |
| 00720 | 2 | — | — |
| 00738 | 3 | 2022-07-11 | 2029-01-31 |
| 00749 | 3 | 2024-08-26 | 2030-08-28 |
| 00794 | 3 | 2024-02-23 | 2030-03-04 |
| 00936 | 1 | 2026-02-18 | 2027-02-18 |
| 00947 | 1 | 2026-08-04 | 2027-08-04 |

## Partial-assessment standardisation

All 362 indexed solid tumour protocols now use the platform policy that every entered value is assessed independently. No static field, profile or phase is required merely to launch an assessment. Missing domains remain unassessed and are never assumed normal. Conditional follow-on fields may still be requested when a clinician enters a trigger that requires additional context.

## Governance metadata backlog

These are not automated release failures, because older NCCP documents do not use a uniform publication/review header and many encodings pre-date the structured metadata model. They remain an explicit manual source-review queue.

- Missing stored publication date: **250** (00202, 00230, 00254, 00258, 00260, 00265, 00269, 00278, 00316, 00377, 00378, 00381, 00414, 00432, 00433, 00485, 00525, 00526, 00545, 00659 … plus 230 more)
- Missing stored review or last-reviewed date: **239** (00202, 00230, 00258, 00260, 00265, 00269, 00278, 00316, 00377, 00378, 00381, 00432, 00433, 00485, 00545, 00659, 00720, 00736, 00743, 00745 … plus 219 more)
- Source document not explicitly marked as manually checked: **161** (00212, 00205, 00256, 00831, 00897, 00926, 00215, 00104, 00282, 00326, 00333, 00337, 00338, 00453, 00518, 00564, 00583, 00602, 00622, 00628 … plus 141 more)

## Clinical boundary

No treatment threshold, dose-modification condition or recommendation was intentionally changed in v0.51.0. All protocols remain decision-support encodings pending the level of consultant and oncology-pharmacy validation recorded in their individual metadata. The current official NCCP protocol and clinician judgement remain authoritative.
