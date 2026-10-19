import { IRouter } from 'opensearch-dashboards/server';
import { getCtiFeedContentUpdateRoute } from './content-update';
import { getCtiFeedIndicatorsRoute } from './indicators';

export function ctiFeedRoutes(router: IRouter) {
  getCtiFeedContentUpdateRoute(router);
  getCtiFeedIndicatorsRoute(router);
}
