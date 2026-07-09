import {
  CTI_DEFAULT_DEVICE_CODE_EXPIRES_IN_SEC,
  CTI_DEFAULT_DEVICE_POLL_INTERVAL_SEC,
  CTI_SLOW_DOWN_EXTRA_INTERVAL_SEC,
} from '../../../common/constants';

export type CtiRegistrationStoreRecord = {
  environmentUuid: string;
  registrationComplete: boolean;
  device_code: string | null;
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
  deviceAuthExpiresAtMs: number;
  poll_interval_sec: number;
};

/** Minimal subscription shape persisted per environment UUID to detect plan/registration changes. */
export type SubscriptionSnapshot = {
  isRegistered: boolean;
  planName: string; // '' when no plan
};

type SnapshotEntry = {
  snapshot: SubscriptionSnapshot;
  updateInFlight: boolean;
};

function coercePositiveInt(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }
  return fallback;
}

function coerceNonEmptyString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/**
 * Normalizes the CTI Console device-authorization JSON into fields we persist per environment.
 */
export function parseDeviceAuthorizationForStore(
  responseData: unknown,
): Omit<
  CtiRegistrationStoreRecord,
  'environmentUuid' | 'registrationComplete'
> {
  const o = responseData as Record<string, unknown>;
  const device_code = coerceNonEmptyString(o.device_code);
  if (!device_code) {
    throw new Error('CTI device authorization response missing device_code');
  }

  const user_code = coerceNonEmptyString(o.user_code);
  const verification_uri = coerceNonEmptyString(
    o.verification_uri ?? o.verification_uri_complete,
  );
  const userCodeParam =
    user_code.length > 0 ? encodeURIComponent(user_code) : '';
  const verification_uri_complete =
    coerceNonEmptyString(o.verification_uri_complete) ||
    (verification_uri && userCodeParam
      ? `${verification_uri}${
          verification_uri.includes('?') ? '&' : '?'
        }user_code=${userCodeParam}`
      : '');

  const expiresInSec = coercePositiveInt(
    o.expires_in,
    CTI_DEFAULT_DEVICE_CODE_EXPIRES_IN_SEC,
  );
  const poll_interval_sec = coercePositiveInt(
    o.interval,
    CTI_DEFAULT_DEVICE_POLL_INTERVAL_SEC,
  );

  return {
    device_code,
    user_code,
    verification_uri: verification_uri || verification_uri_complete,
    verification_uri_complete,
    deviceAuthExpiresAtMs: Date.now() + expiresInSec * 1000,
    poll_interval_sec,
  };
}

/**
 * In-memory CTI device registration state keyed by environment UUID (`client_id` / cluster).
 * Singleton pattern aligned with other dashboard services (e.g. NavigationService).
 */
export class CtiRegistrationStore {
  private static instance: CtiRegistrationStore | undefined;

  private readonly byEnvironmentUuid = new Map<
    string,
    CtiRegistrationStoreRecord
  >();

  /**
   * Per-environment subscription snapshot used to detect plan/registration changes,
   * kept SEPARATE from `byEnvironmentUuid` (device-flow scoped, cleared on completion/expiry).
   */
  private readonly subscriptionByEnvironmentUuid = new Map<
    string,
    SnapshotEntry
  >();

  private constructor() {}

  static getInstance(): CtiRegistrationStore {
    if (!CtiRegistrationStore.instance) {
      CtiRegistrationStore.instance = new CtiRegistrationStore();
    }
    return CtiRegistrationStore.instance;
  }

  /** Test-only: drop singleton and all entries. */
  static resetForTests(): void {
    CtiRegistrationStore.instance?.byEnvironmentUuid.clear();
    CtiRegistrationStore.instance?.subscriptionByEnvironmentUuid.clear();
    CtiRegistrationStore.instance = undefined;
  }

  /** Returns the last-known subscription snapshot for the given environment UUID, if any. */
  getSubscriptionSnapshot(
    environmentUuid: string,
  ): SubscriptionSnapshot | undefined {
    return this.subscriptionByEnvironmentUuid.get(environmentUuid)?.snapshot;
  }

  /** Persists the subscription snapshot for the given environment UUID. */
  setSubscriptionSnapshot(
    environmentUuid: string,
    snapshot: SubscriptionSnapshot,
  ): void {
    const cur = this.subscriptionByEnvironmentUuid.get(environmentUuid);
    this.subscriptionByEnvironmentUuid.set(environmentUuid, {
      snapshot,
      updateInFlight: cur?.updateInFlight ?? false,
    });
  }

  /**
   * Attempts to acquire the content-update in-flight lock for an environment.
   * Returns `false` if the lock is already held (a content-update is in progress).
   */
  tryAcquireUpdateLock(environmentUuid: string): boolean {
    const cur = this.subscriptionByEnvironmentUuid.get(environmentUuid);
    if (cur?.updateInFlight) {
      return false;
    }
    this.subscriptionByEnvironmentUuid.set(environmentUuid, {
      snapshot: cur?.snapshot ?? { isRegistered: false, planName: '' },
      updateInFlight: true,
    });
    return true;
  }

  /** Releases the content-update in-flight lock for an environment. */
  releaseUpdateLock(environmentUuid: string): void {
    const cur = this.subscriptionByEnvironmentUuid.get(environmentUuid);
    if (!cur) {
      return;
    }
    this.subscriptionByEnvironmentUuid.set(environmentUuid, {
      ...cur,
      updateInFlight: false,
    });
  }

  getStatus(environmentUuid: string): CtiRegistrationStoreRecord | undefined {
    return this.byEnvironmentUuid.get(environmentUuid);
  }

  setInProgress(
    environmentUuid: string,
    payload: Omit<
      CtiRegistrationStoreRecord,
      'environmentUuid' | 'registrationComplete'
    >,
  ): void {
    this.byEnvironmentUuid.set(environmentUuid, {
      environmentUuid,
      registrationComplete: false,
      ...payload,
    });
  }

  setRegistrationComplete(environmentUuid: string): void {
    const cur = this.byEnvironmentUuid.get(environmentUuid);
    if (!cur) {
      return;
    }
    this.byEnvironmentUuid.set(environmentUuid, {
      ...cur,
      registrationComplete: true,
      device_code: null,
      user_code: '',
      verification_uri: '',
      verification_uri_complete: '',
    });
  }

  applySlowDown(environmentUuid: string): void {
    const cur = this.byEnvironmentUuid.get(environmentUuid);
    if (!cur || cur.registrationComplete) {
      return;
    }
    this.byEnvironmentUuid.set(environmentUuid, {
      ...cur,
      poll_interval_sec:
        cur.poll_interval_sec + CTI_SLOW_DOWN_EXTRA_INTERVAL_SEC,
    });
  }

  clear(environmentUuid: string): void {
    this.byEnvironmentUuid.delete(environmentUuid);
  }
}
