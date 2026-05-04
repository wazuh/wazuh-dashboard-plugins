import {
  CTI_DEFAULT_DEVICE_POLL_INTERVAL_SEC,
  CTI_MAX_DEVICE_POLL_INTERVAL_SEC,
  CTI_MIN_DEVICE_POLL_INTERVAL_SEC,
  CTI_SLOW_DOWN_EXTRA_INTERVAL_SEC,
} from '../../common/constants';
import type { CtiDeviceAuthorization } from '../shared-components/cti-registration/types';

let deviceCode: string | null = null;
let registrationComplete = false;
let pollIntervalSeconds = CTI_DEFAULT_DEVICE_POLL_INTERVAL_SEC;
let deviceAuthExpiresAt: number | null = null;
let deviceAuthLinks: CtiDeviceAuthorization | null = null;
let persistedCtiCredentials = false;

export const ctiFlowState = {
  setPersistedCtiCredentials(value: boolean): void {
    persistedCtiCredentials = value;
  },

  hasPersistedCtiCredentials(): boolean {
    return persistedCtiCredentials;
  },

  getDeviceCode(): string | null {
    return deviceCode;
  },

  setDeviceCode(code: string | null): void {
    deviceCode = code && code.length > 0 ? code : null;
    if (!deviceCode) {
      deviceAuthLinks = null;
    }
  },

  getDeviceAuthLinks(): CtiDeviceAuthorization | null {
    return deviceAuthLinks;
  },

  setDeviceAuthLinks(links: CtiDeviceAuthorization | null): void {
    deviceAuthLinks = links;
  },

  isRegistrationComplete(): boolean {
    return registrationComplete;
  },

  setRegistrationComplete(complete: boolean): void {
    registrationComplete = complete;
    if (complete) {
      deviceCode = null;
      deviceAuthExpiresAt = null;
      deviceAuthLinks = null;
    }
  },

  getPollIntervalSec(): number {
    return pollIntervalSeconds;
  },

  setPollIntervalSec(seconds: number): void {
    const n =
      Number.isFinite(seconds) && seconds > 0
        ? seconds
        : CTI_DEFAULT_DEVICE_POLL_INTERVAL_SEC;
    pollIntervalSeconds = Math.min(
      Math.max(CTI_MIN_DEVICE_POLL_INTERVAL_SEC, Math.floor(n)),
      CTI_MAX_DEVICE_POLL_INTERVAL_SEC,
    );
  },

  applySlowDown(): void {
    pollIntervalSeconds += CTI_SLOW_DOWN_EXTRA_INTERVAL_SEC;
  },

  setDeviceAuthExpiry(expiresInSec: number | null | undefined): void {
    if (
      expiresInSec == null ||
      !Number.isFinite(expiresInSec) ||
      expiresInSec <= 0
    ) {
      deviceAuthExpiresAt = null;
      return;
    }
    deviceAuthExpiresAt = Date.now() + Math.floor(expiresInSec) * 1000;
  },

  isDeviceAuthExpired(): boolean {
    return deviceAuthExpiresAt != null && Date.now() > deviceAuthExpiresAt;
  },

  reset(): void {
    deviceCode = null;
    registrationComplete = false;
    pollIntervalSeconds = CTI_DEFAULT_DEVICE_POLL_INTERVAL_SEC;
    deviceAuthExpiresAt = null;
    deviceAuthLinks = null;
  },
};
