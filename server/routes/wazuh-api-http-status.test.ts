// To launch this file
// yarn test:jest --testEnvironment node --verbose server/routes/wazuh-api-http-status.test.ts
import { Router } from '../../../../src/core/server/http/router/router';
import { HttpServer } from '../../../../src/core/server/http/http_server';
import { loggingSystemMock } from '../../../../src/core/server/logging/logging_system.mock';
import { ByteSizeValue } from '@kbn/config-schema';
import supertest from 'supertest';
import { WazuhApiRoutes } from './wazuh-api';
import { createDataDirectoryIfNotExists, createDirectoryIfNotExists } from '../lib/filesystem';
import {
  HTTP_STATUS_CODES,
  WAZUH_DATA_ABSOLUTE_PATH,
  WAZUH_DATA_CONFIG_APP_PATH,
  WAZUH_DATA_CONFIG_DIRECTORY_PATH,
  WAZUH_DATA_LOGS_DIRECTORY_PATH
} from '../../common/constants';
import { execSync } from 'child_process';
import fs from 'fs';

const loggingService = loggingSystemMock.create();
const logger = loggingService.get();
const context = {
  wazuh: {
    security: {
      getCurrentUser: () => 'wazuh'
    }
  }
};

const enhanceWithContext = (fn: (...args: any[]) => any) => fn.bind(null, context);
let server, innerServer;

beforeAll(async () => {

  // Create <PLUGIN_PLATFORM_PATH>/data/wazuh directory.
  createDataDirectoryIfNotExists();
  // Create <PLUGIN_PLATFORM_PATH>/data/wazuh/config directory.
  createDirectoryIfNotExists(WAZUH_DATA_CONFIG_DIRECTORY_PATH);
  // Create <PLUGIN_PLATFORM_PATH>/data/wazuh/logs directory.
  createDirectoryIfNotExists(WAZUH_DATA_LOGS_DIRECTORY_PATH);

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
  const { registerRouter, server: innerServerTest, ...rest } = await server.setup(config);
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

  // Remove <PLUGIN_PLATFORM_PATH>/data/wazuh directory.
  execSync(`rm -rf ${WAZUH_DATA_ABSOLUTE_PATH}`);
});

describe('[endpoint] GET /api/check-api', () => {
  beforeAll(() => {
    // Create the configuration file with custom content
    const fileContent = `---
pattern: test-alerts-*
hosts:
  - default:
      url: https://localhost
      port: 55000
      username: wazuh-wui
      password: wazuh-wui
      run_as: false
`;

    fs.writeFileSync(WAZUH_DATA_CONFIG_APP_PATH, fileContent, 'utf8');
  });

  afterAll(() => {
    // Remove the configuration file
    fs.unlinkSync(WAZUH_DATA_CONFIG_APP_PATH);
  });

  it.each`
    apiId | statusCode
    ${'default'} | ${HTTP_STATUS_CODES.SERVICE_UNAVAILABLE}
  `(`Get API configuration POST /api/check-api - apiID - $statusCode`, async ({ apiId, statusCode }) => {
    const body = { id: apiId, forceRefresh: false };
    const response = await supertest(innerServer.listener)
      .post('/api/check-api')
      .send(body)
      .expect(statusCode);
  });
});
