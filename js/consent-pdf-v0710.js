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
  const RELEASE='0.71.1';
  const PAGE_W=595.28;
  const PAGE_H=841.89;
  const MARGIN=34;
  const CONTENT_W=PAGE_W-(MARGIN*2);
  const LEFT=MARGIN;
  const RIGHT=PAGE_W-MARGIN;

  function ascii(value){
    return String(value??'')
      .replace(/×/g,'x')
      .replace(/≥/g,'>=')
      .replace(/≤/g,'<=')
      .replace(/[–—]/g,'-')
      .replace(/→/g,'->')
      .replace(/[‘’]/g,"'")
      .replace(/[“”]/g,'"')
      .replace(/…/g,'...')
      .replace(/•/g,'-')
      .replace(/□/g,'[ ]')
      .replace(/✓/g,'[x]')
      .replace(/®/g,'(R)')
      .replace(/™/g,'(TM)')
      .replace(/²/g,'^2')
      .replace(/³/g,'^3')
      .replace(/⁹/g,'^9')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g,'')
      .replace(/[^\x09\x0A\x0D\x20-\x7E]/g,'?');
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
    text(text,x,y,{size=9,bold=false,gray=0}={}){
      this.color(gray);
      this.cmd(`BT /${bold?'F2':'F1'} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${pdfEscape(text)}) Tj ET`);
    }
    line(x1,y1,x2,y2,{gray=.7,width=.6}={}){
      this.cmd(`${gray.toFixed(3)} G ${width} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
    }
    rect(x,y,w,h,{gray=.82,width=.7,fill=null}={}){
      if(fill!==null){
        this.cmd(`${fill.toFixed(3)} g ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
      }
      this.cmd(`${gray.toFixed(3)} G ${width} w ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`);
    }
    paragraph(text,x,y,width,{size=8.2,bold=false,leading=10,gray=0,maxLines=99}={}){
      const lines=wrap(text,width,size,bold).slice(0,maxLines);
      lines.forEach((line,index)=>this.text(line,x,y-(index*leading),{size,bold,gray}));
      return y-(lines.length*leading);
    }
    sectionTitle(text,y){
      this.rect(LEFT,y-14,CONTENT_W,17,{gray:.82,width:.5,fill:.94});
      this.text(text,LEFT+7,y-2,{size:9.2,bold:true,gray:.08});
      return y-23;
    }
    check(text,x,y,width,{size=7.8,leading=9.4,detail='',maxLines=2}={}){
      const body=detail?`${text}: ${detail}`:text;
      this.text('[ ]',x,y,{size:8,bold:false});
      const lines=wrap(body,width-18,size,false).slice(0,maxLines);
      lines.forEach((line,index)=>this.text(line,x+17,y-(index*leading),{size,bold:index===0&&detail==='',gray:.02}));
      return y-(Math.max(1,lines.length)*leading)-2;
    }
    writeField(label,y,{lines=2}={}){
      this.text(label,LEFT,y,{size:8,bold:true,gray:.18});
      let yy=y-10;
      for(let i=0;i<lines;i+=1){
        this.line(LEFT,yy,RIGHT,yy,{gray:.7,width:.5});
        yy-=15;
      }
      return yy-4;
    }
    footer(){
      const label=`SACTCheck v${RELEASE} | Regimen-specific SACT consent | Draft - clinician review required | Page ${this.number} of 2`;
      this.text(label,LEFT,18,{size:6.7,gray:.42});
    }
  }

  function riskLabelList(risks){
    return (Array.isArray(risks)?risks:[])
      .map(item=>({label:item?.label||'Risk',detail:item?.detail||''}))
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
        risks:riskLabelList(group.risks)
      })),
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
    page.text('SYSTEMIC ANTI-CANCER THERAPY (SACT) - CONSENT',LEFT,page.y,{size:11,bold:true,gray:.08});
    page.text(`SACTCheck v${RELEASE}`,RIGHT-78,page.y,{size:7.2,bold:true,gray:.35});
    page.y-=18;
    page.line(LEFT,page.y,RIGHT,page.y,{gray:.28,width:1.1});
    page.y-=15;

    page.text(p.title,LEFT,page.y,{size:13,bold:true,gray:.03});
    page.y-=14;
    const code=`NCCP ${p.nccpCode||'-'} | Version ${p.nccpVersion||'-'}`;
    page.text(code,LEFT,page.y,{size:8,bold:true,gray:.30});
    page.y-=14;

    page.rect(LEFT,page.y-38,CONTENT_W,40,{gray:.72,width:.6,fill:.975});
    page.text('Patient name: ___________________________________________',LEFT+7,page.y-10,{size:8.1});
    page.text('Hospital no.: __________________________',LEFT+302,page.y-10,{size:8.1});
    page.text('DOB: _________________________________',LEFT+7,page.y-27,{size:8.1});
    page.text('Date: _________________________________',LEFT+302,page.y-27,{size:8.1});
    page.y-=50;
  }

  function treatmentSummary(page,p){
    page.y=page.sectionTitle('TREATMENT / CONTEXT',page.y);
    const labelW=76;
    const textX=LEFT+labelW;
    const textW=CONTENT_W-labelW;
    const row=(label,value,maxLines=2)=>{
      page.text(label,LEFT,page.y,{size:7.5,bold:true,gray:.30});
      const next=page.paragraph(value||'[Clinician to confirm]',textX,page.y,textW,{size:7.8,leading:9.3,maxLines});
      page.y=Math.min(page.y-10,next)-3;
    };
    row('Diagnosis',p.indication,2);
    row('Intent',p.intent||'Clinician to confirm',1);
    row('Components',p.baseComponents.join(' + ')||p.components.join(' + ')||'Confirm against current NCCP source',2);
    row('Schedule',p.schedule||'Confirm against current NCCP source',2);
    if(p.addedAgents.length){
      page.rect(LEFT,page.y-25,CONTENT_W,27,{gray:.72,width:.6,fill:.97});
      page.text('CLINICIAN-ADDED AGENT(S)',LEFT+7,page.y-8,{size:7.2,bold:true,gray:.20});
      page.text(p.addedAgents.join(' + '),LEFT+132,page.y-8,{size:8.2,bold:true});
      page.text('Consent content added; this does NOT represent NCCP endorsement of the modified regimen.',LEFT+7,page.y-19,{size:6.8,gray:.34});
      page.y-=35;
    }
  }

  function renderGeneric(page,p){
    page.y=page.sectionTitle('1. GENERIC SACT / CHEMOTHERAPY CONSENT',page.y);
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
    page.y=page.sectionTitle('2. REGIMEN / AGENT-SPECIFIC MATERIAL RISKS',page.y);
    if(p.unmappedAgents.length){
      page.rect(LEFT,page.y-29,CONTENT_W,31,{gray:.55,width:.8,fill:.96});
      page.text('MANUAL AGENT REVIEW REQUIRED',LEFT+7,page.y-9,{size:7.5,bold:true});
      page.paragraph(p.unmappedAgents.join(', '),LEFT+7,page.y-19,CONTENT_W-14,{size:7.3,bold:true,leading:8,maxLines:2});
      page.y-=38;
    }

    if(!p.agentGroups.length){
      page.text('[No mapped agent-specific consent profile available.]',LEFT,page.y,{size:8,gray:.30});
      page.y-=14;
      return;
    }

    const gap=14;
    const colW=(CONTENT_W-gap)/2;
    const columns=[{x:LEFT,y:page.y},{x:LEFT+colW+gap,y:page.y}];
    const groups=[...p.agentGroups].sort((a,b)=>Number(Boolean(b.clinicianAdded))-Number(Boolean(a.clinicianAdded)));

    function estimatedHeight(group){
      return 14+(Math.max(1,group.risks.length)*10);
    }

    groups.forEach(group=>{
      let col=columns[0].y>=columns[1].y?columns[0]:columns[1];
      const need=estimatedHeight(group);
      if(col.y-need<76){
        // Keep the two-page form safe: compact rather than silently creating page 3.
        const other=col===columns[0]?columns[1]:columns[0];
        col=other.y>col.y?other:col;
      }
      const tag=group.clinicianAdded?' [CLINICIAN ADDED]':'';
      page.text(`${group.displayName}${tag}`,col.x,col.y,{size:8.2,bold:true,gray:group.clinicianAdded?.08:.18});
      col.y-=11;
      const risks=group.risks.length?group.risks:[{label:'Review current medicine-specific material risks',detail:''}];
      risks.slice(0,6).forEach(item=>{
        col.y=page.check(item.label,col.x,col.y,colW,{size:7.1,leading:8.4,maxLines:2});
      });
      if(risks.length>6){
        col.y=page.check(`Additional material risks in source (${risks.length-6} more)`,col.x,col.y,colW,{size:6.9,leading:8,maxLines:1});
      }
      col.y-=4;
    });
    page.y=Math.min(columns[0].y,columns[1].y)-3;
    if(page.y<62){
      page.text('Agent-specific content is dense: current medicine information and patient-specific material risks must still be reviewed.',LEFT,55,{size:6.7,bold:true,gray:.25});
      page.y=47;
    }
  }

  function renderImmune(page,p){
    if(!p.immuneRisks.length) return;
    page.y=page.sectionTitle('3. IMMUNOTHERAPY / IMMUNE-RELATED RISKS',page.y);
    const labels=[...new Set(p.immuneRisks.map(item=>item.label))];
    const gap=16;
    const colW=(CONTENT_W-gap)/2;
    const half=Math.ceil(labels.length/2);
    let leftY=page.y;
    let rightY=page.y;
    labels.slice(0,half).forEach(text=>{ leftY=page.check(text,LEFT,leftY,colW,{size:7.4,leading:8.8,maxLines:2}); });
    labels.slice(half).forEach(text=>{ rightY=page.check(text,LEFT+colW+gap,rightY,colW,{size:7.4,leading:8.8,maxLines:2}); });
    page.y=Math.min(leftY,rightY)-7;
    page.paragraph('Immune-related adverse events can affect almost any organ, may occur during or after treatment, and can require steroids, other immunosuppression, hormone replacement, hospital care, treatment interruption or permanent discontinuation.',LEFT,page.y,CONTENT_W,{size:7.1,bold:true,leading:8.6,maxLines:3});
    page.y-=31;
  }

  function renderConsentDiscussion(page,p){
    page.y=page.sectionTitle(p.immuneRisks.length?'4. CONSENT DISCUSSION':'3. CONSENT DISCUSSION',page.y);

    if(p.benefit){
      page.text('Expected benefit / aim of treatment',LEFT,page.y,{size:8,bold:true});
      page.y=page.paragraph(p.benefit,LEFT,page.y-10,CONTENT_W,{size:7.8,leading:9,maxLines:3})-3;
    }else page.y=page.writeField('Expected benefit / aim of treatment',page.y,{lines:2});

    if(p.alternatives){
      page.text('Reasonable alternatives discussed',LEFT,page.y,{size:8,bold:true});
      page.y=page.paragraph(p.alternatives,LEFT,page.y-10,CONTENT_W,{size:7.8,leading:9,maxLines:3})-3;
    }else page.y=page.writeField('Reasonable alternatives discussed',page.y,{lines:2});

    if(p.noTreatment){
      page.text('If treatment does not proceed',LEFT,page.y,{size:8,bold:true});
      page.y=page.paragraph(p.noTreatment,LEFT,page.y-10,CONTENT_W,{size:7.8,leading:9,maxLines:3})-3;
    }else page.y=page.writeField('If treatment does not proceed',page.y,{lines:2});

    page.y=page.writeField('Additional patient-specific material risks / priorities',page.y,{lines:2});

    page.text('[ ] Pregnancy / contraception / fertility discussed where relevant',LEFT,page.y,{size:7.7});
    page.text('[ ] Written / electronic medicine information offered where appropriate',LEFT+286,page.y,{size:7.3});
    page.y-=17;
    page.text('[ ] Patient questions invited and answered',LEFT,page.y,{size:7.7});
    page.text('[ ] Emergency contact / toxicity advice discussed',LEFT+286,page.y,{size:7.3});
    page.y-=18;
  }

  function renderSignatures(page){
    page.y=page.sectionTitle('CONSENT',page.y);
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

    header(page2,p);
    renderImmune(page2,p);
    renderConsentDiscussion(page2,p);
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
    download
  });
});
