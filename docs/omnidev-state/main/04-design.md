---
version: 1
previous_version: 0
requirement_id: floating-console-panel
complexity: M
approach: A-page-floating-panel
---

# Design — floating console (drag · close · no auto-dismiss)

## Feature F1: Action click → page floating console
### Business Context
- **Related**: current `entrypoints/popup/*` control UI; content SI/bubble
- **Impact**: toolbar icon no longer opens ephemeral action popup; toggles in-page panel

### Implementation Logic
1. Remove `action.default_popup` (WXT: empty/`undefined` popup entry) so `browser.action.onClicked` fires.
2. Background `onClicked` → `tabs.sendMessage(activeTab, { type: 'ui.console.toggle' })`; if no receiver → `scripting.executeScript` inject content then retry once.
3. Content hosts `#lb-console-host` in **Shadow DOM**; inner `<iframe src=runtime.getURL('popup.html')>` (declare `web_accessible_resources` for popup/options assets).
4. Restricted URLs (`chrome://`, Web Store, `about:`) → `browser.notifications` or badge toast: cannot inject; optional open `options.html` tab.

### Edge Cases
- Happy: click icon → panel appears | Err: no content script → inject+retry | Boundary: chrome:// → soft fail message

### Data Changes
| Entity | Change | Details |
| manifest | modify | no default_popup; WAR for popup.html |
| messages | add | `ui.console.toggle` / `ui.console.close` |

## Feature F2: Drag + × close · never outside-dismiss
### Business Context
- **Related**: F1 host chrome around iframe
- **Impact**: panel stays until × or icon toggle-off

### Implementation Logic
1. Host chrome: header drag handle + × button (settings gear stays inside iframe popup UI).
2. Drag: pointerdown on handle → move host `fixed` left/top; clamp to viewport; persist `{x,y}` in `storage.local` (`consolePanelPos`).
3. × / `ui.console.close` / second icon click → hide host (do **not** destroy prefs); click page outside → **no-op**.
4. Popup HTML: add visible × only if still used standalone; primary close is host chrome (iframe may listen `postMessage` close).

### Edge Cases
- Happy: drag + persist reload | Err: iframe focus steal — drag only on host handle | Boundary: restore off-screen pos → clamp

### Data Changes
| Entity | Change | Details |
| storage | add | `consolePanelPos?: { x:number; y:number }` |
| popup UI | minor | optional close postMessage to parent |

## Feature F3: i18n · pack · smoke docs
### Business Context
- **Related**: locales, pack scripts, README usage
- **Impact**: strings for close/drag/restricted-page

### Implementation Logic
1. Locales: `closeConsole`, `consoleRestricted`, `dragHint` (en/zh_CN/zh_TW).
2. UNIT: message validators + pos clamp helper.
3. SMK: manual — icon toggle, drag, ×, outside click stays; pack zip.

### Edge Cases
- Happy: i18n applies | Boundary: Firefox WAR + gecko id unchanged

### Data Changes
| Entity | Change | Details |
| `_locales/*` | add | 3 keys |

## CHANGE_LOG
- v1: floating panel approach A (2026-07-22)
