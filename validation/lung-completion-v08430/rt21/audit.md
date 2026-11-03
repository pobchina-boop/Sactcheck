# NCCP00279 and00309 source reconciliation · v0.84.30

Checked2November2026 against fresh official catalogue-linked PDFs. The source snapshots, hashes and exact retrieval paths are in `sources.json`. Clinical/pharmacy authorisation remains false. This is a software/source audit, not independent clinical sign-off.

## Source changes and visual verification

- **00279 is v8**, amended29June2026. The footer still prints24June2021 as the last-reviewed date. Version8 changes cisplatin infusion to **one hour** and changes review arrangements. The previous v7 URL now404s.
- **00309 is v6a**, title amended28September2026; the clinical review was v6 on11August2025. It specifies **seven weeks**. Its old versioned URL also404s.
- Fresh PDF bytes were downloaded from official `assets.hse.ie` redirects. Rendered tables were checked:00279pp1/2/4,00309pp3/4/5 and NCIS antiemetics p4. Crucially,00279p4 visual full-dose row is **ANC≥1.5 AND platelets≥100**; text extraction loses the underline and reports `>`.

##00279 findings and implementation

The previous protocol had a generic assessment with no complete component schedule. The proposal rebuilds source-specific assessment, preserving the source's **00279a limited-stage SCLC** and **00279b small-cell cervix/other sites** as distinct clinical settings.

- Four cycles. The reference is q21days, cisplatin75mg/m² Day1 and etoposide100mg/m² IV Days1–3, in that administration order. The source also permits q28 at consultant discretion, split cisplatin25mg/m² Days1–3, IV Day1/oral etoposide100mg/m² **twice daily** Days2–3 and carboplatinAUC5 Day1 substitution for selected patients. These produce12 explicit mutually exclusive clinician schedule choices. Missing/bespoke selection cannot acquire a default numeric dose. Discretionary Day1 oral etoposide has no invented dose; it requires a specialist prescription and separate cisplatin prehydration.
- RT is a separate modality, usually starting with cycle1 but possibly later. No invented RT dose, fractions, dates, prophylactic cranial irradiation or automatic continuation treatment.
- Count delay:ANC<1 or platelets<75.75% row:ANC1–1.49 or platelets75–99. Full-dose row:ANC≥1.5 and platelets≥100. Decimal gaps1.49–1.5 and99–100 are explicit review; delay wins mixed findings. The75% row does not specify its dose denominator, so no calculated mg dose. Oral etoposide product information also differs for new-cycle counts; route-specific reconciliation is flagged.
- Baseline cisplatin excludes CrCl<60, Grade≥2 neuropathy and significant hearing/tinnitus. Source reduced-dose renal rows coexist with that baseline exclusion; the tool keeps both and requires reconciliation. Cisplatin40–49→50% original,50–59→75% original,≥60→100%;<40 not recommended. Decimal gaps49–50 and59–60 are not silently rounded. Dialysis recommendations remain discretionary specialist review.
- Etoposide CrCl10–50→75% original,>50→100%; no non-dialysis row<10. Oral SmPC advises further reduction<15, so the source discrepancy is visible. Hepatic bilirubin≥50micromol/L OR low albumin→consider50%; denominator unspecified and severe liver disease excluded. No automatic mg dose.
- Neuropathy≥Grade2: hold/review cisplatin; after recovery≤Grade1, choose carboplatin substitution OR50% cisplatin, with etoposide100% in that toxicity row. No automatic switch. Other Grade3 excluding mucositis/alopecia: delay toGrade1 then75% after prescription review. Grade4 is urgently reviewed because the source has no generic Grade4 dose row.
- Source does not name a CTCAE version or give grade definitions. Numbered-grade selectors explicitly explain this provenance; no fabricated grading text is supplied.
- Source blood/renal/liver profiles before treatment and each cycle, hearing/neural history each cycle, conditional audiology/CrCl, infusion hypotension and hydration are carried across clinical, patient and journey content.

**Patient scope limitation:** the new00279 pack describes the **00279a IV q21 reference**. It discusses alternatives but does not claim separate fully personalised oral/split/carboplatin/q28 patient packs. Root integration adds a QR/asset scope gate to prevent a reference card being mistaken for those alternative prescriptions or the nonlung00279b setting. This distinction must remain in completion reporting.

##00309 findings and implementation

- StageIII NSCLC, ECOG0–2 and cisplatin unsuitable owing to comorbidity/renal function. The source's treatment paragraph says “adjuvant” but neither the indication nor the cited inoperable-disease evidence justifies inventing mandatory surgery/postoperative status. Patient content uses stageIII concurrent chemoradiation.
- Weekly paclitaxel50mg/m² then carboplatinAUC2, every7days for7weeks. Consultant-selected45mg/m² alternative is explicit. Radiation is separately prescribed. Optional **two cycles of separate00304 consolidation** after RT are described as a new decision, never an eighth weekly dose or automatically appended phase. Wallet records seven weekly administrations.
- Baseline eligibility ANC>1.5, platelets≥100; exclusion text ANC<1.5 leaves exact1.5 unresolved. During treatment ANC≥1 AND platelets>75 allows source100%;ANC<1 OR platelets<75 delays one week. Exact platelets75 is unassigned; restart text “above” also leaves ANC1 after a delay requiring review.
- Manufacturer paclitaxel retreatment thresholds(ANC≥1.5/platelets≥100) differ from the weekly NCCP table; the tool flags source reconciliation rather than silently replacing either.
- Carboplatin:GFR≤20 do not administer;>20–≤30 extreme caution;<60 marrow risk;GFR input capped125. Formula dosing uses creatinine within48hours; isotope baseline creatinine>110% requires reassessment. Unreliable body-composition/low-creatinine estimates and dialysis get specialist review. No unverified formula substitution.
- **ALT**, not highest AST/ALT, drives the current paclitaxel hepatic table:ALT<10 plus bilirubin≤1.25 no reduction;1.26–2→75% original;2.01–5→50% original;ALT≥10 OR bilirubin>5 contraindicated. Decimal bilirubin gaps are explicit. Severe liver impairment remains excluded. All actions are component specific.
- Source neuropathy guidance is consultant dose-modification/discontinuation review, without a numbered grade or percentage. Removed the generic imported grade2 reduction pathway. Severe paclitaxel hypersensitivity has manufacturer “do not rechallenge”; exceptional **carboplatin** desensitisation cannot be transferred to paclitaxel.
- Weekly FBC/differential, renal/liver testing and conditional neuropathy monitoring are explicit. No fixed tumour-marker or imaging interval invented.

##Full service and supportive care

Both records supply patient knowledge, three-page distilled summary, anatomical symptom map, card/passport, before/during/after monitoring, intra-cycle expectations, broad treatment journey, clinician knowledge/rationale, evidence, consent discussion and separate support plans. Patient material contains no survival/prognosis figures.

00279 high-risk cisplatin and substituted carboplatinAUC5 use different NCIS reference rows. Days2–3 must follow actual platinum/etoposide route and multiday cover, not repeat a Day1 script.00309 carboplatinAUC2 is **moderate** risk. First versus later weekly paclitaxel reaction-prevention plans are distinct and must be reconciled with antiemetic dexamethasone so steroids are not duplicated. No routine G-CSF/antibiotic/antiviral/PJP prescription is invented. Acute infection/sepsis, breathing difficulty, bleeding, dehydration/inability to swallow, infusion reactions and extravasation receive urgent escalation; hospital/emergency assessment language is proportionate to symptoms.

Clinical evidence is matched to actual studies: Turrisi1999 randomised RT fractionation in limited-stage SCLC using cisplatin60/etoposide120, not75/100; Choy1998 single-arm phaseII weekly50/AUC2 plus RT **and subsequent consolidation**. Outcomes are historical study endpoints, not patient prognosis, and trial RT prescriptions do not become mandatory current patient schedules.

##Verification and reproducibility

- Frozen canonical v0.84.29 snapshot:`baseline-protocols.json`. Proposal builds reset rule arrays from this snapshot, so rerunning cannot append duplicate rules.
- `build-proposals.py` and `build-authoring.py` are local, owned reproducible authoring scripts. Root owns canonical integration and may normalise patient symptom prompts or apply scope gates; do not rerun authoring after root integration without retaining those refinements.
- `node source-cases.cjs`:153/153 proposed checks pass. Cases use the real assessment engine, strict validator and dose model; cover exact source boundaries, disagreement/gap handling, empty inputs, route/interval schedules, component specificity, documented-dose percentages, grade provenance, RT separation, patient scope and seven-week records.
- `node source-cases.cjs --integrated`:153/153 checks passed against the current root-integrated canonical protocols. Separate proposed/integrated results are retained. PDF service rendering, QR checks, all-service navigation and broader regression remain root integration responsibilities.

### Portable release verification

The release source cases compare each protocol to the frozen audited source version, date and SHA-256 in the retained manifest. Raw research PDFs are not bundled. To recheck downloaded PDF bytes, use `node source-cases.cjs --integrated --verify-local-pdfs` after retrieving the sources at the paths recorded in `sources.json`. This explicit raw-PDF check was run successfully before packaging.
