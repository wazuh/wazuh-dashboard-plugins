import { i18n } from '@osd/i18n';
import { IBasePath } from '../../../../src/core/public';
import { API_PATHS } from '../../common/constants';
import { describeError } from '../../common/errors';
import { ChatMessage, ChatRequest, StreamEvent } from '../../common/types';

/**
 * SSE client for the chat route. Deliberately uses `window.fetch` + a manual ReadableStream
 * reader instead of `core.http.post()` (which buffers the full response before resolving) or
 * `EventSource` (which cannot send a POST body). This is the same approach the platform's own
 * streaming plugins use for chat-style routes.
 */
export class ChatService {
  constructor(private readonly basePath: IBasePath) {}

  async *streamChat(
    providerId: string,
    messages: ChatMessage[],
    signal: AbortSignal,
    /**
     * Privacy mode (common/types.ts's `ChatRequest['privacy']`). Passed through verbatim;
     * the "omit the whole object when off and the map is empty" rule (so a conversation that never
     * touches privacy mode sends a byte-identical body to before this feature existed) is the
     * caller's job (chat-page.tsx's `privacyPayload`), not this method's — it only omits the key
     * when the caller passes `undefined` at all.
     */
    privacy?: ChatRequest['privacy'],
  ): AsyncGenerator<StreamEvent> {
    let response: Response;
    try {
      response = await window.fetch(this.basePath.prepend(API_PATHS.CHAT), {
        method: 'POST',
        signal,
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'osd-xsrf': 'true',
        },
        body: JSON.stringify({
          providerId,
          messages,
          ...(privacy ? { privacy } : {}),
        }),
      });
    } catch (error) {
      // `fetch` rejects only for transport failures (server unreachable, DNS, TLS, offline) and
      // for an abort — an HTTP error status resolves normally and is handled below. Both are
      // reported as stream events rather than thrown: callers consume this generator for
      // StreamEvents and do not wrap it in a try/catch, so a throw here would surface as an
      // unhandled rejection with no message shown to the user. An abort is the user pressing
      // Stop, which needs no error at all.
      if (signal.aborted) {
        return;
      }
      yield {
        type: 'error',
        message: i18n.translate('wazuhAiAssistant.chat.error.unreachable', {
          defaultMessage:
            'Could not reach the Wazuh dashboard server: {detail}',
          values: { detail: describeError(error) },
        }),
      };
      return;
    }

    if (!response.ok || !response.body) {
      // A 401 here means the dashboard's OWN session cookie (not this route's business logic)
      // rejected the request — chat-page.tsx shows a dedicated, persistent "reload to sign in
      // again" callout for this, distinct from the generic error banner the branch below still
      // handles for every other non-2xx status.
      if (response.status === 401) {
        yield { type: 'auth_expired' };
        return;
      }
      const bodyText = await safeReadText(response);
      yield {
        type: 'error',
        message: i18n.translate('wazuhAiAssistant.chat.error.requestFailed', {
          defaultMessage: 'Request failed (HTTP {status}): {detail}',
          values: { status: response.status, detail: bodyText },
        }),
      };
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    try {
      while (true) {
        // eslint-disable-next-line no-await-in-loop -- stream chunks must be consumed in order
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line.startsWith('data:')) {
            continue;
          }
          const payload = line.slice('data:'.length).trim();
          if (!payload) {
            continue;
          }
          let event: StreamEvent;
          try {
            event = JSON.parse(payload);
          } catch {
            continue;
          }
          yield event;
          if (event.type === 'done' || event.type === 'error') {
            return;
          }
        }
      }
    } catch (error) {
      if (signal.aborted) {
        return;
      }
      yield {
        type: 'error',
        message: i18n.translate(
          'wazuhAiAssistant.chat.error.streamInterrupted',
          {
            defaultMessage: 'Stream interrupted: {detail}',
            values: { detail: describeError(error) },
          },
        ),
      };
    } finally {
      reader.releaseLock();
    }
  }
}

async function safeReadText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return '<unreadable body>';
  }
}
