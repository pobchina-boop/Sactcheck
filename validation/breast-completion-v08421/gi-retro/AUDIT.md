# GI retrospective service audit for v0.84.21

Checked 2026-10-25. Nine assigned existing suites: 00328, 00330, 00331, 00585, 00692, 00732, 00733, 00225 and 00213.

This is a bounded service-content proposal. It refreshes current binary source provenance, clinical rationale/evidence, patient explanations, whole-course monitoring, practical arrangements and active-day support. It does not assert that all existing decision rules have undergone a new independent clinical audit. Existing source-mapped rule logic is retained; no live application files were changed by this task.

## Verified changes

- **00732 emetogenic mapping:** current NCCP v2 page 3 says **low**. The repository's minimal-risk mapping is incorrect. `risk` and the antibody-only support plan correct it to low. Antihistamine/corticosteroid cetuximab premedication remains separate from the antiemetic risk classification.
- **Missing support phases:** all nine had no explicit phase-support entry. Thirteen plans now distinguish Day 1 chemotherapy, Day 8 weekly cetuximab alone (00328/00330/00692), and the FOLFOX4 Day 2 component. They use NCIS V8, account for delayed prophylaxis, and explicitly prevent duplicate steroid orders.
- **FOLFOX4 versus modified FOLFOX6:** 00692 retains two 22-hour infusions, the Day 2 treatment/renewal visit and Day 8 cetuximab. 00733 retains one 46-hour infusion and no Day 8 antibody visit. Irinotecan-only/antibody-only pathways do not acquire a fluorouracil pump.
- **Monitoring over the whole course:** baseline tests are distinguished from repeated bloods, periodic EGFR electrolytes and post-treatment follow-up. All EGFR suites retain NCCP monthly electrolytes/magnesium/calcium for two months after the last dose. Panitumumab SmPC additionally describes monitoring through eight weeks after completion. Irinotecan 00213 retains weekly FBC despite three-weekly infusions; oxaliplatin suites retain formal neuropathy review every two cycles. No invented fixed scan interval or total cycle count is added.
- **Evidence boundaries:** 22 clinician endpoints are attributed to primary trials/current product information, while all patient efficacy metric arrays are empty and benefit text is qualitative. CRYSTAL is schedule-indirect for fortnightly 00585; EPIC used three-weekly irinotecan; OPUS used weekly cetuximab/FOLFOX4 and is indirect for 00733; CO.17 is weekly cetuximab with older KRAS testing. EPIC and the small OPUS extended-RAS analysis do not support a definite OS advantage. Panitumumab's extended-RAS secondary result uses the 6.9-month control median, distinct from the 7.4-month KRAS-exon-2 primary population.
- **Provenance:** all nine current official PDFs were successfully downloaded, hashed and parsed. Source versions match the stored version labels. `protocol_metadata` proposes actual page counts and hashes; in particular, 00733's current v2a PDF is 9 pages, while repository metadata records 10. An absent old hash is not treated as evidence of a source change.
- **Administration clarity:** clinic duration includes preparation, premedication and observation. Fortnightly cetuximab is not promised as a fixed two-hour visit; the source's infusion-rate limits can extend the first infusion. Panitumumab does not inherit cetuximab's routine antihistamine/steroid infusion premedication.

## Existing uncertainties preserved

00733's NCCP PDF retains older KRAS wording. Existing assessment logic already excludes mutant/unknown extended RAS and is retained; current Erbitux SmPC confirms extended RAS selection. No new RAS clearance rule was invented.

00213 lists renal impairment as an exclusion while its renal table provides caution rather than a defined reduction. The proposal preserves specialist review and explicitly avoids inventing a renal dose. Its bilirubin and blood-count boundaries remain in the existing source-mapped assessment.

No exact contemporary regimen-specific survival estimate is fabricated from a related backbone or dosing schedule. Regimen changes, local interventions, breaks and stopping decisions remain individualized; metastatic therapy is not assigned an automatic curative duration.

## Integration

`authoring.json` uses the v0.84.20 authoring schema (`patient`, `clinical`, `evidence`, `journey`, `selector`, `support_plans`, `route`, `risk`, `protocol_metadata`) keyed by regimen code. Merge `protocol_metadata` into existing metadata; do not replace its governance objects. The source-retrieval success applies to the new service audit, not retroactive independent authorization of the old rule audit.

The `selector` compatibility objects explicitly set `include_in_breast_selector:false`. Do **not** insert these GI suites into the breast-only selector. Whole-course journeys may be integrated in the shared journey data with their GI context. Preserve the current `protocol_id`, including actual version suffixes.

`build_authoring.py` writes only the proposal in this directory and is reproducible from existing patient files plus the source manifest. `validate_authoring.py` validates source hashes/page counts, source references, the patient/clinician efficacy split, support-phase separation, pump distinctions, post-treatment monitoring, evidence qualifications and false clinical authorization. Generated UI, PDF layout and final release regression remain integration tasks.

Clinical, pharmacy and patient/PPI review remains pending. `clinical_use_authorised`, consultant review and oncology-pharmacy review remain false.

## Sources

Exact NCCP URLs, versions, SHA256 hashes and page counts are in `sources.json`; current Erbitux/Vectibix SmPCs and NCIS V8 hashes are in `supplement-sources.json`. The `research/` directory contains the retrieved PDFs and extracted text. Primary efficacy references are embedded next to each endpoint and in the combined source manifest.
