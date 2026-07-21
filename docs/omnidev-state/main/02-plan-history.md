

## Archived 2026-07-18 08:58

---
version: 1
artifact: 02-plan.md
complexity: L
last_updated: 2026-07-18T08:41:00+08:00
history_ref: 02-plan-history.md
---

# Plan �?Lingua Bridge

## Traceability

| Group | Features | Tasks | TC-IDs |
|-------|----------|-------|--------|
| G1 Scaffold & Settings | F1 | T1–T3 | F1 U/I, E2E-01, SMK-01 |
| G2 AI Client | F2 | T4–T5 | F2 U/I, SMK-02 |
| G3 Page Translate | F3 | T6–T8 | F3 U/I, E2E-02, SMK-03 |
| G4 Speech Captions | F4 | T9–T11 | F4 U/I, E2E-03, SMK-04 |
| G5 Dual-Browser CI | F5 | T12–T13 | F5 U, E2E-04, SMK-05 |

## Group 1 �?Scaffold & Settings
- [x] **T1** [ext] WXT+TS scaffold (chrome/firefox targets) · feature: F1 · outputs: `package.json`, `wxt.config.ts`, `entrypoints/*` · depends: �?
- [x] **T2** [ext] Options: API Key / Base URL / models �?storage · feature: F1 · outputs: `entrypoints/options/` · depends: T1
- [x] **T3** [ext] Popup master toggle + no-Key CTA + auto-enable · feature: F1 · outputs: `entrypoints/popup/` · depends: T2

## Group 2 �?AI Client
- [x] **T4** [ext] `lib/ai-client` chat translate + error mapping · feature: F2 · outputs: `lib/ai-client.ts` · depends: T2
- [x] **T5** [ext] Background message router + STT method stub · feature: F2 · outputs: `entrypoints/background.ts` · depends: T4

## Group 3 �?Page Translate
- [x] **T6** [ext] `lib/lang-detect` ZH/EN heuristic · feature: F3 · outputs: `lib/lang-detect.ts` · depends: T1
- [x] **T7** [ext] `lib/page-translate` viewport batch + MutationObserver · feature: F3 · outputs: `lib/page-translate.ts` · depends: T5, T6
- [x] **T8** [ext] Content script wire enable→translate + restore map · feature: F3 · outputs: `entrypoints/content.ts` · depends: T3, T7

## Group 4 �?Speech Captions
- [x] **T9** [ext] `lib/caption-ui` overlay · feature: F4 · outputs: `lib/caption-ui.ts` · depends: T1
- [x] **T10** [ext] `lib/speech-pipeline` video capture→STT→translate · feature: F4 · outputs: `lib/speech-pipeline.ts` · depends: T5, T9
- [x] **T11** [ext] Content integrate pipeline + one-shot tab fallback · feature: F4 · outputs: `entrypoints/content.ts` · depends: T8, T10

## Group 5 �?Dual-Browser & Quality Gate
- [x] **T12** [ext] Makefile + CI build chrome/firefox · feature: F5 · outputs: `Makefile`, `.github/workflows/ci.yml` · depends: T1
- [x] **T13** [ext] Vitest+Playwright scaffold + critical TCs · feature: F5 · outputs: `vitest.config.ts`, `e2e/` · depends: T8, T11

## Execution Order
G1 �?G2 �?G3 �?G4 �?G5 (T12 can parallel after T1)


---
## Archive 2026-07-18T09:23:24+08:00 �� superseded by API Key deep hardening (M)

---
version: 2
artifact: 02-plan.md
complexity: L
last_updated: 2026-07-18T08:58:00+08:00
history_ref: 02-plan-history.md
---

# Plan �?Lingua Bridge v2

## Change tasks (post-structural sync)
- [x] **T14** speechMode caption|voice in storage + popup · feature: F4
- [x] **T15** TTS `ai.speak` + voice playback path · feature: F2/F4
- [x] **T16** SI chunk pipeline mode-aware · feature: F4
- [x] **T17** icons + pack zip chrome/firefox installable · feature: F5
- [x] **T1–T13** prior groups retained

## Traceability
| Group | Features | Status |
|-------|----------|--------|
| G1–G5 | F1–F5 | done v1 |
| G6 SI+Pack | F2/F4/F5 | T14–T17 done |


---
## Archive 2026-07-18T09:34:48+08:00 �� encrypt+UX

---
version: 3
artifact: 02-plan.md
complexity: M
last_updated: 2026-07-18T09:26:00+08:00
history_ref: 02-plan-history.md
---

# Plan �?API Key deep hardening

## Groups

### G7 �?Trust & storage surface · F6 F7
- [x] **T18** https-only Base URL + options trust ack · feature: F6
- [x] **T19** `hasApiKey` on publicPrefs; popup keyless · feature: F7
- [x] **T20** UNIT storage/url validation · feature: F6/F7

### G8 �?Abuse & CI · F8 F9
- [x] **T21** background rate-limit for `ai.*` · feature: F8
- [x] **T22** assert-content-no-secrets + CI/pack hook · feature: F9
- [x] **T23** README security section update · feature: F6


---
archived_at: 2026-07-18T09:46:01+08:00
from: 02-plan.md
reason: requirement change — optional API key + free translate
---

---
version: 4
artifact: 02-plan.md
complexity: M
last_updated: 2026-07-18T09:34:00+08:00
history_ref: 02-plan-history.md
---

# Plan 鈥?Encrypt + provider UX

## G9 鈥?UX (F11 F12)
- [ ] **T24** Single datalist combobox for chat/stt/tts 路 F12
- [ ] **T25** Hide unsupported STT/TTS fields; limitations note only 路 F11

## G10 鈥?Encrypt (F10)
- [ ] **T26** `lib/crypto-key.ts` PBKDF2+AES-GCM + UNIT 路 F10
- [ ] **T27** settings schema + unlock/lock in background 路 F10
- [ ] **T28** options UI: 瀹夊叏鍔犲浐 toggle + passphrase + unlock 路 F10
- [ ] **T29** README security section update 路 F10



---
archived_at: 2026-07-18T10:03:02+08:00
from: 02-plan.md
reason: selection-bubble UX
---

---
version: 5
artifact: 02-plan.md
complexity: M
last_updated: 2026-07-18T09:49:30+08:00
history_ref: 02-plan-history.md
---

# Plan 鈥?Optional API Key + free translate

## G11 鈥?Optional Key (F13 F16)
- [x] **T30** `canEnable` / `applyToggle` / options save without Key 路 F13
- [x] **T31** Popup/options copy: Key optional + capability badge 路 F16
- [x] **T32** README feature matrix 路 F16

## G12 鈥?Free translate (F14)
- [x] **T33** `lib/free-translate.ts` Translator + LibreTranslate fallback + UNIT 路 F14
- [x] **T34** Background `resolveTranslate` prefer AI else free 路 F14

## G13 鈥?Free speech (F15)
- [x] **T35** Content free STT 鈫?free translate 鈫?caption/speechSynthesis 路 F15
- [x] **T36** UNIT/smoke gates per 05-test-plan 路 F13鈥揊15


---
archived_at: 2026-07-18T11:32:00+08:00
reason: new_requirement_iflytek_integration
from: 02-plan.md
---

---
version: 6
artifact: 02-plan.md
complexity: M
last_updated: 2026-07-18T10:08:00+08:00
history_ref: 02-plan-history.md
---

# Plan 鈥?Selection bubble UX

## G14 鈥?Modes + toast (F17 F20)
- [x] **T40** `pageMode` in storage + publicPrefs + popup 路 F17
- [x] **T41** `lib/toast-ui.ts` light toast auto/脳 路 F20

## G15 鈥?Bubble + vocab (F18 F19)
- [x] **T42** selection bubble UI + translate selection / whole page 路 F18
- [x] **T43** explain terms (AI + free fallback) 路 F19
- [x] **T44** content wires pageMode; auto path only when auto 路 F17
- [x] **T45** UNIT + build/assert 路 F17鈥揊20


---
archived_at: 2026-07-18T14:17:00+08:00
reason: new_requirement_security_harden
from: 02-plan.md
---

---
version: 7
artifact: 02-plan.md
complexity: M
last_updated: 2026-07-18T11:40:00+08:00
history_ref: 02-plan-history.md
---

# Plan — iFlytek STT + MT + TTS

## Assumptions (autopilot defaults)
- Scope: full「讯飞」provider preset; SI uses STT+MT(+TTS if voice); bubble translate may use MT when iflytek selected.
- Secrets: APPID/APIKey/APISecret in `storage.local`, background-only; no proxy server.
- STT: ≤60s chunks with reconnect for longer video.
- Explain/chat: unchanged free/OpenAI paths (no Spark chat in this slice).
- MT endpoint: `https://itrans.xfyun.cn/v2/its` (自研); STT mul_cn WSS; TTS 超拟人 WSS per console docs.

## G16 — Credentials + preset (F21)
- [x] **T46** Extend storage/settings for iflytek triple + providerId · F21
- [x] **T47** Options/popup UI preset「讯飞」+ host_permissions · F21
- [x] **T48** UNIT credential helpers · F21

## G17 — Protocol clients (F22)
- [x] **T49** `lib/iflytek/auth.ts` HMAC · F22
- [x] **T50** STT client (WS + chunk) · F22
- [x] **T51** MT client (ITS HTTP) · F22
- [x] **T52** TTS client (超拟人 WS) · F22
- [x] **T53** UNIT auth + encode mocks · F22

## G18 — Routing + pack (F23)
- [x] **T54** Wire ai-handler/background provider branch · F23
- [x] **T55** Speech pipeline PCM path for iflytek · F23
- [x] **T56** UNIT route + build/assert/pack · F23



---
archived_from: 02-plan.md
archived_at: 2026-07-18T06:27:18.446Z
version: 8
reason: superseded by security re-audit #3
---

---
version: 8
artifact: 02-plan.md
complexity: M
last_updated: 2026-07-18T14:22:00+08:00
history_ref: 02-plan-history.md
---

# Plan — Security harden

## Assumptions
- Scope: High #1–2 + Medium messaging/security.* + complete vault clear. No Shadow DOM / no iFlytek auth URL redesign.
- Auto-unlock after browser restart removed when hardening on (user re-enters passphrase or unlocks in options once per session).
- Content isolation unchanged (`publicPrefs` only).
- Pack bump after green tests.

## G31 — Vault (F31)
- [x] **T60** Stop persisting `rememberedPassphrase`; migrate-delete on save/unlock · F31
- [x] **T61** Encrypt `iflytekApiSecret` with vault; clear from `aiConfig` when hardened · F31
- [x] **T62** `clearEncryptedVault` + options hydrate: never show secrets · F31
- [x] **T63** UNIT TC-S-U01..U03 · F31

## G32 — Messaging (F32)
- [x] **T64** Payload validators (texts/audio size) in `messages.ts` · F32
- [x] **T65** background: validate AI msgs; rate-limit + sender gate for `security.*` · F32
- [x] **T66** UNIT/INT TC-S-U04, TC-S-I01..I02 + REG/SMK · F32
- [x] **T67** version bump + pack · F32


---
archived_at: 2026-07-21T17:29:05+08:00
from: 02-plan.md
---

---
version: 9
artifact: 02-plan.md
complexity: M
last_updated: 2026-07-18T14:31:00+08:00
history_ref: 02-plan-history.md
---

# Plan �?Security re-audit #3

## Assumptions
- Scope: High (SW-only unlock) + Medium fail-closed / sender.id / sanitize. No host_permissions redesign, no iFlytek query-auth rewrite, no Shadow DOM.
- Prior F31/F32 vault+validators remain; this slice fixes residual wrong-world unlock.
- Pack bump after green tests (0.4.19).

## G33 �?SW session (F33)
- [x] **T68** `lib/security-client.ts` + options unlock/status/lock via `security.*` only · F33
- [x] **T69** After harden save, options calls `security.unlock` so SW key-session filled · F33
- [x] **T70** UNIT/INT: status/unlock path does not rely on options-world key-session · F33

## G34 �?Fail-closed + gates (F34)
- [x] **T71** `resolveAiConfigForRequest` reason `locked`/`missing_key`; background skip Libre when locked · F34
- [x] **T72** `isExtensionPageSender` requires `sender.id === runtime.id` · F34
- [x] **T73** `sanitizeErrorMessage` multi-secret + wire iflytek · F34
- [x] **T74** UNIT/INT TC-S3-* + REG/SMK + version pack · F34
