// To launch this file
// yarn test:jest --testEnvironment node --verbose server/routes/wazuh-reporting
import { Router } from '../../../../src/core/server/http/router/router';
import { HttpServer } from '../../../../src/core/server/http/http_server';
import { loggingSystemMock } from '../../../../src/core/server/logging/logging_system.mock';
import { ByteSizeValue } from '@kbn/config-schema';
import supertest from 'supertest';
import { WazuhUtilsRoutes } from './wazuh-utils';
import { WazuhReportingRoutes } from './wazuh-reporting';
import { WazuhUtilsCtrl } from '../controllers/wazuh-utils/wazuh-utils';
import md5 from 'md5';
import { ReportPrinter } from '../lib/reporting/printer';


import { createDataDirectoryIfNotExists, createDirectoryIfNotExists } from '../lib/filesystem';
import {
  WAZUH_DATA_CONFIG_APP_PATH,
  WAZUH_DATA_CONFIG_DIRECTORY_PATH,
  WAZUH_DATA_DOWNLOADS_DIRECTORY_PATH,
  WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH,
  WAZUH_DATA_LOGS_DIRECTORY_PATH,
  WAZUH_DATA_LOGS_RAW_PATH,
  PLUGIN_PLATFORM_REQUEST_HEADERS,
  WAZUH_DATA_ABSOLUTE_PATH
} from '../../common/constants';
import { execSync } from 'child_process';
import fs from 'fs';

jest.mock('../lib/reporting/extended-information', () => ({
  extendedInformation: jest.fn()
}));

const loggingService = loggingSystemMock.create();
const logger = loggingService.get();
const context = {
  wazuh: {
    security: {
      getCurrentUser: (request) => {
        // x-test-username header doesn't exist when the platform or plugin are running.
        // It is used to generate the output of this method so we can simulate the user
        // that does the request to the endpoint and is expected by the endpoint handlers
        // of the plugin.
        const username = request.headers['x-test-username'];
        return { username, hashUsername: md5(username) }
      }
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

  const spyRouteDecoratorProtectedAdministratorRoleValidToken = jest.spyOn(WazuhUtilsCtrl.prototype as any, 'routeDecoratorProtectedAdministratorRoleValidToken')
    .mockImplementation((handler) => async (...args) => handler(...args));
  // const spycheckReportsUserDirectoryIsValidRouteDecorator = jest.spyOn(WazuhReportingCtrl.prototype as any, 'checkReportsUserDirectoryIsValidRouteDecorator')
  //   .mockImplementation((handler) => async (...args) => handler(...args));

  // Register routes
  WazuhUtilsRoutes(router);
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
  execSync(`rm -rf ${WAZUH_DATA_ABSOLUTE_PATH}`);
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

  it(`Set custom report header and footer - PUT /utils/configuration - $responseStatusCode`, async () => {
    const configurationBody = {
      ['customization.reports.footer']: 'Test\nTest',
      ['customization.reports.header']: 'info@company.com\nFake Avenue 123'
    };
    const fromDate = new Date();
    const toDate = new Date();

    fromDate.setHours(toDate.getHours() - 1);
    const reportBody = { "array": [], "filters": [], "time": { "from": fromDate.toISOString(), "to": toDate.toISOString() }, "searchBar": "", "tables": [], "tab": "general", "section": "overview", "agents": false, "browserTimezone": "Europe/Madrid", "indexPatternTitle": "wazuh-alerts-*", "apiId": "default" };

    const responseConfig = await supertest(innerServer.listener)
      .put('/utils/configuration')
      .send(configurationBody)
      .expect(200);

    expect(responseConfig.body?.data?.updatedConfiguration?.['customization.reports.footer']).toMatch(configurationBody['customization.reports.footer']);
    expect(responseConfig.body?.data?.updatedConfiguration?.['customization.reports.header']).toMatch(configurationBody['customization.reports.header']);

    const responseReport = await supertest(innerServer.listener)
      .post(`/reports/modules/general`)
      .set('x-test-username', 'admin')
      .send(reportBody)
      .expect(200);
  });
});
