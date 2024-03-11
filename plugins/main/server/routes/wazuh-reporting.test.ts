// To launch this file
// yarn test:jest --testEnvironment node --verbose server/routes/wazuh-reporting
import { Router } from '../../../../src/core/server/http/router/router';
import { HttpServer } from '../../../../src/core/server/http/http_server';
import { loggingSystemMock } from '../../../../src/core/server/logging/logging_system.mock';
import { ByteSizeValue } from '@osd/config-schema';
import supertest from 'supertest';
import { WazuhUtilsRoutes } from './wazuh-utils';
import { WazuhReportingRoutes } from './wazuh-reporting';
import { WazuhUtilsCtrl } from '../controllers/wazuh-utils/wazuh-utils';
import md5 from 'md5';
import path from 'path';
import {
  createDataDirectoryIfNotExists,
  createDirectoryIfNotExists,
} from '../lib/filesystem';
import {
  WAZUH_DATA_CONFIG_DIRECTORY_PATH,
  WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH,
  WAZUH_DATA_ABSOLUTE_PATH,
  WAZUH_DATA_DOWNLOADS_DIRECTORY_PATH,
} from '../../common/constants';
import { execSync } from 'child_process';
import fs from 'fs';

jest.mock('../lib/reporting/extended-information', () => ({
  extendedInformation: jest.fn(),
}));
const USER_NAME = 'admin';
const loggingService = loggingSystemMock.create();
const logger = loggingService.get();
const context = {
  wazuh: {
    security: {
      getCurrentUser: request => {
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
  createDataDirectoryIfNotExists();

  // Create <PLUGIN_PLATFORM_PATH>/data/wazuh/config directory.
  createDirectoryIfNotExists(WAZUH_DATA_CONFIG_DIRECTORY_PATH);

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
  execSync(`rm -rf ${WAZUH_DATA_ABSOLUTE_PATH}`);
});

describe('[endpoint] GET /reports', () => {
  const directories = [
    { username: 'admin', files: 0 },
    { username: '../../etc', files: 1 },
  ];
  beforeAll(() => {
    // Create <PLUGIN_PLATFORM_PATH>/data/wazuh directory.
    createDataDirectoryIfNotExists();

    // Create <PLUGIN_PLATFORM_PATH>/data/wazuh/downloads directory.
    createDirectoryIfNotExists(WAZUH_DATA_DOWNLOADS_DIRECTORY_PATH);

    // Create <PLUGIN_PLATFORM_PATH>/data/wazuh/downloads/reports directory.
    createDirectoryIfNotExists(WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH);

    // Create directories and file/s within directory.
    directories.forEach(({ username, files }) => {
      const hashUsername = md5(username);
      createDirectoryIfNotExists(
        path.join(WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH, hashUsername),
      );
      if (files) {
        Array.from(Array(files).keys()).forEach(indexFile => {
          fs.closeSync(
            fs.openSync(
              path.join(
                WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH,
                hashUsername,
                `report_${indexFile}.pdf`,
              ),
              'w',
            ),
          );
        });
      }
    });
  });

  afterAll(async () => {
    // Remove <PLUGIN_PLATFORM_PATH>/data/wazuh/downloads directory.
    execSync(`rm -rf ${WAZUH_DATA_DOWNLOADS_DIRECTORY_PATH}`);
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

describe('[endpoint] PUT /utils/configuration', () => {
  const SettingsDefinitions = {
    'customization.enabled': {
      defaultValueIfNotSet: true,
      isConfigurableFromSettings: true,
      validateBackend: schema => schema.boolean(),
    },
    'customization.logo.reports': {
      defaultValueIfNotSet: 'images/logo_reports.png',
      isConfigurableFromSettings: true,
      validateBackend: schema => schema.boolean(),
    },
    'customization.reports.header': {
      defaultValueIfNotSet: 'Original header',
      isConfigurableFromSettings: true,
      validateBackend: schema => schema.string(),
    },
    'customization.reports.footer': {
      defaultValueIfNotSet: 'Original footer',
      isConfigurableFromSettings: true,
      validateBackend: schema => schema.string(),
    },
  };
  beforeAll(() => {
    context.wazuh_core.configuration._settings = new Map();
    Object.entries(SettingsDefinitions).forEach(([key, value]) =>
      context.wazuh_core.configuration._settings.set(key, value),
    );
  });

  afterAll(() => {
    // Reset the configuration
    context.wazuh_core.configuration._settings = null;
  });

  // expectedMD5 variable is a verified md5 of a report generated with this header and footer
  // If any of the parameters is changed this variable should be updated with the new md5
  it.each`
    footer              | header                                 | responseStatusCode | expectedMD5                           | tab
    ${null}             | ${null}                                | ${200}             | ${'2a8dfb6e1fa377ce6a235bd5b4b701b5'} | ${'pm'}
    ${'Custom\nFooter'} | ${'info@company.com\nFake Avenue 123'} | ${200}             | ${'9003caabb5a3ef69b4b7e56e8c549011'} | ${'general'}
    ${''}               | ${''}                                  | ${200}             | ${'66bd70790000b5016f42775653a0f169'} | ${'fim'}
    ${'Custom Footer'}  | ${null}                                | ${200}             | ${'ed1b880b6141fde5c9109178ea112646'} | ${'aws'}
    ${null}             | ${'Custom Header'}                     | ${200}             | ${'03dc1e5a92741ea2c7d26deb12154254'} | ${'gcp'}
  `(
    `Set custom report header and footer - Verify PDF output`,
    async ({ footer, header, responseStatusCode, expectedMD5, tab }) => {
      // Mock PDF report parameters
      const reportBody = {
        array: [],
        serverSideQuery: [],
        filters: [],
        time: {
          from: '2022-10-01T09:59:40.825Z',
          to: '2022-10-04T09:59:40.825Z',
        },
        searchBar: '',
        tables: [],
        tab: tab,
        section: 'overview',
        agents: false,
        browserTimezone: 'Europe/Madrid',
        indexPatternTitle: 'wazuh-alerts-*',
        apiId: 'default',
      };

      // Define custom configuration
      const configurationBody = {};

      if (typeof footer == 'string') {
        configurationBody['customization.reports.footer'] = footer;
      }
      if (typeof header == 'string') {
        configurationBody['customization.reports.header'] = header;
      }

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

      const afterUpdateConfiguration = {
        ...initialConfig,
        ...configurationBody,
      };
      context.wazuh_core.configuration.get.mockReturnValueOnce(initialConfig);

      context.wazuh_core.configuration.getCustomizationSetting.mockImplementation(
        setting => {
          return (
            afterUpdateConfiguration?.[setting] ??
            SettingsDefinitions?.[setting]?.defaultValueIfNotSet
          );
        },
      );

      context.wazuh_core.dashboardSecurity.isAdministratorUser.mockImplementation(
        () => ({ administrator: true }),
      );

      // Set custom report header and footer
      if (typeof footer === 'string' || typeof header === 'string') {
        context.wazuh_core.configuration.set.mockReturnValueOnce({
          update: configurationBody,
        });
        const responseConfig = await supertest(innerServer.listener)
          .put('/utils/configuration')
          .send(configurationBody)
          .expect(responseStatusCode);

        expect(responseConfig.body.data.updatedConfiguration).toEqual(
          configurationBody,
        );
      }

      // Generate PDF report
      const responseReport = await supertest(innerServer.listener)
        .post(`/reports/modules/${tab}`)
        .set('x-test-username', USER_NAME)
        .send(reportBody);
      // .expect(200);

      const fileName =
        responseReport.body?.message.match(/([A-Z-0-9]*\.pdf)/gi)[0];
      const userPath = md5(USER_NAME);
      const reportPath = `${WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH}/${userPath}/${fileName}`;
      const PDFbuffer = fs.readFileSync(reportPath);
      const PDFcontent = PDFbuffer.toString('utf8');
      const content = PDFcontent.replace(
        /\[<[a-z0-9].+> <[a-z0-9].+>\]/gi,
        '',
      ).replace(/(obj\n\(D:[0-9].+Z\)\nendobj)/gi, '');
      const PDFmd5 = md5(content);

      expect(PDFmd5).toBe(expectedMD5);
    },
  );
});
