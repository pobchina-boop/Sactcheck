(function(){
  'use strict';
  const root=document.querySelector('[data-patient-knowledge]');
  const dataNode=document.getElementById('pk-data');
  if(!root||!dataNode)return;
  const data=JSON.parse(dataNode.textContent);
  document.documentElement.classList.add('pk-reference-mode');

  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[ch]));

  function source(id){return data.sources.find(item=>item.id===id)||null;}
  function sourceLink(id,label){
    const item=source(id);if(!item)return '';
    return `<a class="pk-source-chip" href="#source-${esc(id)}">${esc(label||item.title)}</a>`;
  }

  const nav=root.querySelector('.pk-nav');
  if(nav){
    nav.innerHTML=`
      <a href="#medicines">How it works</a>
      <a href="#phases">Treatment plan</a>
      <a href="#cycle">Cycle overview</a>
      <a href="#support">Practical support</a>
      <a href="#urgent">When to get help</a>
      <a href="#questions">Questions</a>
      <a href="#sources">Evidence & sources</a>`;

    const banner=document.createElement('aside');
    banner.className='pk-evidence-banner';
    banner.innerHTML=`
      <div>
        <strong>Evidence-linked patient information</strong>
        <p>This page uses the same regimen identity and source structure as the clinician knowledge base, translated into patient language. Schedule information is anchored to the current NCCP regimen; medicine explanations link to the original sources below.</p>
      </div>
      <div class="pk-evidence-links">
        ${sourceLink('nccp','NCCP regimen')}
        ${sourceLink('pembro','Pembrolizumab')}
        ${sourceLink('pemetrexed','Pemetrexed')}
        ${sourceLink('carboplatin','Carboplatin')}
      </div>`;
    nav.insertAdjacentElement('afterend',banner);
  }

  const cycle=document.getElementById('cycle');
  if(cycle){
    const phaseCards=(data.phases||[]).map((phase,index)=>{
      const names=(phase.agents||[]).map(id=>data.agents.find(a=>a.id===id)?.name).filter(Boolean);
      return `<article class="pk-reference-card ${index===0?'active-phase':''}">
        <div class="pk-type">${esc(phase.short||'Treatment phase')}</div>
        <h3>${esc(phase.label)}</h3>
        <p>${esc(phase.detail)}</p>
        <p class="pk-small"><strong>Medicines:</strong> ${esc(names.join(' + '))}</p>
      </article>`;
    }).join('');

    const practical=(data.day_groups||[]).map(group=>`<article class="pk-cycle-note">
      <strong>Day ${group.start}${group.end!==group.start?'–'+group.end:''}</strong>
      <span>${esc(group.title)}</span>
      <p>${esc(group.body)}</p>
    </article>`).join('');

    cycle.innerHTML=`
      <div class="pk-eyebrow">Treatment schedule</div>
      <h2>What a 21-day cycle means</h2>
      <p class="pk-lead">Treatment is planned in 21-day cycles, but symptoms do not follow a fixed calendar. You do not need to enter dates or choose a day. Use this section to understand the treatment structure, then use the symptom and urgent-advice sections according to how you actually feel.</p>
      <div class="pk-reference-grid">${phaseCards}</div>
      <div class="pk-note immune"><strong>No “safe-day” assumption.</strong> Infection, treatment toxicity and immune-related effects can occur outside a predicted window. New or worsening symptoms matter more than the cycle day.</div>
      <h3 class="pk-subheading">A simple orientation to the cycle</h3>
      <div class="pk-cycle-reference">${practical}</div>
      <p class="pk-small">This is explanatory context, not a forecast of blood counts, side-effect timing or whether the next treatment will proceed. ${sourceLink('nccp','NCCP schedule')} ${sourceLink('hse','HSE safety guidance')}</p>`;
  }

  const hero=document.querySelector('.pk-hero .pk-shell');
  if(hero){
    const tags=[...hero.querySelectorAll('.pk-tag')];
    const review=tags.find(tag=>/draft|review/i.test(tag.textContent||''));
    if(review) review.textContent='Evidence-linked patient reference · clinical/PPI review draft';
  }
})();
