import { IRouter } from 'opensearch-dashboards/server';
import { updatesRoutes } from './updates';
import { userPreferencesRoutes } from './user-preferences';
import { apiInfoRoutes } from './cti-registration';
import { ctiFeedRoutes } from './cti-feed';

export function defineRoutes(router: IRouter) {
  updatesRoutes(router);
  userPreferencesRoutes(router);
  apiInfoRoutes(router);
  ctiFeedRoutes(router);
}
