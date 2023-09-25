import { Router } from '../../../../../src/core/server/http/router/router';
import { HttpServer } from '../../../../../src/core/server/http/http_server';
import { loggingSystemMock } from '../../../../../src/core/server/logging/logging_system.mock';
import { ByteSizeValue } from '@osd/config-schema';
import { getUpdates } from '../../services/updates';
import { getSavedObject } from '../../services/saved-object';
import { routes } from '../../../common/constants';
import { getUpdatesRoute } from './get-updates';
import axios from 'axios';

const serverAddress = '127.0.0.1';
const port = 10002; //assign a different port in each unit test
axios.defaults.baseURL = `http://${serverAddress}:${port}`;

const mockedGetUpdates = getUpdates as jest.Mock;
jest.mock('../../services/updates');

const mockedGetSavedObject = getSavedObject as jest.Mock;
jest.mock('../../services/saved-object');

const loggingService = loggingSystemMock.create();
const logger = loggingService.get();
const context = {
  wazuh: {
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
  getUpdatesRoute(router);

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

describe(`[endpoint] GET ${routes.checkUpdates}`, () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('get available updates from saved object', async () => {
    const mockResponse = {
      last_check: '2021-09-30T14:00:00.000Z',
      mayor: [
        {
          title: 'Wazuh 4.2.6',
          description:
            'Wazuh 4.2.6 is now available. This version includes several bug fixes and improvements.',
          published_date: '2021-09-30T14:00:00.000Z',
          semver: {
            mayor: 4,
            minor: 2,
            patch: 6,
          },
          tag: '4.2.6',
        },
      ],
      minor: [],
      patch: [],
    };

    mockedGetSavedObject.mockImplementation(() => mockResponse);
    const response = await axios.get(routes.checkUpdates);

    expect(response.data).toEqual(mockResponse);
  });

  test('get available updates from the external service', async () => {
    const mockResponse = {
      last_check: '2021-09-30T14:00:00.000Z',
      mayor: [
        {
          title: 'Wazuh 4.2.6',
          description:
            'Wazuh 4.2.6 is now available. This version includes several bug fixes and improvements.',
          published_date: '2021-09-30T14:00:00.000Z',
          semver: {
            mayor: 4,
            minor: 2,
            patch: 6,
          },
          tag: '4.2.6',
        },
      ],
      minor: [],
      patch: [],
    };

    mockedGetUpdates.mockImplementation(() => mockResponse);
    const response = await axios.get(`${routes.checkUpdates}?checkAvailableUpdates=true`);

    expect(response.data).toEqual(mockResponse);
  });
});
