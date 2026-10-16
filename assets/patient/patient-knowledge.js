/* Educational cycle navigation. No patient details are stored or transmitted. */
(function(){
'use strict';
const node=document.getElementById('pk-data');
if(!node||!document.querySelector('[data-patient-knowledge]'))return;
const data=JSON.parse(node.textContent),date=document.getElementById('pk-start'),phase=document.getElementById('pk-phase');
let selected=1;
const localDate=value=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;const [y,m,d]=value.split('-').map(Number);const x=new Date(y,m-1,d,12);return Number.isNaN(x.getTime())?null:x;};
const addDays=(start,n)=>{const x=new Date(start);x.setDate(x.getDate()+n);return x;};
const fmt=x=>x.toLocaleDateString('en-IE',{day:'numeric',month:'short'});
function render(){
 const start=localDate(date.value),p=data.phases.find(p=>p.id===phase.value)||data.phases[0],g=data.day_groups.find(g=>selected>=g.start&&selected<=g.end);
 document.querySelectorAll('[data-phase-ids]').forEach(row=>{if(row.dataset.phaseIds)row.hidden=!row.dataset.phaseIds.split(' ').includes(p.id);});
 document.getElementById('pk-active-medicines').textContent=p.agents.map(id=>data.agents.find(a=>a.id===id).name).join(' + ');
 document.querySelectorAll('[data-day]').forEach(b=>{const n=Number(b.dataset.day);b.setAttribute('aria-pressed',String(n===selected));b.querySelector('small').textContent=start?fmt(addDays(start,n-1)):'';b.setAttribute('aria-label',`Day ${n}${start?', '+fmt(addDays(start,n-1)):''}`);});
 document.getElementById('pk-day-number').textContent=`Day ${selected}${start?' · '+fmt(addDays(start,selected-1)):''}`;
 document.getElementById('pk-day-title').textContent=g.title;
 document.getElementById('pk-day-body').textContent=g.body;
 document.getElementById('pk-day-action').textContent=g.action;
 document.getElementById('pk-next').textContent=start?`Next planned Day 1: ${fmt(addDays(start,data.cycle_days))}. Your team must confirm treatment can proceed.`:`The next cycle starts ${data.cycle_days} days after this one, if your team confirms it.`;
}
for(const b of document.querySelectorAll('[data-day]'))b.addEventListener('click',()=>{selected=Number(b.dataset.day);render();});
date.addEventListener('change',render);phase.addEventListener('change',render);
document.getElementById('pk-clear').addEventListener('click',()=>{date.value='';render();});
render();
})();
