/* eslint-disable camelcase -- Content Manager and CTI console fields keep their API names */
import axios from 'axios';
import {
  CONTENT_MANAGER_PERMISSION_CHECK_QUERY_PARAM,
  WAZUH_CTI_CONSOLE_BASE_URL,
  ctiConsoleApiPaths,
} from '../../../common/constants';
import {
  CONTENT_MANAGER_MOCK_DENY_ENV,
  CONTENT_MANAGER_MOCK_ENV,
  CONTENT_MANAGER_MOCK_SEEDED_TOKEN,
  announceContentManagerMock,
  isContentManagerMockEnabled,
  requestContentManagerMock,
  resetContentManagerMockForTests,
} from './content-manager-mock';
import { getWazuhCheckUpdatesServices } from '../../plugin-services';

jest.mock('axios');
jest.mock('../../plugin-services', () => ({
  getWazuhCheckUpdatesServices: jest.fn(),
}));

const mockedGet = axios.get as jest.Mock;
const warn = jest.fn();

const ENVIRONMENTS_ME = {
  name: 'environment-01',
  registered_at: '2026-02-14T09:30:00Z',
  organization: { name: 'Acme Corp' },
  plans: [{ name: 'Pro', is_public: true, features: [] }],
  subscriptions: [
    {
      plan: 'Pro',
      interval: 'year',
      started_at: '2026-03-01T10:00:00Z',
      renews_at: '2027-03-01T10:00:00Z',
      expires_at: null,
      past_due_ends_at: null,
    },
  ],
  field_added_later: { kept: true },
};

const CATALOG_PLANS = {
  plans: [
    { name: 'Open', is_public: true, features: [] },
    { name: 'Professional', is_public: false, features: [] },
  ],
};

const meUrl = `${WAZUH_CTI_CONSOLE_BASE_URL}${ctiConsoleApiPaths.environmentsMe}`;
const plansUrl = `${WAZUH_CTI_CONSOLE_BASE_URL}${ctiConsoleApiPaths.catalogPlans}`;

/** Answers the CTI console: `environments/me` with `me`, `catalog/plans` with the plans. */
function consoleAnswers(me: { status: number; data?: unknown } | Error) {
  mockedGet.mockImplementation((url: string) => {
    if (url === plansUrl) {
      return Promise.resolve({ status: 200, data: CATALOG_PLANS });
    }
    return me instanceof Error ? Promise.reject(me) : Promise.resolve(me);
  });
}

const get = () => requestContentManagerMock({ method: 'GET' });
const check = (method: 'POST' | 'DELETE', value = 'true') =>
  requestContentManagerMock({
    method,
    querystring: { [CONTENT_MANAGER_PERMISSION_CHECK_QUERY_PARAM]: value },
  });

describe('Content Manager subscription mock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetContentManagerMockForTests();
    (getWazuhCheckUpdatesServices as jest.Mock).mockReturnValue({
      logger: { warn },
    });
    process.env[CONTENT_MANAGER_MOCK_ENV] = 'registered';
    delete process.env[CONTENT_MANAGER_MOCK_DENY_ENV];
    consoleAnswers({ status: 200, data: ENVIRONMENTS_ME });
  });

  afterAll(() => {
    delete process.env[CONTENT_MANAGER_MOCK_ENV];
    delete process.env[CONTENT_MANAGER_MOCK_DENY_ENV];
  });

  describe('isContentManagerMockEnabled', () => {
    test.each([
      ['registered', true],
      ['unregistered', true],
      ['true', true],
      ['false', false],
      ['0', false],
      ['', false],
    ])('%p turns it on: %p', (value, enabled) => {
      process.env[CONTENT_MANAGER_MOCK_ENV] = value;
      expect(isContentManagerMockEnabled()).toBe(enabled);
    });

    test('is off when the variable is not set', () => {
      delete process.env[CONTENT_MANAGER_MOCK_ENV];
      expect(isContentManagerMockEnabled()).toBe(false);
    });
  });

  describe('GET', () => {
    test('passes environments/me through verbatim as message.environment', async () => {
      await expect(get()).resolves.toEqual({
        statusCode: 200,
        body: {
          message: {
            plan: { name: 'Pro', is_public: true },
            is_registered: true,
            environment: ENVIRONMENTS_ME,
          },
          status: 200,
        },
      });
      expect(mockedGet).toHaveBeenCalledWith(
        meUrl,
        expect.objectContaining({
          headers: {
            Authorization: `Bearer ${CONTENT_MANAGER_MOCK_SEEDED_TOKEN}`,
          },
        }),
      );
    });

    test('answers the public plan without an environment when not registered', async () => {
      process.env[CONTENT_MANAGER_MOCK_ENV] = 'unregistered';

      await expect(get()).resolves.toEqual({
        statusCode: 200,
        body: {
          message: {
            plan: { name: 'Open', is_public: true },
            is_registered: false,
          },
          status: 200,
        },
      });
      expect(mockedGet).not.toHaveBeenCalledWith(meUrl, expect.anything());
    });

    test('forgets a token the CTI console rejects', async () => {
      consoleAnswers({ status: 401, data: { error: 'unauthorized' } });

      const first = await get();
      expect(first.body).toEqual({
        message: {
          plan: { name: 'Open', is_public: true },
          is_registered: false,
        },
        status: 200,
      });

      consoleAnswers({ status: 200, data: ENVIRONMENTS_ME });
      const second = await get();
      expect(
        (second.body as { message: { is_registered: boolean } }).message
          .is_registered,
      ).toBe(false);
    });

    test('answers 502 and keeps the token when the CTI console fails', async () => {
      consoleAnswers({ status: 503, data: {} });

      await expect(get()).rejects.toMatchObject({
        meta: { statusCode: 502 },
      });

      consoleAnswers({ status: 200, data: ENVIRONMENTS_ME });
      await expect(get()).resolves.toMatchObject({
        body: { message: { is_registered: true } },
      });
    });

    test('answers 502 when the CTI console cannot be reached', async () => {
      consoleAnswers(new Error('connect ECONNREFUSED'));

      await expect(get()).rejects.toMatchObject({
        meta: { statusCode: 502 },
      });
    });

    test('answers 502 when environments/me has no plan', async () => {
      consoleAnswers({ status: 200, data: { ...ENVIRONMENTS_ME, plans: [] } });

      await expect(get()).rejects.toMatchObject({
        meta: { statusCode: 502 },
      });
    });
  });

  describe('registration and removal', () => {
    test('POST stores the token and DELETE removes it', async () => {
      process.env[CONTENT_MANAGER_MOCK_ENV] = 'true';

      await expect(
        requestContentManagerMock({
          method: 'POST',
          body: { access_token: 'token-from-device-flow' },
        }),
      ).resolves.toMatchObject({ statusCode: 201 });
      await get();
      expect(mockedGet).toHaveBeenCalledWith(
        meUrl,
        expect.objectContaining({
          headers: { Authorization: 'Bearer token-from-device-flow' },
        }),
      );

      await expect(
        requestContentManagerMock({ method: 'DELETE' }),
      ).resolves.toEqual({
        statusCode: 200,
        body: { message: 'Credentials removed', status: 200 },
      });
      await expect(get()).resolves.toMatchObject({
        body: { message: { is_registered: false } },
      });
    });

    test('POST without a token answers 400', async () => {
      await expect(
        requestContentManagerMock({ method: 'POST', body: {} }),
      ).rejects.toMatchObject({ meta: { statusCode: 400 } });
    });
  });

  describe('permission checks', () => {
    test.each([
      ['POST', 'register'],
      ['DELETE', 'clear'],
    ] as const)('%s allows by default and changes nothing', async method => {
      await expect(check(method)).resolves.toEqual({
        statusCode: 200,
        body: { accessAllowed: true, missingPrivileges: [] },
      });
      await expect(get()).resolves.toMatchObject({
        body: { message: { is_registered: true } },
      });
    });

    test('DELETE reports the missing privilege when clear is denied', async () => {
      process.env[CONTENT_MANAGER_MOCK_DENY_ENV] = 'clear';

      await expect(check('DELETE')).resolves.toEqual({
        statusCode: 200,
        body: {
          accessAllowed: false,
          missingPrivileges: [
            'cluster:admin/content_manager/subscription/delete',
          ],
        },
      });
      await expect(check('POST')).resolves.toMatchObject({
        body: { accessAllowed: true },
      });
    });

    test('POST reports the missing privilege when register is denied', async () => {
      process.env[CONTENT_MANAGER_MOCK_DENY_ENV] = ' Register , clear';

      await expect(check('POST')).resolves.toMatchObject({
        body: {
          accessAllowed: false,
          missingPrivileges: [
            'cluster:admin/content_manager/subscription/create',
          ],
        },
      });
    });

    test('an empty value counts as true', async () => {
      await expect(check('DELETE', '')).resolves.toMatchObject({
        body: { accessAllowed: true },
      });
      await expect(get()).resolves.toMatchObject({
        body: { message: { is_registered: true } },
      });
    });

    test('false runs the real action', async () => {
      await expect(check('DELETE', 'false')).resolves.toMatchObject({
        body: { message: 'Credentials removed' },
      });
    });
  });

  test('warns once that the indexer is bypassed', () => {
    announceContentManagerMock();
    announceContentManagerMock();

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining(CONTENT_MANAGER_MOCK_ENV),
    );
  });
});
