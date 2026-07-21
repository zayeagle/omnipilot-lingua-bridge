import type { AiConfig } from './storage';
import {
  EXPLAIN_SYSTEM_PROMPT,
  parseExplainPayload,
  type ExplainResult,
} from './vocab-explain';

const TIMEOUT_MS = 45_000;

export class AiClientError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'AiClientError';
  }
}

/** Never include secrets in thrown/returned messages. */
export function sanitizeErrorMessage(
  raw: string,
  ...secrets: Array<string | undefined | null>
): string {
  let msg = raw;
  for (const secret of secrets) {
    const token = (secret ?? '').trim();
    if (token && msg.includes(token)) {
      msg = msg.split(token).join('[REDACTED]');
    }
  }
  return msg;
}

export function mapHttpError(status: number, bodyText: string): AiClientError {
  if (status === 401 || status === 403) {
    return new AiClientError('检查 API Key 是否有效', status);
  }
  if (status === 429) {
    return new AiClientError('请求过于频繁，请稍后重试', status);
  }
  if (status >= 500) {
    return new AiClientError('AI 服务暂时不可用', status);
  }
  const snippet = bodyText.slice(0, 120).replace(/\s+/g, ' ');
  return new AiClientError(snippet || `请求失败 (${status})`, status);
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function withRetry<T>(fn: () => Promise<T>, retries = 1): Promise<T> {
  let last: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      const retryable =
        e instanceof AiClientError
          ? (e.status !== undefined && e.status >= 500) || e.status === undefined
          : true;
      if (i === retries || !retryable) throw e;
    }
  }
  throw last;
}

function authHeaders(config: AiConfig): HeadersInit {
  return {
    Authorization: `Bearer ${config.apiKey}`,
    'Content-Type': 'application/json',
  };
}

type ChatMessage = {
  content?: unknown;
  text?: unknown;
  reasoning_content?: unknown;
};

type ChatCompletionBody = {
  choices?: Array<{
    message?: ChatMessage;
    delta?: ChatMessage;
    text?: unknown;
  }>;
  message?: ChatMessage;
  content?: unknown;
  text?: unknown;
  data?: ChatCompletionBody;
};

function tryParseJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

/** Coerce + unwrap nested/custom chat.completion payloads. */
function asCompletionBody(value: unknown, depth = 0): ChatCompletionBody | null {
  if (value == null || depth > 4) return null;
  if (typeof value === 'string') {
    const inner = tryParseJson(value.trim());
    return inner != null ? asCompletionBody(inner, depth + 1) : null;
  }
  if (typeof value !== 'object') return null;
  if (Array.isArray(value)) {
    return value.length ? asCompletionBody(value[0], depth + 1) : null;
  }
  const obj = value as Record<string, unknown>;

  // Nested wrappers used by many CN gateways.
  for (const key of ['data', 'result', 'output', 'response', 'body']) {
    if (key in obj && obj[key] != null) {
      const nested = asCompletionBody(obj[key], depth + 1);
      if (
        nested &&
        (nested.choices || nested.message || nested.content || nested.text)
      ) {
        return nested;
      }
    }
  }

  return obj as ChatCompletionBody;
}

/** Strip BOM / fences; parse JSON object or OpenAI-compat SSE (`data: {...}`). */
export function parseChatCompletionBody(bodyText: unknown): ChatCompletionBody {
  // Guard: never call .replace on a non-string (would throw oddly).
  let raw =
    typeof bodyText === 'string'
      ? bodyText
      : bodyText == null
        ? ''
        : (() => {
            try {
              return JSON.stringify(bodyText);
            } catch {
              return String(bodyText);
            }
          })();
  raw = raw.replace(/^\uFEFF/, '').trim();
  if (!raw) {
    throw new AiClientError('AI 返回为空');
  }

  const direct = asCompletionBody(tryParseJson(raw));
  if (direct) return direct;

  // Custom gateways often stream even when client omitted stream:false.
  if (raw.includes('data:')) {
    const chunks: ChatCompletionBody[] = [];
    // Split on newlines OR bare `data:` (some proxies omit newlines).
    const parts = raw.includes('\n')
      ? raw.split(/\r?\n/)
      : raw.split(/(?=data:)/);
    for (const line of parts) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      const obj = asCompletionBody(tryParseJson(payload));
      if (obj) chunks.push(obj);
    }
    if (chunks.length) {
      return mergeSseChunks(chunks);
    }
  }

  // NDJSON: one JSON object per line (no data: prefix).
  if (raw.includes('\n') && raw.includes('{')) {
    const chunks: ChatCompletionBody[] = [];
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('{')) continue;
      const obj = asCompletionBody(tryParseJson(trimmed));
      if (obj?.choices || obj?.message) chunks.push(obj);
    }
    if (chunks.length) return mergeSseChunks(chunks);
  }

  const objectMatch = raw.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    const embedded = asCompletionBody(tryParseJson(objectMatch[0]));
    if (embedded) return embedded;
  }

  // Array wrapper: [{choices:...}] or ["..."]
  const arrayMatch = raw.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    const arr = tryParseJson(arrayMatch[0]);
    if (Array.isArray(arr) && arr.length) {
      const first = asCompletionBody(arr[0]);
      if (first) return first;
    }
  }

  throw new AiClientError(unparseableHint(raw));
}

function mergeSseChunks(chunks: ChatCompletionBody[]): ChatCompletionBody {
  let content = '';
  let reasoning = '';
  let text = '';
  for (const chunk of chunks) {
    const msg = chunk.choices?.[0]?.delta ?? chunk.choices?.[0]?.message;
    content += extractTextField(msg?.content);
    reasoning += extractTextField(msg?.reasoning_content);
    text += extractTextField(msg?.text ?? chunk.choices?.[0]?.text);
  }
  if (content || reasoning || text) {
    return {
      choices: [
        {
          message: {
            content: content || undefined,
            reasoning_content: reasoning || undefined,
            text: text || undefined,
          },
        },
      ],
    };
  }
  return chunks[chunks.length - 1]!;
}

function extractTextField(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object') {
          const p = part as { text?: unknown; content?: unknown };
          if (typeof p.text === 'string') return p.text;
          if (typeof p.content === 'string') return p.content;
          // Some gateways put structured JSON in a content-part object.
          if ('translation' in p || 'terms' in p) {
            try {
              return JSON.stringify(p);
            } catch {
              return '';
            }
          }
        }
        return '';
      })
      .join('');
  }
  // Custom models sometimes return message.content as a JSON object, not a string.
  if (value && typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '';
    }
  }
  return '';
}

/** Prefer message.content; fall back to content parts / text / reasoning_content. */
export function extractAssistantText(parsed: ChatCompletionBody): string {
  const choice = parsed.choices?.[0];
  const msg = choice?.message ?? choice?.delta ?? parsed.message;
  const candidates = [
    extractTextField(msg?.content),
    extractTextField(msg?.text),
    extractTextField(choice?.text),
    extractTextField(parsed.content),
    extractTextField(parsed.text),
    extractTextField(msg?.reasoning_content),
  ];
  for (const c of candidates) {
    const t = c.trim();
    if (t) return t;
  }
  return '';
}

function stripMarkdownFences(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced?.[1] ?? text).trim();
}

/** Resolve explain JSON text from chat body or raw HTTP body (custom gateways). */
export function resolveExplainContent(
  bodyText: string,
  parsed: ChatCompletionBody,
): string {
  const fromAssistant = stripMarkdownFences(extractAssistantText(parsed));
  if (fromAssistant && parseExplainPayload(fromAssistant)) {
    return fromAssistant;
  }
  if (fromAssistant) {
    // Still return — caller may re-parse / report better errors.
    const maybe = stripMarkdownFences(fromAssistant);
    if (maybe) return maybe;
  }

  const raw = stripMarkdownFences(bodyText.replace(/^\uFEFF/, '').trim());
  if (raw && parseExplainPayload(raw)) return raw;

  const root = parsed as ChatCompletionBody & Record<string, unknown>;
  for (const key of ['result', 'output', 'response', 'data']) {
    const v = root[key];
    if (typeof v === 'string') {
      const s = stripMarkdownFences(v);
      if (s && parseExplainPayload(s)) return s;
    } else if (v && typeof v === 'object') {
      try {
        const s = JSON.stringify(v);
        if (parseExplainPayload(s)) return s;
      } catch {
        /* ignore */
      }
    }
  }
  return fromAssistant;
}

function unparseableHint(bodyText: string): string {
  const snip = bodyText
    .replace(/sk-[a-zA-Z0-9_-]+/g, '[REDACTED]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 72);
  if (!snip) return 'AI 返回无法解析';
  if (/^</.test(snip) || /<html/i.test(snip)) {
    return 'AI 返回无法解析（像是网页/HTML，请检查 Base URL）';
  }
  if (snip === '[object Object]') {
    return 'AI 返回无法解析（响应被错误转成对象字符串，请检查网关）';
  }
  return `AI 返回无法解析（开头: ${snip}）`;
}

/** Pull N translation strings from model content (array / object / plain text). */
export function extractTranslationLines(
  content: string,
  expected: number,
): string[] | null {
  const text = stripMarkdownFences(content);
  if (!text || expected <= 0) return null;

  const tryArray = (value: unknown): string[] | null => {
    if (!Array.isArray(value) || value.length !== expected) return null;
    return value.map((v) => String(v ?? ''));
  };

  const bracket = text.match(/\[[\s\S]*\]/);
  if (bracket) {
    const parsed = tryParseJson(bracket[0]);
    const lines = tryArray(parsed);
    if (lines) return lines;
  }

  const obj = tryParseJson(text);
  if (obj && typeof obj === 'object') {
    const rec = obj as Record<string, unknown>;
    for (const key of ['translations', 'lines', 'result', 'data', 'output']) {
      const lines = tryArray(rec[key]);
      if (lines) return lines;
    }
    if (expected === 1 && typeof rec.translation === 'string') {
      return [rec.translation];
    }
  }

  // Single-line plain text (custom models often ignore JSON-array instruction).
  if (expected === 1 && !text.startsWith('{') && !text.startsWith('[')) {
    const plain = text.replace(/^["']|["']$/g, '').trim();
    if (plain) return [plain];
  }
  return null;
}

export async function translateTexts(
  config: AiConfig,
  texts: string[],
  opts: { sourceLang?: string; targetLang?: string } = {},
): Promise<string[]> {
  const cleaned = texts.map((t) => t.trim());
  if (cleaned.every((t) => !t)) {
    return texts.map(() => '');
  }

  const source = opts.sourceLang ?? 'auto';
  const target = opts.targetLang ?? 'zh';
  const nonEmpty = cleaned
    .map((t, i) => ({ t, i }))
    .filter((x) => x.t.length > 0);

  const payload = {
    model: config.chatModel,
    temperature: 0.2,
    stream: false,
    messages: [
      {
        role: 'system',
        content:
          'You are a translation engine. Translate each line. Detect Chinese/English automatically when source is auto. Return ONLY a JSON array of strings, same length/order as input. No markdown.',
      },
      {
        role: 'user',
        content: JSON.stringify({
          source,
          target,
          lines: nonEmpty.map((x) => x.t),
        }),
      },
    ],
  };

  const run = async () => {
    let res: Response;
    try {
      res = await fetchWithTimeout(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: authHeaders(config),
        body: JSON.stringify(payload),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new AiClientError(
        sanitizeErrorMessage(msg.includes('abort') ? '网络超时' : `网络错误: ${msg}`, config.apiKey),
      );
    }

    const bodyText = await res.text();
    if (!res.ok) {
      throw mapHttpError(res.status, sanitizeErrorMessage(bodyText, config.apiKey));
    }

    let parsed: ChatCompletionBody;
    try {
      parsed = parseChatCompletionBody(bodyText);
    } catch (e) {
      if (e instanceof AiClientError) throw e;
      throw new AiClientError(unparseableHint(bodyText));
    }

    const content = stripMarkdownFences(extractAssistantText(parsed));
    const lines =
      extractTranslationLines(content, nonEmpty.length) ??
      extractTranslationLines(bodyText, nonEmpty.length);
    if (!lines) {
      throw new AiClientError(
        content ? 'AI 未返回译文数组' : 'AI 未返回译文内容',
      );
    }

    const out = texts.map(() => '');
    nonEmpty.forEach((item, idx) => {
      out[item.i] = String(lines[idx] ?? '');
    });
    return out;
  };

  return withRetry(run, 1);
}

/** Translate selection + keyword glosses (JSON). */
export async function explainSelection(
  config: AiConfig,
  text: string,
  opts: { targetLang?: 'zh' | 'en' } = {},
): Promise<ExplainResult> {
  const source = text.trim();
  if (!source) {
    return { translation: '', terms: [] };
  }
  const target = opts.targetLang ?? 'zh';
  const payload = {
    model: config.chatModel,
    temperature: 0.2,
    stream: false,
    messages: [
      {
        role: 'system',
        content: EXPLAIN_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: JSON.stringify({
          targetLang: target,
          instruction:
            target === 'zh'
              ? '英译中：全文译成中文。每个关键词的 meaning 必须是中文释义（可含词性如「形容词。」），禁止用英文写释义。phonetic 用 IPA；example 可用英文原句并附中文括号。'
              : '中译英：全文译成英文。每个关键词的 meaning 必须是英文释义，禁止用中文写释义。汉语词给 pinyin；example 可用中文原句并附英文括号。',
          text: source,
        }),
      },
    ],
  };

  const run = async () => {
    let res: Response;
    try {
      res = await fetchWithTimeout(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: authHeaders(config),
        body: JSON.stringify(payload),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new AiClientError(
        sanitizeErrorMessage(msg.includes('abort') ? '网络超时' : `网络错误: ${msg}`, config.apiKey),
      );
    }
    const bodyText = await res.text();
    if (!res.ok) {
      throw mapHttpError(res.status, sanitizeErrorMessage(bodyText, config.apiKey));
    }
    let parsed: ChatCompletionBody;
    try {
      parsed = parseChatCompletionBody(bodyText);
    } catch (e) {
      if (e instanceof AiClientError) throw e;
      throw new AiClientError(unparseableHint(bodyText));
    }
    const content = resolveExplainContent(bodyText, parsed);
    const result = parseExplainPayload(content);
    if (!result) {
      throw new AiClientError(
        content
          ? 'AI 未返回讲解 JSON（需含 translation 字段）'
          : 'AI 未返回讲解内容',
      );
    }
    return result;
  };

  return withRetry(run, 1);
}

export async function transcribeAudio(
  config: AiConfig,
  audioBase64: string,
  mimeType: string,
): Promise<string> {
  if (!audioBase64.trim()) {
    return '';
  }

  const run = async () => {
    const binary = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));
    const blob = new Blob([binary], { type: mimeType || 'audio/webm' });
    const form = new FormData();
    form.append('file', blob, 'chunk.webm');
    form.append('model', config.sttModel);

    let res: Response;
    try {
      res = await fetchWithTimeout(`${config.baseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${config.apiKey}` },
        body: form,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new AiClientError(
        sanitizeErrorMessage(msg.includes('abort') ? '网络超时' : `网络错误: ${msg}`, config.apiKey),
      );
    }

    const bodyText = await res.text();
    if (!res.ok) {
      throw mapHttpError(res.status, sanitizeErrorMessage(bodyText, config.apiKey));
    }

    try {
      const parsed = JSON.parse(bodyText) as { text?: string };
      return (parsed.text ?? '').trim();
    } catch {
      throw new AiClientError('STT 返回无法解析');
    }
  };

  return withRetry(run, 1);
}

/** OpenAI-compatible TTS → base64 audio (mp3). */
export async function synthesizeSpeech(
  config: AiConfig,
  text: string,
  opts: { voice?: string } = {},
): Promise<{ audioBase64: string; mimeType: string }> {
  const input = text.trim();
  if (!input) {
    return { audioBase64: '', mimeType: 'audio/mpeg' };
  }

  const run = async () => {
    let res: Response;
    try {
      res = await fetchWithTimeout(`${config.baseUrl}/audio/speech`, {
        method: 'POST',
        headers: authHeaders(config),
        body: JSON.stringify({
          model: config.ttsModel,
          input,
          voice: opts.voice ?? 'alloy',
          response_format: 'mp3',
        }),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new AiClientError(
        sanitizeErrorMessage(msg.includes('abort') ? '网络超时' : `网络错误: ${msg}`, config.apiKey),
      );
    }

    if (!res.ok) {
      const bodyText = await res.text();
      throw mapHttpError(res.status, sanitizeErrorMessage(bodyText, config.apiKey));
    }

    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]!);
    }
    return { audioBase64: btoa(binary), mimeType: 'audio/mpeg' };
  };

  return withRetry(run, 1);
}
