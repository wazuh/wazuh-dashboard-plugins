import { IRouter } from 'opensearch-dashboards/server';
import { schema } from '@osd/config-schema';
import { routes } from '../../../common';
import { getUserPreferences } from '../../services/userPreferences';

export const getUserPreferencesRoutes = (router: IRouter) => {
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
        const message =
          error instanceof Error
            ? error
            : typeof error === 'string'
            ? error
            : 'Error trying to get user preferences';

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
