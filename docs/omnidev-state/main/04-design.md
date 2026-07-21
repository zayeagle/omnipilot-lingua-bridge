# Design — direction prefs · in-popup settings · iframe bubble

## Feature F1: Translate direction toggles (bubble + SI)
### Business Context
- **Related**: selection bubble, page translate, video SI (`lang-detect`, `content.ts`)
- **Impact**: users can enable EN→ZH, ZH→EN, or both independently

### Implementation Logic
1. Add `LangDirectionPrefs { enToZh: boolean; zhToEn: boolean }` to `ExtensionSettings` + `PublicPrefs` (defaults both `true`).
2. Helpers: `isDirectionEnabled(source, prefs)` · `allowedTargetOrNull(source, prefs)`.
3. Bubble: if source lang disabled → do not show bubble (or show disabled hint once — prefer hide).
4. SI: after ASR source resolved, if that direction off → skip translate/speak for chunk (caption may show source-only optional; v1 = skip chunk).
5. Popup: two checkboxes under master switch; sync via settings-store.

### Edge Cases
- Happy: only enToZh → English selection bubbles, Chinese selection ignored | Err: both off → treat as both on OR force master-off UX (v1: coerce at least one on save) | Boundary: `unknown` lang → no bubble

### Data Changes
| Entity | Change | Details |
| ExtensionSettings / PublicPrefs | add | `enToZh`, `zhToEn` booleans |

## Feature F2: Settings stay inside popup
### Business Context
- **Related**: `popup/main.ts` `openOptionsPage()` leaves popup
- **Impact**: click 设置 expands in-popup panel (iframe → `options.html` or slim embed)

### Implementation Logic
1. Replace link handler: toggle `#settings-panel` in popup; do **not** call `openOptionsPage`.
2. Panel hosts `<iframe src="/options.html">` (same extension origin) + Back button.
3. Keep full options page loadable via chrome://extensions for power users (optional secondary link “在标签页打开” collapsed).

### Edge Cases
- Happy: settings iframe loads, popup stays | Err: iframe CSP — use same-extension URL | Boundary: popup height — CSS min-height + scroll

### Data Changes
| Entity | Change | Details |
| popup HTML/CSS/TS | UI only | no schema |

## Feature F3: Internal page selection bubble (iframe)
### Business Context
- **Related**: `content.ts` matches `<all_urls>` without `allFrames`
- **Impact**: enterprise SPA iframes get bubble

### Implementation Logic
1. Set `allFrames: true` on content script.
2. Ensure bubble positions with frame-local rect (already uses `getSelectionRect` in-frame).
3. Document residual: cross-origin iframes without extension injection still fail; Shadow DOM out of v1 unless quick win.

### Edge Cases
- Happy: same-origin iframe selection shows bubble | Err: cross-origin — cannot inject | Boundary: nested frames OK with allFrames

### Data Changes
| Entity | Change | Details |
| content script registration | flag | `allFrames: true` |
