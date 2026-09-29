import type { IScopedClusterClient } from 'opensearch-dashboards/server';
import { checkCtiRegistrationPermission } from './registration-permission';
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
