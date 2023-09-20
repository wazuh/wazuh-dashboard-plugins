import { IRouter } from 'opensearch-dashboards/server';
import { getUpdatesRoute } from './get-updates';

export function updatesRoutes(router: IRouter) {
  getUpdatesRoute(router);
}
