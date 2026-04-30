import { IRouter } from 'opensearch-dashboards/server';
import { schema } from '@osd/config-schema';
import { getWazuhCheckUpdatesServices } from '../../plugin-services';
import {
  CtiConfigurationError,
  getCtiToken,
  pollCtiToken,
  postContentManagerSubscription,
  resolveCtiOAuthClientId,
} from '../../services/cti-registration';
import {
  CtiRegistrationStore,
  parseDeviceAuthorizationForStore,
} from '../../services/cti-registration/cti-registration-store';
import {
  routes,
  CTI_OAUTH_DEVICE_GRANT_TYPE,
  CTI_REGISTRATION_COMPLETED_BODY,
} from '../../../common/constants';

function isSuccessfulUpstreamDevicePoll(
  body: Record<string, unknown>,
): boolean {
  return (
    typeof body.access_token === 'string' && body.access_token.length > 0
  );
}

export const getCtiTokenRoute = (router: IRouter) => {
  router.post(
    {
      path: routes.token,
      validate: {
        body: schema.object({
          client_id: schema.maybe(schema.string()),
          grant_type: schema.maybe(schema.string()),
          device_code: schema.maybe(schema.string()),
        }),
      },
    },
    async (_context, request, response) => {
      try {
        const { client_id, grant_type, device_code } = request.body;

        const hasPoll = Boolean(grant_type && device_code);
        if ((grant_type && !device_code) || (!grant_type && device_code)) {
          return response.badRequest({
            body: {
              message:
                'Both grant_type and device_code are required for token polling.',
            },
          });
        }
        if (hasPoll && grant_type !== CTI_OAUTH_DEVICE_GRANT_TYPE) {
          return response.badRequest({
            body: { message: 'Unsupported grant_type for CTI device flow.' },
          });
        }

        const clientId = await resolveCtiOAuthClientId(client_id);

        if (hasPoll) {
          const store = CtiRegistrationStore.getInstance();
          const pollBody = (await pollCtiToken(
            clientId,
            device_code,
          )) as Record<string, unknown>;

          if (isSuccessfulUpstreamDevicePoll(pollBody)) {
            const accessToken = pollBody.access_token as string;
            try {
              await postContentManagerSubscription(accessToken);
            } catch {
              store.clear(clientId);
              return response.customError({
                statusCode: 503,
                body: new Error(
                  'Registration could not be completed on this server.',
                ),
              });
            }
            store.setRegistrationComplete(clientId);
            return response.ok({ body: CTI_REGISTRATION_COMPLETED_BODY });
          }

          const err =
            typeof pollBody.error === 'string' ? pollBody.error : undefined;
          if (err === 'slow_down') {
            store.applySlowDown(clientId);
          } else if (err === 'authorization_pending') {
            /* keep in-memory registration state */
          } else if (err) {
            store.clear(clientId);
          }

          return response.ok({ body: pollBody });
        }

        const tokenResponse = await getCtiToken(clientId);

        try {
          const parsed = parseDeviceAuthorizationForStore(tokenResponse);
          CtiRegistrationStore.getInstance().setInProgress(clientId, parsed);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          getWazuhCheckUpdatesServices().logger.warn(
            `CTI registration store not updated: ${msg}`,
          );
        }

        return response.ok({
          body: tokenResponse,
        });
      } catch (error) {
        const finalError =
          error instanceof Error
            ? error
            : typeof error === 'string'
            ? new Error(error)
            : new Error(`Error requesting CTI token`);

        const axiosStatus =
          error &&
          typeof error === 'object' &&
          'response' in error &&
          typeof (error as { response?: { status?: number } }).response?.status ===
            'number'
            ? (error as { response: { status: number } }).response.status
            : undefined;

        const statusCode =
          error instanceof CtiConfigurationError
            ? 500
            : axiosStatus ?? (error as { statusCode?: number })?.statusCode ?? 503;

        return response.customError({
          statusCode,
          body: finalError,
        });
      }
    },
  );
};
