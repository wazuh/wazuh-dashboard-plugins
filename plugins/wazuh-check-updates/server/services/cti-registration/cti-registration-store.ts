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
): Omit<CtiRegistrationStoreRecord, 'environmentUuid' | 'registrationComplete'> {
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

  private readonly byEnvironmentUuid = new Map<string, CtiRegistrationStoreRecord>();

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
    CtiRegistrationStore.instance = undefined;
  }

  getStatus(environmentUuid: string): CtiRegistrationStoreRecord | undefined {
    return this.byEnvironmentUuid.get(environmentUuid);
  }

  setInProgress(
    environmentUuid: string,
    payload: Omit<CtiRegistrationStoreRecord, 'environmentUuid' | 'registrationComplete'>,
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
