import { IRouter } from 'opensearch-dashboards/server';
import { schema } from '@osd/config-schema';
import {
  getCtiToken,
  resolveCtiOAuthClientId,
} from '../../services/cti-registration';
import { routes } from '../../../common/constants';

export const getCtiTokenRoute = (router: IRouter) => {
  router.post(
    {
      path: routes.token,
      validate: {
        body: schema.object({
          client_id: schema.maybe(schema.string()),
        }),
      },
    },
    async (_context, request, response) => {
      try {
        const clientId = resolveCtiOAuthClientId(request.body.client_id);

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

        return response.customError({
          statusCode: error.statusCode || 503,
          body: finalError,
        });
      }
    },
  );
};
