# PCV source audit for v0.84.38

Two distinct current NCCP protocols: 00379 v4 (42-day), and 00658 v2 (56-day). Both official PDFs have six pages; retained bytes and exact hashes are in source-index.json. Current medac lomustine SmPC January 2026 is explicitly supplementary.

## Results
- Current application: 1245/1245 source/engine/dose-rendering checks passed; 0 failed.
- Before comparison: 541 of 1105 failed the current source scenarios. These include missing functionality and provenance; not unique clinical defect counts.
- Every audited rule has an executed positive witness and source URL/page/hash in criterion-matrix.json.
- All numeric modification calculations blocked: percentage recommendations remain visible with prior-dose/recovery/source-conflict safeguards. Structured standard schedule doses remain visible.

## Findings

### PCV-01: ECOG context
00379 allowed ECOG3 adjuvant because only >3 triggered; separate 0–2adjuvant/0–3palliative pathways now encoded.00658 remains0–2. Source: NCCP00379/00658p1.

### PCV-02: Treatment-day count gaps
Old0.5–0.999ANC/50–99platelet bands left decimal gaps. Strict numerical<1/<100 intervals now cover fractionalresults. Source: Bothp3Table1.

### PCV-03: Source count boundaries
ANC1.0/platelets100 overlap proceed and delay rows onD1/D8. Explicitreview at exactendpoints; no automaticclearance. Source: Bothp3Table1.

### PCV-04: Day29 dominance
OldmoderateORrule could produceproceedfinding with othercountsevere, ormissingothercount/wellness. Proceedrequiresbothcounts+well; severeomissiondominates. Source: Bothp3Table1.

### PCV-05: Nadir/dose history
Oldnumeric25%previousdose prose couldcalculate fromstartingdose orduplicate. Priordosefields/historyguard,already-appliedreconciliation,noautocalculateddose. Source: Bothp3Table1.

### PCV-06: LomustineCrCl45
Source45in50%and75%bands hiddenby30–44dropdown. ExactCrClwithoverlapreview; numericentryprecedence;legacybandguard. Source: 00379p4/00658p3Table2.

### PCV-07: Notrecommended vscontraindicated
SourceNCCPrenalnotrecommended previouslylabelledcontraindicated; nowexplicitdonotadministerwithoutreview,notinventedformalcontra. Supplementaryproductsevererenalcontra flaggedseparately. Source: Table2+currentlomustineSmPC4.3.

### PCV-08: Vincristinehepaticmissingbranch
MissingAST/ALT60–180ORbranchrestored; bilirubin>51+normalnotmisreadasall<=180. Uncoveredcombinationsandmissingdatareview. Source: Table2.

### PCV-09: ProcarbazineAST/ALTambiguity
OldhighestAST/ALTinputcouldautomaticallycontraindicateonALT. SourceexplicitAST>180vsAST/ALTheadingrecorded;separateAST/ALT,ALTonlyreview;legacycombinedinputcannotdecide. Source: Table2.

### PCV-10: Lomustinehepaticgap
Considerreductionnoliverpercentage missing; explicitspecialistreviewadded. Source: Table2.

### PCV-11: Pulmonarydifferences
PCV42hadunsupportedDLCO60hold andomittedbaselineFVC/DLCO70caution. PCV56symptomsANDDLCO<60held,isolatedfindingsreview;baseline70cautionseparate. Source: 00379p4;00658p4Table3+p5.

### PCV-12: Vincristineneurotoxicity
PCV56grade3/4requiresHOLDnotautomaticomit;PCV42narrativedoesnotdictateagrade-basedomission. PainpersistentreductionhistoryguardinPCV56. Source: 00379p5;00658p4Table3.

### PCV-13: Generictoxicityoverreach
PCV56oldNVreductiondidnotrequiredespiteantiemetics; incorrectlyassignedoralcomponents despite sourceunspecified doses. Currentgrade/severity/recoveryreview andexplicitambiguity;noimporttoPCV42. Source: 00658p4Table3.

### PCV-14: Sourcegradinghonesty
LegacygenericCTCAEv5descriptorsonaggregatenausea/vomiting0–4 mislabelledgrade4. NamedsourcegradingnotautomaticCTCAEconversionnowexplicit. Source: 00658Table3;inputinterpretationsafeguard.

### PCV-15: Schedule/patient plan
Missingstructuredschedulefilled;PCV56sixcyclesvsPCV42nofixedcount. Sourceprocarbazine8–21vs8–22supportivetextconflictflagged;notextraDay22. Source: Bothp1+supportivesection.

### PCV-16: Currentlomustineproductsource
SupplementalSmPCweeklyCBC>=6weeks,minimum6weekinterval,cumulative1000mg/m²,productcontraindications,WNCCPANCvsSmPCWBCandcontraceptionconflictsaddedwithoutrewritingNCCPcombinationthresholds. Source: January2026SmPC4.2–4.6.

### PCV-17: Supportservicegaps
Pretreatmenttests,oralunlicensedsupply,interactions,constipationprophylaxis/extravasationtriageandpostRTstartwithin4weeksnowexplicit. Source: NCCPpp1–5.

## Boundaries and limitations
No independent consultant or oncology-pharmacy approval is asserted. NCCP source ambiguities are retained for explicit specialist resolution rather than guessed. Source-specific clinical assessment audits do not by themselves validate every browser/PDF/patient-service surface; root release integration checks cover those separately.
