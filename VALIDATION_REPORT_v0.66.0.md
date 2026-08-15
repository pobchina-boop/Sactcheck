# SACTCheck v0.66.0 validation report

Validation date: 15 August 2026

## Scope

This report covers the three profile knowledge base expansion for FLOT, osimertinib and olaparib monotherapy.

## Knowledge base checks

1. Release value is 0.66.0.
2. Knowledge base contains 27 structured regimen profiles.
3. Knowledge base contains 61 principal evidence records.
4. Knowledge base contains 32 medicine profiles.
5. FLOT includes FLOT4 AIO as protocol defining evidence.
6. Osimertinib includes AURA3, FLAURA, ADAURA and contextual FLAURA2 evidence.
7. FLAURA final overall survival and ADAURA overall survival are linked.
8. Olaparib includes SOLO1, SOLO2, PROfound, OlympiA, POLO and contextual PAOLA 1 evidence.
9. PAOLA 1 is explicitly prevented from being represented as an encoded NCCP 00588 combination pathway.
10. The olaparib evidence audit covers ovarian, prostate, breast and pancreatic contexts separately.

## Clinical protocol integrity comparison against v0.65.0

Protocol JSON assets in baseline: 382.

Protocol JSON assets in v0.66.0: 382.

Added protocol assets: 0.

Removed protocol assets: 0.

Changed protocol assets: 0.

All 382 clinical protocol JSON files are byte identical to the v0.65.0 baseline.

No treatment threshold, dose action, organ function rule, eligibility rule, treatment schedule or clinical input definition changed.

## Validation workspace integration

The clinical validation register remains at 376 enabled protocols and 451 tissue review contexts.

The three newly completed knowledge profiles are now marked as having a knowledge base profile within the validation register.

## Automated validation

Complete npm test suite: passed after updating historical knowledge tests to accept the cumulative v0.66.0 knowledge module.

Dedicated v0.66.0 knowledge base test: passed.

Repository security check: passed, 1042 text files scanned.

Static site build: passed, 382 protocol JSON files copied.

Deployable site validation: passed.

## Evidence governance

The evidence completeness model separates evidence by indication and explicitly distinguishes direct protocol evidence from later combination evidence.

FLAURA2 is retained as contextual combination evidence and does not create an osimertinib plus chemotherapy pathway within NCCP 00353.

PAOLA 1 is retained as contextual combination evidence and does not create an olaparib plus bevacizumab pathway within NCCP 00588. The combination is represented separately in the SACTCheck protocol library.

## Source governance

The official NCCP source addresses used by these profiles are inherited from the currently registered protocol records and remain subject to the NCCP Change Tracker.

Independent consultant oncology and oncology pharmacy validation remain pending.

The current official NCCP protocol remains authoritative for treatment decisions.
