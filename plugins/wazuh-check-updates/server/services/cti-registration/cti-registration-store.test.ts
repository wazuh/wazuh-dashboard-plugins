import { CtiRegistrationStore } from './cti-registration-store';

describe('CtiRegistrationStore — subscription snapshot + update lock', () => {
  afterEach(() => {
    CtiRegistrationStore.resetForTests();
  });

  test('getSubscriptionSnapshot returns undefined when no snapshot exists', () => {
    const store = CtiRegistrationStore.getInstance();
    expect(store.getSubscriptionSnapshot('env-uuid-1')).toBeUndefined();
  });

  test('setSubscriptionSnapshot then getSubscriptionSnapshot returns the stored snapshot', () => {
    const store = CtiRegistrationStore.getInstance();
    store.setSubscriptionSnapshot('env-uuid-1', {
      isRegistered: true,
      planName: 'advanced',
    });

    expect(store.getSubscriptionSnapshot('env-uuid-1')).toEqual({
      isRegistered: true,
      planName: 'advanced',
    });
  });

  test('snapshots are isolated per environment UUID', () => {
    const store = CtiRegistrationStore.getInstance();
    store.setSubscriptionSnapshot('env-uuid-1', {
      isRegistered: true,
      planName: 'advanced',
    });
    store.setSubscriptionSnapshot('env-uuid-2', {
      isRegistered: false,
      planName: '',
    });

    expect(store.getSubscriptionSnapshot('env-uuid-1')).toEqual({
      isRegistered: true,
      planName: 'advanced',
    });
    expect(store.getSubscriptionSnapshot('env-uuid-2')).toEqual({
      isRegistered: false,
      planName: '',
    });
  });

  test('tryAcquireUpdateLock returns true when lock is free and false while held', () => {
    const store = CtiRegistrationStore.getInstance();
    store.setSubscriptionSnapshot('env-uuid-1', {
      isRegistered: false,
      planName: '',
    });

    expect(store.tryAcquireUpdateLock('env-uuid-1')).toBe(true);
    expect(store.tryAcquireUpdateLock('env-uuid-1')).toBe(false);
  });

  test('releaseUpdateLock allows re-acquiring the lock', () => {
    const store = CtiRegistrationStore.getInstance();
    store.setSubscriptionSnapshot('env-uuid-1', {
      isRegistered: false,
      planName: '',
    });

    expect(store.tryAcquireUpdateLock('env-uuid-1')).toBe(true);
    store.releaseUpdateLock('env-uuid-1');
    expect(store.tryAcquireUpdateLock('env-uuid-1')).toBe(true);
  });

  test('tryAcquireUpdateLock refuses when there is no snapshot entry yet', () => {
    const store = CtiRegistrationStore.getInstance();
    expect(store.tryAcquireUpdateLock('env-uuid-new')).toBe(false);
  });

  test('resetForTests clears subscription snapshots', () => {
    const store = CtiRegistrationStore.getInstance();
    store.setSubscriptionSnapshot('env-uuid-1', {
      isRegistered: true,
      planName: 'advanced',
    });

    CtiRegistrationStore.resetForTests();

    const freshStore = CtiRegistrationStore.getInstance();
    expect(freshStore.getSubscriptionSnapshot('env-uuid-1')).toBeUndefined();
  });
});
