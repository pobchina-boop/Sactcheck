/**
 * CTCAE v5.0 grading support for SACTCheck.
 *
 * The library provides toxicity-specific, practical grading summaries beside
 * grade controls. It does not infer causality and it does not replace use of
 * the named CTCAE term, the current NCCP protocol or senior clinical review.
 */
(function (root) {
  "use strict";

  const SOURCE_URL = "https://dctd.cancer.gov/research/ctep-trials/for-sites/adverse-events/ctcae-v5-5x7.pdf";

  const GENERIC = Object.freeze({
    0: "No adverse event.",
    1: "Mild or asymptomatic; clinical observation only and intervention generally not indicated.",
    2: "Moderate; minimal, local or non-invasive intervention may be indicated; may limit instrumental activities of daily living.",
    3: "Severe or medically significant but not immediately life-threatening; hospital care may be indicated; limits self-care activities of daily living.",
    4: "Life-threatening consequences; urgent intervention required.",
    5: "Death related to the adverse event."
  });

  const SETS = Object.freeze({
    generic: GENERIC,
    neuropathy: Object.freeze({
      0: "No peripheral sensory or motor neuropathy.",
      1: "Asymptomatic; clinical or diagnostic observations only. CTCAE v5.0 grades symptomatic paraesthesia separately when that is the more accurate term.",
      2: "Moderate symptoms that limit instrumental activities of daily living.",
      3: "Severe symptoms that limit self-care activities of daily living.",
      4: "Life-threatening neurological consequences; urgent intervention required.",
      5: "Death related to neuropathy."
    }),
    diarrhoea: Object.freeze({
      0: "No increase above the patient's usual stool frequency or ostomy output.",
      1: "Increase of fewer than 4 stools per day above baseline, or mild increase in ostomy output.",
      2: "Increase of 4–6 stools per day above baseline, or moderate increase in ostomy output; limits instrumental activities of daily living.",
      3: "Increase of 7 or more stools per day above baseline, incontinence, hospital care indicated, or severe ostomy-output increase; limits self-care activities of daily living.",
      4: "Life-threatening consequences; urgent intervention required.",
      5: "Death related to diarrhoea."
    }),
    diarrhoea_or_colitis: Object.freeze({
      0: "Neither diarrhoea nor colitis is present.",
      1: "Diarrhoea: fewer than 4 stools/day above baseline or mild ostomy-output increase. Colitis: asymptomatic, clinical/diagnostic observations only.",
      2: "Diarrhoea: 4-6 stools/day above baseline or moderate ostomy-output increase; limits instrumental ADL. Colitis: abdominal pain or mucus/blood in stool.",
      3: "Diarrhoea: at least 7 stools/day above baseline, incontinence, hospitalisation or severe ostomy-output increase; limits self-care ADL. Colitis: severe abdominal pain or peritoneal signs.",
      4: "Life-threatening diarrhoea or colitis; urgent intervention required.",
      5: "Death related to diarrhoea or colitis."
    }),
    mucositis: Object.freeze({
      0: "No oral mucositis.",
      1: "Asymptomatic or mild symptoms; intervention not indicated.",
      2: "Moderate pain or ulceration that does not interfere with oral intake; modified diet indicated.",
      3: "Severe pain that interferes with oral intake.",
      4: "Life-threatening consequences; urgent intervention required.",
      5: "Death related to oral mucositis."
    }),
    mucositis_or_diarrhoea: Object.freeze({
      0: "Neither oral mucositis nor diarrhoea is present.",
      1: "Mucositis: asymptomatic or mild symptoms, intervention not indicated. Diarrhoea: fewer than 4 stools/day above baseline or mild ostomy-output increase.",
      2: "Mucositis: moderate pain/ulceration without interference with oral intake; modified diet indicated. Diarrhoea: 4-6 stools/day above baseline or moderate ostomy-output increase; limits instrumental ADL.",
      3: "Mucositis: severe pain interfering with oral intake. Diarrhoea: at least 7 stools/day above baseline, incontinence, hospital care indicated or severe ostomy-output increase; limits self-care ADL.",
      4: "Life-threatening mucositis or diarrhoea; urgent intervention required.",
      5: "Death related to mucositis or diarrhoea."
    }),
    pneumonitis: Object.freeze({
      0: "No pneumonitis.",
      1: "Asymptomatic; clinical or diagnostic observations only; intervention not indicated.",
      2: "Symptomatic; medical intervention indicated; limits instrumental activities of daily living.",
      3: "Severe symptoms; oxygen indicated; limits self-care activities of daily living.",
      4: "Life-threatening respiratory compromise; urgent intervention such as ventilatory support required.",
      5: "Death related to pneumonitis."
    }),
    rash: Object.freeze({
      0: "No rash. Use the most specific CTCAE skin term when a rash is present.",
      1: "For maculopapular rash: under 10% body-surface area, with or without symptoms such as itch, burning or tightness.",
      2: "For maculopapular rash: 10–30% body-surface area, or rash limiting instrumental activities of daily living.",
      3: "For maculopapular rash: over 30% body-surface area with moderate/severe symptoms, or limitation of self-care activities of daily living.",
      4: "Grade 4 is not defined for uncomplicated maculopapular rash; use the appropriate severe cutaneous-reaction term if life-threatening features are present.",
      5: "Grade 5 is not defined for uncomplicated maculopapular rash; use the appropriate severe cutaneous-reaction term."
    }),
    rash_acneiform: Object.freeze({
      0: "No acneiform rash.",
      1: "Papules/pustules covering under 10% body-surface area, with or without pruritus or tenderness.",
      2: "Papules/pustules covering 10-30% body-surface area with or without symptoms and psychosocial/instrumental-ADL impact, or over 30% with mild symptoms.",
      3: "Papules/pustules covering over 30% body-surface area with moderate/severe symptoms, limiting self-care ADL, or local superinfection requiring oral antibiotics.",
      4: "Life-threatening consequences, or extensive superinfection requiring IV antibiotics.",
      5: "Death related to acneiform rash."
    }),
    infusion: Object.freeze({
      0: "No infusion-related or hypersensitivity reaction.",
      1: "Mild transient reaction; interruption of the infusion is not indicated; intervention not indicated.",
      2: "Infusion interruption or treatment is indicated, with prompt response to symptomatic medication; prophylaxis may be needed for 24 hours or less.",
      3: "Prolonged symptoms not rapidly responsive to treatment/brief interruption, or recurrence after initial improvement; hospitalisation indicated for clinical sequelae.",
      4: "Life-threatening consequences; urgent intervention required.",
      5: "Death related to the reaction."
    }),
    allergic_reaction: Object.freeze({
      0: "No allergic reaction.",
      1: "Systemic intervention is not indicated.",
      2: "Oral intervention is indicated.",
      3: "Bronchospasm, hospitalisation for clinical sequelae, or IV intervention is indicated.",
      4: "Life-threatening consequences; urgent intervention required.",
      5: "Death related to allergic reaction."
    }),
    hypersensitivity_anaphylaxis: Object.freeze({
      0: "No hypersensitivity or anaphylaxis.",
      1: "Mild hypersensitivity for which systemic intervention is not indicated; anaphylaxis has no Grade 1 criterion.",
      2: "Oral intervention indicated for allergic/hypersensitivity symptoms; anaphylaxis has no Grade 2 criterion.",
      3: "Bronchospasm, urticaria with systemic features, angioedema or hypotension requiring parenteral intervention and/or hospitalisation.",
      4: "Life-threatening airway or haemodynamic consequences; urgent intervention required.",
      5: "Death related to hypersensitivity/anaphylaxis."
    }),
    hypertension: Object.freeze({
      0: "No treatment-emergent hypertension.",
      1: "Pre-hypertension range or transient mild elevation; no antihypertensive treatment indicated.",
      2: "Persistent or recurrent elevation requiring initiation or adjustment of one antihypertensive agent; generally 140–159/90–99 mmHg in adults.",
      3: "Severe elevation requiring more than one drug or more intensive treatment; generally at least 160 systolic or 100 diastolic in adults.",
      4: "Life-threatening consequences such as hypertensive crisis; urgent intervention required.",
      5: "Death related to hypertension."
    }),
    proteinuria: Object.freeze({
      0: "No proteinuria.",
      1: "Dipstick 1+ or protein below 1.0 g per 24 hours.",
      2: "Dipstick 2+ or 3+, or protein 1.0 to under 3.5 g per 24 hours.",
      3: "Protein 3.5 g or more per 24 hours or dipstick 4+; quantify according to the protocol.",
      4: "Grade 4 is not defined under the CTCAE proteinuria term; use the appropriate renal-disorder term for life-threatening renal consequences.",
      5: "Grade 5 is not defined under the CTCAE proteinuria term."
    }),
    haemorrhage: Object.freeze({
      0: "No bleeding. Select the anatomical site-specific CTCAE haemorrhage term.",
      1: "Mild bleeding for which intervention is not indicated.",
      2: "Moderate bleeding requiring medical treatment or minor intervention.",
      3: "Severe bleeding requiring transfusion, invasive intervention or hospital care.",
      4: "Life-threatening bleeding with urgent intervention required.",
      5: "Death related to haemorrhage."
    }),
    infection: Object.freeze({
      0: "No infection. Select the anatomical site-specific CTCAE infection term.",
      1: "Localised infection requiring local treatment only.",
      2: "Oral or non-invasive systemic antimicrobial treatment indicated.",
      3: "IV antimicrobial treatment, invasive intervention or hospital care indicated.",
      4: "Life-threatening infection; urgent intervention required.",
      5: "Death related to infection."
    }),
    ppe: Object.freeze({
      0: "No palmar–plantar erythrodysesthesia.",
      1: "Minimal skin changes or dermatitis, such as erythema, oedema or hyperkeratosis, without pain.",
      2: "Painful skin changes, including peeling, blisters, bleeding, fissures, oedema or hyperkeratosis; limits instrumental activities of daily living.",
      3: "Severe painful skin changes; limits self-care activities of daily living.",
      4: "Grade 4 is not defined under the CTCAE palmar–plantar erythrodysesthesia term; use another term for life-threatening complications.",
      5: "Grade 5 is not defined under the CTCAE palmar–plantar erythrodysesthesia term."
    }),
    hfsr: Object.freeze({
      0: "No hand–foot skin reaction.",
      1: "Minimal skin changes without pain.",
      2: "Painful skin changes that limit instrumental activities of daily living.",
      3: "Severe painful skin changes that limit self-care activities of daily living.",
      4: "Grade 4 is not defined under the standard hand–foot skin-reaction term; use the appropriate complication term.",
      5: "Grade 5 is not defined under the standard hand–foot skin-reaction term."
    }),
    fistula: Object.freeze({
      0: "No fistula. Use the anatomical site-specific CTCAE fistula term.",
      1: "Asymptomatic; clinical or diagnostic observations only.",
      2: "Symptomatic; non-invasive intervention indicated.",
      3: "Severe symptoms; invasive intervention indicated.",
      4: "Life-threatening consequences; urgent intervention required.",
      5: "Death related to fistula."
    }),
    thromboembolism: Object.freeze({
      0: "No thromboembolic event.",
      1: "Grade 1 is generally not used for clinically confirmed venous or arterial thromboembolism; use the specific CTCAE term.",
      2: "Medical intervention such as anticoagulation is indicated without urgent instability.",
      3: "Urgent medical intervention or hospital care is indicated.",
      4: "Life-threatening haemodynamic or neurological consequences; urgent intervention required.",
      5: "Death related to thromboembolism."
    }),
    febrile_neutropenia: Object.freeze({
      0: "No febrile neutropenia.",
      1: "Grade 1 is not defined for febrile neutropenia.",
      2: "Grade 2 is not defined for febrile neutropenia.",
      3: "ANC below 1.0 ×10⁹/L with either a single temperature above 38.3°C or at least 38.0°C sustained for more than one hour.",
      4: "Life-threatening consequences; urgent intervention required.",
      5: "Death related to febrile neutropenia."
    }),
    hepatic_alt_ast: Object.freeze({
      0: "ALT/AST within the applicable reference range or without a treatment-emergent increase.",
      1: "If baseline normal: above ULN to 3 ×ULN. If baseline abnormal: 1.5 to 3 × baseline.",
      2: "If baseline normal: above 3 to 5 ×ULN. If baseline abnormal: above 3 to 5 × baseline.",
      3: "If baseline normal: above 5 to 20 ×ULN. If baseline abnormal: above 5 to 20 × baseline.",
      4: "If baseline normal: above 20 ×ULN. If baseline abnormal: above 20 × baseline.",
      5: "Death related to hepatic injury is graded under the appropriate clinical term."
    }),
    hepatic_bilirubin: Object.freeze({
      0: "Bilirubin within the applicable reference range or without a treatment-emergent increase.",
      1: "If baseline normal: above ULN to 1.5 ×ULN. If baseline abnormal: above 1.0 to 1.5 × baseline.",
      2: "If baseline normal: above 1.5 to 3 ×ULN. If baseline abnormal: above 1.5 to 3 × baseline.",
      3: "If baseline normal: above 3 to 10 ×ULN. If baseline abnormal: above 3 to 10 × baseline.",
      4: "If baseline normal: above 10 ×ULN. If baseline abnormal: above 10 × baseline.",
      5: "Death related to hepatic injury is graded under the appropriate clinical term."
    }),
    hypomagnesaemia: Object.freeze({
      0: "Serum magnesium at or above the local lower limit of normal.",
      1: "Below the lower limit of normal to 0.5 mmol/L.",
      2: "Below 0.5 to 0.4 mmol/L.",
      3: "Below 0.4 to 0.3 mmol/L.",
      4: "Below 0.3 mmol/L or life-threatening consequences.",
      5: "Death related to hypomagnesaemia."
    }),
    electrolyte: Object.freeze({
      0: "No electrolyte abnormality. Use the named CTCAE laboratory term and local reference range.",
      1: "Mild laboratory abnormality according to the named electrolyte term.",
      2: "Moderate laboratory abnormality or replacement indicated according to the named term.",
      3: "Severe abnormality, symptoms or hospital-level treatment according to the named term.",
      4: "Life-threatening consequences; urgent intervention required.",
      5: "Death related to the electrolyte disturbance."
    }),
    cardiac: Object.freeze({
      0: "No cardiac adverse event. Use the named CTCAE cardiac term.",
      1: "Mild or asymptomatic finding under the named cardiac term.",
      2: "Moderate symptoms or medical intervention indicated.",
      3: "Severe symptoms; hospital care or intensive treatment indicated.",
      4: "Life-threatening cardiac compromise; urgent intervention required.",
      5: "Death related to the cardiac event."
    }),
    myocarditis: Object.freeze({
      0: "No myocarditis.",
      1: "Grade 1 is not defined for CTCAE v5.0 myocarditis.",
      2: "Symptoms with moderate activity or exertion.",
      3: "Severe symptoms at rest or with minimal activity/exertion; intervention indicated; new onset of symptoms.",
      4: "Life-threatening consequences; urgent intervention such as continuous IV therapy or mechanical haemodynamic support indicated.",
      5: "Death related to myocarditis."
    }),
    neurological: Object.freeze({
      0: "No neurological adverse event. Use the named CTCAE neurological term.",
      1: "Mild symptoms without functional limitation.",
      2: "Moderate symptoms limiting instrumental activities of daily living.",
      3: "Severe symptoms limiting self-care activities of daily living or requiring hospital care.",
      4: "Life-threatening neurological compromise; urgent intervention required.",
      5: "Death related to the neurological event."
    }),
    encephalitis: Object.freeze({
      0: "No encephalitic/encephalopathic neurological toxicity.",
      1: "Mild symptoms. CTCAE v5.0 does not provide one universal immune-encephalitis term; select the most appropriate named neurological criterion.",
      2: "Moderate symptoms limiting instrumental activities of daily living.",
      3: "Severe symptoms limiting self-care activities of daily living, or severe mental-status change, seizure or focal neurological abnormality requiring hospital-level assessment.",
      4: "Life-threatening neurological consequences; urgent intervention required.",
      5: "Death related to the neurological event."
    }),
    guillain_barre: Object.freeze({
      0: "No Guillain-Barre syndrome.",
      1: "Mild symptoms.",
      2: "Moderate symptoms limiting instrumental activities of daily living.",
      3: "Severe symptoms limiting self-care activities of daily living.",
      4: "Life-threatening consequences; urgent intervention indicated, including intubation where required.",
      5: "Death related to Guillain-Barre syndrome."
    }),
    myositis: Object.freeze({
      0: "No myositis.",
      1: "Mild muscle pain.",
      2: "Moderate pain associated with weakness; pain limits instrumental activities of daily living.",
      3: "Pain associated with severe weakness; limits self-care activities of daily living.",
      4: "Life-threatening consequences; urgent intervention required.",
      5: "Grade 5 is not defined for the CTCAE v5.0 myositis term."
    }),
    serious_neurological: Object.freeze({
      0: "No serious neurological adverse event.",
      1: "Mild symptoms under the named CTCAE neurological term.",
      2: "Moderate symptoms limiting instrumental activities of daily living under the named term.",
      3: "Severe symptoms limiting self-care activities of daily living or requiring hospital care under the named term.",
      4: "Life-threatening neurological consequences; urgent intervention required.",
      5: "Death related to the named neurological adverse event."
    }),
    pancreatitis: Object.freeze({
      0: "No pancreatitis.",
      1: "Grade 1 is not defined for CTCAE pancreatitis.",
      2: "Enzyme elevation or imaging findings only, without significant symptoms.",
      3: "Severe pain or vomiting requiring medical intervention.",
      4: "Life-threatening consequences; urgent intervention required.",
      5: "Death related to pancreatitis."
    }),
    pericardial: Object.freeze({
      0: "No pericardial adverse event. Use the named CTCAE pericardial term.",
      1: "For pericarditis: asymptomatic ECG or physical findings consistent with pericarditis. Pericardial effusion has no Grade 1 criterion.",
      2: "Symptomatic pericarditis (for example chest pain), or asymptomatic small-to-moderate pericardial effusion.",
      3: "Pericarditis or effusion with physiological consequences, such as constriction or clinically significant haemodynamic effects.",
      4: "Life-threatening consequences, including tamponade physiology; urgent intervention required.",
      5: "Death related to the pericardial event."
    }),
    constipation: Object.freeze({
      0: "No constipation above baseline.",
      1: "Occasional or intermittent symptoms; occasional stool softener, laxative, diet change or enema may be used.",
      2: "Persistent symptoms requiring regular laxatives or enemas; limits instrumental activities of daily living.",
      3: "Manual evacuation indicated or severe symptoms limiting self-care activities of daily living.",
      4: "Life-threatening consequences such as obstruction or toxic megacolon; urgent intervention required.",
      5: "Death related to constipation."
    }),
    cutaneous: Object.freeze({
      0: "No cutaneous adverse event. Use the most specific CTCAE skin term.",
      1: "Mild/localised skin changes with little or no functional impact.",
      2: "Moderate or more widespread skin changes; treatment indicated; may limit instrumental activities of daily living.",
      3: "Severe or extensive skin changes; limits self-care activities of daily living or hospital care indicated.",
      4: "Life-threatening cutaneous reaction; urgent intervention required.",
      5: "Death related to the cutaneous event."
    }),
    haematological: Object.freeze({
      0: "No haematological toxicity. Use the actual count and the named CTCAE laboratory term.",
      1: "Mild laboratory abnormality under the named cytopenia term.",
      2: "Moderate laboratory abnormality under the named cytopenia term.",
      3: "Severe laboratory abnormality or clinically significant consequences under the named term.",
      4: "Life-threatening consequences; urgent intervention required.",
      5: "Death related to the haematological event."
    }),
    other_nonhaematological: Object.freeze({
      0: "No other non-haematological adverse event.",
      1: "Grade 1 under the named CTCAE term: generally mild or asymptomatic, with observation only and no intervention indicated.",
      2: "Grade 2 under the named CTCAE term: generally moderate; local/non-invasive intervention may be indicated and instrumental activities may be limited.",
      3: "Grade 3 under the named CTCAE term: severe or medically significant; hospital care may be indicated and self-care activities may be limited.",
      4: "Grade 4 under the named CTCAE term: life-threatening consequences; urgent intervention required.",
      5: "Grade 5 under the named CTCAE term: death related to the adverse event."
    })
  });

  const DEFAULT_GUIDANCE = Object.freeze({
    generic: "Identify the actual adverse event first, then use that toxicity-specific CTCAE term. Generic severity anchors are not a substitute for the named criterion.",
    neuropathy: "Assess sensory and motor symptoms, reflexes, gait and dexterity, and whether instrumental or self-care activities are limited. Separate transient cold sensitivity from persistent functional neuropathy.",
    diarrhoea: "Count stools per day above the patient's baseline. Assess ostomy output, continence, hydration, fever, abdominal pain, sepsis and whether hospital care is indicated.",
    diarrhoea_or_colitis: "Grade diarrhoea and colitis separately using their CTCAE v5.0 criteria, then record the higher grade and document which term determines it. Assess stool frequency, abdominal pain, mucus/blood, peritoneal signs, hydration and sepsis.",
    mucositis: "Inspect the oral cavity and assess pain, ulceration, diet modification and interference with oral intake.",
    mucositis_or_diarrhoea: "Assess oral mucositis and diarrhoea separately using their own CTCAE v5.0 criteria, then record the higher grade and document which toxicity determines it.",
    pneumonitis: "Assess new cough, dyspnoea, oxygen saturation/requirement, imaging, infection and alternative causes. Symptomatic suspected pneumonitis requires prompt senior review.",
    rash: "Assess morphology, body-surface area, symptoms, mucosal involvement, blistering, systemic features and functional impact. Use the specific CTCAE skin term whenever possible.",
    rash_acneiform: "Assess papules/pustules, body-surface area, pruritus/tenderness, psychosocial and functional impact, and local or extensive superinfection.",
    infusion: "Document timing, symptoms, whether the infusion was interrupted, treatment given, speed of recovery, recurrence and any airway or haemodynamic compromise.",
    allergic_reaction: "Assess whether systemic treatment is required, treatment route, bronchospasm, angioedema, hypotension and hospitalisation. If infusion-related, use the infusion-related reaction term rather than double-reporting both.",
    hypersensitivity_anaphylaxis: "Assess bronchospasm, urticaria, angioedema, hypotension, airway compromise, treatment route and hospitalisation. Anaphylaxis requires immediate emergency treatment.",
    hypertension: "Use repeated correctly measured blood-pressure readings and record baseline hypertension, medication changes, symptoms and whether urgent intervention is required.",
    proteinuria: "Use the protocol-specified urine test. Confirm dipstick findings with quantitative testing when required and assess renal impairment or nephrotic features.",
    haemorrhage: "Identify the bleeding site and assess intervention, transfusion, hospitalisation and haemodynamic consequences.",
    infection: "Identify the infection site and assess treatment route, need for hospital care, organ dysfunction and sepsis.",
    ppe: "Inspect palms and soles for erythema, oedema, hyperkeratosis, peeling, fissures or blisters; assess pain and functional impact.",
    hfsr: "Inspect pressure areas of palms and soles and assess pain, skin breakdown and limitation of instrumental or self-care activities.",
    fistula: "Use the anatomical site-specific term; assess symptoms, imaging, infection and need for invasive or urgent intervention.",
    thromboembolism: "Confirm the event and assess symptoms, need for anticoagulation or urgent intervention, hospitalisation, and haemodynamic or neurological instability.",
    febrile_neutropenia: "Confirm ANC and temperature criteria and immediately assess for sepsis, organ dysfunction and the need for urgent IV antimicrobials.",
    hepatic_alt_ast: "Use the measured ALT/AST, laboratory ULN and baseline value. Assess bilirubin, symptoms and alternative causes concurrently.",
    hepatic_bilirubin: "Use the measured bilirubin, laboratory ULN and baseline value. Assess the overall hepatic pattern and alternative causes.",
    hypomagnesaemia: "Use the current serum magnesium and local reference range; assess symptoms, ECG effects and replacement requirements.",
    electrolyte: "Use the named electrolyte-specific CTCAE term, measured result, local reference range, symptoms, ECG effects and replacement requirements.",
    cardiac: "Use the named cardiac CTCAE term and assess symptoms, ECG, biomarkers, imaging, treatment, hospitalisation and haemodynamic compromise.",
    myocarditis: "Assess symptoms at rest and with activity, ECG, troponin/other biomarkers, cardiac imaging, treatment required and haemodynamic compromise. Suspected immune-mediated myocarditis requires urgent senior review.",
    neurological: "Use the named neurological CTCAE term and assess objective deficit, activities of daily living, respiratory/bulbar involvement and need for hospital care.",
    encephalitis: "Assess mental status, cognition, seizures, focal neurological findings, functional limitation and airway risk. CTCAE v5.0 has no single universal immune-encephalitis term, so document and apply the most appropriate named neurological criterion and urgently exclude infection.",
    guillain_barre: "Assess ascending weakness, reflexes, gait, bulbar/respiratory involvement and instrumental versus self-care ADL limitation. Suspected Guillain-Barre syndrome requires urgent neurological and respiratory assessment.",
    myositis: "Assess pain, objective weakness, CK and relevant investigations, swallowing/respiratory involvement and impact on instrumental versus self-care activities. Suspected immune-mediated myositis requires urgent senior review.",
    serious_neurological: "Identify and document the exact neurological adverse event before grading; the displayed anchors do not replace the named CTCAE criterion.",
    pancreatitis: "Assess symptoms, enzymes, imaging, oral intake, IV fluid/analgesia needs, hospitalisation and organ dysfunction.",
    pericardial: "Assess symptoms, ECG/echo findings, effusion or tamponade physiology, intervention and haemodynamic compromise.",
    constipation: "Assess change from baseline, laxative use, impact on activities, manual evacuation, obstruction and hospitalisation.",
    cutaneous: "Use the most specific CTCAE skin term; assess body-surface area, symptoms, mucosal/systemic involvement and functional impact.",
    haematological: "Use the actual laboratory value and the specific CTCAE cytopenia term. Do not estimate a grade from a generic symptom description.",
    other_nonhaematological: "Name the exact non-haematological adverse event first and apply its own CTCAE v5.0 criterion. The displayed general severity anchors are a screening aid only, not a substitute for the named term."
  });

  function normalise(definition) {
    return `${definition?.id || ""} ${definition?.label || ""}`.toLowerCase();
  }

  function categoryFor(definition) {
    if (definition?.ctcae_category && SETS[definition.ctcae_category]) return definition.ctcae_category;
    const text = normalise(definition);
    if (/(mucositis|stomatitis).*(diarrhoea|diarrhea|colitis)|(diarrhoea|diarrhea|colitis).*(mucositis|stomatitis)/.test(text)) return "mucositis_or_diarrhoea";
    if (/non[-_ ]?ha?em|non[-_ ]?hemat|non[-_ ]?haemat/.test(text)) return "other_nonhaematological";
    if (/neuropathy|neurotoxicity/.test(text)) return "neuropathy";
    if (/colitis/.test(text)) return "diarrhoea_or_colitis";
    if (/diarrhoea|diarrhea/.test(text)) return "diarrhoea";
    if (/stomatitis|mucositis/.test(text)) return "mucositis";
    if (/pneumonitis|\bild\b/.test(text)) return "pneumonitis";
    if (/acneiform/.test(text)) return "rash_acneiform";
    if (/rash/.test(text)) return "rash";
    if (/infusion/.test(text)) return "infusion";
    if (/anaphyl/.test(text)) return "hypersensitivity_anaphylaxis";
    if (/hypersensitivity|allergic/.test(text)) return "allergic_reaction";
    if (/hypertension/.test(text)) return "hypertension";
    if (/proteinuria/.test(text)) return "proteinuria";
    if (/haemorrhage|hemorrhage|bleeding/.test(text)) return "haemorrhage";
    if (/infection/.test(text)) return "infection";
    if (/hand.?foot skin reaction|hfsr/.test(text)) return "hfsr";
    if (/palmar|plantar|ppe|hand.?foot/.test(text)) return "ppe";
    if (/fistula/.test(text)) return "fistula";
    if (/thrombo/.test(text)) return "thromboembolism";
    if (/febrile neutropenia/.test(text)) return "febrile_neutropenia";
    if (/magnesium/.test(text)) return "hypomagnesaemia";
    if (/electrolyte/.test(text)) return "electrolyte";
    if (/bilirubin/.test(text)) return "hepatic_bilirubin";
    if (/\bast\b|\balt\b|transamin/.test(text)) return "hepatic_alt_ast";
    if (/myocarditis/.test(text)) return "myocarditis";
    if (/cardiac/.test(text)) return "cardiac";
    if (/pericard/.test(text)) return "pericardial";
    if (/guillain/.test(text)) return "guillain_barre";
    if (/myositis|polymyositis/.test(text)) return "myositis";
    if (/encephal/.test(text)) return "encephalitis";
    if (/serious.*neurolog/.test(text)) return "serious_neurological";
    if (/neurological/.test(text)) return "neurological";
    if (/pancreatitis/.test(text)) return "pancreatitis";
    if (/constipation/.test(text)) return "constipation";
    if (/cutaneous|skin reaction/.test(text)) return "cutaneous";
    if (/haematological|hematological/.test(text)) return "haematological";
    return "generic";
  }

  function numericGrade(value, label) {
    if (value !== undefined && value !== null && value !== "" && Number.isFinite(Number(value))) return Number(value);
    const match = String(label || "").match(/grade\s*([0-5])/i);
    return match ? Number(match[1]) : null;
  }

  function descriptor(definition, option) {
    if (option?.description) return String(option.description);
    const grade = numericGrade(option?.ctcae_grade ?? option?.value, option?.label);
    if (grade === null) return "";
    const category = categoryFor(definition);
    return SETS[category]?.[grade] || GENERIC[grade] || "";
  }

  function optionLabel(definition, option) {
    const base = option?.label ?? option?.value ?? "";
    const description = descriptor(definition, option);
    if (!description || String(base).includes("—")) return String(base);
    return `${base} — ${description}`;
  }

  function guide(definition) {
    const hasCtcae = definition?.ctcae_version || /grade|ctcae/i.test(normalise(definition));
    if (!hasCtcae) return null;
    const category = categoryFor(definition);
    const options = Array.isArray(definition?.options) && definition.options.length
      ? definition.options
      : [0, 1, 2, 3, 4].map(value => ({ value, label: `Grade ${value}` }));
    const grades = options
      .map(option => ({
        grade: numericGrade(option?.ctcae_grade ?? option?.value, option?.label),
        label: option?.label || `Grade ${option?.value}`,
        description: descriptor(definition, option)
      }))
      .filter(item => item.grade !== null && item.grade >= 0 && item.grade <= 4);
    return {
      version: definition?.ctcae_version ? `CTCAE v${definition.ctcae_version}` : "CTCAE v5.0",
      category,
      guidance: definition?.assessment_guidance || DEFAULT_GUIDANCE[category] || DEFAULT_GUIDANCE.generic,
      sourceUrl: definition?.ctcae_source_url || SOURCE_URL,
      grades
    };
  }

  root.SACTCheckCTCAE = Object.freeze({
    version: "0.37.0 / CTCAE v5.0 grading support",
    sourceUrl: SOURCE_URL,
    generic: GENERIC,
    sets: SETS,
    guidance: DEFAULT_GUIDANCE,
    categoryFor,
    descriptor,
    optionLabel,
    guide
  });
})(typeof window !== "undefined" ? window : globalThis);
