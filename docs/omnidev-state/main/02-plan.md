---
requirement_id: direction-settings-iframe
complexity: M
groups: [G1, G2, G3]
---

# Plan — direction · popup settings · iframe bubble

## Group G1 — Direction prefs `[frontend]`
| ID | Task | feature_ref | outputs |
|----|------|-------------|---------|
| T1 | Add `enToZh`/`zhToEn` to storage + publicPrefs + sync | F1 | `lib/storage.ts`, `lib/public-prefs.ts`, `lib/settings-store.ts` |
| T2 | Pure helpers + UNIT | F1 | `lib/lang-direction.ts` (+test) |
| T3 | Wire bubble + SI filters; popup checkboxes + i18n | F1 | `content.ts`, `popup/*`, locales |

## Group G2 — In-popup settings `[frontend]`
| ID | Task | feature_ref | outputs |
|----|------|-------------|---------|
| T4 | Popup settings panel + iframe; remove openOptionsPage default | F2 | `popup/index.html`, `main.ts`, `style.css` |

## Group G3 — Iframe bubble `[frontend]`
| ID | Task | feature_ref | outputs |
|----|------|-------------|---------|
| T5 | `allFrames: true` + smoke note | F3 | `entrypoints/content.ts` |

## Order
G1 → G2 → G3 → UNIT → security audit → Phase 4
