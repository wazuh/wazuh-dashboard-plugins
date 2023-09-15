import { IRouter } from 'opensearch-dashboards/server';
import { schema } from '@osd/config-schema';

import { routes, SAVED_OBJECT_UPDATES } from '../../common';
import { getSavedObject } from '../services';
import { getUpdates } from '../services';
import { AvailableUpdates } from '../../common/types';

export const updatesRoutes = (router: IRouter) => {
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

        if (request.query.checkAvailableUpdates === 'true') await getUpdates();

        const result = (await getSavedObject(SAVED_OBJECT_UPDATES)) as AvailableUpdates;

        return response.ok({
          body: {
            ...defaultValues,
            ...result,
          },
        });
      } catch (error) {
        return response.customError({
          statusCode: 503,
          // body: {
          //   error: 'message',
          // },
        });
      }
    }
  );
};
