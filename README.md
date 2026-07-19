# Lingua Bridge

**English** | [中文](./README.zh-CN.md)

<p align="center">
  <img src="./public/icon-128.png" width="96" height="96" alt="Lingua Bridge"/>
</p>

**Lingua Bridge** is a Chrome / Firefox browser extension for **Chinese ↔ English only**.  
It turns everyday browsing and video watching into a seamless bilingual experience: select text for an instant bubble, translate a full page when you need it, or run **video simultaneous interpretation** with draggable captions and optional voice playback.

No copy-paste into external tools. No other language pairs — the product is intentionally focused on ZH↔EN so recognition, translation, and TTS stay reliable.

| | |
|---|---|
| **Platforms** | Chrome, Edge, Firefox (MV3 / Firefox pack) |
| **Core** | Selection bubble · full-page translate · video SI |
| **SI styles** | Silent captions · Voice interpretation |
| **Providers** | OpenAI-compatible, DeepSeek, iFlytek, OpenRouter, Anthropic, Custom |
| **Key** | Optional — free path works; keys unlock stronger AI / video-track SI |
| **UI language** | Follows browser/OS locale (`en` / `zh_CN` / `zh_TW`) |
| **Version** | **v0.4.29** |

---

## What it does

### 1. Selection bubble (default)

Turn on the master switch, select Chinese or English on any normal webpage, and a bubble appears beside the selection: **Translate**, **Full page**, plus short term notes when available.

<p align="center">
  <img src="./docs/images/selection-bubble.png" width="640" alt="Selection bubble translating English to Chinese"/>
</p>

### 2. Popup control center

The toolbar popup is the control surface: master switch, **live status** (provider, SI style, whether SI is on for this page, video detection), and SI output mode.

<p align="center">
  <img src="./docs/images/popup.png" width="360" alt="Lingua Bridge popup with live status and SI controls"/>
</p>

### 3. Video simultaneous interpretation

On a page with a playable video, start SI after choosing a style:

- **Silent captions** — bilingual overlay (draggable, history, fold/close)
- **Voice interpretation** — speak the translation while still showing captions

Closing the caption panel stops SI and keeps the popup button / live status in sync.

<p align="center">
  <img src="./docs/images/si-caption.png" width="720" alt="Video SI floating bilingual captions"/>
</p>

### 4. Settings & local security

Pick a provider, optionally enter credentials, and enable a **session vault** (PBKDF2 + AES-GCM) so secrets stay encrypted on device. Keys never leave your machine for a Lingua Bridge server — there is no project backend.

<p align="center">
  <img src="./docs/images/options.png" width="640" alt="Settings: providers, credentials, security hardening"/>
</p>

---

## Feature matrix

| Capability | Without API Key | With API Key |
|------------|-----------------|--------------|
| Selection translate / explain | Free engine + brief notes | AI translation + term notes |
| Full-page translate | Optional | Optional |
| Video SI | Mic Web Speech (fallback) | Video-track STT + TTS |
| Encrypted vault for secrets | — | Optional |

---

## One-command pack (Windows / Linux / macOS)

Produces installable Chrome + Firefox zips:

```bash
npm run pack:all          # recommended
# Windows:
pack.cmd
# Linux / macOS:
chmod +x pack.sh && ./pack.sh
# or:
make pack
```

Skip tests for a faster pack: `npm run pack:all -- --skip-test` or `./pack.sh --skip-test`

Regenerate README screenshots (optional):

```bash
node scripts/capture-readme-shots.mjs
```

## Install in the browser

Artifacts are **standard extension packages** loaded from the browser’s Extensions page (developer / temporary mode). This is not the same as a permanent Chrome Web Store install (see limitations below).

```bash
npm install             # first time
npm run pack:all
```

Output: `.output/` (`chrome-mv3/`, `firefox-mv2/`, and `*-chrome.zip` / `*-firefox.zip`).

### Chrome / Edge (recommended)

1. Pack with `npm run pack:all` or `pack.cmd`
2. Open `chrome://extensions` (Edge: `edge://extensions`)
3. Enable **Developer mode**
4. Install either:
   - **Recommended**: **Load unpacked** → select `.output/chrome-mv3`
   - Or drag `.output/omnipilot-lingua-bridge-*-chrome.zip` onto the extensions page (environment-dependent)

### Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. **Load Temporary Add-on**
3. Pick `manifest.json` under `.output/firefox-mv2`, or the matching `*-firefox.zip`

Temporary add-ons may unload after restart; long-term install usually requires [Firefox AMO](https://addons.mozilla.org/) signing.

### Limitations

| Expectation | Reality |
|-------------|---------|
| One-click “Add to Chrome” without developer mode | Not available until listed on the Web Store |
| Unsigned permanent install on Chrome | Restricted; use Developer mode + Load unpacked |
| Firefox temporary load survives restart | Usually not; AMO signing for permanent install |

## Usage

1. Open the popup and turn on the **master switch** (default: selection bubble; no full-page auto-translate)
2. **Select text** → bubble: **Translate** (with term notes) / **Full page**
3. For video SI: choose **Silent captions** or **Voice interpretation**, then **Start SI** on a video page
4. (Optional) Configure an API Key in settings for stronger explain + video-track SI

Switching SI style while SI is running turns voice playback on/off immediately. Closing the caption float stops SI and updates the popup.

## API Key security

This extension has **no project backend**. Keys stay in your browser’s extension storage (`storage.local`) and are never uploaded to a Lingua Bridge server.

| Control | Detail |
|---------|--------|
| Isolation | Only the **background** service worker reads keys and attaches `Authorization`; page content scripts never load keys |
| Public prefs | `local:publicPrefs`: `enabled` / `speechMode` / `hasApiKey` (never the raw key) |
| Optional vault | Options → security hardening: PBKDF2 + AES-GCM; **session unlock** with a passphrase (not persisted for auto-unlock) |
| Base URL | **HTTPS only**; non-`api.openai.com` endpoints require an explicit trust checkbox |
| Options UI | Does not refill full secrets; STT/TTS fields only when supported |
| Popup | Reads public prefs only |
| Abuse limits | Background rate-limits `ai.*` per tab |
| Error scrubbing | Responses strip secret substrings |
| Build assert | `npm run assert:content` ensures the content bundle has no `apiKey` / `local:settings` |

**Residual risks (cannot be fully removed by an extension):**

- Keys are sent to the Base URL you configured (phishing endpoints can still steal them — use trusted services only)
- Local malware / tools that read the browser profile may still access `storage.local`
- Do not share screenshots, export packs, or debug logs that contain secrets

## Development

```bash
npm run dev           # Chrome
npm run dev:firefox
npm test
make deploy           # test + dual-browser build
```

## Version

**v0.4.29** — ZH↔EN SI, caption/voice style sync, popup live status when closing the caption panel, UI i18n.
