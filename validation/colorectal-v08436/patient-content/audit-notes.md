# v0.84.36 patient, knowledge and phase-support audit

Scope: NCCP 00216 v8 capecitabine (shared breast/GI) and NCCP 00692 v2 weekly cetuximab plus FOLFOX4. Current primary NCCP and EMA sources were reconciled with the two clinical source auditors. No shared renderer or generated HTML/PDF was edited here.

## Changes and preservation

- Both profiles use the approved three-page pack metadata. Their complete original anatomy objects, pin coordinates, card explanations and full timelines are unchanged. Six full reference chapters remain for each profile. Existing text changes are recorded individually in `content-check-results.json`.
- Capecitabine preserves both breast and colorectal indications, the eight-cycle adjuvant colon/residual-TNBC duration, and ongoing metastatic treatment. It adds nighttime diarrhoea stop-and-call advice, dose-hold recovery instructions, relevant off-label consent, and separates X-ACT from CREATE-X. An ECG is described as a clinical decision, not a mandatory NCCP baseline test.
- Cetuximab/FOLFOX4 retains Day 1 and Day 8 weekly antibody visits, the Day 2 treatment visit and two separate 22-hour fluorouracil infusions. Unsupported automatic Day 2 folinic acid statements are replaced by prescription clarification because the NCCP table only lists Day 1. Metastatic intent replaces the generic postoperative recurrence-prevention wording.
- Cetuximab observation planning now allows at least one hour after every infusion and a one-hour interval before chemotherapy. The clinician KB and support plan explicitly retain the conflict between NCCP's two-dose observation waiver and current EMA requirements; local oncology/pharmacy reconciliation is required.
- Complete prior KB fields are carried forward with regimen-specific dose-history, baseline-versus-recovery, component-hold, renal/hepatic, skin and neuropathy caveats. Existing X-ACT and OPUS numeric trial estimates were checked against original reports; subgroup/population limits remain explicit. Patient evidence remains qualitative.
- The current HSE cancer side-effects link supplies the explicit emergency pathway. Existing DPD/renal information in the FOLFOX4 reference now cites the separate official EMA fluorouracil communication rather than attributing it to NCCP v2.
- Support updates are staged in `phase-support-updates.json` for the release owner. No universal G-CSF course or fixed scan/tumour-marker interval was added. Day 1/Day 2/Day 8 support remains distinct, with steroid reconciliation.

## Verification

`python3 validation/colorectal-v08436/patient-content/check-content.py` passed 85 retention, source-ID and known schedule/safety checks. `author-content.py` is reproducible from the retained before files and only writes these two profiles, the v36 KB addendum and staged support.

Both supportive-care PDFs were freshly downloaded with HTTP 200 and match v35 byte-for-byte. Source hashes, sections, primary trial verification and patient-source link checks are recorded in `source-provenance.json` and `support-source-retrieval.json`.

The exact 00448 duplicate proposed to the release owner was additional_support[3], the verbatim concatenation of items 0–2. Its removal is outside this child scope.

## Remaining release gates

Generation, PDF page bounds and visual quality, three-page layout, consent print fit, handbook completeness, wallet print dimensions, PNG/PDF QR decoding, browser interactions and deployed routes are separate release-owner/PDF-agent checks. These content checks do not establish them. Independent clinical, oncology-pharmacy and patient/PPI review remains pending.
