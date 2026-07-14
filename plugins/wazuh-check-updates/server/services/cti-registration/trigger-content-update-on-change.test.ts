import { CtiRegistrationStore } from './cti-registration-store';
import { triggerContentUpdateOnChange } from './trigger-content-update-on-change';
import { getWazuhCheckUpdatesServices } from '../../plugin-services';
import { ctiContentUpdateReasons } from '../../../common/constants';

jest.mock('../../plugin-services', () => ({
  getWazuhCheckUpdatesServices: jest.fn(),
}));

const mockedGetWazuhCheckUpdatesServices =
  getWazuhCheckUpdatesServices as jest.Mock;

function buildWazuhClient(requestImpl: jest.Mock) {
  return {
    asCurrentUser: {
      transport: {
        request: requestImpl,
      },
    },
  } as any;
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(res => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('triggerContentUpdateOnChange', () => {
  const logger = { error: jest.fn(), info: jest.fn(), warn: jest.fn() };

  beforeEach(() => {
    CtiRegistrationStore.resetForTests();
    logger.error.mockClear();
    mockedGetWazuhCheckUpdatesServices.mockReturnValue({ logger });
  });

  test('first observation stores baseline only, does not fire', async () => {
    const contentUpdate = jest.fn().mockResolvedValue({});
    const wazuhClient = buildWazuhClient(contentUpdate);

    const outcome = await triggerContentUpdateOnChange(
      wazuhClient,
      'env-uuid-1',
      {
        message: {
          is_registered: true,
          plan: { name: 'basic', is_public: true },
        },
        status: 200,
      },
    );

    expect(outcome).toEqual({
      triggered: false,
      failed: false,
      reason: ctiContentUpdateReasons.NONE,
    });
    expect(contentUpdate).not.toHaveBeenCalled();
    expect(
      CtiRegistrationStore.getInstance().getSubscriptionSnapshot('env-uuid-1'),
    ).toEqual({
      isRegistered: true,
      planName: 'basic',
    });
  });

  test('fires when unregistered transitions to registered', async () => {
    const contentUpdate = jest.fn().mockResolvedValue({});
    const wazuhClient = buildWazuhClient(contentUpdate);
    const store = CtiRegistrationStore.getInstance();
    store.setSubscriptionSnapshot('env-uuid-1', {
      isRegistered: false,
      planName: '',
    });

    const outcome = await triggerContentUpdateOnChange(
      wazuhClient,
      'env-uuid-1',
      {
        message: {
          is_registered: true,
          plan: { name: 'basic', is_public: true },
        },
        status: 200,
      },
    );

    expect(outcome).toEqual({
      triggered: true,
      failed: false,
      reason: ctiContentUpdateReasons.REGISTRATION_CHANGED,
    });
    expect(contentUpdate).toHaveBeenCalledTimes(1);
    expect(contentUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'POST', body: {} }),
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining(ctiContentUpdateReasons.REGISTRATION_CHANGED),
    );
  });

  test('fires when plan name changes while registered', async () => {
    const contentUpdate = jest.fn().mockResolvedValue({});
    const wazuhClient = buildWazuhClient(contentUpdate);
    const store = CtiRegistrationStore.getInstance();
    store.setSubscriptionSnapshot('env-uuid-1', {
      isRegistered: true,
      planName: 'basic',
    });

    const outcome = await triggerContentUpdateOnChange(
      wazuhClient,
      'env-uuid-1',
      {
        message: {
          is_registered: true,
          plan: { name: 'advanced', is_public: true },
        },
        status: 200,
      },
    );

    expect(outcome).toEqual({
      triggered: true,
      failed: false,
      reason: ctiContentUpdateReasons.PLAN_NAME_CHANGED,
    });
    expect(contentUpdate).toHaveBeenCalledTimes(1);
  });

  test('reason is registration-changed when registration and plan name change coincide', async () => {
    const contentUpdate = jest.fn().mockResolvedValue({});
    const wazuhClient = buildWazuhClient(contentUpdate);
    const store = CtiRegistrationStore.getInstance();
    store.setSubscriptionSnapshot('env-uuid-1', {
      isRegistered: false,
      planName: 'basic',
    });

    const outcome = await triggerContentUpdateOnChange(
      wazuhClient,
      'env-uuid-1',
      {
        message: {
          is_registered: true,
          plan: { name: 'advanced', is_public: true },
        },
        status: 200,
      },
    );

    expect(outcome).toEqual({
      triggered: true,
      failed: false,
      reason: ctiContentUpdateReasons.REGISTRATION_CHANGED,
    });
  });

  test('does not fire on steady state (no change)', async () => {
    const contentUpdate = jest.fn().mockResolvedValue({});
    const wazuhClient = buildWazuhClient(contentUpdate);
    const store = CtiRegistrationStore.getInstance();
    store.setSubscriptionSnapshot('env-uuid-1', {
      isRegistered: true,
      planName: 'advanced',
    });

    const outcome = await triggerContentUpdateOnChange(
      wazuhClient,
      'env-uuid-1',
      {
        message: {
          is_registered: true,
          plan: { name: 'advanced', is_public: true },
        },
        status: 200,
      },
    );

    expect(outcome).toEqual({
      triggered: false,
      failed: false,
      reason: ctiContentUpdateReasons.NONE,
    });
    expect(contentUpdate).not.toHaveBeenCalled();
  });

  test('fires on unregistration too', async () => {
    const contentUpdate = jest.fn().mockResolvedValue({});
    const wazuhClient = buildWazuhClient(contentUpdate);
    const store = CtiRegistrationStore.getInstance();
    store.setSubscriptionSnapshot('env-uuid-1', {
      isRegistered: true,
      planName: 'advanced',
    });

    const outcome = await triggerContentUpdateOnChange(
      wazuhClient,
      'env-uuid-1',
      {
        message: {
          is_registered: false,
          plan: { name: 'advanced', is_public: true },
        },
        status: 200,
      },
    );

    expect(outcome).toEqual({
      triggered: true,
      failed: false,
      reason: ctiContentUpdateReasons.REGISTRATION_CHANGED,
    });
    expect(contentUpdate).toHaveBeenCalledTimes(1);
    expect(
      CtiRegistrationStore.getInstance().getSubscriptionSnapshot('env-uuid-1'),
    ).toEqual({ isRegistered: false, planName: 'advanced' });
  });

  test('failure path returns triggered+failed and logs the error', async () => {
    const contentUpdate = jest.fn().mockRejectedValue(new Error('boom'));
    const wazuhClient = buildWazuhClient(contentUpdate);
    const store = CtiRegistrationStore.getInstance();
    store.setSubscriptionSnapshot('env-uuid-1', {
      isRegistered: false,
      planName: '',
    });

    const outcome = await triggerContentUpdateOnChange(
      wazuhClient,
      'env-uuid-1',
      {
        message: {
          is_registered: true,
          plan: { name: 'basic', is_public: true },
        },
        status: 200,
      },
    );

    expect(outcome).toEqual({
      triggered: true,
      failed: true,
      reason: ctiContentUpdateReasons.REGISTRATION_CHANGED,
    });
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error.mock.calls[0][0]).toContain('env-uuid-1');
    expect(logger.error.mock.calls[0][0]).toContain(
      ctiContentUpdateReasons.REGISTRATION_CHANGED,
    );
  });

  test('releases the lock so a subsequent qualifying call is not blocked', async () => {
    const contentUpdate = jest.fn().mockResolvedValue({});
    const wazuhClient = buildWazuhClient(contentUpdate);
    const store = CtiRegistrationStore.getInstance();
    store.setSubscriptionSnapshot('env-uuid-1', {
      isRegistered: false,
      planName: '',
    });

    await triggerContentUpdateOnChange(wazuhClient, 'env-uuid-1', {
      message: {
        is_registered: true,
        plan: { name: 'basic', is_public: true },
      },
      status: 200,
    });

    store.setSubscriptionSnapshot('env-uuid-1', {
      isRegistered: false,
      planName: 'basic',
    });

    const outcome = await triggerContentUpdateOnChange(
      wazuhClient,
      'env-uuid-1',
      {
        message: {
          is_registered: true,
          plan: { name: 'advanced', is_public: true },
        },
        status: 200,
      },
    );

    expect(outcome).toEqual({
      triggered: true,
      failed: false,
      reason: ctiContentUpdateReasons.REGISTRATION_CHANGED,
    });
    expect(contentUpdate).toHaveBeenCalledTimes(2);
  });

  test('a slower overlapping call cannot clobber a fresher snapshot once its own request resolves', async () => {
    const deferred = createDeferred<unknown>();
    const contentUpdate = jest.fn().mockReturnValue(deferred.promise);
    const wazuhClient = buildWazuhClient(contentUpdate);
    const store = CtiRegistrationStore.getInstance();
    store.setSubscriptionSnapshot('env-uuid-1', {
      isRegistered: false,
      planName: '',
    });

    // Call A starts first, acquires the lock, and is left in flight (its
    // POST hasn't resolved yet).
    const outcomeAPromise = triggerContentUpdateOnChange(
      wazuhClient,
      'env-uuid-1',
      {
        message: {
          is_registered: true,
          plan: { name: 'basic', is_public: true },
        },
        status: 200,
      },
    );

    // Call B overlaps while A is still in flight: the lock is already held,
    // so it does not fire, but it still records the freshest observation.
    const outcomeB = await triggerContentUpdateOnChange(
      wazuhClient,
      'env-uuid-1',
      {
        message: {
          is_registered: true,
          plan: { name: 'advanced', is_public: true },
        },
        status: 200,
      },
    );

    expect(outcomeB).toEqual({
      triggered: false,
      failed: false,
      reason: ctiContentUpdateReasons.PLAN_NAME_CHANGED,
    });
    expect(contentUpdate).toHaveBeenCalledTimes(1);
    expect(
      CtiRegistrationStore.getInstance().getSubscriptionSnapshot('env-uuid-1'),
    ).toEqual({ isRegistered: true, planName: 'advanced' });

    // A's POST finally resolves — its completion must not overwrite the
    // fresher snapshot B already recorded.
    deferred.resolve({});
    const outcomeA = await outcomeAPromise;

    expect(outcomeA).toEqual({
      triggered: true,
      failed: false,
      reason: ctiContentUpdateReasons.REGISTRATION_CHANGED,
    });
    expect(
      CtiRegistrationStore.getInstance().getSubscriptionSnapshot('env-uuid-1'),
    ).toEqual({ isRegistered: true, planName: 'advanced' });
  });
});
