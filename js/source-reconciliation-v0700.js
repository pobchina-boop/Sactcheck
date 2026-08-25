/**
 * SACTCheck v0.70.0 source-reconciliation layer.
 *
 * This is a transparent runtime reconciliation layer applied to the three
 * audited protocols after the canonical protocol library loads. It preserves
 * the historical source JSON lifecycle/provenance fields while replacing only
 * the identified decision-rule defects in memory.
 *
 * The current NCCP source remains authoritative. Formal consultant oncology
 * and oncology-pharmacy validation remain pending.
 */
(function(root,factory){
  const api=factory(root);
  if(typeof module==="object"&&module.exports) module.exports=api;
  root.SACTCheckV0700SourceReconciliation=api;
  if(root&&root.document) api.install();
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const RELEASE="0.70.0";
  const SOURCE_CHECKED_DATE="2026-08-25";
  const KNOWLEDGE_ADDENDUM_URL="data/regimen-knowledge-base-v0700-addendum.json";

  function asArray(value){ return Array.isArray(value)?value:[]; }
  function ruleId(rule){ return String(rule?.id||rule?.rule_id||""); }
  function source(page,table){
    const value={document:"NCCP National SACT Regimen",page};
    if(table) value.table=table;
    return value;
  }
  function action(type,components,message){
    return {type,components,message,recommendation:message};
  }
  function upsertDefinition(protocol,id,definition){
    protocol.input_definitions=protocol.input_definitions||{};
    protocol.input_definitions[id]=definition;
  }
  function removeRules(protocol,ids){
    const set=new Set(ids);
    protocol.rule_engine=protocol.rule_engine||{};
    protocol.rule_engine.rules=asArray(protocol.rule_engine.rules).filter(rule=>!set.has(ruleId(rule)));
  }
  function addRules(protocol,rules){
    const existing=asArray(protocol.rule_engine?.rules);
    const incomingIds=new Set(rules.map(ruleId));
    protocol.rule_engine.rules=[
      ...existing.filter(rule=>!incomingIds.has(ruleId(rule))),
      ...rules
    ];
  }
  function selectOptions(labels){
    return labels.map((label,value)=>({value,label:`Grade ${value}`,ctcae_grade:value,description:label}));
  }
  const GENERIC_GRADE_DESCRIPTIONS=[
    "No adverse event under the selected CTCAE term.",
    "Mild or asymptomatic toxicity; observation only and intervention generally not indicated.",
    "Moderate toxicity; minimal, local or non-invasive intervention may be indicated and instrumental activities of daily living may be limited.",
    "Severe or medically significant toxicity; hospital-level care may be indicated and self-care activities of daily living may be limited.",
    "Life-threatening consequences; urgent intervention required."
  ];
  function ctcaeField(label,category,guidance,descriptions=GENERIC_GRADE_DESCRIPTIONS){
    return {
      label,type:"select",required:false,demo_value:0,input_role:"decision",
      ctcae_version:"5.0",ctcae_category:category,
      ctcae_source_url:"https://dctd.cancer.gov/research/ctep-trials/for-sites/adverse-events/ctcae-v5-5x7.pdf",
      assessment_guidance:guidance,
      options:selectOptions(descriptions)
    };
  }
  function markReconciled(protocol,note){
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
    return protocol;
  }

  function reconcile00101(protocol){
    markReconciled(protocol,
      "Reconciled against NCCP 00101 Version 8. The literal treatment-day count row is preserved as ANC <1.5 AND platelets <100; isolated ANC <1.5 is surfaced for clinician review because the source also uses ANC 1.5 in baseline exclusion/recovery language. Platelet count <100 alone is not encoded as an independent hold."
    );

    upsertDefinition(protocol,"assessment_phase",{
      label:"Assessment phase",type:"select",required:false,demo_value:"treatment_day",
      input_role:"context",always_show:true,
      options:[
        {value:"baseline",label:"Baseline / before starting cabazitaxel"},
        {value:"treatment_day",label:"Ongoing treatment-day assessment"}
      ]
    });
    upsertDefinition(protocol,"nausea_vomiting_grade",ctcaeField(
      "Nausea / vomiting grade","other_nonhaematological",
      "Grade nausea and vomiting separately with the relevant CTCAE v5.0 term, then enter the higher clinically applicable grade for this combined NCCP pathway. Assess oral intake, hydration, antiemetic requirement and need for IV fluids or hospital care."
    ));
    upsertDefinition(protocol,"recurrent_severe_nausea_vomiting_after_reduction",{
      label:"Recurrent severe nausea/vomiting after cabazitaxel dose reduction",
      type:"boolean",required:false,demo_value:false,input_role:"decision"
    });
    upsertDefinition(protocol,"renal_failure_grade",ctcaeField(
      "Renal failure / acute kidney injury grade","other_nonhaematological",
      "Use the most appropriate CTCAE v5.0 renal adverse-event term and assess creatinine change, urine output, symptoms, intervention required and whether hospital-level or urgent renal support is needed."
    ));
    upsertDefinition(protocol,"strong_cyp3a_inhibitor_required",{
      label:"Strong CYP3A inhibitor cannot be avoided",
      type:"boolean",required:false,demo_value:false,input_role:"decision"
    });
    upsertDefinition(protocol,"strong_cyp3a_inducer_present",{
      label:"Strong CYP3A inducer present",
      type:"boolean",required:false,demo_value:false,input_role:"decision"
    });

    removeRules(protocol,[
      "ANC","PLT","CAB_COUNTS_COMBINED","CAB_BASELINE_ANC_LT_1_5",
      "CAB_ANC_LT_1_5_SOURCE_REVIEW","CAB_NAUSEA_G3","CAB_NAUSEA_RECURRENT",
      "CAB_RENAL_FAILURE_G3","CAB_CYP3A_INHIBITOR","CAB_CYP3A_INDUCER"
    ]);
    addRules(protocol,[
      {
        id:"CAB_BASELINE_ANC_LT_1_5",priority:10,
        when:{all:[
          {field:"assessment_phase",operator:"==",value:"baseline"},
          {field:"anc_x10e9_l",operator:"<",value:1.5}
        ]},
        action:action("contraindicated",["whole_regimen"],
          "Baseline ANC <1.5 ×10⁹/L is an NCCP exclusion criterion. Do not initiate under this regimen without senior review."),
        source:source(2),explanation:"NCCP 00101 Version 8 lists ANC <1.5 ×10⁹/L in the exclusion criteria."
      },
      {
        id:"CAB_COUNTS_COMBINED",priority:9,
        when:{all:[
          {field:"assessment_phase",operator:"==",value:"treatment_day"},
          {field:"anc_x10e9_l",operator:"<",value:1.5},
          {field:"platelets_x10e9_l",operator:"<",value:100}
        ]},
        action:action("delay",["whole_regimen"],
          "Delay treatment for one week and reassess. The NCCP treatment-day row is a combined ANC <1.5 AND platelets <100 condition."),
        source:source(4,"Table 3"),
        explanation:"The Table 3 treatment-day count criterion is encoded literally as ANC <1.5 AND platelets <100. Platelets <100 alone is not converted into an independent delay rule."
      },
      {
        id:"CAB_ANC_LT_1_5_SOURCE_REVIEW",priority:7,
        when:{field:"anc_x10e9_l",operator:"<",value:1.5},
        action:action("consultant_review",["cabazitaxel"],
          "ANC is below 1.5 ×10⁹/L. The source uses ANC 1.5 in baseline exclusion/recovery language while the routine count table joins ANC <1.5 with platelets <100. Verify the exact clinical context before treatment."),
        source:source(2),
        explanation:"This intentionally avoids inventing an isolated treatment-day ANC hold while preventing a low ANC from being presented as automatically acceptable."
      },
      {
        id:"CAB_NAUSEA_G3",priority:7,
        when:{field:"nausea_vomiting_grade",operator:">=",value:3},
        action:action("dose_reduce",["cabazitaxel"],
          "For grade ≥3 nausea/vomiting despite the regimen antiemetic pathway, reduce cabazitaxel from 25 mg/m² to 20 mg/m² and review supportive treatment."),
        source:source(5),explanation:"NCCP 00101 includes cabazitaxel dose reduction after severe nausea/vomiting despite supportive treatment."
      },
      {
        id:"CAB_NAUSEA_RECURRENT",priority:10,
        when:{field:"recurrent_severe_nausea_vomiting_after_reduction",operator:"==",value:true},
        action:action("discontinue",["cabazitaxel"],
          "Withdraw cabazitaxel if severe nausea/vomiting recurs after the protocol dose-reduction pathway."),
        source:source(5),explanation:"The adverse-event pathway directs treatment withdrawal if severe nausea/vomiting recurs after reduction."
      },
      {
        id:"CAB_RENAL_FAILURE_G3",priority:10,
        when:{field:"renal_failure_grade",operator:">=",value:3},
        action:action("discontinue",["cabazitaxel"],
          "Discontinue cabazitaxel for grade ≥3 renal failure and manage urgently according to the clinical context."),
        source:source(5),explanation:"NCCP 00101 directs discontinuation for grade ≥3 renal failure."
      },
      {
        id:"CAB_CYP3A_INHIBITOR",priority:7,
        when:{field:"strong_cyp3a_inhibitor_required",operator:"==",value:true},
        action:action("consultant_review",["cabazitaxel"],
          "Avoid a strong CYP3A inhibitor where possible. If co-administration cannot be avoided, NCCP advises considering a 25% cabazitaxel dose reduction with close monitoring."),
        source:source(5),explanation:"The source gives a conditional dose-reduction option rather than an automatic mandatory dose."
      },
      {
        id:"CAB_CYP3A_INDUCER",priority:7,
        when:{field:"strong_cyp3a_inducer_present",operator:"==",value:true},
        action:action("consultant_review",["cabazitaxel"],
          "Avoid concomitant strong CYP3A induction and review the interacting medicine before cabazitaxel."),
        source:source(5),explanation:"The current NCCP regimen advises avoiding strong CYP3A inducers."
      }
    ]);
    return protocol;
  }

  function reconcile00256(protocol){
    markReconciled(protocol,
      "Reconciled against NCCP 00256 Version 7 with explicit Day 1, Day 8 and Day 15 haematology pathways. Source-permitted Day 15 alternative dose/G-CSF strategies remain clinician choices rather than an automatic SACTCheck selection."
    );
    if(protocol.input_definitions?.assessment_day) protocol.input_definitions.assessment_day.always_show=true;
    if(protocol.input_definitions?.day8_action){
      protocol.input_definitions.day8_action.always_show=true;
      protocol.input_definitions.day8_action.visible_when={field:"assessment_day",operator:"==",value:15};
    }

    removeRules(protocol,[
      "DAY1_COUNTS","DAY8_LOW","DAY8_INTERMEDIATE","DAY15_LOW",
      "DAY15_AFTER_FULL_INTERMEDIATE","DAY15_AFTER_REDUCED_RECOVERED",
      "DAY15_AFTER_REDUCED_INTERMEDIATE","DAY15_AFTER_WITHHELD_RECOVERED",
      "DAY15_AFTER_WITHHELD_INTERMEDIATE"
    ]);

    const intermediate={any:[
      {all:[{field:"anc",operator:">=",value:0.5},{field:"anc",operator:"<",value:1}]},
      {all:[{field:"platelets",operator:">=",value:50},{field:"platelets",operator:"<",value:75}]}
    ]};
    const recovered={all:[
      {field:"anc",operator:">=",value:1},
      {field:"platelets",operator:">=",value:75}
    ]};
    const low={any:[
      {field:"anc",operator:"<",value:0.5},
      {field:"platelets",operator:"<",value:50}
    ]};

    addRules(protocol,[
      {
        rule_id:"DAY1_COUNTS",
        when:{all:[
          {field:"assessment_day",operator:"==",value:1},
          {any:[{field:"anc",operator:"<",value:1.5},{field:"platelets",operator:"<",value:100}]}
        ]},
        action:action("withhold",["whole_regimen"],"Delay Day 1 treatment until count recovery."),
        source:source(3,"Table 2"),explanation:"Day 1 ANC <1.5 or platelets <100 requires delay."
      },
      {
        rule_id:"DAY8_LOW",
        when:{all:[{field:"assessment_day",operator:"==",value:8},low]},
        action:action("withhold",["whole_regimen"],"Withhold both Day 8 doses."),
        source:source(3,"Table 2"),explanation:"Day 8 ANC <0.5 or platelets <50 requires withholding."
      },
      {
        rule_id:"DAY8_INTERMEDIATE",
        when:{all:[{field:"assessment_day",operator:"==",value:8},intermediate]},
        action:action("dose_reduce",["nab-paclitaxel","gemcitabine"],"Reduce both drugs by one dose level on Day 8."),
        source:source(3,"Table 2"),explanation:"Day 8 ANC 0.5–<1.0 or platelets 50–<75 requires a one-level reduction."
      },
      {
        rule_id:"DAY15_LOW",
        when:{all:[{field:"assessment_day",operator:"==",value:15},low]},
        action:action("withhold",["whole_regimen"],"Withhold Day 15 doses."),
        source:source(4,"Table 2"),explanation:"Across the Day 15 branches, ANC <0.5 or platelets <50 requires withholding."
      },
      {
        rule_id:"DAY15_AFTER_FULL_INTERMEDIATE",
        when:{all:[{field:"assessment_day",operator:"==",value:15},{field:"day8_action",operator:"==",value:"full"},intermediate]},
        action:action("consultant_review",["whole_regimen"],
          "NCCP options: treat at the Day 8 dose with G-CSF support, or reduce both drugs by one dose level from the Day 8 dose. Select and document the intended pathway."),
        source:source(4,"Table 2"),explanation:"The source provides alternative Day 15 strategies; SACTCheck does not choose between them automatically."
      },
      {
        rule_id:"DAY15_AFTER_REDUCED_RECOVERED",
        when:{all:[{field:"assessment_day",operator:"==",value:15},{field:"day8_action",operator:"==",value:"reduced"},recovered]},
        action:action("consultant_review",["whole_regimen"],
          "NCCP options: return to the Day 1 dose levels with G-CSF support, or continue the Day 8 reduced dose. Select and document the intended pathway."),
        source:source(4,"Table 2"),explanation:"Two source-permitted Day 15 options are retained for clinician selection after a reduced Day 8 dose with count recovery."
      },
      {
        rule_id:"DAY15_AFTER_REDUCED_INTERMEDIATE",
        when:{all:[{field:"assessment_day",operator:"==",value:15},{field:"day8_action",operator:"==",value:"reduced"},intermediate]},
        action:action("consultant_review",["whole_regimen"],
          "NCCP options: continue the Day 8 dose with G-CSF support, or reduce both drugs by one further dose level. Select and document the intended pathway."),
        source:source(4,"Table 2"),explanation:"Alternative Day 15 strategies are preserved without automatic selection."
      },
      {
        rule_id:"DAY15_AFTER_WITHHELD_RECOVERED",
        when:{all:[{field:"assessment_day",operator:"==",value:15},{field:"day8_action",operator:"==",value:"withheld"},recovered]},
        action:action("consultant_review",["whole_regimen"],
          "NCCP options: return to the Day 1 dose levels with G-CSF support, or reduce both drugs by one dose level from Day 1. Select and document the intended pathway."),
        source:source(4,"Table 2"),explanation:"Alternative Day 15 restart strategies after a withheld Day 8 dose are retained for clinician selection."
      },
      {
        rule_id:"DAY15_AFTER_WITHHELD_INTERMEDIATE",
        when:{all:[{field:"assessment_day",operator:"==",value:15},{field:"day8_action",operator:"==",value:"withheld"},intermediate]},
        action:action("consultant_review",["whole_regimen"],
          "NCCP options: reduce both drugs by one dose level from Day 1 with G-CSF support, or reduce by two dose levels from Day 1. Select and document the intended pathway."),
        source:source(4,"Table 2"),explanation:"Alternative Day 15 strategies are preserved without automatic selection."
      }
    ]);
    return protocol;
  }

  const HTN_DESCRIPTIONS=[
    "No treatment-emergent hypertension.",
    "Pre-hypertension range or transient mild elevation; no antihypertensive treatment indicated.",
    "Persistent or recurrent elevation requiring initiation or adjustment of one antihypertensive agent; generally 140–159/90–99 mmHg in adults.",
    "Severe elevation requiring more than one drug or more intensive treatment; generally at least 160 systolic or 100 diastolic in adults.",
    "Life-threatening consequences such as hypertensive crisis; urgent intervention required."
  ];
  const FISTULA_DESCRIPTIONS=[
    "No fistula.",
    "Asymptomatic; clinical or diagnostic observations only.",
    "Symptomatic; non-invasive intervention indicated.",
    "Severe symptoms; invasive intervention indicated.",
    "Life-threatening consequences; urgent intervention required."
  ];
  const THROMBOEMBOLISM_DESCRIPTIONS=[
    "No thromboembolic event.",
    "Grade 1 is generally not used for clinically confirmed venous or arterial thromboembolism; use the specific CTCAE term.",
    "Medical intervention such as anticoagulation is indicated without urgent instability.",
    "Urgent medical intervention or hospital care is indicated.",
    "Life-threatening haemodynamic or neurological consequences; urgent intervention required."
  ];
  const HAEMORRHAGE_DESCRIPTIONS=[
    "No bleeding.",
    "Mild bleeding for which intervention is not indicated.",
    "Moderate bleeding requiring medical treatment or minor intervention.",
    "Severe bleeding requiring transfusion, invasive intervention or hospital care.",
    "Life-threatening bleeding; urgent intervention required."
  ];

  function reconcile00783(protocol){
    markReconciled(protocol,
      "Reconciled against NCCP 00783 Version 2a. Baseline and ongoing count thresholds, occurrence-specific FOLFOXIRI modification, component-specific bevacizumab proteinuria/hypertension pathways and major bevacizumab discontinuation criteria are represented. Full independent clinical and oncology-pharmacy validation remains pending."
    );

    upsertDefinition(protocol,"assessment_phase",{
      label:"Assessment phase",type:"select",required:false,always_show:true,
      input_role:"context",demo_value:"treatment_day",
      options:[
        {value:"baseline",label:"Baseline / before starting regimen"},
        {value:"treatment_day",label:"Ongoing Day 1 treatment"}
      ]
    });
    upsertDefinition(protocol,"count_delay_weeks",{
      label:"Current count-related delay (weeks)",type:"number",required:false,min:0,step:1,demo_value:0,input_role:"context",
      visible_when:{field:"assessment_phase",operator:"==",value:"treatment_day"}
    });
    const occurrenceOptions=[
      {value:1,label:"1st occurrence"},{value:2,label:"2nd occurrence"},{value:3,label:"3rd occurrence"}
    ];
    upsertDefinition(protocol,"anc_low_occurrence",{
      label:"Occurrence of ANC <1.5 during treatment",type:"select",required:false,demo_value:1,input_role:"context",options:occurrenceOptions,
      visible_when:{field:"assessment_phase",operator:"==",value:"treatment_day"}
    });
    upsertDefinition(protocol,"platelet_low_occurrence",{
      label:"Occurrence of platelets <75 during treatment",type:"select",required:false,demo_value:1,input_role:"context",options:occurrenceOptions,
      visible_when:{field:"assessment_phase",operator:"==",value:"treatment_day"}
    });
    upsertDefinition(protocol,"platelet_nadir_x10e9_l",{
      label:"Platelet nadir",type:"number",required:false,min:0,step:1,demo_value:150,unit:"×10⁹/L",input_role:"decision",
      visible_when:{field:"assessment_phase",operator:"==",value:"treatment_day"}
    });
    upsertDefinition(protocol,"platelet_nadir_low_occurrence",{
      label:"Occurrence of platelet nadir <50",type:"select",required:false,demo_value:1,input_role:"context",options:occurrenceOptions,
      visible_when:{field:"assessment_phase",operator:"==",value:"treatment_day"}
    });
    upsertDefinition(protocol,"proteinuria_dipstick",{
      label:"Urine protein dipstick",type:"select",required:false,demo_value:"negative",input_role:"decision",
      options:[
        {value:"negative",label:"Negative"},{value:"1+",label:"1+"},{value:"2+",label:"2+"},
        {value:"3+",label:"3+"},{value:"4+",label:"4+"}
      ]
    });
    upsertDefinition(protocol,"urine_protein_g_l",{
      label:"Laboratory urine protein",type:"number",required:false,min:0,step:0.1,demo_value:0,unit:"g/L",input_role:"decision"
    });
    upsertDefinition(protocol,"urine_protein_24h_g",{
      label:"24-hour urine total protein",type:"number",required:false,min:0,step:0.1,demo_value:0,unit:"g/24 h",input_role:"decision"
    });
    upsertDefinition(protocol,"hypertension_grade",ctcaeField(
      "Hypertension grade","hypertension",
      "Use repeated correctly measured blood-pressure readings and record baseline hypertension, medication changes, symptoms and whether urgent intervention is required.",
      HTN_DESCRIPTIONS
    ));
    upsertDefinition(protocol,"hypertension_uncontrolled_or_symptomatic",{
      label:"Uncontrolled or symptomatic hypertension on Day 1",type:"boolean",required:false,demo_value:false,input_role:"decision"
    });
    upsertDefinition(protocol,"hypertension_persisting_grade3",{
      label:"Persisting grade 3 hypertension",type:"boolean",required:false,demo_value:false,input_role:"decision"
    });
    upsertDefinition(protocol,"on_antihypertensive_treatment",{
      label:"Currently receiving antihypertensive treatment",type:"boolean",required:false,demo_value:false,input_role:"context"
    });
    upsertDefinition(protocol,"hypertension_reading_confirmed_sustained",{
      label:"Elevated blood pressure confirmed as sustained/repeated",type:"boolean",required:false,demo_value:false,input_role:"context",
      assessment_guidance:"Confirm the elevation on appropriate repeated measurements before applying the NCCP uncontrolled-hypertension definition."
    });
    // Reuse the existing 00783 blood-pressure inputs rather than creating duplicate controls.
    if(!protocol.input_definitions?.systolic_bp_mmhg){
      upsertDefinition(protocol,"systolic_bp_mmhg",{label:"Systolic blood pressure",type:"number",required:false,min:0,step:1,demo_value:120,unit:"mmHg",input_role:"decision"});
    }
    if(!protocol.input_definitions?.diastolic_bp_mmhg){
      upsertDefinition(protocol,"diastolic_bp_mmhg",{label:"Diastolic blood pressure",type:"number",required:false,min:0,step:1,demo_value:70,unit:"mmHg",input_role:"decision"});
    }
    upsertDefinition(protocol,"fistula_grade",ctcaeField(
      "Fistula grade","fistula",
      "Use the anatomical site-specific CTCAE v5.0 fistula term and assess symptoms, imaging, infection and need for invasive or urgent intervention.",
      FISTULA_DESCRIPTIONS
    ));
    upsertDefinition(protocol,"tracheoesophageal_fistula",{
      label:"Tracheoesophageal fistula",type:"boolean",required:false,demo_value:false,input_role:"decision"
    });
    upsertDefinition(protocol,"gastrointestinal_perforation",{
      label:"Gastrointestinal perforation",type:"boolean",required:false,demo_value:false,input_role:"decision"
    });
    upsertDefinition(protocol,"thromboembolic_event_grade",ctcaeField(
      "Thromboembolic event grade","thromboembolism",
      "Confirm the event and assess anticoagulation or other intervention, hospitalisation and haemodynamic or neurological instability.",
      THROMBOEMBOLISM_DESCRIPTIONS
    ));
    upsertDefinition(protocol,"haemorrhagic_event_grade",ctcaeField(
      "Haemorrhagic event grade","haemorrhage",
      "Use the site-specific CTCAE v5.0 haemorrhage term and assess intervention, transfusion, hospitalisation and haemodynamic consequences.",
      HAEMORRHAGE_DESCRIPTIONS
    ));
    if(protocol.input_definitions?.gi_perforation_or_fistula){
      protocol.input_definitions.gi_perforation_or_fistula.visible=false;
      protocol.input_definitions.gi_perforation_or_fistula.input_role="context";
    }
    if(protocol.input_definitions?.proteinuria_grade){
      protocol.input_definitions.proteinuria_grade.visible=false;
      protocol.input_definitions.proteinuria_grade.input_role="context";
    }

    removeRules(protocol,[
      "ANC_BELOW_SAFE_TREATMENT_RANGE","PLATELETS_BELOW_SAFE_TREATMENT_RANGE","PROTEINURIA_GRADE_2_PLUS",
      "UNCONTROLLED_HYPERTENSION","GI_PERFORATION_OR_FISTULA",
      "FOLFOXIRI_BASELINE_COUNTS","FOLFOXIRI_TREATMENT_COUNTS","FOLFOXIRI_DELAY_2W",
      "FOLFOXIRI_ANC_OCC1","FOLFOXIRI_ANC_OCC2","FOLFOXIRI_ANC_OCC3",
      "FOLFOXIRI_PLT_OCC1","FOLFOXIRI_PLT_OCC2","FOLFOXIRI_PLT_OCC3",
      "FOLFOXIRI_NADIR_OCC1","FOLFOXIRI_NADIR_OCC2","FOLFOXIRI_NADIR_OCC3",
      "BEV_PROTEIN_LOW","BEV_URINE_LT1","BEV_PROTEIN_2_3","BEV_PROTEIN_4",
      "BEV_24H_LE2","BEV_24H_2_4","BEV_24H_GT4",
      "BEV_HTN_DAY1","BEV_HTN_UNCONTROLLED_NUMERIC","BEV_HTN_G2_3","BEV_HTN_G4_PERSIST3",
      "BEV_TE_G4","BEV_TEV_G4","BEV_HAEM_G3","BEV_GI_PERF"
    ]);

    addRules(protocol,[
      {
        id:"FOLFOXIRI_BASELINE_COUNTS",priority:10,
        when:{all:[
          {field:"assessment_phase",operator:"==",value:"baseline"},
          {any:[{field:"anc_x10e9_l",operator:"<",value:1.5},{field:"platelets_x10e9_l",operator:"<",value:100}]}
        ]},
        action:action("contraindicated",["whole_regimen"],
          "Baseline neutrophils <1.5 ×10⁹/L and/or platelets <100 ×10⁹/L are listed as exclusions."),
        source:source(2),explanation:"Baseline thresholds are separated from ongoing Day 1 treatment thresholds."
      },
      {
        id:"FOLFOXIRI_TREATMENT_COUNTS",priority:9,
        when:{all:[
          {field:"assessment_phase",operator:"==",value:"treatment_day"},
          {any:[{field:"anc_x10e9_l",operator:"<",value:1.5},{field:"platelets_x10e9_l",operator:"<",value:75}]}
        ]},
        action:action("delay",["whole_regimen"],
          "Do not administer on Day 1; delay 1–2 weeks and reassess counts."),
        source:source(4),explanation:"Ongoing treatment requires ANC ≥1.5 ×10⁹/L and platelets ≥75 ×10⁹/L."
      },
      {
        id:"FOLFOXIRI_DELAY_2W",priority:8,
        when:{all:[
          {field:"assessment_phase",operator:"==",value:"treatment_day"},
          {field:"count_delay_weeks",operator:">=",value:2},
          {any:[{field:"anc_x10e9_l",operator:"<",value:1.5},{field:"platelets_x10e9_l",operator:"<",value:75}]}
        ]},
        action:action("consultant_review",["whole_regimen"],
          "Counts have not recovered after two weeks. NCCP states that discontinuation should be considered; consultant decision required."),
        source:source(4),explanation:"The source says consider discontinuation after two weeks without count recovery rather than mandating automatic discontinuation."
      },
      {
        id:"FOLFOXIRI_ANC_OCC1",priority:7,
        when:{all:[{field:"assessment_phase",operator:"==",value:"treatment_day"},{field:"anc_x10e9_l",operator:"<",value:1.5},{field:"anc_low_occurrence",operator:"==",value:1}]},
        action:action("dose_reduce",["irinotecan","5-fluorouracil"],
          "After recovery: irinotecan 150 mg/m², maintain full-dose oxaliplatin and use 5-FU at 75% of the original dose."),
        source:source(4,"Table 1"),explanation:"First occurrence ANC <1.5 subsequent-dose pathway."
      },
      {
        id:"FOLFOXIRI_ANC_OCC2",priority:7,
        when:{all:[{field:"assessment_phase",operator:"==",value:"treatment_day"},{field:"anc_x10e9_l",operator:"<",value:1.5},{field:"anc_low_occurrence",operator:"==",value:2}]},
        action:action("dose_reduce",["irinotecan","oxaliplatin","5-fluorouracil"],
          "After recovery: maintain irinotecan 150 mg/m², reduce oxaliplatin to 60 mg/m² and use 5-FU at 50% of the original dose."),
        source:source(4,"Table 1"),explanation:"Second occurrence ANC <1.5 subsequent-dose pathway."
      },
      {
        id:"FOLFOXIRI_ANC_OCC3",priority:10,
        when:{all:[{field:"assessment_phase",operator:"==",value:"treatment_day"},{field:"anc_x10e9_l",operator:"<",value:1.5},{field:"anc_low_occurrence",operator:"==",value:3}]},
        action:action("discontinue",["whole_regimen"],
          "Discontinue treatment at the third occurrence of ANC <1.5 ×10⁹/L under the NCCP table."),
        source:source(4,"Table 1"),explanation:"Third occurrence ANC pathway."
      },
      {
        id:"FOLFOXIRI_PLT_OCC1",priority:7,
        when:{all:[{field:"assessment_phase",operator:"==",value:"treatment_day"},{field:"platelets_x10e9_l",operator:"<",value:75},{field:"platelet_low_occurrence",operator:"==",value:1}]},
        action:action("dose_reduce",["oxaliplatin","5-fluorouracil"],
          "After recovery: maintain full-dose irinotecan, reduce oxaliplatin to 60 mg/m² and use 5-FU at 75% of the original dose."),
        source:source(4,"Table 2"),explanation:"First occurrence platelet <75 subsequent-dose pathway."
      },
      {
        id:"FOLFOXIRI_PLT_OCC2",priority:7,
        when:{all:[{field:"assessment_phase",operator:"==",value:"treatment_day"},{field:"platelets_x10e9_l",operator:"<",value:75},{field:"platelet_low_occurrence",operator:"==",value:2}]},
        action:action("dose_reduce",["irinotecan","oxaliplatin","5-fluorouracil"],
          "After recovery: irinotecan 150 mg/m², maintain oxaliplatin at 60 mg/m² and use 5-FU at 50% of the original dose."),
        source:source(4,"Table 2"),explanation:"Second occurrence platelet <75 subsequent-dose pathway."
      },
      {
        id:"FOLFOXIRI_PLT_OCC3",priority:10,
        when:{all:[{field:"assessment_phase",operator:"==",value:"treatment_day"},{field:"platelets_x10e9_l",operator:"<",value:75},{field:"platelet_low_occurrence",operator:"==",value:3}]},
        action:action("discontinue",["whole_regimen"],
          "Discontinue treatment at the third occurrence of platelets <75 ×10⁹/L under the NCCP table."),
        source:source(4,"Table 2"),explanation:"Third occurrence platelet pathway."
      },
      {
        id:"FOLFOXIRI_NADIR_OCC1",priority:7,
        when:{all:[{field:"assessment_phase",operator:"==",value:"treatment_day"},{field:"platelet_nadir_x10e9_l",operator:"<",value:50},{field:"platelet_nadir_low_occurrence",operator:"==",value:1}]},
        action:action("dose_reduce",["oxaliplatin","5-fluorouracil"],
          "For first platelet nadir <50: maintain full-dose irinotecan, reduce oxaliplatin to 60 mg/m² and use 5-FU at 75%."),
        source:source(4,"Table 3"),explanation:"First low-nadir platelet occurrence pathway."
      },
      {
        id:"FOLFOXIRI_NADIR_OCC2",priority:7,
        when:{all:[{field:"assessment_phase",operator:"==",value:"treatment_day"},{field:"platelet_nadir_x10e9_l",operator:"<",value:50},{field:"platelet_nadir_low_occurrence",operator:"==",value:2}]},
        action:action("dose_reduce",["irinotecan","oxaliplatin","5-fluorouracil"],
          "For second platelet nadir <50: irinotecan 150 mg/m², maintain oxaliplatin at 60 mg/m² and use 5-FU at 50%."),
        source:source(4,"Table 3"),explanation:"Second low-nadir platelet occurrence pathway."
      },
      {
        id:"FOLFOXIRI_NADIR_OCC3",priority:10,
        when:{all:[{field:"assessment_phase",operator:"==",value:"treatment_day"},{field:"platelet_nadir_x10e9_l",operator:"<",value:50},{field:"platelet_nadir_low_occurrence",operator:"==",value:3}]},
        action:action("discontinue",["whole_regimen"],
          "Discontinue treatment at the third platelet nadir <50 ×10⁹/L occurrence."),
        source:source(4,"Table 3"),explanation:"Third low-nadir platelet occurrence pathway."
      },
      {
        id:"BEV_PROTEIN_LOW",priority:2,
        when:{field:"proteinuria_dipstick",operator:"in",value:["negative","1+"]},
        action:action("proceed",["bevacizumab"],"Administer bevacizumab as scheduled under the proteinuria pathway."),
        source:source(6,"Table 6"),explanation:"Negative/1+ dipstick does not trigger a bevacizumab hold."
      },
      {
        id:"BEV_URINE_LT1",priority:2,
        when:{field:"urine_protein_g_l",operator:"<",value:1},
        action:action("proceed",["bevacizumab"],"Administer bevacizumab as scheduled under the proteinuria pathway."),
        source:source(6,"Table 6"),explanation:"Laboratory urine protein below 1 g/L does not trigger quantification/holding."
      },
      {
        id:"BEV_PROTEIN_2_3",priority:6,
        when:{any:[
          {field:"proteinuria_dipstick",operator:"in",value:["2+","3+"]},
          {field:"urine_protein_g_l",operator:">=",value:1}
        ]},
        action:action("proceed_with_caution",["bevacizumab"],
          "Administer bevacizumab as scheduled and obtain 24-hour urine protein within 3 days before the next scheduled dose."),
        source:source(6,"Table 6"),explanation:"2+/3+ dipstick or ≥1 g/L triggers quantification, not automatic withholding."
      },
      {
        id:"BEV_PROTEIN_4",priority:9,
        when:{field:"proteinuria_dipstick",operator:"==",value:"4+"},
        action:action("withhold",["bevacizumab"],"Withhold bevacizumab and obtain a 24-hour urine total protein measurement."),
        source:source(6,"Table 6"),explanation:"4+ dipstick triggers withholding pending 24-hour quantification."
      },
      {
        id:"BEV_24H_LE2",priority:2,
        when:{field:"urine_protein_24h_g",operator:"<=",value:2},
        action:action("proceed",["bevacizumab"],"24-hour urine protein is ≤2 g; bevacizumab may proceed under the NCCP proteinuria pathway."),
        source:source(6,"Table 6"),explanation:"The source allows treatment at or below 2 g/24 h."
      },
      {
        id:"BEV_24H_2_4",priority:9,
        when:{all:[{field:"urine_protein_24h_g",operator:">",value:2},{field:"urine_protein_24h_g",operator:"<=",value:4}]},
        action:action("withhold",["bevacizumab"],
          "Hold bevacizumab; repeat 24-hour urine every 2 weeks and resume when protein is ≤2 g/24 h."),
        source:source(6,"Table 6"),explanation:"24-hour urine >2 to 4 g requires a hold-and-recheck pathway."
      },
      {
        id:"BEV_24H_GT4",priority:10,
        when:{field:"urine_protein_24h_g",operator:">",value:4},
        action:action("discontinue",["bevacizumab"],"Discontinue bevacizumab for 24-hour urine protein >4 g/24 h."),
        source:source(6,"Table 6"),explanation:"24-hour protein >4 g is the protocol discontinuation threshold."
      },
      {
        id:"BEV_HTN_DAY1",priority:9,
        when:{field:"hypertension_uncontrolled_or_symptomatic",operator:"==",value:true},
        action:action("withhold",["bevacizumab"],"Withhold bevacizumab and initiate or adjust antihypertensive therapy."),
        source:source(7,"Table 7"),explanation:"Uncontrolled or symptomatic hypertension on Day 1 requires withholding."
      },
      {
        id:"BEV_HTN_UNCONTROLLED_NUMERIC",priority:9,
        when:{all:[
          {field:"on_antihypertensive_treatment",operator:"==",value:true},
          {field:"hypertension_reading_confirmed_sustained",operator:"==",value:true},
          {any:[
            {field:"systolic_bp_mmhg",operator:">",value:150},
            {field:"diastolic_bp_mmhg",operator:">",value:100}
          ]}
        ]},
        action:action("withhold",["bevacizumab"],
          "Blood pressure remains above the NCCP uncontrolled-hypertension threshold despite antihypertensive treatment; withhold bevacizumab and optimise control."),
        source:source(7,"Table 7"),explanation:"The source describes uncontrolled hypertension as sustained >150/100 mmHg while receiving antihypertensive treatment; the runtime rule requires repeated/sustained elevation to be confirmed."
      },
      {
        id:"BEV_HTN_G2_3",priority:7,
        when:{field:"hypertension_grade",operator:"in",value:[2,3]},
        action:action("consultant_review",["bevacizumab"],
          "Initiate/optimise antihypertensive therapy and consider interrupting bevacizumab until controlled."),
        source:source(7,"Table 7"),explanation:"For grade 2–3 hypertension the source permits clinical judgement regarding interruption."
      },
      {
        id:"BEV_HTN_G4_PERSIST3",priority:10,
        when:{any:[
          {field:"hypertension_grade",operator:">=",value:4},
          {field:"hypertension_persisting_grade3",operator:"==",value:true}
        ]},
        action:action("discontinue",["bevacizumab"],"Discontinue bevacizumab for grade 4 or persisting grade 3 hypertension."),
        source:source(7,"Table 7"),explanation:"Protocol discontinuation criterion."
      },
      {
        id:"BEV_TE_G4",priority:10,
        when:{any:[
          {field:"tracheoesophageal_fistula",operator:"==",value:true},
          {field:"fistula_grade",operator:">=",value:4}
        ]},
        action:action("discontinue",["bevacizumab"],"Discontinue bevacizumab for tracheoesophageal fistula or any grade 4 fistula."),
        source:source(7,"Table 7"),explanation:"Protocol discontinuation criterion."
      },
      {
        id:"BEV_TEV_G4",priority:10,
        when:{field:"thromboembolic_event_grade",operator:">=",value:4},
        action:action("discontinue",["bevacizumab"],"Discontinue bevacizumab for grade 4 thromboembolic events."),
        source:source(7,"Table 7"),explanation:"Protocol discontinuation criterion."
      },
      {
        id:"BEV_HAEM_G3",priority:10,
        when:{field:"haemorrhagic_event_grade",operator:">=",value:3},
        action:action("discontinue",["bevacizumab"],"Discontinue bevacizumab for a haemorrhagic event grade ≥3."),
        source:source(7,"Table 7"),explanation:"Protocol discontinuation criterion."
      },
      {
        id:"BEV_GI_PERF",priority:10,
        when:{field:"gastrointestinal_perforation",operator:"==",value:true},
        action:action("discontinue",["bevacizumab"],"Discontinue bevacizumab for gastrointestinal perforation."),
        source:source(7,"Table 7"),explanation:"NCCP permanently discontinues bevacizumab for gastrointestinal perforation."
      }
    ]);

    protocol.supportive_care=protocol.supportive_care||{};
    Object.assign(protocol.supportive_care,{
      emetogenic_risk:"high",
      script_id:"nccp-parenteral-high",
      mapping_source:"NCCP Regimen 00783 Version 2a and NCCP SACT Antiemetic Guidance V6 (2025)",
      mapping_basis:"NCCP 00783 Version 2a states that this regimen poses an overall high risk of emesis.",
      mapping_confidence:"high",
      supportive_medications_label:"NCCP antiemetic guidance for high emetogenic risk"
    });
    return protocol;
  }

  function apply(protocol){
    const code=String(protocol?.metadata?.nccp_regimen_code||"").padStart(5,"0");
    if(code==="00101") return reconcile00101(protocol);
    if(code==="00256") return reconcile00256(protocol);
    if(code==="00783") return reconcile00783(protocol);
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
    const maturity=card.querySelector(".encoding-maturity");
    if(maturity) maturity.textContent=protocol?.metadata?.encoding_maturity?.label||maturity.textContent;
    if(String(protocol?.metadata?.nccp_regimen_code)==="00783"){
      const risk=card.querySelector(".emetogenic-badge");
      const markup=root.SACTCheckEmetogenicRisk?.badge?.(protocol);
      if(risk&&markup) risk.outerHTML=markup;
    }
  }

  function applyLoadedRecords(records){
    let count=0;
    for(const record of asArray(records)){
      const protocol=record?.protocol||record;
      const code=String(protocol?.metadata?.nccp_regimen_code||"").padStart(5,"0");
      if(!["00101","00256","00783"].includes(code)) continue;
      apply(protocol);
      const validation=validatePatched(protocol);
      if(validation?.valid===false){
        console.error(`SACTCheck v${RELEASE} reconciliation validation failed for ${code}`,validation);
        continue;
      }
      refreshCard(protocol);
      count++;
    }
    if(count&&root?.dispatchEvent&&typeof root.CustomEvent==="function"){
      root.dispatchEvent(new root.CustomEvent("sactcheck:v0700-source-reconciled",{detail:{release:RELEASE,count}}));
    }
    return count;
  }

  function upsert(list,key,item){
    const values=asArray(list);
    const index=values.findIndex(value=>String(value?.[key])===String(item?.[key]));
    if(index>=0) values[index]=item; else values.push(item);
    return values;
  }
  function mergeKnowledgePayload(payload,addendum){
    if(!payload||!addendum) return payload;
    payload.drug_profiles=payload.drug_profiles||[];
    payload.regimen_profiles=payload.regimen_profiles||[];
    payload.evidence_records=payload.evidence_records||[];
    for(const item of asArray(addendum.drug_profiles)) upsert(payload.drug_profiles,"id",item);
    for(const item of asArray(addendum.regimen_profiles)) upsert(payload.regimen_profiles,"protocol_id",item);
    for(const item of asArray(addendum.evidence_records)) upsert(payload.evidence_records,"evidence_id",item);
    payload.addenda=asArray(payload.addenda).filter(item=>item?.release!==RELEASE);
    payload.addenda.push({
      release:RELEASE,
      source_checked_date:addendum.source_checked_date||SOURCE_CHECKED_DATE,
      regimen_profiles:asArray(addendum.regimen_profiles).length,
      evidence_records:asArray(addendum.evidence_records).length
    });
    return payload;
  }

  async function loadKnowledgeAddendum(){
    if(typeof fetch!=="function"||!root?.SACTCheckRegimenKnowledgeBase?.load) return null;
    try{
      const [payload,response]=await Promise.all([
        root.SACTCheckRegimenKnowledgeBase.load(),
        fetch(KNOWLEDGE_ADDENDUM_URL,{cache:"no-store"})
      ]);
      if(!response.ok) throw new Error(`HTTP ${response.status}`);
      const addendum=await response.json();
      mergeKnowledgePayload(payload,addendum);
      if(root?.dispatchEvent&&typeof root.CustomEvent==="function"){
        root.dispatchEvent(new root.CustomEvent("sactcheck:v0700-knowledge-ready",{detail:{release:RELEASE}}));
      }
      return addendum;
    }catch(error){
      console.warn(`SACTCheck v${RELEASE} knowledge addendum could not be loaded; the clinical assessment engine remains available.`,error);
      return null;
    }
  }

  function install(){
    if(!root?.document||root.document.documentElement?.dataset?.v0700ReconciliationInstalled==="true") return;
    root.document.documentElement.dataset.v0700ReconciliationInstalled="true";

    const applyNow=()=>applyLoadedRecords(root.SACTCheckProtocolLoader?.getLoadedProtocols?.()||root.SACTCHECK_PROTOCOLS||[]);
    root.addEventListener?.("sactcheck:protocols-loaded",event=>{
      applyLoadedRecords(event?.detail?.protocols||root.SACTCheckProtocolLoader?.getLoadedProtocols?.()||[]);
    });
    applyNow();
    loadKnowledgeAddendum();
  }

  return Object.freeze({
    version:RELEASE,
    sourceCheckedDate:SOURCE_CHECKED_DATE,
    apply,
    applyLoadedRecords,
    mergeKnowledgePayload,
    loadKnowledgeAddendum,
    install
  });
});
