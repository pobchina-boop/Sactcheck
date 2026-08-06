# SACTCheck v0.59.0 — Library-Wide Organ-Function Reconciliation

Release date: 5 August 2026

## Scope

v0.59.0 completes the organ-function remediation programme started in v0.58.1. It reconciles all 74 protocol records that had been deliberately marked as partially rule-encoded because their renal or hepatic decision pathways were incomplete or overstated.

The release preserves the v0.57.0 search-first interface, the collapsed early-development Clinical Scenario Interpreter and the cumulative ten-regimen knowledge base.

## Reconciliation result

- Protocols in the v0.59.0 reconciliation scope: **74**
- Protocols receiving structured renal/hepatic decision rules: **70**
- Protocols explicitly documented as having no prescriptive organ-function dose-adjustment table in the mapped source: **4**
- New executable v0.59.0 organ-function rules: **299**
- Records remaining at `partial_rule_encoding`: **0**
- Audit issues after reconciliation: **0**
- Protocol JSON files intentionally changed from v0.58.1: **74**
- Protocol JSON files added or removed: **0**

The four explicit no-prescriptive-adjustment records are NCCP 00207, 00214, 00225 and 00732. No artificial CrCl, bilirubin or transaminase cutoff was introduced where the mapped source did not provide a prescriptive adjustment pathway.

## Clinical encoding mechanism

The reconciliation uses component-specific profiles rather than one generic whole-regimen renal/hepatic rule. Depending on the source pathway, the structured inputs now include:

- exact CrCl/GFR values where formula-based or continuous dosing requires them;
- protocol-specific renal-function bands where the source uses discrete ranges;
- dialysis status where the source distinguishes it;
- absolute bilirubin values or bilirubin ×ULN, according to the source table;
- AST/ALT values, ×ULN values or Child–Pugh class where applicable;
- qualitative renal/hepatic impairment categories when the source uses clinical severity rather than a numerical threshold;
- treatment-emergent organ toxicity inputs for agents whose source pathway uses interruption, reduction or discontinuation rules.

Combination regimens can therefore return different actions for individual components from the same renal or hepatic result. The application does not collapse these into an unsupported whole-regimen rule.

## Partial-assessment behaviour

All added organ-function inputs are optional. A clinician may enter one available value or one source-defined band and receive an assessment for that domain alone. Missing renal, hepatic, haematological or toxicity domains remain visibly unassessed and are not assumed normal.

## Reusable profiles and protocol-specific exceptions

The implementation introduces reusable organ-function profiles for commonly repeated components, including fluorouracil, capecitabine, cisplatin, carboplatin, oxaliplatin, irinotecan, gemcitabine, pegylated liposomal doxorubicin, anthracyclines, docetaxel, pemetrexed, topotecan, temozolomide, mitomycin and selected targeted therapies.

Profiles are applied only to the registered protocols in this release. Protocol-specific thresholds and exceptions remain encoded at protocol level; a shared component profile is not treated as universal prescribing guidance outside its mapped source context.

## Integrity controls

v0.59.0 adds:

- `V0590_ORGAN_FUNCTION_SOURCE_REGISTER.json` and `.md`, mapping all 74 records to their NCCP code, title, source URL, source version, components and reconciliation resolution;
- a library-wide structural audit in JSON, CSV and Markdown;
- a SHA-256 register covering all 382 protocol JSON files, including the catalogue index;
- regression tests confirming all 299 new rules are executable through the live assessment engine;
- sentinel clinical-pathway tests across cytotoxic, radiopharmaceutical and targeted-therapy regimens;
- an idempotent reconciliation script so the same source register can be rebuilt without duplicating rules.

## User-interface changes

The application version and release panel now identify v0.59.0. The assessment UI preserves the existing laboratory grouping and protocol-specific renal-band controls. No additional mandatory fields were introduced.

## Governance boundary

This release is a source-mapping and software reconciliation milestone. Independent consultant oncology and oncology-pharmacy validation remains pending for the newly reconciled records, and `clinical_use_authorised` remains false. Automated testing demonstrates internal consistency, not clinical authorisation. The current official NCCP protocol, local policy, authorised prescribing system and clinical judgement remain authoritative.
