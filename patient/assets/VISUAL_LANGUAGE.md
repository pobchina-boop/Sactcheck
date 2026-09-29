# SACTCheck side-effect visual language v0.76.3

The SVG symbol IDs in `toxicity-icons.svg` are reusable on any patient regimen page:
`brain`, `lungs`, `heart`, `liver`, `bowel`, `kidney`, `skin`, `vessel`,
`pressure`, `bleeding`, `clot`, `jaw`, `wound`, `muscle`, `bone`, `joint`, `warning`.

Use a body-system icon to orient the reader and an explicit medicine label to
attribute an adverse effect. On the HCC guide, numbered purple circles denote
possible atezolizumab immune effects; the numbered coral diamond denotes
bevacizumab vessel/healing effects. Solid purple and dashed coral lines join
the markers to matching numbered cards. A number, name, shape and colour are
all present so the map remains readable when colour perception or print quality
varies. Teal denotes general actions. An icon or colour must never be the only
way to communicate an emergency.

`assets/patient/hcc-bodymap-v0763.css` and
`assets/patient/hcc-connectors-v0763.js` are shared by the clinician-side
patient preview, public HCC portal and printable view. Connector endpoints
are measured from the actual DOM on desktop/print; narrow screens show the
numbered anatomy and cards in reading order without crossing lines. Marker
locations are coordinates within the artwork rather than the surrounding grid,
so changing card width does not move a marker onto the wrong organ.

For future regimens, use the same numbered card and anchor pattern with a
neutral body image by default. Male and female body variants can substitute
the image and anchor coordinates where anatomy matters; the safety wording and
drug attribution stay in structured content.

Headings use everyday language first and the clinical term in brackets, such as
"High blood pressure (hypertension)". Describe the symptom, who to contact,
and whether it may be rare. A coloured icon does not indicate incidence or a
CTCAE grade. Clinicians must review every regimen-specific risk attribution.

Example: `<svg class="tox-icon" aria-hidden="true"><use href="../assets/toxicity-icons.svg#jaw"></use></svg>`

The body-system icons are original SACTCheck vector drawings. The HCC anatomy illustration is a generated bitmap used as a visual aid. All clinical labels, warning text and connectors are independently editable text or vector overlays. Do not infer an exact diagnosis from the position of a marker.
