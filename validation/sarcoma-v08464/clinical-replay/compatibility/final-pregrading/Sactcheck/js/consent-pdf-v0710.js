/**
 * SACTCheck v0.71.1 — fixed two-page regimen consent PDF exporter.
 *
 * The output is intentionally constrained to exactly two A4 pages (one
 * double-sided sheet) for rapid clinic use.
 *
 * Structure:
 *   Page 1: treatment details -> generic SACT/chemotherapy -> regimen/agent risks
 *   Page 2: immunotherapy (when applicable) -> consent discussion -> signatures
 */
(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.SACTCheckConsentPdf=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';

  // Historical exporter identifier retained for cumulative regression compatibility.
  const VERSION='0.71.0';
  const RELEASE='0.71.3';
  const PAGE_W=595.28;
  const PAGE_H=841.89;
  const MARGIN=34;
  const CONTENT_W=PAGE_W-(MARGIN*2);
  const LEFT=MARGIN;
  const RIGHT=PAGE_W-MARGIN;
  const COLORS=Object.freeze({
    navy:[0.071,0.192,0.290],
    teal:[0.051,0.490,0.475],
    blue:[0.090,0.420,0.610],
    dark:[0.090,0.130,0.170],
    muted:[0.350,0.410,0.460],
    white:[1,1,1],
    paleBlue:[0.930,0.960,0.980],
    paleTeal:[0.920,0.980,0.970],
    paleAmber:[1.000,0.970,0.880],
    paleGrey:[0.960,0.970,0.980],
    line:[0.790,0.830,0.860],
    amber:[0.750,0.470,0.060]
  });

  function ascii(value){
    return String(value??'')
      .replace(/\u00A0/g,' ')
      .replace(/×/g,'x')
      .replace(/≥/g,'>=')
      .replace(/≤/g,'<=')
      .replace(/±/g,'+/-')
      .replace(/µ|μ/g,'micro')
      .replace(/α/g,'alpha')
      .replace(/β/g,'beta')
      .replace(/[‐‑‒–—―]/g,'-')
      .replace(/→/g,'->')
      .replace(/[‘’‚‛]/g,"'")
      .replace(/[“”„‟]/g,'"')
      .replace(/…/g,'...')
      .replace(/[•·]/g,'-')
      .replace(/[□☐]/g,'[ ]')
      .replace(/[✓✔☑]/g,'[x]')
      .replace(/®/g,'(R)')
      .replace(/™/g,'(TM)')
      .replace(/⁰/g,'^0')
      .replace(/¹/g,'^1')
      .replace(/²/g,'^2')
      .replace(/³/g,'^3')
      .replace(/⁴/g,'^4')
      .replace(/⁵/g,'^5')
      .replace(/⁶/g,'^6')
      .replace(/⁷/g,'^7')
      .replace(/⁸/g,'^8')
      .replace(/⁹/g,'^9')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g,'')
      // Never emit placeholder question marks for unsupported glyphs in a
      // consent form. Strip them after explicit clinical-symbol normalisation.
      .replace(/[^\x09\x0A\x0D\x20-\x7E]/g,' ')
      .replace(/\s+/g,' ')
      .trim();
  }

  function pdfEscape(value){
    return ascii(value).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/[\r\n]+/g,' ');
  }

  function bytes(value){
    const text=String(value);
    const out=new Uint8Array(text.length);
    for(let i=0;i<text.length;i+=1) out[i]=text.charCodeAt(i)&0xff;
    return out;
  }

  function concatBytes(parts){
    const total=parts.reduce((sum,part)=>sum+part.length,0);
    const out=new Uint8Array(total);
    let offset=0;
    parts.forEach(part=>{ out.set(part,offset); offset+=part.length; });
    return out;
  }

  function wrap(text,width,fontSize=9,bold=false){
    const source=ascii(text).replace(/\s+/g,' ').trim();
    if(!source) return [''];
    const avg=(bold?0.56:0.51)*fontSize;
    const max=Math.max(12,Math.floor(width/avg));
    const words=source.split(' ');
    const lines=[];
    let line='';
    for(const word of words){
      if(word.length>max){
        if(line){ lines.push(line); line=''; }
        for(let i=0;i<word.length;i+=max) lines.push(word.slice(i,i+max));
        continue;
      }
      const candidate=line?`${line} ${word}`:word;
      if(candidate.length<=max) line=candidate;
      else{ if(line) lines.push(line); line=word; }
    }
    if(line) lines.push(line);
    return lines.length?lines:[''];
  }

  class Page{
    constructor(number){
      this.number=number;
      this.commands=[];
      this.y=PAGE_H-MARGIN;
    }
    cmd(value){ this.commands.push(value); }
    color(gray=0){
      const g=Math.max(0,Math.min(1,gray));
      this.cmd(`${g.toFixed(3)} g`);
    }
    fillRgb(rgb){
      const c=rgb||COLORS.dark;
      this.cmd(`${c[0].toFixed(3)} ${c[1].toFixed(3)} ${c[2].toFixed(3)} rg`);
    }
    strokeRgb(rgb){
      const c=rgb||COLORS.line;
      this.cmd(`${c[0].toFixed(3)} ${c[1].toFixed(3)} ${c[2].toFixed(3)} RG`);
    }
    text(text,x,y,{size=9,bold=false,gray=null,color=null}={}){
      if(color) this.fillRgb(color);
      else this.color(gray===null?0:gray);
      this.cmd(`BT /${bold?'F2':'F1'} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${pdfEscape(text)}) Tj ET`);
    }
    line(x1,y1,x2,y2,{gray=null,color=null,width=.6}={}){
      if(color) this.strokeRgb(color);
      else this.cmd(`${(gray===null?.7:gray).toFixed(3)} G`);
      this.cmd(`${width} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
    }
    rect(x,y,w,h,{gray=null,color=null,width=.7,fill=null,fillColor=null}={}){
      if(fillColor){
        this.fillRgb(fillColor);
        this.cmd(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
      }else if(fill!==null){
        this.cmd(`${fill.toFixed(3)} g ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
      }
      if(color) this.strokeRgb(color);
      else this.cmd(`${(gray===null?.82:gray).toFixed(3)} G`);
      this.cmd(`${width} w ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`);
    }
    paragraph(text,x,y,width,{size=8.2,bold=false,leading=10,gray=null,color=null,maxLines=99}={}){
      const lines=wrap(text,width,size,bold).slice(0,maxLines);
      lines.forEach((line,index)=>this.text(line,x,y-(index*leading),{size,bold,gray,color}));
      return y-(lines.length*leading);
    }
    sectionTitle(text,y,{theme='blue'}={}){
      const palette=theme==='immune'
        ? {fill:COLORS.paleAmber,border:COLORS.amber,text:COLORS.dark}
        : theme==='agent'
          ? {fill:COLORS.paleTeal,border:COLORS.teal,text:COLORS.dark}
          : theme==='neutral'
            ? {fill:COLORS.paleGrey,border:COLORS.line,text:COLORS.dark}
            : {fill:COLORS.paleBlue,border:COLORS.blue,text:COLORS.dark};
      this.rect(LEFT,y-17,CONTENT_W,19,{color:palette.border,width:.7,fillColor:palette.fill});
      this.text(text,LEFT+7,y-6,{size:9.2,bold:true,color:palette.text});
      return y-27;
    }
    check(text,x,y,width,{size=7.8,leading=9.4,detail='',frequency='',maxLines=2,color=COLORS.dark}={}){
      const suffix=frequency?` (${frequency})`:'';
      const body=detail?`${text}${suffix}: ${detail}`:`${text}${suffix}`;
      this.text('[ ]',x,y,{size:8,color});
      const lines=wrap(body,width-18,size,false).slice(0,maxLines);
      lines.forEach((line,index)=>this.text(line,x+17,y-(index*leading),{size,bold:index===0&&detail==='',color}));
      return y-(Math.max(1,lines.length)*leading)-2;
    }
    writeField(label,y,{lines=2}={}){
      this.text(label,LEFT,y,{size:8,bold:true,color:COLORS.dark});
      let yy=y-10;
      for(let i=0;i<lines;i+=1){
        this.line(LEFT,yy,RIGHT,yy,{color:COLORS.line,width:.5});
        yy-=15;
      }
      return yy-4;
    }
    footer(){
      const label=`SACTCheck v${RELEASE} | Regimen-specific SACT consent | Draft - clinician review required | Page ${this.number} of 2`;
      this.text(label,LEFT,18,{size:6.7,color:COLORS.muted});
    }
  }

  function riskLabelList(risks){
    return (Array.isArray(risks)?risks:[])
      .map(item=>({
        label:item?.label||'Risk',
        detail:item?.detail||'',
        frequency:item?.frequency||'',
        immuneCore:Boolean(item?.immuneCore),
        evidenceSpecific:Boolean(item?.evidenceSpecific)
      }))
      .filter(item=>item.label);
  }

  function normalisePayload(payload){
    const draft=payload?.draft||{};
    const fields=payload?.fields||{};
    const groups=Array.isArray(payload?.riskGroups)?payload.riskGroups:[];
    const generic=Array.isArray(payload?.genericRisks)
      ? payload.genericRisks
      : (groups.find(group=>group.kind==='generic'||/generic chemotherapy/i.test(group.title||''))?.risks||[]);
    const immune=Array.isArray(payload?.immuneRisks)
      ? payload.immuneRisks
      : (groups.find(group=>group.kind==='immunotherapy'||/immunotherapy|immune-related/i.test(group.title||''))?.risks||[]);
    let agents=Array.isArray(payload?.agentGroups)?payload.agentGroups:[];
    if(!agents.length){
      agents=groups.filter(group=>group.kind==='agent'||/agent-specific/i.test(group.title||'')).map(group=>({
        displayName:String(group.title||'Agent').replace(/\s*-\s*agent-specific risks.*$/i,''),
        clinicianAdded:Boolean(group.clinicianAdded),
        risks:group.risks||[]
      }));
    }

    return {
      generatedAt:payload?.generatedAt||new Date().toISOString(),
      title:draft.title||'SACT regimen',
      nccpCode:draft.nccpCode||'',
      nccpVersion:draft.nccpVersion||'',
      indication:fields.diagnosis||draft.indication||'',
      intent:fields.intent||draft.intent||'',
      components:Array.isArray(draft.components)?draft.components:[],
      baseComponents:Array.isArray(draft.baseComponents)?draft.baseComponents:(Array.isArray(draft.components)?draft.components:[]),
      addedAgents:Array.isArray(draft.addedAgents)?draft.addedAgents:[],
      schedule:draft.schedule||'',
      sourceUrl:draft.sourceUrl||'',
      genericRisks:riskLabelList(generic),
      immuneRisks:riskLabelList(immune),
      agentGroups:agents.map(group=>({
        displayName:group.displayName||group.component||'Agent',
        clinicianAdded:Boolean(group.clinicianAdded),
        module:group.module||null,
        category:group.category||null,
        risks:riskLabelList(group.risks)
      })),
      immuneFrequencySource:payload?.immuneFrequencySource||draft?.immuneFrequencySource||null,
      unmappedAgents:Array.isArray(draft?.coverage?.unmappedAgents)?draft.coverage.unmappedAgents:[],
      benefit:fields.benefit||'',
      alternatives:fields.alternatives||'',
      noTreatment:fields.noTreatment||'',
      customRisks:fields.customRisks||'',
      fertility:fields.fertility||'',
      questions:fields.questions||''
    };
  }

  function header(page,p){
    page.rect(0,PAGE_H-72,PAGE_W,72,{color:COLORS.navy,width:0,fillColor:COLORS.navy});
    page.text('SYSTEMIC ANTI-CANCER THERAPY (SACT)',LEFT,PAGE_H-35,{size:10,bold:true,color:COLORS.white});
    page.text('REGIMEN-SPECIFIC CONSENT',LEFT,PAGE_H-51,{size:7.4,bold:true,color:[0.78,0.91,0.91]});
    page.text(`SACTCheck v${RELEASE}`,RIGHT-82,PAGE_H-35,{size:7.4,bold:true,color:COLORS.white});
    page.y=PAGE_H-93;

    page.text(p.title,LEFT,page.y,{size:14,bold:true,color:COLORS.navy});
    const code=`NCCP ${p.nccpCode||'-'} | Version ${p.nccpVersion||'-'}`;
    page.rect(RIGHT-126,page.y-4,126,16,{color:COLORS.teal,width:.6,fillColor:COLORS.paleTeal});
    page.text(code,RIGHT-120,page.y,{size:7.5,bold:true,color:COLORS.teal});
    page.y-=21;

    page.rect(LEFT,page.y-38,CONTENT_W,40,{color:COLORS.line,width:.6,fillColor:[0.985,0.990,0.993]});
    page.text('Patient name: ___________________________________________',LEFT+7,page.y-10,{size:8.1,color:COLORS.dark});
    page.text('Hospital no.: __________________________',LEFT+302,page.y-10,{size:8.1,color:COLORS.dark});
    page.text('DOB: _________________________________',LEFT+7,page.y-27,{size:8.1,color:COLORS.dark});
    page.text('Date: _________________________________',LEFT+302,page.y-27,{size:8.1,color:COLORS.dark});
    page.y-=50;
  }

  function treatmentSummary(page,p){
    page.y=page.sectionTitle('TREATMENT / CONTEXT',page.y,{theme:'neutral'});
    const labelW=76;
    const textX=LEFT+labelW;
    const textW=CONTENT_W-labelW;
    const row=(label,value,maxLines=2)=>{
      page.text(label,LEFT,page.y,{size:7.5,bold:true,color:COLORS.muted});
      const next=page.paragraph(value||'[Clinician to confirm]',textX,page.y,textW,{size:7.8,leading:9.3,maxLines,color:COLORS.dark});
      page.y=Math.min(page.y-10,next)-3;
    };
    row('Diagnosis',p.indication,2);
    row('Intent',p.intent||'Clinician to confirm',1);
    row('Components',p.baseComponents.join(' + ')||p.components.join(' + ')||'Confirm against current NCCP source',2);
    row('Schedule',p.schedule||'Confirm against current NCCP source',2);
    if(p.addedAgents.length){
      page.rect(LEFT,page.y-25,CONTENT_W,27,{gray:.72,width:.6,fill:.97});
      page.text('CLINICIAN-ADDED AGENT(S)',LEFT+7,page.y-8,{size:7.2,bold:true,gray:.20});
      page.text(p.addedAgents.join(' + '),LEFT+132,page.y-8,{size:8.2,bold:true,color:COLORS.dark});
      page.text('Consent content added; this does NOT represent NCCP endorsement of the modified regimen.',LEFT+7,page.y-19,{size:6.8,color:COLORS.muted});
      page.y-=35;
    }
  }

  function renderGeneric(page,p){
    page.y=page.sectionTitle('1. GENERIC SACT / CHEMOTHERAPY CONSENT',page.y,{theme:'blue'});
    const universal=[
      'Purpose, planned treatment and expected benefit explained',
      'Treatment may be delayed, interrupted, dose-reduced or stopped because of toxicity',
      'Unexpected or rare serious adverse effects can occur',
      'Supportive medicines, interactions and when to contact the oncology team discussed',
      'Pregnancy avoidance / contraception / fertility discussed where relevant',
      'Patient understands consent is voluntary and can be withdrawn'
    ];
    const items=[...universal];
    if(p.genericRisks.length){
      p.genericRisks.forEach(item=>items.push(item.label));
    }
    const unique=[...new Set(items)];
    const columnGap=16;
    const colW=(CONTENT_W-columnGap)/2;
    const half=Math.ceil(unique.length/2);
    let leftY=page.y;
    let rightY=page.y;
    unique.slice(0,half).forEach(text=>{ leftY=page.check(text,LEFT,leftY,colW,{size:7.2,leading:8.6,maxLines:2}); });
    unique.slice(half).forEach(text=>{ rightY=page.check(text,LEFT+colW+columnGap,rightY,colW,{size:7.2,leading:8.6,maxLines:2}); });
    page.y=Math.min(leftY,rightY)-5;
  }

  function renderAgents(page,p){
    page.y=page.sectionTitle('2. REGIMEN / AGENT-SPECIFIC MATERIAL RISKS',page.y,{theme:'agent'});
    if(p.unmappedAgents.length){
      page.rect(LEFT,page.y-29,CONTENT_W,31,{color:COLORS.amber,width:.8,fillColor:COLORS.paleAmber});
      page.text('MANUAL AGENT REVIEW REQUIRED',LEFT+7,page.y-9,{size:7.5,bold:true,color:COLORS.dark});
      page.paragraph(p.unmappedAgents.join(', '),LEFT+7,page.y-19,CONTENT_W-14,{size:7.3,bold:true,leading:8,maxLines:2,color:COLORS.dark});
      page.y-=38;
    }

    if(!p.agentGroups.length){
      page.text('[No mapped agent-specific consent profile available.]',LEFT,page.y,{size:8,color:COLORS.muted});
      page.y-=14;
      return;
    }

    const gap=12;
    const colW=(CONTENT_W-gap)/2;
    const columns=[{x:LEFT,y:page.y},{x:LEFT+colW+gap,y:page.y}];
    const groups=[...p.agentGroups].sort((a,b)=>Number(Boolean(b.clinicianAdded))-Number(Boolean(a.clinicianAdded)));

    function cardHeight(group){
      const n=Math.min(7,Math.max(1,group.risks.length));
      return 28+(n*11)+(group.risks.length>7?10:0);
    }

    groups.forEach(group=>{
      let col=columns[0].y>=columns[1].y?columns[0]:columns[1];
      const h=cardHeight(group);
      const isImmune=group.module==='immune_checkpoint_inhibitor';
      const fill=isImmune?COLORS.paleTeal:COLORS.paleBlue;
      const border=isImmune?COLORS.teal:COLORS.blue;
      const titleColor=isImmune?COLORS.teal:COLORS.navy;
      page.rect(col.x,col.y-h+5,colW,h,{color:border,width:.8,fillColor:fill});
      const tag=group.clinicianAdded?' [CLINICIAN ADDED]':'';
      page.text(`${group.displayName}${tag}`,col.x+7,col.y-8,{size:8.5,bold:true,color:titleColor});
      if(isImmune){
        page.text('Immune checkpoint inhibitor - core material risks',col.x+7,col.y-18,{size:6.5,bold:true,color:COLORS.muted});
      }
      let yy=col.y-(isImmune?30:20);
      const risks=group.risks.length?group.risks:[{label:'Review current medicine-specific material risks',detail:'',frequency:''}];
      risks.slice(0,7).forEach(item=>{
        yy=page.check(item.label,col.x+7,yy,colW-14,{size:7.05,leading:8.2,maxLines:2,frequency:item.frequency||'',color:COLORS.dark});
      });
      if(risks.length>7){
        yy=page.check(`Additional material risks in source (${risks.length-7} more)`,col.x+7,yy,colW-14,{size:6.8,leading:8,maxLines:1,color:COLORS.muted});
      }
      col.y=col.y-h-6;
    });

    page.y=Math.min(columns[0].y,columns[1].y)-1;
    if(page.y<58){
      page.text('Current medicine information and patient-specific material risks must still be reviewed.',LEFT,52,{size:6.5,bold:true,color:COLORS.muted});
      page.y=44;
    }
  }

  function renderImmune(page,p){
    if(!p.immuneRisks.length) return;
    page.y=page.sectionTitle('3. RARE / IMPORTANT IMMUNE-RELATED RISKS',page.y,{theme:'immune'});

    const gap=16;
    const colW=(CONTENT_W-gap)/2;
    const half=Math.ceil(p.immuneRisks.length/2);
    let leftY=page.y;
    let rightY=page.y;

    p.immuneRisks.slice(0,half).forEach(item=>{
      leftY=page.check(item.label,LEFT,leftY,colW,{
        size:7.15,leading:8.4,maxLines:2,frequency:item.frequency||'',color:COLORS.dark
      });
    });
    p.immuneRisks.slice(half).forEach(item=>{
      rightY=page.check(item.label,LEFT+colW+gap,rightY,colW,{
        size:7.15,leading:8.4,maxLines:2,frequency:item.frequency||'',color:COLORS.dark
      });
    });
    page.y=Math.min(leftY,rightY)-4;

    page.rect(LEFT,page.y-31,CONTENT_W,33,{color:COLORS.amber,width:.6,fillColor:[1.0,0.985,0.94]});
    page.paragraph(
      'Immune toxicity can affect almost any organ, may begin during treatment or after treatment has stopped, and can occasionally be life-threatening. New significant symptoms require prompt assessment.',
      LEFT+7,page.y-9,CONTENT_W-14,{size:6.8,bold:true,leading:7.8,maxLines:3,color:COLORS.dark}
    );
    page.y-=38;

    if(p.immuneFrequencySource){
      const src=p.immuneFrequencySource;
      const note=`* Approximate incidence from ${src.population||'the cited safety population'} in ${src.label||'current product information'}; ${src.caveat||'risk may differ by treatment context and patient factors.'}`;
      page.y=page.paragraph(note,LEFT,page.y,CONTENT_W,{size:5.9,leading:6.8,maxLines:3,color:COLORS.muted})-3;
    }
  }

  function renderConsentDiscussion(page,p,{spacious=false}={}){
    page.y=page.sectionTitle(p.immuneRisks.length?'4. CONSENT DISCUSSION':'3. CONSENT DISCUSSION',page.y,{theme:'neutral'});
    const fieldLines=spacious?3:2;

    if(p.benefit){
      page.text('Expected benefit / aim of treatment',LEFT,page.y,{size:8,bold:true,color:COLORS.dark});
      page.y=page.paragraph(p.benefit,LEFT,page.y-10,CONTENT_W,{size:7.8,leading:9,maxLines:fieldLines+1,color:COLORS.dark})-3;
    }else page.y=page.writeField('Expected benefit / aim of treatment',page.y,{lines:fieldLines});

    if(p.alternatives){
      page.text('Reasonable alternatives discussed',LEFT,page.y,{size:8,bold:true,color:COLORS.dark});
      page.y=page.paragraph(p.alternatives,LEFT,page.y-10,CONTENT_W,{size:7.8,leading:9,maxLines:fieldLines+1,color:COLORS.dark})-3;
    }else page.y=page.writeField('Reasonable alternatives discussed',page.y,{lines:fieldLines});

    if(p.noTreatment){
      page.text('If treatment does not proceed',LEFT,page.y,{size:8,bold:true,color:COLORS.dark});
      page.y=page.paragraph(p.noTreatment,LEFT,page.y-10,CONTENT_W,{size:7.8,leading:9,maxLines:fieldLines+1,color:COLORS.dark})-3;
    }else page.y=page.writeField('If treatment does not proceed',page.y,{lines:fieldLines});

    page.y=page.writeField('Additional patient-specific material risks / priorities',page.y,{lines:fieldLines});

    page.text('[ ] Pregnancy / contraception / fertility discussed where relevant',LEFT,page.y,{size:7.7,color:COLORS.dark});
    page.text('[ ] Written / electronic medicine information offered where appropriate',LEFT+286,page.y,{size:7.3,color:COLORS.dark});
    page.y-=17;
    page.text('[ ] Patient questions invited and answered',LEFT,page.y,{size:7.7,color:COLORS.dark});
    page.text('[ ] Emergency contact / toxicity advice discussed',LEFT+286,page.y,{size:7.3,color:COLORS.dark});
    page.y-=18;
  }

  function renderSignatures(page){
    page.y=page.sectionTitle('CONSENT',page.y,{theme:'neutral'});
    const statements=[
      'I have had the opportunity to discuss the proposed treatment, expected benefits, material risks and alternatives.',
      'I understand that I can ask further questions and that I may withdraw consent.',
      'I consent to the systemic anti-cancer treatment described above.'
    ];
    statements.forEach(text=>{ page.y=page.check(text,LEFT,page.y,CONTENT_W,{size:7.6,leading:9,maxLines:2}); });
    page.y-=4;

    page.line(LEFT,page.y,LEFT+230,page.y,{gray:.55,width:.6});
    page.line(LEFT+286,page.y,RIGHT,page.y,{gray:.55,width:.6});
    page.text('Patient / person giving consent',LEFT,page.y-10,{size:6.9,gray:.35});
    page.text('Date',LEFT+286,page.y-10,{size:6.9,gray:.35});
    page.y-=31;

    page.line(LEFT,page.y,LEFT+230,page.y,{gray:.55,width:.6});
    page.line(LEFT+286,page.y,RIGHT,page.y,{gray:.55,width:.6});
    page.text('Clinician obtaining consent',LEFT,page.y-10,{size:6.9,gray:.35});
    page.text('Date',LEFT+286,page.y-10,{size:6.9,gray:.35});
    page.y-=25;

    page.text('Clinician registration no.: _______________________________',LEFT,page.y,{size:7.2});
    page.y-=14;
  }

  function renderGovernance(page,p){
    page.line(LEFT,page.y,RIGHT,page.y,{gray:.72,width:.5});
    page.y-=10;
    page.paragraph(
      'This form is a regimen-specific consent discussion aid. The current NCCP regimen, HSE National Consent Policy, current medicine information, patient-specific material risks and clinician judgement remain authoritative. Agent-specific consent modules remain pending independent clinical and oncology-pharmacy validation.',
      LEFT,page.y,CONTENT_W,{size:6.4,leading:7.4,gray:.36,maxLines:4}
    );
    page.y-=31;
    if(p.addedAgents.length){
      page.paragraph(
        'Clinician-added agents are explicitly labelled because their addition modifies the treatment selection beyond the referenced base regimen. Inclusion in this consent form does not constitute NCCP endorsement of that combination.',
        LEFT,page.y,CONTENT_W,{size:6.4,bold:true,leading:7.4,gray:.28,maxLines:3}
      );
      page.y-=24;
    }
    if(p.sourceUrl){
      page.paragraph(`Base regimen source: ${p.sourceUrl}`,LEFT,page.y,CONTENT_W,{size:6.0,leading:7,gray:.42,maxLines:2});
    }
  }

  function renderDocument(payload){
    const p=normalisePayload(payload);
    const page1=new Page(1);
    const page2=new Page(2);

    header(page1,p);
    treatmentSummary(page1,p);
    renderGeneric(page1,p);
    renderAgents(page1,p);

    // Use spare page-1 space for the rare/important immune section where it
    // safely fits. This keeps the double-sided form visually balanced without
    // allowing content to collide with the footer on complex regimens.
    const immuneEstimatedHeight=p.immuneRisks.length
      ? 27+(Math.ceil(p.immuneRisks.length/2)*10)+38+(p.immuneFrequencySource?24:0)
      : 0;
    const immuneOnPage1=Boolean(
      p.immuneRisks.length && (page1.y-immuneEstimatedHeight)>72
    );
    if(immuneOnPage1) renderImmune(page1,p);

    header(page2,p);
    if(p.immuneRisks.length && !immuneOnPage1) renderImmune(page2,p);
    renderConsentDiscussion(page2,p,{spacious:immuneOnPage1});
    renderSignatures(page2);
    renderGovernance(page2,p);

    page1.footer();
    page2.footer();
    return [page1.commands,page2.commands];
  }

  function buildPdf(payload){
    const pages=renderDocument(payload);
    const pageCount=2;
    const catalogObj=1, pagesObj=2, fontRegularObj=3, fontBoldObj=4;
    const pageObjs=[];
    const contentObjs=[];
    let next=5;
    for(let i=0;i<pageCount;i+=1){ pageObjs.push(next++); contentObjs.push(next++); }
    const totalObjects=next-1;
    const objects=new Array(totalObjects+1);
    objects[catalogObj]=`<< /Type /Catalog /Pages ${pagesObj} 0 R >>`;
    objects[pagesObj]=`<< /Type /Pages /Count 2 /Kids [${pageObjs.map(n=>`${n} 0 R`).join(' ')}] >>`;
    objects[fontRegularObj]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
    objects[fontBoldObj]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';

    for(let i=0;i<pageCount;i+=1){
      const stream=pages[i].join('\n')+'\n';
      objects[pageObjs[i]]=`<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 ${PAGE_W.toFixed(2)} ${PAGE_H.toFixed(2)}] /Resources << /Font << /F1 ${fontRegularObj} 0 R /F2 ${fontBoldObj} 0 R >> >> /Contents ${contentObjs[i]} 0 R >>`;
      objects[contentObjs[i]]=`<< /Length ${bytes(stream).length} >>\nstream\n${stream}endstream`;
    }

    const parts=[bytes('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')];
    const offsets=new Array(totalObjects+1).fill(0);
    let offset=parts[0].length;
    for(let i=1;i<=totalObjects;i+=1){
      offsets[i]=offset;
      const part=bytes(`${i} 0 obj\n${objects[i]}\nendobj\n`);
      parts.push(part);
      offset+=part.length;
    }
    const xrefOffset=offset;
    let xref=`xref\n0 ${totalObjects+1}\n0000000000 65535 f \n`;
    for(let i=1;i<=totalObjects;i+=1) xref+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`;
    xref+=`trailer\n<< /Size ${totalObjects+1} /Root ${catalogObj} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
    parts.push(bytes(xref));
    return concatBytes(parts);
  }

  function filename(payload){
    const code=ascii(payload?.draft?.nccpCode||'regimen').replace(/[^A-Za-z0-9_-]+/g,'_');
    const added=Array.isArray(payload?.draft?.addedAgents)&&payload.draft.addedAgents.length?'_custom':'';
    const date=new Date(payload?.generatedAt||Date.now()).toISOString().slice(0,10);
    return `SACTCheck_Consent_NCCP_${code}${added}_${date}.pdf`;
  }

  function openInViewer(payload,targetWindow=null){
    const data=buildPdf(payload);
    const file=filename(payload);
    if(!root?.document||!root?.URL||typeof Blob==='undefined'){
      return {bytes:data,filename:file,pages:2,opened:false};
    }
    const blob=new Blob([data],{type:'application/pdf'});
    const url=root.URL.createObjectURL(blob);
    let viewer=targetWindow;

    if(viewer && viewer.closed) viewer=null;
    if(!viewer && root?.open) viewer=root.open("about:blank","_blank");

    if(!viewer){
      root.setTimeout?.(()=>root.URL.revokeObjectURL(url),60000);
      return {bytes:data,filename:file,pages:2,opened:false,blocked:true};
    }

    try{
      viewer.location.replace(url);
    }catch(_){
      try{ viewer.location.href=url; }
      catch(error){
        root.setTimeout?.(()=>root.URL.revokeObjectURL(url),60000);
        return {bytes:data,filename:file,pages:2,opened:false,blocked:true,error:String(error?.message||error)};
      }
    }

    // Keep the Blob URL alive long enough for built-in browser PDF controls
    // (print/download) to work normally.
    root.setTimeout?.(()=>root.URL.revokeObjectURL(url),10*60*1000);
    return {bytes:data,filename:file,pages:2,opened:true,url};
  }

  function download(payload){
    const data=buildPdf(payload);
    if(!root?.document||!root?.URL||typeof Blob==='undefined'){
      return {bytes:data,filename:filename(payload),pages:2};
    }
    const blob=new Blob([data],{type:'application/pdf'});
    const url=root.URL.createObjectURL(blob);
    const link=root.document.createElement('a');
    link.href=url;
    link.download=filename(payload);
    link.rel='noopener';
    root.document.body.appendChild(link);
    link.click();
    link.remove();
    root.setTimeout?.(()=>root.URL.revokeObjectURL(url),1500);
    return {bytes:data,filename:filename(payload),pages:2};
  }

  return Object.freeze({
    version:VERSION,
    release:RELEASE,
    ascii,
    pdfEscape,
    wrap,
    normalisePayload,
    renderDocument,
    buildPdf,
    filename,
    openInViewer,
    download
  });
});
