import { IRouter } from 'opensearch-dashboards/server';
import { schema } from '@osd/config-schema';
import { routes } from '../../../common/constants';
import { getUpdates } from '../../services/updates';

export const getUpdatesRoute = (router: IRouter) => {
  router.get(
    {
      path: routes.checkUpdates,
      validate: {
        query: schema.object({
          query_api: schema.maybe(schema.string()),
        }),
      },
    },
    async (context, request, response) => {
      try {
        const updates = await getUpdates(
          request.query?.query_api === 'true',
          context.core.opensearch.client,
        );
        return response.ok({
          body: updates,
        });
      } catch (error) {
        const finalError =
          error instanceof Error
            ? error
            : typeof error === 'string'
            ? new Error(error)
            : new Error(`Error trying to get available updates`);

        return response.customError({
          statusCode: 503,
          body: finalError,
        });
      }
    },
  );
};
