import { IRouter } from 'opensearch-dashboards/server';
import { updatesRoutes } from './updates';
import { userPreferencesRoutes } from './user-preferences';
import { apiInfoRoutes } from './cti-subscription';

export function defineRoutes(router: IRouter) {
  updatesRoutes(router);
  userPreferencesRoutes(router);
  apiInfoRoutes(router);
}
