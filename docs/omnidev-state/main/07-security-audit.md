---
requirement_id: direction-settings-iframe
iteration: 1
status: PASS
blocking_open: 0
git_tip: 89dc4a2
audited_at: 2026-07-21T17:51:00+08:00
---

# Security Audit — direction · popup settings · iframe

**Scope**: `lib/lang-direction.ts`, `lib/storage.ts`, `lib/public-prefs.ts`, `lib/settings-store.ts`, `entrypoints/content.ts`, `entrypoints/popup/*`, locales

| ID | Result | Notes |
|----|--------|-------|
| S1 Secrets | PASS | No new secrets; settings iframe is extension-origin `options.html` |
| S2 Injection | PASS | Prefs are booleans only |
| S3 AuthN/AuthZ | PASS | No auth surface change |
| S4 Dangerous APIs | PASS | Removed `openOptionsPage`; no eval |
| S5 Crypto / transport | PASS | Unchanged |
| S6 Data exposure | PASS | Direction prefs in publicPrefs (non-secret) |
| S7 Dependencies | PASS | No new deps |
| S8 SAST | INFO | Checklist-only |

**Gate**: PASS
