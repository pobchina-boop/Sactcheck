# Regimen Information and Evidence Governance — v0.56.1

## Purpose

The Regimen info function provides concise educational and evidential context for an encoded NCCP regimen. It is separate from the deterministic assessment engine and does not govern eligibility, toxicity grading, dose modification, prescribing or final SACT decisions.

## Source hierarchy

### Operational authority

1. Current official NCCP regimen protocol
2. Current authorised product information where applicable
3. Approved local institutional policy

### Supporting context

1. Primary randomised or registration trial publication
2. Prespecified or mature follow-up publication
3. Relevant meta-analysis or systematic review
4. Current professional-society guideline
5. Historical or component-level evidence where exact regimen evidence is unavailable

Supporting evidence cannot override the current NCCP protocol.

## Reusable content layers

### Drug profile

One reusable record per medicine containing the generic name, recognised aliases, drug type, pharmacological class, mechanism of action and broad monitoring themes.

### Evidence record

One record per protocol-to-publication mapping containing the trial, publication identifiers, population, intervention, comparator, endpoint, key findings, limitations and match type.

### Regimen profile

One record per priority regimen containing the treatment setting, regimen role, clinical overview, component rationale, schedule context and orientation points.

## Minimum evidence requirements

Each approved evidence mapping should include:

- exact SACTCheck protocol identifier;
- NCCP regimen number and version;
- publication title, journal and year;
- stable PMID and PubMed link;
- DOI and DOI link where available;
- disease and treatment setting;
- study design;
- trial population;
- intervention and comparator;
- primary endpoint;
- concise paraphrased findings;
- clinically important limitations;
- evidence-match category;
- last-reviewed date and reviewer status.

## Evidence-match wording

The interface must distinguish among:

- exact regimen and indication;
- exact treatment strategy with a schedule or component difference;
- exact medicine and disease setting;
- component-level supporting evidence;
- historical or indirect evidence.

Indirect or context-specific evidence must not be presented as an exact match.

## Review workflow

1. Confirm the exact NCCP regimen number, version and indication.
2. Verify the primary publication title, PMID and DOI.
3. Confirm the population, intervention, comparator and endpoint.
4. Check every displayed numerical result against the publication.
5. Identify material schedule, eligibility, population or component differences.
6. Review each mechanism summary against an authoritative medicine source.
7. Edit the page for clarity and proportionality.
8. Record reviewer identity, status and date.
9. Re-review when the NCCP protocol, product information or evidence mapping changes.

## Copyright and summarisation controls

The knowledge base must use original concise paraphrases. It must not reproduce full abstracts, publication tables or figures, substantial passages from articles, pharmaceutical educational artwork or proprietary guideline text.

The product's software, schema, interface, curation, source selection, arrangement and edited summaries remain distinct from the linked third-party publications.

## Interface requirements

Every detailed page must display:

- the exact NCCP protocol and version;
- the official NCCP link;
- publication identifiers and links;
- evidence match type;
- limitations;
- review status;
- the educational and decision-support boundary.

The page must never use a publication result as an assessment rule or treatment instruction.
