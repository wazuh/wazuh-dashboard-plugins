import { hydrateCtiFlowFromServer } from './cti-registration-status';
import { ctiFlowState } from './cti-flow-state';
import { getCore } from '../plugin-services';

const mockHttpGet = jest.fn();

jest.mock('../plugin-services', () => ({
  getCore: jest.fn(),
}));

(getCore as jest.Mock).mockReturnValue({
  http: { get: mockHttpGet },
});

describe('hydrateCtiFlowFromServer', () => {
  afterEach(() => {
    ctiFlowState.reset();
    ctiFlowState.setRegistrationLost(null);
    mockHttpGet.mockReset();
  });

  /* eslint-disable camelcase -- status API body uses snake_case */
  it('stores the registration loss the server reports, and clears it when gone', async () => {
    const lost = {
      detected_at: '2026-10-12T17:57:35.000Z',
      last_plan: 'Professional',
    };
    const unregistered = {
      registrationComplete: false,
      inProgress: false,
      subscription: {
        message: {
          plan: { name: 'Open', is_public: true },
          is_registered: false,
        },
        status: 200,
      },
    };
    mockHttpGet.mockResolvedValueOnce({
      ...unregistered,
      registration_lost: lost,
    });

    await hydrateCtiFlowFromServer();
    expect(ctiFlowState.getRegistrationLost()).toEqual(lost);

    mockHttpGet.mockResolvedValueOnce(unregistered);
    await hydrateCtiFlowFromServer();
    expect(ctiFlowState.getRegistrationLost()).toBeNull();
  });
  /* eslint-enable camelcase */

  it('keeps the registration complete when the subscription status is unknown (502)', async () => {
    mockHttpGet.mockResolvedValue({
      registrationComplete: true,
      inProgress: false,
      subscription: { message: null, status: 502 },
    });

    await hydrateCtiFlowFromServer();

    expect(ctiFlowState.isRegistrationComplete()).toBe(true);
    expect(ctiFlowState.isRegistered()).toBe(false);
    expect(ctiFlowState.getSubscription()).toEqual({
      message: null,
      status: 502,
    });
  });

  it('marks the registration complete when CM confirms it is registered', async () => {
    mockHttpGet.mockResolvedValue({
      registrationComplete: true,
      inProgress: false,
      subscription: {
        message: {
          plan: { name: 'basic', is_public: true },
          is_registered: true,
        },
        status: 200,
      },
    });

    await hydrateCtiFlowFromServer();

    expect(ctiFlowState.isRegistrationComplete()).toBe(true);
    expect(ctiFlowState.isRegistered()).toBe(true);
  });

  it('resets when CM confirms the instance is not registered and there is no active device flow', async () => {
    mockHttpGet.mockResolvedValue({
      registrationComplete: false,
      inProgress: false,
      subscription: {
        message: { plan: { name: '', is_public: true }, is_registered: false },
        status: 200,
      },
    });

    await hydrateCtiFlowFromServer();

    expect(ctiFlowState.isRegistrationComplete()).toBe(false);
    expect(ctiFlowState.isRegistered()).toBe(false);
  });

  it('restores how long an in-progress device code has been pending', async () => {
    /* eslint-disable camelcase -- status API body uses snake_case */
    mockHttpGet.mockResolvedValue({
      registrationComplete: false,
      inProgress: true,
      device_code: 'dc-pending',
      user_code: 'WZH-1',
      verification_uri: 'https://example.test/register',
      expires_in_remaining_sec: 600,
      pending_for_sec: 90,
      environment_uid: 'env-uuid-1',
      subscription: { message: null, status: null },
    });
    /* eslint-enable camelcase */

    await hydrateCtiFlowFromServer();

    expect(ctiFlowState.getDeviceCode()).toBe('dc-pending');
    expect(ctiFlowState.getDeviceAuthPendingMs()).toBeGreaterThanOrEqual(
      90 * 1000,
    );
    expect(ctiFlowState.getEnvironmentUid()).toBe('env-uuid-1');
  });
});
