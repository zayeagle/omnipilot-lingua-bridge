

## Archived 2026-07-18 08:58

---
version: 1
artifact: 04-design.md
last_updated: 2026-07-18T08:41:00+08:00
history_ref: 04-design-history.md
---

# Design �?Lingua Bridge

## Feature F1: Scaffold & Zero-Ops Settings
### Business Context
- **Related**: all features depend on WXT shell + storage
- **Impact**: first-run Key setup; master toggle; auto-enable when Key valid

### Implementation Logic
1. Entry: `wxt init` TS template �?chrome/firefox targets
2. Core: options save `aiConfig` (key, baseUrl, models); popup toggles `enabled`; no Key �?CTA to options
3. Data: `browser.storage.local` schema `{ enabled, aiConfig, originalTextMap? }`

### Edge Cases
- Happy: save Key �?auto enabled | Err: empty Key reject | Err: invalid URL | Boundary: Key never logged

### Data Changes
| Entity | Change | Details |
| storage.local | create | aiConfig, enabled |

## Feature F2: AI Client (OpenAI-compatible)
### Business Context
- **Related**: F1 config; consumed by F3/F4
- **Impact**: single protocol for translate + STT

### Implementation Logic
1. Entry: background message `ai.translate` / `ai.transcribe`
2. Core: fetch chat completions + audio transcription; timeout/retry once; strip secrets from errors
3. Data: reads `aiConfig` only in background

### Edge Cases
- Happy: 200 JSON | Err: 401 surface “检�?Key�?| Err: network | Boundary: empty text skip call

### Data Changes
| Entity | Change | Details |
| none | �?| ephemeral HTTP only |

## Feature F3: Auto Page Translate
### Business Context
- **Related**: F1 enabled + F2 translate
- **Impact**: viewport EN↔ZH with zero direction pick

### Implementation Logic
1. Entry: content on `enabled` + Intersection/scroll
2. Core: collect visible text nodes �?`lang-detect` �?batch to F2 �?replace; MutationObserver; keep original map for restore
3. Data: DOM text + WeakMap/originalTextMap

### Edge Cases
- Happy: EN page �?ZH | Err: AI fail keep original | Boundary: skip input/script/code | mixed langs per-node

### Data Changes
| Entity | Change | Details |
| DOM | mutate | textContent swap + data attrs |

## Feature F4: Video Speech �?Captions
### Business Context
- **Related**: F2 STT+translate; F1 enabled
- **Impact**: auto captions; minimal prompts

### Implementation Logic
1. Entry: detect `<video>` playing when enabled
2. Core: capture element audio chunks �?transcribe �?detect/translate �?`caption-ui`; fallback one tab-capture prompt
3. Data: cue queue with timestamps

### Edge Cases
- Happy: captions lag-bounded | Err: DRM �?toast once | Err: Firefox degrade | Boundary: no video = idle

### Data Changes
| Entity | Change | Details |
| DOM | inject | caption overlay node |

## Feature F5: Dual-Browser Build & CI Smoke
### Business Context
- **Related**: packaging for Chrome + Firefox
- **Impact**: installable artifacts + CI build gate

### Implementation Logic
1. Entry: `wxt build` / `wxt build -b firefox`
2. Core: Makefile targets; CI build both; optional Playwright load extension
3. Data: `dist/chrome`, `dist/firefox`

### Edge Cases
- Happy: both zip | Err: manifest permission mismatch | Boundary: unsigned local load

### Data Changes
| Entity | Change | Details |
| repo | add | CI workflow, Makefile |


---
## Archive 2026-07-18T09:23:24+08:00 �� superseded by API Key deep hardening (M)

---
version: 2
artifact: 04-design.md
last_updated: 2026-07-18T08:58:00+08:00
history_ref: 04-design-history.md
---

# Design �?Lingua Bridge v2 (SI)

## Feature F1: Settings & Zero-Ops
Unchanged core; adds `speechMode` + `ttsModel`. Popup exposes only caption|voice.

## Feature F2: AI Client
Adds `ai.speak` (TTS) alongside translate/transcribe.

## Feature F3: Page Translate
Unchanged viewport EN↔ZH auto-detect.

## Feature F4: Simultaneous Interpretation
### Business Context
- **Related**: F2 STT/TTS/translate
- **Impact**: SI foundation via short audio chunks; **only two outputs**

### Implementation Logic
1. Entry: enabled + video present
2. Core: chunk capture �?STT �?translate �?if `caption` showCue else TTS playback
3. Data: settings.speechMode

### Edge Cases
- Happy: caption/voice switch live | Err: DRM toast once | Boundary: no video idle

## Feature F5: Installable Packaging
Icons + `wxt zip` chrome/firefox; README load steps identical to normal extensions.


---
## Archive 2026-07-18T09:34:48+08:00 �� encrypt+UX

---
version: 3
artifact: 04-design.md
last_updated: 2026-07-18T09:23:00+08:00
history_ref: 04-design-history.md
---

# Design �?API Key deep hardening

## Feature F6: Base URL trust gate
### Business Context
- **Related**: F1 settings, F2 AI client
- **Impact**: Stop http + warn on non-default hosts before Key leaves the machine

### Implementation Logic
1. `isValidBaseUrl` �?**https only** (reject http)
2. Options save: if host �?`api.openai.com`, show confirm string in UI (checkbox “我确认该端点可信�?
3. `validateAiConfig` enforces https; optional `baseUrlAcknowledged` flag in storage for non-default hosts

### Edge Cases
- Happy: https OpenAI/DeepSeek | Err: http rejected | Boundary: trailing slash normalized

### Data Changes
- `AiConfig` unchanged; UI gate only (+ optional `trustedBaseUrlAck: string` hash of host)

## Feature F7: Popup keyless prefs
### Business Context
- Popup only needs enabled/mode/hasKey �?not raw apiKey in memory

### Implementation Logic
1. Add `hasApiKey` to `PublicPrefs` (synced on save)
2. Popup reads `publicPrefsItem` (or thin helper) �?never `getSettings().aiConfig.apiKey`
3. `setEnabled` / `setSpeechMode` stay on settings-store (extension page OK)

### Edge Cases
- Happy: hasKey false �?CTA | Err: toggle without key | Boundary: upgrade sync ensurePublicPrefsSynced

## Feature F8: AI message rate limit
### Business Context
- Malicious page can burn quota via content→background messages (no key return)

### Implementation Logic
1. Background token bucket: e.g. 30 translate req / min / tabId
2. Exceed �?`{ ok:false, error: '请求过于频繁' }` without calling AI
3. UNIT with fake clock / counters

### Edge Cases
- Happy: normal browse | Err: burst | Boundary: missing tabId �?global bucket

## Feature F9: CI content-bundle assert
### Implementation Logic
1. Script `scripts/assert-content-no-secrets.mjs` after build
2. Fail if content.js matches `/apiKey|local:settings/`
3. Wire into `npm test` postbuild or `pack.mjs` / CI


---
archived_at: 2026-07-18T09:46:01+08:00
from: 04-design.md
reason: requirement change — optional API key + free translate
---

---
version: 4
artifact: 04-design.md
last_updated: 2026-07-18T09:34:00+08:00
history_ref: 04-design-history.md
---

# Design 鈥?Encrypt opt-in + provider UX

## Feature F10: Optional encrypt-at-rest
### Business Context
- User can enable銆屽畨鍏ㄥ姞鍥恒€峚nd set a passphrase; API Key stored encrypted.

### Implementation Logic
1. Storage: `security.hardeningEnabled`, `security.salt`, `security.apiKeyCipher` (base64), `security.iv`
2. Plain `aiConfig.apiKey` empty when hardened; ciphertext separate
3. Crypto: PBKDF2-SHA256 (100k) 鈫?AES-GCM-256 (`lib/crypto-key.ts`)
4. Unlock: options/popup 鈫?message `security.unlock` 鈫?SW keeps `CryptoKey` in memory
5. AI calls: `getDecryptedApiKey()` in SW only; lock clears memory on `security.lock` / SW restart
6. Disable hardening: require unlock 鈫?decrypt 鈫?store plaintext 鈫?clear cipher fields

### Edge Cases
- Happy: enable 鈫?save key 鈫?restart 鈫?unlock 鈫?translate works
- Err: wrong passphrase 鈫?friendly error
- Boundary: forgot passphrase 鈫掋€屾竻闄ゅ瘑閽ュ苟鍏抽棴鍔犲浐銆峯nly

## Feature F11: Provider capability UI
### Implementation Logic
1. `supportsStt` / `supportsTts` from non-empty model lists (or explicit flags)
2. Hide STT/TTS field blocks when unsupported; show `capabilityNote` only
3. Chat always shown (all presets support chat)

## Feature F12: Single model combobox
### Implementation Logic
1. One `<input list="鈥?>` + `<datalist>` per model type
2. Type freely or pick suggestion 鈥?no separate select



---
archived_at: 2026-07-18T10:03:02+08:00
from: 04-design.md
reason: selection-bubble UX
---

---
version: 5
artifact: 04-design.md
last_updated: 2026-07-18T09:46:00+08:00
history_ref: 04-design-history.md
change_log: "v5: optional API key + free translate/speech fallback"
---

# Design 鈥?Optional API Key + free translate

## Feature F13: Optional API Key (enable without credential)
### Business Context
- Key is enhancement, not gate. Users can turn on extension and get max free-path translation.

### Implementation Logic
1. `canEnable()` 鈫?always `true` (or only require browser context)
2. `applyToggle` no longer errors on missing Key
3. `resolveEnabledAfterSave`: keep prior enabled when saving empty Key; optional auto-on first install stays off until user toggles
4. Options: API Key labeled銆屽彲閫?路 閰嶇疆鍚庡惎鐢?AI 楂樿川閲忚矾寰勩€? save allowed with empty Key
5. `publicPrefs.hasApiKey` still tracks credential for UI badges only

### Edge Cases
- Happy: no Key 鈫?enable 鈫?free page translate | Err: free engines fail 鈫?toast CTA to add Key | Boundary: hardening UI only when Key present

## Feature F14: Free text translate chain
### Business Context
- Maximize ZH鈫擡N page translate without user Key.

### Implementation Logic
1. New `lib/free-translate.ts` + background router in `resolveTranslate()`:
   - If `hasStoredCredential` + unlocked 鈫?existing AI chat translate
   - Else try Chrome `Translator` API (content or offscreen; `availability` then `create`/`translate`)
   - Else LibreTranslate HTTPS public endpoint (host_permission; batch texts)
2. Content `requestTranslate` unchanged; SW picks provider
3. Manifest: permission for LibreTranslate host; document privacy (text leaves machine on LT path)

### Edge Cases
- Happy: Chrome Translator available | Err: LT rate limit 鈫?friendly error | Boundary: Firefox 鈫?skip Translator, use LT

## Feature F15: Free speech SI path
### Business Context
- Without Key, still caption/voice SI using browser APIs.

### Implementation Logic
1. No Key: STT via `webkitSpeechRecognition` / `SpeechRecognition` (content); translate transcript via F14; voice via `speechSynthesis`
2. With Key: keep AI STT/TTS
3. Pipeline switch in content or background message `ai.transcribe`/`ai.speak` returns `{ mode:'free' }` hints

### Edge Cases
- Happy: caption mode free path | Err: no mic/SpeechRecognition 鈫?toast | Boundary: voice quality degraded note in popup

## Feature F16: Capability UX
### Implementation Logic
1. Popup: show銆屽熀纭€浼犺瘧锛堟棤闇€ Key锛夈€峷s銆孉I 澧炲己锛堝凡閰嶇疆 Key锛夈€?2. Options section reorder: 鎬诲紑鍏?first; API Key optional card below
3. README: feature matrix table


---
archived_at: 2026-07-18T11:32:00+08:00
reason: new_requirement_iflytek_integration
from: 04-design.md
---

---
version: 6
artifact: 04-design.md
last_updated: 2026-07-18T10:03:00+08:00
history_ref: 04-design-history.md
change_log: "v6: selection bubble default; page auto optional; vocab explain; toast UX"
---

# Design 鈥?Selection bubble UX

## Feature F17: Page mode (selection | auto)
### Business Context
- Default is no full-page auto-translate. User opts into auto.

### Implementation Logic
1. Settings + publicPrefs: `pageMode: 'selection' | 'auto'` (default `selection`)
2. Popup radio/toggle: 鍒掕瘝姘旀场锛堥粯璁わ級 / 鏁撮〉鑷姩
3. Content: `auto` 鈫?existing viewport translate; `selection` 鈫?skip auto, listen `selectionchange`/`mouseup`

## Feature F18: Selection translate bubble
### Business Context
- After select text, show light bubble near selection.

### Implementation Logic
1. `lib/selection-bubble.ts`: position from `getBoundingClientRect`, actions:
   - 缈昏瘧閫変腑 鈫?translate selection 鈫?panel with result
   - 缈昏瘧鏁撮〉 鈫?one-shot `translateViewport` (does not switch mode permanently)
   - 鍏抽敭璇嶈瑙?鈫?see F19
2. Dismiss on scroll/click outside / Esc
3. Light theme (match popup sky/teal)

## Feature F19: Key vocabulary explain
### Business Context
- Selection translate supports keyword glosses.

### Implementation Logic
1. AI path: chat prompt returns JSON `{ translation, terms:[{term,gloss}] }`
2. Free path: translation only + heuristic term list (split/CJK chunks) with short bilingual note if possible
3. Background message `ai.explain` or extend translate payload `withTerms: true`

## Feature F20: Toast dismiss UX
### Implementation Logic
1. Extract `lib/toast-ui.ts`: light card, 脳 button, auto-hide 4s (clearable)
2. Replace content inline toast; no sticky forever

## Feature F21: Video SI unchanged
- Speech caption/voice still full-video SI when enabled; independent of pageMode.


---
archived_at: 2026-07-18T14:17:00+08:00
reason: new_requirement_security_harden
from: 04-design.md
---

---
version: 7
artifact: 04-design.md
complexity: M
last_updated: 2026-07-18T11:32:00+08:00
history_ref: 04-design-history.md
---

# Design — iFlytek provider integration

## Feature F21: iFlytek credentials + preset
### Business Context
- **Related**: options/popup providers (openai/deepseek), `storage.aiConfig`, encrypt-at-rest
- **Impact**: users can select「讯飞」and store APPID/APIKey/APISecret without OpenAI Base URL

### Implementation Logic
1. Extend `AiConfig` / settings: `providerId: 'iflytek'`, `iflytek: { appId, apiKey, apiSecret }` (secrets background-only).
2. Options UI: preset fills hosts; hide OpenAI model fields; show three credential inputs (mask + keep-on-empty).
3. `hasStoredCredential` true when iflytek triple present; publicPrefs only `hasApiKey` / provider id — never secrets in content.
4. Host allowlist for fetch/WS: `*.xfyun.cn`, `*.xf-yun.com` (MV3 host_permissions).

### Edge Cases
- Happy: save+reload unlocks SI | Err: missing one of three → clear error | Boundary: encrypt vault wraps apiKey; store appId/secret alongside or in vault fields

### Data Changes
| Entity | Change | Details |
| AiConfig | add | iflytek credentials + providerId |
| manifest | add | host_permissions for xfyun domains |

## Feature F22: HMAC auth + protocol clients
### Business Context
- **Related**: `lib/ai-client.ts` OpenAI HTTP; background message handlers
- **Impact**: native STT/MT/TTS without Whisper-shaped endpoints

### Implementation Logic
1. `lib/iflytek/auth.ts`: RFC1123 date + HMAC-SHA256 signature → query/header Authorization (Web Crypto).
2. `lib/iflytek/stt.ts`: WSS `iat.cn-huabei-1.xf-yun.com/v1`, domain=slm language=mul_cn; PCM 16k frames status 0/1/2; ≤60s per session → chunk restart.
3. `lib/iflytek/mt.ts`: HTTPS POST `itrans.xfyun.cn/v2/its` (自研) with Digest; EN↔ZH; used for SI translate + optional bubble when provider=iflytek.
4. `lib/iflytek/tts.ts`: WSS 超拟人 `cbm01.cn-huabei-1.xf-yun.com/v1/private/mcd9m97e6` (confirm console path); assemble mp3/lame → base64 for content playback.
5. All network I/O only from background SW.

### Edge Cases
- Happy: chunk STT→MT→caption | Err: WS code → sanitize | Boundary: 60s STT cut; empty audio skip

### Data Changes
| Entity | Change | Details |
| new libs | add | auth/stt/mt/tts + thin facade |

## Feature F23: Route speech + text through iFlytek
### Business Context
- **Related**: `ai-handler`, `speech-pipeline`, free fallback paths
- **Impact**: when provider=iflytek, SI uses F22; OpenAI path unchanged

### Implementation Logic
1. `resolveAiConfigForRequest`: if iflytek complete → route `ai.transcribe`/`ai.speak`/`ai.translate` to iflytek clients.
2. Keep Libre/free for no-credential; keep OpenAI when other providers.
3. Caption default; voice mode uses TTS; explain terms still free/AI chat (no Spark chat in v1) — if no chat key, free explain.
4. host_permissions + CSP connect-src as needed for WXT build.

### Edge Cases
- Happy: YouTube SI captions ZH | Err: quota → user message | Boundary: switch provider mid-session stops pipeline

### Data Changes
| Entity | Change | Details |
| ai-handler / background | branch | provider switch |
| wxt.config / manifest | perms | WS hosts |



---
archived_from: 04-design.md
archived_at: 2026-07-18T06:27:18.446Z
version: 8
reason: superseded by security re-audit #3
---

---
version: 8
artifact: 04-design.md
complexity: M
last_updated: 2026-07-18T14:17:00+08:00
history_ref: 04-design-history.md
---

# Design — Security harden (vault + messaging)

## Feature F31: Real encrypt-at-rest (passphrase + iFlytek secret)
### Business Context
- **Related**: `settings-store` vault, `crypto-key`, options security UI, `key-session`
- **Impact**: profile theft no longer yields passphrase + cipher together; iFlytek APISecret not clear in `aiConfig`

### Implementation Logic
1. Stop writing `rememberedPassphrase` into `storage.local`. Keep unlock only in SW memory (`key-session`) for current browser session.
2. Extend vault payload: encrypt JSON `{ apiKey, iflytekApiSecret? }` (or dual cipher fields) with same PBKDF2+AES-GCM; `aiConfig.iflytekApiSecret` empty when hardening on.
3. Options: never hydrate secret inputs from storage; keep-on-empty; unlock/status via `security.*` only.
4. `clearEncryptedVault` / disable hardening: wipe apiKey + iflytekAppId/ApiSecret + cipher blob + any residual passphrase field.
5. Migration: if old `rememberedPassphrase` present, one-time unlock then delete field on next save.

### Edge Cases
- Happy: harden save → storage has cipher only | Err: wrong passphrase | Boundary: iflytek empty secret with non-iflytek provider OK

### Data Changes
| Entity | Change | Details |
| SecurityState | remove persist passphrase | optional migrate-delete |
| AiConfig | secret cleared when hardened | restore only in SW memory |

## Feature F32: Message validation + security.* hardening
### Business Context
- **Related**: `messages.ts`, `background.ts` rate-limit, content→background AI
- **Impact**: DoS/cost abuse harder; content cannot spam unlock

### Implementation Logic
1. Add validators: max texts count/len, max `audioBase64` chars, reject unknown fields lightly.
2. Apply rate-limit to `security.*` (stricter bucket); require `sender.id === runtime.id` and no `sender.tab` for unlock/lock (options/popup only).
3. Keep content able to call AI types only; security status may allow extension pages.
4. UNIT for validators + background sender gate (mock sender).

### Edge Cases
- Happy: normal translate under limits | Err: oversized audio rejected | Boundary: security.unlock from content tab → denied

### Data Changes
| Entity | Change | Details |
| messages.ts | validate* helpers | pure functions |
| background | gate + limit | no schema change |

## Out of scope (this slice)
- Changing iFlytek query-string auth (vendor protocol).
- Closed Shadow DOM for bubble/caption (Medium UX isolation — backlog).


---
archived_at: 2026-07-21T17:29:05+08:00
from: 04-design.md
---

---
version: 9
artifact: 04-design.md
complexity: M
last_updated: 2026-07-18T14:28:00+08:00
history_ref: 04-design-history.md
---

# Design �?Security re-audit #3 (SW session + fail-closed)

## Feature F33: SW-only unlock session (fix wrong JS world)
### Business Context
- **Related**: `key-session`, `settings-store`, `options/main`, `background` `security.*`
- **Impact**: hardening unlock actually enables AI in SW; no silent Libre while UI says unlocked

### Implementation Logic
1. Options **must not** call `unlockWithPassphrase` / `getSecurityStatus` / rely on options-world `setUnlockedVault`. Use `browser.runtime.sendMessage` for `security.unlock` / `security.status` / `security.lock` only.
2. After harden `saveAiConfig` from options (passphrase present): persist cipher in storage, then `security.unlock` so SW `key-session` holds secrets. `saveAiConfig` may still call `setUnlockedVault` when running inside SW; when called from options, vault set is inert for AI �?SW unlock is mandatory follow-up.
3. Prefer thin options helpers (`lib/security-client.ts`): `unlockSession`, `fetchSecurityStatus` wrapping messages.
4. Background keep existing `security.*` handlers as SSOT for session memory.

### Edge Cases
- Happy: unlock in options �?SW status.unlocked true �?translate uses provider | Err: wrong pass | Boundary: SW restart clears session; options shows locked

### Data Changes
| Entity | Change | Details |
| options/main | message-only unlock/status | no direct settings-store unlock |
| security-client (new) | thin RPC | optional |

## Feature F34: Fail-closed + sender.id + secret redact
### Business Context
- **Related**: `background.ts`, `messages.ts`, `ai-client.sanitizeErrorMessage`
- **Impact**: locked vault never Libre-exfils user text; stricter security sender; fewer secret leaks in logs/errors

### Implementation Logic
1. `resolveAiConfigForRequest`: return typed failure `{ ok:false, reason:'locked'|'missing_key', error }` (or equivalent). Background: if `locked` �?return error, **no** `freeTextResponse`. If `missing_key` �?free path OK.
2. `isExtensionPageSender`: require `sender.id === browser.runtime.id` **and** `sender.tab == null` (F32 leftover).
3. Extend `sanitizeErrorMessage(raw, ...secrets)` to redact apiKey + iflytekApiSecret (+ optional auth query fragments). Wire from ai-handler when iflytek secrets present.
4. Out of this slice: host_permissions tighten, Base URL allowlist, iFlytek query-auth redesign, Shadow DOM.

### Edge Cases
- Happy: no key �?Libre | Err: hardened+locked �?explicit unlock message | Boundary: wrong sender.id �?security denied

### Data Changes
| Entity | Change | Details |
| resolveAiConfigForRequest | reason field | background branch |
| messages.isExtensionPageSender | id check | UNIT update |
| sanitizeErrorMessage | multi-secret | UNIT |

## Out of scope
- iFlytek query-string auth protocol change
- `<all_urls>` / Base URL private-IP policy (backlog)
- Shadow DOM

---

## [ARCHIVE] 04-design · vN · 2026-07-22 20:43

| Field | Value |
|-------|-------|
| version | N |
| archived_at | 2026-07-22T20:43:53+08:00 |
| reason | requirement |
| trigger | /od n Phase0 confirm → Phase2 regen |
| requirement_id | floating-console-panel |
| summary | Superseded by floating panel (drag + close + no auto-dismiss) plan |

<!-- BEGIN SNAPSHOT -->
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

<!-- END SNAPSHOT -->

---
