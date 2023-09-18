import { IRouter } from 'opensearch-dashboards/server';
import { getUpdatesRoute } from './updates';

export function updatesRoutes(router: IRouter) {
  getUpdatesRoute(router);
}
