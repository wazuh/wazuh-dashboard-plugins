// To launch this file
// yarn test:jest --testEnvironment node --verbose server/routes/wazuh-api-http-status.test.ts
import { Router } from '../../../../src/core/server/http/router/router';
import { HttpServer } from '../../../../src/core/server/http/http_server';
import { loggingSystemMock } from '../../../../src/core/server/logging/logging_system.mock';
import { ByteSizeValue } from '@osd/config-schema';
import supertest from 'supertest';
import { WazuhApiRoutes } from './wazuh-api';
import { HTTP_STATUS_CODES } from '../../common/constants';

const loggingService = loggingSystemMock.create();
const logger = loggingService.get();
const context = {
  wazuh: {
    security: {
      getCurrentUser: () => 'wazuh',
    },
    logger: {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
  },
  wazuh_core: {
    manageHosts: {
      get: jest.fn(id => {
        return {
          id,
          url: 'https://localhost',
          port: 55000,
          username: 'wazuh-wui',
          password: 'wazuh-wui',
          run_as: false,
        };
      }),
      cacheAPIUserAllowRunAs: {
        set: jest.fn(),
        API_USER_STATUS_RUN_AS: {
          ALL_DISABLED: 0,
          USER_NOT_ALLOWED: 1,
          HOST_DISABLED: 2,
          ENABLED: 3,
        },
      },
    },
  },
};

const enhanceWithContext = (fn: (...args: any[]) => any) =>
  fn.bind(null, context);
let server, innerServer;

beforeAll(async () => {
  // Create server
  const config = {
    name: 'plugin_platform',
    host: '127.0.0.1',
    maxPayload: new ByteSizeValue(1024),
    port: 10002,
    ssl: { enabled: false },
    compression: { enabled: true },
    requestId: {
      allowFromAnyIp: true,
      ipAllowlist: [],
    },
  } as any;
  server = new HttpServer(loggingService, 'tests');
  const router = new Router('', logger, enhanceWithContext);
  const {
    registerRouter,
    server: innerServerTest,
    ...rest
  } = await server.setup(config);
  innerServer = innerServerTest;

  // Register routes
  WazuhApiRoutes(router);

  // Register router
  registerRouter(router);

  // start server
  await server.start();
});

afterAll(async () => {
  // Stop server
  await server.stop();

  // Clear all mocks
  jest.clearAllMocks();
});

describe('[endpoint] GET /api/check-api', () => {
  it.each`
    apiId        | statusCode
    ${'default'} | ${HTTP_STATUS_CODES.SERVICE_UNAVAILABLE}
  `(
    `Get API configuration POST /api/check-api - apiID - $statusCode`,
    async ({ apiId, statusCode }) => {
      const body = { id: apiId, forceRefresh: false };
      const response = await supertest(innerServer.listener)
        .post('/api/check-api')
        .send(body)
        .expect(statusCode);
    },
  );
});
