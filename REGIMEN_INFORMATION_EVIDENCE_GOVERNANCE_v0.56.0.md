# Regimen Information and Evidence Governance — v0.56.0

## Purpose

The Regimen info function provides educational context around an encoded NCCP regimen. It is separate from the deterministic assessment engine and does not govern treatment eligibility, toxicity grading, dose modification or prescribing.

## Source hierarchy

### Operational authority

1. Current official NCCP regimen protocol
2. Current authorised product information where applicable
3. Approved local institutional policy

### Supporting context

1. Primary randomised or registration trial publications
2. Relevant systematic reviews or meta-analyses
3. Current professional-society guidelines
4. Historical or component-level evidence where an exact regimen publication is unavailable

A supporting publication cannot override the current NCCP regimen.

## Required evidence-record fields

Each evidence mapping must include:

- exact SACTCheck protocol identifier;
- trial acronym where available;
- publication title;
- journal and year;
- stable PMID and PubMed link;
- disease and treatment context;
- study design;
- concise paraphrased relevance statement;
- important limitation statement;
- evidence-match category;
- clinical review status.

## Evidence-match categories

- Exact regimen and indication
- Exact medicine and disease setting
- Exact combination and treatment setting
- Shared or context-specific protocol evidence
- Component-level supporting evidence
- Guideline or consensus support
- Historical or indirect evidence

The interface must not describe indirect or context-specific evidence as an exact match.

## Drafting and copyright controls

AI-assisted drafting may be used to produce an initial concise summary. The final stored wording must be reviewed and edited by an appropriate clinician or oncology pharmacist.

The knowledge base must not reproduce:

- full abstracts;
- publication tables or figures;
- substantial passages from copyrighted articles;
- pharmaceutical-company educational artwork;
- proprietary guideline text beyond short, appropriately attributed excerpts.

The SACTCheck-owned elements include its software, schema, interface, source selection, arrangement, curation and human-edited summaries. AI assistance alone should not be relied upon as the legal basis for copyright ownership.

## Clinical review workflow

1. Confirm exact NCCP protocol and version.
2. Verify the publication identifier and direct link.
3. Confirm the population, intervention, comparator and treatment setting.
4. Confirm that the relevance statement does not overstate the evidence.
5. Record limitations, including schedule or indication differences.
6. Review the mechanism summary against an authoritative medicines source.
7. Record Consultant Oncology and oncology-pharmacy review status.
8. Re-review when the NCCP regimen, medicine authorisation or evidence mapping changes.

## Interface requirements

The page must always display:

- the current NCCP protocol link;
- evidence review status;
- limitations;
- the educational and decision-support boundary;
- a clear empty state where no evidence mapping has been reviewed.

The page must never display a publication link as an assessment rule or treatment instruction.
