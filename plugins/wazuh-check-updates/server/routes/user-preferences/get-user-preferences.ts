import { IRouter } from 'opensearch-dashboards/server';
import { routes } from '../../../common/constants';
import { getUserPreferences } from '../../services/user-preferences';

export const getUserPreferencesRoutes = (router: IRouter) => {
  router.get(
    {
      path: routes.userPreferences,
      validate: false,
    },
    async (context, request, response) => {
      try {
        const user = await context['wazuh_check_updates'].security.getCurrentUser(request, context);

        if (!user?.username) {
          return response.customError({
            statusCode: 503,
            body: new Error('Error trying to get username'),
          });
        }

        const userPreferences = await getUserPreferences(user.username);

        return response.ok({
          body: userPreferences,
        });
      } catch (error) {
        const finalError =
          error instanceof Error
            ? error
            : typeof error === 'string'
            ? new Error(error)
            : new Error('Error trying to get user preferences');

        return response.customError({
          statusCode: 503,
          body: finalError,
        });
      }
    }
  );
};
