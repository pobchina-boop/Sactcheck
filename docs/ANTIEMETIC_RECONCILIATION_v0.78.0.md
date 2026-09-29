# SACTCheck v0.78.0 — antiemetic/supportive-care reconciliation

## Source hierarchy used by the interface

1. **Irish national default:** NCCP Supportive Care — *Antiemetic Medicines for inclusion in NCIS (Medical Oncology), V8 2025*.
   https://healthservice.hse.ie/documents/7180/Supportive_Care_Antiemetics_for_inclusion_NCIS_Medical_Oncology.pdf
2. **Emetogenic classification:** current NCCP SACT-induced nausea/vomiting classification mapped to the existing 376-regimen traffic-light layer.
3. **International evidence overlay:** 2023 MASCC/ESMO antiemetic guideline updates. These are shown transparently where they differ from the current Irish default; they do not silently replace NCCP.
4. **Local reference:** supplied CUH Medical Oncology supportive-medicine/antiemetic sheets (2021–2024). Local adjuncts remain identifiable as local rather than national recommendations.
5. **Medicine safety update:** EMA metoclopramide restriction to short-term use (maximum 5 days; usual adult dose 10 mg up to three times daily; maximum 30 mg/day).

## Important reconciliation decisions

### High emetic risk
Current NCCP V8 and MASCC/ESMO support four-drug prophylaxis for conventional HEC using an NK1 antagonist, 5-HT3 antagonist, dexamethasone and olanzapine. The CUH 2021 high-risk take-home list is retained as a local historical prescription reference, but the visible current-national regimen is not limited to that older sheet.

### Anthracycline/cyclophosphamide
Current NCCP and MASCC/ESMO do not require routine dexamethasone beyond day 1 after AC when the modern four-drug regimen is used. SACTCheck therefore prevents the generic historical CUH days 2–4 dexamethasone list from being mistaken for the current AC default.

### Carboplatin
Current NCCP V8 uses a special high-risk branch at **AUC ≥4**. MASCC/ESMO 2023 recommends NK1 + 5-HT3 + steroid at **AUC ≥5** within its MEC framework. SACTCheck follows NCCP for the Irish default and displays the international threshold difference as an evidence note.

### Trastuzumab deruxtecan
NCCP V8 explicitly added trastuzumab deruxtecan to the high-risk NK1 + 5-HT3 + dexamethasone branch. Olanzapine is not silently added to this NCCP-specific branch.

### Moderate emetic risk
NCCP V8 retains ondansetron + dexamethasone on day 1 and dexamethasone days 2–3. MASCC/ESMO 2023 supports day-1-only steroid for most MEC and enhanced triple prophylaxis for carboplatin AUC ≥5 and women younger than 50 receiving oxaliplatin. The latter is displayed as an evidence overlay requiring local/NCCP reconciliation rather than an automatic prescribing override.

### Mouth care
Nystatin and chlorhexidine appear in the supplied CUH take-home sheets. In SACTCheck they remain visible as **local mouth-care adjuncts** and are explicitly separated from the antiemetic regimen. Their presence is not represented as evidence for universal mucositis prophylaxis.

### Metoclopramide
Historical CUH sheets used 10 mg TDS PRN during chemotherapy. The v0.78 interface retains the medicine but adds the current EMA short-term ceiling: maximum 30 mg/day and maximum 5 days. Caution remains where metoclopramide is combined with olanzapine because of extrapyramidal adverse effects.

## Governance boundary

The antiemetic script is decision/prescribing support, not an autonomous prescription. Current NCCP source, the patient's actual labelled prescription, regimen-specific factors, interactions, prior CINV and local oncology-pharmacy policy remain authoritative for individual care. Formal local pharmacy/clinical review is required before routine deployment of locally adapted scripts.
