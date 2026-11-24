#!/usr/bin/env python3
"""Targeted eribulin review draft; preserve the shared breast/liposarcoma base.

Writes only this external draft folder. Current NCCP source is complete extracted
text; PDF binary and actual table pixels are unavailable. Footer 8/change-log 9 is
an explicit unresolved source discrepancy, not a silent version migration.
"""
from pathlib import Path
import copy,hashlib,json
BASE=Path(__file__).resolve().parent
REPO=BASE.parent/'Sactcheck'
REL='protocols/breast/00228-eribulin-monotherapy.json'
SRC=BASE.parent/'sarcoma-batch3-sources-20261118/00228-web.txt'
DATE='2026-11-18'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def c(f,o,v=None):return dict(field=f,operator=o,**({} if v is None else {'value':v}))
def allof(*v):return {'all':list(v)}
def anyof(*v):return {'any':list(v)}
def unresolved(f):return anyof(c(f,'missing'),c(f,'==',False))
def boolean(label):return dict(type='boolean',label=label,required=False,input_role='decision',demo_value=False)
def number(label,unit='',demo=0):return dict(type='number',label=label,required=False,input_role='decision',min=0,step=.01,unit=unit,demo_value=demo)
def select(label,items):return dict(type='select',label=label,required=False,input_role='decision',options=[dict(value=v,label=l) for v,l in items],demo_value=items[0][0])

def author():
    path=REPO/REL;p=json.loads(path.read_text());original=copy.deepcopy(p)
    inputs=p['input_definitions'];rules=p['rule_engine']['rules'];url=p['metadata']['source_url']
    inputs.update({
      'indication_id':select('Official NCCP indication',[('00228a','Advanced breast cancer'),('00228b','Adult unresectable liposarcoma'),('other','Other: separate source review')]),
      'liposarcoma_eligibility_confirmed':boolean('Adult unresectable liposarcoma and prior anthracycline therapy unless unsuitable confirmed'),
      'additional_trastuzumab':boolean('Trastuzumab is also proposed or prescribed'),
      'dose_basis':select('Prescription dose convention',[('base','Eribulin base (EU convention)'),('mesilate','Eribulin mesilate salt'),('unknown','Uncertain')]),
      'planned_eribulin_base_dose_mg_m2':number('Proposed eribulin BASE dose','mg/m²',1.23),
      'dose_reescalation_requested':boolean('An increase after a previous dose reduction is proposed'),
      'restart_requested':boolean('Restart after a toxicity interruption is being considered'),
      'current_delay_criteria_resolved':boolean('Current counts and all relevant toxicities no longer meet the source delay criteria'),
      'consultant_restart_plan_confirmed':boolean('Consultant/pharmacy have confirmed recovery, event sequence, actual dose and restart plan'),
      'prior_anc_nadir_x10e9_l':number('Lowest ANC during the previous eribulin treatment interval','×10⁹/L',2),
      'days_prior_anc_below_05':number('Duration of previous eribulin-associated ANC below 0.5','days'),
      'prior_neutropenic_fever_or_infection':boolean('Fever or infection accompanied the previous neutropenic event'),
      'prior_platelet_nadir_x10e9_l':number('Lowest platelet count during the previous eribulin treatment interval','×10⁹/L',150),
      'prior_platelet_bleeding_or_transfusion':boolean('Previous thrombocytopenia was complicated by bleeding or blood/platelet transfusion'),
      'severe_blistering_or_peeling_rash':boolean('Severe blistering/peeling rash or mucosal injury suggesting SJS/TEN'),
    })
    def rule(id,condition,type,text,page,section,precaution=False,source_url=None):
        rules.append(dict(rule_id=id,when=condition,action=dict(type=type,components=['eribulin'],message=text,dose_calculation='specialist_review',block_numeric_dose=True,show_in_dose_actions=True),explanation=text,source=dict(document='NCCP 00228 current source: footer 8/change-log 9' if source_url is None else 'EMA eribulin safety information',url=source_url or url,page=page,section=section,checked_date=DATE,evidence_kind='current_official_extracted_text_or_primary_indexed_excerpt',**({'interpretation_note':'Conservative review safeguard; no source-specific dose or permanent-stop threshold is invented.'} if precaution else {}))))
    numeric_events=[
      allof(c('prior_anc_nadir_x10e9_l','<',.5),c('days_prior_anc_below_05','>',7)),
      allof(c('prior_anc_nadir_x10e9_l','<',1),c('prior_neutropenic_fever_or_infection','==',True)),
      c('prior_platelet_nadir_x10e9_l','<',25),
      allof(c('prior_platelet_nadir_x10e9_l','<',50),c('prior_platelet_bleeding_or_transfusion','==',True)),
    ]
    history_fields={'prolonged_anc_below_0_5_over_7d','febrile_neutropenia','platelets_below_25_previous_cycle','platelets_below_50_with_bleeding_or_transfusion','previous_grade_3_4_nonhaem'}
    expanded=[]
    def expand(node):
        if not isinstance(node,dict):return
        if isinstance(node.get('any'),list) and {v.get('field') for v in node['any'] if isinstance(v,dict)}==history_fields and len(node['any'])==5:
            node['any'].extend(copy.deepcopy(numeric_events));return True
        for key in ['all','any']:
            for child in node.get(key,[]):
                if expand(child):return True
        return False
    for row in rules:
        if expand(row.get('when',row)):expanded.append(row.get('id',row.get('rule_id')))
        if row['source'].get('url')==url:
            row['source'].update(checked_date=DATE,evidence_kind='current_official_web_pdf_extracted_text',source_version_note='Footer 8; change-log 9 records a 20 May 2026 review-schedule amendment.')
        if row.get('id')=='ERI00228_CHILD_PUGH_C':
            row['action'].update(type='withhold',block_numeric_dose=True,dose_calculation='specialist_review',show_in_dose_actions=True)
        if row.get('id') in ['ERI00228_TRIGGER_AT_1_23','ERI00228_RECURRENCE_0_97']:
            # Retain the exact source dose reference for compatibility/history,
            # but do not label a future dose as currently usable from two inputs.
            row['action'].update(type='consultant_review',block_numeric_dose=True,dose_calculation='specialist_review',show_in_dose_actions=True)
    rule('ERI00228_LIPOSARCOMA_CONTEXT',allof(c('indication_id','==','00228b'),unresolved('liposarcoma_eligibility_confirmed')),'consultant_review','Confirm adult unresectable liposarcoma and prior anthracycline-containing therapy unless unsuitable. This indication is not general soft-tissue sarcoma or leiomyosarcoma.',1,'Indication 00228b')
    rule('ERI00228_NONSTANDARD_DOSE',c('current_eribulin_dose_level','==','other'),'consultant_review','Establish the actual nonstandard eribulin base dose, reason for that dose and prior reductions before prescribing. A source reference dose must not replace an unknown current prescription or cause re-escalation.',3,'Dose levels and no re-escalation',True)
    rule('ERI00228_OTHER_INDICATION',c('indication_id','==','other'),'consultant_review','Other indications require separate evidence and specialist review; preserve the breast and liposarcoma contexts.',1,'Indications')
    rule('ERI00228_TRASTUZUMAB_CONTEXT',allof(c('indication_id','==','00228b'),c('additional_trastuzumab','==',True)),'consultant_review','The NCCP trastuzumab footnote is specific to breast cancer. Do not add trastuzumab as a routine liposarcoma partner; obtain a separate indication-specific plan.',1,'Treatment footnote a')
    rule('ERI00228_DOSE_BASIS_REVIEW',anyof(c('dose_basis','==','mesilate'),c('dose_basis','==','unknown')),'withhold','Confirm the formulation and prescription convention before administration. EU dosing is 1.23 mg/m² eribulin BASE; 1.4 mg/m² mesilate is the salt-equivalent literature dose, not an increased base dose. No automatic conversion is made.',1,'Treatment footnotes b/c')
    rule('ERI00228_BASE_DOSE_ABOVE_REFERENCE',c('planned_eribulin_base_dose_mg_m2','>',1.23),'withhold','The proposed eribulin base dose exceeds this source’s 1.23 mg/m² reference. Check for salt/base confusion and reconcile the prescription.',1,'Treatment table',True)
    rule('ERI00228_NO_REESCALATION',anyof(c('dose_reescalation_requested','==',True),allof(c('current_eribulin_dose_level','==','0.97'),c('planned_eribulin_base_dose_mg_m2','>',.97)),allof(c('current_eribulin_dose_level','==','0.62'),c('planned_eribulin_base_dose_mg_m2','>',.62))),'withhold','Do not re-escalate eribulin after a dose reduction; review the proposed prescription.',3,'Tables 1 and 3')
    rule('ERI00228_RESTART_NOT_CONFIRMED',allof(c('restart_requested','==',True),anyof(unresolved('current_delay_criteria_resolved'),unresolved('consultant_restart_plan_confirmed'))),'withhold','Restart requires resolution of the source’s current delay criteria and reconciliation of prior toxicity, dose level and recurrence. Missing confirmation is not documented recovery. Do not import another regimen’s grade≤1 rule or a US Day 15 catch-up schedule.',2,'Current day 1/day 8 delay criteria and p3 dose levels',True)
    rule('ERI00228_PRIOR_EVENT_DETAILS',anyof(allof(c('prior_anc_nadir_x10e9_l','<',1),c('prior_neutropenic_fever_or_infection','missing')),allof(c('prior_neutropenic_fever_or_infection','==',True),c('prior_anc_nadir_x10e9_l','missing')),allof(c('days_prior_anc_below_05','>',7),c('prior_anc_nadir_x10e9_l','missing')),allof(c('prior_anc_nadir_x10e9_l','<',.5),c('days_prior_anc_below_05','missing'),unresolved('prior_neutropenic_fever_or_infection')),allof(c('prior_platelet_bleeding_or_transfusion','==',True),c('prior_platelet_nadir_x10e9_l','missing')),allof(c('prior_platelet_nadir_x10e9_l','>=',25),c('prior_platelet_nadir_x10e9_l','<',50),c('prior_platelet_bleeding_or_transfusion','missing'))),'consultant_review','Confirm the paired prior-count, duration and complication details before classifying the historical event. Current counts cannot substitute for a previous nadir.',3,'Table 1')
    discordant=anyof(allof(c('eribulin_renal_band','==','gt50'),c('creatinine_clearance_ml_min','<=',50)),allof(c('eribulin_renal_band','==','lt50'),c('creatinine_clearance_ml_min','>=',50)),allof(c('eribulin_renal_band','==','eq50'),c('creatinine_clearance_ml_min','!=',50)),allof(c('eribulin_renal_band','==','ge50'),c('creatinine_clearance_ml_min','<',50)))
    rule('ERI00228_RENAL_INPUT_CONFLICT',discordant,'consultant_review','The selected renal band disagrees with the numerical CrCl. Reconcile the actual result, dialysis status and source boundary; neither entry automatically clears the other.',3,'Table 2',True)
    rule('ERI00228_SCAR_URGENT_REVIEW',c('severe_blistering_or_peeling_rash','==',True),'withhold','Severe blistering/peeling rash or mucosal injury may represent SJS/TEN: withhold and obtain urgent clinical assessment. Do not treat this as routine low-grade rash or infer a routine rechallenge plan.',4,'SmPC adverse-effects referral; EMA safety signal',True,'https://www.ema.europa.eu/en/documents/scientific-conclusion/halaven-h-c-psusa-00001254-201511-epar-scientific-conclusions-and-grounds-variation-terms-marketing-authorisation_en.pdf')
    m=p['metadata']
    if m.get('source_pdf_sha256'):
        m['historical_source_pdf_provenance']={'sha256':m['source_pdf_sha256'],'checked_date':m.get('source_checked_date'),'qualification':'Retained prior audit hash; not a newly retrieved current PDF binary.'}
    m['source_pdf_sha256']=None
    m['source_checked_date']=DATE
    m['source_version_discrepancy']={'footer_version':'8','footer_last_reviewed':'2021-04-28','change_log_version':'9','change_log_date':'2026-05-20','change_log_scope':'Amendment to review schedule','clinical_content_version8_change_log_date':'2024-06-26','current_identity_retained':'nccp-00228-v8','resolution':'Retain footer-based identity while explicitly recording latest change-log entry; request source-owner clarification before a version 9 ID migration.'}
    m['batch3_draft_review']={'status':'external_draft_not_applied','target_release':'0.84.62','checked_date':DATE,'source_text_sha256':sha(SRC),'original_current_pdf_binary_retrieved':False,'visual_table_layout_verified':False,'independent_clinical_approval':False,'independent_pharmacy_approval':False,'preserved_shared_contexts':['00228a breast','00228b liposarcoma'],'source_scope':'Complete current NCCP extracted text and selected current EMA/manufacturer indexed content; historical supplementary rules retained with their original provenance where not freshly reverified.'}
    p['supportive_care']['additional_supportive_care']=['G-CSF may be used to manage severe neutropenia according to the individual plan; it is not mandated for every patient.','Do not drive or use machinery when tired or dizzy.','Low emetogenic risk; follow the prescribed antiemetic plan. No usual separate regimen premedication.']
    out=BASE/'application-draft'/REL;out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
    manifest={'checked_date':DATE,'mode':'external_draft_only_no_app_writes','base_path':REL,'base_sha256':sha(path),'draft_path':str(out.relative_to(BASE)),'draft_sha256':sha(out),'source_text_sha256':sha(SRC),'input_count':len(inputs),'rule_count':len(rules),'existing_history_rules_extended':expanded,'preserved':{'indications':p['indications']==original['indications'],'treatment_phases':p['treatment_phases']==original['treatment_phases'],'dose_levels':p['dose_levels']==original['dose_levels']},'version_plan':{'from':'nccp-00228-v8','to':'nccp-00228-v8','automatic_alias_created':False,'reason':'Current footer 8/change-log 9 discrepancy unchanged; no unsupported definitive version 9 claim.','if_source_owner_confirms_version9':['Migrate canonical ID/version to 9 explicitly','Alias prior nccp-00228-v8 routes and references to new canonical ID','Update protocol index, clinical register, card/context metadata and route/QR regression fixtures together','Keep breast and liposarcoma indication IDs 00228a/b stable']},'clinical_approval':False}
    (BASE/'eribulin-draft-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');print(json.dumps(manifest,indent=2))
if __name__=='__main__':author()
