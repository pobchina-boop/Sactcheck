'use strict';
const fs=require('fs'),path=require('path'),config=require('../data/patient-presentation-v08431.json'),root=path.resolve(__dirname,'..');
const lungPresentation = require('./durvalumab-lung-presentation.cjs');
const enhertuPresentation = require('./enhertu-patient-review-v08462.cjs');
function legacyProfile(d){if(d.suite_release==='0.84.63'&&['00588','00746'].includes(d.code))return d;if(!config.legacy_layout_fields[d.code])return d;const copy={...d};delete copy.patient_summary;delete copy.patient_layout_release;return Object.assign(copy,config.legacy_layout_fields[d.code]);}
function routeFor(code){return code+(process.env.SACT_SUITE_CONTEXT?'/'+process.env.SACT_SUITE_CONTEXT:'');}
function packFor(d) {
  const sarcoma = require('./patient-pack-v08462.cjs');
  return sarcoma.applies(d) ? sarcoma : require('./patient-pack-v08463.cjs');
}
function pack(file){const m=file.match(/^patient\/(\d{5})\/(index|guide|sactcard)\.html$/);if(!m)return null;const route=routeFor(m[1]),profile=config.routes[route];if(!profile)return null;const d=JSON.parse(fs.readFileSync(path.join(root,profile),'utf8'));return enhertuPresentation.enhance(d,lungPresentation.enhance(d, packFor(d).render(d)[{index:'portal',guide:'print',sactcard:'card'}[m[2]]]));}
function wiki(file,html){const m=file.replaceAll('\\','/').match(/patient\/(\d{5})\/knowledge\.html$/);if(!m||!config.routes[routeFor(m[1])])return html;const d=JSON.parse(fs.readFileSync(path.join(root,config.routes[routeFor(m[1])]),'utf8'));html=lungPresentation.enhance(d, packFor(d).wiki(d,html));return html.replace('</head>','<link rel="stylesheet" href="../../assets/patient/oncowiki-progressive-v08431.css"></head>').replace('</body>','<script src="../../assets/patient/oncowiki-progressive-v08431.js"></script></body>');}
module.exports={legacyProfile,pack,wiki};
