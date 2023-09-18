import { IRouter } from 'opensearch-dashboards/server';
import { getUserPreferencesRoutes } from './getUserPreferences';
import { updatePreferencesRoutes } from './userPreferences';

export function userPreferencesRoutes(router: IRouter) {
  getUserPreferencesRoutes(router);
  updatePreferencesRoutes(router);
}
