// To launch this file
// yarn test:jest --testEnvironment node --verbose server/routes/wazuh-reporting
import { Router } from '../../../../src/core/server/http/router/router';
import { HttpServer } from '../../../../src/core/server/http/http_server';
import { loggingSystemMock } from '../../../../src/core/server/logging/logging_system.mock';
import { ByteSizeValue } from '@osd/config-schema';
import supertest from 'supertest';
import { WazuhUtilsRoutes } from './wazuh-utils';
import { WazuhReportingRoutes } from './wazuh-reporting';
import md5 from 'md5';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

// Mock the DataPathService for tests
const mockDataPathService = {
  getWazuhPath: () => '/tmp/wazuh',
  getConfigPath: () => '/tmp/wazuh/config',
  getDownloadsPath: () => '/tmp/wazuh/downloads',
  getDataDirectoryRelative: (directory?: string) =>
    `/tmp/wazuh/${directory || ''}`,
  createDataDirectoryIfNotExists: jest.fn(path => {
    const absolutePath = `/tmp/wazuh/${path || ''}`;
    if (!fs.existsSync(absolutePath)) {
      fs.mkdirSync(absolutePath, { recursive: true });
    }
    return absolutePath;
  }),
};

jest.mock('../lib/reporting/extended-information', () => ({
  extendedInformation: jest.fn(),
}));
const USER_NAME = 'admin';
const loggingService = loggingSystemMock.create();
const logger = loggingService.get();
const context = {
  wazuh: {
    security: {
      getCurrentUser: async request => {
        // x-test-username header doesn't exist when the platform or plugin are running.
        // It is used to generate the output of this method so we can simulate the user
        // that does the request to the endpoint and is expected by the endpoint handlers
        // of the plugin.
        const username = request.headers['x-test-username'];
        return { username, hashUsername: md5(username) };
      },
    },
    logger: {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      get() {
        return {
          debug: jest.fn(),
          info: jest.fn(),
          warn: jest.fn(),
          error: jest.fn(),
        };
      },
    },
  },
  wazuh_core: {
    dataPathService: mockDataPathService,
    configuration: {
      _settings: new Map(),
      logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      },
      getCustomizationSetting: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
    },
    dashboardSecurity: {
      isAdministratorUser: jest.fn(),
    },
  },
};

const enhanceWithContext = (fn: (...args: any[]) => any) =>
  fn.bind(null, context);
let server, innerServer;

// BEFORE ALL
beforeAll(async () => {
  // Create <PLUGIN_PLATFORM_PATH>/data/wazuh directory.
  mockDataPathService.createDataDirectoryIfNotExists(
    mockDataPathService.getWazuhPath(),
  );

  // Create <PLUGIN_PLATFORM_PATH>/data/wazuh/config directory.
  mockDataPathService.createDataDirectoryIfNotExists(
    mockDataPathService.getConfigPath(),
  );

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

  // Mock decorator
  jest.mock('../controllers/decorators', () => ({
    routeDecoratorProtectedAdministrator:
      handler =>
      async (...args) =>
        handler(...args),
  }));

  // Register routes
  WazuhUtilsRoutes(router, { configuration: context.wazuh_core.configuration });
  WazuhReportingRoutes(router);

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

  // Remove <PLUGIN_PLATFORM_PATH>/data/wazuh directory.
  execSync(`rm -rf ${mockDataPathService.getWazuhPath()}`);
});

describe('[endpoint] GET /reports', () => {
  const directories = [
    { username: 'admin', files: 0 },
    { username: '../../etc', files: 1 },
  ];
  beforeAll(() => {
    // Create <PLUGIN_PLATFORM_PATH>/data/wazuh directory.
    mockDataPathService.createDataDirectoryIfNotExists(
      mockDataPathService.getWazuhPath(),
    );

    // Create <PLUGIN_PLATFORM_PATH>/data/wazuh/downloads directory.
    mockDataPathService.createDataDirectoryIfNotExists(
      mockDataPathService.getDownloadsPath(),
    );

    // Create <PLUGIN_PLATFORM_PATH>/data/wazuh/downloads/reports directory.
    mockDataPathService.createDataDirectoryIfNotExists(
      mockDataPathService.getDataDirectoryRelative('downloads/reports'),
    );

    // Create directories and file/s within directory.
    directories.forEach(({ username, files }) => {
      const hashUsername = md5(username);
      // Create user directory using relative path
      mockDataPathService.createDataDirectoryIfNotExists(
        `downloads/reports/${hashUsername}`,
      );
      if (files) {
        Array.from(Array(files).keys()).forEach(indexFile => {
          const filePath = path.join(
            mockDataPathService.getDataDirectoryRelative('downloads/reports'),
            hashUsername,
            `report_${indexFile}.pdf`,
          );
          fs.closeSync(fs.openSync(filePath, 'w'));
        });
      }
    });
  });

  afterAll(async () => {
    // Remove <PLUGIN_PLATFORM_PATH>/data/wazuh/downloads directory.
    execSync(`rm -rf ${mockDataPathService.getDownloadsPath()}`);
  });

  it.each(directories)(
    'get reports of $username. status response: $responseStatus',
    async ({ username, files }) => {
      const response = await supertest(innerServer.listener)
        .get(`/reports`)
        .set('x-test-username', username)
        .expect(200);
      expect(response.body.reports).toHaveLength(files);
    },
  );
});
