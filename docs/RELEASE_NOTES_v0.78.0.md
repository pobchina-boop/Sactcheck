# SACTCheck v0.78.0 — Treatment Passport + antiemetic traffic-light restoration

## Treatment Passport

- Adds the **SACTCheck Treatment Passport** as a printable wallet-card output.
- Four foldable 85.6 × 54 mm cards are produced on one A4 sheet.
- Patient identifiers are **not entered into or stored by SACTCheck**. Name, DOB, hospital/unit, SOS number and dates are handwritten on the physical card.
- The QR contains only a public regimen URL and never patient-specific data.
- Finite regimens use cycle stamp spaces; explicitly encoded maintenance/continuous treatment uses maintenance stamps and a reissue prompt.
- Structured `planned_cycles` / `maximum_cycles` metadata is used where present. Free-text clinical rules are deliberately not mined to infer planned treatment length.
- The card is reissued when the regimen or treatment phase changes.

## Emetogenic traffic-light script

- Restores an expandable traffic-light antiemetic/supportive-care script to regimen catalogue cards.
- The **current NCCP Medical Oncology antiemetic regimen (V8, 2025)** remains the default Irish prescribing reference.
- Conventional high-risk treatment displays aprepitant + ondansetron + dexamethasone + olanzapine.
- Anthracycline/cyclophosphamide high-risk treatment does not carry routine dexamethasone beyond day 1 in the current NCCP branch.
- Carboplatin AUC ≥4 and trastuzumab deruxtecan retain the current NCCP high-risk three-drug branch without silently inheriting olanzapine.
- Moderate risk retains the NCCP ondansetron + dexamethasone default while transparently showing the newer MASCC/ESMO evidence overlay (day-1 steroid sufficiency for most MEC; enhanced NK1 + 5-HT3 + steroid prophylaxis for carboplatin AUC ≥5 and women <50 receiving oxaliplatin).
- Low and minimal-risk behaviour remains risk appropriate.

## CUH supportive medicines retained and reconciled

The historical/local CUH sheets remain useful source material and all medicines represented across the supplied generic and special sheets are retained in the support layer where relevant:

- aprepitant
- ondansetron
- dexamethasone
- olanzapine (current national update)
- omeprazole
- nystatin
- chlorhexidine mouthwash
- cyclizine
- metoclopramide
- loperamide
- prednisolone (cabazitaxel)
- folic acid and hydroxocobalamin/vitamin B12 (pemetrexed)
- co-trimoxazole for the concomitant-RT STUPP context
- senna and lactulose (temozolomide bowel support)

Nystatin and chlorhexidine are shown as **local mouth-care adjuncts**, not as universal antiemetic or universal mucositis prophylaxis. Current local oral-care policy should be confirmed.

Metoclopramide is retained but now carries the current European/Irish short-term safety ceiling: 10 mg up to TDS, maximum 30 mg/day, maximum 5 days.

## Agent-specific local-support overlays

The support layer retains the supplied CUH-specific proformas for:

- docetaxel
- cabazitaxel
- pemetrexed
- temozolomide / STUPP

These are displayed separately from national CINV prophylaxis so regimen premedication, supplementation, bowel/PJP support and local mouth-care practices are not mislabelled as antiemetics.

## Regression protection

- The historical 376-regimen emetogenic classification map remains release `0.48.0`; v0.78.0 is stored separately as the content-update release.
- No treatment protocol JSON or deterministic assessment rule was changed for this release.
- Restores the v0.76.3 HCC jaw osteonecrosis / PRES content and anatomical patient-guide assets that could otherwise be lost when moving through the v0.77 structural update.
