import { OpendistroFactory, XpackFactory, DefaultFactory } from './factories';
import { KibanaRequest, RequestHandlerContext } from 'src/core/server';
import { PluginSetup } from '../../types';

type CurrentUser = {
  username?: string;
  authContext: { [key: string]: any };
};

export interface ISecurityFactory {
  platform?: string;
  getCurrentUser(request: KibanaRequest, context?: RequestHandlerContext): Promise<CurrentUser>;
}

export async function SecurityObj(
  { security, opendistroSecurityKibana }: PluginSetup,
  context?: RequestHandlerContext
): Promise<ISecurityFactory> {
  const params = {
    path: `/_security/user`,
    method: 'GET',
  };
  if (!!security) {
    try {
      const responseCurl = await context.core.elasticsearch.client.asInternalUser.transport.request(
        params
      );
      return new XpackFactory(security);
    } catch (error) {
      return new DefaultFactory();
    }
  } else {
    return !!opendistroSecurityKibana
      ? new OpendistroFactory(opendistroSecurityKibana)
      : new DefaultFactory();
  }
}
