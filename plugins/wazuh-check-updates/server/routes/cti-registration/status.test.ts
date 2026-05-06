import { Router } from '../../../../../src/core/server/http/router/router';
import { HttpServer } from '../../../../../src/core/server/http/http_server';
import { loggingSystemMock } from '../../../../../src/core/server/logging/logging_system.mock';
import { ByteSizeValue } from '@osd/config-schema';
import { routes } from '../../../common/constants';
import { getCtiRegistrationStatusRoute } from './status';
import {
  getCtiSubscriptionStatus,
  resolveCtiOAuthClientId,
} from '../../services/cti-registration';
import {
  CtiRegistrationStore,
  parseDeviceAuthorizationForStore,
} from '../../services/cti-registration/cti-registration-store';
import supertest from 'supertest';

const serverAddress = '127.0.0.1';
const port = 11007;

const mockedResolve = resolveCtiOAuthClientId as jest.Mock;
const mockedGetCtiSubscriptionStatus = getCtiSubscriptionStatus as jest.Mock;

jest.mock('../../services/cti-registration', () => ({
  resolveCtiOAuthClientId: jest.fn(),
  getCtiSubscriptionStatus: jest.fn().mockResolvedValue({
    message: null,
    status: null,
  }),
}));

const loggingService = loggingSystemMock.create();
const logger = loggingService.get();
const context = {
  wazuh_check_updates: {
    security: {
      getCurrentUser: () => ({ username: 'admin' }),
    },
  },
};
const enhanceWithContext = (fn: (...args: unknown[]) => unknown) =>
  fn.bind(null, context);
let server: HttpServer;
let innerServer: { listener: import('http').Server };

beforeAll(async () => {
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

  getCtiRegistrationStatusRoute(router);
  registerRouter(router);
  await server.start();
});

afterAll(async () => {
  CtiRegistrationStore.resetForTests();
  await server.stop();
  jest.clearAllMocks();
});

describe('CTI registration status route', () => {
  beforeEach(() => {
    CtiRegistrationStore.resetForTests();
    mockedResolve.mockResolvedValue('env-uuid-1');
    mockedGetCtiSubscriptionStatus.mockResolvedValue({
      message: null,
      status: null,
    });
  });

  test(`GET ${routes.ctiRegistrationStatus} when store is empty`, async () => {
    const response = await supertest(innerServer.listener)
      .get(routes.ctiRegistrationStatus)
      .expect(200);

    expect(response.body).toEqual({
      registrationComplete: false,
      inProgress: false,
      subscription: { message: null, status: null },
    });
    expect(mockedGetCtiSubscriptionStatus).toHaveBeenCalledWith('env-uuid-1');
  });

  test(`GET ${routes.ctiRegistrationStatus} when CTI subscription is registered`, async () => {
    mockedGetCtiSubscriptionStatus.mockResolvedValueOnce({
      message: {
        plan: { name: 'Premium Plan', is_public: true },
        is_registered: true,
      },
      status: 200,
    });

    const response = await supertest(innerServer.listener)
      .get(routes.ctiRegistrationStatus)
      .expect(200);

    expect(response.body).toEqual({
      registrationComplete: false,
      inProgress: false,
      subscription: {
        message: {
          plan: { name: 'Premium Plan', is_public: true },
          is_registered: true,
        },
        status: 200,
      },
    });
  });

  test(`GET ${routes.ctiRegistrationStatus} returns in-progress snapshot`, async () => {
    const parsed = parseDeviceAuthorizationForStore({
      device_code: 'dc-store',
      user_code: 'WZH-9',
      verification_uri: 'https://console.wazuh.com/register',
      expires_in: 600,
      interval: 8,
    });
    CtiRegistrationStore.getInstance().setInProgress('env-uuid-1', parsed);

    const response = await supertest(innerServer.listener)
      .get(routes.ctiRegistrationStatus)
      .expect(200);

    expect(response.body.registrationComplete).toBe(false);
    expect(response.body.inProgress).toBe(true);
    expect(response.body.device_code).toBe('dc-store');
    expect(response.body.user_code).toBe('WZH-9');
    expect(response.body.poll_interval_sec).toBe(8);
    expect(typeof response.body.expires_in_remaining_sec).toBe('number');
    expect(response.body.subscription).toEqual({
      message: null,
      status: null,
    });
  });

  test(`GET ${routes.ctiRegistrationStatus} when registration completed`, async () => {
    const parsed = parseDeviceAuthorizationForStore({
      device_code: 'dc1',
      user_code: 'WZH-1',
      verification_uri: 'https://console.wazuh.com/register',
      expires_in: 600,
      interval: 5,
    });
    const store = CtiRegistrationStore.getInstance();
    store.setInProgress('env-uuid-1', parsed);
    store.setRegistrationComplete('env-uuid-1');

    const response = await supertest(innerServer.listener)
      .get(routes.ctiRegistrationStatus)
      .expect(200);

    expect(response.body).toEqual({
      registrationComplete: true,
      inProgress: false,
      subscription: { message: null, status: null },
    });
  });
});
