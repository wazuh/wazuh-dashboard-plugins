// To run this file:
// yarn test:jest --testEnvironment node --verbose server/routes/wazuh-utils
import { Router } from '../../../../../src/core/server/http/router/router';
import { HttpServer } from '../../../../../src/core/server/http/http_server';
import { loggingSystemMock } from '../../../../../src/core/server/logging/logging_system.mock';
import { ByteSizeValue } from '@kbn/config-schema';
import supertest from 'supertest';
import { WazuhUtilsRoutes } from './wazuh-utils';
import { WazuhUtilsCtrl } from '../../controllers/wazuh-utils/wazuh-utils';
import md5 from 'md5';
import { createDataDirectoryIfNotExists, createDirectoryIfNotExists } from '../../lib/filesystem';
import { WAZUH_DATA_ABSOLUTE_PATH, WAZUH_DATA_CONFIG_APP_PATH, WAZUH_DATA_CONFIG_DIRECTORY_PATH, WAZUH_DATA_DOWNLOADS_DIRECTORY_PATH, WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH, WAZUH_DATA_LOGS_DIRECTORY_PATH, WAZUH_DATA_LOGS_RAW_PATH } from '../../../common/constants';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const loggingService = loggingSystemMock.create();
const logger = loggingService.get();
const context = {
  wazuh: {
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

  const spyRouteDecoratorProtectedAdministratorRoleValidToken = jest.spyOn(WazuhUtilsCtrl.prototype as any, 'routeDecoratorProtectedAdministratorRoleValidToken')
  .mockImplementation((handler) => async (...args) => handler(...args));

  // Register routes
  WazuhUtilsRoutes(router);

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

describe('[endpoint] GET /utils/configuration', () => {
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

  it(`Get plugin configuration GET /utils/configuration - 200`, async () => {
    const response = await supertest(innerServer.listener)
      .get('/utils/configuration')
      .expect(200);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.pattern).toBeDefined();
    expect(response.body.data.hosts).toBeDefined();
  });
});


describe('[endpoint] PUT /utils/configuration', () => {
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
    settings | responseStatusCode
    ${{pattern: 'test-alerts-groupA-*'}} | ${200}
    ${{pattern: 'test-alerts-groupA-*','logs.level': 'debug'}} | ${200}
  `(`Update the plugin configuration: $settings. PUT /utils/configuration - $responseStatusCode`, async ({responseStatusCode, settings}) => {
    const response = await supertest(innerServer.listener)
      .put('/utils/configuration')
      .send(settings)
      .expect(responseStatusCode);

    expect(response.body.data.updatedConfiguration).toEqual(settings);
    expect(response.body.data.requireHealthCheck).toBeDefined();
    expect(response.body.data.requireReload).toBeDefined();
    expect(response.body.data.requireRestart).toBeDefined();
  });
});

describe('[endpoint] GET /utils/logs', () => {
  beforeAll(() => {
    // Create the configuration file with custom content
    const fileContent = `---
{"date":"2022-09-20T08:36:16.688Z","level":"info","location":"initialize","message":"Kibana index: .kibana"}
{"date":"2022-09-20T08:36:16.689Z","level":"info","location":"initialize","message":"App revision: 4400"}
`;
    fs.writeFileSync(WAZUH_DATA_LOGS_RAW_PATH, fileContent, 'utf8');
  });

  afterAll(() => {
    // Remove the configuration file
    fs.unlinkSync(WAZUH_DATA_LOGS_RAW_PATH);
  });

  it(`Get plugin logs. GET /utils/logs`, async () => {
    const response = await supertest(innerServer.listener)
      .get('/utils/logs')
      .expect(200);

    expect(response.body.lastLogs).toBeDefined();
  });
});
