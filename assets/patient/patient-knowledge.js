(function(){
  'use strict';
  const root=document.querySelector('[data-patient-knowledge]');
  if(!root)return;
  const data=JSON.parse(document.getElementById('pk-data').textContent);
  const date=document.getElementById('pk-start'),phase=document.getElementById('pk-phase');
  let selectedDay=1;
  function calendar(day){
    if(!date?.value)return '';
    const [y,m,d]=date.value.split('-').map(Number);
    const value=new Date(Date.UTC(y,m-1,d+day-1));
    return value.toLocaleDateString('en-IE',{day:'numeric',month:'short',timeZone:'UTC'});
  }
  function update(){
    const current=data.phases.find(p=>p.id===phase.value);
    document.getElementById('pk-active-medicines').textContent=current.agents.map(id=>data.agents.find(a=>a.id===id).name).join(' + ');
    for(const button of root.querySelectorAll('[data-day]')){
      const d=Number(button.dataset.day);button.setAttribute('aria-pressed',String(d===selectedDay));
      button.querySelector('small').textContent=calendar(d);
      button.setAttribute('aria-label',`Day ${d}${calendar(d)?', '+calendar(d):''}`);
    }
    const group=data.day_groups.find(g=>selectedDay>=g.start&&selectedDay<=g.end);
    document.getElementById('pk-day-number').textContent=`Day ${selectedDay}${calendar(selectedDay)?' · '+calendar(selectedDay):''}`;
    document.getElementById('pk-day-title').textContent=group.title;
    document.getElementById('pk-day-body').textContent=group.body;
    document.getElementById('pk-day-action').textContent=group.action;
    document.getElementById('pk-next').textContent=date.value?`Next cycle's Day 1 would be ${calendar(data.cycle_days+1)}, only if confirmed by your team.`:`Next cycle: Day 1 is ${data.cycle_days} days after this cycle starts, only if confirmed by your team.`;
  }
  root.addEventListener('click',event=>{const b=event.target.closest('[data-day]');if(b){selectedDay=Number(b.dataset.day);update();}});
  date?.addEventListener('change',update);phase?.addEventListener('change',update);
  document.getElementById('pk-clear')?.addEventListener('click',()=>{date.value='';update();});
  // Dates stay in memory: no storage, URL parameters, analytics or network requests.
  update();
})();
