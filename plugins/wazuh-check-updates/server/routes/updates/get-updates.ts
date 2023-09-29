import { IRouter } from 'opensearch-dashboards/server';
import { schema } from '@osd/config-schema';
import { routes, SAVED_OBJECT_UPDATES } from '../../../common/constants';
import { AvailableUpdates } from '../../../common/types';
import { getUpdates } from '../../services/updates';
import { getSavedObject } from '../../services/saved-object';

export const getUpdatesRoute = (router: IRouter) => {
  router.get(
    {
      path: `${routes.checkUpdates}/{apiId}`,
      validate: {
        params: schema.object({
          apiId: schema.string(),
        }),
        query: schema.object({
          checkAvailableUpdates: schema.maybe(schema.string()),
        }),
      },
    },
    async (context, { query, params }, response) => {
      const { apiId } = params;
      try {
        const defaultValues = {
          mayor: [],
          minor: [],
          patch: [],
        };

        if (query.checkAvailableUpdates === 'true') {
          const updates = await getUpdates(apiId);
          return response.ok({
            body: {
              ...defaultValues,
              ...updates,
            },
          });
        }

        const result = (await getSavedObject(SAVED_OBJECT_UPDATES, apiId)) as AvailableUpdates;

        return response.ok({
          body: {
            ...defaultValues,
            ...result,
          },
        });
      } catch (error) {
        const finalError =
          error instanceof Error
            ? error
            : typeof error === 'string'
            ? new Error(error)
            : new Error(`Error trying to get available updates for API ${apiId}`);

        return response.customError({
          statusCode: 503,
          body: finalError,
        });
      }
    }
  );
};
