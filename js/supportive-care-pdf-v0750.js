/**
 * SACTCheck v0.75.0 - Supportive-care prescribing support PDF.
 * Dependency-free, one-page A4 output for browser viewing.
 */
(function(root,factory){
  const api=factory(root);
  if(typeof module==="object"&&module.exports) module.exports=api;
  root.SACTCheckSupportiveCarePdf=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  const RELEASE="0.75.0";
  const W=595.28,H=841.89,M=38,CW=W-(M*2);

  const RGB={
    navy:[0.071,0.192,0.290], teal:[0.055,0.482,0.455],
    red:[0.70,0.12,0.13], orange:[0.78,0.39,0.02], green:[0.08,0.43,0.25],
    blue:[0.08,0.38,0.62], pale:[0.96,0.98,0.99], line:[0.78,0.83,0.87],
    dark:[0.08,0.11,0.14], muted:[0.34,0.40,0.45], white:[1,1,1]
  };
  function ascii(v){
    return String(v??"")
      .replace(/×/g,"x").replace(/≥/g,">=").replace(/≤/g,"<=")
      .replace(/[–—]/g,"-").replace(/→/g,"->").replace(/[‘’]/g,"'")
      .replace(/[“”]/g,'"').replace(/…/g,"...").replace(/•/g,"-")
      .normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
      .replace(/[^\x20-\x7E]/g," ").replace(/\s+/g," ").trim();
  }
  function esc(v){return ascii(v).replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)");}
  function bytes(v){const s=String(v),o=new Uint8Array(s.length);for(let i=0;i<s.length;i++)o[i]=s.charCodeAt(i)&255;return o;}
  function concat(parts){const n=parts.reduce((a,b)=>a+b.length,0),o=new Uint8Array(n);let x=0;parts.forEach(p=>{o.set(p,x);x+=p.length});return o;}
  function wrap(text,width,size=9,bold=false){
    const s=ascii(text); if(!s)return [""];
    const max=Math.max(12,Math.floor(width/((bold?.56:.51)*size)));
    const words=s.split(" "); const out=[]; let line="";
    words.forEach(word=>{const c=line?line+" "+word:word;if(c.length<=max)line=c;else{if(line)out.push(line);line=word;}});
    if(line)out.push(line); return out;
  }
  function color(c){return `${c[0].toFixed(3)} ${c[1].toFixed(3)} ${c[2].toFixed(3)}`;}

  class Page{
    constructor(){this.c=[];this.y=H-M;}
    cmd(s){this.c.push(s);}
    rect(x,y,w,h,fill,stroke=RGB.line){
      this.cmd(`${color(fill)} rg ${x} ${y} ${w} ${h} re f`);
      this.cmd(`${color(stroke)} RG .6 w ${x} ${y} ${w} ${h} re S`);
    }
    text(t,x,y,{size=9,bold=false,c=RGB.dark}={}){
      this.cmd(`${color(c)} rg BT /${bold?"F2":"F1"} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${esc(t)}) Tj ET`);
    }
    para(t,x,y,w,{size=8.2,bold=false,leading=10,c=RGB.dark,max=99}={}){
      const ls=wrap(t,w,size,bold).slice(0,max);
      ls.forEach((l,i)=>this.text(l,x,y-(i*leading),{size,bold,c}));
      return y-(ls.length*leading);
    }
    line(y){this.cmd(`${color(RGB.line)} RG .5 w ${M} ${y} m ${W-M} ${y} l S`);}
  }

  function riskColor(plan){
    return plan?.colour==="red"?RGB.red:plan?.colour==="orange"?RGB.orange:plan?.colour==="green"?RGB.green:RGB.blue;
  }
  function medicineLine(item){
    return `${item.medicine} ${item.dose} ${item.route} ${item.frequency} - ${item.timing}`;
  }
  function buildPdf(payload){
    const manifest=payload?.manifest||{};
    const plan=manifest.supportiveCare||{};
    const p=new Page();

    p.rect(0,H-78,W,78,RGB.navy,RGB.navy);
    p.text("SACTCHECK",M,H-35,{size:11,bold:true,c:RGB.white});
    p.text("SUPPORTIVE MEDICINES - PRESCRIBING SUPPORT",M,H-53,{size:8,bold:true,c:[.78,.91,.91]});
    p.text(`v${RELEASE}`,W-M-35,H-35,{size:7.5,bold:true,c:RGB.white});
    p.y=H-103;

    p.text(manifest.title||"SACT regimen",M,p.y,{size:15,bold:true,c:RGB.navy});
    p.y-=17;
    p.text(`NCCP ${manifest.nccpCode||"-"}${manifest.nccpVersion?` | Version ${manifest.nccpVersion}`:""}`,M,p.y,{size:8,bold:true,c:RGB.muted});
    p.y-=18;

    p.rect(M,p.y-38,CW,40,RGB.pale);
    p.text("Patient name: ____________________________________",M+8,p.y-10,{size:8});
    p.text("Allergies: ______________________________",M+295,p.y-10,{size:8});
    p.text("DOB / MRN: ______________________________________",M+8,p.y-27,{size:8});
    p.text("Date: __________________________________",M+295,p.y-27,{size:8});
    p.y-=55;

    const rc=riskColor(plan);
    p.rect(M,p.y-30,CW,32,[.98,.98,.98],rc);
    p.text(plan.label||"Antiemetic support",M+10,p.y-11,{size:10,bold:true,c:rc});
    p.text(plan.risk_range||"",W-M-180,p.y-11,{size:7.5,bold:true,c:rc});
    p.y-=43;

    function section(title,items){
      p.text(title,M,p.y,{size:9.5,bold:true,c:RGB.navy});
      p.y-=13;
      if(!items.length){
        p.text("No routine medicines in this section.",M+8,p.y,{size:8,c:RGB.muted});
        p.y-=14; return;
      }
      items.forEach((item,i)=>{
        p.text(`${i+1}.`,M+4,p.y,{size:8,bold:true,c:RGB.muted});
        p.text(medicineLine(item),M+24,p.y,{size:8.1,bold:true,c:RGB.dark});
        p.y-=14;
      });
      p.y-=5;
    }
    function localPrescription(items){
      p.text("COMPLETE LOCAL SUPPORTIVE-MEDICINE PROFORMA",M,p.y,{size:9.2,bold:true,c:RGB.navy});
      p.y-=13;
      items.forEach((item,i)=>{
        p.text(`${i+1}.`,M+4,p.y,{size:7.7,bold:true,c:RGB.muted});
        p.text(medicineLine(item),M+24,p.y,{size:7.8,bold:true,c:RGB.dark});
        p.y-=10;
        if(item.directions){
          p.y=p.para(item.directions,M+24,p.y,CW-28,{size:6.25,leading:7.0,c:RGB.muted,max:2})-2;
        }
      });
      p.y-=3;
      if(plan.localPrescriptionSource?.label){
        p.y=p.para(`Local source: ${plan.localPrescriptionSource.label}`,M,p.y,CW,{size:5.9,leading:6.6,c:RGB.muted,max:2})-3;
      }
    }
    if((plan.local_prescription_items||[]).length){
      localPrescription(plan.local_prescription_items);
    }else{
      section("DAY 1",plan.day1||[]);
      section("SUBSEQUENT DAYS",plan.subsequent||[]);
    }

    const overrides=manifest.interactionOverrides||[];
    const warnings=[...(plan.warnings||[])];
    if(overrides.length) warnings.push(...overrides.map(x=>x.message));
    if(warnings.length){
      p.rect(M,p.y-(warnings.length*24)-18,CW,(warnings.length*24)+20,[1,.985,.94],[.82,.62,.20]);
      p.text("REGIMEN-SPECIFIC CHECKS",M+9,p.y-10,{size:8.3,bold:true,c:[.50,.31,.04]});
      let yy=p.y-24;
      warnings.forEach(w=>{
        p.text("-",M+10,yy,{size:8,bold:true,c:RGB.dark});
        yy=p.para(w,M+22,yy,CW-34,{size:7.3,leading:8.4,c:RGB.dark,max:3})-4;
      });
      p.y=yy-5;
    }

    p.line(122);
    p.text("Repeat / cycles: ______________________",M,105,{size:8});
    p.text("Prescriber signature: _______________________________",M,86,{size:8});
    p.text("Name / registration no.: ____________________________",M,68,{size:8});

    p.text("Clinical prescribing support - not an official NCCP/HSE prescription form.",M,42,{size:6.5,bold:true,c:RGB.muted});
    p.para("Verify the current NCCP regimen, patient-specific factors, allergies, interactions, renal/hepatic function and current local policy before prescribing. Where a local supportive-medicine proforma is configured, SACTCheck retains the complete supplied medicine list rather than filtering out PPI, mouth-care or PRN items.",M,31,CW,{size:6.1,leading:7,c:RGB.muted,max:3});

    const stream=p.c.join("\n")+"\n";
    const objs=[];
    objs[1]="<< /Type /Catalog /Pages 2 0 R >>";
    objs[2]="<< /Type /Pages /Count 1 /Kids [5 0 R] >>";
    objs[3]="<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
    objs[4]="<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";
    objs[5]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents 6 0 R >>`;
    objs[6]=`<< /Length ${bytes(stream).length} >>\nstream\n${stream}endstream`;
    const parts=[bytes("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n")],offs=[0];let pos=parts[0].length;
    for(let i=1;i<=6;i++){offs[i]=pos;const b=bytes(`${i} 0 obj\n${objs[i]}\nendobj\n`);parts.push(b);pos+=b.length;}
    const xref=pos;
    let x=`xref\n0 7\n0000000000 65535 f \n`;
    for(let i=1;i<=6;i++)x+=`${String(offs[i]).padStart(10,"0")} 00000 n \n`;
    x+=`trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
    parts.push(bytes(x));
    return concat(parts);
  }

  function filename(payload){
    const m=payload?.manifest||{};
    const code=ascii(m.nccpCode||"regimen").replace(/[^A-Za-z0-9_-]/g,"_");
    return `SACTCheck_Supportive_Care_NCCP_${code}.pdf`;
  }
  function openInViewer(payload,targetWindow=null){
    const data=buildPdf(payload),file=filename(payload);
    if(!root?.document||!root?.URL||typeof Blob==="undefined") return {bytes:data,filename:file,pages:1,opened:false};
    const blob=new Blob([data],{type:"application/pdf"}),url=root.URL.createObjectURL(blob);
    let viewer=targetWindow;
    if(viewer?.closed)viewer=null;
    if(!viewer&&root?.open)viewer=root.open("about:blank","_blank");
    if(!viewer)return {bytes:data,filename:file,pages:1,opened:false,blocked:true};
    try{viewer.location.replace(url);}catch(_){viewer.location.href=url;}
    root.setTimeout?.(()=>root.URL.revokeObjectURL(url),10*60*1000);
    return {bytes:data,filename:file,pages:1,opened:true,url};
  }
  return Object.freeze({release:RELEASE,ascii,buildPdf,filename,openInViewer});
});
