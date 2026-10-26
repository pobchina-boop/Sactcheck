(function(root){'use strict';
const regimens={
  "00200": {
    "code": "00200",
    "protocol_id": "nccp-00200-vcurrent",
    "settings": [
      "adjuvant",
      "maintenance",
      "advanced"
    ],
    "receptors": [
      "her2pos"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6330/200_Trastuzumab_21days_Ubeecpc.pdf",
    "basis": "HER2-positive early or metastatic breast cancer; full indication remains a clinician decision"
  },
  "00201": {
    "code": "00201",
    "protocol_id": "nccp-00201-v6",
    "settings": [
      "advanced"
    ],
    "receptors": [
      "her2pos"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6540/201_v6_Trastuzumab_IV_7_days.pdf",
    "basis": "HER2-positive metastatic breast cancer; full indication remains a clinician decision"
  },
  "00202": {
    "code": "00202",
    "protocol_id": "nccp-00202-v7",
    "settings": [
      "advanced"
    ],
    "receptors": [
      "any"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6541/202_DOCEtaxel_100-21day.pdf",
    "basis": "Source indication; individual suitability requires clinical interpretation."
  },
  "00204": {
    "code": "00204",
    "protocol_id": "nccp-00204-v11",
    "settings": [
      "advanced"
    ],
    "receptors": [
      "her2pos"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6545/204_v11_PertuzumabTrasDoc.pdf",
    "basis": "HER2-positive metastatic or unresectable locally recurrent breast cancer"
  },
  "00206": {
    "code": "00206",
    "protocol_id": "nccp-00206-vcurrent",
    "settings": [
      "advanced"
    ],
    "receptors": [
      "her2pos"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6547/206_Trastuzumab_Emtansine_21days.pdf",
    "basis": "Previously treated HER2-positive unresectable locally advanced or metastatic breast cancer; full indication remains a clinician decision"
  },
  "00217": {
    "code": "00217",
    "protocol_id": "nccp-00217-vcurrent",
    "settings": [
      "advanced"
    ],
    "receptors": [
      "her2pos"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6559/217_Lapatinib_and_Capecitabine_therapy.pdf",
    "basis": "HER2-positive advanced or metastatic breast cancer after prior anthracycline, taxane and trastuzumab therapy, in accordance with the NCCP indication."
  },
  "00230": {
    "code": "00230",
    "protocol_id": "nccp-00230-v7",
    "settings": [
      "advanced"
    ],
    "receptors": [
      "any"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6565/230_v7_nab-PACLitaxel.pdf",
    "basis": "Source indication; individual suitability requires clinical interpretation."
  },
  "00250": {
    "code": "00250",
    "protocol_id": "nccp-00250-v8",
    "settings": [
      "adjuvant"
    ],
    "receptors": [
      "any"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6353/250_DOCEtaxel-cycloPHOS_TC.pdf",
    "basis": "NCCP indication; receptor/line suitability requires MDT interpretation, not automatic matching."
  },
  "00252": {
    "code": "00252",
    "protocol_id": "nccp-00252-v7",
    "settings": [
      "adjuvant"
    ],
    "receptors": [
      "any"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6356/252_DOXO_cycloPHOS_AC.pdf",
    "basis": "NCCP indication; receptor/line suitability requires MDT interpretation, not automatic matching."
  },
  "00253": {
    "code": "00253",
    "protocol_id": "nccp-00253-vcurrent",
    "settings": [
      "adjuvant",
      "advanced"
    ],
    "receptors": [
      "hrpos-her2neg",
      "hrpos-her2pos"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6357/253_Tamoxifen_Monotherapy.pdf",
    "basis": "Adjuvant or advanced oestrogen-receptor-positive breast cancer in pre- or postmenopausal women, within the exact NCCP eligibility criteria.",
    "setting_qualifications": {}
  },
  "00254": {
    "code": "00254",
    "protocol_id": "nccp-00254-v5",
    "settings": [
      "adjuvant",
      "advanced"
    ],
    "receptors": [
      "hrpos-her2neg",
      "hrpos-her2pos"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6358/254_v5_Anastrazole.pdf",
    "basis": "Postmenopausal hormone-sensitive breast cancer in the NCCP adjuvant, switch-after-tamoxifen or advanced settings. The exact receptor and prior-treatment criteria remain a prescribing decision.",
    "setting_qualifications": {}
  },
  "00258": {
    "code": "00258",
    "protocol_id": "nccp-00258-v9",
    "settings": [
      "adjuvant"
    ],
    "receptors": [
      "her2pos"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6362/258_v9_TCH.pdf",
    "basis": "HER2-positive adjuvant breast cancer"
  },
  "00260": {
    "code": "00260",
    "protocol_id": "nccp-00260-v7",
    "settings": [
      "neoadjuvant",
      "adjuvant"
    ],
    "receptors": [
      "any"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6364/260_v7_AC-T.pdf",
    "basis": "NCCP indication; receptor/line suitability requires MDT interpretation, not automatic matching."
  },
  "00262": {
    "code": "00262",
    "protocol_id": "nccp-00262-vcurrent",
    "settings": [
      "adjuvant"
    ],
    "receptors": [
      "any"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6367/262_EC90.pdf",
    "basis": "NCCP indication; receptor/line suitability requires MDT interpretation, not automatic matching."
  },
  "00263": {
    "code": "00263",
    "protocol_id": "nccp-00263-vcurrent",
    "settings": [
      "metastatic"
    ],
    "receptors": [
      "any"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6368/263_EC75.pdf",
    "basis": "NCCP indication; receptor/line suitability requires MDT interpretation, not automatic matching."
  },
  "00265": {
    "code": "00265",
    "protocol_id": "nccp-00265-v6b",
    "settings": [
      "neoadjuvant",
      "adjuvant"
    ],
    "receptors": [
      "any"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6690/265_FEC_100.pdf",
    "basis": "NCCP indication; receptor/line suitability requires MDT interpretation, not automatic matching."
  },
  "00269": {
    "code": "00269",
    "protocol_id": "nccp-00269-v7a",
    "settings": [
      "metastatic"
    ],
    "receptors": [
      "any"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6693/269_FEC50.pdf",
    "basis": "NCCP indication; receptor/line suitability requires MDT interpretation, not automatic matching."
  },
  "00272": {
    "code": "00272",
    "protocol_id": "nccp-00272-v4",
    "settings": [
      "advanced",
      "maintenance"
    ],
    "receptors": [
      "her2pos"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6694/272_v4_Trastuzumab_SC_21days_MBC.pdf",
    "basis": "HER2-positive metastatic breast cancer · SC component; full indication remains a clinician decision"
  },
  "00278": {
    "code": "00278",
    "protocol_id": "nccp-00278-v7",
    "settings": [
      "neoadjuvant",
      "adjuvant"
    ],
    "receptors": [
      "any"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6696/278_v7_Dose_DenseAC-T_Pacli_14_day.pdf",
    "basis": "NCCP indication; receptor/line suitability requires MDT interpretation, not automatic matching."
  },
  "00285": {
    "code": "00285",
    "protocol_id": "nccp-00285-v4",
    "settings": [
      "neoadjuvant",
      "adjuvant",
      "maintenance"
    ],
    "receptors": [
      "her2pos"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6700/285_v4_Trastuzumab_SC_21days_EBC.pdf",
    "basis": "HER2-positive early breast cancer · SC component; full indication remains a clinician decision"
  },
  "00316": {
    "code": "00316",
    "protocol_id": "nccp-00316-v6",
    "settings": [
      "neoadjuvant",
      "adjuvant"
    ],
    "receptors": [
      "her2_positive"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6717/316_v6_Dose_Dense_AC-TH.pdf",
    "basis": "Source indication; individual suitability requires clinical interpretation, not automated matching."
  },
  "00322": {
    "code": "00322",
    "protocol_id": "nccp-00322-v4",
    "settings": [
      "advanced"
    ],
    "receptors": [
      "hrpos-her2neg"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6720/322_v4_Everolimus_and_Exemestane.pdf",
    "basis": "Postmenopausal HR-positive/HER2-negative advanced disease after recurrence/progression following an NSAI, without symptomatic visceral disease. The intended endocrine partner is exemestane; do not automatically substitute another endocrine drug.",
    "setting_qualifications": {}
  },
  "00348": {
    "code": "00348",
    "protocol_id": "nccp-00348-v8a",
    "settings": [
      "neoadjuvant"
    ],
    "receptors": [
      "tnbc"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6812/348_Carboplatin_AUC_6_and_weekly_Paclitaxel_80mgm2.pdf",
    "basis": "Neoadjuvant treatment of triple-negative breast carcinoma."
  },
  "00350": {
    "code": "00350",
    "protocol_id": "nccp-00350-v3",
    "settings": [
      "neoadjuvant",
      "adjuvant"
    ],
    "receptors": [
      "her2pos"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6813/350_v3_Pertuzumab_Trastuz_Chemo.pdf",
    "basis": "NCCP00350a: adult high-risk HER2-positive neoadjuvant treatment with separately selected chemotherapy. NCCP00350b: adjuvant high-risk HER2-positive treatment; source records pertuzumab reimbursement not approved. Verify access separately."
  },
  "00361": {
    "code": "00361",
    "protocol_id": "nccp-00361-vcurrent",
    "settings": [
      "advanced"
    ],
    "receptors": [
      "hrpos-her2neg",
      "hrpos-her2pos"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6816/361_Fulvestrant_Therapy.pdf",
    "basis": "The NCCP monotherapy card covers postmenopausal ER-positive locally advanced or metastatic breast cancer with relapse or progression in its specified prior anti-oestrogen setting. Companion CDK4/6 medicines require their own regimen.",
    "setting_qualifications": {}
  },
  "00371": {
    "code": "00371",
    "protocol_id": "nccp-00371-vcurrent",
    "settings": [
      "neoadjuvant",
      "adjuvant",
      "advanced"
    ],
    "receptors": [
      "hrpos-her2neg",
      "hrpos-her2pos"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6817/371_Letrozole_.pdf",
    "basis": "Postmenopausal hormone-sensitive breast cancer in the specific NCCP early, extended, advanced or neoadjuvant indications. Neoadjuvant use has additional HER2-negative and treatment-suitability criteria; it is not inferred for every ER-positive cancer.",
    "setting_qualifications": {
      "neoadjuvant": "HER2-negative and exact NCCP suitability criteria apply"
    },
    "setting_receptors": {
      "neoadjuvant": [
        "hrpos-her2neg"
      ]
    }
  },
  "00376": {
    "code": "00376",
    "protocol_id": "nccp-00376-vcurrent",
    "settings": [
      "adjuvant",
      "advanced"
    ],
    "receptors": [
      "hrpos-her2neg",
      "hrpos-her2pos"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6568/376_Exemestane_therapy.pdf",
    "basis": "Postmenopausal ER-positive early breast cancer after two to three years of tamoxifen, or advanced breast cancer after progression following anti-oestrogen treatment, according to NCCP.",
    "setting_qualifications": {}
  },
  "00377": {
    "code": "00377",
    "protocol_id": "nccp-00377-v6",
    "settings": [
      "adjuvant",
      "metastatic"
    ],
    "receptors": [
      "any"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6337/377_v6_CMF_oral.pdf",
    "basis": "Source indication; individual suitability requires clinical interpretation, not automated matching."
  },
  "00378": {
    "code": "00378",
    "protocol_id": "nccp-00378-v6",
    "settings": [
      "adjuvant",
      "metastatic"
    ],
    "receptors": [
      "any"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6344/378_v6_cycloPHOSphamideIV_Methotrexate_5-FU_CMF.pdf",
    "basis": "Source indication; individual suitability requires clinical interpretation, not automated matching."
  },
  "00381": {
    "code": "00381",
    "protocol_id": "nccp-00381-v6",
    "settings": [
      "adjuvant",
      "metastatic"
    ],
    "receptors": [
      "any"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6346/381_v6_CMF_IV_21_Day.pdf",
    "basis": "Source indication; individual suitability requires clinical interpretation, not automated matching."
  },
  "00414": {
    "code": "00414",
    "protocol_id": "nccp-00414-vcurrent",
    "settings": [
      "advanced"
    ],
    "receptors": [
      "hrpos-her2neg"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6457/414_Palbociclib.pdf",
    "basis": "HR-positive/HER2-negative locally advanced/metastatic disease with an AI, or with fulvestrant after previous endocrine therapy as defined in NCCP. Pre/perimenopausal endocrine treatment requires ovarian suppression; the exact partner and its risks must be confirmed.",
    "setting_qualifications": {}
  },
  "00423": {
    "code": "00423",
    "protocol_id": "nccp-00423-vcurrent",
    "settings": [
      "locally_advanced",
      "metastatic"
    ],
    "receptors": [
      "any"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6823/423_DOXO_DOCEtaxel_AT_50_75-21day.pdf",
    "basis": "NCCP indication; receptor/line suitability requires MDT interpretation, not automatic matching."
  },
  "00430": {
    "code": "00430",
    "protocol_id": "nccp-00430-v6",
    "settings": [
      "metastatic"
    ],
    "receptors": [
      "triple_negative"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6832/430_GemcarboAUC2.pdf",
    "basis": "Source indication; individual suitability requires clinical interpretation, not automated matching."
  },
  "00432": {
    "code": "00432",
    "protocol_id": "nccp-00432-v5",
    "settings": [
      "neoadjuvant",
      "adjuvant"
    ],
    "receptors": [
      "her2_positive"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6470/432_v5_AC-TH_weekly.pdf",
    "basis": "NCCP indication; receptor/line suitability requires MDT interpretation, not automatic matching."
  },
  "00433": {
    "code": "00433",
    "protocol_id": "nccp-00433-v6",
    "settings": [
      "neoadjuvant",
      "adjuvant"
    ],
    "receptors": [
      "her2_positive"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6471/433_v6_Dose_Dense_AC-TH_Weekly.pdf",
    "basis": "Source indication; individual suitability requires clinical interpretation, not automated matching."
  },
  "00485": {
    "code": "00485",
    "protocol_id": "nccp-00485-v6",
    "settings": [
      "neoadjuvant",
      "adjuvant"
    ],
    "receptors": [
      "any"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6500/485_v6_Dose_DenseAC-T.pdf",
    "basis": "Source indication; individual suitability requires clinical interpretation."
  },
  "00507": {
    "code": "00507",
    "protocol_id": "nccp-00507-v6",
    "settings": [
      "advanced"
    ],
    "receptors": [
      "her2pos"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6611/507_v6_Pertuzumab_Tras_PACLitaxel_2jBzcSC.pdf",
    "basis": "HER2-positive metastatic or unresectable locally recurrent breast cancer"
  },
  "00512": {
    "code": "00512",
    "protocol_id": "nccp-00512-v5",
    "settings": [
      "adjuvant"
    ],
    "receptors": [
      "her2_positive"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6515/512_v5_PACLitaxel_Trastuzumab_Weekly.pdf",
    "basis": "Source indication; individual suitability requires clinical interpretation, not automated matching."
  },
  "00525": {
    "code": "00525",
    "protocol_id": "nccp-00525-vcurrent",
    "settings": [
      "advanced"
    ],
    "receptors": [
      "hrpos-her2neg"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6629/525_v6_Ribociclib_Metastatic_hghzyyD.pdf",
    "basis": "HR-positive/HER2-negative locally advanced or metastatic disease with an AI or fulvestrant in the exact NCCP indication. NCCP page 1 and page 2 do not fully align on menopause and previous advanced-disease treatment; preserve consultant reconciliation."
  },
  "00526": {
    "code": "00526",
    "protocol_id": "nccp-00526-v5",
    "settings": [
      "advanced"
    ],
    "receptors": [
      "her2pos"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6630/526_v5_Pertuzumab_Vinorelbine_trastuzumab_zOGbzKp.pdf",
    "basis": "Treatment of adults with HER2-positive metastatic or locally recurrent unresectable breast cancer without previous anti-HER2 therapy or chemotherapy for metastatic disease, when taxane therapy is clinically unsuitable."
  },
  "00545": {
    "code": "00545",
    "protocol_id": "nccp-00545-v3",
    "settings": [
      "adjuvant"
    ],
    "receptors": [
      "any"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6381/545_Zoledronic_acid.pdf",
    "basis": "Source indication; individual suitability requires clinical interpretation."
  },
  "00605": {
    "code": "00605",
    "protocol_id": "nccp-00605-v2",
    "settings": [
      "advanced"
    ],
    "receptors": [
      "hrpos-her2neg",
      "tnbc",
      "her2neg"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6414/605_v2_Talazoparib_Therapy.pdf",
    "basis": "Source indication; individual suitability requires clinical interpretation."
  },
  "00619": {
    "code": "00619",
    "protocol_id": "nccp-00619-vcurrent",
    "settings": [
      "adjuvant"
    ],
    "receptors": [
      "hrpos-her2neg"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6415/619_Abemaciclib.pdf",
    "basis": "HR-positive/HER2-negative node-positive early breast cancer at high recurrence risk: four or more positive axillary nodes, or one to three with tumour at least 5 cm and/or grade 3. The NCCP timing, prior-treatment and other exclusions remain applicable; this is not a node-negative or metastatic regimen."
  },
  "00659": {
    "code": "00659",
    "protocol_id": "nccp-00659-v2",
    "settings": [
      "adjuvant"
    ],
    "receptors": [
      "her2pos"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6680/659_v2_Trastuzumab_Emtansine_EBC_21days.pdf",
    "basis": "Adjuvant · residual invasive HER2-positive early breast cancer; indication remains a clinician decision"
  },
  "00688": {
    "code": "00688",
    "protocol_id": "nccp-00688-v2a",
    "settings": [
      "advanced"
    ],
    "receptors": [
      "tnbc"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6530/688_v2a_Atezolizumab_nab-PACLitaxel.pdf",
    "basis": "Source indication; individual suitability requires clinical interpretation."
  },
  "00720": {
    "code": "00720",
    "protocol_id": "nccp-00720-v2",
    "settings": [
      "adjuvant"
    ],
    "receptors": [
      "hrpos-her2pos"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6596/720_v2_Neratinib.pdf",
    "basis": "Source indication; individual suitability requires clinical interpretation."
  },
  "00722": {
    "code": "00722",
    "protocol_id": "nccp-00722-v2",
    "settings": [
      "neoadjuvant"
    ],
    "receptors": [
      "her2pos"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6598/722_v2_TCHP.pdf",
    "basis": "Neoadjuvant treatment of adult patients with HER2-positive locally advanced, inflammatory or early breast cancer at high risk of recurrence."
  },
  "00726": {
    "code": "00726",
    "protocol_id": "nccp-00726-v3a",
    "settings": [
      "advanced",
      "maintenance"
    ],
    "receptors": [
      "her2pos"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6599/726_v3a_Pertuzumab_trastuzumab.pdf",
    "basis": "NCCP source audit 2026-10-17"
  },
  "00731": {
    "code": "00731",
    "protocol_id": "nccp-00731-v2",
    "settings": [
      "neoadjuvant"
    ],
    "receptors": [
      "her2pos"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6601/731_v2_TCHSCP.pdf",
    "basis": "HER2-positive neoadjuvant breast cancer"
  },
  "00734": {
    "code": "00734",
    "protocol_id": "nccp-00734-v3",
    "settings": [
      "neoadjuvant"
    ],
    "receptors": [
      "tnbc"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6605/734_CARBOplatin_AUC2weekly__Paclitaxel_TNBC_v3.pdf",
    "basis": "Neoadjuvant treatment of triple-negative breast carcinoma."
  },
  "00736": {
    "code": "00736",
    "protocol_id": "nccp-00736-v2",
    "settings": [
      "advanced"
    ],
    "receptors": [
      "any"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6619/736_v2_nab-PACLitaxel_weekly.pdf",
    "basis": "Source indication; individual suitability requires clinical interpretation."
  },
  "00738": {
    "code": "00738",
    "protocol_id": "nccp-00738-v3",
    "settings": [
      "advanced"
    ],
    "receptors": [
      "hrpos-her2neg",
      "tnbc",
      "her2neg"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6671/738.pdf",
    "basis": "Source indication; individual suitability requires clinical interpretation."
  },
  "00743": {
    "code": "00743",
    "protocol_id": "nccp-00743-v3",
    "settings": [
      "advanced"
    ],
    "receptors": [
      "any"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6623/743_v3_eriBULin_Monotherapy_28_day.pdf",
    "basis": "Source indication; individual suitability requires clinical interpretation."
  },
  "00745": {
    "code": "00745",
    "protocol_id": "nccp-00745-v2a",
    "settings": [
      "neoadjuvant",
      "adjuvant"
    ],
    "receptors": [
      "her2_positive"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6624/745_v2a_DDAC_TH_21_day.pdf",
    "basis": "Source indication; individual suitability requires clinical interpretation, not automated matching."
  },
  "00749": {
    "code": "00749",
    "protocol_id": "nccp-00749-v3",
    "settings": [
      "locally_advanced",
      "metastatic"
    ],
    "receptors": [
      "any"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6672/749_v3_Gemcitabine_800_Monotherapy.pdf",
    "basis": "Source indication; individual suitability requires clinical interpretation, not automated matching."
  },
  "00775": {
    "code": "00775",
    "protocol_id": "nccp-00775-v3",
    "settings": [
      "neoadjuvant"
    ],
    "receptors": [
      "her2pos"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6662/775_v3_Pertuzumab_trastuzumab_PACLitaxel_CARBOplatin.pdf",
    "basis": "Neoadjuvant treatment of HER2-positive locally advanced, inflammatory or high-risk early breast cancer."
  },
  "00776": {
    "code": "00776",
    "protocol_id": "nccp-00776-v3b",
    "settings": [
      "advanced"
    ],
    "receptors": [
      "her2pos",
      "hrpos-her2neg",
      "tnbc"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6661/Trastuzumab_776_Deruxtecan_5.4mg_Therapy.pdf",
    "basis": "NCCP00776a: unresectable/metastatic HER2-positive breast cancer after at least one anti-HER2 regimen. NCCP00776b: unresectable/metastatic HER2-low breast cancer after chemotherapy for metastatic disease, or recurrence during or within six months after adjuvant chemotherapy.",
    "setting_qualifications": {
      "advanced": "HER2-positive or HER2-low with exact NCCP prior-treatment criteria; HER2-negative without HER2-low expression is not sufficient."
    }
  },
  "00785": {
    "code": "00785",
    "protocol_id": "nccp-00785-v3a",
    "settings": [
      "advanced",
      "maintenance"
    ],
    "receptors": [
      "her2pos"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6659/785_v3_Pertuzumab_trastuzumab_Phesgo.pdf",
    "basis": "Completed the chemotherapy component of dual HER2 treatment for metastatic or locally recurrent unresectable disease."
  },
  "00789": {
    "code": "00789",
    "protocol_id": "nccp-00789-v3",
    "settings": [
      "neoadjuvant"
    ],
    "receptors": [
      "her2pos"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6447/789_v3_TCHP_Phesgo.pdf",
    "basis": "HER2-positive early, locally advanced or inflammatory breast cancer at high risk of recurrence, receiving neoadjuvant treatment."
  },
  "00790": {
    "code": "00790",
    "protocol_id": "nccp-00790-v3",
    "settings": [
      "neoadjuvant"
    ],
    "receptors": [
      "her2pos"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6442/790_v3_Phesgo_PACLitaxel_CARBOplatin.pdf",
    "basis": "HER2-positive early, locally advanced or inflammatory breast cancer at high risk of recurrence, receiving neoadjuvant treatment."
  },
  "00794": {
    "code": "00794",
    "protocol_id": "nccp-00794-vcurrent",
    "settings": [
      "advanced"
    ],
    "receptors": [
      "tnbc"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6417/794_v3_Sacituzumab_Govitecan_Therapy.pdf",
    "basis": "NCCP00794a covers adults with unresectable or metastatic triple-negative breast cancer after at least two prior systemic therapies, including at least one for advanced disease. The NCCP entry specifies ECOG 0–1. Broader European licensed indications must be checked separately against the applicable Irish regimen and reimbursement pathway.",
    "setting_qualifications": {}
  },
  "00796": {
    "code": "00796",
    "protocol_id": "nccp-00796-v4",
    "settings": [
      "advanced"
    ],
    "receptors": [
      "her2pos"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6419/796_v4_PertuzumabTrasDoc_Phesgo.pdf",
    "basis": "No prior anti-HER2 therapy or chemotherapy for metastatic disease."
  },
  "00797": {
    "code": "00797",
    "protocol_id": "nccp-00797-v4",
    "settings": [
      "advanced"
    ],
    "receptors": [
      "her2pos"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6420/797_v4_PertuzumabTrasPhesgo_PACLitaxel.pdf",
    "basis": "No prior anti-HER2 therapy or chemotherapy for metastatic disease. This paclitaxel alternative requires docetaxel intolerance, significant toxicity or clinical unsuitability; NCCP identifies this combination as unlicensed in Ireland and requires the local unlicensed-use consent process."
  },
  "00798": {
    "code": "00798",
    "protocol_id": "nccp-00798-v3",
    "settings": [
      "advanced"
    ],
    "receptors": [
      "her2pos"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6421/798_v3_Pertuzumab_trastuzumab_Phesgo_vinorelbine.pdf",
    "basis": "Treatment of adults with HER2-positive metastatic or locally recurrent unresectable breast cancer without previous anti-HER2 therapy or chemotherapy for metastatic disease, when taxane therapy is clinically unsuitable."
  },
  "00815": {
    "code": "00815",
    "protocol_id": "nccp-00815-v3",
    "settings": [
      "adjuvant"
    ],
    "receptors": [
      "her2_positive"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6427/815_v3_Paclitaxel_weekly_Trastuzumab_3weekly.pdf",
    "basis": "Source indication; individual suitability requires clinical interpretation, not automated matching."
  },
  "00857": {
    "code": "00857",
    "protocol_id": "nccp-00857-v3",
    "settings": [
      "neoadjuvant",
      "adjuvant"
    ],
    "receptors": [
      "tnbc"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6450/857_v3_Pembro_Carbo_5_Pacli_80_AC60_600.pdf",
    "basis": "Pembrolizumab in combination with chemotherapy as neoadjuvant treatment, then continued as monotherapy as adjuvant treatment after surgery, for adults with locally advanced or early-stage triple-negative breast cancer at high risk of recurrence."
  },
  "00858": {
    "code": "00858",
    "protocol_id": "nccp-00858-v3",
    "settings": [
      "neoadjuvant",
      "adjuvant"
    ],
    "receptors": [
      "tnbc"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6451/858_v3_Pembro_Carbo_1.5_Pacli_80_AC60_600_.pdf",
    "basis": "Pembrolizumab in combination with chemotherapy as neoadjuvant treatment, then continued as monotherapy as adjuvant treatment after surgery, for adults with locally advanced or early-stage triple-negative breast cancer at high risk of recurrence."
  },
  "00860": {
    "code": "00860",
    "protocol_id": "nccp-00860-v2",
    "settings": [
      "neoadjuvant",
      "adjuvant"
    ],
    "receptors": [
      "tnbc"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6452/860_v2_Pembro_Carbo_AUC_5_Pacli_80_DDAC.pdf",
    "basis": "Neoadjuvant pembrolizumab plus chemotherapy followed by adjuvant pembrolizumab for high-risk early or locally advanced TNBC."
  },
  "00861": {
    "code": "00861",
    "protocol_id": "nccp-00861-v2",
    "settings": [
      "neoadjuvant",
      "adjuvant"
    ],
    "receptors": [
      "tnbc"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6453/861_v2_Pembro_Carbo_AUC_1.5_Pacli_80_DDAC.pdf",
    "basis": "Neoadjuvant pembrolizumab plus chemotherapy followed by adjuvant pembrolizumab for high-risk early or locally advanced TNBC."
  },
  "00892": {
    "code": "00892",
    "protocol_id": "nccp-00892-v2",
    "settings": [
      "adjuvant"
    ],
    "receptors": [
      "hrpos-her2neg"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6649/892_Ribociclib_Adjuvant.pdf",
    "basis": "HR-positive/HER2-negative early breast cancer at high recurrence risk: stage IIA with qualifying nodal/high-risk factors, or stage IIB–III, as specified by NCCP. Current NCCP00892v2 includes selected node-negative eligibility and a conflicting node-negative exclusion; clinical reconciliation remains required."
  },
  "00936": {
    "code": "00936",
    "protocol_id": "nccp-00936-vcurrent",
    "settings": [
      "advanced"
    ],
    "receptors": [
      "her2pos"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/8391/936_Tucatinib_Regimen.pdf",
    "basis": "Advanced / metastatic · previously treated HER2-positive breast cancer; indication remains a clinician decision"
  },
  "00212": {
    "settings": [
      "advanced"
    ],
    "receptors": [
      "hrpos-her2neg",
      "tnbc"
    ],
    "basis": "First-line HER2-negative metastatic breast cancer with paclitaxel. This suite explains the bevacizumab component; paclitaxel and any other treatment need their own plan and assessment.",
    "code": "00212",
    "protocol_id": "nccp-00212-v6a",
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6552/212_Bevacizumab_10.pdf"
  },
  "00203": {
    "code": "00203",
    "protocol_id": "nccp-00203-v7",
    "settings": [
      "advanced"
    ],
    "receptors": [
      "any"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6543/203_DOCEtaxel_75-21day.pdf",
    "basis": "Source-defined breast, lung, gastric, gynaecological and castration-sensitive prostate cancer (including high-risk nonmetastatic prostate disease); receptor eligibility and full indication require clinical confirmation"
  },
  "00226": {
    "code": "00226",
    "protocol_id": "nccp-00226-v9",
    "settings": [
      "advanced"
    ],
    "receptors": [
      "any"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6562/226_V9_Paclitaxel_80.pdf",
    "basis": "NCCP 00226 a: metastatic breast carcinoma after failure of, or when unsuitable for, standard anthracycline-containing therapy. Other source cancers retain separate evidence and eligibility."
  },
  "00621": {
    "code": "00621",
    "protocol_id": "nccp-00621-v9",
    "settings": [
      "advanced"
    ],
    "receptors": [
      "any"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6854/621_V3_Paclitaxel_80_zanF78k.pdf",
    "basis": "Source-defined advanced gastric, breast, ovarian, small-cell lung or bladder indications; receptor eligibility and full indication require clinical confirmation"
  },
  "00251": {
    "settings": [
      "advanced"
    ],
    "receptors": [
      "any"
    ],
    "basis": "NCCP advanced breast monotherapy indication. Treatment choice still requires full clinical and biomarker context.",
    "code": "00251",
    "protocol_id": "nccp-00251-v6",
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6355/251_CARBOplatin_AUC4-6_28days.pdf"
  },
  "00261": {
    "settings": [
      "advanced"
    ],
    "receptors": [
      "any"
    ],
    "basis": "NCCP advanced breast monotherapy indication. Treatment choice still requires full clinical and biomarker context.",
    "code": "00261",
    "protocol_id": "nccp-00261-v7",
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6366/261_CARBOplatinAUC4-6_21days.pdf"
  },
  "00205": {
    "code": "00205",
    "protocol_id": "nccp-00205-v8",
    "settings": [
      "advanced"
    ],
    "receptors": [
      "any"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6546/205_V8_Peg_Lipo_DOXO_28_day.pdf",
    "basis": "Metastatic breast cancer; advanced ovarian cancer after failed first-line platinum chemotherapy; metastatic soft-tissue sarcoma; or recurrent / advanced endometrial cancer. Eligibility differs by cancer type."
  },
  "00259": {
    "settings": [
      "advanced"
    ],
    "receptors": [
      "any"
    ],
    "basis": "NCCP advanced breast monotherapy indication. Treatment choice still requires full clinical and biomarker context.",
    "code": "00259",
    "protocol_id": "nccp-00259-v6",
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6363/259_Vinorelbine_Oral.pdf"
  },
  "00232": {
    "settings": [
      "advanced"
    ],
    "receptors": [
      "any"
    ],
    "basis": "NCCP advanced breast monotherapy indication. Treatment choice still requires full clinical and biomarker context.",
    "code": "00232",
    "protocol_id": "nccp-00232-v5",
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6567/232_v5_Vinorelbine_IV.pdf"
  },
  "00228": {
    "code": "00228",
    "protocol_id": "nccp-00228-v8",
    "settings": [
      "advanced"
    ],
    "receptors": [
      "any"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6564/228_eriBULin.pdf",
    "basis": "Advanced breast cancer after at least one chemotherapy regimen for advanced disease, with prior anthracycline and taxane unless unsuitable; or adult unresectable liposarcoma after anthracycline unless unsuitable."
  },
  "00215": {
    "settings": [
      "advanced"
    ],
    "receptors": [
      "hrpos-her2neg",
      "tnbc"
    ],
    "basis": "First-line HER2-negative metastatic breast cancer with paclitaxel. This suite explains the bevacizumab component; paclitaxel and any other treatment need their own plan and assessment.",
    "code": "00215",
    "protocol_id": "nccp-00215-v7",
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6940/00215_Bevacizumab_15.pdf"
  },
  "00588": {
    "code": "00588",
    "protocol_id": "nccp-00588-v5b",
    "settings": [
      "adjuvant"
    ],
    "receptors": [
      "hrpos-her2neg",
      "tnbc"
    ],
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6397/olaparib_tablet_monotherapy_588.pdf",
    "basis": "Adults with a confirmed pathogenic germline BRCA1/2 mutation, HER2-negative high-risk early breast cancer and previous neoadjuvant or adjuvant chemotherapy. The high-risk definition depends on hormone receptors, prior chemotherapy setting, surgical pathology and, for one pathway, CPS+EG score.",
    "setting_qualifications": {
      "adjuvant": "NCCP 00588 h only; germline BRCA1/2, HER2-negative high-risk early breast criteria apply."
    }
  },
  "00947": {
    "settings": [
      "advanced"
    ],
    "receptors": [
      "hrpos-her2neg"
    ],
    "basis": "Adults with ER-positive, HER2-negative locally advanced or metastatic breast cancer with a validated PIK3CA, AKT1 or PTEN alteration, after recurrence/progression on or after an endocrine regimen. NCCP eligibility includes ECOG 0–2. This is not an unrestricted HR-positive breast regimen.",
    "code": "00947",
    "protocol_id": "nccp-00947-v1",
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/10966/00947_Capivasertib_Fulvestrant.pdf"
  },
  "00207": {
    "settings": [
      "advanced"
    ],
    "receptors": [
      "any"
    ],
    "basis": "Selected metastatic colorectal cancer; or locally advanced head/neck cancer with radiotherapy when platinum is unsuitable",
    "code": "00207",
    "protocol_id": "nccp-00207-v5",
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6941/207_Cetuximab_7day_.pdf"
  },
  "00447": {
    "settings": [
      "advanced"
    ],
    "receptors": [
      "any"
    ],
    "basis": "First-line RAS wild-type metastatic colorectal cancer",
    "code": "00447",
    "protocol_id": "nccp-00447-v6b",
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6479/447_Panitumumab_plus_mFOLFOX-6.pdf"
  },
  "00448": {
    "settings": [
      "advanced"
    ],
    "receptors": [
      "any"
    ],
    "basis": "RAS wild-type metastatic colorectal cancer; first-line or selected second-line",
    "code": "00448",
    "protocol_id": "nccp-00448-v4b",
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6480/448_Panitumumab_plus_FOLFIRI.pdf"
  },
  "00568": {
    "settings": [
      "advanced"
    ],
    "receptors": [
      "any"
    ],
    "basis": "First-line metastatic non-squamous NSCLC without EGFR or ALK alterations",
    "code": "00568",
    "protocol_id": "nccp-00568-v5",
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6891/568_V5_Pembrolizumab_PEMEtrexed_CARBOplatin.pdf"
  },
  "00586": {
    "settings": [
      "locally_advanced"
    ],
    "receptors": [
      "any"
    ],
    "basis": "Locally advanced rectal cancer with concurrent radiotherapy",
    "code": "00586",
    "protocol_id": "nccp-00586-v3",
    "longitudinal": true,
    "source_url": "https://healthservice.hse.ie/documents/6396/586_v3_Capecitabine_825_and_RT.pdf"
  }
};
const ids=['breastSetting','breastReceptor','breastSuite'];
const val=id=>root.document?.getElementById(id)?.value||'all';
function codeForCard(card){return (card.dataset.jsonProtocolId||'').match(/nccp-(\d{5})-/)?.[1]||'';}
function sync(tumour,domain){const panel=root.document?.getElementById('breastLibraryFilters');if(panel)panel.hidden=tumour!=='Breast'||domain==='haem';}
function matchesReceptor(d,receptor){return receptor==='all'||d.receptors.includes('any')||d.receptors.includes(receptor)||(receptor==='hrpos-her2pos'&&d.receptors.includes('her2pos'))||(receptor==='her2pos'&&d.receptors.includes('hrpos-her2pos'));}
function matchesCard(card,tumour,domain){if(tumour!=='Breast'||domain==='haem')return true;const active=ids.some(id=>val(id)!=='all');if(!active)return true;const d=regimens[codeForCard(card)];if(!d||!(card.dataset.tumour||'').split(',').includes('Breast'))return false;const setting=val('breastSetting'),receptor=val('breastReceptor'),specific=d.setting_receptors?.[setting];return (setting==='all'||d.settings.includes(setting))&&matchesReceptor(specific?{receptors:specific}:d,receptor)&&(val('breastSuite')==='all'||d.longitudinal);}
function init(){for(const id of ids)root.document.getElementById(id)?.addEventListener('change',()=>root.filterRegimens?.());root.document.getElementById('clearBreastFilters')?.addEventListener('click',()=>{ids.forEach(id=>{const e=root.document.getElementById(id);if(e)e.value='all';});root.filterRegimens?.();});}
root.SACTCheckBreastLibrary=Object.freeze({version:'0.83.7',regimens,sync,matchesReceptor,matchesCard,codeForCard});
if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init);else if(root.document)init();
if(typeof module==='object'&&module.exports)module.exports=root.SACTCheckBreastLibrary;
})(typeof globalThis!=='undefined'?globalThis:this);
