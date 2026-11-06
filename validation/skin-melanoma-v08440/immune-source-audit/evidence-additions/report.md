# Immune-regimen evidence additions — v0.84.40

Six primary evidence records and two scoped profile additions are ready in `evidence-additions.json`. Merge evidence fields only; preserve unrelated clinical content and cervical evidence.

- **00431:** separate the original CheckMate 067 PFS analysis from final 10-year OS. The original PFS hazard-ratio confidence interval is **99.5%**, not 95%. Combination versus nivolumab alone remains descriptive, not a powered superiority comparison. Preserve CheckMate 204 as separate CNS context.
- **00812:** keep three cohorts distinct: original metastatic weight-based dosing, locally advanced weight-based dosing, and the later exact 350 mg every-three-weeks metastatic cohort. Response rates are not comparative survival benefits.
- **Legacy consistency:** old 00431 knowledge text has ECOG 0–1 and symptomatic ILD as an exclusion. Current NCCP v11 uses ECOG 0–2 and ILD as a caution. The trial population remains ECOG 0–1.
- **Regulatory scope:** retrieved EMA information now includes adjuvant CSCC, but the retained NCCP 00812 v3a does not. This addition makes no adjuvant suite or reimbursement claim.

Every record identifies population, dose, comparator, endpoint, analysis timepoint, numerical findings and limitations. Independent consultant, pharmacy and PPI approval remains pending. See `report.json` for source URLs and retrieval limitations.
