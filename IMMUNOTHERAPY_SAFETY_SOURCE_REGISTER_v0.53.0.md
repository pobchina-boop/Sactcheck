# SACTCheck v0.53.0 — Immunotherapy Visual Safety Source Register

## Purpose

This register documents the source hierarchy used for the visual safety panel. The panel is an original navigation layer and does not transcribe the supplied pharmaceutical poster.

## Source hierarchy

### 1. Regimen-specific authoritative source

- Current NCCP regimen PDF linked from each protocol.
- The regimen's existing encoded inputs and deterministic rules remain the only source of treatment actions shown inside the panel.

NCCP National SACT catalogue:
https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/national-sact-regimens/

### 2. Cross-regimen clinical-practice guidance

ESMO Clinical Practice Guideline: Management of Toxicities from Immunotherapy:
https://www.esmo.org/guidelines/esmo-clinical-practice-guideline-management-of-toxicities-from-immunotherapy

SITC Clinical Practice Guideline: Immune Checkpoint Inhibitor-related Adverse Events:
https://www.sitcancer.org/publications/cpg/immune-checkpoint-inhibitor-related-adverse-events

These links provide broader clinical context. They do not override the current NCCP regimen or local immune-toxicity pathway.

### 3. Agent-specific product information

The panel links recognised ICI components to current EMA EPAR pages:

- Pembrolizumab — Keytruda
- Nivolumab — Opdivo
- Atezolizumab — Tecentriq
- Durvalumab — Imfinzi
- Avelumab — Bavencio
- Ipilimumab — Yervoy
- Cemiplimab — Libtayo
- Dostarlimab — Jemperli
- Relatlimab/nivolumab — Opdualag
- Tislelizumab — Tevimbra
- Tremelimumab — Imjudo
- Serplulimab — Hetronifly

EMA EPAR root:
https://www.ema.europa.eu/en/medicines

## Visual domains

The nine visual domains are designed to organise, not replace, source material:

1. Lung
2. Bowel
3. Liver
4. Endocrine
5. Kidney
6. Skin
7. Neurological
8. Cardiac / muscle
9. Infusion / systemic

## Governance boundary

- No new steroid regimen, investigation bundle or toxicity-management rule is encoded by this release.
- A tile can display a restrictive state only when the existing assessment engine returns a restrictive encoded finding.
- Associated tests are presented as navigation and monitoring prompts and must be interpreted in the full clinical context.
- Current local immune-toxicity pathways may contain operational requirements not represented in the visual panel.
- Independent Consultant Oncology and oncology-pharmacy validation remains required.

Source register prepared: 31 July 2026.
