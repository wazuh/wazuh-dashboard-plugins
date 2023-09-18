import { IRouter } from 'opensearch-dashboards/server';
import { schema } from '@osd/config-schema';
import { routes } from '../../../common';
import { updateUserPreferences } from '../../services/userPreferences';

export const updatePreferencesRoutes = (router: IRouter) => {
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
        const message =
          error instanceof Error
            ? error
            : typeof error === 'string'
            ? error
            : 'Error trying to update user preferences';

        return response.customError({
          statusCode: 503,
          body: {
            message,
          },
        });
      }
    }
  );
};
