import { IRouter } from 'opensearch-dashboards/server';
import { getUserPreferencesRoutes } from './get-user-preferences';
import { updateUserPreferencesRoutes } from './update-user-preferences';

export function userPreferencesRoutes(router: IRouter) {
  getUserPreferencesRoutes(router);
  updateUserPreferencesRoutes(router);
}
