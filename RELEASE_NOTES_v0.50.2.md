# SACTCheck v0.50.2 — NCCP Protocol Link Reliability

## Fix

Official NCCP protocol links generated from the JSON protocol library now use normal same tab navigation rather than forcing a new browser tab. This removes a failure mode seen with some desktop browser settings, iPhone home screen shortcuts and installed web app contexts.

## Scope

- Applies to protocol card links and links inside the generic assessment and result screens.
- Preserves the official direct HSE NCCP PDF addresses stored in each protocol.
- Adds no clinical rules and changes no thresholds, doses or assessment decisions.
- Retains all 376 protocols, including 15 Haematology protocols.

## Clinical boundary

Haematology encodings remain pending independent Consultant Haematologist and haematology pharmacy validation and are not authorised to clear treatment.
