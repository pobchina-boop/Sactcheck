# SACTCheck v0.84.8 — Mission and search, together

Presentation update based on committed v0.84.7 (`8f1fdc51b6e323dc0b76dc172b7b5d26f1e4bfc5`). Apply over v0.84.7.

## Homepage

- Restore the mission statement: **Operationalising NCCP protocols at the point of care.**
- Add the concise summary: **Regimen-specific assessment, supportive care, clinical evidence and patient information in one connected workflow.**
- Present these in a dark navy section with a subtle teal gradient, bringing back the platform's visual identity.
- Embed the existing regimen search in a light panel within that same section. Keep the search field before interface choices, tissue filters and the catalogue; retain its suggestions and existing interactions.
- Keep the introduction compact on smaller screens, with readable heading sizes and stacked search controls.
- Retain the single About us header action, the NCCP tracker in Clinic workflow, footer tools and the new founder portrait.
- Keep the feasibility/source notice immediately below search within the navy section.

## Verification

- Full `npm run test:ci` passed, including release gates, security checks, protocol build, regression tests, Pages build and deployed-site validation.
- Landing checks retain a single search field before the portal selectors and preserve About/Study information navigation.
- The mission, summary and search are in the initial HTML. Scoped CSS takes precedence over legacy homepage styles without requiring runtime rearrangement.
- Calculated text contrast against the lightest hero background colour is 7.56:1 for the mission heading, 6.34:1 for the summary, 5.38:1 for the small eyebrow and 5.62:1 for the feasibility note.
- Release metadata, bootstrap and cache keys are aligned to v0.84.8. Clinical rules, knowledge content, patient content, the source tracker and workflow logic are unchanged.
- A fresh desktop/mobile visual browser review remains to be completed after deployment; the available audit browser cannot access the local preview server. Automated checks do not establish clinical validation.

## Apply

Extract `SACTCheck_v0.84.8_UPDATE.zip` into the existing v0.84.7 repository, preserving folders and replacing matching files. These are complete replacement files; no patch command is needed. Use `GITHUB_COMMIT_v0.84.8.txt` for the commit summary and description, then push.

After deployment, confirm the footer says v0.84.8 and the navy mission section contains the summary and working search. The package has not itself been committed, pushed or deployed.
