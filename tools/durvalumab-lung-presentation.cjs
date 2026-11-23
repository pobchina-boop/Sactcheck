'use strict';

// The two lung consolidation courses share contact and action text. Their
// interval, course length and dose information come from separate source models.
function enhance(model, html) {
  if (!['00576', '00655'].includes(model.code)) return html;

  const organIcons = {
    'Lungs / breathing': 'lungs', 'Hormones / head / nerves': 'hormones',
    'Heart / muscles': 'heart', 'Liver': 'liver', 'Bowel': 'bowel',
    'Kidneys / urine': 'kidneys', 'Skin': 'skin'
  };
  // Reuse the atlas pictograms, with a text label and the existing anatomical number.
  html = html.replace(/(<div class="hcc-organ-head"><span class="hcc-card-number">[^<]+<\/span>)<strong>([^<]+)<\/strong>/g,
    (original, number, label) => {
      const icon = organIcons[label];
      if (!icon) return original;
      return number + '<img src="../assets/symptom-icons/' + icon + '.svg" width="13" height="13" style="width:13px;height:13px;max-width:13px;max-height:13px;flex:0 0 13px;object-fit:contain" alt="" aria-hidden="true"><strong>' + label + '</strong>';
    });

  return html
    .replaceAll('href="./#side-effects"', 'href="./#overview-2"')
    .replaceAll('087 12345678', '________________')
    .replaceAll('087 87654321', '________________')
    .replaceAll(' (EXAMPLE)', '')
    .replaceAll('EXAMPLE ONLY — team must replace both numbers before patient use.', 'Your team fills in and checks both numbers before giving you this pack.')
    .replaceAll('<small>EXAMPLE NUMBERS — replace before patient use.</small>', '')
    .replaceAll('Unwell or fever? Call oncology now.', 'New cough, breathlessness, diarrhoea or fever? Call oncology now.')
    .replaceAll('Phase: __________ Cycle plan: team to confirm', 'Last dose: ____________________')
    .replaceAll('Document revised 4 November 2026', 'Document revised 23 November 2026')
    .replace(/SACTCheck v0\.84\.(31|32)/g, 'SACTCheck v0.84.62');
}

module.exports = { enhance };
