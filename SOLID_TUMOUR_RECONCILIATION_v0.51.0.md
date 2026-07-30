# SACTCheck v0.51.0 Solid Tumour Reconciliation

**Reconciliation date:** 2026-07-29  
**Indexed catalogue:** 376 protocols (361 Solid Tumour and 15 Haematology)  
**Automated structural result:** PASS

## Scope and boundary

This release reconciles the current SACTCheck solid tumour repository against the current published NCCP tumour-group catalogue structure, source links and stored source metadata. The NCCP states that the list on its website is not comprehensive, so this report does not claim that every possible national regimen is published online. It also does not replace protocol-by-protocol consultant and oncology-pharmacy validation of the encoded clinical rules.

## Catalogue counts

There are **361 unique Solid Tumour protocol files**. Five shared protocols are intentionally cross-listed across more than one tumour site, so tumour-site coverage counts are placements and may total more than 361.

### Unique protocol files by primary storage group

| Primary storage group | Unique protocols |
|---|---:|
| Breast | 79 |
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
| Breast | 82 |
| Gastrointestinal | 93 |
| Genitourinary | 67 |
| Gynaecology | 48 |
| Head and Neck | 30 |
| Lung | 59 |
| Lymphoma | 1 |
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
| 00253 | 6 | 2014-11-01 | 2030-12-19 |
| 00262 | 8 | 2015-04-29 | 2021-05-12 |
| 00263 | 7 | 2015-04-29 | 2021-05-12 |
| 00361 | 4 | 2016-11-11 | 2031-01-20 |
| 00371 | 4 | 2016-11-11 | 2031-02-23 |
| 00376 | 4 | 2016-11-11 | 2031-01-20 |
| 00423 | 5 | 2017-07-07 | 2021-06-23 |
| 00619 | 4a | 2024-05-31 | 2030-08-11 |
| 00936 | 1 | 2026-02-18 | 2027-02-18 |

## Partial-assessment standardisation

All 361 indexed solid tumour protocols now use the platform policy that every entered value is assessed independently. No static field, profile or phase is required merely to launch an assessment. Missing domains remain unassessed and are never assumed normal. Conditional follow-on fields may still be requested when a clinician enters a trigger that requires additional context.

## Governance metadata backlog

These are not automated release failures, because older NCCP documents do not use a uniform publication/review header and many encodings pre-date the structured metadata model. They remain an explicit manual source-review queue.

- Missing stored publication date: **254** (00202, 00230, 00254, 00258, 00260, 00265, 00269, 00278, 00316, 00322, 00377, 00378, 00381, 00414, 00432, 00433, 00485, 00525, 00526, 00545 … plus 234 more)
- Missing stored review or last-reviewed date: **253** (00202, 00230, 00254, 00258, 00260, 00265, 00269, 00278, 00316, 00322, 00377, 00378, 00381, 00414, 00432, 00433, 00485, 00526, 00545, 00659 … plus 233 more)
- Source document not explicitly marked as manually checked: **191** (00250, 00252, 00253, 00348, 00350, 00512, 00722, 00726, 00731, 00734, 00775, 00789, 00790, 00857, 00858, 00860, 00861, 00212, 00205, 00228 … plus 171 more)

## Clinical boundary

No treatment threshold, dose-modification condition or recommendation was intentionally changed in v0.51.0. All protocols remain decision-support encodings pending the level of consultant and oncology-pharmacy validation recorded in their individual metadata. The current official NCCP protocol and clinician judgement remain authoritative.
