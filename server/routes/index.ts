import { IRouter } from 'kibana/server';
import { WazuhApiRoutes } from './wazuh-api';
import { ISecurityFactory } from '../lib/security-factory';

export const setupRoutes = (router: IRouter, securityObj: ISecurityFactory) => {
    WazuhApiRoutes(router, securityObj);
};