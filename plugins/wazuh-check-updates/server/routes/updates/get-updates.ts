import { IRouter } from 'opensearch-dashboards/server';
import { schema } from '@osd/config-schema';
import { routes, SAVED_OBJECT_UPDATES } from '../../../common/constants';
import { AvailableUpdates } from '../../../common/types';
import { getUpdates } from '../../services/updates';
import { getSavedObject } from '../../services/saved-object';

export const getUpdatesRoute = (router: IRouter) => {
  router.get(
    {
      path: routes.checkUpdates,
      validate: {
        query: schema.object({
          checkAvailableUpdates: schema.maybe(schema.string()),
        }),
      },
    },
    async (context, request, response) => {
      try {
        const defaultValues = {
          mayor: [],
          minor: [],
          patch: [],
        };

        if (request.query.checkAvailableUpdates === 'true') {
          const updates = await getUpdates();
          return response.ok({
            body: {
              ...defaultValues,
              ...updates,
            },
          });
        }

        const result = (await getSavedObject(SAVED_OBJECT_UPDATES)) as AvailableUpdates;

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
            : new Error('Error trying to get available updates');

        return response.customError({
          statusCode: 503,
          body: finalError,
        });
      }
    }
  );
};
