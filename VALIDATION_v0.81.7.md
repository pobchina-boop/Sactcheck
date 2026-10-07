# Validation — SACTCheck v0.81.7

## Root cause
The v0.81.0 atomic card hydration gate still required `.antiemetic-script-v0780` to exist before a regimen card could become ready. v0.81.5 intentionally retired that expandable control and replaced it with one `.emetogenic-badge` that opens the printable Rx script directly. On a fresh v0.81.6 load the readiness gate therefore waited for a retired element, hid `.card-actions`, and could leave the card in a degraded-but-still-hidden state.

## Correction
- readiness accepts either the new `.emetogenic-badge` or the historical expandable element
- the single Rx-script decorator is reasserted during hydration
- the clinician/patient action decorator is reasserted during hydration
- degraded fallback explicitly reveals `.card-actions`
- fallback delay reduced from 2600 ms to 900 ms

## Scope
No patient passport, SACTCard, antiemetic prescription content, clinical protocol rules, thresholds or assessment-engine rules are changed.
