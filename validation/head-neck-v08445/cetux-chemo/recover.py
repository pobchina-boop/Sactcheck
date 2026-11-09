"""Propose v08445 changes; never mutate live protocols from this audit helper."""
import copy, hashlib, json, pathlib, shutil

B = pathlib.Path(__file__).resolve().parent
R = B.parents[2]
DAY = '2026-11-07'
FILES = {}
for code, tissue in [('00207','gastrointestinal'), ('00328','gastrointestinal'), ('00733','gastrointestinal'), ('00456','lung')]:
    FILES[code] = next((R/'protocols'/tissue).glob(code+'*.json'))
(B/'proposed').mkdir(exist_ok=True)
(B/'baseline').mkdir(exist_ok=True)

def condition(field, operator, value=None):
    row = {'field': field, 'operator': operator}
    if operator != 'missing': row['value'] = value
    return row

def add_input(p, key, label, kind='boolean'):
    if key in p['input_definitions']: return
    v = {'label': label, 'type': kind, 'required': False, 'input_role':'decision', 'demo_value':''}
    if kind == 'select':
        v['options'] = [{'value':i, 'label':str(i)} for i in range(5)]
        v['assessment_guidance'] = 'Record the highest documented grade of the named event under the source/local grading policy. Do not infer recovery or erase a previous severe event.'
        v['grading_source_label']='NCCP named adverse-event table; grading edition not specified'
        v['grading_source_url']=p['metadata']['source_url']
        v['source_grading_note']='The source does not specify a grading edition for this table. Use the documented grade of this event under verified local policy; historical and current grades are separate.'
    p['input_definitions'][key] = v

def add_rule(p, key, when, kind, comps, text, page, source=None):
    rules = p['rule_engine']['rules']
    assert key not in {r['rule_id'] for r in rules}, key
    a = {'type':kind, 'components':comps, 'recommendation':text, 'show_in_dose_actions':True}
    if kind == 'consultant_review': a.update(dose_calculation='specialist_review', dose_calculation_blocked=True)
    s = source or {'document':f'NCCP {p["metadata"]["nccp_regimen_code"]} v{p["metadata"]["nccp_version"]}', 'url':p['metadata']['source_url'], 'page':page, 'checked_date':DAY}
    rules.append({'rule_id':key, 'when':when, 'action':a, 'explanation':text, 'source':s})

def rules(p): return {r['rule_id']:r for r in p['rule_engine']['rules']}

for code, path in FILES.items():
    frozen = B/'baseline'/path.name
    if not frozen.exists(): shutil.copyfile(path,frozen)
    p = json.loads(frozen.read_text()); m=p['metadata']; rr=rules(p)
    retrieval=next(x for x in json.loads((B/'source-retrieval.json').read_text()) if x['code']==code)
    if retrieval.get('status')==200:
        m['source_pdf_sha256']=retrieval['sha256'];m['source_checked_date']=DAY
        m['validation']['source_document_checked']=True;m['validation']['audit_date']=DAY
    m['sactcheck_encoding_version']='0.84.45'; m['clinical_audit_release']='0.84.45'
    m['validation']['audit_release']='0.84.45'
    m['validation']['software_validation_record']='validation/head-neck-v08445/cetux-chemo/proposed-results.json'
    # Current binary retrieval is recorded separately, never fabricated from a cached PDF.
    m['validation']['v08445_source_revalidation_record']='validation/head-neck-v08445/cetux-chemo/source-retrieval.json'
    for owner in [m['validation'],m.get('encoding_maturity',{}),p['clinical_governance']]:
        for flag in ['consultant_reviewed','oncology_pharmacy_reviewed','clinical_use_authorised']: owner[flag]=False
    if code in ['00207','00328','00733']:
        add_input(p,'previous_severe_cetuximab_infusion_reaction','Previous grade 3 or 4 cetuximab infusion reaction, even if now recovered')
        add_rule(p,'CETUXIMAB_PRIOR_SEVERE_REACTION',condition('previous_severe_cetuximab_infusion_reaction','==',True),'permanently_discontinue',['cetuximab'],'A previous grade 3 or 4 cetuximab infusion reaction contraindicates further cetuximab. Recovery of the current symptoms does not permit rechallenge.',3 if code=='00207' else 5)
        obs='Observation source conflict: NCCP permits stopping the post-infusion observation/vital-sign schedule after two tolerated doses, whereas current Erbitux SmPC section 4.2 requires close monitoring during and for at least one hour after each infusion. The clinical team must reconcile this and prescribe the local observation plan; do not promise earlier discharge.'
        p['monitoring'].append(obs)
        m['monitoring_source_conflict']={'status':'requires_local_consultant_pharmacy_reconciliation','nccp_page':1,'product_information_url':'https://www.ema.europa.eu/en/documents/product-information/erbitux-epar-product-information_en.pdf','product_information_section':'4.2','checked_date':DAY,'note':obs}
    if code=='00207':
        # Existing canonical ID is a stable application key, distinct from verified source version.
        m['current_source_id']='nccp-00207-v6'
        m['source_identity_note']='NCCP source version 6; legacy protocol_id remains stable for existing application mappings. CRC and head/neck are separate indication contexts.'
        p['treatment_phases'][0]['administration'][0]['notes'] += ' Observation requirements differ from the current SmPC: confirm the local observation plan.'
        p['treatment_phases'][1]['administration'][0]['notes'] += ' Current SmPC instead requires at least one hour after every infusion; reconcile with the local team.'
    if code in ['00328','00733']:
        # Folinic acid is not an independent anticancer substitute when bolus 5-FU is held/omitted.
        for r in p['rule_engine']['rules']:
            a=r['action']; comps=a.get('components',[])
            needs_link=('fluorouracil_bolus' in comps and a['type'] in ['withhold','contraindicated','discontinue','permanently_discontinue','omit'])
            needs_link |= r['rule_id'] in ['FU_HEPATIC_EQUALITY','FU_HEPATIC_REDUCTION']
            if needs_link:
                if 'folinic_acid' not in comps: comps.append('folinic_acid')
                text=' Folinic acid follows the bolus 5-FU hold/omission decision; it is not continued independently. Review-only findings do not invent a separate folinic acid dose reduction.'
                a['recommendation']+=text; r['explanation']=a['recommendation']
                r.setdefault('related_sources',[]).append({'document':f'NCCP {code} v{m["nccp_version"]}','page':3,'url':m['source_url'],'note':'Folinic acid delayed or omitted when bolus 5-fluorouracil is delayed or omitted.'})
        p['input_definitions']['fluorouracil_ast_u_l']['assessment_guidance']='Source Table 3 labels the analyte AST but does not print its unit beside 180. This field is an absolute AST result in U/L, not a multiple of ULN. Confirm local source interpretation; do not substitute ALT or a ULN ratio.'
        p['dose_modifications'].append('AST threshold is the source absolute-result entry, not an ALT result or ULN multiple; unit interpretation and equality at bilirubin 85/AST 180 require consultant/pharmacy review. Folinic acid follows bolus 5-FU hold/omission.')
        add_input(p,'fluorouracil_transaminase_source_uncertain','AST unit/analyte does not clearly match the source table, or only ALT/ULN ratio is available')
        add_rule(p,'FU_TRANSAMINASE_SOURCE_LABEL_REVIEW',condition('fluorouracil_transaminase_source_uncertain','==',True),'consultant_review',['fluorouracil_bolus','fluorouracil_infusion','folinic_acid'],'Confirm the source AST analyte and absolute-result unit with oncology pharmacy. Do not enter ALT or an ULN ratio as AST 180; no automatic dose is established.',4)
    if code=='00328':
        add_input(p,'concurrent_brivudin_sorivudin_or_analogue','Current or recent brivudin, sorivudin or analogous DPD inhibitor; safe washout not confirmed')
        add_rule(p,'FU_DPD_INHIBITOR_CONTRAINDICATION',condition('concurrent_brivudin_sorivudin_or_analogue','==',True),'contraindicated',['fluorouracil_bolus','fluorouracil_infusion','folinic_acid'],'Do not administer 5-FU with brivudin, sorivudin or analogous potent DPD inhibitors. Oncology pharmacy must reconcile current/recent exposure and the medicine-specific washout before treatment. Folinic acid is omitted with bolus 5-FU.',9)
        add_input(p,'ugt1a1_poor_metaboliser','Known UGT1A1 poor metaboliser, including homozygous *6 or *28, or another confirmed reduced-activity genotype')
        rr['UGT_REVIEW']['when']={'any':[condition('ugt1a1_homozygous_28','==',True),condition('ugt1a1_poor_metaboliser','==',True)]}
        rr['UGT_REVIEW']['action']['recommendation']='UGT1A1 poor metabolisers, including homozygous *28 or *6, have increased irinotecan neutropenia/diarrhoea risk. Consider an individually reduced starting dose and enhanced monitoring; this regimen does not establish a fixed reduction percentage.'
        rr['UGT_REVIEW']['explanation']=rr['UGT_REVIEW']['action']['recommendation']
        rr['UGT_REVIEW']['source']={'document':'Irinotecan Hydrochloride SmPC (supplementary manufacturer source)','section':'4.4 and 5.2','url':'https://www.medicines.org.uk/emc/product/102441/smpc','checked_date':DAY}
        rr['FU_CARDIAC']['source']['page']=8
    if code=='00733':
        p['monitoring'].extend(['Baseline: FBC, liver and renal profile; ECG if compromised cardiac function; DPD phenotype/genotype before the first 5-FU unless previously tested. Review red-meat/tick/antibody infusion-reaction history.','Before each cycle: FBC, liver and renal profile. Evaluate peripheral neuropathy every two cycles and promptly if symptoms arise. Weekly FBC is required during count-related delays.','After the last cetuximab: monthly electrolytes, magnesium and calcium for two months. Disease monitoring follows the individual consultant plan; do not invent a universal scan/tumour-marker interval.','Moderate/severe renal impairment can distort uracil-based DPD phenotyping; consider genotype testing with specialist interpretation.'])
        add_input(p,'neuropathy_highest_grade','Highest previous oxaliplatin neuropathy grade, including a recovered episode','select')
        add_rule(p,'NEUROPATHY_PRIOR_G4_STOP',condition('neuropathy_highest_grade','==',4),'permanently_discontinue',['oxaliplatin'],'Previous grade 4 oxaliplatin neuropathy excludes the source rechallenge pathway, even if current symptoms have recovered. Do not restart oxaliplatin automatically.',5)
        add_rule(p,'NEUROPATHY_G3_RECOVERY_REVIEW',{'all':[condition('neuropathy_highest_grade','==',3),condition('neuropathy_grade','<=',2)]},'consultant_review',['oxaliplatin'],'After good recovery from grade 3 (not grade 4) neuropathy, the consultant may consider rechallenge one dose level below the dose at onset. Confirm the actual dose at onset, recovery and previous reductions; no automatic restart or re-escalation.',5)
        add_rule(p,'NEUROPATHY_HISTORY_CONTEXT',{'all':[condition('neuropathy_highest_grade','==',3),condition('neuropathy_grade','missing')]},'consultant_review',['oxaliplatin'],'A previous grade 3 neuropathy episode requires a current recovery assessment and the dose level at onset before a consultant considers rechallenge. Missing current grade does not establish recovery.',5)
        add_rule(p,'NEUROPATHY_CURRENT_G4_STOP',condition('neuropathy_grade','==',4),'permanently_discontinue',['oxaliplatin'],'Grade 4 oxaliplatin neuropathy requires discontinuation and is excluded from the source rechallenge pathway. Record the historical grade even after recovery.',5)
        rr['NEUROPATHY_STOP']['action']['recommendation']='Discontinue oxaliplatin for persistent grade 3 or grade 4 neuropathy. Grade 4 must not be rechallenged; recovered grade 3 requires a separate documented consultant decision.'
        rr['NEUROPATHY_STOP']['explanation']=rr['NEUROPATHY_STOP']['action']['recommendation']
    if code=='00456':
        add_input(p,'other_nonhaem_highest_grade','Highest grade of this treatment-related non-haematological toxicity, excluding mucositis/alopecia','select')
        add_input(p,'neuropathy_highest_grade','Highest treatment-emergent peripheral neuropathy grade, even if recovered','select')
        add_rule(p,'NONHAEM_G3_RECOVERY_HOLD',{'all':[condition('other_nonhaem_highest_grade','==',3),condition('other_nonhaem_toxicity_grade','>',1),condition('other_nonhaem_toxicity_grade','<',3)]},'withhold',['cisplatin','etoposide'],'After grade 3 toxicity other than mucositis/alopecia, continue withholding until recovery to grade 1 or less; grade 2 is not sufficient recovery.',3)
        add_rule(p,'NONHAEM_G3_RECOVERED_REVIEW',{'all':[condition('other_nonhaem_highest_grade','==',3),condition('other_nonhaem_toxicity_grade','<=',1)]},'consultant_review',['cisplatin','etoposide'],'After documented grade 3 toxicity has recovered to grade 1 or less, the source proposes 75% cisplatin and etoposide. Confirm the prescribed denominator, previous reductions and independent restrictions before restart; do not automatically restore full doses.',3)
        add_rule(p,'NONHAEM_HISTORY_CONTEXT',{'all':[condition('other_nonhaem_highest_grade','>=',3),condition('other_nonhaem_toxicity_grade','missing')]},'consultant_review',['cisplatin','etoposide'],'Prior severe toxicity is recorded but current recovery is not assessed. Obtain the current grade and consultant restart plan; missing information is not recovery.',3)
        add_rule(p,'NONHAEM_PRIOR_G4_REVIEW',condition('other_nonhaem_highest_grade','==',4),'consultant_review',['cisplatin','etoposide'],'Previous grade 4 non-haematological toxicity is outside the source grade 3 restart row. Confirm specialist recovery/rechallenge advice; do not extrapolate a 75% restart.',3)
        add_rule(p,'CIS_NEURO_RECOVERED_REVIEW',{'all':[condition('neuropathy_highest_grade','>=',2),condition('neuropathy_grade','<=',1)]},'consultant_review',['cisplatin'],'After grade 2 or worse neuropathy recovers to grade 1 or less, the source gives a consultant choice of carboplatin AUC5 substitution or 50% cisplatin. Confirm actual previous dose and other restrictions. Do not substitute the separate AUC3 regimen or restore full-dose cisplatin automatically.',3)
        add_rule(p,'CIS_NEURO_HISTORY_CONTEXT',{'all':[condition('neuropathy_highest_grade','>=',2),condition('neuropathy_grade','missing')]},'consultant_review',['cisplatin'],'Assess current neuropathy recovery and the prescribed restart/substitution plan before further cisplatin; missing current grade cannot establish recovery.',3)
        rr['COUNTS_SOURCE_GAP']['when']={'any':[{'all':[condition('anc_x10e9_l','>',1.49),condition('anc_x10e9_l','<',1.5)]},{'all':[condition('platelets_x10e9_l','>',99),condition('platelets_x10e9_l','<',100)]}]}
        rr['COUNTS_SOURCE_GAP']['action']['recommendation']='The rendered NCCP Table 1 full-dose row is ANC ≥1.5 AND platelets ≥100. Decimal intervals above 1.49 but below 1.5, or above 99 but below 100, remain unassigned: do not round. Exact 1.5 and 100 are not source gaps; all independent clinical restrictions still apply.'
        rr['COUNTS_SOURCE_GAP']['action']['message']=rr['COUNTS_SOURCE_GAP']['action']['recommendation']
        rr['COUNTS_SOURCE_GAP']['explanation']=rr['COUNTS_SOURCE_GAP']['action']['recommendation']
        rr['COUNTS_SOURCE_GAP']['source']['checked_date']=DAY
        rr['COUNTS_SOURCE_GAP']['source']['visual_verification']='00456-page3.png: the source draws underlines separately; PDF extracted text incorrectly appears as strict >.'
    (B/'proposed'/path.name).write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')

(B/'proposal-manifest.json').write_text(json.dumps({'release':'0.84.45','date':DAY,'files':[{'code':c,'target':str(p.relative_to(R)),'candidate':str((B/'proposed'/p.name).relative_to(R)),'baseline_sha256':hashlib.sha256((B/'baseline'/p.name).read_bytes()).hexdigest()} for c,p in FILES.items()]},indent=2)+'\n')
print('Wrote four candidates without changing live protocol files.')
