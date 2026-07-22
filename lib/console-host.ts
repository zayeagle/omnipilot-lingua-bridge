/** In-page Shadow host: slim drag strip + popup iframe (gear/× live in popup). */

import { t } from './i18n';
import {
  CONSOLE_DEFAULT_H,
  CONSOLE_DEFAULT_W,
  CONSOLE_EDGE,
  CONSOLE_HOST_ID,
  clampPanelPos,
  defaultConsolePanelPos,
  type ConsolePanelPos,
} from './console-panel';

type HostApi = {
  isOpen: () => boolean;
  show: () => void;
  hide: () => void;
  toggle: () => boolean;
};

let api: HostApi | null = null;

function css(el: HTMLElement, styles: Record<string, string>): void {
  Object.assign(el.style, styles);
}

function ensureHost(doc: Document): HostApi {
  if (api) return api;

  let root = doc.getElementById(CONSOLE_HOST_ID);
  if (!root) {
    root = doc.createElement('div');
    root.id = CONSOLE_HOST_ID;
    doc.documentElement.appendChild(root);
  }

  const shadow = root.shadowRoot ?? root.attachShadow({ mode: 'open' });
  shadow.innerHTML = '';

  const wrap = doc.createElement('div');
  wrap.setAttribute('part', 'console');
  css(wrap, {
    position: 'fixed',
    zIndex: '2147483646',
    width: `${CONSOLE_DEFAULT_W}px`,
    maxWidth: 'min(360px, 96vw)',
    height: `${CONSOLE_DEFAULT_H}px`,
    maxHeight: 'min(85vh, 640px)',
    display: 'none',
    flexDirection: 'column',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow:
      '0 18px 48px rgba(2, 132, 199, 0.28), 0 4px 14px rgba(15, 23, 42, 0.12)',
    border: '1px solid rgba(14, 165, 233, 0.28)',
    background: '#eef6fc',
  });

  // Slim drag grip only — title / gear / × stay inside popup.html.
  const dragGrip = doc.createElement('div');
  dragGrip.title = t('dragHint');
  css(dragGrip, {
    flex: '0 0 10px',
    cursor: 'grab',
    userSelect: 'none',
    background: 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)',
  });

  const frame = doc.createElement('iframe');
  frame.src = browser.runtime.getURL('popup.html');
  frame.title = 'Lingua Bridge';
  css(frame, {
    flex: '1',
    width: '100%',
    border: 'none',
    background: 'transparent',
    minHeight: '0',
  });

  wrap.append(dragGrip, frame);
  shadow.append(wrap);

  let open = false;
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let origX = 0;
  let origY = 0;

  const applyPos = (pos: ConsolePanelPos) => {
    const clamped = clampPanelPos(
      pos,
      wrap.offsetWidth || CONSOLE_DEFAULT_W,
      wrap.offsetHeight || CONSOLE_DEFAULT_H,
      window.innerWidth,
      window.innerHeight,
      CONSOLE_EDGE,
    );
    wrap.style.left = `${clamped.x}px`;
    wrap.style.top = `${clamped.y}px`;
    wrap.style.right = 'auto';
    wrap.style.bottom = 'auto';
    return clamped;
  };

  const placeDefault = () => {
    const w = wrap.offsetWidth || CONSOLE_DEFAULT_W;
    const h = wrap.offsetHeight || CONSOLE_DEFAULT_H;
    applyPos(
      defaultConsolePanelPos(window.innerWidth, window.innerHeight, w, h),
    );
  };

  const show = () => {
    open = true;
    wrap.style.display = 'flex';
    // Every open → 靠右中上；本次会话内可拖动，下次打开仍回默认。
    requestAnimationFrame(placeDefault);
  };

  const hide = () => {
    open = false;
    wrap.style.display = 'none';
  };

  const startDragAt = (screenX: number, screenY: number) => {
    dragging = true;
    dragGrip.style.cursor = 'grabbing';
    startX = screenX;
    startY = screenY;
    const rect = wrap.getBoundingClientRect();
    origX = rect.left;
    origY = rect.top;
  };

  const moveDragTo = (screenX: number, screenY: number) => {
    if (!dragging) return;
    applyPos({
      x: origX + (screenX - startX),
      y: origY + (screenY - startY),
    });
  };

  const finishDrag = () => {
    if (!dragging) return;
    dragging = false;
    dragGrip.style.cursor = 'grab';
    const rect = wrap.getBoundingClientRect();
    applyPos({ x: rect.left, y: rect.top });
  };

  dragGrip.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    startDragAt(e.screenX, e.screenY);
    dragGrip.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  dragGrip.addEventListener('pointermove', (e) =>
    moveDragTo(e.screenX, e.screenY),
  );
  dragGrip.addEventListener('pointerup', (e) => {
    try {
      dragGrip.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    finishDrag();
  });
  dragGrip.addEventListener('pointercancel', finishDrag);

  window.addEventListener(
    'message',
    (ev) => {
      if (ev.source !== frame.contentWindow) return;
      const data = ev.data;
      if (!data || typeof data !== 'object') return;
      const type = (data as { type?: unknown }).type;
      if (type === 'lb.console.close') {
        hide();
        return;
      }
      if (type === 'lb.console.dragStart') {
        const x = (data as { x?: unknown }).x;
        const y = (data as { y?: unknown }).y;
        if (typeof x === 'number' && typeof y === 'number') startDragAt(x, y);
        return;
      }
      if (type === 'lb.console.dragMove') {
        const x = (data as { x?: unknown }).x;
        const y = (data as { y?: unknown }).y;
        if (typeof x === 'number' && typeof y === 'number') moveDragTo(x, y);
        return;
      }
      if (type === 'lb.console.dragEnd') finishDrag();
    },
    false,
  );

  window.addEventListener('resize', () => {
    if (!open || dragging) return;
    placeDefault();
  });

  api = {
    isOpen: () => open,
    show,
    hide,
    toggle: () => {
      if (open) hide();
      else show();
      return open;
    },
  };
  return api;
}

/** Top-frame only. Returns whether panel is open after toggle. */
export function toggleConsoleHost(): boolean {
  if (window !== window.top) return false;
  return ensureHost(document).toggle();
}

export function hideConsoleHost(): void {
  if (window !== window.top) return;
  ensureHost(document).hide();
}

export function isConsoleHostOpen(): boolean {
  if (window !== window.top) return false;
  return api?.isOpen() ?? false;
}
