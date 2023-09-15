import { IRouter } from 'opensearch-dashboards/server';
import { updatesRoutes } from './updates';
import { userPreferencesRoutes } from './userPreferences';

export function defineRoutes(router: IRouter) {
  updatesRoutes(router);
  userPreferencesRoutes(router);
}
