/* eslint-disable camelcase -- CTI fields keep their API names */
import { Router } from '../../../../../src/core/server/http/router/router';
import { HttpServer } from '../../../../../src/core/server/http/http_server';
import { loggingSystemMock } from '../../../../../src/core/server/logging/logging_system.mock';
import { ByteSizeValue } from '@osd/config-schema';
import supertest from 'supertest';
import { routes } from '../../../common/constants';
import { getCtiClearRegistrationRoute } from './clear';
import {
  deleteContentManagerSubscription,
  evaluateCtiRegistrationPermission,
  getCtiSubscriptionStatus,
  resolveCtiOAuthClientId,
} from '../../services/cti-registration';
import {
  CtiRegistrationStore,
  parseDeviceAuthorizationForStore,
} from '../../services/cti-registration/cti-registration-store';
import { CtiConfigurationError } from '../../services/cti-registration/cti-console-url';
import { triggerContentUpdateOnChange } from '../../services/cti-registration/trigger-content-update-on-change';

jest.mock('../../services/cti-registration', () => ({
  deleteContentManagerSubscription: jest.fn(),
  evaluateCtiRegistrationPermission: jest.fn(),
  getCtiSubscriptionStatus: jest.fn(),
  resolveCtiOAuthClientId: jest.fn(),
}));

jest.mock(
  '../../services/cti-registration/trigger-content-update-on-change',
  () => ({ triggerContentUpdateOnChange: jest.fn() }),
);

jest.mock('../../plugin-services', () => {
  const loggerError = jest.fn();
  return {
    getWazuhCheckUpdatesServices: jest.fn().mockReturnValue({
      logger: { error: loggerError },
    }),
  };
});

const mockedDelete = deleteContentManagerSubscription as jest.Mock;
const mockedEvaluatePermission = evaluateCtiRegistrationPermission as jest.Mock;
const mockedGetSubscription = getCtiSubscriptionStatus as jest.Mock;
const mockedResolve = resolveCtiOAuthClientId as jest.Mock;
const mockedTrigger = triggerContentUpdateOnChange as jest.Mock;

const serverAddress = '127.0.0.1';
const port = 11213;

const mockWazuhClient = { asCurrentUser: {} };
const context = { core: { opensearch: { client: mockWazuhClient } } };
const enhanceWithContext = (fn: (...args: unknown[]) => unknown) =>
  fn.bind(null, context);

const loggingService = loggingSystemMock.create();
const logger = loggingService.get();
let server: HttpServer;
let innerServer: { listener: import('http').Server };

const REGISTERED = {
  message: {
    plan: { name: 'Professional', is_public: false },
    is_registered: true,
  },
  status: 200,
};
const UNREGISTERED = {
  message: { plan: { name: 'Open', is_public: true }, is_registered: false },
  status: 200,
};

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
  } as unknown as Parameters<HttpServer['setup']>[0];

  server = new HttpServer(loggingService, 'tests');
  const router = new Router('', logger, enhanceWithContext);
  const { registerRouter, server: innerServerTest } = await server.setup(
    config,
  );
  innerServer = innerServerTest;

  getCtiClearRegistrationRoute(router);
  registerRouter(router);
  await server.start();
});

afterAll(async () => {
  CtiRegistrationStore.resetForTests();
  await server.stop();
  jest.clearAllMocks();
});

describe(`DELETE ${routes.ctiRegistration}`, () => {
  beforeEach(() => {
    jest.clearAllMocks();
    CtiRegistrationStore.resetForTests();
    mockedEvaluatePermission.mockResolvedValue({
      accessAllowed: true,
      missingPrivileges: [],
    });
    mockedResolve.mockResolvedValue('env-uuid-1');
    mockedGetSubscription
      .mockResolvedValueOnce(REGISTERED)
      .mockResolvedValueOnce(UNREGISTERED);
    mockedDelete.mockResolvedValue(undefined);
    mockedTrigger.mockResolvedValue({ triggered: false, failed: false });
  });

  test('clears the registration stored in the indexer', async () => {
    const response = await supertest(innerServer.listener)
      .delete(routes.ctiRegistration)
      .expect(200);

    expect(response.body).toEqual({ cleared: true });
    expect(mockedEvaluatePermission).toHaveBeenCalledWith(
      mockWazuhClient,
      'clear',
    );
    expect(mockedDelete).toHaveBeenCalledWith(mockWazuhClient);
  });

  test('reads the subscription before and after, so the change starts a content update', async () => {
    await supertest(innerServer.listener)
      .delete(routes.ctiRegistration)
      .expect(200);

    expect(mockedTrigger).toHaveBeenNthCalledWith(
      1,
      mockWazuhClient,
      'env-uuid-1',
      REGISTERED,
    );
    expect(mockedTrigger).toHaveBeenNthCalledWith(
      2,
      mockWazuhClient,
      'env-uuid-1',
      UNREGISTERED,
    );
    expect(mockedDelete.mock.invocationCallOrder[0]).toBeGreaterThan(
      mockedTrigger.mock.invocationCallOrder[0],
    );
    expect(mockedDelete.mock.invocationCallOrder[0]).toBeLessThan(
      mockedTrigger.mock.invocationCallOrder[1],
    );
  });

  test('drops the finished device flow from the store', async () => {
    const store = CtiRegistrationStore.getInstance();
    store.setInProgress(
      'env-uuid-1',
      parseDeviceAuthorizationForStore({
        device_code: 'dc',
        user_code: 'UC',
        verification_uri: 'https://console.test/register',
        interval: 5,
        expires_in: 600,
      }),
    );
    store.setRegistrationComplete('env-uuid-1');

    await supertest(innerServer.listener)
      .delete(routes.ctiRegistration)
      .expect(200);

    expect(store.getStatus('env-uuid-1')).toBeUndefined();
  });

  test('answers 403 and deletes nothing for a user without the privilege', async () => {
    mockedEvaluatePermission.mockResolvedValue({
      accessAllowed: false,
      missingPrivileges: ['cluster:admin/content_manager/subscription/delete'],
    });

    await supertest(innerServer.listener)
      .delete(routes.ctiRegistration)
      .expect(403);

    expect(mockedDelete).not.toHaveBeenCalled();
  });

  test('answers 503 and deletes nothing when the privilege cannot be checked', async () => {
    mockedEvaluatePermission.mockResolvedValue(null);

    await supertest(innerServer.listener)
      .delete(routes.ctiRegistration)
      .expect(503);

    expect(mockedDelete).not.toHaveBeenCalled();
  });

  test('answers 500 when the environment cannot be identified', async () => {
    mockedResolve.mockRejectedValue(
      new CtiConfigurationError('no environment identifier'),
    );

    await supertest(innerServer.listener)
      .delete(routes.ctiRegistration)
      .expect(500);

    expect(mockedDelete).not.toHaveBeenCalled();
  });

  test('passes the indexer status through when the removal fails', async () => {
    mockedDelete.mockRejectedValue(
      Object.assign(new Error('Forbidden'), { meta: { statusCode: 403 } }),
    );

    const response = await supertest(innerServer.listener)
      .delete(routes.ctiRegistration)
      .expect(403);

    expect(response.body.message).toBe(
      'The indexer could not clear the local registration.',
    );
    // Only the read before the removal ran.
    expect(mockedTrigger).toHaveBeenCalledTimes(1);
  });

  test('answers 502 when the removal fails without an HTTP status', async () => {
    mockedDelete.mockRejectedValue(new Error('socket hang up'));

    await supertest(innerServer.listener)
      .delete(routes.ctiRegistration)
      .expect(502);
  });
});
