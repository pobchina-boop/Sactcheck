# Taxane core source audit for v0.84.0

Checked 17 October 2026. Five current PDFs were followed from the official HSE breast catalogues, downloaded and extracted. Tables with merged cells and ambiguous comparison signs were visually inspected (PNG files retained beside PDFs). This is a source/software audit, not independent clinical or pharmacy validation. No application files were edited.

Source documents are identified by their official URLs and hashes below.

## Source inventory

| Code | Current source | Version / last review | SHA256 |
|---|---|---|---|
| 00202 | https://healthservice.hse.ie/documents/6541/202_DOCEtaxel_100-21day.pdf | 8 / 29 June 2026; 5 pages | ef7b7c89b32561aa05282b75f0e2198e31b2373b114f9cdb47591f1fa7f38b0e |
| 00203 | https://healthservice.hse.ie/documents/6543/203_DOCEtaxel_75-21day.pdf | 7 / 20 May 2026; 5 pages | 421aa0604e15c5b837831ffd1008eff80a2ef8d897edb2914c8c2dbf331cbdaf |
| 00250 | https://healthservice.hse.ie/documents/6353/250_DOCEtaxel-cycloPHOS_TC.pdf | 9 / 1 April 2026 (next review 1 April 2031); 6 pages | 4f0b044cb1410a77c1caa66e03d170a9ee96544a669d83859583751a622427fe |
| 00512 | https://healthservice.hse.ie/documents/6515/512_v5_PACLitaxel_Trastuzumab_Weekly.pdf | 5 / 14 May 2025 (next review 14 May 2030); 6 pages | 39ccbca824f8df8e08b3a1878a29f11da7194c2baaa818e8cc1dbdff87313783 |
| 00621 | https://healthservice.hse.ie/documents/6854/621_V3_Paclitaxel_80_zanF78k.pdf | 3 / 13 June 2025 (next review 13 June 2030); 5 pages | 8d7914447e23e7794b057e76feabdf363d31989d9a21d3c73c155f47aea35825 |

Official catalogues: https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/breast-sact-regimens/ and https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/breast-sact-regimens-locally-advanced-metastatic/ .

Existing 00202 `/documents/6541/202_v7_Docetaxel_100_21_day.pdf` returns 404. Existing 00621 `/documents/6688/621_V3_Paclitaxel_80.pdf` is obsolete; follow current catalogue URL above. 00250 filename is unchanged despite version update, demonstrating why version/content checks matter.

## Highest-priority mismatches

1. 00621 JSON incorrectly schedules days 1, 8, 15 **and 22**. Official 00621 is days **1, 8, 15 only** in a 28-day cycle; week 4 is a treatment break. The separate 00226 regimen includes day 22.
2. 00250 JSON remains v8 and platelet hold is <75; current v9 requires >=100. It misses the 75% restart after thrombocytopenia, FN episode-count reductions, CrCl 10–29 reduction, dialysis exception and severe hepatic cyclophosphamide caution.
3. 00512 JSON platelet threshold is incorrectly 75 (current 90), and low blood counts hold **both** drugs. Paclitaxel is the affected component; trastuzumab may continue during reversible chemotherapy-induced myelosuppression with appropriate monitoring.
4. 00512 LVEF logic wrongly treats drop >=10 or value <50 as independently sufficient for the definitive NCCP hold. The source combined rule requires **drop >=10 percentage points AND resulting LVEF <50%**. Isolated concerning findings still merit review, without labelling them the complete conjunctive rule.
5. 00512 is missing paclitaxel hepatic bands and FN/prolonged-neutropenia pathways. Grade 2 neuropathy should reduce by 10 mg/m²; >=grade 3 reaction should discontinue paclitaxel. Existing generic hold/reduce messages are not faithful.
6. 00202 v7 JSON is obsolete: current v8 uses Giraud 2023 hepatic bands, renal/haemodialysis no adjustment expected, and neuropathy >grade 2 follows 100→75→60 rather than jumping directly to 60.
7. 00203 encodes a platelet <100 hard delay although the source specifies **no platelet dose threshold**. Keep platelets visible for monitoring; do not invent a national threshold. Current renal monitoring also omits renal profile in the regular-monitoring display.
8. 00621 single-input grade-2 neuropathy/other toxicity/FN require current dose or previous-reduction count before any action triggers. Add independent actionable fallback messages; optional context refines dose, not whether the patient can receive a partial assessment.

## 00202 docetaxel 100 mg/m²

- Indication 00202a: locally advanced/metastatic breast cancer; ECOG 0–2. Not an adjuvant/maintenance card by default. Hypersensitivity, severe hepatic impairment and baseline ANC <1.5 excluded.
- Day 1 100 mg/m² IV over 60 minutes every 21 days; until progression/unacceptable toxicity. No routine pump; cannula/PICC/port according to access plan. Bag 250 mL for total dose 75–185 mg; 500 mL above185 mg; non-PVC bag.
- Baseline FBC, renal/liver profiles; repeat prior to every cycle (page2). No mandated echo/ECG/DXA or fixed CT interval in this regimen. Response scans according to disease plan, not an invented universal 3-month instruction.
- Page2 Table1: ANC >=1.5 full planned dose; 0.5–<1.5 delay until recovery; FN or ANC <0.5 for >1 week reduce 100→75 and/or75→60. Source lacks explicit isolated short-duration ANC<0.5 row: low ANC still requires hold/review, with duration refining dose reduction; do not treat missing duration as normal.
- Page3 Table2: renal impairment and haemodialysis: no adjustment expected. Normal bilirubin AND AST/ALT >1.5–5×ULN AND ALP >2.5–5×ULN: **consider75% original**. The50% row prints bilirubin `<1–1.5 ULN` with `and/or`, AST/ALT >5–10 and ALP<6. This is textually ambiguous, not a safe fully automatic numeric row. Bilirubin>1.5 OR AST/ALT>10 OR ALP>6: not recommended. See shared ambiguity notes below.
- Page3 Table3 visually confirms merged action cell: skin grade3 OR neuropathy>grade2 →100→75 and/or75→60. Stomatitis grade3/4 →60 mg/m².
- Dexamethasone8 mg orally twice daily for3days starting day before each treatment; minimum3 doses before infusion. If missed, consultant may choose20 mg IV immediately before chemotherapy (not automatic patient substitution). Low emetic potential; avoid duplicate steroid scripts. Prophylactic G-CSF may be used according to risk/local policy; source supplies no specific product/day schedule. Agent-focused patient map: infusion reaction, infection/neutropenia, cumulative neuropathy, fluid retention, skin/nails, mucositis; urgent severe diarrhoea/abdominal pain due to rare enterocolitis.
- Existing: old hepatic `ALP>2.5 AND AST/ALT>1.5→75` is unbounded; old stop requires bilirubin AND enzyme abnormality, unlike new OR. Existing severe-renal uncertainty no longer follows current source. No schedule or monitoring object.

## 00203 docetaxel 75 mg/m²

- Indications: a previously treated advanced/metastatic NSCLC; b high-risk nonmetastatic castration-sensitive prostate; c metastatic castration-sensitive prostate; d gastric/GOJ adenocarcinoma progressing during/within6months of platinum/fluoropyrimidine; e/f/g relapsed/progressing peritoneal/ovarian/fallopian tube; h advanced breast cancer. Preserve all tissue contexts. Do not re-add hormone-refractory prostate/prednisolone (separate00546).
- Day1 75 mg/m² IV60minutes q21d. Source specifies NSCLC maximum6cycles; b–h until progression/unacceptable toxicity. **Potential source/standard-practice discrepancy for prostate:** source explicitly groups b–h as ongoing, whereas common trial-based prostate courses are finite. Do not silently impose indefinite patient treatment or unverified6cycles: clinician confirms planned count for prostate and label this source limitation.
- ECOG0–2; exclusions hypersensitivity, severe liver impairment, baseline ANC<1.5. Baseline and pre-cycle FBC/renal/liver profiles.
- Table1: ANC>=1.5 75; ANC0.5–<1.5 delay; FN or ANC<0.5 >1week →60 mg/m²; discontinue if recurrence at lower dose. Add independent low-ANC safety action with duration optional.
- Table2 matches00202 Giraud hepatic/renal table and ambiguities; percentages are original75 dose:75%=56.25;50%=37.5, not75mg/m²/50mg/m². Preserve 'consider' wording.
- Table3: skin grade3, neuropathy>2, stomatitis3/4 →60; discontinue if persists at60. Grade4 skin not explicitly covered by grade3 skin row; urgent clinical review is appropriate, not silently a validated grade3 dose reduction.
- Dexamethasone/low emetic/G-CSF/access logistics as00202. No mandatory routine cardiac scans/ECGs. Scans/markers depend on primary tumour and treatment intent.
- Existing platelet<100 delay unsupported; hepatic selector simplifies ambiguous source into definitive50% band; lacks event recurrence/current60 trigger for discontinuation; `hypersensitivity_reaction=true` label not clearly severe but action claims severe. Refine label/type. Metadata indication omits most official tumour indications despite registry listing them.

## 00250 docetaxel/cyclophosphamide (TC)

- Adjuvant high-risk node-positive or node-negative early operable breast cancer. Day1 docetaxel75 mg/m² IV60min then cyclophosphamide600 mg/m² IV30min (IV5–10min bolus permissible); order reversible. q21d for4–6cycles. RT, if required, **after chemotherapy**, not concurrent TC. Endocrine therapy when indicated has its own subsequent schedule, not universal for all TC patients.
- ECOG0–1, adequate organ function. Exclusions: hypersensitivity, pregnancy, breastfeeding, **baseline neuropathy>=2**. Existing input can't distinguish baseline exclusion from treatment-emergent grade2; add optional assessment context with nonblocking review when missing.
- Baseline FBC/renal/liver. Regular source wording 'as clinically indicated', not an explicit universal fixed interval; pre-cycle blood checks can be labelled local treatment workflow if used. Source does not mandate echo/ECG/DXA; those require agent/risk/other-treatment indication.
- Table1 page2: ANC>=1 AND platelets>=100 →100%; ANC<1 with platelets>=100: delay>=1week then100% if ANC>1 and platelets>=100. Any platelet<100: delay>=1week, then75% if ANC>1 and platelets>=100. Independently low ANC or platelets must trigger delay even if other count absent; don't force data completion.
- Table2: first FN episode →75% **previous** cycle dose if day1 ANC>1/platelets>100; second →50% **original** dose; third →discontinue. Secondary G-CSF consideration after ANC1–1.49 episode or first FN. Acute FN requires urgent assessment/hold; episode count optional refinement. Retain source's strict recovery `>` vs general eligibility `>=` discrepancy and escalate exact-boundary restart rather than silently approving.
- Table3 page3: docetaxel no renal adjustment expected inclHD. Shared ambiguous hepatic75/50/notrecommended bands below. Cyclophosphamide CrCl>=30 no adjustment;10–29 consider75% original; <10 orHD not recommended, if unavoidable consider50% original. Mild/moderate hepatic no reduction expected; severe not recommended because efficacy may be reduced. CrCl isn't interchangeable with indexed eGFR; label calculation correctly.
- Table4: docetaxel skin grade3, neuropathy>2, stomatitis3/4 →60 mg/m²; discontinue docetaxel if persists at60. Do not automatically reduce cyclophosphamide for docetaxel-specific toxicity.
- Dexamethasone schedule asabove. Docetaxel low/cyclophosphamide moderate emetic potential: overall moderate using activecomponents with steroidduplication check. Consider primary G-CSF (source does not mandate for everyone). Day1 fluids2–3L per source, subject to personal fluid restriction/clinical advice (avoid universal forcefluids instruction). Report haematuria/dysuria; cyclophosphamide bladderrisk; rare hyponatraemia/neurologic symptoms need clinical assessment. No pump. Standardly single infusionday plus recoverydays and next-cycle assessment.
- Existing: wrong PLT75, generic unsupported diarrhoea rule cited as source table, LFTcutoffs incomplete/obsolete, renal input eGFR conflatedCrCl, noFNcycle/skin60 logic; sourcepageswrong. Needs substantive rebuild rather than renamingv9.

## 00512 weekly paclitaxel/trastuzumab (APT-style)

- Adjuvant HER2-positive, node-negative breast cancer <=3cm. ValidatedHER2test. ECOG0–2. BaselineLVEF>55 per source;50–55 requires judgement (trials used>=50). Significant cardiac disease/hypersensitivity/severe hepatic impairment/baselineANC<1.5 exclusions.
- Paclitaxel80 mg/m² IV1hour weekly12doses. Trastuzumab4 mg/kg load90min week1, then2 mg/kg30min weekly. Firsttrastuzumab observation>=6h fromstart, subsequent>=2h fromstart unlesslocalpolicy varies. Avoid glucose diluent. PaclitaxelnonPVC and0.22micronfilter.
- After12weeks stop paclitaxel; continue trastuzumab2mg/kgweekly or6mg/kgq21 to **one total year**, not one additionalyear. Reference00201/00200 protocols for maintenance. RT/HR-positiveendocrine phases require separate pathway; source does not prescribe explicitRTtiming. Display team-specific RT sequencing; don'tcopyTC's nooverlap requirement onto trastuzumabmaintenance.
- BaselineFBC/renal/liver andecho/MUGA. Ongoing bloods, neuropathyassessment. Cardiacfunction+LFT+creatinine **every12weeks**; morefrequentcardiac4–8weeks ifimpairment. Calendar-free map: baselinebeforeweek1, 12weekassessment atcompletion12weeklydoses/beforemaintenanceweek13; continue12weekly fromtherapy start (maintenanceq21 ~every4cycles, not every12cycles). Actual appointmentbasedonlastscan/treatmentdelays.
- Trastuzumabmisseddose<=1week: usual2mg/kg ASAP withoutwaitingnextplannedcycle, resumeprior schedule. >1week: clinician-directed4mg/kgreload90min, thenweekly2mg/kgfromnewdate.
- PaclitaxelTables1/2 page3:80→65→50mg/m². Counts ANC>=1/PLT>=90 full; ANC0.5–0.99 orPLT70–90 delay/considerreduction. ANC<0.5 >=7days ORPLT<70 ORFN: delay and one-levelreductionafterrecovery; considerG-CSF. **Visualinspection confirms FN shares the merged dose-action cell with severe counts.** Platelets90 overlapping printedbands: explicit>=90 fullrow cangovern90; documentresolution. BaselineANC<1.5 distinct from on-treatment>=1.
- Paclitaxelhepatic: ALT<10+Bili<=1.25 nochange; ALT<10+Bili1.26–2 75%original; ALT<10+Bili2.01–5 50%; ALT>=10 ORBili>5 contraindicated. No renaladjustmentexpected. Trastuzumabnoadjustmentexpectedrenal/hepaticinclHD. Decimalgaps1.25–1.26/2–2.01 shouldnotbe falsely callednormal; either documentedcontinuousbandinterpretation orreviewguard.
- Page4Table4: neuropathygrade2 reduce10mg/m² (not the15mg decrement80→65usedforbloodtoxicity); othergrade2holduntil<=1thenreduce10; >=grade3reactiondiscontinuepaclitaxel; after2priorreductionsreviewcontinuation. Singlevaluegrade2 mustreturnactionwithoutdosehistorymandatory.
- Table5: LVEFdrop>=10percentagepoints **AND**current<50: withholdtrastuzumab,repeatin3weeks; ifnorecovery/furtherdeclineconsiderdiscontinuation/cardiology. SymptomaticHFconsiderdiscontinuation/cardiology. Grade4hypersensitivitydiscontinue. Reversiblechemotherapy-myelotoxicity canpermittrastuzumabcontinuationwithmonitoring.
- Lowemeticduringtaxane/minimalantibodymaintenance. Day1premeds30minbeforepaclitaxel:dexamethasone8mgIV,chlorphenamine10mgIV,famotidine20mgIV. Day8andlaterdexamethasonecanbeomittedaccordingtable;H1continues,H2mayomitbyconsultantifnoreaction. Increasedrisk/priorreactionmayneedsteroids; oral20mg12h/6hbefore rechallengeonlyconsultantdirected. Do notcontinuepaclitaxelpremedsautomaticallyontrastuzumab-onlyphase.
- Existingwrongthreshold/componentholds, LVEFORinsteadAND, missesALT/bilirubinFN/2reduction logic, grade3trastuzumabautomaticdiscontinueisnotTable5'sgrade4 rule; no symptomaticHF. Keepacutegrade3infusionreactionurgentreviewwithcorrectauthority.

## 00621 weekly paclitaxel three weeks out of four

- Indicationsa secondlineadvanced/recurrentgastric; bmetbreastafterfailure/unsuitableanthracycline; csecondlinemetovarianafterplatinum; drelapsed/refractorySCLC; esecondlinemetbladder. AllfootnotedofflabelIreland: patientconsent/localDrugs&Therapeuticsacknowledgement appropriate.
- Paclitaxel80mg/m² onD1,8,15 q28; D22break; untilprogression/unacceptabletoxicity. Distinguish00226,whoseD22isactive.
- ECOG0–2; hypersensitivity,breastfeeding,severehepatic andbaselineANC<1.5 exclusions. BaselineFBC/renal/liver; repeat**beforeeachD1,D8,D15dose**, notonlybeforeq28cycle. Neuropathyclinicalchecks. No mandatedroutineecho/ECG/DEXA; responseimagingbydiseaseplan.
- Tables1/2samepaclitaxelhaematology/doselevelsas00512. FN sharesdelay/reducecell(visuallyconfirmed). LowANC0.4alonehold, FNalonehold/reducereview, PLT69aloneholdandreducereview; do notrequirecurrentdosebeforeaction.
- Table3 uses **transaminases** notjustALT; ensurehighestASTorALTinputorbothULNcalculations. Samehepaticbandsas00512; no renaladjustmentexpectedinclHD.
- Table4: neuropathygrade2reduce10mg/m²; othergrade2holduntil<=1thenreduce10; >=3discontinue; intoleranceafter2reductionsreview. Existing grade2rulesrequirepreviousreductions; addfallback. Existingothergrade2highestwithcurrentmissingmustnotvanish. ExistingonlyALTfailsAST-onlyabnormalitycoverage.
- Paclitaxellowemetic/premeds/analgesiaconceptsas00512. Steroidescalationonlyindividualrisk/reaction. No routinepump; optionalaccesslinebyteam.
- No fixedadjuvantRT/endocrinepathway for thispalliativecross-tissuecard. Longitudinalmapshouldshowongoingrepeated28dblocks,eachdosebloods,andconsultant-selectedresponseassessment. Markerchoiceisprimary-specific,notgenericCA15-3forall.

## Shared docetaxel hepatic ambiguity and bounded encoding

Both00202v8and00203v7 print `<1–1.5ULN` in the bilirubin50%row; TCv9 prints `<=1–1.5ULN`. The `and/or` construction canoverlapthe75%row/normalbilirubinwhenreadliterally, so do not infer that every normalbilirubin requires50%. ALPexactly6, ALP5–6withmoderateAST, and otherunlistedpatternsarealsoincompletelycovered.

Safeimplementation: hard not-recommendedORcutoffsareclearandindependentlyactionable; full75%conjunctionisclearbutshouldretain'consider'; forpossible50%pattern anduncoveredabnormalpatternsreturnexplicitconsultant/pharmacyreviewwiththepublishedrowandpercentageoption, or useclinician-selectedhepaticbandwithambiguityexplanation. Do not silentlyclaim a fullyresolvedautomatic50%dose. Allpercentagebasisoriginaldose; toxicityladderis separate. No needtoblockunrelatedlowANCassessmentwhenhepaticinputsaremissing.

## Recommended direct-input regression cases

Allcasesneedactualengineexecution,notonlyassertingJSONcontainsstrings. Emptyinputs→unassessed; noimplicitnormal values orrequiredcycle/date.

-00202/00203 ANC1.49→delay;1.5→noANCdelay;0.4alonedelay/review;FNtruealoneaction;ANC<0.5duration7days vs8days (>1weeksource);00202neuropathy3at100→75,not60;stomatitis3→60;00203recurrenceat60→discontinue;PLT99alone00203noinventednational100hold.
-Docetaxelhepatic Bili1.51alone→notrecommended;AST10.01alone→notrecommended;ALP6.01alone→notrecommended. NormalBili+AST2+ALP3→consider75%original. AST6+ALP4+Bili1.2→explicit50%rowreview. ALP6exactly→uncoveredreview;missingALPorBili→noautomaticfullhepaticclearance.
-TCPLT99alone→delayandrestart75%afterrecovery;100withANC1→initialfullcountrow; ANC0.99alone→delay. FNepisodes1,2,3→75%previous,50%original,discontinue. ANC1/PLT100afterFNnotstrict>recoveryrow→review. CrCl29/30/9.9/10andHD; severehepaticcyclophosphamide→notrecommended. Baselineneuropathy2→excluded/review, on-treatment2notblanketbaselineexclusion.
-00512/00621 ANC0.99alone→delay;PLT89alone→delay;PLT90+ANC1→countrowthresholdmet;PLT69alone→delay/reduceadvice;FNtruealone→delay/reductionadvice;currentdose80→65and65→50;lowest50→reviewfurtherreduction.
-00512 ALT10alone→contraindicatedpaclitaxel;Bili5.01alone→contraindicatedpaclitaxel;ALT9+Bili2→75%;ALT9+Bili2.01→50%;ALT9+Bili1.25→nohepaticreduction. Componenttrastuzumabshouldnotbecopiedheld.
-00512 LVEF49+drop10→withholdtrastuzumab/repeat3weeks;49+drop9→reviewbutnotconjunctiveholdrule;55+drop10→reviewnotconjunctiveholdrule;LVEF49alone→reviewmissingbaseline;baselineLVEF52→clinicaljudgement;HFtrue→urgentreview/considerstop;reaction4→discontinue,grade3→acuteclinicalreviewnotunqualifiedsourcegrade4rule.
-00512/00621 neuropathy2alone→10mg/m²reductionadvice;neuropathy3alone→discontinuepaclitaxel;othergrade2alone→hold/reviewuntil<=1;twopriorreductions→reviewcontinuation. Verifyhigher-severityrulesdominate.
-00621 scheduleassert[1,8,15]andday22breakacrossJSON,patientgraph,PDF,KB,consentandtimeline. AST10withALTnormalshouldtriggerthetransaminasesstoprule.
-00512 timeline12weeklytaxanedosesthenantibodyonlytoonetotalyear;echoatbaselineand12weekintervalsacrossphasechange. Antiemetics/premedschangeatphaseboundary;patientnotaskedstartdates.
