# Validation - one-page consent refinement

## Local checks completed
- `patient/00568/consent-form.html` created as the dedicated clinician consent-generator output.
- `patient/00568/consent-form.pdf` generated from the same page.
- PDF renders as exactly one A4 page.
- Render inspected at 180 dpi: no clipped text, overlaps or broken glyphs observed.
- patient-asset registry routes `consent-draft` for 00568 to the new one-page form.
- the pre-existing longer `patient/00568/consent.html` asset is not included in this patch and therefore remains untouched.
- updated patient-knowledge regression checks require generic risks, agent-specific risks and the 00568 consent form PDF.
- updated optional patient-journey test expects Clinic Workflow consent to open `consent-form.html`.

## Important boundary
This is a prototype clinical document. It is intentionally labelled as requiring governance, consultant and oncology-pharmacy review before clinical use. No claim is made that it replaces an approved local/national consent form.
