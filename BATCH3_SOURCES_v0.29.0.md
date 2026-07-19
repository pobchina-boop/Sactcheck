# SACTCheck v0.29.0 — Batch 3 source audit

Source documents were checked against the official HSE/NCCP SACT library on 19 July 2026.

## Published protocols

1. **NCCP 00215 v7 — Bevacizumab 15 mg/kg Therapy, 21 days**  
   Official PDF: https://healthservice.hse.ie/documents/6940/00215_Bevacizumab_15.pdf

2. **NCCP 00306 v7 — Gemcitabine 1000 mg/m² and CARBOplatin AUC4, 21 days**  
   Official PDF: https://healthservice.hse.ie/documents/6710/306_Gem_CARBOAUC_4_.pdf

3. **NCCP 00624 v3 — CARBOplatin AUC5 and pegylated liposomal DOXOrubicin 30 mg/m², 28 days**  
   Official PDF: https://healthservice.hse.ie/documents/6685/624_V3_Carbo_AUC5_pegylated_dox_30.pdf

4. **NCCP 00799 v2 — Bevacizumab, PACLitaxel and CISplatin for cervical cancer**  
   Official PDF: https://healthservice.hse.ie/documents/6422/799_V2_Bev_Pacli_CIS.pdf

5. **NCCP 00862 v2 — Niraparib tablets monotherapy**  
   Official PDF: https://healthservice.hse.ie/documents/6437/862_V2_Niraparib_Tablets_Monotherapy.pdf

## Source-integrity correction

The preliminary Batch 3 list referred to **bevacizumab + carboplatin + pegylated liposomal doxorubicin**. A current official NCCP protocol for that triple was not identified in the HSE gynaecology SACT library. SACTCheck therefore does not publish or infer that regimen. Batch 3 instead encodes the official NCCP 00624 **carboplatin + pegylated liposomal doxorubicin** doublet.

## Governance

These files are deterministic decision-support encodings, not validated prescribing protocols. The official NCCP PDF remains the source of truth. Consultant, oncology-pharmacy, local governance and boundary review are required before clinical deployment.
