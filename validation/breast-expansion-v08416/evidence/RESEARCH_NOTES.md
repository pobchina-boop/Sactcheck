# v0.84.16 clinician evidence audit

Checked 21 October 2026. Scope: ten requested breast suites. This is evidence research and software-content review, not independent clinical authorization. `evidence-audit.json` contains ten renderer-compatible profiles and nineteen endpoint cards. Numeric efficacy is clinician-only.

## Findings that affect interpretation

- **00217:** TTP is not PFS. EGF100151 counted breast-cancer death in TTP, versus any-cause death for PFS. The early interim TTP card must retain its own analysis and HR; the later enrollment-closure analysis has another HR. Final unadjusted OS was not statistically significant. The 2010 abstract and full-text ITT section report slightly different rounding/analyses (P=.210 versus .206); the card deliberately preserves the common nonsignificant conclusion rather than combining their CIs. It cannot rank modern HER2 options.
- **00350:** The source specifies an antibody component requiring a separately selected chemotherapy regimen. Its neoadjuvant and adjuvant indications need distinct evidence. The retrieved source says adjuvant pertuzumab reimbursement was not approved; this is a source statement, not an independently established current access status. APHINITY final OS is available as a 2025 primary investigator conference report; labelling all APHINITY OS as still immature would be stale. The cards clearly identify its publication level.
- **00526/00798:** VELVET cohort 1 is uncontrolled. The later cohort-2 result must not be accidentally paired with cohort-1 ORR. Trial dosing could escalate beyond the NCCP starting schedule. The Phesgo version additionally depends on a formulation bridge, not a separate vinorelbine survival trial.
- **00775:** The original TRAIN-2 non-anthracycline arm had nine cycles; the NCCP card has six. Outcomes support the strategy but do not directly validate six-cycle efficacy. Survival equivalence was not established.
- **00204:** CLEOPATRA outcomes concern induction plus antibody continuation. No separate maintenance benefit is calculated.
- **00507:** Weekly-paclitaxel evidence is a small single-arm cohort that included first- and second-line patients. It does not inherit CLEOPATRA's randomized survival effect.
- **00258:** The displayed BCIRG-006 comparator lacks trastuzumab. Do not describe the displayed advantage as superiority to AC→docetaxel/trastuzumab or infer proven equivalence between the trastuzumab arms. Trial trastuzumab frequency during chemotherapy also differed from NCCP.
- **00722/00731:** TRYPHAENA was centered on cardiac safety. Its breast-only pCR does not require cleared nodes and cannot be compared directly with TRAIN-2 breast-and-node pCR. The separate SC-trastuzumab formulation uses HannaH evidence, not the combined Phesgo FeDeriCa study.

## Verification

`node validation/breast-expansion-v08416/evidence/verify-evidence.cjs` passed: ten profiles, nineteen rendered endpoint cards; TTP vocabulary, nonsignificant OS wording, correct comparator, schedule differences, VELVET cohort and SC formulation references checked. No files outside this evidence directory were authored by this task.

## Primary-source locator register

All numerical claims retain links in the JSON profile and endpoint. Sources were retrieved through the web tool; full copyrighted publications were not repackaged.

| Source | Primary locator | Reviewed support |
| --- | --- | --- |
| EGF100151 interim | https://pubmed.ncbi.nlm.nih.gov/17192538/ | Abstract, independent TTP interim analysis |
| EGF100151 update | https://pubmed.ncbi.nlm.nih.gov/18188694/ | Abstract, enrollment-closure analysis |
| EGF100151 final OS | https://academic.oup.com/oncolo/article/15/9/924/6399499 | Abstract and treatment-plan/results definitions |
| NCCP 00350 v3 | https://healthservice.hse.ie/documents/6813/350_v3_Pertuzumab_Trastuz_Chemo.pdf | Page1: two indications, companion regimen, timing and reimbursement |
| NeoSphere | https://pubmed.ncbi.nlm.nih.gov/22153890/ | Abstract, breast-only pCR |
| APHINITY final investigator presentation | https://www.gbg.de/fileadmin/user_upload/Loibl_Piccart_ESMO_BC_2025_APHINITY_FA_oral_250512.pdf | Slides6–10: final OS, descriptive iDFS, nodal subgroup context |
| VELVET cohort1 | https://pubmed.ncbi.nlm.nih.gov/27955684/ | Abstract, population, denominator, dosing, ORR/PFS |
| FeDeriCa | https://pubmed.ncbi.nlm.nih.gov/33357420/ | Abstract, PK primary endpoint and early-breast setting |
| HannaH | https://pubmed.ncbi.nlm.nih.gov/22884505/ | Abstract, separate SC trastuzumab PK/pCR non-inferiority |
| TRAIN-2 primary | https://pubmed.ncbi.nlm.nih.gov/30413379/ | Original publication abstract also retrieved at https://www.sciencedirect.com/science/article/pii/S1470204518305709 |
| TRAIN-2 survival | https://jamanetwork.com/journals/jamaoncology/fullarticle/2780055 | Methods, endpoints, secondary survival analysis |
| CLEOPATRA primary | https://pubmed.ncbi.nlm.nih.gov/22149875/ | Abstract, independent PFS |
| CLEOPATRA final | https://pubmed.ncbi.nlm.nih.gov/32171426/ | Abstract, complete strategy, final descriptive OS |
| Weekly paclitaxel/HP | https://pubmed.ncbi.nlm.nih.gov/30602614/ | Abstract, mixed lines and single-arm estimates |
| BCIRG-006 | https://pubmed.ncbi.nlm.nih.gov/21991949/ | Abstract and original paper at https://www.nejm.org/doi/pdf/10.1056/NEJMoa0910383 |
