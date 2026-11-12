/* eslint-disable camelcase -- CTI fields keep their API names */
import type { IScopedClusterClient } from 'opensearch-dashboards/server';
import {
  getCtiSubscriptionStatus,
  normalizeSubscriptionMessage,
} from './cti-credentials';

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

describe('normalizeSubscriptionMessage', () => {
  const registered = {
    plan: { name: 'Professional', is_public: false },
    is_registered: true,
  };

  it('copies the environment and the subscriptions of environments/me', () => {
    expect(
      normalizeSubscriptionMessage({
        ...registered,
        environment: {
          name: 'environment-01',
          organization: { name: 'Acme Corp' },
          registered_at: '2026-03-01T10:00:00Z',
        },
        subscriptions: [
          {
            plan: 'Professional',
            interval: 'year',
            started_at: '2026-03-01T10:00:00Z',
            renews_at: '2027-03-01T10:00:00Z',
            expires_at: null,
          },
        ],
      }),
    ).toEqual({
      ...registered,
      environment: {
        name: 'environment-01',
        organization: { name: 'Acme Corp' },
        registered_at: '2026-03-01T10:00:00Z',
      },
      subscriptions: [
        {
          plan: 'Professional',
          interval: 'year',
          started_at: '2026-03-01T10:00:00Z',
          renews_at: '2027-03-01T10:00:00Z',
          expires_at: null,
        },
      ],
    });
  });

  it('drops invalid values instead of passing them through', () => {
    expect(
      normalizeSubscriptionMessage({
        ...registered,
        environment: {
          name: '  ',
          organization: { name: 42 },
          registered_at: 'yesterday',
          token: 'secret',
        },
        subscriptions: [
          {
            plan: 'Professional',
            interval: 'week',
            started_at: 'not a date',
            renews_at: 7,
            expires_at: '2027-03-01T10:00:00Z',
            price: 99,
          },
          { interval: 'month' },
          'Professional',
        ],
      } as never),
    ).toEqual({
      ...registered,
      subscriptions: [
        { plan: 'Professional', expires_at: '2027-03-01T10:00:00Z' },
      ],
    });
  });

  it('keeps only the fields it knows', () => {
    const message = normalizeSubscriptionMessage({
      ...registered,
      environment: { name: 'environment-01', features: ['x'] },
      plans: [{ name: 'Professional' }],
    } as never);

    expect(message).toEqual({
      ...registered,
      environment: { name: 'environment-01' },
    });
  });

  it('never describes an environment that is not registered', () => {
    expect(
      normalizeSubscriptionMessage({
        plan: { name: 'Open', is_public: true },
        is_registered: false,
        environment: { name: 'environment-01' },
        subscriptions: [],
      }),
    ).toEqual({
      plan: { name: 'Open', is_public: true },
      is_registered: false,
    });
  });

  it('leaves the fields out when older indexers do not send them', () => {
    expect(normalizeSubscriptionMessage(registered)).toEqual(registered);
  });
});
