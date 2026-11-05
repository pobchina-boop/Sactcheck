# v0.84.34 browser review

Automated Chromium runner: **blocked**, not passed. The ordinary launch failed with socket EPERM / process-singleton errors. The environment rejected the parent's supported escalation. No bypass or further launch attempt was made. `results.json` records zero executed page/assessment cases and explicit blocked status. The authored regression runner covers 80 page states at 390/1440 px plus six assessment journeys, but those cases remain unexecuted here. Both changed JavaScript files pass syntax checking.

## Supported browser observations

Used the supported CUA browser against the local Sites preview. Actual viewport was 1363 px; these are desktop observations, not mobile evidence or deployment checks.

Routes: 00212/colorectal, 00214/colorectal, 00215/colorectal, 00244, 00382, 00207, 00225, 00328, 00330, 00331.

Observed 43 page/phase states: all ten portals expanded, all ten full references expanded, all ten consent forms, and thirteen supportive-care phase states. Each had document width 1348 px within the 1363 px viewport, with no broken images in the inspected DOM. All portal panels opened through Expand all. All reference details opened. Consent forms retained four signature fields and their risk checklists (16/16/16/19/17/16/16/32/22/22 respectively). Support phase controls showed one selected phase; loading/weekly and day1/day8 options were exercised where present.

The 00328 portal tests tab worked and focused its heading. Its anatomical view was visually inspected: the existing detailed body illustration, eight numbered symptom anchors and connector lines were retained, with readable cards and no overlapping text in the observed desktop view. No screenshot file was exported; this inspection is retained in the tool transcript.

Regorafenib assessment was opened through the actual library/workflow UI. Empty inputs gave “1 of 73 encoded applicable rules assessed · 58 domains unassessed”. Selecting treatment-emergent hypertension grade 4 then running assessment gave “Grade 4 hypertension / hypertensive crisis: discontinue regorafenib.” This is one synthetic UI example, not full engine source validation. The 00328 and bevacizumab assessment examples remain unexecuted in this browser session.

The inspected console sample contained extension metadata errors from chrome-extension:// URLs. A limited sample does not establish absence of application console errors across all journeys.

## Findings and fixes

1. The 00328 cycle overview grouped Day4–14 as recovery despite the Day8 cetuximab visit. Reported to parent; parent corrected 00328/00330 cycle blocks and regenerated HTML. Updated browser verification pending preview refresh.
2. All ten full references initially omitted the anatomical image/cards, despite including a portal link. Added a v0.84.34-only full reference section using the existing approved rich anatomy renderer, without deleting reference text. Added its existing stylesheet and regenerated only scoped knowledge HTML. All ten source pages now have one map, one side-effects ID and resolvable anatomy image paths; the three nested colorectal routes use ../../../assets. PDF agent is regenerating knowledge PDFs and handbooks. At final initial check the preview still served pre-fix HTML, so restored-map visual verification is pending refresh.

## Remaining evidence

Mobile 390 px, automated 1440 px, complete local requests/console monitoring, two additional clinician UI examples, final regenerated reference anatomy appearance, printed reference pagination, and real-device installation/scanning/printing are not established by the observations above. Final PDF verification is owned by the separate PDF validation task. No canonical deployment was attempted or implied.

Canonical regeneration follow-up: all seven default and three colorectal knowledge-builder scopes were regenerated, followed by patient:ui (zero further changes). Both scoped `build-patient-knowledge.cjs --check` runs pass. This resolved the initial in-place stylesheet ordering mismatch. PDF owner was notified that canonical HTML is final.

Final refreshed-preview follow-up: all ten knowledge routes were reopened through CUA, expanded, and checked. Each contains exactly one detailed authored map and a loaded 846-pixel source body image; cards are 6/6/6/8/6/8/8/8/8/8 in the route order above. No closed details remain after Expand all; document width1348 remains within viewport1363. The 00328 reference map was visually inspected in a screenshot: detailed anatomical organs, numbered anchors, connector lines and readable symptom cards are present. This adds ten updated desktop states to the earlier observations.

The 00328 and 00330 portals were reopened and their cycle strips checked. Both now explicitly show Day8 “Cetuximab-only visit” between separate pre/post-visit blocks; 00328 retains Day2–3 pump completion. This adds two updated portal states. Total observed desktop page/phase states including rechecks:55. The earlier pending final-map and Day8 preview checks are now resolved. Mobile and automated runner limits remain unchanged.
