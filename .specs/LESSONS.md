# LESSONS - auto-maintained by scripts/lessons.py

> Machine-owned. Do NOT hand-edit. Changes are overwritten on the next `lessons.py` write.
> Canonical state lives in `.specs/lessons.json`. Edit lessons only via the script.
> promote_threshold=2 distinct features · window_days=45 · quarantine_threshold=2

## Confirmed (load these at Specify/Design)

Corroborated across multiple features. Safe to apply as guidance.

_none_

## Candidates (under observation - do NOT load as guidance yet)

Seen once or not yet corroborated. Tracked, not trusted.

### L-001 - Assert inclusive range boundaries with dates equal to the bounds, not only far-outside values
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `fleet-filters` · harmful: 0
- features: fleet-kanban
- evidence: FilterRow period bounds M8 (fleet-filters)
- last seen: 2026-10-02T12:06:43Z

### L-002 - Assert the surface background token of every card and section in static CSS tests, not only the tokens and the components whose fill changed
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `frontend-css` · harmful: 0
- features: figma-restyle
- evidence: M12,M13 (EquipePage.module.css:17, MachineCard.module.css:11) (frontend-css)
- last seen: 2026-10-11T01:14:21Z

### L-003 - Write computed-style criteria against the element that actually declares the property; an element that inherits through transparency cannot be asserted
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `spec` · harmful: 0
- features: figma-restyle
- evidence: RST-04 AC1 (App.css:17 .app-main) (spec)
- last seen: 2026-10-11T01:14:21Z

### L-004 - Cover every selector that applies a shared token role, such as the primary button color, not just the component named in the task
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `frontend-css` · harmful: 0
- features: figma-restyle
- evidence: M23 (EquipePage.module.css:57) (frontend-css)
- last seen: 2026-10-11T01:14:21Z

### L-005 - Give each responsive edge case in the spec a static assertion, or drop it from the spec
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `frontend-css` · harmful: 0
- features: figma-restyle
- evidence: M21 (index.css responsive edge case 640-1279px) (frontend-css)
- last seen: 2026-10-11T01:14:21Z

### L-006 - Name the exact token for every state in a spec criterion instead of pointing at the current value, so the test asserts the spec and not the implementation
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `spec` · harmful: 0
- features: figma-restyle
- evidence: RST-06 AC1 Offline cinza atual (machines.test.ts:28-31 MachineCard.module.css:178) (spec)
- last seen: 2026-10-11T01:37:25Z

### L-007 - Give mock ids a real ObjectId, not a string, when a test asserts that the id is converted to text
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `backend-tests` · harmful: 0
- features: machines-api
- evidence: M08 machineService.ts:id (backend-tests)
- last seen: 2026-10-13T15:22:43Z

### L-008 - Put a script's work and its disconnect in an exported function so a test can assert the connection closes, including on failure
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `backend-scripts` · harmful: 0
- features: machines-api
- evidence: M32 seedData.ts:disconnect (backend-scripts)
- last seen: 2026-10-13T15:22:43Z

### L-009 - Assert new translation values differ from the source language, not only that they are non-empty
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `frontend-i18n` · harmful: 0
- features: machines-api
- evidence: M25 i18n.test.ts:loadError/retry (frontend-i18n)
- last seen: 2026-10-13T15:22:43Z

### L-010 - When a body field is validated on both POST and PUT, give the PUT its own non-text test for every validated field
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `backend-tests` · harmful: 0
- features: employee-nav-settings
- evidence: B20 userController.ts PUT telefone/cargo (backend-tests)
- last seen: 2026-10-13T17:09:14Z

## Quarantined (failed when applied - ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
