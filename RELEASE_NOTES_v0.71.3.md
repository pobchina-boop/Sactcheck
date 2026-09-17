# SACTCheck v0.71.3 - Consent Visual / ICI Risk Refinement

This is a cumulative consent release. It includes:
- v0.71.2 schedule, glyph and immunotherapy hardening,
- the stale-runtime/cache loader fix,
- opening consents in the browser PDF viewer rather than auto-downloading,
- a more visual colour layout,
- checkpoint-inhibitor core risks directly beneath the relevant agent,
- selectively sourced frequency estimates for rare atezolizumab immune-related adverse events.

## Visual redesign
The two-page consent remains deliberately concise but now uses restrained colour:
- navy SACTCheck header,
- blue generic SACT section,
- teal regimen/agent-specific section,
- pale amber rare/important immune-risk section,
- bordered agent cards.

The layout remains legible when printed in greyscale because structure does not depend on colour alone.

## Checkpoint-inhibitor agent cards
Every mapped immune-checkpoint inhibitor now receives the core six immune consent domains directly under the medicine:
- pneumonitis
- diarrhoea / colitis
- hepatitis
- endocrine toxicity
- nephritis
- severe skin toxicity

The previous `[ ] Review current medicine-specific material risks` fallback is therefore removed for mapped checkpoint inhibitors.

Additional uncommon/rare serious immune effects remain in a separate page-2 immune section.

## Evidence-backed risk frequencies
Exact percentages are not shown indiscriminately.

v0.71.3 seeds selected atezolizumab frequencies from the current Tecentriq SmPC pooled monotherapy safety population (n=5,039):
- nephritis 0.2%
- severe cutaneous adverse reactions 0.6%
- myocarditis <0.1%
- meningoencephalitis 0.4%
- Guillain-Barre syndrome / demyelinating polyneuropathy 0.1%
- myasthenia gravis <0.1%
- myositis 0.6%
- pancreatitis 0.8%
- pericardial disorders 1.0%

The PDF marks these values with an asterisk and states that they are approximate pooled monotherapy incidences and may differ by indication, combination therapy, route and patient factors.

Source:
Tecentriq (atezolizumab) SmPC section 4.8
https://www.medicines.org.uk/emc/product/8442/smpc
Last updated on emc: 31 July 2026.

The frequency architecture is deliberately source-specific so numbers can be added to other checkpoint inhibitors only after the corresponding source has been audited.

## PDF workflow
Consent PDF now opens in a browser PDF tab. It is not automatically saved to Downloads. The browser's Print and Download controls remain available.

## Governance
No change is made to protocol JSON, laboratory thresholds, eligibility, dose actions, toxicity decision rules or other deterministic clinical assessment logic.
