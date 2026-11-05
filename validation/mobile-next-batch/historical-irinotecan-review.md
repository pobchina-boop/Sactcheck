# Limited historical comparison: 00328, 00330, 00331

Status: **incomplete; fresh official source retrieval blocked**. No current clinical-audit completion is claimed. Protocols already have prior source audits.

The JSON companion records exact source/protocol hashes, inspected thresholds, seven engine observations, unresolved source questions and534 passing existing historical engine cases.

## Retained-source component discrepancy requiring fresh-source confirmation

00328 v7 p5 Table5 holds FOLFIRI for current diarrhoea>=2. Current engine inputs `{diarrhoea_grade:2,toxicity_delay_weeks:1}` and grade3 produce only an irinotecan hold row. The 5-FU components and linked folinic acid are absent. This is historical retained-source evidence, not confirmation of a current clinical defect. No repository file was edited.

00330/331 blood/organ/skin fields inspected showed no new numeric mismatch; this limited subset is not a full pass. Existing00330 weekly cetuximab/table3 source conflict persists. Additional complete-diarrhoea-resolution restrictions in00330/331 need authoritative source/SmPC traceability and clinical review before any relaxation.

## Exact retained00328 v7 p5 extraction

```text
                                                   NCCP National SACT Regimen


  Management of adverse events:
Table 4: Dose modification of cetuximab based on adverse events
 Adverse reaction                            Recommended dose modification
 Infusion Reaction
 Grade 1                                     Continue slow infusion under close supervision.

 Grade 2                                                    Continue slow infusion and immediately administer treatment for
                                                            symptoms.

 Grade 3 and 4                                              Stop infusion immediately, treat symptoms vigorously and
                                                            contraindicate further use of cetuximab

 Interstitial lung disease                                  Discontinue
 Skin reaction grade 1 or 2                                 No dosage adjustment required. See local skin care policy for the
                                                            prevention and treatment of EGFR-inhibitor adverse skin reactions.

 Severe skin reaction ≥ grade 3*
  First occurrence                                          Hold cetuximab treatment for a maximum of 2 weeks. Reinitiate
                                                            therapy only if reaction has resolved to grade 2 at 250mg/m2

 Second occurrence                                          Hold cetuximab treatment for a maximum of 2 weeks. Reinitiate
                                                            therapy only if reaction has resolved to grade 2 at 200mg/m2

  Third occurrence                                          Hold cetuximab treatment for a maximum of 2 weeks. Reinitiate
                                                            therapy only if reaction has resolved to grade 2 at 150mg/m2

  Fourth occurrence                                         Discontinue

* See other supportive care section below


Table 5: Dose modification of FOLFIRI based on adverse events
 Prior to a Cycle (DAY 1)                  Grade of           Dose Level for Subsequent Cycles
                                           Toxicity           Irinotecan           5-Fluorouracil
 Diarrhoea
 • ≥ Grade 2, hold treatment max of 2      1 and 2            Maintain dose level Maintain dose level
     weeks
 • < Grade 2 within 2 weeks proceed
     with treatment at the dose level      3                  1 dose level         1 dose level
     noted across from the highest grade
     experienced
 • Remains ≥ Grade 2 after 2 weeks,        4                  2 dose levels       2 dose levels
     discontinue treatment
 Stomatitis
 • ≥ Grade 2, hold treatment max of 2      1 and 2            Maintain dose level Maintain dose level
     weeks
 • < Grade 2 within 2 weeks proceed
     with treatment at the dose level      3                  Maintain dose level 1 dose level
     noted across from the highest grade
     experienced.
 • Remains ≥ Grade 2 after 2 weeks,        4                  Maintain dose level 2 dose levels
     discontinue treatment
NCCP Regimen: Cetuximab (7 days) and                    Published: 23/10/2017
                                                                                                                 Version number: 7
FOLFIRI (14 days) Therapy                               Date last Reviewed: 09/09/2021
Tumour Group: Gastrointestinal                          ISMO Contributor: Prof Maccon Keane
                                                                                                                 Page 5 of 10
NCCP Regimen Code: 00328
The information contained in this document is a statement of consensus of NCCP and ISMO or IHS professionals regarding their views of currently accepted
approaches to treatment. Any clinician seeking to apply or consult these documents is expected to use independent medical judgement in the context of
individual clinical circumstances to determine any patient's care or treatment. Use of these documents is the responsibly of the prescribing clinician. and is
subject to HSE’s terms of use available at http://www.hse.ie/eng/Disclaimer
                       This information is valid only on the day of printing, for any updates please check www.hse.ie/NCCPSACTregimens

```
