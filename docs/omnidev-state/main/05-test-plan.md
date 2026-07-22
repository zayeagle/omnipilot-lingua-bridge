---
version: 1
previous_version: 0
requirement_id: floating-console-panel
profile: frontend-only-M
layers_required: [UNIT, SMK, REG]
e2e_required: false
integration_required: false
---

# Test Plan — floating console panel

## Test Strategy Summary
| Layer | Required | Tool | Command | TC Count |
|-------|----------|------|---------|----------|
| UNIT | ✅ | vitest | npm test | ≥4 new |
| INT | — | — | — | 0 |
| E2E | — | — | — | 0 |
| SMK | ✅ | manual | load `.output/chrome-mv3` | 5 |
| REG | ✅ | vitest | npm test | full suite |

## F1 — UNIT
| TC-ID | Layer | Type | Target | Input | Expected | Mock |
|-------|-------|------|--------|-------|----------|------|
| TC-F1-U01 | UNIT | Happy | `isConsoleInjectableUrl` | https://example.com | true | none |
| TC-F1-U02 | UNIT | Err | same | chrome://extensions | false | none |
| TC-F1-U03 | UNIT | Boundary | same | https://chrome.google.com/webstore/... | false | none |

## F2 — UNIT
| TC-ID | Layer | Type | Target | Input | Expected | Mock |
|-------|-------|------|--------|-------|----------|------|
| TC-F2-U01 | UNIT | Happy | `clampPanelPos` | in-viewport | unchanged | none |
| TC-F2-U02 | UNIT | Boundary | same | x=-999 | clamped ≥0 | none |
| TC-F2-U03 | UNIT | Happy | message validate `ui.console.toggle` | valid shape | ok | none |

## Smoke Suite
| TC-ID | Source-TC | Layer | Critical Path |
|-------|-----------|-------|---------------|
| TC-SMK-01 | F1 | SMK | Icon click → panel shows on normal page |
| TC-SMK-02 | F2 | SMK | Drag header → position persists after reopen |
| TC-SMK-03 | F2 | SMK | × closes; click outside does **not** close |
| TC-SMK-04 | F1 | SMK | Second icon click toggles off |
| TC-SMK-05 | F1 | SMK | chrome:// → no crash; user-visible restriction |

## Regression Suite
| TC-ID | Layer | Module | Package | Type |
|-------|-------|--------|---------|------|
| TC-REG-01 | REG | all | root | full `npm test` |

## CHANGE_LOG
- v1: floating console test plan (2026-07-22)
