import type { IScopedClusterClient } from 'opensearch-dashboards/server';
import { getCtiSubscriptionStatus } from './cti-credentials';

function buildWazuhClient(requestImpl: jest.Mock): IScopedClusterClient {
  return {
    asCurrentUser: {
      transport: {
        request: requestImpl,
      },
    },
  } as unknown as IScopedClusterClient;
}

describe('getCtiSubscriptionStatus', () => {
  it('returns the normalized message and status on a successful response', async () => {
    const request = jest.fn().mockResolvedValue({
      body: {
        message: {
          plan: { name: 'Pro Plan', is_public: true },
          is_registered: true,
        },
        status: 200,
      },
    });

    const result = await getCtiSubscriptionStatus(buildWazuhClient(request));

    expect(result).toEqual({
      message: {
        plan: { name: 'Pro Plan', is_public: true },
        is_registered: true,
      },
      status: 200,
    });
  });

  it('preserves the HTTP status from a thrown ResponseError (e.g. 502)', async () => {
    const request = jest.fn().mockRejectedValue({
      message: 'Response Error',
      meta: { statusCode: 502 },
    });

    const result = await getCtiSubscriptionStatus(buildWazuhClient(request));

    expect(result).toEqual({ message: null, status: 502 });
  });

  it('falls back to a null status when the error carries no HTTP status', async () => {
    const request = jest.fn().mockRejectedValue(new Error('socket hang up'));

    const result = await getCtiSubscriptionStatus(buildWazuhClient(request));

    expect(result).toEqual({ message: null, status: null });
  });
});
