import { IRouter } from 'opensearch-dashboards/server';
import { getCtiTokenRoute } from './token';
import { getCtiRegistrationStatusRoute } from './status';
import { getCtiConsumersRoute } from './consumers';
import { getCtiRegistrationPermissionRoute } from './permission';

export function apiInfoRoutes(router: IRouter) {
  getCtiTokenRoute(router);
  getCtiRegistrationStatusRoute(router);
  getCtiConsumersRoute(router);
  getCtiRegistrationPermissionRoute(router);
}
