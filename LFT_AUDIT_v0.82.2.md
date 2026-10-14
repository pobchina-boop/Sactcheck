# Regimen-by-regimen LFT audit — v0.82.2

## Scope and findings

All **379 regimen files** were scanned recursively. **251 regimens contain 465 numeric LFT ×ULN definitions**; all now resolve to automatic actual-result conversion. The remaining **128 regimens have no mapped numeric LFT ×ULN definition**; this does not imply that liver assessment is clinically unnecessary. Absolute values, categories and clinical judgements remain unchanged.

The previous shallow scan counted 437 ALT/AST/bilirubin definitions. Nested haematology contributes another 15, and ALP contributes 13: **437 + 15 + 13 = 465**. The hotfix already supported those 15 nested fields at runtime; this release adds explicit audit/test coverage for them.

Relative to pre-hotfix v0.82.1, 34 additional historical/component aliases and 13 ALP fields are covered. Coverage counts are input definitions, not unique regimens or independent clinical rules.

## Newly converted ALP fields

| Regimen | Field |
|---|---|
| 00202-docetaxel-100-21-day | `alp_uln_multiple` |
| 00204-pertuzumab-trastuzumab-docetaxel | `alk_phos_uln` |
| 00350-pertuzumab-trastuzumab-chemotherapy | `alk_phos_uln_multiple` |
| 00423-at-doxorubicin-docetaxel | `alp_uln_multiple` |
| 00722-tchp-docetaxel-carboplatin-trastuzumab-pertuzumab | `alk_phos_uln_multiple` |
| 00731-tch-subcutaneous-p | `alk_phos_uln_multiple` |
| 00775-pertuzumab-trastuzumab-paclitaxel-carboplatin-train2 | `alk_phos_uln_multiple` |
| 00789-phesgo-tchp | `alk_phos_uln_multiple` |
| 00790-phesgo-paclitaxel-carboplatin-train2 | `alk_phos_uln_multiple` |
| 00796-phesgo-docetaxel | `alk_phos_uln` |
| 00372-nintedanib-therapy-with-docetaxel | `alp_uln_multiple` |
| 00374-trabectedin-monotherapy | `alp_uln_multiple` |
| 00501-gemcitabine-and-docetaxel-therapy-21-day | `alp_uln_multiple` |

## Regimens with automatic conversion by folder

| Folder | Regimens |
|---|---:|
| breast | 32 |
| gastrointestinal | 52 |
| genitourinary | 24 |
| gynaecology | 31 |
| haemato-oncology/plasma-cell | 15 |
| head-neck | 21 |
| lung | 38 |
| sarcoma | 16 |
| shared | 12 |
| skin | 9 |
| tumour-agnostic | 1 |

## Complete regimen inventory

“None” means no numeric LFT ×ULN definition in that file, not a clinical recommendation. Fields are listed by internal identifier to make review reproducible. No protocol definitions were changed.

| Regimen | Folder | Automatic fields |
|---|---|---|
| ecog-context-placeholder | _shared | None |
| single-agent-ici-profile | _shared | None |
| protocol-template | _template | None |
| 00200-trastuzumab-iv-q21d | breast | None |
| 00201-trastuzumab-iv-weekly | breast | None |
| 00202-docetaxel-100-21-day | breast | `alp_uln_multiple`, `ast_alt_uln_multiple`, `bilirubin_uln_multiple` |
| 00203-docetaxel-75-21-day | breast | None |
| 00204-pertuzumab-trastuzumab-docetaxel | breast | `alk_phos_uln`, `ast_alt_uln`, `bilirubin_uln` |
| 00205-pegylated-liposomal-doxorubicin | breast | `bilirubin_uln_multiple` |
| 00206-t-dm1-metastatic | breast | None |
| 00212-bevacizumab-q14d | breast | None |
| 00217-lapatinib-capecitabine | breast | None |
| 00228-eribulin-monotherapy | breast | None |
| 00230-nab-paclitaxel-q21d | breast | None |
| 00232-vinorelbine-iv | breast | None |
| 00250-docetaxel-cyclophosphamide | breast | `bilirubin_uln_multiple`, `alt_uln_multiple` |
| 00251-carboplatin-q28d | breast | None |
| 00252-ac-doxorubicin-cyclophosphamide | breast | `bilirubin_uln_multiple`, `alt_uln_multiple`, `ast_uln_multiple` |
| 00253-tamoxifen | breast | None |
| 00254-anastrozole-monotherapy | breast | None |
| 00258-tch-docetaxel-carboplatin-trastuzumab | breast | None |
| 00259-vinorelbine-oral | breast | `alt_uln_multiple`, `ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00260-ac-followed-by-weekly-paclitaxel | breast | None |
| 00261-carboplatin-q21d | breast | None |
| 00262-ec90 | breast | `ast_uln_multiple` |
| 00263-ec75 | breast | `ast_uln_multiple` |
| 00265-fec100 | breast | None |
| 00269-fec50 | breast | `ast_uln_multiple` |
| 00272-trastuzumab-sc-q21d-metastatic | breast | None |
| 00278-dose-dense-ac-paclitaxel-14-day | breast | None |
| 00285-trastuzumab-sc-q21d-ebc | breast | None |
| 00316-ddac-paclitaxel-14-day-trastuzumab | breast | None |
| 00322-everolimus-exemestane | breast | None |
| 00348-carbo-auc6-paclitaxel-ddac | breast | `alt_ratio_uln`, `bilirubin_ratio_uln` |
| 00350-pertuzumab-trastuzumab-chemotherapy | breast | `alt_ast_uln_multiple`, `alk_phos_uln_multiple` |
| 00361-fulvestrant-monotherapy | breast | None |
| 00371-letrozole-monotherapy | breast | None |
| 00376-exemestane-monotherapy | breast | None |
| 00377-cmf-oral | breast | None |
| 00378-cmf-iv-28-day | breast | None |
| 00381-cmf-iv-21-day | breast | None |
| 00414-palbociclib | breast | None |
| 00423-at-doxorubicin-docetaxel | breast | `ast_uln_multiple`, `alp_uln_multiple`, `ast_alt_uln_multiple`, `bilirubin_uln_multiple` |
| 00430-gemcitabine-carboplatin | breast | None |
| 00432-ac-weekly-paclitaxel-trastuzumab | breast | None |
| 00433-ddac-weekly-paclitaxel-trastuzumab | breast | None |
| 00485-dose-dense-ac-weekly-paclitaxel | breast | None |
| 00507-pertuzumab-trastuzumab-paclitaxel | breast | `alt_ratio_uln`, `bilirubin_ratio_uln` |
| 00512-paclitaxel-trastuzumab-weekly | breast | `bilirubin_uln_multiple`, `alt_uln_multiple` |
| 00525-ribociclib-metastatic | breast | None |
| 00526-pertuzumab-trastuzumab-vinorelbine | breast | None |
| 00545-zoledronic-acid-adjuvant | breast | None |
| 00605-talazoparib | breast | `bilirubin_uln`, `ast_uln` |
| 00619-abemaciclib-adjuvant | breast | None |
| 00621-paclitaxel-weekly-3-of-4 | breast | `alt_ratio_uln`, `bilirubin_ratio_uln` |
| 00659-t-dm1-early-breast | breast | None |
| 00688-atezolizumab-nab-paclitaxel | breast | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00720-neratinib-extended-adjuvant | breast | None |
| 00722-tchp-docetaxel-carboplatin-trastuzumab-pertuzumab | breast | `alt_ast_uln_multiple`, `alk_phos_uln_multiple` |
| 00726-pertuzumab-trastuzumab-maintenance | breast | None |
| 00731-tch-subcutaneous-p | breast | `alt_ast_uln_multiple`, `alk_phos_uln_multiple` |
| 00734-weekly-carbo-paclitaxel-ddac | breast | `alt_ratio_uln`, `bilirubin_ratio_uln` |
| 00736-nab-paclitaxel-weekly | breast | None |
| 00738-bevacizumab-paclitaxel | breast | `alt_uln_multiple`, `bilirubin_uln_multiple` |
| 00743-eribulin-monotherapy-28-day | breast | None |
| 00745-ddac-weekly-paclitaxel-trastuzumab-q21d | breast | None |
| 00749-gemcitabine-800-monotherapy | breast | `transaminase_uln_multiple` |
| 00775-pertuzumab-trastuzumab-paclitaxel-carboplatin-train2 | breast | `alt_ast_uln_multiple`, `alk_phos_uln_multiple` |
| 00776-trastuzumab-deruxtecan | breast | None |
| 00785-phesgo-maintenance | breast | None |
| 00789-phesgo-tchp | breast | `alt_ast_uln_multiple`, `alk_phos_uln_multiple` |
| 00790-phesgo-paclitaxel-carboplatin-train2 | breast | `alt_ast_uln_multiple`, `alk_phos_uln_multiple` |
| 00794-sacituzumab-govitecan | breast | None |
| 00796-phesgo-docetaxel | breast | `alk_phos_uln`, `ast_alt_uln`, `bilirubin_uln` |
| 00797-phesgo-paclitaxel | breast | `alt_ratio_uln`, `bilirubin_ratio_uln` |
| 00798-phesgo-vinorelbine | breast | None |
| 00815-paclitaxel-weekly-trastuzumab-3weekly | breast | `alt_uln_multiple`, `bilirubin_uln_multiple` |
| 00857-pembro-carbo-paclitaxel-ac | breast | `alt_ratio_uln`, `bilirubin_ratio_uln` |
| 00858-pembro-weekly-carbo-paclitaxel-ac | breast | `alt_ratio_uln`, `bilirubin_ratio_uln` |
| 00860-pembro400-carbo-paclitaxel-ddac | breast | `alt_ratio_uln`, `bilirubin_ratio_uln` |
| 00861-pembro400-weekly-carbo-paclitaxel-ddac | breast | `alt_ratio_uln`, `bilirubin_ratio_uln` |
| 00892-ribociclib-adjuvant | breast | None |
| 00936-tucatinib-trastuzumab-capecitabine | breast | None |
| 00207-cetuximab-therapy-7-days | gastrointestinal | None |
| 00209-modified-folfox6 | gastrointestinal | None |
| 00210-folfox-4-therapy-14-day | gastrointestinal | None |
| 00213-irinotecan-monotherapy-21-day | gastrointestinal | `bilirubin_uln_multiple`, `irinotecan_bilirubin_uln` |
| 00216-capecitabine-monotherapy | gastrointestinal | `bilirubin_ratio_uln`, `alt_ast_ratio_uln` |
| 00225-panitumumab-6-mg-kg-therapy | gastrointestinal | None |
| 00227-folfiri | gastrointestinal | `bilirubin_ratio_uln` |
| 00235-teysuno-s-1-and-cisplatin-28-day | gastrointestinal | None |
| 00238-aflibercept-folfiri | gastrointestinal | `bilirubin_ratio_uln` |
| 00239-eox-epirubicin-oxaliplatin-and-capecitabine-therapy | gastrointestinal | `capecitabine_bilirubin_uln`, `capecitabine_alt_ast_uln`, `epirubicin_ast_uln` |
| 00240-ecf-epirubicin-cisplatin-and-5-fluorouracil-therapy | gastrointestinal | `epirubicin_ast_uln` |
| 00244-regorafenib | gastrointestinal | `alt_ast_ratio_uln`, `bilirubin_ratio_uln` |
| 00256-nab-paclitaxel-gemcitabine | gastrointestinal | `bilirubin_uln_multiple`, `ast_uln_multiple` |
| 00283-gemcitabine-1000-mg-m2-monotherapy-56-day | gastrointestinal | None |
| 00294-sorafenib-therapy | gastrointestinal | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00321-xelox-capox | gastrointestinal | `bilirubin_ratio_uln`, `alt_ast_ratio_uln` |
| 00328-cetuximab-7-day-and-folfiri-14-day-therapy | gastrointestinal | `bilirubin_uln_multiple`, `irinotecan_bilirubin_uln` |
| 00329-folfirinox | gastrointestinal | `bilirubin_ratio_uln` |
| 00330-cetuximab-7-day-and-irinotecan-14-day-therapy | gastrointestinal | `bilirubin_uln_multiple`, `irinotecan_bilirubin_uln` |
| 00331-cetuximab-14-day-and-irinotecan-14-day-therapy | gastrointestinal | `bilirubin_uln_multiple`, `irinotecan_bilirubin_uln` |
| 00344-flot-therapy-14-day | gastrointestinal | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00380-ecx-epirubicin-cisplatin-and-capecitabine-therapy | gastrointestinal | `capecitabine_bilirubin_uln`, `capecitabine_alt_ast_uln`, `epirubicin_ast_uln` |
| 00382-trifluridine-tipiracil | gastrointestinal | `bilirubin_ratio_uln` |
| 00383-gemcitabine-1000-mg-m2-and-cisplatin-25-mg-m2-21-day | gastrointestinal | None |
| 00384-gemcitabine-1000-mg-m2-and-capecitabine-650-mg-m2-21-day | gastrointestinal | `capecitabine_bilirubin_uln`, `capecitabine_alt_ast_uln` |
| 00386-doxorubicin-60-mg-m2-therapy | gastrointestinal | None |
| 00421-5-fluorouracil-continuous-infusion-and-radiotherapy | gastrointestinal | None |
| 00422-carboplatin-auc2-and-paclitaxel-50-mg-m2-weekly-with-radiotherapy | gastrointestinal | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00427-roswell-park-modified-5-fluorouracil-and-folinic-acid | gastrointestinal | None |
| 00428-quasar-modified-5-fluorouracil-and-folinic-acid-weekly | gastrointestinal | None |
| 00429-eof-epirubicin-oxaliplatin-and-5-fluorouracil-therapy | gastrointestinal | `epirubicin_ast_uln` |
| 00446-bevacizumab-modified-folfox6 | gastrointestinal | None |
| 00447-panitumumab-modified-folfox6 | gastrointestinal | None |
| 00448-panitumumab-folfiri | gastrointestinal | `bilirubin_ratio_uln` |
| 00449-bevacizumab-folfiri | gastrointestinal | `bilirubin_ratio_uln` |
| 00451-5-fluorouracil-4-day-mitomycin-and-radiotherapy | gastrointestinal | `ast_uln_multiple` |
| 00460-cisplatin-75-mg-m2-and-5-fluorouracil-chemoradiation-herskovic | gastrointestinal | None |
| 00473-cisplatin-and-capecitabine-adjuvant-chemoradiation-therapy | gastrointestinal | `capecitabine_bilirubin_uln`, `capecitabine_alt_ast_uln` |
| 00486-flox-therapy | gastrointestinal | None |
| 00502-trastuzumab-5-fluorouracil-and-cisplatin-therapy-21-day | gastrointestinal | None |
| 00505-capecitabine-and-temozolomide-therapy | gastrointestinal | `capecitabine_bilirubin_uln`, `capecitabine_alt_ast_uln` |
| 00509-modified-folfox-6-chemoradiation-therapy-14-day | gastrointestinal | None |
| 00515-modified-folfirinox | gastrointestinal | `bilirubin_ratio_uln` |
| 00521-gemcitabine-1000-mg-m2-and-radiotherapy | gastrointestinal | None |
| 00522-gemcitabine-400-mg-m2-and-radiotherapy | gastrointestinal | None |
| 00523-capecitabine-and-radiotherapy-7-day | gastrointestinal | `capecitabine_bilirubin_uln`, `capecitabine_alt_ast_uln` |
| 00524-gemcitabine-1000-mg-m2-and-capecitabine-830-mg-m2-28-day | gastrointestinal | `capecitabine_bilirubin_uln`, `capecitabine_alt_ast_uln` |
| 00555-folfoxiri | gastrointestinal | `bilirubin_ratio_uln` |
| 00559-gemcitabine-600-mg-m2-and-radiotherapy | gastrointestinal | None |
| 00585-cetuximab-14-day-and-folfiri-14-day-therapy | gastrointestinal | `bilirubin_uln_multiple`, `irinotecan_bilirubin_uln` |
| 00586-capecitabine-825-mg-m2-and-radiotherapy-7-day | gastrointestinal | `capecitabine_bilirubin_uln`, `capecitabine_alt_ast_uln` |
| 00594-cisplatin-5-fluorouracil-and-radiation-therapy | gastrointestinal | None |
| 00623-bevacizumab-7-5-mg-kg-and-capecitabine-1250-mg-m2-therapy | gastrointestinal | `capecitabine_bilirubin_uln`, `capecitabine_alt_ast_uln` |
| 00642-lutetium-177-oxodotreotide-lutathera-therapy | gastrointestinal | None |
| 00644-lenvatinib-therapy-hcc | gastrointestinal | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00654-irinotecan-150-mg-m2-monotherapy-28-day | gastrointestinal | `bilirubin_uln_multiple`, `irinotecan_bilirubin_uln` |
| 00660-5fu-folinic-acid | gastrointestinal | None |
| 00691-folfirinox-therapy-rectal-carcinoma | gastrointestinal | `bilirubin_uln_multiple` |
| 00692-cetuximab-and-folfox-4-therapy | gastrointestinal | None |
| 00704-trastuzumab-modified-folfox6 | gastrointestinal | None |
| 00727-mitomycin-and-capecitabine-chemoradiation-therapy | gastrointestinal | `capecitabine_bilirubin_uln`, `capecitabine_alt_ast_uln`, `mitomycin_ast_uln` |
| 00732-cetuximab-therapy-14-days | gastrointestinal | None |
| 00733-cetuximab-and-modified-folfox-6-therapy | gastrointestinal | None |
| 00739-pembrolizumab-cisplatin-and-5-fluorouracil-infusional-therapy | gastrointestinal | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00783-bevacizumab-5-mg-kg-and-folfoxiri-therapy-14-day | gastrointestinal | `bilirubin_uln_multiple` |
| 00791-bevacizumab-5-mg-kg-5-fluorouracil-and-folinic-acid-therapy-14-day | gastrointestinal | None |
| 00816-nivolumab-14-day-cisplatin-and-5-fluorouracil-therapy | gastrointestinal | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00831-atezolizumab-bevacizumab-hcc | gastrointestinal | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00832-nivolumab-28-day-cisplatin-and-5-fluorouracil-therapy | gastrointestinal | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00839-pembrolizumab-and-modified-folfox-6-therapy | gastrointestinal | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00843-nivolumab-xelox | gastrointestinal | `bilirubin_ratio_uln`, `alt_ast_ratio_uln`, `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00844-nivolumab-modified-folfox6 | gastrointestinal | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00889-pemigatinib-therapy | gastrointestinal | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00890-fruquintinib-monotherapy | gastrointestinal | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00897-durvalumab-gemcitabine-cisplatin | gastrointestinal | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00900-nivolumab-240-mg-and-ipilimumab-1-mg-kg-therapy | gastrointestinal | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00901-ivosidenib-therapy | gastrointestinal | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00924-tislelizumab-and-capox-therapy | gastrointestinal | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00925-tislelizumab-and-modified-folfox-6-therapy | gastrointestinal | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00926-tremelimumab-durvalumab | gastrointestinal | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00101-cabazitaxel-prednisolone | genitourinary | None |
| 00103-abiraterone-prednisolone-mcrpc | genitourinary | `bilirubin_uln_multiple`, `alt_ast_uln_multiple` |
| 00104-axitinib-monotherapy | genitourinary | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00233-enzalutamide | genitourinary | None |
| 00257-radium-223 | genitourinary | None |
| 00282-gemcitabine-and-cisplatin-70-mg-m-28-day | genitourinary | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00313-docetaxel-50-q14d | genitourinary | None |
| 00326-temsirolimus-therapy | genitourinary | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00333-dose-dense-methotrexate-vinblastine-doxorubicin-and-cisplatin-mvac-14-day | genitourinary | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00337-cisplatin-methotrexate-and-vinblastine-cmv-therapy | genitourinary | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00338-methotrexate-vinblastine-doxorubicin-and-cisplatin-mvac-28-day | genitourinary | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00450-mitomycin-and-5-fluorouracil-with-radiotherapy | genitourinary | `ast_uln_multiple` |
| 00453-carboplatin-auc-7-and-etoposide-750-mg-m-therapy | genitourinary | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00477-goserelin-10-8mg-q12weeks | genitourinary | None |
| 00478-goserelin-3-6mg-q28days | genitourinary | None |
| 00479-leuprorelin-22-5mg-q12weeks | genitourinary | None |
| 00480-triptorelin-11-25mg-q12weeks | genitourinary | None |
| 00481-degarelix | genitourinary | None |
| 00482-bicalutamide | genitourinary | None |
| 00488-triptorelin-22-5mg-q24weeks | genitourinary | None |
| 00489-triptorelin-3mg-q28days | genitourinary | None |
| 00490-leuprorelin-7-5mg-q28days | genitourinary | None |
| 00491-leuprorelin-45mg-q24weeks | genitourinary | None |
| 00492-leuprorelin-11-25mg-q12weeks | genitourinary | None |
| 00493-leuprorelin-30mg-q24weeks | genitourinary | None |
| 00494-leuprorelin-3-75mg-q28days | genitourinary | None |
| 00518-cabozantinib-monotherapy | genitourinary | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00535-avelumab-monotherapy | genitourinary | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00546-docetaxel-prednisolone | genitourinary | None |
| 00564-tivozanib-monotherapy | genitourinary | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00574-apalutamide | genitourinary | None |
| 00577-abiraterone-prednisolone-mhspc | genitourinary | `bilirubin_uln_multiple`, `alt_ast_uln_multiple` |
| 00583-pembrolizumab-200-mg-and-axitinib-therapy | genitourinary | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00602-paclitaxel-ifosfamide-and-cisplatin-tip-therapy | genitourinary | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00622-gemcitabine-and-cisplatin-35-mg-m-21-day | genitourinary | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00628-gemcitabine-and-cisplatin-70-mg-m-21-day | genitourinary | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00693-darolutamide | genitourinary | None |
| 00759-gemcitabine-100-mg-m-with-radiotherapy | genitourinary | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00807-intravesical-bcg | genitourinary | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00830-relugolix | genitourinary | None |
| 00846-enfortumab-vedotin-monotherapy | genitourinary | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00848-niraparib-abiraterone-akeega | genitourinary | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00885-erdafitinib-therapy | genitourinary | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00894-intravesical-gemcitabine-and-docetaxel | genitourinary | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00945-enfortumab-vedotin-and-pembrolizumab-therapy | genitourinary | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00246-methotrexate-8-day-charing-cross-regimen | gynaecology | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00247-dactinomycin-therapy | gynaecology | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00248-ema-co-therapy | gynaecology | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00249-intrathecal-methotrexate-for-cns-prophylaxis-in-gtn | gynaecology | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00264-ema-ep-therapy | gynaecology | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00266-paclitaxel-etoposide-alternating-with-paclitaxel-cisplatin-te-tp-therapy | gynaecology | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00267-two-day-etoposide-and-cisplatin-ep-therapy | gynaecology | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00300-bleomycin-etoposide-and-cisplatin-bep-therapy | gynaecology | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00301-etoposide-and-cisplatin-20-mg-m-ep-5-day-therapy | gynaecology | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00303-carboplatin-paclitaxel-21-day | gynaecology | `bilirubin_uln_multiple`, `alt_uln_multiple` |
| 00306-gemcitabine-carboplatin | gynaecology | None |
| 00308-carboplatin-auc-6-and-weekly-paclitaxel-80-mg-m-therapy | gynaecology | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00312-topotecan-monotherapy-weekly | gynaecology | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00375-trabectedin-and-pegylated-liposomal-doxorubicin-therapy | gynaecology | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00385-cisplatin-40-mg-m-weekly-with-radiotherapy | gynaecology | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00419-carboplatin-auc-2-weekly-with-radiotherapy | gynaecology | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00499-gemcitabine-1000-mg-m-carboplatin-auc-4-and-bevacizumab-15-mg-kg-therapy-21-day | gynaecology | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00620-bevacizumab-7-5-mg-kg-carboplatin-auc-5-and-paclitaxel-175-mg-m-therapy | gynaecology | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00624-carboplatin-pegylated-liposomal-doxorubicin | gynaecology | None |
| 00676-cisplatin-50-mg-m-chemoradiation-followed-by-carboplatin-auc-5-and-paclitaxel-175-mg-m | gynaecology | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00716-bevacizumab-15-mg-kg-carboplatin-auc-5-and-paclitaxel-175-mg-m-therapy | gynaecology | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00746-olaparib-tablet-and-bevacizumab-therapy | gynaecology | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00766-bevacizumab-carboplatin-paclitaxel | gynaecology | `bilirubin_uln_multiple`, `alt_uln_multiple` |
| 00769-bevacizumab-10-mg-kg-and-paclitaxel-80-mg-m-days-1-8-15-and-22 | gynaecology | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00771-bevacizumab-10-mg-kg-and-topotecan-4-mg-m-therapy | gynaecology | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00772-bevacizumab-10-mg-kg-and-pegylated-liposomal-doxorubicin-40-mg-m-therapy | gynaecology | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00799-bevacizumab-paclitaxel-cisplatin | gynaecology | `alt_uln_multiple`, `bilirubin_uln_multiple` |
| 00811-pembrolizumab-paclitaxel-175-mg-m-carboplatin-auc-5-and-bevacizumab-therapy | gynaecology | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00812-cemiplimab-therapy | gynaecology | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00817-pembrolizumab-paclitaxel-175-mg-m-and-carboplatin-auc-5-therapy | gynaecology | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00819-dostarlimab-therapy | gynaecology | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00862-niraparib-tablets-monotherapy | gynaecology | None |
| 00904-rucaparib-tablets-monotherapy | gynaecology | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00929-dostarlimab-paclitaxel-and-carboplatin-therapy | gynaecology | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00218-lenalidomide-dexamethasone-28-day | haemato-oncology/plasma-cell | `bilirubin_ratio_uln` |
| 00245-pomalidomide-dexamethasone | haemato-oncology/plasma-cell | `bilirubin_ratio_uln` |
| 00270-bortezomib-dexamethasone | haemato-oncology/plasma-cell | `bilirubin_ratio_uln` |
| 00273-cybord-21-day | haemato-oncology/plasma-cell | `bilirubin_ratio_uln` |
| 00275-bortezomib-melphalan-prednisolone | haemato-oncology/plasma-cell | `bilirubin_ratio_uln` |
| 00299-modified-weekly-cybord | haemato-oncology/plasma-cell | `bilirubin_ratio_uln` |
| 00416-rvd-21-day | haemato-oncology/plasma-cell | `bilirubin_ratio_uln` |
| 00435-bortezomib-maintenance-14-day | haemato-oncology/plasma-cell | `bilirubin_ratio_uln` |
| 00601-pomalidomide-bortezomib-dexamethasone | haemato-oncology/plasma-cell | `bilirubin_ratio_uln` |
| 00604-daratumumab-sc-monotherapy | haemato-oncology/plasma-cell | `bilirubin_ratio_uln` |
| 00609-daratumumab-sc-bortezomib-dexamethasone | haemato-oncology/plasma-cell | `bilirubin_ratio_uln` |
| 00643-rvd-28-day | haemato-oncology/plasma-cell | `bilirubin_ratio_uln` |
| 00695-daratumumab-sc-weekly-bortezomib-dexamethasone | haemato-oncology/plasma-cell | `bilirubin_ratio_uln` |
| 00780-rvd-lite-induction | haemato-oncology/plasma-cell | `bilirubin_ratio_uln` |
| 00854-daratumumab-sc-lenalidomide-dexamethasone | haemato-oncology/plasma-cell | `bilirubin_ratio_uln` |
| 00242-vandetanib-monotherapy | head-neck | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00295-lenvatinib-dtc-therapy | head-neck | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00314-cisplatin-and-5-fluorouracil-28-day | head-neck | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00315-docetaxel-75-cisplatin-75-and-5-fluorouracil-1000-induction-tpf | head-neck | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00323-docetaxel-75-cisplatin-100-and-5-fluorouracil-1000-tcf-chemoradiation | head-neck | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00324-docetaxel-75-cisplatin-75-5-fluorouracil-750-tcf-and-radiotherapy | head-neck | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00332-carboplatin-auc-1-5-chemoradiation-7-day | head-neck | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00387-cisplatin-100-mg-m-with-radiotherapy | head-neck | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00417-cetuximab-cisplatin-100-mg-m-and-5-fluorouracil-21-day | head-neck | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00418-cetuximab-carboplatin-auc-5-and-5-fluorouracil-21-day | head-neck | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00514-gemcitabine-1250-mg-m-monotherapy-21-day | head-neck | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00517-gemcitabine-1250-mg-m-and-cisplatin-80-mg-m-21-day | head-neck | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00552-carboplatin-auc-5-and-5-fluorouracil-1000-mg-m-day-28-day | head-neck | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00589-carboplatin-70-mg-m-and-5-fluorouracil-600-mg-m-with-radiotherapy | head-neck | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00591-carboplatin-auc-4-and-5-fluorouracil-600-mg-m-with-radiotherapy | head-neck | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00615-cyclophosphamide-doxorubicin-and-cisplatin-21-day | head-neck | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00696-paclitaxel-days-1-8-and-15-with-cetuximab-days-1-and-15-28-day | head-neck | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00705-pembrolizumab-carboplatin-auc-5-and-5-fluorouracil | head-neck | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00706-pembrolizumab-cisplatin-and-5-fluorouracil | head-neck | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00893-methotrexate-40-mg-m-monotherapy-28-day | head-neck | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00903-gemcitabine-1000-mg-m-and-cisplatin-80-mg-m-induction | head-neck | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00219-erlotinib-monotherapy | lung | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00220-gefitinib-monotherapy | lung | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00221-afatinib-monotherapy | lung | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00222-pemetrexed-monotherapy | lung | None |
| 00243-crizotinib-monotherapy | lung | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00271-carboplatin-etoposide | lung | `bilirubin_uln_multiple`, `alt_uln_multiple` |
| 00280-cisplatin-etoposide | lung | `bilirubin_uln_multiple`, `alt_uln_multiple` |
| 00281-gemcitabine-cisplatin | lung | None |
| 00304-carboplatin-paclitaxel | lung | `transaminases_uln_multiple`, `bilirubin_uln_multiple` |
| 00309-weekly-carboplatin-auc2-and-paclitaxel-50-mg-m2-with-radiotherapy | lung | `bilirubin_uln_multiple`, `alt_ast_uln_multiple` |
| 00310-gemcitabine-carboplatin | lung | None |
| 00317-pemetrexed-cisplatin | lung | None |
| 00318-pemetrexed-and-carboplatin-therapy | lung | None |
| 00319-carboplatin-and-oral-etoposide-therapy-21-day | lung | `bilirubin_uln_multiple` |
| 00339-vinorelbine-days-1-8-15-and-cisplatin-day-1-21-day | lung | `bilirubin_uln_multiple`, `alt_ast_uln_multiple` |
| 00340-ceritinib-monotherapy | lung | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00343-vinorelbine-and-cisplatin-therapy-28-day | lung | `bilirubin_uln_multiple`, `alt_ast_uln_multiple` |
| 00353-osimertinib-monotherapy | lung | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00372-nintedanib-therapy-with-docetaxel | lung | `bilirubin_uln_multiple`, `alt_ast_uln_multiple`, `alp_uln_multiple` |
| 00388-oral-etoposide-therapy | lung | `bilirubin_uln_multiple` |
| 00401-alectinib-monotherapy | lung | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00456-cisplatin-50-mg-m2-etoposide-50-mg-m2-and-thoracic-radiotherapy-28-day | lung | `bilirubin_uln_multiple` |
| 00544-atezolizumab-1200-mg-monotherapy-21-day | lung | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00561-carboplatin-auc3-etoposide-50-mg-m2-and-thoracic-radiotherapy-28-day | lung | `bilirubin_uln_multiple` |
| 00562-brigatinib-therapy | lung | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00565-dacomitinib-monotherapy | lung | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00568-pembrolizumab-pemetrexed-and-carboplatin-auc5-therapy | lung | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00569-pembrolizumab-pemetrexed-and-cisplatin-therapy | lung | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00570-lorlatinib-therapy | lung | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00576-durvalumab-monotherapy-10-mg-kg-14-day | lung | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00579-pembrolizumab-paclitaxel-and-carboplatin-auc6-therapy | lung | `bilirubin_uln_multiple`, `alt_ast_uln_multiple` |
| 00587-topotecan-oral-monotherapy | lung | None |
| 00593-atezolizumab-maintenance | lung | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00614-carboplatin-and-vinorelbine-therapy-21-day | lung | `bilirubin_uln_multiple`, `alt_ast_uln_multiple` |
| 00655-durvalumab-maintenance | lung | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00689-atezolizumab-carboplatin-etoposide | lung | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00702-entrectinib-monotherapy-adult | lung | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00712-nivolumab-ipilimumab-carboplatin-and-paclitaxel-therapy | lung | `bilirubin_uln_multiple`, `alt_ast_uln_multiple` |
| 00713-nivolumab-ipilimumab-pemetrexed-and-carboplatin-therapy | lung | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00714-nivolumab-ipilimumab-pemetrexed-and-cisplatin-therapy | lung | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00792-nivolumab-360-mg-and-ipilimumab-1-mg-kg-therapy | lung | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00823-tepotinib-therapy | lung | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00849-nivolumab-360-mg-and-platinum-based-chemotherapy | lung | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00908-serplulimab-carboplatin-auc5-and-etoposide-100-mg-m2-21-day | lung | `bilirubin_uln_multiple`, `alt_ast_uln_multiple` |
| 00334-temozolomide-with-radiotherapy-and-adjuvant-therapy | neuro-oncology | None |
| 00342-temozolomide-recurrent-therapy | neuro-oncology | None |
| 00379-procarbazine-lomustine-and-vincristine-pcv-therapy-42-day | neuro-oncology | None |
| 00461-temozolomide-with-radiotherapy-and-adjuvant-therapy-patients-greater-than-65-years | neuro-oncology | None |
| 00658-procarbazine-lomustine-and-vincristine-pcv-therapy-56-day | neuro-oncology | None |
| 00742-lomustine-and-bevacizumab-5-mg-kg-therapy | neuro-oncology | None |
| 00804-lomustine-and-bevacizumab-7-5-mg-kg-therapy | neuro-oncology | None |
| 00805-lomustine-130-mg-m2-therapy | neuro-oncology | None |
| 00806-cisplatin-lomustine-and-vincristine-clv-therapy | neuro-oncology | None |
| 00813-bevacizumab-5-mg-kg-monotherapy-14-day | neuro-oncology | None |
| 00327-sunitinib-37-5-mg-therapy-28-day | neuroendocrine | None |
| 00100-mifamurtide-therapy | sarcoma | None |
| 00335-imatinib-therapy-gist | sarcoma | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00374-trabectedin-monotherapy | sarcoma | `alt_ast_uln_multiple`, `bilirubin_uln_multiple`, `alp_uln_multiple` |
| 00391-doxorubicin-60-mg-m2-and-ifosfamide-therapy | sarcoma | `bilirubin_uln_multiple` |
| 00392-doxorubicin-75-mg-m2-and-ifosfamide-therapy | sarcoma | `bilirubin_uln_multiple` |
| 00420-doxorubicin-25-mg-m2-day-and-cisplatin-100-mg-m2-therapy-21-day | sarcoma | `bilirubin_uln_multiple` |
| 00462-pegylated-liposomal-doxorubicin-20-mg-m2-21-day | sarcoma | `bilirubin_uln_multiple` |
| 00463-map-therapy-methotrexate-doxorubicin-and-cisplatin | sarcoma | `bilirubin_uln_multiple` |
| 00500-doxorubicin-75-mg-m2-monotherapy | sarcoma | `bilirubin_uln_multiple` |
| 00501-gemcitabine-and-docetaxel-therapy-21-day | sarcoma | `alt_ast_uln_multiple`, `bilirubin_uln_multiple`, `alp_uln_multiple` |
| 00504-irinotecan-and-temozolomide-therapy-21-day | sarcoma | `bilirubin_uln_multiple` |
| 00511-dacarbazine-1-2-g-m2-therapy-21-day | sarcoma | None |
| 00554-vinblastine-and-methotrexate-therapy | sarcoma | `bilirubin_uln_multiple` |
| 00596-ifosfamide-and-etoposide-ie-therapy | sarcoma | `bilirubin_uln_multiple` |
| 00675-ie-vac-therapy-two-weekly-intervals | sarcoma | `bilirubin_uln_multiple` |
| 00680-high-dose-ifosfamide-therapy-21-day | sarcoma | None |
| 00747-ie-vac-therapy-three-weekly-intervals | sarcoma | `bilirubin_uln_multiple` |
| 00754-ifosfamide-vincristine-doxorubicin-and-dactinomycin-ivado-therapy | sarcoma | `bilirubin_uln_multiple` |
| 00757-vincristine-irinotecan-and-temozolomide-vit-therapy | sarcoma | `bilirubin_uln_multiple` |
| 00214-bevacizumab-7-5-mg-kg-21-days | shared | None |
| 00215-bevacizumab-15mgkg | shared | None |
| 00226-paclitaxel-monotherapy-weekly | shared | `alt_ratio_uln`, `bilirubin_ratio_uln` |
| 00279-cisplatin-75-mg-m2-etoposide-100-mg-m2-and-radiotherapy-21-day | shared | `bilirubin_uln_multiple` |
| 00284-gemcitabine-1000-mg-m2-monotherapy-28-day | shared | None |
| 00311-topotecan-monotherapy-5-day | shared | None |
| 00320-everolimus-monotherapy | shared | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00325-sunitinib-50-mg-therapy-42-day | shared | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00445-pazopanib-monotherapy | shared | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00455-pembrolizumab-200-mg-monotherapy | shared | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00483-nivolumab-monotherapy-14-day | shared | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00484-nivolumab-monotherapy-28-day | shared | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00551-nivolumab-3-mg-kg-with-ipilimumab-1-mg-kg-therapy | shared | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00558-pembrolizumab-400mg-monotherapy | shared | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00588-olaparib-tablet-monotherapy | shared | None |
| 00592-atezolizumab-840-mg-monotherapy-14-day | shared | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00719-sunitinib-50-mg-therapy-21-day | shared | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00102-vemurafenib-monotherapy | skin | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00105-ipilimumab-monotherapy | skin | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00236-vismodegib-monotherapy | skin | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00237-dabrafenib-monotherapy | skin | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00373-cobimetinib-and-vemurafenib-therapy | skin | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00415-trametinib-and-dabrafenib-therapy | skin | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00431-nivolumab-1-mg-kg-and-ipilimumab-3-mg-kg-therapy | skin | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00464-dacarbazine-therapy | skin | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00563-encorafenib-and-binimetinib-therapy | skin | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |
| 00758-larotrectinib-monotherapy-adult | tumour-agnostic | `alt_ast_uln_multiple`, `bilirubin_uln_multiple` |

## Limitations

This checks configured input conversion and UI collection, not whether each protocol encodes every liver-related clinical requirement in its source PDF. Numeric absolute-value inputs and categorical/clinical assessment fields were inspected for preservation, not re-engineered into ratio inputs. Male 40/40 is provisional, not CUH-verified. Independent clinical concordance and real-browser/live checks remain outstanding.
