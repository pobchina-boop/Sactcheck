# Docetaxel lung and pemetrexed monotherapy retrospective audit

Source check: 2 November 2026. Scope: NCCP 00203a lung context and NCCP 00222a/b monotherapy. This work supplies reviewed proposals; root integration owns the shared builders, route preservation, PDFs, QR checks, browser testing and release regression.

## Fresh source reconciliation

The current NCCP PDFs remain 00203 **v7**, last reviewed 20 May 2026, and 00222 **v5**, revised 7 October 2025. Both have five pages. Fresh binary and extracted-text SHA256 values exactly match the prior audited versions. The HSE assets mirror with `?download=1` and a normal user agent resolved direct-download 403 responses. The canonical healthservice links were corroborated through web PDF retrieval. `sources.json` records fresh binary/text hashes and actual retrieval routes; these are not relabelled cached downloads.

The docetaxel hepatic/adverse-event/premedication table and the pemetrexed count and organ/adverse-event tables were rendered and visually inspected. Current EMA Taxotere and ALIMTA binaries were also retrieved, including the relevant prescribing and patient-leaflet sections. NCIS medical-oncology antiemetics remains V8; the low-risk row was reviewed separately from drug-specific steroid premedication.

## Clinical assessment findings

### 00203 docetaxel

All existing 27 source-linked rules are retained, including ANC 1.5, prolonged severe neutropenia strictly more than seven days, indication-specific NSCLC six-cycle review, grade-specific skin/mouth/nerve actions, missed steroid preparation and severe infusion reactions. The renal source expects no adjustment including haemodialysis. The hepatic table's ambiguous bilirubin row, overlapping patterns and ALP exactly six remain consultant/pharmacy decisions; no fabricated numerical liver dose is supplied.

Three supplementary safety pathways are added, producing **30 rules / 31 inputs**:

- **New or worsening pulmonary symptoms:** Taxotere section 4.4 explicitly recommends interrupting docetaxel pending diagnosis. The new flag triggers a hold and prompt investigation; it does not diagnose drug-induced pneumonitis or exclude other causes.
- **Suspected serious bowel toxicity:** the source describes rapidly progressive enterocolitis. A hold for urgent clinical assessment is explicitly labelled safety synthesis, rather than a new NCCP dose row. No count, cycle or numeric dose is required before recognising that concern.
- **Suspected SJS/TEN/AGEP:** urgent specialist assessment and a temporary hold prevent the ordinary grade-3 skin row implying immediate safe resumption at 60 mg/m2. Product information says to *consider* discontinuation, so this flag does not manufacture an automatic permanent stop.

Existing shared breast indications and rules are retained. `preserve_canonical_patient_content=true` and `patient_contexts.lung` isolate the refreshed lung patient bundle. The six-cycle limit is used only for the lung indication, not transferred to breast.

### 00222 pemetrexed

All existing count seams, renal threshold at 45 mL/min, separate legacy renal bands, platelet/bleeding uncertainty, vitamin/steroid prerequisites, neuropathy recurrence, dose-history uncertainty and NSAID review remain in place. The bleeding footnote stays CTC v2.0; the other toxicity table's grading edition stays unspecified.

Two current product-information supplements produce **34 rules / 31 inputs**:

- **Concomitant yellow fever vaccine:** explicit contraindication from ALIMTA sections 4.3/4.5. The input means actual or planned concomitant exposure, not any historical vaccination. No invented vaccination washout interval is encoded.
- **Other concomitant/planned live attenuated vaccine:** specialist review because product information says not recommended. It does not equate all vaccines with yellow fever vaccine or prohibit inactivated vaccines.

The audit also makes an important source difference explicit in both borderline count recommendations and clinical knowledge: NCCP v5 allows consultant consideration at ANC 1.0 to <1.5 or platelets 75 to <100 if clinically well, whereas ALIMTA product information requires ANC >=1.5 and platelets >=100 before dosing. The existing consultant-review action remains; the output now explains why this is not automatic clearance.

Pemetrexed's legacy demonstration values are made blank consistently with this source-audited batch. Unknown patient values remain unassessed. No claim is made that demonstration values were previously silently entered into real assessments.

## Whole service changes

- New patient summary data supply source-grounded before/during blood tests, team-directed imaging, conditional tumour markers/extra tests and follow-up. Neither protocol mandates a tumour-marker schedule, routine serial echo or a fixed scan interval; none is invented.
- A compact cycle explanation avoids treating an illustrative day range as a guaranteed safe or symptomatic period.
- The 00203 lung card supports **up to six cycles**, with stopping earlier if needed. Pemetrexed uses a rolling record with **no preset total**.
- Docetaxel's lung day groups now clearly describe the lung cycle rather than carrying general multi-indication wording. The body map adds urgent bowel and blistering/peeling skin information alongside breathing and infection concerns.
- Docetaxel's supportive-care medicine table now explicitly includes one reconciled steroid preparation course, previously present only in supporting notes. Low-risk antiemetics remain separate; there is no platinum regimen carry-over.
- Pemetrexed support, questions and patient knowledge include vaccine review and the relevance of previous/planned radiotherapy. Daily folic acid, B12 every three cycles and the separate rash-prevention steroid remain clear; folate continues for 21 days after the last pemetrexed.
- Shared consent profiles retain existing risks and add relevant bowel/skin/lung, allergy and fertility discussion prompts with current source basis. No numerical patient survival claims are added.

## Evidence audit

Primary reports were rechecked on PubMed. TAX317's **75 mg/m2** comparison remains distinct from the combined docetaxel dose analysis: median OS 7.5 versus 4.6 months. TAX320's overall survival comparison between the three groups was not statistically significant; its separate one-year finding is not substituted for a global OS advantage.

For pemetrexed, JMEN remains switch maintenance after a non-pemetrexed platinum doublet; its 663-patient overall-trial median OS 13.4 versus 10.6 months includes squamous histology. PARAMOUNT randomised 539 non-progressing ECOG 0-1 patients after pemetrexed/cisplatin; OS 13.9 versus 11.0 months begins at maintenance randomisation, not induction. Hanna's historical all-histology second-line study enrolled 571; OS 8.3 versus 7.9 months was not statistically different. These population, dose and time-origin limitations remain explicit, and these studies do not rank contemporary molecular/immunotherapy alternatives.

## Verification and handoff

`node validation/lung-cytotoxic-v08429/doc-pem-retro/source-cases.cjs` passes **381/381** proposed-mode and **381/381** integrated-mode cases, including 131 retained pemetrexed source cases. Coverage includes all input omissions, exact docetaxel count/liver/neuropathy/skin seams, independent restrictive findings, the six-cycle NSCLC distinction, new safety/vaccine fields, no automatic numerical dose in the presence of an urgent hold, explicit count-source conflict, three-page authoring data and finite versus rolling card semantics. Both protocols are strict-schema valid. Docetaxel retains the pre-existing review-date warning because the current source uses review *as required*; no fictional future review date was inserted.

The integrated run was repeated after parent integration and also passes with `--integrated`. The `proposed/` directory contains complete protocol proposals only; it must not be mistaken for patient-ready approval. Independent consultant, oncology-pharmacy and patient/PPI reviews are still pending and clinical-use authorisation remains false. No global file, commit, push or deployment was performed by this bounded source task.
