import { IRouter, IScopedClusterClient } from 'opensearch-dashboards/server';
import { routes } from '../../../common/constants';
import type { CtiClearRegistrationApiBody } from '../../../common/cti-registration-status-api';
import {
  deleteContentManagerSubscription,
  evaluateCtiRegistrationPermission,
  getCtiSubscriptionStatus,
  resolveCtiOAuthClientId,
} from '../../services/cti-registration';
import { CtiConfigurationError } from '../../services/cti-registration/cti-console-url';
import { CtiRegistrationStore } from '../../services/cti-registration/cti-registration-store';
import { triggerContentUpdateOnChange } from '../../services/cti-registration/trigger-content-update-on-change';
import { getWazuhCheckUpdatesServices } from '../../plugin-services';

/** The plugin services are unavailable in some contexts; never fail on the logger. */
function logError(message: string): void {
  try {
    getWazuhCheckUpdatesServices().logger.error(message);
  } catch {
    // Logger itself unavailable; nothing more we can safely do here.
  }
}

/**
 * Records the subscription seen now, so the read after the removal is a registration
 * change and starts the content update that moves the indexer to the public catalogs.
 */
async function observeSubscription(
  wazuhClient: IScopedClusterClient,
  environmentUuid: string,
): Promise<void> {
  const subscription = await getCtiSubscriptionStatus(wazuhClient);
  await triggerContentUpdateOnChange(
    wazuhClient,
    environmentUuid,
    subscription,
  );
}

/**
 * Clears the registration stored in the indexer (its CTI access token). The CTI console
 * is not notified, so the environment stays registered there.
 *
 * Fails closed: 403 when the indexer denies the privilege to remove the subscription,
 * 503 when that privilege could not be checked.
 */
export const getCtiClearRegistrationRoute = (router: IRouter) => {
  router.delete(
    {
      path: routes.ctiRegistration,
      validate: {},
    },
    async (context, _request, response) => {
      const wazuhClient = context.core.opensearch.client;

      const permission = await evaluateCtiRegistrationPermission(
        wazuhClient,
        'clear',
      );
      if (!permission) {
        return response.customError({
          statusCode: 503,
          body: {
            message:
              'The privilege required to clear the local registration could not be checked.',
          },
        });
      }
      if (!permission.accessAllowed) {
        return response.forbidden({
          body: {
            message:
              'The current user lacks the privilege required to clear the local registration.',
          },
        });
      }

      let environmentUuid: string;
      try {
        environmentUuid = await resolveCtiOAuthClientId();
      } catch (error) {
        return response.customError({
          statusCode: error instanceof CtiConfigurationError ? 500 : 503,
          body: {
            message:
              error instanceof Error
                ? error.message
                : 'The environment identifier could not be resolved.',
          },
        });
      }

      await observeSubscription(wazuhClient, environmentUuid);

      try {
        await deleteContentManagerSubscription(wazuhClient);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'unknown error';
        logError(`The local CTI registration could not be cleared: ${message}`);
        const statusCode = (error as { meta?: { statusCode?: unknown } })?.meta
          ?.statusCode;
        return response.customError({
          statusCode:
            typeof statusCode === 'number' && statusCode >= 400
              ? statusCode
              : 502,
          body: {
            message: 'The indexer could not clear the local registration.',
          },
        });
      }

      // The finished device flow no longer applies; a new registration starts over.
      CtiRegistrationStore.getInstance().clear(environmentUuid);
      await observeSubscription(wazuhClient, environmentUuid);

      return response.ok<CtiClearRegistrationApiBody>({
        body: { cleared: true },
      });
    },
  );
};
