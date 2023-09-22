import { Router } from '../../../../../src/core/server/http/router/router';
import { HttpServer } from '../../../../../src/core/server/http/http_server';
import { loggingSystemMock } from '../../../../../src/core/server/logging/logging_system.mock';
import { ByteSizeValue } from '@osd/config-schema';
import { routes } from '../../../common/constants';
import axios from 'axios';
import { getUserPreferences } from '../../services/user-preferences';
import { getUserPreferencesRoutes } from './get-user-preferences';

const serverAddress = '127.0.0.1';
const port = Math.floor(Math.random() * 60000) + 5000;
axios.defaults.baseURL = `http://${serverAddress}:${port}`;

const mockedGetUserPreferences = getUserPreferences as jest.Mock;
jest.mock('../../services/user-preferences');

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
const enhanceWithContext = (fn: (...args: any[]) => any) => fn.bind(null, context);
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
  const { registerRouter, server: innerServerTest } = await server.setup(config);
  innerServer = innerServerTest;

  // Register routes
  getUserPreferencesRoutes(router);

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

describe(`[endpoint] GET ${routes.userPreferences}`, () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('get user preferences', async () => {
    const mockResponse = {
      last_dismissed_update: 'v4.3.1',
      hide_update_notifications: false,
    };

    mockedGetUserPreferences.mockImplementation(() => mockResponse);
    const response = await axios.get(routes.userPreferences);

    expect(response.data).toEqual(mockResponse);
  });
});
