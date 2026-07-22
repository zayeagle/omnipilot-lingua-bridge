---
requirement_id: floating-console-panel
phase: 3
updated: 2026-07-22T20:53:00+08:00
---

# Progress — floating console

## Pre-Dev (M)
| Area | Touch |
|------|-------|
| Manifest | remove `default_popup`; WAR for popup/options/assets |
| Background | `action.onClicked` → toggle message + inject retry |
| Content | top-frame Shadow host + iframe |
| Lib | `console-panel` (pure) + `console-host` (DOM) |
| Popup | optional embedded × → postMessage |
| i18n / README | close/drag/restricted strings |

## Tasks
✅ T1 · `wxt.config.ts`, `entrypoints/background.ts`
✅ T2 · `entrypoints/content.ts`, `lib/console-host.ts`
✅ T3 · `lib/console-panel.ts`, `lib/console-panel.test.ts` · unit_tests: TC-F1-U01..U03
✅ T4 · drag + × + pos persist in console-host
✅ T5 · `popup/index.html`, `popup/main.ts`, `popup/style.css`
✅ T6 · locales en/zh_CN/zh_TW + README
✅ T7 · `npm test` 120 PASS · assert:content OK · zip chrome/firefox 0.4.31

## SMK checklist (manual)
- [ ] Icon → panel on normal page
- [ ] Drag header → reopen keeps position
- [ ] × closes; outside click does not
- [ ] Second icon click toggles off
- [ ] chrome:// shows badge hint, no crash

## Pack
- `.output/omnipilot-lingua-bridge-0.4.31-chrome.zip`
- `.output/omnipilot-lingua-bridge-0.4.31-firefox.zip`
