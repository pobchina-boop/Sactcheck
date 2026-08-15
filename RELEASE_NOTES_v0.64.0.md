# SACTCheck v0.64.0

## Knowledge Base Expansion

SACTCheck v0.64.0 expands the detailed regimen knowledge base from 18 to 21 profiles.

### New profiles

1. NCCP 00945 v1, Enfortumab Vedotin and Pembrolizumab Therapy for advanced urothelial carcinoma.
2. NCCP 00844 v4a, Nivolumab and FOLFOX 6 Modified Therapy for the two current upper gastrointestinal indications.
3. NCCP 00431 v10, Nivolumab and Ipilimumab Therapy for advanced melanoma.

Each profile includes treatment intent, patient selection, supportive care, monitoring, priority toxicities, administration, mechanisms, evidence mapping, evidence limitations and a structured evidence completeness audit.

### Evidence completeness additions

The release adds CheckMate 648 for the oesophageal squamous indication within NCCP 00844, CheckMate 067 and CheckMate 204 for NCCP 00431, and mature follow up publications for EV 302 and CheckMate 649.

The knowledge base now contains 45 principal evidence records.

### Source confirmed antiemetic corrections

During the profile build, three existing emetogenic classifications were found to conflict with the current NCCP SACT Antiemetic Guidance V6 classification table.

1. NCCP 00844 is now moderate risk because oxaliplatin is moderate risk.
2. NCCP 00945 is now low risk because enfortumab vedotin is low risk.
3. NCCP 00431 is now low risk because ipilimumab is low risk.

The existing traffic light system is retained. National NCCP antiemetic guidance remains the linked supportive care source. No local antiemetic document was reintroduced.

### Clinical engine integrity

Only supportive care classification metadata changed in the three affected protocol JSON files. Inputs, deterministic treatment rules, eligibility, exclusions, treatment schedules and dose actions remain unchanged from v0.63.1.

### Validation

The complete cumulative test suite passed. The focused v0.64.0 knowledge base test passed. The v0.63.1 national antiemetic guidance regression test passed with the three approved source reconciliations. Repository security validation passed. The deployable site build and site validation passed.

Independent consultant oncology and oncology pharmacy validation remains pending.
