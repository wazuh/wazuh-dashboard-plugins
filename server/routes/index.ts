import { IRouter } from 'kibana/server';
import { WazuhApiRoutes } from './wazuh-api';
import { WazuhElasticRouter } from "./wazuh-elastic";
import { WazuhHostsRoutes } from "./wazuh-hosts";
import { WazuhUtilsRoutes } from "./wazuh-utils";
import { ISecurityFactory } from '../lib/security-factory';

export const setupRoutes = (router: IRouter, securityObj: ISecurityFactory) => {
    WazuhApiRoutes(router, securityObj);
    WazuhElasticRouter(router);
    WazuhHostsRoutes(router);
    WazuhUtilsRoutes(router);
};
