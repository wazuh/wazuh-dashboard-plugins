/* eslint-disable camelcase -- CTI fields keep their API names */
import { act, renderHook } from '@testing-library/react';
import type { CtiSubscriptionSnapshot } from '../../../../common/cti-registration-status-api';
import { ctiFlowState } from '../../../services/cti-flow-state';
import {
  getSubscriptionKey,
  useSubscriptionChange,
} from './use-subscription-change';

const PROFESSIONAL: CtiSubscriptionSnapshot = {
  status: 200,
  message: {
    is_registered: true,
    plan: { name: 'Professional', is_public: false },
  },
};
const OPEN_REGISTERED: CtiSubscriptionSnapshot = {
  status: 200,
  message: { is_registered: true, plan: { name: 'Open', is_public: true } },
};
const NOT_REGISTERED: CtiSubscriptionSnapshot = {
  status: 200,
  message: { is_registered: false, plan: { name: 'Open', is_public: true } },
};
const UNKNOWN: CtiSubscriptionSnapshot = { status: 502, message: null };

const read = (snapshot: CtiSubscriptionSnapshot) =>
  act(() => {
    ctiFlowState.setSubscription(snapshot);
  });

describe('getSubscriptionKey', () => {
  beforeEach(() => ctiFlowState.reset());

  test('is null while the subscription is unknown', () => {
    expect(getSubscriptionKey()).toBeNull();
    ctiFlowState.setSubscription(UNKNOWN);
    expect(getSubscriptionKey()).toBeNull();
  });

  test('combines the registration and the plan', () => {
    ctiFlowState.setSubscription(PROFESSIONAL);
    expect(getSubscriptionKey()).toBe('true|Professional');
  });
});

describe('useSubscriptionChange', () => {
  beforeEach(() => ctiFlowState.reset());

  test('is quiet on the first read', () => {
    const onChange = jest.fn();
    renderHook(() => useSubscriptionChange(onChange));

    read(PROFESSIONAL);

    expect(onChange).not.toHaveBeenCalled();
  });

  test('reports a plan change', () => {
    ctiFlowState.setSubscription(PROFESSIONAL);
    const onChange = jest.fn();
    renderHook(() => useSubscriptionChange(onChange));

    read(OPEN_REGISTERED);

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  test('reports a registration change', () => {
    ctiFlowState.setSubscription(PROFESSIONAL);
    const onChange = jest.fn();
    renderHook(() => useSubscriptionChange(onChange));

    read(NOT_REGISTERED);
    read(PROFESSIONAL);

    expect(onChange).toHaveBeenCalledTimes(2);
  });

  test('ignores reads that change nothing', () => {
    ctiFlowState.setSubscription(PROFESSIONAL);
    const onChange = jest.fn();
    renderHook(() => useSubscriptionChange(onChange));

    read({ ...PROFESSIONAL });
    read(PROFESSIONAL);

    expect(onChange).not.toHaveBeenCalled();
  });

  test('does not read an unknown status as a change', () => {
    ctiFlowState.setSubscription(PROFESSIONAL);
    const onChange = jest.fn();
    renderHook(() => useSubscriptionChange(onChange));

    read(UNKNOWN);
    read(PROFESSIONAL);

    expect(onChange).not.toHaveBeenCalled();
  });
});
