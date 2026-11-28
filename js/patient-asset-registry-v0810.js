/**
 * SACTCheck v0.81.0 - canonical patient asset registry.
 *
 * This is the single source of truth for dedicated patient-facing routes.
 * All clinician-card, workflow, QR and compatibility routing must resolve
 * dedicated patient assets through this registry. Dynamic rendering is a
 * fallback only for regimens that are not registered here.
 */
(function(root,factory){
  const api=factory(root||{});
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.SACTCheckPatientAssets=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';

  const RELEASE='0.84.74';
  const CONTENT_RELEASE='0.84.42';
  const PUBLIC_ORIGIN='https://sactcheck.com/';
  const DEFINITIONS=Object.freeze({
    '00267':{"title": "Two-day etoposide and cisplatin (EP)", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00301':{"title": "Five-day etoposide and cisplatin (EP)", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00904':{"title": "Rucaparib monotherapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00247':{"title": "Dactinomycin for low-risk GTN", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00248':{"title": "EMA/CO for gestational trophoblastic neoplasia", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00249':{"title": "Intrathecal methotrexate for GTN", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00264':{"title": "EMA/EP for gestational trophoblastic neoplasia", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00266':{"title": "TP/TE for gestational trophoblastic neoplasia", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00312':{"title": "Weekly topotecan", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00375':{"title": "Pegylated liposomal doxorubicin and trabectedin", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00676':{"title": "Cisplatin chemoradiation, then paclitaxel and carboplatin", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00300':{"title": "BEP · bleomycin, etoposide and cisplatin", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00246':{"title": "Methotrexate with folinic acid rescue", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00817':{"title": "Pembrolizumab with paclitaxel and carboplatin", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00811':{"title": "Pembrolizumab, paclitaxel, carboplatin and bevacizumab", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00799':{"title": "Paclitaxel, cisplatin and bevacizumab", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00766':{"title": "Paclitaxel, carboplatin AUC 6 and bevacizumab", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00499':{"title": "Gemcitabine, carboplatin and bevacizumab", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00344':{"title": "FLOT · chemotherapy before and after surgery", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true, "portPump": true},
    '00620':{"title":"Bevacizumab 7.5 mg/kg with carboplatin and paclitaxel","guide":true,"passport":true,"sactCard":true,"knowledge":true,"consentDraft":true,"supportiveCare":true,"phaseSupport":true,"longitudinal":true},
    '00716':{"title":"Bevacizumab 15 mg/kg with carboplatin and paclitaxel","guide":true,"passport":true,"sactCard":true,"knowledge":true,"consentDraft":true,"supportiveCare":true,"phaseSupport":true,"longitudinal":true},
    '00769':{"title":"Bevacizumab with weekly paclitaxel","guide":true,"passport":true,"sactCard":true,"knowledge":true,"consentDraft":true,"supportiveCare":true,"phaseSupport":true,"longitudinal":true},
    '00771':{"title":"Bevacizumab with weekly topotecan","guide":true,"passport":true,"sactCard":true,"knowledge":true,"consentDraft":true,"supportiveCare":true,"phaseSupport":true,"longitudinal":true},
    '00772':{"title":"Bevacizumab with pegylated liposomal doxorubicin","guide":true,"passport":true,"sactCard":true,"knowledge":true,"consentDraft":true,"supportiveCare":true,"phaseSupport":true,"longitudinal":true},
    '00303':{"title":"Paclitaxel and carboplatin every three weeks","guide":true,"passport":true,"sactCard":true,"knowledge":true,"consentDraft":true,"supportiveCare":true,"phaseSupport":true,"longitudinal":true},
    '00306':{"title":"Gemcitabine and carboplatin","guide":true,"passport":true,"sactCard":true,"knowledge":true,"consentDraft":true,"supportiveCare":true,"phaseSupport":true,"longitudinal":true},
    '00308':{"title":"Weekly paclitaxel with three-weekly carboplatin","guide":true,"passport":true,"sactCard":true,"knowledge":true,"consentDraft":true,"supportiveCare":true,"phaseSupport":true,"longitudinal":true},
    '00624':{"title":"Liposomal doxorubicin and carboplatin","guide":true,"passport":true,"sactCard":true,"knowledge":true,"consentDraft":true,"supportiveCare":true,"phaseSupport":true,"longitudinal":true},
    '00819':{"title":"Dostarlimab (Jemperli) alone","guide":true,"passport":true,"sactCard":true,"knowledge":true,"consentDraft":true,"supportiveCare":true,"phaseSupport":true,"longitudinal":true},
    '00675':{"title": "IE/VAC: alternating two-weekly phases", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00747':{"title": "IE/VAC: alternating three-weekly phases", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00504':{"title": "Irinotecan and temozolomide", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00754':{"title": "IVADo: ifosfamide, vincristine, doxorubicin and dactinomycin", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00757':{"title": "VIT: vincristine, irinotecan and temozolomide", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00420':{"title": "Doxorubicin and cisplatin: osteosarcoma", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00463':{"title": "MAP: surgery-linked osteosarcoma reference course", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00100':{"title": "Mifamurtide: 36-week reference course", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00596':{"title": "Ifosfamide and etoposide:21-day schedule", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00680':{"title": "High-dose ifosfamide:five-day infusion", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00374':{"title": "Trabectedin: soft tissue sarcoma", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00462':{"title": "Pegylated liposomal doxorubicin:20 mg/m\u00b2 every21 days", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00554':{"title": "Vinblastine and methotrexate: sarcoma", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00335':{"title": "Imatinib: GIST", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00325':{"title": "Sunitinib: 42-day schedule \u2014 choose indication", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true, "contextOnly": true, "patientContexts": ["gist"], "scopeGuard": true, "scope": "GIST patient information is available. RCC requires separately authored information; select the indication."},
    '00719':{"title": "Sunitinib: 21-day schedule \u2014 choose indication", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true, "contextOnly": true, "patientContexts": ["gist"], "scopeGuard": true, "scope": "GIST patient information is available. RCC requires separately authored information; select the indication."},
    '00500':{"title": "Doxorubicin: soft tissue sarcoma", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00391':{"title": "Doxorubicin 60 and ifosfamide: soft tissue sarcoma", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00392':{"title": "Doxorubicin 75 and ifosfamide: soft tissue sarcoma", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00501':{"title": "Gemcitabine and docetaxel: soft tissue sarcoma", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00511':{"title": "Dacarbazine: soft tissue sarcoma", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00453':{"title": "High-dose carboplatin + etoposide with stem-cell rescue", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00602':{"title": "TIP: paclitaxel, ifosfamide and cisplatin", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00807':{"title": "BCG bladder treatment", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00885':{"title": "Erdafitinib: targeted tablets", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00894':{"title": "Gemcitabine + docetaxel bladder treatment", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00945':{"title": "Enfortumab vedotin + pembrolizumab", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00333':{"title": "Dose-dense MVAC · 14-day schedule", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00337':{"title": "CMV · before definitive bladder treatment", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00338':{"title": "MVAC · 28-day schedule", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00583':{"title": "Pembrolizumab + axitinib", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00846':{"title": "Enfortumab vedotin · monotherapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00282':{"title": "Gemcitabine + cisplatin · 28-day schedule", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00622':{"title": "Gemcitabine + split-dose cisplatin", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00628':{"title": "Adjuvant gemcitabine + cisplatin", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00450':{"title": "Mitomycin + fluorouracil with radiotherapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true, "portPump": true},
    '00759':{"title": "Weekly gemcitabine with radiotherapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},

    '00101':{"title": "Cabazitaxel + prednisolone", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00257':{"title": "Radium-223 (Xofigo)", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00313':{"title": "Docetaxel + prednisolone every 14 days", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00546':{"title": "Docetaxel + prednisolone every 21 days", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},

    '00482':{"title": "Bicalutamide: daily anti-androgen tablets", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00492':{"title": "Leuprorelin 11.25 mg: hormone injection every 12 weeks", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00493':{"title": "Leuprorelin 30 mg: hormone injection every 24 weeks", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00494':{"title": "Leuprorelin 3.75 mg: hormone injection every 28 days", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00848':{"title": "Akeega and prednisolone: BRCA-selected prostate treatment", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},

    '00478':{"title": "Goserelin 3.6 mg: hormone implant every 28 days", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00488':{"title": "Triptorelin 22.5 mg: hormone injection every 24 weeks", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00489':{"title": "Triptorelin 3 mg: hormone injection every 28 days", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00490':{"title": "Leuprorelin 7.5 mg: hormone injection every 28 days", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00491':{"title": "Leuprorelin 45 mg: hormone injection every 24 weeks", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00830':{"title": "Relugolix: daily hormone treatment", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00481':{"title": "Degarelix: hormone injections every 28 days", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00477':{"title": "Goserelin 10.8 mg: hormone implant every 12 weeks", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00479':{"title": "Leuprorelin 22.5 mg: hormone injection every 12 weeks", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00480':{"title": "Triptorelin 11.25 mg: hormone injection every 12 weeks", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00103':{"title": "Abiraterone and prednisolone: metastatic castration-resistant prostate cancer", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00577':{"title": "Abiraterone and prednisolone: metastatic hormone-sensitive prostate cancer", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00233':{"title": "Enzalutamide: castration-resistant prostate cancer", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00574':{"title": "Apalutamide: prostate cancer with ongoing ADT", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00693':{"title": "Darolutamide: high-risk nonmetastatic castration-resistant prostate cancer", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00294':{"title": "Sorafenib: differentiated thyroid cancer", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true, "contextOnly": true, "patientContexts": ["head_neck"], "scopeGuard": true, "scope": "Differentiated thyroid cancer only; HCC/RCC require separate patient information."},
    '00242':{"title": "Vandetanib: RET-positive medullary thyroid cancer", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00295':{"title": "Lenvatinib: differentiated thyroid cancer", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00615':{"title": "CAP: advanced salivary gland cancer", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00893':{"title": "Methotrexate: head and neck cancer", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00514':{"title": "Gemcitabine alone: nasopharyngeal cancer", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00517':{"title": "Gemcitabine 1250 and cisplatin: nasopharyngeal cancer", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00903':{"title": "Gemcitabine and cisplatin induction before chemoradiotherapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00589':{"title": "Four-day carboplatin and fluorouracil with radiotherapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00591':{"title": "Carboplatin AUC 4 and fluorouracil with radiotherapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00315':{"title": "Induction TPF: docetaxel 75 / cisplatin 75 / fluorouracil 1000", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00323':{"title": "Induction TCF then carboplatin chemoradiation", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00324':{"title": "Induction TCF then radiotherapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00332':{"title": "Weekly carboplatin AUC 1.5 with radiotherapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00419':{"title": "Weekly carboplatin AUC 2 with head and neck radiotherapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true, "contextOnly": true, "patientContexts": ["head_neck"], "scopeGuard": true, "scope": "Head and neck squamous cell carcinoma only; cervical cancer requires its own patient information."},

    '00314':{"title": "Cisplatin and fluorouracil every 28 days", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00552':{"title": "Carboplatin and fluorouracil after radiotherapy — nasopharyngeal cancer", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00417':{"title": "Cetuximab, cisplatin and fluorouracil", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00418':{"title": "Cetuximab, carboplatin and fluorouracil", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00696':{"title": "Paclitaxel and cetuximab every 28 days", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00102':{"title": "Vemurafenib alone — advanced melanoma", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00105':{"title": "Ipilimumab alone — advanced melanoma", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00237':{"title": "Dabrafenib alone — advanced melanoma", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00373':{"title": "Cobimetinib + vemurafenib — advanced melanoma", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00464':{"title": "Dacarbazine — metastatic melanoma", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00385':{"title": "Weekly cisplatin with radiotherapy — choose indication", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true, "contextOnly": true, "patientContexts": ["head_neck", "nasopharyngeal"], "scopeGuard": true, "scope": "Confirm HNSCC versus nasopharyngeal indication; cervical/bladder regimens require their own patient information."},
    '00387':{"title": "Cisplatin every 3 weeks with head and neck radiotherapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00705':{"title": "Pembrolizumab, carboplatin and fluorouracil", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00706':{"title": "Pembrolizumab, cisplatin and fluorouracil", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00535':{"title": "Avelumab — metastatic Merkel-cell carcinoma", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true, "contextOnly": true, "patientContexts": ["merkel_cell"], "scopeGuard": true, "scope": "Merkel cell skin cancer only; other shared indications require separate information"},
    '00236':{"title": "Vismodegib for advanced basal cell skin cancer", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00415':{"title": "Dabrafenib and trametinib for advanced BRAF-mutated melanoma", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00563':{"title": "Encorafenib and binimetinib for advanced BRAF-mutated melanoma", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00431':{"title": "Nivolumab and ipilimumab for advanced melanoma", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true, "scopeGuard": true, "scope": "Melanoma patient information only"},
    '00812':{"title": "Cemiplimab for advanced cutaneous squamous cell cancer", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true, "scopeGuard": true, "scope": "Choose the advanced cutaneous squamous cell carcinoma or cervical cancer pathway"},
    '00742':{"title": "Lomustine + bevacizumab 5 mg/kg", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00804':{"title": "Lomustine + bevacizumab 7.5 mg/kg", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00805':{"title": "Lomustine for recurrent malignant glioma", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00806':{"title": "Cisplatin, lomustine and vincristine (CLV)", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00813':{"title": "Bevacizumab 5 mg/kg every 14 days", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00334':{"title": "Temozolomide with radiotherapy, then adjuvant temozolomide", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00342':{"title": "Temozolomide for recurrent or progressive glioma", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00379':{"title": "PCV chemotherapy · 42-day cycle", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00461':{"title": "Temozolomide with short-course radiotherapy, then adjuvant treatment", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00658':{"title": "PCV chemotherapy · 56-day cycle", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00320':{"title": "Everolimus · neuroendocrine tumour context", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true, "contextOnly": true, "patientContexts": ["neuroendocrine"], "scopeGuard": true, "scope": "NET patient suite only; kidney-cancer indication requires separate matching information"},
    '00327':{"title": "Sunitinib · pancreatic neuroendocrine tumours", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00505':{"title": "CAPTEM · capecitabine and temozolomide", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00642':{"title": "Lutathera · peptide receptor radionuclide therapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},

    '00734':{"title": "weekly carboplatin AUC 2 / paclitaxel \u2192 dose-dense AC", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00348':{"title": "carboplatin AUC 6 / paclitaxel \u2192 dose-dense AC", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00861':{"title": "Pembrolizumab 400 mg + weekly carboplatin AUC 1.5 / paclitaxel \u2192 dose-dense AC", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00860':{"title": "Pembrolizumab 400 mg + carboplatin AUC 5 / paclitaxel \u2192 dose-dense AC", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00858':{"title": "Pembrolizumab 200 mg + weekly carboplatin AUC 1.5 / paclitaxel \u2192 AC", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00797':{"title": "Phesgo + weekly paclitaxel", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00796':{"title": "Phesgo + docetaxel", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00217':{"title": "Lapatinib + capecitabine", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00350':{"title": "Pertuzumab + trastuzumab · with selected chemotherapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00526':{"title": "Pertuzumab + trastuzumab + vinorelbine", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00775':{"title": "TRAIN-2 · IV pertuzumab / trastuzumab", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00798':{"title": "Phesgo + vinorelbine", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00262':{"title": "EC90", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00263':{"title": "EC75", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00265':{"title": "FEC100", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00269':{"title": "FEC50", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00423':{"title": "AT 50/75", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00377':{"title": "CMF · oral cyclophosphamide", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00378':{"title": "CMF · IV · 28-day schedule", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00381':{"title": "CMF · IV · 21-day schedule", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00430':{"title": "Gemcitabine + carboplatin AUC2", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00749':{"title": "Gemcitabine 800 mg/m² · 28-day schedule", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00545':{"title": "Zoledronic acid · adjuvant breast treatment", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00605':{"title": "Talazoparib · breast monotherapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00688':{"title": "Atezolizumab + nab-paclitaxel", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00720':{"title": "Neratinib · extended adjuvant treatment", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00738':{"title": "Bevacizumab + weekly paclitaxel", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00947':{"title": "Capivasertib + fulvestrant", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00232':{"title": "Vinorelbine IV · advanced breast cancer", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00259':{"title": "Vinorelbine capsules · advanced breast cancer", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00251':{"title": "Carboplatin · 28-day breast schedule", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00261':{"title": "Carboplatin · 21-day breast schedule", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00212':{"title": "Bevacizumab every 14 days · breast treatment component", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00215':{"title": "Bevacizumab every 21 days · breast treatment component", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00455':{"title": "Pembrolizumab 200 mg · every 3 weeks · lung cancer", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true, "scopeGuard": true, "scope": "Lung contexts only; distinguish the source indication and treatment phase"},
    '00558':{"title": "Pembrolizumab 400 mg · every 6 weeks · lung cancer", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true, "scopeGuard": true, "scope": "Lung contexts only; distinguish the source indication and treatment phase"},
    '00579':{"title": "Pembrolizumab + paclitaxel + carboplatin AUC6", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00576':{"title": "Durvalumab 10 mg/kg every 14 days", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00897':{"title": "Durvalumab with gemcitabine and cisplatin", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00926':{"title": "Tremelimumab with durvalumab for liver cancer", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00862':{"title": "Niraparib (Zejula) tablets", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00929':{"title": "Jemperli with paclitaxel and carboplatin", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00953':{"title": "Durvalumab with carboplatin and paclitaxel for endometrial cancer", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00655':{"title": "Durvalumab 1500 mg every 28 days", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00689':{"title": "Atezolizumab + carboplatin + etoposide", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00908':{"title": "Serplulimab, carboplatin and etoposide", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00271':{"title": "Carboplatin + Etoposide", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00280':{"title": "Cisplatin + Etoposide", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00319':{"title": "Carboplatin + Oral Etoposide", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00353':{"title": "Osimertinib monotherapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00401':{"title": "Alectinib monotherapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00562':{"title": "Brigatinib Therapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00570':{"title": "Lorlatinib therapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00243':{"title": "Crizotinib monotherapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00340':{"title": "Ceritinib monotherapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00823':{"title": "Tepotinib monotherapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00702':{"title": "Entrectinib monotherapy · adult", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00221':{"title": "Afatinib monotherapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00565':{"title": "Dacomitinib monotherapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00544':{"title": "Atezolizumab 1200 mg · every 3 weeks · lung cancer", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true, "scopeGuard": true, "scope": "Lung contexts only; distinguish the source indication and treatment phase"},
    '00592':{"title": "Atezolizumab 840 mg · every 2 weeks · lung cancer", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true, "scopeGuard": true, "scope": "Lung contexts only; distinguish the source indication and treatment phase"},
    '00593':{"title": "Atezolizumab 1680 mg · every 4 weeks · lung cancer", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true, "scopeGuard": true, "scope": "Lung contexts only; distinguish the source indication and treatment phase"},
    '00219':{"title": "Erlotinib monotherapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00220':{"title": "Gefitinib monotherapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00483':{"title": "Nivolumab · every 2 weeks · previously treated NSCLC", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true, "scopeGuard": true, "scope": "Lung contexts only; distinguish the source indication and treatment phase"},
    '00484':{"title": "Nivolumab · every 4 weeks · previously treated NSCLC", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true, "scopeGuard": true, "scope": "Lung contexts only; distinguish the source indication and treatment phase"},
    '00712':{"title": "Nivolumab, ipilimumab, paclitaxel and carboplatin", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00792':{"title": "Nivolumab and ipilimumab for pleural mesothelioma", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00849':{"title": "Nivolumab and selected platinum chemotherapy before surgery", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true, "scopeGuard": true, "scope": "Choose the prescribed neoadjuvant chemotherapy backbone", "contextOnly": true, "patientContexts": ["backbone_00304", "backbone_00310", "backbone_00281", "backbone_00318", "backbone_00317"]},
    '00281':{"title": "Gemcitabine and cisplatin · lung cancer", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00310':{"title": "Gemcitabine and carboplatin · lung cancer", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true, "scopeGuard": true, "scope": "Lung contexts only; distinguish the source indication and treatment phase"},
    '00339':{"title": "Vinorelbine and cisplatin · 21-day cycle", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00343':{"title": "Vinorelbine and cisplatin · 28-day cycle", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00304':{"title": "Carboplatin and paclitaxel · lung cancer", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00311':{"title": "Topotecan by infusion · small-cell lung cancer", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true, "scopeGuard": true, "scope": "Lung contexts only; distinguish the source indication and treatment phase"},
    '00587':{"title": "Topotecan capsules · small-cell lung cancer", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00388':{"title": "Oral etoposide · small-cell lung cancer", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true, "contextOnly": true, "patientContexts": ["schedule_7d", "schedule_3d", "schedule_21d"], "scopeGuard": true, "scope": "Choose the prescribed oral etoposide schedule"},
    '00284':{"title": "Gemcitabine alone · non-small-cell lung cancer", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true, "scopeGuard": true, "scope": "Lung contexts only; distinguish the source indication and treatment phase"},
    '00614':{"title": "Carboplatin and vinorelbine · lung cancer", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00943':{title:"Pembrolizumab with cisplatin chemoradiotherapy for cervical cancer", guide:true, passport:true, sactCard:true, knowledge:true, consentDraft:true, supportiveCare:true, phaseSupport:true, longitudinal:true},
    '00921':{title:"Mirvetuximab soravtansine for ovarian, fallopian tube or primary peritoneal cancer", guide:true, passport:true, sactCard:true, knowledge:true, consentDraft:true, supportiveCare:true, phaseSupport:true, longitudinal:true},
    '00279':{"title": "Cisplatin + etoposide with radiotherapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true, "scopeGuard": true, "scope": "Reference IV cisplatin/etoposide every21days; confirm any alternative prescription"},
    '00309':{"title": "Weekly carboplatin + paclitaxel with radiotherapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00456':{"title": "Cisplatin + etoposide + chest radiotherapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00561':{"title": "Carboplatin + etoposide + chest radiotherapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00214':{"title": "Bevacizumab 7.5 · lung", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true, "scopeGuard": true, "scope": "Lung indication only; confirm the prescribed chemotherapy partner"},
    '00372':{"title": "Nintedanib treatment · choose current phase", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true, "contextOnly": true, "patientContexts": ["combination", "continuation"], "scopeGuard": true, "scope": "Confirm the current prescribed treatment phase"},
    '00660':{"title": "Fluorouracil + folinic acid every 14 days", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00421':{"title": "Continuous fluorouracil + radiotherapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00427':{"title": "Roswell Park modified fluorouracil + folinic acid", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00428':{"title": "QUASAR modified weekly fluorouracil + folinic acid", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00486':{"title": "FLOX: fluorouracil, folinic acid and oxaliplatin", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00555':{"title": "FOLFOXIRI", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00783':{"title": "Bevacizumab + FOLFOXIRI", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00691':{"title": "FOLFIRINOX followed by chemoradiotherapy · rectal cancer", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00238':{"title": "Aflibercept + FOLFIRI", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00791':{"title": "Bevacizumab + fluorouracil / folinic acid", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00244':{"title": "Regorafenib (Stivarga) monotherapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00551':{"title": "Nivolumab + ipilimumab · colorectal after chemotherapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true, "scopeGuard": true, "scope": "Colorectal context only; confirm the exact NCCP indication and phase"},
    '00890':{"title": "Fruquintinib (Fruzaqla) monotherapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true, "scopeGuard": true, "scope": "Colorectal context only; confirm the exact NCCP indication and phase"},
    '00900':{"title": "Nivolumab + ipilimumab · first-line colorectal", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true, "scopeGuard": true, "scope": "Colorectal context only; confirm the exact NCCP indication and phase"},
    '00790':{"title": "TRAIN-2 with Phesgo", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00789':{"title": "TCHP with Phesgo", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00785':{"title": "Phesgo maintenance", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00104':{"title": "Axitinib \u00b7 renal monotherapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00518':{"title": "Cabozantinib \u00b7 renal monotherapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00564':{"title": "Tivozanib \u00b7 renal monotherapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00326':{"title": "Temsirolimus \u00b7 renal monotherapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00588':{"title": "Olaparib monotherapy · select treatment context", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true, "scopeGuard": true, "scope": "Select breast, prostate, first-line ovarian, relapsed ovarian or pancreatic monotherapy; combinations have a separate regimen"},
    '00746':{"title": "Olaparib and bevacizumab · ovarian maintenance", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00794':{"title": "Sacituzumab govitecan (Trodelvy)", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00776':{"title": "Trastuzumab deruxtecan (Enhertu) · every 3 weeks", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00322':{"title": "Everolimus + exemestane", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00414':{"title": "Palbociclib with endocrine therapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00361':{"title": "Fulvestrant · injections every 4 weeks", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00376':{"title": "Exemestane · daily hormone therapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00371':{"title": "Letrozole · daily hormone therapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00254':{"title": "Anastrozole · daily hormone therapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00253':{"title": "Tamoxifen · daily hormone therapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00205':{"title": "Pegylated liposomal doxorubicin · every 4 weeks", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00736':{"title": "Nab-paclitaxel · Days 1, 8 and 15 of 28", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00230':{"title": "Nab-paclitaxel · every 3 weeks", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00743':{"title": "Eribulin · Days 1 and 15 of 28", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00228':{"title": "Eribulin · Days 1 and 8 of 21", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00507':{"title": "Weekly paclitaxel + pertuzumab + trastuzumab", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00204':{"title": "Docetaxel + pertuzumab + trastuzumab", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00731':{"title": "TCHP · subcutaneous trastuzumab", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00258':{"title": "TCH → trastuzumab continuation", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00621':{"title": "Paclitaxel · Days 1, 8 and 15 of 28", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00512':{"title": "Weekly paclitaxel + weekly trastuzumab → trastuzumab", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00250':{"title": "Docetaxel + cyclophosphamide (TC)", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00203':{"title": "Docetaxel 75 mg/m² · every 3 weeks", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00202':{"title": "Docetaxel 100 mg/m² · every 3 weeks", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00745':{"title": "Dose-dense AC → weekly paclitaxel + 3-weekly trastuzumab", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00433':{"title": "Dose-dense AC → weekly paclitaxel + weekly trastuzumab", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00432':{"title": "AC → weekly paclitaxel + weekly trastuzumab", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00316':{"title": "Dose-dense AC → fortnightly paclitaxel + weekly trastuzumab", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00278':{"title": "Dose-dense AC → paclitaxel every 2 weeks", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00260':{"title": "AC every 3 weeks → weekly paclitaxel", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00252':{"title": "AC · every 3 weeks", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00200':{"title": "Trastuzumab IV \u00b7 every 3 weeks", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00201':{"title": "Trastuzumab IV \u00b7 weekly \u00b7 metastatic", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00272':{"title": "Trastuzumab SC · metastatic", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00285':{"title": "Trastuzumab SC · early breast cancer", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00206':{"title": "Trastuzumab emtansine (T-DM1) \u00b7 metastatic", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00485':{"title": "Dose-dense AC → weekly paclitaxel", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00815':{"title": "Weekly paclitaxel + trastuzumab → trastuzumab continuation", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00659':{title:"Adjuvant trastuzumab emtansine (T-DM1)",guide:true,passport:true,sactCard:true,knowledge:true,consentDraft:true,supportiveCare:true,phaseSupport:true,longitudinal:true},
    '00892':{"title": "Adjuvant ribociclib + endocrine therapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00936':{"title": "Tucatinib + capecitabine + trastuzumab", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00525':{"title": "Ribociclib + endocrine therapy · metastatic", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00726':{title:"Pertuzumab + trastuzumab maintenance",guide:true,passport:true,sactCard:true,knowledge:true,consentDraft:true,supportiveCare:true,phaseSupport:true,longitudinal:true},
    '00207':{"title": "Weekly cetuximab", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00732':{"title": "Cetuximab · every two weeks", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00328':{"title": "Weekly cetuximab + FOLFIRI", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00585':{"title": "Fortnightly cetuximab + FOLFIRI", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00330':{"title": "Weekly cetuximab + irinotecan", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00331':{"title": "Fortnightly cetuximab + irinotecan", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00692':{"title": "Weekly cetuximab + FOLFOX-4", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00733':{"title": "Fortnightly cetuximab + modified FOLFOX-6", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00210':{"title": "FOLFOX-4", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00213':{"title": "Irinotecan · every three weeks", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00225':{"title": "Panitumumab", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00447':{"title": "Panitumumab + modified FOLFOX-6", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00448':{"title": "Panitumumab + FOLFIRI", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00216':{"title": "Capecitabine", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00586':{"title": "Capecitabine + rectal radiotherapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00623':{"title": "Bevacizumab + capecitabine", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00227':{"title": "FOLFIRI", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00449':{"title": "FOLFIRI + bevacizumab", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00446':{"title": "Modified FOLFOX-6 + bevacizumab", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},

    '00209':{"title": "Modified FOLFOX-6", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00226':{"title": "Weekly paclitaxel", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00321':{"title": "CAPOX / XELOX", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00222':{"title": "Pemetrexed Monotherapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00317':{"title": "Pemetrexed + Cisplatin", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00318':{"title": "Pemetrexed + Carboplatin", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00382':{"title": "Trifluridine/tipiracil (Lonsurf) monotherapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00568':{"title": "Pembrolizumab + pemetrexed + carboplatin", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00569':{"title": "Pembrolizumab + pemetrexed + cisplatin", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00619':{"title": "Adjuvant abemaciclib + endocrine therapy", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00713':{"title": "Nivolumab, ipilimumab, pemetrexed and carboplatin", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00714':{"title": "Nivolumab, ipilimumab, pemetrexed and cisplatin", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00722':{"title": "TCHP: docetaxel, carboplatin, trastuzumab and pertuzumab", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00831':{"title": "Atezolizumab + bevacizumab for HCC", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true, "contactCard": true},
    '00857':{title:"Pembrolizumab + carboplatin/paclitaxel \u2192 AC",guide:true,passport:true,sactCard:true,knowledge:true,consentDraft:true,supportiveCare:true,phaseSupport:true,longitudinal:true}
  });
  const CODES=Object.freeze(Object.keys(DEFINITIONS));
  const COLORECTAL_CONTEXTS=Object.freeze({'00455':{lung:'',colorectal:'colorectal/'},'00558':{lung:'',colorectal:'colorectal/'},'00212':{breast:'',colorectal:'colorectal/'},'00214':{lung:'',colorectal:'colorectal/'},'00215':{breast:'',lung:'lung/',colorectal:'colorectal/'}});
  const MELANOMA_CODES=['00455','00558','00483','00484'];
  const MELANOMA_CONTEXTS=['melanoma_advanced','melanoma_adjuvant'];
  const HEAD_NECK46_CODES=Object.freeze(['00261','00483','00484','00455','00558']);
  const GIST_CONTEXT_CODES=Object.freeze(['00325','00719','00244']);
  const CONTEXT_CODES=Object.freeze(['00279','00812','00228','00205','00251','00325','00719','00244','00588','00294','00419','00261','00385','00207','00535','00551','00483','00484','00415','00320','00455','00558','00212','00214','00203','00226','00232','00259','00215','00621']);
  const CONTEXT_ASSETS=Object.freeze({'portal':'','knowledge':'knowledge.html','guide':'guide.pdf','passport':'passport.pdf','sact-card':'sactcard.pdf','consent-draft':'consent-form.html','supportive-care-selector':'supportive-care.html','supportive-care':'supportive-care.pdf','longitudinal':'treatment-journey.html'});
  const OLAPARIB_ROUTES=Object.freeze({breast:'',prostate:'prostate/',ovarian_first_line:'ovarian_first_line/',ovarian_relapsed:'ovarian_relapsed/',pancreatic:'pancreatic/'});
  const OLAPARIB_ASSETS=Object.freeze({...CONTEXT_ASSETS,handbook:'handbook.pdf','support-treatment':'support-treatment.html','support-treatment-pdf':'support-treatment.pdf','consent-pdf':'consent-form.pdf'});
  const OLAPARIB_CONTEXT_ALIASES=Object.freeze({
    breast:'breast',adjuvant_high_risk_early_breast:'breast','00588-breast':'breast',
    prostate:'prostate',gu:'prostate',genitourinary:'prostate',genitourinary_prostate:'prostate',mcrpc_brca_monotherapy:'prostate','00588-gu':'prostate',
    ovarian_first_line:'ovarian_first_line',first_line_advanced_ovarian_maintenance:'ovarian_first_line',
    ovarian_relapsed:'ovarian_relapsed',platinum_sensitive_relapsed_ovarian_maintenance:'ovarian_relapsed',
    pancreatic:'pancreatic',pancreatic_maintenance:'pancreatic',gi:'pancreatic',gastrointestinal:'pancreatic','00588-gi':'pancreatic',
    a:'ovarian_first_line',b:'ovarian_first_line',c:'ovarian_first_line',
    d:'ovarian_relapsed',e:'ovarian_relapsed',f:'ovarian_relapsed',g:'prostate',h:'breast',i:'pancreatic'
  });
  function olaparibContext(value,explicit){
    const resolve=token=>{
      const selected=text(token).toLowerCase().replace(/^00588\s*([a-i])$/,'$1');
      return Object.prototype.hasOwnProperty.call(OLAPARIB_CONTEXT_ALIASES,selected)?OLAPARIB_CONTEXT_ALIASES[selected]:'';
    };
    // An explicit but unknown/ambiguous selection must not fall back to breast
    // or to the first ovarian indication in the shared clinical protocol.
    if(text(explicit))return resolve(explicit);
    if(text(value?.patient_context))return resolve(value.patient_context);
    const indication=value?.selected_indication_id||value?.indication_id||value?.selected_indication;
    if(indication){
      const token=typeof indication==='object'?(indication.indication_id||indication.id||indication.code):indication;
      return resolve(token);
    }
    if(text(value?.reimbursement_code))return resolve(value.reimbursement_code);
    if(typeof value==='string'&&/^00588\s*[a-i]$/i.test(value.trim()))return resolve(value);
    return resolve(root.SACTCheckProtocolContext?.activeTumourGroup?.()||'');
  }

  const cervicalVisits = {
    '00385': {cervical_definitive:'weekly_rt', cervical_postoperative:'weekly_rt'},
    '00419': {cervical:'weekly_rt'},
    '00812': {cervical:'cemiplimab'},
    '00455': {cervical_maintenance:'maintenance'},
    '00558': {cervical_maintenance:'maintenance'}
  };
  const cervicalIndications = {
    '00385a':'cervical_definitive', '00385e':'cervical_postoperative',
    '00419b':'cervical', '00419-gyn':'cervical', '00812a':'cervical', '00812-gyn':'cervical',
    '00455j':'cervical_maintenance', '00455-gyn':'cervical_maintenance', '00558j':'cervical_maintenance'
  };
  const gynaeVisits = Object.freeze({
    '00943': ['concurrent_day1','cisplatin_weekly','optional_c2d15','pembro_q3w','pembro_q6w'],
    '00921': ['first_infusion','subsequent_infusion'],
    '00279': ['day1_platinum_etoposide','days23_iv_etoposide','days23_oral_etoposide','days23_fractionated_cisplatin'],
    '00203': ["day1"],
    '00212': ["paclitaxel", "topotecan", "pld", "bev_alone"],
    '00215': ["firstline", "continuation", "topotecan"],
    '00226': ["day1", "day8", "day15", "day22"],
    '00621': ["day1", "day8", "day15"],
    '00251': ['day1'], '00261': ['day1']
  });
  const ovarianIndications = {
    '00203': ['00203e','00203f','00203g'],
    '00212': ['00212b'], '00215': ['00215a','00215c'],
    '00226': ['00226b'], '00621': ['00621c']
  };
  const gynaeContext = {'00279':'cervical','00251':'ovarian','00261':'ovarian'};
  const gynaeGroups = ['gynaecology','gynecology'];

  function sharedGynaeSelection(code,value,selected) {
    const setting = gynaeContext[code];
    if (!setting && !ovarianIndications[code]) return null;
    const indication = value?.selected_indication_id || value?.selected_indication || value?.indication_id || value?.reimbursement_code ||
      (typeof value === 'string' && /^\d{5}[a-z]$/i.test(value) ? value : '');
    const id = text(typeof indication === 'object' ? indication.code || indication.indication_id || indication.id : indication).toLowerCase();
    if (ovarianIndications[code]) {
      const entries = Array.isArray(value?.indications) ? value.indications : [];
      const ovarian = token => ovarianIndications[code].includes(token) ||
        entries.some(entry => entry.indication_id === token && ovarianIndications[code].includes(entry.code));
      const requested = gynaeGroups.includes(selected) || selected === 'ovarian' || ovarian(selected);
      if (requested) return id && !ovarian(id) ? '' : 'ovarian';
      if (ovarian(id)) return !selected || selected === 'all' ? 'ovarian' : '';
      return null;
    }
    function fromId(token) {
      if (code === '00279') return token === '00279a' ? 'lung' : token === '00279b' ? 'cervical' : '';
      if (token === code + '-gyn' || (token.startsWith(code) && /^[a-i]$/.test(token.slice(code.length)))) return 'ovarian';
      if (token === code + 'j') return 'breast';
      return code === '00261' && ['00261k','00261-head-neck'].includes(token) ? 'head_neck' : '';
    }
    const stored = text(value?.patient_context).toLowerCase();
    let requested = selected;
    if (stored && (!requested || requested === 'all' || gynaeGroups.includes(requested) && stored === setting)) requested = stored;
    if (gynaeGroups.includes(requested)) requested = setting;
    if (['head and neck','head/neck'].includes(requested)) requested = 'head_neck';
    if (fromId(requested)) {
      if (requested === '00279b') return '';
      requested = fromId(requested);
    }
    const available = code === '00279' ? ['cervical','lung'] :
      code === '00251' ? ['ovarian','breast'] : ['ovarian','breast','head_neck'];
    if (code === '00279' && requested === 'cervical' && [false,'false'].includes(value?.cervical_primary_confirmed)) return '';
    if (available.includes(requested)) return id && fromId(id) !== requested ? '' : requested;
    if (requested && requested !== 'all') return '';
    // NCCP 00279b also covers other sites. Only a confirmed cervical setting opens this pack.
    return id === '00279b' ? '' : fromId(id);
  }

  function gynaeVisitContext(value,explicit='') {
    const code = typeof value === 'string' ? normaliseCode(value) : codeFor(value);
    if (!gynaeVisits[code]) return null;
    const context = ovarianIndications[code] ? 'ovarian' : gynaeContext[code];
    if (context && contextFor(value,explicit) !== context) return null;
    let visits = gynaeVisits[code];
    if (code === '00215') {
      const selection = value?.selected_indication_id || value?.selected_indication || value?.indication_id || value?.reimbursement_code;
      const id = typeof selection === 'object' ? selection?.code || selection?.indication_id || selection?.id : selection;
      if (['00215a','ovarian_frontline_or_continuation'].includes(id)) visits = ['firstline','continuation'];
      if (['00215c','platinum_resistant_ovarian'].includes(id)) visits = ['topotecan'];
    }
    return {code, route:'patient/'+code+'/'+(context ? context+'/' : ''), visits};
  }

  function gynaeVisitPath(value,explicit='',phase='') {
    const setting = gynaeVisitContext(value,explicit);
    if (!setting) {
      const code = typeof value === 'string' ? normaliseCode(value) : codeFor(value);
      return (gynaeContext[code] || ovarianIndications[code]) && !contextFor(value,explicit) ? scopePath(code,'antiemetic-prescription',value,explicit) : null;
    }
    const visit = setting.visits.includes(phase) ? phase : !phase && setting.visits.length === 1 ? setting.visits[0] : '';
    return setting.route + (visit ? 'antiemetic-'+visit+'.pdf' : 'antiemetic-prescriptions.html');
  }

  function gynaeAssessmentIndication(protocol,explicit='') {
    const setting = gynaeVisitContext(protocol,explicit);
    if (!setting) return '';
    if (setting.code === '00279') return '00279b';
    if (!gynaeContext[setting.code] && !ovarianIndications[setting.code]) return setting.code+'a';
    const selected = protocol?.selected_indication_id || protocol?.indication_id || protocol?.selected_indication || protocol?.reimbursement_code;
    const id = typeof selected === 'object' ? selected?.code || selected?.id || selected?.indication_id : selected;
    const entry = protocol.indications?.find(item => item.code === id || item.indication_id === id);
    if (entry) return entry.indication_id;
    const codes = ovarianIndications[setting.code];
    return codes?.length === 1 ? protocol.indications?.find(item => item.code === codes[0])?.indication_id || '' : '';
  }

  function cervicalSelection(code, value, selected) {
    const choices = cervicalVisits[code];
    if (!choices) return null;
    const indication = value?.selected_indication_id || value?.selected_indication || value?.indication_id || value?.reimbursement_code ||
      (typeof value === 'string' && /^\d{5}[a-z]$/i.test(value) ? value : '');
    const id = text(typeof indication === 'object' ? indication.code || indication.indication_id || indication.id : indication).toLowerCase();
    const fromId = id.startsWith(code) && Object.hasOwn(cervicalIndications,id) ? cervicalIndications[id] : '';
    const fromChoice = Object.hasOwn(choices,selected) ? selected :
      selected.startsWith(code) && Object.hasOwn(cervicalIndications,selected) ? cervicalIndications[selected] : '';
    const stored = text(value?.patient_context).toLowerCase();
    if (stored && ['all','gynaecology','gynecology','cervical'].includes(selected) && Object.hasOwn(choices,stored))
      return id && stored!==fromId ? '' : stored;
    if (fromChoice) return id && fromChoice !== fromId ? '' : fromChoice;
    if (['gynaecology','gynecology','cervical'].includes(selected)) {
      if (id) return fromId;
      const names = Object.keys(choices);
      return names.length === 1 ? names[0] : '';
    }
    if (fromId) return !selected || selected === 'all' ? fromId : '';
    if (selected === 'cervical_definitive' || selected === 'cervical_postoperative' || selected === 'cervical_maintenance') return '';
    return null;
  }
  function cervicalAssessmentIndication(value, explicit='') {
    const code = typeof value === 'string' ? normaliseCode(value) : codeFor(value);
    const context = contextFor(value,explicit);
    if(!cervicalVisits[code]?.[context]) return '';
    if(code==='00385') return context==='cervical_definitive' ? '00385a' : '00385e';
    return {'00419':'00419-gyn','00812':'00812-gyn','00455':'00455-gyn','00558':'00558j'}[code] || '';
  }
  function cervicalPrescription(value, explicit='') {
    const code = typeof value === 'string' ? normaliseCode(value) : codeFor(value);
    const context = contextFor(value, explicit);
    return cervicalVisits[code]?.[context] || '';
  }

  function scopePath(code, asset, value, explicit) {
    const group=text(explicit || value?.patient_context || root.SACTCheckProtocolContext?.activeTumourGroup?.()).toLowerCase();
    const cervicalIntent=code==='00385' && ['gynaecology','gynecology','cervical'].includes(group);
    return 'patient/'+code+'/scope.html?asset='+encodeURIComponent(asset)+(cervicalIntent?'&group=gynaecology':'');
  }
  function cervicalSupportPath(value, explicit='') {
    const code = typeof value === 'string' ? normaliseCode(value) : codeFor(value);
    if (!cervicalVisits[code]) return null;
    if (cervicalPrescription(value,explicit)) return relativePath(value,'antiemetic-prescription',explicit);
    const selected = text(explicit || value?.patient_context || root.SACTCheckProtocolContext?.activeTumourGroup?.()).toLowerCase();
    if (['gynaecology','gynecology','cervical'].includes(selected))
      return scopePath(code,'antiemetic-prescription',value,explicit);
    return null;
  }
  function contextFor(value,explicit=''){
    if(!CONTEXT_CODES.includes(typeof value==='string'?normaliseCode(value):codeFor(value)))return '';
    const code=typeof value==='string'?normaliseCode(value):codeFor(value);
    if(code==='00588')return olaparibContext(value,explicit);
    const selected=String(explicit||value?.patient_context||root.SACTCheckProtocolContext?.activeTumourGroup?.()||'').toLowerCase();
    const shared = sharedGynaeSelection(code,value,selected);
    if (shared !== null) return shared;
    const cervical = cervicalSelection(code,value,selected);
    if(cervical !== null) return cervical;
    if(code==='00812')return selected==='cutaneous-scc'?'cutaneous-scc':'';
    if(code==='00228')return ['liposarcoma','sarcoma'].includes(selected)?'liposarcoma':selected==='breast'?'breast':'';
    if(code==='00205')return selected==='sarcoma'?'sarcoma':selected==='breast'?'breast':'';
    if(GIST_CONTEXT_CODES.includes(code)){
      if(['gist','sarcoma'].includes(selected))return 'gist';
      return code==='00244'&&['colorectal','gastrointestinal'].includes(selected)?'colorectal':'';
    }
    if(code==='00203'&&['prostate','genitourinary','genitourinary_prostate'].includes(selected))return 'prostate';
    if(HEAD_NECK46_CODES.includes(code)&&['head_neck','head and neck','head/neck'].includes(selected))return 'head_neck';
    if(['00419','00294'].includes(code))return ['head_neck','head and neck','head/neck','head_neck_squamous_cell'].includes(selected)?'head_neck':'';
    if(code==='00385')return ['head_neck','nasopharyngeal'].includes(selected)?selected:'';
    if(code==='00207')return ['head_neck','head and neck','head/neck','head_neck_squamous_cell'].includes(selected)?'head_neck':(['gastrointestinal','colorectal'].includes(selected)?'colorectal':'');
    if(code==='00535')return ['merkel_cell','skin','skin/melanoma','skin_melanoma'].includes(selected)?'merkel_cell':'';
    if(code==='00551')return ['melanoma','skin','skin/melanoma','skin_melanoma'].includes(selected)?'melanoma':(['colorectal','gastrointestinal'].includes(selected)?'colorectal':'');
    if(code==='00415')return ['advanced','adjuvant'].includes(selected)?selected:'';
    if(code==='00320')return selected==='neuroendocrine'?'neuroendocrine':'';
    if(MELANOMA_CODES.includes(code)){
      if(MELANOMA_CONTEXTS.includes(selected)||(code==='00455'&&selected==='melanoma_perioperative'))return selected;
      return selected==='lung'?'lung':(['00455','00558'].includes(code)&&['colorectal','gastrointestinal'].includes(selected)?'colorectal':'');
    }
    const normalized=selected==='gastrointestinal'?'colorectal':selected;
    if(COLORECTAL_CONTEXTS[code])return Object.hasOwn(COLORECTAL_CONTEXTS[code],normalized)?normalized:'';
    return ['lung','breast'].includes(selected)?selected:'';
  }

  function text(v){return String(v??'').trim();}
  function normaliseCode(value){
    const digits=text(value).replace(/\D/g,'');
    if(!digits) return '';
    return digits.slice(-5).padStart(5,'0');
  }
  function codeFor(protocol){
    return normaliseCode(protocol?.metadata?.nccp_regimen_code||protocol?.nccp_regimen_code||protocol?.nccp_code||'');
  }
  function definitionFor(value){
    const code=typeof value==='string'?normaliseCode(value):codeFor(value);
    return code&&DEFINITIONS[code]?Object.freeze({code,...DEFINITIONS[code]}):null;
  }
  function bundleRoutes(value){
    const d=definitionFor(value);if(!d)return [];
    const extra = Object.keys(cervicalVisits[d.code] || {}).map(context => d.code + '/' + context);
    if(d.code==='00812')return [d.code,...extra];
    if(d.code==='00228')return [d.code,d.code+'/liposarcoma'];
    if(d.code==='00205')return [d.code,d.code+'/sarcoma'];
    if(['00325','00719'].includes(d.code))return [d.code+'/gist'];
    if(d.code==='00244')return [d.code,d.code+'/gist'];
    if (gynaeContext[d.code]) return [d.code,...(d.code==='00261'?[d.code+'/head_neck']:[]),d.code+'/'+gynaeContext[d.code]];
    if(d.code==='00588')return Object.values(OLAPARIB_ROUTES).map(suffix=>'00588'+(suffix?'/'+suffix.slice(0,-1):''));
    if (ovarianIndications[d.code]) {
      const prior = d.code === '00203' ? [d.code, d.code+'/lung', d.code+'/prostate'] : [d.code];
      return [...prior, d.code+'/ovarian'];
    }
    if(MELANOMA_CODES.includes(d.code))return [d.code,d.code+'/head_neck',...(['00455','00558'].includes(d.code)?[d.code+'/colorectal']:[]),...MELANOMA_CONTEXTS.map(x=>d.code+'/'+x),...(d.code==='00455'?[d.code+'/melanoma_perioperative']:[]),...extra];
    if(['00419','00294'].includes(d.code))return [d.code+'/head_neck',...extra];
    if(d.code==='00385')return ['00385/head_neck','00385/nasopharyngeal',...extra];
    if(d.code==='00207')return ['00207','00207/head_neck'];
    if(d.code==='00535')return [d.code+'/merkel_cell'];
    if(d.code==='00551')return [d.code,d.code+'/melanoma'];
    if(d.code==='00415')return [d.code,d.code+'/adjuvant'];
    if(!d.contextOnly)return [d.code];
    if(!Array.isArray(d.patientContexts)||!d.patientContexts.length||d.patientContexts.some(s=>!(d.code==='00320'?/^neuroendocrine$/:d.code==='00372'?/^(combination|continuation)$/:d.code==='00372'?/^(combination|continuation)$/:d.code==='00372'?/^(combination|continuation)$/:d.code==='00372'?/^(combination|continuation)$/:d.code==='00372'?/^(combination|continuation)$/:d.code==='00372'?/^(combination|continuation)$/:d.code==='00388'?/^schedule_(7d|3d|21d)$/:/^backbone_[0-9]{5}$/).test(s)))throw new Error('Invalid patient context routes');
    return d.patientContexts.map(s=>d.code+'/'+s);
  }
  function hasDedicated(value){return Boolean(definitionFor(value));}
  function relativePath(value,asset='portal',context=''){
    const def=definitionFor(value); if(!def) return null;
    const gynae = gynaeVisitContext(value,context);
    if (gynae) {
      if (asset === 'consent-draft' && ['00212','00215'].includes(def.code)) return gynae.route+'consent.html';
      if (asset === 'antiemetic-prescription') return gynaeVisitPath(value,context);
      const file = asset === 'handbook' ? 'handbook.pdf' : asset === 'consent-pdf' ? 'consent-form.pdf' :
        Object.hasOwn(CONTEXT_ASSETS,asset) ? CONTEXT_ASSETS[asset] : null;
      return file === null ? null : gynae.route+file;
    }
    if(def.code==='00588'||def.code==='00746'){
      if(!Object.prototype.hasOwnProperty.call(OLAPARIB_ASSETS,asset))return null;
      if(def.code==='00746')return `patient/00746/${OLAPARIB_ASSETS[asset]}`;
      const selected=contextFor(value,context);
      if(!selected)return `patient/00588/scope.html?asset=${encodeURIComponent(asset)}`;
      return `patient/00588/${OLAPARIB_ROUTES[selected]}${OLAPARIB_ASSETS[asset]}`;
    }
    if(CONTEXT_CODES.includes(def.code)){
      const selected=contextFor(value,context);
      if(!selected || def.code==='00279' && selected==='lung')return scopePath(def.code,asset,value,context);
      if(cervicalVisits[def.code]?.[selected]){
        const phase = cervicalVisits[def.code][selected];
        const file = asset === 'antiemetic-prescription' ? 'antiemetic-'+phase+'.pdf' :
          asset === 'handbook' ? 'handbook.pdf' : asset === 'consent-pdf' ? 'consent-form.pdf' :
          Object.hasOwn(CONTEXT_ASSETS,asset) ? CONTEXT_ASSETS[asset] : null;
        return file === null ? null : 'patient/'+def.code+'/'+selected+'/'+file;
      }
      if(!Object.prototype.hasOwnProperty.call(CONTEXT_ASSETS,asset))return null;
      if(def.code==='00812')return 'patient/00812/'+CONTEXT_ASSETS[asset];
      if(['00228','00205'].includes(def.code))return `patient/${def.code}/${selected==='breast'?'':selected+'/'}${CONTEXT_ASSETS[asset]}`;
      if(GIST_CONTEXT_CODES.includes(def.code))return `patient/${def.code}/${selected==='gist'?'gist/':''}${CONTEXT_ASSETS[asset]}`;
      if(HEAD_NECK46_CODES.includes(def.code)&&selected==='head_neck')return `patient/${def.code}/head_neck/${CONTEXT_ASSETS[asset]}`;
      if(def.code==='00203'&&selected==='prostate')return `patient/${def.code}/prostate/${CONTEXT_ASSETS[asset]}`;
      if(gynaeContext[def.code])return `patient/${def.code}/${CONTEXT_ASSETS[asset]}`;
      if(['00419','00294'].includes(def.code))return `patient/${def.code}/head_neck/${CONTEXT_ASSETS[asset]}`;
      if(def.code==='00385')return `patient/${def.code}/${selected}/${CONTEXT_ASSETS[asset]}`;
      if(def.code==='00207')return `patient/${def.code}/${selected==='head_neck'?'head_neck/':''}${CONTEXT_ASSETS[asset]}`;
      if(def.code==='00535')return `patient/${def.code}/merkel_cell/${CONTEXT_ASSETS[asset]}`;
      if(def.code==='00551')return `patient/${def.code}/${selected==='melanoma'?'melanoma/':''}${CONTEXT_ASSETS[asset]}`;
      if(MELANOMA_CODES.includes(def.code))return `patient/${def.code}/${selected==='lung'?'':selected+'/'}${CONTEXT_ASSETS[asset]}`;
      return `patient/${def.code}/${def.code==='00415'?(selected==='adjuvant'?'adjuvant/':''):def.code==='00320'?'neuroendocrine/':COLORECTAL_CONTEXTS[def.code]?COLORECTAL_CONTEXTS[def.code][selected]:(selected==='lung'?'lung/':'')}${CONTEXT_ASSETS[asset]}`;
    }
    if(def.scopeGuard) return `patient/${def.code}/scope.html?asset=${encodeURIComponent(asset)}`;
    if(asset==='supportive-care-selector') return def.phaseSupport?`patient/${def.code}/supportive-care.html`:null;
    if(asset==='longitudinal') return def.longitudinal?`patient/${def.code}/treatment-journey.html`:null;
    if(asset==='supportive-care') return def.supportiveCare?`patient/${def.code}/supportive-care.pdf`:null;
    if(asset==='knowledge') return def.knowledge?`patient/${def.code}/knowledge.html`:null;
    // Clinic Workflow consent generator now opens the dedicated one-page form.
    // The longer consent discussion adjunct remains available separately as patient/${code}/consent.html.
    if(asset==='consent-draft') return def.consentDraft?`patient/${def.code}/consent-form.html`:null;
    if(asset==='guide') return `patient/${def.code}/guide.pdf`;
    if(asset==='passport') return `patient/${def.code}/passport.pdf`;
    if(asset==='contact-card'&&def.contactCard) return `patient/${def.code}/contact-card.pdf`;
    if(asset==='sact-card'&&def.sactCard) return `patient/${def.code}/sactcard.pdf`;
    return `patient/${def.code}/`;
  }
  function publicUrl(value,asset='portal',context=''){
    const rel=relativePath(value,asset,context); return rel?new URL(rel,PUBLIC_ORIGIN).href:null;
  }
  function runtimeUrl(value,asset='portal',context=''){
    const rel=relativePath(value,asset,context); if(!rel) return null;
    const base=root.location?.href||PUBLIC_ORIGIN;
    try{return new URL(rel,base).href;}catch(_){return new URL(rel,PUBLIC_ORIGIN).href;}
  }
  function compatibilityUrl(value,asset='portal',context=''){
    const def=definitionFor(value); if(!def) return null;
    if(CONTEXT_CODES.includes(def.code)||def.code==='00746')return publicUrl(value,asset,context);
    if(def.scopeGuard) return publicUrl(value,asset,context);
    const suffix=asset==='guide'?'guide.pdf':asset==='passport'?'passport.pdf':asset==='contact-card'&&def.contactCard?'contact-card.pdf':asset==='sact-card'&&def.sactCard?'sactcard.pdf':'';
    return new URL(`docs/patient/${def.code}/${suffix}`,PUBLIC_ORIGIN).href;
  }
  function fallbackUrl(protocol){
    const id=text(protocol?.protocol_id);
    const u=new URL(PUBLIC_ORIGIN);
    if(id) u.searchParams.set('patientSupport',id);
    return u.href;
  }
  function publicPortalUrl(protocol,context=''){return publicUrl(protocol,'portal',context)||fallbackUrl(protocol);}
  function guideUrl(protocol,context=''){return publicUrl(protocol,'guide',context);}
  function passportUrl(protocol,context=''){return publicUrl(protocol,'passport',context);}
  function sactCardUrl(protocol,context=''){return publicUrl(protocol,'sact-card',context);}
  function openTarget(url,target='_blank'){
    if(!url) return null;
    if(typeof root.open!=='function') return {url,opened:false};
    const win=root.open(url,target);
    if(win){try{win.opener=null;}catch(_){} return win;}
    return {url,opened:false,blocked:true};
  }
  function openPortal(protocol,context=''){
    const url=runtimeUrl(protocol,'portal',context);
    if(!url) return false;
    return openTarget(url);
  }
  function openGuide(protocol,context=''){
    const url=runtimeUrl(protocol,'guide',context);
    if(!url) return false;
    return openTarget(url);
  }
  function openPassport(protocol,context=''){
    const url=runtimeUrl(protocol,'passport',context);
    if(!url) return false;
    return openTarget(url);
  }
  function openSactCard(protocol,context=''){
    const url=runtimeUrl(protocol,'sact-card',context);
    if(!url) return false;
    return openTarget(url);
  }

  return Object.freeze({
    release:RELEASE,
    contentRelease:CONTENT_RELEASE,
    publicOrigin:PUBLIC_ORIGIN,
    codes:CODES,
    definitions:DEFINITIONS,
    bundleRoutes,normaliseCode,codeFor,definitionFor,hasDedicated,relativePath,contextFor,gynaeVisitContext,gynaeVisitPath,gynaeAssessmentIndication,cervicalPrescription,cervicalSupportPath,cervicalAssessmentIndication,contextCodes:CONTEXT_CODES,
    publicUrl,runtimeUrl,compatibilityUrl,fallbackUrl,publicPortalUrl,
    guideUrl,passportUrl,sactCardUrl,openPortal,openGuide,openPassport,openSactCard
  });
});
