# v0.84.35 knowledge, supportive care and patient-content review

Checked 5 November 2026. Scope: ten contexts; five new colorectal suites (00455,00558,00551,00900,00890) and five repeat audits (00732,00585,00733,00447,00448). These content checks do not establish independent clinical/pharmacy/PPI approval or visual/PDF validation.

## Outputs and preservation

- Five retrospective patient profiles now have the approved compact summary structure and full references. All original anatomical cards/coordinates remain unchanged. All original chapter content is retained except the explicit correction of generic recurrence-prevention wording in three metastatic-only cetuximab profiles; added material covers dose recovery, required follow-up and medication safety.
- Ten current clinician KB records, including explicit colorectal contexts for pembrolizumab. Existing lung KB fields remain identical within the retained lung context. Trial applicability and protocol eligibility remain separate.
- Two context-specific pembrolizumab support arrays and eight staged default support arrays. Retrospective phase IDs are preserved. Nivolumab/ipilimumab combination and nivolumab continuation have separate support plans; fruquintinib retains its own oral pathway.
- `verify-assets.py` checks current profile source references, required KB fields, exact context links, preserved lung content/anatomy/chapter text, phase identities and selected source-specific support requirements. Results are in `asset-check-results.json`. These are content/structure assertions, not the clinical engine cases owned by the source audits.

## Current evidence

Official NCCP PDF copies and clinical matrices are in sibling source-audit directories. Supportive-care sections were read directly, including infusion sequence and observation, antihistamine/steroid premedication, antiemetics, atropine, irinotecan diarrhoea rescue, electrolytes, conditional INR and ECG, oxaliplatin cold precautions and medication interactions.

NCCP antiemetic classification V6 and NCIS Medical Oncology V8 were freshly retrieved; hashes are recorded in `sources.json`. They are byte-identical to the table pages visually checked during v0.84.34. Their use is not a new recommendation inferred from a generic oncology template. Low-risk nivolumab/ipilimumab support references NCIS ondansetron 8 mg once and rescue, distinct from routine infusion premedication; nivolumab alone and pembrolizumab are minimal-risk phases. Fruquintinib is minimal-to-low oral risk.

## Material findings carried through

- Cetuximab combinations: chemotherapy begins at least one hour after cetuximab ends under EMA Erbitux information. NCCP's option to remove later routine observation after two tolerated doses differs from EMA monitoring for at least one hour after each infusion; the clinician support explicitly requires reconciliation of local policy.
- Irinotecan: full diarrhoea resolution before restart, first-liquid-stool rescue plus electrolyte fluids, high-dose loperamide duration constraints, atropine glaucoma/asthma cautions, same-day prochlorperazine avoidance, CYP3A/grapefruit review and consultant-led Gilbert-syndrome starting-dose consideration.
- Fluorouracil: explicit brivudine/sorivudine contraindication, DPD-interaction review, warfarin INR and phenytoin toxicity monitoring. Patients are told to seek review rather than change medicines themselves.
- Panitumumab: intolerable dermatologic toxicity is not automatically cleared by a grade below 3.
- Oxaliplatin: distinct 00733 and 00447 severe-renal policies, continued neuropathy review and no ice-chip oral cryotherapy in these regimens.
- Pembrolizumab colorectal: first-line adult histologically confirmed metastatic MSI-H OR dMMR disease; NCCP ECOG 0–2 is distinct from KEYNOTE-177 ECOG 0–1. No PD-L1 requirement is imported from lung. Thyroid tests remain every 3–6 weeks even when infusions are six-weekly. No routine dose reduction; creatinine thresholds use ULN, not patient baseline; immune attribution and endocrine exceptions remain explicit.
- Nivolumab 00551 v7a: colorectal continuation wording differs from adjacent RCC/melanoma and 00900 schedules. The source ambiguity about IV q28 continuation is flagged for consultant/pharmacist clarification rather than silently harmonised.
- Nivolumab protocols retain their separate ECOG criteria and hepatic-impairment wording, CTCAE v4, permanent discontinuation for grade 3 colitis even after transition to monotherapy, and source-specific thyroid, pituitary and adrenal exceptions. The 00900 maximum course is 24 months.
- Fruquintinib v2a: weekly blood pressure for the first month then monthly; baseline/regular urine protein, bloods and thyroid tests; warfarin weekly INR until stable then before each cycle. Its dose floor and organ-toxicity tables are not copied from regorafenib. The KB explicitly records proteinuria hold at 2 g/24 h or more with restart below 1 g/24 h or full resolution, grade-specific skin restart doses, the conditional other-grade-4 rechallenge exception, and EMA perforation/PRES/arterial-thrombosis/surgical precautions. It does not import a blanket permanent-stop rule for every fistula.

## Reproduction

`build-assets.py` rebuilds the KB and staged support from current authored profiles and existing historical records. Root integrates the staged defaults into the shared support file. Rebuilding deduplicates appended support cautions, including the atropine asthma note. Do not blindly re-run `author-retro-profiles.py` over later work: it is the initial authoring snapshot; subsequent explicitly documented source corrections are retained in the final JSON. `verify-assets.py` is read-only except for its result report.
