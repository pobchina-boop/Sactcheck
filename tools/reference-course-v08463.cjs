'use strict';
// These spans are complete source-authored courses, never an expanded generic cycle allowance.
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function applies(d){
 if(!d||d.suite_release!=='0.84.63'||d.patient_context||d.patient_route!==d.code||d.schedule_kind!=='reference-course'||d.cycle_display!=='reference-chronology'||d.patient_summary?.card_cycle_count!==null||!d.schedule_label)return false;
 const s=d.long_course_schedule;if(!s||s.actual_dates_required!==true)return false;
 if(d.code==='00463')return d.protocol_id==='nccp-00463-v4'&&d.course_weeks===29&&d.cycle_days===203&&s.unit==='reference week'&&s.surgery_week===11&&s.rescue_dose_calculator===false&&s.fixed_discharge_date===false&&eq(s.preoperative_doxorubicin_cisplatin_weeks,[1,6])&&eq(s.preoperative_methotrexate_weeks,[4,5,9,10])&&eq(s.postoperative_doxorubicin_weeks,[12,17,22,26])&&eq(s.postoperative_cisplatin_weeks,[12,17])&&eq(s.postoperative_methotrexate_weeks,[15,16,20,21,24,25,28,29]);
 if(d.code==='00100')return d.protocol_id==='nccp-00100-v6'&&d.course_weeks===36&&d.cycle_days===252&&s.unit==='week from actual mifamurtide start'&&s.first_phase_weeks===12&&s.first_phase_frequency==='twice weekly'&&s.minimum_gap_days===3&&s.first_phase_doses===24&&s.second_phase_weeks===24&&s.second_phase_frequency==='weekly'&&s.second_phase_doses===24&&s.total_doses===48&&s.total_weeks===36&&s.independent_chemotherapy_clock===true;
 return false;
}
module.exports={applies};
