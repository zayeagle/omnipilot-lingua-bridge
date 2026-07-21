/** Stage-tagged diagnostics for extension SW / content console. */

export type DiagStage =
  | 'config'
  | 'stt'
  | 'mt'
  | 'tts'
  | 'simult'
  | 'capture'
  | 'playback'
  | 'translate'
  | 'explain'
  | 'pipeline';

const STAGE_LABEL: Record<DiagStage, string> = {
  config: '配置',
  stt: '识别',
  mt: '翻译',
  tts: '合成',
  simult: '同声传译',
  capture: '采音',
  playback: '播放',
  translate: '文本翻译',
  explain: '精讲',
  pipeline: '同传管线',
};

const PREFIX = '[LinguaBridge]';

function safeDetail(detail: unknown): unknown {
  if (detail == null) return undefined;
  if (typeof detail === 'string') {
    return detail.length > 500 ? `${detail.slice(0, 500)}…` : detail;
  }
  if (detail instanceof Error) {
    return { name: detail.name, message: detail.message };
  }
  if (typeof detail === 'object') {
    try {
      return JSON.parse(JSON.stringify(detail));
    } catch {
      return String(detail);
    }
  }
  return detail;
}

function emit(
  level: 'info' | 'warn' | 'error',
  stage: DiagStage,
  message: string,
  detail?: unknown,
): void {
  const label = STAGE_LABEL[stage];
  const line = `${PREFIX}[${label}] ${message}`;
  const payload = safeDetail(detail);
  const fn =
    level === 'error'
      ? console.error
      : level === 'warn'
        ? console.warn
        : console.info;
  // Single-arg log only — Chrome "Errors" panel concatenates extra args as
  // `[object Object]`, which polluted toast/copy text.
  if (payload === undefined) {
    fn(line);
    return;
  }
  let extra: string;
  try {
    extra = typeof payload === 'string' ? payload : JSON.stringify(payload);
  } catch {
    extra = String(payload);
  }
  fn(extra ? `${line} ${extra}` : line);
}

export function diagInfo(
  stage: DiagStage,
  message: string,
  detail?: unknown,
): void {
  emit('info', stage, message, detail);
}

export function diagWarn(
  stage: DiagStage,
  message: string,
  detail?: unknown,
): void {
  emit('warn', stage, message, detail);
}

export function diagError(
  stage: DiagStage,
  message: string,
  detail?: unknown,
): void {
  emit('error', stage, message, detail);
}

export function stageLabel(stage: DiagStage): string {
  return STAGE_LABEL[stage];
}

/** Error carrying which pipeline stage failed (surfaced in toasts). */
export class StageError extends Error {
  readonly stage: DiagStage;
  readonly reason: string;

  constructor(stage: DiagStage, reason: string, cause?: unknown) {
    const clean = reason.trim() || '未知错误';
    super(`[${STAGE_LABEL[stage]}] ${clean}`);
    this.name = 'StageError';
    this.stage = stage;
    this.reason = clean;
    if (cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = cause;
    }
  }
}

export function isStageError(err: unknown): err is StageError {
  return err instanceof StageError;
}

function errorReason(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message.trim() || fallback;
  if (typeof err === 'string') return err.trim() || fallback;
  if (err && typeof err === 'object') {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === 'string' && msg.trim()) return msg.trim();
    try {
      const json = JSON.stringify(err);
      if (json && json !== '{}') return json.slice(0, 160);
    } catch {
      /* ignore */
    }
  }
  return fallback;
}

export function wrapStageError(
  stage: DiagStage,
  err: unknown,
  fallback = '失败',
): StageError {
  if (isStageError(err)) return err;
  const reason = errorReason(err, fallback);
  const wrapped = new StageError(stage, reason || fallback, err);
  // Pass a plain detail object so consoles never append bare `[object Object]`.
  diagError(stage, `失败：${wrapped.reason}`, {
    name: err instanceof Error ? err.name : typeof err,
    message: reason,
  });
  return wrapped;
}

/** Prefer StageError message; otherwise keep raw. */
export function formatDiagError(err: unknown): string {
  if (isStageError(err)) return err.message;
  if (err instanceof Error) return err.message;
  return String(err || '未知错误');
}
