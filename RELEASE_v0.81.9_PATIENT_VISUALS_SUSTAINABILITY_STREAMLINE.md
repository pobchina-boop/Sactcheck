# SACTCheck v0.81.9 — patient visuals + sustainability/card streamlining

This is a cumulative drop-in refinement for the current green v0.81.9 baseline.

## What changes

### Regimen cards
- Removes the duplicated **Regimen info** action from each card because the same knowledge/evidence profile is already available inside **Clinic workflow**.
- Removes per-card **Sustainability** actions.
- Keeps the existing card-level assessment, Clinic workflow, patient guide and single emetogenic Rx-script control.
- Updates card readiness so a removed Regimen info button cannot hold the action row in a loading/degraded state.

### Clinic workflow + homepage
- Adds **Sustainability** as a compact Clinic workflow item, carrying the selected regimen/protocol context into the existing sustainability workspace.
- Retains Sustainability as a visible early homepage anchor rather than repeating it on every regimen card.

### 00568 patient portal
- Replaces the three basic mechanism sketches with more explanatory inline SVG diagrams:
  - pembrolizumab: T-cell/cancer-cell PD-1 brake blockade;
  - pemetrexed: folate-dependent building-block pathway blockade;
  - carboplatin: platinum DNA cross-links.
- Adds a **static Day 1 → Day 21 chronology** with broad pattern bands for infusion reactions, nausea/appetite, fatigue/mouth effects, blood counts/infection, diarrhoea/bowel effects, neuropathy and immune toxicity.
- Keeps explicit wording that there are **no guaranteed safe days** and that the chronology is not an individual forecast.
- Adds source links explaining why blood-count and immune-toxicity timing is deliberately shown broadly rather than as an exact nadir calculator.
- Adds a fixed **Urgent contacts / When to call / Patient tools** dock, with CUH contact details already used in the patient information layer.

## Clinical boundary
No deterministic NCCP assessment rule, dose, threshold, antiemetic prescription, protected guide PDF, Treatment Passport PDF, SACTCard PDF, QR route or anatomy anchor is changed.

The chronology is deliberately educational rather than predictive. In particular, diarrhoea from immune colitis and immune toxicities are not assigned a narrow day range, and neuropathy is presented as cumulative rather than as a Day-X event.
