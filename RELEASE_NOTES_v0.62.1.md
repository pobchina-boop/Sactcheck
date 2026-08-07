# SACTCheck v0.62.1 Release Notes

## Clinician facing NCCP Change Tracker refinement

This maintenance release rewrites the visible Change Tracker interface around the questions a clinician or reviewer needs answered.

## What changed

1. The tracker now opens with a clear explanation of protocol currency, clinical review and reconciliation.
2. The visible pathway is simplified to Detect, Compare, Review and Reconcile.
3. Technical references to hosting, repository automation, source fingerprints, remote capture and extracted text processing are removed from the application interface.
4. Status cards now use clinician facing terms such as Initial source check pending, Changes requiring review, Official source link required and Last completed source check.
5. The protocol register now displays NCCP version, official source, review state and reconciliation history as its purpose.
6. The change filter previously labelled Silent replacement is now labelled Unannounced change.
7. Every feature continues to explain both its function and its practical strength.

## What did not change

No clinical protocol, threshold, dose action, organ function rule, knowledge base profile or assessment engine behaviour changed.

The internal surveillance and comparison mechanisms remain available in developer documentation and validation records. They are not exposed in the clinician facing interface.

The official NCCP protocol and local clinical governance remain authoritative.
