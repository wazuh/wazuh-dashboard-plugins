/* eslint-disable camelcase -- CTI consumer and query fields keep their API names */
import React from 'react';
import { configure, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { statusCodes } from '../../../common/constants';
import { ctiFlowState } from '../../services/cti-flow-state';
import { getSubscriptionState, SubscriptionPanel } from './subscription-panel';

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
  render(
    <SubscriptionPanel
      statusCTI={NOT_FOUND}
      loading={false}
      deviceFlowActive={false}
      onOpenRegistration={onOpenRegistration}
      {...props}
    />,
  );
  return { onOpenRegistration };
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
      'Pro Plan',
    );
    expect(screen.getByTestId('ctiFeedSubscriptionStatus')).toHaveTextContent(
      'Registered',
    );
    expect(screen.getByTestId('ctiFeedSubscriptionAction')).toHaveTextContent(
      'View registration',
    );
    expect(screen.queryByTestId('ctiFeedSubscriptionTiers')).toBeNull();
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
});
