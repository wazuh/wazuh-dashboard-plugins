/** @jest-environment node */
import { ByteSizeValue } from '@osd/config-schema';
import supertest from 'supertest';
import { Router } from '../../../../src/core/server/http/router/router';
import { HttpServer } from '../../../../src/core/server/http/http_server';
import { loggingSystemMock } from '../../../../src/core/server/logging/logging_system.mock';
import {
  API_PATHS,
  WAZUH_INDEXER_AI_ASSISTANT_SESSIONS_PATH,
} from '../../common/constants';
import { registerConversationRoutes } from './conversations';

/**
 * Drives the create (POST), replace (PUT) and delete (DELETE) routes over a real HTTP request with
 * the OpenSearch client mocked: `search` backs the reads and `transport.request` every write. The
 * rename (PATCH) route is covered in conversations-patch-route.test.ts.
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

const SESSIONS = WAZUH_INDEXER_AI_ASSISTANT_SESSIONS_PATH;
const MESSAGES = [{ role: 'user', content: 'hi' }];

const STORED_DOCUMENT = {
  user: 'alice',
  title: 'Stored title',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  '@timestamp': '2024-01-01T00:00:00.000Z',
  messages: [{ role: 'user', content: 'old' }],
};

function lookupHit() {
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

function lookupEmpty() {
  return { body: { hits: { hits: [] } } };
}

function countResponse(value: number) {
  return { body: { hits: { total: { value } } } };
}

function endpointError(statusCode: number, message = 'endpoint error') {
  return Object.assign(new Error(message), { statusCode });
}

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
  jest.resetAllMocks();
});

describe(`[endpoint] POST ${API_PATHS.CONVERSATIONS}`, () => {
  test('creates through the sessions endpoint and answers from its reply', async () => {
    mockGetCurrentUser.mockResolvedValue({ username: 'alice' });
    mockSearch.mockResolvedValue(countResponse(0));
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

    const response = await supertest(innerServer.listener)
      .post(API_PATHS.CONVERSATIONS)
      .send({ title: 'Hello', messages: MESSAGES })
      .expect(200);

    expect(mockTransportRequest).toHaveBeenCalledWith({
      method: 'POST',
      path: SESSIONS,
      body: { title: 'Hello', messages: MESSAGES },
    });
    expect(response.body).toEqual({
      id: 'new-1',
      title: 'Hello',
      createdAt: '2026-02-01T10:00:00.000Z',
      updatedAt: '2026-02-01T10:00:00.000Z',
      messages: MESSAGES,
      version: '0:1',
    });
    expect(mockIndex).not.toHaveBeenCalled();
  });

  test('answers 409 with the limit message, without writing, when the caller is at the cap', async () => {
    mockGetCurrentUser.mockResolvedValue({ username: 'alice' });
    mockSearch.mockResolvedValue(countResponse(500));

    const response = await supertest(innerServer.listener)
      .post(API_PATHS.CONVERSATIONS)
      .send({ title: 'Hello', messages: MESSAGES })
      .expect(409);

    expect(response.body.message).toMatch(/maximum of 500 saved conversations/);
    expect(mockTransportRequest).not.toHaveBeenCalled();
  });

  test('maps an endpoint 409 to the limit message, not a version-conflict one', async () => {
    mockGetCurrentUser.mockResolvedValue({ username: 'alice' });
    mockSearch.mockResolvedValue(countResponse(499));
    mockTransportRequest.mockRejectedValue(endpointError(409));

    const response = await supertest(innerServer.listener)
      .post(API_PATHS.CONVERSATIONS)
      .send({ title: 'Hello', messages: MESSAGES })
      .expect(409);

    expect(response.body.message).toMatch(/maximum of 500 saved conversations/);
    expect(response.body.message).not.toMatch(/updated by another session/);
  });

  test('surfaces an indexer 403 with the missing-permission message', async () => {
    mockGetCurrentUser.mockResolvedValue({ username: 'alice' });
    mockSearch.mockResolvedValue(countResponse(0));
    mockTransportRequest.mockRejectedValue(
      endpointError(
        403,
        'no permissions for [cluster:admin/ai_assistant/session/write] and User [name=alice]',
      ),
    );

    const response = await supertest(innerServer.listener)
      .post(API_PATHS.CONVERSATIONS)
      .send({ title: 'Hello', messages: MESSAGES })
      .expect(403);

    expect(response.body.message).toContain(
      'Missing indexer permission: cluster:admin/ai_assistant/session/write',
    );
  });
});

describe(`[endpoint] PUT ${API_PATHS.CONVERSATION_BY_ID(':id')}`, () => {
  const replaced = {
    title: 'Stored title',
    created_at: STORED_DOCUMENT.created_at,
    updated_at: '2026-02-02T10:00:00.000Z',
    messages: MESSAGES,
    version: '4:1',
  };

  test("replaces through the sessions endpoint using the client's expectedVersion", async () => {
    mockGetCurrentUser.mockResolvedValue({ username: 'alice' });
    mockSearch.mockResolvedValue(lookupHit());
    mockTransportRequest.mockResolvedValue({ body: replaced });

    const response = await supertest(innerServer.listener)
      .put(API_PATHS.CONVERSATION_BY_ID('conv-1'))
      .send({ messages: MESSAGES, expectedVersion: '2:1' })
      .expect(200);

    expect(mockTransportRequest).toHaveBeenCalledWith({
      method: 'PUT',
      path: `${SESSIONS}/conv-1`,
      body: { messages: MESSAGES, expected_version: '2:1' },
    });
    expect(response.body).toEqual({
      id: 'conv-1',
      title: 'Stored title',
      createdAt: STORED_DOCUMENT.created_at,
      updatedAt: '2026-02-02T10:00:00.000Z',
      messages: MESSAGES,
      version: '4:1',
    });
    expect(mockIndex).not.toHaveBeenCalled();
  });

  test('checks against the version it just read when the client sends none', async () => {
    mockGetCurrentUser.mockResolvedValue({ username: 'alice' });
    mockSearch.mockResolvedValue(lookupHit());
    mockTransportRequest.mockResolvedValue({ body: replaced });

    await supertest(innerServer.listener)
      .put(API_PATHS.CONVERSATION_BY_ID('conv-1'))
      .send({ messages: MESSAGES })
      .expect(200);

    expect(mockTransportRequest.mock.calls[0][0].body.expected_version).toBe(
      '3:1',
    );
  });

  test('ignores an undecodable expectedVersion and falls back to the version it read', async () => {
    mockGetCurrentUser.mockResolvedValue({ username: 'alice' });
    mockSearch.mockResolvedValue(lookupHit());
    mockTransportRequest.mockResolvedValue({ body: replaced });

    await supertest(innerServer.listener)
      .put(API_PATHS.CONVERSATION_BY_ID('conv-1'))
      .send({ messages: MESSAGES, expectedVersion: 'WzEsMV0=' })
      .expect(200);

    expect(mockTransportRequest.mock.calls[0][0].body.expected_version).toBe(
      '3:1',
    );
  });

  test('sends a title only when the client sent one', async () => {
    mockGetCurrentUser.mockResolvedValue({ username: 'alice' });
    mockSearch.mockResolvedValue(lookupHit());
    mockTransportRequest.mockResolvedValue({ body: replaced });

    await supertest(innerServer.listener)
      .put(API_PATHS.CONVERSATION_BY_ID('conv-1'))
      .send({ messages: MESSAGES })
      .expect(200);
    expect(mockTransportRequest.mock.calls[0][0].body.title).toBeUndefined();

    await supertest(innerServer.listener)
      .put(API_PATHS.CONVERSATION_BY_ID('conv-1'))
      .send({ messages: MESSAGES, title: 'Renamed' })
      .expect(200);
    expect(mockTransportRequest.mock.calls[1][0].body.title).toBe('Renamed');
  });

  test('answers 409 with the version-conflict message when the endpoint reports a conflict', async () => {
    mockGetCurrentUser.mockResolvedValue({ username: 'alice' });
    mockSearch.mockResolvedValue(lookupHit());
    mockTransportRequest.mockRejectedValue(endpointError(409));

    const response = await supertest(innerServer.listener)
      .put(API_PATHS.CONVERSATION_BY_ID('conv-1'))
      .send({ messages: MESSAGES, expectedVersion: '2:1' })
      .expect(409);

    expect(response.body.message).toMatch(/updated by another session/);
  });

  test('answers 404, without writing, when the caller does not own the conversation', async () => {
    mockGetCurrentUser.mockResolvedValue({ username: 'bob' });
    mockSearch.mockResolvedValue(lookupEmpty());

    await supertest(innerServer.listener)
      .put(API_PATHS.CONVERSATION_BY_ID('conv-1'))
      .send({ messages: MESSAGES })
      .expect(404);

    expect(mockTransportRequest).not.toHaveBeenCalled();
  });

  test('answers 404 when the endpoint reports the conversation vanished after the lookup', async () => {
    mockGetCurrentUser.mockResolvedValue({ username: 'alice' });
    mockSearch.mockResolvedValue(lookupHit());
    mockTransportRequest.mockRejectedValue(endpointError(404));

    await supertest(innerServer.listener)
      .put(API_PATHS.CONVERSATION_BY_ID('conv-1'))
      .send({ messages: MESSAGES })
      .expect(404);
  });

  test('surfaces an indexer 403 with the missing-permission message', async () => {
    mockGetCurrentUser.mockResolvedValue({ username: 'alice' });
    mockSearch.mockResolvedValue(lookupHit());
    mockTransportRequest.mockRejectedValue(
      endpointError(
        403,
        'no permissions for [cluster:admin/ai_assistant/session/write] and User [name=alice]',
      ),
    );

    const response = await supertest(innerServer.listener)
      .put(API_PATHS.CONVERSATION_BY_ID('conv-1'))
      .send({ messages: MESSAGES })
      .expect(403);

    expect(response.body.message).toContain(
      'Missing indexer permission: cluster:admin/ai_assistant/session/write',
    );
  });
});

describe(`[endpoint] DELETE ${API_PATHS.CONVERSATION_BY_ID(':id')}`, () => {
  test('deletes through the sessions endpoint', async () => {
    mockGetCurrentUser.mockResolvedValue({ username: 'alice' });
    mockSearch.mockResolvedValue(lookupHit());
    mockTransportRequest.mockResolvedValue({
      body: { message: 'deleted', status: 200, id: 'conv-1' },
    });

    const response = await supertest(innerServer.listener)
      .delete(API_PATHS.CONVERSATION_BY_ID('conv-1'))
      .expect(200);

    expect(response.body).toEqual({ deleted: true });
    expect(mockTransportRequest).toHaveBeenCalledWith({
      method: 'DELETE',
      path: `${SESSIONS}/conv-1`,
    });
    expect(mockDelete).not.toHaveBeenCalled();
  });

  test('answers 404, without writing, when the caller does not own the conversation', async () => {
    mockGetCurrentUser.mockResolvedValue({ username: 'bob' });
    mockSearch.mockResolvedValue(lookupEmpty());

    await supertest(innerServer.listener)
      .delete(API_PATHS.CONVERSATION_BY_ID('conv-1'))
      .expect(404);

    expect(mockTransportRequest).not.toHaveBeenCalled();
  });

  test('answers 404 when the endpoint reports the conversation is already gone', async () => {
    mockGetCurrentUser.mockResolvedValue({ username: 'alice' });
    mockSearch.mockResolvedValue(lookupHit());
    mockTransportRequest.mockRejectedValue(endpointError(404));

    await supertest(innerServer.listener)
      .delete(API_PATHS.CONVERSATION_BY_ID('conv-1'))
      .expect(404);
  });

  test('surfaces an indexer 403 with the missing-permission message', async () => {
    mockGetCurrentUser.mockResolvedValue({ username: 'alice' });
    mockSearch.mockResolvedValue(lookupHit());
    mockTransportRequest.mockRejectedValue(
      endpointError(
        403,
        'no permissions for [cluster:admin/ai_assistant/session/write] and User [name=alice]',
      ),
    );

    const response = await supertest(innerServer.listener)
      .delete(API_PATHS.CONVERSATION_BY_ID('conv-1'))
      .expect(403);

    expect(response.body.message).toContain(
      'Missing indexer permission: cluster:admin/ai_assistant/session/write',
    );
  });
});
