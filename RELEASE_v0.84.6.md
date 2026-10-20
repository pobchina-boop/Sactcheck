# SACTCheck v0.84.6 — About the platform and project

**Revised package (UI revision 2): adds the founder biography, symposium portrait and contact email. This replaces the first v0.84.6 ZIP.**

Cumulative update based on committed v0.84.4 (`73e8a0bc3e4c2a1e869bb0b879ce2241b182cbc0`). Includes the complete revised v0.84.5 interface cleanup. It can be applied directly over v0.84.4 or v0.84.5; there is no need to apply both ZIPs.

## About SACTCheck

- Add a prominent homepage About SACTCheck link, including on small screens where secondary header controls are hidden.
- Open a dedicated, shareable `about.html` page; retain the separate Study information dialog and direct access to regimen search.
- Expand the founder section with Dr Paul O’Brien’s oncology role, scientific and medical background, and clinical motivation for SACTCheck.
- Display his named portrait from the supplied RCPI St Luke’s Symposium poster using a clipped SVG viewport over the unchanged original photograph.
- Add a clickable project-enquiries email: `paul.obrien3@hse.ie`.
- Explain the mission, origins, full clinician and patient service suite, longitudinal treatment journeys, intended value, source/assessment principles, authorship and development plans.
- Include assessment, knowledge base, supportive care and antiemetic scripts, consent-discussion support, patient resources, milestones, source tracking, validation and sustainability.
- Distinguish current features and variable regimen coverage from planned clinical/pharmacy validation, patient and public involvement, evaluation and adoption. Do not imply NCCP/HSE endorsement or established clinical benefits.
- Use the existing navy/teal identity, section navigation, a visual treatment-information journey, responsive layouts, keyboard focus styles, a skip link and print styles. The page works without JavaScript.
- Link to the regimen library, a patient-information example and the sustainability workspace.
- Include the page and stylesheet in the deployable Pages artefact and check its navigation in the source tree and built site.

## Included v0.84.5 fixes

- Remove routine immunotherapy glucose/ketone form controls while keeping their underlying assessment rules unchanged; omitted domains remain unassessed.
- Use clearer laboratory groups and wider responsive input fields.
- Stack the four patient-platform actions in Clinic workflow into one full-width column.
- Remove the manual anonymous assessment-ID panel; generate references automatically for assessment exports.
- Retain the profile selector where a regimen has multiple assessment profiles.

## Verification

- The original v0.84.6 `npm run test:ci` passed in full: release gates, source/security checks, protocol build, tests, Pages build and deployable-site validation.
- After the founder addition, landing/navigation checks, security checks, the Pages build and deployable-site validation passed again. The clinical engine and protocol data are unchanged from the full CI run.
- The About page's local links/assets and section anchors resolve in both source and `_site` output.
- Structural checks passed for the main landmark, labelled sections, heading hierarchy, unique IDs, skip link and script-free content.
- Existing v0.84.5 presentation/reference checks still pass across all 394 assessment profiles. All 72 protected patient pipelines retain their protected assets.
- Protocol rules, clinical thresholds, knowledge content and patient PDFs were not changed by this release.
- A fresh visual browser review of this local release remains outstanding: the available audit browser cannot access the local preview server. Check the homepage button, About page at desktop/mobile widths, and the included assessment/workflow changes after deployment. Automated checks do not establish clinical validation.

## Apply

Extract `SACTCheck_v0.84.6_UPDATE.zip` into the existing repository, preserving its folders and replacing matching files. These are complete replacement files, not a patch requiring a patch command. Commit and push the extracted files using `GITHUB_COMMIT_v0.84.6.txt`.

After deployment, check the homepage shows v0.84.6 and About SACTCheck opens `/about.html`. This package has not itself been committed, pushed or deployed.
