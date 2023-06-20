import { IRouter } from 'kibana/server';
import { WazuhApiRoutes } from './wazuh-api';
import { WazuhElasticRoutes } from "./wazuh-elastic";
import { WazuhHostsRoutes } from "./wazuh-hosts";
import { WazuhUtilsRoutes, UiLogsRoutes } from './wazuh-utils'
import { WazuhReportingRoutes } from "./wazuh-reporting";

export const setupRoutes = (router: IRouter) => {
    WazuhApiRoutes(router);
    WazuhElasticRoutes(router);
    WazuhHostsRoutes(router);
    WazuhUtilsRoutes(router);
    WazuhReportingRoutes(router);
    UiLogsRoutes(router);
};
