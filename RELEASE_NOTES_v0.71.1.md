# SACTCheck v0.71.1 - Streamlined Two-Page Consent PDF

## Clinic workflow
The consent workflow is deliberately shortened for busy clinics.

- **Consent PDF** on a regimen card now immediately generates the finished consent PDF.
- There is no full-screen consent editor in the normal workflow.
- The generated document is fixed to **two A4 pages** so it can be printed as one double-sided sheet.
- Blank patient identifiers, consent discussion fields and signatures are completed on the approved record / printed form rather than entered into SACTCheck.

## PDF structure
**Page 1**
1. Treatment and NCCP regimen context
2. Generic SACT / chemotherapy consent
3. Regimen- and agent-specific material-risk prompts

**Page 2**
4. Immunotherapy / immune-related risks when an immune-checkpoint inhibitor is present
5. Expected benefit / aim
6. Reasonable alternatives
7. What may happen if treatment does not proceed
8. Additional patient-specific material risks
9. Pregnancy / contraception / fertility and information discussion
10. Patient and clinician consent / signatures

## Add agent
Each regimen card now has a compact **+ Agent** button.

- Clicking **+ Agent** opens a lightweight search popup.
- Search accepts generic names and common trade names such as **bevacizumab / Avastin** and **pembrolizumab / Keytruda**.
- Select one or more agents and they are added to that regimen's consent composition for the current browser session.
- Added agents appear as removable chips.
- The standard **Consent PDF** button then includes those added agents automatically.
- Adding an immune-checkpoint inhibitor automatically activates the immunotherapy consent section.

Clinician-added agents are labelled **CLINICIAN ADDED** in the PDF and the form states that their inclusion does not represent NCCP endorsement of the modified regimen.

## Safety / governance
- Agent additions are held only in memory; they are not written to localStorage or sessionStorage.
- SACTCheck does not request or store patient name, MRN or DOB in the consent workflow.
- Unmapped regimen medicines remain explicitly visible as requiring manual agent review.
- Current NCCP regimen sources, current medicine information, HSE consent policy, patient-specific material risks and clinician judgement remain authoritative.
- Agent-specific consent content remains pending independent Consultant Oncology and oncology-pharmacy review.

## Clinical engine
No protocol JSON, laboratory threshold, eligibility rule, dose action, toxicity rule or other deterministic assessment logic is changed in v0.71.1.
