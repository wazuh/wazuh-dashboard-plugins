import {
  CtiRegistrationStore,
  parseDeviceAuthorizationForStore,
} from './cti-registration-store';

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

/* eslint-disable camelcase -- OAuth device authorization JSON uses snake_case */
describe('parseDeviceAuthorizationForStore — verification links', () => {
  it('keeps an https pair on the same origin', () => {
    const parsed = parseDeviceAuthorizationForStore({
      device_code: 'dc1',
      user_code: 'WZH-1',
      verification_uri: 'https://console.test/register',
      verification_uri_complete:
        'https://console.test/register?user_code=WZH-1',
    });
    expect(parsed.verification_uri).toBe('https://console.test/register');
    expect(parsed.verification_uri_complete).toBe(
      'https://console.test/register?user_code=WZH-1',
    );
  });

  it('stores a target on the shown origin when the two fields name different hosts', () => {
    const parsed = parseDeviceAuthorizationForStore({
      device_code: 'dc1',
      user_code: 'WZH-1',
      verification_uri: 'https://console.test/register',
      verification_uri_complete: 'https://other.test/register?user_code=WZH-1',
    });
    expect(parsed.verification_uri_complete).toBe(
      'https://console.test/register?user_code=WZH-1',
    );
  });

  it('stores no link when neither field is https', () => {
    const parsed = parseDeviceAuthorizationForStore({
      device_code: 'dc1',
      user_code: 'WZH-1',
      verification_uri: 'http://console.test/register',
      verification_uri_complete: 'javascript:alert(1)',
    });
    expect(parsed.device_code).toBe('dc1');
    expect(parsed.verification_uri).toBe('');
    expect(parsed.verification_uri_complete).toBe('');
  });
});
/* eslint-enable camelcase */
