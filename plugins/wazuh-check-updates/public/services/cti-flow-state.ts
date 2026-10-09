import {
  CTI_DEFAULT_DEVICE_POLL_INTERVAL_SEC,
  CTI_MAX_DEVICE_POLL_INTERVAL_SEC,
  CTI_MIN_DEVICE_POLL_INTERVAL_SEC,
  CTI_SLOW_DOWN_EXTRA_INTERVAL_SEC,
} from '../../common/constants';
import type { CtiSubscriptionSnapshot } from '../../common/cti-registration-status-api';
import type { CtiDeviceAuthorization } from '../shared-components/cti-registration/types';

let deviceCode: string | null = null;
let registrationComplete = false;
let pollIntervalSeconds = CTI_DEFAULT_DEVICE_POLL_INTERVAL_SEC;
let deviceAuthExpiresAt: number | null = null;
let deviceAuthStartedAt: number | null = null;
let environmentUid: string | null = null;
let deviceAuthLinks: CtiDeviceAuthorization | null = null;
let subscription: CtiSubscriptionSnapshot | null = null;
let lastStatusFetchAtMs: number | null = null;
let openModals = 0;
let version = 0;
const listeners = new Set<() => void>();

const flowKey = () =>
  `${deviceCode}|${registrationComplete}|${Boolean(
    subscription?.message?.is_registered,
  )}|${openModals}`;

/** Runs `change` and notifies subscribers if the flow or registration state moved. */
const track = (change: () => void): void => {
  const before = flowKey();
  change();
  if (flowKey() !== before) {
    version++;
    listeners.forEach(listener => listener());
  }
};

export const ctiFlowState = {
  /** Lets every mounted CTI control re-render when another one changes the flow. */
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getVersion(): number {
    return version;
  },

  /** Marks a registration modal as open; call the returned function on close. */
  openModal(): () => void {
    track(() => {
      openModals++;
    });
    return () =>
      track(() => {
        openModals--;
      });
  },

  isModalOpen(): boolean {
    return openModals > 0;
  },

  /** Whether CM subscription reports this environment as registered. */
  isRegistered(): boolean {
    return Boolean(subscription?.message?.is_registered);
  },

  setSubscription(value: CtiSubscriptionSnapshot | null): void {
    track(() => {
      subscription = value;
    });
  },

  getSubscription(): CtiSubscriptionSnapshot | null {
    return subscription;
  },

  getDeviceCode(): string | null {
    return deviceCode;
  },

  setDeviceCode(code: string | null): void {
    track(() => {
      deviceCode = code && code.length > 0 ? code : null;
      if (!deviceCode) {
        deviceAuthLinks = null;
      }
    });
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
    track(() => {
      registrationComplete = complete;
      if (complete) {
        deviceCode = null;
        deviceAuthExpiresAt = null;
        deviceAuthStartedAt = null;
        deviceAuthLinks = null;
      }
    });
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

  /** Records how long the current device code has been pending (0 for a new one). */
  setDeviceAuthPendingFor(pendingForSec: number): void {
    deviceAuthStartedAt =
      Date.now() - Math.max(0, Math.floor(pendingForSec)) * 1000;
  },

  /** Milliseconds the current device code has been pending, or `null` when unknown. */
  getDeviceAuthPendingMs(): number | null {
    return deviceAuthStartedAt === null
      ? null
      : Date.now() - deviceAuthStartedAt;
  },

  /** Environment UID sent as `client_id`: the deployment ID in Wazuh Cloud. */
  getEnvironmentUid(): string | null {
    return environmentUid;
  },

  setEnvironmentUid(uid: string | null | undefined): void {
    environmentUid = uid && uid.length > 0 ? uid : null;
  },

  /** Kept on this module-level singleton so it survives a component remount. */
  getLastStatusFetchAtMs(): number | null {
    return lastStatusFetchAtMs;
  },

  markStatusFetched(): void {
    lastStatusFetchAtMs = Date.now();
  },

  reset(): void {
    track(() => {
      deviceCode = null;
      registrationComplete = false;
      pollIntervalSeconds = CTI_DEFAULT_DEVICE_POLL_INTERVAL_SEC;
      deviceAuthExpiresAt = null;
      deviceAuthStartedAt = null;
      environmentUid = null;
      deviceAuthLinks = null;
      subscription = null;
      lastStatusFetchAtMs = null;
    });
  },
};
