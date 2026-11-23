'use strict';
const fs = require('node:fs');
const path = require('node:path');
const pictures = require('../data/patient-symptom-pictures.json');
const stylesheet = '../assets/symptom-pictures.css';
const start = '<!-- symptom-pictures:start -->';
const end = '<!-- symptom-pictures:end -->';

function escape(value) {
  return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#x27;'}[char]));
}
function entry(code, name, html) {
  if (!pictures.regimens[code] || !['index.html', 'knowledge.html'].includes(name)) return html;
  let markup = html.replace(/<!-- symptom-pictures:start -->[\s\S]*?<!-- symptom-pictures:end -->/g, '');
  const style = `<link rel="stylesheet" href="${stylesheet}">`;
  // Keep the shared picture stylesheet after the regenerated editorial and print styles.
  markup = markup.replaceAll(style, '').replace('</head>', style+'</head>');
  let panel, marker;
  if (name === 'knowledge.html') {
    panel = '<p class="picture-reference"><a href="symptom-icons.html">Symptom picture guide and printable illustrations</a></p>';
  } else {
    const examples = ['lung','gut','endocrine'].map(key => {
      const item = pictures.symptoms[key];
      return `<span><img src="../assets/symptom-icons/${escape(item.icon)}.svg" width="52" height="52" alt="">${escape(item.label)}</span>`;
    }).join('');
    panel = `<section class="picture-entry" id="symptom-pictures" aria-labelledby="picture-title"><h2 id="picture-title">My symptom picture guide</h2><p>Recognise a change, describe it to your team and see when to call.</p><div class="picture-examples">${examples}</div><p><a href="symptom-icons.html">Open the symptom picture guide</a> · <a href="symptom-icons.pdf" download>Download the illustrated PDF</a></p></section>`;
    marker = /<section\b[^>]*\bid=["'](?:overview-3|quick-card|my-card)["']/.exec(markup) ||
      /<(?:section|div)\b[^>]*\bid=["']more-information["']/.exec(markup);
  }
  marker ||= /<\/main>|<\/body>/.exec(markup);
  if (!marker) throw new Error(`No insertion point for the symptom guide in ${code}/${name}`);
  return markup.slice(0, marker.index) + start + panel + end + markup.slice(marker.index);
}
if (require.main === module) {
  for (const file of process.argv.slice(2)) {
    const original = fs.readFileSync(file, 'utf8');
    const updated = entry(path.basename(path.dirname(file)), path.basename(file), original);
    if (updated !== original) fs.writeFileSync(file, updated);
  }
}
module.exports = {entry};
