'use strict';
const sections = {
  docetaxel: [
    ['Blood counts, bowel and fluid','Fever, chills or abdominal pain with diarrhoea need an urgent call. Report ankle swelling. Hair and nail changes can occur.'],
    ['Infusion reaction','Tell the nurse immediately about flushing, wheeze or dizziness. Take the prescribed steroid before infusion.']
  ],
  oxaliplatin: [
    ['Cold sensitivity and nerve injury','Cold can trigger tingling or throat tightness. Numbness may persist and affect walking or finger movements. Report it before the next cycle.'],
    ['Allergy or line pain','Tell the nurse immediately about swelling, stinging, rash or trouble breathing.']
  ],
  '5-fluorouracil': [
    ['Mouth, gut, hands and feet','Report ulcers, diarrhoea, painful palms or soles early. Severe toxicity can develop rapidly with low DPD activity.'],
    ['Chest pain','Fluorouracil can cause coronary spasm during or after the pump. Get urgent help for chest pain.']
  ],
  'folinic acid': [
    ['Interaction and allergy','Folinic acid strengthens fluorouracil and can increase mouth and bowel symptoms. Alert the nurse for a new rash, swelling or wheeze.']
  ],
  bevacizumab: [
    ['Blood pressure and urine protein','High blood pressure and protein leaking into urine can develop without symptoms. Attend blood pressure and urine checks.'],
    ['Bleeding, clots and wound healing','Report bleeding or a wound that opens. Tell the team before surgery or invasive procedures. Sudden chest pain, weakness or severe breathlessness needs emergency help.'],
    ['Bowel perforation or fistula','A tear in the bowel or an abnormal connection can be life-threatening. Phone urgently for severe abdominal pain, fever or new leakage of urine or stool.'],
    ['Brain and vision','A severe headache, seizure, confusion or sudden visual change needs emergency assessment.']
  ],
  paclitaxel: [
    ['Numbness or weakness','Tell the team about tingling, falls, trouble walking or fastening buttons before the next infusion. Nerve damage can persist.'],
    ['Infusion allergy','Tell the nurse immediately about flushing, wheeze, chest tightness or dizziness during the infusion.'],
    ['Hair loss, aches and low blood counts','Hair loss and muscle or joint pain can occur. Fever, shivering or sudden illness may signal infection and need an urgent call.']
  ],
  carboplatin: [
    ['Low blood counts and infection','Call urgently for fever, shivering or unexpected bleeding. Red cells and platelets can fall as well as white cells.'],
    ['Nausea and vomiting','Take the prescribed anti-sickness medicines. Call if vomiting continues or you cannot keep fluids down.'],
    ['Allergy, kidneys and hearing','Tell the nurse immediately about an infusion reaction. Kidney function guides dosing. Report new ringing in the ears or hearing changes.']
  ],
  topotecan: [
    ['Infection, anaemia and bleeding','Low white cells, red cells and platelets can be severe. Call immediately for fever, unusual bleeding or shortness of breath.'],
    ['Digestive symptoms','Report diarrhoea, mouth ulcers or vomiting early. Fever with abdominal pain or diarrhoea needs urgent assessment.'],
    ['Lung inflammation','Phone urgently for a new cough or breathlessness. Lung inflammation can be serious.']
  ],
  'pegylated liposomal doxorubicin': [
    ['Hands and feet','Report burning pain, redness, peeling or blisters early. Your team may delay or adjust treatment.'],
    ['Mouth and blood counts','Report mouth ulcers or difficulty eating. Fever or chills require an urgent call for possible infection.'],
    ['Heart function and infusion reactions','Report ankle swelling, new breathlessness or difficulty lying flat. Tell the nurse immediately about flushing, chest tightness or back pain during infusion.']
  ],
  gemcitabine: [
    ['Blood counts, bruising and infection','Fever, shivering, bleeding or suddenly feeling unwell needs urgent assessment.'],
    ['Flu-like symptoms, rash and swelling','Report symptoms to the team. Always call about fever, even if it follows an infusion.'],
    ['Lungs and kidneys','Phone urgently for new breathlessness, reduced urine, unexpected bruising or marked swelling.']
  ],
  dostarlimab: [
    ['Bowel, lung or liver inflammation','Phone urgently for increasing diarrhoea, blood in stool, new cough, breathlessness, jaundice or dark urine.'],
    ['Hormone glands and blood sugar','Severe tiredness, dizziness, headache, thirst or frequent urination can indicate hormone problems. Some require long-term replacement.'],
    ['Other immune reactions','Report new muscle weakness, chest pain, reduced urine, blistering skin, eye pain or altered vision urgently. Reactions can begin after treatment stops. Carry your immunotherapy alert card.']
  ]
};
sections.pembrolizumab = [
 ['Immune inflammation','New cough, diarrhoea, jaundice, rash or reduced urine needs urgent review, even after treatment ends.'],
 ['Hormone and other serious reactions','Call urgently for severe fatigue, headache, thirst, weakness or chest pain. Hormone replacement can be lifelong. Carry your immunotherapy alert card.']
];
const cervicalImmunotherapyRisks = [
 ...sections.pembrolizumab,
 ['Heart, muscle, nerves and skin', 'Get urgent help for chest pain, new weakness, difficulty swallowing, confusion or a widespread blistering rash.'],
 ['Infusion reaction', 'Tell the nurse at once about flushing, breathing difficulty, dizziness or swelling during the infusion.']
];
sections.cisplatin = [
 ['Kidneys and hearing','Fluids and blood tests help protect the kidneys. Report reduced urine, ringing or hearing loss promptly. Hearing changes can persist.'],
 ['Nerves, nausea and low counts','Report numbness, persistent vomiting or bleeding. Call urgently for fever or chills.']
];
Object.assign(sections, {
  rucaparib: [
    ['Blood counts', 'Anaemia, bruising or infection can develop. Call urgently for fever, bleeding or new breathlessness. Persistent low counts need investigation. Rarely, a serious bone marrow disorder or leukaemia can occur.'],
    ['Nausea and fatigue', 'Tell the team if sickness, poor appetite or tiredness interferes with drinking or taking your tablets.'],
    ['Liver tests and sensitivity to sunlight', 'Attend blood tests, protect your skin from the sun, and report a new rash or yellowing of your eyes or skin.']
  ],
  trabectedin: [
    ['Muscles and kidneys', 'Severe muscle pain, weakness or dark urine can signal muscle breakdown. Call the oncology unit urgently.'],
    ['Liver and blood counts', 'Attend blood tests. Call urgently for jaundice, fever or chills. The prescribed steroid also helps protect your liver.'],
    ['Heart and infusion site', 'Report swelling or new breathlessness. Tell the nurse at once if the line stings, hurts or leaks.']
  ],
  bleomycin: [
    ['Lung inflammation and scarring', 'Contact oncology urgently for new dry cough or breathlessness during or after treatment. Tell anaesthetists if you have ever had bleomycin.'],
    ['Fever, skin or infusion reaction', 'Chills, rash and fever can occur. Call about any fever. Tell the nurse immediately about wheeze, swelling or faintness.']
  ],
  etoposide: [
    ['Low counts and infection', 'Phone urgently for fever, chills, unexpected bleeding or marked breathlessness. Hair loss is common.'],
    ['Infusion reactions and late effects', 'Tell the nurse immediately about flushing, dizziness or breathlessness. There is a small long-term risk of treatment-related leukaemia.']
  ],
  methotrexate: [
    ['Mouth, stomach and bone marrow', 'Report painful ulcers, vomiting or difficulty drinking. Fever, chills or unexplained bleeding require an urgent call.'],
    ['Liver, kidneys and interactions', 'Attend your blood tests. Check new prescriptions and non-prescription medicines with oncology or pharmacy before taking them.']
  ]
});
const folinicRescue = [
  ['Timing of rescue', 'This medicine protects healthy cells after methotrexate. Take it exactly 24 hours after each injection. Ring the unit immediately for a missed, late or vomited tablet.'],
  ['Allergy', 'Seek emergency help for facial swelling, wheeze or difficulty breathing after a dose.']
];
const codes = new Set(['00344','00303','00306','00308','00624','00819','00620','00716','00769','00771','00772','00817','00811','00799','00766','00499','00312','00375','00676','00300','00246','00247','00248','00249','00264','00266','00267','00301','00904']);
const h = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const table=(headers,rows)=>'<table><thead><tr>'+headers.map(x=>'<th scope="col">'+h(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(x=>'<td>'+h(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
const header=(p,name)=>'<header><div class="brand">SACT<span>Check</span></div><div class="reference">NCCP '+h(p.code)+' · v'+h(p.protocol_version)+'</div></header><h1>'+h(name)+'</h1><p class="regimen">'+h(p.title)+'</p>';
const fields='<div class="fields"><span>Patient name</span><span>Date of birth</span><span>Hospital / MRN</span></div>';
const page=(p,title,file,body)=>'<!doctype html><html lang="en-IE"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>'+h(title)+' · NCCP '+h(p.code)+'</title><link rel="stylesheet" href="../../assets/gynae-clinical-documents.css"></head><body><nav><a href="./">Patient portal</a> <a href="'+h(file)+'" download>Download PDF</a></nav><main>'+body+'</main></body></html>\n';
const currentGynaeRoutes = new Set(require('./lib/gynae-patient-routes-v08473.json'));
const trophoblasticCodes = new Set(['00247','00248','00249','00264','00266']);
const gtnRisks = {
  dactinomycin: [['Low counts, mouth sores and IV leakage','Phone urgently for fever or bleeding. Report painful ulcers. Tell the nurse immediately if the line burns or stings.']],
  etoposide: [['Low counts and infusion reaction','Phone for fever or bleeding. Report flushing or faintness during infusion. Hair loss and a small later leukaemia risk are possible.']],
  methotrexate: [['Mouth, blood counts, liver and kidneys','Report mouth ulcers, fever or poor fluid intake. Check new medicines and take folinic acid at the written times.']],
  'folinic acid': [['Rescue and allergy','Phone immediately if a tablet is missed, late or vomited. Seek emergency help for swelling or wheeze.']],
  vincristine: [['Nerves, bowel and IV site','Report numbness, weakness or severe constipation. Tell the nurse if the line stings. Vincristine is for IV use only.']],
  cyclophosphamide: [['Blood counts, bladder and fertility','Phone about fever, unusual bleeding, painful urination or blood in the urine. Discuss future fertility before treatment.']],
  cisplatin: [['Kidneys, hearing, nerves and sickness','Report reduced urine, persistent vomiting, tinnitus, hearing loss or numbness. Attend for fluids and electrolyte checks.']],
  paclitaxel: [['Nerves, marrow and infusion reactions','Report numbness, fever or unexpected bleeding. Tell the nurse at once about chest tightness or breathlessness. Hair loss is common.']]
};
function consent(p){
 const groups=p.agents.map(a=>{const rows=a.consent_risks ?? (Array.isArray(p.prescription_phases) && ['pembrolizumab','cemiplimab'].includes(a.id) ? cervicalImmunotherapyRisks : p.code==='00249' && a.id==='methotrexate' ? [['Spinal and systemic effects','Seek urgent advice for severe headache, fever, stiff neck, weakness, confusion or seizure. Blood counts and kidney function also need checking.']] : trophoblasticCodes.has(p.code) ? gtnRisks[a.id] : p.code==='00246' && a.id==='folinic acid' ? folinicRescue : sections[a.id]);if(!rows)throw Error('Missing material risks for '+a.id);return '<section class="agent"><h3>'+h(a.name)+'</h3>'+table(['Effect to discuss','What to look for and when to get help'],rows)+'</section>';});
 const pelvicRadiation = Array.isArray(p.prescription_phases) && ['00385','00419','00943'].includes(p.code)
   ? '<h2>Pelvic radiotherapy alongside chemotherapy</h2><p>Discuss bowel and bladder irritation, vaginal changes and the effects on sexual health, ovarian function and fertility that apply to you. Your radiation oncology team will discuss and document your radiotherapy plan separately.</p>'
   : '';
 const a=header(p,'Consent to systemic anti-cancer treatment')+fields+'<h2>Treatment and purpose</h2><p>'+h(p.purpose)+' '+h(p.code==='00248'?'High-risk or resistant gestational trophoblastic neoplasia.':p.indication_text)+'</p><p><b>Treatment schedule.</b> '+h(trophoblasticCodes.has(p.code)?p.schedule_label:p.schedule_summary)+'</p><h2 class="riskhead">Regimen-specific side effects</h2>'+groups.join('')+pelvicRadiation;
 const patientDiscussion = currentGynaeRoutes.has(p.code) || currentGynaeRoutes.has(p.code+'/'+p.patient_context) ? '<p>'+h(p.consent_support)+'</p>' : '';
 const b=header(p,'Treatment discussion and decision')+'<h2>Benefits, alternatives and individual risks</h2><p>'+h(p.evidence.interpretation)+' '+h(p.evidence.limitations)+'</p>'+patientDiscussion+'<p>Discuss other treatment options, symptom-focused care, fertility, contraception and the effects that matter most to you. You can ask for more time and change your decision.</p><p><b>Options discussed, personal risks and questions</b></p><div class="lines"></div><p><b>Urgent contact</b> '+h(p.urgent_extra)+' Emergency services: 112 or 999.</p><h2>Decision and signatures</h2><p>I have discussed the purpose, likely benefits, material risks and alternatives, and have had the opportunity to ask questions.</p><p>Decision: □ I agree to treatment &nbsp; □ I would like more time &nbsp; □ I decline</p><div class="fields"><span>Patient / representative</span><span>Date</span></div><div class="fields"><span>Clinician and registration number</span><span>Signature / date</span></div><footer>SACTCheck feasibility build · Use with the hospital consent process. Source: NCCP '+h(p.code)+' v'+h(p.protocol_version)+'.</footer>';
 return page(p,'Regimen-specific consent','consent-form.pdf','<article'+(p.agents.length>4 && trophoblasticCodes.has(p.code)?' class="gtn-multiple"':p.code==='00811'?' class="four-agents"':'')+'>'+a+'</article><article>'+b+'</article>');
}
function rx(p,phase){
 const level=phase.emetogenic_risk,high=level==='high',low=level==='low';
 if (p.code==='00344' && phase.id==='flot') {
  const rows = phase.medicines.map(m=>[m.name,m.dose.replace(/\bPO\b/g,'by mouth'),m.timing]);
  const body = header(p,'Antiemetic prescription')+fields+'<div class="visit"><strong>FLOT infusion · cycles 1–8</strong><span>MODERATE EMETIC RISK</span></div><div class="fields"><span>Cycle / treatment date</span><span>Allergies and reactions</span></div><h2>Day unit</h2>'+table(['Medicine','Dose and route','Directions'],[rows[0]])+'<h2>Scheduled steroid · one combined plan</h2>'+table(['Medicine','Dose and route','Directions'],rows.slice(1,3))+'<p class="note">Confirm at least three steroid doses before docetaxel. If missed, contact the consultant. Record the total steroid dose before signing.</p><h2>Take home · as needed</h2>'+table(['Medicine','Dose and route','Directions'],[rows[3]])+'<p class="note">'+h(phase.medicines[3].note)+'</p><div class="fields"><span>Duration / quantity</span><span>Prescriber amendments</span></div><div class="fields"><span>Prescriber name / IMC number</span><span>Signature and date</span></div><footer>SACTCheck · NCCP 00344 v9 and NCIS Medical Oncology v8 · Requires signature.</footer>';
  return page(p,'Antiemetic prescription','antiemetic-flot.pdf','<article>'+body+'</article>');
 }
 const finalGynae = ['00267','00301','00904'].includes(p.code);
 if (trophoblasticCodes.has(p.code) || finalGynae || Array.isArray(p.prescription_phases)) {
   const currentPlan = currentGynaeRoutes.has(p.code) || currentGynaeRoutes.has(p.code+'/'+p.patient_context);
   const rows=phase.medicines.map(m=>{
     const timing=m.timing.replace(/\bOD\b/g,'Once daily').replace(/\bTDS\b/g,currentPlan?'Three times daily':'Up to three times daily').replace(/\bPRN\b/g,'as needed');
     return [m.name,m.dose.replace(/\bPO\b/g,'by mouth'),currentPlan && m.note ? timing+'. '+m.note : timing];
   });
   const notes = [...phase.prescription_notes];
   if(rows.some(r=>r[0]==='Metoclopramide')) notes.push('Metoclopramide: space doses by at least 6 hours. Maximum 30 mg or 0.5 mg/kg daily, whichever is lower, for up to 5 days.');
   const prescriptionSource = currentPlan && phase.prescription_source ? h(phase.prescription_source) : Array.isArray(p.prescription_phases) ? 'NCCP '+h(p.code)+' v'+h(p.protocol_version)+' · Local prescribing policy' : p.code === '00904' ? 'NCCP 00904 v'+h(p.protocol_version)+' · Oral antiemesis per local policy' : 'NCCP '+h(p.code)+' · NCIS Medical Oncology v8'+(finalGynae ? ' · MASCC/ESMO multiday cisplatin guidance' : '');
   const visitLabel = p.code === '00904' ? 'Daily anti-sickness medicine during rucaparib treatment' : phase.label;
   const riskLabel = p.code === '00904' ? 'MODERATE TO HIGH · ORAL' : level === 'oral_minimal_low' ? 'MINIMAL TO LOW · ORAL' : level.toUpperCase();
   const oralPlan = '<p>Individual oral antiemetic prescription</p>'+table(['Medicine and strength', 'Dose and route', 'Directions and duration'],[['________________', '________________', '________________']]);
   const localRegimen = Array.isArray(p.prescription_phases) && level !== 'minimal';
   const medicines = rows.length ? table(['Medicine','Dose and route','Directions'],rows) : p.code === '00904' ? oralPlan : localRegimen ? table(['Medicine','Dose and route','Directions and duration'],[['________________','________________','________________'],['________________','________________','________________']]) : '<p>No routine preventive antiemetic for this visit. Record individual rescue if needed.</p>';
   const body=header(p,'Antiemetic prescription')+fields+'<div class="visit"><strong>'+h(visitLabel)+'</strong><span>'+h(riskLabel)+' EMETIC RISK</span></div><div class="fields"><span>Cycle / treatment date</span><span>Allergies</span></div>'+medicines+notes.map(n=>'<p class="note">'+h(n)+'</p>').join('')+'<div class="fields"><span>Amendments / duration</span><span>Quantity to supply</span></div><div class="fields"><span>Prescriber name / IMC number</span><span>Signature and date</span></div><footer>SACTCheck · '+prescriptionSource+' · Prescriber review and signature required.</footer>';
   return page(p,'Antiemetic prescription','antiemetic-'+phase.id+'.pdf','<article>'+body+'</article>');
 }
 if ((p.code === '00300' && phase.id !== 'bleomycin') || p.code === '00375') {
   const multi=p.code==='00300';
   const rows=phase.medicines.map(m=>[m.name,m.dose.replace(/\bPO\b/g,'by mouth'),m.timing.replace(/\bOD\b/g,'Once daily').replace(/\bTDS\b/g,'Up to three times daily').replace(/\bPRN\b/g,'as needed')]);
   const warning=multi ? 'One prescription covers days 1–7. Check today’s cycle day before giving a dose. Do not restart the course on days 2–5. Review sedation and rescue antiemetic choice.' : 'Day 1 dexamethasone includes the trabectedin premedication. Document one total steroid dose. Space metoclopramide at least six hours apart. Maximum 30 mg or 0.5 mg/kg per day, whichever is lower, for up to five days.';
   const source=multi?'NCIS Medical Oncology v8 pp4–5 and MASCC/ESMO multiday guidance':'NCIS Medical Oncology v8 and NCCP 00375';
   const body=header(p,'Antiemetic prescription')+fields+'<div class="visit"><strong>'+h(multi?'BEP · five-day cisplatin block':phase.label)+'</strong><span>'+h(level.toUpperCase())+' EMETIC RISK</span></div><div class="fields"><span>Cycle start / date</span><span>Allergies</span></div>'+table(['Medicine','Dose and route','Directions'],rows)+'<p class="note">'+h(warning)+'</p><div class="fields"><span>Individual rescue prescription / quantity</span><span>Amendments</span></div><div class="fields"><span>Prescriber name / IMC number</span><span>Signature and date</span></div><footer>SACTCheck · '+h(source)+' · Requires prescriber review and signature.</footer>';
   return page(p,'Antiemetic prescription','antiemetic-'+phase.id+'.pdf','<article>'+body+'</article>');
 }
 if(![high,low,level==='minimal'].some(Boolean))throw Error('Unhandled antiemetic plan '+level);
 const taxane=phase.active_medicines.some(x=>/paclitaxel/i.test(x));
 const rows=phase.medicines.map(m=>[m.name,m.dose.replace(/\bPO\b/g,'by mouth'),m.timing.replace(/\bOD\b/g,'Once daily').replace(/\bTDS\b/g,'Three times daily').replace(/\bPRN\b/g,'as needed')]);
 const day1=rows.filter(r=>/day 1\b|on this treatment day/i.test(r[2])),later=rows.filter(r=>!/day 1\b|on this treatment day/i.test(r[2])&&r[0]!=='Metoclopramide');
 const core=header(p,'Antiemetic prescription')+fields+'<div class="visit"><strong>'+h(phase.label)+'</strong><span class="'+h(level)+'">'+h(level.toUpperCase())+' EMETIC RISK</span></div><div class="fields"><span>Cycle / treatment date</span><span>Allergies and reactions</span></div>';
 let meds='';
 if(level==='minimal') meds='<h2>Preventive medicines</h2><p class="empty">No routine preventive antiemetic for this visit.</p><p>Individual prescription, if clinically indicated</p><div class="lines"></div>';
 else{
  meds='<h2>Day unit · treatment day</h2>'+table(['Medicine','Dose and route','Directions'],day1);
  if(taxane&&high)meds+='<p class="note">Reconcile dexamethasone with the paclitaxel premedication before signing. Record one total dose.</p>';
  if(p.code==='00799'||(p.code==='00676' && phase.id==='radiation'))meds+='<p class="note">Olanzapine can cause sedation. Review concurrent metoclopramide because of increased risk of extrapyramidal effects.</p>';
  if(later.length)meds+='<h2>Take home · scheduled</h2>'+table(['Medicine','Dose and route','Directions'],later);
  const metoclopramide=rows.find(row=>row[0]==='Metoclopramide');
  if (!metoclopramide) throw Error('Missing subsequent antiemetic for '+p.code+' / '+phase.id);
  meds+='<h2>'+(low?'Take home · as needed':'Take home · subsequent days')+'</h2>'+table(['Medicine','Dose and route','Directions'],[[metoclopramide[0],metoclopramide[1],low?'Up to three times daily as needed':'Three times daily']])+'<p class="note">Metoclopramide: leave at least 6 hours between doses. Maximum 30 mg/day or 0.5 mg/kg/day, whichever is lower. Up to 5 days. Prescriber: enter duration and quantity.</p>';
 }
 return page(p,'Antiemetic prescription','antiemetic-'+phase.id+'.pdf','<article>'+core+meds+'<div class="fields"><span>Duration / quantity to supply</span><span>Prescriber amendments</span></div><div class="fields"><span>Prescriber name / IMC number</span><span>Signature and date</span></div><footer>SACTCheck · Prescriber review and signature required · NCCP '+h(p.code)+' · NCIS Medical Oncology v8, table 1.</footer></article>');
}
function build(p,phases){
 const files={'consent-form.html':consent(p),'consent.html':consent(p)};
 for(const phase of phases)files['antiemetic-'+phase.id+'.html']=rx(p,phase);
 files['antiemetic-prescriptions.html']=page(p,'Antiemetic prescriptions','antiemetic-'+phases[0].id+'.pdf',header(p,'Antiemetic prescriptions')+'<p>Select the treatment being given at this visit.</p><ul class="downloads">'+phases.map(v=>'<li><a download href="antiemetic-'+h(v.id)+'.pdf">'+h(v.label)+' — prescription PDF</a></li>').join('')+'</ul>').replace(/ <a href="antiemetic-[^"]+\.pdf" download>Download PDF<\/a>/,'');
 return files;
}
module.exports={codes,build};
