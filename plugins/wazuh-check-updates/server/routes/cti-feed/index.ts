import { IRouter } from 'opensearch-dashboards/server';
import { getCtiFeedContentUpdateRoute } from './content-update';
import { getCtiFeedIndicatorsRoute } from './indicators';
import { getIndicatorCatalogRoutes } from './indicator-catalog';
import { getVulnerabilityCatalogRoutes } from './vulnerability-catalog';

export function ctiFeedRoutes(router: IRouter) {
  getCtiFeedContentUpdateRoute(router);
  getCtiFeedIndicatorsRoute(router);
  getIndicatorCatalogRoutes(router);
  getVulnerabilityCatalogRoutes(router);
}
