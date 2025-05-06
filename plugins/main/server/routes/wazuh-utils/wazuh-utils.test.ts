// To run this file:
// yarn test:jest --testEnvironment node --verbose server/routes/wazuh-utils
import { Router } from '../../../../../src/core/server/http/router/router';
import { HttpServer } from '../../../../../src/core/server/http/http_server';
import { loggingSystemMock } from '../../../../../src/core/server/logging/logging_system.mock';
import { ByteSizeValue } from '@osd/config-schema';
import supertest from 'supertest';
import { WazuhUtilsRoutes } from './wazuh-utils';
import fs from 'fs';
import path from 'path';
import glob from 'glob';

// TODO: this file defines some tests related to all the settings of the plugins, but these are defined
// in the core plugin and the endpoint that manage these settings are defined in the main

const loggingService = loggingSystemMock.create();
const logger = loggingService.get();
const noop = () => undefined;

const context = {
  wazuh: {
    logger,
  },
  wazuh_core: {
    configuration: {
      _settings: new Map(),
      logger: {
        debug: noop,
        info: noop,
        warn: noop,
        error: noop,
      },
      get: jest.fn(),
      set: jest.fn(),
    },
    dashboardSecurity: {
      isAdministratorUser: jest.fn(),
    },
  },
};

// Register settings
context.wazuh_core.configuration._settings.set('pattern', {
  validate: () => undefined,
  isConfigurableFromSettings: true,
});

const enhanceWithContext = (fn: (...args: any[]) => any) =>
  fn.bind(null, context);
let server, innerServer;

beforeAll(async () => {
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

  // Register routes
  WazuhUtilsRoutes(router, { configuration: context.wazuh_core.configuration });

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

describe('[endpoint] PUT /utils/configuration - protected route', () => {
  it.each`
    title     | isConfigurationAPIEditable | isAdmin  | responseStatusCode | responseBodyMessage
    ${'test'} | ${true}                    | ${false} | ${403}             | ${'403 - Mock: User has no permissions'}
    ${'test'} | ${false}                   | ${true}  | ${403}             | ${'The ability to edit the configuration from API is disabled. This can be enabled using configuration.ui_api_editable setting from the configuration file. Contact with an administrator.'}
  `(
    '$title',
    async ({
      isConfigurationAPIEditable,
      isAdmin,
      responseStatusCode,
      responseBodyMessage,
    }: {
      isConfigurationAPIEditable: boolean;
      isAdmin: boolean;
      responseStatusCode: number;
      responseBodyMessage: string | null;
    }) => {
      context.wazuh_core.configuration.get.mockReturnValueOnce(
        isConfigurationAPIEditable,
      );
      context.wazuh_core.dashboardSecurity.isAdministratorUser.mockReturnValueOnce(
        {
          administrator: isAdmin,
          administrator_requirements: !isAdmin
            ? 'Mock: User has no permissions'
            : null,
        },
      );
      const settings = { pattern: 'test-alerts-groupA-*' };
      const response = await supertest(innerServer.listener)
        .put('/utils/configuration')
        .send(settings)
        .expect(responseStatusCode);

      if (responseBodyMessage) {
        expect(response.body.message).toBe(responseBodyMessage);
      }
    },
  );
});

describe.skip('[endpoint] GET /utils/configuration', () => {
  it(`Get plugin configuration and ensure the hosts is not returned GET /utils/configuration - 200`, async () => {
    const initialConfig = {
      pattern: 'test-alerts-*',
      hosts: [
        {
          id: 'default',
          url: 'https://localhost',
          port: 55000,
          username: 'wazuh-wui',
          password: 'wazuh-wui',
          run_as: false,
        },
      ],
    };
    context.wazuh_core.configuration.get.mockReturnValueOnce(initialConfig);
    const response = await supertest(innerServer.listener)
      .get('/utils/configuration')
      .expect(200);

    const { hosts, ...finalConfiguration } = initialConfig;
    expect(response.body.data).toEqual(finalConfiguration);
    // Ensure the API hosts is not returned
    expect(response.body.data.hosts).not.toBeDefined();
  });
});

describe.skip('[endpoint] PUT /utils/configuration', () => {
  beforeAll(() => {
    context.wazuh_core.configuration._settings = new Map();
    context.wazuh_core.configuration._settings.set('pattern', {
      isConfigurableFromSettings: true,
    });
    context.wazuh_core.configuration._settings.set('hosts', {
      isConfigurableFromSettings: true,
    });
    context.wazuh_core.configuration._settings.set('timeout', {
      isConfigurableFromSettings: true,
    });
    context.wazuh_core.configuration._settings.set('cron.statistics.apis', {
      isConfigurableFromSettings: true,
    });
  });

  afterAll(() => {
    // Reset the configuration
    context.wazuh_core.configuration._settings = null;
  });

  it.each`
    settings                                               | responseStatusCode
    ${{ pattern: 'test-alerts-groupA-*' }}                 | ${200}
    ${{ pattern: 'test-alerts-groupA-*', timeout: 15000 }} | ${200}
  `(
    `Update the plugin configuration: $settings. PUT /utils/configuration - $responseStatusCode`,
    async ({ responseStatusCode, settings }) => {
      const initialConfig = {
        pattern: 'test-alerts-*',
        hosts: [
          {
            id: 'default',
            url: 'https://localhost',
            port: 55000,
            username: 'wazuh-wui',
            password: 'wazuh-wui',
            run_as: false,
          },
        ],
      };
      context.wazuh_core.configuration.get.mockReturnValueOnce(initialConfig);
      context.wazuh_core.configuration.set.mockReturnValueOnce(settings);
      const response = await supertest(innerServer.listener)
        .put('/utils/configuration')
        .send(settings)
        .expect(responseStatusCode);

      expect(response.body.data.updatedConfiguration).toEqual(settings);
      expect(response.body.data.requiresRunningHealthCheck).toBeDefined();
      expect(response.body.data.requiresReloadingBrowserTab).toBeDefined();
      expect(response.body.data.requiresRestartingPluginPlatform).toBeDefined();
    },
  );

  it.each([
    {
      testTitle: 'Update the plugin configuration',
      settings: { pattern: 'test-alerts-groupA-*' },
      responseStatusCode: 200,
      responseBodyMessage: null,
    },
    {
      testTitle: 'Update the plugin configuration',
      settings: { pattern: 'test-alerts-groupA-*', timeout: 15000 },
      responseStatusCode: 200,
      responseBodyMessage: null,
    },
    {
      testTitle: 'Bad request, wrong value type.',
      settings: { pattern: 5 },
      responseStatusCode: 400,
      responseBodyMessage:
        '[request body]: [pattern]: expected value of type [string] but got [number]',
    },
    {
      testTitle: 'Bad request, unknown setting',
      settings: { 'unknown.setting': 'test-alerts-groupA-*' },
      responseStatusCode: 400,
      responseBodyMessage:
        '[request body]: [unknown.setting]: definition for this key is missing',
    },
    {
      testTitle: 'Bad request, unknown setting',
      settings: {
        'unknown.setting': 'test-alerts-groupA-*',
        timeout: 15000,
      },
      responseStatusCode: 400,
      responseBodyMessage:
        '[request body]: [unknown.setting]: definition for this key is missing',
    },
    {
      testTitle: 'Bad request, unknown setting',
      settings: { 'cron.statistics.apis': [0, 'test'] },
      responseStatusCode: 400,
      responseBodyMessage:
        '[request body]: [cron.statistics.apis.0]: expected value of type [string] but got [number]',
    },
  ])(
    `$testTitle: $settings. PUT /utils/configuration - $responseStatusCode`,
    async ({ responseBodyMessage, responseStatusCode, settings }) => {
      const initialConfig = {
        pattern: 'test-alerts-*',
        hosts: [
          {
            id: 'default',
            url: 'https://localhost',
            port: 55000,
            username: 'wazuh-wui',
            password: 'wazuh-wui',
            run_as: false,
          },
        ],
      };
      context.wazuh_core.configuration.get.mockReturnValueOnce(initialConfig);
      context.wazuh_core.configuration.set.mockReturnValueOnce(settings);

      const response = await supertest(innerServer.listener)
        .put('/utils/configuration')
        .send(settings)
        .expect(responseStatusCode);

      responseStatusCode === 200 &&
        expect(response.body.data.updatedConfiguration).toEqual(settings);
      responseStatusCode === 200 &&
        expect(response.body.data.requiresRunningHealthCheck).toBeDefined();
      responseStatusCode === 200 &&
        expect(response.body.data.requiresReloadingBrowserTab).toBeDefined();
      responseStatusCode === 200 &&
        expect(
          response.body.data.requiresRestartingPluginPlatform,
        ).toBeDefined();
      responseBodyMessage &&
        expect(response.body.message).toMatch(responseBodyMessage);
    },
  );

  // TODO: this has to be done as a integration test because uses the real setting definition
  it.skip.each`
    setting                                  | value                                                            | responseStatusCode | responseBodyMessage
    ${'alerts.sample.prefix'}                | ${'test'}                                                        | ${200}             | ${null}
    ${'alerts.sample.prefix'}                | ${''}                                                            | ${400}             | ${'[request body.alerts.sample.prefix]: Value can not be empty.'}
    ${'alerts.sample.prefix'}                | ${'test space'}                                                  | ${400}             | ${'[request body.alerts.sample.prefix]: No whitespaces allowed.'}
    ${'alerts.sample.prefix'}                | ${4}                                                             | ${400}             | ${'[request body.alerts.sample.prefix]: expected value of type [string] but got [number]'}
    ${'alerts.sample.prefix'}                | ${'-test'}                                                       | ${400}             | ${"[request body.alerts.sample.prefix]: It can't start with: -, _, +, .."}
    ${'alerts.sample.prefix'}                | ${'_test'}                                                       | ${400}             | ${"[request body.alerts.sample.prefix]: It can't start with: -, _, +, .."}
    ${'alerts.sample.prefix'}                | ${'+test'}                                                       | ${400}             | ${"[request body.alerts.sample.prefix]: It can't start with: -, _, +, .."}
    ${'alerts.sample.prefix'}                | ${'.test'}                                                       | ${400}             | ${"[request body.alerts.sample.prefix]: It can't start with: -, _, +, .."}
    ${'alerts.sample.prefix'}                | ${'test\\'}                                                      | ${400}             | ${'[request body.alerts.sample.prefix]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'alerts.sample.prefix'}                | ${'test/'}                                                       | ${400}             | ${'[request body.alerts.sample.prefix]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'alerts.sample.prefix'}                | ${'test?'}                                                       | ${400}             | ${'[request body.alerts.sample.prefix]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'alerts.sample.prefix'}                | ${'test"'}                                                       | ${400}             | ${'[request body.alerts.sample.prefix]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'alerts.sample.prefix'}                | ${'test<'}                                                       | ${400}             | ${'[request body.alerts.sample.prefix]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'alerts.sample.prefix'}                | ${'test>'}                                                       | ${400}             | ${'[request body.alerts.sample.prefix]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'alerts.sample.prefix'}                | ${'test|'}                                                       | ${400}             | ${'[request body.alerts.sample.prefix]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'alerts.sample.prefix'}                | ${'test,'}                                                       | ${400}             | ${'[request body.alerts.sample.prefix]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'alerts.sample.prefix'}                | ${'test#'}                                                       | ${400}             | ${'[request body.alerts.sample.prefix]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'alerts.sample.prefix'}                | ${'test*'}                                                       | ${400}             | ${'[request body.alerts.sample.prefix]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'checks.api'}                          | ${true}                                                          | ${200}             | ${null}
    ${'checks.api'}                          | ${0}                                                             | ${400}             | ${'[request body.checks.api]: expected value of type [boolean] but got [number]'}
    ${'checks.fields'}                       | ${true}                                                          | ${200}             | ${null}
    ${'checks.fields'}                       | ${0}                                                             | ${400}             | ${'[request body.checks.fields]: expected value of type [boolean] but got [number]'}
    ${'checks.maxBuckets'}                   | ${true}                                                          | ${200}             | ${null}
    ${'checks.maxBuckets'}                   | ${0}                                                             | ${400}             | ${'[request body.checks.maxBuckets]: expected value of type [boolean] but got [number]'}
    ${'checks.pattern'}                      | ${true}                                                          | ${200}             | ${null}
    ${'checks.pattern'}                      | ${0}                                                             | ${400}             | ${'[request body.checks.pattern]: expected value of type [boolean] but got [number]'}
    ${'checks.setup'}                        | ${true}                                                          | ${200}             | ${null}
    ${'checks.setup'}                        | ${0}                                                             | ${400}             | ${'[request body.checks.setup]: expected value of type [boolean] but got [number]'}
    ${'checks.template'}                     | ${true}                                                          | ${200}             | ${null}
    ${'checks.template'}                     | ${0}                                                             | ${400}             | ${'[request body.checks.template]: expected value of type [boolean] but got [number]'}
    ${'checks.timeFilter'}                   | ${true}                                                          | ${200}             | ${null}
    ${'checks.timeFilter'}                   | ${0}                                                             | ${400}             | ${'[request body.checks.timeFilter]: expected value of type [boolean] but got [number]'}
    ${'configuration.ui_api_editable'}       | ${true}                                                          | ${200}             | ${null}
    ${'configuration.ui_api_editable'}       | ${true}                                                          | ${400}             | ${'[request body.configuration.ui_api_editable]: expected value of type [boolean] but got [number]'}
    ${'cron.prefix'}                         | ${'test'}                                                        | ${200}             | ${null}
    ${'cron.prefix'}                         | ${'test space'}                                                  | ${400}             | ${'[request body.cron.prefix]: No whitespaces allowed.'}
    ${'cron.prefix'}                         | ${''}                                                            | ${400}             | ${'[request body.cron.prefix]: Value can not be empty.'}
    ${'cron.prefix'}                         | ${4}                                                             | ${400}             | ${'[request body.cron.prefix]: expected value of type [string] but got [number]'}
    ${'cron.prefix'}                         | ${'-test'}                                                       | ${400}             | ${"[request body.cron.prefix]: It can't start with: -, _, +, .."}
    ${'cron.prefix'}                         | ${'_test'}                                                       | ${400}             | ${"[request body.cron.prefix]: It can't start with: -, _, +, .."}
    ${'cron.prefix'}                         | ${'+test'}                                                       | ${400}             | ${"[request body.cron.prefix]: It can't start with: -, _, +, .."}
    ${'cron.prefix'}                         | ${'.test'}                                                       | ${400}             | ${"[request body.cron.prefix]: It can't start with: -, _, +, .."}
    ${'cron.prefix'}                         | ${'test\\'}                                                      | ${400}             | ${'[request body.cron.prefix]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'cron.prefix'}                         | ${'test/'}                                                       | ${400}             | ${'[request body.cron.prefix]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'cron.prefix'}                         | ${'test?'}                                                       | ${400}             | ${'[request body.cron.prefix]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'cron.prefix'}                         | ${'test"'}                                                       | ${400}             | ${'[request body.cron.prefix]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'cron.prefix'}                         | ${'test<'}                                                       | ${400}             | ${'[request body.cron.prefix]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'cron.prefix'}                         | ${'test>'}                                                       | ${400}             | ${'[request body.cron.prefix]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'cron.prefix'}                         | ${'test|'}                                                       | ${400}             | ${'[request body.cron.prefix]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'cron.prefix'}                         | ${'test,'}                                                       | ${400}             | ${'[request body.cron.prefix]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'cron.prefix'}                         | ${'test#'}                                                       | ${400}             | ${'[request body.cron.prefix]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'cron.prefix'}                         | ${'test*'}                                                       | ${400}             | ${'[request body.cron.prefix]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'cron.statistics.apis'}                | ${['test']}                                                      | ${200}             | ${null}
    ${'cron.statistics.apis'}                | ${['test ']}                                                     | ${400}             | ${'[request body.cron.statistics.apis.0]: No whitespaces allowed.'}
    ${'cron.statistics.apis'}                | ${['']}                                                          | ${400}             | ${'[request body.cron.statistics.apis.0]: Value can not be empty.'}
    ${'cron.statistics.apis'}                | ${['test', 4]}                                                   | ${400}             | ${'[request body.cron.statistics.apis.1]: expected value of type [string] but got [number]'}
    ${'cron.statistics.apis'}                | ${'test space'}                                                  | ${400}             | ${'[request body.cron.statistics.apis]: could not parse array value from json input'}
    ${'cron.statistics.apis'}                | ${true}                                                          | ${400}             | ${'[request body.cron.statistics.apis]: expected value of type [array] but got [boolean]'}
    ${'cron.statistics.index.creation'}      | ${'h'}                                                           | ${200}             | ${null}
    ${'cron.statistics.index.creation'}      | ${'d'}                                                           | ${200}             | ${null}
    ${'cron.statistics.index.creation'}      | ${'w'}                                                           | ${200}             | ${null}
    ${'cron.statistics.index.creation'}      | ${'m'}                                                           | ${200}             | ${null}
    ${'cron.statistics.index.creation'}      | ${'test'}                                                        | ${400}             | ${'[request body.cron.statistics.index.creation]: types that failed validation:\n- [request body.cron.statistics.index.creation.0]: expected value to equal [h]\n- [request body.cron.statistics.index.creation.1]: expected value to equal [d]\n- [request body.cron.statistics.index.creation.2]: expected value to equal [w]\n- [request body.cron.statistics.index.creation.3]: expected value to equal [m]'}
    ${'cron.statistics.index.name'}          | ${'test'}                                                        | ${200}             | ${null}
    ${'cron.statistics.index.name'}          | ${''}                                                            | ${400}             | ${'[request body.cron.statistics.index.name]: Value can not be empty.'}
    ${'cron.statistics.index.name'}          | ${'test space'}                                                  | ${400}             | ${'[request body.cron.statistics.index.name]: No whitespaces allowed.'}
    ${'cron.statistics.index.name'}          | ${true}                                                          | ${400}             | ${'[request body.cron.statistics.index.name]: expected value of type [string] but got [boolean]'}
    ${'cron.statistics.index.name'}          | ${'-test'}                                                       | ${400}             | ${"[request body.cron.statistics.index.name]: It can't start with: -, _, +, .."}
    ${'cron.statistics.index.name'}          | ${'_test'}                                                       | ${400}             | ${"[request body.cron.statistics.index.name]: It can't start with: -, _, +, .."}
    ${'cron.statistics.index.name'}          | ${'+test'}                                                       | ${400}             | ${"[request body.cron.statistics.index.name]: It can't start with: -, _, +, .."}
    ${'cron.statistics.index.name'}          | ${'.test'}                                                       | ${400}             | ${"[request body.cron.statistics.index.name]: It can't start with: -, _, +, .."}
    ${'cron.statistics.index.name'}          | ${'test\\'}                                                      | ${400}             | ${'[request body.cron.statistics.index.name]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'cron.statistics.index.name'}          | ${'test/'}                                                       | ${400}             | ${'[request body.cron.statistics.index.name]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'cron.statistics.index.name'}          | ${'test?'}                                                       | ${400}             | ${'[request body.cron.statistics.index.name]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'cron.statistics.index.name'}          | ${'test"'}                                                       | ${400}             | ${'[request body.cron.statistics.index.name]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'cron.statistics.index.name'}          | ${'test<'}                                                       | ${400}             | ${'[request body.cron.statistics.index.name]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'cron.statistics.index.name'}          | ${'test>'}                                                       | ${400}             | ${'[request body.cron.statistics.index.name]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'cron.statistics.index.name'}          | ${'test|'}                                                       | ${400}             | ${'[request body.cron.statistics.index.name]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'cron.statistics.index.name'}          | ${'test,'}                                                       | ${400}             | ${'[request body.cron.statistics.index.name]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'cron.statistics.index.name'}          | ${'test#'}                                                       | ${400}             | ${'[request body.cron.statistics.index.name]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'cron.statistics.index.name'}          | ${'test*'}                                                       | ${400}             | ${'[request body.cron.statistics.index.name]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'cron.statistics.index.replicas'}      | ${0}                                                             | ${200}             | ${null}
    ${'cron.statistics.index.replicas'}      | ${-1}                                                            | ${400}             | ${'[request body.cron.statistics.index.replicas]: Value should be greater or equal than 0.'}
    ${'cron.statistics.index.replicas'}      | ${'custom'}                                                      | ${400}             | ${'[request body.cron.statistics.index.replicas]: expected value of type [number] but got [string]'}
    ${'cron.statistics.index.replicas'}      | ${1.2}                                                           | ${400}             | ${'[request body.cron.statistics.index.replicas]: Number should be an integer.'}
    ${'cron.statistics.index.shards'}        | ${1}                                                             | ${200}             | ${null}
    ${'cron.statistics.index.shards'}        | ${-1}                                                            | ${400}             | ${'[request body.cron.statistics.index.shards]: Value should be greater or equal than 1.'}
    ${'cron.statistics.index.shards'}        | ${1.2}                                                           | ${400}             | ${'[request body.cron.statistics.index.shards]: Number should be an integer.'}
    ${'cron.statistics.interval'}            | ${'0 */5 * * * *'}                                               | ${200}             | ${null}
    ${'cron.statistics.interval'}            | ${'0 */5 * * *'}                                                 | ${200}             | ${null}
    ${'cron.statistics.interval'}            | ${'custom'}                                                      | ${400}             | ${'[request body.cron.statistics.interval]: Interval is not valid.'}
    ${'cron.statistics.interval'}            | ${true}                                                          | ${400}             | ${'[request body.cron.statistics.interval]: expected value of type [string] but got [boolean]'}
    ${'cron.statistics.status'}              | ${true}                                                          | ${200}             | ${null}
    ${'cron.statistics.status'}              | ${0}                                                             | ${400}             | ${'[request body.cron.statistics.status]: expected value of type [boolean] but got [number]'}
    ${'customization.enabled'}               | ${true}                                                          | ${200}             | ${null}
    ${'customization.enabled'}               | ${0}                                                             | ${400}             | ${'[request body.customization.enabled]: expected value of type [boolean] but got [number]'}
    ${'customization.reports.footer'}        | ${'Test'}                                                        | ${200}             | ${null}
    ${'customization.reports.footer'}        | ${'Test\nTest'}                                                  | ${200}             | ${null}
    ${'customization.reports.footer'}        | ${'Test\nTest\nTest\nTest\nTest'}                                | ${400}             | ${'[request body.customization.reports.footer]: The string should have less or equal to 2 line/s.'}
    ${'customization.reports.footer'}        | ${'Line with 30 characters       \nTest'}                        | ${200}             | ${undefined}
    ${'customization.reports.footer'}        | ${'Testing the maximum length of a line of 50 characters\nTest'} | ${400}             | ${'[request body.customization.reports.footer]: The maximum length of a line is 50 characters.'}
    ${'customization.reports.footer'}        | ${true}                                                          | ${400}             | ${'[request body.customization.reports.footer]: expected value of type [string] but got [boolean]'}
    ${'customization.reports.header'}        | ${'Test'}                                                        | ${200}             | ${null}
    ${'customization.reports.header'}        | ${'Test\nTest'}                                                  | ${200}             | ${null}
    ${'customization.reports.header'}        | ${'Test\nTest\nTest\nTest\nTest'}                                | ${400}             | ${'[request body.customization.reports.header]: The string should have less or equal to 3 line/s.'}
    ${'customization.reports.header'}        | ${'Line with 20 charact\nTest'}                                  | ${200}             | ${undefined}
    ${'customization.reports.header'}        | ${'Testing maximum length of a line of 40 characters\nTest'}     | ${400}             | ${'[request body.customization.reports.header]: The maximum length of a line is 40 characters.'}
    ${'customization.reports.header'}        | ${true}                                                          | ${400}             | ${'[request body.customization.reports.header]: expected value of type [string] but got [boolean]'}
    ${'enrollment.dns'}                      | ${'test'}                                                        | ${200}             | ${null}
    ${'enrollment.dns'}                      | ${''}                                                            | ${200}             | ${null}
    ${'enrollment.dns'}                      | ${'test space'}                                                  | ${400}             | ${'[request body.enrollment.dns]: No whitespaces allowed.'}
    ${'enrollment.dns'}                      | ${true}                                                          | ${400}             | ${'[request body.enrollment.dns]: expected value of type [string] but got [boolean]'}
    ${'enrollment.password'}                 | ${'test'}                                                        | ${200}             | ${null}
    ${'enrollment.password'}                 | ${''}                                                            | ${400}             | ${'[request body.enrollment.password]: Value can not be empty.'}
    ${'enrollment.password'}                 | ${'test space'}                                                  | ${200}             | ${null}
    ${'enrollment.password'}                 | ${true}                                                          | ${400}             | ${'[request body.enrollment.password]: expected value of type [string] but got [boolean]'}
    ${'fim.pattern'}                         | ${'test'}                                                        | ${200}             | ${null}
    ${'fim.pattern'}                         | ${'test*'}                                                       | ${200}             | ${null}
    ${'fim.pattern'}                         | ${''}                                                            | ${400}             | ${'[request body.pattern]: Value can not be empty.'}
    ${'fim.pattern'}                         | ${'test space'}                                                  | ${400}             | ${'[request body.pattern]: No whitespaces allowed.'}
    ${'fim.pattern'}                         | ${true}                                                          | ${400}             | ${'[request body.pattern]: expected value of type [string] but got [boolean]'}
    ${'fim.pattern'}                         | ${'-test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'fim.pattern'}                         | ${'_test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'fim.pattern'}                         | ${'+test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'fim.pattern'}                         | ${'.test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'fim.pattern'}                         | ${'test\\'}                                                      | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'fim.pattern'}                         | ${'test/'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'fim.pattern'}                         | ${'test?'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'fim.pattern'}                         | ${'test"'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'fim.pattern'}                         | ${'test<'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'fim.pattern'}                         | ${'test>'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'fim.pattern'}                         | ${'test|'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'fim.pattern'}                         | ${'test,'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'fim.pattern'}                         | ${'test#'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'ip.ignore'}                           | ${['test']}                                                      | ${200}             | ${null}
    ${'ip.ignore'}                           | ${['test*']}                                                     | ${200}             | ${null}
    ${'ip.ignore'}                           | ${['']}                                                          | ${400}             | ${'[request body.ip.ignore.0]: Value can not be empty.'}
    ${'ip.ignore'}                           | ${['test space']}                                                | ${400}             | ${'[request body.ip.ignore.0]: No whitespaces allowed.'}
    ${'ip.ignore'}                           | ${true}                                                          | ${400}             | ${'[request body.ip.ignore]: expected value of type [array] but got [boolean]'}
    ${'ip.ignore'}                           | ${['-test']}                                                     | ${400}             | ${"[request body.ip.ignore.0]: It can't start with: -, _, +, .."}
    ${'ip.ignore'}                           | ${['_test']}                                                     | ${400}             | ${"[request body.ip.ignore.0]: It can't start with: -, _, +, .."}
    ${'ip.ignore'}                           | ${['+test']}                                                     | ${400}             | ${"[request body.ip.ignore.0]: It can't start with: -, _, +, .."}
    ${'ip.ignore'}                           | ${['.test']}                                                     | ${400}             | ${"[request body.ip.ignore.0]: It can't start with: -, _, +, .."}
    ${'ip.ignore'}                           | ${['test\\']}                                                    | ${400}             | ${'[request body.ip.ignore.0]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'ip.ignore'}                           | ${['test/']}                                                     | ${400}             | ${'[request body.ip.ignore.0]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'ip.ignore'}                           | ${['test?']}                                                     | ${400}             | ${'[request body.ip.ignore.0]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'ip.ignore'}                           | ${['test"']}                                                     | ${400}             | ${'[request body.ip.ignore.0]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'ip.ignore'}                           | ${['test<']}                                                     | ${400}             | ${'[request body.ip.ignore.0]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'ip.ignore'}                           | ${['test>']}                                                     | ${400}             | ${'[request body.ip.ignore.0]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'ip.ignore'}                           | ${['test|']}                                                     | ${400}             | ${'[request body.ip.ignore.0]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'ip.ignore'}                           | ${['test,']}                                                     | ${400}             | ${'[request body.ip.ignore.0]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'ip.ignore'}                           | ${['test#']}                                                     | ${400}             | ${'[request body.ip.ignore.0]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'ip.ignore'}                           | ${['test', 'test#']}                                             | ${400}             | ${'[request body.ip.ignore.1]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'ip.selector'}                         | ${true}                                                          | ${200}             | ${null}
    ${'ip.selector'}                         | ${''}                                                            | ${400}             | ${'[request body.ip.selector]: expected value of type [boolean] but got [string]'}
    ${'pattern'}                             | ${'test'}                                                        | ${200}             | ${null}
    ${'pattern'}                             | ${'test*'}                                                       | ${200}             | ${null}
    ${'pattern'}                             | ${''}                                                            | ${400}             | ${'[request body.pattern]: Value can not be empty.'}
    ${'pattern'}                             | ${'test space'}                                                  | ${400}             | ${'[request body.pattern]: No whitespaces allowed.'}
    ${'pattern'}                             | ${true}                                                          | ${400}             | ${'[request body.pattern]: expected value of type [string] but got [boolean]'}
    ${'pattern'}                             | ${'-test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'pattern'}                             | ${'_test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'pattern'}                             | ${'+test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'pattern'}                             | ${'.test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'pattern'}                             | ${'test\\'}                                                      | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'pattern'}                             | ${'test/'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'pattern'}                             | ${'test?'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'pattern'}                             | ${'test"'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'pattern'}                             | ${'test<'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'pattern'}                             | ${'test>'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'pattern'}                             | ${'test|'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'pattern'}                             | ${'test,'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'pattern'}                             | ${'test#'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory.pattern'}            | ${'test'}                                                        | ${200}             | ${null}
    ${'system_inventory.pattern'}            | ${'test*'}                                                       | ${200}             | ${null}
    ${'system_inventory.pattern'}            | ${''}                                                            | ${400}             | ${'[request body.pattern]: Value can not be empty.'}
    ${'system_inventory.pattern'}            | ${'test space'}                                                  | ${400}             | ${'[request body.pattern]: No whitespaces allowed.'}
    ${'system_inventory.pattern'}            | ${true}                                                          | ${400}             | ${'[request body.pattern]: expected value of type [string] but got [boolean]'}
    ${'system_inventory.pattern'}            | ${'-test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'system_inventory.pattern'}            | ${'_test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'system_inventory.pattern'}            | ${'+test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'system_inventory.pattern'}            | ${'.test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'system_inventory.pattern'}            | ${'test\\'}                                                      | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory.pattern'}            | ${'test/'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory.pattern'}            | ${'test?'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory.pattern'}            | ${'test"'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory.pattern'}            | ${'test<'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory.pattern'}            | ${'test>'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory.pattern'}            | ${'test|'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory.pattern'}            | ${'test,'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory.pattern'}            | ${'test#'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_hardware.pattern'}   | ${'test'}                                                        | ${200}             | ${null}
    ${'system_inventory_hardware.pattern'}   | ${'test*'}                                                       | ${200}             | ${null}
    ${'system_inventory_hardware.pattern'}   | ${''}                                                            | ${400}             | ${'[request body.pattern]: Value can not be empty.'}
    ${'system_inventory_hardware.pattern'}   | ${'test space'}                                                  | ${400}             | ${'[request body.pattern]: No whitespaces allowed.'}
    ${'system_inventory_hardware.pattern'}   | ${true}                                                          | ${400}             | ${'[request body.pattern]: expected value of type [string] but got [boolean]'}
    ${'system_inventory_hardware.pattern'}   | ${'-test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'system_inventory_hardware.pattern'}   | ${'_test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'system_inventory_hardware.pattern'}   | ${'+test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'system_inventory_hardware.pattern'}   | ${'.test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'system_inventory_hardware.pattern'}   | ${'test\\'}                                                      | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_hardware.pattern'}   | ${'test/'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_hardware.pattern'}   | ${'test?'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_hardware.pattern'}   | ${'test"'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_hardware.pattern'}   | ${'test<'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_hardware.pattern'}   | ${'test>'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_hardware.pattern'}   | ${'test|'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_hardware.pattern'}   | ${'test,'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_hardware.pattern'}   | ${'test#'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_hotfixes.pattern'}   | ${'test'}                                                        | ${200}             | ${null}
    ${'system_inventory_hotfixes.pattern'}   | ${'test*'}                                                       | ${200}             | ${null}
    ${'system_inventory_hotfixes.pattern'}   | ${''}                                                            | ${400}             | ${'[request body.pattern]: Value can not be empty.'}
    ${'system_inventory_hotfixes.pattern'}   | ${'test space'}                                                  | ${400}             | ${'[request body.pattern]: No whitespaces allowed.'}
    ${'system_inventory_hotfixes.pattern'}   | ${true}                                                          | ${400}             | ${'[request body.pattern]: expected value of type [string] but got [boolean]'}
    ${'system_inventory_hotfixes.pattern'}   | ${'-test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'system_inventory_hotfixes.pattern'}   | ${'_test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'system_inventory_hotfixes.pattern'}   | ${'+test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'system_inventory_hotfixes.pattern'}   | ${'.test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'system_inventory_hotfixes.pattern'}   | ${'test\\'}                                                      | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_hotfixes.pattern'}   | ${'test/'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_hotfixes.pattern'}   | ${'test?'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_hotfixes.pattern'}   | ${'test"'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_hotfixes.pattern'}   | ${'test<'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_hotfixes.pattern'}   | ${'test>'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_hotfixes.pattern'}   | ${'test|'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_hotfixes.pattern'}   | ${'test,'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_hotfixes.pattern'}   | ${'test#'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_interfaces.pattern'} | ${'test'}                                                        | ${200}             | ${null}
    ${'system_inventory_interfaces.pattern'} | ${'test*'}                                                       | ${200}             | ${null}
    ${'system_inventory_interfaces.pattern'} | ${''}                                                            | ${400}             | ${'[request body.pattern]: Value can not be empty.'}
    ${'system_inventory_interfaces.pattern'} | ${'test space'}                                                  | ${400}             | ${'[request body.pattern]: No whitespaces allowed.'}
    ${'system_inventory_interfaces.pattern'} | ${true}                                                          | ${400}             | ${'[request body.pattern]: expected value of type [string] but got [boolean]'}
    ${'system_inventory_interfaces.pattern'} | ${'-test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'system_inventory_interfaces.pattern'} | ${'_test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'system_inventory_interfaces.pattern'} | ${'+test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'system_inventory_interfaces.pattern'} | ${'.test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'system_inventory_interfaces.pattern'} | ${'test\\'}                                                      | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_interfaces.pattern'} | ${'test/'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_interfaces.pattern'} | ${'test?'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_interfaces.pattern'} | ${'test"'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_interfaces.pattern'} | ${'test<'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_interfaces.pattern'} | ${'test>'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_interfaces.pattern'} | ${'test|'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_interfaces.pattern'} | ${'test,'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_interfaces.pattern'} | ${'test#'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_networks.pattern'}   | ${'test'}                                                        | ${200}             | ${null}
    ${'system_inventory_networks.pattern'}   | ${'test*'}                                                       | ${200}             | ${null}
    ${'system_inventory_networks.pattern'}   | ${''}                                                            | ${400}             | ${'[request body.pattern]: Value can not be empty.'}
    ${'system_inventory_networks.pattern'}   | ${'test space'}                                                  | ${400}             | ${'[request body.pattern]: No whitespaces allowed.'}
    ${'system_inventory_networks.pattern'}   | ${true}                                                          | ${400}             | ${'[request body.pattern]: expected value of type [string] but got [boolean]'}
    ${'system_inventory_networks.pattern'}   | ${'-test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'system_inventory_networks.pattern'}   | ${'_test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'system_inventory_networks.pattern'}   | ${'+test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'system_inventory_networks.pattern'}   | ${'.test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'system_inventory_networks.pattern'}   | ${'test\\'}                                                      | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_networks.pattern'}   | ${'test/'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_networks.pattern'}   | ${'test?'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_networks.pattern'}   | ${'test"'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_networks.pattern'}   | ${'test<'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_networks.pattern'}   | ${'test>'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_networks.pattern'}   | ${'test|'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_networks.pattern'}   | ${'test,'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_networks.pattern'}   | ${'test#'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_packages.pattern'}   | ${'test'}                                                        | ${200}             | ${null}
    ${'system_inventory_packages.pattern'}   | ${'test*'}                                                       | ${200}             | ${null}
    ${'system_inventory_packages.pattern'}   | ${''}                                                            | ${400}             | ${'[request body.pattern]: Value can not be empty.'}
    ${'system_inventory_packages.pattern'}   | ${'test space'}                                                  | ${400}             | ${'[request body.pattern]: No whitespaces allowed.'}
    ${'system_inventory_packages.pattern'}   | ${true}                                                          | ${400}             | ${'[request body.pattern]: expected value of type [string] but got [boolean]'}
    ${'system_inventory_packages.pattern'}   | ${'-test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'system_inventory_packages.pattern'}   | ${'_test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'system_inventory_packages.pattern'}   | ${'+test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'system_inventory_packages.pattern'}   | ${'.test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'system_inventory_packages.pattern'}   | ${'test\\'}                                                      | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_packages.pattern'}   | ${'test/'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_packages.pattern'}   | ${'test?'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_packages.pattern'}   | ${'test"'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_packages.pattern'}   | ${'test<'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_packages.pattern'}   | ${'test>'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_packages.pattern'}   | ${'test|'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_packages.pattern'}   | ${'test,'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_packages.pattern'}   | ${'test#'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_ports.pattern'}      | ${'test'}                                                        | ${200}             | ${null}
    ${'system_inventory_ports.pattern'}      | ${'test*'}                                                       | ${200}             | ${null}
    ${'system_inventory_ports.pattern'}      | ${''}                                                            | ${400}             | ${'[request body.pattern]: Value can not be empty.'}
    ${'system_inventory_ports.pattern'}      | ${'test space'}                                                  | ${400}             | ${'[request body.pattern]: No whitespaces allowed.'}
    ${'system_inventory_ports.pattern'}      | ${true}                                                          | ${400}             | ${'[request body.pattern]: expected value of type [string] but got [boolean]'}
    ${'system_inventory_ports.pattern'}      | ${'-test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'system_inventory_ports.pattern'}      | ${'_test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'system_inventory_ports.pattern'}      | ${'+test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'system_inventory_ports.pattern'}      | ${'.test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'system_inventory_ports.pattern'}      | ${'test\\'}                                                      | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_ports.pattern'}      | ${'test/'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_ports.pattern'}      | ${'test?'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_ports.pattern'}      | ${'test"'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_ports.pattern'}      | ${'test<'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_ports.pattern'}      | ${'test>'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_ports.pattern'}      | ${'test|'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_ports.pattern'}      | ${'test,'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_ports.pattern'}      | ${'test#'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_processes.pattern'}  | ${'test'}                                                        | ${200}             | ${null}
    ${'system_inventory_processes.pattern'}  | ${'test*'}                                                       | ${200}             | ${null}
    ${'system_inventory_processes.pattern'}  | ${''}                                                            | ${400}             | ${'[request body.pattern]: Value can not be empty.'}
    ${'system_inventory_processes.pattern'}  | ${'test space'}                                                  | ${400}             | ${'[request body.pattern]: No whitespaces allowed.'}
    ${'system_inventory_processes.pattern'}  | ${true}                                                          | ${400}             | ${'[request body.pattern]: expected value of type [string] but got [boolean]'}
    ${'system_inventory_processes.pattern'}  | ${'-test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'system_inventory_processes.pattern'}  | ${'_test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'system_inventory_processes.pattern'}  | ${'+test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'system_inventory_processes.pattern'}  | ${'.test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'system_inventory_processes.pattern'}  | ${'test\\'}                                                      | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_processes.pattern'}  | ${'test/'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_processes.pattern'}  | ${'test?'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_processes.pattern'}  | ${'test"'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_processes.pattern'}  | ${'test<'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_processes.pattern'}  | ${'test>'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_processes.pattern'}  | ${'test|'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_processes.pattern'}  | ${'test,'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_processes.pattern'}  | ${'test#'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_protocols.pattern'}  | ${'test'}                                                        | ${200}             | ${null}
    ${'system_inventory_protocols.pattern'}  | ${'test*'}                                                       | ${200}             | ${null}
    ${'system_inventory_protocols.pattern'}  | ${''}                                                            | ${400}             | ${'[request body.pattern]: Value can not be empty.'}
    ${'system_inventory_protocols.pattern'}  | ${'test space'}                                                  | ${400}             | ${'[request body.pattern]: No whitespaces allowed.'}
    ${'system_inventory_protocols.pattern'}  | ${true}                                                          | ${400}             | ${'[request body.pattern]: expected value of type [string] but got [boolean]'}
    ${'system_inventory_protocols.pattern'}  | ${'-test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'system_inventory_protocols.pattern'}  | ${'_test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'system_inventory_protocols.pattern'}  | ${'+test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'system_inventory_protocols.pattern'}  | ${'.test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'system_inventory_protocols.pattern'}  | ${'test\\'}                                                      | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_protocols.pattern'}  | ${'test/'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_protocols.pattern'}  | ${'test?'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_protocols.pattern'}  | ${'test"'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_protocols.pattern'}  | ${'test<'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_protocols.pattern'}  | ${'test>'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_protocols.pattern'}  | ${'test|'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_protocols.pattern'}  | ${'test,'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_protocols.pattern'}  | ${'test#'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_system.pattern'}     | ${'test'}                                                        | ${200}             | ${null}
    ${'system_inventory_system.pattern'}     | ${'test*'}                                                       | ${200}             | ${null}
    ${'system_inventory_system.pattern'}     | ${''}                                                            | ${400}             | ${'[request body.pattern]: Value can not be empty.'}
    ${'system_inventory_system.pattern'}     | ${'test space'}                                                  | ${400}             | ${'[request body.pattern]: No whitespaces allowed.'}
    ${'system_inventory_system.pattern'}     | ${true}                                                          | ${400}             | ${'[request body.pattern]: expected value of type [string] but got [boolean]'}
    ${'system_inventory_system.pattern'}     | ${'-test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'system_inventory_system.pattern'}     | ${'_test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'system_inventory_system.pattern'}     | ${'+test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'system_inventory_system.pattern'}     | ${'.test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'system_inventory_system.pattern'}     | ${'test\\'}                                                      | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_system.pattern'}     | ${'test/'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_system.pattern'}     | ${'test?'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_system.pattern'}     | ${'test"'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_system.pattern'}     | ${'test<'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_system.pattern'}     | ${'test>'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_system.pattern'}     | ${'test|'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_system.pattern'}     | ${'test,'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_system.pattern'}     | ${'test#'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'timeout'}                             | ${15000}                                                         | ${200}             | ${null}
    ${'timeout'}                             | ${1000}                                                          | ${400}             | ${'[request body.timeout]: Value should be greater or equal than 1500.'}
    ${'timeout'}                             | ${''}                                                            | ${400}             | ${'[request body.timeout]: expected value of type [number] but got [string]'}
    ${'timeout'}                             | ${1.2}                                                           | ${400}             | ${'[request body.timeout]: Number should be an integer.'}
    ${'wazuh.monitoring.creation'}           | ${'h'}                                                           | ${200}             | ${null}
    ${'wazuh.monitoring.creation'}           | ${'d'}                                                           | ${200}             | ${null}
    ${'wazuh.monitoring.creation'}           | ${'w'}                                                           | ${200}             | ${null}
    ${'wazuh.monitoring.creation'}           | ${'m'}                                                           | ${200}             | ${null}
    ${'wazuh.monitoring.creation'}           | ${'test'}                                                        | ${400}             | ${'[request body.wazuh.monitoring.creation]: types that failed validation:\n- [request body.wazuh.monitoring.creation.0]: expected value to equal [h]\n- [request body.wazuh.monitoring.creation.1]: expected value to equal [d]\n- [request body.wazuh.monitoring.creation.2]: expected value to equal [w]\n- [request body.wazuh.monitoring.creation.3]: expected value to equal [m]'}
    ${'wazuh.monitoring.enabled'}            | ${true}                                                          | ${200}             | ${null}
    ${'wazuh.monitoring.enabled'}            | ${0}                                                             | ${400}             | ${'[request body.wazuh.monitoring.enabled]: expected value of type [boolean] but got [number]'}
    ${'wazuh.monitoring.frequency'}          | ${100}                                                           | ${200}             | ${null}
    ${'wazuh.monitoring.frequency'}          | ${40}                                                            | ${400}             | ${'[request body.wazuh.monitoring.frequency]: Value should be greater or equal than 60.'}
    ${'wazuh.monitoring.frequency'}          | ${1.2}                                                           | ${400}             | ${'[request body.wazuh.monitoring.frequency]: Number should be an integer.'}
    ${'wazuh.monitoring.frequency'}          | ${''}                                                            | ${400}             | ${'[request body.wazuh.monitoring.frequency]: expected value of type [number] but got [string]'}
    ${'wazuh.monitoring.pattern'}            | ${'test'}                                                        | ${200}             | ${null}
    ${'wazuh.monitoring.pattern'}            | ${'test*'}                                                       | ${200}             | ${null}
    ${'wazuh.monitoring.pattern'}            | ${''}                                                            | ${400}             | ${'[request body.wazuh.monitoring.pattern]: value has length [0] but it must have a minimum length of [1].'}
    ${'wazuh.monitoring.pattern'}            | ${true}                                                          | ${400}             | ${'[request body.wazuh.monitoring.pattern]: expected value of type [string] but got [boolean]'}
    ${'wazuh.monitoring.pattern'}            | ${'-test'}                                                       | ${400}             | ${"[request body.wazuh.monitoring.pattern]: It can't start with: -, _, +, .."}
    ${'wazuh.monitoring.pattern'}            | ${'_test'}                                                       | ${400}             | ${"[request body.wazuh.monitoring.pattern]: It can't start with: -, _, +, .."}
    ${'wazuh.monitoring.pattern'}            | ${'+test'}                                                       | ${400}             | ${"[request body.wazuh.monitoring.pattern]: It can't start with: -, _, +, .."}
    ${'wazuh.monitoring.pattern'}            | ${'.test'}                                                       | ${400}             | ${"[request body.wazuh.monitoring.pattern]: It can't start with: -, _, +, .."}
    ${'wazuh.monitoring.pattern'}            | ${'test\\'}                                                      | ${400}             | ${'[request body.wazuh.monitoring.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'wazuh.monitoring.pattern'}            | ${'test/'}                                                       | ${400}             | ${'[request body.wazuh.monitoring.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'wazuh.monitoring.pattern'}            | ${'test?'}                                                       | ${400}             | ${'[request body.wazuh.monitoring.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'wazuh.monitoring.pattern'}            | ${'test"'}                                                       | ${400}             | ${'[request body.wazuh.monitoring.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'wazuh.monitoring.pattern'}            | ${'test<'}                                                       | ${400}             | ${'[request body.wazuh.monitoring.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'wazuh.monitoring.pattern'}            | ${'test>'}                                                       | ${400}             | ${'[request body.wazuh.monitoring.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'wazuh.monitoring.pattern'}            | ${'test|'}                                                       | ${400}             | ${'[request body.wazuh.monitoring.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'wazuh.monitoring.pattern'}            | ${'test,'}                                                       | ${400}             | ${'[request body.wazuh.monitoring.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'wazuh.monitoring.pattern'}            | ${'test#'}                                                       | ${400}             | ${'[request body.wazuh.monitoring.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'wazuh.monitoring.replicas'}           | ${0}                                                             | ${200}             | ${null}
    ${'wazuh.monitoring.replicas'}           | ${-1}                                                            | ${400}             | ${'[request body.wazuh.monitoring.replicas]: Value should be greater or equal than 0.'}
    ${'wazuh.monitoring.replicas'}           | ${1.2}                                                           | ${400}             | ${'[request body.wazuh.monitoring.replicas]: Number should be an integer.'}
    ${'wazuh.monitoring.replicas'}           | ${'custom'}                                                      | ${400}             | ${'[request body.wazuh.monitoring.replicas]: expected value of type [number] but got [string]'}
    ${'wazuh.monitoring.shards'}             | ${1}                                                             | ${200}             | ${null}
    ${'wazuh.monitoring.shards'}             | ${-1}                                                            | ${400}             | ${'[request body.wazuh.monitoring.shards]: Value should be greater or equal than 1.'}
    ${'wazuh.monitoring.shards'}             | ${1.2}                                                           | ${400}             | ${'[request body.wazuh.monitoring.shards]: Number should be an integer.'}
    ${'wazuh.monitoring.shards'}             | ${'custom'}                                                      | ${400}             | ${'[request body.wazuh.monitoring.shards]: expected value of type [number] but got [string]'}
    ${'vulnerabilities.pattern'}             | ${'test'}                                                        | ${200}             | ${null}
    ${'vulnerabilities.pattern'}             | ${'test*'}                                                       | ${200}             | ${null}
    ${'vulnerabilities.pattern'}             | ${''}                                                            | ${400}             | ${'[request body.pattern]: Value can not be empty.'}
    ${'vulnerabilities.pattern'}             | ${'test space'}                                                  | ${400}             | ${'[request body.pattern]: No whitespaces allowed.'}
    ${'vulnerabilities.pattern'}             | ${true}                                                          | ${400}             | ${'[request body.pattern]: expected value of type [string] but got [boolean]'}
    ${'vulnerabilities.pattern'}             | ${'-test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'vulnerabilities.pattern'}             | ${'_test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'vulnerabilities.pattern'}             | ${'+test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'vulnerabilities.pattern'}             | ${'.test'}                                                       | ${400}             | ${"[request body.pattern]: It can't start with: -, _, +, .."}
    ${'vulnerabilities.pattern'}             | ${'test\\'}                                                      | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'vulnerabilities.pattern'}             | ${'test/'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'vulnerabilities.pattern'}             | ${'test?'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'vulnerabilities.pattern'}             | ${'test"'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'vulnerabilities.pattern'}             | ${'test<'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'vulnerabilities.pattern'}             | ${'test>'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'vulnerabilities.pattern'}             | ${'test|'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'vulnerabilities.pattern'}             | ${'test,'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'vulnerabilities.pattern'}             | ${'test#'}                                                       | ${400}             | ${'[request body.pattern]: It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
  `(
    `$setting: $value - PUT /utils/configuration - $responseStatusCode`,
    async ({ responseBodyMessage, responseStatusCode, setting, value }) => {
      // TODO: try to mock the router
      const body = { [setting]: value };
      const response = await supertest(innerServer.listener)
        .put('/utils/configuration')
        .send(body)
        .expect(responseStatusCode);

      responseStatusCode === 200 &&
        expect(response.body.data.updatedConfiguration).toEqual(body);
      responseStatusCode === 200 &&
        expect(response.body.data.requiresRunningHealthCheck).toBe(
          Boolean(PLUGIN_SETTINGS[setting].requiresRunningHealthCheck),
        );
      responseStatusCode === 200 &&
        expect(response.body.data.requiresReloadingBrowserTab).toBe(
          Boolean(PLUGIN_SETTINGS[setting].requiresReloadingBrowserTab),
        );
      responseStatusCode === 200 &&
        expect(response.body.data.requiresRestartingPluginPlatform).toBe(
          Boolean(PLUGIN_SETTINGS[setting].requiresRestartingPluginPlatform),
        );
      responseBodyMessage &&
        expect(response.body.message).toMatch(responseBodyMessage);
    },
  );
});

describe.skip('[endpoint] PUT /utils/configuration/files/{key} - Upload file', () => {
  const PUBLIC_CUSTOM_ASSETS_PATH = path.join(
    __dirname,
    '../../../',
    'public/assets/custom',
  );

  beforeAll(() => {});

  afterAll(() => {});

  it.each`
    setting                             | filename                     | responseStatusCode | responseBodyMessage
    ${'customization.logo.unknown'}     | ${'fixture_image_small.jpg'} | ${400}             | ${'[request params.key]: types that failed validation:\n- [request params.key.0]: expected value to equal [customization.logo.app]\n- [request params.key.1]: expected value to equal [customization.logo.healthcheck]\n- [request params.key.2]: expected value to equal [customization.logo.reports]'}
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
    ${'customization.logo.reports'}     | ${'fixture_image_small.svg'} | ${400}             | ${'File extension is not valid for setting [customization.logo.reports] setting. Allowed file extensions: .jpeg, .jpg, .png'}
  `(
    `$setting: $filename - PUT /utils/configuration/files/{key} - $responseStatusCode`,
    async ({ responseBodyMessage, responseStatusCode, setting, filename }) => {
      const filePath = path.join(__dirname, 'fixtures', filename);
      const extension = path.extname(filename);

      const response = await supertest(innerServer.listener)
        .put(`/utils/configuration/files/${setting}`)
        .attach('file', filePath)
        .expect(responseStatusCode);

      responseStatusCode === 200 &&
        expect(response.body.data.updatedConfiguration[setting]).toBeDefined();
      responseStatusCode === 200 &&
        expect(response.body.data.updatedConfiguration[setting]).toMatch(
          `${setting}${extension}`,
        );
      responseStatusCode === 200 &&
        expect(response.body.data.requiresRunningHealthCheck).toBe(
          Boolean(PLUGIN_SETTINGS[setting].requiresRunningHealthCheck),
        );
      responseStatusCode === 200 &&
        expect(response.body.data.requiresReloadingBrowserTab).toBe(
          Boolean(PLUGIN_SETTINGS[setting].requiresReloadingBrowserTab),
        );
      responseStatusCode === 200 &&
        expect(response.body.data.requiresRestartingPluginPlatform).toBe(
          Boolean(PLUGIN_SETTINGS[setting].requiresRestartingPluginPlatform),
        );
      responseBodyMessage &&
        expect(response.body.message).toMatch(responseBodyMessage);

      // Check the file was created in the expected path of the file system.
      if (response?.body?.data?.updatedConfiguration?.[setting]) {
        const targetFilepath = path.join(
          __dirname,
          '../../../',
          PLUGIN_SETTINGS[setting].options.file.store.relativePathFileSystem,
          `${PLUGIN_SETTINGS[setting].options.file.store.filename}${extension}`,
        );
        const files = glob.sync(path.join(targetFilepath));
        expect(files[0]).toBeDefined();
      }
    },
  );
});

// TODO: this has to be done as a integration test because uses the real setting definition
describe.skip('[endpoint] DELETE /utils/configuration/files/{key} - Delete file', () => {
  const PUBLIC_CUSTOM_ASSETS_PATH = path.join(
    __dirname,
    '../../../',
    'public/assets/custom',
  );

  beforeAll(() => {});

  afterAll(() => {});

  it.each`
    setting                             | expectedValue | responseStatusCode | responseBodyMessage
    ${'customization.logo.unknown'}     | ${''}         | ${400}             | ${'[request params.key]: types that failed validation:\n- [request params.key.0]: expected value to equal [customization.logo.app]\n- [request params.key.1]: expected value to equal [customization.logo.healthcheck]\n- [request params.key.2]: expected value to equal [customization.logo.reports]'}
    ${'customization.logo.app'}         | ${''}         | ${200}             | ${'All files were removed and the configuration file was updated.'}
    ${'customization.logo.healthcheck'} | ${''}         | ${200}             | ${'All files were removed and the configuration file was updated.'}
    ${'customization.logo.reports'}     | ${''}         | ${200}             | ${'All files were removed and the configuration file was updated.'}
  `(
    `$setting - PUT /utils/configuration - $responseStatusCode`,
    async ({
      responseBodyMessage,
      responseStatusCode,
      setting,
      expectedValue,
    }) => {
      // If the setting is defined in the plugin
      if (PLUGIN_SETTINGS[setting]) {
        // TODO: Create the directory where the asset was stored.
        //
        // createDirectoryIfNotExists(
        //   path.join(
        //     __dirname,
        //     '../../../',
        //     PLUGIN_SETTINGS[setting].options.file.store.relativePathFileSystem,
        //   ),
        // );

        // Create a empty file
        fs.writeFileSync(
          path.join(
            __dirname,
            '../../../',
            PLUGIN_SETTINGS[setting].options.file.store.relativePathFileSystem,
            `${PLUGIN_SETTINGS[setting].options.file.store.filename}.jpg`,
          ),
          '',
          'utf8',
        );
      }

      const response = await supertest(innerServer.listener)
        .delete(`/utils/configuration/files/${setting}`)
        .expect(responseStatusCode);

      responseStatusCode === 200 &&
        expect(response.body.data.updatedConfiguration[setting]).toBeDefined();
      responseStatusCode === 200 &&
        expect(response.body.data.updatedConfiguration[setting]).toMatch(
          expectedValue,
        );
      responseStatusCode === 200 &&
        expect(response.body.data.requiresRunningHealthCheck).toBe(
          Boolean(PLUGIN_SETTINGS[setting].requiresRunningHealthCheck),
        );
      responseStatusCode === 200 &&
        expect(response.body.data.requiresReloadingBrowserTab).toBe(
          Boolean(PLUGIN_SETTINGS[setting].requiresReloadingBrowserTab),
        );
      responseStatusCode === 200 &&
        expect(response.body.data.requiresRestartingPluginPlatform).toBe(
          Boolean(PLUGIN_SETTINGS[setting].requiresRestartingPluginPlatform),
        );
      responseBodyMessage &&
        expect(response.body.message).toMatch(responseBodyMessage);

      // Check the file was deleted from the expected path of the file system.
      if (response?.body?.data?.updatedConfiguration?.[setting]) {
        const targetFilepath = path.join(
          __dirname,
          '../../../',
          PLUGIN_SETTINGS[setting].options.file.store.relativePathFileSystem,
          `${PLUGIN_SETTINGS[setting].options.file.store.filename}.*`,
        );
        const files = glob.sync(path.join(targetFilepath));
        expect(files).toHaveLength(0);
      }
    },
  );
});
