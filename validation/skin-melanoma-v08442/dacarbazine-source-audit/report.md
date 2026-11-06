# v0.84.42 — dacarbazine source audit and five skin retrospectives

Status: bounded research/proposal only. No checkout, Git or publication changes were made by this agent. Source reconciliation does not constitute independent clinical or oncology-pharmacy approval.

Baseline reviewed: SACTCheck v0.84.41, main `cd94a2043d59da86ffec3dbb63ac49df6399e112`.

## Retained current sources

The original child-agent fetch attempts returned HTTP403. The parent subsequently fetched the official asset URLs with HTTP200. These verified bytes were copied into this audit directory and read directly; the earlier failed-attempt logs are historical, not a current source blocker. `source-retrieval-verified.json` is the successful six-source record. `retrospective-source-comparison.json` compares fresh bytes with encoded source hashes.

| Code | Current retrieved document | Document amendment | PDF pages | SHA-256 |
|---|---|---|---:|---|
|00464|[NCCP dacarbazine v3](https://assets.hse.ie/media/documents/464_V3_Dacarbazine.pdf)|15 April 2025; review15 April2030|3|`32af7a11e3ceff02a2c7878657e9f981aff310e0819ec8f785750536a6a05e44`|
|00431|[NCCP nivo1/ipi3 v11](https://assets.hse.ie/media/documents/431_Nivolumab_1mg_Ipilimumab_3mg.pdf)|20 August2026; review20 August2027|11|`301ea53270f9609ea4f8e1a042eb3d1d91ebfc8240a1a95af2d30d4472b19cfe`|
|00415|[NCCP dabrafenib/trametinib v5](https://assets.hse.ie/media/documents/415_Trametinib_and_DabrafenibTherapy.pdf)|25 August2026 amendment; footer last clinical review11 November2021|9|`b04cae8e0d9c6fa0a6bdf01cf67179f4da0b2a4943ca581c7036973d70a13720`|
|00563|[NCCP encorafenib/binimetinib v4](https://assets.hse.ie/media/documents/563_Encorafenib-and-Binimetinib-Therapy.pdf)|14 September2026|11|`8e4d16d8baeae000830d14f6088ef631f98a227928fa6a60eab4929c491fcb2a`|
|00812|[NCCP cemiplimab v3a](https://assets.hse.ie/media/documents/812_V3a_Cemiplimab.pdf)|1 October2024; review17 July2029|8|`850b4b9122fcef20727f7e102c3ff02207fed801213b0142542dc05c86c8131b`|
|00236|[NCCP vismodegib v3](https://assets.hse.ie/media/documents/236_v3_Vismodegib.pdf)|29 April2025; review29 April2030|4|`3612dd57e919d4b5b117ef70ed9cd1ac3d56e9a199f9eba071f5c8bbaa1dd0c5`|
|Secondary|[HPRA Dacarbazine medac200mg SmPC](https://assets.hpra.ie/products/Human/19327/Licence_PA0623-003-002_04032024123758.pdf)|March2024|10|`945abca6f3dfcf77846570039075869bcdfe06039f57e2440aa6bd0b0c892f55`|

All five retrospective NCCP hashes exactly match the v0.84.40 source hashes retained in the current encodings. This is a fresh retrieval result, not reliance on historical files alone.

## Dacarbazine findings and proposed correction

The previous assessment had11rules. `propose-00464.py` creates `00464-proposed.json` with40source-cited rules without touching the checkout. It also retains `00464-before.json`. All proposed dose reductions remain review text rather than numerical prescription output because dose history, severe-organ exclusions and the NCCP/current-SmPC differences must be resolved.

| Finding | Source | Proposed behavior |
|---|---|---|
|CrCl45 silently assigned80% in old band selector; source overlaps45–60 and30–45|NCCP p2Table2, also visually inspected in `00464-table-page2.png`|Single actual CrCl field. Exactly45 gets explicit ambiguity review and no selected percentage. >45–60lists80%;30–<45lists75%;<30lists70%, all requiring review. >60does not invent an explicit table row.|
|Severe kidney exclusion missing although renal reduction table encoded|NCCP p1exclusions; SmPC p2§4.3|Separate clinical severe-kidney exclusion that outranks any renal advisory. Numeric CrCl alone does not silently define or waive the clinical exclusion.|
|Liver impairment had only severe-liver exclusion|NCCP p2Table2; SmPC p2§4.2|Qualitative hepatic review; no invented AST/bilirubin percentage. Entered liver results prompt contextual review. Combined renal/hepatic impairment and dialysis have explicit source-gap review.|
|Renal source difference not recorded|NCCP p2Table2 versus current SmPC p2§4.2|NCCP percentages remain visible, but current SmPC says isolated mild/moderate renal or hepatic impairment usually needs no reduction; combined impairment prolongs elimination without a validated reduction recommendation. Explicit specialist reconciliation.|
|Six-cycle maximum descriptive only|NCCP p1Treatment|Cycle>6 withholds routine continuation; progression or clinically unacceptable toxicity also blocks continuation. No invented unlimited course.|
|“Resume100%” could reverse an established reduction|NCCP p2Table1 and consultant modification instruction|One-week delay/repeat FBC remains. Previous dose reduction and restart are explicitly reviewed; missing recovery/approval prevents automatic restart. No multiplying organ reductions or automatic re-escalation.|
|Unsupported generic ECOG≥3 and grade≥3 nonhaematological source attribution|NCCP pp1–2 contains neither such numeric algorithm|Remove automatic generic rules. Retain ECOG only as unassessed context; explicit unacceptable toxicity and source-specific events are assessed.|
|Hypersensitivity only acted at grade3–4|SmPC p3§4.4|Any positive hypersensitivity grade prompts immediate cessation/urgent assessment; known hypersensitivity is separately contraindicated. No inferred “usually permanent” generic grade threshold.|
|New organ dysfunction, hepatic VOD and extravasation unrepresented|SmPC pp2–3§4.2/4.4|Immediate cessation for new hepatic/renal symptoms or extravasation; VOD means further therapy contraindicated even after laboratory recovery.|
|Current product safety/interactions absent|SmPC pp3–4§4.4–4.6|Review phenytoin, avoid fotemustine combination, live-vaccine review, other marrow suppression/radiotherapy, hepatotoxic medicines/alcohol, INR-monitored anticoagulants, cyclosporine/tacrolimus and methoxypsoralen. No new generic vaccine portal module.|
|Archived SmPC linked by NCCP has older contraception advice|NCCP p3link versus current HPRA pp3–4|Current medac200mg SmPC: women6months, men3months after treatment, both during treatment. Identify product/date; discuss fertility preservation and genetic counselling.|
|Delayed marrow nadir can be misrepresented by generic cycle text|SmPC p6§4.8 (also p5summary)|Often3–4weeks, cumulative/delayed. Do not label days7–14 as a universal nadir window or days15–21 as automatically recovered/safe.|

Exact blood-count boundary is unchanged and independently retested: ANC<1.5 OR platelets<100 delays one week and repeats FBC. ANC1.5 and platelets100 do not independently trigger the delay. The table's100% restart statement remains conditional on recovery and does not override any other exclusion, reduction or stopping criterion.

The proposal intentionally uses `block_numeric_dose` and specialist review even in renal percentage text. A source-specific percentage is not automatically a clinically authorized dose. No dose model calculates a result for exact45, severe-organ disease, dose-history conflicts or restarts.

## Dacarbazine patient/monitoring facts to carry through the full suite

- This context is metastatic malignant melanoma. Do not suggest proven adjuvant/neoadjuvant benefit or transplant a modern ICI survival figure into this cytotoxic regimen.
- Dacarbazine850mg/m²IV day1every21days, up to6cycles; stop sooner for progression/unacceptable toxicity. A nominal six-cycle calendar is18weeks, but the sixth infusion is week15 if uninterrupted; do not call the final infusion “week18”. Review/recovery can extend the practical course.
- NCCP delivery is1000mLNaCl0.9% over1hour with light-protected solution and infusion set. Its1hour schedule controls this regimen even though the SmPC offers15–30minutes. Allow additional clinic time for assessment/antiemetics; do not promise a one-hour total visit.
- FBC, renal and liver profile at baseline and before every cycle. No routine universal echocardiogram, ECG, tumour-marker panel or scan interval is mandated here. Disease assessment/imaging follows the consultant plan. No invented post-course test calendar.
- High nausea/vomiting risk: use the separate prescribed high-risk antiemetic plan. “No routine premedication” means no additional routine regimen premedication; it does not mean no antiemetics.
- Between cycles: nausea, vomiting and appetite problems can occur early; fatigue can accumulate. Low blood counts may be delayed, with nadirs often at3–4weeks. Seek immediate team advice for fever/shivering/sudden illness or concerning bleeding at any time, including after the last infusion.
- Promptly report persistent vomiting/inability to drink, reduced urine, yellow eyes/skin/dark urine or severe abdominal symptoms. Rare hepatic VOD may be serious and can appear during a later course; symptoms should not be self-diagnosed as a routine upset stomach.
- Tell the nurse immediately about pain, burning, swelling or leakage at the infusion site; extravasation can injure tissue. Severe breathing difficulty/collapse requires emergency help.
- Hair loss and photosensitivity are described as uncommon in the current SmPC, not universally expected or severe. Blood-count effects/nausea/vomiting/anorexia are common. Preserve frequency versus urgency distinctions; no absolute risk percentages invented.
- No drug-specific fasting requirement for this IV regimen was found. Use practical individualized food/fluids guidance; avoid alcohol/hepatotoxic medicines, and have all medicines/supplements reviewed. Do not extrapolate oral-agent missed-dose rules.
- Current product contraception: women during+6months after; men during+3months after. Pregnancy and breastfeeding are contraindicated. Fertility preservation before treatment; genetic counselling for planned pregnancy after treatment where appropriate.
- Patient wallet: six planned cycle marks, with actual dates/team-confirmed cycles entered only when given. This is not a completion guarantee; delays/early stopping do not mean a missed “reward”. Regimen-specific QR and clearly marked placeholder contacts must be retained.

## Five current-source retrospective conclusions

No additional clinical correction was established in these bounded fresh-source probes. Existing source conflicts remain explicitly unresolved and must not be converted into automated doses.

| Protocol/context | Fresh-source checks and retained distinction |
|---|---|
|00431 advanced melanoma|v11: nivo1/ipi3q21×4. First melanoma nivolumab q14maintenance is3weeks after combination; q28maintenance is6weeks. HCC's3weektransition/24monthcap must not leak into melanoma. Grade3colitis after combination/follow-on nivolumab permanently stops; cemiplimab differs. Grade4thyroid action also differs. FBC/renal/liver/TFT/glucose each cycle; post-treatment immune vigilance at least5months. Newly encoded HCC indication is not a completed HCC service-suite claim. Source pp1–5schedule/tests; pp6–9toxicities.|
|00415 advanced and adjuvant melanoma|v5 changes dated25Aug2026, while footer says last clinical review11Nov2021. Continuous oral dosing;28dayreview is not a drug-free break. Adjuvant12months differs from advanced progression/toxicity duration. Fever≥38holds both; recurrent first symptoms can trigger before measured38; restart only after≥24hours symptom-free with individualized same/reduced-dose choice. LVEF decline>10points AND belowLLN; retinal-vein occlusion stops trametinib, uveitis modification is dabrafenib-specific. Skin-surveillance60days versus monthly source discrepancy stays explicit. Source pp1–2, pp3–6tables.|
|00563 advanced melanoma|v4: renal<30“no adjustment expected” is conditional on no hepatic impairment. QTcF>500with delta≤60holds; delta>60stops. AsymptomaticCK>5to10maintains;>10or>5with symptoms/renal impairmentholds. Liver G2timing is2weeksbinimetinib versus4weeksencorafenib. Printed225gsecondreduction remains a source error; no inferred prescription. Table recovery versus confirmed-treatment-related ILD stopping contradiction remains explicit. Source pp3–7tables and p10complications.|
|00812 advanced CSCC|v3a:350mgq21, no sourced adjuvant indication. CSCC measurable lesion/noncurative surgery/RT and transplant cautions do not borrow cervical prior-platinum requirements. Grade3colitisholds versus combo00431permanentstop; recurrentG3colitisstops. AST/ALT>3through5holds;>5stops. Bilirubin>1.5through3holds;>3stops. Severe stable endocrine events use their exception, not genericG4permanentstop. TFT3–6weeks and other cycle tests follow source. Source pp1–6.|
|00236 advanced BCC|v3:150mgdaily continuously;4weeklyreviews not planned breaks. No recommended reduction ladder. Renal30–79noadjustment;severe/dialysis noadjustmentexpected but limitedevidence is reviewed. Trial interruptions up to4weeks do not create a mandatory permanent-stop rule afterday28. PPP applies to both sexes; symptomatic metastatic and locallyadvanced-unsuitable-for-surgery/RT indications retained. Source pp1–3; existing additional EMA PPP/SCAR details were replayed, not freshly re-retrieved in this delegated task.|

The protocol JSON for00431and00812 does not itself have a structured top-level `monitoring` object; monitoring is carried elsewhere in the authored suite. This is not proof of a patient-content omission. The owner should continue the full cross-surface monitoring consistency check rather than relying on protocol JSON structure alone.

The six existing patient routes (`00431`, `00415`, `00415/adjuvant`, `00563`, `00812`, `00236`) each have a three-page guide PDF, full handbook PDF and QR PNG. This was an availability/page-count check only, not a new visual, content-retention or QR-decode pass.

## Validation evidence

- Dacarbazine proposed source/safety cases:295/295pass, covering all40rules with at least one executed positive witness, exact ANC/platelet/CrCl boundaries, contraindication precedence, six-cycle limit, missing/recovered restart context, old unsupported generic rules, current product safety, source hashes and schema.
- Original11-rule encoding against the255shared cases:162pass,93fail. Forty additional source/witness checks are only evaluated for the proposal. Counts are not93distinct clinical defects; multiple boundaries/variants can demonstrate one defect.
- Fresh independently authored retrospective cross-regimen cases:42/42pass.
- Existing source-regression replay against current v0.84.41: BRAF753/753, immune571/571, vismodegib293/293; total1617/1617pass.
- Dacarbazine schema: no errors/warnings. Missing inputs remain unassessed. An unreferenced ECOG context value is not counted as validated or normal.
- Immune dose renderer flags explicit “Not to be administered” rows as quantified internally; these are correct stop outputs, not a calculated reduced dose. Tests inspect rendered row meaning rather than misclassifying this flag.

Run from any working directory:

```bash
node /workspace/scratch/bca730129437/research-v08442/dacarbazine-retro/source-cases.cjs
node /workspace/scratch/bca730129437/research-v08442/dacarbazine-retro/retrospective-new-cases.cjs
```

Set `SACT_TEST_ROOT` to a different selected checkout and `SACT_PROTOCOL_FILE` to the applied00464JSON when the owner integrates it. The proposal generator reads its first argument as source-root and only writes beside itself. Do not blindly regenerate after integration without preserving the true original baseline snapshot.

## Remaining work / limits

The owner must review/integrate the proposal, carry it through clinician knowledge, consent, monitoring/support scripts and patient assets, and run the full release/browser/PDF/QR/visual gates. This delegated task did not rebuild or publish patient assets, verify live QR destinations, perform real-device installation/printing or independently re-fetch every retrospective supplementary SmPC/EMA source. Current NCCP retrieval is complete; current HPRA dacarbazine source retrieval is complete. Source conflicts and clinical/pharmacy sign-off remain explicit.
