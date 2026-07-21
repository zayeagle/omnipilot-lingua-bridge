---
requirement_id: direction-settings-iframe
profile: frontend-only-M
layers_required: [UNIT, SMK, REG]
e2e_required: false
---

# Test Plan — direction · popup settings · iframe bubble

| Layer | Scope | Blocking |
|-------|--------|----------|
| UNIT | `storage` prefs normalize; `isDirectionEnabled`; lang filter helpers | ✅ |
| UNIT | content/helpers for direction gate (pure fn) | ✅ |
| SMK | popup direction checkboxes persist; settings panel toggles without openOptionsPage | ✅ |
| REG | full `npm test` | ✅ |
| E2E | skip (no Playwright page for internal intranet) | — |

## Cases
| ID | Layer | Given | Expect |
|----|-------|-------|--------|
| TC-D-U01 | UNIT | enToZh only, source=en | allowed |
| TC-D-U02 | UNIT | enToZh only, source=zh | blocked |
| TC-D-U03 | UNIT | both false coerce → at least one true | ok |
| TC-S-U01 | UNIT | publicPrefs includes direction flags | sync |
| TC-F2-SMK | SMK | open settings in popup | no `openOptionsPage` call |
