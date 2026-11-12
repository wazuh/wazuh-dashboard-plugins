import type { IScopedClusterClient } from 'opensearch-dashboards/server';
import {
  checkCtiRegistrationPermission,
  evaluateCtiRegistrationPermission,
} from './registration-permission';
import { getWazuhCheckUpdatesServices } from '../../plugin-services';
import {
  CONTENT_MANAGER_PERMISSION_CHECK_QUERY_PARAM,
  contentManagerRoutes,
} from '../../../common/constants';

jest.mock('../../plugin-services', () => ({
  getWazuhCheckUpdatesServices: jest.fn(),
}));

const mockedGetWazuhCheckUpdatesServices =
  getWazuhCheckUpdatesServices as jest.Mock;

function buildWazuhClient(requestImpl: jest.Mock): IScopedClusterClient {
  return {
    asCurrentUser: {
      transport: {
        request: requestImpl,
      },
    },
  } as unknown as IScopedClusterClient;
}

describe('checkCtiRegistrationPermission', () => {
  const logger = { error: jest.fn(), info: jest.fn(), warn: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetWazuhCheckUpdatesServices.mockReturnValue({ logger });
  });

  test('probes the subscription endpoint without a body and with no side effects', async () => {
    const request = jest.fn().mockResolvedValue({
      body: { accessAllowed: true, missingPrivileges: [] },
    });

    await checkCtiRegistrationPermission(buildWazuhClient(request));

    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith({
      method: 'POST',
      path: contentManagerRoutes.subscription,
      querystring: { [CONTENT_MANAGER_PERMISSION_CHECK_QUERY_PARAM]: 'true' },
    });
    expect(request.mock.calls[0][0]).not.toHaveProperty('body');
  });

  test('reports an allowed user', async () => {
    const request = jest.fn().mockResolvedValue({
      body: { accessAllowed: true, missingPrivileges: [] },
    });

    await expect(
      checkCtiRegistrationPermission(buildWazuhClient(request)),
    ).resolves.toEqual({ accessAllowed: true, missingPrivileges: [] });
  });

  test('reports a denied user with the missing privileges', async () => {
    const request = jest.fn().mockResolvedValue({
      body: {
        accessAllowed: false,
        missingPrivileges: [
          'cluster:admin/content_manager/subscription/create',
        ],
      },
    });

    await expect(
      checkCtiRegistrationPermission(buildWazuhClient(request)),
    ).resolves.toEqual({
      accessAllowed: false,
      missingPrivileges: ['cluster:admin/content_manager/subscription/create'],
    });
  });

  test('drops non-string entries from missingPrivileges', async () => {
    const request = jest.fn().mockResolvedValue({
      body: {
        accessAllowed: false,
        missingPrivileges: ['a-privilege', 42, null, { nested: true }],
      },
    });

    await expect(
      checkCtiRegistrationPermission(buildWazuhClient(request)),
    ).resolves.toEqual({
      accessAllowed: false,
      missingPrivileges: ['a-privilege'],
    });
  });

  test.each([
    ['a missing accessAllowed flag', { body: { missingPrivileges: [] } }],
    ['a non-boolean accessAllowed', { body: { accessAllowed: 'false' } }],
    ['an empty body', { body: null }],
  ])('fails open on %s', async (_label, response) => {
    const request = jest.fn().mockResolvedValue(response);

    await expect(
      checkCtiRegistrationPermission(buildWazuhClient(request)),
    ).resolves.toEqual({ accessAllowed: true, missingPrivileges: [] });
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });

  test('fails open when the probe request rejects', async () => {
    const request = jest
      .fn()
      .mockRejectedValue(new Error('no handler found for uri'));

    await expect(
      checkCtiRegistrationPermission(buildWazuhClient(request)),
    ).resolves.toEqual({ accessAllowed: true, missingPrivileges: [] });
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('no handler found for uri'),
    );
  });

  test('never rejects when the plugin services are unavailable', async () => {
    mockedGetWazuhCheckUpdatesServices.mockImplementation(() => {
      throw new Error('services not set');
    });
    const request = jest.fn().mockRejectedValue(new Error('boom'));

    await expect(
      checkCtiRegistrationPermission(buildWazuhClient(request)),
    ).resolves.toEqual({ accessAllowed: true, missingPrivileges: [] });
  });
});

describe('evaluateCtiRegistrationPermission', () => {
  const logger = { error: jest.fn(), info: jest.fn(), warn: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetWazuhCheckUpdatesServices.mockReturnValue({ logger });
  });

  test.each([
    [{ accessAllowed: true, missingPrivileges: [] }],
    [{ accessAllowed: false, missingPrivileges: ['a-privilege'] }],
  ])('passes an evaluated answer through: %o', async body => {
    const request = jest.fn().mockResolvedValue({ body });

    await expect(
      evaluateCtiRegistrationPermission(buildWazuhClient(request)),
    ).resolves.toEqual(body);
  });

  test.each([
    ['a missing accessAllowed flag', { body: { missingPrivileges: [] } }],
    ['a non-boolean accessAllowed', { body: { accessAllowed: 'true' } }],
    ['an empty body', { body: null }],
  ])('resolves to null on %s', async (_label, response) => {
    const request = jest.fn().mockResolvedValue(response);

    await expect(
      evaluateCtiRegistrationPermission(buildWazuhClient(request)),
    ).resolves.toBeNull();
  });

  test('resolves to null when the probe request rejects', async () => {
    const request = jest.fn().mockRejectedValue(new Error('timeout'));

    await expect(
      evaluateCtiRegistrationPermission(buildWazuhClient(request)),
    ).resolves.toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('timeout'),
    );
  });
});

describe('clear permission probe', () => {
  const logger = { error: jest.fn(), info: jest.fn(), warn: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetWazuhCheckUpdatesServices.mockReturnValue({ logger });
  });

  test('probes the DELETE action of the subscription endpoint', async () => {
    const request = jest.fn().mockResolvedValue({
      body: { accessAllowed: true, missingPrivileges: [] },
    });

    await expect(
      evaluateCtiRegistrationPermission(buildWazuhClient(request), 'clear'),
    ).resolves.toEqual({ accessAllowed: true, missingPrivileges: [] });
    expect(request).toHaveBeenCalledWith({
      method: 'DELETE',
      path: contentManagerRoutes.subscription,
      querystring: { [CONTENT_MANAGER_PERMISSION_CHECK_QUERY_PARAM]: 'true' },
    });
  });

  test('denies when the probe cannot be evaluated', async () => {
    // What the indexer answers until its DELETE handler supports the check.
    const request = jest.fn().mockRejectedValue({
      message: 'class_cast_exception',
      meta: { statusCode: 500 },
    });

    await expect(
      checkCtiRegistrationPermission(buildWazuhClient(request), 'clear'),
    ).resolves.toEqual({ accessAllowed: false, missingPrivileges: [] });
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('(clear)'),
    );
  });

  test('denies when the answer has no accessAllowed flag', async () => {
    const request = jest.fn().mockResolvedValue({ body: {} });

    await expect(
      checkCtiRegistrationPermission(buildWazuhClient(request), 'clear'),
    ).resolves.toEqual({ accessAllowed: false, missingPrivileges: [] });
  });
});
