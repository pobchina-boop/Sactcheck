/** SACTCheck Sustainability module v0.69.1 */
(function (root) {
  "use strict";
  const DATA_URL = "data/sustainability-regimen-metadata-v0691.json";
  const STATUS_LABEL = {
    catalogue_derived:"Catalogue derived", source_verified:"Source verified",
    locally_verified:"Locally verified", modelled:"Modelled",
    not_encoded:"Not yet encoded", not_applicable:"Not applicable",
    evidence_required:"Evidence required"
  };
  const $ = id => document.getElementById(id);
  const pretty = value => String(value || "").replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());

  function contextFromQuery() {
    const q = new URLSearchParams(root.location?.search || "");
    return {
      regimen:q.get("regimen")||"", protocol:q.get("protocol")||"",
      tumour:q.get("tumour")||"", route:q.get("route")||"",
      category:q.get("category")||"", domain:q.get("domain")||""
    };
  }

  function renderContext(ctx) {
    if (!ctx.regimen) return;
    $("regimenContext")?.classList.add("active");
    [["ctxRegimen",ctx.regimen],["ctxProtocol",ctx.protocol||"Not supplied"],
     ["ctxTumour",ctx.tumour||"Not supplied"],["ctxRoute",ctx.route?pretty(ctx.route):"Not encoded"]]
      .forEach(([id,value])=>{ if ($(id)) $(id).textContent=value; });
    if ($("regimenPanelTitle")) $("regimenPanelTitle").textContent=ctx.regimen;
    if ($("regimenPanelLead")) $("regimenPanelLead").textContent =
      "Available catalogue metadata has been carried into this profile. Environmental impact remains unquantified unless a field is supported by an appropriate source or model.";
  }

  function profileFor(data, ctx) {
    const profile = JSON.parse(JSON.stringify(data.default_profile || {}));
    if (ctx.protocol && data.profiles?.[ctx.protocol]) Object.assign(profile, data.profiles[ctx.protocol]);
    if (ctx.route) profile.route_classification = {
      status:"catalogue_derived", value:ctx.route, source:"SACTCheck regimen catalogue metadata"
    };
    return profile;
  }

  function valueText(entry) {
    if (!entry || entry.value === null || entry.value === undefined || entry.value === "") return "Not quantified";
    if (typeof entry.value === "boolean") return entry.value ? "Yes" : "No";
    if (Array.isArray(entry.value)) return entry.value.join(", ");
    return pretty(entry.value);
  }

  function renderMetadata(data, ctx) {
    const host=$("metadataGrid"), summary=$("metadataSummary");
    if (!host) return;
    const profile=profileFor(data,ctx), defs=data.field_definitions||{};
    let resolved=0;
    host.replaceChildren();

    Object.entries(defs).forEach(([key,def])=>{
      const entry=profile[key]||{status:"not_encoded",value:null};
      if (["catalogue_derived","source_verified","locally_verified","modelled","not_applicable"].includes(entry.status)) resolved++;
      const card=document.createElement("article"); card.className="metadata-card";
      const head=document.createElement("div"); head.className="metadata-card-head";
      const title=document.createElement("strong"); title.textContent=def.label||key;
      const badge=document.createElement("span"); badge.className=`metadata-status status-${entry.status||"not_encoded"}`;
      badge.textContent=STATUS_LABEL[entry.status]||pretty(entry.status||"not_encoded");
      head.append(title,badge);
      const value=document.createElement("div"); value.className="metadata-value"; value.textContent=valueText(entry);
      const mech=document.createElement("p"); mech.textContent=def.environmental_mechanism||"";
      card.append(head,value,mech);
      if (entry.source) { const s=document.createElement("small"); s.className="metadata-source"; s.textContent=`Source: ${entry.source}`; card.appendChild(s); }
      host.appendChild(card);
    });

    if (summary) summary.textContent =
      `${resolved} of ${Object.keys(defs).length} structured metadata fields are currently resolved${ctx.regimen?` for ${ctx.regimen}`:""}. Unresolved fields remain visible rather than being inferred.`;

    const driver=$("driverGrid");
    if (driver?.children?.length>=1) {
      let t="Route-specific environmental burden has not been quantified for this regimen.";
      const route=profile.route_classification?.value;
      if (route==="oral_only") t="Oral-only delivery may avoid some infusion infrastructure and consumables, but this does not establish a lower total lifecycle footprint.";
      else if (route==="parenteral_only") t="Parenteral delivery makes administration infrastructure, consumables and treatment attendance relevant footprint drivers.";
      else if (route==="mixed_oral_parenteral") t="Mixed delivery combines oral medicine stewardship with parenteral administration and attendance-related drivers.";
      const small=driver.children[0].querySelector("small"); if (small) small.textContent=t;
    }
  }

  async function init() {
    const ctx=contextFromQuery(); renderContext(ctx);
    try {
      const response=await fetch(DATA_URL,{cache:"no-store"});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      renderMetadata(await response.json(),ctx);
    } catch (error) {
      if ($("metadataSummary")) $("metadataSummary").textContent =
        "Structured sustainability metadata could not be loaded. The clinical regimen assessment is unaffected.";
      console.error("SACTCheck sustainability metadata failed to load",error);
    }
  }
  if (document.readyState==="loading") document.addEventListener("DOMContentLoaded",init); else init();
  root.SACTCheckSustainability=Object.freeze({version:"0.69.1"});
})(typeof globalThis!=="undefined"?globalThis:this);
