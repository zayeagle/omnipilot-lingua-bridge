---
version: 1
previous_version: 0
requirement_id: floating-console-panel
complexity: M
approach: A-page-floating-panel
groups: [G1, G2, G3]
---

# Plan — floating console (drag · close · no auto-dismiss)

## Group G1 — Action → toggle panel `[frontend]`
| ID | Task | feature_ref | outputs | status |
|----|------|-------------|---------|--------|
| T1 | Drop default_popup; WAR for popup.html; `action.onClicked` + inject/retry | F1 | `wxt.config.ts`, `entrypoints/background.ts` | [x] |
| T2 | Content: Shadow host + iframe popup; message handlers toggle/close | F1 | `entrypoints/content.ts`, `lib/console-host.ts` | [x] |
| T3 | Pure `isConsoleInjectableUrl` + UNIT | F1 | `lib/console-panel.ts` (+test) | [x] |

## Group G2 — Drag + close UX `[frontend]`
| ID | Task | feature_ref | outputs | status |
|----|------|-------------|---------|--------|
| T4 | Host chrome: drag handle + ×; outside-click ignored; pos persist/clamp | F2 | `lib/console-host.ts` | [x] |
| T5 | Popup `postMessage` close → parent; keep gear→settings | F2 | `popup/main.ts`, `popup/index.html` | [x] |

## Group G3 — i18n · pack · SMK `[frontend]`
| ID | Task | feature_ref | outputs | status |
|----|------|-------------|---------|--------|
| T6 | Locales + README one-liner usage | F3 | `_locales/*`, README*.md | [x] |
| T7 | UNIT suite green + pack zip; note SMK checklist | F3 | tests, `.output/*` | [x] |

## Order
G1 → G2 → G3 → UNIT/REG → SMK → Phase 4

## Out of scope
- Detached `windows.create` panel (Approach B)
- Changing SI caption drag behavior
- Side Panel API

## CHANGE_LOG
- v1: Approach A floating panel plan (2026-07-22)
- v1 done: T1–T7 implemented; pack 0.4.31
