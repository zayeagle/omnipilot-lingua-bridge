/** Pure helpers for the in-page floating console panel. */

export type ConsolePanelPos = { x: number; y: number };

export const CONSOLE_HOST_ID = 'lingua-bridge-console-host';
export const CONSOLE_EDGE = 8;
export const CONSOLE_DEFAULT_W = 360;
export const CONSOLE_DEFAULT_H = 520;
/** Top inset so the panel sits under typical page chrome / toolbar. */
export const CONSOLE_DEFAULT_TOP = 56;
/** Right inset from the viewport edge. */
export const CONSOLE_DEFAULT_RIGHT = 24;

/** True only when URL is known to forbid content scripts. Missing URL → try anyway. */
export function isConsoleInjectableUrl(url: string | undefined): boolean {
  if (!url) return true;
  if (
    /^(chrome|chrome-extension|edge|about|devtools|view-source|moz-extension):/i.test(
      url,
    )
  ) {
    return false;
  }
  if (/^https?:\/\/chrome\.google\.com\/webstore/i.test(url)) return false;
  if (/^https?:\/\/addons\.mozilla\.org\//i.test(url)) return false;
  return true;
}

/** Parse stored pos; null means “use viewport default”. */
export function parseConsolePos(raw: unknown): ConsolePanelPos | null {
  if (!raw || typeof raw !== 'object') return null;
  const x = (raw as { x?: unknown }).x;
  const y = (raw as { y?: unknown }).y;
  if (
    typeof x !== 'number' ||
    typeof y !== 'number' ||
    !Number.isFinite(x) ||
    !Number.isFinite(y)
  ) {
    return null;
  }
  return { x, y };
}

/** Default: upper-right (靠中右上), right-aligned with a top inset. */
export function defaultConsolePanelPos(
  viewportW: number,
  viewportH: number,
  panelW = CONSOLE_DEFAULT_W,
  panelH = CONSOLE_DEFAULT_H,
): ConsolePanelPos {
  const x = viewportW - panelW - CONSOLE_DEFAULT_RIGHT;
  const y = CONSOLE_DEFAULT_TOP;
  return clampPanelPos({ x, y }, panelW, panelH, viewportW, viewportH);
}

export function resolveConsolePanelPos(
  raw: unknown,
  viewportW: number,
  viewportH: number,
  panelW = CONSOLE_DEFAULT_W,
  panelH = CONSOLE_DEFAULT_H,
): ConsolePanelPos {
  const stored = parseConsolePos(raw);
  // Migrate legacy top-left default (24,24) → upper-right.
  if (!stored || (stored.x === 24 && stored.y === 24)) {
    return defaultConsolePanelPos(viewportW, viewportH, panelW, panelH);
  }
  return clampPanelPos(stored, panelW, panelH, viewportW, viewportH);
}

/** @deprecated use parseConsolePos / resolveConsolePanelPos */
export function normalizeConsolePos(
  raw: unknown,
  fallback: ConsolePanelPos = { x: 24, y: 24 },
): ConsolePanelPos {
  return parseConsolePos(raw) ?? { ...fallback };
}

/** Clamp panel top-left so it stays fully inside the viewport. */
export function clampPanelPos(
  pos: ConsolePanelPos,
  panelW: number,
  panelH: number,
  viewportW: number,
  viewportH: number,
  edge = CONSOLE_EDGE,
): ConsolePanelPos {
  const w = Math.max(1, panelW);
  const h = Math.max(1, panelH);
  const maxX = Math.max(edge, viewportW - w - edge);
  const maxY = Math.max(edge, viewportH - h - edge);
  return {
    x: Math.min(Math.max(edge, pos.x), maxX),
    y: Math.min(Math.max(edge, pos.y), maxY),
  };
}
