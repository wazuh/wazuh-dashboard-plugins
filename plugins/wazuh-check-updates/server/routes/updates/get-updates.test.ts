import { Router } from '../../../../../src/core/server/http/router/router';
import { HttpServer } from '../../../../../src/core/server/http/http_server';
import { loggingSystemMock } from '../../../../../src/core/server/logging/logging_system.mock';
import { ByteSizeValue } from '@osd/config-schema';
import { getUpdates } from '../../services/updates';
import { routes } from '../../../common/constants';
import { getUpdatesRoute } from './get-updates';
import supertest from 'supertest';
import { API_UPDATES_STATUS, AvailableUpdates } from '../../../common/types';

const serverAddress = '127.0.0.1';
const port = 11002; //assign a different port in each unit test

const mockedGetUpdates = getUpdates as jest.Mock;
jest.mock('../../services/updates');

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

  test('get available updates', async () => {
    const mockResponse: AvailableUpdates = {
      last_check_date: new Date('2023-09-30T14:00:00.000Z'),
      apis_available_updates: [
        {
          api_id: 'api id',
          current_version: '4.3.1',
          status: API_UPDATES_STATUS.UP_TO_DATE,
          last_available_patch: {
            description:
              '## Manager\r\n\r\n### Fixed\r\n\r\n- Fixed a crash when overwrite rules are triggered...',
            published_date: '2022-05-18T10:12:43Z',
            semver: {
              major: 4,
              minor: 3,
              patch: 8,
            },
            tag: 'v4.3.8',
            title: 'Wazuh v4.3.8',
          },
        },
      ],
    };

    mockedGetUpdates.mockImplementation(() => mockResponse);
    const response = await supertest(innerServer.listener)
      .get(`${routes.checkUpdates}?query_api=true`)
      .send(mockResponse)
      .expect(200);

    expect(response.body).toEqual({
      ...mockResponse,
      last_check_date: '2023-09-30T14:00:00.000Z',
    });
  });
});
