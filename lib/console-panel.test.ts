import { describe, expect, it } from 'vitest';
import {
  clampPanelPos,
  defaultConsolePanelPos,
  isConsoleInjectableUrl,
  normalizeConsolePos,
  parseConsolePos,
  resolveConsolePanelPos,
} from './console-panel';

describe('isConsoleInjectableUrl', () => {
  it('TC-F1-U01 allows normal https pages', () => {
    expect(isConsoleInjectableUrl('https://example.com/watch')).toBe(true);
  });

  it('allows missing url (try inject anyway)', () => {
    expect(isConsoleInjectableUrl(undefined)).toBe(true);
  });

  it('TC-F1-U02 blocks chrome://', () => {
    expect(isConsoleInjectableUrl('chrome://extensions')).toBe(false);
  });

  it('TC-F1-U03 blocks Chrome Web Store', () => {
    expect(
      isConsoleInjectableUrl(
        'https://chrome.google.com/webstore/detail/foo',
      ),
    ).toBe(false);
  });
});

describe('clampPanelPos / default position', () => {
  it('TC-F2-U01 keeps in-viewport coords', () => {
    expect(clampPanelPos({ x: 40, y: 50 }, 360, 400, 1200, 800)).toEqual({
      x: 40,
      y: 50,
    });
  });

  it('TC-F2-U02 clamps negative coords', () => {
    const p = clampPanelPos({ x: -999, y: -50 }, 360, 400, 1200, 800);
    expect(p.x).toBeGreaterThanOrEqual(8);
    expect(p.y).toBeGreaterThanOrEqual(8);
  });

  it('defaults to upper-right (靠中右上)', () => {
    const p = defaultConsolePanelPos(1400, 900, 360, 520);
    expect(p.x).toBe(1400 - 360 - 24);
    expect(p.y).toBe(56);
  });

  it('resolve uses default when storage empty', () => {
    const p = resolveConsolePanelPos(null, 1400, 900, 360, 520);
    expect(p).toEqual(defaultConsolePanelPos(1400, 900, 360, 520));
  });

  it('parse / normalize storage payloads', () => {
    expect(parseConsolePos(null)).toBeNull();
    expect(normalizeConsolePos(null)).toEqual({ x: 24, y: 24 });
    expect(normalizeConsolePos({ x: 10, y: 20 })).toEqual({ x: 10, y: 20 });
  });
});
