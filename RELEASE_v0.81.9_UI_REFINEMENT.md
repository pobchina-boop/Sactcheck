# SACTCheck v0.81.9 UI refinement — compact Clinic Workflow + patient reference page

This is a **small drop-in refinement on top of the current v0.81.9 baseline**. It deliberately does not advance the public app version or touch clinical protocol logic.

## 1. Clinic Workflow

The existing Clinic Workflow functions are retained, but the large two-column card grid is restyled as a compact at-a-glance action list.

The panel now presents the existing functions as concise rows:

- Pre-treatment assessment engine
- Consent generator
- Knowledge base & evidence
- Emetogenic / supportive-care prescribing support
- Extravasation information
- Patient portal + Treatment Passport
- Original NCCP regimen

The underlying click handlers and clinical functions are unchanged. Expanded supportive-care and extravasation detail no longer occupies the main workflow landing view; the relevant action/source controls remain available.

## 2. 00568 patient knowledge experience

The interactive date selector, phase selector and clickable Day 1–21 calendar are retired from the patient knowledge experience.

The page is reframed as a scrollable regimen reference page:

- visual explanation of each medicine and mechanism
- treatment phases and regimen structure
- simple static cycle orientation, without asking the patient to enter dates
- practical supportive-care information
- urgent symptom guidance
- questions to discuss with the oncology team
- clearly surfaced evidence/source links

The existing mechanism graphics, patient guide, anatomy, Treatment Passport and SACTCard are retained.

## Scope intentionally unchanged

- Regimen-card layout
- NCCP protocol JSON
- assessment thresholds and deterministic treatment logic
- v0.81.6 Treatment Passport structure
- SACTCard
- antiemetic Rx-script logic/content
- patient routing and QR destinations
- 00568 clinician consent draft behaviour

## Apply

Copy the contents of this drop-in folder into the repository root and replace matching files. No folders need to be deleted.

Because the app version remains v0.81.9, a browser that already has the old CSS/JS open may need a hard refresh after deployment.
