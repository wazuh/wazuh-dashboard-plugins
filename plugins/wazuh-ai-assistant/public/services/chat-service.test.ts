import { ChatService } from './chat-service';
import { ChatMessage, StreamEvent } from '../../common/types';
import { IBasePath } from '../../../../src/core/public';

const basePath = {
  prepend: (path: string) => `/mock-base${path}`,
} as unknown as IBasePath;

const messages: ChatMessage[] = [{ role: 'user', content: 'hi' }];

async function collect(
  generator: AsyncGenerator<StreamEvent>,
): Promise<StreamEvent[]> {
  const events: StreamEvent[] = [];
  for await (const event of generator) {
    events.push(event);
  }
  return events;
}

/** Builds a fetch-response-shaped mock whose `.body.getReader()` replays `chunks` (as UTF-8 text)
 * one at a time, then reports `done`. Lets a test control exactly where a chunk boundary falls —
 * including splitting a single SSE line across two reads. */
function streamingResponse(chunks: string[]) {
  let index = 0;
  const encoder = new TextEncoder();
  const releaseLock = jest.fn();
  const read = jest.fn(() => {
    if (index >= chunks.length) {
      return Promise.resolve({ done: true, value: undefined });
    }
    const value = encoder.encode(chunks[index]);
    index += 1;
    return Promise.resolve({ done: false, value });
  });
  return {
    response: {
      ok: true,
      status: 200,
      body: {
        getReader: () => ({ read, releaseLock }),
      },
    },
    releaseLock,
    read,
  };
}

function failedResponse(status: number, textImpl: () => Promise<string>) {
  return {
    ok: false,
    status,
    body: null,
    text: jest.fn(textImpl),
  };
}

describe('ChatService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('request construction', () => {
    it('POSTs to the base-path-prepended chat route with credentials/headers, and omits privacy when not passed', async () => {
      const fetchMock = jest
        .fn()
        .mockResolvedValue(streamingResponse([]).response);
      window.fetch = fetchMock;
      const service = new ChatService(basePath);

      await collect(
        service.streamChat('openai', messages, new AbortController().signal),
      );

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('/mock-base/api/wazuh_ai_assistant/chat');
      expect(init.method).toBe('POST');
      expect(init.credentials).toBe('same-origin');
      expect(init.headers).toEqual({
        'Content-Type': 'application/json',
        'osd-xsrf': 'true',
      });
      const body = JSON.parse(init.body);
      expect(body).toEqual({ providerId: 'openai', messages });
      expect(body).not.toHaveProperty('privacy');
    });

    it('includes the privacy object verbatim when passed', async () => {
      const fetchMock = jest
        .fn()
        .mockResolvedValue(streamingResponse([]).response);
      window.fetch = fetchMock;
      const service = new ChatService(basePath);
      const privacy = { enabled: true, map: [{ value: 'a', pseudonym: 'b' }] };

      await collect(
        service.streamChat(
          'openai',
          messages,
          new AbortController().signal,
          privacy,
        ),
      );

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.privacy).toEqual(privacy);
    });
  });

  describe('the recently-fixed rejected-fetch regression', () => {
    it('a rejected window.fetch yields an `error` StreamEvent instead of throwing', async () => {
      window.fetch = jest.fn().mockRejectedValue(new Error('network down'));
      const service = new ChatService(basePath);

      const events = await collect(
        service.streamChat('openai', messages, new AbortController().signal),
      );

      expect(events).toEqual([
        {
          type: 'error',
          message: 'Could not reach the Wazuh dashboard server: network down',
        },
      ]);
    });

    it('a rejected fetch never rejects/throws out of the async generator itself', async () => {
      window.fetch = jest.fn().mockRejectedValue(new Error('boom'));
      const service = new ChatService(basePath);

      await expect(
        collect(
          service.streamChat('openai', messages, new AbortController().signal),
        ),
      ).resolves.toBeInstanceOf(Array);
    });

    it('a rejected fetch while the caller already aborted yields no events at all (Stop was pressed)', async () => {
      const controller = new AbortController();
      controller.abort();
      window.fetch = jest
        .fn()
        .mockRejectedValue(new DOMException('Aborted', 'AbortError'));
      const service = new ChatService(basePath);

      const events = await collect(
        service.streamChat('openai', messages, controller.signal),
      );

      expect(events).toEqual([]);
    });
  });

  describe('non-2xx responses', () => {
    it('a 401 yields a single auth_expired event and never reads the response body', async () => {
      const textSpy = jest.fn();
      window.fetch = jest.fn().mockResolvedValue(failedResponse(401, textSpy));
      const service = new ChatService(basePath);

      const events = await collect(
        service.streamChat('openai', messages, new AbortController().signal),
      );

      expect(events).toEqual([{ type: 'auth_expired' }]);
      expect(textSpy).not.toHaveBeenCalled();
    });

    it('a non-401 failure yields an error event with the HTTP status and body text', async () => {
      window.fetch = jest
        .fn()
        .mockResolvedValue(failedResponse(500, () => Promise.resolve('boom')));
      const service = new ChatService(basePath);

      const events = await collect(
        service.streamChat('openai', messages, new AbortController().signal),
      );

      expect(events).toEqual([
        { type: 'error', message: 'Request failed (HTTP 500): boom' },
      ]);
    });

    it('falls back to a placeholder detail when reading the error body itself throws', async () => {
      window.fetch = jest
        .fn()
        .mockResolvedValue(
          failedResponse(503, () =>
            Promise.reject(new Error('body read failed')),
          ),
        );
      const service = new ChatService(basePath);

      const events = await collect(
        service.streamChat('openai', messages, new AbortController().signal),
      );

      expect(events).toEqual([
        {
          type: 'error',
          message: 'Request failed (HTTP 503): <unreadable body>',
        },
      ]);
    });
  });

  describe('SSE stream parsing', () => {
    it('parses one "data:" line per stream event, in order', async () => {
      const { response } = streamingResponse([
        'data: {"type":"delta","content":"Hello"}\n\n' +
          'data: {"type":"delta","content":" world"}\n\n',
      ]);
      window.fetch = jest.fn().mockResolvedValue(response);
      const service = new ChatService(basePath);

      const events = await collect(
        service.streamChat('openai', messages, new AbortController().signal),
      );

      expect(events).toEqual([
        { type: 'delta', content: 'Hello' },
        { type: 'delta', content: ' world' },
      ]);
    });

    it('reassembles a single SSE line split across two separate chunk reads', async () => {
      const { response } = streamingResponse([
        'data: {"typ',
        'e":"delta","content":"split across chunks"}\n\n',
      ]);
      window.fetch = jest.fn().mockResolvedValue(response);
      const service = new ChatService(basePath);

      const events = await collect(
        service.streamChat('openai', messages, new AbortController().signal),
      );

      expect(events).toEqual([
        { type: 'delta', content: 'split across chunks' },
      ]);
    });

    it('skips a line that fails to JSON-parse and continues with the next line', async () => {
      const { response } = streamingResponse([
        'data: not-json-at-all\n' + 'data: {"type":"delta","content":"ok"}\n\n',
      ]);
      window.fetch = jest.fn().mockResolvedValue(response);
      const service = new ChatService(basePath);

      const events = await collect(
        service.streamChat('openai', messages, new AbortController().signal),
      );

      expect(events).toEqual([{ type: 'delta', content: 'ok' }]);
    });

    it('ignores non-"data:" lines (SSE comments/blank keep-alives) and blank data payloads', async () => {
      const { response } = streamingResponse([
        ': keep-alive\n' +
          '\n' +
          'data:   \n' +
          'data: {"type":"delta","content":"x"}\n\n',
      ]);
      window.fetch = jest.fn().mockResolvedValue(response);
      const service = new ChatService(basePath);

      const events = await collect(
        service.streamChat('openai', messages, new AbortController().signal),
      );

      expect(events).toEqual([{ type: 'delta', content: 'x' }]);
    });

    it('stops at a terminal "done" event, never yielding events queued after it in the same chunk', async () => {
      const { response } = streamingResponse([
        'data: {"type":"delta","content":"last token"}\n\n' +
          'data: {"type":"done"}\n\n' +
          'data: {"type":"delta","content":"should never appear"}\n\n',
      ]);
      window.fetch = jest.fn().mockResolvedValue(response);
      const service = new ChatService(basePath);

      const events = await collect(
        service.streamChat('openai', messages, new AbortController().signal),
      );

      expect(events).toEqual([
        { type: 'delta', content: 'last token' },
        { type: 'done' },
      ]);
    });

    it('stops at a terminal "error" event the same way as "done"', async () => {
      const { response } = streamingResponse([
        'data: {"type":"error","message":"boom"}\n\n' +
          'data: {"type":"delta","content":"should never appear"}\n\n',
      ]);
      window.fetch = jest.fn().mockResolvedValue(response);
      const service = new ChatService(basePath);

      const events = await collect(
        service.streamChat('openai', messages, new AbortController().signal),
      );

      expect(events).toEqual([{ type: 'error', message: 'boom' }]);
    });

    it('ends cleanly (no extra event) when the stream simply completes without a terminal event, and releases the reader lock', async () => {
      const { response, releaseLock } = streamingResponse([
        'data: {"type":"delta","content":"only"}\n\n',
      ]);
      window.fetch = jest.fn().mockResolvedValue(response);
      const service = new ChatService(basePath);

      const events = await collect(
        service.streamChat('openai', messages, new AbortController().signal),
      );

      expect(events).toEqual([{ type: 'delta', content: 'only' }]);
      expect(releaseLock).toHaveBeenCalledTimes(1);
    });

    it('a mid-stream reader.read() rejection yields a "Stream interrupted" error event', async () => {
      const releaseLock = jest.fn();
      const read = jest.fn().mockRejectedValue(new Error('boom'));
      window.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        body: { getReader: () => ({ read, releaseLock }) },
      });
      const service = new ChatService(basePath);

      const events = await collect(
        service.streamChat('openai', messages, new AbortController().signal),
      );

      expect(events).toEqual([
        { type: 'error', message: 'Stream interrupted: boom' },
      ]);
      expect(releaseLock).toHaveBeenCalledTimes(1);
    });

    it('a mid-stream reader.read() rejection while aborted yields no events at all', async () => {
      const controller = new AbortController();
      controller.abort();
      const releaseLock = jest.fn();
      const read = jest
        .fn()
        .mockRejectedValue(new DOMException('Aborted', 'AbortError'));
      window.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        body: { getReader: () => ({ read, releaseLock }) },
      });
      const service = new ChatService(basePath);

      const events = await collect(
        service.streamChat('openai', messages, controller.signal),
      );

      expect(events).toEqual([]);
      expect(releaseLock).toHaveBeenCalledTimes(1);
    });
  });
});
