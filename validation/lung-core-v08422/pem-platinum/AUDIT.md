# Pemetrexed–platinum source reconciliation · v0.84.22

Checked 26 October 2026. This audit covers the existing 00317 and 00318 protocol identities and their complete service-suite authoring. Independent consultant, oncology-pharmacy and patient/PPI review remain pending; clinical-use authorisation is false.

## Sources and verification

- NCCP00317, version7, updated17 October2025, 6pages; next review17 October2030.
- NCCP00318, version6, updated17 October2025, 7pages; next review17 October2030.
- Fresh official binary PDFs were downloaded using curl after the initial Python HTTP403. The binary SHA256 values, URLs, retrieval date, saved text and image paths are recorded in `sources.json`. The initial web text snapshot is retained separately and its SHA is explicitly labelled as a text hash.
- The count/renal/hepatic tables on00317p3 and00318p4, and adverse-event tables on00317p4 and00318p5, were rendered and visually inspected. They agree with the encoded boundaries and component-specific recommendations.
- NCIS Medical Oncology antiemetics V8, Table1, was re-read through official web retrieval. Direct primary trial reports and EMA ALIMTA product information were retrieved for the evidence/indication distinctions.

## Material findings fixed in the proposals

1. **00318 was substantially incomplete.** Its 19 legacy rules did not encode the intermediate count bands, severe-count/FN/bleeding dose-reduction branches, full gastrointestinal/neurotoxicity pathways, baseline hearing/neuropathy exclusions or the indication-specific course. The proposed protocol has39 source-linked rules and a Day1/21-day structured dose schedule. Its identifiers and filename are unchanged.
2. **00317 had partial-input safety gaps.** Platelets below50 with bleeding status omitted, grade2 neurotoxicity with recurrence omitted, and other grade≥3 toxicity with prior-reduction count omitted could fail to trigger the immediate source hold. Each now holds independently. Missing information cannot select the less restrictive restart branch.
3. **Current counts, not nadirs.** Both October2025 sources explicitly removed nadir-count wording. ANC1–<1.5 and platelets75–<100 require team review; ANC0.5–<1 or platelets50–<75 require delay; ANC<0.5, platelets<50 and FN have dose-reduction pathways. Platelets<50 with bleeding carries the50% reduction rather than25%. Reduction history/dose basis is deliberately not converted into an automatic original-dose prescription.
4. **Renal decisions remain component-specific.** Pemetrexed is not recommended at CrCl<45, with haemodialysis, or severe hepatic impairment. Cisplatin50–59 uses75% original dose and40–49 uses50% original dose; fractional49–50 and59–60 gaps require review. Cisplatin<40 is not recommended; dialysis has a separate specialist option, while pemetrexed remains unsuitable. Baseline cisplatin renal impairment remains an exclusion rather than being silently cleared by the on-treatment table.
5. **Carboplatin boundaries and measurements are explicit.** GFR≤20 means no administration; >20–≤30 means extreme caution, resolving the printed overlap at20 in favour of the restrictive row. CrCl<60 increases myelosuppression risk. An estimated dose requires creatinine within48h; isotope-GFR dose carry-over requires review if creatinine rises above110% of the measurement baseline. Carboplatin GFR is not silently assumed to be a verified pemetrexed CrCl; the legacy pemetrexed band remains available and an exact CrCl input is added.
6. **Adverse-event restart percentages refer to previous doses.** Diarrhoea≥3 or any hospitalised diarrhoea: hold to pre-therapy baseline, then both75%. Mucositis≥3: hold, then pemetrexed50% and platinum100%. First grade2 neurotoxicity: hold, then pemetrexed100% and platinum reduced50%. Grade≥3 or any neurotoxicity recurrence: discontinue. Other grade≥3 toxicity after two reductions requires consideration of discontinuation, not an automatic permanent stop. Severe allergy identifies the culprit drug for a clinician decision.
7. **00318 supportive care was incorrectly moderate.** Carboplatin AUC5 is high-risk in the current source and uses the dedicated NCIS carboplatin AUC≥4 row. That row does not routinely include olanzapine. Cisplatin uses the general high-risk row. Both plans retain folate, B12 and rash steroid prophylaxis and require one reconciled steroid prescription.
8. **Duration and indication are guarded.** Mesothelioma is maximum4–6cycles; advanced NSCLC is4–6cycles then a separate00222 maintenance plan where appropriate; selected neoadjuvant nivolumab is threecycles with a separate00849 immune plan. Combination cycles beyond6 or neoadjuvant cycles beyond3 trigger review. The standalone guides do not present an immunotherapy drug as part of the two-drug regimen.
9. **00318 mesothelioma and advanced-NSCLC use are explicitly off-label in Ireland.** Patient consent discussion and clinician selection notes explain the source’s hospital-policy requirement. Histology selection is specific to NSCLC; mesothelioma is not assigned a non-squamous-NSCLC gate.

## Evidence distinctions

- 00317: Vogelzang2003 compared pemetrexed/cisplatin with cisplatin alone in unresectable mesothelioma. Scagliotti2008 compared cisplatin/pemetrexed with cisplatin/gemcitabine in advanced NSCLC; the displayed adenocarcinoma result is explicitly a histology subgroup, while the whole-trial result was noninferiority. Neither result is transferred to carboplatin or to a chemotherapy-only neoadjuvant claim.
- 00318: Grønberg2009 directly compared pemetrexed/carboplatin with gemcitabine/carboplatin in advanced NSCLC. Its primary HRQoL and survival differences were not statistically significant, with less haematological toxicity in the pemetrexed arm. Ceresoli2006 mesothelioma evidence is single-arm phaseII; its observed survival cannot establish equivalence to cisplatin.
- CheckMate816 belongs to nivolumab-plus-chemotherapy evidence. The two-drug patient pages contain no numerical immunotherapy benefit claim and no inferred immune-monitoring schedule.
- Patient evidence is qualitative; numerical clinical endpoints retain disease, comparator, subgroup and trial design labels.

## Full service content

`authoring.json` supplies both complete records: patient mechanisms, symptoms/body map, scope heading, consent points, relative cycle chronology, urgent advice, vitamin/steroid/antiemetic plans, practical visit information, date-free longitudinal checks, clinician rationale/selection/evidence, lung-selector metadata, and high-risk support plans. Baseline audiology is conditional; FBC/renal/liver tests recur before cycles. Cisplatin hydration is distinct from carboplatin renal dose assessment. The passport note makes recording-page count independent of treatment-course length.

## Remaining source ambiguity and governance

- Printed cisplatin integer renal bands do not assign fractional gap values; specialist interpretation is shown rather than rounding.
- Baseline cisplatin renal exclusion and subsequent renal/dialysis modification rows require clinical context. The chemotherapy pair is not automatically cleared by a permissive component row.
- The adverse-event table says “consider discontinuation” after two reductions and “clinician decision” for severe allergy; these remain decisions. No fabricated percentage restart is calculated when current-dose history is unknown.
- The generic active-infection hold is a preserved clinical safety synthesis, clearly labelled as such; it is not represented as a numeric NCCP FN reduction rule.
- Carboplatin estimated-GFR weight/low-creatinine caveats and GFR cap are clinician-reference material, not an automatically calculated patient dose. The source’s unusually worded63/62micromol/L note is not converted to an automatic creatinine floor.
- The preserved grade-assistance descriptions are not presented as a new CTCAE edition specified by the NCCP source. Formal grading and clinical adjudication remain necessary.

## Verification

`node validation/lung-core-v08422/pem-platinum/source-cases.cjs` passed216/216 checks against the real assessment engine, rule engine and dose-modification model. Cases cover source boundaries, fractional renal gaps, optional/blank data, independent single-field actions, bleeding/recurrence/history uncertainty, contextual duration, component exclusions, legacy renal bands, source schema and approval flags.

After integration run:

```sh
node validation/lung-core-v08422/pem-platinum/source-cases.cjs --integrated
```

The integrated run also passed216/216 checks against the live protocol files. It writes `integrated-results.json` and preserves `source-results.json`. Root owns the shared builder, full generated-document/QR/route checks and release regression pass.
