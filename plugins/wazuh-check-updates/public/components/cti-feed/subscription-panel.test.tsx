/* eslint-disable camelcase -- CTI consumer and query fields keep their API names */
jest.mock('../../plugin-services', () => ({
  getCore: jest.fn(),
  getWazuhCore: () => ({
    utils: { formatUIDate: (date: string) => `formatted ${date}` },
  }),
}));

import React from 'react';
import {
  configure,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { statusCodes, WAZUH_CTI_CONSOLE_HREF } from '../../../common/constants';
import { ctiFlowState } from '../../services/cti-flow-state';
import { fetchCtiRegistrationPermission } from '../../services/cti-registration-permission';
import { getSubscriptionState, SubscriptionPanel } from './subscription-panel';

jest.mock('../../services/cti-registration-permission', () => ({
  fetchCtiRegistrationPermission: jest.fn(),
}));

const mockedFetchPermission = fetchCtiRegistrationPermission as jest.Mock;

configure({ testIdAttribute: 'data-test-subj' });

const NOT_FOUND = { status: statusCodes.NOT_FOUND, message: '' };
const SUCCESS = { status: statusCodes.SUCCESS, message: '' };
const FAILED = {
  status: statusCodes.REGISTRATION_FAILED,
  message: 'access_denied',
};

const renderPanel = (
  props: Partial<React.ComponentProps<typeof SubscriptionPanel>> = {},
) => {
  const onOpenRegistration = jest.fn();
  const onRegistrationCleared = jest.fn();
  render(
    <SubscriptionPanel
      statusCTI={NOT_FOUND}
      loading={false}
      deviceFlowActive={false}
      onOpenRegistration={onOpenRegistration}
      onRegistrationCleared={onRegistrationCleared}
      {...props}
    />,
  );
  return { onOpenRegistration, onRegistrationCleared };
};

describe('getSubscriptionState', () => {
  test('maps the registration status to a subscription state', () => {
    expect(getSubscriptionState(SUCCESS, false)).toBe('registered');
    expect(getSubscriptionState(FAILED, false)).toBe('failed');
    expect(getSubscriptionState(NOT_FOUND, true)).toBe('pending');
    expect(getSubscriptionState(NOT_FOUND, false)).toBe('notRegistered');
  });
});

describe('SubscriptionPanel', () => {
  beforeEach(() => {
    ctiFlowState.reset();
    mockedFetchPermission.mockReset();
    mockedFetchPermission.mockResolvedValue({
      accessAllowed: false,
      missingPrivileges: [],
    });
  });

  test('shows a placeholder while the status loads', () => {
    renderPanel({ loading: true });

    expect(
      screen.getByTestId('ctiFeedSubscriptionLoading'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('ctiFeedSubscriptionAction')).toBeNull();
  });

  test('offers to register and explains the feed tiers when not registered', () => {
    const { onOpenRegistration } = renderPanel();

    expect(screen.getByTestId('ctiFeedSubscriptionTitle')).toHaveTextContent(
      'Open feed',
    );
    expect(screen.getByTestId('ctiFeedSubscriptionStatus')).toHaveTextContent(
      'Not registered',
    );
    expect(screen.getByTestId('ctiFeedSubscriptionTiers')).toHaveTextContent(
      'Professional feed',
    );

    fireEvent.click(screen.getByTestId('ctiFeedSubscriptionAction'));
    expect(onOpenRegistration).toHaveBeenCalledTimes(1);
  });

  test('shows the plan name once registered', () => {
    ctiFlowState.setSubscription({
      status: 200,
      message: {
        is_registered: true,
        plan: { name: 'Pro Plan', is_public: false },
      },
    });

    renderPanel({ statusCTI: SUCCESS });

    expect(screen.getByTestId('ctiFeedSubscriptionTitle')).toHaveTextContent(
      'Pro Plan feed',
    );
    expect(screen.getByTestId('ctiFeedSubscriptionStatus')).toHaveTextContent(
      'Registered',
    );
    expect(screen.queryByTestId('ctiFeedSubscriptionAction')).toBeNull();
    expect(screen.queryByTestId('ctiFeedSubscriptionTiers')).toBeNull();
  });

  test('suggests the Professional feed when registered on the Open one', () => {
    ctiFlowState.setSubscription({
      status: 200,
      message: {
        is_registered: true,
        plan: { name: 'Open', is_public: true },
      },
    });

    renderPanel({ statusCTI: SUCCESS });

    expect(screen.getByTestId('ctiFeedSubscriptionTitle')).toHaveTextContent(
      'Open feed',
    );
    expect(screen.getByTestId('ctiFeedSubscriptionStatus')).toHaveTextContent(
      'Registered',
    );
    expect(
      screen.getByText(/Upgrade it to the Professional feed/),
    ).toBeInTheDocument();
    expect(screen.getByTestId('ctiFeedSubscriptionTiers')).toHaveTextContent(
      'Open feed (included)',
    );
    expect(screen.getByTestId('ctiFeedSubscriptionTiers')).toHaveTextContent(
      'Professional feed',
    );
    expect(screen.queryByTestId('ctiFeedSubscriptionAction')).toBeNull();
  });

  test('falls back to a generic title when the plan is unknown', () => {
    renderPanel({ statusCTI: SUCCESS });

    expect(screen.getByTestId('ctiFeedSubscriptionTitle')).toHaveTextContent(
      'Wazuh CTI subscription',
    );
  });

  test('points to the activation details while activation is pending', () => {
    renderPanel({ deviceFlowActive: true });

    expect(screen.getByTestId('ctiFeedSubscriptionTitle')).toHaveTextContent(
      'Activation pending',
    );
    expect(screen.getByTestId('ctiFeedSubscriptionAction')).toHaveTextContent(
      'View activation details',
    );
  });

  test('reports a failed registration', () => {
    renderPanel({ statusCTI: FAILED });

    expect(screen.getByTestId('ctiFeedSubscriptionStatus')).toHaveTextContent(
      'Registration failed',
    );
  });

  test('says which feed a registered environment is on', () => {
    ctiFlowState.setSubscription({
      status: 200,
      message: {
        is_registered: true,
        plan: { name: 'Professional', is_public: false },
      },
    });

    renderPanel({ statusCTI: SUCCESS });

    expect(
      screen.getByText('This environment is on the Professional feed.'),
    ).toBeInTheDocument();
  });

  test('lists the environment identity and the subscription dates', () => {
    ctiFlowState.setEnvironmentUid('9ckQEmDsQ9eReRTUH4xPMg');
    ctiFlowState.setSubscription({
      status: 200,
      message: {
        is_registered: true,
        plan: { name: 'Professional', is_public: false },
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
      },
    });

    renderPanel({ statusCTI: SUCCESS });

    const details = screen.getByTestId('ctiFeedSubscriptionDetails');
    expect(details).toHaveTextContent('environment-01');
    expect(details).toHaveTextContent('Acme Corp');
    expect(details).toHaveTextContent('9ckQEmDsQ9eReRTUH4xPMg');
    expect(details).toHaveTextContent('Yearly');
    expect(details).toHaveTextContent('Renews');
  });

  test('opens the console from a registered environment', () => {
    ctiFlowState.setSubscription({
      status: 200,
      message: {
        is_registered: true,
        plan: { name: 'Professional', is_public: false },
      },
    });

    renderPanel({ statusCTI: SUCCESS });

    const link = screen.getByTestId('ctiFeedSubscriptionConsoleLink');
    expect(link).toHaveAttribute('href', WAZUH_CTI_CONSOLE_HREF);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveTextContent('Open in Wazuh Console');
  });

  test('shows no details or console link before the registration', () => {
    ctiFlowState.setEnvironmentUid('9ckQEmDsQ9eReRTUH4xPMg');

    renderPanel();

    expect(screen.queryByTestId('ctiFeedSubscriptionDetails')).toBeNull();
    expect(screen.queryByTestId('ctiFeedSubscriptionConsoleLink')).toBeNull();
    expect(mockedFetchPermission).not.toHaveBeenCalled();
  });

  describe('registration options', () => {
    const registerInIndexer = () =>
      ctiFlowState.setSubscription({
        status: 200,
        message: {
          is_registered: true,
          plan: { name: 'Professional', is_public: false },
        },
      });

    test('are offered to a user allowed to clear the local registration', async () => {
      registerInIndexer();
      mockedFetchPermission.mockResolvedValue({
        accessAllowed: true,
        missingPrivileges: [],
      });

      renderPanel({ statusCTI: SUCCESS });

      expect(
        await screen.findByTestId('ctiFeedRegistrationOptions'),
      ).toBeInTheDocument();
      expect(mockedFetchPermission).toHaveBeenCalledWith('clear');
    });

    test('are hidden from a user the indexer did not confirm', async () => {
      registerInIndexer();

      renderPanel({ statusCTI: SUCCESS });

      await waitFor(() =>
        expect(mockedFetchPermission).toHaveBeenCalledWith('clear'),
      );
      expect(screen.queryByTestId('ctiFeedRegistrationOptions')).toBeNull();
    });

    test('are not probed when the indexer holds no registration', () => {
      // A completed device flow whose subscription read failed (502).
      ctiFlowState.setSubscription({ status: 502, message: null });

      renderPanel({ statusCTI: SUCCESS });

      expect(mockedFetchPermission).not.toHaveBeenCalled();
      expect(screen.queryByTestId('ctiFeedRegistrationOptions')).toBeNull();
    });
  });
});
