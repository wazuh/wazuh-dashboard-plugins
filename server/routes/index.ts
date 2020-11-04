import { IRouter, ISavedObjectsRepository } from 'kibana/server';
import { WazuhApiRoutes } from './wazuh-api';

export const setupRoutes = (router: IRouter) => {
    WazuhApiRoutes(router);
};