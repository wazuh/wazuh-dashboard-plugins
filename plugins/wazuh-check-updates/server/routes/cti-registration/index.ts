import { IRouter } from 'opensearch-dashboards/server';
import { getCtiTokenRoute } from './token';
import { getCtiRegistrationStatusRoute } from './status';
import { getCtiConsumersRoute } from './consumers';

export function apiInfoRoutes(router: IRouter) {
  getCtiTokenRoute(router);
  getCtiRegistrationStatusRoute(router);
  getCtiConsumersRoute(router);
}
