import { Router } from '../../../../../src/core/server/http/router/router';
import { HttpServer } from '../../../../../src/core/server/http/http_server';
import { loggingSystemMock } from '../../../../../src/core/server/logging/logging_system.mock';
import { ByteSizeValue } from '@osd/config-schema';
import {
  routes,
  CTI_OAUTH_DEVICE_GRANT_TYPE,
  CTI_REGISTRATION_COMPLETED_BODY,
} from '../../../common/constants';
import { getCtiTokenRoute } from './token';
import {
  getCtiToken,
  pollCtiToken,
  resolveCtiOAuthClientId,
} from '../../services/cti-registration';
import {
  CtiRegistrationStore,
  parseDeviceAuthorizationForStore,
} from '../../services/cti-registration/cti-registration-store';
import supertest from 'supertest';

jest.mock('../../plugin-services', () => ({
  getWazuhCheckUpdatesServices: () => ({
    logger: { warn: jest.fn(), error: jest.fn() },
  }),
}));

const serverAddress = '127.0.0.1';
const port = 11006;

const mockedGetCtiToken = getCtiToken as jest.Mock;
const mockedPollCtiToken = pollCtiToken as jest.Mock;
const mockedResolve = resolveCtiOAuthClientId as jest.Mock;

jest.mock('../../services/cti-registration', () => ({
  CtiConfigurationError: class CtiConfigurationError extends Error {},
  getCtiToken: jest.fn(),
  pollCtiToken: jest.fn(),
  resolveCtiOAuthClientId: jest.fn(),
  getCtiConsoleBaseUrl: jest.fn(),
  fetchOpenSearchClusterUuid: jest.fn(),
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

  getCtiTokenRoute(router);
  registerRouter(router);
  await server.start();
});

afterAll(async () => {
  CtiRegistrationStore.resetForTests();
  await server.stop();
  jest.clearAllMocks();
});

describe('CTI token route', () => {
  beforeEach(() => {
    CtiRegistrationStore.resetForTests();
    mockedResolve.mockResolvedValue('resolved-client-id');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test(`POST ${routes.token} device authorization forwards getCtiToken`, async () => {
    mockedGetCtiToken.mockResolvedValue({
      device_code: 'dc1',
      user_code: 'WZH-1',
    });

    const response = await supertest(innerServer.listener)
      .post(routes.token)
      .send({})
      .expect(200);

    expect(response.body).toEqual({
      device_code: 'dc1',
      user_code: 'WZH-1',
    });
    expect(mockedResolve).toHaveBeenCalledWith(undefined);
    expect(mockedGetCtiToken).toHaveBeenCalledWith('resolved-client-id');
    expect(mockedPollCtiToken).not.toHaveBeenCalled();
  });

  test('POST device authorization persists registration in store', async () => {
    mockedGetCtiToken.mockResolvedValue({
      device_code: 'dc1',
      user_code: 'WZH-1',
      verification_uri: 'https://console.wazuh.com/register',
      verification_uri_complete:
        'https://console.wazuh.com/register?user_code=WZH-1',
      expires_in: 600,
      interval: 7,
    });

    await supertest(innerServer.listener)
      .post(routes.token)
      .send({})
      .expect(200);

    const stored = CtiRegistrationStore.getInstance().getStatus(
      'resolved-client-id',
    );
    expect(stored?.device_code).toBe('dc1');
    expect(stored?.poll_interval_sec).toBe(7);
    expect(stored?.registrationComplete).toBe(false);
  });

  test('POST polling OAuth terminal error clears registration store', async () => {
    const parsed = parseDeviceAuthorizationForStore({
      device_code: 'dc1',
      user_code: 'WZH-1',
      verification_uri: 'https://console.wazuh.com/register',
      expires_in: 600,
      interval: 5,
    });
    CtiRegistrationStore.getInstance().setInProgress('resolved-client-id', parsed);

    mockedPollCtiToken.mockResolvedValue({ error: 'access_denied' });

    await supertest(innerServer.listener)
      .post(routes.token)
      .send({
        grant_type: CTI_OAUTH_DEVICE_GRANT_TYPE,
        device_code: 'dc1',
      })
      .expect(200);

    expect(
      CtiRegistrationStore.getInstance().getStatus('resolved-client-id'),
    ).toBeUndefined();
  });

  test(`POST ${routes.token} polling returns success marker without token fields`, async () => {
    mockedPollCtiToken.mockResolvedValue({ access_token: 'tok' });

    const response = await supertest(innerServer.listener)
      .post(routes.token)
      .send({
        grant_type: CTI_OAUTH_DEVICE_GRANT_TYPE,
        device_code: 'dc1',
      })
      .expect(200);

    expect(response.body).toEqual(CTI_REGISTRATION_COMPLETED_BODY);
    expect(mockedPollCtiToken).toHaveBeenCalledWith('resolved-client-id', 'dc1');
    expect(mockedGetCtiToken).not.toHaveBeenCalled();
    expect(
      CtiRegistrationStore.getInstance().getStatus('resolved-client-id')
        ?.registrationComplete,
    ).toBe(true);
  });

  test('POST rejects partial polling body', async () => {
    await supertest(innerServer.listener)
      .post(routes.token)
      .send({ device_code: 'dc1' })
      .expect(400);

    expect(mockedPollCtiToken).not.toHaveBeenCalled();
    expect(mockedGetCtiToken).not.toHaveBeenCalled();
  });
});
