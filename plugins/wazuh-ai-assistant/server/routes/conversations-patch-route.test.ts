/** @jest-environment node */
import { ByteSizeValue } from '@osd/config-schema';
import supertest from 'supertest';
import { Router } from '../../../../src/core/server/http/router/router';
import { HttpServer } from '../../../../src/core/server/http/http_server';
import { loggingSystemMock } from '../../../../src/core/server/logging/logging_system.mock';
import { API_PATHS } from '../../common/constants';
import { registerConversationRoutes } from './conversations';

/**
 * Route-level authorization test for the rename (PATCH) endpoint (issue #9010, finding E2), using
 * the SAME real-`HttpServer` + `Router` + `supertest` pattern
 * `plugins/wazuh-check-updates/server/routes/user-preferences/update-user-preferences.test.ts`
 * already uses -- unlike `conversations-owner-resolution.test.ts` and
 * `conversations-version-conflict.test.ts` (which exercise `resolveOwner`/
 * `isVersionConflictError` directly because those ARE pure functions), this file drives the actual
 * registered PATCH route end to end over a real HTTP request, so a regression that removed the
 * `resolveOwner` fail-closed check or the `findConversationHit` owner filter would show up here as
 * a wrong status code, not just as a change to an internal helper's return value.
 *
 * `context.core.opensearch.client.asCurrentUser` is mocked directly (there is no real OpenSearch
 * here) -- `search` backs `findConversationHit`, `index` backs `updateConversation`
 * (conversation-store.ts). `context.wazuh.security.getCurrentUser` backs `resolveOwner`
 * (server/identity.ts).
 */

const serverAddress = '127.0.0.1';
const port = 11005; // distinct from update-user-preferences.test.ts's 11004

const mockGetCurrentUser = jest.fn();
const mockSearch = jest.fn();
const mockIndex = jest.fn();
const mockDelete = jest.fn();

const context = {
  wazuh: { security: { getCurrentUser: mockGetCurrentUser } },
  core: {
    opensearch: {
      client: {
        asCurrentUser: {
          search: mockSearch,
          index: mockIndex,
          delete: mockDelete,
        },
      },
    },
  },
};
// `Router`'s own constructor parameter type (`ContextEnhancer<any, any, any, any>`,
// src/core/server/http/router/router.ts) is itself `any`-parameterized across all four of its
// generics -- there is no narrower type to give this without reimplementing that framework
// type's own inference, and the identical pattern is what
// update-user-preferences.test.ts (this same convention's origin) uses too.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const enhanceWithContext = (fn: (...args: any[]) => any) =>
  fn.bind(null, context);

// `HttpServer#setup`'s returned `server` is the raw Hapi server instance -- typing it exactly
// would require importing Hapi's own types just for this one test-scaffolding variable.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let server: HttpServer, innerServer: any;

const STORED_DOCUMENT = {
  user: 'alice',
  title: 'Old title',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  '@timestamp': '2024-01-01T00:00:00.000Z',
  messages: [{ role: 'user', content: 'hi' }],
};

/** A search response shaped like `conversation-store.ts`'s `SearchHit`, wrapped the way the real
 * OpenSearch JS client returns it (`{ body }`). */
function searchResponseWithHit() {
  return {
    body: {
      hits: {
        hits: [
          {
            _index: 'wazuh-ai-assistant-sessions-000001',
            _id: 'conv-1',
            _source: STORED_DOCUMENT,
            _seq_no: 3,
            _primary_term: 1,
          },
        ],
      },
    },
  };
}

function searchResponseEmpty() {
  return { body: { hits: { hits: [] } } };
}

beforeAll(async () => {
  const config = {
    name: 'plugin_platform',
    host: serverAddress,
    maxPayload: new ByteSizeValue(1024 * 1024),
    port,
    ssl: { enabled: false },
    compression: { enabled: true },
    requestId: {
      allowFromAnyIp: true,
      ipAllowlist: [],
    },
    // `HttpConfig`'s real type carries many more fields than this minimal test config supplies
    // -- same reasoning as `enhanceWithContext`'s own cast above.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  server = new HttpServer(loggingSystemMock.create(), 'tests');
  const router = new Router(
    '',
    loggingSystemMock.create().get(),
    enhanceWithContext,
  );
  const { registerRouter, server: innerServerTest } = await server.setup(
    config,
  );
  innerServer = innerServerTest;

  registerConversationRoutes(router, loggingSystemMock.create().get());
  registerRouter(router);

  await server.start();
});

afterAll(async () => {
  await server.stop();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe(`[endpoint] PATCH ${API_PATHS.CONVERSATION_BY_ID(':id')}`, () => {
  test('renames when the caller owns the conversation, and returns a fresh version', async () => {
    mockGetCurrentUser.mockResolvedValue({ username: 'alice' });
    mockSearch.mockResolvedValue(searchResponseWithHit());
    mockIndex.mockResolvedValue({ body: { _seq_no: 4, _primary_term: 1 } });

    const response = await supertest(innerServer.listener)
      .patch(API_PATHS.CONVERSATION_BY_ID('conv-1'))
      .send({ title: 'New title' })
      .expect(200);

    expect(response.body.title).toBe('New title');
    expect(response.body.version).toBe('4:1');
    // m9: rename must not bump updated_at / move the row between date groups.
    expect(response.body.updatedAt).toBe(STORED_DOCUMENT.updated_at);
    // The owner filter is exercised, not skipped: search was actually called with this user.
    expect(mockSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              filter: expect.arrayContaining([{ term: { user: 'alice' } }]),
            }),
          }),
        }),
      }),
    );
  });

  test('returns 404, not 403 or 200, when the conversation does not belong to this owner', async () => {
    // A real deployment's DLS + this file's own explicit `term: {user}` filter (see the assertion
    // above) both mean `search` finds nothing for a caller who is not that document's owner --
    // modeled directly here as an empty hits array, the same observable outcome. If
    // `findConversationHit`'s owner filter were ever removed, this mock would need to be exactly
    // this shape (empty) to make the assertion below still fail correctly instead of vacuously
    // passing.
    mockGetCurrentUser.mockResolvedValue({ username: 'bob' });
    mockSearch.mockResolvedValue(searchResponseEmpty());

    const response = await supertest(innerServer.listener)
      .patch(API_PATHS.CONVERSATION_BY_ID('conv-1'))
      .send({ title: 'New title' })
      .expect(404);

    expect(response.body.title).not.toBe('New title');
    expect(mockIndex).not.toHaveBeenCalled();
  });

  test('returns 403 (fail-closed), never 200, when the identity cannot be resolved', async () => {
    mockGetCurrentUser.mockResolvedValue(undefined);

    const response = await supertest(innerServer.listener)
      .patch(API_PATHS.CONVERSATION_BY_ID('conv-1'))
      .send({ title: 'New title' })
      .expect(403);

    expect(response.body.message).toMatch(/identity/i);
    // Fails closed before ever touching storage -- neither the lookup nor the write ran.
    expect(mockSearch).not.toHaveBeenCalled();
    expect(mockIndex).not.toHaveBeenCalled();
  });

  test('rejects an empty/whitespace-only title with a 400, never reaching storage', async () => {
    mockGetCurrentUser.mockResolvedValue({ username: 'alice' });
    mockSearch.mockResolvedValue(searchResponseWithHit());

    await supertest(innerServer.listener)
      .patch(API_PATHS.CONVERSATION_BY_ID('conv-1'))
      .send({ title: '   ' })
      .expect(400);

    expect(mockIndex).not.toHaveBeenCalled();
  });
});
