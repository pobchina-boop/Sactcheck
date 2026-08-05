# SACTCheck v0.56.0 — Clinical Scenario and Regimen Information

## Summary

SACTCheck v0.56.0 delivers two cumulative feature groups:

1. refinement of the **Clinical scenario interpreter** for incomplete and misspelled scenarios; and
2. a new **Regimen info** page with drug class, mechanism of action and a pilot source-linked evidence base.

This package includes every v0.55.0 and v0.54.0 change. Earlier scenario-interpreter packages do not need to be installed separately.

## Clinical scenario interpreter refinements

The global function remains named **Clinical scenario interpreter**.

The interpreter now:

- recognises selected common single-word drug misspellings using conservative edit-distance matching;
- transparently displays the correction, for example interpreting `bevicizumab` as bevacizumab;
- accepts medicine-only scenarios without returning a blank panel;
- groups possible protocols by tumour group when one medicine appears in several NCCP regimens;
- asks for tumour type, combination medicines or an NCCP number when exact selection remains ambiguous;
- extracts candidate clinical information before regimen selection, including systolic and diastolic blood pressure and temperature;
- labels candidate values as **not assessed yet**;
- prevents an isolated clinical number such as blood pressure 190 from being interpreted as an NCCP regimen number;
- retains explicit no-match, multiple-match and unmatched-medicine states;
- requires exact protocol selection before the in-regimen confirmation workflow or deterministic assessment can run.

Where a selected protocol has no structured numeric field for a recognised value, the in-regimen interpreter states this explicitly. A numeric blood-pressure value is not converted into a Boolean hypertension answer or a toxicity grade.

## Regimen information page

Every published regimen card now includes a **Regimen info** visual link. The same link is available from inside the opened regimen assessment.

The page contains:

- regimen title, NCCP code, version and indication;
- structured regimen components;
- drug type and pharmacological class;
- concise mechanism-of-action summaries;
- selected primary publications supporting the regimen or treatment context;
- trial acronym, publication title, journal, year and study design;
- clinical-context and relevance summaries;
- evidence-mapping type and limitations;
- stable PubMed publication links;
- direct access to the official NCCP protocol.

All evidence content is educational and source linked. It does not alter treatment eligibility, toxicity findings, dose actions or the deterministic SACTCheck result.

## Pilot content

The v0.56.0 foundation contains:

- **24 drug profiles** with drug type, class and mechanism summaries; and
- **18 evidence mappings** to existing SACTCheck protocols.

The evidence pilot includes selected gastrointestinal, breast, lung, gynaecology, genitourinary and immunotherapy-containing regimens. Each draft is explicitly marked as requiring Consultant Oncology and/or oncology-pharmacy review.

## Governance boundary

- The current NCCP protocol remains the operational authority for regimen assessment.
- Supporting publications provide background and clinical context only.
- Trial summaries are paraphrased and do not reproduce publication abstracts.
- The evidence page does not generate a treatment recommendation.
- The Clinical scenario interpreter remains a local deterministic language and catalogue tool; it does not call an external generative model.
- Scenario text remains in the browser and is not stored or transmitted externally.
- Patient identifiers remain prohibited.
- The treating clinician remains responsible for diagnosis, prescribing and the final SACT decision.

## Clinical-file integrity

All protocol JSON files remain byte-for-byte unchanged from v0.55.0. No NCCP threshold, assessment rule, protocol recommendation, dose level or patient-specific dose calculation was modified.

## Validation status

The release includes focused tests for conservative typo correction, medication-only ambiguity, pre-selection candidate-value extraction, numeric blood-pressure handling, card and in-regimen information links, evidence schema integrity, stable PubMed links and evidence-to-protocol mapping.

Independent Consultant Oncology and oncology-pharmacy review remains required before the evidence summaries are treated as clinically validated content.
