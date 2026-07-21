import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  mapHttpError,
  sanitizeErrorMessage,
  translateTexts,
  explainSelection,
  parseChatCompletionBody,
  extractAssistantText,
  resolveExplainContent,
  extractTranslationLines,
  AiClientError,
} from './ai-client';
import { handleAiRequest } from './ai-handler';
import { parseExplainPayload } from './vocab-explain';
import { DEFAULT_SETTINGS, type ExtensionSettings } from './storage';

const config = {
  apiKey: 'sk-secret-key',
  baseUrl: 'https://api.example.com/v1',
  chatModel: 'gpt-4o-mini',
  sttModel: 'whisper-1',
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('ai-client (F2 UNIT)', () => {
  it('TC-F2-U01 Happy: translate returns lines', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          JSON.stringify({
            choices: [{ message: { content: '["你好"]' } }],
          }),
      }),
    );
    const out = await translateTexts(config, ['Hello']);
    expect(out).toEqual(['你好']);
  });

  it('TC-F2-U02 Err: 401 maps to check key', () => {
    const err = mapHttpError(401, 'unauthorized');
    expect(err).toBeInstanceOf(AiClientError);
    expect(err.message).toMatch(/API Key/);
  });

  it('TC-F2-U03 Err: network then retry succeeds', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            choices: [{ message: { content: '["世界"]' } }],
          }),
      });
    vi.stubGlobal('fetch', fetchMock);
    const out = await translateTexts(config, ['World']);
    expect(out).toEqual(['世界']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('TC-F2-U04 Boundary: empty text skips HTTP', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const out = await translateTexts(config, ['', '  ']);
    expect(out).toEqual(['', '']);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('never leaks api key in sanitize', () => {
    expect(sanitizeErrorMessage('bad sk-secret-key oops', 'sk-secret-key')).toBe(
      'bad [REDACTED] oops',
    );
  });

  it('TC-S3-U02: sanitize redacts iflytekApiSecret', () => {
    expect(
      sanitizeErrorMessage(
        'boom key=sk-iflytek-key secret=sec-xyz-token',
        'sk-iflytek-key',
        'sec-xyz-token',
      ),
    ).toBe('boom key=[REDACTED] secret=[REDACTED]');
  });

  it('sends stream:false for custom OpenAI-compat gateways', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          choices: [{ message: { content: '["你好"]' } }],
        }),
    });
    vi.stubGlobal('fetch', fetchMock);
    await translateTexts(config, ['Hello']);
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body ?? '{}')) as {
      stream?: boolean;
    };
    expect(body.stream).toBe(false);
  });

  it('parses SSE chat.completion.chunk bodies', async () => {
    const sse = [
      'data: {"choices":[{"delta":{"content":"[\\"你"}}]}',
      'data: {"choices":[{"delta":{"content":"好\\"]"}}]}',
      'data: [DONE]',
      '',
    ].join('\n');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => sse,
      }),
    );
    const out = await translateTexts(config, ['Hello']);
    expect(out).toEqual(['你好']);
  });

  it('extracts content parts and markdown fences', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          JSON.stringify({
            choices: [
              {
                message: {
                  content: [
                    { type: 'text', text: '```json\n["世界"]\n```' },
                  ],
                },
              },
            ],
          }),
      }),
    );
    const out = await translateTexts(config, ['World']);
    expect(out).toEqual(['世界']);
  });

  it('falls back to reasoning_content when content empty', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          JSON.stringify({
            choices: [
              {
                message: {
                  content: '',
                  reasoning_content: '["推理译文"]',
                },
              },
            ],
          }),
      }),
    );
    const out = await translateTexts(config, ['x']);
    expect(out).toEqual(['推理译文']);
  });

  it('parseChatCompletionBody unwraps data wrapper', () => {
    const parsed = parseChatCompletionBody(
      JSON.stringify({
        data: { choices: [{ message: { content: '["a"]' } }] },
      }),
    );
    expect(extractAssistantText(parsed)).toBe('["a"]');
  });

  it('explainSelection accepts content-part payloads', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          JSON.stringify({
            choices: [
              {
                message: {
                  content: [
                    {
                      type: 'text',
                      text: JSON.stringify({
                        translation: '你好',
                        terms: [{ term: 'hi', meaning: '问候' }],
                      }),
                    },
                  ],
                },
              },
            ],
          }),
      }),
    );
    const out = await explainSelection(config, 'hi', { targetLang: 'zh' });
    expect(out.translation).toBe('你好');
    expect(out.terms[0]?.term).toBe('hi');
  });

  it('explainSelection accepts message.content as object', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          JSON.stringify({
            choices: [
              {
                message: {
                  content: {
                    translation: '世界',
                    terms: [{ term: 'world', meaning: '名词。世界。' }],
                  },
                },
              },
            ],
          }),
      }),
    );
    const out = await explainSelection(config, 'world', { targetLang: 'zh' });
    expect(out.translation).toBe('世界');
  });

  it('explainSelection accepts raw explain JSON body', async () => {
    const body = {
      translation: '你好',
      terms: [{ term: 'hi', meaning: '问候' }],
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(body),
      }),
    );
    const out = await explainSelection(config, 'hi', { targetLang: 'zh' });
    expect(out.translation).toBe('你好');
  });

  it('resolveExplainContent reads result wrapper', () => {
    const body = {
      translation: '测',
      terms: [{ term: 't', meaning: '测试' }],
    };
    const text = resolveExplainContent('{}', { result: body } as never);
    expect(parseExplainPayload(text)?.translation).toBe('测');
  });

  it('parses double-encoded JSON string body', () => {
    const inner = JSON.stringify({
      choices: [{ message: { content: '["你好"]' } }],
    });
    const parsed = parseChatCompletionBody(JSON.stringify(inner));
    expect(extractAssistantText(parsed)).toBe('["你好"]');
  });

  it('parses data wrapper that is itself a JSON string', () => {
    const parsed = parseChatCompletionBody(
      JSON.stringify({
        data: JSON.stringify({
          choices: [{ message: { content: '["嵌套"]' } }],
        }),
      }),
    );
    expect(extractAssistantText(parsed)).toBe('["嵌套"]');
  });

  it('translateTexts accepts plain-text single translation', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          JSON.stringify({
            choices: [{ message: { content: '纯文本译文' } }],
          }),
      }),
    );
    const out = await translateTexts(config, ['Hello']);
    expect(out).toEqual(['纯文本译文']);
  });

  it('extractTranslationLines reads translations object key', () => {
    expect(
      extractTranslationLines('{"translations":["一","二"]}', 2),
    ).toEqual(['一', '二']);
  });
});

describe('ai-handler messaging (F2 INT-ish)', () => {
  it('TC-F2-I01 content→handler translate batch', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          JSON.stringify({
            choices: [{ message: { content: '["一","二"]' } }],
          }),
      }),
    );
    const settings: ExtensionSettings = {
      ...DEFAULT_SETTINGS,
      enabled: true,
      aiConfig: config,
    };
    const res = await handleAiRequest(settings, {
      type: 'ai.translate',
      texts: ['one', 'two'],
      targetLang: 'zh',
    });
    expect(res.ok).toBe(true);
    if (res.ok && 'translations' in res) {
      expect(res.translations).toEqual(['一', '二']);
    }
  });

  it('handleAiRequest never returns raw api key in error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error(`network boom ${config.apiKey}`)),
    );
    const settings: ExtensionSettings = {
      ...DEFAULT_SETTINGS,
      enabled: true,
      aiConfig: config,
    };
    const res = await handleAiRequest(settings, {
      type: 'ai.translate',
      texts: ['x'],
      targetLang: 'zh',
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).not.toContain(config.apiKey);
      expect(res.error).toContain('[REDACTED]');
    }
  });
});
