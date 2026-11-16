/* eslint-disable camelcase -- Content Manager query parameters keep their API names */
import type { IScopedClusterClient } from 'opensearch-dashboards/server';
import { contentManagerRoutes } from '../../../common/constants';
import { requestContentManager } from './content-manager-transport';
import {
  isContentManagerMockEnabled,
  requestContentManagerMock,
} from './content-manager-mock';

jest.mock('./content-manager-mock', () => ({
  isContentManagerMockEnabled: jest.fn(),
  requestContentManagerMock: jest.fn(),
}));

const mockedEnabled = isContentManagerMockEnabled as jest.Mock;
const mockedMock = requestContentManagerMock as jest.Mock;

function buildWazuhClient(request: jest.Mock): IScopedClusterClient {
  return {
    asCurrentUser: { transport: { request } },
  } as unknown as IScopedClusterClient;
}

describe('requestContentManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('sends the request to the indexer when the mock is off', async () => {
    mockedEnabled.mockReturnValue(false);
    const request = jest.fn().mockResolvedValue({ body: { ok: true } });
    const params = {
      method: 'GET' as const,
      path: contentManagerRoutes.subscription,
    };

    await expect(
      requestContentManager(buildWazuhClient(request), params),
    ).resolves.toEqual({ body: { ok: true } });
    expect(request).toHaveBeenCalledWith(params);
    expect(mockedMock).not.toHaveBeenCalled();
  });

  test('answers subscription requests from the mock when it is on', async () => {
    mockedEnabled.mockReturnValue(true);
    mockedMock.mockResolvedValue({ statusCode: 200, body: { mocked: true } });
    const request = jest.fn();
    const params = {
      method: 'DELETE' as const,
      path: contentManagerRoutes.subscription,
      querystring: { perform_permission_check: 'true' },
    };

    await expect(
      requestContentManager(buildWazuhClient(request), params),
    ).resolves.toEqual({ statusCode: 200, body: { mocked: true } });
    expect(mockedMock).toHaveBeenCalledWith(params);
    expect(request).not.toHaveBeenCalled();
  });

  test('keeps other Content Manager paths on the indexer when the mock is on', async () => {
    mockedEnabled.mockReturnValue(true);
    const request = jest.fn().mockResolvedValue({ body: {} });

    await requestContentManager(buildWazuhClient(request), {
      method: 'POST',
      path: contentManagerRoutes.contentUpdate,
    });

    expect(request).toHaveBeenCalled();
    expect(mockedMock).not.toHaveBeenCalled();
  });
});
