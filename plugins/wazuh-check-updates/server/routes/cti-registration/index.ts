import { IRouter } from 'opensearch-dashboards/server';
import { getCtiTokenRoute } from './token';

export function apiInfoRoutes(router: IRouter) {
  getCtiTokenRoute(router);
}
