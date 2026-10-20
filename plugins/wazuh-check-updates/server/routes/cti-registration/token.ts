import { IRouter, RequestHandlerContext } from 'opensearch-dashboards/server';
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
  return typeof body.access_token === 'string' && body.access_token.length > 0;
}

type DevicePollOutcome =
  | { kind: 'ok'; body: Record<string, unknown> }
  | { kind: 'subscriptionFailed' };

/**
 * Device-code polls in flight, keyed by environment and device code. The CTI
 * console redeems a device code once: a second poll racing the one that
 * redeemed it gets `not_found`, which would otherwise read as a failed
 * registration. Concurrent polls for the same code share one exchange instead.
 */
const devicePollsInFlight = new Map<string, Promise<DevicePollOutcome>>();

async function exchangeDeviceCode(
  context: RequestHandlerContext,
  clientId: string,
  deviceCode: string,
): Promise<DevicePollOutcome> {
  const store = CtiRegistrationStore.getInstance();

  // An earlier poll already redeemed the code and completed the registration.
  if (store.getStatus(clientId)?.registrationComplete) {
    return { kind: 'ok', body: { ...CTI_REGISTRATION_COMPLETED_BODY } };
  }

  const pollBody = (await pollCtiToken(clientId, deviceCode)) as Record<
    string,
    unknown
  >;

  if (isSuccessfulUpstreamDevicePoll(pollBody)) {
    const accessToken = pollBody.access_token as string;
    try {
      const wazuhClient = context.core.opensearch.client;
      await postContentManagerSubscription(wazuhClient, accessToken);
    } catch {
      store.clear(clientId);
      return { kind: 'subscriptionFailed' };
    }
    store.setRegistrationComplete(clientId);
    return { kind: 'ok', body: { ...CTI_REGISTRATION_COMPLETED_BODY } };
  }

  const err = typeof pollBody.error === 'string' ? pollBody.error : undefined;
  if (err === 'slow_down') {
    store.applySlowDown(clientId);
  } else if (err === 'authorization_pending') {
    /* keep in-memory registration state */
  } else if (err) {
    // Never drop a registration another request completed meanwhile.
    if (store.getStatus(clientId)?.registrationComplete) {
      return { kind: 'ok', body: { ...CTI_REGISTRATION_COMPLETED_BODY } };
    }
    store.clear(clientId);
  }

  return { kind: 'ok', body: pollBody };
}

function exchangeDeviceCodeOnce(
  context: RequestHandlerContext,
  clientId: string,
  deviceCode: string,
): Promise<DevicePollOutcome> {
  const key = `${clientId}:${deviceCode}`;
  const inFlight = devicePollsInFlight.get(key);
  if (inFlight) {
    return inFlight;
  }
  const poll = exchangeDeviceCode(context, clientId, deviceCode).finally(() =>
    devicePollsInFlight.delete(key),
  );
  devicePollsInFlight.set(key, poll);
  return poll;
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
    async (context, request, response) => {
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
          const outcome = await exchangeDeviceCodeOnce(
            context,
            clientId,
            // eslint-disable-next-line camelcase -- OAuth field name
            device_code as string,
          );
          if (outcome.kind === 'subscriptionFailed') {
            return response.customError({
              statusCode: 503,
              body: new Error(
                'Registration could not be completed on this server.',
              ),
            });
          }
          return response.ok({ body: outcome.body });
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
          typeof (error as { response?: { status?: number } }).response
            ?.status === 'number'
            ? (error as { response: { status: number } }).response.status
            : undefined;

        const statusCode =
          error instanceof CtiConfigurationError
            ? 500
            : axiosStatus ??
              (error as { statusCode?: number })?.statusCode ??
              503;

        return response.customError({
          statusCode,
          body: finalError,
        });
      }
    },
  );

  // Cancels a pending device-flow activation so a new one can be started.
  // A completed registration is never cleared here.
  router.delete(
    {
      path: routes.token,
      validate: {},
    },
    async (_context, _request, response) => {
      try {
        const clientId = await resolveCtiOAuthClientId(undefined);
        const store = CtiRegistrationStore.getInstance();
        const rec = store.getStatus(clientId);
        if (rec && !rec.registrationComplete) {
          store.clear(clientId);
        }
        return response.ok({ body: { success: true } });
      } catch (error) {
        return response.customError({
          statusCode: error instanceof CtiConfigurationError ? 500 : 503,
          body:
            error instanceof Error
              ? error
              : new Error('Error cancelling CTI registration'),
        });
      }
    },
  );
};
