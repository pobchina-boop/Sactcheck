# SACTCheck side-effect visual language v0.76.2

The SVG symbol IDs in `toxicity-icons.svg` are reusable on any patient regimen page:
`brain`, `lungs`, `heart`, `liver`, `bowel`, `kidney`, `skin`, `vessel`,
`pressure`, `bleeding`, `clot`, `jaw`, `wound`, `muscle`, `bone`, `joint`, `warning`.

Use a body-system icon to orient the reader and an explicit medicine label to
attribute an adverse effect. Purple denotes possible immune effects; coral
denotes bevacizumab vessel/healing effects; teal denotes general actions. An
icon or colour must never be the only way to communicate an emergency.

Headings use everyday language first and the clinical term in brackets, such as
"High blood pressure (hypertension)". Describe the symptom, who to contact,
and whether it may be rare. A coloured icon does not indicate incidence or a
CTCAE grade. Clinicians must review every regimen-specific risk attribution.

Example: `<svg class="tox-icon" aria-hidden="true"><use href="../assets/toxicity-icons.svg#jaw"></use></svg>`

The body-system icons are original SACTCheck vector drawings. The HCC anatomy illustration is a generated bitmap used as a visual aid. All clinical labels, warning text and connectors are independently editable text or vector overlays. Do not infer an exact diagnosis from the position of a marker.
