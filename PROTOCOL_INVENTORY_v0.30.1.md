# SACTCheck canonical protocol inventory — v0.30.1

This register is the duplicate-control baseline for future protocol batches.
Only protocols listed in `protocols/index.json` are active catalogue entries.

## Duplicate audit outcome

- Active catalogue entries: **38**
- Duplicate active protocol IDs: **0**
- Duplicate active catalogue paths: **0**
- Stale nested legacy JSON copies removed: **15 protocol/template/index files** from `protocols/protocols/`
- TCHP partial-assessment blocker corrected: cycle number and assessment-stage context no longer prevent a single-value assessment.

## Similar regimens retained intentionally

These are not duplicates and must remain separate because their NCCP codes, tumour indications, schedules or doses differ:

- **00306** Gemcitabine + carboplatin AUC4 — gynaecology
- **00310** Gemcitabine + carboplatin AUC5 — lung
- **00303** Carboplatin + paclitaxel, 21-day — gynaecology
- **00304** Carboplatin AUC6 + paclitaxel 200 mg/m² — lung
- **00857** Pembrolizumab + q3-weekly carboplatin/paclitaxel → AC
- **00858** Pembrolizumab + weekly carboplatin/paclitaxel → AC
- **00515** Modified FOLFIRINOX
- **00555** FOLFOXIRI

## Canonical active catalogue

| NCCP | Regimen | Tumour group | File |
|---|---|---|---|
| 00250 | TC (Docetaxel/Cyclophosphamide) | Breast | `protocols/breast/00250-docetaxel-cyclophosphamide.json` |
| 00252 | AC (Doxorubicin/Cyclophosphamide) | Breast | `protocols/breast/00252-ac-doxorubicin-cyclophosphamide.json` |
| 00512 | Weekly Paclitaxel + Trastuzumab | Breast | `protocols/breast/00512-paclitaxel-trastuzumab-weekly.json` |
| 00722 | TCHP: Docetaxel + Carboplatin + Trastuzumab + Pertuzumab | Breast | `protocols/breast/00722-tchp-docetaxel-carboplatin-trastuzumab-pertuzumab.json` |
| 00726 | Pertuzumab + Trastuzumab maintenance | Breast | `protocols/breast/00726-pertuzumab-trastuzumab-maintenance.json` |
| 00857 | Pembrolizumab + Carboplatin/Paclitaxel → AC | Breast | `protocols/breast/00857-pembro-carbo-paclitaxel-ac.json` |
| 00858 | Pembrolizumab + weekly Carboplatin/Paclitaxel → AC | Breast | `protocols/breast/00858-pembro-weekly-carbo-paclitaxel-ac.json` |
| 00216 | Capecitabine | Breast, Gastrointestinal | `protocols/gastrointestinal/00216-capecitabine-monotherapy.json` |
| 00226 | Weekly paclitaxel | Breast, Genitourinary, Gynaecology, Lung | `protocols/shared/00226-paclitaxel-monotherapy-weekly.json` |
| 00209 | Modified FOLFOX-6 | Gastrointestinal | `protocols/gastrointestinal/00209-modified-folfox6.json` |
| 00227 | FOLFIRI | Gastrointestinal | `protocols/gastrointestinal/00227-folfiri.json` |
| 00244 | Regorafenib | Gastrointestinal | `protocols/gastrointestinal/00244-regorafenib.json` |
| 00321 | XELOX / CAPOX | Gastrointestinal | `protocols/gastrointestinal/00321-xelox-capox.json` |
| 00329 | FOLFIRINOX | Gastrointestinal | `protocols/gastrointestinal/00329-folfirinox.json` |
| 00382 | Lonsurf | Gastrointestinal | `protocols/gastrointestinal/00382-trifluridine-tipiracil.json` |
| 00515 | Modified FOLFIRINOX | Gastrointestinal | `protocols/gastrointestinal/00515-modified-folfirinox.json` |
| 00555 | FOLFOXIRI | Gastrointestinal | `protocols/gastrointestinal/00555-folfoxiri.json` |
| 00660 | 5-FU + Folinic Acid | Gastrointestinal | `protocols/gastrointestinal/00660-5fu-folinic-acid.json` |
| 00831 | Atezolizumab + Bevacizumab (HCC) | Gastrointestinal | `protocols/gastrointestinal/00831-atezolizumab-bevacizumab-hcc.json` |
| 00897 | Durvalumab + Gemcitabine + Cisplatin | Gastrointestinal | `protocols/gastrointestinal/00897-durvalumab-gemcitabine-cisplatin.json` |
| 00303 | Carboplatin + Paclitaxel (21 day) | Gynaecology | `protocols/gynaecology/00303-carboplatin-paclitaxel-21-day.json` |
| 00306 | Gemcitabine + Carboplatin AUC4 | Gynaecology | `protocols/gynaecology/00306-gemcitabine-carboplatin.json` |
| 00624 | Carboplatin + pegylated liposomal doxorubicin | Gynaecology | `protocols/gynaecology/00624-carboplatin-pegylated-liposomal-doxorubicin.json` |
| 00766 | Bevacizumab + Carboplatin/Paclitaxel | Gynaecology | `protocols/gynaecology/00766-bevacizumab-carboplatin-paclitaxel.json` |
| 00799 | Bevacizumab + paclitaxel + cisplatin | Gynaecology | `protocols/gynaecology/00799-bevacizumab-paclitaxel-cisplatin.json` |
| 00862 | Niraparib tablets monotherapy | Gynaecology | `protocols/gynaecology/00862-niraparib-tablets-monotherapy.json` |
| 00215 | Bevacizumab 15 mg/kg monotherapy / continuation | Gynaecology, Gastrointestinal, Breast, Lung | `protocols/shared/00215-bevacizumab-15mgkg.json` |
| 00588 | Olaparib monotherapy | Gynaecology, Genitourinary, Breast, Gastrointestinal | `protocols/shared/00588-olaparib-tablet-monotherapy.json` |
| 00271 | Carboplatin + Etoposide | Lung | `protocols/lung/00271-carboplatin-etoposide.json` |
| 00280 | Cisplatin + Etoposide | Lung | `protocols/lung/00280-cisplatin-etoposide.json` |
| 00281 | Gemcitabine + Cisplatin 75 | Lung | `protocols/lung/00281-gemcitabine-cisplatin.json` |
| 00304 | Carboplatin AUC6 + Paclitaxel 200 | Lung | `protocols/lung/00304-carboplatin-paclitaxel.json` |
| 00317 | Pemetrexed + Cisplatin | Lung | `protocols/lung/00317-pemetrexed-cisplatin.json` |
| 00655 | Durvalumab monotherapy | Lung | `protocols/lung/00655-durvalumab-maintenance.json` |
| 00689 | Atezolizumab + Carboplatin + Etoposide | Lung | `protocols/lung/00689-atezolizumab-carboplatin-etoposide.json` |
| 00310 | Gemcitabine + Carboplatin AUC5 | Lung, Genitourinary | `protocols/lung/00310-gemcitabine-carboplatin.json` |
| 00593 | Atezolizumab monotherapy | Lung, Genitourinary | `protocols/lung/00593-atezolizumab-maintenance.json` |
| 00558 | Pembrolizumab 400 mg monotherapy | Lung, Skin/Melanoma, Lymphoma, Genitourinary, Head and Neck, Gynaecology, Gastrointestinal | `protocols/shared/00558-pembrolizumab-400mg-monotherapy.json` |
