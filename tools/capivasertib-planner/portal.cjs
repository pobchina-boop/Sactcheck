'use strict';

// Render the regimen-specific introduction inside the established patient overview.
function introduction() {
  return `<header class="po45-introduction capiva-home">
    <p class="po45-kicker">My breast cancer treatment · NCCP 00947</p>
    <h1>Capivasertib + fulvestrant</h1>
    <p>Truqap is the brand name for capivasertib. These tablets block a growth signal called AKT. A change in PIK3CA, AKT1 or PTEN in your cancer can make this treatment an option. Fulvestrant injections reduce the oestrogen signal that can also help these cells grow.</p>
    <nav class="capiva-tasks" aria-label="My treatment tools">
      <a href="first-cycle.html"><strong>My cycle planner and three-page pack</strong><span>Tablet days, rest days and injection visits</span></a>
      <a href="symptom-plan.html"><strong>When to call</strong><span>Blood sugar, bowel, skin and injection symptoms</span></a>
      <a href="glucose-record.html"><strong>My blood sugar record</strong><span>A printable sheet for my agreed checks</span></a>
    </nav>
    <div class="po45-downloads"><a href="handbook.pdf" download>Download my complete handbook</a><a href="sactcard.pdf" download>Download my wallet card</a><a href="guide.pdf" download>Download my treatment guide</a></div>
  </header>`;
}

module.exports = {introduction};
