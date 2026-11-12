import { IRouter } from 'opensearch_dashboards/server';
import { WazuhApiRoutes } from './wazuh-api';
import { WazuhElasticRoutes } from './wazuh-elastic';
import { WazuhHostsRoutes } from './wazuh-hosts';
import { UiLogsRoutes } from './wazuh-utils';
import { CtiExplorerRoutes } from './cti-explorer';

export const setupRoutes = (router: IRouter, services) => {
  WazuhApiRoutes(router, services);
  WazuhElasticRoutes(router, services);
  WazuhHostsRoutes(router, services);
  UiLogsRoutes(router, services);
  CtiExplorerRoutes(router);
};
