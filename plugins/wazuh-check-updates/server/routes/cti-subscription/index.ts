import { IRouter } from 'opensearch-dashboards/server';
import { getApiInfoRoute } from './get-api-info';

export function apiInfoRoutes(router: IRouter) {
  getApiInfoRoute(router);
}
