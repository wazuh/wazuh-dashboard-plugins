import { IRouter } from 'opensearch-dashboards/server';
import { schema } from '@osd/config-schema';
import {
  CtiConfigurationError,
  getCtiToken,
  pollCtiToken,
  resolveCtiOAuthClientId,
} from '../../services/cti-registration';
import { routes, CTI_OAUTH_DEVICE_GRANT_TYPE } from '../../../common/constants';

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

        if (hasPoll) {
          const clientId = await resolveCtiOAuthClientId(client_id);
          const pollBody = await pollCtiToken(clientId, device_code);
          return response.ok({ body: pollBody });
        }

        const clientId = await resolveCtiOAuthClientId(client_id);
        const tokenResponse = await getCtiToken(clientId);

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
