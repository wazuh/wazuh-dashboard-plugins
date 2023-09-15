import { IRouter } from 'opensearch-dashboards/server';
import { schema } from '@osd/config-schema';

import { routes } from '../../common';
import { getUserPreferences } from '../services';
import { updateUserPreferences } from '../services';

export const userPreferencesRoutes = (router: IRouter) => {
  router.get(
    {
      path: `${routes.userPreferences}/{userId}`,
      validate: {
        params: schema.object({
          userId: schema.string(),
        }),
      },
    },
    async (context, { params }, response) => {
      const { userId } = params;
      try {
        const userPreferences = await getUserPreferences(userId);

        return response.ok({
          body: userPreferences,
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

  router.patch(
    {
      path: `${routes.userPreferences}/{userId}`,
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
};
