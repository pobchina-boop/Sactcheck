# SACTCheck development TODO

## Immediate manual checks for v0.17

- Install v0.17 on the `develop` branch and open it through Live Server.
- Open olaparib and confirm irrelevant conditional fields are hidden initially.
- Select febrile neutropenia and confirm grade/occurrence fields appear and become mandatory.
- Open the weekly paclitaxel legacy card and confirm the new **Open JSON shadow assessment** button appears.
- Test normal counts, ANC 0.4, platelets 69, bilirubin 1.26 ×ULN and grade 2 neuropathy.
- Confirm the original weekly paclitaxel assessment remains available.

## Clinical validation

- Review NCCP 00226 v9 JSON line by line with oncology pharmacy and a consultant.
- Document any intentional difference between the legacy and JSON pathways.
- Retain the legacy pathway until source review and boundary validation are signed off.

## Next platform work

- Add reusable section/group metadata to improve long protocol forms.
- Add a protocol-level automated scenario format so each JSON can carry its own regression cases.
- Define protocol owner, reviewer, approval, expiry and emergency-withdrawal governance.
