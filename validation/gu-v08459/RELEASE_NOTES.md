# SACTCheck v0.84.59 — final GU review batch

Base: v0.84.58, commit 862c18e3fa9a4235d14cdc3579565935727f5220. Sources checked 17 November 2026. This package is for review and manual application. No commit, push or deployment was performed.

## Scope

Six remaining GU suites: 00453 high-dose carboplatin/etoposide with autologous stem-cell rescue; 00602 TIP; 00807 intravesical BCG; 00885 erdafitinib; 00894 intravesical gemcitabine/docetaxel; 00945 enfortumab/pembrolizumab.

Each includes clinical assessment rules, source-linked clinician knowledge, workflow/support information, patient portal, anatomical map, three-page guide, handbook, consent, passport and treatment card. GU authoring scope is complete; that is not independent clinical approval.

Five retrospective clinical audits: 00622, 00333, 00337, 00583 and 00846. Their freshly retrieved source PDFs match the previous source hashes, and all 185 selected boundary cases pass. No additional clinical-rule changes were indicated by these checks.

A separate presentation repair restores the already authored timeline notes in all ten v0.84.58 suites. Strings had been passed to a renderer expecting title/text objects, producing “undefined”. These ten presentation repairs are not ten additional clinical audits.

## Clinical findings and safeguards

- 00453: conditioning days −5 to −3, stem cells day 0 and growth factor from +1 are distinct. Do not treat the illustrative 14-day window as an automatically repeating cycle. No invented ANC/platelet starting threshold. GFR and CrCl roles remain separate; transplant recovery and second-cycle decisions require the specialist team.
- 00602: preserve five treatment days, mesna timing after completion of ifosfamide, renal bands, daily neurological/urinary checks and component-specific holds. Source review date is overdue; current published v1 is retained with that limitation.
- 00807: live BCG is not checkpoint immunotherapy. Use bladder-instillation risks plus BCG-specific local and systemic infection risks, including delayed infection. The Irish product information contraindicates immunodeficiency where NCCP wording is less explicit; treatment is held for reconciliation. Confirm healing after surgery/trauma and the product-specific interval. Published protocol review date is overdue.
- 00885: preserve phosphate units, days 14–21 dose-escalation window, ocular review and dose-level/recovery decisions. NCCP and EMA phosphate-diet wording and rounded boundary gaps are recorded for review, not silently normalised. Clinical confirmation is required at unallocated boundaries.
- 00894: preserve the intravesical route, sequential instillation/drainage, six-week induction, selected maintenance and Irish off-label consent. Severe gemcitabine toxicity targets the intravesical gemcitabine component. Correct the description of mirabegron to a beta-3 agonist. A broken HSE patient-leaflet link was not published.
- 00945: explicitly distinguish the 21-day and 42-day options. Component-specific EV and pembrolizumab toxicity actions are retained; axitinib combination liver rules are not reused. The NCCP “>3” lung-toxicity wording conflicts with EMA “≥3”; the stricter EMA stop threshold and discrepancy are explicit. Count/renal boundaries and monitoring ambiguity require review.

Evidence limitations are visible in the knowledge base: the high-dose and TIP studies use different dosing from the encoded NCCP regimen; GemDoc evidence is retrospective; trial populations and Irish licensed indications are not assumed identical.

## Verification

176/176 new clinical boundary cases; 185/185 selected retrospective cases. The full prior v58 source-case script also ran, with all 323 cases passing; only the agreed five are counted as retrospective clinical audits.

All 377 protocols pass schema validation. Engine and release/cache consistency checks pass. Six three-page packs and six complete consent forms were rendered and checked. The separate companion check covers 31 PDFs, 52 pages, 837 retained text units and seven QR decodes. Handbook checks cover 16 routes, 80 preserved anatomy/card page comparisons and 32 QR decodes. Final report files contain exact outcomes and hashes.

Visual review inspected all six first-page guides and anatomical maps, plus representative handbook cover/chapter/schedule pages and BCG/EV-pembrolizumab consents. It is not an all-page visual or real-device review. It caught and corrected wallet-title overflow and incorrect ordinary day labels on the transplant mini-chart. The calendar change leaves the other 304 routes' renderings byte-identical. All 299 existing consent transformations compare byte-identically with the previous implementation.

## Outstanding acceptance

- Chromium/browser/mobile checks remain blocked by the previously observed socket EPERM. No identical browser retry was made.
- Full historical CI and the historical site validation remain blocked: the preflight found 5,444 missing historical entries at c19bef57ca5ae49816ad851f2b551b76af32fa5d. Historical assertions remain in place. Run `npm run test:ci` on a full checkout with its historical objects. A separately invoked legacy consent-regression test also reached this dependency and was terminated by its 120-second bound; its raw log is retained, with no pass claimed.
- Node here is 24.22.1; the GitHub workflow uses Node 20. CI is required in its target runtime.
- Independent consultant oncology, oncology pharmacy and patient/PPI review remain pending. Example contact numbers must be replaced before patient use. Trial data and these software checks do not authorise prescribing.
- Live deployment, phone-camera scanning and physical print checks were not performed.

The release remains visibly a feasibility review build.
