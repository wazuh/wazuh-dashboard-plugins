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
    plan: { name: 'Pro', is_public: true },
    is_registered: true,
  };

  // The `environments/me` body Content Manager passes through as `environment`.
  const environmentsMe = {
    name: 'environment-01',
    registered_at: '2026-02-14T09:30:00Z',
    organization: { name: 'Acme Corp' },
    plans: [
      {
        name: 'Pro',
        is_public: true,
        features: [
          {
            name: 'Vulnerability CVE Stream',
            description: 'Delta updates for vulnerability entries.',
            resource: 'https://cti.example.test/consumers/vdp_v1',
            type: 'cti:catalog:consumer:vulnerabilities',
          },
        ],
      },
    ],
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
  };

  it('keeps the identity and the subscriptions of the environment', () => {
    expect(
      normalizeSubscriptionMessage({
        ...registered,
        environment: environmentsMe,
      }),
    ).toEqual({
      ...registered,
      environment: {
        name: 'environment-01',
        organization: { name: 'Acme Corp' },
        registered_at: '2026-02-14T09:30:00Z',
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
      },
    });
  });

  it('keeps the date a past-due subscription is suspended on', () => {
    const message = normalizeSubscriptionMessage({
      ...registered,
      environment: {
        subscriptions: [
          {
            plan: 'Pro',
            renews_at: null,
            past_due_ends_at: '2026-12-08T10:00:00Z',
          },
        ],
      },
    });

    expect(message?.environment?.subscriptions).toEqual([
      {
        plan: 'Pro',
        renews_at: null,
        past_due_ends_at: '2026-12-08T10:00:00Z',
      },
    ]);
  });

  it('drops invalid values instead of passing them through', () => {
    expect(
      normalizeSubscriptionMessage({
        ...registered,
        environment: {
          name: '  ',
          organization: { name: 42 },
          registered_at: 'yesterday',
          subscriptions: [
            {
              plan: 'Pro',
              interval: 'week',
              started_at: 'not a date',
              renews_at: 7,
              expires_at: '2027-03-01T10:00:00Z',
              past_due_ends_at: 'soon',
            },
            { interval: 'month' },
            'Pro',
          ],
        },
      } as never),
    ).toEqual({
      ...registered,
      environment: {
        subscriptions: [{ plan: 'Pro', expires_at: '2027-03-01T10:00:00Z' }],
      },
    });
  });

  it('never passes plans, features or unknown fields to the browser', () => {
    const message = normalizeSubscriptionMessage({
      ...registered,
      environment: {
        ...environmentsMe,
        subscriptions: undefined,
        token: 'secret',
        new_console_field: { anything: true },
      },
    } as never);

    expect(message).toEqual({
      ...registered,
      environment: {
        name: 'environment-01',
        organization: { name: 'Acme Corp' },
        registered_at: '2026-02-14T09:30:00Z',
      },
    });
  });

  it('accepts a null interval', () => {
    const message = normalizeSubscriptionMessage({
      ...registered,
      environment: { subscriptions: [{ plan: 'Pro', interval: null }] },
    } as never);

    expect(message?.environment?.subscriptions).toEqual([{ plan: 'Pro' }]);
  });

  it('never describes an environment that is not registered', () => {
    expect(
      normalizeSubscriptionMessage({
        plan: { name: 'Open', is_public: true },
        is_registered: false,
        environment: environmentsMe,
      }),
    ).toEqual({
      plan: { name: 'Open', is_public: true },
      is_registered: false,
    });
  });

  it('leaves the environment out when older indexers do not send it', () => {
    expect(normalizeSubscriptionMessage(registered)).toEqual(registered);
  });
});
