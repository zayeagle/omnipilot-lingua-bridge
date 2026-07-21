import type { LangCode } from './lang-detect';

/** Independent ZH↔EN direction switches (selection bubble + SI). */
export type LangDirectionPrefs = {
  /** English → Chinese */
  enToZh: boolean;
  /** Chinese → English */
  zhToEn: boolean;
};

export const DEFAULT_LANG_DIRECTIONS: LangDirectionPrefs = {
  enToZh: true,
  zhToEn: true,
};

/** Normalize; if both off, coerce back to both on. */
export function normalizeLangDirections(
  input?: Partial<LangDirectionPrefs> | null,
): LangDirectionPrefs {
  const enToZh = input?.enToZh !== false;
  const zhToEn = input?.zhToEn !== false;
  if (!enToZh && !zhToEn) {
    return { ...DEFAULT_LANG_DIRECTIONS };
  }
  return { enToZh, zhToEn };
}

/** Whether selection/SI for this source language should run. */
export function isSourceDirectionEnabled(
  source: LangCode,
  prefs: LangDirectionPrefs,
): boolean {
  if (source === 'en') return prefs.enToZh;
  if (source === 'zh') return prefs.zhToEn;
  return false;
}
