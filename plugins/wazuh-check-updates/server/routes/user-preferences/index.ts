import { IRouter } from 'opensearch-dashboards/server';
import { getUserPreferencesRoutes } from './get-user-preferences';
import { updatePreferencesRoutes } from './update-user-preferences';

export function userPreferencesRoutes(router: IRouter) {
  getUserPreferencesRoutes(router);
  updatePreferencesRoutes(router);
}
