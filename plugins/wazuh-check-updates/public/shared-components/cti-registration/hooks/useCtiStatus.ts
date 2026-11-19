import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { fetchCtiRegistrationStatus } from '../../../services/cti-registration-status';
import { ctiFlowState } from '../../../services/cti-flow-state';
import { ISubscriptionResponse } from '../../../services/types';
import {
  statusCodes,
  CTI_REGISTRATION_SUCCESS_STATUS_MESSAGE,
} from '../../../../common/constants';

/** Floor for the steady-state re-poll interval, guards against a misconfigured tight loop. */
const MIN_STATUS_POLL_SEC = 5;
const DEFAULT_STATUS_POLL_SEC = 30;
/**
 * With `refreshOnFocus`, returning to the page reads the status again unless the last
 * read is younger than this, so quick back-and-forth switching does not flood the
 * indexer and the Wazuh Console.
 */
export const CTI_FOCUS_REFRESH_MIN_MS = 5000;

export interface UseCtiStatusOptions {
  /**
   * Read the status every time the page comes back (tab visible again, or window
   * focused), not only once the polling interval has passed. For the page that shows
   * the subscription, where a change made in the Wazuh Console should show at once.
   */
  refreshOnFocus?: boolean;
}

/** Whether the last read is younger than `minAgeMs`. */
function wasFetchedWithin(minAgeMs: number): boolean {
  const last = ctiFlowState.getLastStatusFetchAtMs();
  return last !== null && Date.now() - last < minAgeMs;
}

function isSteadyRegistered(): boolean {
  return ctiFlowState.isRegistered() || ctiFlowState.isRegistrationComplete();
}

function getStatusPollIntervalMs(pollIntervalSec: number): number {
  return (
    Math.max(MIN_STATUS_POLL_SEC, pollIntervalSec || DEFAULT_STATUS_POLL_SEC) *
    1000
  );
}

/**
 * True when we're already registered and polled recently enough that a new
 * fetch (triggered by a remount or a visibility/focus change) would be
 * redundant.
 */
function isStatusStillFresh(pollIntervalSec: number): boolean {
  if (!isSteadyRegistered()) {
    return false;
  }
  const last = ctiFlowState.getLastStatusFetchAtMs();
  return (
    last !== null &&
    Date.now() - last < getStatusPollIntervalMs(pollIntervalSec)
  );
}

/**
 * Reads the already-known status straight from ctiFlowState (a module
 * singleton that survives a component remount) so a fresh mount reflects
 * reality immediately, instead of flashing back to "not found"/loading
 * while an avoidable re-fetch is in flight.
 */
function computeInitialStatus(): ISubscriptionResponse {
  if (isSteadyRegistered()) {
    return {
      status: statusCodes.SUCCESS,
      message: CTI_REGISTRATION_SUCCESS_STATUS_MESSAGE,
    };
  }
  return { status: statusCodes.NOT_FOUND, message: '' };
}

export const useCtiStatus = (
  deviceFlowNonce = 0,
  pollIntervalSec = DEFAULT_STATUS_POLL_SEC,
  { refreshOnFocus = false }: UseCtiStatusOptions = {},
) => {
  const [statusCTI, setStatusCTI] =
    useState<ISubscriptionResponse>(computeInitialStatus);
  const [loading, setLoading] = useState(() => !isSteadyRegistered());
  const [pollingSeed, setPollingSeed] = useState(0);
  const flowVersion = useSyncExternalStore(
    ctiFlowState.subscribe,
    ctiFlowState.getVersion,
  );

  // Another CTI control (header or bottom bar) may have finished the flow.
  useEffect(() => {
    if (isSteadyRegistered()) {
      setStatusCTI(current =>
        current.status === statusCodes.SUCCESS
          ? current
          : {
              status: statusCodes.SUCCESS,
              message: CTI_REGISTRATION_SUCCESS_STATUS_MESSAGE,
            },
      );
    }
  }, [flowVersion]);

  const deviceFlowActive =
    Boolean(ctiFlowState.getDeviceCode()) &&
    !ctiFlowState.isRegistrationComplete();
  const modalOpen = ctiFlowState.isModalOpen();

  const fetchStatus = useCallback(async (options?: { silent?: boolean }) => {
    ctiFlowState.markStatusFetched();
    try {
      if (!options?.silent) {
        setLoading(true);
      }
      const response = await fetchCtiRegistrationStatus();
      setStatusCTI({
        status: response.statusCode,
        message: response.message,
      });
    } catch (error: unknown) {
      // A failed request never means "no longer registered", only a real
      // server response can change that.
      if (isSteadyRegistered()) {
        return;
      }
      const e = error as { statusCode?: number; message?: string };
      setStatusCTI({
        status: e.statusCode ?? statusCodes.NOT_FOUND,
        message: e.message ?? '',
      });
    } finally {
      if (!options?.silent) {
        setLoading(false);
        if (
          ctiFlowState.getDeviceCode() &&
          !ctiFlowState.isRegistrationComplete() &&
          !ctiFlowState.isRegistered()
        ) {
          setPollingSeed(s => s + 1);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (isStatusStillFresh(pollIntervalSec)) {
      return;
    }
    void fetchStatus();
  }, [fetchStatus, pollIntervalSec]);

  useEffect(() => {
    if (ctiFlowState.isRegistered()) {
      return undefined;
    }
    if (ctiFlowState.isRegistrationComplete()) {
      return undefined;
    }
    if (!ctiFlowState.getDeviceCode()) {
      return undefined;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const schedule = () => {
      const sec = ctiFlowState.getPollIntervalSec();
      timeoutId = setTimeout(async () => {
        if (cancelled) {
          return;
        }
        if (
          !ctiFlowState.getDeviceCode() ||
          ctiFlowState.isRegistrationComplete() ||
          ctiFlowState.isRegistered()
        ) {
          return;
        }
        await fetchStatus({ silent: true });
        if (cancelled) {
          return;
        }
        if (
          !ctiFlowState.getDeviceCode() ||
          ctiFlowState.isRegistrationComplete() ||
          ctiFlowState.isRegistered()
        ) {
          return;
        }
        schedule();
      }, sec * 1000);
    };

    schedule();
    return () => {
      cancelled = true;
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    };
  }, [deviceFlowNonce, pollingSeed, fetchStatus]);

  // Post-registration steady-state re-poll: independent of the device-flow
  // polling effect above (that one returns early exactly when this one runs
  // — registered or registration complete — so the two never overlap).
  useEffect(() => {
    if (
      !(ctiFlowState.isRegistered() || ctiFlowState.isRegistrationComplete())
    ) {
      return undefined;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const intervalMs = getStatusPollIntervalMs(pollIntervalSec);

    const schedule = (delayMs = intervalMs) => {
      timeoutId = setTimeout(async () => {
        if (cancelled) {
          return;
        }
        // Skip the network call while the tab is hidden, but keep the
        // timer ticking so polling resumes immediately once visible again
        // (reuses the existing visibilitychange listener below, no
        // duplicate listener needed).
        if (typeof document === 'undefined' || !document.hidden) {
          await fetchStatus({ silent: true });
          if (cancelled) {
            return;
          }
        }
        schedule();
      }, delayMs);
    };

    // Anchor the FIRST tick to the time remaining since the last fetch
    // (tracked on ctiFlowState, which survives a remount) so re-entering
    // the tab doesn't reset the cadence back to a full fresh interval —
    // subsequent ticks always use the full interval.
    const last = ctiFlowState.getLastStatusFetchAtMs();
    const initialDelayMs =
      last !== null
        ? Math.max(0, intervalMs - (Date.now() - last))
        : intervalMs;
    schedule(initialDelayMs);
    return () => {
      cancelled = true;
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    };
    // statusCTI.status is included so this effect re-evaluates once the
    // initial (async) hydration resolves and flips ctiFlowState to
    // registered — ctiFlowState itself is a plain module singleton, not
    // React state, so nothing else here would otherwise re-run this effect
    // when hydration completes after mount.
  }, [pollIntervalSec, fetchStatus, pollingSeed, statusCTI.status]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }
    const onPageBack = () => {
      if (document.visibilityState !== 'visible') {
        return;
      }
      const hasActiveDeviceFlow =
        Boolean(ctiFlowState.getDeviceCode()) &&
        !ctiFlowState.isRegistrationComplete() &&
        !ctiFlowState.isRegistered();
      const isCurrentlyRegistered = isSteadyRegistered();
      if (!hasActiveDeviceFlow && !isCurrentlyRegistered) {
        return;
      }
      if (!hasActiveDeviceFlow && isCurrentlyRegistered) {
        // Steady state. With `refreshOnFocus`, coming back reads the status unless
        // it was read moments ago; otherwise the scheduled re-poll drives the
        // cadence instead of re-fetching on every return.
        const recentlyRead = refreshOnFocus
          ? wasFetchedWithin(CTI_FOCUS_REFRESH_MIN_MS)
          : isStatusStillFresh(pollIntervalSec);
        if (recentlyRead) {
          return;
        }
      }
      void fetchStatus({ silent: true });
    };
    document.addEventListener('visibilitychange', onPageBack);
    // Returning from another window leaves the tab visible: only `focus` tells.
    if (refreshOnFocus) {
      window.addEventListener('focus', onPageBack);
    }
    return () => {
      document.removeEventListener('visibilitychange', onPageBack);
      if (refreshOnFocus) {
        window.removeEventListener('focus', onPageBack);
      }
    };
  }, [fetchStatus, pollIntervalSec, refreshOnFocus]);

  return {
    statusCTI,
    loading,
    deviceFlowActive,
    modalOpen,
    refetchStatus: fetchStatus,
  };
};
