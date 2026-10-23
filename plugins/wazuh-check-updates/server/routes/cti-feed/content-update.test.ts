import { Router } from '../../../../../src/core/server/http/router/router';
import { HttpServer } from '../../../../../src/core/server/http/http_server';
import { loggingSystemMock } from '../../../../../src/core/server/logging/logging_system.mock';
import { ByteSizeValue } from '@osd/config-schema';
import supertest from 'supertest';
import { contentManagerRoutes, routes } from '../../../common/constants';
import { getCtiFeedContentUpdateRoute } from './content-update';

const serverAddress = '127.0.0.1';
const port = 11211;

const mockRequest = jest.fn();
const context = {
  core: {
    opensearch: {
      client: {
        asCurrentUser: {
          transport: { request: mockRequest },
        },
      },
    },
  },
};
const enhanceWithContext = (fn: (...args: unknown[]) => unknown) =>
  fn.bind(null, context);

const loggingService = loggingSystemMock.create();
const logger = loggingService.get();
let server: HttpServer;
let innerServer: { listener: import('http').Server };

beforeAll(async () => {
  const config = {
    name: 'plugin_platform',
    host: serverAddress,
    maxPayload: new ByteSizeValue(1024),
    port,
    ssl: { enabled: false },
    compression: { enabled: true },
    requestId: {
      allowFromAnyIp: true,
      ipAllowlist: [],
    },
  } as unknown as Parameters<HttpServer['setup']>[0];

  server = new HttpServer(loggingService, 'tests');
  const router = new Router('', logger, enhanceWithContext);
  const { registerRouter, server: innerServerTest } = await server.setup(
    config,
  );
  innerServer = innerServerTest;

  getCtiFeedContentUpdateRoute(router);
  registerRouter(router);
  await server.start();
});

afterAll(async () => {
  await server.stop();
  jest.clearAllMocks();
});

describe(`POST ${routes.ctiFeedContentUpdate}`, () => {
  beforeEach(() => {
    mockRequest.mockReset();
  });

  test('forwards the request to the Content Manager as the current user', async () => {
    mockRequest.mockResolvedValue({ body: { status: 202 } });

    const response = await supertest(innerServer.listener)
      .post(routes.ctiFeedContentUpdate)
      .set('osd-xsrf', 'true')
      .expect(200);

    expect(mockRequest).toHaveBeenCalledWith({
      method: 'POST',
      path: contentManagerRoutes.contentUpdate,
    });
    expect(response.body).toEqual({
      message: 'CTI content update requested',
      status: 202,
    });
  });

  test('returns the indexer status code and reason on failure', async () => {
    mockRequest.mockRejectedValue({
      message: 'security_exception',
      meta: {
        statusCode: 403,
        body: { message: 'no permissions for [cluster:admin/content]' },
      },
    });

    const response = await supertest(innerServer.listener)
      .post(routes.ctiFeedContentUpdate)
      .set('osd-xsrf', 'true')
      .expect(403);

    expect(response.body.message).toBe(
      'Could not update the CTI content: no permissions for [cluster:admin/content]',
    );
  });

  test('falls back to a 500 when the error carries no status code', async () => {
    mockRequest.mockRejectedValue(new Error('connect ECONNREFUSED'));

    const response = await supertest(innerServer.listener)
      .post(routes.ctiFeedContentUpdate)
      .set('osd-xsrf', 'true')
      .expect(500);

    expect(response.body.message).toContain('connect ECONNREFUSED');
  });
});
