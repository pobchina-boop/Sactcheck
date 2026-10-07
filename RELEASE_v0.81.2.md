# SACTCheck v0.81.2 - anatomical registration and deployment-gate fix

Corrective patch only. No deterministic NCCP assessment, dosing or threshold logic changes.

- Corrects the anatomy-guide coordinate system so pins are registered to the rendered anatomy image rather than a taller letterboxed container.
- Repositions systemic/non-organ markers (blood/vessels/skin/line/hands/feet) to visible anatomical structures.
- Rebuilds all 13 two-page guide PDFs with the corrected anatomy registration.
- Retains the existing canonical QR payloads; the QR destination remains https://sactcheck.com/patient/<code>/.
- Hardens the remaining legacy patient/interface tests so cumulative app release inheritance does not falsely fail historical module contracts.
