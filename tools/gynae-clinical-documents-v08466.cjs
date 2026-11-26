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
sections.cisplatin = [
 ['Kidneys and hearing','Fluids and blood tests help protect the kidneys. Report reduced urine, ringing or hearing loss promptly. Hearing changes can persist.'],
 ['Nerves, nausea and low counts','Report numbness, persistent vomiting or bleeding. Call urgently for fever or chills.']
];
const codes = new Set(['00344','00303','00306','00308','00624','00819','00620','00716','00769','00771','00772','00817','00811','00799','00766','00499']);
const h = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const table=(headers,rows)=>'<table><thead><tr>'+headers.map(x=>'<th scope="col">'+h(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(x=>'<td>'+h(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
const header=(p,name)=>'<header><div class="brand">SACT<span>Check</span></div><div class="reference">NCCP '+h(p.code)+' · v'+h(p.protocol_version)+'</div></header><h1>'+h(name)+'</h1><p class="regimen">'+h(p.title)+'</p>';
const fields='<div class="fields"><span>Patient name</span><span>Date of birth</span><span>Hospital / MRN</span></div>';
const page=(p,title,file,body)=>'<!doctype html><html lang="en-IE"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>'+h(title)+' · NCCP '+h(p.code)+'</title><link rel="stylesheet" href="../../assets/gynae-clinical-documents.css"></head><body><nav><a href="./">Patient portal</a> <a href="'+h(file)+'" download>Download PDF</a></nav><main>'+body+'</main></body></html>\n';
function consent(p){
 const groups=p.agents.map(a=>{const rows=sections[a.id];if(!rows)throw Error('Missing material risks for '+a.id);return '<section class="agent"><h3>'+h(a.name)+'</h3>'+table(['Effect to discuss','What to look for and when to get help'],rows)+'</section>';});
 const a=header(p,'Consent to systemic anti-cancer treatment')+fields+'<h2>Treatment and purpose</h2><p>'+h(p.purpose)+' '+h(p.indication_text)+'</p><p><b>Treatment schedule.</b> '+h(p.schedule_summary)+'</p><h2 class="riskhead">Regimen-specific side effects</h2>'+groups.join('');
 const b=header(p,'Treatment discussion and decision')+'<h2>Benefits, alternatives and individual risks</h2><p>'+h(p.evidence.interpretation)+' '+h(p.evidence.limitations)+'</p><p>Discuss other treatment options, symptom-focused care, fertility, contraception and the effects that matter most to you. You can ask for more time and change your decision.</p><p><b>Options discussed, personal risks and questions</b></p><div class="lines"></div><p><b>Urgent contact</b> '+h(p.urgent_extra)+' Emergency services: 112 or 999.</p><h2>Decision and signatures</h2><p>I have discussed the purpose, likely benefits, material risks and alternatives, and have had the opportunity to ask questions.</p><p>Decision: □ I agree to treatment &nbsp; □ I would like more time &nbsp; □ I decline</p><div class="fields"><span>Patient / representative</span><span>Date</span></div><div class="fields"><span>Clinician and registration number</span><span>Signature / date</span></div><footer>SACTCheck feasibility build · Use with the hospital consent process. Source: NCCP '+h(p.code)+' v'+h(p.protocol_version)+'.</footer>';
 return page(p,'Regimen-specific consent','consent-form.pdf','<article'+(p.code==='00811'?' class="four-agents"':'')+'>'+a+'</article><article>'+b+'</article>');
}
function rx(p,phase){
 const level=phase.emetogenic_risk,high=level==='high',low=level==='low';
 if (p.code==='00344' && phase.id==='flot') {
  const rows = phase.medicines.map(m=>[m.name,m.dose.replace(/\bPO\b/g,'by mouth'),m.timing]);
  const body = header(p,'Antiemetic prescription')+fields+'<div class="visit"><strong>FLOT infusion · cycles 1–8</strong><span>MODERATE EMETIC RISK</span></div><div class="fields"><span>Cycle / treatment date</span><span>Allergies and reactions</span></div><h2>Day unit</h2>'+table(['Medicine','Dose and route','Directions'],[rows[0]])+'<h2>Scheduled steroid · one combined plan</h2>'+table(['Medicine','Dose and route','Directions'],rows.slice(1,3))+'<p class="note">Confirm at least three steroid doses before docetaxel. If missed, contact the consultant. Record the total steroid dose before signing.</p><h2>Take home · as needed</h2>'+table(['Medicine','Dose and route','Directions'],[rows[3]])+'<p class="note">'+h(phase.medicines[3].note)+'</p><div class="fields"><span>Duration / quantity</span><span>Prescriber amendments</span></div><div class="fields"><span>Prescriber name / IMC number</span><span>Signature and date</span></div><footer>SACTCheck · NCCP 00344 v9 and NCIS Medical Oncology v8 · Requires signature.</footer>';
  return page(p,'Antiemetic prescription','antiemetic-flot.pdf','<article>'+body+'</article>');
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
  if(p.code==='00799')meds+='<p class="note">Olanzapine can cause sedation. Review concurrent metoclopramide because of increased risk of extrapyramidal effects.</p>';
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
