import { IRouter } from 'opensearch-dashboards/server';
import { routes } from '../../../common';
import { getUserPreferences } from '../../services/userPreferences';

export const getUserPreferencesRoutes = (router: IRouter) => {
  router.get(
    {
      path: routes.userPreferences,
      validate: false,
    },
    async (context, request, response) => {
      try {
        const user = await context['wazuh_check_updates'].security.getCurrentUser(request, context);

        if (!user?.username)
          return response.customError({
            statusCode: 503,
            body: new Error('Error trying to get username'),
          });

        const userPreferences = await getUserPreferences(user.username);

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
