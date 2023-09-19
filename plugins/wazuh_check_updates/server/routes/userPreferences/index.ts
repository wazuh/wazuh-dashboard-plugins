import { IRouter } from 'opensearch-dashboards/server';
import { getUserPreferencesRoutes } from './getUserPreferences';
import { updatePreferencesRoutes } from './updateUserPreferences';

export function userPreferencesRoutes(router: IRouter) {
  getUserPreferencesRoutes(router);
  updatePreferencesRoutes(router);
}
