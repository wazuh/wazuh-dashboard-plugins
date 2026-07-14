import { IScopedClusterClient } from 'opensearch-dashboards/server';
import { contentManagerRoutes } from '../../../common/constants';
import type { CtiSubscriptionSnapshot } from '../../../common/cti-registration-status-api';
import { getWazuhCheckUpdatesServices } from '../../plugin-services';
import {
  CtiRegistrationStore,
  SubscriptionSnapshot,
} from './cti-registration-store';

export type CtiContentUpdateReason =
  | 'none'
  | 'registration-changed'
  | 'plan-name-changed';

/** Outcome of a best-effort Content Manager update attempt for this poll cycle. */
export interface CtiContentUpdateOutcome {
  triggered: boolean;
  failed: boolean;
  reason?: CtiContentUpdateReason;
}

function toSnapshot(
  subscription: CtiSubscriptionSnapshot,
): SubscriptionSnapshot {
  return {
    isRegistered: Boolean(subscription.message?.is_registered),
    planName: subscription.message?.plan?.name ?? '',
  };
}

/**
 * Computes the discriminated reason for a subscription transition.
 * Precedence: a registration-state flip always wins over a coincident
 * plan-name diff, keeping the reason a single, unambiguous value.
 */
function getChangeReason(
  prior: SubscriptionSnapshot,
  next: SubscriptionSnapshot,
): CtiContentUpdateReason {
  const registrationFlipped = prior.isRegistered !== next.isRegistered;
  const planNameChanged = prior.planName !== next.planName;

  if (registrationFlipped) {
    return 'registration-changed';
  }
  if (planNameChanged) {
    return 'plan-name-changed';
  }
  return 'none';
}

/**
 * Server-side, edge-triggered detection of CTI subscription changes.
 * Fires the existing Content Manager `contentUpdate` action, best-effort,
 * whenever the subscription transitions INTO the registered state
 * (registration or plan change while registered). Never throws — errors
 * are caught, logged, and reported via the returned outcome.
 */
export async function triggerContentUpdateOnChange(
  wazuhClient: IScopedClusterClient,
  environmentUuid: string,
  subscription: CtiSubscriptionSnapshot,
): Promise<CtiContentUpdateOutcome> {
  const store = CtiRegistrationStore.getInstance();
  const priorSnapshot = store.getSubscriptionSnapshot(environmentUuid);
  const nextSnapshot = toSnapshot(subscription);

  // Persisted synchronously, before any `await`, so an overlapping poll
  // always diffs against the freshest observation and can never have its
  // snapshot clobbered by a slower call finishing later with stale data.
  store.setSubscriptionSnapshot(environmentUuid, nextSnapshot);

  if (!priorSnapshot) {
    return { triggered: false, failed: false, reason: 'none' };
  }

  const reason = getChangeReason(priorSnapshot, nextSnapshot);
  const shouldFire = reason !== 'none';

  if (!shouldFire) {
    return { triggered: false, failed: false, reason };
  }

  if (!store.tryAcquireUpdateLock(environmentUuid)) {
    return { triggered: false, failed: false, reason };
  }

  const { logger } = getWazuhCheckUpdatesServices();

  try {
    await wazuhClient.asCurrentUser.transport.request({
      method: 'POST',
      path: contentManagerRoutes.contentUpdate,
      body: {},
    });
    logger.info(
      `Content update triggered for environment ${environmentUuid} (reason: ${reason})`,
    );
    return { triggered: true, failed: false, reason };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : 'Content Manager content update request failed';

    logger.error(
      `Content update trigger failed for environment ${environmentUuid} (reason: ${reason}): ${message}`,
    );

    return { triggered: true, failed: true, reason };
  } finally {
    store.releaseUpdateLock(environmentUuid);
  }
}
