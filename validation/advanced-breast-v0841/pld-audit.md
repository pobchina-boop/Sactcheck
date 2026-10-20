# NCCP00205 source audit — v0.84.1

Checked 18 October 2026 against the current official five-page NCCP regimen, version8 (reviewed23July2025; review due23July2030). Primary PDF: https://healthservice.hse.ie/documents/6546/205_V8_Peg_Lipo_DOXO_28_day.pdf . SHA256: `bf1022959e378f132adb8af89a6e27046a6248421eb5992ce7481a4dafa5ae11`. The PDF was downloaded and extracted, and all decision tables on pages2–3 were visually inspected. The current EMA Caelyx product information was also read for formulation, grading and additional safety instructions: https://www.ema.europa.eu/en/documents/product-information/caelyx-pegylated-liposomal-epar-product-information_en.pdf .

## Corrections

- Restored all four exact indication suffixes:00205a metastatic breast,00205b ovarian after first-line platinum failure,00205c metastatic soft-tissue sarcoma,00205d recurrent/advanced endometrial. Breast/gynaecology ECOG3 no longer inherits the sarcoma ECOG0–2 restriction. Unknown indication with ECOG3 requires review (p1).
- Added the explicit50mg/m² day1 every28days component schedule. PLD cannot be substituted with non-pegylated liposomal doxorubicin/Myocet (p1).
- Removed the assumed bilirubin ULN20 conversion. Absolute20–50µmol/L maps to75%original dose,51–86 to50%original dose, and>86 to not recommended. Conflicting numeric/band entries, the printed50–51 gap, current doses already below the reference, and simultaneous toxicity reductions require reconciliation without an automatic numerical restart (p3 Table2).
- Reconciled haematology boundaries and overlapping severe platelet rows. Severe low counts do not simultaneously receive the contradictory no-reduction instruction. Both recovery counts are stated. Previous severe counts remain relevant after recovery; the Consultant chooses25% reduction OR full dose with growth-factor support (p2 Table1).
- Replaced generic grade≥2 PPE/mouth-toxicity messaging with current grade, prior severe skin/mouth history and0/1/2-week delay branches. Grade3/4 persisting at a two-week delay stops PLD. Grade1/2 at that point requires25% reduction; stomatitis also allows clinician-selected discontinuation. No guessed numeric basis is assigned to this toxicity reduction (p3 Table3).
- Replaced misleading CTCAE5 grade4 PPE metadata with the source NCI-CTC descriptions. Added generic source-label/source-URL support in the grading guide so it does not attribute these criteria to CTCAE5 or attach unrelated CTCAE comparisons/calculations.
- Added actionable baseline cardiac checks and cumulative-exposure review.450mg/m² is an LVEF-monitoring trigger before each additional administration exceeding that total; it is not conventional-doxorubicin permanent cessation. Cardiac symptoms, pre-existing disease and lower-dose risk factors require assessment (pp2,4).
- Added explicitly labelled SmPC safety pathways for active infusion reactions, suspected/confirmed ILD, pregnancy and breastfeeding. Pregnancy is an individual necessity review, not an invented blanket NCCP exclusion (EMA sections4.2,4.4,4.6).
- Replaced generic monitoring/support lists with PLD-specific content; removed unrelated methotrexate/CK/neurological boilerplate.

## Source interpretation retained for review

The fractional platelet interval>74 to<75 and bilirubin>50 to<51 are not assigned by the printed NCCP rows. The specific platelet<25 severe row takes precedence over the overlapping<50 row, consistent with the SmPC table. Table3 does not explicitly state the original-versus-current basis of its25% decrement; concurrent modification causes and dose history remain Consultant/pharmacy decisions. NCCP hepatic instructions differ from the EMA initiation/re-escalation scheme; the implementation retains NCCP Table2 without blending the two. Acute FN/active-infection and symptomatic-cardiac safety actions are clearly described as clinical assessment safeguards rather than invented NCCP numerical dose rules.

## Longitudinal and patient content briefing

Before starting: FBC, renal/liver profile, ECG and ECHO/MUGA LVEF. Before each28day cycle: FBC, renal/liver profile and symptom review. During treatment: regular/frequent ECG; echo/MUGA as clinically indicated, with mandatory LVEF assessment before each additional administration exceeding lifetime anthracycline450mg/m². Previous mediastinal radiation/concurrent cyclophosphamide can increase cardiac risk below that exposure. NCCP supplies no universal3monthly CT, tumour-marker or fixed echo interval; response assessment follows the disease-specific Consultant plan.

Day1: IV PLD50mg/m²; the first infusion runs at1mg/min. Subsequent infusions may run over60minutes if tolerated. A previous reaction requires a clinician-approved modified sequence:5%over15minutes, doubled rate for15minutes if tolerated, then the remaining infusion over one hour(total90minutes). A peripheral IV can be used; no obligatory port or home pump. Provide local access advice if a port is chosen. Typically6cycles are given, or treatment may continue until progression/unacceptable toxicity; do not promise a fixed finish date.

Low emetogenic risk; no routine premedication usually required. Reaction rescue/premedication is individualised. Emphasise hand–foot discomfort and mouth soreness, infection/fever, infusion symptoms and new breathlessness/chest symptoms. PPE prevention includes keeping hands/feet cool and avoiding heat/tight footwear for4–7days after treatment. Mouth examination and persistent ulcers matter during prolonged exposure. No scheduled radiotherapy sequence is mandated by this monotherapy regimen; any site-directed radiation is coordinated separately.

## Verification and scope

-159/159 source-boundary, missing-context, competing-rule and visible component-dose scenarios passed through the actual assessment engine and dose model.
-8/8 source-grading regression checks passed. Existing CTCAE descriptor and haematology suites passed, preserving default CTCAE5/6 behaviour.
-381 protocol publishing/validation checks passed.
-71 source-linked decision rules. Source audit and software verification do not constitute independent clinical validation.

Independent Consultant, oncology-pharmacy and patient/PPI review remain pending. No browser/manual patient-session audit was performed by this agent. No commit or push was made. The existing v0.59 organ-function regression test has hardcoded historical reconciliation release/status expectations; root integration must update those expectations for the audited record rather than falsify metadata.
