/**
 * SACTCheck v0.70.1 engine-first homepage, cumulative reconciliation and progressive disclosure.
 */
(function(){
  'use strict';

  const ENGINE_FIRST_RELEASE = '0.70.1';

  function ensureEngineFirstStyles(){
    if(document.querySelector('link[data-engine-first-homepage]')) return;
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href=`css/homepage-engine-first-v0692.css?v=${ENGINE_FIRST_RELEASE}`;
    link.dataset.engineFirstHomepage='true';
    document.head.appendChild(link);
  }

  function ensureV0700Reconciliation(){
    if(document.querySelector('script[data-v0700-source-reconciliation]')) return;
    const script=document.createElement('script');
    script.src=`js/source-reconciliation-v0700.js?v=${ENGINE_FIRST_RELEASE}`;
    script.dataset.v0700SourceReconciliation='true';
    script.defer=true;
    document.head.appendChild(script);
  }

  function ensureV0701Reconciliation(){
    if(document.querySelector('script[data-v0701-source-reconciliation]')) return;
    const script=document.createElement('script');
    script.src=`js/source-reconciliation-v0701.js?v=${ENGINE_FIRST_RELEASE}`;
    script.dataset.v0701SourceReconciliation='true';
    script.defer=true;
    document.head.appendChild(script);
  }

  function setText(selector,text){
    const node=document.querySelector(selector);
    if(node) node.textContent=text;
    return node;
  }

  function applyReleaseLabel(){
    document.title=`SACTCheck v${ENGINE_FIRST_RELEASE} — Source Fidelity Hotfix`;
    const releaseMeta=document.querySelector('meta[name="sactcheck-release"]');
    if(releaseMeta) releaseMeta.setAttribute('content',ENGINE_FIRST_RELEASE);
    setText('.header-version',`v${ENGINE_FIRST_RELEASE}`);

    const releaseSummary=document.querySelector('#releaseSummary summary');
    if(releaseSummary) releaseSummary.textContent=`v${ENGINE_FIRST_RELEASE} · Lonsurf & ribociclib source fidelity`;

    const releaseDetail=document.querySelector('#releaseSummary .release-detail');
    if(releaseDetail){
      const strong=releaseDetail.querySelector('strong');
      if(strong) strong.textContent='Focused clinical source-fidelity hotfix';
      const textNodes=[...releaseDetail.childNodes].filter(node=>node.nodeType===3);
      if(textNodes.length){
        textNodes[0].textContent=' Lonsurf is reconciled to NCCP v4 with context-specific count thresholds; metastatic and adjuvant ribociclib receive source-faithful hepatic ×ULN, QT and ILD pathways. The current NCCP source remains authoritative.';
      }
    }

    document.querySelectorAll('.app-footer small').forEach(node=>{
      node.textContent=node.textContent.replace(/SACTCheck v\d+\.\d+\.\d+/g,`SACTCheck v${ENGINE_FIRST_RELEASE}`);
    });
  }

  function ensureSearchPerformanceNote(primary){
    if(!primary || primary.querySelector('.search-performance-note')) return;
    const note=document.createElement('p');
    note.className='search-performance-note';
    note.textContent='Searches regimen titles, medicines, trade names, NCCP numbers and indications. Close-spelling matching is used only when direct matching finds no result.';
    primary.appendChild(note);
  }

  function scrollToResults(){
    const catalogue=document.getElementById('libraryCatalogueSection');
    catalogue?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function focusSearch(){
    const search=document.getElementById('regimenSearch');
    search?.scrollIntoView({behavior:'smooth',block:'center'});
    window.setTimeout(()=>search?.focus(),180);
  }

  function moveSearchIntoEngine(){
    const heroCopy=document.querySelector('#studyHero .mission-hero-copy');
    const primary=document.querySelector('.library-search-primary');
    if(!heroCopy || !primary) return;

    ensureSearchPerformanceNote(primary);

    let entry=document.querySelector('.engine-first-entry');
    if(!entry){
      entry=document.createElement('section');
      entry.className='engine-first-entry';
      entry.setAttribute('aria-labelledby','engineFirstTitle');
      entry.innerHTML=`
        <div class="engine-first-heading">
          <div>
            <span class="engine-first-eyebrow">Primary workflow · SACTCheck Engine</span>
            <h2 id="engineFirstTitle">Find a regimen to assess</h2>
          </div>
          <span class="engine-first-protocol-count">376 NCCP protocols</span>
        </div>
        <p class="engine-first-copy">Search the exact NCCP regimen, then enter only the clinical information available for review.</p>
        <div class="engine-first-search-host"></div>
        <div class="engine-first-flow" aria-label="SACTCheck assessment workflow">
          <span><strong>1</strong> Find</span>
          <span><strong>2</strong> Assess</span>
          <span><strong>3</strong> Explain</span>
          <span><strong>4</strong> Verify</span>
        </div>
        <p class="engine-knowledge-hint" data-engine-knowledge-hint hidden></p>`;
      const lead=heroCopy.querySelector('.mission-hero-lead');
      if(lead) lead.insertAdjacentElement('afterend',entry);
      else heroCopy.prepend(entry);
    }

    const host=entry.querySelector('.engine-first-search-host');
    if(host && primary.parentElement!==host) host.appendChild(primary);

    const label=primary.querySelector('label[for="regimenSearch"]');
    if(label) label.textContent='Search regimen, medicine, indication or NCCP number';

    const clear=document.getElementById('clearLibraryFilters');
    if(clear) clear.textContent='Clear';

    const wrap=primary.querySelector('.library-search-wrap');
    if(wrap && !wrap.querySelector('[data-view-regimen-results]')){
      const view=document.createElement('button');
      view.type='button';
      view.className='btn engine-view-results';
      view.dataset.viewRegimenResults='true';
      view.textContent='View results ↓';
      view.addEventListener('click',scrollToResults);
      if(clear) wrap.insertBefore(view,clear);
      else wrap.appendChild(view);
    }

    const search=document.getElementById('regimenSearch');
    if(search && !search.dataset.engineFirstBound){
      search.dataset.engineFirstBound='true';
      search.addEventListener('keydown',event=>{
        if(event.key==='Enter'){
          event.preventDefault();
          scrollToResults();
        }
      });
    }
  }

  function refineHero(){
    const hero=document.getElementById('studyHero');
    if(!hero) return;

    setText('#studyHero .study-kicker','SACTCheck Engine · clinician-controlled NCCP decision support');
    setText('#studyHero .mission-hero-copy h1','NCCP regimen assessment at the point of care');
    setText(
      '#studyHero .mission-hero-lead',
      'Find the exact regimen, enter the clinical information available, see the encoded criterion beside each result and verify the official NCCP source.'
    );

    const purpose=hero.querySelector('.mission-hero-purpose');
    if(purpose){
      purpose.innerHTML='<strong>Primary purpose:</strong> make protocol assessment faster and clearer without hiding the reasoning or removing clinician control.';
    }

    const visualKicker=hero.querySelector('.mission-visual-brand span');
    if(visualKicker) visualKicker.textContent='SACTCHECK ENGINE';

    const actions=hero.querySelector('.mission-hero-actions');
    if(actions){
      const launch=actions.querySelector('.launch-engine-button');
      if(launch){
        launch.textContent='Browse all protocols ↓';
        launch.classList.add('engine-browse-button');
        launch.removeAttribute('data-focus-regimen-search');
        launch.addEventListener('click',scrollToResults);
      }

      const why=actions.querySelector('[data-open-study-info]');
      if(why) why.classList.add('engine-why-button');

      actions.querySelectorAll('[data-open-global-scenario],[data-open-nccp-tracker],[data-open-clinical-validation],[data-open-sustainability-module]')
        .forEach(button=>{ button.hidden=true; });
    }
  }

  function hideScenarioFromMainstream(){
    const experimental=new URLSearchParams(window.location.search).get('experimental')==='1';
    document.body.classList.toggle('scenario-experimental',experimental);
    if(experimental) return;

    const launcher=document.getElementById('clinicalScenarioLauncher');
    const panel=document.getElementById('globalScenarioInterpreter');
    if(launcher){
      launcher.hidden=true;
      launcher.setAttribute('aria-hidden','true');
    }
    if(panel){
      panel.hidden=true;
      panel.setAttribute('aria-hidden','true');
      panel.classList.add('scenario-collapsed');
      panel.classList.remove('scenario-expanded');
    }
    document.querySelectorAll('#studyHero [data-open-global-scenario]').forEach(button=>{button.hidden=true;});
  }

  function createSupportTool(icon,title,copy){
    const button=document.createElement('button');
    button.type='button';
    button.className='engine-support-card';
    button.innerHTML=`
      <span class="engine-support-icon" aria-hidden="true">${icon}</span>
      <span class="engine-support-text"><strong>${title}</strong><small>${copy}</small></span>
      <span class="engine-support-arrow" aria-hidden="true">→</span>`;
    return button;
  }

  function createSupportTools(){
    const portal=document.getElementById('portalSwitcher');
    if(!portal || document.getElementById('engineSupportTools')) return;

    const section=document.createElement('section');
    section.id='engineSupportTools';
    section.className='engine-support-tools library-only';
    section.setAttribute('aria-labelledby','engineSupportToolsTitle');

    const heading=document.createElement('div');
    heading.className='engine-support-heading';
    heading.innerHTML=`
      <div>
        <span>Supporting workspace</span>
        <h2 id="engineSupportToolsTitle">Useful when you need to go deeper</h2>
      </div>
      <p>The assessment engine stays primary. Governance, evidence and service-development tools remain one click away.</p>`;
    section.appendChild(heading);

    const grid=document.createElement('div');
    grid.className='engine-support-grid';

    const tracker=createSupportTool('↻','NCCP Change Tracker','Source surveillance, update history and reconciliation status.');
    tracker.dataset.engineTool='tracker';
    const badge=document.createElement('span');
    badge.className='engine-support-badge';
    badge.dataset.engineTrackerCount='true';
    badge.textContent='Source check pending';
    tracker.querySelector('.engine-support-text')?.appendChild(badge);
    tracker.addEventListener('click',()=>{
      const source=document.getElementById('nccpUpdateCountBadge')?.closest('button') ||
        document.querySelector('.nccp-tracker-header-button,[data-open-nccp-tracker]');
      source?.click();
    });

    const validation=createSupportTool('✓','Clinical validation','Source-reconciliation workspace and validation status.');
    validation.dataset.engineTool='validation';
    validation.addEventListener('click',()=>{
      const source=document.querySelector('.header-study-meta [data-open-clinical-validation]') ||
        document.querySelector('[data-open-clinical-validation]');
      source?.click();
    });

    const knowledge=createSupportTool('▤','Knowledge & evidence','Trial context and evidence profiles linked to exact regimens.');
    knowledge.dataset.engineTool='knowledge';
    knowledge.addEventListener('click',()=>{
      const hint=document.querySelector('[data-engine-knowledge-hint]');
      if(hint){
        hint.hidden=false;
        hint.textContent='Select a regimen to open its source-linked Regimen information & evidence profile.';
      }
      focusSearch();
    });

    const sustainability=createSupportTool('◌','Sustainability','Regimen delivery, waste and environmental context.');
    sustainability.dataset.engineTool='sustainability';
    sustainability.addEventListener('click',()=>{ window.location.href='sustainability.html'; });

    [tracker,validation,knowledge,sustainability].forEach(card=>grid.appendChild(card));
    section.appendChild(grid);
    portal.insertAdjacentElement('afterend',section);

    const sourceCount=document.getElementById('nccpUpdateCountBadge');
    const syncCount=()=>{
      const value=(sourceCount?.textContent || '').trim();
      if(!value || value.toLowerCase()==='pending'){
        badge.textContent='Source check pending';
        return;
      }
      badge.textContent=`${value} update${value==='1'?'':'s'}`;
    };
    syncCount();
    if(sourceCount && typeof MutationObserver!=='undefined'){
      new MutationObserver(syncCount).observe(sourceCount,{childList:true,characterData:true,subtree:true});
    }
  }

  function simplifyHeader(){
    document.querySelectorAll('.header-study-meta [data-open-clinical-validation]').forEach(button=>{
      button.classList.add('engine-header-secondary-hidden');
    });
  }

  function bindEngineFocus(){
    document.querySelectorAll('[data-focus-regimen-search]').forEach(button=>{
      if(button.dataset.engineFirstFocusBound) return;
      button.dataset.engineFirstFocusBound='true';
      button.addEventListener('click',focusSearch);
    });
  }

  function initialise(){
    ensureEngineFirstStyles();
    ensureV0700Reconciliation();
    ensureV0701Reconciliation();
    document.body.classList.add('engine-first-homepage');

    const catalogue=document.getElementById('libraryCatalogueSection');
    const hero=document.getElementById('studyHero');
    const library=document.getElementById('libraryScreen');
    if(library&&hero&&library.firstElementChild!==hero) library.insertBefore(hero,library.firstElementChild);

    refineHero();
    moveSearchIntoEngine();
    hideScenarioFromMainstream();
    createSupportTools();
    simplifyHeader();
    bindEngineFocus();
    applyReleaseLabel();

    document.dispatchEvent(new CustomEvent('sactcheck:engine-first-homepage-ready',{
      detail:{release:ENGINE_FIRST_RELEASE}
    }));
  }

  function reassertAfterLibraryRefresh(){
    window.setTimeout(()=>{
      applyReleaseLabel();
      simplifyHeader();
    },0);
  }

  window.addEventListener('sactcheck:protocols-loaded',reassertAfterLibraryRefresh);
  document.addEventListener('sactcheck:regimen-card-metadata-rendered',reassertAfterLibraryRefresh);

  ensureEngineFirstStyles();
  ensureV0700Reconciliation();
  ensureV0701Reconciliation();
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initialise);
  else initialise();
})();
