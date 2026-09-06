/**
 * SACTCheck v0.71.0 — dependency-free regimen consent PDF exporter.
 *
 * Generates a compact A4 PDF directly in the browser using built-in PDF
 * Type 1 fonts. Unicode clinical symbols are normalised to ASCII equivalents
 * before encoding so exported PDFs render consistently across viewers.
 */
(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.SACTCheckConsentPdf=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';

  const VERSION='0.71.0';
  const PAGE_W=595.28;
  const PAGE_H=841.89;
  const MARGIN=42;
  const CONTENT_W=PAGE_W-(MARGIN*2);

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

  function wrap(text,width,fontSize=10,bold=false){
    const source=ascii(text).replace(/\s+/g,' ').trim();
    if(!source) return [''];
    const avg=(bold?0.56:0.52)*fontSize;
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

  class Layout{
    constructor(){
      this.pages=[[]];
      this.page=0;
      this.y=PAGE_H-MARGIN;
      this.pageNumber=1;
    }
    commands(){ return this.pages[this.page]; }
    newPage(){
      this.pages.push([]);
      this.page+=1;
      this.pageNumber+=1;
      this.y=PAGE_H-MARGIN;
      this.pageHeader();
    }
    ensure(height){ if(this.y-height<MARGIN+34) this.newPage(); }
    cmd(value){ this.commands().push(value); }
    setColor(gray=0){ const g=Math.max(0,Math.min(1,gray)); this.cmd(`${g.toFixed(3)} g`); }
    textLine(text,{x=MARGIN,size=10,bold=false,leading=13,gray=0}={}){
      this.ensure(leading);
      this.setColor(gray);
      this.cmd(`BT /${bold?'F2':'F1'} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${this.y.toFixed(2)} Tm (${pdfEscape(text)}) Tj ET`);
      this.y-=leading;
    }
    paragraph(text,{x=MARGIN,width=CONTENT_W,size=9.5,bold=false,leading=12,gray=0,after=5}={}){
      const lines=wrap(text,width,size,bold);
      this.ensure((lines.length*leading)+after);
      lines.forEach(line=>this.textLine(line,{x,size,bold,leading,gray}));
      this.y-=after;
    }
    bullet(label,detail,{indent=14,size=9.2,leading=11.5}={}){
      const marker='- ';
      const markerW=10;
      const available=CONTENT_W-indent-markerW;
      const full=`${label}: ${detail}`;
      const lines=wrap(full,available,size,false);
      this.ensure((lines.length*leading)+3);
      this.textLine(marker+lines[0],{x:MARGIN+indent,size,leading});
      for(const line of lines.slice(1)) this.textLine(line,{x:MARGIN+indent+markerW,size,leading});
      this.y-=3;
    }
    rule({gray=.75,thickness=.7,after=8}={}){
      this.ensure(12);
      this.cmd(`${gray.toFixed(3)} G ${thickness} w ${MARGIN} ${this.y.toFixed(2)} m ${(PAGE_W-MARGIN).toFixed(2)} ${this.y.toFixed(2)} l S`);
      this.y-=after;
    }
    heading(text,{size=12,after=6}={}){
      this.ensure(24);
      this.textLine(text,{size,bold:true,leading:size+4,gray:.08});
      this.y-=after;
    }
    labelValue(label,value,{missing='Clinician to complete'}={}){
      this.ensure(34);
      this.textLine(label,{size:8.3,bold:true,leading:10,gray:.3});
      this.paragraph(value||`[${missing}]`,{size:9.5,leading:12,after:7});
    }
    pageHeader(){
      this.textLine('SACTCheck regimen-specific SACT consent discussion',{size:8.5,bold:true,leading:11,gray:.35});
      this.rule({gray:.86,thickness:.5,after:10});
    }
    footer(){
      const y=23;
      const pageText=`SACTCheck v${VERSION} | Draft - clinician review required | Page ${this.pageNumber}`;
      this.commands().push(`0.45 g BT /F1 7.2 Tf 1 0 0 1 ${MARGIN.toFixed(2)} ${y.toFixed(2)} Tm (${pdfEscape(pageText)}) Tj ET`);
    }
  }

  function normalisePayload(payload){
    const draft=payload?.draft||{};
    const fields=payload?.fields||{};
    return {
      generatedAt:payload?.generatedAt||new Date().toISOString(),
      title:draft.title||'SACT regimen',
      nccpCode:draft.nccpCode||'',
      nccpVersion:draft.nccpVersion||'',
      indication:fields.diagnosis||draft.indication||'',
      intent:fields.intent||draft.intent||'',
      benefit:fields.benefit||'',
      alternatives:fields.alternatives||'',
      noTreatment:fields.noTreatment||'',
      customRisks:fields.customRisks||'',
      fertility:fields.fertility||'',
      questions:fields.questions||'',
      components:Array.isArray(draft.components)?draft.components:[],
      schedule:draft.schedule||'',
      sourceUrl:draft.sourceUrl||'',
      riskGroups:Array.isArray(payload?.riskGroups)?payload.riskGroups:[],
      unmappedAgents:Array.isArray(draft?.coverage?.unmappedAgents)?draft.coverage.unmappedAgents:[]
    };
  }

  function renderDocument(payload){
    const p=normalisePayload(payload);
    const l=new Layout();

    l.textLine('SACTCHECK REGIMEN-SPECIFIC SACT CONSENT DISCUSSION',{size:9,bold:true,leading:12,gray:.28});
    l.textLine(p.title,{size:17,bold:true,leading:21,gray:.02});
    l.textLine(`NCCP ${p.nccpCode||'-'} | Version ${p.nccpVersion||'-'}`,{size:9.2,bold:true,leading:13,gray:.25});
    l.paragraph('DRAFT - CLINICIAN REVIEW REQUIRED. This document supports, but does not replace, the HSE/NCCP consent process, the current NCCP regimen or professional judgement.',{size:8.7,bold:true,leading:11,after:5});
    l.rule({gray:.35,thickness:1.2,after:10});

    l.textLine('Patient name: __________________________________________',{size:9.5,leading:14});
    l.textLine('Hospital number: ______________________________________',{size:9.5,leading:14});
    l.textLine('DOB: __________________________________________________',{size:9.5,leading:14});
    l.paragraph('Patient identifiers are intentionally not entered into or stored by SACTCheck. Complete identifiers only on the approved clinical record or after printing.',{size:7.8,gray:.35,leading:10,after:7});

    l.heading('Diagnosis / treatment context');
    l.labelValue('Diagnosis / clinical context',p.indication);
    l.labelValue('Treatment intent',p.intent,{missing:'Clinician to confirm'});
    l.labelValue('Regimen components',p.components.join(' + ')||'',{missing:'Confirm against current NCCP source'});
    l.labelValue('Schedule',p.schedule,{missing:'Confirm against current NCCP source'});

    l.heading('Purpose and expected benefit');
    l.labelValue('Expected benefit / aim of treatment',p.benefit);

    l.heading('Material risks discussed');
    if(p.unmappedAgents.length){
      l.paragraph(`MANUAL AGENT REVIEW REQUIRED: ${p.unmappedAgents.join(', ')}. Do not finalise without reviewing the current NCCP regimen and current medicine product information.`,{size:9,bold:true,leading:12,after:7});
    }
    if(!p.riskGroups.length){
      l.paragraph('[No automatic risk prompts selected.]',{size:9.3,after:7});
    }else{
      for(const group of p.riskGroups){
        l.ensure(28);
        l.textLine(group.title||'Risks',{size:10.5,bold:true,leading:14,gray:.12});
        for(const item of (group.risks||[])) l.bullet(item.label||'Risk',item.detail||'');
        l.y-=3;
      }
    }
    if(p.customRisks){
      l.textLine('Additional patient-specific material risks',{size:9.5,bold:true,leading:13});
      l.paragraph(p.customRisks,{size:9.3,leading:12,after:7});
    }

    l.heading('Alternatives');
    l.labelValue('Reasonable alternatives discussed',p.alternatives);

    l.heading('If treatment does not proceed');
    l.labelValue('Likely consequence of declining or deferring treatment',p.noTreatment);

    l.heading('Pregnancy, contraception and fertility');
    l.labelValue('Discussion',p.fertility,{missing:'Discuss and document where clinically relevant'});

    l.heading('Patient questions / additional discussion');
    l.labelValue('Questions / notes',p.questions,{missing:'Questions invited; document additional points in the approved clinical record'});

    l.heading('Consent discussion checklist');
    const checklist=[
      'Diagnosis / treatment context and proposed regimen explained.',
      'Expected benefits and treatment intent discussed.',
      'Material risks, including regimen-specific and patient-specific risks, discussed.',
      'Reasonable alternatives discussed.',
      'Consequences of declining or deferring treatment discussed.',
      'Opportunity to ask questions provided and written/electronic information offered where appropriate.',
      'Patient understands consent is voluntary and may be withdrawn.'
    ];
    checklist.forEach(item=>l.paragraph(`[ ] ${item}`,{x:MARGIN+4,width:CONTENT_W-4,size:9.1,leading:11.5,after:2}));

    l.ensure(110);
    l.rule({gray:.5,thickness:.7,after:12});
    l.textLine('Patient / person giving consent: ____________________________________________',{size:9.2,leading:15});
    l.textLine('Signature: __________________________________  Date: ______________________',{size:9.2,leading:18});
    l.textLine('Clinician obtaining consent: ______________________________________________',{size:9.2,leading:15});
    l.textLine('Registration no.: ___________________________  Date: ______________________',{size:9.2,leading:18});

    l.heading('Governance',{size:10.5,after:4});
    l.paragraph('This is a regimen-specific consent discussion aid. Current NCCP sources remain authoritative. Agent-specific consent content is structured draft content pending independent Consultant Oncology and oncology-pharmacy validation.',{size:7.8,leading:9.8,gray:.3,after:3});
    if(p.sourceUrl) l.paragraph(`Current NCCP regimen source: ${p.sourceUrl}`,{size:7.2,leading:9,gray:.35,after:2});
    l.paragraph(`Generated with SACTCheck v${VERSION} on ${ascii(p.generatedAt).slice(0,10)}.`,{size:7.2,leading:9,gray:.35,after:0});

    l.pages.forEach((_,index)=>{
      const oldPage=l.page, oldNumber=l.pageNumber;
      l.page=index; l.pageNumber=index+1; l.footer();
      l.page=oldPage; l.pageNumber=oldNumber;
    });
    return l.pages;
  }

  function buildPdf(payload){
    const pages=renderDocument(payload);
    const pageCount=pages.length;
    const catalogObj=1, pagesObj=2, fontRegularObj=3, fontBoldObj=4;
    const pageObjs=[];
    const contentObjs=[];
    let next=5;
    for(let i=0;i<pageCount;i+=1){ pageObjs.push(next++); contentObjs.push(next++); }
    const totalObjects=next-1;
    const objects=new Array(totalObjects+1);
    objects[catalogObj]=`<< /Type /Catalog /Pages ${pagesObj} 0 R >>`;
    objects[pagesObj]=`<< /Type /Pages /Count ${pageCount} /Kids [${pageObjs.map(n=>`${n} 0 R`).join(' ')}] >>`;
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
      parts.push(part); offset+=part.length;
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
    const date=new Date(payload?.generatedAt||Date.now()).toISOString().slice(0,10);
    return `SACTCheck_Consent_NCCP_${code}_${date}.pdf`;
  }

  function download(payload){
    const data=buildPdf(payload);
    if(!root?.document||!root?.URL||typeof Blob==='undefined') return {bytes:data,filename:filename(payload)};
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
    return {bytes:data,filename:filename(payload)};
  }

  return Object.freeze({version:VERSION,ascii,pdfEscape,wrap,renderDocument,buildPdf,filename,download});
});
