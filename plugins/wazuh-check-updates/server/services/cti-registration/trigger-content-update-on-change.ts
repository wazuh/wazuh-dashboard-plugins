import { IScopedClusterClient } from 'opensearch-dashboards/server';
import { contentManagerRoutes } from '../../../common/constants';
import type {
  CtiContentUpdateOutcome,
  CtiSubscriptionSnapshot,
} from '../../../common/cti-registration-status-api';
import { getWazuhCheckUpdatesServices } from '../../plugin-services';
import {
  CtiRegistrationStore,
  SubscriptionSnapshot,
} from './cti-registration-store';

export type { CtiContentUpdateOutcome };

function toSnapshot(
  subscription: CtiSubscriptionSnapshot,
): SubscriptionSnapshot {
  return {
    isRegistered: Boolean(subscription.message?.is_registered),
    planName: subscription.message?.plan?.name ?? '',
  };
}

function hasChanged(
  prior: SubscriptionSnapshot,
  next: SubscriptionSnapshot,
): boolean {
  return (
    prior.isRegistered !== next.isRegistered ||
    prior.planName !== next.planName
  );
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

  if (!priorSnapshot) {
    store.setSubscriptionSnapshot(environmentUuid, nextSnapshot);
    return { triggered: false, failed: false };
  }

  const changed = hasChanged(priorSnapshot, nextSnapshot);
  const shouldFire = changed && nextSnapshot.isRegistered === true;

  if (!shouldFire) {
    store.setSubscriptionSnapshot(environmentUuid, nextSnapshot);
    return { triggered: false, failed: false };
  }

  if (!store.tryAcquireUpdateLock(environmentUuid)) {
    store.setSubscriptionSnapshot(environmentUuid, nextSnapshot);
    return { triggered: false, failed: false };
  }

  try {
    await wazuhClient.asCurrentUser.transport.request({
      method: 'POST',
      path: contentManagerRoutes.contentUpdate,
      body: {},
    });
    store.setSubscriptionSnapshot(environmentUuid, nextSnapshot);
    return { triggered: true, failed: false };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : 'Content Manager content update request failed';

    const { logger } = getWazuhCheckUpdatesServices();
    logger.error(
      `Content update trigger failed for environment ${environmentUuid}: ${message}`,
    );

    store.setSubscriptionSnapshot(environmentUuid, nextSnapshot);
    return { triggered: true, failed: true };
  } finally {
    store.releaseUpdateLock(environmentUuid);
  }
}
