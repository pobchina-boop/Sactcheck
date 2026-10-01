# SACTCheck v0.80.3 validation

## Local build checks - PASS
- Visible and canonical release markers updated from v0.80.1 to v0.80.3.
- `regimenLink()` now generates `https://sactcheck.com/patient/${code}/` for the seven dedicated patient regimens, satisfying the Pages regression sentinel that failed v0.80.2.
- Canonical `/patient/` folders are present for 00209, 00382, 00568, 00619, 00722, 00831 and 00857.
- `/docs/patient/` compatibility copies are retained for all seven.
- Each canonical route contains the portal HTML plus guide and passport PDFs.
- 00568 retains separate `Pembrolizumab - immune effects`, `Pemetrexed`, and `Carboplatin + chemotherapy` toxicity sections, including kidney and blood-count content.
- All regenerated guide/passport PDFs rendered without PDF errors.
- QR decoding confirmed canonical `/patient/<code>/` destinations for all six newly generated guides and passports; 00857 passport required a higher-resolution decode and passed.
- The approved 00831 guide remains visually intact apart from replacing its QR payload; its guide QR decodes to `https://sactcheck.com/patient/00831/`. The approved multi-page 00831 passport itself contains no machine-detectable QR and is otherwise preserved.
- Focused v0.80.3 routing regression test passes locally.

## Live deployment checks - NOT YET CLAIMED
- The GitHub Pages workflow must complete successfully after this hotfix is pushed.
- Then verify HTTP 200 for all seven `https://sactcheck.com/patient/<code>/` routes.
- Scan the guide/passport QR codes from a phone against the deployed site.
- `/docs/patient/<code>/` remains backwards-compatible but is not the newly generated canonical QR destination.
