// To launch this file
// yarn test:jest --testEnvironment node --verbose server/routes/wazuh-hosts
import supertest from 'supertest';
import { createMockPlatformServer } from '../mocks/platform-server.mock';
import { WazuhHostsRoutes } from './wazuh-hosts';

function noop() {}
const logger = {
  debug: noop,
  info: noop,
  warn: noop,
  error: noop,
};
const context = {
  wazuh: {
    logger,
  },
  wazuh_core: {
    configuration: {
      _settings: new Map(),
      logger,
      get: jest.fn(),
      set: jest.fn(),
    },
    manageHosts: {
      getEntries: jest.fn(),
      create: jest.fn(),
    },
    dashboardSecurity: {
      isAdministratorUser: jest.fn(),
    },
  },
};
const mockPlatformServer = createMockPlatformServer(context);

beforeAll(async () => {
  // Register settings
  context.wazuh_core.configuration._settings.set('hosts', {
    options: {
      arrayOf: {
        id: {},
        url: {},
        port: {},
        username: {},
        password: {},
        run_as: {},
      },
    },
  });
  const registerRoutes = router =>
    WazuhHostsRoutes(router, {
      configuration: context.wazuh_core.configuration,
    });
  await mockPlatformServer.start(registerRoutes);
});

afterAll(async () => {
  await mockPlatformServer.stop();
});

describe('[endpoint] GET /hosts/apis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each`
    storedAPIs
    ${[{
    id: 'default',
    url: 'https://localhost',
    port: 55000,
    username: 'test',
    password: 'test',
    run_as: false,
  }]}
    ${[{
    id: 'default',
    url: 'https://localhost',
    port: 55000,
    username: 'test',
    password: 'test',
    run_as: false,
  }, {
    id: 'default2',
    url: 'https://localhost',
    port: 55000,
    username: 'test',
    password: 'test',
    run_as: false,
  }]}
  `('Get API hosts', async ({ storedAPIs }) => {
    let currentAPIs = storedAPIs;
    context.wazuh_core.manageHosts.getEntries.mockImplementation(() =>
      currentAPIs.map(currentAPI => ({ ...currentAPI, cluster_info: {} })),
    );
    const response = await supertest(mockPlatformServer.getServerListener())
      .get(`/hosts/apis`)
      .expect(200);

    currentAPIs.forEach((currentAPI, index) => {
      Object.keys(currentAPI).forEach(key => {
        expect(response.body[index][key]).toBe(currentAPI[key]);
      });
      expect(response.body[index].cluster_info).toBeDefined();
    });
  });
});
