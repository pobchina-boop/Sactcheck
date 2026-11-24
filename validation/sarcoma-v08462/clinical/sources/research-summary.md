# Sarcoma batch 3 preparation — 18 November 2026

Read-only preparation for proposed v0.84.62. No application changes are authorised by this research file. Current live NCCP sarcoma catalogue and all five linked documents were read in full through the web extraction service. The saved files are **web-extracted text**, not downloaded original PDFs. Any SHA-256 in the manifest hashes that saved text only. No independent clinical or pharmacy approval is claimed.

## Current versions and context

| Code | Current source | Applicable sarcoma context | Important boundary |
|---|---|---|---|
| 00374 | v4a; last-reviewed footer26May2026; amendment31Aug2026;6pages | Advanced STS after anthracyclines and ifosfamide, or unsuitable for them | Repo v4 needs version/ID migration review; do not copy first-line doxorubicin/trabectedin combination evidence |
| 00228 | Footer v8; change log v9 on20May2026 changes review schedule;6pages | Adults with unresectable liposarcoma after anthracycline-containing therapy unless unsuitable | Keep existing breast content and source-version discrepancy; no general leiomyosarcoma indication |
| 00205 | v8; reviewed23July2025;5pages | Metastatic STS, indication00205c | Separate from existing breast/gynaecology content; sarcoma ECOG0–2 versus0–3 for other listed cancers; sarcoma is outside current Caelyx EU indications |
| 00462 | v4; reviewed9April2025;5pages | AIDS-related Kaposi sarcoma with CD4<200 and extensive mucocutaneous/visceral disease | A distinct lower-dose schedule; do not import general-STS evidence or dosing |
| 00554 | v3; reviewed14September2026;4pages | Advanced aggressive fibromatosis | Repo v2 and old URL require migration; desmoid context is distinct from metastatic STS |

## 00374 — trabectedin

Schedule:1.5mg/m² IV over24hours on day1 every21days, continued while beneficial/tolerated. Central venous access is strongly recommended; the patient needs pump, line, disconnection and emergency advice. Dexamethasone20mg IV30minutes before every infusion is required for antiemetic and hepatoprotective purposes. Current source emetogenic classification is **moderate**, not the repository's old low label. Growth factor may be used for haematological toxicity under local policy; no universal course is specified.

Baseline:FBC, renal/liver profile, CPK and ECHO/MUGA. Before every cycle:FBC/renal/liver. CPK weekly in the first two cycles and at least once between doses thereafter. The testing list says cardiac imaging as indicated, but the complication section explicitly specifies baseline and every2–3months until stopping. Preserve the more specific source instruction and acknowledge both sections.

Table1 gates:ANC≥1.5,platelets≥100,haemoglobin≥9g/dL,albumin≥25g/L,bilirubin≤ULN,ALP/ALT/AST/CPK≤2.5×ULN,CrCl≥30. Failure means hold, potentially up to3weeks, then consultant discontinuation/reduction decision. ECOG0–2; uncontrolled infection, pre-existing cardiomyopathy, pregnancy and breastfeeding excluded. Table2 reduction triggers include ANC<0.5 for>5days or with fever/infection;platelets<25;bilirubin>ULN;ALP/AST/ALT>2.5×ULN;other grade3/4 events. Dose ladder1.5→1.2→1mg/m²; no re-escalation.

**Conflicts requiring explicit clinical boundaries:** organ table says no adjustment expected at CrCl<30 or haemodialysis although Table1 bars proceeding below30; do not issue automated clearance. Mild/moderate/severe hepatic categories lack self-contained definitions; moderate60% original and severe not recommended cannot erase pretreatment biochemical gates. Cardiac Table3 delay/reduction rules coexist with the complication section's discontinuation criteria; reconcile rather than averaging or hiding them. Rhabdomyolysis, severe CPK elevation, acute kidney injury, capillary leak, cardiomyopathy and severe extravasation need explicit risks/urgent actions. Current product information remains necessary for interacting medicines and contraception.

## 00228 — eribulin

Use1.23mg/m² **eribulin base** on days1/8 every21days, infusion5minutes in saline. Trial1.4mg/m² is the mesilate-salt equivalent, not a larger EU dose. Do not use glucose. Continue while beneficial/tolerated. Separate initial eligibility (ANC≥1.5,platelets>100) from day1/day8 withholding (ANC<1,platelets<75,grade3/4 non-haematological toxicity). Severe/historical toxicity ladder1.23→0.97→0.62mg/m², then consider discontinuation on recurrence; no re-escalation. Preserve prior dose and event-history inputs. CrCl exactly50 is unspecified by the source's >50/<50 rows; review rather than assign either. Renal<50=80% original; haemodialysis80% may be considered. Child-PughA80%,B50%,Cnot recommended; cirrhosis caveat and LFT assessment matter.

Baseline and cycle-start FBC/renal/liver; current SmPC supports blood counts before each dose. ECG is triggered by cardiac/QT risk, interacting medicines or electrolytes, not an invented universal calendar. Congenital long-QT and significant cardiovascular impairment excluded. Low emetogenic; no usual separate premedication. G-CSF may manage severe neutropenia. Discuss peripheral neuropathy, low counts/sepsis, constipation, fatigue, QT effects, fertility/pregnancy and driving when dizzy/tired. Breast trastuzumab-combination footnote must not appear as a sarcoma partner.

## 00205 — pegylated liposomal doxorubicin50

50mg/m² day1 every28days, typically6cycles or continuation until progression/toxicity. First infusion1mg/min; subsequent60minutes if tolerated. A reaction requires the source stepped reintroduction schedule, not automatic reuse of60minutes. Glucose5%;250mL,or500mL for dose≥90mg;no in-line filter. **Never substitute non-pegylated Myocet or conventional doxorubicin.** Baseline FBC/renal/liver,ECG,ECHO/MUGA; cycle bloods, ECG, clinically indicated LVEF/PPE review. Lifetime anthracycline exposure>450mg/m² triggers LVEF before each further administration; it is not an automatic stop threshold for this formulation. Low emetogenic,no usual separate premedication; hands/feet cooling, heat/friction avoidance and oral care need practical advice.

Count Table1:ANC1.5–1.9 withplatelets≥75 full;ANC1–<1.5 orplatelets50–74 wait toANC≥1.5/platelets≥75 then no reduction;ANC0.5–<1 orplatelets<50 same;ANC<0.5 orplatelets<25 wait then25% reduction OR full dose with growth-factor support by consultant. Severe-row precedence and source's limited normal-range description need explicit handling. Fractional platelets74–75 and bilirubin50–51 gaps should not be silently filled. Hepatic bilirubin20–50=75%original,51–86=50%,>86not recommended; renal/haemodialysis no adjustment expected. PPE/mucositis rules depend on current grade, previous grade3/4 and delay week; no arbitrary numerical restart dose when reduction basis is unstated. Do not blend different EMA hepatic restart rules into NCCP's table.

## 00462 — pegylated liposomal doxorubicin20

20mg/m² day1 every21days,maximum6cycles or until progression/toxicity; source permits an individually selected14-day interval. Keep the actual selected interval explicit. Same formulation, initial infusion-rate and reaction precautions as00205; lower dose and Kaposi population remain distinct. ECOG0–3. Baseline FBC/renal/liver,LDH,ECG,ECHO/MUGA; cycle bloods,ECG; LDH/LVEF/PPE review as indicated with the same>450mg/m² additional-dose LVEF trigger. Low emetogenic,no usual separate premedication;PPE measures as above. HIV/antiretroviral and opportunistic-infection support must be coordinated with the treating services, not invented from chemotherapy count rules.

Count thresholds differ from00205:ANC≥1 andplatelets≥75 full;ANC0.5–0.99 orplatelets50–74 half dose;<0.5 or<50 delay. Preserve fractional gaps (ANC0.99–1,platelets74–75). Hepatic bilirubin20–50=75%,51–86=50%,>86not recommended; both are percentages oforiginal dose. Renal and haemodialysis no adjustment expected. PPE/mucositis day1/one-week/two-week-delay table mirrors00205 and requires event history. Cardiac disease is a caution, not an automatic exclusion.

## 00554 — vinblastine/methotrexate

Vinblastine6mg/m² IV over10minutes plus methotrexate30mg/m² IV bolus on days1/8/15 of each28-day cycle,12cycles unless progression/toxicity. The day22 break must remain visible; do not recast as continuous weekly dosing. Vinblastine is IV only; safe vinca administration and extravasation precautions are required. No routine rescue leucovorin, high-dose-methotrexate hydration or universal G-CSF is specified. Methotrexate low and vinblastine minimal emetogenic; no usual separate premedication/other prophylaxis. Baseline FBC/renal/liver and chest X-ray; cycle bloods; additional assessment individualized.

Exclusions include CrCl<30, substantial third-space fluid, pregnancy and breastfeeding. Counts:ANC>0.9 andplatelets>99 full;ANC0.5–0.9 orplatelets50–99 half;ANC<0.5 orplatelets<50 delay. Delay≥2weeks reduces baseline vinblastine25%. Vinblastine bilirubin>51μmol/L=50%original, renal no adjustment. MTXCrCl≥50no adjustment,20–50half,below20not recommended; dialysed exceptional-use pathway requires specialist decision. **Exactly50 overlaps;20–<30 conflicts with exclusion; dialysis cannot bypass exclusion.** MTX bilirubin>86avoid. Mucositisgrade1 halves MTX;grade2 reduces100%(omit, not full dose);source does not supply a routine restart formula or explicithigher-grade row. Neuropathygrade>2 requires consultant vinblastine reduction consideration. Third-space accumulation prolongs MTX exposure. Check NSAIDs,trimethoprim/co-trimoxazole,PPIs,azole/vinca interactions against current products; do not copy high-emetogenic PPI templates into this regimen blindly.

## Patient-context design preservation

Read-only inspection found no separate00228/00205 context files or selectors. Both base profiles (release0.84.21) use broad multi-tumour labels but **explicit breast-specific evidence**. Preserve those existing authored pages and evidence. Create distinct indication/context routes for00228 liposarcoma and00205 sarcoma, with context-aware knowledge, consent, book, wallet and QR links. Do not replace the base profile with sarcoma or use breast survival claims in sarcoma. The future implementation should follow the repository's established context mechanism and audit default/selected routes independently.

## Primary efficacy/medicine evidence

See `product-risks-and-evidence.json` for six official medicine source entries, ten primary trial entries and retrieval limits. Key restrictions: EORTC PLD sarcoma phaseII is small and not proof of survival superiority; Kaposi Stewart trial uses the matchingq21schedule; desmoid Azzarelli/DESMOPAZ schedules are not exact copies of00554; DESMOPAZ is non-comparative randomizedphaseII. Trabectedin monotherapy disease-control benefit must not become a claim of survival benefit or inherit LMS04 combination+maintenance outcomes. Eribulin liposarcoma evidence must remain separate from EMBRACE breast evidence and pooled leiomyosarcoma results.

No original PDF binaries were retrieved in this preparation; no table screenshot has been claimed as visually verified. Before executable rules are changed, visually reconcile the dose tables and the noted source overlaps/contradictions, retain explicit clinical-review gates, and test boundary/equality/history/partial-input behavior.
