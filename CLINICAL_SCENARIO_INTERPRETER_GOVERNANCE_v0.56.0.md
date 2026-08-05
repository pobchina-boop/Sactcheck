# Clinical Scenario Interpreter Governance — v0.56.0

## Function name

The function is named **Clinical scenario interpreter** throughout the main library and in-regimen workflow.

## Permitted functions before regimen selection

- identify recognised tumour and medicine language;
- conservatively correct selected likely single-word spelling errors;
- show the exact correction made;
- extract candidate clinical values without assessing them;
- rank and group possible local NCCP protocols;
- request missing tumour, combination or protocol context;
- abstain where no reliable match exists.

## Prohibited functions before regimen selection

- clinical assessment;
- treatment clearance;
- diagnosis;
- prescribing advice;
- dose modification;
- combination of rules from different protocols;
- silent selection of an ambiguous protocol.

## Candidate clinical values

Candidate values identified before regimen selection must be labelled **not assessed yet**. They must not create a treatment state or colour-coded protocol finding.

A value may be transferred only after:

1. exact regimen selection;
2. matching to a structured field in that regimen; and
3. clinician confirmation.

A numeric value must not be converted to a Boolean answer or toxicity grade unless the protocol contains an explicit deterministic mapping that has been separately encoded and validated.

## Typo tolerance

Fuzzy recognition is limited to sufficiently long, controlled single-word aliases. The interpreted correction is shown to the clinician. Short abbreviations and clinically distinct medicine names are not corrected through unrestricted similarity matching.

## Privacy

- Scenario text remains in the local browser.
- No external model or clinical service is called.
- No API key is embedded.
- Scenario text is not stored by the function.
- Possible identifiers block progression.

## Decision-support boundary

The deterministic protocol engine remains the sole source of encoded SACTCheck findings. The interpreter structures and transfers confirmed information; it does not decide what treatment should be given.
