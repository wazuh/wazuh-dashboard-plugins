/* eslint-disable camelcase -- saved object and status API fields use snake_case */
import { SAVED_OBJECT_CTI_REGISTRATION_HISTORY } from '../../../common/constants';
import type {
  CtiRegistrationLost,
  CtiSubscriptionSnapshot,
} from '../../../common/cti-registration-status-api';
import type { CtiRegistrationHistory } from '../../../common/types';
import { getSavedObject, setSavedObject } from '../saved-object';

/**
 * Next history record after one subscription read, or `null` when nothing changes.
 * The dashboard never unregisters by itself, so registered → unregistered is a loss.
 */
export function nextRegistrationHistory(
  prev: CtiRegistrationHistory,
  subscription: CtiSubscriptionSnapshot,
  now: string,
): CtiRegistrationHistory | null {
  const { message } = subscription;
  // An unknown status (e.g. a 502, CTI Console unreachable) says nothing about the registration.
  if (message === null) {
    return null;
  }

  if (message.is_registered) {
    const plan = message.plan?.name ?? '';
    if (prev.last_plan === plan && !prev.lost_at) {
      return null;
    }
    return {
      last_plan: plan,
      last_registered_at: now,
      lost_at: null,
      lost_plan: null,
    };
  }

  if (prev.last_plan !== undefined && !prev.lost_at) {
    return { ...prev, lost_at: now, lost_plan: prev.last_plan };
  }
  return null;
}

export function toRegistrationLost(
  history: CtiRegistrationHistory,
): CtiRegistrationLost | undefined {
  return history.lost_at
    ? { detected_at: history.lost_at, last_plan: history.lost_plan ?? '' }
    : undefined;
}

const cache = new Map<string, CtiRegistrationHistory>();

/** Test-only: forget cached records. */
export function resetRegistrationHistoryCacheForTests(): void {
  cache.clear();
}

const readHistory = async (
  environmentUuid: string,
): Promise<CtiRegistrationHistory> =>
  (await getSavedObject(
    SAVED_OBJECT_CTI_REGISTRATION_HISTORY,
    environmentUuid,
  )) as CtiRegistrationHistory;

/**
 * Records one subscription read and returns the registration loss to report, if any.
 * Steady reads hit the in-memory cache; a transition re-reads the saved object first so
 * another dashboard node's earlier write wins.
 */
export async function observeCtiRegistration(
  environmentUuid: string,
  subscription: CtiSubscriptionSnapshot,
): Promise<CtiRegistrationLost | undefined> {
  const now = new Date().toISOString();
  let prev = cache.get(environmentUuid);
  if (!prev || nextRegistrationHistory(prev, subscription, now)) {
    prev = await readHistory(environmentUuid);
  }

  const next = nextRegistrationHistory(prev, subscription, now);
  if (next) {
    await setSavedObject(
      SAVED_OBJECT_CTI_REGISTRATION_HISTORY,
      next,
      environmentUuid,
    );
  }
  const current = next ?? prev;
  cache.set(environmentUuid, current);
  return toRegistrationLost(current);
}
