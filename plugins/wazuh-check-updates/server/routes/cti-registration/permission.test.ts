import { Router } from '../../../../../src/core/server/http/router/router';
import { HttpServer } from '../../../../../src/core/server/http/http_server';
import { loggingSystemMock } from '../../../../../src/core/server/logging/logging_system.mock';
import { ByteSizeValue } from '@osd/config-schema';
import supertest from 'supertest';
import { routes } from '../../../common/constants';
import { getCtiRegistrationPermissionRoute } from './permission';
import { getWazuhCheckUpdatesServices } from '../../plugin-services';

jest.mock('../../plugin-services', () => ({
  getWazuhCheckUpdatesServices: jest.fn(),
}));

const serverAddress = '127.0.0.1';
const port = 11209;

const mockTransportRequest = jest.fn();
const context = {
  core: {
    opensearch: {
      client: {
        asCurrentUser: {
          transport: {
            request: mockTransportRequest,
          },
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

  getCtiRegistrationPermissionRoute(router);
  registerRouter(router);
  await server.start();
});

afterAll(async () => {
  await server.stop();
  jest.clearAllMocks();
});

describe(`GET ${routes.ctiRegistrationPermission}`, () => {
  beforeEach(() => {
    mockTransportRequest.mockReset();
    (getWazuhCheckUpdatesServices as jest.Mock).mockReturnValue({
      logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
    });
  });

  test('answers 200 with accessAllowed true for a permitted user', async () => {
    mockTransportRequest.mockResolvedValue({
      body: { accessAllowed: true, missingPrivileges: [] },
    });

    const response = await supertest(innerServer.listener)
      .get(routes.ctiRegistrationPermission)
      .expect(200);

    expect(response.body).toEqual({
      accessAllowed: true,
      missingPrivileges: [],
    });
  });

  test('answers 200 — not 403 — with accessAllowed false for a denied user', async () => {
    mockTransportRequest.mockResolvedValue({
      body: {
        accessAllowed: false,
        missingPrivileges: [
          'cluster:admin/content_manager/subscription/create',
        ],
      },
    });

    const response = await supertest(innerServer.listener)
      .get(routes.ctiRegistrationPermission)
      .expect(200);

    expect(response.body).toEqual({
      accessAllowed: false,
      missingPrivileges: ['cluster:admin/content_manager/subscription/create'],
    });
  });

  test('answers 200 with accessAllowed true when the probe fails', async () => {
    mockTransportRequest.mockRejectedValue(new Error('unreachable'));

    const response = await supertest(innerServer.listener)
      .get(routes.ctiRegistrationPermission)
      .expect(200);

    expect(response.body).toEqual({
      accessAllowed: true,
      missingPrivileges: [],
    });
  });
});
