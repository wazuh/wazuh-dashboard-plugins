import { IRouter } from 'opensearch_dashboards/server';
import { WazuhApiRoutes } from './wazuh-api';
import { WazuhElasticRoutes } from './wazuh-elastic';
import { WazuhHostsRoutes } from './wazuh-hosts';
import { WazuhUtilsRoutes, UiLogsRoutes } from './wazuh-utils';
import { WazuhReportingRoutes } from './wazuh-reporting';
import { WazuhCorePluginStart } from '../../../wazuh-core/server';
import { WazuhAssistantRoutes } from './wazuh-assistant-ai';

export const setupRoutes = (
  router: IRouter,
  services: WazuhCorePluginStart,
) => {
  WazuhAssistantRoutes(router, services);
  WazuhApiRoutes(router, services);
  WazuhElasticRoutes(router, services);
  WazuhHostsRoutes(router, services);
  WazuhUtilsRoutes(router, services);
  WazuhReportingRoutes(router, services);
  UiLogsRoutes(router, services);
};
