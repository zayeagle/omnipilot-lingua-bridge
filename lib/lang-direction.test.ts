import { describe, expect, it } from 'vitest';
import {
  isSourceDirectionEnabled,
  normalizeLangDirections,
} from './lang-direction';

describe('lang-direction (F1 UNIT)', () => {
  it('TC-D-U01: enToZh only allows English source', () => {
    const prefs = normalizeLangDirections({ enToZh: true, zhToEn: false });
    expect(isSourceDirectionEnabled('en', prefs)).toBe(true);
    expect(isSourceDirectionEnabled('zh', prefs)).toBe(false);
  });

  it('TC-D-U02: zhToEn only allows Chinese source', () => {
    const prefs = normalizeLangDirections({ enToZh: false, zhToEn: true });
    expect(isSourceDirectionEnabled('zh', prefs)).toBe(true);
    expect(isSourceDirectionEnabled('en', prefs)).toBe(false);
  });

  it('TC-D-U03: both false coerces to both true', () => {
    const prefs = normalizeLangDirections({ enToZh: false, zhToEn: false });
    expect(prefs).toEqual({ enToZh: true, zhToEn: true });
  });

  it('unknown source is never enabled', () => {
    const prefs = normalizeLangDirections(null);
    expect(isSourceDirectionEnabled('unknown', prefs)).toBe(false);
  });
});
