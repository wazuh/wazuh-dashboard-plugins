/* eslint-disable camelcase -- CTI fields keep their API names */
jest.mock('../../plugin-services', () => ({
  getWazuhCore: () => ({
    utils: { formatUIDate: (date: string) => `formatted ${date}` },
  }),
}));

import React from 'react';
import { configure, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import moment from 'moment';
import type {
  CtiPlanSubscription,
  CtiSubscriptionMessage,
} from '../../../common/cti-registration-status-api';
import {
  getCurrentPlanSubscription,
  SubscriptionDetails,
} from './subscription-details';

configure({ testIdAttribute: 'data-test-subj' });

const date = (timestamp: string) => moment(timestamp).format('ll');

const YEARLY: CtiPlanSubscription = {
  plan: 'Professional',
  interval: 'year',
  started_at: '2026-03-01T10:00:00Z',
  renews_at: '2027-03-01T10:00:00Z',
  expires_at: null,
};

const message = (
  overrides: Partial<CtiSubscriptionMessage> = {},
): CtiSubscriptionMessage => ({
  is_registered: true,
  plan: { name: 'Professional', is_public: false },
  environment: {
    name: 'environment-01',
    organization: { name: 'Acme Corp' },
    registered_at: '2026-03-01T10:00:00Z',
  },
  subscriptions: [YEARLY],
  ...overrides,
});

describe('getCurrentPlanSubscription', () => {
  test('picks the subscription of the current plan', () => {
    const monthly = { ...YEARLY, plan: 'Other', interval: 'month' as const };

    expect(
      getCurrentPlanSubscription(message({ subscriptions: [monthly, YEARLY] })),
    ).toBe(YEARLY);
  });

  test('is undefined when no subscription matches the plan', () => {
    expect(
      getCurrentPlanSubscription(
        message({ plan: { name: 'Open', is_public: true } }),
      ),
    ).toBeUndefined();
    expect(getCurrentPlanSubscription(null)).toBeUndefined();
  });
});

describe('SubscriptionDetails', () => {
  test('lists the identity and the dates of a renewing subscription', () => {
    render(
      <SubscriptionDetails
        message={message()}
        environmentUid='9ckQEmDsQ9eReRTUH4xPMg'
      />,
    );

    expect(
      screen.getByTestId('ctiFeedSubscriptionEnvironmentName'),
    ).toHaveTextContent('environment-01');
    expect(
      screen.getByTestId('ctiFeedSubscriptionOrganization'),
    ).toHaveTextContent('Acme Corp');
    expect(
      screen.getByTestId('ctiFeedSubscriptionEnvironmentId'),
    ).toHaveTextContent('9ckQEmDsQ9eReRTUH4xPMg');
    expect(
      screen.getByTestId('ctiFeedSubscriptionCopyEnvironmentId'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('ctiFeedSubscriptionRegisteredAt'),
    ).toHaveTextContent(date('2026-03-01T10:00:00Z'));
    expect(
      screen.getByTestId('ctiFeedSubscriptionStartedAt'),
    ).toHaveTextContent(date('2026-03-01T10:00:00Z'));
    expect(screen.getByTestId('ctiFeedSubscriptionRenewsAt')).toHaveTextContent(
      date('2027-03-01T10:00:00Z'),
    );
    expect(screen.queryByTestId('ctiFeedSubscriptionExpiresAt')).toBeNull();
    const details = screen.getByTestId('ctiFeedSubscriptionDetails');
    expect(details).toHaveTextContent('Billing');
    expect(details).toHaveTextContent('Yearly');
  });

  test('says when a subscription that does not renew expires', () => {
    render(
      <SubscriptionDetails
        message={message({
          subscriptions: [
            {
              ...YEARLY,
              interval: 'month',
              renews_at: null,
              expires_at: '2026-12-01T00:00:00Z',
            },
          ],
        })}
        environmentUid={null}
      />,
    );

    expect(screen.queryByTestId('ctiFeedSubscriptionRenewsAt')).toBeNull();
    expect(
      screen.getByTestId('ctiFeedSubscriptionExpiresAt'),
    ).toHaveTextContent(date('2026-12-01T00:00:00Z'));
    expect(screen.getByTestId('ctiFeedSubscriptionDetails')).toHaveTextContent(
      'Monthly',
    );
  });

  test('hides the subscription rows on the Open feed', () => {
    render(
      <SubscriptionDetails
        message={message({
          plan: { name: 'Open', is_public: true },
          subscriptions: [],
        })}
        environmentUid='9ckQEmDsQ9eReRTUH4xPMg'
      />,
    );

    const details = screen.getByTestId('ctiFeedSubscriptionDetails');
    expect(details).toHaveTextContent('environment-01');
    expect(details).not.toHaveTextContent('Billing');
    expect(screen.queryByTestId('ctiFeedSubscriptionStartedAt')).toBeNull();
  });

  test('shows only the environment ID when the indexer sends no identity', () => {
    render(
      <SubscriptionDetails
        message={{
          is_registered: true,
          plan: { name: 'Professional', is_public: false },
        }}
        environmentUid='9ckQEmDsQ9eReRTUH4xPMg'
      />,
    );

    expect(
      screen.getByTestId('ctiFeedSubscriptionEnvironmentId'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('ctiFeedSubscriptionEnvironmentName'),
    ).toBeNull();
    expect(screen.queryByTestId('ctiFeedSubscriptionOrganization')).toBeNull();
    expect(screen.queryByTestId('ctiFeedSubscriptionRegisteredAt')).toBeNull();
  });

  test('renders nothing when there is nothing to show', () => {
    render(<SubscriptionDetails message={null} environmentUid={null} />);

    expect(screen.queryByTestId('ctiFeedSubscriptionDetails')).toBeNull();
  });
});
