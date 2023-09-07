import { IRouter } from 'opensearch-dashboards/server';
import { schema } from '@osd/config-schema';

import { routes, SAVED_OBJECT_UPDATES } from '../../common';
import { getSavedObject } from '../services';
import { getUpdates, updateUserPreferences } from '../services';
import { AvailableUpdates } from '../../common/types';

export function defineRoutes(router: IRouter) {
  /********** UPDATES ROUTES **********/
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
            availableUpdates: {
              ...defaultValues,
              ...result,
            },
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

  /********** USER PREFERENCES ROUTES **********/

  router.patch(
    {
      path: `${routes.userPreferences}/:userId`,
      validate: {
        params: schema.object({
          userId: schema.string(),
        }),
        body: schema.object({
          last_dismissed_update: schema.maybe(schema.string()),
          hide_update_notifications: schema.maybe(schema.boolean()),
        }),
      },
      options: {
        body: {
          parse: true,
        },
      },
    },
    async (context, { params, body }, response) => {
      try {
        const { userId } = params;
        const userPreferences = await updateUserPreferences(userId, body);

        return response.ok({
          body: userPreferences,
        });
      } catch (error) {
        return response.customError({
          statusCode: 503,
          // body: {
          //   error,
          // },
        });
      }
    }
  );
}
