import { OpendistroFactory, XpackFactory, DefaultFactory } from './factories';
import { OpenSearchDashboardsRequest, RequestHandlerContext } from 'src/core/server';
import { PluginSetup } from '../../types';

type CurrentUser = {
  username?: string;
  authContext: { [key: string]: any };
};

export interface ISecurityFactory {
  platform?: string;
  getCurrentUser(request: OpenSearchDashboardsRequest, context?: RequestHandlerContext): Promise<CurrentUser>;
}

export async function SecurityObj(
  { security, securityDashboards }: PluginSetup,
  context?: RequestHandlerContext
): Promise<ISecurityFactory> {
  const params = {
    path: `/_security/user`,
    method: 'GET',
  };
  if (!!security) {
    try {
      const responseCurl = await context.core.opensearch.client.asInternalUser.transport.request(
        params
      );
      return new XpackFactory(security);
    } catch (error) {
      return new DefaultFactory();
    }
  } else {
    return !!securityDashboards
      ? new OpendistroFactory(securityDashboards)
      : new DefaultFactory();
  }
}
