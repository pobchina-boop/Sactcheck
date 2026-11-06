# 00236 ERIVANCE evidence reconciliation

The existing EMA-attributed response figures are correct: **11/33 (33.3%, 95% CI 19.2-51.8%)** in metastatic BCC and **30/63 (47.6%, 35.5-60.6%)** in locally advanced BCC. The key correction is the analysis description: **21 months after the last enrolment**, corresponding to the publication's 12-month update after its primary 9-month analysis. It is not a uniform treatment duration.

The original 2012 independent-review results were 10/33 and 27/63 (30% and 43%, rounded). The later 39-month figures, 48.5% and 60.3%, were investigator assessed. Keep these analyses separate. All efficacy analyses use 96 eligible pathology-confirmed cases from 104 treated participants. The two cohorts use different response criteria. No comparison-treatment arm existed.

Ready integration files are `evidence-records.json`, `regimen-profile-evidence-patch.json` and `patient-evidence-patch.json`. The clinician record fits the existing evidence-card fields. The profile patch also removes the unrelated BRAF V600 factor and replaces the quantitative-audit placeholder. Clinical approval remains false.

Primary sources: Sekulic et al., NEJM 2012, DOI 10.1056/NEJMoa1113713; Sekulic et al., JAAD 2015, DOI 10.1016/j.jaad.2015.03.021; Sekulic et al., BMC Cancer 2017, DOI 10.1186/s12885-017-3286-5; retained current EMA Erivedge product information section 5.1/Table 2, pp10-11. EMA Table 2 was also visually inspected.

Direct NCBI downloads returned browser-challenge responses; those files are explicitly labelled unsuccessful captures. Supported web retrieval supplied the original paper's methods/results and update abstracts. These do not claim to be raw article PDFs. The complete official EMA PDF supplies the precise updated outcome table and is already retained with SHA-256.
