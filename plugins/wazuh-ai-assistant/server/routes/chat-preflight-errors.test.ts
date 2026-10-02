/** @jest-environment node */
import { ByteSizeValue } from '@osd/config-schema';
import supertest from 'supertest';
import { Router } from '../../../../src/core/server/http/router/router';
import { HttpServer } from '../../../../src/core/server/http/http_server';
import { loggingSystemMock } from '../../../../src/core/server/logging/logging_system.mock';
import { API_PATHS } from '../../common/constants';
import { registerChatRoutes } from './chat';

/**
 * The two reads the chat route makes before it starts streaming (the provider lookup and the
 * assistant settings) answer with the status the caller can act on: a permission denial is a 403
 * with the permission message, a missing provider is a 404, anything else is a redacted 500.
 */

const serverAddress = '127.0.0.1';
const port = 11007; // distinct from conversations-write-routes.test.ts's 11006

const mockGetProvider = jest.fn();
const mockGetOrCreateSettings = jest.fn();

const context = {
  wazuh_ai_assistant: {
    aiProviders: { get: mockGetProvider },
    assistantSettings: { getOrCreateSettings: mockGetOrCreateSettings },
  },
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const enhanceWithContext = (fn: (...args: any[]) => any) =>
  fn.bind(null, context);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let server: HttpServer, innerServer: any;

const PERMISSION_MESSAGE =
  'You do not have permission to perform this action. Missing indexer permission: cluster:admin/opendistro/ism/policy/get.';

const deniedError = () =>
  Object.assign(
    new Error(
      'no permissions for [cluster:admin/opendistro/ism/policy/get] and User [name=alice, backend_roles=[admin], requestedTenant=null]',
    ),
    { statusCode: 403 },
  );

const STORED_PROVIDER = {
  attributes: { type: 'openai', name: 'OpenAI', model: 'gpt-4o' },
};

const post = () =>
  supertest(innerServer.listener)
    .post(API_PATHS.CHAT)
    .send({
      providerId: 'openai',
      messages: [{ role: 'user', content: 'hi' }],
    });

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

  registerChatRoutes(router, loggingSystemMock.create().get());
  registerRouter(router);

  await server.start();
});

afterAll(async () => {
  await server.stop();
});

afterEach(() => {
  jest.resetAllMocks();
});

describe(`POST ${API_PATHS.CHAT} before streaming`, () => {
  test('a permission denial on the provider lookup answers 403 with the permission message', async () => {
    mockGetProvider.mockRejectedValue(deniedError());

    const response = await post().expect(403);

    expect(response.body.message).toBe(PERMISSION_MESSAGE);
    expect(mockGetOrCreateSettings).not.toHaveBeenCalled();
  });

  test('a missing provider still answers 404', async () => {
    mockGetProvider.mockResolvedValue(undefined);

    const response = await post().expect(404);

    expect(response.body.message).toBe('Unknown provider "openai"');
  });

  test('any other provider lookup failure still answers 404', async () => {
    mockGetProvider.mockRejectedValue(
      Object.assign(new Error('not found'), { statusCode: 404 }),
    );

    await post().expect(404);
  });

  test('a permission denial on the settings read answers 403 with the permission message', async () => {
    mockGetProvider.mockResolvedValue(STORED_PROVIDER);
    mockGetOrCreateSettings.mockRejectedValue(deniedError());

    const response = await post().expect(403);

    expect(response.body.message).toBe(PERMISSION_MESSAGE);
  });

  test('any other settings read failure answers 500 without the identity block', async () => {
    mockGetProvider.mockResolvedValue(STORED_PROVIDER);
    mockGetOrCreateSettings.mockRejectedValue(
      new Error('boom for User [name=alice, backend_roles=[admin]]'),
    );

    const response = await post().expect(500);

    expect(response.body.message).toContain('User [redacted]');
    expect(response.body.message).not.toContain('alice');
  });
});
