// To run this file:
// yarn test:jest --testEnvironment node --verbose server/routes/wazuh-utils
import { Router } from '../../../../../src/core/server/http/router/router';
import { HttpServer } from '../../../../../src/core/server/http/http_server';
import { loggingSystemMock } from '../../../../../src/core/server/logging/logging_system.mock';
import { ByteSizeValue } from '@kbn/config-schema';
import supertest from 'supertest';
import { WazuhUtilsRoutes } from './wazuh-utils';
import { WazuhUtilsCtrl } from '../../controllers/wazuh-utils/wazuh-utils';
import { createDataDirectoryIfNotExists, createDirectoryIfNotExists } from '../../lib/filesystem';
import {
  PLUGIN_SETTINGS,
  WAZUH_DATA_ABSOLUTE_PATH,
  WAZUH_DATA_CONFIG_APP_PATH,
  WAZUH_DATA_CONFIG_DIRECTORY_PATH,
  WAZUH_DATA_LOGS_DIRECTORY_PATH,
  WAZUH_DATA_LOGS_RAW_PATH,
} from "../../../common/constants";
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import glob from 'glob';

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
    response?.body?.data?.hosts?.map(host => {
      const hostID = Object.keys(host)[0];
      expect(Object.keys(host).length).toEqual(1);
      expect(host[hostID].password).toEqual('*****');
    });
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
    settings                                                      | responseStatusCode
    ${{ pattern: 'test-alerts-groupA-*' }}                        | ${200}
    ${{ pattern: 'test-alerts-groupA-*', 'logs.level': 'debug' }} | ${200}
  `(`Update the plugin configuration: $settings. PUT /utils/configuration - $responseStatusCode`, async ({ responseStatusCode, settings }) => {
    const response = await supertest(innerServer.listener)
      .put('/utils/configuration')
      .send(settings)
      .expect(responseStatusCode);

    expect(response.body.data.updatedConfiguration).toEqual(settings);
    expect(response.body.data.requiresRunningHealthCheck).toBeDefined();
    expect(response.body.data.requiresReloadingBrowserTab).toBeDefined();
    expect(response.body.data.requiresRestartingPluginPlatform).toBeDefined();
  });

  it.each([
    {
      testTitle: 'Update the plugin configuration',
      settings: { pattern: 'test-alerts-groupA-*' },
      responseStatusCode: 200,
      responseBodyMessage: null
    },
    {
      testTitle: 'Update the plugin configuration',
      settings: { pattern: 'test-alerts-groupA-*', 'logs.level': 'debug' },
      responseStatusCode: 200,
      responseBodyMessage: null
    },
    {
      testTitle: 'Bad request, wrong value type.',
      settings: { pattern: 5 },
      responseStatusCode: 400,
      responseBodyMessage: '[request body.pattern]: expected value of type [string] but got [number]'
    },
    {
      testTitle: 'Bad request, unknown setting',
      settings: { 'unknown.setting': 'test-alerts-groupA-*' },
      responseStatusCode: 400,
      responseBodyMessage: '[request body.unknown.setting]: definition for this key is missing'
    },
    {
      testTitle: 'Bad request, unknown setting',
      settings: { 'unknown.setting': 'test-alerts-groupA-*', 'logs.level': 'debug' },
      responseStatusCode: 400,
      responseBodyMessage: '[request body.unknown.setting]: definition for this key is missing'
    },
    {
      testTitle: 'Bad request, unknown setting',
      settings: { 'cron.statistics.apis': [0, 'test'] },
      responseStatusCode: 400,
      responseBodyMessage: '[request body.cron.statistics.apis.0]: expected value of type [string] but got [number]'
    }
  ])(`$testTitle: $settings. PUT /utils/configuration - $responseStatusCode`, async ({ responseBodyMessage, responseStatusCode, settings }) => {
    const response = await supertest(innerServer.listener)
      .put('/utils/configuration')
      .send(settings)
      .expect(responseStatusCode);

    responseStatusCode === 200 && expect(response.body.data.updatedConfiguration).toEqual(settings);
    responseStatusCode === 200 && expect(response.body.data.requiresRunningHealthCheck).toBeDefined();
    responseStatusCode === 200 && expect(response.body.data.requiresReloadingBrowserTab).toBeDefined();
    responseStatusCode === 200 && expect(response.body.data.requiresRestartingPluginPlatform).toBeDefined();
    responseBodyMessage && expect(response.body.message).toMatch(responseBodyMessage);
  });

  it.each`
    setting                             | value                             | responseStatusCode | responseBodyMessage
    ${'alerts.sample.prefix'}           | ${'test'}                                  | ${200}             | ${null}
    ${'alerts.sample.prefix'}           | ${''}                                      | ${400}             | ${"[request body.alerts.sample.prefix]: Value can not be empty."}
    ${'alerts.sample.prefix'}           | ${'test space'}                            | ${400}             | ${"[request body.alerts.sample.prefix]: No whitespaces allowed."}
    ${'alerts.sample.prefix'}           | ${4}                                       | ${400}             | ${'[request body.alerts.sample.prefix]: expected value of type [string] but got [number]'}
    ${'alerts.sample.prefix'}           | ${'-test'}                                 | ${400}             | ${"[request body.alerts.sample.prefix]: It can't start with: -, _, +, .."}
    ${'alerts.sample.prefix'}           | ${'_test'}                                 | ${400}             | ${"[request body.alerts.sample.prefix]: It can't start with: -, _, +, .."}
    ${'alerts.sample.prefix'}           | ${'+test'}                                 | ${400}             | ${"[request body.alerts.sample.prefix]: It can't start with: -, _, +, .."}
    ${'alerts.sample.prefix'}           | ${'.test'}                                 | ${400}             | ${"[request body.alerts.sample.prefix]: It can't start with: -, _, +, .."}
    ${'alerts.sample.prefix'}           | ${'test\\'}                                | ${400}             | ${"[request body.alerts.sample.prefix]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #, *."}
    ${'alerts.sample.prefix'}           | ${'test/'}                                 | ${400}             | ${"[request body.alerts.sample.prefix]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #, *."}
    ${'alerts.sample.prefix'}           | ${'test?'}                                 | ${400}             | ${"[request body.alerts.sample.prefix]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #, *."}
    ${'alerts.sample.prefix'}           | ${'test"'}                                 | ${400}             | ${"[request body.alerts.sample.prefix]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #, *."}
    ${'alerts.sample.prefix'}           | ${'test<'}                                 | ${400}             | ${"[request body.alerts.sample.prefix]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #, *."}
    ${'alerts.sample.prefix'}           | ${'test>'}                                 | ${400}             | ${"[request body.alerts.sample.prefix]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #, *."}
    ${'alerts.sample.prefix'}           | ${'test|'}                                 | ${400}             | ${"[request body.alerts.sample.prefix]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #, *."}
    ${'alerts.sample.prefix'}           | ${'test,'}                                 | ${400}             | ${"[request body.alerts.sample.prefix]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #, *."}
    ${'alerts.sample.prefix'}           | ${'test#'}                                 | ${400}             | ${"[request body.alerts.sample.prefix]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #, *."}
    ${'alerts.sample.prefix'}           | ${'test*'}                                 | ${400}             | ${"[request body.alerts.sample.prefix]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #, *."}
    ${'checks.api'}                     | ${true}                                    | ${200}             | ${null}
    ${'checks.api'}                     | ${0}                                       | ${400}             | ${'[request body.checks.api]: expected value of type [boolean] but got [number]'}
    ${'checks.fields'}                  | ${true}                                    | ${200}             | ${null}
    ${'checks.fields'}                  | ${0}                                       | ${400}             | ${'[request body.checks.fields]: expected value of type [boolean] but got [number]'}
    ${'checks.maxBuckets'}              | ${true}                                    | ${200}             | ${null}
    ${'checks.maxBuckets'}              | ${0}                                       | ${400}             | ${'[request body.checks.maxBuckets]: expected value of type [boolean] but got [number]'}
    ${'checks.pattern'}                 | ${true}                                    | ${200}             | ${null}
    ${'checks.pattern'}                 | ${0}                                       | ${400}             | ${'[request body.checks.pattern]: expected value of type [boolean] but got [number]'}
    ${'checks.setup'}                   | ${true}                                    | ${200}             | ${null}
    ${'checks.setup'}                   | ${0}                                       | ${400}             | ${'[request body.checks.setup]: expected value of type [boolean] but got [number]'}
    ${'checks.template'}                | ${true}                                    | ${200}             | ${null}
    ${'checks.template'}                | ${0}                                       | ${400}             | ${'[request body.checks.template]: expected value of type [boolean] but got [number]'}
    ${'checks.timeFilter'}              | ${true}                                    | ${200}             | ${null}
    ${'checks.timeFilter'}              | ${0}                                       | ${400}             | ${'[request body.checks.timeFilter]: expected value of type [boolean] but got [number]'}
    ${'cron.prefix'}                    | ${'test'}                                  | ${200}             | ${null}
    ${'cron.prefix'}                    | ${'test space'}                            | ${400}             | ${"[request body.cron.prefix]: No whitespaces allowed."}
    ${'cron.prefix'}                    | ${''}                                      | ${400}             | ${"[request body.cron.prefix]: Value can not be empty."}
    ${'cron.prefix'}                    | ${4}                                       | ${400}             | ${'[request body.cron.prefix]: expected value of type [string] but got [number]'}
    ${'cron.prefix'}                    | ${'-test'}                                 | ${400}             | ${"[request body.cron.prefix]: It can't start with: -, _, +, .."}
    ${'cron.prefix'}                    | ${'_test'}                                 | ${400}             | ${"[request body.cron.prefix]: It can't start with: -, _, +, .."}
    ${'cron.prefix'}                    | ${'+test'}                                 | ${400}             | ${"[request body.cron.prefix]: It can't start with: -, _, +, .."}
    ${'cron.prefix'}                    | ${'.test'}                                 | ${400}             | ${"[request body.cron.prefix]: It can't start with: -, _, +, .."}
    ${'cron.prefix'}                    | ${'test\\'}                                | ${400}             | ${"[request body.cron.prefix]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #, *."}
    ${'cron.prefix'}                    | ${'test/'}                                 | ${400}             | ${"[request body.cron.prefix]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #, *."}
    ${'cron.prefix'}                    | ${'test?'}                                 | ${400}             | ${"[request body.cron.prefix]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #, *."}
    ${'cron.prefix'}                    | ${'test"'}                                 | ${400}             | ${"[request body.cron.prefix]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #, *."}
    ${'cron.prefix'}                    | ${'test<'}                                 | ${400}             | ${"[request body.cron.prefix]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #, *."}
    ${'cron.prefix'}                    | ${'test>'}                                 | ${400}             | ${"[request body.cron.prefix]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #, *."}
    ${'cron.prefix'}                    | ${'test|'}                                 | ${400}             | ${"[request body.cron.prefix]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #, *."}
    ${'cron.prefix'}                    | ${'test,'}                                 | ${400}             | ${"[request body.cron.prefix]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #, *."}
    ${'cron.prefix'}                    | ${'test#'}                                 | ${400}             | ${"[request body.cron.prefix]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #, *."}
    ${'cron.prefix'}                    | ${'test*'}                                 | ${400}             | ${"[request body.cron.prefix]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #, *."}
    ${'cron.statistics.apis'}           | ${['test']}                                | ${200}             | ${null}
    ${'cron.statistics.apis'}           | ${['test ']}                               | ${400}             | ${"[request body.cron.statistics.apis.0]: No whitespaces allowed."}
    ${'cron.statistics.apis'}           | ${['']}                                    | ${400}             | ${"[request body.cron.statistics.apis.0]: Value can not be empty."}
    ${'cron.statistics.apis'}           | ${['test', 4]}                             | ${400}             | ${"[request body.cron.statistics.apis.1]: expected value of type [string] but got [number]"}
    ${'cron.statistics.apis'}           | ${'test space'}                            | ${400}             | ${"[request body.cron.statistics.apis]: could not parse array value from json input"}
    ${'cron.statistics.apis'}           | ${true}                                    | ${400}             | ${"[request body.cron.statistics.apis]: expected value of type [array] but got [boolean]"}
    ${'cron.statistics.index.creation'} | ${'h'}                                     | ${200}             | ${null}
    ${'cron.statistics.index.creation'} | ${'d'}                                     | ${200}             | ${null}
    ${'cron.statistics.index.creation'} | ${'w'}                                     | ${200}             | ${null}
    ${'cron.statistics.index.creation'} | ${'m'}                                     | ${200}             | ${null}
    ${'cron.statistics.index.creation'} | ${'test'}                                  | ${400}             | ${"[request body.cron.statistics.index.creation]: types that failed validation:\n- [request body.cron.statistics.index.creation.0]: expected value to equal [h]\n- [request body.cron.statistics.index.creation.1]: expected value to equal [d]\n- [request body.cron.statistics.index.creation.2]: expected value to equal [w]\n- [request body.cron.statistics.index.creation.3]: expected value to equal [m]"}
    ${'cron.statistics.index.name'}     | ${'test'}                                  | ${200}             | ${null}
    ${'cron.statistics.index.name'}     | ${''}                                      | ${400}             | ${"[request body.cron.statistics.index.name]: Value can not be empty."}
    ${'cron.statistics.index.name'}     | ${'test space'}                            | ${400}             | ${"[request body.cron.statistics.index.name]: No whitespaces allowed."}
    ${'cron.statistics.index.name'}     | ${true}                                    | ${400}             | ${"[request body.cron.statistics.index.name]: expected value of type [string] but got [boolean]"}
    ${'cron.statistics.index.name'}     | ${'-test'}                                 | ${400}             | ${"[request body.cron.statistics.index.name]: It can't start with: -, _, +, .."}
    ${'cron.statistics.index.name'}     | ${'_test'}                                 | ${400}             | ${"[request body.cron.statistics.index.name]: It can't start with: -, _, +, .."}
    ${'cron.statistics.index.name'}     | ${'+test'}                                 | ${400}             | ${"[request body.cron.statistics.index.name]: It can't start with: -, _, +, .."}
    ${'cron.statistics.index.name'}     | ${'.test'}                                 | ${400}             | ${"[request body.cron.statistics.index.name]: It can't start with: -, _, +, .."}
    ${'cron.statistics.index.name'}     | ${'test\\'}                                | ${400}             | ${"[request body.cron.statistics.index.name]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #, *."}
    ${'cron.statistics.index.name'}     | ${'test/'}                                 | ${400}             | ${"[request body.cron.statistics.index.name]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #, *."}
    ${'cron.statistics.index.name'}     | ${'test?'}                                 | ${400}             | ${"[request body.cron.statistics.index.name]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #, *."}
    ${'cron.statistics.index.name'}     | ${'test"'}                                 | ${400}             | ${"[request body.cron.statistics.index.name]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #, *."}
    ${'cron.statistics.index.name'}     | ${'test<'}                                 | ${400}             | ${"[request body.cron.statistics.index.name]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #, *."}
    ${'cron.statistics.index.name'}     | ${'test>'}                                 | ${400}             | ${"[request body.cron.statistics.index.name]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #, *."}
    ${'cron.statistics.index.name'}     | ${'test|'}                                 | ${400}             | ${"[request body.cron.statistics.index.name]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #, *."}
    ${'cron.statistics.index.name'}     | ${'test,'}                                 | ${400}             | ${"[request body.cron.statistics.index.name]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #, *."}
    ${'cron.statistics.index.name'}     | ${'test#'}                                 | ${400}             | ${"[request body.cron.statistics.index.name]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #, *."}
    ${'cron.statistics.index.name'}     | ${'test*'}                                 | ${400}             | ${"[request body.cron.statistics.index.name]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #, *."}
    ${'cron.statistics.index.replicas'} | ${0}                                       | ${200}             | ${null}
    ${'cron.statistics.index.replicas'} | ${-1}                                      | ${400}             | ${"[request body.cron.statistics.index.replicas]: Value should be greater or equal than 0."}
    ${'cron.statistics.index.replicas'} | ${'custom'}                                | ${400}             | ${"[request body.cron.statistics.index.replicas]: expected value of type [number] but got [string]"}
    ${'cron.statistics.index.replicas'} | ${1.2}                                     | ${400}             | ${"[request body.cron.statistics.index.replicas]: Number should be an integer."}
    ${'cron.statistics.index.shards'}   | ${1}                                       | ${200}             | ${null}
    ${'cron.statistics.index.shards'}   | ${-1}                                      | ${400}             | ${"[request body.cron.statistics.index.shards]: Value should be greater or equal than 1."}
    ${'cron.statistics.index.shards'}   | ${1.2}                                     | ${400}             | ${"[request body.cron.statistics.index.shards]: Number should be an integer."}
    ${'cron.statistics.interval'}       | ${'0 */5 * * * *'}                         | ${200}             | ${null}
    ${'cron.statistics.interval'}       | ${'0 */5 * * *'}                           | ${200}             | ${null}
    ${'cron.statistics.interval'}       | ${'custom'}                                | ${400}             | ${"[request body.cron.statistics.interval]: Interval is not valid."}
    ${'cron.statistics.interval'}       | ${true}                                    | ${400}             | ${"[request body.cron.statistics.interval]: expected value of type [string] but got [boolean]"}
    ${'cron.statistics.status'}         | ${true}                                    | ${200}             | ${null}
    ${'cron.statistics.status'}         | ${0}                                       | ${400}             | ${'[request body.cron.statistics.status]: expected value of type [boolean] but got [number]'}
    ${'customization.enabled'}          | ${true}                                    | ${200}             | ${null}
    ${'customization.enabled'}          | ${0}                                       | ${400}             | ${'[request body.customization.enabled]: expected value of type [boolean] but got [number]'}
    ${'customization.reports.footer'}   | ${'Test'}                                  | ${200}             | ${null}
    ${'customization.reports.footer'}   | ${'Test\nTest'}                            | ${200}             | ${null}
    ${'customization.reports.footer'}   | ${'Test\nTest\nTest\nTest\nTest'}          | ${400}             | ${"[request body.customization.reports.footer]: The string should have less or equal to 2 line/s."}
    ${'customization.reports.footer'}   | ${'Line with 30 characters       \nTest'}  | ${200}             | ${undefined}
    ${'customization.reports.footer'}   | ${'Testing the maximum length of a line of 50 characters\nTest'}| ${400}             | ${"[request body.customization.reports.footer]: The maximum length of a line is 50 characters."}
    ${'customization.reports.footer'}   | ${true}                                    | ${400}             | ${'[request body.customization.reports.footer]: expected value of type [string] but got [boolean]'}
    ${'customization.reports.header'}   | ${'Test'}                                  | ${200}             | ${null}
    ${'customization.reports.header'}   | ${'Test\nTest'}                            | ${200}             | ${null}
    ${'customization.reports.header'}   | ${'Test\nTest\nTest\nTest\nTest'}          | ${400}             | ${"[request body.customization.reports.header]: The string should have less or equal to 3 line/s."}
    ${'customization.reports.header'}   | ${'Line with 20 charact\nTest'}            | ${200}             | ${undefined}
    ${'customization.reports.header'}   | ${'Testing maximum length of a line of 40 characters\nTest'}    | ${400}             | ${"[request body.customization.reports.header]: The maximum length of a line is 40 characters."}
    ${'customization.reports.header'}   | ${true}                                    | ${400}             | ${'[request body.customization.reports.header]: expected value of type [string] but got [boolean]'}
    ${'disabled_roles'}                 | ${['test']}                                | ${200}             | ${null}
    ${'disabled_roles'}                 | ${['']}                                    | ${400}             | ${'[request body.disabled_roles.0]: Value can not be empty.'}
    ${'disabled_roles'}                 | ${['test space']}                          | ${400}             | ${"[request body.disabled_roles.0]: No whitespaces allowed."}
    ${'disabled_roles'}                 | ${['test', 4]}                             | ${400}             | ${"[request body.disabled_roles.1]: expected value of type [string] but got [number]"}
    ${'enrollment.dns'}                 | ${'test'}                                  | ${200}             | ${null}
    ${'enrollment.dns'}                 | ${''}                                      | ${200}             | ${null}
    ${'enrollment.dns'}                 | ${'test space'}                            | ${400}             | ${"[request body.enrollment.dns]: No whitespaces allowed."}
    ${'enrollment.dns'}                 | ${true}                                    | ${400}             | ${'[request body.enrollment.dns]: expected value of type [string] but got [boolean]'}
    ${'enrollment.password'}            | ${'test'}                                  | ${200}             | ${null}
    ${'enrollment.password'}            | ${''}                                      | ${400}             | ${"[request body.enrollment.password]: Value can not be empty."}
    ${'enrollment.password'}            | ${'test space'}                            | ${200}             | ${null}
    ${'enrollment.password'}            | ${true}                                    | ${400}             | ${'[request body.enrollment.password]: expected value of type [string] but got [boolean]'}
    ${'extensions.audit'}               | ${true}                                    | ${200}             | ${null}
    ${'extensions.audit'}               | ${0}                                       | ${400}             | ${'[request body.extensions.audit]: expected value of type [boolean] but got [number]'}
    ${'extensions.aws'}                 | ${true}                                    | ${200}             | ${null}
    ${'extensions.aws'}                 | ${0}                                       | ${400}             | ${'[request body.extensions.aws]: expected value of type [boolean] but got [number]'}
    ${'extensions.ciscat'}              | ${true}                                    | ${200}             | ${null}
    ${'extensions.ciscat'}              | ${0}                                       | ${400}             | ${'[request body.extensions.ciscat]: expected value of type [boolean] but got [number]'}
    ${'extensions.gcp'}                 | ${true}                                    | ${200}             | ${null}
    ${'extensions.gcp'}                 | ${0}                                       | ${400}             | ${'[request body.extensions.gcp]: expected value of type [boolean] but got [number]'}
    ${'extensions.gdpr'}                | ${true}                                    | ${200}             | ${null}
    ${'extensions.gdpr'}                | ${0}                                       | ${400}             | ${'[request body.extensions.gdpr]: expected value of type [boolean] but got [number]'}
    ${'extensions.hipaa'}               | ${true}                                    | ${200}             | ${null}
    ${'extensions.hipaa'}               | ${0}                                       | ${400}             | ${'[request body.extensions.hipaa]: expected value of type [boolean] but got [number]'}
    ${'extensions.nist'}                | ${true}                                    | ${200}             | ${null}
    ${'extensions.nist'}                | ${0}                                       | ${400}             | ${'[request body.extensions.nist]: expected value of type [boolean] but got [number]'}
    ${'extensions.oscap'}               | ${true}                                    | ${200}             | ${null}
    ${'extensions.oscap'}               | ${0}                                       | ${400}             | ${'[request body.extensions.oscap]: expected value of type [boolean] but got [number]'}
    ${'extensions.osquery'}             | ${true}                                    | ${200}             | ${null}
    ${'extensions.osquery'}             | ${0}                                       | ${400}             | ${'[request body.extensions.osquery]: expected value of type [boolean] but got [number]'}
    ${'extensions.pci'}                 | ${true}                                    | ${200}             | ${null}
    ${'extensions.pci'}                 | ${0}                                       | ${400}             | ${'[request body.extensions.pci]: expected value of type [boolean] but got [number]'}
    ${'extensions.tsc'}                 | ${true}                                    | ${200}             | ${null}
    ${'extensions.tsc'}                 | ${0}                                       | ${400}             | ${'[request body.extensions.tsc]: expected value of type [boolean] but got [number]'}
    ${'extensions.virustotal'}          | ${true}                                    | ${200}             | ${null}
    ${'extensions.virustotal'}          | ${0}                                       | ${400}             | ${'[request body.extensions.virustotal]: expected value of type [boolean] but got [number]'}
    ${'ip.ignore'}                      | ${['test']}                                | ${200}             | ${null}
    ${'ip.ignore'}                      | ${['test*']}                               | ${200}             | ${null}
    ${'ip.ignore'}                      | ${['']}                                    | ${400}             | ${'[request body.ip.ignore.0]: Value can not be empty.'}
    ${'ip.ignore'}                      | ${['test space']}                          | ${400}             | ${"[request body.ip.ignore.0]: No whitespaces allowed."}
    ${'ip.ignore'}                      | ${true}                                    | ${400}             | ${"[request body.ip.ignore]: expected value of type [array] but got [boolean]"}
    ${'ip.ignore'}                      | ${['-test']}                               | ${400}             | ${"[request body.ip.ignore.0]: It can't start with: -, _, +, .."}
    ${'ip.ignore'}                      | ${['_test']}                               | ${400}             | ${"[request body.ip.ignore.0]: It can't start with: -, _, +, .."}
    ${'ip.ignore'}                      | ${['+test']}                               | ${400}             | ${"[request body.ip.ignore.0]: It can't start with: -, _, +, .."}
    ${'ip.ignore'}                      | ${['.test']}                               | ${400}             | ${"[request body.ip.ignore.0]: It can't start with: -, _, +, .."}
    ${'ip.ignore'}                      | ${['test\\']}                              | ${400}             | ${"[request body.ip.ignore.0]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #."}
    ${'ip.ignore'}                      | ${['test/']}                               | ${400}             | ${"[request body.ip.ignore.0]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #."}
    ${'ip.ignore'}                      | ${['test?']}                               | ${400}             | ${"[request body.ip.ignore.0]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #."}
    ${'ip.ignore'}                      | ${['test"']}                               | ${400}             | ${"[request body.ip.ignore.0]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #."}
    ${'ip.ignore'}                      | ${['test<']}                               | ${400}             | ${"[request body.ip.ignore.0]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #."}
    ${'ip.ignore'}                      | ${['test>']}                               | ${400}             | ${"[request body.ip.ignore.0]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #."}
    ${'ip.ignore'}                      | ${['test|']}                               | ${400}             | ${"[request body.ip.ignore.0]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #."}
    ${'ip.ignore'}                      | ${['test,']}                               | ${400}             | ${"[request body.ip.ignore.0]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #."}
    ${'ip.ignore'}                      | ${['test#']}                               | ${400}             | ${"[request body.ip.ignore.0]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #."}
    ${'ip.ignore'}                      | ${['test', 'test#']}                       | ${400}             | ${"[request body.ip.ignore.1]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #."}
    ${'ip.selector'}                    | ${true}                                    | ${200}             | ${null}
    ${'ip.selector'}                    | ${''}                                      | ${400}             | ${'[request body.ip.selector]: expected value of type [boolean] but got [string]'}
    ${'logs.level'}                     | ${'info'}                                  | ${200}             | ${null}
    ${'logs.level'}                     | ${'debug'}                                 | ${200}             | ${null}
    ${'logs.level'}                     | ${''}                                      | ${400}             | ${'[request body.logs.level]: types that failed validation:\n- [request body.logs.level.0]: expected value to equal [info]\n- [request body.logs.level.1]: expected value to equal [debug]'}
    ${'pattern'}                        | ${'test'}                                  | ${200}             | ${null}
    ${'pattern'}                        | ${'test*'}                                 | ${200}             | ${null}
    ${'pattern'}                        | ${''}                                      | ${400}             | ${'[request body.pattern]: Value can not be empty.'}
    ${'pattern'}                        | ${'test space'}                            | ${400}             | ${"[request body.pattern]: No whitespaces allowed."}
    ${'pattern'}                        | ${true}                                    | ${400}             | ${'[request body.pattern]: expected value of type [string] but got [boolean]'}
    ${'pattern'}                        | ${'-test'}                                 | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'pattern'}                        | ${'_test'}                                 | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'pattern'}                        | ${'+test'}                                 | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'pattern'}                        | ${'.test'}                                 | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'pattern'}                        | ${'test\\'}                                | ${400}             | ${"[request body.pattern]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #."}
    ${'pattern'}                        | ${'test/'}                                 | ${400}             | ${"[request body.pattern]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #."}
    ${'pattern'}                        | ${'test?'}                                 | ${400}             | ${"[request body.pattern]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #."}
    ${'pattern'}                        | ${'test"'}                                 | ${400}             | ${"[request body.pattern]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #."}
    ${'pattern'}                        | ${'test<'}                                 | ${400}             | ${"[request body.pattern]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #."}
    ${'pattern'}                        | ${'test>'}                                 | ${400}             | ${"[request body.pattern]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #."}
    ${'pattern'}                        | ${'test|'}                                 | ${400}             | ${"[request body.pattern]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #."}
    ${'pattern'}                        | ${'test,'}                                 | ${400}             | ${"[request body.pattern]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #."}
    ${'pattern'}                        | ${'test#'}                                 | ${400}             | ${"[request body.pattern]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #."}
    ${'timeout'}                        | ${15000}                                   | ${200}             | ${null}
    ${'timeout'}                        | ${1000}                                    | ${400}             | ${'[request body.timeout]: Value should be greater or equal than 1500.'}
    ${'timeout'}                        | ${''}                                      | ${400}             | ${'[request body.timeout]: expected value of type [number] but got [string]'}
    ${'timeout'}                        | ${1.2}                                     | ${400}             | ${"[request body.timeout]: Number should be an integer."}
    ${'wazuh.monitoring.creation'}      | ${'h'}                                     | ${200}             | ${null}
    ${'wazuh.monitoring.creation'}      | ${'d'}                                     | ${200}             | ${null}
    ${'wazuh.monitoring.creation'}      | ${'w'}                                     | ${200}             | ${null}
    ${'wazuh.monitoring.creation'}      | ${'m'}                                     | ${200}             | ${null}
    ${'wazuh.monitoring.creation'}      | ${'test'}                                  | ${400}             | ${"[request body.wazuh.monitoring.creation]: types that failed validation:\n- [request body.wazuh.monitoring.creation.0]: expected value to equal [h]\n- [request body.wazuh.monitoring.creation.1]: expected value to equal [d]\n- [request body.wazuh.monitoring.creation.2]: expected value to equal [w]\n- [request body.wazuh.monitoring.creation.3]: expected value to equal [m]"}
    ${'wazuh.monitoring.enabled'}       | ${true}                                    | ${200}             | ${null}
    ${'wazuh.monitoring.enabled'}       | ${0}                                       | ${400}             | ${'[request body.wazuh.monitoring.enabled]: expected value of type [boolean] but got [number]'}
    ${'wazuh.monitoring.frequency'}     | ${100}                                     | ${200}             | ${null}
    ${'wazuh.monitoring.frequency'}     | ${40}                                      | ${400}             | ${"[request body.wazuh.monitoring.frequency]: Value should be greater or equal than 60."}
    ${'wazuh.monitoring.frequency'}     | ${1.2}                                     | ${400}             | ${"[request body.wazuh.monitoring.frequency]: Number should be an integer."}
    ${'wazuh.monitoring.frequency'}     | ${''}                                      | ${400}             | ${'[request body.wazuh.monitoring.frequency]: expected value of type [number] but got [string]'}
    ${'wazuh.monitoring.pattern'}       | ${'test'}                                  | ${200}             | ${null}
    ${'wazuh.monitoring.pattern'}       | ${'test*'}                                 | ${200}             | ${null}
    ${'wazuh.monitoring.pattern'}       | ${''}                                      | ${400}             | ${'[request body.wazuh.monitoring.pattern]: value has length [0] but it must have a minimum length of [1].'}
    ${'wazuh.monitoring.pattern'}       | ${true}                                    | ${400}             | ${'[request body.wazuh.monitoring.pattern]: expected value of type [string] but got [boolean]'}
    ${'wazuh.monitoring.pattern'}       | ${'-test'}                                 | ${400}             | ${"[request body.wazuh.monitoring.pattern]: It can't start with: -, _, +, .."}
    ${'wazuh.monitoring.pattern'}       | ${'_test'}                                 | ${400}             | ${"[request body.wazuh.monitoring.pattern]: It can't start with: -, _, +, .."}
    ${'wazuh.monitoring.pattern'}       | ${'+test'}                                 | ${400}             | ${"[request body.wazuh.monitoring.pattern]: It can't start with: -, _, +, .."}
    ${'wazuh.monitoring.pattern'}       | ${'.test'}                                 | ${400}             | ${"[request body.wazuh.monitoring.pattern]: It can't start with: -, _, +, .."}
    ${'wazuh.monitoring.pattern'}       | ${'test\\'}                                | ${400}             | ${"[request body.wazuh.monitoring.pattern]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #."}
    ${'wazuh.monitoring.pattern'}       | ${'test/'}                                 | ${400}             | ${"[request body.wazuh.monitoring.pattern]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #."}
    ${'wazuh.monitoring.pattern'}       | ${'test?'}                                 | ${400}             | ${"[request body.wazuh.monitoring.pattern]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #."}
    ${'wazuh.monitoring.pattern'}       | ${'test"'}                                 | ${400}             | ${"[request body.wazuh.monitoring.pattern]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #."}
    ${'wazuh.monitoring.pattern'}       | ${'test<'}                                 | ${400}             | ${"[request body.wazuh.monitoring.pattern]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #."}
    ${'wazuh.monitoring.pattern'}       | ${'test>'}                                 | ${400}             | ${"[request body.wazuh.monitoring.pattern]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #."}
    ${'wazuh.monitoring.pattern'}       | ${'test|'}                                 | ${400}             | ${"[request body.wazuh.monitoring.pattern]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #."}
    ${'wazuh.monitoring.pattern'}       | ${'test,'}                                 | ${400}             | ${"[request body.wazuh.monitoring.pattern]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #."}
    ${'wazuh.monitoring.pattern'}       | ${'test#'}                                 | ${400}             | ${"[request body.wazuh.monitoring.pattern]: It can't contain invalid characters: \\, /, ?, \", <, >, |, ,, #."}
    ${'wazuh.monitoring.replicas'}      | ${0}                                       | ${200}             | ${null}
    ${'wazuh.monitoring.replicas'}      | ${-1}                                      | ${400}             | ${"[request body.wazuh.monitoring.replicas]: Value should be greater or equal than 0."}
    ${'wazuh.monitoring.replicas'}      | ${1.2}                                     | ${400}             | ${"[request body.wazuh.monitoring.replicas]: Number should be an integer."}
    ${'wazuh.monitoring.replicas'}      | ${'custom'}                                | ${400}             | ${"[request body.wazuh.monitoring.replicas]: expected value of type [number] but got [string]"}
    ${'wazuh.monitoring.shards'}        | ${1}                                       | ${200}             | ${null}
    ${'wazuh.monitoring.shards'}        | ${-1}                                      | ${400}             | ${"[request body.wazuh.monitoring.shards]: Value should be greater or equal than 1."}
    ${'wazuh.monitoring.shards'}        | ${1.2}                                     | ${400}             | ${"[request body.wazuh.monitoring.shards]: Number should be an integer."}
    ${'wazuh.monitoring.shards'}        | ${'custom'}                                | ${400}             | ${"[request body.wazuh.monitoring.shards]: expected value of type [number] but got [string]"}
  `(`$setting: $value - PUT /utils/configuration - $responseStatusCode`, async ({ responseBodyMessage, responseStatusCode, setting, value }) => {
    const body = { [setting]: value };
    const response = await supertest(innerServer.listener)
      .put('/utils/configuration')
      .send(body)
      .expect(responseStatusCode);

    responseStatusCode === 200 && expect(response.body.data.updatedConfiguration).toEqual(body);
    responseStatusCode === 200 && expect(response.body.data.requiresRunningHealthCheck).toBe(Boolean(PLUGIN_SETTINGS[setting].requiresRunningHealthCheck));
    responseStatusCode === 200 && expect(response.body.data.requiresReloadingBrowserTab).toBe(Boolean(PLUGIN_SETTINGS[setting].requiresReloadingBrowserTab));
    responseStatusCode === 200 && expect(response.body.data.requiresRestartingPluginPlatform).toBe(Boolean(PLUGIN_SETTINGS[setting].requiresRestartingPluginPlatform));
    responseBodyMessage && expect(response.body.message).toMatch(responseBodyMessage);
  });
});

describe('[endpoint] PUT /utils/configuration/files/{key} - Upload file', () => {

  const PUBLIC_CUSTOM_ASSETS_PATH = path.join(__dirname, '../../../', 'public/assets/custom');

  beforeAll(() => {
    // Remove <PLUGIN_PATH>/public/assets/custom directory.
    execSync(`rm -rf ${PUBLIC_CUSTOM_ASSETS_PATH}`);

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
    // Remove <PLUGIN_PATH>/public/assets/custom directory.
    execSync(`rm -rf ${PUBLIC_CUSTOM_ASSETS_PATH}`);

    // Remove the configuration file
    fs.unlinkSync(WAZUH_DATA_CONFIG_APP_PATH);
  });

  it.each`
    setting                             | filename                     | responseStatusCode | responseBodyMessage
    ${'customization.logo.unknown'}     | ${'fixture_image_small.jpg'} | ${400}             | ${'[request params.key]: types that failed validation:\n- [request params.key.0]: expected value to equal [customization.logo.app]\n- [request params.key.1]: expected value to equal [customization.logo.healthcheck]\n- [request params.key.2]: expected value to equal [customization.logo.reports]\n- [request params.key.3]: expected value to equal [customization.logo.sidebar]'}
    ${'customization.logo.app'}         | ${'fixture_image_small.jpg'} | ${200}             | ${null}
    ${'customization.logo.app'}         | ${'fixture_image_small.png'} | ${200}             | ${null}
    ${'customization.logo.app'}         | ${'fixture_image_small.svg'} | ${200}             | ${null}
    ${'customization.logo.app'}         | ${'fixture_image_big.png'}   | ${413}             | ${'Payload content length greater than maximum allowed: 1048576'}
    ${'customization.logo.healthcheck'} | ${'fixture_image_small.jpg'} | ${200}             | ${null}
    ${'customization.logo.healthcheck'} | ${'fixture_image_small.png'} | ${200}             | ${null}
    ${'customization.logo.healthcheck'} | ${'fixture_image_small.svg'} | ${200}             | ${null}
    ${'customization.logo.healthcheck'} | ${'fixture_image_big.png'}   | ${413}             | ${'Payload content length greater than maximum allowed: 1048576'}
    ${'customization.logo.reports'}     | ${'fixture_image_small.jpg'} | ${200}             | ${null}
    ${'customization.logo.reports'}     | ${'fixture_image_small.png'} | ${200}             | ${null}
    ${'customization.logo.reports'}     | ${'fixture_image_big.png'}   | ${413}             | ${'Payload content length greater than maximum allowed: 1048576'}
    ${'customization.logo.reports'}     | ${'fixture_image_small.svg'} | ${400}             | ${"File extension is not valid for setting [customization.logo.reports] setting. Allowed file extensions: .jpeg, .jpg, .png"}
    ${'customization.logo.sidebar'}     | ${'fixture_image_small.jpg'} | ${200}             | ${null}
    ${'customization.logo.sidebar'}     | ${'fixture_image_small.png'} | ${200}             | ${null}
    ${'customization.logo.sidebar'}     | ${'fixture_image_small.svg'} | ${200}             | ${null}
    ${'customization.logo.sidebar'}     | ${'fixture_image_big.png'}   | ${413}             | ${'Payload content length greater than maximum allowed: 1048576'}
  `(`$setting: $filename - PUT /utils/configuration/files/{key} - $responseStatusCode`, async ({ responseBodyMessage, responseStatusCode, setting, filename }) => {
    const filePath = path.join(__dirname, 'fixtures', filename);
    const extension = path.extname(filename);

    const response = await supertest(innerServer.listener)
      .put(`/utils/configuration/files/${setting}`)
      .attach('file', filePath)
      .expect(responseStatusCode);

    responseStatusCode === 200 && expect(response.body.data.updatedConfiguration[setting]).toBeDefined();
    responseStatusCode === 200 && expect(response.body.data.updatedConfiguration[setting]).toMatch(`${setting}${extension}`);
    responseStatusCode === 200 && expect(response.body.data.requiresRunningHealthCheck).toBe(Boolean(PLUGIN_SETTINGS[setting].requiresRunningHealthCheck));
    responseStatusCode === 200 && expect(response.body.data.requiresReloadingBrowserTab).toBe(Boolean(PLUGIN_SETTINGS[setting].requiresReloadingBrowserTab));
    responseStatusCode === 200 && expect(response.body.data.requiresRestartingPluginPlatform).toBe(Boolean(PLUGIN_SETTINGS[setting].requiresRestartingPluginPlatform));
    responseBodyMessage && expect(response.body.message).toMatch(responseBodyMessage);

    // Check the file was created in the expected path of the file system.
    if (response?.body?.data?.updatedConfiguration?.[setting]) {
      const targetFilepath = path.join(__dirname, '../../../', PLUGIN_SETTINGS[setting].options.file.store.relativePathFileSystem, `${PLUGIN_SETTINGS[setting].options.file.store.filename}${extension}`);
      const files = glob.sync(path.join(targetFilepath));
      expect(files[0]).toBeDefined();
    };
  });
});

describe('[endpoint] DELETE /utils/configuration/files/{key} - Delete file', () => {

  const PUBLIC_CUSTOM_ASSETS_PATH = path.join(__dirname, '../../../', 'public/assets/custom');

  beforeAll(() => {
    // Remove <PLUGIN_PATH>/public/assets/custom directory.
    execSync(`rm -rf ${PUBLIC_CUSTOM_ASSETS_PATH}`);

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

    createDirectoryIfNotExists(PUBLIC_CUSTOM_ASSETS_PATH);
  });

  afterAll(() => {
    // Remove <PLUGIN_PATH>/public/assets/custom directory.
    execSync(`rm -rf ${PUBLIC_CUSTOM_ASSETS_PATH}`);

    // Remove the configuration file
    fs.unlinkSync(WAZUH_DATA_CONFIG_APP_PATH);
  });

  it.each`
    setting                             | expectedValue | responseStatusCode | responseBodyMessage
    ${'customization.logo.unknown'}     | ${''}         | ${400} | ${'[request params.key]: types that failed validation:\n- [request params.key.0]: expected value to equal [customization.logo.app]\n- [request params.key.1]: expected value to equal [customization.logo.healthcheck]\n- [request params.key.2]: expected value to equal [customization.logo.reports]\n- [request params.key.3]: expected value to equal [customization.logo.sidebar]'}
    ${'customization.logo.app'}         | ${''}         | ${200} | ${'All files were removed and the configuration file was updated.'}
    ${'customization.logo.healthcheck'} | ${''}         | ${200} | ${'All files were removed and the configuration file was updated.'}
    ${'customization.logo.reports'}     | ${''}         | ${200} | ${'All files were removed and the configuration file was updated.'}
    ${'customization.logo.sidebar'}     | ${''}         | ${200} | ${'All files were removed and the configuration file was updated.'}
  `(`$setting - PUT /utils/configuration - $responseStatusCode`, async ({ responseBodyMessage, responseStatusCode, setting, expectedValue }) => {

    // If the setting is defined in the plugin
    if (PLUGIN_SETTINGS[setting]) {
      // Create the directory where the asset was stored.
      createDirectoryIfNotExists(path.join(__dirname, '../../../', PLUGIN_SETTINGS[setting].options.file.store.relativePathFileSystem));

      // Create a empty file
      fs.writeFileSync(path.join(__dirname, '../../../', PLUGIN_SETTINGS[setting].options.file.store.relativePathFileSystem, `${PLUGIN_SETTINGS[setting].options.file.store.filename}.jpg`), '', 'utf8');
    };

    const response = await supertest(innerServer.listener)
      .delete(`/utils/configuration/files/${setting}`)
      .expect(responseStatusCode);

    responseStatusCode === 200 && expect(response.body.data.updatedConfiguration[setting]).toBeDefined();
    responseStatusCode === 200 && expect(response.body.data.updatedConfiguration[setting]).toMatch(expectedValue);
    responseStatusCode === 200 && expect(response.body.data.requiresRunningHealthCheck).toBe(Boolean(PLUGIN_SETTINGS[setting].requiresRunningHealthCheck));
    responseStatusCode === 200 && expect(response.body.data.requiresReloadingBrowserTab).toBe(Boolean(PLUGIN_SETTINGS[setting].requiresReloadingBrowserTab));
    responseStatusCode === 200 && expect(response.body.data.requiresRestartingPluginPlatform).toBe(Boolean(PLUGIN_SETTINGS[setting].requiresRestartingPluginPlatform));
    responseBodyMessage && expect(response.body.message).toMatch(responseBodyMessage);

    // Check the file was deleted from the expected path of the file system.
    if (response?.body?.data?.updatedConfiguration?.[setting]) {
      const targetFilepath = path.join(__dirname, '../../../', PLUGIN_SETTINGS[setting].options.file.store.relativePathFileSystem, `${PLUGIN_SETTINGS[setting].options.file.store.filename}.*`);
      const files = glob.sync(path.join(targetFilepath));
      expect(files).toHaveLength(0);
    };
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
