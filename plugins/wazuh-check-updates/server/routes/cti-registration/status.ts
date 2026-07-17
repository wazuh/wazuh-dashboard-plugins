import { IRouter, IScopedClusterClient } from 'opensearch-dashboards/server';
import { routes } from '../../../common/constants';
import type { CtiRegistrationStatusApiBody } from '../../../common/cti-registration-status-api';
import {
  getCtiSubscriptionStatus,
  resolveCtiOAuthClientId,
} from '../../services/cti-registration';
import { CtiConfigurationError } from '../../services/cti-registration/cti-console-url';
import { CtiRegistrationStore } from '../../services/cti-registration/cti-registration-store';
import { triggerContentUpdateOnChange } from '../../services/cti-registration/trigger-content-update-on-change';
import { getWazuhCheckUpdatesServices } from '../../plugin-services';

type StatusWithoutSubscriptionFields = Omit<
  CtiRegistrationStatusApiBody,
  'subscription'
>;

async function withSubscriptionFields(
  wazuhClient: IScopedClusterClient,
  environmentUuid: string,
  base: StatusWithoutSubscriptionFields,
): Promise<CtiRegistrationStatusApiBody> {
  const subscription = await getCtiSubscriptionStatus(wazuhClient);
  triggerContentUpdateOnChange(
    wazuhClient,
    environmentUuid,
    subscription,
  ).catch(error => {
    try {
      getWazuhCheckUpdatesServices().logger.error(
        `Unexpected error triggering CTI content update for ${environmentUuid}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    } catch {
      // Logger itself unavailable; nothing more we can safely do here.
    }
  });

  return {
    ...base,
    subscription,
  };
}

export const getCtiRegistrationStatusRoute = (router: IRouter) => {
  router.get(
    {
      path: routes.ctiRegistrationStatus,
      validate: {},
    },
    async (context, _request, response) => {
      try {
        const environmentUuid = await resolveCtiOAuthClientId(undefined);
        const wazuhClient = context.core.opensearch.client;
        const store = CtiRegistrationStore.getInstance();
        const rec = store.getStatus(environmentUuid);

        if (!rec) {
          return response.ok({
            body: await withSubscriptionFields(wazuhClient, environmentUuid, {
              registrationComplete: false,
              inProgress: false,
            }),
          });
        }

        if (rec.registrationComplete) {
          const completedBody = await withSubscriptionFields(
            wazuhClient,
            environmentUuid,
            {
              registrationComplete: true,
              inProgress: false,
            },
          );
          if (!completedBody.subscription?.message?.is_registered) {
            store.clear(environmentUuid);
            return response.ok({
              body: { ...completedBody, registrationComplete: false },
            });
          }
          return response.ok({ body: completedBody });
        }

        if (Date.now() > rec.deviceAuthExpiresAtMs) {
          store.clear(environmentUuid);
          return response.ok({
            body: await withSubscriptionFields(wazuhClient, environmentUuid, {
              registrationComplete: false,
              inProgress: false,
            }),
          });
        }

        const expires_in_remaining_sec = Math.max(
          0,
          Math.floor((rec.deviceAuthExpiresAtMs - Date.now()) / 1000),
        );

        return response.ok({
          body: await withSubscriptionFields(wazuhClient, environmentUuid, {
            registrationComplete: false,
            inProgress: true,
            device_code: rec.device_code ?? undefined,
            user_code: rec.user_code,
            verification_uri: rec.verification_uri,
            verification_uri_complete: rec.verification_uri_complete,
            poll_interval_sec: rec.poll_interval_sec,
            expires_in_remaining_sec,
          }),
        });
      } catch (error) {
        const finalError =
          error instanceof Error
            ? error
            : typeof error === 'string'
            ? new Error(error)
            : new Error('Error reading CTI registration status');

        const statusCode =
          error instanceof CtiConfigurationError
            ? 500
            : (error as { statusCode?: number })?.statusCode ?? 503;

        return response.customError({
          statusCode,
          body: finalError,
        });
      }
    },
  );
};
