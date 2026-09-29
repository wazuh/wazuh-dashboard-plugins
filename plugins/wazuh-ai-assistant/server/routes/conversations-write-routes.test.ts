/** @jest-environment node */
import { ByteSizeValue } from '@osd/config-schema';
import supertest from 'supertest';
import { Router } from '../../../../src/core/server/http/router/router';
import { HttpServer } from '../../../../src/core/server/http/http_server';
import { loggingSystemMock } from '../../../../src/core/server/logging/logging_system.mock';
import { API_PATHS } from '../../common/constants';
import { registerConversationRoutes } from './conversations';

/**
 * Drives the create (POST), replace (PUT) and delete (DELETE) routes over a real HTTP request with
 * the OpenSearch client mocked: `search` backs the reads and `transport.request` every write. The
 * exact request each write sends is the store's contract (conversation-store.test.ts); this file
 * covers what the route decides. Rename (PATCH) is in conversations-patch-route.test.ts.
 */

const serverAddress = '127.0.0.1';
const port = 11006; // distinct from conversations-patch-route.test.ts's 11005

const mockGetCurrentUser = jest.fn();
const mockSearch = jest.fn();
const mockTransportRequest = jest.fn();
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
          transport: { request: mockTransportRequest },
        },
      },
    },
  },
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const enhanceWithContext = (fn: (...args: any[]) => any) =>
  fn.bind(null, context);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let server: HttpServer, innerServer: any;

type Method = 'post' | 'put' | 'delete';

const MESSAGES = [{ role: 'user', content: 'hi' }];
const BODIES = {
  post: { title: 'Hello', messages: MESSAGES },
  put: { messages: MESSAGES },
  delete: undefined,
};
const WRITE_PERMISSION = 'cluster:admin/ai_assistant/session/write';
const CAP_REACHED = /maximum of 500 saved conversations/;
const VERSION_CONFLICT = /updated by another session/;

const STORED_DOCUMENT = {
  user: 'alice',
  title: 'Stored title',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  messages: [{ role: 'user', content: 'old' }],
};

const lookupHit = () => ({
  body: {
    hits: {
      hits: [
        {
          _id: 'conv-1',
          _source: STORED_DOCUMENT,
          _seq_no: 3,
          _primary_term: 1,
        },
      ],
    },
  },
});
const lookupEmpty = () => ({ body: { hits: { hits: [] } } });
const countResponse = (value: number) => ({
  body: { hits: { total: { value } } },
});
const endpointError = (statusCode: number, message = 'endpoint error') =>
  Object.assign(new Error(message), { statusCode });

/** What `search` returns differs per route: POST counts the caller's conversations, PUT and DELETE
 * look the conversation up first. */
function givenCaller(method: Method, owner = 'alice', count = 0) {
  mockGetCurrentUser.mockResolvedValue({ username: owner });
  mockSearch.mockResolvedValue(
    method === 'post' ? countResponse(count) : lookupHit(),
  );
}

function call(method: Method, body: object | undefined = BODIES[method]) {
  const url =
    method === 'post'
      ? API_PATHS.CONVERSATIONS
      : API_PATHS.CONVERSATION_BY_ID('conv-1');
  const req = supertest(innerServer.listener)[method](url);
  return body ? req.send(body) : req;
}

const sentBody = () => mockTransportRequest.mock.calls[0][0].body;

beforeAll(async () => {
  const config = {
    name: 'plugin_platform',
    host: serverAddress,
    maxPayload: new ByteSizeValue(1024 * 1024),
    port,
    ssl: { enabled: false },
    compression: { enabled: true },
    requestId: { allowFromAnyIp: true, ipAllowlist: [] },
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
  // Every write goes through the sessions endpoint; none may fall back to a direct index write.
  expect(mockIndex).not.toHaveBeenCalled();
  expect(mockDelete).not.toHaveBeenCalled();
  jest.resetAllMocks();
});

describe(`[endpoint] POST ${API_PATHS.CONVERSATIONS}`, () => {
  test('creates through the sessions endpoint and answers from its reply', async () => {
    givenCaller('post');
    mockTransportRequest.mockResolvedValue({
      body: {
        id: 'new-1',
        title: 'Hello',
        created_at: '2026-02-01T10:00:00.000Z',
        updated_at: '2026-02-01T10:00:00.000Z',
        messages: MESSAGES,
        version: '0:1',
      },
    });

    const response = await call('post').expect(200);

    expect(mockTransportRequest.mock.calls[0][0]).toMatchObject({
      method: 'POST',
      body: BODIES.post,
    });
    expect(response.body).toEqual({
      id: 'new-1',
      title: 'Hello',
      createdAt: '2026-02-01T10:00:00.000Z',
      updatedAt: '2026-02-01T10:00:00.000Z',
      messages: MESSAGES,
      version: '0:1',
    });
  });

  test('answers 409 with the limit message, without writing, when the caller is at the cap', async () => {
    givenCaller('post', 'alice', 500);

    const response = await call('post').expect(409);

    expect(response.body.message).toMatch(CAP_REACHED);
    expect(mockTransportRequest).not.toHaveBeenCalled();
  });

  test('maps an endpoint 409 to the limit message, not a version-conflict one', async () => {
    givenCaller('post', 'alice', 499);
    mockTransportRequest.mockRejectedValue(endpointError(409));

    const response = await call('post').expect(409);

    expect(response.body.message).toMatch(CAP_REACHED);
    expect(response.body.message).not.toMatch(VERSION_CONFLICT);
  });
});

describe(`[endpoint] PUT ${API_PATHS.CONVERSATION_BY_ID(':id')}`, () => {
  beforeEach(() => {
    givenCaller('put');
    mockTransportRequest.mockResolvedValue({
      body: {
        title: 'Stored title',
        created_at: STORED_DOCUMENT.created_at,
        updated_at: '2026-02-02T10:00:00.000Z',
        messages: MESSAGES,
        version: '4:1',
      },
    });
  });

  test('replaces through the sessions endpoint and answers from its reply', async () => {
    const response = await call('put').expect(200);

    expect(mockTransportRequest.mock.calls[0][0].method).toBe('PUT');
    expect(response.body).toEqual({
      id: 'conv-1',
      title: 'Stored title',
      createdAt: STORED_DOCUMENT.created_at,
      updatedAt: '2026-02-02T10:00:00.000Z',
      messages: MESSAGES,
      version: '4:1',
    });
  });

  test.each([
    ["the client's decodable expectedVersion", '2:1', '2:1'],
    ['the version it just read when the client sends none', undefined, '3:1'],
    [
      'the version it read when expectedVersion is undecodable',
      'WzEsMV0=',
      '3:1',
    ],
  ])('checks against %s', async (_case, expectedVersion, checked) => {
    await call('put', { messages: MESSAGES, expectedVersion }).expect(200);

    expect(sentBody().expected_version).toBe(checked);
  });

  test.each([
    ['omits the title when the client sent none', undefined],
    ['forwards the title when the client sent one', 'Renamed'],
  ])('%s', async (_case, title) => {
    await call('put', { messages: MESSAGES, title }).expect(200);

    expect(sentBody().title).toBe(title);
  });

  test('answers 409 with the version-conflict message when the endpoint reports a conflict', async () => {
    mockTransportRequest.mockRejectedValue(endpointError(409));

    const response = await call('put').expect(409);

    expect(response.body.message).toMatch(VERSION_CONFLICT);
  });
});

describe(`[endpoint] DELETE ${API_PATHS.CONVERSATION_BY_ID(':id')}`, () => {
  test('deletes through the sessions endpoint', async () => {
    givenCaller('delete');
    mockTransportRequest.mockResolvedValue({ body: { status: 200 } });

    const response = await call('delete').expect(200);

    expect(response.body).toEqual({ deleted: true });
    expect(mockTransportRequest.mock.calls[0][0].method).toBe('DELETE');
  });
});

describe('errors shared by the write routes', () => {
  test.each(['put', 'delete'] as const)(
    '%s answers 404, without writing, when the caller does not own the conversation',
    async method => {
      givenCaller(method, 'bob');
      mockSearch.mockResolvedValue(lookupEmpty());

      await call(method).expect(404);

      expect(mockTransportRequest).not.toHaveBeenCalled();
    },
  );

  test.each(['put', 'delete'] as const)(
    '%s answers 404 when the endpoint reports the conversation vanished after the lookup',
    async method => {
      givenCaller(method);
      mockTransportRequest.mockRejectedValue(endpointError(404));

      await call(method).expect(404);
    },
  );

  test.each(['post', 'put', 'delete'] as const)(
    '%s surfaces an indexer 403 with the missing-permission message',
    async method => {
      givenCaller(method);
      mockTransportRequest.mockRejectedValue(
        endpointError(
          403,
          `no permissions for [${WRITE_PERMISSION}] and User [name=alice]`,
        ),
      );

      const response = await call(method).expect(403);

      expect(response.body.message).toContain(
        `Missing indexer permission: ${WRITE_PERMISSION}`,
      );
    },
  );
});
