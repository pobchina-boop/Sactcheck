# v0.84.45 patient authoring handoff

Six source-authored patient routes cover five protocol families. These are complete proposal JSON files, not rendered/approved patient documents. Production sources were not modified by this authoring task.

| Route | Schedule and scope |
|---|---|
| `00387` | Cisplatin100mg/m² over2h every21days×3 with head/neck radiation; give before radiation the same day; hold if radiation cancelled. |
| `00385/head_neck` | Cisplatin40mg/m² over1h weekly×6 with radiation for locally advanced unresectable HNSCC unable to tolerate three-weekly cisplatin. |
| `00385/nasopharyngeal` | Same source weekly schedule, separately authored for locally advanced nasopharyngeal cancer. No imported HNSCC or cervical eligibility. |
| `00207/head_neck` | Cetuximab400mg/m²/120min one week before radiation, then250mg/m²/60min weekly through radiation; platinum-ineligible HNSCC. |
| `00705` | Pembrolizumab200mg/30min then carboplatinAUC5/30min Day1;5FU22h×4 or48h×2. Up to6combination cycles then ongoing200mgq21d pembrolizumab maintenance. |
| `00706` | Same phase structure with cisplatin100mg/m²/2h and prescribed hydration. No automatic24-month cap. |

## Proposal files and integration

- `profiles/`: six complete patient profiles, each with ten chapters, schedule, tests, support, consent discussion, logistics, evidence, passport groups and modern three-page summary fields. Cisplatin/RT and cetuximab/RT have eight anatomical anchors. The two systemic combinations have ten, so hearing/nerves, blood/infection and skin are not incorrectly anchored together.
- `selector-stubs/00385.json`: full-schema generator placeholder only. Root00385must be a context selector; never publish the copied head/neck details as generic cervical/bladder information. The root selector must state that those other suites are not authored here.
- `clinician-profile-proposals.json`: six clinician rows.00385and00207rows are context-only patches. Merge00207head_neck onto the newly audited GI profile at`nccp-00207-v6`; preserve it as a`colorectal`context. Do not append duplicate top-level rows sharing the protocol ID.
- `journey-updates.json`: exact route keys use colons for contexts.
- `phase-support-updates.json`: separate root and context maps, including combination versus maintenance prescriptions. Maintenance does not inherit cisplatin hydration or platinum antiemetics.
- `consent-proposals.json`: setting-specific material-risk and discussion content; independent clinical/pharmacy/PPI approval remains false.
- `integrate.py`: dry-run default; explicit`--apply`writes source JSON only. Use`--kb-base`with the root's complete proposed v45addendum containing the reviewed00207GIprofile. The helper preserves other knowledge profiles and creates00385context wrapper. It does not wire shared registry/generators or generate assets.
- `author.py`: deterministic proposal authoring; does not write outside this folder.
- `check.cjs`and`content-check-results.json`: six-profile schema/source-reference, actualKBmarkup, actualTreatmentEvidence.renderandmodernpackmarkup checks passed. They do not establish clinical validity or visual pagination.

## Source reconciliation

Current official NCCP PDFs have been retrieved by the clinical audit agents and are retained in sibling folders. Sources used for patient content are linked per profile:

-00385v5and00387v5: `../platinum/sources/`; tests and schedule source pages checked against retained text.00387explicitly recommends dentistry and nutrition consultation before treatment and oral hydration for24hours adapted to individual fluid status.
-00207v6:`../cetux-chemo/00207-current.pdf`andtext. NCCP permits ending observation after two tolerated infusions while current EMAErbitux§4.2requires at least1hour after every infusion. Both source positions are explicit in clinician/consent/support material. Patients are told the team confirms observation; no early discharge promise.
-00705v2d/00706v3:`../combo/`; combination and maintenance schedules, DPD/PD-L1CPS, hepatitis tests, bloods/glucose each cycle, thyroid every3–6weeks and pump alternatives checked. Imaging remains consultant-plan specific.
-Public patient sources: NCIhead/neck, oral complications and nutrition; HSEtreatment effects; IrishCancerSocietyhead/neck radiation information. Prose is newly authored. No proprietary diagrams or NCCNtext were copied.
-Primary evidence verified: RTOG91-11original2003andlong-term2013reports for00387(larynx preservation distinct fromOS); Chan2005forNPC; Beckmann2005/Medina2006forweeklyHNSCCwith radiation-schedule limitations; JCOG1008postoperativeevidence explicitly not treated as definitive unresectable evidence; Bonner2006versusradiationalone, not cisplatin equivalence; KEYNOTE-048original2019CPS≥1 pooled-platinum comparison, not a platinum-specific estimate.

## Remaining release-owner work

1. Merge proposals with sibling clinical/audit findings, registry and context routing; preserve00207GIand00385cervical/bladder boundaries.
2. Generate the exact regimen-route`qr.png`and`oncowiki-qr.png`; OncoWiki QR should encode`https://sactcheck.com/patient/<exact route>/knowledge.html`.
3. Generate all patient assets, consent aids, passports, journeys, support scripts and mirrored downloads using the existing rich anatomical illustration. Ten-anchor combo page2needs particular PDF/visual inspection.
4. Retain front/back85.6×54mmwallet, actual-size cutting/folding instructions, clearly labelled example phone numbers and mandatory replacement before patient use. Packmarkup check verified these template elements, not print dimensions.
5. Root handles the three-page-first portal and coherent handbook navigation. Fullsource chapters retain detail; repeated topical prompts may need to be suppressed in the final assembled handbook while preserving their source home.
6. Run actual PDFbounds/text/pagination, QR raster decoding, exact-route link checks, mobile/desktop visual review and fullreleasechecks. No claims about those checks are made here.

Do not represent drafts as clinically signed off or a published release. No commit, push, PRor deployment was performed by this task.

## Integration corrections and full generator evidence

The initial markup smoke missed two downstream schema requirements. Both are corrected in the final proposals:

- `monitoring_test_details[].test` becomes `label`; `timing` and `purpose` remain unchanged. The unused `basis` field is replaced by `source_ids: ["nccp"]`, with authored `kind` and `scope`. Audiology is conditional; source blood panels are routine. The narrow `apply-monitoring-field-patch.py --apply` helper modifies only this field in the six profiles.
- `agents[].symptoms` must contain the actual passport severity-library keys, not the explanatory strings from `agents[].risks`. The narrow `apply-passport-field-patch.py --apply` helper changes only those symptom-key arrays. All detailed risks, explanations, passport group IDs and root-added clinical audit fields remain intact.

After applying these two patches in a disposable copy, all **18 actual generator invocations passed**: knowledge, complete pathways and phase support for every one of the six routes. This exercised the full shared publication pass. `generator-smoke-results.json` lists exit codes and full logs. The disposable checkout included the unchanged historical retention audit and rebuilt the shared journey runtime from the merged source data before generation. It was then removed; logs remain. This is HTML generation evidence, not PDF or visual sign-off.

`check.cjs` now also exercises the v44 investigation renderer and compares every passport symptom key with the actual generator library.
