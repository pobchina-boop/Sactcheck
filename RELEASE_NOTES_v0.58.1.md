# SACTCheck v0.58.1 — Organ-Function Rule Reconciliation

Release date: 5 August 2026

## Scope

v0.58.1 is a cumulative clinical data-integrity release built on the v0.58.0 ten-regimen knowledge base and v0.57.0 search-first interface. It corrects the mitomycin plus 5-fluorouracil chemoradiation assessments and introduces a library-wide control against overstated renal or hepatic rule coverage.

## Source-reconciled protocols

### NCCP 00451 v4c — 5-Fluorouracil (4 day) and mitoMYcin chemoradiation

The assessment now includes:

- CrCl and renal-impairment severity;
- bilirubin in μmol/L;
- AST entered through the local-laboratory actual-result/ULN workflow, with automatic ×ULN calculation;
- hepatic-impairment severity;
- alternative mitomycin schedule context;
- corrected ANC and platelet pathways;
- component-specific 5-fluorouracil and mitomycin organ-function actions;
- DPD, diarrhoea and mucositis pathways aligned to the source table.

### NCCP 00450 v4c — mitoMYcin and 5-Fluorouracil with radiotherapy

The related genitourinary protocol has received the same source reconciliation. Inappropriate generic ALT/AST and bilirubin ×ULN fields were replaced by the source-faithful absolute bilirubin, AST, CrCl and qualitative impairment inputs.

## Corrected haematological logic

The previous platelet hold threshold of less than 75 ×10⁹/L was too permissive. The reconciled rules now encode:

- ANC at least 1 and platelets at least 100 ×10⁹/L: source haematological criteria permit 100%;
- ANC 0.5–0.99 or platelets 50–99 ×10⁹/L: delay until recovery;
- ANC below 0.5 or platelets below 50 ×10⁹/L: delay until recovery and consider a 25% reduction of subsequent 5-fluorouracil.

## Renal and hepatic logic

The release adds independent, component-specific findings:

- 5-fluorouracil: severe renal impairment triggers dose-reduction review;
- 5-fluorouracil: bilirubin above 85 μmol/L or AST above 180 U/L triggers the source contraindication pathway;
- moderate hepatic impairment triggers an initial one-third reduction pathway;
- severe hepatic impairment triggers an initial one-half reduction pathway;
- mitomycin: CrCl below 10 mL/min maps to 75%;
- high-dose mitomycin with CrCl 10–60 mL/min triggers consultant review;
- mitomycin with AST above 2 × ULN triggers a clinical-decision finding.

Every organ-function field remains optional. A single entered value produces a partial assessment and omitted domains remain unassessed.

## Library-wide maturity reconciliation

A new automated audit detects protocols whose dose-modification text claims renal or hepatic rule-level encoding without corresponding structured inputs and decision rules.

- Protocols scanned: 381
- Rule-level claim mismatches after remediation: 0
- Protocol JSON files changed from v0.58.0: 76
- Fully source-reconciled in this release: 2
- Reclassified as partially rule-encoded pending organ-function review: 74
- Protocols added or removed: 0

The 74 reclassified records were not given new clinical rules. Their user-facing maturity and validation text was corrected so catalogue presence cannot be mistaken for complete organ-function encoding.

## Interface and engine changes

- Regimen cards and assessment pages can display an explicit encoding-maturity label.
- The local-laboratory adapter can derive an absolute AST value for source rules while showing the clinician the actual AST and calculated ×ULN value.
- The existing search-first homepage, clinical scenario interpreter, knowledge base and partial-assessment architecture are preserved.

## Governance boundary

NCCP 00450 and 00451 are marked source-reconciled at rule level but remain pending consultant oncology and oncology-pharmacy validation. `clinical_use_authorised` remains false. The current official NCCP PDF, local policy, authorised prescribing system and clinical judgement remain authoritative.
