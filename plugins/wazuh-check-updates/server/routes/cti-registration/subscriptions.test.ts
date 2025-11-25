import { Router } from '../../../../../src/core/server/http/router/router';
import { HttpServer } from '../../../../../src/core/server/http/http_server';
import { loggingSystemMock } from '../../../../../src/core/server/logging/logging_system.mock';
import { ByteSizeValue } from '@osd/config-schema';
import { routes, routes } from '../../../common/constants';
import { subscriptionToIndexerRoute } from './subscriptions';
import { subscriptionToIndexer } from '../../services/cti-registration/subscriptions';
import supertest from 'supertest';

const serverAddress = '127.0.0.1';
const port = 11005; // assign a different port in each unit test

const mockedSubscriptionToIndexer = subscriptionToIndexer as jest.Mock;
jest.mock('../../services/cti-registration/subscriptions');

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
  subscriptionToIndexerRoute(router);

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

describe(`[endpoint] GET ${routes.subscription}`, () => {
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

    mockedSubscriptionToIndexer.mockResolvedValue(mockApiInfo);

    const response = await supertest(innerServer.listener)
      .get(routes.subscription)
      .expect(200);

    expect(response.body).toEqual(mockApiInfo);
    expect(mockedSubscriptionToIndexer).toHaveBeenCalledTimes(1);
  });

  test('should handle Error instance correctly', async () => {
    const errorMessage = 'API host ID not found';
    const mockError = new Error(errorMessage);

    mockedSubscriptionToIndexer.mockRejectedValue(mockError);

    const response = await supertest(innerServer.listener)
      .get(routes.subscription)
      .expect(503);

    expect(response.body.message).toBe(errorMessage);
    expect(mockedSubscriptionToIndexer).toHaveBeenCalledTimes(1);
  });
});
