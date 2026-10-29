# v0.84.26 browser QA

29 October 2026; local managed Sites preview of the built _site output, cloud Chrome. No publication or external data entry. Synthetic values only.

- Erlotinib catalogue identifies continuous daily treatment and exposes assessment, consent, knowledge and supportive-care services.
- Assessment places activating EGFR mutation under Other treatment criteria, outside the renal laboratory section.
- ECOG3 alone: no restrictive threshold triggered, 32 domains explicitly unassessed, not treatment clearance. ECOG4: clinical review with source0–3 boundary and dose-review prompt.
- Pembrolizumab ALT340 U/L against displayed ULN34 gives10xULN. With immune causality blank: clinical review, investigate alternative causes, no automatic permanent immune-toxicity stop. With clinician-assessed immune hepatitis Yes: HEPATITIS_PERMANENT and explicit source stop wording.
- Browser found blank-indication label mistakenly selecting an id-only legacy indication. Corrected assessment-engine matching to require an actual selection and support indication_id/id/code aliases. Regression cases cover blank/null/undefined, exact source code, current ID and intentional legacy selection. Rebuilt and browser-retested: blank context now shows the shared-protocol/select-exact-indication wording, while the lab-review result remains correct.
- Atezolizumab840mg scope route explicitly limits patient materials to lung settings, describes14days/IV/adjuvant12months versus advanced treatment, and distinguishes SCLC maintenance from induction. Scope link opens the matching portal; screenshot review confirms readable title and schedule. Consent link opens regimen-specific one-page aid with14day schedule, risks, governance caveat and PDF download link.
- Complete patient links, scope routes, consent profiles, all10source engines and mirrored PDF bytes are additionally covered by automated suites. Browser checks are representative, not a claim of every possible clinical input or every viewport.

Preview was restarted after the site build replaced its served directory. Intermediate preview reload interruptions were infrastructure lifecycle effects; final checks used the rebuilt served directory.
