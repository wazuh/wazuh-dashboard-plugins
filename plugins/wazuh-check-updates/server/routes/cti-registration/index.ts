import { IRouter } from 'opensearch-dashboards/server';
import { getCtiTokenRoute } from './token';
import { getCtiRegistrationStatusRoute } from './status';

export function apiInfoRoutes(router: IRouter) {
  getCtiTokenRoute(router);
  getCtiRegistrationStatusRoute(router);
}
