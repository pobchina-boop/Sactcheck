# SACTCheck Roadmap

## Completed architecture milestone

- Protocol index and JSON loader
- Standalone rule engine
- Standalone assessment engine
- Generic protocol-driven assessment interface
- Explainable findings and documentation output
- Initial automated engine tests

## Next migration milestone

1. Review the generic NCCP 00857 and NCCP 00588 forms against the source protocols.
2. Add explicit field metadata to the JSON schema so labels, units, control types and allowed values no longer depend on inference.
3. Add protocol-schema validation and a larger automated boundary-test suite.
4. Migrate one established hard-coded regimen, beginning with modified FOLFOX-6, into the shared JSON engine.
5. Complete consultant and oncology-pharmacy review before any clinical pilot.

## Later work

- Offline PWA packaging and service-worker review
- Formal audit logging and governance design
- Protocol Builder for controlled off-label or trial regimens
- Role-based deployment and hospital integration planning
