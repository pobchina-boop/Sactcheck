(function(root){
  "use strict";
  function redraw(panel){
    const stage=panel.querySelector(".hcc-visual-stage");
    if(!stage) return;
    stage.querySelector(".hcc-connector-layer")?.remove();
    if(stage.querySelector(".hcc-static-connectors")) return;
    if(root.matchMedia?.("(max-width:700px)").matches) return;
    const bounds=stage.getBoundingClientRect();
    if(!bounds.width||!bounds.height) return;
    const ns="http://www.w3.org/2000/svg";
    const svg=root.document.createElementNS(ns,"svg");
    svg.setAttribute("class","hcc-connector-layer");
    svg.setAttribute("viewBox",`0 0 ${bounds.width} ${bounds.height}`);
    svg.setAttribute("aria-hidden","true");
    for(const card of stage.querySelectorAll("[data-hcc-target]")){
      const pin=stage.querySelector(`[data-hcc-pin="${card.dataset.hccTarget}"]`);
      if(!pin) continue;
      const a=card.getBoundingClientRect(),b=pin.getBoundingClientRect();
      const left=card.classList.contains("left");
      const line=root.document.createElementNS(ns,"line");
      line.setAttribute("x1",left?a.right-bounds.left:a.left-bounds.left);
      line.setAttribute("y1",a.top+a.height/2-bounds.top);
      line.setAttribute("x2",b.left+b.width/2-bounds.left);
      line.setAttribute("y2",b.top+b.height/2-bounds.top);
      if(card.classList.contains("bev")) line.setAttribute("class","bev");
      svg.appendChild(line);
    }
    stage.prepend(svg);
  }
  function update(){root.document?.querySelectorAll(".hcc-bodymap").forEach(redraw)}
  let timer;
  function schedule(){root.clearTimeout(timer);timer=root.setTimeout(update,60)}
  root.SACTCheckHccConnectors=schedule;
  root.addEventListener?.("resize",schedule);
  root.addEventListener?.("beforeprint",update);
  root.document?.fonts?.ready?.then(schedule);
  if(root.document?.readyState==="loading") root.document.addEventListener("DOMContentLoaded",schedule);
  else schedule();
})(typeof globalThis!=="undefined"?globalThis:this);
