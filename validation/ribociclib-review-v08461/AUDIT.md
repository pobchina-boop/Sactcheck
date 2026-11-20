# Ribociclib / Kisqali quality review — 19 November 2026

Scope: NCCP 00525 metastatic (v6) and 00892 adjuvant (v2), based on published main commit a8ad69a63b129508de65dcb020160ce67d8b95ae. These remain distinct indications and starting doses. This is a scoped revision within release 0.84.61.

## Clinical source reconciliation

The official NCCP catalogue and extracted protocol text were checked against the downloaded EMA Kisqali European product information (SHA256 808e9743b462916472557a0fc0a032e5a4cdf4c2e48d8fd0f992823e92cc05c1). The supplied Novartis US prescribing and patient leaflets were supporting references, not replacements for Irish dosing instructions. Endocrine symptom descriptions were checked against anastrozole product information and NHS patient advice.

Reviewed domains: indication and endocrine partner; 21-on/7-off dosing; baseline versus on-treatment QT limits; neutropenia and febrile neutropenia; transaminase and combined bilirubin thresholds; renal and hepatic starting-dose distinctions; dose floor; ILD; interacting medicines; monitoring. Existing clinical rules were retained except the explicit changes below.

Changes: metastatic further-reduction-required input now applies the general 200 mg dose floor to all reasons for toxicity dose reduction. The previous recurrent-neutropenia trigger remains. Both interaction warnings explicitly distinguish inhibitors, inducers, additive QT effects and effects on other medicines; no automatic interaction dose recommendation is issued.

Existing source conflicts remain visible and require specialist reconciliation: metastatic NCCP versus current SmPC QT restart/recurrence guidance; NCCP grade-2 ILD wording; adjuvant node-negative eligibility wording. Normal current values do not establish that a historical contraindication or permanent-stop decision has resolved. This stateless assessment is not a longitudinal prescribing record or a comprehensive interaction checker.

Software evidence: clinical-audit.json records 56 focused boundary and mixed-risk scenarios, including missing inputs and no numeric restart dose during interruption. The retained v0837 and v0838 clinical suites also passed (139 and 120 cases across their respective breast regimens). These are software checks, not independent consultant/pharmacy sign-off. Existing clinical-use-authorised flags remain false.

## Patient and document changes

Kisqali is named alongside ribociclib. Five urgent warning signs supplement the anatomical map; common effects and endocrine effects have separate illustrated sections. Interaction advice appears in the knowledge base and patient portal. Practical-support paragraphs are retained with their headings during print deduplication. The standalone passport has an introductory page and four reusable cycle sheets; patient severity ratings are distinct from clinician-assigned CTCAE grades.

Consent action now directly downloads the existing regimen-specific PDF; shared-context selectors remain selectors. The ribociclib document retains all source consent content across two branded pages. It is a printable discussion/consent aid, not a signed or institution-approved consent record.

The complete handbook retains every audited source clause and the existing anatomy and wallet content. Source retention, page bounds and pagination are checked by the existing publication pipeline. Passport and consent PDFs were visually inspected. Browser testing remains outstanding because Chromium cannot launch in this workspace and the shared browser cannot reach its local preview. Do not describe this as a fully browser-verified release.
