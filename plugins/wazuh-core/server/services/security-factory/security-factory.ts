import {
  OpenSearchDashboardsSecurityFactory,
  DefaultFactory,
} from './factories';
import {
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
} from 'src/core/server';
import { PluginSetup } from '../../types';

type CurrentUser = {
  username?: string;
  authContext: { [key: string]: any };
};

export interface ISecurityFactory {
  platform?: string;
  getCurrentUser(
    request: OpenSearchDashboardsRequest,
    context?: RequestHandlerContext,
  ): Promise<CurrentUser>;
  isAdministratorUser(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
  ): Promise<void>;
}

export function createDashboardSecurity({
  securityDashboards,
}: PluginSetup): Promise<ISecurityFactory> {
  return !!securityDashboards
    ? new OpenSearchDashboardsSecurityFactory()
    : new DefaultFactory();
}
