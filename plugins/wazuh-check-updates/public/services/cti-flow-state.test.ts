import { ctiFlowState } from './cti-flow-state';

describe('ctiFlowState.subscribe', () => {
  beforeEach(() => {
    ctiFlowState.reset();
  });

  it('notifies when the device flow or registration state changes', () => {
    const listener = jest.fn();
    const unsubscribe = ctiFlowState.subscribe(listener);

    ctiFlowState.setDeviceCode('device-code');
    ctiFlowState.setRegistrationComplete(true);
    ctiFlowState.reset();

    expect(listener).toHaveBeenCalledTimes(3);
    unsubscribe();
  });

  it('does not notify when a setter leaves the state unchanged', () => {
    ctiFlowState.setDeviceCode('device-code');
    const listener = jest.fn();
    const unsubscribe = ctiFlowState.subscribe(listener);
    const version = ctiFlowState.getVersion();

    ctiFlowState.setDeviceCode('device-code');
    ctiFlowState.setRegistrationComplete(false);
    ctiFlowState.setPollIntervalSec(10);

    expect(listener).not.toHaveBeenCalled();
    expect(ctiFlowState.getVersion()).toBe(version);
    unsubscribe();
  });

  it('tracks open registration modals and notifies on open and close', () => {
    const listener = jest.fn();
    const unsubscribe = ctiFlowState.subscribe(listener);

    const close = ctiFlowState.openModal();
    expect(ctiFlowState.isModalOpen()).toBe(true);

    close();
    expect(ctiFlowState.isModalOpen()).toBe(false);
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });

  it('stops notifying after unsubscribe', () => {
    const listener = jest.fn();
    ctiFlowState.subscribe(listener)();

    ctiFlowState.setDeviceCode('device-code');

    expect(listener).not.toHaveBeenCalled();
  });
});

describe('ctiFlowState registration loss', () => {
  /* eslint-disable camelcase -- status API body uses snake_case */
  const lost = {
    detected_at: '2026-10-12T17:57:35.000Z',
    last_plan: 'Professional',
  };
  /* eslint-enable camelcase */

  afterEach(() => {
    ctiFlowState.setRegistrationLost(null);
  });

  it('notifies when the loss changes', () => {
    const listener = jest.fn();
    const unsubscribe = ctiFlowState.subscribe(listener);

    ctiFlowState.setRegistrationLost(lost);
    ctiFlowState.setRegistrationLost({ ...lost });
    ctiFlowState.setRegistrationLost(null);

    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });

  it('keeps the server-reported loss across a flow reset', () => {
    ctiFlowState.setRegistrationLost(lost);

    ctiFlowState.reset();

    expect(ctiFlowState.getRegistrationLost()).toEqual(lost);
  });
});
