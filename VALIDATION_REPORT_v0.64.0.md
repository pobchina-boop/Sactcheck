# SACTCheck v0.64.0 Validation Report

## Scope

This report validates the addition of three evidence audited regimen knowledge profiles and three source confirmed emetogenic classification corrections.

## Knowledge base

Profiles before release: 18

Profiles after release: 21

Principal evidence records before release: 42

Principal evidence records after release: 45

Drug profiles after release: 28

## New profile coverage

1. NCCP 00945 v1, Enfortumab Vedotin and Pembrolizumab Therapy.
2. NCCP 00844 v4a, Nivolumab and FOLFOX 6 Modified Therapy.
3. NCCP 00431 v10, Nivolumab and Ipilimumab Therapy.

Each new profile contains patient selection, supportive care, monitoring and toxicity, administration and evidence completeness sections.

## Evidence checks

EV 302 primary and 2.5 year follow up are present.

CheckMate 649 primary, 3 year follow up and 5 year follow up are present.

CheckMate 648 primary and 29 month follow up are present for the oesophageal squamous indication.

CheckMate 067 primary and final 10 year outcomes are present.

CheckMate 204 is present as contextual CNS evidence and is not presented as overriding NCCP CNS cautions.

## Antiemetic reconciliation

NCCP SACT Antiemetic Guidance V6 Table 7 was used to verify the highest active parenteral component in the three new profiles.

NCCP 00844 now maps to moderate risk through oxaliplatin.

NCCP 00945 now maps to low risk through enfortumab vedotin.

NCCP 00431 now maps to low risk through ipilimumab.

The existing traffic light model and national NCCP antiemetic guidance links remain unchanged.

## Protocol integrity

Three protocol JSON files changed. In every case the difference is confined to supportive care classification metadata. The clinical core fields comprising inputs, required inputs, deterministic rules, treatment definitions, eligibility and exclusions are unchanged from v0.63.1.

## Automated validation

Complete cumulative test suite: passed.

Focused v0.64.0 knowledge base tests: passed.

Historical national NCCP antiemetic guidance tests with approved v0.64.0 classification corrections: passed.

Repository security scan: passed across 1014 text files before release documentation was added.

Deployable site build: passed with 382 protocol JSON files copied.

Deployable site validation: passed.

## Clinical governance

The knowledge content is educational and source linked. It does not independently determine treatment eligibility or alter deterministic SACTCheck assessment results. Independent consultant oncology and oncology pharmacy validation remains pending. The current official NCCP protocol remains authoritative.
