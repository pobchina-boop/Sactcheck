/**
 * SACTCheck v0.70.1 source-fidelity hotfix.
 *
 * Focused runtime reconciliation for:
 *  - NCCP 00382 Trifluridine/tipiracil (Lonsurf) v4
 *  - NCCP 00525 Ribociclib metastatic v6
 *  - NCCP 00892 Ribociclib adjuvant v2
 *
 * Also adds a resilient NCCP catalogue fallback for the affected oral regimens
 * and prevents an incomplete Change Tracker baseline from being presented as
 * "0 updates".
 *
 * Current NCCP sources remain authoritative. Independent Consultant Oncology
 * and oncology-pharmacy validation remain pending.
 */
(function(root,factory){
  const api=factory(root);
  if(typeof module==="object"&&module.exports) module.exports=api;
  root.SACTCheckV0701SourceReconciliation=api;
  if(root&&root.document) api.install();
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const RELEASE="0.70.1";
  const SOURCE_CHECKED_DATE="2026-09-06";

  const SOURCES=Object.freeze({
    "00382":{
      pdf:"https://healthservice.hse.ie/documents/6348/trifluridine_and_tipiracil_Lonsurf_therapy_382.pdf",
      catalogue:"https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/oral-anti-cancer-medicines-sact-regimens/",
      version:4
    },
    "00525":{
      pdf:"https://healthservice.hse.ie/documents/6629/525_v6_Ribociclib_Metastatic_hghzyyD.pdf",
      catalogue:"https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/breast-sact-regimens-locally-advanced-metastatic/",
      version:6
    },
    "00892":{
      pdf:"https://healthservice.hse.ie/documents/6649/892_Ribociclib_Adjuvant.pdf",
      catalogue:"https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/breast-sact-regimens/",
      version:2
    },
    "00619":{
      pdf:"https://healthservice.hse.ie/documents/6415/619_Abemaciclib.pdf",
      catalogue:"https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/breast-sact-regimens/",
      version:"4a"
    }
  });

  function asArray(value){ return Array.isArray(value)?value:[]; }
  function codeOf(protocol){ return String(protocol?.metadata?.nccp_regimen_code||"").padStart(5,"0"); }
  function ruleId(rule){ return String(rule?.id||rule?.rule_id||""); }

  function source(page,table){
    const item={document:"Current NCCP National SACT Regimen",page};
    if(table) item.table=table;
    return item;
  }
  function action(type,components,recommendation){
    return {type,components,message:recommendation,recommendation};
  }
  function upsertDefinition(protocol,id,definition){
    protocol.input_definitions=protocol.input_definitions||{};
    protocol.input_definitions[id]={...(protocol.input_definitions[id]||{}),...definition};
  }
  function removeRules(protocol,ids){
    const remove=new Set(ids);
    protocol.rule_engine=protocol.rule_engine||{};
    protocol.rule_engine.rules=asArray(protocol.rule_engine.rules).filter(rule=>!remove.has(ruleId(rule)));
  }
  function addRules(protocol,rules){
    protocol.rule_engine=protocol.rule_engine||{};
    const incoming=new Set(rules.map(ruleId));
    protocol.rule_engine.rules=[
      ...asArray(protocol.rule_engine.rules).filter(rule=>!incoming.has(ruleId(rule))),
      ...rules
    ];
  }
  function hideDefinition(protocol,id){
    if(!protocol.input_definitions?.[id]) return;
    protocol.input_definitions[id].visible=false;
    protocol.input_definitions[id].input_role="context";
  }
  function markSourceReconciled(protocol,note){
    protocol.metadata=protocol.metadata||{};
    protocol.metadata.validation=protocol.metadata.validation||{};
    Object.assign(protocol.metadata.validation,{
      source_document_checked:true,
      software_tests_completed:true,
      consultant_reviewed:false,
      oncology_pharmacy_reviewed:false,
      clinical_use_authorised:false,
      official_catalogue_and_source_link_checked:true,
      rule_level_source_reconciliation_status:"source_reconciled_pending_independent_clinical_and_oncology_pharmacy_validation"
    });
    protocol.metadata.source_checked_date=SOURCE_CHECKED_DATE;
    protocol.metadata.encoding_maturity={
      ...(protocol.metadata.encoding_maturity||{}),
      level:"source_reconciled_rule_encoding",
      label:"Source reconciled rule encoding · independent clinical and oncology pharmacy review pending",
      source_reconciled:true,
      consultant_reviewed:false,
      oncology_pharmacy_reviewed:false,
      clinical_use_authorised:false,
      reconciled_release:RELEASE,
      reconciled_date:SOURCE_CHECKED_DATE,
      scope_note:note
    };
  }
  function addSourceFallback(protocol){
    const code=codeOf(protocol);
    const mapped=SOURCES[code];
    if(!mapped) return;
    protocol.metadata=protocol.metadata||{};
    protocol.metadata.source_url=mapped.pdf;
    protocol.metadata.source_catalogue_url=mapped.catalogue;
    protocol.metadata.source_link_fallback_note="If the direct HSE PDF is temporarily unavailable or moved, use the NCCP regimen catalogue link and locate the regimen by NCCP code.";
  }
  function tableBandField(label){
    return {
      label,
      type:"select",
      required:false,
      input_role:"context",
      demo_value:0,
      source_grading_standard:"CTCAE v4.03 as cited by the current NCCP ribociclib regimen",
      assessment_guidance:"Use the current NCCP ribociclib table. This field records the source table band and is not regraded using the separate SACTCheck CTCAE v5 education layer.",
      options:[
        {value:0,label:"Baseline normal / ≤ ULN"},
        {value:1,label:"Grade 1 · >ULN to 3 × ULN"},
        {value:2,label:"Grade 2 · >3 to 5 × ULN"},
        {value:3,label:"Grade 3 · >5 to 20 × ULN"},
        {value:4,label:"Grade 4 · >20 × ULN"}
      ]
    };
  }
  function severityField(label,labels){
    return {
      label,
      type:"select",
      required:false,
      input_role:"decision",
      demo_value:0,
      source_grading_standard:"CTCAE v4.03 as cited by the current NCCP ribociclib regimen",
      assessment_guidance:"Select the source-defined severity after clinical assessment. This is kept separate from the SACTCheck CTCAE v5 educational layer.",
      options:labels.map((text,value)=>({value,label:text}))
    };
  }

  function reconcileLonsurf(protocol){
    addSourceFallback(protocol);
    protocol.metadata.nccp_version=4;
    protocol.metadata.canonical_protocol_id="nccp-00382-v4";
    protocol.metadata.legacy_protocol_id_alias=protocol.protocol_id||"nccp-00382-v3";
    protocol.metadata.last_reviewed_date="2026-07-01";
    protocol.metadata.review_date="2026-07-01";
    protocol.metadata.review_schedule="As required";
    protocol.metadata.source_document_pages=6;

    markSourceReconciled(protocol,
      "Reconciled against NCCP 00382 Version 4 (last reviewed 01/07/2026). Within-cycle interruption thresholds are separated from mandatory next-cycle resumption thresholds; the >1 week count-related delay reduction criterion and current renal/hepatic pathways are encoded."
    );

    upsertDefinition(protocol,"assessment_context",{
      label:"Lonsurf assessment context",
      type:"select",
      required:false,
      input_role:"context",
      always_show:true,
      demo_value:"start_next_cycle",
      options:[
        {value:"during_cycle",label:"During an active cycle · interruption criteria"},
        {value:"start_next_cycle",label:"Start of next cycle · resumption criteria"}
      ],
      assessment_guidance:"NCCP v4 uses different count thresholds during an active cycle and at the start of the next cycle. Select the clinical context before interpreting ANC or platelets."
    });
    upsertDefinition(protocol,"next_cycle_delay_days",{
      label:"Delay in starting next cycle due to counts",
      type:"number",
      required:false,
      min:0,
      max:365,
      step:1,
      unit:"days",
      demo_value:0,
      input_role:"context",
      visible_when:{field:"assessment_context",operator:"==",value:"start_next_cycle"},
      assessment_guidance:"The NCCP dose-reduction trigger requires more than one week's delay (>7 days), not simply a low count."
    });
    upsertDefinition(protocol,"ecog_status",{
      label:"ECOG performance status",
      type:"select",
      required:false,
      demo_value:0,
      input_role:"decision",
      options:[0,1,2,3,4].map(value=>({value,label:String(value)}))
    });

    removeRules(protocol,[
      "ANC_INTERRUPT","PLT_INTERRUPT","ANC_NEXT_CYCLE","PLT_NEXT_CYCLE",
      "SEVERE_TOX_REDUCE","RENAL_15_29","RENAL_LT15","HEPATIC_MOD_SEV","PROCEED",
      "LONSURF_ANC_INTERRUPT","LONSURF_PLT_INTERRUPT","LONSURF_NEXT_CYCLE_ANC",
      "LONSURF_NEXT_CYCLE_PLT","LONSURF_FN_REDUCE","LONSURF_DELAY_REDUCE_ANC",
      "LONSURF_DELAY_REDUCE_PLT","LONSURF_NONHAEM_REDUCE","LONSURF_RENAL_LT30",
      "LONSURF_DIALYSIS","LONSURF_HEPATIC_MOD_SEV","LONSURF_ECOG","LONSURF_NEXT_CYCLE_PROCEED"
    ]);

    addRules(protocol,[
      {
        rule_id:"LONSURF_ECOG",
        when:{field:"ecog_status",operator:">",value:1},
        action:action("consultant_review",["whole_regimen"],"NCCP 00382 v4 lists ECOG 0–1 as an eligibility criterion. Review suitability before treatment."),
        source:source(2),explanation:"ECOG 0–1 is the source eligibility range."
      },
      {
        rule_id:"LONSURF_ANC_INTERRUPT",
        when:{all:[
          {field:"assessment_context",operator:"==",value:"during_cycle"},
          {field:"anc_x10e9_l",operator:"<",value:0.5}
        ]},
        action:action("withhold",["lonsurf"],"Interrupt Lonsurf dosing. Do not make up missed doses. The next cycle must not start until ANC is ≥1.5 ×10⁹/L."),
        source:source(2,"Table 2"),explanation:"Within-cycle ANC interruption threshold is <0.5 ×10⁹/L."
      },
      {
        rule_id:"LONSURF_PLT_INTERRUPT",
        when:{all:[
          {field:"assessment_context",operator:"==",value:"during_cycle"},
          {field:"platelets_x10e9_l",operator:"<",value:50}
        ]},
        action:action("withhold",["lonsurf"],"Interrupt Lonsurf dosing. Do not make up missed doses. The next cycle must not start until platelets are ≥75 ×10⁹/L."),
        source:source(2,"Table 2"),explanation:"Within-cycle platelet interruption threshold is <50 ×10⁹/L."
      },
      {
        rule_id:"LONSURF_NEXT_CYCLE_ANC",
        when:{all:[
          {field:"assessment_context",operator:"==",value:"start_next_cycle"},
          {field:"anc_x10e9_l",operator:"<",value:1.5}
        ]},
        action:action("withhold",["lonsurf"],"Do not start the next cycle until ANC is ≥1.5 ×10⁹/L."),
        source:source(2,"Table 2"),explanation:"The ≥1.5 ×10⁹/L resumption criterion applies at the start of every next cycle regardless of whether within-cycle interruption occurred."
      },
      {
        rule_id:"LONSURF_NEXT_CYCLE_PLT",
        when:{all:[
          {field:"assessment_context",operator:"==",value:"start_next_cycle"},
          {field:"platelets_x10e9_l",operator:"<",value:75}
        ]},
        action:action("withhold",["lonsurf"],"Do not start the next cycle until platelets are ≥75 ×10⁹/L."),
        source:source(2,"Table 2"),explanation:"The ≥75 ×10⁹/L resumption criterion applies at the start of every next cycle."
      },
      {
        rule_id:"LONSURF_FN_REDUCE",
        when:{field:"febrile_neutropenia",operator:"==",value:true},
        action:action("withhold_then_reduce",["lonsurf"],"Interrupt until toxicity resolves to Grade 1 or baseline; when resuming, reduce Lonsurf by 5 mg/m² per dose. Do not re-escalate."),
        source:source(3,"Table 3"),explanation:"Febrile neutropenia triggers interruption followed by a 5 mg/m²/dose reduction."
      },
      {
        rule_id:"LONSURF_DELAY_REDUCE_ANC",
        when:{all:[
          {field:"assessment_context",operator:"==",value:"start_next_cycle"},
          {field:"anc_x10e9_l",operator:"<",value:0.5},
          {field:"next_cycle_delay_days",operator:">",value:7}
        ]},
        action:action("withhold_then_reduce",["lonsurf"],"Because ANC <0.5 ×10⁹/L has caused more than one week's delay to the next cycle, resume only after recovery and reduce Lonsurf by 5 mg/m² per dose."),
        source:source(3,"Table 3"),explanation:"The dose reduction is linked to ANC <0.5 causing >1 week's delay, not to ANC <0.5 alone."
      },
      {
        rule_id:"LONSURF_DELAY_REDUCE_PLT",
        when:{all:[
          {field:"assessment_context",operator:"==",value:"start_next_cycle"},
          {field:"platelets_x10e9_l",operator:"<",value:25},
          {field:"next_cycle_delay_days",operator:">",value:7}
        ]},
        action:action("withhold_then_reduce",["lonsurf"],"Because platelets <25 ×10⁹/L have caused more than one week's delay to the next cycle, resume only after recovery and reduce Lonsurf by 5 mg/m² per dose."),
        source:source(3,"Table 3"),explanation:"The source reduction criterion is platelets <25 ×10⁹/L causing >1 week's delay."
      },
      {
        rule_id:"LONSURF_NONHAEM_REDUCE",
        when:{field:"toxicity_requiring_interruption",operator:"==",value:true},
        action:action("withhold_then_reduce",["lonsurf"],"For a qualifying Grade 3–4 non-haematological toxicity, interrupt until Grade 1/baseline then reduce by 5 mg/m² per dose. Confirm the NCCP exceptions for controlled Grade 3 nausea/vomiting or responsive diarrhoea."),
        source:source(5,"Table 7"),explanation:"The current NCCP v4 non-haematological pathway is retained with its stated exceptions."
      },
      {
        rule_id:"LONSURF_RENAL_LT30",
        when:{field:"crcl_ml_min",operator:"<",value:30},
        action:action("dose_reduce",["lonsurf"],"For CrCl <30 mL/min, use the NCCP v4 severe-renal-impairment BSA table: starting dose 20 mg/m² twice daily, with one permitted reduction to 15 mg/m² twice daily."),
        source:source(4,"Tables 5–6"),explanation:"NCCP v4 groups all CrCl <30 mL/min under the severe renal impairment dose table."
      },
      {
        rule_id:"LONSURF_DIALYSIS",
        when:{field:"dialysis",operator:"==",value:true},
        action:action("contraindicated",["lonsurf"],"Lonsurf is not recommended in haemodialysis under NCCP 00382 v4."),
        source:source(4,"Table 5"),explanation:"Haemodialysis is listed as not recommended."
      },
      {
        rule_id:"LONSURF_HEPATIC_MOD_SEV",
        when:{field:"hepatic_impairment",operator:"in",value:["moderate","severe"]},
        action:action("contraindicated",["lonsurf"],"Lonsurf is not recommended in moderate or severe hepatic impairment under NCCP 00382 v4."),
        source:source(4,"Table 5"),explanation:"Mild hepatic impairment requires no adjustment; moderate/severe is not recommended."
      },
      {
        rule_id:"LONSURF_NEXT_CYCLE_PROCEED",
        when:{all:[
          {field:"assessment_context",operator:"==",value:"start_next_cycle"},
          {field:"anc_x10e9_l",operator:">=",value:1.5},
          {field:"platelets_x10e9_l",operator:">=",value:75}
        ]},
        action:action("proceed",["lonsurf"],"Entered ANC and platelet values meet the NCCP v4 next-cycle resumption thresholds. Other unentered domains remain unassessed."),
        source:source(2,"Table 2"),explanation:"This finding applies only to the entered next-cycle count criteria and is not whole-regimen clearance."
      }
    ]);

    return protocol;
  }

  function addRibociclibInputs(protocol,setting){
    upsertDefinition(protocol,"assessment_phase",{
      label:"Ribociclib assessment phase",
      type:"select",required:false,input_role:"context",always_show:true,demo_value:"ongoing",
      options:[
        {value:"baseline",label:"Baseline / before starting ribociclib"},
        {value:"ongoing",label:"On-treatment review"}
      ]
    });
    upsertDefinition(protocol,"ecog_status",{
      label:"ECOG performance status",type:"select",required:false,input_role:"decision",demo_value:0,
      options:[0,1,2,3,4].map(value=>({value,label:String(value)}))
    });
    upsertDefinition(protocol,"alt_ast_uln_multiple",{
      label:"ALT / AST (highest ×ULN)",
      type:"number",required:false,min:0,max:100,step:0.01,unit:"×ULN",input_role:"decision",
      demo_value:1,
      assessment_guidance:"Enter the measured ALT and/or AST in the automatic local-laboratory control. SACTCheck uses the higher calculated ×ULN for the NCCP ribociclib hepatobiliary table."
    });
    upsertDefinition(protocol,"bilirubin_ratio_uln",{
      label:"Total bilirubin (×ULN)",
      type:"number",required:false,min:0,max:100,step:0.01,unit:"×ULN",input_role:"decision",
      demo_value:1,
      assessment_guidance:"Enter the measured bilirubin. SACTCheck calculates ×ULN using the configured local laboratory profile."
    });
    upsertDefinition(protocol,"baseline_ast_alt_band",tableBandField("Baseline AST/ALT band · NCCP Table 4 (CTCAE 4.03)"));
    upsertDefinition(protocol,"hepatotoxicity_grade2_recurrent",{
      label:"Recurrent Grade 2 AST/ALT elevation",type:"boolean",required:false,demo_value:false,input_role:"context"
    });
    upsertDefinition(protocol,"hepatotoxicity_grade3_recurrent",{
      label:"Recurrent Grade 3 AST/ALT elevation",type:"boolean",required:false,demo_value:false,input_role:"context"
    });
    upsertDefinition(protocol,"cholestasis_present",{
      label:"Cholestasis present",type:"boolean",required:false,demo_value:false,input_role:"context",
      assessment_guidance:"The NCCP combined AST/ALT plus bilirubin discontinuation criterion applies in the absence of cholestasis."
    });
    upsertDefinition(protocol,"qtc_recurrent_481_plus",{
      label:"QTcF ≥481 ms has recurred after prior interruption",type:"boolean",required:false,demo_value:false,input_role:"context"
    });
    if(setting==="metastatic"){
      upsertDefinition(protocol,"qtc_gt500_confirmed_two_ecgs",{
        label:"QTcF >500 ms confirmed on at least 2 separate ECGs",type:"boolean",required:false,demo_value:false,input_role:"context"
      });
    } else {
      upsertDefinition(protocol,"qtc_gt500_recurrent",{
        label:"QTcF >500 ms has recurred",type:"boolean",required:false,demo_value:false,input_role:"context"
      });
    }
    upsertDefinition(protocol,"qtc_change_from_baseline_ms",{
      label:"QTcF change from baseline",type:"number",required:false,min:0,max:1000,step:1,unit:"ms",demo_value:0,input_role:"decision"
    });
    upsertDefinition(protocol,"serious_arrhythmia_with_qt_prolongation",{
      label:"Torsade / polymorphic VT / signs or symptoms of serious arrhythmia with QT prolongation",
      type:"boolean",required:false,demo_value:false,input_role:"decision"
    });
    upsertDefinition(protocol,"ild_pneumonitis_severity",severityField(
      "ILD / pneumonitis severity · NCCP Table 6",
      ["No ILD/pneumonitis","Grade 1 · asymptomatic","Grade 2 · source-defined Grade 2 pathway","Grade 3 · severe","Grade 4 · severe/life-threatening"]
    ));
    upsertDefinition(protocol,"other_toxicity_source_band",severityField(
      "Other non-haematological toxicity · NCCP Table 7",
      ["No toxicity","Grade 1","Grade 2","Grade 3","Grade 4"]
    ));
    upsertDefinition(protocol,"other_toxicity_grade3_recurrent",{
      label:"Recurrent Grade 3 other non-haematological toxicity",type:"boolean",required:false,demo_value:false,input_role:"context"
    });
    upsertDefinition(protocol,"further_reduction_required_at_minimum_dose",{
      label:"A further ribociclib dose reduction is required while already at 200 mg/day",
      type:"boolean",required:false,demo_value:false,input_role:"decision"
    });

    hideDefinition(protocol,"ast_alt_grade");
    hideDefinition(protocol,"bilirubin_elevated");
    hideDefinition(protocol,"nonhaem_toxicity_grade");
  }

  function ribociclibLiverRules(){
    return [
      {
        rule_id:"RIBO_HEP_G1",
        when:{all:[
          {field:"alt_ast_uln_multiple",operator:">",value:1},
          {field:"alt_ast_uln_multiple",operator:"<=",value:3}
        ]},
        action:action("proceed",["ribociclib"],"Grade 1 AST/ALT elevation (>ULN to 3 × ULN): no ribociclib dose adjustment is required by the NCCP hepatobiliary table."),
        source:source(5,"Table 4"),explanation:"NCCP Table 4 Grade 1 pathway."
      },
      {
        rule_id:"RIBO_HEP_G2_BASE2",
        when:{all:[
          {field:"alt_ast_uln_multiple",operator:">",value:3},
          {field:"alt_ast_uln_multiple",operator:"<=",value:5},
          {field:"baseline_ast_alt_band",operator:"==",value:2}
        ]},
        action:action("proceed",["ribociclib"],"Current Grade 2 AST/ALT elevation with baseline Grade 2: no dose interruption under the NCCP table."),
        source:source(5,"Table 4"),explanation:"Baseline Grade 2 has a distinct no-interruption pathway."
      },
      {
        rule_id:"RIBO_HEP_G2_BASE_LT2",
        when:{all:[
          {field:"alt_ast_uln_multiple",operator:">",value:3},
          {field:"alt_ast_uln_multiple",operator:"<=",value:5},
          {field:"baseline_ast_alt_band",operator:"in",value:[0,1]}
        ]},
        action:action("withhold",["ribociclib"],"Interrupt ribociclib until AST/ALT recovers to ≤ baseline grade, then resume at the same dose level."),
        source:source(5,"Table 4"),explanation:"First Grade 2 episode when baseline grade is <2."
      },
      {
        rule_id:"RIBO_HEP_G2_RECUR",
        when:{all:[
          {field:"alt_ast_uln_multiple",operator:">",value:3},
          {field:"alt_ast_uln_multiple",operator:"<=",value:5},
          {field:"baseline_ast_alt_band",operator:"in",value:[0,1]},
          {field:"hepatotoxicity_grade2_recurrent",operator:"==",value:true}
        ]},
        action:action("withhold_then_reduce",["ribociclib"],"For recurrent Grade 2 AST/ALT elevation, interrupt to recovery ≤ baseline grade then resume at the next lower ribociclib dose level."),
        source:source(5,"Table 4"),explanation:"Recurrent Grade 2 pathway."
      },
      {
        rule_id:"RIBO_HEP_G3",
        when:{all:[
          {field:"alt_ast_uln_multiple",operator:">",value:5},
          {field:"alt_ast_uln_multiple",operator:"<=",value:20}
        ]},
        action:action("withhold_then_reduce",["ribociclib"],"Interrupt ribociclib until AST/ALT recovers to ≤ baseline grade, then resume at the next lower dose level."),
        source:source(5,"Table 4"),explanation:"First Grade 3 AST/ALT elevation pathway."
      },
      {
        rule_id:"RIBO_HEP_G3_RECUR",
        when:{all:[
          {field:"alt_ast_uln_multiple",operator:">",value:5},
          {field:"alt_ast_uln_multiple",operator:"<=",value:20},
          {field:"hepatotoxicity_grade3_recurrent",operator:"==",value:true}
        ]},
        action:action("discontinue",["ribociclib"],"Discontinue ribociclib for recurrent Grade 3 AST/ALT elevation."),
        source:source(5,"Table 4"),explanation:"NCCP Table 4 discontinues ribociclib when Grade 3 recurs."
      },
      {
        rule_id:"RIBO_HEP_G4",
        when:{field:"alt_ast_uln_multiple",operator:">",value:20},
        action:action("discontinue",["ribociclib"],"Discontinue ribociclib for Grade 4 AST/ALT elevation (>20 × ULN)."),
        source:source(5,"Table 4"),explanation:"NCCP Table 4 Grade 4 pathway."
      },
      {
        rule_id:"RIBO_HEP_DILI",
        when:{all:[
          {field:"alt_ast_uln_multiple",operator:">",value:3},
          {field:"bilirubin_ratio_uln",operator:">",value:2},
          {field:"cholestasis_present",operator:"==",value:false}
        ]},
        action:action("discontinue",["ribociclib"],"ALT and/or AST >3 × ULN with total bilirubin >2 × ULN in the absence of cholestasis: discontinue ribociclib irrespective of baseline grade."),
        source:source(5,"Table 4"),explanation:"Combined hepatobiliary discontinuation criterion."
      }
    ];
  }

  function ribociclibCommonRules(setting){
    const rules=[
      {
        rule_id:"RIBO_BASELINE_ECOG",
        when:{all:[
          {field:"assessment_phase",operator:"==",value:"baseline"},
          {field:"ecog_status",operator:">",value:1}
        ]},
        action:action("contraindicated",["ribociclib"],"NCCP ribociclib eligibility specifies ECOG 0–1. Review eligibility before initiating treatment."),
        source:source(2),explanation:"Baseline ECOG eligibility check."
      },
      {
        rule_id:"RIBO_BASELINE_QTC",
        when:{all:[
          {field:"assessment_phase",operator:"==",value:"baseline"},
          {field:"qtc_f",operator:">=",value:450}
        ]},
        action:action("contraindicated",["ribociclib"],"Baseline QTcF must be <450 ms under the NCCP eligibility criteria. Do not initiate until eligibility is reviewed."),
        source:source(2),explanation:"Baseline QTcF eligibility threshold is strictly <450 ms."
      },
      ...ribociclibLiverRules(),
      {
        rule_id:"RIBO_QT_480_FIRST",
        when:{all:[
          {field:"qtc_f",operator:">",value:480},
          {field:"qtc_f",operator:"<=",value:500}
        ]},
        action:action("withhold",["ribociclib"],"Interrupt ribociclib until QTcF resolves to <481 ms, then resume at the same dose level."),
        source:source(5,"Table 5"),explanation:"First QTcF >480 ms pathway."
      },
      {
        rule_id:"RIBO_QT_481_RECUR",
        when:{all:[
          {field:"qtc_f",operator:">=",value:481},
          {field:"qtc_recurrent_481_plus",operator:"==",value:true}
        ]},
        action:action("withhold_then_reduce",["ribociclib"],"Recurrent QTcF ≥481 ms: interrupt until QTcF <481 ms, then resume at the next lower ribociclib dose level."),
        source:source(5,"Table 5"),explanation:"Recurrent QTc prolongation requires the next lower dose."
      },
      {
        rule_id:"RIBO_QT_SERIOUS",
        when:{all:[
          {field:"serious_arrhythmia_with_qt_prolongation",operator:"==",value:true},
          {any:[
            {field:"qtc_f",operator:">",value:500},
            {field:"qtc_change_from_baseline_ms",operator:">",value:60}
          ]}
        ]},
        action:action("permanently_discontinue",["ribociclib"],"Permanently discontinue ribociclib for qualifying serious arrhythmia with QTcF >500 ms or >60 ms increase from baseline."),
        source:source(5,"Table 5"),explanation:"NCCP permanent-discontinuation QT criterion."
      },
      {
        rule_id:"RIBO_ILD_G1",
        when:{field:"ild_pneumonitis_severity",operator:"==",value:1},
        action:action("proceed",["ribociclib"],"Grade 1 ILD/pneumonitis: no ribociclib dose adjustment is required by the NCCP table; continue clinical assessment and monitoring."),
        source:source(6,"Table 6"),explanation:"Grade 1 ILD/pneumonitis pathway."
      },
      {
        rule_id:"RIBO_ILD_G2",
        when:{field:"ild_pneumonitis_severity",operator:"==",value:2},
        action:action("withhold_then_reduce",["ribociclib"],"Interrupt ribociclib, initiate appropriate medical therapy, and resume only after recovery to Grade ≤1 at the next lower dose if the individual benefit-risk supports resumption."),
        source:source(6,"Table 6"),explanation:"Grade 2 ILD/pneumonitis pathway."
      },
      {
        rule_id:"RIBO_ILD_G34",
        when:{field:"ild_pneumonitis_severity",operator:">=",value:3},
        action:action("discontinue",["ribociclib"],"Discontinue ribociclib for Grade 3 or 4 ILD/pneumonitis and manage urgently as clinically indicated."),
        source:source(6,"Table 6"),explanation:"Grade 3–4 ILD/pneumonitis discontinuation pathway."
      },
      {
        rule_id:"RIBO_OTHER_G3",
        when:{all:[
          {field:"other_toxicity_source_band",operator:"==",value:3}
        ]},
        action:action("withhold",["ribociclib"],"Interrupt ribociclib for Grade 3 other non-haematological toxicity until recovery to Grade ≤1, then resume at the same dose."),
        source:source(6,"Table 7"),explanation:"First Grade 3 other toxicity pathway."
      },
      {
        rule_id:"RIBO_OTHER_G3_RECUR",
        when:{all:[
          {field:"other_toxicity_source_band",operator:"==",value:3},
          {field:"other_toxicity_grade3_recurrent",operator:"==",value:true}
        ]},
        action:action("withhold_then_reduce",["ribociclib"],"For recurrent Grade 3 other non-haematological toxicity, interrupt until Grade ≤1 then resume at the next lower dose."),
        source:source(6,"Table 7"),explanation:"Recurrent Grade 3 other toxicity pathway."
      },
      {
        rule_id:"RIBO_OTHER_G4",
        when:{field:"other_toxicity_source_band",operator:">=",value:4},
        action:action("discontinue",["ribociclib"],"Discontinue ribociclib for Grade 4 other non-haematological toxicity."),
        source:source(6,"Table 7"),explanation:"Grade 4 other toxicity pathway."
      },
      {
        rule_id:"RIBO_MINIMUM_DOSE",
        when:{field:"further_reduction_required_at_minimum_dose",operator:"==",value:true},
        action:action("discontinue",["ribociclib"],"If a further dose reduction is required while already at 200 mg/day, discontinue ribociclib."),
        source:source(3,"Table 1"),explanation:"200 mg/day is the minimum protocol dose level."
      }
    ];

    if(setting==="metastatic"){
      rules.push({
        rule_id:"RIBO_QT_GT500_MET",
        when:{all:[
          {field:"qtc_f",operator:">",value:500},
          {field:"qtc_gt500_confirmed_two_ecgs",operator:"==",value:true}
        ]},
        action:action("withhold_then_reduce",["ribociclib"],"QTcF >500 ms on at least 2 separate ECGs: interrupt until QTcF <481 ms, then resume at the next lower dose."),
        source:source(5,"Table 5"),explanation:"Metastatic NCCP v6 requires confirmation on at least two ECGs for this >500 ms dose-reduction pathway."
      });
    } else {
      rules.push(
        {
          rule_id:"RIBO_QT_GT500_ADJ",
          when:{all:[
            {field:"qtc_f",operator:">",value:500}
          ]},
          action:action("withhold_then_reduce",["ribociclib"],"QTcF >500 ms: interrupt until QTcF <481 ms, then resume at the next lower dose."),
          source:source(5,"Table 5"),explanation:"Adjuvant NCCP v2 first >500 ms pathway."
        },
        {
          rule_id:"RIBO_QT_GT500_ADJ_RECUR",
          when:{all:[
            {field:"qtc_f",operator:">",value:500},
            {field:"qtc_gt500_recurrent",operator:"==",value:true}
          ]},
          action:action("discontinue",["ribociclib"],"Discontinue adjuvant ribociclib if QTcF >500 ms recurs."),
          source:source(5,"Table 5"),explanation:"Adjuvant NCCP v2 explicitly discontinues treatment when >500 ms recurs."
        }
      );
    }
    return rules;
  }

  function reconcileRibociclib(protocol,setting){
    addSourceFallback(protocol);
    addRibociclibInputs(protocol,setting);

    const code=codeOf(protocol);
    markSourceReconciled(protocol,
      setting==="metastatic"
        ? "Reconciled against NCCP 00525 Version 6. Hepatobiliary toxicity now uses actual ALT/AST and bilirubin with automatic ×ULN calculation, source-specific baseline/recurrence logic, QT pathways, ILD/pneumonitis and minimum-dose handling."
        : "Reconciled against NCCP 00892 Version 2. Hepatobiliary toxicity now uses actual ALT/AST and bilirubin with automatic ×ULN calculation, source-specific baseline/recurrence logic, adjuvant QT pathways and ILD/pneumonitis. The prior Child-Pugh B/C dose-reduction rule is removed because the current early-breast-cancer NCCP source states no hepatic dose adjustment is necessary."
    );

    removeRules(protocol,[
      "QT_500","LIVER_DILI","NONHAEM_G3","BELOW200",
      "RIBO_BASELINE_ECOG","RIBO_BASELINE_QTC",
      "RIBO_HEP_G1","RIBO_HEP_G2_BASE2","RIBO_HEP_G2_BASE_LT2","RIBO_HEP_G2_RECUR",
      "RIBO_HEP_G3","RIBO_HEP_G3_RECUR","RIBO_HEP_G4","RIBO_HEP_DILI",
      "RIBO_QT_480_FIRST","RIBO_QT_481_RECUR","RIBO_QT_SERIOUS",
      "RIBO_QT_GT500_MET","RIBO_QT_GT500_ADJ","RIBO_QT_GT500_ADJ_RECUR",
      "RIBO_ILD_G1","RIBO_ILD_G2","RIBO_ILD_G34",
      "RIBO_OTHER_G3","RIBO_OTHER_G3_RECUR","RIBO_OTHER_G4","RIBO_MINIMUM_DOSE"
    ]);
    if(setting==="adjuvant") removeRules(protocol,["CHILDPUGH_BC"]);

    addRules(protocol,ribociclibCommonRules(setting));

    protocol.ctcae_standard=protocol.ctcae_standard||{};
    protocol.ctcae_standard.ribociclib_source_tables="The current NCCP ribociclib toxicity tables cite CTCAE Version 4.03. SACTCheck preserves those source table bands and does not silently reinterpret them using its separate CTCAE v5 educational layer.";
    return protocol;
  }

  function reconcileAbemaciclibLink(protocol){
    addSourceFallback(protocol);
    protocol.metadata.source_link_status="Direct official HSE PDF verified; NCCP breast catalogue retained as fallback if the HSE asset is temporarily unavailable.";
    return protocol;
  }

  function apply(protocol){
    const code=codeOf(protocol);
    if(code==="00382") return reconcileLonsurf(protocol);
    if(code==="00525") return reconcileRibociclib(protocol,"metastatic");
    if(code==="00892") return reconcileRibociclib(protocol,"adjuvant");
    if(code==="00619") return reconcileAbemaciclibLink(protocol);
    return protocol;
  }

  function validatePatched(protocol){
    const validator=root?.SACTCheckProtocolValidator;
    if(!validator?.validate) return {valid:true,errors:[],warnings:[]};
    return validator.validate(protocol,{strict:true});
  }

  function refreshCard(protocol){
    if(!root?.document) return;
    const id=String(protocol?.protocol_id||"");
    const card=root.document.querySelector(`[data-json-protocol-id="${id}"]`);
    if(!card) return;
    const sourceLink=card.querySelector(".official-pdf-link");
    if(sourceLink&&protocol?.metadata?.source_url) sourceLink.href=protocol.metadata.source_url;
    const maturity=card.querySelector(".encoding-maturity");
    if(maturity&&protocol?.metadata?.encoding_maturity?.label) maturity.textContent=protocol.metadata.encoding_maturity.label;
  }

  function applyLoadedRecords(records){
    let count=0;
    for(const record of asArray(records)){
      const protocol=record?.protocol||record;
      const code=codeOf(protocol);
      if(!["00382","00525","00892","00619"].includes(code)) continue;
      apply(protocol);
      const validation=validatePatched(protocol);
      if(validation?.valid===false){
        console.error(`SACTCheck v${RELEASE} validation failed for ${code}`,validation);
        continue;
      }
      refreshCard(protocol);
      count++;
    }
    if(count&&root?.dispatchEvent&&typeof root.CustomEvent==="function"){
      root.dispatchEvent(new root.CustomEvent("sactcheck:v0701-source-reconciled",{detail:{release:RELEASE,count}}));
    }
    return count;
  }

  function currentAssessmentCode(){
    const text=String(root?.document?.getElementById("jsonProtocolCode")?.textContent||"");
    const match=text.match(/\b(\d{5})\b/);
    return match?.[1]||"";
  }

  function ensureFallbackLink(anchor,id){
    if(!anchor?.parentElement) return null;
    let link=root.document.getElementById(id);
    if(!link){
      link=root.document.createElement("a");
      link.id=id;
      link.className="btn secondary hidden nccp-catalogue-fallback";
      link.target="_blank";
      link.rel="noopener noreferrer";
      link.textContent="NCCP regimen catalogue";
      anchor.insertAdjacentElement("afterend",link);
    }
    return link;
  }

  function syncAssessmentFallback(){
    if(!root?.document) return;
    const code=currentAssessmentCode();
    const mapped=SOURCES[code];

    const primary=root.document.getElementById("jsonOfficialPdf");
    const primaryFallback=ensureFallbackLink(primary,"jsonNccpCatalogueFallback");
    if(primaryFallback){
      if(mapped){
        primaryFallback.href=mapped.catalogue;
        primaryFallback.classList.remove("hidden");
        primaryFallback.title="Fallback route if the direct HSE PDF is unavailable or has moved.";
      }else{
        primaryFallback.classList.add("hidden");
        primaryFallback.removeAttribute("href");
      }
    }

    const result=root.document.getElementById("jsonResultOfficialPdf");
    const resultFallback=ensureFallbackLink(result,"jsonResultNccpCatalogueFallback");
    if(resultFallback){
      if(mapped){
        resultFallback.href=mapped.catalogue;
        resultFallback.classList.remove("hidden");
        resultFallback.title="Fallback route if the direct HSE PDF is unavailable or has moved.";
      }else{
        resultFallback.classList.add("hidden");
        resultFallback.removeAttribute("href");
      }
    }
  }

  function installSourceFallbackUI(){
    if(!root?.document) return;
    const bind=()=>{
      const codeNode=root.document.getElementById("jsonProtocolCode");
      const pdfNode=root.document.getElementById("jsonOfficialPdf");
      if(!codeNode||!pdfNode){
        root.setTimeout?.(bind,100);
        return;
      }
      if(root.document.documentElement.dataset.v0701FallbackBound==="true"){
        syncAssessmentFallback();
        return;
      }
      root.document.documentElement.dataset.v0701FallbackBound="true";
      syncAssessmentFallback();
      if(typeof root.MutationObserver==="function"){
        new root.MutationObserver(syncAssessmentFallback).observe(codeNode,{childList:true,characterData:true,subtree:true});
        new root.MutationObserver(syncAssessmentFallback).observe(pdfNode,{attributes:true,attributeFilter:["href","class"]});
      }
    };
    if(root.document.readyState==="loading") root.document.addEventListener("DOMContentLoaded",bind,{once:true});
    else bind();
  }

  async function applyTrackerPendingState(){
    if(!root?.document||typeof root.fetch!=="function") return;
    try{
      const response=await root.fetch("data/nccp-change-tracker/change-feed.json?v=0.70.1",{cache:"no-store"});
      if(!response.ok) return;
      const feed=await response.json();
      if(feed?.scan?.remote_comparison_completed) return;
      const badge=root.document.getElementById("nccpUpdateCountBadge");
      if(!badge) return;
      const enforce=()=>{
        if(badge.textContent!=="pending") badge.textContent="pending";
        if(badge.hidden) badge.hidden=false;
        badge.dataset.sourceCheckPending="true";
        badge.title="Source check pending — do not interpret this as zero updates.";
      };
      enforce();
      if(typeof root.MutationObserver==="function"&&!badge.dataset.v0701ObserverBound){
        badge.dataset.v0701ObserverBound="true";
        new root.MutationObserver(enforce).observe(badge,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:["hidden"]});
      }
    }catch(_){
      // The tracker itself retains its own error state. Do not block assessment.
    }
  }

  function install(){
    if(!root?.document||root.document.documentElement?.dataset?.v0701ReconciliationInstalled==="true") return;
    root.document.documentElement.dataset.v0701ReconciliationInstalled="true";

    const applyNow=()=>applyLoadedRecords(root.SACTCheckProtocolLoader?.getLoadedProtocols?.()||root.SACTCHECK_PROTOCOLS||[]);
    root.addEventListener?.("sactcheck:protocols-loaded",event=>{
      applyLoadedRecords(event?.detail?.protocols||root.SACTCheckProtocolLoader?.getLoadedProtocols?.()||[]);
    });
    root.document.addEventListener?.("sactcheck:regimen-card-metadata-rendered",()=>{
      applyLoadedRecords(root.SACTCheckProtocolLoader?.getLoadedProtocols?.()||root.SACTCHECK_PROTOCOLS||[]);
    });

    applyNow();
    installSourceFallbackUI();

    const trackerStart=()=>{
      applyTrackerPendingState();
      root.setTimeout?.(applyTrackerPendingState,400);
    };
    if(root.document.readyState==="loading") root.document.addEventListener("DOMContentLoaded",trackerStart,{once:true});
    else trackerStart();
  }

  return Object.freeze({
    version:RELEASE,
    sources:SOURCES,
    apply,
    applyLoadedRecords,
    reconcileLonsurf,
    reconcileRibociclib,
    reconcileAbemaciclibLink,
    syncAssessmentFallback,
    applyTrackerPendingState,
    install
  });
});
