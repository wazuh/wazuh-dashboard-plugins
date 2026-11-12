import type { IScopedClusterClient } from 'opensearch-dashboards/server';
import { contentManagerRoutes } from '../../../common/constants';
import { deleteContentManagerSubscription } from './content-manager-subscription';

jest.mock('../../plugin-services', () => ({
  getWazuhCheckUpdatesServices: jest.fn(),
}));

function buildWazuhClient(requestImpl: jest.Mock): IScopedClusterClient {
  return {
    asCurrentUser: {
      transport: {
        request: requestImpl,
      },
    },
  } as unknown as IScopedClusterClient;
}

describe('deleteContentManagerSubscription', () => {
  test('removes the subscription as the current user', async () => {
    const request = jest.fn().mockResolvedValue({
      body: { message: 'Credentials removed', status: 200 },
      statusCode: 200,
    });

    await expect(
      deleteContentManagerSubscription(buildWazuhClient(request)),
    ).resolves.toBeUndefined();
    expect(request).toHaveBeenCalledWith({
      method: 'DELETE',
      path: contentManagerRoutes.subscription,
    });
  });

  test('rejects when the body reports a failure', async () => {
    const request = jest.fn().mockResolvedValue({
      body: { message: 'Unexpected error', status: 500 },
      statusCode: 200,
    });

    await expect(
      deleteContentManagerSubscription(buildWazuhClient(request)),
    ).rejects.toThrow('status 500');
  });

  test('keeps the transport error, with its HTTP status', async () => {
    const error = Object.assign(new Error('Forbidden'), {
      meta: { statusCode: 403 },
    });
    const request = jest.fn().mockRejectedValue(error);

    await expect(
      deleteContentManagerSubscription(buildWazuhClient(request)),
    ).rejects.toBe(error);
  });
});
