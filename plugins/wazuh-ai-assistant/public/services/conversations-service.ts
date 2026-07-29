import { HttpSetup } from '../../../../src/core/public';
import { API_PATHS } from '../../common/constants';
import {
  ChatMessage,
  ConversationRecord,
  ConversationSummary,
} from '../../common/types';
import { fetchAllPages } from './fetch-all-pages';

/** Shape of the paginated GET /conversations response (server/routes/conversations.ts). */
interface ConversationsPage {
  conversations: ConversationSummary[];
  total: number;
  page: number;
  perPage: number;
}

/** Server-side page size used when looping pages in `list()`. Matches the server's default/max. */
const CONVERSATIONS_PAGE_SIZE = 100;
/** Hard safety ceiling so a runaway `total` can never cause an unbounded fetch loop. */
const CONVERSATIONS_MAX_PAGES = 20;

/**
 * Thin wrapper over the persistent-conversations CRUD routes (server/routes/
 * conversations.ts). Same buffering `http` service used by SettingsService — these bodies are
 * small-to-moderate JSON payloads (a saved transcript), never the streaming chat response itself.
 */
export class ConversationsService {
  constructor(private readonly http: HttpSetup) {}

  /** Summaries only (id/title/updatedAt) — never the full `messages` transcript. Fetches every
   * conversation by looping pages (server truncates to `perPage` per call), so callers keep seeing
   * the complete list ("show all", no client-side Load-More). Stops once every page has been
   * collected, or at a hard ceiling of 20 pages / 2000 conversations — whichever comes first — to
   * guard against an unbounded loop if the server ever reports a bogus `total`. */
  list(): Promise<ConversationSummary[]> {
    return fetchAllPages(
      async page => {
        const response = await this.http.get<ConversationsPage>(
          API_PATHS.CONVERSATIONS,
          {
            query: { page, perPage: CONVERSATIONS_PAGE_SIZE },
          },
        );
        return { items: response.conversations, total: response.total };
      },
      CONVERSATIONS_PAGE_SIZE,
      CONVERSATIONS_MAX_PAGES,
      'AI Assistant: conversation list exceeds 2000; showing the first 2000',
    );
  }

  create(title: string, messages: ChatMessage[]): Promise<ConversationRecord> {
    return this.http.post<ConversationRecord>(API_PATHS.CONVERSATIONS, {
      body: JSON.stringify({ title, messages }),
    });
  }

  get(id: string): Promise<ConversationRecord> {
    return this.http.get<ConversationRecord>(API_PATHS.CONVERSATION_BY_ID(id));
  }

  /**
   * `expectedVersion` (Fix 1, optimistic concurrency — server/routes/conversations.ts's PUT):
   * omitted entirely (not sent as `undefined`) when the caller has no last-known version yet, so
   * the request body stays byte-identical to before this field existed for that case. A 409
   * rejection (version conflict) propagates as a normal promise rejection — same as any other
   * non-2xx `http.put` failure — for the caller (chat-page.tsx's `saveConversationWithMerge`) to
   * detect via `common/http-status.ts`'s `getHttpErrorStatus` and react to.
   */
  update(
    id: string,
    title: string,
    messages: ChatMessage[],
    expectedVersion?: string,
  ): Promise<ConversationRecord> {
    return this.http.put<ConversationRecord>(API_PATHS.CONVERSATION_BY_ID(id), {
      body: JSON.stringify({
        title,
        messages,
        ...(expectedVersion ? { expectedVersion } : {}),
      }),
    });
  }

  async remove(id: string): Promise<void> {
    await this.http.delete(API_PATHS.CONVERSATION_BY_ID(id));
  }
}
