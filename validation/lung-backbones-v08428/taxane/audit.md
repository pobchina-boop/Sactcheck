# Taxane source and service audit, 2 November2026

Scope: new standalone00304 carboplatin/paclitaxel lung suite and retrospective00621 monotherapy with a separate lung/SCLC patient context. Independent clinical/pharmacy approval remains pending.

## Primary source retrieval

Fresh official00304v8 and00621v3 PDFs downloaded; exact hashes and retrieval method are in source-manifest.json. OriginalURLs returned403, but the same URLs with download=1 and browser User-Agent succeeded. Local text extraction and visual review of00304pp4–5 and00621pp2–3 were completed. Full localPDFs/text are research inputs; avoid distributing official sourcePDFs in the release overlay.

## Confirmed changes proposed

00304: added baselineANC1.5 exclusion separately from ongoingANC1.0 table; indication-specificECOG limits; off-label review; four-cycle standalone boundary and explicit00849 combination redirect; first grade2mucositis hold; missing occurrence/current toxicity review; literal hepatic gaps1.25–1.26 and2–2.01; missing transaminase review; reduced-GFR myelosuppression warning and125mL/min calculation cap; measurement validity review; severe paclitaxel reaction no-rechallenge wording. Removed cycle-number-only proceed reassurance. Existing infection precaution is explicitly labelled a conservative safety overlay rather than a purported enumerated source exclusion. Reduction instructions retain clinician review and do not automatically re-escalate a prior reduced dose. Source does not specify a CTCAE edition, so inherited edition5 claim removed.

00621: preserved shared patient authoring; added a separate00621d lung context with three visits and an explicit Day22 interval. Corrected source published/review dates and dose-rule page references. Removed irrelevant HER2 language and stale continuation guards from paclitaxel-only rules; continuation was not a selectable option, so no normal-UI bypass is claimed. Added off-label consent review and explicit ANC0.99–1.0 decimal-gap review. Existing platelet90 overlap and hepatic exact-boundary review retained. Source visual table shows a merged action cell spanning severe-count/FN rows: existing delay/reduce-one-level and considerG-CSF retained. This was initially unclear from extraction alone and was resolved by visual inspection.

## Evidence boundaries

CALGB9633:344 resectedstageIB patients; exact paclitaxel200/carboplatinAUC6 four-cycle schedule. Mature primaryOS not statistically significant:HR0.83,90%CI0.64–1.08,P=.12 (fulltext .125). Large-tumour exploratory subgroup is explicitly not the primary result and not generalized across NCCPstagesI–IIIA. Primary: https://pubmed.ncbi.nlm.nih.gov/18809614/ and https://pmc.ncbi.nlm.nih.gov/articles/PMC2652093/ . Fulltext browser retrieval intermittently hit bot protection; primary indexed text and published abstract were checked.

Advanced-diseaseECOG1594 is treated as separate historical evidence. The retrieved primary abstract confirms1207randomized patients and no survival superiority among the fourdoublets. No pooled median survival is assigned as an individual prognosis or a regimen-specific benefit. Primary: https://pubmed.ncbi.nlm.nih.gov/11784875/ . PublisherPDF403 prevented a fresh fulltext file download; no exact dosing claim from its unavailable fulltext is used in the new authored content.

Yamamoto2006:22 enrolled/21eligible; small single-arm relapsed/refractorySCLC trial,80mg/m² weekly for sixweeks in aneight-week cycle. This is not00621three-of-four schedule; no comparative survival estimate or patient numerical response probability is shown. Primary: https://pubmed.ncbi.nlm.nih.gov/16739353/ . Indexed primary abstract checked; no fresh publisherPDF download asserted.

## Service content

00304: both drugs onDay1 every21days for fourcycles, separate preparation/review phases, no nivolumab or routine radiotherapy imported, no routine thyroid/echo schedule, high-riskcarboplatin antiemetics with reconciled paclitaxel steroidpre-medication. Four passport groups.

00621lung: onlySCLC00621d, off-label status, threeweeklydoses then oneweek off, no fixed totalcycle limit, per-treatment blood and neuropathy review, exact weeklypremedication distinctions. Shared canonical patient JSON is preserved; rootintegration must honor preserve_canonical_patient_content and build the separate lungcontext.

Bothnew patientcontexts include patient_summary (purpose,schedule,threephases,threepreparationitems,card_schedule,card_alert) for the new summary-first portal/handout.

## Adjacent inherited00849 finding for owner review

In data/patient-knowledge-contexts/00849/backbone_00304.json, carboplatin agent explanation currently ends “There are two planned doses in this regimen.” This conflicts with the00849selected00304 three-cycle plan. Replace only that sentence with “Carboplatin is planned on Day1 of each of up tothreecycles before surgery.” Apply the same correction in its authoring source at validation/lung-nivolumab-v08427/nivo-neoadj/authoring.json and cumulative data/lung-nivolumab-v08427-authoring.json, then regenerate affected00849context assets/PDFs. No canonical00849file was changed by this task.

## Validation

255proposed source/shape cases pass in source-cases.cjs, including blank/partial inputs, exactboundaries, source-table ambiguity, mucositis occurrence/current mismatch, shared00621indication regressions, source ID resolution, schedulecoverage, lungcontext anatomy and canonical00621patient preservation. Run with --integrated after owner integration. Tests are software evidence, not independent clinical approval.
