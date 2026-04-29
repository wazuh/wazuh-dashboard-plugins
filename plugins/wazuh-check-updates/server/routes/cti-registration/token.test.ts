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
import supertest from 'supertest';

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
  await server.stop();
  jest.clearAllMocks();
});

describe('CTI token route', () => {
  beforeEach(() => {
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
