import { Router } from '../../../../../src/core/server/http/router/router';
import { HttpServer } from '../../../../../src/core/server/http/http_server';
import { loggingSystemMock } from '../../../../../src/core/server/logging/logging_system.mock';
import { ByteSizeValue } from '@osd/config-schema';
import { routes } from '../../../common/constants';
import { getApiInfoRoute } from './get-api-info';
import { getApiInfo } from '../../services/cti-registration/get-api-info';
import supertest from 'supertest';

const serverAddress = '127.0.0.1';
const port = 11005; // assign a different port in each unit test

const mockedGetApiInfo = getApiInfo as jest.Mock;
jest.mock('../../services/cti-subscription/get-api-info');

const loggingService = loggingSystemMock.create();
const logger = loggingService.get();
const context = {
  wazuh_check_updates: {
    security: {
      getCurrentUser: () => {
        return { username: 'admin' };
      },
    },
  },
};
const enhanceWithContext = (fn: (...args: any[]) => any) =>
  fn.bind(null, context);
let server: HttpServer, innerServer: any;

beforeAll(async () => {
  // Create server
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
  } as any;

  server = new HttpServer(loggingService, 'tests');
  const router = new Router('', logger, enhanceWithContext);
  const { registerRouter, server: innerServerTest } = await server.setup(
    config,
  );
  innerServer = innerServerTest;

  // Register routes
  getApiInfoRoute(router);

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

describe(`[endpoint] GET ${routes.apiInfo}`, () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return API info successfully', async () => {
    const mockApiInfo = {
      data: {
        affected_items: [
          {
            cluster: 'wazuh',
            type: 'master',
            version: '4.8.0',
            name: 'master-node',
            subscription: {
              status: 'active',
            },
          },
        ],
      },
    };

    mockedGetApiInfo.mockResolvedValue(mockApiInfo);

    const response = await supertest(innerServer.listener)
      .get(routes.apiInfo)
      .expect(200);

    expect(response.body).toEqual(mockApiInfo);
    expect(mockedGetApiInfo).toHaveBeenCalledTimes(1);
  });

  test('should handle Error instance correctly', async () => {
    const errorMessage = 'API host ID not found';
    const mockError = new Error(errorMessage);

    mockedGetApiInfo.mockRejectedValue(mockError);

    const response = await supertest(innerServer.listener)
      .get(routes.apiInfo)
      .expect(503);

    expect(response.body.message).toBe(errorMessage);
    expect(mockedGetApiInfo).toHaveBeenCalledTimes(1);
  });
});
