# SACTCheck v0.60.1 — Mission-Led Landing Page

**Release date:** 6 August 2026  
**Type:** Cumulative interface and product-positioning release

## Purpose

v0.60.1 replaces the previous quick-start-first opening with a clearer introduction to the product. The opening experience now explains what SACTCheck is, why it is being developed, the practical problem it is intended to address, its advantages, and its clinical decision-support boundary before the clinician enters the working engine.

## Changes

### Mission-led opening

- Adds a prominent mission statement focused on structured, transparent and source-linked oncology regimen assessment.
- Explains the day-ward problem SACTCheck is designed to address: repeated navigation of lengthy protocols, multiple thresholds and regimen-specific exceptions under time pressure.
- Avoids claims of demonstrated clinical benefit; the interface consistently describes the product as being designed and evaluated for feasibility.

### Visual product explanation

- Adds the visual pathway **Find → Assess → Explain → Verify**.
- Adds value cards for rapid regimen discovery, structured assessment, visible decision logic and direct source verification.
- Adds a clearer clinical boundary stating that SACTCheck does not prescribe, authorise treatment or replace the official NCCP protocol, local governance or independent clinical judgement.

### SACTCheck Engine call to action

- Adds a prominent **Launch SACTCheck Engine** button in the opening modal, homepage hero and mission section.
- The button closes the introduction, scrolls to the primary regimen library and focuses the search field.
- Re-labels the main library section as the **SACTCheck Engine** entry point.

### Quick-start guide repositioning

- Retains the existing three-step quick-start workflow.
- Moves it into an optional expandable section and preserves the full external quick-start guide.
- The automatic opening screen now introduces the product rather than presenting instructions as the primary message.

### Responsive interface

- Adds a dedicated responsive stylesheet for desktop, tablet and mobile layouts.
- Uses a compact, scroll-safe mobile modal with a persistent call-to-action area.
- Preserves keyboard focus trapping, Escape-to-close behaviour and the existing “do not show automatically” preference.

## Clinical and technical boundary

- No protocol JSON files were modified.
- No thresholds, dose actions, organ-function rules, assessment-engine behaviour or knowledge-base records were changed.
- The v0.59.0 organ-function reconciliation and v0.60.0 fifteen-regimen knowledge base remain intact.
- Independent consultant oncology and oncology-pharmacy validation remain pending.
- The current official NCCP protocol and local clinical governance remain authoritative.
